# app/db/database.py

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from app.core.config import settings

# 데이터베이스 엔진을 생성합니다.
# connect_args는 SQLite 외의 DB에서 필요한 옵션입니다. 여기서는 MySQL이므로 필요할 수 있습니다.
engine = create_engine(
    settings.DATABASE_URL
)

# 데이터베이스 세션을 생성하는 클래스입니다.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# SQLAlchemy 모델의 베이스 클래스입니다.
# 모든 모델 클래스는 이 Base를 상속받아야 합니다.
Base = declarative_base()

# API 엔드포인트에서 데이터베이스 세션을 주입하기 위한 의존성 함수입니다.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
