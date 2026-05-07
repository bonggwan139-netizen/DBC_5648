# DBC-5648

DBC-5648 is a web-based urban planning analysis project.

The main service, **DBC-MAP**, is designed as a practical spatial analysis workspace for urban planning review.  
It aims to support site understanding, parcel-based review, map interaction, land/building information analysis, and report-oriented workflows.

> Current focus: layout-first rebuilding and stable expansion of the DBC-MAP service shell.

---

## 1. Project Overview

DBC-MAP is being built as a Korean urban planning analysis web service.

The long-term direction is:

```text
Map-based site selection
→ Parcel / district selection
→ Land and building information analysis
→ Urban planning review support
→ Report-ready output
```

The project prioritizes a stable screen structure first, then adds functions and data connections step by step.

---

## 2. Current Architecture

```text
User Browser
→ Next.js Web App on Vercel
→ Map / UI / Interaction Layer
→ Next.js API Routes and Rewrites
→ External FastAPI Analysis API
→ PostGIS Spatial Database
→ JSON Analysis Result
→ Web-based Analysis Panel / Report UI
```

### Main responsibilities

| Area | Responsibility |
|---|---|
| Web App | Page layout, map UI, user interactions, panels, client-side workflow |
| VWorld Integration | Base map, cadastral/map data request flow, map-related API proxy |
| Analysis API | Parcel inclusion, land register, basic land information, building information, report data |
| PostGIS | Spatial data storage and geometry-based analysis |
| Report Layer | Future document/download-oriented output |

---

## 3. Repository Structure

```text
DBC_5648/
├─ README.md
└─ apps/
   └─ web/
      ├─ package.json
      ├─ next.config.ts
      ├─ src/
      │  ├─ app/
      │  │  ├─ api/
      │  │  │  └─ vworld/
      │  │  │     └─ data/
      │  │  │        └─ route.ts
      │  │  ├─ portfolio/
      │  │  │  └─ dbc-map/
      │  │  └─ ...
      │  ├─ components/
      │  │  └─ service/
      │  │     └─ map/
      │  ├─ data/
      │  │  └─ projects.ts
      │  └─ ...
      └─ ...
```

This repository currently focuses on the **frontend web application**.

The analysis API and spatial database are operated separately and connected through controlled API routes or rewrites.

---

## 4. Web App

### Stack

| Category | Stack |
|---|---|
| Framework | Next.js App Router |
| Language | TypeScript |
| UI | React |
| Styling | Tailwind CSS |
| Motion | Framer Motion |
| Spatial / File Utilities | Turf.js, shpjs, xlsx |

### Main Routes

| Route | Description |
|---|---|
| `/` | Main homepage |
| `/portfolio` | Portfolio selection page |
| `/portfolio/dbc-map` | DBC-MAP urban planning analysis service page |
| `/api/vworld/data` | Server-side proxy route for VWorld Data API |

---

## 5. Local Development

```bash
cd apps/web
npm install
npm run check:no-legacy-vworld
npm run dev
```

Open:

```text
http://localhost:3000
```

Build:

```bash
npm run build
```

Start production build locally:

```bash
npm run start
```

---

## 6. VWorld Integration

DBC-MAP uses VWorld as a major map and spatial information source.

The current project direction is to keep the VWorld integration simple and stable.

### Important rule

```text
Do not reintroduce legacy VWorld WFS flow.
Use the maintained VWorld Data API proxy flow instead.
```

The repository includes a check script:

```bash
npm run check:no-legacy-vworld
```

This script blocks deprecated VWorld WFS references such as:

```text
api/vworld/wfs
req/wfs
SERVICE=WFS
VWORLD_WFS_
```

### VWorld Data API route

The VWorld Data API proxy is handled by:

```text
apps/web/src/app/api/vworld/data/route.ts
```

This route is designed to:

- keep VWorld Data API requests server-side
- normalize FeatureCollection responses
- handle known VWorld error codes
- reduce upstream timeout/socket issues
- avoid exposing raw upstream details in production responses

---

## 7. Environment Variables

Set environment variables in the appropriate environment.

For local development, use:

```text
apps/web/.env.local
```

Example:

```bash
NEXT_PUBLIC_ENABLE_MAP_SERVICE=true
NEXT_PUBLIC_VWORLD_API_KEY=your_vworld_key
NEXT_PUBLIC_VWORLD_REFERRER=http://localhost:3000
NEXT_PUBLIC_VWORLD_DOMAIN=http://localhost:3000
NEXT_PUBLIC_VWORLD_3D_BOOTSTRAP_URL=https://map.vworld.kr/js/webglMapInit.js.do
NEXT_PUBLIC_VWORLD_3D_VERSION=3.0

VWORLD_API_KEY=optional_server_side_alias
VWORLD_DOMAIN=http://localhost:3000
```

For production, configure the corresponding values in Vercel Environment Variables.

> Never commit real API keys, database credentials, server IPs, SSH information, or private infrastructure details.

---

## 8. Analysis API Integration

DBC-MAP is designed to communicate with an external FastAPI-based analysis service.

The analysis API is responsible for workflows such as:

| API Area | Purpose |
|---|---|
| Health Check | API status check |
| Land Register Analysis | Parcel inclusion and land register-style result generation |
| Basic Information | Land category, area summary, official price, ownership, terrain, road-side analysis |
| Building Information | Building use, structure, floor, age, area, coverage ratio, floor area ratio analysis |
| Report Generation | Report-oriented data and document generation workflow |

The web app should call analysis endpoints through the web application layer, not by scattering backend URLs directly inside UI components.

---

## 9. Development Principles

This project follows a layout-first rebuilding strategy.

### Current build order

```text
1. Confirm screen layout
2. Split layout into stable components
3. Add input UI on top of the layout
4. Connect user interactions
5. Connect data and analysis functions
6. Connect backend/API
7. Add authentication, saving, and advanced analysis later
```

### Core principles

| Principle | Description |
|---|---|
| Layout First | Do not attach new features before the base screen structure is stable |
| Minimal Changes | Prefer small, scoped changes over large refactors |
| No Legacy Regression | Do not revive deprecated VWorld WFS code paths |
| Public/Private Separation | Keep public README clean and move sensitive operation notes to private documentation |
| Expandable Structure | Keep the project easy to extend for parcels, buildings, reports, and planning data |

---

## 10. AI Collaboration Rules

This project may use AI-assisted development workflows.

When working on this repository:

1. Read the existing structure before editing.
2. Make the smallest possible change for the requested task.
3. Do not change confirmed layout structure unless the task explicitly asks for it.
4. Do not modify VWorld key flow or proxy structure without a specific reason.
5. Do not add secrets or private infrastructure information to the repository.
6. Run the relevant checks before committing.

Recommended check before development:

```bash
npm run check:no-legacy-vworld
```

Recommended check before deployment:

```bash
npm run build
```

---

## 11. Current Status

| Area | Status |
|---|---|
| Web app shell | In progress |
| DBC-MAP route | Available |
| VWorld Data API proxy | Available |
| Layout-first rebuild | In progress |
| Analysis API connection | Designed / partially connected |
| Land register workflow | Designed / connected through analysis API flow |
| Building information workflow | Designed for analysis API expansion |
| Report output | Planned / partially designed |
| Authentication | Later phase |
| User saving/history | Later phase |

---

## 12. Roadmap

```text
Phase 1. Stabilize DBC-MAP screen layout
Phase 2. Split UI into clear layout components
Phase 3. Add search, selection, and input UI
Phase 4. Connect map interactions and parcel selection
Phase 5. Connect analysis API workflows
Phase 6. Expand land/building/report data strategy
Phase 7. Add authentication, saving, and advanced analysis
```

---

## 13. Security Notes

Do not commit:

```text
.env
.env.local
API keys
database credentials
server IPs
SSH usernames
private VM paths
database passwords
internal operation commands
```

Public documentation should describe the architecture without exposing private infrastructure.

Sensitive operation notes should be kept in private project documentation.

---

## 14. License

Private / Internal project unless otherwise specified.