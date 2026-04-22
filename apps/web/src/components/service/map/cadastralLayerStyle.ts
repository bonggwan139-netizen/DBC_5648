import type { MapLibreMap } from "./maplibreLoader";

export const CADASTRAL_SOURCE_ID = "vworld-cadastral-data";
export const CADASTRAL_LINE_LAYER_ID = "vworld-cadastral-line";
export const CADASTRAL_LINE_ACTIVE_LAYER_ID = "vworld-cadastral-line-active";
export const CADASTRAL_ZONE_LINE_LAYER_ID = "vworld-cadastral-line-zone";
export const CADASTRAL_HIT_LAYER_ID = "vworld-cadastral-hit";
const CADASTRAL_FILL_ACTIVE_LAYER_ID = "vworld-cadastral-fill-active";
const CADASTRAL_FILL_ZONE_LAYER_ID = "vworld-cadastral-fill-zone";

export const CADASTRAL_INTERACTIVE_LAYER_IDS = [
  CADASTRAL_HIT_LAYER_ID,
  CADASTRAL_LINE_LAYER_ID,
  CADASTRAL_LINE_ACTIVE_LAYER_ID,
  CADASTRAL_ZONE_LINE_LAYER_ID
];

export function addCadastralLayers(map: MapLibreMap) {
  map.addLayer({
    id: CADASTRAL_HIT_LAYER_ID,
    type: "fill",
    source: CADASTRAL_SOURCE_ID,
    minzoom: 14,
    paint: {
      "fill-color": "#000000",
      "fill-opacity": 0
    }
  });

  map.addLayer({
    id: CADASTRAL_LINE_LAYER_ID,
    type: "line",
    source: CADASTRAL_SOURCE_ID,
    minzoom: 14,
    paint: {
      "line-color": "#1d4ed8",
      "line-width": 1.1
    }
  });

  map.addLayer({
    id: CADASTRAL_FILL_ACTIVE_LAYER_ID,
    type: "fill",
    source: CADASTRAL_SOURCE_ID,
    minzoom: 14,
    paint: {
      "fill-color": "#2563eb",
      "fill-opacity": 0.12
    },
    filter: ["==", ["get", "_info_selected"], true]
  });

  map.addLayer({
    id: CADASTRAL_LINE_ACTIVE_LAYER_ID,
    type: "line",
    source: CADASTRAL_SOURCE_ID,
    minzoom: 14,
    paint: {
      "line-color": "#2563eb",
      "line-width": 2
    },
    filter: ["==", ["get", "_info_selected"], true]
  });

  map.addLayer({
    id: CADASTRAL_FILL_ZONE_LAYER_ID,
    type: "fill",
    source: CADASTRAL_SOURCE_ID,
    minzoom: 14,
    paint: {
      "fill-color": "#0f766e",
      "fill-opacity": 0.2
    },
    filter: ["==", ["get", "_zone_selected"], true]
  });

  map.addLayer({
    id: CADASTRAL_ZONE_LINE_LAYER_ID,
    type: "line",
    source: CADASTRAL_SOURCE_ID,
    minzoom: 14,
    paint: {
      "line-color": "#0f766e",
      "line-width": 2.2
    },
    filter: ["==", ["get", "_zone_selected"], true]
  });
}
