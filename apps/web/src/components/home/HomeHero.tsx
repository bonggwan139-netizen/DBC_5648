"use client";

import Link from "next/link";

export function HomeHero() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-56px)] w-full max-w-canvas items-center justify-center py-8">
      <div className="relative flex h-[760px] w-full items-center overflow-hidden rounded-card border border-stroke bg-surface px-14 py-12 shadow-soft">
        <div className="flex w-full flex-col justify-center">
          <p className="text-sm text-muted">@dbc_5648</p>
          <h1 className="mt-5 text-[86px] font-semibold leading-[0.95] text-text">
            <span className="block">DBC-</span>
            <span className="block">ANALYSIS</span>
          </h1>
          <div className="mt-10 flex gap-3">
            <Link
              href="/portfolio/dbc-map"
              className="inline-flex h-10 items-center rounded-full border border-[#102156] bg-[#102156] px-5 text-sm font-semibold text-white transition hover:bg-[#1a316f] focus:outline-none focus:ring-2 focus:ring-[#102156]/30"
            >
              DBC-MAP 시작하기
            </Link>
            <Link
              href="/portfolio"
              className="inline-flex h-10 items-center rounded-full border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-[#102156] hover:text-[#102156] focus:outline-none focus:ring-2 focus:ring-[#102156]/20"
            >
              서비스 살펴보기
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
