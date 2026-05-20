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
  | "naturalEnvironmentElevation"
  | "naturalEnvironmentEcologyNatureMap"
  | "naturalEnvironmentSlope"
  | "planningSpecialPurposeArea";
export type PlanningMapLayer = "specialPurposeArea";

export type NaturalEnvironmentMapOverlay = {
  kind: "elevation" | "slope";
  raster: {
    type: "image";
    data_url: string;
    bbox_5186?: [number, number, number, number];
    bbox_4326?: [number, number, number, number];
    coordinates_4326: [[number, number], [number, number], [number, number], [number, number]];
    srid: number;
    pixel_size_m?: number;
  };
  contours: {
    type: "FeatureCollection";
    features: Array<{
      type: "Feature";
      geometry: unknown;
      properties?: Record<string, unknown>;
    }>;
  };
} | null;

type SiteAnalysisContextValue = {
  activeSection: SiteAnalysisTopSection | null;
  activeDetailItem: SiteAnalysisDetailItem | null;
  canOpen: boolean;
  activeNaturalEnvironmentMapOverlay: NaturalEnvironmentMapOverlay;
  activePlanningMapLayer: PlanningMapLayer | null;
  openSection: (section: SiteAnalysisTopSection) => void;
  closeSection: () => void;
  openDetailItem: (item: SiteAnalysisDetailItem, section?: SiteAnalysisTopSection) => void;
  activeThematicMapFeatures: SiteAnalysisMapFeatureCollection | null;
  setActiveNaturalEnvironmentMapOverlay: (overlay: NaturalEnvironmentMapOverlay) => void;
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
  const [activeNaturalEnvironmentMapOverlay, setActiveNaturalEnvironmentMapOverlay] =
    useState<NaturalEnvironmentMapOverlay>(null);

  const canOpen = zoneState.status === "confirmed" && zoneState.confirmedZone !== null;

  const openSection = useCallback(
    (section: SiteAnalysisTopSection) => {
      if (!canOpen) {
        return;
      }

      setActiveSection(section);
      if (section !== "locationAnalysis") {
        setActivePlanningMapLayer(null);
        setActiveNaturalEnvironmentMapOverlay(null);
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
      if (item !== "naturalEnvironmentElevation" && item !== "naturalEnvironmentSlope") {
        setActiveNaturalEnvironmentMapOverlay(null);
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
    setActiveNaturalEnvironmentMapOverlay(null);
  }, [canOpen]);

  const value = useMemo<SiteAnalysisContextValue>(
    () => ({
      activeSection,
      activeDetailItem,
      activeNaturalEnvironmentMapOverlay,
      activePlanningMapLayer,
      canOpen,
      openSection,
      closeSection,
      openDetailItem,
      activeThematicMapFeatures,
      setActiveNaturalEnvironmentMapOverlay,
      setActiveThematicMapFeatures,
      setActivePlanningMapLayer
    }),
    [
      activeDetailItem,
      activeNaturalEnvironmentMapOverlay,
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
