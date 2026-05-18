import { NextRequest, NextResponse } from "next/server";
import { getMapServerEnv } from "@/components/service/map/config/serverEnv";
import type { MapSearchAddressType } from "@/components/service/map/search/mapSearchTypes";

export const runtime = "edge";
export const preferredRegion = "icn1";

const VWORLD_SEARCH_URL = "https://api.vworld.kr/req/search";
const SEARCH_ZOOM_LEVEL = 18;
const MAX_CANDIDATES = 10;

type VworldSearchCategory = "road" | "parcel";

type VworldSearchItem = {
  id?: string | number;
  title?: string;
  address?: {
    road?: string;
    parcel?: string;
  };
  point?: {
    x?: string | number;
    y?: string | number;
  };
};

type VworldSearchPayload = {
  response?: {
    status?: string;
    result?: {
      items?: VworldSearchItem[] | VworldSearchItem;
    };
    error?: {
      text?: string;
    };
  };
};

type CandidateSearchResult = {
  id: string;
  label: string;
  addressType: MapSearchAddressType;
  point: {
    lng: number;
    lat: number;
  };
  zoom: number;
};

function parseCoordinate(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function normalizeItems(items: VworldSearchItem[] | VworldSearchItem | undefined) {
  if (!items) {
    return [];
  }

  return Array.isArray(items) ? items : [items];
}

function buildCandidateLabel(item: VworldSearchItem, category: VworldSearchCategory) {
  const categoryAddress = category === "road" ? item.address?.road : item.address?.parcel;
  const fallbackAddress = category === "road" ? item.address?.parcel : item.address?.road;
  return stripHtml(categoryAddress || fallbackAddress || item.title || "");
}

async function requestCandidates(query: string, category: VworldSearchCategory, limit: number) {
  const mapServerEnv = getMapServerEnv();
  const params = new URLSearchParams({
    service: "search",
    request: "search",
    version: "2.0",
    crs: "EPSG:4326",
    format: "json",
    errorFormat: "json",
    type: "address",
    category,
    query,
    size: String(limit),
    page: "1",
    key: mapServerEnv.vworldApiKey,
    domain: mapServerEnv.vworldDomain
  });

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(`${VWORLD_SEARCH_URL}?${params.toString()}`, {
      method: "GET",
      cache: "no-store"
    });
  } catch {
    return {
      ok: false as const,
      status: 502,
      message: "브이월드 검색 응답을 불러올 수 없습니다."
    };
  }

  const payload = (await upstreamResponse.json().catch(() => null)) as VworldSearchPayload | null;
  if (!upstreamResponse.ok) {
    return {
      ok: false as const,
      status: upstreamResponse.status || 502,
      message: payload?.response?.error?.text ?? "브이월드 검색 요청에 실패했습니다."
    };
  }

  const status = payload?.response?.status?.toUpperCase();
  if (status === "NOT_FOUND") {
    return {
      ok: true as const,
      results: []
    };
  }

  if (status !== "OK") {
    return {
      ok: false as const,
      status: 502,
      message: payload?.response?.error?.text ?? "브이월드 검색 결과를 처리하지 못했습니다."
    };
  }

  const results = normalizeItems(payload?.response?.result?.items)
    .map((item, index): CandidateSearchResult | null => {
      const lng = parseCoordinate(item.point?.x);
      const lat = parseCoordinate(item.point?.y);
      const label = buildCandidateLabel(item, category);
      if (lng === null || lat === null || !label) {
        return null;
      }

      return {
        id: `${category}-${item.id ?? index}-${lng}-${lat}`,
        label,
        addressType: category,
        point: {
          lng,
          lat
        },
        zoom: SEARCH_ZOOM_LEVEL
      };
    })
    .filter((result): result is CandidateSearchResult => result !== null);

  return {
    ok: true as const,
    results
  };
}

function parseLimit(value: string | null) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    return MAX_CANDIDATES;
  }

  return Math.min(Math.max(parsed, 1), MAX_CANDIDATES);
}

function dedupeCandidates(results: CandidateSearchResult[]) {
  const seen = new Set<string>();
  return results.filter((result) => {
    const key = `${result.addressType}:${result.label}:${result.point.lng.toFixed(7)}:${result.point.lat.toFixed(7)}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query")?.trim() ?? "";
  if (query.length < 2) {
    return NextResponse.json(
      {
        error: "INVALID_QUERY",
        errorCode: "INVALID_QUERY",
        message: "검색어를 두 글자 이상 입력해 주세요."
      },
      { status: 400 }
    );
  }

  const limit = parseLimit(req.nextUrl.searchParams.get("limit"));
  const [roadResult, parcelResult] = await Promise.all([
    requestCandidates(query, "road", limit),
    requestCandidates(query, "parcel", limit)
  ]);

  if (!roadResult.ok && !parcelResult.ok) {
    const failedResult = roadResult.status <= parcelResult.status ? roadResult : parcelResult;
    return NextResponse.json(
      {
        error: "VWORLD_SEARCH_ERROR",
        errorCode: "VWORLD_SEARCH_ERROR",
        message: failedResult.message
      },
      { status: failedResult.status || 502 }
    );
  }

  const results = dedupeCandidates([
    ...(roadResult.ok ? roadResult.results : []),
    ...(parcelResult.ok ? parcelResult.results : [])
  ])
    .slice(0, limit)
    .map((result) => ({
      id: result.id,
      label: result.label,
      addressType: result.addressType,
      center: [result.point.lng, result.point.lat] as [number, number],
      zoom: result.zoom
    }));

  return NextResponse.json(
    { results },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
