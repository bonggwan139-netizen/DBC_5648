"use client";

import { createContext, type ReactNode, useCallback, useContext, useMemo, useReducer, useRef } from "react";
import { createDrawGeometryRecord, createFinalizedDraftZone } from "./zoneSelectionGeometry";
import type {
  DrawGeometryRecord,
  DrawVertex,
  ParcelFeatureRecord,
  ZoneDraftSnapshot,
  ZoneSelectionState,
  ZoneSelectionTool
} from "./zoneSelectionTypes";

type ZoneSelectionContextValue = {
  state: ZoneSelectionState;
  activateTool: (tool: ZoneSelectionTool) => void;
  toggleParcelSelection: (parcel: ParcelFeatureRecord) => void;
  syncSelectedParcels: (parcels: ParcelFeatureRecord[]) => void;
  addDrawVertex: (vertex: DrawVertex) => void;
  completeDrawBoundary: () => void;
  undoSelection: () => void;
  cancelSelection: () => void;
  confirmSelection: () => void;
  setFeedback: (message: string | null) => void;
  isInteractionLocked: boolean;
};

type ZoneSelectionAction =
  | { type: "ACTIVATE_TOOL"; tool: ZoneSelectionTool }
  | { type: "TOGGLE_PARCEL"; parcel: ParcelFeatureRecord }
  | { type: "SYNC_SELECTED_PARCELS"; parcels: ParcelFeatureRecord[] }
  | { type: "ADD_DRAW_VERTEX"; vertex: DrawVertex }
  | { type: "COMPLETE_DRAW"; geometry: DrawGeometryRecord }
  | { type: "UNDO" }
  | { type: "CANCEL" }
  | { type: "CONFIRM_SUCCESS"; zone: NonNullable<ZoneSelectionState["confirmedZone"]> }
  | { type: "SET_FEEDBACK"; message: string | null };

function createEmptyDraft(): ZoneSelectionState["draft"] {
  return {
    selectedParcelIds: [],
    parcelsById: {},
    drawnGeometries: [],
    drawVertices: [],
    history: []
  };
}

function createInitialState(): ZoneSelectionState {
  return {
    status: "idle",
    activeTool: null,
    draft: createEmptyDraft(),
    confirmedZone: null,
    feedback: null
  };
}

function cloneDraftSnapshot(snapshot: ZoneDraftSnapshot): ZoneDraftSnapshot {
  return {
    selectedParcelIds: [...snapshot.selectedParcelIds],
    parcelsById: { ...snapshot.parcelsById },
    drawnGeometries: snapshot.drawnGeometries.map((record) => ({
      ...record,
      geometry: JSON.parse(JSON.stringify(record.geometry))
    })),
    drawVertices: snapshot.drawVertices.map((vertex) => ({
      ...vertex,
      coordinate: [...vertex.coordinate]
    }))
  };
}

function snapshotFromState(state: ZoneSelectionState): ZoneDraftSnapshot {
  return cloneDraftSnapshot({
    selectedParcelIds: state.draft.selectedParcelIds,
    parcelsById: state.draft.parcelsById,
    drawnGeometries: state.draft.drawnGeometries,
    drawVertices: state.draft.drawVertices
  });
}

function restoreDraft(snapshot: ZoneDraftSnapshot, history: ZoneDraftSnapshot[]): ZoneSelectionState["draft"] {
  const restored = cloneDraftSnapshot(snapshot);
  return {
    ...restored,
    history
  };
}

function reducer(state: ZoneSelectionState, action: ZoneSelectionAction): ZoneSelectionState {
  switch (action.type) {
    case "ACTIVATE_TOOL":
      if (state.status === "editing" && state.activeTool === action.tool) {
        return {
          ...state,
          feedback: null
        };
      }

      if (state.status === "confirmed") {
        return {
          ...createInitialState(),
          status: "editing",
          activeTool: action.tool
        };
      }

      return {
        ...state,
        status: "editing",
        activeTool: action.tool,
        confirmedZone: null,
        feedback: null
      };

    case "TOGGLE_PARCEL": {
      if (state.status !== "editing" || state.activeTool !== "parcel") {
        return state;
      }

      const snapshot = snapshotFromState(state);
      const isSelected = state.draft.selectedParcelIds.includes(action.parcel.parcelId);

      if (isSelected) {
        const nextSelectedIds = state.draft.selectedParcelIds.filter((parcelId) => parcelId !== action.parcel.parcelId);
        const nextParcelsById = { ...state.draft.parcelsById };
        delete nextParcelsById[action.parcel.parcelId];

        return {
          ...state,
          draft: {
            ...state.draft,
            selectedParcelIds: nextSelectedIds,
            parcelsById: nextParcelsById,
            history: [...state.draft.history, snapshot]
          },
          feedback: null
        };
      }

      return {
        ...state,
        draft: {
          ...state.draft,
          selectedParcelIds: [...state.draft.selectedParcelIds, action.parcel.parcelId],
          parcelsById: {
            ...state.draft.parcelsById,
            [action.parcel.parcelId]: action.parcel
          },
          history: [...state.draft.history, snapshot]
        },
        feedback: null
      };
    }

    case "SYNC_SELECTED_PARCELS": {
      if (state.draft.selectedParcelIds.length === 0 || action.parcels.length === 0) {
        return state;
      }

      let hasChanges = false;
      const nextParcelsById = { ...state.draft.parcelsById };

      action.parcels.forEach((parcel) => {
        if (!state.draft.selectedParcelIds.includes(parcel.parcelId)) {
          return;
        }

        const current = state.draft.parcelsById[parcel.parcelId];
        if (
          !current ||
          JSON.stringify(current.geometry) !== JSON.stringify(parcel.geometry) ||
          JSON.stringify(current.properties) !== JSON.stringify(parcel.properties)
        ) {
          nextParcelsById[parcel.parcelId] = parcel;
          hasChanges = true;
        }
      });

      if (!hasChanges) {
        return state;
      }

      return {
        ...state,
        draft: {
          ...state.draft,
          parcelsById: nextParcelsById
        }
      };
    }

    case "ADD_DRAW_VERTEX": {
      if (state.status !== "editing" || state.activeTool !== "draw") {
        return state;
      }

      const lastVertex = state.draft.drawVertices[state.draft.drawVertices.length - 1];
      if (
        lastVertex &&
        lastVertex.coordinate[0] === action.vertex.coordinate[0] &&
        lastVertex.coordinate[1] === action.vertex.coordinate[1]
      ) {
        return {
          ...state,
          feedback: null
        };
      }

      const snapshot = snapshotFromState(state);

      return {
        ...state,
        draft: {
          ...state.draft,
          drawVertices: [...state.draft.drawVertices, action.vertex],
          history: [...state.draft.history, snapshot]
        },
        feedback: null
      };
    }

    case "COMPLETE_DRAW": {
      if (state.status !== "editing" || state.activeTool !== "draw") {
        return state;
      }

      const snapshot = snapshotFromState(state);

      return {
        ...state,
        draft: {
          ...state.draft,
          drawnGeometries: [...state.draft.drawnGeometries, action.geometry],
          drawVertices: [],
          history: [...state.draft.history, snapshot]
        },
        feedback: null
      };
    }

    case "UNDO": {
      const lastSnapshot = state.draft.history[state.draft.history.length - 1];
      if (!lastSnapshot) {
        return state;
      }

      return {
        ...state,
        draft: restoreDraft(lastSnapshot, state.draft.history.slice(0, -1)),
        feedback: null
      };
    }

    case "CANCEL":
      return createInitialState();

    case "CONFIRM_SUCCESS":
      return {
        ...createInitialState(),
        status: "confirmed",
        confirmedZone: action.zone
      };

    case "SET_FEEDBACK":
      return {
        ...state,
        feedback: action.message
      };

    default:
      return state;
  }
}

const ZoneSelectionContext = createContext<ZoneSelectionContextValue | null>(null);

export function ZoneSelectionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const actionLocksRef = useRef<Record<string, boolean>>({
    confirm: false,
    undo: false,
    cancel: false,
    completeDraw: false
  });

  const runGuardedAction = useCallback((key: keyof typeof actionLocksRef.current, action: () => void) => {
    if (actionLocksRef.current[key]) {
      return;
    }

    actionLocksRef.current[key] = true;

    try {
      action();
    } finally {
      queueMicrotask(() => {
        actionLocksRef.current[key] = false;
      });
    }
  }, []);

  const activateTool = useCallback((tool: ZoneSelectionTool) => {
    dispatch({ type: "ACTIVATE_TOOL", tool });
  }, []);

  const toggleParcelSelection = useCallback((parcel: ParcelFeatureRecord) => {
    dispatch({ type: "TOGGLE_PARCEL", parcel });
  }, []);

  const syncSelectedParcels = useCallback((parcels: ParcelFeatureRecord[]) => {
    dispatch({ type: "SYNC_SELECTED_PARCELS", parcels });
  }, []);

  const addDrawVertex = useCallback((vertex: DrawVertex) => {
    dispatch({ type: "ADD_DRAW_VERTEX", vertex });
  }, []);

  const completeDrawBoundary = useCallback(() => {
    runGuardedAction("completeDraw", () => {
      if (state.status !== "editing" || state.activeTool !== "draw") {
        return;
      }

      if (state.draft.drawVertices.length < 3) {
        dispatch({
          type: "SET_FEEDBACK",
          message: "경계를 마감하려면 최소 3개의 점이 필요합니다."
        });
        return;
      }

      const geometryRecord = createDrawGeometryRecord(state.draft.drawVertices);
      if (!geometryRecord) {
        dispatch({
          type: "SET_FEEDBACK",
          message: "유효한 그리기 경계를 만들 수 없습니다."
        });
        return;
      }

      dispatch({ type: "COMPLETE_DRAW", geometry: geometryRecord });
    });
  }, [runGuardedAction, state]);

  const undoSelection = useCallback(() => {
    runGuardedAction("undo", () => {
      dispatch({ type: "UNDO" });
    });
  }, [runGuardedAction]);

  const cancelSelection = useCallback(() => {
    runGuardedAction("cancel", () => {
      dispatch({ type: "CANCEL" });
    });
  }, [runGuardedAction]);

  const setFeedback = useCallback((message: string | null) => {
    dispatch({ type: "SET_FEEDBACK", message });
  }, []);

  const confirmSelection = useCallback(() => {
    runGuardedAction("confirm", () => {
      if (state.status !== "editing") {
        return;
      }

      if (state.draft.drawVertices.length > 0) {
        dispatch({
          type: "SET_FEEDBACK",
          message: "그리는 중인 경계를 먼저 마감하거나 되돌려 주세요."
        });
        return;
      }

      const parcelRecords = state.draft.selectedParcelIds
        .map((parcelId) => state.draft.parcelsById[parcelId])
        .filter((record): record is ParcelFeatureRecord => Boolean(record));
      const hasDraftContent = parcelRecords.length > 0 || state.draft.drawnGeometries.length > 0;

      if (!hasDraftContent) {
        dispatch({
          type: "SET_FEEDBACK",
          message: "확정할 구역 초안을 먼저 만들어 주세요."
        });
        return;
      }

      const finalizedZone = createFinalizedDraftZone({
        parcelRecords,
        drawnGeometries: state.draft.drawnGeometries
      });

      if (!finalizedZone) {
        dispatch({
          type: "SET_FEEDBACK",
          message: "현재 초안으로는 유효한 구역을 만들 수 없습니다."
        });
        return;
      }

      dispatch({
        type: "CONFIRM_SUCCESS",
        zone: finalizedZone
      });
    });
  }, [runGuardedAction, state]);

  const value = useMemo<ZoneSelectionContextValue>(
    () => ({
      state,
      activateTool,
      toggleParcelSelection,
      syncSelectedParcels,
      addDrawVertex,
      completeDrawBoundary,
      undoSelection,
      cancelSelection,
      confirmSelection,
      setFeedback,
      isInteractionLocked: state.status === "editing"
    }),
    [
      activateTool,
      addDrawVertex,
      cancelSelection,
      completeDrawBoundary,
      confirmSelection,
      setFeedback,
      state,
      syncSelectedParcels,
      toggleParcelSelection,
      undoSelection
    ]
  );

  return <ZoneSelectionContext.Provider value={value}>{children}</ZoneSelectionContext.Provider>;
}

export function useZoneSelection() {
  const context = useContext(ZoneSelectionContext);

  if (!context) {
    throw new Error("useZoneSelection must be used within a ZoneSelectionProvider.");
  }

  return context;
}
