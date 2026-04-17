import { NextRequest, NextResponse } from "next/server";

const VWORLD_WFS_URL = "https://api.vworld.kr/req/wfs";
const MAX_FEATURES_LIMIT = 1000;

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

  return `${minX},${minY},${maxX},${maxY},EPSG:4326`;
}

function getRuntimeHost(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  return host?.split(":")[0] ?? "";
}

function extractServiceException(body: string) {
  const codeMatch = body.match(/ServiceException[^>]*code="([^"]+)"/i);
  const messageMatch = body.match(/<ServiceException[^>]*>([\s\S]*?)<\/ServiceException>/i);
  return {
    code: codeMatch?.[1] ?? "VWORLD_WFS_ERROR",
    message: messageMatch?.[1]?.trim() ?? "브이월드 WFS 응답 처리 중 오류가 발생했습니다."
  };
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.VWORLD_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "VWORLD_API_KEY_NOT_CONFIGURED", message: "서버에 VWORLD_API_KEY가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  const bbox = parseBbox(req.nextUrl.searchParams.get("bbox"));
  if (!bbox) {
    return NextResponse.json(
      { error: "INVALID_BBOX", message: "bbox 파라미터는 minX,minY,maxX,maxY 형식이어야 합니다." },
      { status: 400 }
    );
  }

  const requestedMax = Number(req.nextUrl.searchParams.get("maxFeatures") ?? "500");
  const maxFeatures = Number.isFinite(requestedMax)
    ? String(Math.min(MAX_FEATURES_LIMIT, Math.max(1, Math.floor(requestedMax))))
    : "500";

  const domain = process.env.VWORLD_DOMAIN || getRuntimeHost(req);
  const typename = req.nextUrl.searchParams.get("typename") || "lp_pa_cbnd_bubun";

  const upstreamParams = new URLSearchParams({
    SERVICE: "WFS",
    REQUEST: "GetFeature",
    VERSION: "1.1.0",
    TYPENAME: typename,
    SRSNAME: "EPSG:4326",
    OUTPUT: "json",
    MAXFEATURES: maxFeatures,
    BBOX: bbox,
    KEY: apiKey,
    DOMAIN: domain
  });

  const upstreamResponse = await fetch(`${VWORLD_WFS_URL}?${upstreamParams.toString()}`, {
    method: "GET",
    cache: "no-store"
  });

  const bodyText = await upstreamResponse.text();
  const isXmlResponse =
    (upstreamResponse.headers.get("content-type") ?? "").includes("xml") ||
    bodyText.includes("ServiceExceptionReport");

  if (!upstreamResponse.ok || isXmlResponse) {
    const parsed = extractServiceException(bodyText);
    return NextResponse.json(
      { error: parsed.code, message: parsed.message },
      { status: upstreamResponse.ok ? 502 : upstreamResponse.status }
    );
  }

  try {
    const parsedJson = JSON.parse(bodyText) as unknown;
    return NextResponse.json(parsedJson, {
      status: 200,
      headers: {
        "Cache-Control": "no-store"
      }
    });
  } catch {
    return NextResponse.json(
      {
        error: "INVALID_JSON_RESPONSE",
        message: "브이월드 WFS 응답이 JSON 형식이 아닙니다."
      },
      { status: 502 }
    );
  }
}
