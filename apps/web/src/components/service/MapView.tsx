"use client";

import { useEffect, useRef, useState } from "react";
import { env, isVworldEnabled } from "@/config/env";

type BaseStyle = "road" | "satellite";

type MapLibreMap = {
  addControl: (control: unknown, position?: string) => void;
  remove: () => void;
  setLayoutProperty: (layerId: string, name: string, value: string) => void;
};

type MapLibreNamespace = {
  Map: new (options: Record<string, unknown>) => MapLibreMap;
  NavigationControl: new (options?: Record<string, unknown>) => unknown;
};

declare global {
  interface Window {
    maplibregl?: MapLibreNamespace;
  }
}

const ROAD_LAYER_ID = "vworld-road-layer";
const SATELLITE_LAYER_ID = "vworld-satellite-layer";

function createVworldStyle(vworldApiKey: string) {
  return {
    version: 8,
    sources: {
      vworldRoad: {
        type: "raster",
        tiles: [`https://api.vworld.kr/req/wmts/1.0.0/${vworldApiKey}/Base/{z}/{y}/{x}.png`],
        tileSize: 256,
        attribution: "&copy; VWorld"
      },
      vworldSatellite: {
        type: "raster",
        tiles: [`https://api.vworld.kr/req/wmts/1.0.0/${vworldApiKey}/Satellite/{z}/{y}/{x}.jpeg`],
        tileSize: 256,
        attribution: "&copy; VWorld"
      }
    },
    layers: [
      {
        id: ROAD_LAYER_ID,
        type: "raster",
        source: "vworldRoad",
        layout: {
          visibility: "visible"
        }
      },
      {
        id: SATELLITE_LAYER_ID,
        type: "raster",
        source: "vworldSatellite",
        layout: {
          visibility: "none"
        }
      }
    ]
  };
}

async function loadMapLibre() {
  if (window.maplibregl) {
    return window.maplibregl;
  }

  const existingCss = document.querySelector('link[data-maplibre="true"]');
  if (!existingCss) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/maplibre-gl@5.9.0/dist/maplibre-gl.css";
    link.dataset.maplibre = "true";
    document.head.appendChild(link);
  }

  await new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-maplibre="true"]');

    if (existingScript) {
      if (window.maplibregl) {
        resolve();
        return;
      }

      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("MapLibre script load failed")), {
        once: true
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/maplibre-gl@5.9.0/dist/maplibre-gl.js";
    script.async = true;
    script.dataset.maplibre = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("MapLibre script load failed"));
    document.body.appendChild(script);
  });

  if (!window.maplibregl) {
    throw new Error("MapLibre is unavailable");
  }

  return window.maplibregl;
}

export function MapView() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [styleType, setStyleType] = useState<BaseStyle>("road");

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

      mapRef.current = new maplibregl.Map({
        container: mapContainerRef.current,
        style: createVworldStyle(env.vworldApiKey),
        center: [127.0276, 37.4979],
        zoom: 11,
        minZoom: 6,
        maxZoom: 19
      });

      mapRef.current.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");
    };

    setupMap();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    mapRef.current.setLayoutProperty(
      ROAD_LAYER_ID,
      "visibility",
      styleType === "road" ? "visible" : "none"
    );
    mapRef.current.setLayoutProperty(
      SATELLITE_LAYER_ID,
      "visibility",
      styleType === "satellite" ? "visible" : "none"
    );
  }, [styleType]);

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

      <div className="absolute left-6 top-6 z-10 flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 p-1 shadow-sm backdrop-blur">
        <button
          type="button"
          onClick={() => setStyleType("road")}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
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
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            styleType === "satellite"
              ? "bg-slate-900 text-white"
              : "bg-transparent text-slate-600 hover:bg-slate-100"
          }`}
        >
          위성지도
        </button>
      </div>

      {env.vworldReferrer ? (
        <p className="pointer-events-none absolute bottom-3 right-3 rounded-md bg-white/80 px-2 py-1 text-[10px] text-slate-500 backdrop-blur">
          Referrer: {env.vworldReferrer}
        </p>
      ) : null}
    </div>
  );
}
