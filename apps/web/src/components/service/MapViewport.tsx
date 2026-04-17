"use client";

import { useMemo, useState } from "react";
import { MapModeControls } from "@/components/service/MapModeControls";

type BasemapType = "graphic" | "satellite";
type MapMode = "2d" | "3d";

const MAP_LINKS: Record<MapMode, Record<BasemapType, string>> = {
  "2d": {
    graphic: "https://map.vworld.kr/map/ws3dmap.do",
    satellite: "https://map.vworld.kr/map/ws3dmap.do?mapMode=SATELLITE"
  },
  "3d": {
    graphic: "https://map.vworld.kr/map/ws3dmap.do?mapMode=3D",
    satellite: "https://map.vworld.kr/map/ws3dmap.do?mapMode=3D"
  }
};

export function MapViewport() {
  const [mapMode, setMapMode] = useState<MapMode>("2d");
  const [basemap, setBasemap] = useState<BasemapType>("graphic");
  const [is2DCardOpen, setIs2DCardOpen] = useState(false);

  const mapSrc = useMemo(() => MAP_LINKS[mapMode][basemap], [mapMode, basemap]);

  const handleToggle2DCard = () => {
    setMapMode("2d");
    setIs2DCardOpen((prev) => !prev);
  };

  const handleClick3D = () => {
    setMapMode("3d");
    setIs2DCardOpen(false);
  };

  const handleSelectBasemap = (type: BasemapType) => {
    setMapMode("2d");
    setBasemap(type);
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#eef3ff]">
      <iframe
        title="VWorld Map"
        src={mapSrc}
        className="absolute inset-0 h-full w-full border-0"
        loading="eager"
        referrerPolicy="no-referrer-when-downgrade"
      />

      <MapModeControls
        mapMode={mapMode}
        basemap={basemap}
        is2DCardOpen={is2DCardOpen}
        onToggle2DCard={handleToggle2DCard}
        onClick3D={handleClick3D}
        onSelectBasemap={handleSelectBasemap}
      />

      <div className="absolute right-3 top-2 z-[1200] overflow-hidden rounded-md border border-slate-300 bg-white/95 shadow-md backdrop-blur-sm">
        <button type="button" className="block h-9 w-9 border-b border-slate-200 text-2xl leading-none text-slate-700">+</button>
        <button type="button" className="block h-9 w-9 border-b border-slate-200 text-2xl leading-none text-slate-700">−</button>
        <div className="flex h-14 w-9 flex-col items-center justify-center gap-0.5 text-[11px] text-slate-500">
          <span>▲</span>
          <span>▼</span>
        </div>
      </div>
    </div>
  );
}
