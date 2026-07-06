import unittest

from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.models.feynman import FeynmanChatRequest, NextAction, ResetSessionRequest
from backend.app.services.feynman_service import FeynmanService
from backend.app.services.mock_llm import MockLLMClient
from backend.app.services.session_store import InMemorySessionStore


class FeynmanServiceTest(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.service = FeynmanService(
            store=InMemorySessionStore(),
            llm_client=MockLLMClient(),
            fallback_client=MockLLMClient(),
        )

    async def test_off_topic_does_not_generate_report(self):
        response = await self.service.chat(
            FeynmanChatRequest(session_id="s1", user_input="今天天气怎么样")
        )
        self.assertEqual(response.next_action, NextAction.GUIDE_TOPIC)
        self.assertIsNone(response.card_preview)
        self.assertIsNone(response.final_report)

    async def test_follow_up_then_report_after_max_rounds(self):
        first = await self.service.chat(
            FeynmanChatRequest(session_id="s2", user_input="Dijkstra 是求图最短路径的算法")
        )
        self.assertEqual(first.next_action, NextAction.FOLLOW_UP)

        await self.service.chat(
            FeynmanChatRequest(session_id="s2", user_input="它每次选未访问里距离最小的节点")
        )
        await self.service.chat(
            FeynmanChatRequest(session_id="s2", user_input="然后对相邻节点做松弛更新")
        )
        final = await self.service.chat(
            FeynmanChatRequest(session_id="s2", user_input="非负权保证后续不会绕出更短路径")
        )
        self.assertEqual(final.next_action, NextAction.GENERATE_REPORT)
        self.assertIsNotNone(final.card_preview)
        self.assertIsNotNone(final.final_report)

    async def test_ineffective_answer_returns_hint_without_report(self):
        response = await self.service.chat(
            FeynmanChatRequest(session_id="s3", user_input="不会")
        )
        self.assertEqual(response.next_action, NextAction.FOLLOW_UP)
        self.assertIsNone(response.card_preview)
        self.assertIsNone(response.final_report)

    async def test_final_report_is_sticky_until_reset(self):
        session_id = "s4"
        await self.service.chat(
            FeynmanChatRequest(session_id=session_id, user_input="Dijkstra 是求图最短路径的算法")
        )
        await self.service.chat(
            FeynmanChatRequest(session_id=session_id, user_input="它每次选未访问里距离最小的节点")
        )
        await self.service.chat(
            FeynmanChatRequest(session_id=session_id, user_input="然后对相邻节点做松弛更新")
        )
        final = await self.service.chat(
            FeynmanChatRequest(session_id=session_id, user_input="非负权保证后续不会绕出更短路径")
        )
        again = await self.service.chat(
            FeynmanChatRequest(session_id=session_id, user_input="我想继续补充一些内容")
        )
        self.assertEqual(final, again)

    async def test_reset_clears_session_state(self):
        session_id = "s5"
        await self.service.chat(
            FeynmanChatRequest(session_id=session_id, user_input="Dijkstra 是求图最短路径的算法")
        )
        before = self.service.inspect_session(session_id)
        self.assertTrue(before.exists)
        self.assertGreater(before.follow_up_count, 0)

        reset = self.service.reset(ResetSessionRequest(session_id=session_id))
        after = self.service.inspect_session(session_id)

        self.assertTrue(reset.reset)
        self.assertTrue(after.exists)
        self.assertEqual(after.follow_up_count, 0)
        self.assertEqual(after.message_count, 0)
        self.assertFalse(after.ended)

    async def test_inspect_missing_session(self):
        debug = self.service.inspect_session("missing-session")
        self.assertFalse(debug.exists)
        self.assertEqual(debug.follow_up_count, 0)
        self.assertEqual(debug.message_count, 0)


class FeynmanApiTest(unittest.TestCase):
    def test_greeting_endpoint(self):
        client = TestClient(app)
        response = client.get("/api/v1/feynman/greeting")
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["code"], 200)
        self.assertIn("reply_text", body["data"])


if __name__ == "__main__":
    unittest.main()
