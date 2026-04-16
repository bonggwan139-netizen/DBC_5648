"use client";

import { motion } from "framer-motion";

export function HomeHero() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-56px)] w-full max-w-canvas items-center justify-center py-8">
      <div className="relative grid h-[760px] w-full grid-cols-[500px_1fr] overflow-hidden rounded-card border border-stroke bg-surface px-14 py-12 shadow-soft">
        <div className="flex h-full flex-col justify-end">
          <p className="text-sm text-muted">@dbc_5648</p>
          <h1 className="mt-5 whitespace-pre-line text-[86px] font-semibold leading-[0.95] tracking-[-0.04em] text-text">
            {"DBC-5648\nPORTFOLIO"}
          </h1>
          <p className="mt-8 max-w-[470px] text-base leading-7 text-muted">
            Urban planning, spatial data, and practical digital tools gathered into one evolving portfolio space.
            More projects and working experiments will be added over time.
          </p>
          <div className="mt-10 flex gap-3">
            <button
              type="button"
              disabled
              className="h-10 w-[92px] cursor-not-allowed rounded-full border border-slate-200 bg-slate-100 text-sm font-medium text-slate-400"
            >
              Coming Soon
            </button>
            <button
              type="button"
              disabled
              className="h-10 w-[78px] cursor-not-allowed rounded-full border border-slate-200 bg-slate-100 text-sm font-medium text-slate-400"
            >
              Preview
            </button>
          </div>
        </div>

        <div className="relative ml-4 h-full">
          <div className="absolute -right-20 top-16 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(148,163,255,0.35),rgba(148,163,255,0)_65%)]" />
          <div className="absolute -right-2 top-24 h-[460px] w-[460px] rounded-full border border-indigo-200/50 bg-[conic-gradient(from_180deg,rgba(226,232,255,0.75),rgba(241,245,255,0.2),rgba(199,210,254,0.4),rgba(226,232,255,0.75))] blur-[1px]" />
          <div className="absolute right-16 top-40 h-[300px] w-[300px] rounded-full border border-slate-200/70 bg-white/70 shadow-[0_12px_34px_rgba(89,109,176,0.08)]" />
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0.6, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, ease: "easeOut" }}
            className="absolute right-4 top-32 h-[420px] w-[420px] rounded-full border border-indigo-100/70"
          />
        </div>
      </div>
    </section>
  );
}
