import type { MockSearchResponse } from "../types/search";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export async function requestMockSearch(query: string): Promise<MockSearchResponse> {
  const response = await fetch(
    `${API_BASE_URL}/mock/search?query=${encodeURIComponent(query)}`,
    { method: "GET", cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error("검색 요청에 실패했습니다.");
  }

  return (await response.json()) as MockSearchResponse;
}
