import * as turf from "@turf/turf";
import type { Feature, Point, Polygon } from "geojson";
import { isMapRenderable, mapPublicEnv } from "@/components/service/map/config/publicEnv";
import { loadMapLibre, type MapLibreMap } from "@/components/service/map/maplibreLoader";
import { createVworldStyle, ROAD_LAYER_ID, SATELLITE_LAYER_ID } from "@/components/service/map/vworldStyle";
import type { ZoneGeometry } from "@/components/service/map/zone-selection/zoneSelectionTypes";

const CAPTURE_WIDTH = 1200;
const CAPTURE_HEIGHT = 800;
const LOAD_TIMEOUT_MS = 8000;
const EVENT_TIMEOUT_MS = 2500;
const TILE_READY_TIMEOUT_MS = 10000;
const TILE_READY_POLL_MS = 150;
const POST_TILE_SETTLE_MS = 1000;
const ZONE_SOURCE_ID = "report-location-zone";
const CIRCLE_SOURCE_ID = "report-location-circles";
const HATCH_PATTERN_ID = "report-location-zone-hatch";

type ReportCaptureMap = MapLibreMap & {
  addImage: (id: string, image: HTMLCanvasElement | ImageData, options?: { pixelRatio?: number }) => void;
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
  container.style.width = `${CAPTURE_WIDTH}px`;
  container.style.height = `${CAPTURE_HEIGHT}px`;
  container.style.pointerEvents = "none";
  container.style.background = "#ffffff";
  document.body.appendChild(container);
  return container;
}

function createHatchPattern() {
  const canvas = document.createElement("canvas");
  canvas.width = 24;
  canvas.height = 24;
  const context = canvas.getContext("2d");

  if (!context) {
    return canvas;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "rgba(255, 255, 255, 0.82)";
  context.lineWidth = 3;

  for (let offset = -canvas.height; offset <= canvas.width; offset += 12) {
    context.beginPath();
    context.moveTo(offset, canvas.height);
    context.lineTo(offset + canvas.height, 0);
    context.stroke();
  }

  return canvas;
}

async function warmUpMapRender(map: ReportCaptureMap) {
  map.resize();

  const center = map.getCenter?.();
  const zoom = map.getZoom?.();

  if (center && typeof zoom === "number" && Number.isFinite(zoom) && map.jumpTo) {
    map.jumpTo({ center, zoom: zoom + 0.001 });
    map.jumpTo({ center, zoom });
  } else if (map.panBy) {
    map.panBy([1, 0], { duration: 0 });
    map.panBy([-1, 0], { duration: 0 });
  }

  map.resize();
  map.triggerRepaint?.();
  await delay(POST_TILE_SETTLE_MS);
  await waitForAnimationFrames(2);
}

async function exportCanvasWithRetry(map: ReportCaptureMap) {
  try {
    const dataUrl = map.getCanvas().toDataURL("image/png");

    if (!dataUrl.startsWith("data:image/png")) {
      throw new Error("canvas returned a non-png data URL");
    }

    return dataUrl;
  } catch (error) {
    devWarn("Canvas export failed; retrying after render warm-up.", error);
  }

  try {
    await warmUpMapRender(map);
    const dataUrl = map.getCanvas().toDataURL("image/png");

    if (!dataUrl.startsWith("data:image/png")) {
      throw new Error("canvas returned a non-png data URL");
    }

    return dataUrl;
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
  const fiveKmCircle = turf.circle(center, 5, { steps: 160, units: "kilometers" }) as Feature<Polygon>;
  const tenKmCircle = turf.circle(center, 10, { steps: 160, units: "kilometers" }) as Feature<Polygon>;
  const bounds = turf.bbox(tenKmCircle);
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

      map.addSource(ZONE_SOURCE_ID, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [zoneFeature]
        }
      });
      map.addSource(CIRCLE_SOURCE_ID, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            { ...tenKmCircle, properties: { radiusKm: 10 } },
            { ...fiveKmCircle, properties: { radiusKm: 5 } }
          ]
        }
      });

      map.addLayer({
        id: "report-location-zone-fill",
        type: "fill",
        source: ZONE_SOURCE_ID,
        paint: {
          "fill-color": "#ffffff",
          "fill-opacity": 0.2
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
      map.addLayer({
        id: "report-location-circle-line-10km",
        type: "line",
        source: CIRCLE_SOURCE_ID,
        filter: ["==", ["get", "radiusKm"], 10],
        paint: {
          "line-color": "#ffffff",
          "line-opacity": 0.95,
          "line-width": 4,
          "line-dasharray": [2, 2]
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
          "line-width": 4,
          "line-dasharray": [2, 2]
        }
      });
    } catch (error) {
      devWarn("Map setup failed.", error);
      throw new Error("map setup failed");
    }

    try {
      map.addImage(HATCH_PATTERN_ID, createHatchPattern(), { pixelRatio: 1 });
      map.addLayer(
        {
          id: "report-location-zone-hatch",
          type: "fill",
          source: ZONE_SOURCE_ID,
          paint: {
            "fill-pattern": HATCH_PATTERN_ID,
            "fill-opacity": 0.72
          }
        },
        "report-location-zone-line"
      );
    } catch (error) {
      devWarn("Hatch pattern setup failed; continuing with white fill and red outline.", error);
    }

    const moveEndPromise = waitForMapEvent(map, "moveend", EVENT_TIMEOUT_MS);
    map.fitBounds(
      [
        [bounds[0], bounds[1]],
        [bounds[2], bounds[3]]
      ],
      { padding: 72, duration: 0, animate: false }
    );

    await moveEndPromise;
    await waitForMapEvent(map, "idle", EVENT_TIMEOUT_MS);
    await waitForTilesReady(map, TILE_READY_TIMEOUT_MS);
    await warmUpMapRender(map);

    return await exportCanvasWithRetry(map);
  } finally {
    map?.remove();
    container.remove();
  }
}
