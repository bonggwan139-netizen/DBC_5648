"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useZoneSelectionState } from "@/components/service/map/useZoneSelectionState";

export function CollapsiblePanel() {
  const [collapsed, setCollapsed] = useState(false);
  const {
    statusLabel,
    addMockStep,
    undoLast,
    clearAll,
    confirmSelection,
    canUndo,
    canConfirm,
    canCancel
  } = useZoneSelectionState();

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 360 }}
      transition={{ duration: 0.34, ease: [0.4, 0, 0.2, 1] }}
      className="relative z-20 flex h-full shrink-0 border-r border-slate-200/80 bg-white"
    >
      <div className="h-full w-full p-4">
        {!collapsed ? (
          <div className="flex h-full flex-col gap-4">
            <section className="rounded-2xl border border-stroke bg-slate-50/70 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Service</p>
              <h2 className="mt-2 text-lg font-semibold text-text">DBC-MAP Workspace</h2>
            </section>

            <section className="rounded-2xl border border-stroke bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">구역 선택</p>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={confirmSelection}
                    disabled={!canConfirm}
                    aria-label="Confirm"
                    className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-[11px] text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    onClick={undoLast}
                    disabled={!canUndo}
                    aria-label="Undo"
                    className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-[11px] text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ↺
                  </button>
                  <button
                    type="button"
                    onClick={clearAll}
                    disabled={!canCancel}
                    aria-label="Cancel"
                    className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-[11px] text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">{statusLabel}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => addMockStep("parcel")}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-600 transition hover:bg-slate-100"
                  >
                    + Parcel
                  </button>
                  <button
                    type="button"
                    onClick={() => addMockStep("draw")}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-600 transition hover:bg-slate-100"
                  >
                    + Draw
                  </button>
                </div>
              </div>
            </section>

            <section className="flex flex-1 flex-col gap-3 rounded-2xl border border-stroke bg-white p-4">
              <p className="text-sm text-slate-500">Layer / Tool Placeholders</p>
              <div className="h-16 rounded-xl border border-dashed border-slate-300 bg-slate-50" />
              <div className="h-16 rounded-xl border border-dashed border-slate-300 bg-slate-50" />
              <div className="h-16 rounded-xl border border-dashed border-slate-300 bg-slate-50" />
            </section>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center gap-4 pt-4">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          </div>
        )}
      </div>

      <button
        type="button"
        aria-label={collapsed ? "Expand panel" : "Collapse panel"}
        onClick={() => setCollapsed((prev) => !prev)}
        className="absolute -right-[14px] top-1/2 z-[1200] flex h-12 w-7 -translate-y-1/2 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        <motion.span
          animate={{ rotate: collapsed ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="flex items-center justify-center"
        >
          <svg viewBox="0 0 12 16" className="h-5 w-3" fill="none" aria-hidden="true">
            <path d="M9.5 2.5 3.5 8l6 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.span>
      </button>
    </motion.aside>
  );
}
