"use client";

import { useMemo } from "react";
import { env, isVworldEnabled } from "@/config/env";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function Map3DView() {
  const srcDoc = useMemo(() => {
    const params = new URLSearchParams({
      version: "3.0",
      apiKey: env.vworldApiKey,
      domain: env.vworldDomain
    });

    const bootstrapSrc = escapeHtml(`${env.vworld3dBootstrapUrl}?${params.toString()}`);

    return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <style>
      html, body, #vworld-3d { margin: 0; width: 100%; height: 100%; overflow: hidden; background: #020617; }
      #fallback { position: absolute; inset: 0; display: none; align-items: center; justify-content: center; color: #fff; font: 14px sans-serif; background: #0f172a; }
    </style>
    <script src="${bootstrapSrc}"></script>
  </head>
  <body>
    <div id="vworld-3d"></div>
    <div id="fallback">브이월드 3D 초기화에 실패했습니다.</div>
    <script>
      (function () {
        var tries = 0;
        var timer = setInterval(function () {
          tries += 1;

          if (window.vw && window.vw.Map) {
            clearInterval(timer);
            try {
              var map = new window.vw.Map();
              map.setOption({
                mapId: 'vworld-3d',
                initPosition: new window.vw.CameraPosition(
                  new window.vw.CoordZ(127.0276, 37.4979, 1500),
                  new window.vw.Direction(0, -90, 0)
                ),
                logo: true,
                navigation: true
              });
              map.start();
            } catch (error) {
              var fallback = document.getElementById('fallback');
              if (fallback) fallback.style.display = 'flex';
            }
            return;
          }

          if (tries > 80) {
            clearInterval(timer);
            var fallback = document.getElementById('fallback');
            if (fallback) fallback.style.display = 'flex';
          }
        }, 100);
      })();
    </script>
  </body>
</html>`;
  }, []);

  if (!isVworldEnabled) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-100 p-8 text-center text-sm text-slate-600">
        NEXT_PUBLIC_VWORLD_API_KEY 값이 없어 3D 지도를 표시할 수 없습니다.
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-slate-950">
      <iframe title="VWorld 3D Map" srcDoc={srcDoc} className="h-full w-full border-0" allowFullScreen />
      <p className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-black/55 px-2 py-1 text-[11px] text-white/90 backdrop-blur">
        VWorld 3D API 3.0 Connected{env.vworldReferrer ? ` · ${env.vworldReferrer}` : ""}
      </p>
    </div>
  );
}
