import type { MapLibreMap } from "../maplibreLoader";
import { createEmptyFeatureCollection } from "./zoneSelectionGeometry";
import type { Geometry, Point } from "geojson";
import type { ZoneGeometry } from "./zoneSelectionTypes";

export const ZONE_DRAFT_GEOMETRY_SOURCE_ID = "zone-draft-geometry";
export const ZONE_DRAFT_VERTEX_SOURCE_ID = "zone-draft-vertices";
export const ZONE_CONFIRMED_SOURCE_ID = "zone-confirmed-geometry";

export function addZoneSelectionOverlayLayers(map: MapLibreMap) {
  map.addSource(ZONE_DRAFT_GEOMETRY_SOURCE_ID, {
    type: "geojson",
    data: createEmptyFeatureCollection<Geometry>()
  });

  map.addSource(ZONE_DRAFT_VERTEX_SOURCE_ID, {
    type: "geojson",
    data: createEmptyFeatureCollection<Point>()
  });

  map.addSource(ZONE_CONFIRMED_SOURCE_ID, {
    type: "geojson",
    data: createEmptyFeatureCollection<ZoneGeometry>()
  });

  map.addLayer({
    id: "zone-draft-polygon-fill",
    type: "fill",
    source: ZONE_DRAFT_GEOMETRY_SOURCE_ID,
    paint: {
      "fill-color": "#0f766e",
      "fill-opacity": 0.16
    },
    filter: ["==", ["get", "kind"], "polygon"]
  });

  map.addLayer({
    id: "zone-draft-line",
    type: "line",
    source: ZONE_DRAFT_GEOMETRY_SOURCE_ID,
    paint: {
      "line-color": "#0f766e",
      "line-width": 2,
      "line-dasharray": [2, 2]
    },
    filter: ["==", ["get", "kind"], "line"]
  });

  map.addLayer({
    id: "zone-draft-preview-line",
    type: "line",
    source: ZONE_DRAFT_GEOMETRY_SOURCE_ID,
    paint: {
      "line-color": "#0f766e",
      "line-width": 1.5,
      "line-dasharray": [1, 2]
    },
    filter: ["==", ["get", "kind"], "preview"]
  });

  map.addLayer({
    id: "zone-draft-vertices",
    type: "circle",
    source: ZONE_DRAFT_VERTEX_SOURCE_ID,
    paint: {
      "circle-radius": 4,
      "circle-color": "#ffffff",
      "circle-stroke-width": 2,
      "circle-stroke-color": "#0f766e"
    }
  });

  map.addLayer({
    id: "zone-confirmed-fill",
    type: "fill",
    source: ZONE_CONFIRMED_SOURCE_ID,
    paint: {
      "fill-color": "#0f172a",
      "fill-opacity": 0.14
    }
  });

  map.addLayer({
    id: "zone-confirmed-line",
    type: "line",
    source: ZONE_CONFIRMED_SOURCE_ID,
    paint: {
      "line-color": "#0f172a",
      "line-width": 2.5
    }
  });
}
