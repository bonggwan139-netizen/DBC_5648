export type MapSearchAddressType = "road" | "parcel";

export type MapSearchResult = {
  id: string;
  query: string;
  label: string;
  addressType: MapSearchAddressType;
  center: [number, number];
  zoom: number;
};

export type MapSearchNavigationRequest = {
  id: string;
  center: [number, number];
  zoom: number;
};

export type MapSearchFeedbackTone = "neutral" | "success" | "error";

export type MapSearchState = {
  isSearching: boolean;
  feedback: string | null;
  feedbackTone: MapSearchFeedbackTone;
  lastResult: MapSearchResult | null;
  pendingNavigation: MapSearchNavigationRequest | null;
};
