"use client";

import { useZoneSelection } from "./zoneSelectionState";

function getModeBadgeLabel(status: ReturnType<typeof useZoneSelection>["state"]["status"]) {
  switch (status) {
    case "editing":
      return "EDITING";
    case "confirmed":
      return "CONFIRMED";
    default:
      return "IDLE";
  }
}

export function useZoneSelectionPanel() {
  const { state, activateTool, undoSelection, cancelSelection, confirmSelection } = useZoneSelection();

  const selectedParcelCount = state.draft.selectedParcelIds.length;
  const drawnGeometryCount = state.draft.drawnGeometries.length;
  const drawVertexCount = state.draft.drawVertices.length;

  let detailLabel = "";
  if (state.status === "editing") {
    const activeToolLabel = state.activeTool === "draw" ? "그리기" : "필지";
    const parcelSummary = selectedParcelCount > 0 ? `필지 ${selectedParcelCount}개` : "필지 없음";
    const drawSummary = drawnGeometryCount > 0 ? `그린 경계 ${drawnGeometryCount}개` : "그린 경계 없음";

    if (state.activeTool === "draw" && drawVertexCount > 0) {
      detailLabel = `${activeToolLabel} 편집 중, ${parcelSummary}, ${drawSummary}, 현재 점 ${drawVertexCount}개`;
    } else {
      detailLabel = `${activeToolLabel} 편집 중, ${parcelSummary}, ${drawSummary}`;
    }
  }

  if (state.status === "confirmed" && state.confirmedZone) {
    detailLabel = "확정된 구역 객체가 준비되었습니다.";
  }

  const canUndo = state.status === "editing" && state.draft.history.length > 0;
  const canConfirm =
    state.status === "editing" &&
    state.draft.drawVertices.length === 0 &&
    (selectedParcelCount > 0 || drawnGeometryCount > 0);
  const canCancel =
    state.status !== "idle" ||
    selectedParcelCount > 0 ||
    drawnGeometryCount > 0 ||
    drawVertexCount > 0 ||
    state.confirmedZone !== null;

  return {
    state,
    modeBadgeLabel: getModeBadgeLabel(state.status),
    detailLabel,
    feedback: state.feedback,
    isParcelActive: state.status === "editing" && state.activeTool === "parcel",
    isDrawActive: state.status === "editing" && state.activeTool === "draw",
    canUndo,
    canConfirm,
    canCancel,
    activateParcelMode: () => activateTool("parcel"),
    activateDrawMode: () => activateTool("draw"),
    undoSelection,
    cancelSelection,
    confirmSelection
  };
}
