# apps/api

도시계획분석 웹사이트용 FastAPI 백엔드 최소 골격입니다.

## 구조

- `main.py`: FastAPI 앱 생성 및 라우터 등록
- `api/`: 라우터/엔드포인트 계층
- `core/`: 설정 등 공통 인프라
- `schemas/`: 요청/응답 모델
- `services/`: 비즈니스 유스케이스 계층(확장 예정)
- `repositories/`: 데이터 접근 계층(확장 예정)
- `integrations/`: 외부 API 연동 계층(확장 예정)

## 실행

```bash
cd apps/api
uvicorn main:app --reload
```

헬스 체크:

- `GET /api/v1/health` -> `{ "status": "ok" }`
