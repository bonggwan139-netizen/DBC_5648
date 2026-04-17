"use client";

import { useEffect, useRef, useState } from "react";
import { env, isVworldEnabled } from "@/config/env";
import { loadMapLibre, type MapLibreMap } from "./maplibreLoader";
import { createVworldStyle, ROAD_LAYER_ID, SATELLITE_LAYER_ID } from "./vworldStyle";
import type { Base2DStyle } from "./types";

type Map2DViewProps = {
  showStyleSelector: boolean;
};

type ParcelProps = Record<string, unknown>;

const WFS_SOURCE_ID = "vworld-cadastral-wfs";
const WFS_LINE_LAYER_ID = "vworld-cadastral-line";
const WFS_FILL_LAYER_ID = "vworld-cadastral-fill";
const WFS_FILL_ACTIVE_LAYER_ID = "vworld-cadastral-fill-active";
const WFS_MOVEEND_DEBOUNCE_MS = 300;

type FeatureCollectionLike = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: unknown;
    properties: ParcelProps & { _parcel_id?: string | null; _selected?: boolean };
  }>;
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

function createBoundsKey(map: MapLibreMap) {
  const bounds = map.getBounds();
  return [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()]
    .map((v) => v.toFixed(6))
    .join(",");
}

function buildProxyWfsUrl(map: MapLibreMap) {
  const bounds = map.getBounds();
  const params = new URLSearchParams({
    bbox: `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`,
    maxFeatures: "1000"
  });

  return `/api/vworld/wfs?${params.toString()}`;
}

async function fetchWfsFeatureCollection(map: MapLibreMap, signal?: AbortSignal): Promise<FeatureCollectionLike> {
  const res = await fetch(buildProxyWfsUrl(map), {
    method: "GET",
    signal,
    cache: "no-store"
  });

  const payload = (await res.json().catch(() => null)) as
    | FeatureCollectionLike
    | { error?: string; message?: string }
    | null;

  if (!res.ok) {
    const message = payload && typeof payload === "object" && "message" in payload ? payload.message : undefined;
    throw new Error(message || `WFS request failed: ${res.status}`);
  }

  return toFeatureCollection(payload);
}

export function Map2DView({ showStyleSelector }: Map2DViewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const pendingFetchRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const lastBoundsKeyRef = useRef<string>("");

  const [styleType, setStyleType] = useState<Base2DStyle>("road");
  const [isMapReady, setIsMapReady] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState<ParcelProps | null>(null);
  const [wfsError, setWfsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const setupMap = async () => {
      if (!mapContainerRef.current || mapRef.current || !isVworldEnabled) {
        return;
      }

      const maplibregl = await loadMapLibre();
      if (cancelled || !mapContainerRef.current) {
        return;
      }

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: createVworldStyle(env.vworldApiKey),
        center: [127.0276, 37.4979],
        zoom: 16,
        minZoom: 6,
        maxZoom: 19
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");

      map.on("load", () => {
        map.addSource(WFS_SOURCE_ID, {
          type: "geojson",
          data: createEmptyFeatureCollection()
        });

        map.addLayer({
          id: WFS_FILL_LAYER_ID,
          type: "fill",
          source: WFS_SOURCE_ID,
          minzoom: 14,
          paint: {
            "fill-color": "#1d4ed8",
            "fill-opacity": 0.07
          }
        });

        map.addLayer({
          id: WFS_FILL_ACTIVE_LAYER_ID,
          type: "fill",
          source: WFS_SOURCE_ID,
          minzoom: 14,
          paint: {
            "fill-color": "#2563eb",
            "fill-opacity": 0.2
          },
          filter: ["==", ["get", "_selected"], true]
        });

        map.addLayer({
          id: WFS_LINE_LAYER_ID,
          type: "line",
          source: WFS_SOURCE_ID,
          minzoom: 14,
          paint: {
            "line-color": "#1d4ed8",
            "line-width": 1.2
          }
        });

        const setSourceData = (data: FeatureCollectionLike) => {
          const source = map.getSource(WFS_SOURCE_ID) as { setData?: (next: FeatureCollectionLike) => void } | undefined;
          source?.setData?.(data);
        };

        const refreshWfs = async (selectedId: string | null = null, force = false) => {
          const currentZoom = (map as unknown as { getZoom?: () => number }).getZoom?.() ?? 0;
          if (currentZoom < 14) {
            lastBoundsKeyRef.current = "";
            setSourceData(createEmptyFeatureCollection());
            setWfsError(null);
            return;
          }

          const boundsKey = createBoundsKey(map);
          if (!force && boundsKey === lastBoundsKeyRef.current) {
            return;
          }

          lastBoundsKeyRef.current = boundsKey;
          pendingFetchRef.current?.abort();
          const controller = new AbortController();
          pendingFetchRef.current = controller;

          try {
            const fc = await fetchWfsFeatureCollection(map, controller.signal);
            if (controller.signal.aborted) {
              return;
            }

            setSourceData(normalizeFeatureCollection(fc, selectedId));
            setWfsError(null);
          } catch (error) {
            if (controller.signal.aborted) {
              return;
            }

            setSourceData(createEmptyFeatureCollection());
            setWfsError(error instanceof Error ? error.message : "지적도 데이터를 불러오지 못했습니다.");
          }
        };

        const scheduleRefreshWfs = () => {
          if (debounceTimerRef.current !== null) {
            window.clearTimeout(debounceTimerRef.current);
          }

          debounceTimerRef.current = window.setTimeout(() => {
            void refreshWfs(null, false);
          }, WFS_MOVEEND_DEBOUNCE_MS);
        };

        map.on("moveend", scheduleRefreshWfs);

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
          void refreshWfs(pickedId, true);
        };

        map.on("click", WFS_FILL_LAYER_ID, handleParcelClick);
        map.on("click", WFS_FILL_ACTIVE_LAYER_ID, handleParcelClick);

        void refreshWfs();
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

  if (!isVworldEnabled) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-100 p-8 text-center text-sm text-slate-600">
        NEXT_PUBLIC_VWORLD_API_KEY 값이 없어 지도를 표시할 수 없습니다.
      </div>
    );
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
        <p className="font-semibold text-slate-700">지적 WFS</p>
        <p className="mt-1">줌 14 이상에서 표시/조회</p>
        <p className="mt-1">클릭 시 속성 확인 가능</p>
      </div>

      {wfsError ? (
        <div className="absolute left-6 top-[110px] z-10 max-w-[360px] rounded-xl border border-rose-200 bg-white/95 p-3 text-[11px] text-rose-700 shadow-sm backdrop-blur">
          <p className="font-semibold">지적도 조회 오류</p>
          <p className="mt-1 break-words">{wfsError}</p>
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

      {env.vworldReferrer ? (
        <p className="pointer-events-none absolute bottom-3 right-3 rounded-md bg-white/80 px-2 py-1 text-[10px] text-slate-500 backdrop-blur">
          Referrer: {env.vworldReferrer}
        </p>
      ) : null}
    </div>
  );
}
