"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLandRegister } from "./landRegisterState";
import { useSiteAnalysisAreaSummary } from "./siteAnalysisAreaSummary";
import {
  type BasicInfoAnalysisRow,
  useSiteAnalysisLandCategory
} from "./siteAnalysisLandCategory";
import { buildSiteAnalysisLocationRows } from "./siteAnalysisLocation";
import { useSiteAnalysisOfficialPrice } from "./siteAnalysisOfficialPrice";
import { useSiteAnalysisOwnership } from "./siteAnalysisOwnership";
import { useSiteAnalysisRoadSide } from "./siteAnalysisRoadSide";
import { useSiteAnalysis } from "./siteAnalysisState";
import { useSiteAnalysisTerrainShape } from "./siteAnalysisTerrainShape";

const areaFormatter = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 2
});
const countFormatter = new Intl.NumberFormat("ko-KR");
const pastelFallbacks = ["#BFD7FF", "#CDECCF", "#FFD6A5", "#FBCFE8", "#DDD6FE", "#BAE6FD", "#FDE68A"];
const areaBasisNoticeLines = [
  "※ 계 = 완전편입 대장면적 + 부분편입 구적면적",
  "※ 면적오차 = 구역계 면적 - 계"
];
const landCategoryNoticeLines = [
  ...areaBasisNoticeLines
];
const ownershipNoticeLines = [
  ...areaBasisNoticeLines
];
const areaSummaryNoticeLines = [
  ...areaBasisNoticeLines,
  "※ 면적 구간은 서비스 초기 고정 기준이며, 추후 데이터 확대에 따라 조정될 수 있습니다."
];
const officialPriceNoticeLines = [
  ...areaBasisNoticeLines,
  "※ 공시지가 구간은 서비스 초기 고정 기준이며, 추후 데이터 확대에 따라 조정될 수 있습니다."
];
const terrainShapeNoticeLines = [
  ...areaBasisNoticeLines
];
const roadSideNoticeLines = [
  ...areaBasisNoticeLines,
  "※ 비접도는 세로한면(불), 세로각지(불), 맹지로 분류된 토지를 의미합니다."
];

function formatArea(value: number) {
  return `${areaFormatter.format(value)}㎡`;
}

function formatRatio(value: number | null) {
  return value === null ? "-" : `${areaFormatter.format(value)}%`;
}

function formatParcelCount(value: number | null) {
  return value === null ? "-" : countFormatter.format(value);
}

function getRowColor(row: BasicInfoAnalysisRow, index: number) {
  return row.color ?? pastelFallbacks[index % pastelFallbacks.length];
}

function getTableRowColor(row: BasicInfoAnalysisRow) {
  return row.color;
}

function getLandCategoryCellClass(row: BasicInfoAnalysisRow, className = "") {
  const weightClass = row.row_type === "zone" || row.row_type === "total" ? "font-semibold" : "font-medium";
  const colorClass = row.row_type === "error" ? "text-slate-500" : row.row_type === "category" ? "text-slate-700" : "text-slate-900";
  const borderClass =
    row.row_type === "total"
      ? "border-b-2 border-slate-300"
      : row.row_type === "zone" || row.row_type === "error"
        ? "border-b border-slate-200"
        : "";

  return `${className} ${weightClass} ${colorClass} ${borderClass}`.trim();
}

export function SiteAnalysisDetailPanel() {
  const { activeDetailItem, canOpen, setActiveThematicMapFeatures } = useSiteAnalysis();
  const { canRequest, data, error, loadLandRegister, status } = useLandRegister();
  const {
    canRequest: canRequestLandCategory,
    data: landCategoryData,
    error: landCategoryError,
    loadLandCategory,
    status: landCategoryStatus
  } = useSiteAnalysisLandCategory();
  const {
    canRequest: canRequestOwnership,
    data: ownershipData,
    error: ownershipError,
    loadOwnership,
    status: ownershipStatus
  } = useSiteAnalysisOwnership();
  const {
    canRequest: canRequestAreaSummary,
    data: areaSummaryData,
    error: areaSummaryError,
    loadAreaSummary,
    status: areaSummaryStatus
  } = useSiteAnalysisAreaSummary();
  const {
    canRequest: canRequestOfficialPrice,
    data: officialPriceData,
    error: officialPriceError,
    loadOfficialPrice,
    status: officialPriceStatus
  } = useSiteAnalysisOfficialPrice();
  const {
    canRequest: canRequestTerrainShape,
    data: terrainShapeData,
    error: terrainShapeError,
    loadTerrainShape,
    status: terrainShapeStatus
  } = useSiteAnalysisTerrainShape();
  const {
    canRequest: canRequestRoadSide,
    data: roadSideData,
    error: roadSideError,
    loadRoadSide,
    status: roadSideStatus
  } = useSiteAnalysisRoadSide();
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

  useEffect(() => {
    if (canRequestLandCategory && activeDetailItem === "basicLandCategory" && landCategoryStatus === "idle") {
      void loadLandCategory();
    }
  }, [activeDetailItem, canRequestLandCategory, landCategoryStatus, loadLandCategory]);

  useEffect(() => {
    if (canRequestOwnership && activeDetailItem === "basicOwnership" && ownershipStatus === "idle") {
      void loadOwnership();
    }
  }, [activeDetailItem, canRequestOwnership, loadOwnership, ownershipStatus]);

  useEffect(() => {
    if (canRequestAreaSummary && activeDetailItem === "basicAreaSummary" && areaSummaryStatus === "idle") {
      void loadAreaSummary();
    }
  }, [activeDetailItem, areaSummaryStatus, canRequestAreaSummary, loadAreaSummary]);

  useEffect(() => {
    if (canRequestOfficialPrice && activeDetailItem === "basicOfficialPrice" && officialPriceStatus === "idle") {
      void loadOfficialPrice();
    }
  }, [activeDetailItem, canRequestOfficialPrice, loadOfficialPrice, officialPriceStatus]);

  useEffect(() => {
    if (canRequestTerrainShape && activeDetailItem === "basicTerrainShape" && terrainShapeStatus === "idle") {
      void loadTerrainShape();
    }
  }, [activeDetailItem, canRequestTerrainShape, loadTerrainShape, terrainShapeStatus]);

  useEffect(() => {
    if (canRequestRoadSide && activeDetailItem === "basicRoadSide" && roadSideStatus === "idle") {
      void loadRoadSide();
    }
  }, [activeDetailItem, canRequestRoadSide, loadRoadSide, roadSideStatus]);

  const activeThematicMapFeatures =
    activeDetailItem === "basicLandCategory"
      ? landCategoryData?.map_features ?? null
      : activeDetailItem === "basicOwnership"
        ? ownershipData?.map_features ?? null
        : activeDetailItem === "basicAreaSummary"
          ? areaSummaryData?.map_features ?? null
          : activeDetailItem === "basicOfficialPrice"
            ? officialPriceData?.map_features ?? null
            : activeDetailItem === "basicTerrainShape"
              ? terrainShapeData?.map_features ?? null
              : activeDetailItem === "basicRoadSide"
                ? roadSideData?.map_features ?? null
                : null;

  useEffect(() => {
    if (!canOpen || !activeDetailItem) {
      setActiveThematicMapFeatures(null);
      return;
    }

    setActiveThematicMapFeatures(activeThematicMapFeatures);
  }, [activeDetailItem, activeThematicMapFeatures, canOpen, setActiveThematicMapFeatures]);

  if (!canOpen || !activeDetailItem) {
    return null;
  }

  const panelTitle = activeDetailItem === "basicLocationInfo" ? "위치정보" : "토지정보";

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 460 }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      className="absolute right-0 top-0 z-20 flex h-full border-l border-slate-200/80 bg-white shadow-xl"
    >
      <button
        type="button"
        aria-label={collapsed ? `${panelTitle} 패널 펼치기` : `${panelTitle} 패널 접기`}
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
            <h2 className="mt-1 text-base font-semibold text-slate-900">{panelTitle}</h2>
          </header>

          {activeDetailItem === "basicLocationInfo" ? (
            <LocationInfoContent error={error} locationRows={locationRows} status={status} />
          ) : activeDetailItem === "basicOwnership" ? (
            <CategoryAnalysisContent
              data={ownershipData}
              emptyMessage="분석 결과에서 소유현황을 찾을 수 없습니다."
              error={ownershipError}
              loadingMessage="소유현황을 불러오는 중입니다."
              noticeLines={ownershipNoticeLines}
              status={ownershipStatus}
              title="소유현황"
            />
          ) : activeDetailItem === "basicAreaSummary" ? (
            <CategoryAnalysisContent
              data={areaSummaryData}
              emptyMessage="분석 결과에서 면적현황을 찾을 수 없습니다."
              error={areaSummaryError}
              loadingMessage="면적현황을 불러오는 중입니다."
              noticeLines={areaSummaryNoticeLines}
              status={areaSummaryStatus}
              title="면적현황"
            />
          ) : activeDetailItem === "basicOfficialPrice" ? (
            <CategoryAnalysisContent
              data={officialPriceData}
              emptyMessage="분석 결과에서 공시지가현황을 찾을 수 없습니다."
              error={officialPriceError}
              loadingMessage="공시지가현황을 불러오는 중입니다."
              noticeLines={officialPriceNoticeLines}
              status={officialPriceStatus}
              title="공시지가"
            />
          ) : activeDetailItem === "basicTerrainShape" ? (
            <CategoryAnalysisContent
              data={terrainShapeData}
              emptyMessage="분석 결과에서 토지형상을 찾을 수 없습니다."
              error={terrainShapeError}
              loadingMessage="토지형상을 불러오는 중입니다."
              noticeLines={terrainShapeNoticeLines}
              status={terrainShapeStatus}
              title="토지형상"
            />
          ) : activeDetailItem === "basicRoadSide" ? (
            <CategoryAnalysisContent
              data={roadSideData}
              emptyMessage="분석 결과에서 접도구분을 찾을 수 없습니다."
              error={roadSideError}
              loadingMessage="접도구분을 불러오는 중입니다."
              noticeLines={roadSideNoticeLines}
              status={roadSideStatus}
              title="접도구분"
            />
          ) : (
            <CategoryAnalysisContent
              data={landCategoryData}
              emptyMessage="분석 결과에서 지목현황을 찾을 수 없습니다."
              error={landCategoryError}
              loadingMessage="지목현황을 불러오는 중입니다."
              noticeLines={landCategoryNoticeLines}
              status={landCategoryStatus}
              title="지목현황"
            />
          )}
        </div>
      ) : (
        <div className="flex h-full w-full items-start justify-center pt-5">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        </div>
      )}
    </motion.aside>
  );
}

function LocationInfoContent({
  error,
  locationRows,
  status
}: {
  error: string | null;
  locationRows: Array<{ id: string; pnu: string | null; address: string | null }>;
  status: "idle" | "loading" | "success" | "error";
}) {
  return (
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
  );
}

function CategoryAnalysisContent({
  data,
  emptyMessage,
  error,
  loadingMessage,
  noticeLines,
  status,
  title
}: {
  data: { table_rows: BasicInfoAnalysisRow[]; chart_rows: BasicInfoAnalysisRow[] } | null;
  emptyMessage: string;
  error: string | null;
  loadingMessage: string;
  noticeLines: string[];
  status: "idle" | "loading" | "success" | "error";
  title: string;
}) {
  return (
    <section className="min-h-0 flex-1 overflow-y-auto pt-5 font-[family-name:var(--font-pretendard)]">
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-light leading-5 text-amber-800">
        {noticeLines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>

      {status === "loading" ? (
        <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-[12px] text-slate-500">
          {loadingMessage}
        </p>
      ) : null}

      {status === "error" ? (
        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-4 text-[12px] text-rose-700">
          {error ?? loadingMessage.replace("불러오는 중입니다.", "불러오지 못했습니다.")}
        </p>
      ) : null}

      {status === "success" && data && data.table_rows.length > 0 ? (
        <div className="mt-4 flex flex-col gap-4">
          <LandCategoryPieChart
            emptyMessage={emptyMessage}
            rows={data.chart_rows.filter((row) => row.row_type === "category")}
          />
          <LandCategoryTable rows={data.table_rows} />
        </div>
      ) : null}

      {status === "success" && (!data || data.table_rows.length === 0) ? (
        <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-[12px] text-slate-500">
          {emptyMessage}
        </p>
      ) : null}
    </section>
  );
}

function LandCategoryPieChart({
  emptyMessage,
  rows
}: {
  emptyMessage: string;
  rows: BasicInfoAnalysisRow[];
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-[12px] text-slate-500">
        {emptyMessage}
      </p>
    );
  }

  const totalArea = rows.reduce((sum, row) => sum + Math.max(row.area_m2, 0), 0);
  let offset = 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-5">
        <svg viewBox="0 0 120 120" className="h-32 w-32 shrink-0" role="img" aria-label="구성비 차트">
          <circle cx="60" cy="60" r="42" fill="#f8fafc" />
          {rows.map((row, index) => {
            const ratio =
              row.ratio_percent !== null
                ? Math.max(row.ratio_percent, 0)
                : totalArea > 0
                  ? (Math.max(row.area_m2, 0) / totalArea) * 100
                  : 0;
            const dashOffset = offset;
            offset += ratio;

            return (
              <circle
                key={row.key}
                cx="60"
                cy="60"
                r="42"
                fill="none"
                stroke={getRowColor(row, index)}
                strokeDasharray={`${ratio} ${Math.max(100 - ratio, 0)}`}
                strokeDashoffset={-dashOffset}
                strokeWidth="24"
                pathLength={100}
                transform="rotate(-90 60 60)"
              />
            );
          })}
          <circle cx="60" cy="60" r="27" fill="white" />
        </svg>

        <div className="min-w-0 flex-1 space-y-2">
          {rows.map((row, index) => (
            <div key={row.key} className="flex items-start gap-2 text-[12px] text-slate-600">
              <span
                className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: getRowColor(row, index) }}
              />
              <div className="min-w-0">
                <p className="font-medium text-slate-800">{row.label}</p>
                <p className="text-[11px] text-slate-500">
                  {formatArea(row.area_m2)} · {formatRatio(row.ratio_percent)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LandCategoryTable({
  rows
}: {
  rows: BasicInfoAnalysisRow[];
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] divide-y divide-slate-200 text-left text-[11px] font-[family-name:var(--font-pretendard)]">
          <thead className="sticky top-0 bg-slate-50 text-slate-500">
            <tr>
              <th className="px-3 py-2 font-semibold">범례</th>
              <th className="px-3 py-2 font-semibold">구분</th>
              <th className="px-3 py-2 font-semibold">면적(㎡)</th>
              <th className="px-3 py-2 font-semibold">구성비(%)</th>
              <th className="px-3 py-2 font-semibold">필지 수</th>
              <th className="px-3 py-2 font-semibold">비고</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
            {rows.map((row) => {
              const color = getTableRowColor(row);

              return (
              <tr key={row.key}>
                <td className={getLandCategoryCellClass(row, "px-3 py-2")}>
                  {color ? (
                    <span className="block h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                  ) : (
                    "-"
                  )}
                </td>
                <td className={getLandCategoryCellClass(row, "whitespace-nowrap px-3 py-2")}>{row.label}</td>
                <td className={getLandCategoryCellClass(row, "whitespace-nowrap px-3 py-2")}>{formatArea(row.area_m2)}</td>
                <td className={getLandCategoryCellClass(row, "whitespace-nowrap px-3 py-2")}>{formatRatio(row.ratio_percent)}</td>
                <td className={getLandCategoryCellClass(row, "whitespace-nowrap px-3 py-2")}>{formatParcelCount(row.parcel_count)}</td>
                <td className={getLandCategoryCellClass(row, "whitespace-nowrap px-3 py-2")}>{row.note ?? "-"}</td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
