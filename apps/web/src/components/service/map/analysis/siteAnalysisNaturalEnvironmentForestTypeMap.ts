"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useZoneSelection } from "@/components/service/map/zone-selection/zoneSelectionState";
import type { BasicInfoAnalysisRow } from "./siteAnalysisLandCategory";
import {
  normalizeSiteAnalysisMapFeatureCollection,
  type SiteAnalysisMapFeatureCollection
} from "./siteAnalysisMapFeatures";

type ForestTypeMapEndpoint =
  | "/analysis/location-analysis/natural-environment/forest-type-map/forest-type"
  | "/analysis/location-analysis/natural-environment/forest-type-map/age-class"
  | "/analysis/location-analysis/natural-environment/forest-type-map/species"
  | "/analysis/location-analysis/natural-environment/forest-type-map/diameter-class";

export type NaturalEnvironmentForestTypeMapResponse = {
  summary: {
    zone_area_m2?: number;
    category_count?: number;
    category_total_area_m2?: number;
    summary_area_error_m2?: number;
    feature_count?: number;
  };
  table_rows: BasicInfoAnalysisRow[];
  chart_rows: BasicInfoAnalysisRow[];
  map_features: SiteAnalysisMapFeatureCollection;
};

type NaturalEnvironmentForestTypeMapApiResponse = Omit<NaturalEnvironmentForestTypeMapResponse, "map_features"> & {
  map_features?: unknown;
};

type NaturalEnvironmentForestTypeMapStatus = "idle" | "loading" | "success" | "error";

type NaturalEnvironmentForestTypeMapState = {
  status: NaturalEnvironmentForestTypeMapStatus;
  data: NaturalEnvironmentForestTypeMapResponse | null;
  error: string | null;
};

const initialState: NaturalEnvironmentForestTypeMapState = {
  status: "idle",
  data: null,
  error: null
};

function useNaturalEnvironmentForestTypeMapAnalysis(endpoint: ForestTypeMapEndpoint, label: string) {
  const { state: zoneState } = useZoneSelection();
  const [state, setState] = useState<NaturalEnvironmentForestTypeMapState>(initialState);
  const abortControllerRef = useRef<AbortController | null>(null);

  const canRequest = zoneState.status === "confirmed" && zoneState.confirmedZone !== null;

  const loadForestTypeMapAnalysis = useCallback(async () => {
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

      const data = (await response.json()) as NaturalEnvironmentForestTypeMapApiResponse;

      setState({
        status: "success",
        data: {
          ...data,
          map_features: normalizeSiteAnalysisMapFeatureCollection(data.map_features)
        },
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
    loadForestTypeMapAnalysis
  };
}

export function useSiteAnalysisNaturalEnvironmentForestType() {
  return useNaturalEnvironmentForestTypeMapAnalysis(
    "/analysis/location-analysis/natural-environment/forest-type-map/forest-type",
    "식생(임상별)"
  );
}

export function useSiteAnalysisNaturalEnvironmentForestAgeClass() {
  return useNaturalEnvironmentForestTypeMapAnalysis(
    "/analysis/location-analysis/natural-environment/forest-type-map/age-class",
    "식생(영급별)"
  );
}

export function useSiteAnalysisNaturalEnvironmentForestSpecies() {
  return useNaturalEnvironmentForestTypeMapAnalysis(
    "/analysis/location-analysis/natural-environment/forest-type-map/species",
    "식생(수종별)"
  );
}

export function useSiteAnalysisNaturalEnvironmentForestDiameterClass() {
  return useNaturalEnvironmentForestTypeMapAnalysis(
    "/analysis/location-analysis/natural-environment/forest-type-map/diameter-class",
    "식생(경급별)"
  );
}
