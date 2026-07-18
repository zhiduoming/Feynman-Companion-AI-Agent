import json
import unittest

from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from backend.app.models.knowledge import Chapter, KP, Material
from backend.app.services.kp_provider import SQLiteKnowledgePointProvider


class SQLiteKnowledgePointProviderTest(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        SQLModel.metadata.create_all(self.engine)

        with Session(self.engine) as session:
            session.add(
                Material(
                    id="mat-real",
                    subject="计算机",
                    filename="data-structures.pdf",
                    raw_path="/tmp/data-structures.pdf",
                    status="done",
                )
            )
            session.add(
                Chapter(
                    id="ch-real",
                    material_id="mat-real",
                    chapter_no="第6章",
                    title="图",
                )
            )
            session.add(
                KP(
                    id="kp-real",
                    chapter_id="ch-real",
                    name="Dijkstra 算法",
                    summary="求非负权图中的单源最短路径",
                    rubric=json.dumps(
                        {
                            "concept_prerequisite": "理解带权图和路径长度",
                            "core_mechanism": "反复选取当前距离最小的未确定节点并松弛邻边",
                            "principle_proof": "非负权保证已确定节点不会被后续路径改短",
                            "common_misunderstandings": ["误以为可以处理负权边"],
                        },
                        ensure_ascii=False,
                    ),
                    page_start=10,
                    page_end=12,
                    status="done",
                )
            )
            session.add(
                KP(
                    id="kp-pending",
                    chapter_id="ch-real",
                    name="待生成知识点",
                    summary="尚未完成",
                    page_start=13,
                    page_end=14,
                    status="pending_regenerate",
                )
            )
            session.commit()

        self.provider = SQLiteKnowledgePointProvider(self.engine)

    def test_reads_completed_knowledge_point_and_normalizes_rubric(self) -> None:
        knowledge_point = self.provider.get("kp-real")

        self.assertIsNotNone(knowledge_point)
        self.assertEqual(knowledge_point.material_id, "mat-real")
        self.assertEqual(knowledge_point.chapter_id, "ch-real")
        self.assertEqual(
            knowledge_point.rubric["core_mechanism"]["name"],
            "核心机制",
        )
        self.assertIn(
            "当前距离最小",
            knowledge_point.rubric["core_mechanism"]["content"],
        )

    def test_ignores_knowledge_point_that_is_not_ready(self) -> None:
        self.assertIsNone(self.provider.get("kp-pending"))


if __name__ == "__main__":
    unittest.main()
