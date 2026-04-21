import type { MapLibreMap } from "./maplibreLoader";

export const CADASTRAL_SOURCE_ID = "vworld-cadastral-data";
export const CADASTRAL_LINE_LAYER_ID = "vworld-cadastral-line";
export const CADASTRAL_LINE_ACTIVE_LAYER_ID = "vworld-cadastral-line-active";
export const CADASTRAL_HIT_LAYER_ID = "vworld-cadastral-hit";
const CADASTRAL_FILL_ACTIVE_LAYER_ID = "vworld-cadastral-fill-active";

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
      "fill-opacity": 0.15
    },
    filter: ["==", ["get", "_selected"], true]
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
    filter: ["==", ["get", "_selected"], true]
  });
}
