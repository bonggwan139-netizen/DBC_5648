"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useZoneSelection } from "@/components/service/map/zone-selection/zoneSelectionState";

export type SiteAnalysisTopSection = "basic" | "locationAnalysis";
export type SiteAnalysisSection = SiteAnalysisTopSection;
export type SiteAnalysisDetailItem =
  | "basicLocationInfo"
  | "basicLandCategory"
  | "basicOwnership"
  | "basicAreaSummary"
  | "basicOfficialPrice"
  | "basicTerrainShape"
  | "basicRoadSide";

type SiteAnalysisContextValue = {
  activeSection: SiteAnalysisTopSection | null;
  activeDetailItem: SiteAnalysisDetailItem | null;
  canOpen: boolean;
  openSection: (section: SiteAnalysisTopSection) => void;
  closeSection: () => void;
  openDetailItem: (item: SiteAnalysisDetailItem) => void;
};

const SiteAnalysisContext = createContext<SiteAnalysisContextValue | null>(null);

export function SiteAnalysisProvider({ children }: { children: ReactNode }) {
  const { state: zoneState } = useZoneSelection();
  const [activeSection, setActiveSection] = useState<SiteAnalysisTopSection | null>(null);
  const [activeDetailItem, setActiveDetailItem] = useState<SiteAnalysisDetailItem | null>(null);

  const canOpen = zoneState.status === "confirmed" && zoneState.confirmedZone !== null;

  const openSection = useCallback(
    (section: SiteAnalysisTopSection) => {
      if (!canOpen) {
        return;
      }

      setActiveSection(section);
    },
    [canOpen]
  );

  const closeSection = useCallback(() => {
    setActiveSection(null);
  }, []);

  const openDetailItem = useCallback(
    (item: SiteAnalysisDetailItem) => {
      if (!canOpen) {
        return;
      }

      setActiveSection("basic");
      setActiveDetailItem(item);
    },
    [canOpen]
  );

  useEffect(() => {
    if (canOpen) {
      return;
    }

    setActiveSection(null);
    setActiveDetailItem(null);
  }, [canOpen]);

  const value = useMemo<SiteAnalysisContextValue>(
    () => ({
      activeSection,
      activeDetailItem,
      canOpen,
      openSection,
      closeSection,
      openDetailItem
    }),
    [activeDetailItem, activeSection, canOpen, closeSection, openDetailItem, openSection]
  );

  return <SiteAnalysisContext.Provider value={value}>{children}</SiteAnalysisContext.Provider>;
}

export function useSiteAnalysis() {
  const context = useContext(SiteAnalysisContext);

  if (!context) {
    throw new Error("useSiteAnalysis must be used within a SiteAnalysisProvider.");
  }

  return context;
}
