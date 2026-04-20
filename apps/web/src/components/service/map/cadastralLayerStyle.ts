import type { MapLibreMap } from "./maplibreLoader";

export const CADASTRAL_SOURCE_ID = "vworld-cadastral-data";
export const CADASTRAL_INTERACTION_FILL_LAYER_ID = "vworld-cadastral-hit-fill";
export const CADASTRAL_INTERACTION_FILL_ACTIVE_LAYER_ID = "vworld-cadastral-hit-fill-active";
export const CADASTRAL_LINE_LAYER_ID = "vworld-cadastral-line";
export const CADASTRAL_LINE_ACTIVE_LAYER_ID = "vworld-cadastral-line-active";

const CADASTRAL_BASE_COLOR = "#2563eb";
const CADASTRAL_ACTIVE_COLOR = "#1d4ed8";
const CADASTRAL_MIN_ZOOM = 14;

type LayerDefinition = Parameters<MapLibreMap["addLayer"]>[0];

export function createCadastralLayerDefinitions(sourceId = CADASTRAL_SOURCE_ID): LayerDefinition[] {
  return [
    {
      id: CADASTRAL_INTERACTION_FILL_LAYER_ID,
      type: "fill",
      source: sourceId,
      minzoom: CADASTRAL_MIN_ZOOM,
      paint: {
        "fill-color": CADASTRAL_BASE_COLOR,
        "fill-opacity": 0
      }
    },
    {
      id: CADASTRAL_INTERACTION_FILL_ACTIVE_LAYER_ID,
      type: "fill",
      source: sourceId,
      minzoom: CADASTRAL_MIN_ZOOM,
      paint: {
        "fill-color": CADASTRAL_ACTIVE_COLOR,
        "fill-opacity": 0
      },
      filter: ["==", ["get", "_selected"], true]
    },
    {
      id: CADASTRAL_LINE_LAYER_ID,
      type: "line",
      source: sourceId,
      minzoom: CADASTRAL_MIN_ZOOM,
      paint: {
        "line-color": CADASTRAL_BASE_COLOR,
        "line-width": 1.2,
        "line-opacity": 0.95
      }
    },
    {
      id: CADASTRAL_LINE_ACTIVE_LAYER_ID,
      type: "line",
      source: sourceId,
      minzoom: CADASTRAL_MIN_ZOOM,
      paint: {
        "line-color": CADASTRAL_ACTIVE_COLOR,
        "line-width": 2.2,
        "line-opacity": 1
      },
      filter: ["==", ["get", "_selected"], true]
    }
  ];
}
