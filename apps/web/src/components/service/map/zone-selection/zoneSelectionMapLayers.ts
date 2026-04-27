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
      "fill-color": "#dc2626",
      "fill-opacity": 0.14,
      "fill-outline-color": "#dc2626"
    },
    filter: ["==", ["get", "kind"], "draft-union"]
  });

  map.addLayer({
    id: "zone-draft-line",
    type: "line",
    source: ZONE_DRAFT_GEOMETRY_SOURCE_ID,
    paint: {
      "line-color": "#dc2626",
      "line-width": 2,
      "line-opacity": 0.9
    },
    filter: ["==", ["get", "kind"], "line"]
  });

  map.addLayer({
    id: "zone-draft-preview-line",
    type: "line",
    source: ZONE_DRAFT_GEOMETRY_SOURCE_ID,
    paint: {
      "line-color": "#dc2626",
      "line-width": 1.25,
      "line-opacity": 0.8
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
      "circle-stroke-color": "#dc2626"
    }
  });

  map.addLayer({
    id: "zone-confirmed-fill",
    type: "fill",
    source: ZONE_CONFIRMED_SOURCE_ID,
    paint: {
      "fill-color": "#dc2626",
      "fill-opacity": 0
    }
  });

  map.addLayer({
    id: "zone-confirmed-line",
    type: "line",
    source: ZONE_CONFIRMED_SOURCE_ID,
    layout: {
      "line-cap": "round",
      "line-join": "round"
    },
    paint: {
      "line-color": "#dc2626",
      "line-width": 3.5,
      "line-dasharray": [4, 1.5, 0.6, 1.5]
    }
  });
}
