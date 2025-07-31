# DeepAuto Chat Application

DeepAuto.ai Scaleserve Chat Completion API를 활용한 실시간 챗봇 웹 애플리케이션입니다.

## 🚀 실행 방법

### 1. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# DeepAuto API 설정
DEEPAUTO_API_KEY=your_deepauto_api_key_here
DEEPAUTO_BASE_URL=https://api.deepauto.ai/openai/v1
DEEPAUTO_MODEL=openai/gpt-4o-mini-2024-07-18,deepauto/qwq-32b

# 데이터베이스 설정
DATABASE_URL=sqlite:///./chat.db

# Next.js 설정 (Docker 환경에서는 서비스 이름 사용)
NEXT_PUBLIC_API_BASE_URL=http://server:8000
```

### 2. Docker Compose로 실행 (권장)

```bash
# 전체 애플리케이션 실행
docker-compose up --build

# 백그라운드 실행
docker-compose up -d --build

# 로그 확인
docker-compose logs -f

# 애플리케이션 중지
docker-compose down
```

### 3. 개별 실행

#### Backend 실행

```bash
cd server
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend 실행

```bash
cd nextjs
npm install
npm run dev
```

## 🏗️ 아키텍처 개요

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js 15    │    │   FastAPI       │    │   DeepAuto      │
│   Frontend      │◄──►│   Backend       │◄──►│   API           │
│   (Port 3000)   │    │   (Port 8000)   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   SQLite        │
                       │   Database      │
                       └─────────────────┘
```

### 기술 스택

#### Frontend

- **Next.js 15** - React 기반 프레임워크 (App Router)
- **TypeScript** - 타입 안전성
- **TailwindCSS** - 스타일링
- **React Markdown** - 마크다운 렌더링

#### Backend

- **FastAPI** - Python 웹 프레임워크
- **SQLAlchemy** - ORM
- **SQLite** - 데이터베이스
- **OpenAI** - DeepAuto API 클라이언트

## 🗄️ 데이터베이스 설계

### ChatSession 테이블

| 필드         | 타입     | 설명                      |
| ------------ | -------- | ------------------------- |
| `id`         | INTEGER  | Primary Key, 세션 고유 ID |
| `title`      | VARCHAR  | 채팅 제목 (AI 생성)       |
| `created_at` | DATETIME | 생성 시간                 |
| `updated_at` | DATETIME | 마지막 업데이트 시간      |

### ChatMessage 테이블

| 필드             | 타입     | 설명                          |
| ---------------- | -------- | ----------------------------- |
| `id`             | INTEGER  | Primary Key, 메시지 고유 ID   |
| `session_id`     | INTEGER  | Foreign Key, ChatSession 참조 |
| `role`           | VARCHAR  | 'user' 또는 'assistant'       |
| `content`        | TEXT     | 메시지 내용                   |
| `model_used`     | VARCHAR  | 사용된 모델명                 |
| `routing_scores` | JSON     | 모델별 점수 및 등급 정보      |
| `created_at`     | DATETIME | 생성 시간                     |

## 📡 API 엔드포인트

### 채팅 세션 관리

- `GET /api/chat/sessions` - 채팅 세션 목록 조회
- `POST /api/chat/sessions` - 새 채팅 세션 생성
- `GET /api/chat/sessions/{session_id}` - 특정 세션 조회
- `DELETE /api/chat/sessions/{session_id}` - 세션 삭제
- `PUT /api/chat/sessions/{session_id}/title` - 세션 제목 업데이트

### 메시지 전송

- `POST /api/chat/sessions/{session_id}/messages/stream` - 메시지 전송 (스트리밍)

## 🎯 주요 기능 설명

### 1. 모델 라우팅 정보 표시

- 각 응답마다 선택된 모델이 파란색으로 강조 표시
- "상세 정보" 버튼으로 후보 모델들의 점수 확인 가능

### 2. 라우팅 점수 UI

- 각 후보 모델별 점수 및 등급 표시
- 색상별 등급 구분:
  - 🟢 Very Good (4-5점): 초록색
  - 🟡 Good (3-4점): 노란색
  - 🟠 Average (2-3점): 주황색
  - 🔴 Poor (0-2점): 빨간색

### 3. 실시간 스트리밍

- 메시지 전송 시 실시간으로 응답 표시
- 자동 스크롤로 최신 메시지 확인

### 4. 세션 관리

- 사이드바에서 채팅 세션 목록 확인
- 새 채팅 생성 및 기존 세션 삭제
- AI 생성 제목으로 세션 구분

## 🛠️ 개발 환경

- **Python**: 3.11+
- **Node.js**: 18+
- **Docker**: 20.10+
- **Docker Compose**: 2.0+

## 📁 프로젝트 구조

```
deepauto/
├── nextjs/                 # Next.js Frontend
│   ├── src/
│   │   ├── app/           # App Router
│   │   ├── components/    # React Components
│   │   └── lib/          # API Client
│   ├── public/           # Static Files
│   └── Dockerfile
├── server/                # FastAPI Backend
│   ├── app/
│   │   ├── domains/      # Business Logic
│   │   ├── db/          # Database Models
│   │   └── core/        # Configuration
│   ├── requirements.txt
│   └── Dockerfile
├── docker-compose.yml    # Docker Configuration
├── env.example          # Environment Variables
└── README.md           # This File
```

## 🔧 문제 해결

### 일반적인 문제들

1. **포트 충돌**

   ```bash
   # 사용 중인 포트 확인
   lsof -i :3000
   lsof -i :8000
   ```

2. **Docker 이미지 재빌드**

   ```bash
   docker-compose down
   docker-compose build --no-cache
   docker-compose up
   ```

3. **데이터베이스 초기화**

   ```bash
   # 서버 컨테이너에서
   docker-compose exec server rm -f chat.db
   docker-compose restart server
   ```

4. **Docker 네트워크 문제**
   ```bash
   # 컨테이너 간 통신 확인
   docker-compose exec client ping server
   ```

## 📄 라이센스

MIT License

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
