import logging
from functools import lru_cache
from typing import Optional

from backend.app.core.config import get_settings
from backend.app.core.database import engine
from backend.app.graphs.feynman_graph import FeynmanGraph
from backend.app.models.auth import GUEST_USER_ID
from backend.app.models.feynman import (
    FeynmanChatData,
    FeynmanChatRequest,
    GreetingData,
    ResetSessionData,
    ResetSessionRequest,
    SessionDetailData,
    SessionDebugData,
    SessionSummaryData,
)
from backend.app.services.deepseek_client import DeepSeekClient
from backend.app.services.diagnostic_report_service import (
    DiagnosticReportFinalizer,
    NullReportFinalizer,
    ReportFinalizer,
)
from backend.app.services.kp_provider import DEFAULT_KP_ID, KnowledgePointProvider, kp_provider
from backend.app.services.mock_llm import MockLLMClient
from backend.app.services.rag_retriever import RAGRetriever, get_rag_retriever
from backend.app.services.session_store import (
    SQLSessionStore,
    SessionState,
    SessionStore,
)
from sqlalchemy.orm import Session
from backend.app.services.user_profile_service import UserProfileService
from backend.app.models.review_context import ReviewContext, TargetGap

logger = logging.getLogger(__name__)


class FeynmanService:
    def __init__(
        self,
        store: SessionStore,
        llm_client,
        fallback_client=None,
        knowledge_point_provider: Optional[KnowledgePointProvider] = None,
        rag_retriever: Optional[RAGRetriever] = None,
        report_finalizer: Optional[ReportFinalizer] = None,
        profile_provider=None,
        review_context_provider=None,
    ) -> None:
        self._store = store
        self._llm_client = llm_client
        self._fallback_client = fallback_client or MockLLMClient()
        self._kp_provider = knowledge_point_provider or kp_provider
        self._report_finalizer = report_finalizer or NullReportFinalizer()
        self._settings = get_settings()
        primary_provider_name = "deepseek" if isinstance(llm_client, DeepSeekClient) else "mock"
        self._graph = FeynmanGraph(
            llm_client=self._llm_client,
            fallback_client=self._fallback_client,
            kp_provider=self._kp_provider,
            max_follow_ups=self._settings.max_follow_ups,
            primary_provider_name=primary_provider_name,
            rag_retriever=rag_retriever or get_rag_retriever(),
            profile_provider=profile_provider,
            review_context_provider=review_context_provider,
        )

    async def chat(
        self,
        request: FeynmanChatRequest,
        user_id: str = GUEST_USER_ID,
    ) -> FeynmanChatData:
        print(f"📝 user_input: {request.user_input.strip()[:120]}")
        if not request.user_input.strip():
            raise ValueError("user_input cannot be empty")

        session = self._store.get_or_create(request.session_id, user_id)
        if session.ended and session.final_response is not None:
            self._finalize_report_safely(session, session.final_response)
            return session.final_response
        # 尝试获取用户画像（如果是游客 GUEST_USER_ID 则跳过）
        profile = None
        if user_id != GUEST_USER_ID:
            try:
                # 使用现有的 engine 开启一个简短的数据库会话
                with Session(engine) as db:
                    profile = UserProfileService.get_profile_by_user_id(db, user_id)
            except Exception as e:
                logger.warning(f"Failed to fetch user profile for {user_id}: {e}")

        # 将 profile 传给 graph.run
        response = await self._graph.run(request=request, session=session, profile=profile)
        self._store.save(session)
        self._finalize_report_safely(session, response)
        return response

    def _finalize_report_safely(
        self,
        session: SessionState,
        response: FeynmanChatData,
    ) -> None:
        try:
            self._report_finalizer.finalize(session, response)
        except Exception:
            logger.exception(
                "diagnostic report persistence failed for session %s",
                session.session_id,
            )

    def greeting(self, kp_id: Optional[str] = None, session_id: Optional[str] = None, user_id: str = GUEST_USER_ID) -> GreetingData:
        knowledge_point = self._kp_provider.get(kp_id or DEFAULT_KP_ID)
        if knowledge_point is None:
            raise ValueError("knowledge point not found")
        is_review = False
        review_focus = []
        reply_text = f"请你向我讲解一下{knowledge_point.name}的核心原理，讲得越详细越好。"

        # 如果传入了 session_id 且不是游客，尝试加载复习上下文
        if session_id and user_id != GUEST_USER_ID:
            from backend.app.services.review_context_service import safe_load_review_context
            # 从图实例中获取配置好的 provider
            provider = getattr(self._graph, "_review_context_provider", None)
            review_context = safe_load_review_context(provider, session_id, user_id)

            # 拼接greeting文本，提示用户进入复习模式
            if review_context:
                is_review = True
                review_focus = review_context.review_focus
                focus_str = "、".join(review_focus)
                reply_text = (
                    f"欢迎进入专项复习！上次我们在「{focus_str}」等维度上发现了一些需要强化的漏洞。 "
                    f"这次请再次向我讲解一下{knowledge_point.name}，我们来看看这些地方掌握得怎么样了。"
                )

        return GreetingData(
                reply_text=reply_text,
                kp_id=knowledge_point.kp_id,
                kp_name=knowledge_point.name,
                is_review=is_review,
                review_focus=review_focus,
            )

    def reset(
        self,
        request: ResetSessionRequest,
        user_id: str = GUEST_USER_ID,
    ) -> ResetSessionData:
        self._store.reset(request.session_id, user_id)
        return ResetSessionData(session_id=request.session_id, reset=True)

    def inspect_session(
        self,
        session_id: str,
        user_id: str = GUEST_USER_ID,
    ) -> SessionDebugData:
        session = self._store.get(session_id, user_id)
        if session is None:
            return SessionDebugData(session_id=session_id, exists=False)

        return SessionDebugData(
            session_id=session.session_id,
            exists=True,
            follow_up_count=session.follow_up_count,
            invalid_answer_count=session.invalid_answer_count,
            off_topic_count=session.off_topic_count,
            ended=session.ended,
            message_count=len(session.messages),
            last_provider=session.last_provider,
            fallback_used=session.fallback_used,
            kp_id=session.kp_id,
            kp_name=session.kp_name,
            material_id=session.material_id,
            chapter_id=session.chapter_id,
            recent_messages=session.messages[-6:],
        )

    def get_session_detail(
        self,
        session_id: str,
        user_id: str = GUEST_USER_ID,
    ) -> Optional[SessionDetailData]:
        session = self._store.get(session_id, user_id)
        if session is None:
            return None
        return SessionDetailData(
            session_id=session.session_id,
            kp_id=session.kp_id,
            kp_name=session.kp_name,
            material_id=session.material_id,
            chapter_id=session.chapter_id,
            chat_history=session.messages,
            report_data=session.final_response,
            created_at=session.created_at.isoformat(),
            updated_at=session.updated_at.isoformat(),
        )

    def list_sessions(
        self,
        user_id: str = GUEST_USER_ID,
    ) -> list[SessionSummaryData]:
        return [
            SessionSummaryData(
                session_id=item.session_id,
                kp_name=item.kp_name,
                material_title=item.material_title,
                created_at=item.created_at.isoformat(),
            )
            for item in self._store.list_by_user(user_id)
        ]

    def draw_graph_mermaid(self) -> str:
        return self._graph.draw_mermaid()


@lru_cache
def get_feynman_service() -> FeynmanService:
    settings = get_settings()
    if settings.llm_provider == "deepseek" and settings.deepseek_configured:
        llm_client = DeepSeekClient(settings)
    else:
        llm_client = MockLLMClient()
    return FeynmanService(
        store=SQLSessionStore(engine),
        llm_client=llm_client,
        fallback_client=MockLLMClient(),
        report_finalizer=DiagnosticReportFinalizer(engine),
        profile_provider=_load_profile_from_db,
        review_context_provider=TemporaryTestReviewContextProvider(),  # 注入测试Provider
    )


def _load_profile_from_db(user_id: str):
    """从数据库加载用户学情画像，供 graph 的 _load_context 节点调用。"""
    from sqlmodel import Session

    from backend.app.services.user_profile_service import UserProfileService

    with Session(engine) as db:
        return UserProfileService.get_profile_by_user_id(db, user_id)


class TemporaryTestReviewContextProvider:
    """临时测试用的 ReviewContextProvider，用于本地 Swagger 联调"""
    def load_review_context(self, session_id: str, user_id: str) -> Optional[ReviewContext]:
        # 如果你指定的测试 session_id 匹配，就返回模拟的复习上下文
        if session_id == "session-test-review":
            return ReviewContext(
                gap_id="gap-mock-001",
                kp_id="kp-1f4e7ef4",
                kp_name="Dijkstra算法",
                review_focus=["理解深度", "逻辑连贯性"],
                target_gap=TargetGap(
                    gap_id="gap-mock-001",
                    kp_id="kp-1f4e7ef4",
                    kp_name="Dijkstra算法",
                    weak_dimensions=["理解深度"],
                    gap_desc="未解释贪心选择为什么在边权非负时一定成立",
                    previous_scores={"理解深度": 4, "逻辑连贯性": 5}
                ),
                previous_report_summary="核心步骤正确，但缺少正确性直觉的数学解释。"
            )
        return None