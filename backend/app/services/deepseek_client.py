import json
from typing import Any, Sequence

import httpx

from backend.app.core.config import Settings
from backend.app.models.feynman import ChatMessage, FeynmanChatData
from backend.app.services.prompts import SYSTEM_PROMPT, build_user_prompt


class DeepSeekClient:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    async def evaluate(
        self,
        messages: Sequence[ChatMessage],
        user_input: str,
        follow_up_count: int,
        max_follow_ups: int,
    ) -> FeynmanChatData:
        if not self._settings.deepseek_configured:
            raise RuntimeError("DeepSeek API key is not configured.")

        payload = {
            "model": self._settings.deepseek_model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": build_user_prompt(
                        messages=messages,
                        user_input=user_input,
                        follow_up_count=follow_up_count,
                        max_follow_ups=max_follow_ups,
                    ),
                },
            ],
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
        }

        headers = {
            "Authorization": f"Bearer {self._settings.deepseek_api_key}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=self._settings.request_timeout_seconds) as client:
            response = await client.post(
                f"{self._settings.deepseek_base_url}/chat/completions",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

        content = data["choices"][0]["message"]["content"]
        parsed = _parse_json_object(content)
        return FeynmanChatData.model_validate(parsed)


def _parse_json_object(content: str) -> dict[str, Any]:
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        start = content.find("{")
        end = content.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise
        return json.loads(content[start : end + 1])
