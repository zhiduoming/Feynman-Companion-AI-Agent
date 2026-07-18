import asyncio

from backend.app.core.config import get_settings
from backend.app.services.deepseek_client import DeepSeekClient
from backend.app.services.kp_provider import DEFAULT_KP_ID, kp_provider


async def main() -> None:
    settings = get_settings()
    if not settings.deepseek_configured:
        raise SystemExit("DeepSeek is not configured. Fill DEEPSEEK_API_KEY in .env.local first.")

    client = DeepSeekClient(settings)
    knowledge_point = kp_provider.get(DEFAULT_KP_ID)
    if knowledge_point is None:
        raise SystemExit("Default mock knowledge point is missing.")
    result = await client.evaluate(
        messages=[],
        user_input="Dijkstra 是用来求带权图中从起点到其他节点最短路径的算法。",
        follow_up_count=0,
        max_follow_ups=settings.max_follow_ups,
        knowledge_point=knowledge_point,
    )
    print(f"deepseek smoke ok: next_action={result.next_action.value}")
    print(f"reply_preview={result.reply_text[:80]}")


if __name__ == "__main__":
    asyncio.run(main())
