"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLandRegister } from "./landRegisterState";
import {
  type BuildingInfoChartRow,
  type BuildingInfoLayerItem,
  type BuildingInfoResponse,
  type BuildingInfoTableColumn,
  type BuildingInfoTableRow,
  useSiteAnalysisBuildingAge,
  useSiteAnalysisBuildingCoverageRatio,
  useSiteAnalysisBuildingFloor,
  useSiteAnalysisBuildingFloorAreaRatio,
  useSiteAnalysisBuildingGrossFloorArea,
  useSiteAnalysisBuildingStructure,
  useSiteAnalysisBuildingUse
} from "./siteAnalysisBuildingInfo";
import { useSiteAnalysisAreaSummary } from "./siteAnalysisAreaSummary";
import {
  type NaturalEnvironmentEcologyNatureMapResponse,
  useSiteAnalysisNaturalEnvironmentEcologyNatureMap
} from "./siteAnalysisNaturalEnvironmentEcologyNatureMap";
import { useSiteAnalysisNaturalEnvironmentElevation } from "./siteAnalysisNaturalEnvironmentElevation";
import {
  type NaturalEnvironmentForestTypeMapResponse,
  useSiteAnalysisNaturalEnvironmentForestAgeClass,
  useSiteAnalysisNaturalEnvironmentForestDiameterClass,
  useSiteAnalysisNaturalEnvironmentForestSpecies,
  useSiteAnalysisNaturalEnvironmentForestType
} from "./siteAnalysisNaturalEnvironmentForestTypeMap";
import { useSiteAnalysisNaturalEnvironmentSlope } from "./siteAnalysisNaturalEnvironmentSlope";
import {
  type BasicInfoAnalysisRow,
  useSiteAnalysisLandCategory
} from "./siteAnalysisLandCategory";
import { buildSiteAnalysisLocationRows } from "./siteAnalysisLocation";
import { useSiteAnalysisOfficialPrice } from "./siteAnalysisOfficialPrice";
import { useSiteAnalysisOwnership } from "./siteAnalysisOwnership";
import {
  type PlanningSpecialPurposeAreaResponse,
  useSiteAnalysisPlanningSpecialPurposeArea
} from "./siteAnalysisPlanningSpecialPurposeArea";
import {
  getPlanningSpecialPurposeAreaStyle,
  type PlanningSpecialPurposeAreaPattern,
  type PlanningSpecialPurposeAreaStyle
} from "./planningSpecialPurposeAreaStyle";
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
const naturalEnvironmentElevationNoticeLines = [
  "※ 표고 구간은 5m 단위로 자동 산정됩니다.",
  "※ 면적은 구역계와 표고 구간 폴리곤의 교차면적으로 산정됩니다."
];
const naturalEnvironmentSlopeNoticeLines = [
  "※ 경사 구간은 도 단위 기준입니다.",
  "※ 면적은 구역계와 경사 구간 폴리곤의 교차면적으로 산정됩니다."
];
const naturalEnvironmentEcologyNatureMapNoticeLines = [
  "※ 면적은 구역계와 생태자연도 등급 polygon의 교차면적으로 산정됩니다.",
  "※ 생태자연도 미해당 지역은 등급별 합계에 포함되지 않을 수 있습니다."
];
const naturalEnvironmentForestTypeMapNoticeLines = [
  "※ 면적은 구역계와 산림입지/임상도 polygon의 교차면적으로 산정됩니다.",
  "※ 산림이 아닌 토지는 색상 없이 표시될 수 있습니다."
];
const planningSpecialPurposeAreaNoticeLines = [
  "※ 계 = 용도지역별 분석면적의 합",
  "※ 면적오차 = 구역계 면적 - 계"
];

function formatArea(value: number) {
  return `${areaFormatter.format(value)}㎡`;
}

function formatOptionalArea(value: number | null | undefined) {
  return value === null || value === undefined ? "-" : formatArea(value);
}

function formatRatio(value: number | null) {
  return value === null ? "-" : `${areaFormatter.format(value)}%`;
}

function formatParcelCount(value: number | null) {
  return value === null ? "-" : countFormatter.format(value);
}

function formatNullableNumber(value: number | null | undefined) {
  return value === null || value === undefined ? "-" : countFormatter.format(value);
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

function shouldShowZoneAndCategoryAreaRow(row: BasicInfoAnalysisRow) {
  return row.row_type !== "error" && row.row_type !== "total" && row.label !== "면적오차" && row.label !== "계";
}

export function SiteAnalysisDetailPanel() {
  const {
    activeDetailItem,
    canOpen,
    setActiveNaturalEnvironmentMapOverlay,
    setActiveThematicMapFeatures
  } = useSiteAnalysis();
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
  const {
    canRequest: canRequestBuildingUse,
    data: buildingUseData,
    error: buildingUseError,
    loadBuildingUse,
    status: buildingUseStatus
  } = useSiteAnalysisBuildingUse();
  const {
    canRequest: canRequestBuildingStructure,
    data: buildingStructureData,
    error: buildingStructureError,
    loadBuildingStructure,
    status: buildingStructureStatus
  } = useSiteAnalysisBuildingStructure();
  const {
    canRequest: canRequestBuildingFloor,
    data: buildingFloorData,
    error: buildingFloorError,
    loadBuildingFloor,
    status: buildingFloorStatus
  } = useSiteAnalysisBuildingFloor();
  const {
    canRequest: canRequestBuildingAge,
    data: buildingAgeData,
    error: buildingAgeError,
    loadBuildingAge,
    status: buildingAgeStatus
  } = useSiteAnalysisBuildingAge();
  const {
    canRequest: canRequestBuildingGrossFloorArea,
    data: buildingGrossFloorAreaData,
    error: buildingGrossFloorAreaError,
    loadBuildingGrossFloorArea,
    status: buildingGrossFloorAreaStatus
  } = useSiteAnalysisBuildingGrossFloorArea();
  const {
    canRequest: canRequestBuildingCoverageRatio,
    data: buildingCoverageRatioData,
    error: buildingCoverageRatioError,
    loadBuildingCoverageRatio,
    status: buildingCoverageRatioStatus
  } = useSiteAnalysisBuildingCoverageRatio();
  const {
    canRequest: canRequestBuildingFloorAreaRatio,
    data: buildingFloorAreaRatioData,
    error: buildingFloorAreaRatioError,
    loadBuildingFloorAreaRatio,
    status: buildingFloorAreaRatioStatus
  } = useSiteAnalysisBuildingFloorAreaRatio();
  const {
    canRequest: canRequestNaturalEnvironmentElevation,
    data: naturalEnvironmentElevationData,
    error: naturalEnvironmentElevationError,
    loadNaturalEnvironmentElevation,
    status: naturalEnvironmentElevationStatus
  } = useSiteAnalysisNaturalEnvironmentElevation();
  const {
    canRequest: canRequestNaturalEnvironmentEcologyNatureMap,
    data: naturalEnvironmentEcologyNatureMapData,
    error: naturalEnvironmentEcologyNatureMapError,
    loadNaturalEnvironmentEcologyNatureMap,
    status: naturalEnvironmentEcologyNatureMapStatus
  } = useSiteAnalysisNaturalEnvironmentEcologyNatureMap();
  const {
    canRequest: canRequestNaturalEnvironmentForestType,
    data: naturalEnvironmentForestTypeData,
    error: naturalEnvironmentForestTypeError,
    loadForestTypeMapAnalysis: loadNaturalEnvironmentForestType,
    status: naturalEnvironmentForestTypeStatus
  } = useSiteAnalysisNaturalEnvironmentForestType();
  const {
    canRequest: canRequestNaturalEnvironmentForestAgeClass,
    data: naturalEnvironmentForestAgeClassData,
    error: naturalEnvironmentForestAgeClassError,
    loadForestTypeMapAnalysis: loadNaturalEnvironmentForestAgeClass,
    status: naturalEnvironmentForestAgeClassStatus
  } = useSiteAnalysisNaturalEnvironmentForestAgeClass();
  const {
    canRequest: canRequestNaturalEnvironmentForestSpecies,
    data: naturalEnvironmentForestSpeciesData,
    error: naturalEnvironmentForestSpeciesError,
    loadForestTypeMapAnalysis: loadNaturalEnvironmentForestSpecies,
    status: naturalEnvironmentForestSpeciesStatus
  } = useSiteAnalysisNaturalEnvironmentForestSpecies();
  const {
    canRequest: canRequestNaturalEnvironmentForestDiameterClass,
    data: naturalEnvironmentForestDiameterClassData,
    error: naturalEnvironmentForestDiameterClassError,
    loadForestTypeMapAnalysis: loadNaturalEnvironmentForestDiameterClass,
    status: naturalEnvironmentForestDiameterClassStatus
  } = useSiteAnalysisNaturalEnvironmentForestDiameterClass();
  const {
    canRequest: canRequestNaturalEnvironmentSlope,
    data: naturalEnvironmentSlopeData,
    error: naturalEnvironmentSlopeError,
    loadNaturalEnvironmentSlope,
    status: naturalEnvironmentSlopeStatus
  } = useSiteAnalysisNaturalEnvironmentSlope();
  const {
    canRequest: canRequestPlanningSpecialPurposeArea,
    data: planningSpecialPurposeAreaData,
    error: planningSpecialPurposeAreaError,
    loadPlanningSpecialPurposeArea,
    status: planningSpecialPurposeAreaStatus
  } = useSiteAnalysisPlanningSpecialPurposeArea();
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

  useEffect(() => {
    if (canRequestBuildingUse && activeDetailItem === "buildingUse" && buildingUseStatus === "idle") {
      void loadBuildingUse();
    }
  }, [activeDetailItem, buildingUseStatus, canRequestBuildingUse, loadBuildingUse]);

  useEffect(() => {
    if (
      canRequestBuildingStructure &&
      activeDetailItem === "buildingStructure" &&
      buildingStructureStatus === "idle"
    ) {
      void loadBuildingStructure();
    }
  }, [activeDetailItem, buildingStructureStatus, canRequestBuildingStructure, loadBuildingStructure]);

  useEffect(() => {
    if (canRequestBuildingFloor && activeDetailItem === "buildingFloor" && buildingFloorStatus === "idle") {
      void loadBuildingFloor();
    }
  }, [activeDetailItem, buildingFloorStatus, canRequestBuildingFloor, loadBuildingFloor]);

  useEffect(() => {
    if (canRequestBuildingAge && activeDetailItem === "buildingAge" && buildingAgeStatus === "idle") {
      void loadBuildingAge();
    }
  }, [activeDetailItem, buildingAgeStatus, canRequestBuildingAge, loadBuildingAge]);

  useEffect(() => {
    if (
      canRequestBuildingGrossFloorArea &&
      activeDetailItem === "buildingGrossFloorArea" &&
      buildingGrossFloorAreaStatus === "idle"
    ) {
      void loadBuildingGrossFloorArea();
    }
  }, [
    activeDetailItem,
    buildingGrossFloorAreaStatus,
    canRequestBuildingGrossFloorArea,
    loadBuildingGrossFloorArea
  ]);

  useEffect(() => {
    if (
      canRequestBuildingCoverageRatio &&
      activeDetailItem === "buildingCoverageRatio" &&
      buildingCoverageRatioStatus === "idle"
    ) {
      void loadBuildingCoverageRatio();
    }
  }, [activeDetailItem, buildingCoverageRatioStatus, canRequestBuildingCoverageRatio, loadBuildingCoverageRatio]);

  useEffect(() => {
    if (
      canRequestBuildingFloorAreaRatio &&
      activeDetailItem === "buildingFloorAreaRatio" &&
      buildingFloorAreaRatioStatus === "idle"
    ) {
      void loadBuildingFloorAreaRatio();
    }
  }, [
    activeDetailItem,
    buildingFloorAreaRatioStatus,
    canRequestBuildingFloorAreaRatio,
    loadBuildingFloorAreaRatio
  ]);

  useEffect(() => {
    if (
      canRequestNaturalEnvironmentElevation &&
      activeDetailItem === "naturalEnvironmentElevation" &&
      naturalEnvironmentElevationStatus === "idle"
    ) {
      void loadNaturalEnvironmentElevation();
    }
  }, [
    activeDetailItem,
    canRequestNaturalEnvironmentElevation,
    loadNaturalEnvironmentElevation,
    naturalEnvironmentElevationStatus
  ]);

  useEffect(() => {
    if (
      canRequestNaturalEnvironmentSlope &&
      activeDetailItem === "naturalEnvironmentSlope" &&
      naturalEnvironmentSlopeStatus === "idle"
    ) {
      void loadNaturalEnvironmentSlope();
    }
  }, [
    activeDetailItem,
    canRequestNaturalEnvironmentSlope,
    loadNaturalEnvironmentSlope,
    naturalEnvironmentSlopeStatus
  ]);

  useEffect(() => {
    if (
      canRequestNaturalEnvironmentEcologyNatureMap &&
      activeDetailItem === "naturalEnvironmentEcologyNatureMap" &&
      naturalEnvironmentEcologyNatureMapStatus === "idle"
    ) {
      void loadNaturalEnvironmentEcologyNatureMap();
    }
  }, [
    activeDetailItem,
    canRequestNaturalEnvironmentEcologyNatureMap,
    loadNaturalEnvironmentEcologyNatureMap,
    naturalEnvironmentEcologyNatureMapStatus
  ]);

  useEffect(() => {
    if (
      canRequestNaturalEnvironmentForestType &&
      activeDetailItem === "naturalEnvironmentForestType" &&
      naturalEnvironmentForestTypeStatus === "idle"
    ) {
      void loadNaturalEnvironmentForestType();
    }
  }, [
    activeDetailItem,
    canRequestNaturalEnvironmentForestType,
    loadNaturalEnvironmentForestType,
    naturalEnvironmentForestTypeStatus
  ]);

  useEffect(() => {
    if (
      canRequestNaturalEnvironmentForestAgeClass &&
      activeDetailItem === "naturalEnvironmentForestAgeClass" &&
      naturalEnvironmentForestAgeClassStatus === "idle"
    ) {
      void loadNaturalEnvironmentForestAgeClass();
    }
  }, [
    activeDetailItem,
    canRequestNaturalEnvironmentForestAgeClass,
    loadNaturalEnvironmentForestAgeClass,
    naturalEnvironmentForestAgeClassStatus
  ]);

  useEffect(() => {
    if (
      canRequestNaturalEnvironmentForestSpecies &&
      activeDetailItem === "naturalEnvironmentForestSpecies" &&
      naturalEnvironmentForestSpeciesStatus === "idle"
    ) {
      void loadNaturalEnvironmentForestSpecies();
    }
  }, [
    activeDetailItem,
    canRequestNaturalEnvironmentForestSpecies,
    loadNaturalEnvironmentForestSpecies,
    naturalEnvironmentForestSpeciesStatus
  ]);

  useEffect(() => {
    if (
      canRequestNaturalEnvironmentForestDiameterClass &&
      activeDetailItem === "naturalEnvironmentForestDiameterClass" &&
      naturalEnvironmentForestDiameterClassStatus === "idle"
    ) {
      void loadNaturalEnvironmentForestDiameterClass();
    }
  }, [
    activeDetailItem,
    canRequestNaturalEnvironmentForestDiameterClass,
    loadNaturalEnvironmentForestDiameterClass,
    naturalEnvironmentForestDiameterClassStatus
  ]);

  useEffect(() => {
    if (
      canRequestPlanningSpecialPurposeArea &&
      activeDetailItem === "planningSpecialPurposeArea" &&
      planningSpecialPurposeAreaStatus === "idle"
    ) {
      void loadPlanningSpecialPurposeArea();
    }
  }, [
    activeDetailItem,
    canRequestPlanningSpecialPurposeArea,
    loadPlanningSpecialPurposeArea,
    planningSpecialPurposeAreaStatus
  ]);

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
                : activeDetailItem === "buildingUse"
                  ? buildingUseData?.map_features ?? null
                  : activeDetailItem === "buildingStructure"
                    ? buildingStructureData?.map_features ?? null
                    : activeDetailItem === "buildingFloor"
                      ? buildingFloorData?.map_features ?? null
                      : activeDetailItem === "buildingAge"
                        ? buildingAgeData?.map_features ?? null
                        : activeDetailItem === "buildingGrossFloorArea"
                          ? buildingGrossFloorAreaData?.map_features ?? null
                          : activeDetailItem === "buildingCoverageRatio"
                            ? buildingCoverageRatioData?.map_features ?? null
                            : activeDetailItem === "buildingFloorAreaRatio"
                              ? buildingFloorAreaRatioData?.map_features ?? null
                              : activeDetailItem === "naturalEnvironmentEcologyNatureMap"
                                ? naturalEnvironmentEcologyNatureMapData?.map_features ?? null
                                : activeDetailItem === "naturalEnvironmentForestType"
                                  ? naturalEnvironmentForestTypeData?.map_features ?? null
                                  : activeDetailItem === "naturalEnvironmentForestAgeClass"
                                    ? naturalEnvironmentForestAgeClassData?.map_features ?? null
                                    : activeDetailItem === "naturalEnvironmentForestSpecies"
                                      ? naturalEnvironmentForestSpeciesData?.map_features ?? null
                                      : activeDetailItem === "naturalEnvironmentForestDiameterClass"
                                        ? naturalEnvironmentForestDiameterClassData?.map_features ?? null
                                        : null;

  useEffect(() => {
    if (!canOpen || !activeDetailItem) {
      setActiveThematicMapFeatures(null);
      return;
    }

    setActiveThematicMapFeatures(activeThematicMapFeatures);
  }, [activeDetailItem, activeThematicMapFeatures, canOpen, setActiveThematicMapFeatures]);

  useEffect(() => {
    if (!canOpen) {
      setActiveNaturalEnvironmentMapOverlay(null);
      return;
    }

    if (
      activeDetailItem === "naturalEnvironmentElevation" &&
      naturalEnvironmentElevationStatus === "success" &&
      naturalEnvironmentElevationData?.map_overlay
    ) {
      setActiveNaturalEnvironmentMapOverlay({
        kind: "elevation",
        raster: naturalEnvironmentElevationData.map_overlay.raster,
        contours: naturalEnvironmentElevationData.map_overlay.contours
      });
      return;
    }

    if (
      activeDetailItem === "naturalEnvironmentSlope" &&
      naturalEnvironmentSlopeStatus === "success" &&
      naturalEnvironmentSlopeData?.map_overlay
    ) {
      setActiveNaturalEnvironmentMapOverlay({
        kind: "slope",
        raster: naturalEnvironmentSlopeData.map_overlay.raster,
        contours: naturalEnvironmentSlopeData.map_overlay.contours
      });
      return;
    }

    setActiveNaturalEnvironmentMapOverlay(null);
  }, [
    activeDetailItem,
    canOpen,
    naturalEnvironmentElevationData,
    naturalEnvironmentElevationStatus,
    naturalEnvironmentSlopeData,
    naturalEnvironmentSlopeStatus,
    setActiveNaturalEnvironmentMapOverlay
  ]);

  if (!canOpen || !activeDetailItem) {
    return null;
  }

  const panelTitle =
    activeDetailItem === "basicLocationInfo"
      ? "위치정보"
      : activeDetailItem === "buildingUse" ||
          activeDetailItem === "buildingStructure" ||
          activeDetailItem === "buildingFloor" ||
          activeDetailItem === "buildingAge" ||
          activeDetailItem === "buildingGrossFloorArea" ||
          activeDetailItem === "buildingCoverageRatio" ||
          activeDetailItem === "buildingFloorAreaRatio"
        ? "건축물정보"
        : activeDetailItem === "naturalEnvironmentElevation" ||
            activeDetailItem === "naturalEnvironmentEcologyNatureMap" ||
            activeDetailItem === "naturalEnvironmentForestAgeClass" ||
            activeDetailItem === "naturalEnvironmentForestDiameterClass" ||
            activeDetailItem === "naturalEnvironmentForestSpecies" ||
            activeDetailItem === "naturalEnvironmentForestType" ||
            activeDetailItem === "naturalEnvironmentSlope"
          ? "자연환경분석"
        : activeDetailItem === "planningSpecialPurposeArea"
          ? "도시계획분석"
          : "토지정보";

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
          ) : activeDetailItem === "buildingUse" ? (
            <BuildingInfoContent
              categorySummaryLabel="용도 분류 수"
              data={buildingUseData}
              emptyChartMessage="표시할 용도 차트가 없습니다."
              error={buildingUseError}
              errorMessage="용도현황을 불러오지 못했습니다."
              fallbackTitle="용도현황"
              loadingMessage="용도현황을 불러오는 중입니다."
              status={buildingUseStatus}
            />
          ) : activeDetailItem === "buildingStructure" ? (
            <BuildingInfoContent
              categorySummaryLabel="구조 분류 수"
              data={buildingStructureData}
              emptyChartMessage="표시할 구조 차트가 없습니다."
              error={buildingStructureError}
              errorMessage="구조현황을 불러오지 못했습니다."
              fallbackTitle="구조현황"
              loadingMessage="구조현황을 불러오는 중입니다."
              status={buildingStructureStatus}
            />
          ) : activeDetailItem === "buildingFloor" ? (
            <BuildingInfoContent
              categorySummaryLabel="분류 수"
              data={buildingFloorData}
              emptyChartMessage="표시할 층수 차트가 없습니다."
              error={buildingFloorError}
              errorMessage="층수현황을 불러오지 못했습니다."
              extraSummaryCards={(buildingData) => [
                { label: "정보없음", value: buildingData.summary.unknown_floor_count ?? 0 }
              ]}
              fallbackTitle="층수현황"
              loadingMessage="층수현황을 불러오는 중입니다."
              status={buildingFloorStatus}
            />
          ) : activeDetailItem === "buildingAge" ? (
            <BuildingInfoContent
              categorySummaryLabel="분류 수"
              data={buildingAgeData}
              emptyChartMessage="표시할 경과년도 차트가 없습니다."
              error={buildingAgeError}
              errorMessage="경과년도를 불러오지 못했습니다."
              extraSummaryCards={(buildingData) => [
                { label: "정보없음", value: buildingData.summary.unknown_age_count ?? 0 },
                ...(buildingData.summary.pre_1900_count && buildingData.summary.pre_1900_count > 0
                  ? [{ label: "1900년 이전", value: buildingData.summary.pre_1900_count }]
                  : [])
              ]}
              fallbackTitle="경과년도"
              loadingMessage="경과년도를 불러오는 중입니다."
              status={buildingAgeStatus}
            />
          ) : activeDetailItem === "buildingGrossFloorArea" ? (
            <BuildingInfoContent
              categorySummaryLabel="분류 수"
              data={buildingGrossFloorAreaData}
              emptyChartMessage="표시할 연면적 차트가 없습니다."
              error={buildingGrossFloorAreaError}
              errorMessage="연면적현황을 불러오지 못했습니다."
              extraSummaryCards={(buildingData) => [
                { label: "정보없음", value: buildingData.summary.unknown_area_count ?? 0 },
                ...(buildingData.summary.over_100000_area_count && buildingData.summary.over_100000_area_count > 0
                  ? [{ label: "100,000㎡ 초과", value: buildingData.summary.over_100000_area_count }]
                  : [])
              ]}
              fallbackTitle="연면적현황"
              loadingMessage="연면적현황을 불러오는 중입니다."
              status={buildingGrossFloorAreaStatus}
            />
          ) : activeDetailItem === "buildingCoverageRatio" ? (
            <BuildingInfoContent
              categorySummaryLabel="분류 수"
              data={buildingCoverageRatioData}
              emptyChartMessage="표시할 건폐율 차트가 없습니다."
              error={buildingCoverageRatioError}
              errorMessage="건폐율현황을 불러오지 못했습니다."
              extraSummaryCards={(buildingData) => [
                { label: "정보없음", value: buildingData.summary.unknown_coverage_count ?? 0 },
                ...(buildingData.summary.over_100_coverage_count && buildingData.summary.over_100_coverage_count > 0
                  ? [{ label: "100% 초과", value: buildingData.summary.over_100_coverage_count }]
                  : [])
              ]}
              fallbackTitle="건폐율현황"
              loadingMessage="건폐율현황을 불러오는 중입니다."
              status={buildingCoverageRatioStatus}
            />
          ) : activeDetailItem === "buildingFloorAreaRatio" ? (
            <BuildingInfoContent
              categorySummaryLabel="분류 수"
              data={buildingFloorAreaRatioData}
              emptyChartMessage="표시할 용적률 차트가 없습니다."
              error={buildingFloorAreaRatioError}
              errorMessage="용적률현황을 불러오지 못했습니다."
              extraSummaryCards={(buildingData) => [
                { label: "정보없음", value: buildingData.summary.unknown_far_count ?? 0 },
                ...(buildingData.summary.over_2000_far_count && buildingData.summary.over_2000_far_count > 0
                  ? [{ label: "2000% 초과", value: buildingData.summary.over_2000_far_count }]
                  : [])
              ]}
              fallbackTitle="용적률현황"
              loadingMessage="용적률현황을 불러오는 중입니다."
              status={buildingFloorAreaRatioStatus}
            />
          ) : activeDetailItem === "naturalEnvironmentElevation" ? (
            <CategoryAnalysisContent
              data={naturalEnvironmentElevationData}
              emptyMessage="분석 결과에서 표고분석을 찾을 수 없습니다."
              error={naturalEnvironmentElevationError}
              loadingMessage="표고분석을 불러오는 중입니다."
              noticeLines={naturalEnvironmentElevationNoticeLines}
              status={naturalEnvironmentElevationStatus}
              tableRowsFilter={shouldShowZoneAndCategoryAreaRow}
              title="표고분석"
            />
          ) : activeDetailItem === "naturalEnvironmentSlope" ? (
            <CategoryAnalysisContent
              data={naturalEnvironmentSlopeData}
              emptyMessage="분석 결과에서 경사분석을 찾을 수 없습니다."
              error={naturalEnvironmentSlopeError}
              loadingMessage="경사분석을 불러오는 중입니다."
              noticeLines={naturalEnvironmentSlopeNoticeLines}
              status={naturalEnvironmentSlopeStatus}
              tableRowsFilter={shouldShowZoneAndCategoryAreaRow}
              title="경사분석"
            />
          ) : activeDetailItem === "naturalEnvironmentEcologyNatureMap" ? (
            <EcologyNatureMapContent
              data={naturalEnvironmentEcologyNatureMapData}
              error={naturalEnvironmentEcologyNatureMapError}
              status={naturalEnvironmentEcologyNatureMapStatus}
            />
          ) : activeDetailItem === "naturalEnvironmentForestType" ? (
            <ForestTypeMapContent
              data={naturalEnvironmentForestTypeData}
              emptyMessage="분석 결과에서 식생(임상별)을 찾을 수 없습니다."
              error={naturalEnvironmentForestTypeError}
              loadingMessage="식생(임상별)을 불러오는 중입니다."
              status={naturalEnvironmentForestTypeStatus}
              title="식생(임상별)"
            />
          ) : activeDetailItem === "naturalEnvironmentForestAgeClass" ? (
            <ForestTypeMapContent
              data={naturalEnvironmentForestAgeClassData}
              emptyMessage="분석 결과에서 식생(영급별)을 찾을 수 없습니다."
              error={naturalEnvironmentForestAgeClassError}
              loadingMessage="식생(영급별)을 불러오는 중입니다."
              status={naturalEnvironmentForestAgeClassStatus}
              title="식생(영급별)"
            />
          ) : activeDetailItem === "naturalEnvironmentForestSpecies" ? (
            <ForestTypeMapContent
              data={naturalEnvironmentForestSpeciesData}
              emptyMessage="분석 결과에서 식생(수종별)을 찾을 수 없습니다."
              error={naturalEnvironmentForestSpeciesError}
              loadingMessage="식생(수종별)을 불러오는 중입니다."
              status={naturalEnvironmentForestSpeciesStatus}
              title="식생(수종별)"
            />
          ) : activeDetailItem === "naturalEnvironmentForestDiameterClass" ? (
            <ForestTypeMapContent
              data={naturalEnvironmentForestDiameterClassData}
              emptyMessage="분석 결과에서 식생(경급별)을 찾을 수 없습니다."
              error={naturalEnvironmentForestDiameterClassError}
              loadingMessage="식생(경급별)을 불러오는 중입니다."
              status={naturalEnvironmentForestDiameterClassStatus}
              title="식생(경급별)"
            />
          ) : activeDetailItem === "planningSpecialPurposeArea" ? (
            <PlanningSpecialPurposeAreaContent
              data={planningSpecialPurposeAreaData}
              error={planningSpecialPurposeAreaError}
              status={planningSpecialPurposeAreaStatus}
            />
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

const buildingInfoColumnKeys = ["color", "label", "main_building_count", "ratio_percent", "accessory_building_count"];
const fallbackBuildingInfoColumns: BuildingInfoTableColumn[] = [
  { key: "color", label: "범례", type: "color" },
  { key: "label", label: "구분", type: "text" },
  { key: "main_building_count", label: "주건축물(동)", type: "number" },
  { key: "ratio_percent", label: "구성비(%)", type: "percent" },
  { key: "accessory_building_count", label: "부속건축물(동)", type: "number" }
];
type BuildingInfoSummaryCard = {
  label: string;
  value: number;
};

function getBuildingInfoColumns(data: BuildingInfoResponse) {
  const columns = data.table.columns.filter((column) => buildingInfoColumnKeys.includes(column.key));
  return columns.length > 0 ? columns : fallbackBuildingInfoColumns;
}

function BuildingInfoContent({
  categorySummaryLabel,
  data,
  emptyChartMessage,
  error,
  errorMessage,
  extraSummaryCards,
  fallbackTitle,
  loadingMessage,
  status
}: {
  categorySummaryLabel: string;
  data: BuildingInfoResponse | null;
  emptyChartMessage: string;
  error: string | null;
  errorMessage: string;
  extraSummaryCards?: (data: BuildingInfoResponse) => BuildingInfoSummaryCard[];
  fallbackTitle: string;
  loadingMessage: string;
  status: "idle" | "loading" | "success" | "error" | "empty";
}) {
  const title = data?.title ?? fallbackTitle;
  const breadcrumb = data?.breadcrumb?.join(" > ");

  return (
    <section className="min-h-0 flex-1 overflow-y-auto pt-5 font-[family-name:var(--font-pretendard)]">
      <div>
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        {breadcrumb ? <p className="mt-1 text-[11px] font-medium text-slate-400">{breadcrumb}</p> : null}
      </div>

      {status === "loading" ? (
        <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-[12px] text-slate-500">
          {loadingMessage}
        </p>
      ) : null}

      {status === "error" ? (
        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-4 text-[12px] text-rose-700">
          {error ?? errorMessage}
        </p>
      ) : null}

      {(status === "success" || status === "empty") && data ? (
        <div className="mt-4 flex flex-col gap-4">
          <BuildingInfoSummaryCards
            categorySummaryLabel={categorySummaryLabel}
            data={data}
            extraCards={extraSummaryCards?.(data) ?? []}
          />

          {status === "empty" ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-[12px] text-slate-500">
              선택 구역 내 건축물 데이터가 없습니다.
            </p>
          ) : null}

          <BuildingInfoTableView data={data} emptyMessage={`표시할 ${fallbackTitle}이 없습니다.`} />
          <BuildingInfoChartView emptyMessage={emptyChartMessage} rows={data.chart.rows} title={data.chart.title} />
          <BuildingInfoLayerList layers={data.layers} />

          {data.warnings.length > 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-5 text-amber-800">
              {data.warnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function BuildingInfoSummaryCards({
  categorySummaryLabel,
  data,
  extraCards
}: {
  categorySummaryLabel: string;
  data: BuildingInfoResponse;
  extraCards: BuildingInfoSummaryCard[];
}) {
  const cards = [
    { label: "건축물 수", value: data.summary.building_count },
    { label: categorySummaryLabel, value: data.summary.category_count },
    { label: "주건축물 수", value: data.summary.main_building_count },
    { label: "부속건축물 수", value: data.summary.accessory_building_count },
    ...extraCards
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
          <p className="text-[11px] font-medium text-slate-500">{card.label}</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{countFormatter.format(card.value)}</p>
        </div>
      ))}
    </div>
  );
}

function BuildingInfoTableView({
  data,
  emptyMessage
}: {
  data: BuildingInfoResponse;
  emptyMessage: string;
}) {
  const columns = getBuildingInfoColumns(data);
  const rows = data.table.total_row ? [...data.table.rows, data.table.total_row] : data.table.rows;

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-3 py-2">
        <p className="text-sm font-semibold text-slate-800">{data.table.title}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] divide-y divide-slate-200 text-left text-[11px]">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-3 py-2 font-semibold">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr key={row.key} className={row.row_type === "total" ? "border-t-2 border-slate-300 bg-slate-50 font-semibold text-slate-900" : "font-medium"}>
                  {columns.map((column) => (
                    <td key={column.key} className="whitespace-nowrap px-3 py-2">
                      {renderBuildingInfoTableCell(row, column)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-3 py-4 text-center text-[12px] text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {data.table.footnotes.length > 0 ? (
        <div className="border-t border-slate-100 px-3 py-2 text-[11px] leading-5 text-slate-500">
          {data.table.footnotes.map((footnote) => (
            <p key={footnote}>{footnote}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function renderBuildingInfoTableCell(row: BuildingInfoTableRow, column: BuildingInfoTableColumn) {
  switch (column.key) {
    case "color":
      return row.color ? <span className="block h-3 w-3 rounded-full" style={{ backgroundColor: row.color }} /> : "-";
    case "label":
      return row.label;
    case "main_building_count":
      return formatNullableNumber(row.main_building_count);
    case "ratio_percent":
      return formatRatio(row.ratio_percent);
    case "accessory_building_count":
      return formatNullableNumber(row.accessory_building_count);
    default:
      return "-";
  }
}

function BuildingInfoChartView({
  emptyMessage,
  rows,
  title
}: {
  emptyMessage: string;
  rows: BuildingInfoChartRow[];
  title: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-[12px] text-slate-500">
        {emptyMessage}
      </p>
    );
  }

  const totalValue = rows.reduce((sum, row) => sum + Math.max(row.value, 0), 0);
  let offset = 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="mb-3 text-sm font-semibold text-slate-800">{title}</p>
      <div className="flex items-center gap-5">
        <svg viewBox="0 0 120 120" className="h-32 w-32 shrink-0" role="img" aria-label={title}>
          <circle cx="60" cy="60" r="42" fill="#f8fafc" />
          {rows.map((row) => {
            const ratio =
              row.ratio_percent !== null
                ? Math.max(row.ratio_percent, 0)
                : totalValue > 0
                  ? (Math.max(row.value, 0) / totalValue) * 100
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
                stroke={row.color}
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
          {rows.map((row) => (
            <div key={row.key} className="flex items-start gap-2 text-[12px] text-slate-600">
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: row.color }} />
              <div className="min-w-0">
                <p className="font-medium text-slate-800">{row.label}</p>
                <p className="text-[11px] text-slate-500">
                  {countFormatter.format(row.value)}동 · {formatRatio(row.ratio_percent)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BuildingInfoLayerList({ layers }: { layers: BuildingInfoResponse["layers"] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">사용자레이어</p>
      <p className="mt-1 text-sm font-semibold text-slate-800">
        {layers.group_label} · {layers.layer_label}
      </p>
      {layers.items.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {layers.items.map((item) => (
            <BuildingInfoLayerItemRow key={item.key} item={item} />
          ))}
        </ul>
      ) : (
        <p className="mt-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-[12px] text-slate-500">
          표시할 사용자레이어 항목이 없습니다.
        </p>
      )}
    </div>
  );
}

function BuildingInfoLayerItemRow({ item }: { item: BuildingInfoLayerItem }) {
  return (
    <li className="flex items-center justify-between gap-3 text-[12px] text-slate-600">
      <span className="flex min-w-0 items-center gap-2">
        <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
        <span className="truncate font-medium text-slate-800">{item.label}</span>
      </span>
      <span className="shrink-0 text-slate-500">{countFormatter.format(item.count)}동</span>
    </li>
  );
}

function EcologyNatureMapContent({
  data,
  error,
  status
}: {
  data: NaturalEnvironmentEcologyNatureMapResponse | null;
  error: string | null;
  status: "idle" | "loading" | "success" | "error";
}) {
  const displayRows = data?.table_rows.filter(shouldShowZoneAndCategoryAreaRow) ?? [];
  const errorRow = data?.table_rows.find((row) => row.row_type === "error") ?? null;

  return (
    <section className="min-h-0 flex-1 overflow-y-auto pt-5 font-[family-name:var(--font-pretendard)]">
      <h3 className="text-sm font-semibold text-slate-800">생태자연도</h3>
      <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-light leading-5 text-amber-800">
        {naturalEnvironmentEcologyNatureMapNoticeLines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>

      {status === "loading" ? (
        <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-[12px] text-slate-500">
          생태자연도를 불러오는 중입니다.
        </p>
      ) : null}

      {status === "error" ? (
        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-4 text-[12px] text-rose-700">
          {error ?? "생태자연도를 불러오지 못했습니다."}
        </p>
      ) : null}

      {status === "success" && data ? (
        <div className="mt-4 flex flex-col gap-4">
          <LandCategoryPieChart
            emptyMessage="분석 결과에서 생태자연도를 찾을 수 없습니다."
            rows={data.chart_rows.filter((row) => row.row_type === "category")}
            useFallbackColors={false}
          />
          <EcologyNatureMapStatusTable errorRow={errorRow} rows={displayRows} />
          <EcologyNatureMapUsageTable />
        </div>
      ) : null}
    </section>
  );
}

function getEcologyNatureMapCellClass(row: BasicInfoAnalysisRow, className = "") {
  const weightClass = row.row_type === "zone" || row.row_type === "total" ? "font-semibold" : "font-medium";
  const colorClass = row.row_type === "category" ? "text-slate-700" : "text-slate-900";
  const borderClass = row.row_type === "total" ? "border-b-2 border-slate-300" : "";

  return `${className} ${weightClass} ${colorClass} ${borderClass}`.trim();
}

function EcologyNatureMapStatusTable({
  errorRow,
  rows
}: {
  errorRow: BasicInfoAnalysisRow | null;
  rows: BasicInfoAnalysisRow[];
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-3 py-2">
        <p className="text-sm font-semibold text-slate-800">생태 등급별 현황</p>
        {errorRow ? <p className="mt-1 text-[11px] text-slate-500">면적오차: {formatArea(errorRow.area_m2)}</p> : null}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] divide-y divide-slate-200 text-left text-[12px] font-[family-name:var(--font-pretendard)]">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-3 py-2 font-semibold">구분</th>
              <th className="px-3 py-2 text-right font-semibold">면적(㎡)</th>
              <th className="px-3 py-2 text-right font-semibold">구성비(%)</th>
              <th className="px-3 py-2 font-semibold">비고</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr key={row.key}>
                  <td className={getEcologyNatureMapCellClass(row, "whitespace-nowrap px-3 py-2")}>
                    <span className="inline-flex items-center gap-2">
                      {row.color ? (
                        <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: row.color }} />
                      ) : null}
                      {row.label}
                    </span>
                  </td>
                  <td className={getEcologyNatureMapCellClass(row, "whitespace-nowrap px-3 py-2 text-right")}>
                    {formatArea(row.area_m2)}
                  </td>
                  <td className={getEcologyNatureMapCellClass(row, "whitespace-nowrap px-3 py-2 text-right")}>
                    {formatRatio(row.ratio_percent)}
                  </td>
                  <td className={getEcologyNatureMapCellClass(row, "whitespace-nowrap px-3 py-2")}>
                    {row.note ?? "-"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-center text-[12px] text-slate-500">
                  분석 결과에서 생태자연도를 찾을 수 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EcologyNatureMapUsageTable() {
  const rows = [
    { label: "1등급", value: "자연환경의 보전 및 복원" },
    { label: "2등급", value: "자연환경의 보전 및 개발 이용에 따른 훼손 최소화" },
    { label: "3등급", value: "체계적인 개발 및 이용" },
    {
      label: "별도관리지역",
      value: "역사적, 문화적, 경관적 가치가 있는 지역, 도시의 녹지보전 등을 위하여 관리되는 지역"
    }
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-3 py-2">
        <p className="text-sm font-semibold text-slate-800">생태자연도 활용 기준</p>
      </div>
      <table className="w-full divide-y divide-slate-200 text-left text-[12px]">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="w-[112px] px-3 py-2 font-semibold">구분</th>
            <th className="px-3 py-2 font-semibold">활용 기준</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
          {rows.map((row) => (
            <tr key={row.label}>
              <td className="whitespace-nowrap px-3 py-2 font-medium text-slate-800">{row.label}</td>
              <td className="px-3 py-2 font-medium leading-5 text-slate-700">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ForestTypeMapContent({
  data,
  emptyMessage,
  error,
  loadingMessage,
  status,
  title
}: {
  data: NaturalEnvironmentForestTypeMapResponse | null;
  emptyMessage: string;
  error: string | null;
  loadingMessage: string;
  status: "idle" | "loading" | "success" | "error";
  title: string;
}) {
  return (
    <section className="min-h-0 flex-1 overflow-y-auto pt-5 font-[family-name:var(--font-pretendard)]">
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-light leading-5 text-amber-800">
        {naturalEnvironmentForestTypeMapNoticeLines.map((line) => (
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
          <div className="grid grid-cols-2 gap-2">
            <PlanningSummaryCard label="구역계 면적" value={formatOptionalArea(data.summary.zone_area_m2)} />
            <PlanningSummaryCard label="분석면적" value={formatOptionalArea(data.summary.category_total_area_m2)} />
            <PlanningSummaryCard label="면적오차" value={formatOptionalArea(data.summary.summary_area_error_m2)} />
            <PlanningSummaryCard label="분류 수" value={formatNullableNumber(data.summary.category_count)} />
            <PlanningSummaryCard label="도형 수" value={formatNullableNumber(data.summary.feature_count)} />
          </div>
          <LandCategoryPieChart
            emptyMessage={emptyMessage}
            rows={data.chart_rows.filter((row) => row.row_type === "category")}
            useFallbackColors={false}
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

function getPlanningPatternColor(pattern: PlanningSpecialPurposeAreaPattern) {
  if (pattern.startsWith("red-")) {
    return "#FF0000";
  }

  if (pattern.startsWith("green-")) {
    return "#38A800";
  }

  if (pattern.startsWith("purple-")) {
    return "#A900E6";
  }

  return "#000000";
}

function PlanningSpecialPurposeAreaLegendSymbol({ label }: { label: string }) {
  const style = getPlanningSpecialPurposeAreaStyle(label);
  const patternColor = getPlanningPatternColor(style.pattern);

  return (
    <svg viewBox="0 0 28 18" className="block h-[18px] w-7 shrink-0" role="img" aria-label={`${label} 범례`}>
      <rect x="0.5" y="0.5" width="27" height="17" fill={style.fillColor} stroke={style.outlineColor} strokeWidth="1" />
      <PlanningSpecialPurposeAreaLegendPattern pattern={style.pattern} color={patternColor} />
    </svg>
  );
}

function PlanningSpecialPurposeAreaLegendPattern({
  color,
  pattern
}: {
  color: string;
  pattern: PlanningSpecialPurposeAreaStyle["pattern"];
}) {
  if (pattern === "none") {
    return null;
  }

  if (pattern.endsWith("-diagonal")) {
    return (
      <g stroke={color} strokeLinecap="square" strokeWidth="0.8">
        {[-18, -8, 2, 12, 22].map((x) => (
          <line key={x} x1={x} y1="18" x2={x + 18} y2="0" />
        ))}
      </g>
    );
  }

  if (pattern.endsWith("-horizontal")) {
    return (
      <g stroke={color} strokeLinecap="square" strokeWidth="0.8">
        {[5, 13].map((y) => (
          <line key={y} x1="0" y1={y} x2="28" y2={y} />
        ))}
      </g>
    );
  }

  if (pattern.endsWith("-dot")) {
    return (
      <g fill="none" stroke={color} strokeWidth="0.8">
        {[5, 13].flatMap((y) =>
          [6, 14, 22].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2.6" />)
        )}
      </g>
    );
  }

  return null;
}

function PlanningSpecialPurposeAreaContent({
  data,
  error,
  status
}: {
  data: PlanningSpecialPurposeAreaResponse | null;
  error: string | null;
  status: "idle" | "loading" | "success" | "error";
}) {
  const tableRows = data?.table_rows ?? [];

  return (
    <section className="min-h-0 flex-1 overflow-y-auto pt-5 font-[family-name:var(--font-pretendard)]">
      <h3 className="text-sm font-semibold text-slate-800">용도지역</h3>
      <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-light leading-5 text-amber-800">
        {planningSpecialPurposeAreaNoticeLines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>

      {status === "loading" ? (
        <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-[12px] text-slate-500">
          용도지역을 불러오는 중입니다.
        </p>
      ) : null}

      {status === "error" ? (
        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-4 text-[12px] text-rose-700">
          {error ?? "용도지역을 불러오지 못했습니다."}
        </p>
      ) : null}

      {status === "success" && data ? (
        <div className="mt-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2">
            <PlanningSummaryCard label="구역계 면적" value={formatOptionalArea(data.summary.zone_area_m2)} />
            <PlanningSummaryCard label="분석면적" value={formatOptionalArea(data.summary.category_total_area_m2)} />
            <PlanningSummaryCard label="면적오차" value={formatOptionalArea(data.summary.summary_area_error_m2)} />
            <PlanningSummaryCard label="용도지역 수" value={formatNullableNumber(data.summary.category_count)} />
          </div>

          {tableRows.length > 0 ? (
            <PlanningSpecialPurposeAreaTable rows={tableRows} />
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-[12px] text-slate-500">
              분석 결과에서 용도지역을 찾을 수 없습니다.
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}

function getPlanningSpecialPurposeAreaCellClass(row: BasicInfoAnalysisRow, className = "") {
  const weightClass = row.row_type === "zone" || row.row_type === "total" ? "font-semibold" : "font-medium";
  const colorClass =
    row.row_type === "error" ? "text-slate-500" : row.row_type === "category" ? "text-slate-700" : "text-slate-900";
  const borderClass =
    row.row_type === "total"
      ? "border-b-2 border-slate-300"
      : row.row_type === "zone" || row.row_type === "error"
        ? "border-b border-slate-200"
        : "";

  return `${className} ${weightClass} ${colorClass} ${borderClass}`.trim();
}

function PlanningSummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-[13px] font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function PlanningSpecialPurposeAreaTable({ rows }: { rows: BasicInfoAnalysisRow[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] divide-y divide-slate-200 text-left text-[12px] font-[family-name:var(--font-pretendard)]">
          <thead className="sticky top-0 bg-slate-50 text-slate-500">
            <tr>
              <th className="px-3 py-2 font-semibold">범례</th>
              <th className="px-3 py-2 font-semibold">용도지역</th>
              <th className="px-3 py-2 font-semibold">구분</th>
              <th className="px-3 py-2 text-right font-semibold">면적</th>
              <th className="px-3 py-2 text-right font-semibold">비율</th>
              <th className="px-3 py-2 text-right font-semibold">도형 수</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
            {rows.map((row) => (
              <tr key={row.key}>
                <td className={getPlanningSpecialPurposeAreaCellClass(row, "px-3 py-2")}>
                  {row.row_type === "category" ? <PlanningSpecialPurposeAreaLegendSymbol label={row.label} /> : "-"}
                </td>
                <td className={getPlanningSpecialPurposeAreaCellClass(row, "whitespace-nowrap px-3 py-2")}>
                  {row.label}
                </td>
                <td className={getPlanningSpecialPurposeAreaCellClass(row, "whitespace-nowrap px-3 py-2")}>
                  {row.note ?? "-"}
                </td>
                <td className={getPlanningSpecialPurposeAreaCellClass(row, "whitespace-nowrap px-3 py-2 text-right")}>
                  {formatArea(row.area_m2)}
                </td>
                <td className={getPlanningSpecialPurposeAreaCellClass(row, "whitespace-nowrap px-3 py-2 text-right")}>
                  {formatRatio(row.ratio_percent)}
                </td>
                <td className={getPlanningSpecialPurposeAreaCellClass(row, "whitespace-nowrap px-3 py-2 text-right")}>
                  {formatParcelCount(row.parcel_count)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CategoryAnalysisContent({
  data,
  emptyMessage,
  error,
  loadingMessage,
  noticeLines,
  status,
  tableRowsFilter,
  title
}: {
  data: { table_rows: BasicInfoAnalysisRow[]; chart_rows: BasicInfoAnalysisRow[] } | null;
  emptyMessage: string;
  error: string | null;
  loadingMessage: string;
  noticeLines: string[];
  status: "idle" | "loading" | "success" | "error";
  tableRowsFilter?: (row: BasicInfoAnalysisRow) => boolean;
  title: string;
}) {
  const tableRows = data ? (tableRowsFilter ? data.table_rows.filter(tableRowsFilter) : data.table_rows) : [];

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

      {status === "success" && data && tableRows.length > 0 ? (
        <div className="mt-4 flex flex-col gap-4">
          <LandCategoryPieChart
            emptyMessage={emptyMessage}
            rows={data.chart_rows.filter((row) => row.row_type === "category")}
          />
          <LandCategoryTable rows={tableRows} />
        </div>
      ) : null}

      {status === "success" && (!data || tableRows.length === 0) ? (
        <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-[12px] text-slate-500">
          {emptyMessage}
        </p>
      ) : null}
    </section>
  );
}

function LandCategoryPieChart({
  emptyMessage,
  rows,
  useFallbackColors = true
}: {
  emptyMessage: string;
  rows: BasicInfoAnalysisRow[];
  useFallbackColors?: boolean;
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
            const color = useFallbackColors ? getRowColor(row, index) : row.color;
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
                stroke={color ?? "transparent"}
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
              {useFallbackColors || row.color ? (
                <span
                  className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: useFallbackColors ? getRowColor(row, index) : row.color ?? "transparent" }}
                />
              ) : (
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full border border-slate-300 bg-transparent" />
              )}
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
