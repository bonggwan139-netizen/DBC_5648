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
