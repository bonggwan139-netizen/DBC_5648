"use client";

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";
import type { ZoneSelectionSearchCandidate, ZoneSelectionSearchState } from "./zoneSelectionSearchTypes";

type ZoneSelectionSearchContextValue = {
  state: ZoneSelectionSearchState;
  openPanel: () => void;
  closePanel: () => void;
  requestCandidateSelection: (candidate: ZoneSelectionSearchCandidate) => void;
  consumePendingNavigation: (navigationId: string) => void;
  completeCandidateSelection: (selectionId: string) => void;
  failCandidateSelection: (selectionId: string, message: string) => void;
};

const initialState: ZoneSelectionSearchState = {
  isPanelOpen: false,
  pendingNavigation: null,
  pendingSelection: null,
  selectionFeedback: null
};

const ZoneSelectionSearchContext = createContext<ZoneSelectionSearchContextValue | null>(null);

export function ZoneSelectionSearchProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ZoneSelectionSearchState>(initialState);

  const openPanel = useCallback(() => {
    setState((current) => ({
      ...current,
      isPanelOpen: true,
      selectionFeedback: null
    }));
  }, []);

  const closePanel = useCallback(() => {
    setState((current) => ({
      ...current,
      isPanelOpen: false,
      pendingNavigation: null,
      pendingSelection: null,
      selectionFeedback: null
    }));
  }, []);

  const requestCandidateSelection = useCallback((candidate: ZoneSelectionSearchCandidate) => {
    setState((current) => {
      if (current.pendingSelection?.candidate.id === candidate.id) {
        return current;
      }

      const selectionId = `zone-search-${candidate.id}-${Date.now()}`;
      return {
        ...current,
        isPanelOpen: true,
        pendingSelection: {
          id: selectionId,
          candidate,
          requestedAt: Date.now()
        },
        selectionFeedback: {
          tone: "neutral",
          message: "필지를 확인하는 중입니다."
        },
        pendingNavigation: {
          id: selectionId,
          center: candidate.center,
          zoom: candidate.zoom
        }
      };
    });
  }, []);

  const completeCandidateSelection = useCallback((selectionId: string) => {
    setState((current) => {
      if (current.pendingSelection?.id !== selectionId) {
        return current;
      }

      return {
        ...current,
        isPanelOpen: false,
        pendingNavigation:
          current.pendingNavigation?.id === selectionId ? null : current.pendingNavigation,
        pendingSelection: null,
        selectionFeedback: null
      };
    });
  }, []);

  const failCandidateSelection = useCallback((selectionId: string, message: string) => {
    setState((current) => {
      if (current.pendingSelection?.id !== selectionId) {
        return current;
      }

      return {
        ...current,
        pendingNavigation:
          current.pendingNavigation?.id === selectionId ? null : current.pendingNavigation,
        pendingSelection: null,
        selectionFeedback: {
          tone: "error",
          message
        }
      };
    });
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

  const value = useMemo<ZoneSelectionSearchContextValue>(
    () => ({
      state,
      openPanel,
      closePanel,
      requestCandidateSelection,
      consumePendingNavigation,
      completeCandidateSelection,
      failCandidateSelection
    }),
    [
      closePanel,
      completeCandidateSelection,
      consumePendingNavigation,
      failCandidateSelection,
      openPanel,
      requestCandidateSelection,
      state
    ]
  );

  return <ZoneSelectionSearchContext.Provider value={value}>{children}</ZoneSelectionSearchContext.Provider>;
}

export function useZoneSelectionSearch() {
  const context = useContext(ZoneSelectionSearchContext);
  if (!context) {
    throw new Error("useZoneSelectionSearch must be used within a ZoneSelectionSearchProvider");
  }

  return context;
}
