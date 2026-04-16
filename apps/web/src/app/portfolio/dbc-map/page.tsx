import { CollapsiblePanel } from "@/components/service/CollapsiblePanel";
import { MapModeControls } from "@/components/service/MapModeControls";

export default function DbcMapServicePage() {
  return (
    <section className="h-[calc(100vh-56px)] w-full">
      <div className="flex h-full w-full">
        <CollapsiblePanel />

        <div className="relative flex-1 overflow-hidden bg-[linear-gradient(to_right,rgba(205,214,236,0.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(205,214,236,0.2)_1px,transparent_1px)] bg-[size:32px_32px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(201,213,255,0.22),transparent_42%)]" />
          <MapModeControls />
          <p className="absolute left-6 top-6 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs text-slate-500 backdrop-blur">
            Map Area
          </p>
        </div>
      </div>
    </section>
  );
}
