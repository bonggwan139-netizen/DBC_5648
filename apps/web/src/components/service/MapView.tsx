"use client";

import { useState } from "react";
import { Map2DView } from "@/components/service/map/Map2DView";
import { Map3DView } from "@/components/service/map/Map3DView";
import { MapModeSwitch } from "@/components/service/map/MapModeSwitch";
import type { WorkspaceMode } from "@/components/service/map/types";

export function MapView() {
  const [mode, setMode] = useState<WorkspaceMode>("map2d");
  const [show2DStyles, setShow2DStyles] = useState(true);

  const handleModeChange = (nextMode: WorkspaceMode) => {
    if (nextMode === "map2d") {
      if (mode === "map2d") {
        setShow2DStyles((prev) => !prev);
        return;
      }

      setMode("map2d");
      setShow2DStyles(true);
      return;
    }

    setMode("map3d");
    setShow2DStyles(false);
  };

  return (
    <div className="relative h-full w-full">
      {mode === "map2d" ? <Map2DView showStyleSelector={show2DStyles} /> : <Map3DView />}
      <MapModeSwitch mode={mode} onChange={handleModeChange} />
    </div>
  );
}
