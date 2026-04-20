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

type Map2DViewProps = {
  showStyleSelector: boolean;
};

type ParcelProps = Record<string, unknown>;

type DataApiErrorPayload = {
  error?: string;
  errorCode?: string;
  message?: string;
};

class DataApiRequestError extends Error {
  code?: string;
  status: number;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "DataApiRequestError";
    this.status = status;
    this.code = code;
  }
}

const CADASTRAL_SOURCE_ID = "vworld-cadastral-data";
const CADASTRAL_LINE_LAYER_ID = "vworld-cadastral-line";
const CADASTRAL_FILL_LAYER_ID = "vworld-cadastral-fill";
const CADASTRAL_FILL_ACTIVE_LAYER_ID = "vworld-cadastral-fill-active";
const ZOOM_NOTICE_MESSAGE = `지적도는 줌 ${MAP_DATA_MIN_ZOOM} 이상에서 조회됩니다.`;
const BBOX_NOTICE_MESSAGE = "현재 화면 범위가 넓어 지적도 요청을 생략했습니다. 조금 더 확대해 주세요.";

type FeatureCollectionLike = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: unknown;
    properties: ParcelProps & { _parcel_id?: string | null; _selected?: boolean };
  }>;
};

type BoundsRequestInfo =
  | {
      blockedReason: null;
      bbox: string;
      key: string;
    }
  | {
      blockedReason: "bbox-too-large" | "bbox-invalid";
      bbox: null;
      key: string;
    };

function createEmptyFeatureCollection(): FeatureCollectionLike {
  return {
    type: "FeatureCollection",
    features: []
  };
}

function toFeatureCollection(data: unknown): FeatureCollectionLike {
  if (
    data &&
    typeof data === "object" &&
    (data as { type?: string }).type === "FeatureCollection" &&
    Array.isArray((data as { features?: unknown[] }).features)
  ) {
    return data as FeatureCollectionLike;
  }

  return createEmptyFeatureCollection();
}

function pickParcelId(props: ParcelProps) {
  const candidates = ["pnu", "PNU", "uid", "id", "parcel_id"];
  const found = candidates.find((k) => props[k] !== undefined && props[k] !== null);
  return found ? String(props[found]) : null;
}

function normalizeFeatureCollection(fc: FeatureCollectionLike, selectedId: string | null = null): FeatureCollectionLike {
  return {
    ...fc,
    features: fc.features.map((feature) => {
      const props = (feature.properties ?? {}) as ParcelProps;
      const featureId = pickParcelId(props);

      return {
        ...feature,
        properties: {
          ...props,
          _parcel_id: featureId,
          _selected: selectedId !== null && featureId === selectedId
        }
      };
    })
  };
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

async function fetchCadastralFeatureCollection(bbox: string, signal?: AbortSignal): Promise<FeatureCollectionLike> {
  const res = await fetch(buildProxyDataUrl(bbox), {
    method: "GET",
    signal,
    cache: "no-store"
  });

  const payload = (await res.json().catch(() => null)) as FeatureCollectionLike | DataApiErrorPayload | null;

  if (!res.ok) {
    const code =
      payload && typeof payload === "object"
        ? (payload.errorCode ?? payload.error)
        : undefined;
    const message =
      payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
        ? payload.message
        : `Data API request failed: ${res.status}`;

    throw new DataApiRequestError(message, res.status, code);
  }

  return toFeatureCollection(payload);
}

export function Map2DView({ showStyleSelector }: Map2DViewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const pendingFetchRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const lastBoundsKeyRef = useRef<string>("");
  const activeRequestIdRef = useRef(0);

  const [styleType, setStyleType] = useState<Base2DStyle>("road");
  const [isMapReady, setIsMapReady] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState<ParcelProps | null>(null);
  const [dataApiError, setDataApiError] = useState<string | null>(null);
  const [dataApiNotice, setDataApiNotice] = useState<string | null>(ZOOM_NOTICE_MESSAGE);

  useEffect(() => {
    if (!isMapRenderable) {
      logPublicMapEnvDiagnostics("Map2DView");
    }
  }, []);

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
          data: createEmptyFeatureCollection()
        });

        map.addLayer({
          id: CADASTRAL_FILL_LAYER_ID,
          type: "fill",
          source: CADASTRAL_SOURCE_ID,
          minzoom: 14,
          paint: {
            "fill-color": "#1d4ed8",
            "fill-opacity": 0.07
          }
        });

        map.addLayer({
          id: CADASTRAL_FILL_ACTIVE_LAYER_ID,
          type: "fill",
          source: CADASTRAL_SOURCE_ID,
          minzoom: 14,
          paint: {
            "fill-color": "#2563eb",
            "fill-opacity": 0.2
          },
          filter: ["==", ["get", "_selected"], true]
        });

        map.addLayer({
          id: CADASTRAL_LINE_LAYER_ID,
          type: "line",
          source: CADASTRAL_SOURCE_ID,
          minzoom: 14,
          paint: {
            "line-color": "#1d4ed8",
            "line-width": 1.2
          }
        });

        const setSourceData = (data: FeatureCollectionLike) => {
          const source = map.getSource(CADASTRAL_SOURCE_ID) as
            | { setData?: (next: FeatureCollectionLike) => void }
            | undefined;
          source?.setData?.(data);
        };

        const resetPendingRequest = () => {
          pendingFetchRef.current?.abort();
          pendingFetchRef.current = null;
          activeRequestIdRef.current += 1;
        };

        const refreshCadastralData = async (selectedId: string | null = null, force = false) => {
          const currentZoom = (map as unknown as { getZoom?: () => number }).getZoom?.() ?? 0;
          if (currentZoom < MAP_DATA_MIN_ZOOM) {
            resetPendingRequest();
            lastBoundsKeyRef.current = "";
            setSourceData(createEmptyFeatureCollection());
            setDataApiError(null);
            setDataApiNotice(ZOOM_NOTICE_MESSAGE);
            return;
          }

          const requestInfo = buildBoundsRequestInfo(map);
          if (requestInfo.blockedReason === "bbox-too-large") {
            resetPendingRequest();
            lastBoundsKeyRef.current = requestInfo.key;
            setSourceData(createEmptyFeatureCollection());
            setDataApiError(null);
            setDataApiNotice(BBOX_NOTICE_MESSAGE);
            return;
          }

          if (requestInfo.blockedReason === "bbox-invalid" || !requestInfo.bbox) {
            resetPendingRequest();
            lastBoundsKeyRef.current = "";
            setSourceData(createEmptyFeatureCollection());
            setDataApiError("현재 지도 범위를 해석하지 못했습니다.");
            setDataApiNotice(null);
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
            const fc = await fetchCadastralFeatureCollection(requestInfo.bbox, controller.signal);
            if (controller.signal.aborted || activeRequestIdRef.current !== requestId) {
              return;
            }

            setSourceData(normalizeFeatureCollection(fc, selectedId));
            setDataApiError(null);
            setDataApiNotice(null);
          } catch (error) {
            if (controller.signal.aborted || activeRequestIdRef.current !== requestId) {
              return;
            }

            setSourceData(createEmptyFeatureCollection());

            if (error instanceof DataApiRequestError && error.code === "BBOX_TOO_LARGE") {
              setDataApiError(null);
              setDataApiNotice(BBOX_NOTICE_MESSAGE);
              return;
            }

            setDataApiNotice(null);
            setDataApiError(error instanceof Error ? error.message : "지적도 데이터를 불러오지 못했습니다.");
          }
        };

        const scheduleRefreshCadastralData = () => {
          if (debounceTimerRef.current !== null) {
            window.clearTimeout(debounceTimerRef.current);
          }

          debounceTimerRef.current = window.setTimeout(() => {
            void refreshCadastralData(null, false);
          }, MAP_DATA_MOVEEND_DEBOUNCE_MS);
        };

        map.on("moveend", scheduleRefreshCadastralData);

        const handleParcelClick = (event: unknown) => {
          const e = event as {
            features?: Array<{ properties?: ParcelProps }>;
          };

          if (!e.features || e.features.length === 0) {
            return;
          }

          const picked = (e.features[0].properties ?? {}) as ParcelProps;
          const pickedId = pickParcelId(picked);
          setSelectedParcel(picked);
          void refreshCadastralData(pickedId, true);
        };

        map.on("click", CADASTRAL_FILL_LAYER_ID, handleParcelClick);
        map.on("click", CADASTRAL_FILL_ACTIVE_LAYER_ID, handleParcelClick);

        void refreshCadastralData();
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
      pendingFetchRef.current?.abort();
      mapRef.current?.remove();
      mapRef.current = null;
      setIsMapReady(false);
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

  if (!isMapRenderable) {
    return <MapEnvGuardNotice mode="2d" />;
  }

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainerRef} className="h-full w-full" />

      {showStyleSelector ? (
        <div className="absolute left-6 top-[55px] z-10 flex w-[154px] items-center gap-1 rounded-[14px] border border-slate-200 bg-white/92 p-[2px] shadow-sm backdrop-blur">
          <button
            type="button"
            onClick={() => setStyleType("road")}
            className={`flex-1 rounded-full px-3 py-0.5 text-[11px] font-semibold leading-5 transition ${
              styleType === "road"
                ? "bg-slate-900 text-white"
                : "bg-transparent text-slate-600 hover:bg-slate-100"
            }`}
          >
            그림지도
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
      ) : null}

      <div className="absolute right-6 top-5 z-10 rounded-xl border border-blue-100 bg-white/92 p-3 text-xs text-slate-600 shadow-sm backdrop-blur">
        <p className="font-semibold text-slate-700">지적 Data API</p>
        <p className="mt-1">줌 14 이상에서 표시/조회</p>
        <p className="mt-1">화면 범위가 넓으면 요청을 생략</p>
        <p className="mt-1">클릭 시 속성 확인 가능</p>
      </div>

      {dataApiNotice ? (
        <div className="absolute left-6 top-[110px] z-10 max-w-[360px] rounded-xl border border-amber-200 bg-white/95 p-3 text-[11px] text-amber-700 shadow-sm backdrop-blur">
          <p className="font-semibold">지적도 조회 안내</p>
          <p className="mt-1 break-words">{dataApiNotice}</p>
        </div>
      ) : null}

      {dataApiError ? (
        <div className="absolute left-6 top-[110px] z-10 max-w-[360px] rounded-xl border border-rose-200 bg-white/95 p-3 text-[11px] text-rose-700 shadow-sm backdrop-blur">
          <p className="font-semibold">지적도 조회 오류</p>
          <p className="mt-1 break-words">{dataApiError}</p>
        </div>
      ) : null}

      {selectedParcel ? (
        <div className="absolute bottom-5 left-6 z-10 w-[340px] rounded-xl border border-slate-200 bg-white/95 p-3 text-[11px] text-slate-700 shadow-sm backdrop-blur">
          <p className="font-semibold">선택 필지 속성</p>
          <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap break-all text-[10px] text-slate-600">
            {JSON.stringify(selectedParcel, null, 2)}
          </pre>
        </div>
      ) : null}

      {mapPublicEnv.vworldReferrer ? (
        <p className="pointer-events-none absolute bottom-3 right-3 rounded-md bg-white/80 px-2 py-1 text-[10px] text-slate-500 backdrop-blur">
          Referrer: {mapPublicEnv.vworldReferrer}
        </p>
      ) : null}
    </div>
  );
}
