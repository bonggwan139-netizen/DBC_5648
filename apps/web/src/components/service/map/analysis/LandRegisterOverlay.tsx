"use client";

import { type ReactNode, useState } from "react";
import { downloadLandRegisterExcel } from "./landRegisterExcel";
import { useLandRegister } from "./landRegisterState";
import type { LandRegisterRow } from "./landRegisterTypes";

const areaFormatter = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 2
});

const priceFormatter = new Intl.NumberFormat("ko-KR");

function formatArea(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }

  return `${areaFormatter.format(value)}㎡`;
}

function formatRatio(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }

  return `${areaFormatter.format(value)}%`;
}

function formatPrice(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }

  return `${priceFormatter.format(value)}원`;
}

function getRowKey(row: LandRegisterRow) {
  return `${row.no}-${row.pnu}-${row.ledger_no}`;
}

export function LandRegisterOverlay() {
  const { isOpen, status, data, error, closeLandRegister } = useLandRegister();
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);
  const canDownloadExcel = status === "success" && data !== null && !isDownloadingExcel;

  const handleDownloadExcel = async () => {
    if (!data || !canDownloadExcel) {
      return;
    }

    try {
      setIsDownloadingExcel(true);
      await downloadLandRegisterExcel(data);
    } finally {
      setIsDownloadingExcel(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-[1100] flex items-start justify-center px-4 py-6 md:items-center md:justify-start md:pl-8 lg:pl-12">
      <section className="pointer-events-auto flex max-h-[calc(100vh-128px)] w-full max-w-[980px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur md:w-[min(980px,calc(100vw-430px))]">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Land Register</p>
            <h2 className="mt-1 text-base font-semibold text-slate-900">토지조서</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadExcel}
              disabled={!canDownloadExcel}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              엑셀 다운
            </button>
            <button
              type="button"
              onClick={closeLandRegister}
              aria-label="토지조서 닫기"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                <path d="m5.5 5.5 9 9m0-9-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {status === "loading" ? (
            <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 text-sm text-slate-500">
              토지조서를 불러오는 중입니다.
            </div>
          ) : null}

          {status === "error" ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error ?? "토지조서 요청 중 오류가 발생했습니다."}
            </div>
          ) : null}

          {status === "success" && data ? (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <SummaryCard label="편입 필지 수" value={`${priceFormatter.format(data.summary.parcel_count)}필지`} />
                <SummaryCard label="완전편입" value={`${priceFormatter.format(data.summary.full_included_count)}필지`} />
                <SummaryCard label="부분편입" value={`${priceFormatter.format(data.summary.partial_included_count)}필지`} />
                <SummaryCard label="총 편입면적" value={formatArea(data.summary.total_included_area_m2)} />
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="max-h-[420px] overflow-auto">
                  <table className="min-w-[1120px] divide-y divide-slate-200 text-left text-[11px]">
                    <thead className="sticky top-0 z-10 bg-slate-50 text-slate-500">
                      <tr>
                        <TableHeader>연번</TableHeader>
                        <TableHeader>PNU</TableHeader>
                        <TableHeader>소재지</TableHeader>
                        <TableHeader>지목</TableHeader>
                        <TableHeader>공부면적</TableHeader>
                        <TableHeader>편입면적</TableHeader>
                        <TableHeader>편입률</TableHeader>
                        <TableHeader>편입구분</TableHeader>
                        <TableHeader>개별공시지가</TableHeader>
                        <TableHeader>기준일</TableHeader>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                      {data.rows.length > 0 ? (
                        data.rows.map((row) => (
                          <tr key={getRowKey(row)} className="hover:bg-slate-50">
                            <TableCell className="font-medium text-slate-900">{row.no}</TableCell>
                            <TableCell className="font-mono text-[10px] text-slate-600">{row.pnu}</TableCell>
                            <TableCell className="min-w-[220px]">{row.address}</TableCell>
                            <TableCell>{row.jimok}</TableCell>
                            <TableCell>{formatArea(row.land_area_m2)}</TableCell>
                            <TableCell>{formatArea(row.included_area_m2)}</TableCell>
                            <TableCell>{formatRatio(row.included_ratio)}</TableCell>
                            <TableCell>{row.inclusion_type}</TableCell>
                            <TableCell>{formatPrice(row.official_price)}</TableCell>
                            <TableCell>{row.price_base_date ?? "-"}</TableCell>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={10} className="px-4 py-10 text-center text-sm text-slate-500">
                            편입 필지가 없습니다.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function TableHeader({ children }: { children: ReactNode }) {
  return <th className="whitespace-nowrap px-3 py-2 font-semibold">{children}</th>;
}

function TableCell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`whitespace-nowrap px-3 py-2 ${className}`}>{children}</td>;
}
