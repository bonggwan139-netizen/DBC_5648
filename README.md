# 도시계획분석 웹사이트 (Monorepo Skeleton)

실험용 프로젝트를 빠르게 시작하기 위한 **초기 뼈대**입니다.
현재 단계에서는 로그인, 지도, DB 연결 없이도 개발을 시작할 수 있게 구조만 준비합니다.

---

## 1) 폴더 트리

```text
.
├─ apps/
│  └─ web/
│     ├─ public/
│     └─ src/
│        ├─ app/
│        ├─ features/
│        └─ shared/
├─ services/
│  └─ api/
│     └─ src/
│        ├─ modules/
│        └─ shared/
├─ packages/
│  ├─ config/
│  ├─ types/
│  └─ ui/
├─ docs/
├─ scripts/
├─ infra/
├─ .env.example
└─ README.md
```

---

## 2) 폴더 설명 (한 줄)

| 폴더 | 설명 |
|---|---|
| `apps/web` | 로그인 없이도 바로 띄울 수 있는 프론트엔드 앱(초기 UI 실험용) |
| `apps/web/src/app` | 라우팅/페이지 엔트리 등 앱 레벨 구성 |
| `apps/web/src/features` | 기능 단위(예: 대시보드, 분석패널)로 분리할 영역 |
| `apps/web/src/shared` | 공통 유틸, 상수, 훅, 컴포넌트 모음 |
| `services/api` | 향후 백엔드 API를 붙일 서비스 영역(현재는 골격만) |
| `services/api/src/modules` | 도메인 모듈 단위 API 코드 위치 |
| `services/api/src/shared` | API 공통 설정/유틸/미들웨어 위치 |
| `packages/ui` | 프론트 여러 앱에서 재사용할 UI 컴포넌트 패키지 |
| `packages/types` | 프론트/백엔드 공용 타입 정의 |
| `packages/config` | ESLint/TSConfig 등 공통 설정 패키지 |
| `docs` | 기획, 요구사항, 화면정의, 아키텍처 노트 문서 |
| `scripts` | 개발 자동화 스크립트(초기 세팅, 체크 스크립트 등) |
| `infra` | 배포 이전 단계의 인프라 템플릿/메모(완성 설정 아님) |

---

## 3) README 초안

### 프로젝트 목표
- 도시계획분석용 웹서비스의 초기 구조를 빠르게 세팅한다.
- 비용 없는 방향을 우선한다(로컬 실행 + 오픈소스 중심).
- 초기에는 로그인 없이도 핵심 화면/흐름을 먼저 검증한다.

### 현재 범위(이번 단계)
- 모노레포 초기 폴더 구조 정의
- 문서/환경변수 샘플 파일 준비
- 기능별 폴더 분리로 파일 비대화 방지

### 현재 비범위(이번 단계에서 제외)
- 로그인 구현
- 지도(GIS) 기능 구현
- DB 연결
- 배포 설정 완료

### 앞으로 붙이기 쉬운 확장 포인트
- 인증: `services/api/src/modules/auth`, `apps/web/src/features/auth`
- 데이터 저장: `services/api/src/modules/*` + `packages/types`
- GIS: `apps/web/src/features/map` (지도 라이브러리 추후 선택)

### 개발 원칙(초기)
- 기능 단위로 폴더를 나누고, 공통은 `shared`로 모은다.
- 거대한 단일 파일 대신 feature 단위로 분해한다.
- 기술 확정 전에는 과도한 의존성 도입을 피한다.

---

## 4) `.env.example` 초안

아래 파일을 루트 `.env.example`로 사용합니다.

```env
# =========================
# Global
# =========================
NODE_ENV=development

# =========================
# Web (apps/web)
# 로그인 없이 시작 가능한 공개 모드 기본값
# =========================
WEB_PORT=3000
VITE_APP_NAME=urban-planning-lab
VITE_ENABLE_AUTH=false
VITE_ENABLE_MAP=false
VITE_API_BASE_URL=http://localhost:4000

# =========================
# API (services/api)
# 현재는 미연결 골격. 추후 DB/인증 붙일 때 확장
# =========================
API_PORT=4000
API_PREFIX=/api
API_ENABLE_AUTH=false
API_ENABLE_DB=false

# =========================
# Optional future flags
# =========================
FEATURE_FLAG_GIS=false
FEATURE_FLAG_SCENARIO_SIMULATION=false
```

---

## 빠른 시작(초안)

> 실제 실행 명령은 기술스택 확정 후 업데이트 예정입니다.

1. 저장소 클론
2. `.env.example`을 복사해 `.env` 생성
3. `apps/web`부터 최소 실행 환경 구성
4. 화면/기능 단위로 `features`부터 개발 시작

