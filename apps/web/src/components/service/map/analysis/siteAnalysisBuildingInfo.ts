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
  analysis_type: "building-use" | "building-structure" | string;
  building_uid?: string;
  pnu?: string;
  key: string;
  code?: string | null;
  group_code?: string | null;
  label: string;
  color: string;
  structure_cd?: string | null;
  structure_nm?: string | null;
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
  analysis_type: "building-use" | "building-structure" | string;
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
  endpoint: "/analysis/building-info/use" | "/analysis/building-info/structure";
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
