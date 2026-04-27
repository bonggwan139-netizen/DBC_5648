"use client";

import { useEffect, useMemo, useState } from "react";
import { area as turfArea, booleanPointInPolygon, point as turfPoint } from "@turf/turf";
import type { Position } from "geojson";
import { CADASTRAL_HIT_LAYER_ID } from "../cadastralLayerStyle";
import type { MapLibreMap } from "../maplibreLoader";
import {
  createConfirmedZoneFeatureCollection,
  createDraftUnionGeometryFeatureCollection,
  createDrawDraftGuideFeatureCollectionWithPreview,
  createDrawDraftVertexFeatureCollection
} from "./zoneSelectionGeometry";
import { useZoneSelection } from "./zoneSelectionState";
import { extractCadastralVertices, resolveDrawCoordinate } from "./zoneSelectionSnapping";
import type {
  CadastralFeature,
  CadastralFeatureCollection,
  DrawVertex,
  MapPoint,
  ParcelFeatureRecord,
  ParcelProps,
  ZoneDraftGeometryFeatureCollection
} from "./zoneSelectionTypes";

type MapClickEvent = {
  point: MapPoint;
  lngLat: {
    lng: number;
    lat: number;
  };
};

type MapContextMenuEvent = MapClickEvent & {
  originalEvent?: {
    preventDefault?: () => void;
  };
};

function getParcelPnu(props: ParcelProps) {
  if (props.pnu !== undefined && props.pnu !== null) {
    return String(props.pnu);
  }

  if (props.PNU !== undefined && props.PNU !== null) {
    return String(props.PNU);
  }

  return null;
}

function getMinimalParcelFallbackKey(props: ParcelProps) {
  if (props.parcel_id !== undefined && props.parcel_id !== null) {
    return String(props.parcel_id);
  }

  return null;
}

function getParcelIdentityKey(props: ParcelProps) {
  return getParcelPnu(props) ?? getMinimalParcelFallbackKey(props);
}

function normalizeCadastralFeature(feature: CadastralFeature): CadastralFeature {
  const parcelId = getParcelIdentityKey(feature.properties ?? {});

  return {
    ...feature,
    properties: {
      ...(feature.properties ?? {}),
      _parcel_id: parcelId
    }
  };
}

function toParcelFeatureRecord(feature: CadastralFeature): ParcelFeatureRecord | null {
  const normalized = normalizeCadastralFeature(feature);
  const parcelId = normalized.properties._parcel_id ?? null;

  if (!parcelId) {
    return null;
  }

  const sourceParcelIdCandidate = getParcelPnu(normalized.properties);

  return {
    parcelId,
    sourceParcelId: sourceParcelIdCandidate === undefined || sourceParcelIdCandidate === null ? null : String(sourceParcelIdCandidate),
    geometry: normalized.geometry,
    properties: normalized.properties
  };
}

function getParcelSelectionKey(feature: CadastralFeature) {
  const props = feature.properties ?? {};
  return feature.properties?._parcel_id ?? getParcelIdentityKey(props);
}

function getClickedParcelFeatures(map: MapLibreMap, eventPoint: MapPoint): CadastralFeature[] {
  const rendered = map.queryRenderedFeatures(eventPoint, {
    layers: [CADASTRAL_HIT_LAYER_ID]
  }) as CadastralFeature[];

  return rendered.map(normalizeCadastralFeature);
}

function resolveClickedParcelFeature(
  map: MapLibreMap,
  event: MapClickEvent,
  sourceFeaturesByParcelId: Map<string, CadastralFeature>
) {
  const renderedCandidates = getClickedParcelFeatures(map, event.point);
  if (renderedCandidates.length === 0) {
    return null;
  }

  const clickedPoint = turfPoint([event.lngLat.lng, event.lngLat.lat]);
  const sourceBackedCandidates = renderedCandidates.map((candidate) => {
    const parcelId = getParcelSelectionKey(candidate);
    return parcelId ? sourceFeaturesByParcelId.get(parcelId) ?? candidate : candidate;
  });

  const containingCandidates = sourceBackedCandidates.filter((candidate) => {
    try {
      return booleanPointInPolygon(clickedPoint, candidate);
    } catch {
      return false;
    }
  });

  const resolvedCandidates = containingCandidates.length > 0 ? containingCandidates : sourceBackedCandidates;
  const dedupedCandidates = Array.from(
    resolvedCandidates.reduce((candidateMap, candidate) => {
      const selectionKey = getParcelSelectionKey(candidate);
      if (!selectionKey) {
        const fallbackKey = `__candidate__${candidateMap.size}`;
        candidateMap.set(fallbackKey, candidate);
        return candidateMap;
      }

      const current = candidateMap.get(selectionKey);
      if (!current) {
        candidateMap.set(selectionKey, candidate);
        return candidateMap;
      }

      try {
        if (turfArea(candidate) < turfArea(current)) {
          candidateMap.set(selectionKey, candidate);
        }
      } catch {
        // Keep the first safe candidate if area comparison fails.
      }

      return candidateMap;
    }, new Map<string, CadastralFeature>())
  ).map(([, candidate]) => candidate);

  return dedupedCandidates.reduce<CadastralFeature | null>((bestCandidate, candidate) => {
    if (!bestCandidate) {
      return candidate;
    }

    try {
      return turfArea(candidate) < turfArea(bestCandidate) ? candidate : bestCandidate;
    } catch {
      return bestCandidate;
    }
  }, null);
}

export function useZoneSelectionMap(params: {
  map: MapLibreMap | null;
  visibleFeatures: CadastralFeatureCollection;
  selectedInfoParcelId: string | null;
  onSelectInfoParcel: (parcel: ParcelProps) => void;
}) {
  const {
    state,
    toggleParcelSelection,
    syncSelectedParcels,
    addDrawVertex,
    completeDrawBoundary,
    setFeedback,
    isInteractionLocked
  } = useZoneSelection();
  const [hoverCoordinate, setHoverCoordinate] = useState<Position | null>(null);

  useEffect(() => {
    const selectedVisibleParcels = params.visibleFeatures.features
      .map((feature) => toParcelFeatureRecord(feature))
      .filter((record): record is ParcelFeatureRecord => Boolean(record));

    syncSelectedParcels(selectedVisibleParcels);
  }, [params.visibleFeatures, syncSelectedParcels]);

  const selectedParcelIds = useMemo(() => new Set(state.draft.selectedParcelIds), [state.draft.selectedParcelIds]);
  const sourceFeaturesByParcelId = useMemo(() => {
    const featureMap = new Map<string, CadastralFeature>();

    for (const feature of params.visibleFeatures.features) {
      const normalized = normalizeCadastralFeature(feature);
      const parcelId = normalized.properties._parcel_id ?? null;

      if (parcelId && !featureMap.has(parcelId)) {
        featureMap.set(parcelId, normalized);
      }
    }

    return featureMap;
  }, [params.visibleFeatures.features]);

  const decoratedVisibleFeatures = useMemo<CadastralFeatureCollection>(() => {
    const features = params.visibleFeatures.features.map((feature) => {
      const normalized = normalizeCadastralFeature(feature);
      const parcelId = normalized.properties._parcel_id ?? null;

      return {
        ...normalized,
        properties: {
          ...normalized.properties,
          _parcel_id: parcelId,
          _info_selected: parcelId !== null && params.selectedInfoParcelId === parcelId,
          _zone_selected: parcelId !== null && selectedParcelIds.has(parcelId)
        }
      };
    });

    return {
      type: "FeatureCollection",
      features
    };
  }, [params.selectedInfoParcelId, params.visibleFeatures, selectedParcelIds]);

  const visibleVertices = useMemo(
    () => extractCadastralVertices(decoratedVisibleFeatures.features),
    [decoratedVisibleFeatures.features]
  );

  const selectedParcelRecords = useMemo(
    () =>
      state.draft.selectedParcelIds
        .map((parcelId) => state.draft.parcelsById[parcelId])
        .filter((record): record is ParcelFeatureRecord => Boolean(record)),
    [state.draft.parcelsById, state.draft.selectedParcelIds]
  );

  const draftUnionGeometryCollection = useMemo(
    () =>
      createDraftUnionGeometryFeatureCollection({
        parcelRecords: selectedParcelRecords,
        drawnGeometries: state.draft.drawnGeometries
      }),
    [selectedParcelRecords, state.draft.drawnGeometries]
  );

  const drawGuideGeometryCollection = useMemo(
    () =>
      createDrawDraftGuideFeatureCollectionWithPreview(state.draft.drawVertices, {
        hoverCoordinate
      }),
    [hoverCoordinate, state.draft.drawVertices]
  );

  const draftGeometryCollection = useMemo<ZoneDraftGeometryFeatureCollection>(
    () => ({
      type: "FeatureCollection",
      features: [...draftUnionGeometryCollection.features, ...drawGuideGeometryCollection.features]
    }),
    [draftUnionGeometryCollection, drawGuideGeometryCollection]
  );

  const draftVertexCollection = useMemo(
    () => createDrawDraftVertexFeatureCollection(state.draft.drawVertices),
    [state.draft.drawVertices]
  );

  const confirmedZoneCollection = useMemo(
    () => createConfirmedZoneFeatureCollection(state.confirmedZone),
    [state.confirmedZone]
  );

  const isEditingWithParcelTool = state.status === "editing" && state.activeTool === "parcel";
  const isEditingWithDrawTool = state.status === "editing" && state.activeTool === "draw";

  const handleMapClick = (event: MapClickEvent) => {
    if (!params.map) {
      return;
    }

    if (isEditingWithParcelTool) {
      const pickedFeature = resolveClickedParcelFeature(params.map, event, sourceFeaturesByParcelId);
      if (!pickedFeature) {
        return;
      }

      const parcelRecord = toParcelFeatureRecord(pickedFeature);
      if (!parcelRecord) {
        return;
      }

      toggleParcelSelection(parcelRecord);
      return;
    }

    if (isEditingWithDrawTool) {
      const resolvedCoordinate = resolveDrawCoordinate({
        clickPoint: event.point,
        rawCoordinate: [event.lngLat.lng, event.lngLat.lat],
        vertices: visibleVertices,
        project: (coordinate) => params.map!.project([coordinate[0], coordinate[1]]),
        tolerancePx: 18
      });

      const nextVertex: DrawVertex = {
        id: `vertex-${Date.now()}-${state.draft.drawVertices.length + 1}`,
        coordinate: resolvedCoordinate.coordinate,
        sourceParcelId: resolvedCoordinate.sourceParcelId
      };

      addDrawVertex(nextVertex);
      setHoverCoordinate(null);
      return;
    }

    const pickedFeature = resolveClickedParcelFeature(params.map, event, sourceFeaturesByParcelId);
    if (!pickedFeature) {
      return;
    }

    params.onSelectInfoParcel(pickedFeature.properties);
  };

  const handleMapMouseMove = (event: MapClickEvent) => {
    if (!params.map || !isEditingWithDrawTool || state.draft.drawVertices.length === 0) {
      if (hoverCoordinate !== null) {
        setHoverCoordinate(null);
      }
      return;
    }

    const resolvedCoordinate = resolveDrawCoordinate({
      clickPoint: event.point,
      rawCoordinate: [event.lngLat.lng, event.lngLat.lat],
      vertices: visibleVertices,
      project: (coordinate) => params.map!.project([coordinate[0], coordinate[1]]),
      tolerancePx: 18
    });

    setHoverCoordinate(resolvedCoordinate.coordinate);
  };

  const handleMapContextMenu = (event: MapContextMenuEvent) => {
    if (!isEditingWithDrawTool) {
      return;
    }

    event.originalEvent?.preventDefault?.();
    completeDrawBoundary();
  };

  useEffect(() => {
    if (!isEditingWithDrawTool || state.draft.drawVertices.length === 0) {
      setHoverCoordinate(null);
    }
  }, [isEditingWithDrawTool, state.draft.drawVertices.length]);

  return {
    decoratedVisibleFeatures,
    draftGeometryCollection,
    draftVertexCollection,
    confirmedZoneCollection,
    handleMapClick,
    handleMapMouseMove,
    handleMapContextMenu,
    isInteractionLocked,
    isDrawModeActive: isEditingWithDrawTool,
    hasZoneSelectionDraft:
      state.draft.selectedParcelIds.length > 0 ||
      state.draft.drawnGeometries.length > 0 ||
      state.draft.drawVertices.length > 0 ||
      state.confirmedZone !== null
  };
}
