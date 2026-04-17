import type { WorkspaceMode } from "./types";

type Props = {
  mode: WorkspaceMode;
  onChange: (mode: WorkspaceMode) => void;
};

export function MapModeSwitch({ mode, onChange }: Props) {
  return (
    <div className="absolute left-6 top-5 z-10 flex w-[154px] items-center gap-1 rounded-[14px] border border-slate-200 bg-white/92 p-[2px] shadow-sm backdrop-blur">
      <button
        type="button"
        onClick={() => onChange("map2d")}
        className={`flex-1 rounded-full px-3 py-0.5 text-[11px] font-semibold leading-5 transition ${
          mode === "map2d" ? "bg-slate-900 text-white" : "bg-transparent text-slate-600 hover:bg-slate-100"
        }`}
      >
        2D지도
      </button>
      <button
        type="button"
        onClick={() => onChange("map3d")}
        className={`flex-1 rounded-full px-3 py-0.5 text-[11px] font-semibold leading-5 transition ${
          mode === "map3d" ? "bg-slate-900 text-white" : "bg-transparent text-slate-600 hover:bg-slate-100"
        }`}
      >
        3D지도
      </button>
    </div>
  );
}
