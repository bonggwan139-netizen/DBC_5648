"use client";

import { useSiteAnalysis, type SiteAnalysisDetailItem } from "./siteAnalysisState";

type BasicInfoItem = {
  label: string;
  detailItem?: SiteAnalysisDetailItem;
};

type BasicInfoColumn = {
  title: string;
  items: BasicInfoItem[];
};

type LocationAnalysisColumn = {
  title: string;
  items: Array<{ label: string; detailItem: SiteAnalysisDetailItem }>;
};

const BASIC_INFO_COLUMNS: BasicInfoColumn[] = [
  {
    title: "토지 현황",
    items: [
      { label: "지목현황", detailItem: "basicLandCategory" },
      { label: "소유현황", detailItem: "basicOwnership" },
      { label: "면적현황", detailItem: "basicAreaSummary" },
      { label: "공시지가", detailItem: "basicOfficialPrice" },
      { label: "토지형상", detailItem: "basicTerrainShape" },
      { label: "접도구분", detailItem: "basicRoadSide" }
    ]
  },
  {
    title: "건축물 현황",
    items: [
      { label: "용도현황", detailItem: "buildingUse" },
      { label: "구조현황", detailItem: "buildingStructure" },
      { label: "층수현황", detailItem: "buildingFloor" },
      { label: "경과년도", detailItem: "buildingAge" },
      { label: "연면적현황", detailItem: "buildingGrossFloorArea" },
      { label: "건폐율현황", detailItem: "buildingCoverageRatio" },
      { label: "용적률현황", detailItem: "buildingFloorAreaRatio" }
    ]
  }
];

function getAnalysisButtonClass(isActive: boolean) {
  return `flex min-h-9 w-full items-center rounded-md border px-3 py-1.5 text-left text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-[#102156]/30 ${
    isActive
      ? "border-[#102156] bg-[#102156] text-white"
      : "border-slate-200 bg-white text-slate-700 hover:border-[#102156] hover:text-[#102156]"
  }`;
}

const LOCATION_ANALYSIS_COLUMNS: LocationAnalysisColumn[] = [
  {
    title: "자연환경",
    items: [
      { label: "표고", detailItem: "naturalEnvironmentElevation" },
      { label: "경사", detailItem: "naturalEnvironmentSlope" },
      { label: "생태자연도", detailItem: "naturalEnvironmentEcologyNatureMap" },
      { label: "임상별", detailItem: "naturalEnvironmentForestType" },
      { label: "영급별", detailItem: "naturalEnvironmentForestAgeClass" },
      { label: "수종별", detailItem: "naturalEnvironmentForestSpecies" },
      { label: "경급별", detailItem: "naturalEnvironmentForestDiameterClass" }
    ]
  },
  {
    title: "도시계획",
    items: [
      { label: "용도지역", detailItem: "planningSpecialPurposeArea" }
    ]
  }
];

export function SiteAnalysisOverlay() {
  const {
    activeDetailItem,
    activeSection,
    canOpen,
    closeSection,
    openDetailItem,
    setActivePlanningMapLayer
  } = useSiteAnalysis();

  if (!canOpen || !activeSection) {
    return null;
  }

  if (activeSection === "locationAnalysis") {
    return (
      <section className="w-[min(620px,calc(100vw-470px))] rounded-lg border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur">
        <header className="mb-3 flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 className="text-sm font-semibold text-slate-900">환경·도시계획 분석</h2>
          <button
            type="button"
            onClick={closeSection}
            aria-label="환경·도시계획 분석 패널 닫기"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
              <path d="m5.5 5.5 9 9m0-9-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className="grid gap-3 md:grid-cols-2">
          {LOCATION_ANALYSIS_COLUMNS.map((column) => (
            <div key={column.title} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <h3 className="text-sm font-semibold text-slate-800">{column.title}</h3>
              <ul className="mt-3 grid gap-1.5 text-[12px] leading-5 text-slate-600">
                {column.items.map((item) => {
                  const detailItem = item.detailItem;

                  return (
                    <li key={item.label}>
                      <button
                        type="button"
                        onClick={() => {
                          openDetailItem(detailItem, "locationAnalysis");
                          setActivePlanningMapLayer(
                            detailItem === "planningSpecialPurposeArea" ? "specialPurposeArea" : null
                          );
                        }}
                        className={getAnalysisButtonClass(activeDetailItem === detailItem)}
                      >
                        <span>{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="w-[min(620px,calc(100vw-470px))] rounded-lg border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur">
      <header className="mb-3 flex items-center justify-between border-b border-slate-200 pb-3">
        <h2 className="text-sm font-semibold text-slate-900">토지·건축 분석</h2>
        <button
          type="button"
          onClick={closeSection}
          aria-label="토지·건축 분석 패널 닫기"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
            <path d="m5.5 5.5 9 9m0-9-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        {BASIC_INFO_COLUMNS.map((column) => (
          <div key={column.title} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <h3 className="text-sm font-semibold text-slate-800">{column.title}</h3>
            <ul className="mt-3 grid gap-1.5 text-[12px] leading-5 text-slate-600">
              {column.items.map((item) => {
                const detailItem = item.detailItem;

                return (
                  <li key={item.label}>
                    {detailItem ? (
                      <button
                        type="button"
                        onClick={() => openDetailItem(detailItem)}
                        className={getAnalysisButtonClass(activeDetailItem === detailItem)}
                      >
                        {item.label}
                      </button>
                    ) : (
                      <span className="font-medium">{item.label}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
