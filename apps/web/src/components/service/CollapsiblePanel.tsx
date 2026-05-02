"use client";

import { type FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { useLandRegister } from "@/components/service/map/analysis/landRegisterState";
import { useSiteAnalysis, type SiteAnalysisSection } from "@/components/service/map/analysis/siteAnalysisState";
import { useMapSearch } from "@/components/service/map/search/mapSearchState";
import { useZoneSelectionPanel } from "@/components/service/map/zone-selection/useZoneSelectionPanel";

const siteAnalysisActions: Array<{ section: SiteAnalysisSection; label: string }> = [
  { section: "basic", label: "기본정보" },
  { section: "locationAnalysis", label: "입지분석" }
];

function formatReportTimestamp(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "_",
    pad(date.getHours()),
    pad(date.getMinutes())
  ].join("");
}

function stripFilenameQuotes(value: string) {
  const trimmed = value.trim();
  return trimmed.startsWith("\"") && trimmed.endsWith("\"") ? trimmed.slice(1, -1) : trimmed;
}

function parseContentDispositionFilename(header: string | null) {
  if (!header) {
    return null;
  }

  const filenameStarMatch = header.match(/filename\*=([^;]+)/i);
  if (filenameStarMatch) {
    const encodedPart = stripFilenameQuotes(filenameStarMatch[1]);
    const rfc5987Parts = encodedPart.split("'");
    const encodedFilename = rfc5987Parts.length >= 3 ? rfc5987Parts.slice(2).join("'") : encodedPart;

    try {
      return decodeURIComponent(encodedFilename);
    } catch {
      return encodedFilename;
    }
  }

  const filenameMatch = header.match(/filename=("[^"]+"|[^;]+)/i);
  return filenameMatch ? stripFilenameQuotes(filenameMatch[1]) : null;
}

function downloadReportBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function getReportCaptureErrorMessage(error: unknown) {
  return error instanceof Error && error.message ? error.message : "unknown error";
}

function logReportCaptureWarning(message: string, error: unknown) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.warn("[report-location-map]", message, error);
}

export function CollapsiblePanel() {
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isWordReportDownloading, setIsWordReportDownloading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportWarning, setReportWarning] = useState<string | null>(null);
  const { state: searchState, submitSearch } = useMapSearch();
  const { canRequest: canRequestLandRegister, openLandRegister } = useLandRegister();
  const { activeSection, canOpen: canOpenSiteAnalysis, openSection } = useSiteAnalysis();
  const {
    state: zoneSelectionState,
    modeBadgeLabel,
    detailLabel,
    feedback,
    activateParcelMode,
    activateDrawMode,
    undoSelection,
    cancelSelection,
    confirmSelection,
    isParcelActive,
    isDrawActive,
    canUndo,
    canConfirm,
    canCancel
  } = useZoneSelectionPanel();

  const handleSubmitSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submitSearch(searchQuery);
  };

  const confirmedZone =
    zoneSelectionState.status === "confirmed" && zoneSelectionState.confirmedZone
      ? zoneSelectionState.confirmedZone
      : null;
  const canDownloadWordReport = confirmedZone !== null && !isWordReportDownloading;

  const handleDownloadWordReport = async () => {
    if (!confirmedZone || !canDownloadWordReport) {
      return;
    }

    setReportError(null);
    setReportWarning(null);
    setIsWordReportDownloading(true);

    try {
      let locationMapImage: string | null = null;

      try {
        const { captureReportLocationMap } = await import(
          "@/components/service/map/analysis/reportLocationMapCapture"
        );
        locationMapImage = await captureReportLocationMap(confirmedZone.geometry);
      } catch (error) {
        const reason = getReportCaptureErrorMessage(error);
        logReportCaptureWarning("Capture failed; continuing report download without location_map_image.", error);
        setReportWarning(`지도 이미지 생성 실패: ${reason}`);
      }

      const requestBody: { zone: typeof confirmedZone.geometry; location_map_image?: string } = {
        zone: confirmedZone.geometry
      };

      if (locationMapImage) {
        requestBody.location_map_image = locationMapImage;
      }

      const response = await fetch("/analysis/report/word", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const message = await response.text().catch(() => "");
        throw new Error(message || `보고서 다운로드에 실패했습니다. (${response.status})`);
      }

      const blob = await response.blob();
      const filename =
        parseContentDispositionFilename(response.headers.get("Content-Disposition")) ??
        `대상지_현황분석_보고서_${formatReportTimestamp(new Date())}.docx`;

      downloadReportBlob(blob, filename);
    } catch (error) {
      setReportError(error instanceof Error ? error.message : "보고서 다운로드 중 오류가 발생했습니다.");
    } finally {
      setIsWordReportDownloading(false);
    }
  };

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

            <section className="rounded-2xl border border-stroke bg-white p-3">
              <form onSubmit={handleSubmitSearch} className="flex items-center gap-2">
                <label htmlFor="vworld-search" className="sr-only">
                  주소 검색
                </label>
                <div className="relative flex-1">
                  <input
                    id="vworld-search"
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="도로명주소 또는 지번 검색"
                    className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
                  />
                  <svg
                    viewBox="0 0 20 20"
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M12.5 12.5 17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </div>

                <button
                  type="submit"
                  disabled={searchState.isSearching}
                  aria-label="주소 검색 실행"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                    <path
                      d="M3.5 10h10M10.5 5.5 15 10l-4.5 4.5"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </form>

              {searchState.feedback ? (
                <p
                  className={`mt-2 text-[11px] ${
                    searchState.feedbackTone === "error"
                      ? "text-rose-600"
                      : searchState.feedbackTone === "success"
                        ? "text-emerald-700"
                        : "text-slate-500"
                  }`}
                >
                  {searchState.feedback}
                </p>
              ) : null}

              {searchState.lastResult ? (
                <p className="mt-1 truncate text-[11px] text-slate-500">최근 결과: {searchState.lastResult.label}</p>
              ) : null}
            </section>

            <section className="rounded-2xl border border-stroke bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">구역 선택</p>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={confirmSelection}
                    disabled={!canConfirm}
                    aria-label="확인"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                      <path
                        d="M4.5 10.5 8 14l7.5-8"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={undoSelection}
                    disabled={!canUndo}
                    aria-label="되돌리기"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                      <path
                        d="M7 6 3.5 9.5 7 13M4 9.5h6.25a4.25 4.25 0 0 1 0 8.5H9.5"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={cancelSelection}
                    disabled={!canCancel}
                    aria-label="취소"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                      <path d="m5.5 5.5 9 9m0-9-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={activateParcelMode}
                    className={`rounded-lg border px-3 py-1.5 text-[11px] font-medium transition ${
                      isParcelActive
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Parcel
                  </button>
                  <button
                    type="button"
                    onClick={activateDrawMode}
                    className={`rounded-lg border px-3 py-1.5 text-[11px] font-medium transition ${
                      isDrawActive
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Draw
                  </button>
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                    {modeBadgeLabel}
                  </span>
                </div>

                {detailLabel ? <p className="mt-2 text-[11px] text-slate-600">{detailLabel}</p> : null}
                {feedback ? <p className="mt-2 text-[11px] text-rose-600">{feedback}</p> : null}
              </div>
            </section>

            {canRequestLandRegister ? (
              <section className="rounded-2xl border border-stroke bg-white p-4">
                <button
                  type="button"
                  onClick={openLandRegister}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  <span>토지조서</span>
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                    <path
                      d="M7.5 4.5 12.5 10l-5 5.5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </section>
            ) : null}

            <section className="flex flex-1 flex-col gap-3 rounded-2xl border border-stroke bg-white p-4">
              <p className="text-sm font-semibold text-slate-700">Site Analysis</p>

              {canOpenSiteAnalysis ? (
                <div className="flex flex-col gap-2">
                  {siteAnalysisActions.map((action) => {
                    const isActive = activeSection === action.section;

                    return (
                      <button
                        key={action.section}
                        type="button"
                        onClick={() => openSection(action.section)}
                        className={`flex h-10 items-center justify-between rounded-xl border border-dashed px-3 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-slate-300 ${
                          isActive
                            ? "border-slate-700 bg-slate-900 text-white"
                            : "border-slate-300 bg-slate-50 text-slate-600 hover:bg-white"
                        }`}
                      >
                        <span>{action.label}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-[12px] text-slate-500">
                  구역 확정 후 분석 도구가 표시됩니다.
                </p>
              )}
            </section>

            {canOpenSiteAnalysis ? (
              <section className="rounded-2xl border border-stroke bg-white p-4">
                <p className="text-sm font-semibold text-slate-700">Report</p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadWordReport}
                    disabled={!canDownloadWordReport}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isWordReportDownloading ? "word..." : "word"}
                  </button>
                  <button
                    type="button"
                    disabled
                    title="PDF 보고서 다운로드는 추후 제공됩니다."
                    aria-label="pdf 보고서 다운로드는 추후 제공됩니다."
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    pdf
                  </button>
                </div>
                {reportWarning ? <p className="mt-2 text-[11px] text-amber-600">{reportWarning}</p> : null}
                {reportError ? <p className="mt-2 text-[11px] text-rose-600">{reportError}</p> : null}
              </section>
            ) : null}
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
