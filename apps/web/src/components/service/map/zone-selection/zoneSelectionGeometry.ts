import { bbox, booleanValid, cleanCoords, union } from "@turf/turf";
import type {
  Feature,
  FeatureCollection,
  Geometry,
  GeoJsonProperties,
  LineString,
  Point,
  Position
} from "geojson";
import type {
  DrawGeometryRecord,
  DrawVertex,
  FinalizedZone,
  FinalizedZoneMode,
  ParcelFeatureRecord,
  ZoneConfirmedFeatureCollection,
  ZoneDraftGeometryFeatureCollection,
  ZoneDraftVertexFeatureCollection,
  ZoneGeometry
} from "./zoneSelectionTypes";

function randomId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createEmptyFeatureCollection<G extends Geometry, P extends GeoJsonProperties = GeoJsonProperties>(): FeatureCollection<
  G,
  P
> {
  return {
    type: "FeatureCollection",
    features: []
  };
}

function createFeature<G extends Geometry, P extends GeoJsonProperties = GeoJsonProperties>(
  geometry: G,
  properties: P
): Feature<G, P> {
  return {
    type: "Feature",
    geometry,
    properties
  };
}

function normalizeZoneGeometry(geometry: ZoneGeometry): ZoneGeometry {
  const cleaned = cleanCoords(createFeature(geometry, {})).geometry;

  if (cleaned.type !== "Polygon" && cleaned.type !== "MultiPolygon") {
    throw new Error(`Unsupported zone geometry type: ${cleaned.type}`);
  }

  return cleaned;
}

export function isSameCoordinate(a: Position, b: Position) {
  return a[0] === b[0] && a[1] === b[1];
}

function closeRing(vertices: Position[]) {
  if (vertices.length === 0) {
    return [];
  }

  const ring = [...vertices];
  const first = ring[0];
  const last = ring[ring.length - 1];

  if (!isSameCoordinate(first, last)) {
    ring.push(first);
  }

  return ring;
}

export function createDrawPolygonGeometry(vertices: Position[]): ZoneGeometry | null {
  if (vertices.length < 3) {
    return null;
  }

  const ring = closeRing(vertices);
  if (ring.length < 4) {
    return null;
  }

  const geometry: ZoneGeometry = {
    type: "Polygon",
    coordinates: [ring]
  };

  const normalized = normalizeZoneGeometry(geometry);
  return booleanValid(normalized) ? normalized : null;
}

export function createDrawGeometryRecord(vertices: DrawVertex[]): DrawGeometryRecord | null {
  const geometry = createDrawPolygonGeometry(vertices.map((vertex) => vertex.coordinate));
  if (!geometry) {
    return null;
  }

  return {
    id: `draw-geometry-${randomId()}`,
    geometry
  };
}

export function mergeZoneGeometries(geometries: ZoneGeometry[]): ZoneGeometry | null {
  if (geometries.length === 0) {
    return null;
  }

  if (geometries.length === 1) {
    const [single] = geometries;
    const normalized = normalizeZoneGeometry(single);
    return booleanValid(normalized) ? normalized : null;
  }

  const features = geometries.map((geometry) => createFeature(normalizeZoneGeometry(geometry), {}));
  const merged = union({
    type: "FeatureCollection",
    features
  });

  if (!merged) {
    return null;
  }

  const normalized = normalizeZoneGeometry(merged.geometry);
  return booleanValid(normalized) ? normalized : null;
}

function createFinalizedZone(mode: FinalizedZoneMode, geometry: ZoneGeometry, sourceParcelIds?: string[]): FinalizedZone {
  const dedupedSourceIds =
    sourceParcelIds && sourceParcelIds.length > 0
      ? Array.from(new Set(sourceParcelIds.filter((value) => value && value.trim().length > 0)))
      : undefined;

  return {
    id: `zone-${randomId()}`,
    mode,
    status: "confirmed",
    geometry,
    bbox: bbox(geometry),
    createdAt: new Date().toISOString(),
    ...(dedupedSourceIds && dedupedSourceIds.length > 0 ? { sourceParcelIds: dedupedSourceIds } : {})
  };
}

export function createFinalizedDraftZone(params: {
  parcelRecords: ParcelFeatureRecord[];
  drawnGeometries: DrawGeometryRecord[];
}): FinalizedZone | null {
  const parcelGeometries = params.parcelRecords.map((record) => record.geometry);
  const drawnGeometries = params.drawnGeometries.map((record) => record.geometry);
  const merged = mergeZoneGeometries([...parcelGeometries, ...drawnGeometries]);
  if (!merged) {
    return null;
  }

  const hasParcels = params.parcelRecords.length > 0;
  const hasDrawnGeometries = params.drawnGeometries.length > 0;
  const mode: FinalizedZoneMode = hasParcels && hasDrawnGeometries ? "mixed" : hasParcels ? "parcel" : "draw";

  return createFinalizedZone(
    mode,
    merged,
    params.parcelRecords.map((record) => record.sourceParcelId).filter((value): value is string => Boolean(value))
  );
}

export function createDrawDraftGeometryFeatureCollectionWithPreview(
  drawnGeometries: DrawGeometryRecord[],
  vertices: DrawVertex[],
  options?: {
    hoverCoordinate?: Position | null;
  }
): ZoneDraftGeometryFeatureCollection {
  const features: ZoneDraftGeometryFeatureCollection["features"] = drawnGeometries.map((record) =>
    createFeature(record.geometry, { kind: "polygon" })
  );

  if (vertices.length >= 2) {
    const lineGeometry: LineString = {
      type: "LineString",
      coordinates: vertices.map((vertex) => vertex.coordinate)
    };

    features.push(createFeature(lineGeometry, { kind: "line" }));
  }

  if (options?.hoverCoordinate && vertices.length >= 1) {
    features.push(
      createFeature(
        {
          type: "LineString",
          coordinates: [vertices[vertices.length - 1].coordinate, options.hoverCoordinate]
        },
        { kind: "preview" }
      )
    );
  }

  return {
    type: "FeatureCollection",
    features
  };
}

export function createDrawDraftVertexFeatureCollection(vertices: DrawVertex[]): ZoneDraftVertexFeatureCollection {
  const features = vertices.map((vertex, index) =>
    createFeature<Point, { index: number }>(
      {
        type: "Point",
        coordinates: vertex.coordinate
      },
      { index }
    )
  );

  return {
    type: "FeatureCollection",
    features
  };
}

export function createConfirmedZoneFeatureCollection(zone: FinalizedZone | null): ZoneConfirmedFeatureCollection {
  if (!zone) {
    return createEmptyFeatureCollection();
  }

  return {
    type: "FeatureCollection",
    features: [
      createFeature(zone.geometry, {
        zoneId: zone.id,
        mode: zone.mode,
        status: zone.status
      })
    ]
  };
}
