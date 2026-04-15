type FlyToMap = {
  flyTo: (options: { center: [number, number]; zoom: number; essential?: boolean }) => void;
};

export function moveMapToResult(map: FlyToMap | null, longitude: number, latitude: number): void {
  if (map === null) {
    return;
  }

  map.flyTo({
    center: [longitude, latitude],
    zoom: 15,
    essential: true
  });
}
