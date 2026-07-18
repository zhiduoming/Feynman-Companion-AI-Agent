from functools import lru_cache
from typing import Optional

from backend.app.core.config import get_settings
from backend.app.graphs.feynman_graph import FeynmanGraph
from backend.app.models.feynman import (
    FeynmanChatData,
    FeynmanChatRequest,
    GreetingData,
    ResetSessionData,
    ResetSessionRequest,
    SessionDebugData,
)
from backend.app.services.deepseek_client import DeepSeekClient
from backend.app.services.kp_provider import DEFAULT_KP_ID, KnowledgePointProvider, kp_provider
from backend.app.services.mock_llm import MockLLMClient
from backend.app.services.session_store import InMemorySessionStore, session_store


class FeynmanService:
    def __init__(
        self,
        store: InMemorySessionStore,
        llm_client,
        fallback_client=None,
        knowledge_point_provider: Optional[KnowledgePointProvider] = None,
    ) -> None:
        self._store = store
        self._llm_client = llm_client
        self._fallback_client = fallback_client or MockLLMClient()
        self._kp_provider = knowledge_point_provider or kp_provider
        self._settings = get_settings()
        primary_provider_name = "deepseek" if isinstance(llm_client, DeepSeekClient) else "mock"
        self._graph = FeynmanGraph(
            llm_client=self._llm_client,
            fallback_client=self._fallback_client,
            kp_provider=self._kp_provider,
            max_follow_ups=self._settings.max_follow_ups,
            primary_provider_name=primary_provider_name,
        )

    async def chat(self, request: FeynmanChatRequest) -> FeynmanChatData:
        if not request.user_input.strip():
            raise ValueError("user_input cannot be empty")

        session = self._store.get_or_create(request.session_id)
        if session.ended and session.final_response is not None:
            return session.final_response
        return await self._graph.run(request=request, session=session)

    def greeting(self, kp_id: Optional[str] = None) -> GreetingData:
        knowledge_point = self._kp_provider.get(kp_id or DEFAULT_KP_ID)
        if knowledge_point is None:
            raise ValueError("knowledge point not found")
        return GreetingData(
            reply_text=(
                f"请你向我讲解一下{knowledge_point.name}的核心原理，"
                "讲得越详细越好。"
            ),
            kp_id=knowledge_point.kp_id,
            kp_name=knowledge_point.name,
        )

    def reset(self, request: ResetSessionRequest) -> ResetSessionData:
        self._store.reset(request.session_id)
        return ResetSessionData(session_id=request.session_id, reset=True)

    def inspect_session(self, session_id: str) -> SessionDebugData:
        session = self._store.get(session_id)
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

    def draw_graph_mermaid(self) -> str:
        return self._graph.draw_mermaid()


@lru_cache
def get_feynman_service() -> FeynmanService:
    settings = get_settings()
    if settings.llm_provider == "deepseek" and settings.deepseek_configured:
        llm_client = DeepSeekClient(settings)
    else:
        llm_client = MockLLMClient()
    return FeynmanService(store=session_store, llm_client=llm_client, fallback_client=MockLLMClient())
