import { useMemo, useState } from "react";

type ZoneStep = {
  id: number;
  type: "parcel" | "draw";
};

export function useZoneSelectionState() {
  const [steps, setSteps] = useState<ZoneStep[]>([]);

  const addMockStep = (type: ZoneStep["type"]) => {
    setSteps((prev) => [...prev, { id: Date.now(), type }]);
  };

  const undoLast = () => {
    setSteps((prev) => prev.slice(0, -1));
  };

  const clearAll = () => {
    setSteps([]);
  };

  const confirmSelection = () => {
    // TODO: API 연동 시 여기서 구역계 확정 처리
    // (현재는 UI 상태만 유지)
  };

  const statusLabel = useMemo(() => {
    if (steps.length === 0) {
      return "선택 대기";
    }

    return `${steps.length}개 단계 선택됨`;
  }, [steps.length]);

  return {
    steps,
    statusLabel,
    addMockStep,
    undoLast,
    clearAll,
    confirmSelection,
    canUndo: steps.length > 0,
    canConfirm: steps.length > 0,
    canCancel: steps.length > 0
  };
}
