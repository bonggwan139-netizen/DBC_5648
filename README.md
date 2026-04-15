# 도시계획분석 웹사이트 (초기 뼈대 리셋)

이 저장소는 **새로 다시 시작할 수 있는 최소 모노레포 골격**만 유지합니다.

현재는 구현 코드/UI/API/GIS/DB 연결을 포함하지 않으며,
폴더 구조만 유지한 상태에서 다음 단계 설계를 다시 진행할 수 있도록 정리되어 있습니다.

## 최상위 폴더 구조

```text
.
├─ apps/
│  ├─ web/
│  │  ├─ public/
│  │  └─ src/
│  │     ├─ app/
│  │     ├─ features/
│  │     └─ shared/
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

## 유지 원칙

- 폴더 구조만 유지하고 내부는 `.gitkeep` 중심으로 최소화
- 기능 구현 코드는 이후 단계에서 다시 작성
- 로그인/지도/DB/배포 고도화는 현재 범위에서 제외

## 메모

- `docs`, `scripts`, `infra`는 구조 보존 목적의 placeholder 상태입니다.
- 환경변수는 `.env.example`에서 최소 항목만 제공합니다.
