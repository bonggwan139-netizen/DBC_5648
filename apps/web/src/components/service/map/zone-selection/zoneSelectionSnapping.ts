import type { Position } from "geojson";
import type { CadastralFeature, MapPoint } from "./zoneSelectionTypes";

export const CADASTRAL_VERTEX_SNAP_TOLERANCE_PX = 18;

export type CadastralVertexCandidate = {
  coordinate: Position;
  parcelId: string | null;
};

type ProjectFn = (coordinate: Position) => MapPoint;

function appendPolygonVertices(coordinates: Position[][], target: Position[]) {
  coordinates.forEach((ring) => {
    ring.forEach((coordinate) => {
      target.push(coordinate);
    });
  });
}

export function extractCadastralVertices(features: CadastralFeature[]): CadastralVertexCandidate[] {
  const candidates: CadastralVertexCandidate[] = [];
  const seen = new Set<string>();

  features.forEach((feature) => {
    const parcelId = feature.properties?._parcel_id ?? null;
    const vertices: Position[] = [];

    if (feature.geometry.type === "Polygon") {
      appendPolygonVertices(feature.geometry.coordinates, vertices);
    }

    if (feature.geometry.type === "MultiPolygon") {
      feature.geometry.coordinates.forEach((polygon) => appendPolygonVertices(polygon, vertices));
    }

    vertices.forEach((coordinate) => {
      const key = `${coordinate[0].toFixed(8)},${coordinate[1].toFixed(8)}`;
      if (seen.has(key)) {
        return;
      }

      seen.add(key);
      candidates.push({
        coordinate,
        parcelId
      });
    });
  });

  return candidates;
}

export function snapToNearestCadastralVertex(params: {
  clickPoint: MapPoint;
  vertices: CadastralVertexCandidate[];
  project: ProjectFn;
  tolerancePx?: number;
}): (CadastralVertexCandidate & { distancePx: number }) | null {
  const tolerancePx = params.tolerancePx ?? CADASTRAL_VERTEX_SNAP_TOLERANCE_PX;
  let nearest: (CadastralVertexCandidate & { distancePx: number }) | null = null;

  params.vertices.forEach((candidate) => {
    const projected = params.project(candidate.coordinate);
    const dx = projected.x - params.clickPoint.x;
    const dy = projected.y - params.clickPoint.y;
    const distancePx = Math.sqrt(dx * dx + dy * dy);

    if (distancePx > tolerancePx) {
      return;
    }

    if (!nearest || distancePx < nearest.distancePx) {
      nearest = {
        ...candidate,
        distancePx
      };
    }
  });

  return nearest;
}

export function resolveDrawCoordinate(params: {
  clickPoint: MapPoint;
  rawCoordinate: Position;
  vertices: CadastralVertexCandidate[];
  project: ProjectFn;
  tolerancePx?: number;
}) {
  const snappedVertex = snapToNearestCadastralVertex({
    clickPoint: params.clickPoint,
    vertices: params.vertices,
    project: params.project,
    tolerancePx: params.tolerancePx
  });

  if (snappedVertex) {
    return {
      coordinate: snappedVertex.coordinate,
      sourceParcelId: snappedVertex.parcelId,
      snapped: true
    };
  }

  return {
    coordinate: params.rawCoordinate,
    sourceParcelId: null,
    snapped: false
  };
}
