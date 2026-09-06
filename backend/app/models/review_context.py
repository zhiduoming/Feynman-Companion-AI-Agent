from typing import Optional
from pydantic import BaseModel

class TargetGap(BaseModel):
    """
    基础漏洞信息
    用于记录大模型在历史复习中诊断出的具体薄弱点
    """
    gap_id: str
    kp_id: str
    kp_name: str
    weak_dimensions: list[str]  # 薄弱维度列表，例如 ["逻辑连贯性", "理解深度"]
    gap_desc: str               # 漏洞的具体描述文本
    previous_scores: Optional[dict[str, int]] = None  # 上次各维度的得分，例如 {"逻辑连贯性": 6, "理解深度": 8}


class ReviewContext(BaseModel):
    """
    完整的复习上下文数据包
    作为纯数据 DTO 在 LangGraph 状态机中传递，不关联底层数据库表
    """
    gap_id: str
    kp_id: str
    kp_name: str
    review_focus: list[str]     # 本次重点考察的维度列表
    target_gap: TargetGap       # 嵌套的基础漏洞详细信息
    previous_report_summary: Optional[str] = None  # 上次诊断报告的总结摘要（可能为空）