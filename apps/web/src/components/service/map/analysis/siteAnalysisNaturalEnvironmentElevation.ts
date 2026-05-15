"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useZoneSelection } from "@/components/service/map/zone-selection/zoneSelectionState";
import type { NaturalEnvironmentMapOverlay } from "./siteAnalysisState";
import type { BasicInfoAnalysisRow } from "./siteAnalysisLandCategory";
import type { SiteAnalysisMapFeatureCollection } from "./siteAnalysisMapFeatures";

type NaturalEnvironmentAnalysisMapOverlay = {
  raster: NonNullable<NaturalEnvironmentMapOverlay>["raster"];
  contours: NonNullable<NaturalEnvironmentMapOverlay>["contours"];
};

export type NaturalEnvironmentAnalysisResponse = {
  summary: {
    category_count?: number;
    zone_area_m2?: number;
    category_total_area_m2?: number;
    summary_area_error_m2?: number;
  };
  table_rows: BasicInfoAnalysisRow[];
  chart_rows: BasicInfoAnalysisRow[];
  map_features: SiteAnalysisMapFeatureCollection;
  map_overlay?: NaturalEnvironmentAnalysisMapOverlay | null;
};

type NaturalEnvironmentAnalysisStatus = "idle" | "loading" | "success" | "error";

type NaturalEnvironmentAnalysisState = {
  status: NaturalEnvironmentAnalysisStatus;
  data: NaturalEnvironmentAnalysisResponse | null;
  error: string | null;
};

const initialState: NaturalEnvironmentAnalysisState = {
  status: "idle",
  data: null,
  error: null
};

export function useSiteAnalysisNaturalEnvironmentElevation() {
  const { state: zoneState } = useZoneSelection();
  const [state, setState] = useState<NaturalEnvironmentAnalysisState>(initialState);
  const abortControllerRef = useRef<AbortController | null>(null);

  const canRequest = zoneState.status === "confirmed" && zoneState.confirmedZone !== null;

  const loadNaturalEnvironmentElevation = useCallback(async () => {
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
      const response = await fetch("/analysis/location-analysis/natural-environment/elevation", {
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
        throw new Error(message || `표고분석 요청에 실패했습니다. (${response.status})`);
      }

      setState({
        status: "success",
        data: (await response.json()) as NaturalEnvironmentAnalysisResponse,
        error: null
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setState({
        status: "error",
        data: null,
        error: error instanceof Error ? error.message : "표고분석 요청 중 오류가 발생했습니다."
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
    loadNaturalEnvironmentElevation
  };
}
