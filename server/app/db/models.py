# app/db/models.py

from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class ChatSession(Base):
    """
    채팅 세션 정보를 저장하는 ChatSession 테이블 모델입니다.
    """
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, default="새 채팅")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # 관계 설정
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")

class ChatMessage(Base):
    """
    채팅 메시지 정보를 저장하는 ChatMessage 테이블 모델입니다.
    """
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=False)
    role = Column(String(20), nullable=False)  # 'user' 또는 'assistant'
    content = Column(Text, nullable=False)
    model_used = Column(String(100), nullable=True)  # 사용된 모델
    routing_scores = Column(JSON, nullable=True)  # 모델별 점수
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 관계 설정
    session = relationship("ChatSession", back_populates="messages") 