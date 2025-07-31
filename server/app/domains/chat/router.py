# app/domains/chat/router.py

from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
import json

from app.db.database import get_db
from app.db.models import ChatSession, ChatMessage
from .service import ChatService
from .schema import (
    ChatSessionCreate, ChatSessionResponse, ChatSessionListResponse,
    MessageRequest, ChatMessageResponse, StreamingChunk
)

router = APIRouter(prefix="/api/chat", tags=["chat"])

def get_chat_service(db: Session = Depends(get_db)) -> ChatService:
    return ChatService(db)

@router.post("/sessions", response_model=ChatSessionResponse)
def create_chat_session(
    session_data: ChatSessionCreate,
    chat_service: ChatService = Depends(get_chat_service)
):
    """새 채팅 세션을 생성합니다."""
    session = chat_service.create_chat_session(title=session_data.title)
    return ChatSessionResponse(
        id=session.id,
        title=session.title,
        created_at=session.created_at,
        updated_at=session.updated_at,
        messages=[]
    )

@router.get("/sessions", response_model=List[ChatSessionListResponse])
def get_chat_sessions(chat_service: ChatService = Depends(get_chat_service)):
    """모든 채팅 세션 목록을 조회합니다."""
    sessions = chat_service.get_chat_sessions()
    result = []
    for session in sessions:
        message_count = len(session.messages)
        result.append(ChatSessionListResponse(
            id=session.id,
            title=session.title,
            created_at=session.created_at,
            updated_at=session.updated_at,
            message_count=message_count
        ))
    return result

@router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
def get_chat_session(
    session_id: int,
    chat_service: ChatService = Depends(get_chat_service)
):
    """특정 채팅 세션과 메시지들을 조회합니다."""
    session = chat_service.get_chat_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="채팅 세션을 찾을 수 없습니다.")
    
    messages = [ChatMessageResponse(
        id=msg.id,
        session_id=msg.session_id,
        role=msg.role,
        content=msg.content,
        model_used=msg.model_used,
        routing_scores=msg.routing_scores,
        created_at=msg.created_at
    ) for msg in session.messages]
    
    return ChatSessionResponse(
        id=session.id,
        title=session.title,
        created_at=session.created_at,
        updated_at=session.updated_at,
        messages=messages
    )

@router.delete("/sessions/{session_id}")
def delete_chat_session(
    session_id: int,
    chat_service: ChatService = Depends(get_chat_service)
):
    """채팅 세션을 삭제합니다."""
    success = chat_service.delete_chat_session(session_id)
    if not success:
        raise HTTPException(status_code=404, detail="채팅 세션을 찾을 수 없습니다.")
    return {"message": "채팅 세션이 삭제되었습니다."}

@router.put("/sessions/{session_id}/title")
def update_session_title(
    session_id: int,
    title_data: dict,
    chat_service: ChatService = Depends(get_chat_service)
):
    """채팅 세션 제목을 업데이트합니다."""
    success = chat_service.update_session_title(session_id, title_data["title"])
    if not success:
        raise HTTPException(status_code=404, detail="채팅 세션을 찾을 수 없습니다.")
    return {"message": "채팅 세션 제목이 업데이트되었습니다."}

@router.post("/sessions/{session_id}/messages")
async def send_message(
    session_id: int,
    message_data: MessageRequest,
    chat_service: ChatService = Depends(get_chat_service)
):
    """메시지를 전송하고 스트리밍 응답을 반환합니다."""
    # 세션 존재 확인
    session = chat_service.get_chat_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="채팅 세션을 찾을 수 없습니다.")
    
    # 사용자 메시지 저장
    user_message = chat_service.save_user_message(session_id, message_data.content)
    
    # 세션 제목 업데이트 (첫 번째 메시지인 경우)
    updated_session = chat_service.get_chat_session(session_id)
    print(f"메시지 수: {len(updated_session.messages)}")
    if len(updated_session.messages) == 1:  # 방금 추가된 메시지만 있는 경우
        print(f"첫 번째 메시지 - 제목 생성 시작: {message_data.content}")
        # AI로 제목 생성
        title = chat_service.generate_session_title(message_data.content)
        print(f"생성된 제목: {title}")
        chat_service.update_session_title(session_id, title)
        print(f"제목 업데이트 완료")
    
    # 이전 메시지들 조회하여 컨텍스트 구성
    messages = chat_service.get_session_messages(session_id)
    context_messages = [
        {"role": msg.role, "content": msg.content}
        for msg in messages
    ]
    
    async def generate_stream():
        async for chunk in chat_service.call_deepauto_api(context_messages, session_id):
            yield f"data: {json.dumps(chunk.dict())}\n\n"
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream"
        }
    ) 