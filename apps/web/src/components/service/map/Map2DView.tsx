"use client";

import { useEffect, useRef, useState } from "react";
import { env, isVworldEnabled } from "@/config/env";
import { loadMapLibre, type MapLibreMap } from "./maplibreLoader";
import { createVworldStyle, ROAD_LAYER_ID, SATELLITE_LAYER_ID } from "./vworldStyle";
import type { Base2DStyle } from "./types";

type Map2DViewProps = {
  showStyleSelector: boolean;
};

export function Map2DView({ showStyleSelector }: Map2DViewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [styleType, setStyleType] = useState<Base2DStyle>("road");
  const [isMapReady, setIsMapReady] = useState(false);

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
      mapRef.current.on("load", () => setIsMapReady(true));
    };

    setupMap();

    return () => {
      cancelled = true;
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

      {env.vworldReferrer ? (
        <p className="pointer-events-none absolute bottom-3 right-3 rounded-md bg-white/80 px-2 py-1 text-[10px] text-slate-500 backdrop-blur">
          Referrer: {env.vworldReferrer}
        </p>
      ) : null}
    </div>
  );
}
