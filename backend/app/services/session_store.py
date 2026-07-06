from dataclasses import dataclass, field
from typing import Dict, Optional

from backend.app.models.feynman import ChatMessage, FeynmanChatData


@dataclass
class SessionState:
    session_id: str
    follow_up_count: int = 0
    invalid_answer_count: int = 0
    off_topic_count: int = 0
    ended: bool = False
    last_provider: str = "none"
    fallback_used: bool = False
    messages: list[ChatMessage] = field(default_factory=list)
    final_response: Optional[FeynmanChatData] = None


class InMemorySessionStore:
    def __init__(self) -> None:
        self._sessions: Dict[str, SessionState] = {}

    def get_or_create(self, session_id: str) -> SessionState:
        if session_id not in self._sessions:
            self._sessions[session_id] = SessionState(session_id=session_id)
        return self._sessions[session_id]

    def get(self, session_id: str) -> Optional[SessionState]:
        return self._sessions.get(session_id)

    def reset(self, session_id: str) -> bool:
        existed = session_id in self._sessions
        self._sessions[session_id] = SessionState(session_id=session_id)
        return existed

    def count(self) -> int:
        return len(self._sessions)


session_store = InMemorySessionStore()
