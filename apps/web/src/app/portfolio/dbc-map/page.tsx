import { CollapsiblePanel } from "@/components/service/CollapsiblePanel";
import { MapView } from "@/components/service/MapView";
import { MapSearchProvider } from "@/components/service/map/search/mapSearchState";
import { ZoneSelectionProvider } from "@/components/service/map/zone-selection/zoneSelectionState";

export default function DbcMapServicePage() {
  return (
    <section className="h-[calc(100vh-56px)] w-full">
      <MapSearchProvider>
        <ZoneSelectionProvider>
          <div className="flex h-full w-full">
            <CollapsiblePanel />

            <div className="relative flex-1 overflow-hidden">
              <MapView />
            </div>
          </div>
        </ZoneSelectionProvider>
      </MapSearchProvider>
    </section>
  );
}
