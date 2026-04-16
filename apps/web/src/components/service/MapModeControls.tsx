"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

export function MapModeControls() {
  const [is2DCardOpen, setIs2DCardOpen] = useState(false);
  const [mapMode, setMapMode] = useState<"2d" | "3d">("2d");

  const handle2DClick = () => {
    setMapMode("2d");
    setIs2DCardOpen((prev) => !prev);
  };

  const handle3DClick = () => {
    setMapMode("3d");
    setIs2DCardOpen(false);
  };

  return (
    <div className="absolute right-6 top-5 z-[1300] flex flex-col items-end gap-2">
      <div className="flex items-center overflow-hidden rounded-xl border border-slate-300 bg-white/95 p-1 shadow-md backdrop-blur-sm">
        <button
          type="button"
          onClick={handle2DClick}
          className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
            mapMode === "2d" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          2D지도
        </button>
        <button
          type="button"
          onClick={handle3DClick}
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
            <div className="flex items-center gap-1 p-1">
              <button
                type="button"
                className="rounded-lg bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white"
              >
                그림지도
              </button>
              <button
                type="button"
                className="rounded-lg px-4 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
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
