"use client";

import { useEffect, useRef } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import styles from "./MapContainer.module.css";
import { MapSearchOverlay } from "./MapSearchOverlay";
import "maplibre-gl/dist/maplibre-gl.css";

const INITIAL_CENTER: [number, number] = [126.978, 37.5665];
const INITIAL_ZOOM = 12;

const TOOL_BUTTONS = ["✥", "⬠", "↕", "◧"];

type MapContainerProps = {
  isSearchPanelOpen: boolean;
  onCloseSearchPanel: () => void;
};

export function MapContainer({ isSearchPanelOpen, onCloseSearchPanel }: MapContainerProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<MapLibreMap | null>(null);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    let cleanup: (() => void) | undefined;

    const setupMap = async () => {
      const maplibregl = await import("maplibre-gl");

      const map = new maplibregl.Map({
        container: mapRef.current as HTMLDivElement,
        style: "https://demotiles.maplibre.org/style.json",
        center: INITIAL_CENTER,
        zoom: INITIAL_ZOOM
      });

      map.addControl(new maplibregl.NavigationControl(), "top-right");
      mapInstanceRef.current = map;

      cleanup = () => {
        mapInstanceRef.current = null;
        map.remove();
      };
    };

    void setupMap();

    return () => {
      cleanup?.();
    };
  }, []);

  return (
    <section className={styles.mapArea} aria-label="지도 분석 영역">
      <div ref={mapRef} className={styles.mapCanvas} />

      <div className={styles.topToolbar} aria-label="지도 상단 도구">
        {TOOL_BUTTONS.map((tool) => (
          <button key={tool} type="button" className={styles.toolbarButton}>
            {tool}
          </button>
        ))}
      </div>

      <MapSearchOverlay isOpen={isSearchPanelOpen} onClose={onCloseSearchPanel} />
    </section>
  );
}
