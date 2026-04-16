"use client";

import { env } from "@/config/env";

export function Map3DView() {
  return (
    <div className="relative h-full w-full bg-slate-950">
      <iframe
        title="VWorld 3D Map"
        src={env.vworld3dUrl}
        className="h-full w-full border-0"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
      <p className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-black/55 px-2 py-1 text-[11px] text-white/90 backdrop-blur">
        VWorld 3D Map Connected{env.vworldReferrer ? ` · ${env.vworldReferrer}` : ""}
      </p>
    </div>
  );
}
