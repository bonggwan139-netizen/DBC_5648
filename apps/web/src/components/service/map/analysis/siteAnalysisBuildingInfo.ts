"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Geometry } from "geojson";
import { useZoneSelection } from "@/components/service/map/zone-selection/zoneSelectionState";

export type BuildingInfoSummary = {
  zone_srid: number;
  analysis_srid: number;
  building_count: number;
  category_count: number;
  main_building_count: number;
  accessory_building_count: number;
  unknown_use_count?: number;
  unknown_structure_count?: number;
  unknown_floor_count?: number;
  unknown_age_count?: number;
  pre_1900_count?: number;
  unknown_area_count?: number;
  negative_area_count?: number;
  over_100000_area_count?: number;
  unknown_coverage_count?: number;
  over_100_coverage_count?: number;
  unknown_far_count?: number;
  over_2000_far_count?: number;
  selection_geometry: string;
  display_geometry: string;
};

export type BuildingInfoTableColumn = {
  key: "color" | "label" | "main_building_count" | "ratio_percent" | "accessory_building_count" | string;
  label: string;
  type: "color" | "text" | "number" | "percent" | string;
};

export type BuildingInfoTableRow = {
  row_type: "category" | "total";
  key: string;
  code?: string | null;
  group_code?: string | null;
  label: string;
  color?: string | null;
  building_count: number;
  main_building_count: number;
  accessory_building_count: number;
  ratio_percent: number | null;
  note: string | null;
};

export type BuildingInfoTable = {
  title: string;
  columns: BuildingInfoTableColumn[];
  rows: BuildingInfoTableRow[];
  total_row: BuildingInfoTableRow | null;
  footnotes: string[];
};

export type BuildingInfoChartRow = {
  key: string;
  code?: string | null;
  group_code?: string | null;
  label: string;
  value: number;
  ratio_percent: number | null;
  color: string;
};

export type BuildingInfoChart = {
  title: string;
  type: "pie" | string;
  rows: BuildingInfoChartRow[];
};

export type BuildingInfoLayerItem = {
  key: string;
  code?: string | null;
  group_code?: string | null;
  label: string;
  color: string;
  visible: boolean;
  count: number;
};

export type BuildingInfoLayers = {
  group_label: string;
  layer_label: string;
  items: BuildingInfoLayerItem[];
};

export type BuildingInfoMapFeatureProperties = {
  feature_type: "building" | string;
  analysis_type:
    | "building-use"
    | "building-structure"
    | "building-floor"
    | "building-age"
    | "building-gross-floor-area"
    | "building-coverage-ratio"
    | "building-floor-area-ratio"
    | string;
  building_uid?: string;
  pnu?: string;
  key: string;
  code?: string | null;
  group_code?: string | null;
  label: string;
  color: string;
  structure_cd?: string | null;
  structure_nm?: string | null;
  floor_count?: number | null;
  age_years?: number | null;
  approval_year?: number | null;
  gross_floor_area_m2?: number | null;
  building_coverage_ratio?: number | null;
  floor_area_ratio?: number | null;
};

export type BuildingInfoMapFeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: BuildingInfoMapFeatureProperties;
    geometry: Geometry;
  }>;
};

export type BuildingInfoDiagnostics = Record<string, unknown>;

export type BuildingInfoResponse = {
  analysis_type:
    | "building-use"
    | "building-structure"
    | "building-floor"
    | "building-age"
    | "building-gross-floor-area"
    | "building-coverage-ratio"
    | "building-floor-area-ratio"
    | string;
  title: string;
  breadcrumb: string[];
  summary: BuildingInfoSummary;
  table: BuildingInfoTable;
  chart: BuildingInfoChart;
  layers: BuildingInfoLayers;
  map_features: BuildingInfoMapFeatureCollection;
  category_diagnostics: BuildingInfoDiagnostics;
  warnings: string[];
};

export type BuildingUseSummary = BuildingInfoSummary;
export type BuildingUseTableColumn = BuildingInfoTableColumn;
export type BuildingUseTableRow = BuildingInfoTableRow;
export type BuildingUseTable = BuildingInfoTable;
export type BuildingUseChartRow = BuildingInfoChartRow;
export type BuildingUseChart = BuildingInfoChart;
export type BuildingUseLayerItem = BuildingInfoLayerItem;
export type BuildingUseLayers = BuildingInfoLayers;
export type BuildingUseMapFeatureProperties = BuildingInfoMapFeatureProperties;
export type BuildingUseMapFeatureCollection = BuildingInfoMapFeatureCollection;
export type BuildingUseDiagnostics = BuildingInfoDiagnostics;
export type BuildingUseResponse = BuildingInfoResponse;

export type BuildingStructureSummary = BuildingInfoSummary;
export type BuildingStructureTableColumn = BuildingInfoTableColumn;
export type BuildingStructureTableRow = BuildingInfoTableRow;
export type BuildingStructureTable = BuildingInfoTable;
export type BuildingStructureChartRow = BuildingInfoChartRow;
export type BuildingStructureChart = BuildingInfoChart;
export type BuildingStructureLayerItem = BuildingInfoLayerItem;
export type BuildingStructureLayers = BuildingInfoLayers;
export type BuildingStructureMapFeatureProperties = BuildingInfoMapFeatureProperties;
export type BuildingStructureMapFeatureCollection = BuildingInfoMapFeatureCollection;
export type BuildingStructureDiagnostics = BuildingInfoDiagnostics;
export type BuildingStructureResponse = BuildingInfoResponse;

export type BuildingFloorSummary = BuildingInfoSummary;
export type BuildingFloorTableColumn = BuildingInfoTableColumn;
export type BuildingFloorTableRow = BuildingInfoTableRow;
export type BuildingFloorTable = BuildingInfoTable;
export type BuildingFloorChartRow = BuildingInfoChartRow;
export type BuildingFloorChart = BuildingInfoChart;
export type BuildingFloorLayerItem = BuildingInfoLayerItem;
export type BuildingFloorLayers = BuildingInfoLayers;
export type BuildingFloorMapFeatureProperties = BuildingInfoMapFeatureProperties;
export type BuildingFloorMapFeatureCollection = BuildingInfoMapFeatureCollection;
export type BuildingFloorDiagnostics = BuildingInfoDiagnostics;
export type BuildingFloorResponse = BuildingInfoResponse;

export type BuildingAgeSummary = BuildingInfoSummary;
export type BuildingAgeTableColumn = BuildingInfoTableColumn;
export type BuildingAgeTableRow = BuildingInfoTableRow;
export type BuildingAgeTable = BuildingInfoTable;
export type BuildingAgeChartRow = BuildingInfoChartRow;
export type BuildingAgeChart = BuildingInfoChart;
export type BuildingAgeLayerItem = BuildingInfoLayerItem;
export type BuildingAgeLayers = BuildingInfoLayers;
export type BuildingAgeMapFeatureProperties = BuildingInfoMapFeatureProperties;
export type BuildingAgeMapFeatureCollection = BuildingInfoMapFeatureCollection;
export type BuildingAgeDiagnostics = BuildingInfoDiagnostics;
export type BuildingAgeResponse = BuildingInfoResponse;

export type BuildingGrossFloorAreaSummary = BuildingInfoSummary;
export type BuildingGrossFloorAreaTableColumn = BuildingInfoTableColumn;
export type BuildingGrossFloorAreaTableRow = BuildingInfoTableRow;
export type BuildingGrossFloorAreaTable = BuildingInfoTable;
export type BuildingGrossFloorAreaChartRow = BuildingInfoChartRow;
export type BuildingGrossFloorAreaChart = BuildingInfoChart;
export type BuildingGrossFloorAreaLayerItem = BuildingInfoLayerItem;
export type BuildingGrossFloorAreaLayers = BuildingInfoLayers;
export type BuildingGrossFloorAreaMapFeatureProperties = BuildingInfoMapFeatureProperties;
export type BuildingGrossFloorAreaMapFeatureCollection = BuildingInfoMapFeatureCollection;
export type BuildingGrossFloorAreaDiagnostics = BuildingInfoDiagnostics;
export type BuildingGrossFloorAreaResponse = BuildingInfoResponse;

export type BuildingCoverageRatioSummary = BuildingInfoSummary;
export type BuildingCoverageRatioTableColumn = BuildingInfoTableColumn;
export type BuildingCoverageRatioTableRow = BuildingInfoTableRow;
export type BuildingCoverageRatioTable = BuildingInfoTable;
export type BuildingCoverageRatioChartRow = BuildingInfoChartRow;
export type BuildingCoverageRatioChart = BuildingInfoChart;
export type BuildingCoverageRatioLayerItem = BuildingInfoLayerItem;
export type BuildingCoverageRatioLayers = BuildingInfoLayers;
export type BuildingCoverageRatioMapFeatureProperties = BuildingInfoMapFeatureProperties;
export type BuildingCoverageRatioMapFeatureCollection = BuildingInfoMapFeatureCollection;
export type BuildingCoverageRatioDiagnostics = BuildingInfoDiagnostics;
export type BuildingCoverageRatioResponse = BuildingInfoResponse;

export type BuildingFloorAreaRatioSummary = BuildingInfoSummary;
export type BuildingFloorAreaRatioTableColumn = BuildingInfoTableColumn;
export type BuildingFloorAreaRatioTableRow = BuildingInfoTableRow;
export type BuildingFloorAreaRatioTable = BuildingInfoTable;
export type BuildingFloorAreaRatioChartRow = BuildingInfoChartRow;
export type BuildingFloorAreaRatioChart = BuildingInfoChart;
export type BuildingFloorAreaRatioLayerItem = BuildingInfoLayerItem;
export type BuildingFloorAreaRatioLayers = BuildingInfoLayers;
export type BuildingFloorAreaRatioMapFeatureProperties = BuildingInfoMapFeatureProperties;
export type BuildingFloorAreaRatioMapFeatureCollection = BuildingInfoMapFeatureCollection;
export type BuildingFloorAreaRatioDiagnostics = BuildingInfoDiagnostics;
export type BuildingFloorAreaRatioResponse = BuildingInfoResponse;

type BuildingInfoStatus = "idle" | "loading" | "success" | "error" | "empty";

type BuildingInfoState = {
  status: BuildingInfoStatus;
  data: BuildingInfoResponse | null;
  error: string | null;
};

const initialState: BuildingInfoState = {
  status: "idle",
  data: null,
  error: null
};

function useSiteAnalysisBuildingInfoRequest({
  endpoint,
  label
}: {
  endpoint:
    | "/analysis/building-info/use"
    | "/analysis/building-info/structure"
    | "/analysis/building-info/floor"
    | "/analysis/building-info/age"
    | "/analysis/building-info/gross-floor-area"
    | "/analysis/building-info/building-coverage-ratio"
    | "/analysis/building-info/floor-area-ratio";
  label: string;
}) {
  const { state: zoneState } = useZoneSelection();
  const [state, setState] = useState<BuildingInfoState>(initialState);
  const abortControllerRef = useRef<AbortController | null>(null);

  const canRequest = zoneState.status === "confirmed" && zoneState.confirmedZone !== null;

  const loadBuildingInfo = useCallback(async () => {
    if (zoneState.status !== "confirmed" || !zoneState.confirmedZone) {
      setState({
        status: "error",
        data: null,
        error: "확정된 구역이 없습니다. 구역을 먼저 확정해 주세요."
      });
      return;
    }

    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setState({
      status: "loading",
      data: null,
      error: null
    });

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          zone: zoneState.confirmedZone.geometry
        }),
        signal: abortController.signal
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `${label} 요청에 실패했습니다. (${response.status})`);
      }

      const data = (await response.json()) as BuildingInfoResponse;
      setState({
        status: data.summary.building_count === 0 ? "empty" : "success",
        data,
        error: null
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setState({
        status: "error",
        data: null,
        error: error instanceof Error ? error.message : `${label} 요청 중 오류가 발생했습니다.`
      });
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  }, [endpoint, label, zoneState.confirmedZone, zoneState.status]);

  useEffect(() => {
    if (canRequest) {
      return;
    }

    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setState(initialState);
  }, [canRequest]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return {
    ...state,
    canRequest,
    loadBuildingInfo
  };
}

export function useSiteAnalysisBuildingUse() {
  const { loadBuildingInfo, ...state } = useSiteAnalysisBuildingInfoRequest({
    endpoint: "/analysis/building-info/use",
    label: "용도현황"
  });

  return {
    ...state,
    loadBuildingUse: loadBuildingInfo
  };
}

export function useSiteAnalysisBuildingStructure() {
  const { loadBuildingInfo, ...state } = useSiteAnalysisBuildingInfoRequest({
    endpoint: "/analysis/building-info/structure",
    label: "구조현황"
  });

  return {
    ...state,
    loadBuildingStructure: loadBuildingInfo
  };
}

export function useSiteAnalysisBuildingFloor() {
  const { loadBuildingInfo, ...state } = useSiteAnalysisBuildingInfoRequest({
    endpoint: "/analysis/building-info/floor",
    label: "층수현황"
  });

  return {
    ...state,
    loadBuildingFloor: loadBuildingInfo
  };
}

export function useSiteAnalysisBuildingAge() {
  const { loadBuildingInfo, ...state } = useSiteAnalysisBuildingInfoRequest({
    endpoint: "/analysis/building-info/age",
    label: "경과년도"
  });

  return {
    ...state,
    loadBuildingAge: loadBuildingInfo
  };
}

export function useSiteAnalysisBuildingGrossFloorArea() {
  const { loadBuildingInfo, ...state } = useSiteAnalysisBuildingInfoRequest({
    endpoint: "/analysis/building-info/gross-floor-area",
    label: "연면적현황"
  });

  return {
    ...state,
    loadBuildingGrossFloorArea: loadBuildingInfo
  };
}

export function useSiteAnalysisBuildingCoverageRatio() {
  const { loadBuildingInfo, ...state } = useSiteAnalysisBuildingInfoRequest({
    endpoint: "/analysis/building-info/building-coverage-ratio",
    label: "건폐율현황"
  });

  return {
    ...state,
    loadBuildingCoverageRatio: loadBuildingInfo
  };
}

export function useSiteAnalysisBuildingFloorAreaRatio() {
  const { loadBuildingInfo, ...state } = useSiteAnalysisBuildingInfoRequest({
    endpoint: "/analysis/building-info/floor-area-ratio",
    label: "용적률현황"
  });

  return {
    ...state,
    loadBuildingFloorAreaRatio: loadBuildingInfo
  };
}
