import pytest
from backend.app.models.review_context import ReviewContext, TargetGap
from backend.app.services.review_context_service import (
    DefaultReviewContextProvider,
    safe_load_review_context,
)


class MockSuccessReviewContextProvider:
    """模拟有历史复习数据的 Provider"""
    def load_review_context(self, session_id: str, user_id: str) -> ReviewContext:
        return ReviewContext(
            gap_id="gap-001",
            kp_id="kp-001",
            kp_name="快速排序",
            review_focus=["逻辑连贯性", "理解深度"],
            target_gap=TargetGap(
                gap_id="gap-001",
                kp_id="kp-001",
                kp_name="快速排序",
                weak_dimensions=["逻辑连贯性"],
                gap_desc="未说明基准值选取的边界情况",
                previous_scores={"逻辑连贯性": 5, "理解深度": 6},
            ),
            previous_report_summary="上次在基准划分逻辑上有缺失",
        )


class MockExceptionReviewContextProvider:
    """模拟数据库连接异常崩坏的 Provider"""
    def load_review_context(self, session_id: str, user_id: str):
        raise ConnectionError("Database connection timed out")


def test_review_context_no_history():
    """测试用例 1：无历史数据（默认实现）-> 返回 None"""
    provider = DefaultReviewContextProvider()
    result = safe_load_review_context(provider, session_id="sess-1", user_id="user-1")
    assert result is None


def test_review_context_with_history():
    """测试用例 2：有历史假数据 -> 正确返回 ReviewContext 对象及内部字段"""
    provider = MockSuccessReviewContextProvider()
    result = safe_load_review_context(provider, session_id="sess-1", user_id="user-1")
    
    assert result is not None
    assert result.gap_id == "gap-001"
    assert result.kp_name == "快速排序"
    assert "逻辑连贯性" in result.review_focus
    assert result.target_gap.previous_scores == {"逻辑连贯性": 5, "理解深度": 6}


def test_review_context_provider_exception():
    """测试用例 3：Provider 抛出异常 -> 吞掉错误并安全返回 None"""
    provider = MockExceptionReviewContextProvider()
    result = safe_load_review_context(provider, session_id="sess-1", user_id="user-1")
    assert result is None