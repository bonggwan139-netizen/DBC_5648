"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { MapSearchResult, MapSearchState } from "./mapSearchTypes";

type MapSearchResponse = {
  result?: {
    label?: string;
    addressType?: "road" | "parcel";
    point?: {
      lng?: number;
      lat?: number;
    };
    zoom?: number;
  };
  message?: string;
};

type MapSearchContextValue = {
  state: MapSearchState;
  submitSearch: (query: string) => Promise<void>;
  consumePendingNavigation: (navigationId: string) => void;
};

const initialState: MapSearchState = {
  isSearching: false,
  feedback: null,
  feedbackTone: "neutral",
  lastResult: null,
  pendingNavigation: null
};

const MapSearchContext = createContext<MapSearchContextValue | null>(null);

export function MapSearchProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MapSearchState>(initialState);
  const activeRequestIdRef = useRef(0);
  const activeQueryRef = useRef<string | null>(null);
  const pendingControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      pendingControllerRef.current?.abort();
    };
  }, []);

  const submitSearch = useCallback(async (rawQuery: string) => {
    const query = rawQuery.trim();

    if (!query) {
      setState((current) => ({
        ...current,
        isSearching: false,
        feedback: "검색어를 입력해 주세요.",
        feedbackTone: "error"
      }));
      return;
    }

    if (activeQueryRef.current === query && pendingControllerRef.current) {
      return;
    }

    pendingControllerRef.current?.abort();
    const controller = new AbortController();
    pendingControllerRef.current = controller;
    activeQueryRef.current = query;
    const requestId = activeRequestIdRef.current + 1;
    activeRequestIdRef.current = requestId;

    setState((current) => ({
      ...current,
      isSearching: true,
      feedback: null,
      feedbackTone: "neutral"
    }));

    try {
      const params = new URLSearchParams({ query });
      const response = await fetch(`/api/vworld/search?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
        signal: controller.signal
      });

      const payload = (await response.json().catch(() => null)) as MapSearchResponse | null;
      if (controller.signal.aborted || activeRequestIdRef.current !== requestId) {
        return;
      }

      if (!response.ok) {
        setState((current) => ({
          ...current,
          isSearching: false,
          feedback: payload?.message ?? "검색 결과를 불러오지 못했습니다.",
          feedbackTone: "error"
        }));
        return;
      }

      const lng = payload?.result?.point?.lng;
      const lat = payload?.result?.point?.lat;
      if (typeof lng !== "number" || typeof lat !== "number") {
        setState((current) => ({
          ...current,
          isSearching: false,
          feedback: "검색 결과 좌표를 확인할 수 없습니다.",
          feedbackTone: "error"
        }));
        return;
      }

      const result: MapSearchResult = {
        id: `search-${requestId}-${Date.now()}`,
        query,
        label: payload?.result?.label?.trim() || query,
        addressType: payload?.result?.addressType === "parcel" ? "parcel" : "road",
        center: [lng, lat],
        zoom: typeof payload?.result?.zoom === "number" ? payload.result.zoom : 18,
      };

      setState((current) => ({
        ...current,
        isSearching: false,
        lastResult: result,
        pendingNavigation: {
          id: result.id,
          center: result.center,
          zoom: result.zoom
        },
        feedback: `${result.addressType === "road" ? "도로명주소" : "지번주소"} 검색 결과로 이동했습니다.`,
        feedbackTone: "success"
      }));
    } catch (error) {
      if (controller.signal.aborted || activeRequestIdRef.current !== requestId) {
        return;
      }

      setState((current) => ({
        ...current,
        isSearching: false,
        feedback: error instanceof Error ? error.message : "검색 중 오류가 발생했습니다.",
        feedbackTone: "error"
      }));
    } finally {
      if (activeRequestIdRef.current === requestId && pendingControllerRef.current === controller) {
        pendingControllerRef.current = null;
      }
    }
  }, []);

  const consumePendingNavigation = useCallback((navigationId: string) => {
    setState((current) => {
      if (current.pendingNavigation?.id !== navigationId) {
        return current;
      }

      return {
        ...current,
        pendingNavigation: null
      };
    });
  }, []);

  const value = useMemo<MapSearchContextValue>(
    () => ({
      state,
      submitSearch,
      consumePendingNavigation
    }),
    [consumePendingNavigation, state, submitSearch]
  );

  return <MapSearchContext.Provider value={value}>{children}</MapSearchContext.Provider>;
}

export function useMapSearch() {
  const context = useContext(MapSearchContext);
  if (!context) {
    throw new Error("useMapSearch must be used within a MapSearchProvider");
  }

  return context;
}
