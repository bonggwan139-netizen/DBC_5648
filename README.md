# DBC-5648 Monorepo

Desktop-first portfolio web skeleton built with Next.js App Router, TypeScript, Tailwind CSS, and Framer Motion.

## Web app (`apps/web`)

### Stack
- Next.js App Router
- TypeScript
- Tailwind CSS
- Framer Motion

### Routes
- `/` : main homepage
- `/portfolio` : portfolio selection page
- `/portfolio/dbc-map` : urban planning analysis service shell page

### Run
```bash
cd apps/web
npm install
npm run dev
```

Open (local): `http://localhost:3000`

Production: deploy on Vercel and use the generated `https://<project>.vercel.app` URL.

### VWorld map environment variables
Set these in Vercel (Production) or local `.env` if needed:

```bash
NEXT_PUBLIC_ENABLE_MAP_SERVICE=true
NEXT_PUBLIC_VWORLD_API_KEY=your_public_vworld_key
NEXT_PUBLIC_VWORLD_REFERRER=https://dbc-5648.vercel.app
NEXT_PUBLIC_VWORLD_DOMAIN=dbc-5648.vercel.app
NEXT_PUBLIC_VWORLD_3D_BOOTSTRAP_URL=https://map.vworld.kr/js/webglMapInit.js.do
NEXT_PUBLIC_VWORLD_3D_VERSION=3.0
VWORLD_API_KEY=your_server_only_vworld_key
VWORLD_DOMAIN=dbc-5648.vercel.app
```

`/portfolio/dbc-map` 지적도(WFS)는 브라우저에서 VWorld를 직접 호출하지 않고, 서버 프록시(`/api/vworld/wfs`)를 통해 호출됩니다.
따라서 WFS 키는 `VWORLD_API_KEY`(server-only)로 설정해야 하며, 클라이언트 번들에는 포함되지 않습니다.

Map 관련 env/상수/서버 설정 진입점:
- `apps/web/src/components/service/map/config/publicEnv.ts`
- `apps/web/src/components/service/map/config/serverEnv.ts`
- `apps/web/src/components/service/map/config/constants.ts`

`NEXT_PUBLIC_VWORLD_API_KEY`가 비어 있으면 지도 렌더링 가드가 동작하며, 사용자에게는 일반 안내 문구가 표시되고 개발자 콘솔에는 누락 env 키가 출력됩니다.

### Vercel 운영 체크 (중요)
- 이 레포는 monorepo이며 지도 앱은 `apps/web`(Next.js)에서 빌드됩니다.
- `NEXT_PUBLIC_*` 변수는 **클라이언트 번들 빌드 시점에 고정**됩니다.
- 따라서 Vercel에서 `NEXT_PUBLIC_VWORLD_API_KEY`를 추가/수정했다면 **반드시 새 배포(redeploy)** 가 필요합니다.
- Vercel Environment Variable Scope를 확인하세요:
  - Production URL 확인 시 → Production scope에 값 필요
  - Preview URL 확인 시 → Preview scope에 값 필요
  - Local 개발 시 → `apps/web/.env.local`에 값 필요
- 빠른 진단:
  - 브라우저 콘솔 `[map-env-guard]` 로그 확인
  - 개발 환경에서 `/api/map/env-status` 호출 시 서버가 env를 보고 있는지 확인
