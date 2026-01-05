# Renju Gomoku 2인 웹앱

FastAPI + React 기반의 렌주(흑 금수) 규칙 오목 웹앱입니다. 단일 Docker 이미지로 프론트 정적 파일과 백엔드 API/WebSocket을 모두 제공하며 Fly.io에 1대 머신으로 배포하도록 구성되었습니다.

## 주요 기능
- 닉네임만으로 방 생성/참가 (흑/백 자동 배정)
- 15x15 오목판 실시간 동기화, 금수/승리 판정 서버 권위 처리
- 실시간 채팅 및 게임 종료 후 승자 한줄평(60자)
- 모든 경기 기록 공개: 목록/상세 조회
- PostgreSQL 저장, Alembic 마이그레이션 제공

## 폴더 구조
- `backend/`: FastAPI 앱, SQLAlchemy, 금수 로직, Alembic
- `frontend/`: Vite + React + TypeScript + Tailwind UI
- `fly.toml`: Fly.io 설정
- `Dockerfile`: 멀티스테이지 빌드 (프론트 → 백엔드)

## 환경 변수 (.env 예시)
`.env.example`를 참고하여 `.env`를 생성하세요.
```
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/gomoku
APP_ENV=development
FRONTEND_DIST=./frontend/dist
```

## 로컬 실행
### 의존성 설치
- 백엔드: `python -m venv .venv && source .venv/bin/activate && pip install -r backend/requirements.txt`
- 프론트엔드: `cd frontend && npm install`

### 데이터베이스 준비
1. 로컬 PostgreSQL 생성 후 DATABASE_URL을 `.env`에 설정
2. 마이그레이션 적용: `cd backend && alembic upgrade head`

### 개발 서버 실행
- 백엔드: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000`
- 프론트엔드: `cd frontend && npm run dev`
- 프론트 빌드 결과를 사용해 단일 앱으로 실행하려면 `npm run build` 후 uvicorn만 실행하면 됩니다.

### 전체 실행 (선택)
- `make`나 추가 스크립트 없이 위 명령을 순서대로 실행합니다.

## 테스트 실행
- 금수/승리 판정 단위 테스트: `PYTHONPATH=backend pytest backend/app/tests`

## Fly.io 배포 가이드 (1대 고정)
1. `flyctl auth login`
2. Postgres 준비: `fly postgres create --name gomoku-db` 후 `fly postgres attach --app <app-name> gomoku-db`
3. 앱 최초 설정: `fly launch --no-deploy` (Dockerfile 사용, internal_port=8080 확인)
4. 환경 변수/시크릿 설정: `fly secrets set DATABASE_URL=<postgres-url>`
5. 마이그레이션: `fly ssh console -C "cd /app/backend && alembic upgrade head"`
6. 배포: `fly deploy`
7. **단일 머신 고정**: `fly scale count 1` 그리고 웹소켓 안정을 위해 `fly scale vm shared-cpu-1x --memory 512` 등 최소 1대 유지, `fly autoscale disable` 또는 `fly scale count 1 --max=1`으로 오토스케일 비활성화 권장.
8. uvicorn은 Dockerfile에서 `--host 0.0.0.0`로 설정되어 있습니다.

## 문제 해결 팁
- WebSocket 연결 안됨: Fly 보안 그룹에서 8080 포트 확인, 클라이언트가 wss://<app>.fly.dev/ws/... 로 연결되는지 확인
- DB 연결 오류: DATABASE_URL 포맷 확인, Fly Postgres attach 여부 확인
- 진행 중 게임 유실: 현재 인메모리 룸 상태이므로 서버 재시작 시 게임이 초기화됩니다. 필요시 Redis/DB 저장으로 확장하세요.

