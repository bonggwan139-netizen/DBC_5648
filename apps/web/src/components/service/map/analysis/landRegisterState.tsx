"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { useZoneSelection } from "@/components/service/map/zone-selection/zoneSelectionState";
import type { LandRegisterResponse } from "./landRegisterTypes";

type LandRegisterStatus = "idle" | "loading" | "success" | "error";

type LandRegisterState = {
  isOpen: boolean;
  status: LandRegisterStatus;
  data: LandRegisterResponse | null;
  error: string | null;
};

type LandRegisterContextValue = LandRegisterState & {
  canRequest: boolean;
  openLandRegister: () => Promise<void>;
  closeLandRegister: () => void;
};

const initialState: LandRegisterState = {
  isOpen: false,
  status: "idle",
  data: null,
  error: null
};

const LandRegisterContext = createContext<LandRegisterContextValue | null>(null);

export function LandRegisterProvider({ children }: { children: ReactNode }) {
  const { state: zoneState } = useZoneSelection();
  const [state, setState] = useState<LandRegisterState>(initialState);
  const abortControllerRef = useRef<AbortController | null>(null);

  const canRequest = zoneState.status === "confirmed" && zoneState.confirmedZone !== null;

  const closeLandRegister = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setState((prev) => ({
      ...prev,
      isOpen: false,
      status: prev.status === "loading" ? "idle" : prev.status
    }));
  }, []);

  const openLandRegister = useCallback(async () => {
    if (zoneState.status !== "confirmed" || !zoneState.confirmedZone) {
      setState({
        isOpen: true,
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
      isOpen: true,
      status: "loading",
      data: null,
      error: null
    });

    try {
      const response = await fetch("/analysis/land-register", {
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
        throw new Error(message || `토지조서 요청에 실패했습니다. (${response.status})`);
      }

      const data = (await response.json()) as LandRegisterResponse;
      setState({
        isOpen: true,
        status: "success",
        data,
        error: null
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setState({
        isOpen: true,
        status: "error",
        data: null,
        error: error instanceof Error ? error.message : "토지조서 요청 중 오류가 발생했습니다."
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

  const value = useMemo<LandRegisterContextValue>(
    () => ({
      ...state,
      canRequest,
      openLandRegister,
      closeLandRegister
    }),
    [canRequest, closeLandRegister, openLandRegister, state]
  );

  return <LandRegisterContext.Provider value={value}>{children}</LandRegisterContext.Provider>;
}

export function useLandRegister() {
  const context = useContext(LandRegisterContext);

  if (!context) {
    throw new Error("useLandRegister must be used within a LandRegisterProvider.");
  }

  return context;
}
