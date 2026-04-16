import type { WorkspaceMode } from "./types";

type Props = {
  mode: WorkspaceMode;
  onChange: (mode: WorkspaceMode) => void;
};

export function MapModeSwitch({ mode, onChange }: Props) {
  return (
    <div className="absolute right-6 top-6 z-10 flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 p-1 shadow-sm backdrop-blur">
      <button
        type="button"
        onClick={() => onChange("map2d")}
        className={`rounded-full px-3 py-1 text-xs font-medium transition ${
          mode === "map2d" ? "bg-slate-900 text-white" : "bg-transparent text-slate-600 hover:bg-slate-100"
        }`}
      >
        2D지도
      </button>
      <button
        type="button"
        onClick={() => onChange("map3d")}
        className={`rounded-full px-3 py-1 text-xs font-medium transition ${
          mode === "map3d" ? "bg-slate-900 text-white" : "bg-transparent text-slate-600 hover:bg-slate-100"
        }`}
      >
        3D지도
      </button>
    </div>
  );
}
