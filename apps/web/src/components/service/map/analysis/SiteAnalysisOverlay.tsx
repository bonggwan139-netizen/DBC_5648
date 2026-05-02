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
  items: string[];
};

const BASIC_INFO_COLUMNS: BasicInfoColumn[] = [
  {
    title: "위치정보",
    items: [{ label: "위치정보", detailItem: "basicLocationInfo" }]
  },
  {
    title: "토지정보",
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
    title: "건축물정보",
    items: [
      { label: "용도현황", detailItem: "buildingUse" },
      { label: "구조현황", detailItem: "buildingStructure" },
      { label: "층수현황", detailItem: "buildingFloor" },
      { label: "경과년도", detailItem: "buildingAge" },
      { label: "연면적현황", detailItem: "buildingGrossFloorArea" },
      { label: "건폐율현황", detailItem: "buildingCoverageRatio" },
      { label: "용적률현황", detailItem: "buildingFloorAreaRatio" }
    ]
  },
  {
    title: "도시계획정보",
    items: [
      "기본계획(생활권)",
      "관리계획(용도지역/지구/구역, 시설)",
      "개발행위/지구단위계획구역",
      "개발구역정보",
      "공적규제정보"
    ].map((label) => ({ label }))
  }
];

const LOCATION_ANALYSIS_COLUMNS: LocationAnalysisColumn[] = [
  {
    title: "자연환경분석",
    items: [
      "표고분석",
      "경사분석",
      "향분석",
      "단면분석",
      "생태연도",
      "식생(임상별)",
      "식생(영급별)",
      "식생(수종별)",
      "식생(경급별)",
      "국토환경",
      "산사태위험지도",
      "수리/수문",
      "기상기후",
      "백두대간/정맥"
    ]
  },
  {
    title: "토지건물분석",
    items: [
      "토지이용",
      "토지피복",
      "지가현황/표준지",
      "토지형상(정비사업)",
      "노후도(정비사업)",
      "호수밀도(정비사업)",
      "접도율(정비사업)",
      "지하층(정비사업)",
      "역세권분석",
      "주변건물현황"
    ]
  },
  {
    title: "도시계획분석",
    items: [
      "도시기본계획",
      "도시관리계획",
      "개발행위허가분석",
      "지구단위계획구역 분석",
      "개발구역분석",
      "공적규제분석",
      "문화재분석"
    ]
  }
];

export function SiteAnalysisOverlay() {
  const { activeDetailItem, activeSection, canOpen, closeSection, openDetailItem } = useSiteAnalysis();

  if (!canOpen || !activeSection) {
    return null;
  }

  if (activeSection === "locationAnalysis") {
    return (
      <section className="w-[min(860px,calc(100vw-430px))] rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur">
        <header className="mb-3 flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 className="text-sm font-semibold text-slate-900">입지분석</h2>
          <button
            type="button"
            onClick={closeSection}
            aria-label="입지분석 패널 닫기"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
              <path d="m5.5 5.5 9 9m0-9-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className="grid gap-3 md:grid-cols-3">
          {LOCATION_ANALYSIS_COLUMNS.map((column) => (
            <div key={column.title} className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
              <h3 className="text-sm font-semibold text-slate-800">{column.title}</h3>
              <ul className="mt-2 space-y-1.5 text-[12px] leading-5 text-slate-600">
                {column.items.map((item) => (
                  <li key={item}>
                    <span className="inline-flex rounded-md px-1 py-0.5 font-medium text-slate-700 transition hover:bg-white">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="w-[min(820px,calc(100vw-430px))] rounded-xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur">
      <header className="mb-3 flex items-center justify-between border-b border-slate-200 pb-3">
        <h2 className="text-sm font-semibold text-slate-900">기본정보</h2>
        <button
          type="button"
          onClick={closeSection}
          aria-label="기본정보 패널 닫기"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
            <path d="m5.5 5.5 9 9m0-9-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      <div className="grid gap-3 md:grid-cols-4">
        {BASIC_INFO_COLUMNS.map((column) => (
          <div key={column.title} className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
            <h3 className="text-sm font-semibold text-slate-800">{column.title}</h3>
            <ul className="mt-2 space-y-1.5 text-[12px] leading-5 text-slate-600">
              {column.items.map((item) => {
                const detailItem = item.detailItem;

                return (
                  <li key={item.label}>
                    {detailItem ? (
                      <button
                        type="button"
                        onClick={() => openDetailItem(detailItem)}
                        className={`rounded-md px-1 py-0.5 text-left font-medium transition focus:outline-none focus:ring-2 focus:ring-slate-300 ${
                          activeDetailItem === detailItem
                            ? "bg-slate-900 text-white"
                            : "text-slate-700 hover:bg-white"
                        }`}
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
