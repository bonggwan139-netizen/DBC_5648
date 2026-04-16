"use client";

import { AnimatePresence, motion } from "framer-motion";

type BasemapType = "graphic" | "satellite";
type MapMode = "2d" | "3d";

type MapModeControlsProps = {
  mapMode: MapMode;
  basemap: BasemapType;
  is2DCardOpen: boolean;
  onToggle2DCard: () => void;
  onClick3D: () => void;
  onSelectBasemap: (type: BasemapType) => void;
};

export function MapModeControls({
  mapMode,
  basemap,
  is2DCardOpen,
  onToggle2DCard,
  onClick3D,
  onSelectBasemap
}: MapModeControlsProps) {
  return (
    <div className="absolute left-6 top-5 z-[1300] flex flex-col items-start gap-2">
      <div className="flex items-center overflow-hidden rounded-xl border border-slate-300 bg-white/95 p-1 shadow-md backdrop-blur-sm">
        <button
          type="button"
          onClick={onToggle2DCard}
          className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
            mapMode === "2d" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          2D지도
        </button>
        <button
          type="button"
          onClick={onClick3D}
          className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
            mapMode === "3d" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          3D지도
        </button>
      </div>

      <AnimatePresence>
        {is2DCardOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.2, 0, 0.2, 1] }}
            className="overflow-hidden rounded-xl border border-slate-300 bg-white/95 shadow-md backdrop-blur-sm"
          >
            <div className="flex min-w-[120px] flex-col gap-1 p-1">
              <button
                type="button"
                onClick={() => onSelectBasemap("graphic")}
                className={`rounded-lg px-4 py-1.5 text-left text-sm font-semibold transition ${
                  basemap === "graphic" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                그림지도
              </button>
              <button
                type="button"
                onClick={() => onSelectBasemap("satellite")}
                className={`rounded-lg px-4 py-1.5 text-left text-sm font-semibold transition ${
                  basemap === "satellite" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                위성지도
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
