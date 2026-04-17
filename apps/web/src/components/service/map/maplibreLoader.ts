export type MapLibreMap = {
  addControl: (control: unknown, position?: string) => void;
  addLayer: (layer: Record<string, unknown>) => void;
  addSource: (id: string, source: Record<string, unknown>) => void;
  getBounds: () => {
    getWest: () => number;
    getSouth: () => number;
    getEast: () => number;
    getNorth: () => number;
  };
  getSource: (id: string) =>
    | {
        setData: (data: GeoJSON.FeatureCollection) => void;
      }
    | undefined;
  on: (...args: unknown[]) => void;
  remove: () => void;
  setLayoutProperty: (layerId: string, name: string, value: string) => void;
};

export type MapLibreNamespace = {
  Map: new (options: Record<string, unknown>) => MapLibreMap;
  NavigationControl: new (options?: Record<string, unknown>) => unknown;
};

declare global {
  interface Window {
    maplibregl?: MapLibreNamespace;
  }
}

export async function loadMapLibre() {
  if (window.maplibregl) {
    return window.maplibregl;
  }

  const existingCss = document.querySelector('link[data-maplibre="true"]');
  if (!existingCss) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/maplibre-gl@5.9.0/dist/maplibre-gl.css";
    link.dataset.maplibre = "true";
    document.head.appendChild(link);
  }

  await new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-maplibre="true"]');

    if (existingScript) {
      if (window.maplibregl) {
        resolve();
        return;
      }

      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("MapLibre script load failed")), {
        once: true
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/maplibre-gl@5.9.0/dist/maplibre-gl.js";
    script.async = true;
    script.dataset.maplibre = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("MapLibre script load failed"));
    document.body.appendChild(script);
  });

  if (!window.maplibregl) {
    throw new Error("MapLibre is unavailable");
  }

  return window.maplibregl;
}
