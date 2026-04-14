"use client";

import { useEffect, useRef } from "react";
import styles from "./MapContainer.module.css";
import "maplibre-gl/dist/maplibre-gl.css";

const INITIAL_CENTER: [number, number] = [126.978, 37.5665];
const INITIAL_ZOOM = 12;

const TOOL_BUTTONS = ["✥", "⬠", "↕", "◧"];
const MAP_CONTROLS = ["＋", "－", "◎"];

export function MapContainer() {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    let cleanup: (() => void) | undefined;

    const setupMap = async () => {
      const maplibregl = (await import("maplibre-gl")).default;

      const map = new maplibregl.Map({
        container: mapRef.current as HTMLDivElement,
        style: "https://demotiles.maplibre.org/style.json",
        center: INITIAL_CENTER,
        zoom: INITIAL_ZOOM
      });

      cleanup = () => {
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

      <div className={styles.rightControls} aria-label="지도 컨트롤">
        {MAP_CONTROLS.map((control) => (
          <button key={control} type="button" className={styles.controlButton}>
            {control}
          </button>
        ))}
      </div>

      <div className={styles.selectionPreview} aria-hidden="true" />
    </section>
  );
}
