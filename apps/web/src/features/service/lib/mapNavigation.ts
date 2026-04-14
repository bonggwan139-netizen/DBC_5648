import type { Map as MapLibreMap } from "maplibre-gl";

export function moveMapToResult(map: MapLibreMap | null, longitude: number, latitude: number): void {
  if (map === null) {
    return;
  }

  map.flyTo({
    center: [longitude, latitude],
    zoom: 15,
    essential: true
  });
}
