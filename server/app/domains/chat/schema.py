# app/domains/chat/schema.py

from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

# 요청 스키마
class ChatSessionCreate(BaseModel):
    title: Optional[str] = "새 채팅"

class MessageCreate(BaseModel):
    content: str

class MessageRequest(BaseModel):
    content: str

# 응답 스키마
class ChatMessageResponse(BaseModel):
    id: int
    session_id: int
    role: str
    content: str
    model_used: Optional[str] = None
    routing_scores: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ChatSessionResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[ChatMessageResponse] = []

    class Config:
        from_attributes = True

class ChatSessionListResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int

    class Config:
        from_attributes = True

# 스트리밍 응답 스키마
class StreamingChunk(BaseModel):
    content: str
    model_used: Optional[str] = None
    routing_scores: Optional[Dict[str, Any]] = None
    is_finished: bool = False 