"use client";

import { useEffect, useRef, useState } from "react";
import { isMapRenderable, logPublicMapEnvDiagnostics, mapPublicEnv } from "./config/publicEnv";
import {
  MAP_DATA_BBOX_COORD_PRECISION,
  MAP_DATA_BBOX_KEY_PRECISION,
  MAP_DATA_MAX_BBOX_AREA,
  MAP_DATA_MAX_BBOX_HEIGHT,
  MAP_DATA_MAX_BBOX_WIDTH,
  MAP_DATA_MIN_ZOOM,
  MAP_DATA_MOVEEND_DEBOUNCE_MS,
  MAP_DEFAULT_CENTER,
  VWORLD_DATA_DEFAULT_SIZE
} from "./config/constants";
import { loadMapLibre, type MapLibreMap } from "./maplibreLoader";
import { createVworldStyle, ROAD_LAYER_ID, SATELLITE_LAYER_ID } from "./vworldStyle";
import type { Base2DStyle } from "./types";
import { MapEnvGuardNotice } from "./MapEnvGuardNotice";
import { addCadastralLayers, CADASTRAL_SOURCE_ID } from "./cadastralLayerStyle";
import {
  addZoneSelectionOverlayLayers,
  ZONE_CONFIRMED_SOURCE_ID,
  ZONE_DRAFT_GEOMETRY_SOURCE_ID,
  ZONE_DRAFT_VERTEX_SOURCE_ID
} from "./zone-selection/zoneSelectionMapLayers";
import { useMapSearch } from "./search/mapSearchState";
import { SiteAnalysisDetailPanel } from "./analysis/SiteAnalysisDetailPanel";
import { SiteAnalysisOverlay } from "./analysis/SiteAnalysisOverlay";
import {
  getPlanningSpecialPurposeAreaPatternImageId,
  getPlanningSpecialPurposeAreaPatternLayerId,
  PLANNING_SPECIAL_PURPOSE_AREA_PATTERNS,
  type PlanningSpecialPurposeAreaPattern
} from "./analysis/planningSpecialPurposeAreaStyle";
import { createEmptySiteAnalysisMapFeatureCollection } from "./analysis/siteAnalysisMapFeatures";
import { useSiteAnalysis, type NaturalEnvironmentMapOverlay } from "./analysis/siteAnalysisState";
import { createEmptyFeatureCollection } from "./zone-selection/zoneSelectionGeometry";
import { ZoneSelectionSearchPanel } from "./zone-selection/ZoneSelectionSearchPanel";
import { useZoneSelectionSearch } from "./zone-selection/zoneSelectionSearchState";
import { useZoneSelectionMap } from "./zone-selection/useZoneSelectionMap";
import type { CadastralFeatureCollection, ParcelProps, ZoneGeometry } from "./zone-selection/zoneSelectionTypes";

type Map2DViewProps = {
  showStyleSelector: boolean;
};

type CadastralFetchMeta = {
  featureCount: number;
  cappedBySize: boolean;
};

type BoundsRequestInfo = {
  blockedReason: "bbox-invalid" | "bbox-too-large" | null;
  bbox: string | null;
  key: string;
};

type DataApiErrorPayload = {
  error?: string;
  errorCode?: string;
  message?: string;
};

type ParcelAreaApiPayload = {
  area?: number | string | null;
  error?: string;
  errorCode?: string;
  message?: string;
};

type MapClickEventLike = {
  point?: {
    x?: number;
    y?: number;
  };
  lngLat?: {
    lng?: number;
    lat?: number;
  };
  originalEvent?: {
    button?: number;
    preventDefault?: () => void;
  };
};

const BBOX_NOTICE_MESSAGE = "지적 데이터를 보려면 더 확대해 주세요.";
const SITE_ANALYSIS_THEMATIC_SOURCE_ID = "site-analysis-thematic-map-features";
const SITE_ANALYSIS_THEMATIC_FILL_LAYER_ID = "site-analysis-thematic-fill";
const SITE_ANALYSIS_THEMATIC_POINT_LAYER_ID = "site-analysis-thematic-point";
const SITE_ANALYSIS_THEMATIC_OUTLINE_LAYER_ID = "site-analysis-thematic-outline";
const PLANNING_DATA_GROUP_SPECIAL_PURPOSE_AREA = "specialPurposeArea";
const PLANNING_DATA_DEFAULT_SIZE = 1000;
const PLANNING_SPECIAL_PURPOSE_AREA_SOURCE_ID = "planning-vworld-special-purpose-area-source";
const PLANNING_SPECIAL_PURPOSE_AREA_FILL_LAYER_ID = "planning-vworld-special-purpose-area-fill";
const PLANNING_SPECIAL_PURPOSE_AREA_OUTLINE_LAYER_ID = "planning-vworld-special-purpose-area-outline";
const NATURAL_ENVIRONMENT_RASTER_SOURCE_ID = "natural-environment-raster-source";
const NATURAL_ENVIRONMENT_RASTER_LAYER_ID = "natural-environment-raster-layer";
const NATURAL_ENVIRONMENT_CONTOUR_SOURCE_ID = "natural-environment-contour-source";
const NATURAL_ENVIRONMENT_CONTOUR_LINE_LAYER_ID = "natural-environment-contour-line";
const ZONE_CONFIRMED_LINE_LAYER_ID = "zone-confirmed-line";
const ZONE_SEARCH_SELECTION_TIMEOUT_MS = 7000;
const ZONE_SEARCH_SELECTION_RETRY_MS = 400;

class DataApiRequestError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "DataApiRequestError";
    this.status = status;
    this.code = code;
  }
}

function createEmptyCadastralFeatureCollection(): CadastralFeatureCollection {
  return createEmptyFeatureCollection<ZoneGeometry, ParcelProps>();
}

function isCoordinateWithinMapBounds(map: MapLibreMap, coordinate: [number, number]) {
  const [lng, lat] = coordinate;
  const bounds = map.getBounds();
  return (
    lng >= bounds.getWest() &&
    lng <= bounds.getEast() &&
    lat >= bounds.getSouth() &&
    lat <= bounds.getNorth()
  );
}

function toFeatureCollection(data: unknown): CadastralFeatureCollection {
  if (
    data &&
    typeof data === "object" &&
    (data as { type?: string }).type === "FeatureCollection" &&
    Array.isArray((data as { features?: unknown[] }).features)
  ) {
    return data as CadastralFeatureCollection;
  }

  return createEmptyCadastralFeatureCollection();
}

function pickParcelSelectionKey(props: ParcelProps) {
  if (props.pnu !== undefined && props.pnu !== null) {
    return String(props.pnu);
  }

  if (props.PNU !== undefined && props.PNU !== null) {
    return String(props.PNU);
  }

  if (props.parcel_id !== undefined && props.parcel_id !== null) {
    return String(props.parcel_id);
  }

  return null;
}

function pickParcelValue(props: ParcelProps, candidates: string[]) {
  const found = candidates.find((key) => props[key] !== undefined && props[key] !== null);
  return found ? props[found] : null;
}

function parseNumericValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.replace(/,/g, "").trim();
    if (!normalized) {
      return null;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function roundCoord(value: number, precision: number) {
  return Number(value.toFixed(precision));
}

function buildBoundsRequestInfo(map: MapLibreMap): BoundsRequestInfo {
  const bounds = map.getBounds();
  const west = roundCoord(bounds.getWest(), MAP_DATA_BBOX_COORD_PRECISION);
  const south = roundCoord(bounds.getSouth(), MAP_DATA_BBOX_COORD_PRECISION);
  const east = roundCoord(bounds.getEast(), MAP_DATA_BBOX_COORD_PRECISION);
  const north = roundCoord(bounds.getNorth(), MAP_DATA_BBOX_COORD_PRECISION);

  const key = [west, south, east, north].map((value) => value.toFixed(MAP_DATA_BBOX_KEY_PRECISION)).join(",");

  if (
    !Number.isFinite(west) ||
    !Number.isFinite(south) ||
    !Number.isFinite(east) ||
    !Number.isFinite(north) ||
    west >= east ||
    south >= north
  ) {
    return {
      blockedReason: "bbox-invalid",
      bbox: null,
      key
    };
  }

  const width = east - west;
  const height = north - south;
  const area = width * height;

  if (width > MAP_DATA_MAX_BBOX_WIDTH || height > MAP_DATA_MAX_BBOX_HEIGHT || area > MAP_DATA_MAX_BBOX_AREA) {
    return {
      blockedReason: "bbox-too-large",
      bbox: null,
      key
    };
  }

  return {
    blockedReason: null,
    bbox: `${west},${south},${east},${north}`,
    key
  };
}

function buildProxyDataUrl(bbox: string) {
  const params = new URLSearchParams({
    bbox,
    size: String(VWORLD_DATA_DEFAULT_SIZE)
  });

  return `/api/vworld/data?${params.toString()}`;
}

async function fetchCadastralFeatureCollection(
  bbox: string,
  signal?: AbortSignal
): Promise<{ fc: CadastralFeatureCollection; meta: CadastralFetchMeta }> {
  const res = await fetch(buildProxyDataUrl(bbox), {
    method: "GET",
    signal,
    cache: "no-store"
  });

  const payload = (await res.json().catch(() => null)) as CadastralFeatureCollection | DataApiErrorPayload | null;

  if (!res.ok) {
    const errorPayload = payload && typeof payload === "object" ? (payload as DataApiErrorPayload) : undefined;
    const code = errorPayload?.errorCode ?? errorPayload?.error;
    const message =
      typeof errorPayload?.message === "string" ? errorPayload.message : `Data API request failed: ${res.status}`;

    throw new DataApiRequestError(message, res.status, code);
  }

  const fc = toFeatureCollection(payload);
  const featureCount = Number(res.headers.get("x-vworld-feature-count") ?? fc.features.length);
  const cappedBySize = res.headers.get("x-vworld-feature-capped") === "true";

  return {
    fc,
    meta: {
      featureCount: Number.isFinite(featureCount) ? featureCount : fc.features.length,
      cappedBySize
    }
  };
}

async function fetchParcelArea(pnu: string, signal?: AbortSignal): Promise<number | null> {
  const params = new URLSearchParams({ pnu });
  const res = await fetch(`/api/vworld/parcel-area?${params.toString()}`, {
    method: "GET",
    signal,
    cache: "no-store"
  });

  const payload = (await res.json().catch(() => null)) as ParcelAreaApiPayload | null;

  if (!res.ok) {
    const errorPayload = payload && typeof payload === "object" ? payload : undefined;
    const code = errorPayload?.errorCode ?? errorPayload?.error;
    const message =
      typeof errorPayload?.message === "string" ? errorPayload.message : `Parcel area API request failed: ${res.status}`;

    throw new DataApiRequestError(message, res.status, code);
  }

  return parseNumericValue(payload?.area);
}

const numberFormatter = new Intl.NumberFormat("ko-KR");

function formatAreaDisplay(area: number | null, isLoading: boolean) {
  if (isLoading) {
    return "불러오는 중...";
  }

  return area === null ? "-" : `${numberFormatter.format(area)}㎡`;
}

function formatCurrencyDisplay(value: unknown) {
  const parsed = parseNumericValue(value);
  return parsed === null ? "-" : `${numberFormatter.format(parsed)}원`;
}

function setGeoJsonSourceData(map: MapLibreMap | null, sourceId: string, data: { type: "FeatureCollection"; features: unknown[] }) {
  const source = map?.getSource(sourceId);
  source?.setData(data);
}

function createEmptyPlanningFeatureCollection() {
  return {
    type: "FeatureCollection" as const,
    features: []
  };
}

function toPlanningFeatureCollection(data: unknown) {
  if (
    data &&
    typeof data === "object" &&
    (data as { type?: string }).type === "FeatureCollection" &&
    Array.isArray((data as { features?: unknown[] }).features)
  ) {
    return data as { type: "FeatureCollection"; features: unknown[] };
  }

  return createEmptyPlanningFeatureCollection();
}

function buildPlanningDataUrl(bbox: string) {
  const params = new URLSearchParams({
    group: PLANNING_DATA_GROUP_SPECIAL_PURPOSE_AREA,
    bbox,
    size: String(PLANNING_DATA_DEFAULT_SIZE)
  });

  return `/api/vworld/planning-data?${params.toString()}`;
}

function removeSiteAnalysisThematicMapLayers(map: MapLibreMap | null) {
  if (!map) {
    return;
  }

  if (map.getLayer(SITE_ANALYSIS_THEMATIC_OUTLINE_LAYER_ID)) {
    map.removeLayer(SITE_ANALYSIS_THEMATIC_OUTLINE_LAYER_ID);
  }

  if (map.getLayer(SITE_ANALYSIS_THEMATIC_POINT_LAYER_ID)) {
    map.removeLayer(SITE_ANALYSIS_THEMATIC_POINT_LAYER_ID);
  }

  if (map.getLayer(SITE_ANALYSIS_THEMATIC_FILL_LAYER_ID)) {
    map.removeLayer(SITE_ANALYSIS_THEMATIC_FILL_LAYER_ID);
  }

  if (map.getSource(SITE_ANALYSIS_THEMATIC_SOURCE_ID)) {
    map.removeSource(SITE_ANALYSIS_THEMATIC_SOURCE_ID);
  }
}

function ensureSiteAnalysisThematicMapLayers(map: MapLibreMap) {
  if (!map.getSource(SITE_ANALYSIS_THEMATIC_SOURCE_ID)) {
    map.addSource(SITE_ANALYSIS_THEMATIC_SOURCE_ID, {
      type: "geojson",
      data: createEmptySiteAnalysisMapFeatureCollection()
    });
  }

  if (!map.getLayer(SITE_ANALYSIS_THEMATIC_FILL_LAYER_ID)) {
    map.addLayer(
      {
        id: SITE_ANALYSIS_THEMATIC_FILL_LAYER_ID,
        type: "fill",
        source: SITE_ANALYSIS_THEMATIC_SOURCE_ID,
        filter: ["in", ["geometry-type"], ["literal", ["Polygon", "MultiPolygon"]]],
        paint: {
          "fill-color": ["get", "color"],
          "fill-opacity": [
            "case",
            ["==", ["get", "analysis_type"], "natural_environment_ecology_nature_map"],
            0.6,
            1
          ]
        }
      },
      map.getLayer(ZONE_CONFIRMED_LINE_LAYER_ID) ? ZONE_CONFIRMED_LINE_LAYER_ID : undefined
    );
  }

  if (!map.getLayer(SITE_ANALYSIS_THEMATIC_OUTLINE_LAYER_ID)) {
    map.addLayer(
      {
        id: SITE_ANALYSIS_THEMATIC_OUTLINE_LAYER_ID,
        type: "line",
        source: SITE_ANALYSIS_THEMATIC_SOURCE_ID,
        filter: ["in", ["geometry-type"], ["literal", ["Polygon", "MultiPolygon"]]],
        paint: {
          "line-color": "#1F2937",
          "line-opacity": [
            "case",
            ["==", ["get", "analysis_type"], "natural_environment_ecology_nature_map"],
            0.55,
            1
          ],
          "line-width": [
            "case",
            ["==", ["get", "analysis_type"], "natural_environment_ecology_nature_map"],
            0.5,
            1
          ]
        }
      },
      map.getLayer(ZONE_CONFIRMED_LINE_LAYER_ID) ? ZONE_CONFIRMED_LINE_LAYER_ID : undefined
    );
  }

  if (!map.getLayer(SITE_ANALYSIS_THEMATIC_POINT_LAYER_ID)) {
    map.addLayer(
      {
        id: SITE_ANALYSIS_THEMATIC_POINT_LAYER_ID,
        type: "circle",
        source: SITE_ANALYSIS_THEMATIC_SOURCE_ID,
        filter: ["==", ["geometry-type"], "Point"],
        paint: {
          "circle-color": ["get", "color"],
          "circle-opacity": 1,
          "circle-radius": 6,
          "circle-stroke-color": "#1F2937",
          "circle-stroke-opacity": 1,
          "circle-stroke-width": 1
        }
      },
      map.getLayer(ZONE_CONFIRMED_LINE_LAYER_ID) ? ZONE_CONFIRMED_LINE_LAYER_ID : undefined
    );
  }
}

function removePlanningSpecialPurposeAreaLayers(map: MapLibreMap | null) {
  if (!map) {
    return;
  }

  if (map.getLayer(PLANNING_SPECIAL_PURPOSE_AREA_OUTLINE_LAYER_ID)) {
    map.removeLayer(PLANNING_SPECIAL_PURPOSE_AREA_OUTLINE_LAYER_ID);
  }

  PLANNING_SPECIAL_PURPOSE_AREA_PATTERNS.forEach((pattern) => {
    const layerId = getPlanningSpecialPurposeAreaPatternLayerId(pattern);
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
  });

  if (map.getLayer(PLANNING_SPECIAL_PURPOSE_AREA_FILL_LAYER_ID)) {
    map.removeLayer(PLANNING_SPECIAL_PURPOSE_AREA_FILL_LAYER_ID);
  }

  if (map.getSource(PLANNING_SPECIAL_PURPOSE_AREA_SOURCE_ID)) {
    map.removeSource(PLANNING_SPECIAL_PURPOSE_AREA_SOURCE_ID);
  }
}

function getPlanningPatternColor(pattern: Exclude<PlanningSpecialPurposeAreaPattern, "none">) {
  if (pattern.startsWith("red-")) {
    return "#FF0000";
  }

  if (pattern.startsWith("green-")) {
    return "#38A800";
  }

  if (pattern.startsWith("purple-")) {
    return "#A900E6";
  }

  return "#000000";
}

function createPlanningPatternImage(pattern: Exclude<PlanningSpecialPurposeAreaPattern, "none">) {
  const size = pattern.endsWith("-dot") ? 16 : 10;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Planning pattern canvas is unavailable.");
  }

  context.clearRect(0, 0, size, size);
  context.strokeStyle = getPlanningPatternColor(pattern);
  context.fillStyle = "transparent";
  context.lineCap = "square";

  if (pattern.endsWith("-horizontal")) {
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(0, size / 2);
    context.lineTo(size, size / 2);
    context.stroke();
  } else if (pattern.endsWith("-diagonal")) {
    context.lineWidth = 0.5;
    [-size, 0, size].forEach((offset) => {
      context.beginPath();
      context.moveTo(offset, size);
      context.lineTo(offset + size, 0);
      context.stroke();
    });
  } else if (pattern.endsWith("-dot")) {
    const radius = 3;
    context.lineWidth = 0.5;
    [
      [size / 2, size / 2],
      [0, 0],
      [size, 0],
      [0, size],
      [size, size]
    ].forEach(([x, y]) => {
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.stroke();
    });
  }

  return context.getImageData(0, 0, size, size);
}

function ensurePlanningSpecialPurposeAreaPatternImages(map: MapLibreMap) {
  PLANNING_SPECIAL_PURPOSE_AREA_PATTERNS.forEach((pattern) => {
    const imageId = getPlanningSpecialPurposeAreaPatternImageId(pattern);
    if (map.hasImage?.(imageId)) {
      return;
    }

    try {
      map.addImage(imageId, createPlanningPatternImage(pattern), { pixelRatio: 1 });
    } catch {
      // The image may already be registered on older MapLibre builds without hasImage typing.
    }
  });
}

function ensurePlanningSpecialPurposeAreaLayers(map: MapLibreMap) {
  if (!map.getSource(PLANNING_SPECIAL_PURPOSE_AREA_SOURCE_ID)) {
    map.addSource(PLANNING_SPECIAL_PURPOSE_AREA_SOURCE_ID, {
      type: "geojson",
      data: createEmptyPlanningFeatureCollection()
    });
  }

  ensurePlanningSpecialPurposeAreaPatternImages(map);
  const beforeLayerId = map.getLayer(ZONE_CONFIRMED_LINE_LAYER_ID) ? ZONE_CONFIRMED_LINE_LAYER_ID : undefined;

  if (!map.getLayer(PLANNING_SPECIAL_PURPOSE_AREA_FILL_LAYER_ID)) {
    map.addLayer(
      {
        id: PLANNING_SPECIAL_PURPOSE_AREA_FILL_LAYER_ID,
        type: "fill",
        source: PLANNING_SPECIAL_PURPOSE_AREA_SOURCE_ID,
        filter: ["in", ["geometry-type"], ["literal", ["Polygon", "MultiPolygon"]]],
        paint: {
          "fill-color": ["get", "__planningFillColor"],
          "fill-opacity": 0.32
        }
      },
      beforeLayerId
    );
  }

  PLANNING_SPECIAL_PURPOSE_AREA_PATTERNS.forEach((pattern) => {
    const layerId = getPlanningSpecialPurposeAreaPatternLayerId(pattern);
    if (map.getLayer(layerId)) {
      return;
    }

    map.addLayer(
      {
        id: layerId,
        type: "fill",
        source: PLANNING_SPECIAL_PURPOSE_AREA_SOURCE_ID,
        filter: [
          "all",
          ["in", ["geometry-type"], ["literal", ["Polygon", "MultiPolygon"]]],
          ["==", ["get", "__planningPattern"], pattern]
        ],
        paint: {
          "fill-pattern": getPlanningSpecialPurposeAreaPatternImageId(pattern),
          "fill-opacity": 0.8
        }
      },
      beforeLayerId
    );
  });

  if (!map.getLayer(PLANNING_SPECIAL_PURPOSE_AREA_OUTLINE_LAYER_ID)) {
    map.addLayer(
      {
        id: PLANNING_SPECIAL_PURPOSE_AREA_OUTLINE_LAYER_ID,
        type: "line",
        source: PLANNING_SPECIAL_PURPOSE_AREA_SOURCE_ID,
        filter: ["in", ["geometry-type"], ["literal", ["Polygon", "MultiPolygon"]]],
        paint: {
          "line-color": ["get", "__planningOutlineColor"],
          "line-opacity": 0.65,
          "line-width": 1
        }
      },
      beforeLayerId
    );
  }
}

function removeNaturalEnvironmentMapLayers(map: MapLibreMap | null) {
  if (!map) {
    return;
  }

  if (map.getLayer(NATURAL_ENVIRONMENT_CONTOUR_LINE_LAYER_ID)) {
    map.removeLayer(NATURAL_ENVIRONMENT_CONTOUR_LINE_LAYER_ID);
  }

  if (map.getLayer(NATURAL_ENVIRONMENT_RASTER_LAYER_ID)) {
    map.removeLayer(NATURAL_ENVIRONMENT_RASTER_LAYER_ID);
  }

  if (map.getSource(NATURAL_ENVIRONMENT_CONTOUR_SOURCE_ID)) {
    map.removeSource(NATURAL_ENVIRONMENT_CONTOUR_SOURCE_ID);
  }

  if (map.getSource(NATURAL_ENVIRONMENT_RASTER_SOURCE_ID)) {
    map.removeSource(NATURAL_ENVIRONMENT_RASTER_SOURCE_ID);
  }
}

function addNaturalEnvironmentMapLayers(map: MapLibreMap, overlay: NonNullable<NaturalEnvironmentMapOverlay>) {
  removeNaturalEnvironmentMapLayers(map);
  const beforeLayerId = map.getLayer(ZONE_CONFIRMED_LINE_LAYER_ID) ? ZONE_CONFIRMED_LINE_LAYER_ID : undefined;

  map.addSource(NATURAL_ENVIRONMENT_RASTER_SOURCE_ID, {
    type: "image",
    url: overlay.raster.data_url,
    coordinates: overlay.raster.coordinates_4326
  });

  map.addLayer(
    {
      id: NATURAL_ENVIRONMENT_RASTER_LAYER_ID,
      type: "raster",
      source: NATURAL_ENVIRONMENT_RASTER_SOURCE_ID,
      paint: {
        "raster-opacity": 1
      }
    },
    beforeLayerId
  );

  map.addSource(NATURAL_ENVIRONMENT_CONTOUR_SOURCE_ID, {
    type: "geojson",
    data: overlay.contours
  });

  map.addLayer(
    {
      id: NATURAL_ENVIRONMENT_CONTOUR_LINE_LAYER_ID,
      type: "line",
      source: NATURAL_ENVIRONMENT_CONTOUR_SOURCE_ID,
      paint: {
        "line-color": "#475569",
        "line-opacity": 0.7,
        "line-width": 0.8
      }
    },
    beforeLayerId
  );
}

export function Map2DView({ showStyleSelector }: Map2DViewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const pendingFetchRef = useRef<AbortController | null>(null);
  const pendingPlanningFetchRef = useRef<AbortController | null>(null);
  const pendingParcelAreaFetchRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const planningDebounceTimerRef = useRef<number | null>(null);
  const lastBoundsKeyRef = useRef<string>("");
  const lastPlanningBoundsKeyRef = useRef<string>("");
  const activeRequestIdRef = useRef(0);
  const activePlanningRequestIdRef = useRef(0);
  const activeParcelAreaRequestIdRef = useRef(0);

  const [styleType, setStyleType] = useState<Base2DStyle>("road");
  const [isMapReady, setIsMapReady] = useState(false);
  const [cadastralData, setCadastralData] = useState<CadastralFeatureCollection>(createEmptyCadastralFeatureCollection);
  const [selectedParcel, setSelectedParcel] = useState<ParcelProps | null>(null);
  const [selectedParcelArea, setSelectedParcelArea] = useState<number | null>(null);
  const [isSelectedParcelAreaLoading, setIsSelectedParcelAreaLoading] = useState(false);
  const [dataApiError, setDataApiError] = useState<string | null>(null);
  const [dataApiNotice, setDataApiNotice] = useState<string | null>(null);
  const [planningData, setPlanningData] = useState<{ type: "FeatureCollection"; features: unknown[] }>(
    createEmptyPlanningFeatureCollection
  );
  const [, setPlanningDataError] = useState<string | null>(null);
  const [, setLastFetchMeta] = useState<CadastralFetchMeta | null>(null);

  const selectedInfoParcelId = selectedParcel ? pickParcelSelectionKey(selectedParcel) : null;
  const { state: mapSearchState, consumePendingNavigation } = useMapSearch();
  const {
    state: zoneSearchState,
    consumePendingNavigation: consumeZoneSearchPendingNavigation,
    completeCandidateSelection,
    failCandidateSelection
  } = useZoneSelectionSearch();
  const {
    activeDetailItem,
    activeNaturalEnvironmentMapOverlay,
    activePlanningMapLayer,
    activeThematicMapFeatures,
    canOpen: canOpenSiteAnalysis
  } = useSiteAnalysis();

  const {
    decoratedVisibleFeatures,
    draftGeometryCollection,
    draftVertexCollection,
    confirmedZoneCollection,
    handleMapClick,
    addParcelByCoordinate,
    handleMapMouseMove,
    handleMapContextMenu,
    latestImportedGeometryBounds,
    isDrawModeActive,
    isInteractionLocked
  } = useZoneSelectionMap({
    map: mapRef.current,
    visibleFeatures: cadastralData,
    selectedInfoParcelId,
    onSelectInfoParcel: (parcel) => {
      setSelectedParcel(parcel);
      void loadSelectedParcelArea(pickParcelValue(parcel, ["pnu", "PNU"])?.toString() ?? null);
    }
  });

  const refreshCadastralDataRef = useRef<(force?: boolean) => Promise<void>>(async () => {});
  const scheduleRefreshCadastralDataRef = useRef<() => void>(() => {});
  const refreshPlanningDataRef = useRef<(force?: boolean) => Promise<void>>(async () => {});
  const scheduleRefreshPlanningDataRef = useRef<() => void>(() => {});
  const handleMapClickEventRef = useRef<(event: unknown) => void>(() => {});
  const handleMapMouseMoveEventRef = useRef<(event: unknown) => void>(() => {});
  const handleMapContextMenuEventRef = useRef<(event: unknown) => void>(() => {});
  const drawModeRef = useRef(false);
  const lastFittedImportIdRef = useRef<string | null>(null);
  const zoneSearchSelectionDeadlineRef = useRef<number | null>(null);
  const zoneSearchSelectionRetryTimerRef = useRef<number | null>(null);
  const [zoneSearchSelectionRetryTick, setZoneSearchSelectionRetryTick] = useState(0);

  const resetPendingRequest = () => {
    pendingFetchRef.current?.abort();
    pendingFetchRef.current = null;

    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  };

  const resetPendingPlanningRequest = () => {
    pendingPlanningFetchRef.current?.abort();
    pendingPlanningFetchRef.current = null;

    if (planningDebounceTimerRef.current !== null) {
      window.clearTimeout(planningDebounceTimerRef.current);
      planningDebounceTimerRef.current = null;
    }
  };

  const resetPendingParcelAreaRequest = () => {
    pendingParcelAreaFetchRef.current?.abort();
    pendingParcelAreaFetchRef.current = null;
  };

  const loadSelectedParcelArea = async (pnu: string | null) => {
    resetPendingParcelAreaRequest();
    setSelectedParcelArea(null);

    if (!pnu) {
      setIsSelectedParcelAreaLoading(false);
      return;
    }

    const controller = new AbortController();
    pendingParcelAreaFetchRef.current = controller;
    const requestId = activeParcelAreaRequestIdRef.current + 1;
    activeParcelAreaRequestIdRef.current = requestId;
    setIsSelectedParcelAreaLoading(true);

    try {
      const area = await fetchParcelArea(pnu, controller.signal);
      if (controller.signal.aborted || activeParcelAreaRequestIdRef.current !== requestId) {
        return;
      }

      setSelectedParcelArea(area);
    } catch {
      if (controller.signal.aborted || activeParcelAreaRequestIdRef.current !== requestId) {
        return;
      }

      setSelectedParcelArea(null);
    } finally {
      if (controller.signal.aborted || activeParcelAreaRequestIdRef.current !== requestId) {
        return;
      }

      pendingParcelAreaFetchRef.current = null;
      setIsSelectedParcelAreaLoading(false);
    }
  };

  const refreshCadastralData = async (force = false) => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const currentZoom = (map as unknown as { getZoom?: () => number }).getZoom?.() ?? 0;
    if (currentZoom < MAP_DATA_MIN_ZOOM) {
      resetPendingRequest();
      lastBoundsKeyRef.current = "";
      setCadastralData(createEmptyCadastralFeatureCollection());
      setDataApiError(null);
      setDataApiNotice(null);
      setLastFetchMeta(null);
      return;
    }

    const requestInfo = buildBoundsRequestInfo(map);
    if (requestInfo.blockedReason === "bbox-too-large") {
      resetPendingRequest();
      lastBoundsKeyRef.current = requestInfo.key;
      setCadastralData(createEmptyCadastralFeatureCollection());
      setDataApiError(null);
      setDataApiNotice(BBOX_NOTICE_MESSAGE);
      setLastFetchMeta(null);
      return;
    }

    if (requestInfo.blockedReason === "bbox-invalid" || !requestInfo.bbox) {
      resetPendingRequest();
      lastBoundsKeyRef.current = "";
      setCadastralData(createEmptyCadastralFeatureCollection());
      setDataApiError("현재 지도 범위를 계산할 수 없습니다.");
      setDataApiNotice(null);
      setLastFetchMeta(null);
      return;
    }

    if (!force && requestInfo.key === lastBoundsKeyRef.current) {
      return;
    }

    lastBoundsKeyRef.current = requestInfo.key;
    pendingFetchRef.current?.abort();
    const controller = new AbortController();
    pendingFetchRef.current = controller;
    const requestId = activeRequestIdRef.current + 1;
    activeRequestIdRef.current = requestId;

    try {
      const { fc, meta } = await fetchCadastralFeatureCollection(requestInfo.bbox, controller.signal);
      if (controller.signal.aborted || activeRequestIdRef.current !== requestId) {
        return;
      }

      setCadastralData(fc);
      setDataApiError(null);
      setDataApiNotice(null);
      setLastFetchMeta(meta);
    } catch (error) {
      if (controller.signal.aborted || activeRequestIdRef.current !== requestId) {
        return;
      }

      setCadastralData(createEmptyCadastralFeatureCollection());
      setDataApiError(error instanceof Error ? error.message : "지적 데이터를 불러오지 못했습니다.");
      setDataApiNotice(null);
      setLastFetchMeta(null);
    } finally {
      if (controller.signal.aborted || activeRequestIdRef.current !== requestId) {
        return;
      }

      pendingFetchRef.current = null;
    }
  };

  const refreshPlanningData = async (force = false) => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    if (activePlanningMapLayer !== PLANNING_DATA_GROUP_SPECIAL_PURPOSE_AREA) {
      resetPendingPlanningRequest();
      lastPlanningBoundsKeyRef.current = "";
      setPlanningData(createEmptyPlanningFeatureCollection());
      setPlanningDataError(null);
      return;
    }

    const requestInfo = buildBoundsRequestInfo(map);
    if (requestInfo.blockedReason !== null || !requestInfo.bbox) {
      resetPendingPlanningRequest();
      lastPlanningBoundsKeyRef.current = requestInfo.key;
      setPlanningData(createEmptyPlanningFeatureCollection());
      setPlanningDataError(null);
      return;
    }

    if (!force && requestInfo.key === lastPlanningBoundsKeyRef.current) {
      return;
    }

    lastPlanningBoundsKeyRef.current = requestInfo.key;
    pendingPlanningFetchRef.current?.abort();
    const controller = new AbortController();
    pendingPlanningFetchRef.current = controller;
    const requestId = activePlanningRequestIdRef.current + 1;
    activePlanningRequestIdRef.current = requestId;

    try {
      const response = await fetch(buildPlanningDataUrl(requestInfo.bbox), {
        method: "GET",
        signal: controller.signal,
        cache: "no-store"
      });

      const payload = (await response.json().catch(() => null)) as unknown;

      if (!response.ok) {
        const errorPayload = payload as { message?: string } | null;
        throw new Error(errorPayload?.message ?? `Planning data request failed: ${response.status}`);
      }

      if (controller.signal.aborted || activePlanningRequestIdRef.current !== requestId) {
        return;
      }

      setPlanningData(toPlanningFeatureCollection(payload));
      setPlanningDataError(null);
    } catch (error) {
      if (controller.signal.aborted || activePlanningRequestIdRef.current !== requestId) {
        return;
      }

      setPlanningData(createEmptyPlanningFeatureCollection());
      setPlanningDataError(error instanceof Error ? error.message : "Planning data request failed.");
    } finally {
      if (controller.signal.aborted || activePlanningRequestIdRef.current !== requestId) {
        return;
      }

      pendingPlanningFetchRef.current = null;
    }
  };

  const scheduleRefreshCadastralData = () => {
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(() => {
      void refreshCadastralDataRef.current(false);
    }, MAP_DATA_MOVEEND_DEBOUNCE_MS);
  };

  const scheduleRefreshPlanningData = () => {
    if (planningDebounceTimerRef.current !== null) {
      window.clearTimeout(planningDebounceTimerRef.current);
    }

    planningDebounceTimerRef.current = window.setTimeout(() => {
      void refreshPlanningDataRef.current(false);
    }, MAP_DATA_MOVEEND_DEBOUNCE_MS);
  };

  const handleMapClickEvent = (event: unknown) => {
    const rawEvent = event as MapClickEventLike;
    const point = rawEvent.point;
    const lngLat = rawEvent.lngLat;

    if (
      !point ||
      !lngLat ||
      typeof point.x !== "number" ||
      typeof point.y !== "number" ||
      typeof lngLat.lng !== "number" ||
      typeof lngLat.lat !== "number"
    ) {
      return;
    }

    if (rawEvent.originalEvent?.button === 2) {
      return;
    }

    handleMapClick({
      point: {
        x: point.x,
        y: point.y
      },
      lngLat: {
        lng: lngLat.lng,
        lat: lngLat.lat
      }
    });
  };

  const handleMapMouseMoveEvent = (event: unknown) => {
    const rawEvent = event as MapClickEventLike;
    const point = rawEvent.point;
    const lngLat = rawEvent.lngLat;

    if (
      !point ||
      !lngLat ||
      typeof point.x !== "number" ||
      typeof point.y !== "number" ||
      typeof lngLat.lng !== "number" ||
      typeof lngLat.lat !== "number"
    ) {
      return;
    }

    handleMapMouseMove({
      point: {
        x: point.x,
        y: point.y
      },
      lngLat: {
        lng: lngLat.lng,
        lat: lngLat.lat
      }
    });
  };

  const handleMapContextMenuEvent = (event: unknown) => {
    const rawEvent = event as MapClickEventLike;
    const point = rawEvent.point;
    const lngLat = rawEvent.lngLat;

    if (
      !point ||
      !lngLat ||
      typeof point.x !== "number" ||
      typeof point.y !== "number" ||
      typeof lngLat.lng !== "number" ||
      typeof lngLat.lat !== "number"
    ) {
      return;
    }

    handleMapContextMenu({
      point: {
        x: point.x,
        y: point.y
      },
      lngLat: {
        lng: lngLat.lng,
        lat: lngLat.lat
      },
      originalEvent: rawEvent.originalEvent
    });
  };

  useEffect(() => {
    refreshCadastralDataRef.current = refreshCadastralData;
    scheduleRefreshCadastralDataRef.current = scheduleRefreshCadastralData;
    refreshPlanningDataRef.current = refreshPlanningData;
    scheduleRefreshPlanningDataRef.current = scheduleRefreshPlanningData;
    handleMapClickEventRef.current = handleMapClickEvent;
    handleMapMouseMoveEventRef.current = handleMapMouseMoveEvent;
    handleMapContextMenuEventRef.current = handleMapContextMenuEvent;
  }, [
    handleMapClickEvent,
    handleMapContextMenuEvent,
    handleMapMouseMoveEvent,
    refreshCadastralData,
    refreshPlanningData
  ]);

  useEffect(() => {
    drawModeRef.current = isDrawModeActive;
  }, [isDrawModeActive]);

  const selectedParcelAddressValue = selectedParcel ? pickParcelValue(selectedParcel, ["addr"]) : null;
  const selectedParcelAddress =
    typeof selectedParcelAddressValue === "string" && selectedParcelAddressValue.trim()
      ? selectedParcelAddressValue.trim()
      : "-";
  const selectedParcelJiga = formatCurrencyDisplay(selectedParcel ? pickParcelValue(selectedParcel, ["jiga"]) : null);
  const selectedParcelAreaDisplay = formatAreaDisplay(selectedParcelArea, isSelectedParcelAreaLoading);

  useEffect(() => {
    if (!isMapRenderable) {
      logPublicMapEnvDiagnostics("Map2DView");
    }
  }, []);

  useEffect(() => {
    if (!isInteractionLocked) {
      return;
    }

    resetPendingParcelAreaRequest();
    setSelectedParcel(null);
    setSelectedParcelArea(null);
    setIsSelectedParcelAreaLoading(false);
  }, [isInteractionLocked]);

  useEffect(() => {
    let cancelled = false;

    const setupMap = async () => {
      if (!mapContainerRef.current || mapRef.current || !isMapRenderable) {
        return;
      }

      const maplibregl = await loadMapLibre();
      if (cancelled || !mapContainerRef.current) {
        return;
      }

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: createVworldStyle(mapPublicEnv.vworldApiKey),
        center: MAP_DEFAULT_CENTER,
        zoom: 16,
        minZoom: 6,
        maxZoom: 19
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");

      map.on("load", () => {
        map.addSource(CADASTRAL_SOURCE_ID, {
          type: "geojson",
          data: createEmptyCadastralFeatureCollection()
        });
        addCadastralLayers(map);
        addZoneSelectionOverlayLayers(map);

        map.on("moveend", () => {
          scheduleRefreshCadastralDataRef.current();
          scheduleRefreshPlanningDataRef.current();
        });

        map.on("click", (event: unknown) => {
          handleMapClickEventRef.current(event);
        });
        map.on("mousemove", (event: unknown) => {
          handleMapMouseMoveEventRef.current(event);
        });
        map.on("contextmenu", (event: unknown) => {
          handleMapContextMenuEventRef.current(event);
        });

        void refreshCadastralDataRef.current(true);
        setIsMapReady(true);
      });

      mapRef.current = map;
    };

    void setupMap();

    return () => {
      cancelled = true;
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }

      if (planningDebounceTimerRef.current !== null) {
        window.clearTimeout(planningDebounceTimerRef.current);
      }

      if (zoneSearchSelectionRetryTimerRef.current !== null) {
        window.clearTimeout(zoneSearchSelectionRetryTimerRef.current);
      }

      pendingFetchRef.current?.abort();
      pendingPlanningFetchRef.current?.abort();
      pendingParcelAreaFetchRef.current?.abort();
      mapRef.current?.remove();
      mapRef.current = null;
      setIsMapReady(false);
    };
  }, []);

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) {
      return;
    }

    const preventContextMenu = (event: MouseEvent) => {
      if (!drawModeRef.current) {
        return;
      }

      event.preventDefault();
    };

    container.addEventListener("contextmenu", preventContextMenu);

    return () => {
      container.removeEventListener("contextmenu", preventContextMenu);
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !isMapReady) {
      return;
    }

    mapRef.current.setLayoutProperty(ROAD_LAYER_ID, "visibility", styleType === "road" ? "visible" : "none");
    mapRef.current.setLayoutProperty(
      SATELLITE_LAYER_ID,
      "visibility",
      styleType === "satellite" ? "visible" : "none"
    );
  }, [isMapReady, styleType]);

  useEffect(() => {
    const pendingNavigation = mapSearchState.pendingNavigation;
    if (!isMapReady || !mapRef.current || !pendingNavigation) {
      return;
    }

    mapRef.current.flyTo({
      center: pendingNavigation.center,
      zoom: pendingNavigation.zoom,
      essential: true,
      duration: 1200
    });
    consumePendingNavigation(pendingNavigation.id);
  }, [consumePendingNavigation, isMapReady, mapSearchState.pendingNavigation]);

  useEffect(() => {
    const pendingNavigation = zoneSearchState.pendingNavigation;
    if (!isMapReady || !mapRef.current || !pendingNavigation) {
      return;
    }

    if (zoneSearchState.pendingSelection?.id === pendingNavigation.id) {
      zoneSearchSelectionDeadlineRef.current = Date.now() + ZONE_SEARCH_SELECTION_TIMEOUT_MS;
      if (zoneSearchSelectionRetryTimerRef.current !== null) {
        window.clearTimeout(zoneSearchSelectionRetryTimerRef.current);
      }
      zoneSearchSelectionRetryTimerRef.current = window.setTimeout(() => {
        setZoneSearchSelectionRetryTick((tick) => tick + 1);
      }, 1000);
    }

    mapRef.current.flyTo({
      center: pendingNavigation.center,
      zoom: pendingNavigation.zoom,
      essential: true,
      duration: 900
    });
    consumeZoneSearchPendingNavigation(pendingNavigation.id);
  }, [
    consumeZoneSearchPendingNavigation,
    isMapReady,
    zoneSearchState.pendingNavigation,
    zoneSearchState.pendingSelection
  ]);

  useEffect(() => {
    const pendingSelection = zoneSearchState.pendingSelection;
    const map = mapRef.current;
    if (!pendingSelection || !isMapReady || !map) {
      if (zoneSearchSelectionRetryTimerRef.current !== null) {
        window.clearTimeout(zoneSearchSelectionRetryTimerRef.current);
        zoneSearchSelectionRetryTimerRef.current = null;
      }
      zoneSearchSelectionDeadlineRef.current = null;
      return;
    }

    const result = addParcelByCoordinate(pendingSelection.candidate.center);
    if (result === "added" || result === "already-selected") {
      if (zoneSearchSelectionRetryTimerRef.current !== null) {
        window.clearTimeout(zoneSearchSelectionRetryTimerRef.current);
        zoneSearchSelectionRetryTimerRef.current = null;
      }
      zoneSearchSelectionDeadlineRef.current = null;
      completeCandidateSelection(pendingSelection.id);
      return;
    }

    const deadline =
      zoneSearchSelectionDeadlineRef.current ??
      pendingSelection.requestedAt + ZONE_SEARCH_SELECTION_TIMEOUT_MS;
    const shouldFail =
      Date.now() >= deadline && isCoordinateWithinMapBounds(map, pendingSelection.candidate.center);

    if (shouldFail) {
      zoneSearchSelectionDeadlineRef.current = null;
      failCandidateSelection(pendingSelection.id, "해당 위치의 필지를 찾을 수 없습니다.");
      return;
    }

    if (zoneSearchSelectionRetryTimerRef.current !== null) {
      window.clearTimeout(zoneSearchSelectionRetryTimerRef.current);
    }

    zoneSearchSelectionRetryTimerRef.current = window.setTimeout(() => {
      setZoneSearchSelectionRetryTick((tick) => tick + 1);
    }, ZONE_SEARCH_SELECTION_RETRY_MS);
  }, [
    addParcelByCoordinate,
    completeCandidateSelection,
    failCandidateSelection,
    isMapReady,
    zoneSearchSelectionRetryTick,
    zoneSearchState.pendingSelection
  ]);

  useEffect(() => {
    if (!isMapReady) {
      return;
    }

    setGeoJsonSourceData(mapRef.current, CADASTRAL_SOURCE_ID, decoratedVisibleFeatures);
  }, [decoratedVisibleFeatures, isMapReady]);

  useEffect(() => {
    if (!isMapReady) {
      return;
    }

    setGeoJsonSourceData(mapRef.current, ZONE_DRAFT_GEOMETRY_SOURCE_ID, draftGeometryCollection);
  }, [draftGeometryCollection, isMapReady]);

  useEffect(() => {
    if (!isMapReady) {
      return;
    }

    setGeoJsonSourceData(mapRef.current, ZONE_DRAFT_VERTEX_SOURCE_ID, draftVertexCollection);
  }, [draftVertexCollection, isMapReady]);

  useEffect(() => {
    if (!isMapReady) {
      return;
    }

    setGeoJsonSourceData(mapRef.current, ZONE_CONFIRMED_SOURCE_ID, confirmedZoneCollection);
  }, [confirmedZoneCollection, isMapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!isMapReady || !map || !latestImportedGeometryBounds) {
      return;
    }

    if (lastFittedImportIdRef.current === latestImportedGeometryBounds.id) {
      return;
    }

    const [west, south, east, north] = latestImportedGeometryBounds.bbox;
    if (
      !Number.isFinite(west) ||
      !Number.isFinite(south) ||
      !Number.isFinite(east) ||
      !Number.isFinite(north) ||
      west >= east ||
      south >= north
    ) {
      return;
    }

    lastFittedImportIdRef.current = latestImportedGeometryBounds.id;
    map.fitBounds(
      [
        [west, south],
        [east, north]
      ],
      {
        padding: 80,
        duration: 700,
        maxZoom: 18
      }
    );
  }, [isMapReady, latestImportedGeometryBounds]);

  useEffect(() => {
    const map = mapRef.current;

    if (!isMapReady || !map) {
      return;
    }

    if (activePlanningMapLayer !== PLANNING_DATA_GROUP_SPECIAL_PURPOSE_AREA) {
      resetPendingPlanningRequest();
      lastPlanningBoundsKeyRef.current = "";
      setPlanningData(createEmptyPlanningFeatureCollection());
      setPlanningDataError(null);
      removePlanningSpecialPurposeAreaLayers(map);
      return;
    }

    void refreshPlanningDataRef.current(true);
  }, [activePlanningMapLayer, isMapReady]);

  useEffect(() => {
    const map = mapRef.current;

    if (!isMapReady || !map || activePlanningMapLayer !== PLANNING_DATA_GROUP_SPECIAL_PURPOSE_AREA) {
      removePlanningSpecialPurposeAreaLayers(map);
      return;
    }

    ensurePlanningSpecialPurposeAreaLayers(map);
    setGeoJsonSourceData(map, PLANNING_SPECIAL_PURPOSE_AREA_SOURCE_ID, planningData);

    return () => {
      removePlanningSpecialPurposeAreaLayers(map);
    };
  }, [activePlanningMapLayer, isMapReady, planningData]);

  useEffect(() => {
    const map = mapRef.current;

    if (!isMapReady || !map || !activeNaturalEnvironmentMapOverlay) {
      removeNaturalEnvironmentMapLayers(map);
      return;
    }

    addNaturalEnvironmentMapLayers(map, activeNaturalEnvironmentMapOverlay);

    return () => {
      removeNaturalEnvironmentMapLayers(map);
    };
  }, [activeNaturalEnvironmentMapOverlay, isMapReady]);

  useEffect(() => {
    const map = mapRef.current;

    if (!isMapReady || !map) {
      return;
    }

    const shouldShowThematicMap =
      canOpenSiteAnalysis &&
      activeDetailItem !== null &&
      activeDetailItem !== "basicLocationInfo" &&
      activeThematicMapFeatures !== null;

    if (!shouldShowThematicMap) {
      removeSiteAnalysisThematicMapLayers(map);
      return;
    }

    ensureSiteAnalysisThematicMapLayers(map);
    setGeoJsonSourceData(map, SITE_ANALYSIS_THEMATIC_SOURCE_ID, activeThematicMapFeatures);

    return () => {
      removeSiteAnalysisThematicMapLayers(map);
    };
  }, [activeDetailItem, activeThematicMapFeatures, canOpenSiteAnalysis, isMapReady]);

  if (!isMapRenderable) {
    return <MapEnvGuardNotice mode="2d" />;
  }

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainerRef} className="h-full w-full" />

      <ZoneSelectionSearchPanel />

      {showStyleSelector ? (
        <div className="absolute left-6 top-[55px] z-10 flex flex-col gap-[5px]">
          <div className="flex w-[154px] items-center gap-1 rounded-[14px] border border-slate-200 bg-white/92 p-[2px] shadow-sm backdrop-blur">
            <button
              type="button"
              onClick={() => setStyleType("road")}
              className={`flex-1 rounded-full px-3 py-0.5 text-[11px] font-semibold leading-5 transition ${
                styleType === "road"
                  ? "bg-slate-900 text-white"
                  : "bg-transparent text-slate-600 hover:bg-slate-100"
              }`}
            >
              일반지도
            </button>
            <button
              type="button"
              onClick={() => setStyleType("satellite")}
              className={`flex-1 rounded-full px-3 py-0.5 text-[11px] font-semibold leading-5 transition ${
                styleType === "satellite"
                  ? "bg-slate-900 text-white"
                  : "bg-transparent text-slate-600 hover:bg-slate-100"
              }`}
            >
              위성지도
            </button>
          </div>

          <SiteAnalysisOverlay />
        </div>
      ) : null}

      {dataApiNotice ? (
        <div className="absolute left-6 top-[110px] z-10 max-w-[360px] rounded-xl border border-amber-200 bg-white/95 p-3 text-[11px] text-amber-700 shadow-sm backdrop-blur">
          <p className="font-semibold">지적 조회 안내</p>
          <p className="mt-1 break-words">{dataApiNotice}</p>
        </div>
      ) : null}

      {dataApiError ? (
        <div className="absolute left-6 top-[110px] z-10 max-w-[360px] rounded-xl border border-rose-200 bg-white/95 p-3 text-[11px] text-rose-700 shadow-sm backdrop-blur">
          <p className="font-semibold">지적 조회 오류</p>
          <p className="mt-1 break-words">{dataApiError}</p>
        </div>
      ) : null}

      {selectedParcel ? (
        <div className="absolute bottom-5 left-6 z-10 w-[340px] rounded-xl border border-slate-200 bg-white/95 p-3 text-[11px] text-slate-700 shadow-sm backdrop-blur">
          <p className="font-semibold">필지 정보</p>
          <div className="mt-2 space-y-2 text-[11px]">
            <div className="flex items-start justify-between gap-4">
              <span className="shrink-0 text-slate-500">주소</span>
              <span className="text-right text-slate-700">{selectedParcelAddress}</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span className="shrink-0 text-slate-500">면적(㎡)</span>
              <span className="text-right text-slate-700">{selectedParcelAreaDisplay}</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span className="shrink-0 text-slate-500">개별공시지가</span>
              <span className="text-right text-slate-700">{selectedParcelJiga}</span>
            </div>
          </div>
        </div>
      ) : null}

      {mapPublicEnv.vworldReferrer ? (
        <p className="pointer-events-none absolute bottom-3 right-3 rounded-md bg-white/80 px-2 py-1 text-[10px] text-slate-500 backdrop-blur">
          Referrer: {mapPublicEnv.vworldReferrer}
        </p>
      ) : null}

      <SiteAnalysisDetailPanel />
    </div>
  );
}
