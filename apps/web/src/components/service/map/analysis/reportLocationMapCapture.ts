import * as turf from "@turf/turf";
import type { Feature, Point, Polygon } from "geojson";
import { isMapRenderable, mapPublicEnv } from "@/components/service/map/config/publicEnv";
import { loadMapLibre, type MapLibreMap } from "@/components/service/map/maplibreLoader";
import { createVworldStyle, ROAD_LAYER_ID, SATELLITE_LAYER_ID } from "@/components/service/map/vworldStyle";
import type { ZoneGeometry } from "@/components/service/map/zone-selection/zoneSelectionTypes";

const CAPTURE_WIDTH = 1200;
const CAPTURE_HEIGHT = 1200;
const RENDER_WIDTH = 1500;
const RENDER_HEIGHT = 1200;
const LOAD_TIMEOUT_MS = 8000;
const EVENT_TIMEOUT_MS = 2500;
const TILE_READY_TIMEOUT_MS = 10000;
const TILE_READY_POLL_MS = 150;
const POST_TILE_SETTLE_MS = 1700;
const EXPORT_RETRY_SETTLE_MS = 800;
const EDGE_SAMPLE_BAND_PX = 72;
const MAX_BLANK_EDGE_RATIO = 0.38;
const ZONE_SOURCE_ID = "report-location-zone";
const CIRCLE_SOURCE_ID = "report-location-circles";

type ReportCaptureMap = MapLibreMap & {
  areTilesLoaded?: () => boolean;
  fitBounds: (
    bounds: [[number, number], [number, number]],
    options?: { padding?: number; duration?: number; animate?: boolean }
  ) => void;
  getCanvas: () => HTMLCanvasElement;
  getCenter?: () => unknown;
  getZoom?: () => number;
  isStyleLoaded?: () => boolean;
  jumpTo?: (options: { center?: unknown; zoom?: number }) => void;
  loaded?: () => boolean;
  once: (eventName: string, callback: () => void) => void;
  panBy?: (offset: [number, number], options?: { duration?: number }) => void;
  resize: () => void;
  triggerRepaint?: () => void;
};

type CanvasLabel = {
  label: string;
  coordinate: [number, number];
};

type CanvasExportResult = {
  dataUrl: string;
  hasBlankEdge: boolean;
};

function devWarn(message: string, error?: unknown) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.warn("[report-location-map]", message, error);
}

function waitForMapEvent(map: ReportCaptureMap, eventName: string, timeoutMs: number) {
  return new Promise<boolean>((resolve) => {
    let settled = false;
    const timer = window.setTimeout(() => {
      if (settled) {
        return;
      }

      settled = true;
      devWarn(`${eventName} timed out; continuing capture.`);
      resolve(false);
    }, timeoutMs);

    map.once(eventName, () => {
      if (settled) {
        return;
      }

      settled = true;
      window.clearTimeout(timer);
      resolve(true);
    });
  });
}

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function waitForAnimationFrames(count: number) {
  for (let index = 0; index < count; index += 1) {
    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => resolve());
    });
  }
}

async function waitForTilesReady(map: ReportCaptureMap, timeoutMs: number) {
  const start = window.performance.now();

  while (window.performance.now() - start < timeoutMs) {
    const tilesLoaded = map.areTilesLoaded?.() ?? true;
    const mapLoaded = map.loaded?.() ?? true;
    const styleLoaded = map.isStyleLoaded?.() ?? true;

    if (tilesLoaded && mapLoaded && styleLoaded) {
      return true;
    }

    await delay(TILE_READY_POLL_MS);
  }

  devWarn("Tile readiness timed out; continuing capture.", {
    areTilesLoaded: map.areTilesLoaded?.(),
    loaded: map.loaded?.(),
    isStyleLoaded: map.isStyleLoaded?.()
  });
  return false;
}

function createOffscreenContainer() {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.style.top = "0";
  container.style.width = `${RENDER_WIDTH}px`;
  container.style.height = `${RENDER_HEIGHT}px`;
  container.style.pointerEvents = "none";
  container.style.background = "#ffffff";
  document.body.appendChild(container);
  return container;
}

function toLngLatCoordinate(coordinate: number[]): [number, number] {
  return [coordinate[0], coordinate[1]];
}

async function warmUpMapRender(map: ReportCaptureMap) {
  map.resize();
  await waitForMapEvent(map, "idle", EVENT_TIMEOUT_MS);

  const center = map.getCenter?.();
  const zoom = map.getZoom?.();

  if (center && typeof zoom === "number" && Number.isFinite(zoom) && map.jumpTo) {
    map.jumpTo({ center, zoom: zoom + 0.18 });
    await waitForMapEvent(map, "idle", EVENT_TIMEOUT_MS);
    map.jumpTo({ center, zoom });
    await waitForMapEvent(map, "idle", EVENT_TIMEOUT_MS);
  }

  if (map.panBy) {
    map.panBy([80, 0], { duration: 0 });
    await waitForMapEvent(map, "idle", EVENT_TIMEOUT_MS);
    map.panBy([-80, 0], { duration: 0 });
    await waitForMapEvent(map, "idle", EVENT_TIMEOUT_MS);
  }

  map.resize();
  map.triggerRepaint?.();
  await delay(POST_TILE_SETTLE_MS);
  await waitForAnimationFrames(2);
}

function getBlankEdgeRatio(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
  const width = canvas.width;
  const height = canvas.height;
  const band = Math.min(EDGE_SAMPLE_BAND_PX, Math.floor(width / 4), Math.floor(height / 4));

  if (band <= 0) {
    return 0;
  }

  const regions = [
    { x: 0, y: 0, width, height: band },
    { x: 0, y: height - band, width, height: band },
    { x: 0, y: band, width: band, height: height - band * 2 },
    { x: width - band, y: band, width: band, height: height - band * 2 }
  ];
  let blankPixels = 0;
  let totalPixels = 0;

  regions.forEach((region) => {
    if (region.width <= 0 || region.height <= 0) {
      return;
    }

    const imageData = context.getImageData(region.x, region.y, region.width, region.height);
    const data = imageData.data;
    totalPixels += region.width * region.height;

    for (let index = 0; index < data.length; index += 4) {
      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];
      const alpha = data[index + 3];
      const isTransparent = alpha < 245;
      const isNearWhite = alpha > 245 && red > 246 && green > 246 && blue > 246;

      if (isTransparent || isNearWhite) {
        blankPixels += 1;
      }
    }
  });

  return totalPixels > 0 ? blankPixels / totalPixels : 0;
}

function drawCanvasLabels(map: ReportCaptureMap, labels: CanvasLabel[]): CanvasExportResult {
  const sourceCanvas = map.getCanvas();
  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = CAPTURE_WIDTH;
  outputCanvas.height = CAPTURE_HEIGHT;

  const context = outputCanvas.getContext("2d");
  if (!context) {
    throw new Error("canvas context unavailable");
  }

  const canvasRect = sourceCanvas.getBoundingClientRect();
  const sourceCssWidth = canvasRect.width || RENDER_WIDTH;
  const sourceCssHeight = canvasRect.height || RENDER_HEIGHT;
  const scaleX = sourceCanvas.width / sourceCssWidth;
  const scaleY = sourceCanvas.height / sourceCssHeight;
  const cropCssX = Math.max(0, (sourceCssWidth - CAPTURE_WIDTH) / 2);
  const cropCssY = Math.max(0, (sourceCssHeight - CAPTURE_HEIGHT) / 2);

  context.drawImage(
    sourceCanvas,
    cropCssX * scaleX,
    cropCssY * scaleY,
    CAPTURE_WIDTH * scaleX,
    CAPTURE_HEIGHT * scaleY,
    0,
    0,
    CAPTURE_WIDTH,
    CAPTURE_HEIGHT
  );
  context.font = '400 26px Arial, "Noto Sans KR", "Malgun Gothic", sans-serif';
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.lineJoin = "round";

  labels.forEach(({ coordinate, label }) => {
    const point = map.project(coordinate);
    const x = point.x - cropCssX;
    const y = point.y - cropCssY;

    context.strokeStyle = "rgba(0, 0, 0, 0.65)";
    context.lineWidth = 3;
    context.strokeText(label, x, y);

    context.fillStyle = "#ffffff";
    context.fillText(label, x, y);
  });

  const blankEdgeRatio = getBlankEdgeRatio(outputCanvas, context);
  const dataUrl = outputCanvas.toDataURL("image/png");
  if (!dataUrl.startsWith("data:image/png")) {
    throw new Error("canvas returned a non-png data URL");
  }

  return {
    dataUrl,
    hasBlankEdge: blankEdgeRatio > MAX_BLANK_EDGE_RATIO
  };
}

async function exportCanvasWithRetry(map: ReportCaptureMap, labels: CanvasLabel[]) {
  try {
    const result = drawCanvasLabels(map, labels);

    if (result.hasBlankEdge) {
      throw new Error("blank edge area detected");
    }

    return result.dataUrl;
  } catch (error) {
    devWarn("Canvas export failed; retrying after stronger render warm-up.", error);
  }

  try {
    map.resize();
    await warmUpMapRender(map);
    await delay(EXPORT_RETRY_SETTLE_MS);
    await waitForAnimationFrames(2);
    const result = drawCanvasLabels(map, labels);

    if (result.hasBlankEdge) {
      throw new Error("blank edge area detected after retry");
    }

    return result.dataUrl;
  } catch (error) {
    devWarn("Canvas export failed after retry.", error);
    throw new Error("canvas export failed");
  }
}

function buildZoneFeature(zone: ZoneGeometry): Feature<ZoneGeometry> {
  return {
    type: "Feature",
    geometry: zone,
    properties: {}
  };
}

export async function captureReportLocationMap(zone: ZoneGeometry): Promise<string> {
  if (!isMapRenderable) {
    throw new Error("Map rendering is unavailable.");
  }

  const zoneFeature = buildZoneFeature(zone);
  const centerFeature = turf.pointOnFeature(zoneFeature) as Feature<Point>;
  const center = centerFeature.geometry.coordinates;
  const oneKmCircle = turf.circle(center, 1, { steps: 160, units: "kilometers" }) as Feature<Polygon>;
  const threeKmCircle = turf.circle(center, 3, { steps: 160, units: "kilometers" }) as Feature<Polygon>;
  const fiveKmCircle = turf.circle(center, 5, { steps: 160, units: "kilometers" }) as Feature<Polygon>;
  const oneKmLabel = turf.destination(center, 1, 90, { units: "kilometers" }) as Feature<Point>;
  const threeKmLabel = turf.destination(center, 3, 90, { units: "kilometers" }) as Feature<Point>;
  const fiveKmLabel = turf.destination(center, 5, 90, { units: "kilometers" }) as Feature<Point>;
  const canvasLabels: CanvasLabel[] = [
    { label: "1km", coordinate: toLngLatCoordinate(oneKmLabel.geometry.coordinates) },
    { label: "3km", coordinate: toLngLatCoordinate(threeKmLabel.geometry.coordinates) },
    { label: "5km", coordinate: toLngLatCoordinate(fiveKmLabel.geometry.coordinates) }
  ];
  const bounds = turf.bbox(fiveKmCircle);
  const container = createOffscreenContainer();
  let map: ReportCaptureMap | null = null;

  try {
    const maplibregl = await loadMapLibre();
    map = new maplibregl.Map({
      container,
      style: createVworldStyle(mapPublicEnv.vworldApiKey),
      center: [center[0], center[1]],
      zoom: 10,
      interactive: false,
      attributionControl: false,
      fadeDuration: 0,
      preserveDrawingBuffer: true
    }) as ReportCaptureMap;

    await waitForMapEvent(map, "load", LOAD_TIMEOUT_MS);

    try {
      map.resize();
      map.setLayoutProperty(ROAD_LAYER_ID, "visibility", "none");
      map.setLayoutProperty(SATELLITE_LAYER_ID, "visibility", "visible");

      map.addSource(CIRCLE_SOURCE_ID, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            { ...fiveKmCircle, properties: { radiusKm: 5 } },
            { ...threeKmCircle, properties: { radiusKm: 3 } },
            { ...oneKmCircle, properties: { radiusKm: 1 } }
          ]
        }
      });
      map.addLayer({
        id: "report-location-circle-line-5km",
        type: "line",
        source: CIRCLE_SOURCE_ID,
        filter: ["==", ["get", "radiusKm"], 5],
        paint: {
          "line-color": "#ffffff",
          "line-opacity": 0.95,
          "line-width": 2,
          "line-dasharray": [1, 1.2]
        }
      });
      map.addLayer({
        id: "report-location-circle-line-3km",
        type: "line",
        source: CIRCLE_SOURCE_ID,
        filter: ["==", ["get", "radiusKm"], 3],
        paint: {
          "line-color": "#ffffff",
          "line-opacity": 0.95,
          "line-width": 2,
          "line-dasharray": [1, 1.2]
        }
      });
      map.addLayer({
        id: "report-location-circle-line-1km",
        type: "line",
        source: CIRCLE_SOURCE_ID,
        filter: ["==", ["get", "radiusKm"], 1],
        paint: {
          "line-color": "#ffffff",
          "line-opacity": 0.95,
          "line-width": 2,
          "line-dasharray": [1, 1.2]
        }
      });

      map.addSource(ZONE_SOURCE_ID, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [zoneFeature]
        }
      });
      map.addLayer({
        id: "report-location-zone-fill",
        type: "fill",
        source: ZONE_SOURCE_ID,
        paint: {
          "fill-color": "#ffffff",
          "fill-opacity": 0.16
        }
      });
      map.addLayer({
        id: "report-location-zone-line",
        type: "line",
        source: ZONE_SOURCE_ID,
        paint: {
          "line-color": "#ef4444",
          "line-width": 4
        }
      });
    } catch (error) {
      devWarn("Map setup failed.", error);
      throw new Error("map setup failed");
    }

    const moveEndPromise = waitForMapEvent(map, "moveend", EVENT_TIMEOUT_MS);
    map.fitBounds(
      [
        [bounds[0], bounds[1]],
        [bounds[2], bounds[3]]
      ],
      { padding: 240, duration: 0, animate: false }
    );

    await moveEndPromise;
    await waitForMapEvent(map, "idle", EVENT_TIMEOUT_MS);
    await waitForTilesReady(map, TILE_READY_TIMEOUT_MS);
    await warmUpMapRender(map);

    return await exportCanvasWithRetry(map, canvasLabels);
  } finally {
    map?.remove();
    container.remove();
  }
}
