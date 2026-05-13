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
  | "buildingUse"
  | "buildingStructure"
  | "buildingFloor"
  | "buildingAge"
  | "buildingGrossFloorArea"
  | "buildingCoverageRatio"
  | "buildingFloorAreaRatio"
  | "planningSpecialPurposeArea";
export type PlanningMapLayer = "specialPurposeArea";

type SiteAnalysisContextValue = {
  activeSection: SiteAnalysisTopSection | null;
  activeDetailItem: SiteAnalysisDetailItem | null;
  canOpen: boolean;
  activePlanningMapLayer: PlanningMapLayer | null;
  openSection: (section: SiteAnalysisTopSection) => void;
  closeSection: () => void;
  openDetailItem: (item: SiteAnalysisDetailItem, section?: SiteAnalysisTopSection) => void;
  activeThematicMapFeatures: SiteAnalysisMapFeatureCollection | null;
  setActiveThematicMapFeatures: (features: SiteAnalysisMapFeatureCollection | null) => void;
  setActivePlanningMapLayer: (layer: PlanningMapLayer | null) => void;
};

const SiteAnalysisContext = createContext<SiteAnalysisContextValue | null>(null);

export function SiteAnalysisProvider({ children }: { children: ReactNode }) {
  const { state: zoneState } = useZoneSelection();
  const [activeSection, setActiveSection] = useState<SiteAnalysisTopSection | null>(null);
  const [activeDetailItem, setActiveDetailItem] = useState<SiteAnalysisDetailItem | null>(null);
  const [activeThematicMapFeatures, setActiveThematicMapFeatures] = useState<SiteAnalysisMapFeatureCollection | null>(null);
  const [activePlanningMapLayer, setActivePlanningMapLayer] = useState<PlanningMapLayer | null>(null);

  const canOpen = zoneState.status === "confirmed" && zoneState.confirmedZone !== null;

  const openSection = useCallback(
    (section: SiteAnalysisTopSection) => {
      if (!canOpen) {
        return;
      }

      setActiveSection(section);
      if (section !== "locationAnalysis") {
        setActivePlanningMapLayer(null);
      }
    },
    [canOpen]
  );

  const closeSection = useCallback(() => {
    setActiveSection(null);
  }, []);

  const openDetailItem = useCallback(
    (item: SiteAnalysisDetailItem, section: SiteAnalysisTopSection = "basic") => {
      if (!canOpen) {
        return;
      }

      setActiveSection(section);
      setActiveDetailItem(item);
      if (item !== "planningSpecialPurposeArea") {
        setActivePlanningMapLayer(null);
      }
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
    setActivePlanningMapLayer(null);
  }, [canOpen]);

  const value = useMemo<SiteAnalysisContextValue>(
    () => ({
      activeSection,
      activeDetailItem,
      activePlanningMapLayer,
      canOpen,
      openSection,
      closeSection,
      openDetailItem,
      activeThematicMapFeatures,
      setActiveThematicMapFeatures,
      setActivePlanningMapLayer
    }),
    [
      activeDetailItem,
      activePlanningMapLayer,
      activeSection,
      activeThematicMapFeatures,
      canOpen,
      closeSection,
      openDetailItem,
      openSection
    ]
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
