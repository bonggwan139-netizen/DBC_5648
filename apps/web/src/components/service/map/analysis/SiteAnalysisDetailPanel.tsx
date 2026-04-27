"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLandRegister } from "./landRegisterState";
import { buildSiteAnalysisLocationRows } from "./siteAnalysisLocation";
import { useSiteAnalysis } from "./siteAnalysisState";

export function SiteAnalysisDetailPanel() {
  const { activeDetailItem, canOpen } = useSiteAnalysis();
  const { canRequest, data, error, loadLandRegister, status } = useLandRegister();
  const [collapsed, setCollapsed] = useState(false);
  const locationRows = buildSiteAnalysisLocationRows(data);

  useEffect(() => {
    if (activeDetailItem) {
      setCollapsed(false);
    }
  }, [activeDetailItem]);

  useEffect(() => {
    if (canRequest && activeDetailItem === "basicLocationInfo" && status === "idle") {
      void loadLandRegister();
    }
  }, [activeDetailItem, canRequest, loadLandRegister, status]);

  if (!canOpen || activeDetailItem !== "basicLocationInfo") {
    return null;
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 460 }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      className="absolute right-0 top-0 z-20 flex h-full border-l border-slate-200/80 bg-white shadow-xl"
    >
      <button
        type="button"
        aria-label={collapsed ? "위치정보 패널 펼치기" : "위치정보 패널 접기"}
        onClick={() => setCollapsed((prev) => !prev)}
        className="absolute -left-[14px] top-1/2 z-10 flex h-12 w-7 -translate-y-1/2 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        <motion.span
          animate={{ rotate: collapsed ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="flex items-center justify-center"
        >
          <svg viewBox="0 0 12 16" className="h-5 w-3" fill="none" aria-hidden="true">
            <path d="M2.5 2.5 8.5 8l-6 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.span>
      </button>

      {!collapsed ? (
        <div className="flex min-w-0 flex-1 flex-col p-5">
          <header className="border-b border-slate-200 pb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Site Analysis</p>
            <h2 className="mt-1 text-base font-semibold text-slate-900">위치정보</h2>
          </header>

          <section className="min-h-0 flex-1 overflow-y-auto pt-5">
            <h3 className="text-sm font-semibold text-slate-800">소재지</h3>

            {status === "loading" ? (
              <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-[12px] text-slate-500">
                위치정보를 불러오는 중입니다.
              </p>
            ) : null}

            {status === "error" ? (
              <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-4 text-[12px] text-rose-700">
                {error ?? "위치정보를 불러오지 못했습니다."}
              </p>
            ) : null}

            {status === "success" && locationRows.length > 0 ? (
              <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full divide-y divide-slate-200 text-left text-[12px]">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-3 py-2 font-semibold">PNU</th>
                      <th className="px-3 py-2 font-semibold">주소</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                    {locationRows.map((row) => (
                      <tr key={row.id}>
                        <td className="break-all px-3 py-2 font-medium">{row.pnu ?? "-"}</td>
                        <td className="break-words px-3 py-2 font-medium">{row.address ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {status === "success" && locationRows.length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-[12px] text-slate-500">
                토지조서 분석 결과에서 위치정보를 찾을 수 없습니다.
              </p>
            ) : null}
          </section>
        </div>
      ) : (
        <div className="flex h-full w-full items-start justify-center pt-5">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        </div>
      )}
    </motion.aside>
  );
}
