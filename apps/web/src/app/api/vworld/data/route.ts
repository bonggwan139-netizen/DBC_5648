import { NextRequest, NextResponse } from "next/server";
import {
  VWORLD_DATA_DEFAULT_SIZE,
  VWORLD_DATA_LAYER,
  VWORLD_DATA_MAX_SIZE_LIMIT
} from "@/components/service/map/config/constants";
import { getMapServerEnv } from "@/components/service/map/config/serverEnv";

const VWORLD_DATA_URL = "https://api.vworld.kr/req/data";
type FeatureCollectionLike = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: unknown;
    properties?: Record<string, unknown>;
  }>;
};

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

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(`${VWORLD_DATA_URL}?${params.toString()}`, {
      method: "GET",
      cache: "no-store"
    });
  } catch {
    return NextResponse.json(
      {
        error: "VWORLD_DATA_UPSTREAM_FETCH_FAILED",
        message: "브이월드 Data API 상위 서버 연결에 실패했습니다."
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
        error: "INVALID_DATA_API_JSON",
        message: "브이월드 Data API 응답이 JSON 형식이 아닙니다.",
        upstreamStatus: upstreamResponse.status
      },
      { status: 502 }
    );
  }

  if (!upstreamResponse.ok) {
    const extracted = extractErrorMessage(payload);
    return NextResponse.json(
      {
        error: extracted.code,
        message: extracted.message,
        upstreamStatus: upstreamResponse.status
      },
      { status: upstreamResponse.status }
    );
  }

  const extracted = extractErrorMessage(payload);
  const statusText = String((payload as { response?: { status?: string } })?.response?.status ?? "OK").toUpperCase();
  if (statusText !== "OK" && statusText !== "SUCCESS") {
    return NextResponse.json(
      {
        error: extracted.code,
        message: extracted.message,
        upstreamStatus: upstreamResponse.status
      },
      { status: 502 }
    );
  }

  return NextResponse.json(toFeatureCollection(payload), {
    status: 200,
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
