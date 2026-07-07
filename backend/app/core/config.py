import os
from functools import lru_cache
from pathlib import Path
from typing import Dict, List

from pydantic import BaseModel


PROJECT_ROOT = Path(__file__).resolve().parents[3]


def _load_env_file(path: Path) -> Dict[str, str]:
    values: Dict[str, str] = {}
    if not path.exists():
        return values
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


class Settings(BaseModel):
    app_name: str = "Feynman Companion Backend"
    llm_provider: str = "mock"
    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com"
    deepseek_model: str = "deepseek-chat"
    request_timeout_seconds: float = 15.0
    max_follow_ups: int = 3
    cors_allow_origins: List[str] = ["*"]

    @property
    def deepseek_configured(self) -> bool:
        return bool(self.deepseek_api_key) and self.deepseek_api_key != "填你的DeepSeekKey"


@lru_cache
def get_settings() -> Settings:
    file_values = _load_env_file(PROJECT_ROOT / ".env.local")

    def pick(name: str, default: str = "") -> str:
        return os.getenv(name) or file_values.get(name) or default

    def pick_float(name: str, default: float) -> float:
        raw_value = pick(name, str(default))
        try:
            return float(raw_value)
        except ValueError:
            return default

    return Settings(
        llm_provider=pick("LLM_PROVIDER", "mock").lower(),
        deepseek_api_key=pick("DEEPSEEK_API_KEY", ""),
        deepseek_base_url=pick("DEEPSEEK_BASE_URL", "https://api.deepseek.com").rstrip("/"),
        deepseek_model=pick("DEEPSEEK_MODEL", "deepseek-chat"),
        request_timeout_seconds=pick_float("REQUEST_TIMEOUT_SECONDS", 15.0),
    )
