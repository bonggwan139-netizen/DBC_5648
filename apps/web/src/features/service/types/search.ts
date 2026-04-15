export type SearchStatus = "idle" | "loading" | "success" | "error";

export type MockSearchItem = {
  id: string;
  targetName: string;
  lotAddress: string;
  roadAddress: string;
  summary: string;
  note: string;
  longitude: number;
  latitude: number;
};

export type MockSearchResponse = {
  query: string;
  items: MockSearchItem[];
};
