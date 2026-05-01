"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useZoneSelection } from "@/components/service/map/zone-selection/zoneSelectionState";
import type { SiteAnalysisMapFeatureCollection } from "./siteAnalysisMapFeatures";

export type SiteAnalysisTopSection = "basic" | "locationAnalysis";
export type SiteAnalysisSection = SiteAnalysisTopSection;
export type SiteAnalysisDetailItem =
  | "basicLocationInfo"
  | "basicLandCategory"
  | "basicOwnership"
  | "basicAreaSummary"
  | "basicOfficialPrice"
  | "basicTerrainShape"
  | "basicRoadSide"
  | "buildingUse";

type SiteAnalysisContextValue = {
  activeSection: SiteAnalysisTopSection | null;
  activeDetailItem: SiteAnalysisDetailItem | null;
  canOpen: boolean;
  openSection: (section: SiteAnalysisTopSection) => void;
  closeSection: () => void;
  openDetailItem: (item: SiteAnalysisDetailItem) => void;
  activeThematicMapFeatures: SiteAnalysisMapFeatureCollection | null;
  setActiveThematicMapFeatures: (features: SiteAnalysisMapFeatureCollection | null) => void;
};

const SiteAnalysisContext = createContext<SiteAnalysisContextValue | null>(null);

export function SiteAnalysisProvider({ children }: { children: ReactNode }) {
  const { state: zoneState } = useZoneSelection();
  const [activeSection, setActiveSection] = useState<SiteAnalysisTopSection | null>(null);
  const [activeDetailItem, setActiveDetailItem] = useState<SiteAnalysisDetailItem | null>(null);
  const [activeThematicMapFeatures, setActiveThematicMapFeatures] = useState<SiteAnalysisMapFeatureCollection | null>(null);

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
    setActiveThematicMapFeatures(null);
  }, [canOpen]);

  const value = useMemo<SiteAnalysisContextValue>(
    () => ({
      activeSection,
      activeDetailItem,
      canOpen,
      openSection,
      closeSection,
      openDetailItem,
      activeThematicMapFeatures,
      setActiveThematicMapFeatures
    }),
    [activeDetailItem, activeSection, activeThematicMapFeatures, canOpen, closeSection, openDetailItem, openSection]
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
