import { NextRequest, NextResponse } from "next/server";
import {
  MAP_DATA_BBOX_COORD_PRECISION,
  MAP_DATA_MAX_BBOX_AREA,
  MAP_DATA_MAX_BBOX_HEIGHT,
  MAP_DATA_MAX_BBOX_WIDTH,
  VWORLD_DATA_DEFAULT_SIZE,
  VWORLD_DATA_MAX_SIZE_LIMIT
} from "@/components/service/map/config/constants";
import { getMapServerEnv } from "@/components/service/map/config/serverEnv";
import { getPlanningSpecialPurposeAreaStyle } from "@/components/service/map/analysis/planningSpecialPurposeAreaStyle";

export const runtime = "edge";
export const preferredRegion = "icn1";

const VWORLD_DATA_URL = "https://api.vworld.kr/req/data";
const PLANNING_GROUP_SPECIAL_PURPOSE_AREA = "specialPurposeArea";

const SPECIAL_PURPOSE_AREA_LAYERS = [
  {
    id: "lt_c_uq111",
    name: "용도지역도_도시지역"
  },
  {
    id: "lt_c_uq112",
    name: "용도지역도_관리지역"
  },
  {
    id: "lt_c_uq113",
    name: "용도지역도_농림지역"
  },
  {
    id: "lt_c_uq114",
    name: "용도지역도_자연환경보전지역"
  }
] as const;

type PlanningLayerConfig = (typeof SPECIAL_PURPOSE_AREA_LAYERS)[number];

type FeatureCollectionLike = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: unknown;
    properties?: Record<string, unknown>;
  }>;
};

type BboxParseResult =
  | {
      ok: true;
      geomFilter: string;
    }
  | {
      ok: false;
      error: string;
      message: string;
      status: number;
    };

function roundCoord(value: number) {
  return Number(value.toFixed(MAP_DATA_BBOX_COORD_PRECISION));
}

function parseBbox(raw: string | null): BboxParseResult {
  if (!raw) {
    return {
      ok: false,
      error: "INVALID_BBOX",
      message: "bbox parameter must use minX,minY,maxX,maxY.",
      status: 400
    };
  }

  const values = raw.split(",").map((value) => Number(value.trim()));
  if (values.length !== 4 || values.some((value) => Number.isNaN(value))) {
    return {
      ok: false,
      error: "INVALID_BBOX",
      message: "bbox parameter must use minX,minY,maxX,maxY.",
      status: 400
    };
  }

  const [rawMinX, rawMinY, rawMaxX, rawMaxY] = values;
  const minX = roundCoord(rawMinX);
  const minY = roundCoord(rawMinY);
  const maxX = roundCoord(rawMaxX);
  const maxY = roundCoord(rawMaxY);

  if (minX >= maxX || minY >= maxY || minX < -180 || maxX > 180 || minY < -90 || maxY > 90) {
    return {
      ok: false,
      error: "INVALID_BBOX",
      message: "bbox parameter must use a valid EPSG:4326 extent.",
      status: 400
    };
  }

  const width = maxX - minX;
  const height = maxY - minY;
  const area = width * height;

  if (width > MAP_DATA_MAX_BBOX_WIDTH || height > MAP_DATA_MAX_BBOX_HEIGHT || area > MAP_DATA_MAX_BBOX_AREA) {
    return {
      ok: false,
      error: "BBOX_TOO_LARGE",
      message: "bbox is too large.",
      status: 422
    };
  }

  return {
    ok: true,
    geomFilter: `BOX(${minX},${minY},${maxX},${maxY})`
  };
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

  const nested = (payload as {
    response?: {
      result?: {
        featureCollection?: {
          type?: string;
          features?: unknown[];
        };
      };
    };
  })?.response?.result?.featureCollection;

  if (nested?.type === "FeatureCollection" && Array.isArray(nested.features)) {
    return nested as FeatureCollectionLike;
  }

  return {
    type: "FeatureCollection",
    features: []
  };
}

function pickFirstString(properties: Record<string, unknown>, keys: string[]) {
  const found = keys.find((key) => properties[key] !== undefined && properties[key] !== null);
  return found ? String(properties[found]) : null;
}

function normalizePlanningFeature(
  feature: FeatureCollectionLike["features"][number],
  layer: PlanningLayerConfig
): FeatureCollectionLike["features"][number] {
  const properties = feature.properties ?? {};
  const planningCode = pickFirstString(properties, ["ucode", "UCODE", "code", "CODE"]);
  const planningName =
    pickFirstString(properties, ["uname", "UNAME", "__planningName", "name", "NAME", "label", "LABEL"]) ?? layer.name;
  const style = getPlanningSpecialPurposeAreaStyle(planningName);

  return {
    ...feature,
    properties: {
      ...properties,
      __planningGroup: PLANNING_GROUP_SPECIAL_PURPOSE_AREA,
      __planningLayer: layer.id,
      __planningLayerName: layer.name,
      __planningCode: planningCode,
      __planningName: planningName,
      __planningColor: style.fillColor,
      __planningFillColor: style.fillColor,
      __planningOutlineColor: style.outlineColor,
      __planningPattern: style.pattern
    }
  };
}

async function fetchPlanningLayer({
  geomFilter,
  layer,
  size
}: {
  geomFilter: string;
  layer: PlanningLayerConfig;
  size: string;
}) {
  const mapServerEnv = getMapServerEnv();
  const params = new URLSearchParams({
    service: "data",
    request: "GetFeature",
    data: layer.id,
    geomFilter,
    size,
    format: "json",
    crs: "EPSG:4326",
    key: mapServerEnv.vworldApiKey,
    domain: mapServerEnv.vworldDomain
  });

  const response = await fetch(`${VWORLD_DATA_URL}?${params.toString()}`, {
    method: "GET",
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`VWorld planning layer request failed: ${layer.id} (${response.status})`);
  }

  const payload = (await response.json()) as unknown;
  const statusText = String((payload as { response?: { status?: string } })?.response?.status ?? "OK").toUpperCase();
  if (statusText !== "OK" && statusText !== "SUCCESS" && statusText !== "NOT_FOUND") {
    throw new Error(`VWorld planning layer response failed: ${layer.id}`);
  }

  return toFeatureCollection(payload).features.map((feature) => normalizePlanningFeature(feature, layer));
}

export async function GET(req: NextRequest) {
  const group = req.nextUrl.searchParams.get("group");
  if (group !== PLANNING_GROUP_SPECIAL_PURPOSE_AREA) {
    return NextResponse.json(
      {
        error: "INVALID_PLANNING_GROUP",
        errorCode: "INVALID_PLANNING_GROUP",
        message: "Unsupported planning data group."
      },
      { status: 400 }
    );
  }

  const bboxResult = parseBbox(req.nextUrl.searchParams.get("bbox"));
  if (!bboxResult.ok) {
    return NextResponse.json(
      {
        error: bboxResult.error,
        errorCode: bboxResult.error,
        message: bboxResult.message
      },
      { status: bboxResult.status }
    );
  }

  const requestedSize = Number(req.nextUrl.searchParams.get("size") ?? String(VWORLD_DATA_DEFAULT_SIZE));
  const safeSize = Number.isFinite(requestedSize)
    ? Math.min(VWORLD_DATA_MAX_SIZE_LIMIT, Math.max(1, Math.floor(requestedSize)))
    : VWORLD_DATA_DEFAULT_SIZE;
  const size = String(safeSize);

  try {
    const layerFeatures = await Promise.all(
      SPECIAL_PURPOSE_AREA_LAYERS.map((layer) =>
        fetchPlanningLayer({
          geomFilter: bboxResult.geomFilter,
          layer,
          size
        })
      )
    );
    const features = layerFeatures.flat();
    const cappedBySize = layerFeatures.some((featuresForLayer) => featuresForLayer.length >= safeSize);

    return NextResponse.json(
      {
        type: "FeatureCollection",
        features
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          "X-VWorld-Planning-Feature-Count": String(features.length),
          "X-VWorld-Planning-Requested-Size": String(safeSize),
          "X-VWorld-Planning-Feature-Capped": cappedBySize ? "true" : "false"
        }
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "VWORLD_PLANNING_DATA_REQUEST_FAILED",
        errorCode: "VWORLD_PLANNING_DATA_REQUEST_FAILED",
        message: error instanceof Error ? error.message : "VWorld planning data request failed."
      },
      { status: 502 }
    );
  }
}
