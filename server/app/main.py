# app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.domains.chat import router as chat_router
from app.db import models
from app.db.database import engine

# 애플리케이션 시작 시 데이터베이스 테이블을 생성합니다.
# (Alembic 같은 마이그레이션 툴을 사용하는 것이 더 권장됩니다.)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="DeepAuto Chat API", version="1.0.0")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인만 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 생성한 라우터를 앱에 포함시킵니다.
app.include_router(chat_router.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the DeepAuto Chat API"}