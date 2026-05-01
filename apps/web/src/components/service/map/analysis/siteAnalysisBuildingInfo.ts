"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Geometry } from "geojson";
import { useZoneSelection } from "@/components/service/map/zone-selection/zoneSelectionState";

export type BuildingUseSummary = {
  zone_srid: number;
  analysis_srid: number;
  building_count: number;
  category_count: number;
  main_building_count: number;
  accessory_building_count: number;
  unknown_use_count: number;
  selection_geometry: string;
  display_geometry: string;
};

export type BuildingUseTableColumn = {
  key: "color" | "label" | "main_building_count" | "ratio_percent" | "accessory_building_count" | string;
  label: string;
  type: "color" | "text" | "number" | "percent" | string;
};

export type BuildingUseTableRow = {
  row_type: "category" | "total";
  key: string;
  code?: string | null;
  label: string;
  color?: string | null;
  building_count: number;
  main_building_count: number;
  accessory_building_count: number;
  ratio_percent: number | null;
  note: string | null;
};

export type BuildingUseTable = {
  title: string;
  columns: BuildingUseTableColumn[];
  rows: BuildingUseTableRow[];
  total_row: BuildingUseTableRow | null;
  footnotes: string[];
};

export type BuildingUseChartRow = {
  key: string;
  code?: string | null;
  label: string;
  value: number;
  ratio_percent: number | null;
  color: string;
};

export type BuildingUseChart = {
  title: string;
  type: "pie" | string;
  rows: BuildingUseChartRow[];
};

export type BuildingUseLayerItem = {
  key: string;
  code?: string | null;
  label: string;
  color: string;
  visible: boolean;
  count: number;
};

export type BuildingUseLayers = {
  group_label: string;
  layer_label: string;
  items: BuildingUseLayerItem[];
};

export type BuildingUseMapFeatureProperties = {
  feature_type: "building" | string;
  analysis_type: "building-use" | string;
  building_uid?: string;
  pnu?: string;
  key: string;
  label: string;
  color: string;
};

export type BuildingUseMapFeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: BuildingUseMapFeatureProperties;
    geometry: Geometry;
  }>;
};

export type BuildingUseDiagnostics = Record<string, unknown>;

export type BuildingUseResponse = {
  analysis_type: "building-use" | string;
  title: string;
  breadcrumb: string[];
  summary: BuildingUseSummary;
  table: BuildingUseTable;
  chart: BuildingUseChart;
  layers: BuildingUseLayers;
  map_features: BuildingUseMapFeatureCollection;
  category_diagnostics: BuildingUseDiagnostics;
  warnings: string[];
};

type BuildingUseStatus = "idle" | "loading" | "success" | "error" | "empty";

type BuildingUseState = {
  status: BuildingUseStatus;
  data: BuildingUseResponse | null;
  error: string | null;
};

const initialState: BuildingUseState = {
  status: "idle",
  data: null,
  error: null
};

export function useSiteAnalysisBuildingUse() {
  const { state: zoneState } = useZoneSelection();
  const [state, setState] = useState<BuildingUseState>(initialState);
  const abortControllerRef = useRef<AbortController | null>(null);

  const canRequest = zoneState.status === "confirmed" && zoneState.confirmedZone !== null;

  const loadBuildingUse = useCallback(async () => {
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
      const response = await fetch("/analysis/building-info/use", {
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
        throw new Error(message || `용도현황 요청에 실패했습니다. (${response.status})`);
      }

      const data = (await response.json()) as BuildingUseResponse;
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
        error: error instanceof Error ? error.message : "용도현황 요청 중 오류가 발생했습니다."
      });
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  }, [zoneState.confirmedZone, zoneState.status]);

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
    loadBuildingUse
  };
}
