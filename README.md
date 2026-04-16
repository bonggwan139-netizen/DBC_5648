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
NEXT_PUBLIC_VWORLD_API_KEY=your_vworld_key
NEXT_PUBLIC_VWORLD_REFERRER=https://dbc-5648.vercel.app
NEXT_PUBLIC_VWORLD_DOMAIN=dbc-5648.vercel.app
NEXT_PUBLIC_VWORLD_3D_BOOTSTRAP_URL=https://map.vworld.kr/js/webglMapInit.js.do
NEXT_PUBLIC_VWORLD_3D_VERSION=2.0
```

> Keep database credentials (e.g. PostGIS password) as server-only env variables without `NEXT_PUBLIC_`.

For this repository, a temporary fallback key/referrer is wired in `apps/web/src/config/env.ts`; set `NEXT_PUBLIC_VWORLD_API_KEY` in Vercel to override it per environment.
