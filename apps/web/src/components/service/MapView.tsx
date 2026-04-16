"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type BaseStyle = "road" | "satellite";

type MapLibreMap = {
  setStyle: (style: unknown) => void;
  addControl: (control: unknown, position?: string) => void;
  remove: () => void;
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

const ROAD_STYLE = {
  version: 8,
  sources: {
    cartoLight: {
      type: "raster",
      tiles: ["https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }
  },
  layers: [
    {
      id: "cartoLight",
      type: "raster",
      source: "cartoLight"
    }
  ]
};

const SATELLITE_STYLE = {
  version: 8,
  sources: {
    esriWorldImagery: {
      type: "raster",
      tiles: [
        "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      ],
      tileSize: 256,
      attribution: "Tiles &copy; Esri"
    }
  },
  layers: [
    {
      id: "esriWorldImagery",
      type: "raster",
      source: "esriWorldImagery"
    }
  ]
};

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
  const [mapReady, setMapReady] = useState(false);

  const style = useMemo(() => (styleType === "road" ? ROAD_STYLE : SATELLITE_STYLE), [styleType]);

  useEffect(() => {
    let cancelled = false;

    const setupMap = async () => {
      if (!mapContainerRef.current || mapRef.current) {
        return;
      }

      const maplibregl = await loadMapLibre();
      if (cancelled || !mapContainerRef.current) {
        return;
      }

      mapRef.current = new maplibregl.Map({
        container: mapContainerRef.current,
        style,
        center: [127.0276, 37.4979],
        zoom: 11,
        minZoom: 6,
        maxZoom: 19
      });

      mapRef.current.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");
      setMapReady(true);
    };

    setupMap();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [style]);

  useEffect(() => {
    if (!mapRef.current || !mapReady) {
      return;
    }

    mapRef.current.setStyle(style);
  }, [mapReady, style]);

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
    </div>
  );
}
