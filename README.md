# 규장각 – 인공지능 기반 문서 관리 에이전트 

## 구성
```text
back/
├── api/main/                              # Spring Boot API (JPA/JWT, MySQL prod / H2 local)
│   ├── src/main/java/com/example/main/    # controllers, services, entities
│   ├── src/main/resources/                # application.yml, Flyway 스크립트(V1~V4)
│   ├── Dockerfile                         # Gradle 멀티스테이지 빌드 → JRE17 런타임
│   └── .dockerignore
│
├── ai/main/                               # Flask + Google Gemini 요약/퀴즈 API
│   ├── app.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .dockerignore
│
└── front/main/                            # React(CRA) 프론트엔드
    ├── src/
    ├── public/
    ├── package.json
    ├── yarn.lock
    ├── Dockerfile                         # Nginx로 정적 파일 서빙
    └── .dockerignore

docker-compose.yml                         # db(api), api, ai, front 서비스 정의
```

## 주요 기능
- 노트 CRUD + 이미지/PDF 업로드(H2 local / MySQL prod)
- AI 요약/퀴즈 생성 (Gemini API 사용; PDF → 이미지 변환 후 전송)
- 객관식 퀴즈 재생성, 복습 타임스탬프 업데이트
- 업로드 시 로고 감지
- JWT 인증, Swagger UI, 정적 업로드 파일 서빙
- 프론트: 노트 리스트/상세/업로드, 대시보드, 퀴즈 뷰

## 사전 준비 (중요 !!) 필수 환경변수
1. `docker-compose.yml` 혹은 `.env`에 실제 값 채우기:
2. `GOOGLE_API_KEY` : Gemini 키 (쿼터/빌링 필요)
   - DB: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` (compose 기본은 mysql:8, root/root, db명 onandoff)
   - JWT: `JWT_SECRET`, `JWT_EXPIRATION`
   - 기타: `AI_URL`, `FRONTEND_URL`, `SERVER_PORT`(API), 프론트 빌드 ARG `REACT_APP_API_URL`, `REACT_APP_AI_URL`
> 레포에 포함된 `.env`는 자리표시자이므로 실제 키/비번으로 교체 후 사용하세요. 비밀 키는 커밋/업로드하지 마세요.

## 실행 (원클릭)
```bash
docker compose up -d --build
```
- 서비스 포트: Front `3042`, API `8042`, AI `5042`, MySQL `3306`
- 상태 확인: `docker compose ps`
- 로그 확인: `docker compose logs -f api` / `ai` / `front`

## 개발/재빌드 팁
- 프론트만 변경: `docker compose up -d --build front`
- 백엔드만 변경: `docker compose up -d --build api`
- AI만 변경: `docker compose up -d --build ai`

## 주의
- AI 요약/퀴즈는 Gemini 429 error 발생 시 키/과금 상태 확인 필요.
- 업로드 파일은 `back/api/main/uploads` 로컬 경로를 볼륨 마운트하여 유지.
