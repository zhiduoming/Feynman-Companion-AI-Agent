from fastapi import APIRouter, HTTPException

from backend.app.models.feynman import (
    ApiResponse,
    FeynmanChatRequest,
    GreetingData,
    GreetingResponse,
    ResetSessionRequest,
    ResetSessionResponse,
    SessionDebugResponse,
)
from backend.app.services.knowledge_base import INITIAL_GUIDE_TEXT
from backend.app.services.feynman_service import get_feynman_service


router = APIRouter(prefix="/feynman", tags=["feynman"])


@router.get("/greeting", response_model=GreetingResponse)
async def greeting():
    return GreetingResponse(
        code=200,
        msg="success",
        data=GreetingData(reply_text=INITIAL_GUIDE_TEXT),
    )


@router.post("/chat", response_model=ApiResponse)
async def chat(request: FeynmanChatRequest):
    service = get_feynman_service()
    try:
        data = await service.chat(request)
    except ValueError as exc:
        return ApiResponse(code=400, msg=str(exc), data=None)
    except Exception as exc:
        raise HTTPException(status_code=500, detail="internal server error") from exc
    return ApiResponse(code=200, msg="success", data=data)


@router.post("/reset", response_model=ResetSessionResponse)
async def reset(request: ResetSessionRequest):
    service = get_feynman_service()
    data = service.reset(request)
    return ResetSessionResponse(code=200, msg="success", data=data)


@router.get("/session/{session_id}", response_model=SessionDebugResponse)
async def inspect_session(session_id: str):
    service = get_feynman_service()
    data = service.inspect_session(session_id)
    return SessionDebugResponse(code=200, msg="success", data=data)
