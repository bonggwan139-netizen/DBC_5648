"use client";

import { type ChangeEvent, type FormEvent, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLandRegister } from "@/components/service/map/analysis/landRegisterState";
import { useSiteAnalysis } from "@/components/service/map/analysis/siteAnalysisState";
import { useMapSearch } from "@/components/service/map/search/mapSearchState";
import { useZoneSelectionSearch } from "@/components/service/map/zone-selection/zoneSelectionSearchState";
import { parseZoneShpZipFile } from "@/components/service/map/zone-selection/zoneSelectionShpImport";
import { useZoneSelectionPanel } from "@/components/service/map/zone-selection/useZoneSelectionPanel";

type WorkspaceStage = "site" | "overview" | "analysis" | "report";

const workspaceStages: Array<{ id: WorkspaceStage; label: string; step: string }> = [
  { id: "site", label: "대상지", step: "1" },
  { id: "overview", label: "토지·건축", step: "2" },
  { id: "analysis", label: "환경·계획", step: "3" },
  { id: "report", label: "보고서", step: "4" }
];

type PendingShpImport = Awaited<ReturnType<typeof parseZoneShpZipFile>>;

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
  const shpInputRef = useRef<HTMLInputElement | null>(null);
  const shpConfirmLockRef = useRef(false);
  const [collapsed, setCollapsed] = useState(false);
  const [activeStage, setActiveStage] = useState<WorkspaceStage>("site");
  const [searchQuery, setSearchQuery] = useState("");
  const [isWordReportDownloading, setIsWordReportDownloading] = useState(false);
  const [isShpImporting, setIsShpImporting] = useState(false);
  const [isShpImportCardOpen, setIsShpImportCardOpen] = useState(false);
  const [pendingShpImport, setPendingShpImport] = useState<PendingShpImport | null>(null);
  const [shpImportMessage, setShpImportMessage] = useState<{
    tone: "error" | "success";
    text: string;
  } | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportWarning, setReportWarning] = useState<string | null>(null);
  const { state: searchState, submitSearch } = useMapSearch();
  const { openPanel: openZoneSearchPanel } = useZoneSelectionSearch();
  const { canRequest: canRequestLandRegister, openLandRegister } = useLandRegister();
  const { activeSection, canOpen: canOpenSiteAnalysis, openSection } = useSiteAnalysis();
  const {
    state: zoneSelectionState,
    detailLabel,
    feedback,
    activateParcelMode,
    activateDrawMode,
    importShpGeometries,
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

  const handleOpenShpPicker = () => {
    if (isShpImporting) {
      return;
    }

    shpInputRef.current?.click();
  };

  const handleOpenShpImportCard = () => {
    setIsShpImportCardOpen(true);
  };

  const handleCancelShpImport = () => {
    if (isShpImporting) {
      return;
    }

    setPendingShpImport(null);
    setShpImportMessage(null);
    setIsShpImportCardOpen(false);
  };

  const handleConfirmShpImport = () => {
    if (!pendingShpImport || isShpImporting || shpConfirmLockRef.current) {
      return;
    }

    shpConfirmLockRef.current = true;
    const importToApply = pendingShpImport;
    setPendingShpImport(null);
    setShpImportMessage(null);
    setIsShpImportCardOpen(false);
    importShpGeometries(importToApply);
    queueMicrotask(() => {
      shpConfirmLockRef.current = false;
    });
  };

  const handleShpFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";

    if (!file || isShpImporting) {
      return;
    }

    setIsShpImporting(true);
    setPendingShpImport(null);
    setShpImportMessage(null);

    try {
      const result = await parseZoneShpZipFile(file);
      setPendingShpImport(result);
      setShpImportMessage({
        tone: "success",
        text: `SHP 파일을 확인했습니다. (${result.metadata.featureCount}개) 적용을 눌러 초안에 추가하세요.`
      });
    } catch (error) {
      setShpImportMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "SHP ZIP 파일을 가져올 수 없습니다."
      });
    } finally {
      setIsShpImporting(false);
    }
  };

  const confirmedZone =
    zoneSelectionState.status === "confirmed" && zoneSelectionState.confirmedZone
      ? zoneSelectionState.confirmedZone
      : null;
  const canDownloadWordReport = confirmedZone !== null && !isWordReportDownloading;
  const targetStatusLabel =
    zoneSelectionState.status === "editing"
      ? "구역 편집 중"
      : confirmedZone
        ? "대상지 확정"
        : "대상지 미설정";
  const canUseAnalysis = confirmedZone !== null && canOpenSiteAnalysis;

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
      animate={{ width: collapsed ? 72 : 404 }}
      transition={{ duration: 0.34, ease: [0.4, 0, 0.2, 1] }}
      className="relative z-20 flex h-full shrink-0 border-r border-slate-200 bg-white"
    >
      <nav
        aria-label="DBC-MAP 작업 단계"
        className="flex h-full w-[72px] shrink-0 flex-col items-center gap-2 border-r border-slate-200 bg-slate-50 px-2 py-4"
      >
        {workspaceStages.map((stage) => {
          const isActive = activeStage === stage.id;

          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => setActiveStage(stage.id)}
              aria-current={isActive ? "step" : undefined}
              aria-label={`${stage.label} 단계 열기`}
              className={`flex w-full flex-col items-center gap-1 rounded-md border px-1.5 py-2 text-[10px] font-semibold leading-4 transition focus:outline-none focus:ring-2 focus:ring-[#102156]/30 ${
                isActive
                  ? "border-[#102156] bg-[#102156] text-white"
                  : "border-transparent bg-white text-slate-600 hover:border-slate-200 hover:text-[#102156]"
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11px] ${
                  isActive ? "border-white/70" : "border-slate-300"
                }`}
              >
                {stage.step}
              </span>
              <span>{stage.label}</span>
            </button>
          );
        })}
      </nav>

      {!collapsed ? (
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-slate-200 px-5 py-4">
            <p className="text-[11px] font-semibold text-slate-500">도시계획 분석 워크스페이스</p>
            <h2 className="mt-1 text-lg font-semibold text-[#102156]">DBC-MAP 도시계획 분석</h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600">
                {targetStatusLabel}
              </span>
              {canUseAnalysis ? (
                <span className="rounded-md border border-[#102156]/20 bg-[#102156]/5 px-2 py-1 text-[11px] font-semibold text-[#102156]">
                  분석 가능
                </span>
              ) : null}
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {activeStage === "site" ? (
              <div className="space-y-5">
                <section>
                  <h3 className="text-sm font-semibold text-slate-900">대상지 검색</h3>
                  <form onSubmit={handleSubmitSearch} className="mt-3 flex items-center gap-2">
                    <label htmlFor="vworld-search" className="sr-only">
                      도로명주소 또는 지번 검색
                    </label>
                    <div className="relative flex-1">
                      <input
                        id="vworld-search"
                        type="search"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="도로명주소 또는 지번 검색"
                        className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#102156] focus:ring-2 focus:ring-[#102156]/15"
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
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#102156] bg-[#102156] text-white transition hover:bg-[#1a316f] focus:outline-none focus:ring-2 focus:ring-[#102156]/30 disabled:cursor-not-allowed disabled:opacity-50"
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
                    <p className="mt-1 truncate text-[11px] text-slate-500">
                      최근 결과: {searchState.lastResult.label}
                    </p>
                  ) : null}
                </section>

                <section data-zone-selection-card="true" className="border-t border-slate-200 pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">대상지 설정</h3>
                      <p className="mt-1 text-[12px] leading-5 text-slate-500">
                        필지, 직접 그리기, SHP ZIP 파일로 분석 대상 구역을 지정합니다.
                      </p>
                    </div>
                    <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                      {targetStatusLabel}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={activateParcelMode}
                      className={`rounded-md border px-3 py-2 text-[12px] font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#102156]/30 ${
                        isParcelActive
                          ? "border-[#102156] bg-[#102156] text-white"
                          : "border-slate-300 bg-white text-slate-700 hover:border-[#102156] hover:text-[#102156]"
                      }`}
                    >
                      필지 선택
                    </button>
                    <button
                      type="button"
                      onClick={activateDrawMode}
                      className={`rounded-md border px-3 py-2 text-[12px] font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#102156]/30 ${
                        isDrawActive
                          ? "border-[#102156] bg-[#102156] text-white"
                          : "border-slate-300 bg-white text-slate-700 hover:border-[#102156] hover:text-[#102156]"
                      }`}
                    >
                      직접 그리기
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenShpImportCard}
                      disabled={isShpImporting}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-[12px] font-semibold text-slate-700 transition hover:border-[#102156] hover:text-[#102156] focus:outline-none focus:ring-2 focus:ring-[#102156]/30 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      SHP 불러오기
                    </button>
                    <button
                      type="button"
                      onClick={openZoneSearchPanel}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-[12px] font-semibold text-slate-700 transition hover:border-[#102156] hover:text-[#102156] focus:outline-none focus:ring-2 focus:ring-[#102156]/30"
                    >
                      지번 검색
                    </button>
                    <input
                      ref={shpInputRef}
                      type="file"
                      accept=".zip"
                      className="hidden"
                      onChange={handleShpFileChange}
                    />
                  </div>

                  {isShpImportCardOpen ? (
                    <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                      <button
                        type="button"
                        onClick={handleOpenShpPicker}
                        disabled={isShpImporting}
                        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 transition hover:border-[#102156] hover:text-[#102156] focus:outline-none focus:ring-2 focus:ring-[#102156]/30 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isShpImporting ? "불러오는 중..." : "파일 선택"}
                      </button>

                      <ul className="mt-3 space-y-1 text-[11px] leading-5 text-slate-600">
                        <li>ZIP 파일만 가능 (.shp, .shx, .dbf, .prj 포함)</li>
                        <li>EPSG:4326 좌표계만 가능</li>
                        <li>Polygon / MultiPolygon만 가능</li>
                        <li>20MB 이하만 가능</li>
                      </ul>

                      {shpImportMessage ? (
                        <p
                          className={`mt-3 text-[11px] ${
                            shpImportMessage.tone === "error" ? "text-rose-600" : "text-[#102156]"
                          }`}
                        >
                          {shpImportMessage.text}
                        </p>
                      ) : null}

                      <div className="mt-3 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={handleCancelShpImport}
                          disabled={isShpImporting}
                          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          취소
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirmShpImport}
                          disabled={!pendingShpImport || isShpImporting}
                          className="rounded-md border border-[#102156] bg-[#102156] px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-[#1a316f] focus:outline-none focus:ring-2 focus:ring-[#102156]/30 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          적용
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-200 pt-3">
                    <button
                      type="button"
                      onClick={undoSelection}
                      disabled={!canUndo}
                      className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      되돌리기
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={cancelSelection}
                        disabled={!canCancel}
                        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={confirmSelection}
                        disabled={!canConfirm}
                        className="rounded-md border border-[#102156] bg-[#102156] px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-[#1a316f] focus:outline-none focus:ring-2 focus:ring-[#102156]/30 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        적용
                      </button>
                    </div>
                  </div>

                  {isDrawActive ? (
                    <div className="mt-3 rounded-md border border-[#102156]/20 bg-[#102156]/5 px-3 py-2 text-[12px] leading-5 text-[#102156]">
                      <p className="font-semibold">그리기 안내</p>
                      <p className="mt-0.5">
                        지도에서 경계점을 차례로 클릭한 뒤, 마지막 지점에서 더블클릭하면 그리기가 완료됩니다.
                      </p>
                    </div>
                  ) : null}

                  {detailLabel ? <p className="mt-3 text-[11px] leading-5 text-slate-600">{detailLabel}</p> : null}
                  {feedback ? <p className="mt-2 text-[11px] leading-5 text-rose-600">{feedback}</p> : null}
                </section>
              </div>
            ) : null}

            {activeStage === "overview" ? (
              <div className="space-y-4">
                <section>
                  <h3 className="text-sm font-semibold text-slate-900">토지·건축 분석</h3>
                  {!confirmedZone ? (
                    <p className="mt-3 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-[12px] leading-5 text-slate-500">
                      대상지를 확정하면 토지와 건축물 현황을 분석할 수 있습니다.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-3">
                      <button
                        type="button"
                        onClick={openLandRegister}
                        disabled={!canRequestLandRegister}
                        className="flex w-full items-center justify-between rounded-md border border-[#102156] bg-[#102156] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1a316f] focus:outline-none focus:ring-2 focus:ring-[#102156]/30 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span>토지조서 확인</span>
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

                      <div className="rounded-md border border-slate-200 bg-white p-3">
                        <p className="text-[12px] leading-5 text-slate-500">
                          지목, 소유, 면적, 공시지가, 토지형상, 접도 및 건축물 현황을 확인합니다.
                        </p>
                        <button
                          type="button"
                          onClick={() => openSection("basic")}
                          className={`mt-3 flex w-full items-center justify-between rounded-md border px-4 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#102156]/30 ${
                            activeSection === "basic"
                              ? "border-[#102156] bg-[#102156] text-white"
                              : "border-slate-300 bg-white text-[#102156] hover:border-[#102156]"
                          }`}
                        >
                          <span>토지·건축 분석 열기</span>
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
                      </div>
                    </div>
                  )}
                </section>
              </div>
            ) : null}

            {activeStage === "analysis" ? (
              <div className="space-y-4">
                <section>
                  <h3 className="text-sm font-semibold text-slate-900">환경·도시계획 분석</h3>
                  {!confirmedZone ? (
                    <p className="mt-3 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-[12px] leading-5 text-slate-500">
                      대상지를 확정하면 환경·도시계획 분석을 열 수 있습니다.
                    </p>
                  ) : (
                    <div className="mt-3 rounded-md border border-slate-200 bg-white p-3">
                      <p className="text-[12px] leading-5 text-slate-500">
                        자연환경 조건과 도시계획 규제를 지도와 통계로 확인합니다.
                      </p>
                      <button
                        type="button"
                        onClick={() => openSection("locationAnalysis")}
                        className={`mt-3 flex w-full items-center justify-between rounded-md border px-4 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#102156]/30 ${
                          activeSection === "locationAnalysis"
                            ? "border-[#102156] bg-[#102156] text-white"
                            : "border-[#102156] bg-[#102156] text-white hover:bg-[#1a316f]"
                        }`}
                      >
                        <span>환경·도시계획 분석 열기</span>
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
                    </div>
                  )}
                </section>
              </div>
            ) : null}

            {activeStage === "report" ? (
              <div className="space-y-4">
                <section>
                  <h3 className="text-sm font-semibold text-slate-900">보고서</h3>
                  {!confirmedZone ? (
                    <p className="mt-3 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-[12px] leading-5 text-slate-500">
                      대상지를 확정하면 분석보고서를 생성할 수 있습니다.
                    </p>
                  ) : (
                    <div className="mt-3 rounded-md border border-slate-200 bg-white p-3">
                      <p className="text-[12px] leading-5 text-slate-500">
                        대상지 토지·건축 분석과 환경·도시계획 분석 결과를 Word 보고서로 생성합니다.
                      </p>
                      <button
                        type="button"
                        onClick={handleDownloadWordReport}
                        disabled={!canDownloadWordReport}
                        className="mt-3 flex w-full items-center justify-between rounded-md border border-[#102156] bg-[#102156] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1a316f] focus:outline-none focus:ring-2 focus:ring-[#102156]/30 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span>{isWordReportDownloading ? "보고서 생성 중..." : "분석보고서 다운로드"}</span>
                        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                          <path
                            d="M10 3.5v8m0 0 3.5-3.5M10 11.5 6.5 8M4.5 15.5h11"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                      {reportWarning ? <p className="mt-2 text-[11px] leading-5 text-amber-600">{reportWarning}</p> : null}
                      {reportError ? <p className="mt-2 text-[11px] leading-5 text-rose-600">{reportError}</p> : null}
                    </div>
                  )}
                </section>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        aria-label={collapsed ? "작업 패널 펼치기" : "작업 패널 접기"}
        onClick={() => setCollapsed((prev) => !prev)}
        className="absolute -right-[14px] top-1/2 z-[1200] flex h-12 w-7 -translate-y-1/2 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#102156]/30"
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
