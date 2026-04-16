"use client";

import { useEffect, useId, useRef, useState } from "react";
import { env, isVworldEnabled } from "@/config/env";

type VworldWindow = Window & {
  vw?: {
    Map: new () => {
      setOption: (options: Record<string, unknown>) => void;
      start: () => void;
    };
    CameraPosition: new (coord: unknown, direction: unknown) => unknown;
    CoordZ: new (x: number, y: number, z: number) => unknown;
    Direction: new (x: number, y: number, z: number) => unknown;
  };
};

export function Map3DView() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const mapId = useId().replace(/:/g, "");

  useEffect(() => {
    if (!containerRef.current || !isVworldEnabled) {
      return;
    }

    let disposed = false;

    const scriptSrc = `${env.vworld3dBootstrapUrl}?version=3.0&apiKey=${env.vworldApiKey}`;

    const initialize = () => {
      if (disposed) {
        return;
      }

      const vwWindow = window as VworldWindow;
      if (!vwWindow.vw) {
        setLoadError("브이월드 3D 엔진(vw)을 찾을 수 없습니다.");
        return;
      }

      const map = new vwWindow.vw.Map();
      map.setOption({
        mapId,
        initPosition: new vwWindow.vw.CameraPosition(
          new vwWindow.vw.CoordZ(127.0276, 37.4979, 1500),
          new vwWindow.vw.Direction(0, -90, 0)
        ),
        logo: true,
        navigation: true
      });
      map.start();
    };

    const existing = document.querySelector<HTMLScriptElement>('script[data-vworld-webgl="true"]');

    if (existing) {
      if ((window as VworldWindow).vw) {
        initialize();
      } else {
        existing.addEventListener("load", initialize, { once: true });
        existing.addEventListener("error", () => setLoadError("브이월드 3D 스크립트 로드에 실패했습니다."), {
          once: true
        });
      }

      return () => {
        disposed = true;
      };
    }

    const script = document.createElement("script");
    script.src = scriptSrc;
    script.async = true;
    script.dataset.vworldWebgl = "true";
    script.onload = initialize;
    script.onerror = () => setLoadError("브이월드 3D 스크립트 로드에 실패했습니다.");
    document.body.appendChild(script);

    return () => {
      disposed = true;
    };
  }, [mapId]);

  if (!isVworldEnabled) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-100 p-8 text-center text-sm text-slate-600">
        NEXT_PUBLIC_VWORLD_API_KEY 값이 없어 3D 지도를 표시할 수 없습니다.
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-950 p-8 text-center text-sm text-white/90">
        {loadError}
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-slate-950">
      <div id={mapId} ref={containerRef} className="h-full w-full" />
      <p className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-black/55 px-2 py-1 text-[11px] text-white/90 backdrop-blur">
        VWorld 3D API 3.0 Connected{env.vworldReferrer ? ` · ${env.vworldReferrer}` : ""}
      </p>
    </div>
  );
}
