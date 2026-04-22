import { NextRequest, NextResponse } from "next/server";
import { getMapServerEnv } from "@/components/service/map/config/serverEnv";

export const runtime = "edge";
export const preferredRegion = "icn1";

const VWORLD_ADDRESS_URL = "https://api.vworld.kr/req/address";
const UPSTREAM_BODY_SNIPPET_MAX = 320;
const SEARCH_ZOOM_LEVEL = 18;

type VworldSearchType = "ROAD" | "PARCEL";

type VworldAddressPayload = {
  response?: {
    status?: string;
    result?: {
      point?: {
        x?: string | number;
        y?: string | number;
      };
    };
    refined?: {
      text?: string;
    };
    error?: {
      code?: string;
      text?: string;
    };
  };
};

function shouldExposeDebugSnippet() {
  return process.env.NODE_ENV !== "production";
}

function buildSafeUpstreamQueryForDebug(params: URLSearchParams) {
  const sanitized = new URLSearchParams(params);
  const key = sanitized.get("key");
  if (key) {
    sanitized.set("key", `[REDACTED:${Math.min(key.length, 8)}]`);
  }
  return sanitized.toString();
}

function buildUpstreamBodySnippet(bodyText: string, apiKey: string) {
  const compact = bodyText.replace(/\s+/g, " ").trim();
  const redacted = compact.split(apiKey).join("[REDACTED_KEY]");
  return redacted.slice(0, UPSTREAM_BODY_SNIPPET_MAX);
}

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

function getSearchOrder(query: string): VworldSearchType[] {
  const normalized = query.replace(/\s+/g, " ").trim();
  const looksLikeRoadAddress = /(로|길)\s*\d/.test(normalized) || /(대로|로|길)\b/.test(normalized);
  const looksLikeParcelAddress = /(동|읍|면|리)\s*\d+(-\d+)?/.test(normalized);

  if (looksLikeParcelAddress && !looksLikeRoadAddress) {
    return ["PARCEL", "ROAD"];
  }

  return ["ROAD", "PARCEL"];
}

async function requestAddressSearch(query: string, type: VworldSearchType) {
  const mapServerEnv = getMapServerEnv();
  const params = new URLSearchParams({
    service: "address",
    request: "getCoord",
    version: "2.0",
    crs: "EPSG:4326",
    format: "json",
    errorFormat: "json",
    refine: "true",
    simple: "false",
    type,
    address: query,
    key: mapServerEnv.vworldApiKey,
    domain: mapServerEnv.vworldDomain
  });

  const safeUpstreamQueryForDebug = buildSafeUpstreamQueryForDebug(params);
  let upstreamResponse: Response;

  try {
    upstreamResponse = await fetch(`${VWORLD_ADDRESS_URL}?${params.toString()}`, {
      method: "GET",
      cache: "no-store"
    });
  } catch {
    return {
      ok: false as const,
      status: 502,
      message: "브이월드 검색 응답을 불러오지 못했습니다.",
      debug: shouldExposeDebugSnippet()
        ? {
            upstreamPath: "/req/address",
            upstreamQuery: safeUpstreamQueryForDebug
          }
        : undefined
    };
  }

  const bodyText = await upstreamResponse.text();
  let payload: VworldAddressPayload | null = null;

  try {
    payload = JSON.parse(bodyText) as VworldAddressPayload;
  } catch {
    return {
      ok: false as const,
      status: 502,
      message: "브이월드 검색 응답 형식을 해석하지 못했습니다.",
      debug: shouldExposeDebugSnippet()
        ? {
            upstreamPath: "/req/address",
            upstreamQuery: safeUpstreamQueryForDebug,
            upstreamBodySnippet: buildUpstreamBodySnippet(bodyText, mapServerEnv.vworldApiKey)
          }
        : undefined
    };
  }

  if (!upstreamResponse.ok) {
    return {
      ok: false as const,
      status: upstreamResponse.status || 502,
      message: payload?.response?.error?.text ?? "브이월드 검색 요청에 실패했습니다.",
      debug: shouldExposeDebugSnippet()
        ? {
            upstreamPath: "/req/address",
            upstreamQuery: safeUpstreamQueryForDebug,
            upstreamBodySnippet: buildUpstreamBodySnippet(bodyText, mapServerEnv.vworldApiKey)
          }
        : undefined
    };
  }

  const status = payload?.response?.status?.toUpperCase();
  if (status === "NOT_FOUND") {
    return {
      ok: false as const,
      status: 404,
      message: "검색 결과가 없습니다."
    };
  }

  if (status !== "OK") {
    return {
      ok: false as const,
      status: 502,
      message: payload?.response?.error?.text ?? "브이월드 검색 결과를 처리하지 못했습니다.",
      debug: shouldExposeDebugSnippet()
        ? {
            upstreamPath: "/req/address",
            upstreamQuery: safeUpstreamQueryForDebug,
            upstreamBodySnippet: buildUpstreamBodySnippet(bodyText, mapServerEnv.vworldApiKey)
          }
        : undefined
    };
  }

  const lng = parseCoordinate(payload?.response?.result?.point?.x);
  const lat = parseCoordinate(payload?.response?.result?.point?.y);
  if (lng === null || lat === null) {
    return {
      ok: false as const,
      status: 502,
      message: "검색 결과 좌표가 올바르지 않습니다."
    };
  }

  return {
    ok: true as const,
    result: {
      label: payload?.response?.refined?.text?.trim() || query,
      addressType: type === "ROAD" ? "road" : "parcel",
      point: {
        lng,
        lat
      },
      zoom: SEARCH_ZOOM_LEVEL
    }
  };
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query")?.trim() ?? "";
  if (!query) {
    return NextResponse.json(
      {
        error: "INVALID_QUERY",
        errorCode: "INVALID_QUERY",
        message: "검색어를 입력해 주세요."
      },
      { status: 400 }
    );
  }

  const [primaryType, secondaryType] = getSearchOrder(query);
  const primaryResult = await requestAddressSearch(query, primaryType);
  if (primaryResult.ok) {
    return NextResponse.json(
      { result: primaryResult.result },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  }

  const secondaryResult = await requestAddressSearch(query, secondaryType);
  if (secondaryResult.ok) {
    return NextResponse.json(
      { result: secondaryResult.result },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  }

  if (primaryResult.status === 404 && secondaryResult.status === 404) {
    return NextResponse.json(
      {
        error: "NOT_FOUND",
        errorCode: "NOT_FOUND",
        message: "검색 결과가 없습니다."
      },
      { status: 404 }
    );
  }

  const failedResult = primaryResult.status !== 404 ? primaryResult : secondaryResult;
  return NextResponse.json(
    {
      error: "VWORLD_SEARCH_ERROR",
      errorCode: "VWORLD_SEARCH_ERROR",
      message: failedResult.message,
      ...(failedResult.debug ? { debug: failedResult.debug } : {})
    },
    { status: failedResult.status || 502 }
  );
}
