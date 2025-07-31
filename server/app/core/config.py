# app/core/config.py

import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# .env 파일에서 환경변수를 로드합니다.
load_dotenv()

class Settings(BaseSettings):
    """
    애플리케이션 설정을 관리하는 클래스입니다.
    .env 파일로부터 환경 변수를 읽어옵니다.
    """
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    
    # DeepAuto API 설정 (OpenAI 호환)
    DEEPAUTO_BASE_URL: str = os.getenv("DEEPAUTO_BASE_URL")
    DEEPAUTO_API_KEY: str = os.getenv("DEEPAUTO_API_KEY")
    DEEPAUTO_MODEL: str = os.getenv("DEEPAUTO_MODEL")

    class Config:
        # .env 파일을 명시적으로 지정할 수도 있습니다.
        env_file = ".env"

# 설정 객체 인스턴스를 생성합니다.
settings = Settings()
