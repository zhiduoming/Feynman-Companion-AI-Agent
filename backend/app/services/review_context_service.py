from typing import Optional, Protocol
from backend.app.models.review_context import ReviewContext


class ReviewContextProvider(Protocol):
    """
    复习上下文 Provider 协议规范（岗位说明书）
    任何想给系统提供复习上下文的类，只要实现这个方法签名即可，无需显式继承本类。
    """
    def load_review_context(
        self, session_id: str, user_id: str
    ) -> Optional[ReviewContext]:
        ...


class DefaultReviewContextProvider:
    """
    默认实现（临时替身）：
    在后端B完成数据库查询逻辑之前使用。
    无论传入什么，均返回 None，保证系统默认走普通对话。
    """
    def load_review_context(
        self, session_id: str, user_id: str
    ) -> Optional[ReviewContext]:
        return None


def safe_load_review_context(
    provider: Optional[ReviewContextProvider],
    session_id: str,
    user_id: str,
) -> Optional[ReviewContext]:
    """
    安全加载复习上下文的防护函数：
    1. provider 未注入时，返回 None。
    2. 正常执行时，返回对应的 ReviewContext 或 None。
    3. provider 执行发生任何异常时，打印提示并吞掉异常，强制返回 None。
    
    该设计保证外部数据库崩溃或接口报错时，主对话状态机绝不中断。
    """
    if provider is None:
        return None

    try:
        return provider.load_review_context(session_id=session_id, user_id=user_id)
    except Exception as e:
        print(f"⚠️ load_review_context failed, fallback to None: {type(e).__name__}: {e}")
        return None