# app/domains/chat/service.py

import json
from openai import OpenAI
from typing import List, Optional, Dict, Any, AsyncGenerator
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.db.database import get_db
from app.core.config import settings
from app.db.models import ChatSession, ChatMessage
from .schema import ChatSessionCreate, MessageCreate, StreamingChunk

class ChatService:
    def __init__(self, db: Session):
        self.db = db
        self.client = OpenAI(
            base_url=settings.DEEPAUTO_BASE_URL,
            api_key=settings.DEEPAUTO_API_KEY,
        )

    def create_chat_session(self, title: str = "새 채팅") -> ChatSession:
        """새 채팅 세션을 생성합니다."""
        session = ChatSession(title=title)
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session

    def get_chat_sessions(self) -> List[ChatSession]:
        """모든 채팅 세션을 조회합니다."""
        return self.db.query(ChatSession).order_by(desc(ChatSession.updated_at)).all()

    def get_chat_session(self, session_id: int) -> Optional[ChatSession]:
        """특정 채팅 세션을 조회합니다."""
        return self.db.query(ChatSession).filter(ChatSession.id == session_id).first()

    def delete_chat_session(self, session_id: int) -> bool:
        """채팅 세션을 삭제합니다."""
        session = self.get_chat_session(session_id)
        if session:
            self.db.delete(session)
            self.db.commit()
            return True
        return False

    def get_session_messages(self, session_id: int) -> List[ChatMessage]:
        """특정 세션의 메시지들을 조회합니다."""
        return self.db.query(ChatMessage).filter(
            ChatMessage.session_id == session_id
        ).order_by(ChatMessage.created_at).all()

    def save_user_message(self, session_id: int, content: str) -> ChatMessage:
        """사용자 메시지를 저장합니다."""
        message = ChatMessage(
            session_id=session_id,
            role="user",
            content=content
        )
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        return message

    def save_assistant_message(self, session_id: int, content: str, 
                             model_used: str = None, routing_scores: Dict[str, Any] = None) -> ChatMessage:
        """어시스턴트 메시지를 저장합니다."""
        message = ChatMessage(
            session_id=session_id,
            role="assistant",
            content=content,
            model_used=model_used,
            routing_scores=routing_scores
        )
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        return message

    def update_session_title(self, session_id: int, title: str) -> bool:
        """채팅 세션 제목을 업데이트합니다."""
        session = self.get_chat_session(session_id)
        if session:
            session.title = title
            self.db.commit()
            return True
        return False

    def generate_session_title(self, user_message: str) -> str:
        """사용자 메시지를 기반으로 채팅 세션 제목을 생성합니다."""
        try:
            print(f"=== 제목 생성 시작 ===")
            print(f"사용자 메시지: {user_message}")
            
            # 메시지가 너무 길면 자르기
            title = user_message.strip()
            if len(title) > 20:
                title = title[:20] + "..."
            
            print(f"생성된 제목: '{title}'")
            return title
            
        except Exception as e:
            print(f"=== 제목 생성 오류 ===")
            print(f"오류 메시지: {str(e)}")
            return "새 채팅"

    async def call_deepauto_api(self, messages: List[Dict[str, str]], 
                               session_id: int) -> AsyncGenerator[StreamingChunk, None]:
        """DeepAuto API를 호출하여 스트리밍 응답을 처리합니다."""
        try:
            # 디버깅: 전송되는 메시지 로그
            print(f"=== API 호출 메시지 ===")
            for i, msg in enumerate(messages):
                print(f"Message {i}: {msg}")
            print(f"=== API 키 확인 ===")
            print(f"API Key: {settings.DEEPAUTO_API_KEY[:10]}..." if settings.DEEPAUTO_API_KEY else "API Key: None")
            print(f"Base URL: {settings.DEEPAUTO_BASE_URL}")
            print(f"Model: {settings.DEEPAUTO_MODEL}")
            
            # 시스템 메시지 제거하고 기본 메시지만 사용
            api_messages = messages
            
            print(f"=== API로 전송할 메시지 ===")
            for i, msg in enumerate(api_messages):
                print(f"API Message {i}: {msg}")
            
            # OpenAI 호환 방식으로 API 호출
            completion = self.client.chat.completions.create(
                model=settings.DEEPAUTO_MODEL,
                messages=api_messages,
                stream=True,
                temperature=0.7,
                max_tokens=500  # 토큰 수 줄임
            )

            full_content = ""
            model_used = None
            routing_scores = None
            is_first_chunk = True

            for chunk in completion:
                if is_first_chunk:
                    print(f"=== 첫 번째 청크 상세 분석 ===")
                    print(f"청크 타입: {type(chunk)}")
                    print(f"청크 내용: {chunk}")
                    print(f"청크 속성들: {dir(chunk)}")
                    print(f"청크 __dict__: {chunk.__dict__}")
                    
                    if hasattr(chunk, 'choices') and chunk.choices:
                        print(f"첫 번째 choice: {chunk.choices[0]}")
                        print(f"첫 번째 choice 속성들: {dir(chunk.choices[0])}")
                        print(f"첫 번째 choice __dict__: {chunk.choices[0].__dict__}")
                    
                    if hasattr(chunk, 'provider_specific_fields'):
                        print(f"provider_specific_fields: {chunk.provider_specific_fields}")
                    
                    # query_routing 정보 확인
                    if hasattr(chunk, 'query_routing'):
                        print(f"query_routing 발견: {chunk.query_routing}")
                    elif 'query_routing' in chunk.__dict__:
                        print(f"query_routing 발견 (__dict__): {chunk.__dict__['query_routing']}")
                    else:
                        print("query_routing 속성이 없습니다")
                    
                    is_first_chunk = False
                else:
                    print(f"=== 청크 수신 ===")
                    print(f"청크 타입: {type(chunk)}")
                    print(f"청크 내용: {chunk}")
                
                if chunk.choices[0].delta.content is not None:
                    content_chunk = chunk.choices[0].delta.content
                    full_content += content_chunk
                    print(f"콘텐츠 청크: '{content_chunk}'")
                    
                    # 라우팅 정보 추출 (첫 번째 청크에서만)
                    if not model_used:
                        if hasattr(chunk, 'query_routing'):
                            routing_info = chunk.query_routing
                            model_used = routing_info.get("selected_model")
                            
                            grades = routing_info.get("grades", [])
                            routing_scores = {}
                            for grade in grades:
                                model_name = grade.get("model", "")
                                score = grade.get("score", 0)
                                grade_label = grade.get("grade_label", "")
                                grade_value = grade.get("grade_value", 0)
                                
                                routing_scores[model_name] = {
                                    "score": score,
                                    "grade_label": grade_label,
                                    "grade_value": grade_value
                                }
                            
                            print(f"라우팅 정보 추출: model_used={model_used}, routing_scores={routing_scores}")
                        elif 'query_routing' in chunk.__dict__:
                            routing_info = chunk.__dict__['query_routing']
                            model_used = routing_info.get("selected_model")
                            
                            grades = routing_info.get("grades", [])
                            routing_scores = {}
                            for grade in grades:
                                model_name = grade.get("model", "")
                                score = grade.get("score", 0)
                                grade_label = grade.get("grade_label", "")
                                grade_value = grade.get("grade_value", 0)
                                
                                routing_scores[model_name] = {
                                    "score": score,
                                    "grade_label": grade_label,
                                    "grade_value": grade_value
                                }
                            
                            print(f"라우팅 정보 추출 (__dict__): model_used={model_used}, routing_scores={routing_scores}")
                    
                    yield StreamingChunk(
                        content=content_chunk,
                        model_used=model_used,
                        routing_scores=routing_scores,
                        is_finished=False
                    )

            # 최종 메시지를 DB에 저장
            if full_content.strip():
                print(f"=== 최종 응답 저장 ===")
                print(f"전체 응답: '{full_content}'")
                self.save_assistant_message(
                    session_id, full_content, model_used, routing_scores
                )
            
            yield StreamingChunk(content="", is_finished=True)

        except Exception as e:
            print(f"=== API 호출 오류 ===")
            print(f"오류 메시지: {str(e)}")
            print(f"오류 타입: {type(e)}")
            import traceback
            print(f"오류 상세: {traceback.format_exc()}")
            
            error_message = f"API 오류: {str(e)}"
            yield StreamingChunk(
                content=error_message,
                is_finished=True
            ) 