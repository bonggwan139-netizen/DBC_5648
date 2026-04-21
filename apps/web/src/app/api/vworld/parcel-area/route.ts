import { NextRequest, NextResponse } from "next/server";
import { getMapServerEnv } from "@/components/service/map/config/serverEnv";

export const runtime = "edge";
export const preferredRegion = "icn1";

const VWORLD_PARCEL_AREA_URL = "https://api.vworld.kr/ned/data/ladfrlList";
const UPSTREAM_BODY_SNIPPET_MAX = 320;

function shouldExposeDebugSnippet() {
  return process.env.NODE_ENV !== "production";
}

function buildUpstreamBodySnippet(bodyText: string, apiKey: string) {
  const compact = bodyText.replace(/\s+/g, " ").trim();
  const redacted = compact.split(apiKey).join("[REDACTED_KEY]");
  return redacted.slice(0, UPSTREAM_BODY_SNIPPET_MAX);
}

function buildSafeUpstreamQueryForDebug(params: URLSearchParams) {
  const sanitized = new URLSearchParams(params);
  const key = sanitized.get("key");
  if (key) {
    sanitized.set("key", `[REDACTED:${Math.min(key.length, 8)}]`);
  }
  return sanitized.toString();
}

function parseAreaValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.replace(/,/g, "").trim();
    if (!normalized) {
      return null;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function findLandParcelArea(value: unknown): number | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const area = findLandParcelArea(item);
      if (area !== null) {
        return area;
      }
    }
    return null;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const directArea = parseAreaValue(record.lndpclAr);
  if (directArea !== null) {
    return directArea;
  }

  for (const nestedValue of Object.values(record)) {
    const area = findLandParcelArea(nestedValue);
    if (area !== null) {
      return area;
    }
  }

  return null;
}

export async function GET(req: NextRequest) {
  const pnu = req.nextUrl.searchParams.get("pnu")?.trim() ?? "";
  if (!pnu) {
    return NextResponse.json(
      {
        error: "INVALID_PNU",
        errorCode: "INVALID_PNU",
        message: "pnu 파라미터가 필요합니다."
      },
      { status: 400 }
    );
  }

  const mapServerEnv = getMapServerEnv();
  const params = new URLSearchParams({
    pnu,
    format: "json",
    key: mapServerEnv.vworldApiKey,
    domain: mapServerEnv.vworldDomain
  });
  const safeUpstreamQueryForDebug = buildSafeUpstreamQueryForDebug(params);

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(`${VWORLD_PARCEL_AREA_URL}?${params.toString()}`, {
      method: "GET",
      cache: "no-store"
    });
  } catch {
    return NextResponse.json(
      {
        error: "VWORLD_PARCEL_AREA_UPSTREAM_FETCH_FAILED",
        errorCode: "VWORLD_PARCEL_AREA_UPSTREAM_FETCH_FAILED",
        message: "브이월드 필지 면적 정보를 불러오지 못했습니다.",
        ...(shouldExposeDebugSnippet()
          ? {
              debug: {
                upstreamPath: "/ned/data/ladfrlList",
                upstreamQuery: safeUpstreamQueryForDebug
              }
            }
          : {})
      },
      { status: 502 }
    );
  }

  const bodyText = await upstreamResponse.text();
  let payload: unknown = null;

  try {
    payload = JSON.parse(bodyText) as unknown;
  } catch {
    return NextResponse.json(
      {
        error: "INVALID_PARCEL_AREA_API_JSON",
        errorCode: "INVALID_PARCEL_AREA_API_JSON",
        message: "브이월드 필지 면적 응답이 JSON 형식이 아닙니다.",
        ...(shouldExposeDebugSnippet()
          ? {
              debug: {
                upstreamPath: "/ned/data/ladfrlList",
                upstreamQuery: safeUpstreamQueryForDebug,
                upstreamBodySnippet: buildUpstreamBodySnippet(bodyText, mapServerEnv.vworldApiKey)
              }
            }
          : {})
      },
      { status: 502 }
    );
  }

  if (!upstreamResponse.ok) {
    return NextResponse.json(
      {
        error: "VWORLD_PARCEL_AREA_API_ERROR",
        errorCode: "VWORLD_PARCEL_AREA_API_ERROR",
        message: "브이월드 필지 면적 정보를 불러오지 못했습니다.",
        ...(shouldExposeDebugSnippet()
          ? {
              debug: {
                upstreamPath: "/ned/data/ladfrlList",
                upstreamQuery: safeUpstreamQueryForDebug,
                upstreamBodySnippet: buildUpstreamBodySnippet(bodyText, mapServerEnv.vworldApiKey)
              }
            }
          : {})
      },
      { status: upstreamResponse.status || 502 }
    );
  }

  return NextResponse.json(
    { area: findLandParcelArea(payload) },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
