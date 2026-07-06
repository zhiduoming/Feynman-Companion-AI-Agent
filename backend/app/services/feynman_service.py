from functools import lru_cache

from backend.app.core.config import get_settings
from backend.app.models.feynman import (
    ChatMessage,
    FeynmanChatData,
    FeynmanChatRequest,
    NextAction,
    ResetSessionData,
    ResetSessionRequest,
    SessionDebugData,
)
from backend.app.services.deepseek_client import DeepSeekClient
from backend.app.services.mock_llm import MockLLMClient
from backend.app.services.session_store import InMemorySessionStore, session_store


class FeynmanService:
    def __init__(self, store: InMemorySessionStore, llm_client, fallback_client=None) -> None:
        self._store = store
        self._llm_client = llm_client
        self._fallback_client = fallback_client or MockLLMClient()
        self._settings = get_settings()

    async def chat(self, request: FeynmanChatRequest) -> FeynmanChatData:
        user_input = request.user_input.strip()
        if not user_input:
            raise ValueError("user_input cannot be empty")

        session = self._store.get_or_create(request.session_id)
        if session.ended and session.final_response is not None:
            return session.final_response

        if _is_off_topic(user_input):
            session.off_topic_count += 1
            session.last_provider = "rule"
            session.fallback_used = False
            data = FeynmanChatData(
                next_action=NextAction.GUIDE_TOPIC,
                reply_text="这个问题先放一放，我们这轮只围绕 Dijkstra 算法。你可以先讲讲它解决什么问题。",
            )
            _append_turn(session.messages, user_input, data.reply_text)
            return data

        if _is_ineffective_answer(user_input):
            session.invalid_answer_count += 1
            session.last_provider = "rule"
            session.fallback_used = False
            if session.invalid_answer_count >= 2:
                reply = (
                    "没关系，先别硬背完整答案。你可以围绕三个关键词重新组织："
                    "适用前提、每轮选择规则、更新相邻节点距离。现在试着用自己的话讲一遍。"
                )
            else:
                reply = "可以先从最简单的问题说起：Dijkstra 算法主要是用来解决哪一类最短路径问题的？"
            data = FeynmanChatData(next_action=NextAction.FOLLOW_UP, reply_text=reply)
            _append_turn(session.messages, user_input, data.reply_text)
            return data

        if session.follow_up_count >= self._settings.max_follow_ups:
            data = await self._fallback_client.evaluate(
                messages=session.messages,
                user_input=user_input,
                follow_up_count=session.follow_up_count,
                max_follow_ups=self._settings.max_follow_ups,
            )
            session.last_provider = "mock"
            session.fallback_used = self._settings.llm_provider == "deepseek"
        else:
            data, provider, fallback_used = await self._evaluate_with_fallback(
                session.messages,
                user_input,
                session.follow_up_count,
            )
            session.last_provider = provider
            session.fallback_used = fallback_used

        data = _normalize_contract(data)
        if data.next_action == NextAction.FOLLOW_UP:
            session.follow_up_count += 1
        if data.next_action == NextAction.GENERATE_REPORT:
            session.ended = True
            session.final_response = data

        _append_turn(session.messages, user_input, data.reply_text)
        return data

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
            recent_messages=session.messages[-6:],
        )

    async def _evaluate_with_fallback(
        self,
        messages: list[ChatMessage],
        user_input: str,
        follow_up_count: int,
    ) -> tuple[FeynmanChatData, str, bool]:
        try:
            data = await self._llm_client.evaluate(
                messages=messages,
                user_input=user_input,
                follow_up_count=follow_up_count,
                max_follow_ups=self._settings.max_follow_ups,
            )
            provider = "deepseek" if isinstance(self._llm_client, DeepSeekClient) else "mock"
            return data, provider, False
        except Exception:
            data = await self._fallback_client.evaluate(
                messages=messages,
                user_input=user_input,
                follow_up_count=follow_up_count,
                max_follow_ups=self._settings.max_follow_ups,
            )
            return data, "mock", True


def _append_turn(messages: list[ChatMessage], user_input: str, assistant_reply: str) -> None:
    messages.append(ChatMessage(role="user", content=user_input))
    messages.append(ChatMessage(role="assistant", content=assistant_reply))


def _is_off_topic(text: str) -> bool:
    normalized = text.lower()
    topic_words = [
        "dijkstra",
        "迪杰斯特拉",
        "迪ijkstra",
        "最短路",
        "最短路径",
        "图",
        "节点",
        "边",
        "权",
        "松弛",
        "贪心",
    ]
    off_topic_words = ["天气", "吃饭", "电影", "游戏", "新闻", "股票", "旅游"]
    return any(word in normalized for word in off_topic_words) and not any(
        word in normalized for word in topic_words
    )


def _is_ineffective_answer(text: str) -> bool:
    normalized = text.strip().lower()
    ineffective = ["不知道", "不会", "不懂", "不清楚", "讲不出来", "不知道怎么讲", "no idea"]
    return normalized in ineffective or len(normalized) <= 2


def _normalize_contract(data: FeynmanChatData) -> FeynmanChatData:
    if data.next_action in {NextAction.FOLLOW_UP, NextAction.GUIDE_TOPIC}:
        data.card_preview = None
        data.final_report = None
    if data.next_action == NextAction.GENERATE_REPORT:
        if data.card_preview is None or data.final_report is None:
            raise ValueError("generate_report requires card_preview and final_report")
    return data


@lru_cache
def get_feynman_service() -> FeynmanService:
    settings = get_settings()
    if settings.llm_provider == "deepseek" and settings.deepseek_configured:
        llm_client = DeepSeekClient(settings)
    else:
        llm_client = MockLLMClient()
    return FeynmanService(store=session_store, llm_client=llm_client, fallback_client=MockLLMClient())
