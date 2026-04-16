import { CollapsiblePanel } from "@/components/service/CollapsiblePanel";
import { MapViewport } from "@/components/service/MapViewport";

export default function DbcMapServicePage() {
  return (
    <section className="h-[calc(100vh-56px)] w-full">
      <div className="flex h-full w-full">
        <CollapsiblePanel />

        <div className="relative flex-1 overflow-hidden">
          <MapViewport />
        </div>
      </div>
    </section>
  );
}
