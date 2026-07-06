from typing import Sequence

from backend.app.models.feynman import (
    CardPreview,
    ChatMessage,
    DimensionReport,
    FinalReport,
    FeynmanChatData,
    NextAction,
)


class MockLLMClient:
    async def evaluate(
        self,
        messages: Sequence[ChatMessage],
        user_input: str,
        follow_up_count: int,
        max_follow_ups: int,
    ) -> FeynmanChatData:
        text = _normalize(user_input)
        all_text = _normalize(" ".join([message.content for message in messages] + [user_input]))
        coverage = _coverage(all_text)

        if follow_up_count >= max_follow_ups or _is_complete(coverage):
            return _build_report(all_text, coverage)

        if not coverage["non_negative"]:
            return FeynmanChatData(
                next_action=NextAction.FOLLOW_UP,
                reply_text="我听懂了一部分流程。不过如果图里出现负权边，这个方法还能保证正确吗？为什么？",
            )
        if not coverage["greedy_choice"]:
            return FeynmanChatData(
                next_action=NextAction.FOLLOW_UP,
                reply_text="你提到了找最短路，但每一步到底应该选哪个点继续扩展？这个选择依据是什么？",
            )
        if not coverage["relaxation"]:
            return FeynmanChatData(
                next_action=NextAction.FOLLOW_UP,
                reply_text="你说会更新距离，我有点没跟上：所谓“松弛”具体是在更新谁的距离？用什么规则更新？",
            )
        if not coverage["proof"]:
            return FeynmanChatData(
                next_action=NextAction.FOLLOW_UP,
                reply_text="操作步骤我大概明白了，但为什么当前距离最小的未访问节点就可以确定为最短路了？",
            )

        return _build_report(text, coverage)


def _normalize(text: str) -> str:
    return text.lower().replace(" ", "")


def _coverage(text: str) -> dict[str, bool]:
    return {
        "non_negative": any(word in text for word in ["非负", "负权", "negative", "不能有负"]),
        "greedy_choice": any(word in text for word in ["贪心", "未访问", "最近", "距离最小", "最短的点"]),
        "relaxation": any(word in text for word in ["松弛", "更新", "相邻", "邻接"]),
        "proof": any(word in text for word in ["为什么", "证明", "三角", "后续不可能", "正确性"]),
    }


def _is_complete(coverage: dict[str, bool]) -> bool:
    return all(coverage.values())


def _build_report(text: str, coverage: dict[str, bool]) -> FeynmanChatData:
    covered_count = sum(1 for value in coverage.values() if value)
    understanding = min(10, 2 + covered_count * 2)
    completeness = min(10, 2 + covered_count * 2)
    logic = 8 if coverage["proof"] else 5 if covered_count >= 2 else 3
    structure = 8 if len(text) > 80 else 5 if len(text) > 30 else 3
    total = understanding + completeness + logic + structure

    dimensions = [
        DimensionReport(
            name="理解深度",
            score=understanding,
            analysis="你已经覆盖了部分核心机制，但对适用前提和正确性依据的说明仍需要补强。",
            suggestion="复述时按“适用条件-选择规则-松弛过程-为什么正确”的顺序讲。",
        ),
        DimensionReport(
            name="表达完整性",
            score=completeness,
            analysis="讲解中覆盖的关键点数量决定完整性，目前仍有遗漏项。",
            suggestion="至少明确非负权前提、每轮选择的节点、松弛相邻节点这三件事。",
        ),
        DimensionReport(
            name="逻辑连贯性",
            score=logic,
            analysis="如果只讲步骤但不解释为什么贪心选择成立，逻辑说服力会偏弱。",
            suggestion="补一句：边权非负时，当前最近的未访问节点之后不会被绕路更新得更短。",
        ),
        DimensionReport(
            name="结构化能力",
            score=structure,
            analysis="表达已经能形成基本段落，但还可以更像一段面向小白的完整讲解。",
            suggestion="先说用途，再说限制条件，再说算法步骤，最后说正确性直觉。",
        ),
    ]

    if total >= 32:
        summary = "理解较完整，逻辑较清楚"
    elif total >= 22:
        summary = "掌握流程，原理需补强"
    else:
        summary = "关键概念仍需重建"

    return FeynmanChatData(
        next_action=NextAction.GENERATE_REPORT,
        reply_text="这轮讲解先到这里，我给你整理了一份诊断报告。",
        card_preview=CardPreview(total_score=total, summary=summary),
        final_report=FinalReport(
            dimensions=dimensions,
            overall_comment=(
                "本次讲解已经能反映你对 Dijkstra 的部分理解。后续重点不是背流程，"
                "而是把非负权前提、贪心选择和松弛操作之间的因果关系讲清楚。"
            ),
        ),
    )
