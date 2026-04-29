"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useZoneSelection } from "@/components/service/map/zone-selection/zoneSelectionState";
import type { BasicInfoAnalysisRow } from "./siteAnalysisLandCategory";
import type { SiteAnalysisMapFeatureCollection } from "./siteAnalysisMapFeatures";

export type AreaSummaryResponse = {
  summary: {
    parcel_count: number;
    category_count: number;
    zone_area_m2: number;
    category_total_area_m2: number;
    summary_area_error_m2: number;
  };
  table_rows: BasicInfoAnalysisRow[];
  chart_rows: BasicInfoAnalysisRow[];
  map_features: SiteAnalysisMapFeatureCollection;
};

type AreaSummaryStatus = "idle" | "loading" | "success" | "error";

type AreaSummaryState = {
  status: AreaSummaryStatus;
  data: AreaSummaryResponse | null;
  error: string | null;
};

const initialState: AreaSummaryState = {
  status: "idle",
  data: null,
  error: null
};

export function useSiteAnalysisAreaSummary() {
  const { state: zoneState } = useZoneSelection();
  const [state, setState] = useState<AreaSummaryState>(initialState);
  const abortControllerRef = useRef<AbortController | null>(null);

  const canRequest = zoneState.status === "confirmed" && zoneState.confirmedZone !== null;

  const loadAreaSummary = useCallback(async () => {
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
      const response = await fetch("/analysis/basic-info/area-summary", {
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
        throw new Error(message || `면적현황 요청에 실패했습니다. (${response.status})`);
      }

      const data = (await response.json()) as AreaSummaryResponse;
      setState({
        status: "success",
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
        error: error instanceof Error ? error.message : "면적현황 요청 중 오류가 발생했습니다."
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
    loadAreaSummary
  };
}
