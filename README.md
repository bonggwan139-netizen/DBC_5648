# DBC-5648

DBC-5648 is a web-based urban planning analysis project.

The main service in this repository is **DBC-MAP**, a map-based urban planning analysis workspace for Korean urban planning practice.

This README documents the **current implemented structure** of the project so that future contributors and AI-assisted coding sessions can understand the existing screen, feature, API, and data flow before making changes.

---

## 1. Current Project Summary

DBC-MAP is not a blank prototype.

The current service already includes:

```text
Portfolio route
→ DBC-MAP workspace
→ Map view
→ Address search
→ Zone selection
→ Parcel / Draw / SHP import
→ Land register analysis
→ Site analysis panels
→ Building information analysis panels
→ Word report download flow
```

The purpose of this README is to record the current project structure clearly before adding more features.

---

## 2. Main Routes

| Route | Purpose |
|---|---|
| `/` | Main homepage |
| `/portfolio` | Portfolio selection page |
| `/portfolio/dbc-map` | DBC-MAP urban planning analysis workspace |
| `/api/vworld/data` | VWorld Data API proxy route |

The main DBC-MAP page is located at:

```text
apps/web/src/app/portfolio/dbc-map/page.tsx
```

The DBC-MAP page currently wraps the workspace with these providers:

```text
MapSearchProvider
ZoneSelectionProvider
SiteAnalysisProvider
LandRegisterProvider
```

These providers support search state, zone selection state, site analysis state, and land register state.

---

## 3. Current Screen Structure

```text
DBC-MAP Page
├─ Left Collapsible Panel
│  ├─ Service title
│  ├─ Address / parcel search
│  ├─ Zone selection
│  │  ├─ Parcel mode
│  │  ├─ Draw mode
│  │  ├─ SHP ZIP import
│  │  ├─ Confirm
│  │  ├─ Undo
│  │  └─ Cancel
│  ├─ Land Register button
│  ├─ Site Analysis
│  │  ├─ Basic Information
│  │  └─ Location Analysis
│  └─ Report
│     ├─ Word download
│     └─ PDF placeholder
│
└─ Map Area
   ├─ 2D map view
   ├─ 3D map view
   ├─ Map mode switch
   ├─ Land Register overlay
   ├─ Site Analysis overlay
   └─ Site Analysis detail panel
```

The screen structure is already implemented.

Future work should avoid changing the existing screen structure unless the task explicitly requires it.

---

## 4. Frontend Stack

The web app is located in:

```text
apps/web
```

| Category | Stack |
|---|---|
| Framework | Next.js App Router |
| Language | TypeScript |
| UI | React |
| Styling | Tailwind CSS |
| Motion | Framer Motion |
| Spatial utilities | Turf.js |
| SHP import | shpjs |
| Excel export | xlsx |

---

## 5. Important Frontend Files

### DBC-MAP page and layout

```text
apps/web/src/app/portfolio/dbc-map/page.tsx
apps/web/src/components/service/CollapsiblePanel.tsx
apps/web/src/components/service/MapView.tsx
apps/web/src/components/service/map/Map2DView.tsx
apps/web/src/components/service/map/Map3DView.tsx
apps/web/src/components/service/map/MapModeSwitch.tsx
```

### Analysis-related files

```text
apps/web/src/components/service/map/analysis/LandRegisterOverlay.tsx
apps/web/src/components/service/map/analysis/SiteAnalysisOverlay.tsx
apps/web/src/components/service/map/analysis/SiteAnalysisDetailPanel.tsx
apps/web/src/components/service/map/analysis/landRegisterState.tsx
apps/web/src/components/service/map/analysis/siteAnalysisState.tsx
```

### Zone selection-related files

```text
apps/web/src/components/service/map/zone-selection/zoneSelectionState.tsx
apps/web/src/components/service/map/zone-selection/useZoneSelectionPanel.ts
apps/web/src/components/service/map/zone-selection/zoneSelectionShpImport.ts
```

### Search-related files

```text
apps/web/src/components/service/map/search/mapSearchState.tsx
```

### VWorld-related files

```text
apps/web/src/app/api/vworld/data/route.ts
apps/web/src/components/service/map/config/publicEnv.ts
apps/web/src/components/service/map/config/serverEnv.ts
apps/web/src/components/service/map/config/constants.ts
```

---

## 6. Implemented User Flow

```text
1. User opens /portfolio/dbc-map
2. User searches an address or parcel
3. User selects a zone by Parcel, Draw, or SHP import
4. User confirms the selected zone
5. Analysis buttons become available
6. User opens Land Register or Site Analysis
7. The frontend calls analysis API routes
8. Results are displayed in overlays or side panels
9. User can download Excel or Word report depending on the feature
```

---

## 7. Implemented Feature Areas

| Area | Current State |
|---|---|
| Address search | Implemented in left panel |
| Zone selection | Parcel / Draw / SHP ZIP import flow exists |
| Zone confirm / undo / cancel | Implemented |
| 2D / 3D map switch | Implemented |
| VWorld Data API proxy | Implemented |
| Land register analysis | Implemented through analysis API flow |
| Land register overlay | Implemented |
| Land register Excel download | Implemented |
| Site Analysis menu | Implemented |
| Basic information panel | Implemented |
| Building information panel | Implemented |
| Location analysis menu | Implemented as menu structure |
| Word report download | Implemented |
| PDF report download | Placeholder / disabled |

---

## 8. Site Analysis Structure

### Basic Information

```text
Basic Information
├─ Location Information
├─ Land Information
│  ├─ Land Category
│  ├─ Ownership
│  ├─ Area Summary
│  ├─ Official Price
│  ├─ Terrain Shape
│  └─ Road Side
├─ Building Information
│  ├─ Use
│  ├─ Structure
│  ├─ Floor
│  ├─ Age
│  ├─ Gross Floor Area
│  ├─ Building Coverage Ratio
│  └─ Floor Area Ratio
└─ Urban Planning Information
   ├─ Master plan / living area
   ├─ Zoning / district / facility
   ├─ Development permit / district unit plan
   ├─ Development area information
   └─ Public regulation information
```

### Location Analysis

```text
Location Analysis
├─ Natural Environment Analysis
├─ Land / Building Analysis
└─ Urban Planning Analysis
```

Some location analysis items are currently structured as menu items and may not yet be connected to full analysis logic.

---

## 9. Analysis API Structure

The frontend is designed to call analysis endpoints through the web application layer.

The backend analysis API is FastAPI-based and is organized around:

```text
/health
/analysis/land-register
/analysis/basic-info/*
/analysis/building-info/*
/analysis/report/word
```

### Current backend API areas

| API Area | Endpoint |
|---|---|
| Health | `GET /health` |
| Land Register | `POST /analysis/land-register` |
| Basic Info | `POST /analysis/basic-info/land-category` |
| Basic Info | `POST /analysis/basic-info/ownership` |
| Basic Info | `POST /analysis/basic-info/area-summary` |
| Basic Info | `POST /analysis/basic-info/official-price` |
| Basic Info | `POST /analysis/basic-info/terrain-shape` |
| Basic Info | `POST /analysis/basic-info/road-side` |
| Building Info | `POST /analysis/building-info/use` |
| Building Info | `POST /analysis/building-info/structure` |
| Building Info | `POST /analysis/building-info/floor` |
| Building Info | `POST /analysis/building-info/age` |
| Building Info | `POST /analysis/building-info/gross-floor-area` |
| Building Info | `POST /analysis/building-info/building-coverage-ratio` |
| Building Info | `POST /analysis/building-info/floor-area-ratio` |
| Report | `POST /analysis/report/word` |

Do not hardcode private backend URLs inside UI components.

---

## 10. VWorld Integration

DBC-MAP uses VWorld for map and spatial information workflows.

The current maintained VWorld Data API proxy is:

```text
apps/web/src/app/api/vworld/data/route.ts
```

Important rule:

```text
Do not reintroduce deprecated VWorld WFS routes or references.
Use the maintained VWorld Data API proxy flow.
```

The repository includes this check:

```bash
npm run check:no-legacy-vworld
```

This check blocks references such as:

```text
api/vworld/wfs
req/wfs
SERVICE=WFS
VWORLD_WFS_
```

---

## 11. Local Development

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

## 12. Environment Variables

For local development:

```text
apps/web/.env.local
```

Example variable names:

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

Never commit real keys or private infrastructure values.

---

## 13. Development Rules for Future Work

Before changing this repository:

1. Read this README first.
2. Check the existing DBC-MAP page and component structure.
3. Do not change the existing screen structure unless explicitly requested.
4. Make the smallest possible change for the requested task.
5. Do not revive legacy VWorld WFS flows.
6. Do not hardcode secrets, server IPs, database credentials, or private paths.
7. Keep public README content separate from private operation notes.
8. Run the relevant check before committing.

Recommended check:

```bash
npm run check:no-legacy-vworld
```

Recommended build check:

```bash
npm run build
```

---

## 14. Sensitive Information Policy

This public README must not include:

```text
API keys
database credentials
server IPs
SSH usernames
private VM paths
database passwords
internal operation commands
local private paths
```

Sensitive operation notes should be stored only in private project documentation.

---

## 15. Documentation Role

This README is the public structure reference for the project.

Private Notion documentation should contain:

```text
VM operation details
PostGIS table details
private deployment notes
server commands
database credentials
detailed troubleshooting history
AI collaboration prompts
```

README and Notion should not serve the same role.

```text
README = public structure reference
Notion = private operation and planning reference
```

---

## 16. License

Private / Internal project unless otherwise specified.