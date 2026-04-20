import { NextRequest, NextResponse } from "next/server";
import {
  VWORLD_DATA_DEFAULT_SIZE,
  VWORLD_DATA_LAYER,
  VWORLD_DATA_MAX_SIZE_LIMIT
} from "@/components/service/map/config/constants";
import { getMapServerEnv } from "@/components/service/map/config/serverEnv";

const VWORLD_DATA_URL = "https://api.vworld.kr/req/data";
const KNOWN_VWORLD_ERROR_CODES = ["INCORRECT_KEY", "INVALID_KEY", "OVER_REQUEST_LIMIT", "SYSTEM_ERROR"] as const;
type KnownVworldErrorCode = (typeof KNOWN_VWORLD_ERROR_CODES)[number];
const UPSTREAM_BODY_SNIPPET_MAX = 320;

type FeatureCollectionLike = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: unknown;
    properties?: Record<string, unknown>;
  }>;
};

function detectKnownErrorCode(rawBody: string): KnownVworldErrorCode | null {
  const upperBody = rawBody.toUpperCase();
  const matched = KNOWN_VWORLD_ERROR_CODES.find((code) => upperBody.includes(code));
  return matched ?? null;
}

function mapErrorCodeToStatus(code: string, fallbackStatus = 502) {
  switch (code.toUpperCase()) {
    case "INCORRECT_KEY":
    case "INVALID_KEY":
      return 403;
    case "OVER_REQUEST_LIMIT":
      return 429;
    case "SYSTEM_ERROR":
      return 502;
    default:
      return fallbackStatus;
  }
}

function getErrorMessageByCode(code: string) {
  switch (code.toUpperCase()) {
    case "INCORRECT_KEY":
      return "브이월드 인증 도메인 정보가 일치하지 않습니다.";
    case "INVALID_KEY":
      return "브이월드 인증키가 유효하지 않습니다.";
    case "OVER_REQUEST_LIMIT":
      return "브이월드 요청 한도를 초과했습니다.";
    case "SYSTEM_ERROR":
      return "브이월드 시스템 오류가 발생했습니다.";
    default:
      return "브이월드 Data API 응답 처리 중 오류가 발생했습니다.";
  }
}

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

function extractFetchErrorCode(error: unknown) {
  if (!error || typeof error !== "object") {
    return null;
  }

  const directCode = (error as { code?: unknown }).code;
  if (typeof directCode === "string" && directCode.length > 0) {
    return directCode;
  }

  const causeCode = (error as { cause?: { code?: unknown } }).cause?.code;
  if (typeof causeCode === "string" && causeCode.length > 0) {
    return causeCode;
  }

  return null;
}

function parseBbox(raw: string | null) {
  if (!raw) {
    return null;
  }

  const values = raw.split(",").map((v) => Number(v.trim()));
  if (values.length !== 4 || values.some((v) => Number.isNaN(v))) {
    return null;
  }

  const [minX, minY, maxX, maxY] = values;
  if (minX >= maxX || minY >= maxY) {
    return null;
  }
  if (minX < -180 || maxX > 180 || minY < -90 || maxY > 90) {
    return null;
  }

  return `BOX(${minX},${minY},${maxX},${maxY})`;
}

function toFeatureCollection(payload: unknown): FeatureCollectionLike {
  if (
    payload &&
    typeof payload === "object" &&
    (payload as { type?: string }).type === "FeatureCollection" &&
    Array.isArray((payload as { features?: unknown[] }).features)
  ) {
    return payload as FeatureCollectionLike;
  }

  const response = payload as {
    response?: {
      result?: {
        featureCollection?: {
          type?: string;
          features?: unknown[];
        };
      };
    };
  };

  const nested = response?.response?.result?.featureCollection;
  if (nested?.type === "FeatureCollection" && Array.isArray(nested.features)) {
    return nested as FeatureCollectionLike;
  }

  return {
    type: "FeatureCollection",
    features: []
  };
}

function extractErrorMessage(payload: unknown) {
  const candidate = payload as {
    response?: {
      status?: string;
      error?: { code?: string; text?: string };
      message?: string;
    };
    error?: { code?: string; message?: string };
    message?: string;
  };

  return {
    code:
      candidate?.response?.error?.code ??
      candidate?.error?.code ??
      candidate?.response?.status ??
      "VWORLD_DATA_API_ERROR",
    message:
      candidate?.response?.error?.text ??
      candidate?.error?.message ??
      candidate?.response?.message ??
      candidate?.message ??
      "브이월드 Data API 응답 처리 중 오류가 발생했습니다."
  };
}

export async function GET(req: NextRequest) {
  const mapServerEnv = getMapServerEnv();
  const geomFilter = parseBbox(req.nextUrl.searchParams.get("bbox"));
  if (!geomFilter) {
    return NextResponse.json(
      { error: "INVALID_BBOX", message: "bbox 파라미터는 minX,minY,maxX,maxY 형식이어야 합니다." },
      { status: 400 }
    );
  }

  const requestedSize = Number(
    req.nextUrl.searchParams.get("size") ?? req.nextUrl.searchParams.get("maxFeatures") ?? String(VWORLD_DATA_DEFAULT_SIZE)
  );
  const size = Number.isFinite(requestedSize)
    ? String(Math.min(VWORLD_DATA_MAX_SIZE_LIMIT, Math.max(1, Math.floor(requestedSize))))
    : String(VWORLD_DATA_DEFAULT_SIZE);

  const params = new URLSearchParams({
    service: "data",
    request: "GetFeature",
    data: VWORLD_DATA_LAYER,
    geomFilter,
    size,
    format: "json",
    crs: "EPSG:4326",
    key: mapServerEnv.vworldApiKey,
    domain: mapServerEnv.vworldDomain
  });

  const safeUpstreamQueryForDebug = buildSafeUpstreamQueryForDebug(params);
  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(`${VWORLD_DATA_URL}?${params.toString()}`, {
      method: "GET",
      cache: "no-store"
    });
  } catch (error) {
    const fetchErrorCode = extractFetchErrorCode(error);
    return NextResponse.json(
      {
        error: "VWORLD_DATA_UPSTREAM_FETCH_FAILED",
        message: "브이월드 Data API 상위 서버 연결에 실패했습니다.",
        errorCode: fetchErrorCode
          ? `FETCH_${fetchErrorCode.toUpperCase()}`
          : "FETCH_CONNECTION_ERROR",
        ...(shouldExposeDebugSnippet()
          ? {
              debug: {
                upstreamPath: "/req/data",
                upstreamQuery: safeUpstreamQueryForDebug
              }
            }
          : {})
      },
      { status: 502 }
    );
  }

  const bodyText = await upstreamResponse.text();
  const contentType = upstreamResponse.headers.get("content-type") ?? "";
  const knownErrorCode = detectKnownErrorCode(bodyText);
  let payload: unknown = null;
  try {
    payload = JSON.parse(bodyText) as unknown;
  } catch {
    if (knownErrorCode) {
      return NextResponse.json(
        {
          error: knownErrorCode,
          errorCode: knownErrorCode,
          message: getErrorMessageByCode(knownErrorCode),
          upstreamStatus: upstreamResponse.status,
          upstreamContentType: contentType,
          ...(shouldExposeDebugSnippet()
            ? {
                debug: {
                  upstreamQuery: safeUpstreamQueryForDebug,
                  upstreamBodySnippet: buildUpstreamBodySnippet(bodyText, mapServerEnv.vworldApiKey)
                }
              }
            : {})
        },
        { status: mapErrorCodeToStatus(knownErrorCode, upstreamResponse.status || 502) }
      );
    }

    if (!upstreamResponse.ok) {
      return NextResponse.json(
        {
          error: "UNKNOWN_UPSTREAM_RESPONSE",
          errorCode: "UNKNOWN_UPSTREAM_RESPONSE",
          message: "브이월드 Data API가 JSON이 아닌 오류 응답을 반환했습니다.",
          upstreamStatus: upstreamResponse.status,
          upstreamContentType: contentType,
          ...(shouldExposeDebugSnippet()
            ? {
                debug: {
                  upstreamQuery: safeUpstreamQueryForDebug,
                  upstreamBodySnippet: buildUpstreamBodySnippet(bodyText, mapServerEnv.vworldApiKey)
                }
              }
            : {})
        },
        { status: upstreamResponse.status }
      );
    }

    return NextResponse.json(
      {
        error: "INVALID_DATA_API_JSON",
        errorCode: "INVALID_DATA_API_JSON",
        message: "브이월드 Data API 응답이 JSON 형식이 아닙니다.",
        upstreamStatus: upstreamResponse.status,
        upstreamContentType: contentType,
        ...(shouldExposeDebugSnippet()
          ? {
              debug: {
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
    const extracted = extractErrorMessage(payload);
    const resolvedCode = detectKnownErrorCode(JSON.stringify(payload)) ?? extracted.code;
    return NextResponse.json(
      {
        error: resolvedCode,
        errorCode: resolvedCode,
        message: getErrorMessageByCode(resolvedCode) || extracted.message,
        upstreamStatus: upstreamResponse.status,
        upstreamContentType: contentType
      },
      { status: mapErrorCodeToStatus(resolvedCode, upstreamResponse.status) }
    );
  }

  const extracted = extractErrorMessage(payload);
  const statusText = String((payload as { response?: { status?: string } })?.response?.status ?? "OK").toUpperCase();
  if (statusText !== "OK" && statusText !== "SUCCESS") {
    const resolvedCode = detectKnownErrorCode(JSON.stringify(payload)) ?? extracted.code;
    return NextResponse.json(
      {
        error: resolvedCode,
        errorCode: resolvedCode,
        message: getErrorMessageByCode(resolvedCode) || extracted.message,
        upstreamStatus: upstreamResponse.status,
        upstreamContentType: contentType
      },
      { status: mapErrorCodeToStatus(resolvedCode, 502) }
    );
  }

  return NextResponse.json(toFeatureCollection(payload), {
    status: 200,
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
