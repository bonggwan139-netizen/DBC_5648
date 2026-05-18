import type { MapSearchAddressType, MapSearchNavigationRequest } from "@/components/service/map/search/mapSearchTypes";

export type ZoneSelectionSearchCandidate = {
  id: string;
  label: string;
  addressType: MapSearchAddressType;
  center: [number, number];
  zoom: number;
};

export type ZoneSelectionSearchPendingSelection = {
  id: string;
  candidate: ZoneSelectionSearchCandidate;
  requestedAt: number;
};

export type ZoneSelectionSearchState = {
  isPanelOpen: boolean;
  pendingNavigation: MapSearchNavigationRequest | null;
  pendingSelection: ZoneSelectionSearchPendingSelection | null;
  selectionFeedback: {
    tone: "neutral" | "error";
    message: string;
  } | null;
};
