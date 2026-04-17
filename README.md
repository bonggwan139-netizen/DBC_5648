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
NEXT_PUBLIC_VWORLD_API_KEY=your_vworld_key
NEXT_PUBLIC_VWORLD_REFERRER=https://dbc-5648.vercel.app
NEXT_PUBLIC_VWORLD_DOMAIN=dbc-5648.vercel.app
NEXT_PUBLIC_VWORLD_3D_BOOTSTRAP_URL=https://map.vworld.kr/js/webglMapInit.js.do
NEXT_PUBLIC_VWORLD_3D_VERSION=3.0
VWORLD_API_KEY=optional_alias_of_same_key
VWORLD_DOMAIN=dbc-5648.vercel.app
```

`/portfolio/dbc-map` 지적도(WFS)는 브라우저에서 VWorld를 직접 호출하지 않고, 서버 프록시(`/api/vworld/wfs`)를 통해 호출됩니다.
키는 map config에서 단일 흐름으로 관리하며, 기본적으로 `NEXT_PUBLIC_VWORLD_API_KEY`를 기준으로 2D/3D와 WFS 프록시가 함께 사용합니다.
(`VWORLD_API_KEY`는 서버 측 별칭으로만 선택 사용)

현재 레포에는 Vercel env를 GitHub에서 자동 주입하는 워크플로우가 없습니다.
- 베이스맵/WFS는 `NEXT_PUBLIC_VWORLD_API_KEY`를 기준으로 동작합니다.
- `NEXT_PUBLIC_VWORLD_API_KEY`가 없을 때 repository default public dev key로 동작합니다.
- 운영에서는 키 회전을 위해 `NEXT_PUBLIC_VWORLD_API_KEY`를 스코프별로 명시 설정하는 것을 권장합니다.

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

### 배포 후 지도 미표시 시 확인 순서
1. 문제 URL이 Production인지 Preview인지 먼저 확인합니다.
2. Vercel > Project > Settings > Environment Variables에서 해당 Scope에 `NEXT_PUBLIC_VWORLD_API_KEY`가 있는지 확인합니다.
3. (선택) 서버 별칭을 쓰는 경우 `VWORLD_API_KEY`도 같은 값으로 설정합니다.
4. env를 추가/수정했다면 기존 배포는 무효이므로 새 배포를 실행합니다.
5. 새 배포 URL에서 `/portfolio/dbc-map` 접속 후 브라우저 콘솔의 `[map-env-guard]` 경고가 사라졌는지 확인합니다.
