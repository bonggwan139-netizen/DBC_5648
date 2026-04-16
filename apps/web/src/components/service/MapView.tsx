"use client";

import { useState } from "react";
import { Map2DView } from "@/components/service/map/Map2DView";
import { Map3DView } from "@/components/service/map/Map3DView";
import { MapModeSwitch } from "@/components/service/map/MapModeSwitch";
import type { WorkspaceMode } from "@/components/service/map/types";

export function MapView() {
  const [mode, setMode] = useState<WorkspaceMode>("map2d");

  return (
    <div className="relative h-full w-full">
      {mode === "map2d" ? <Map2DView /> : <Map3DView />}
      <MapModeSwitch mode={mode} onChange={setMode} />
    </div>
  );
}
