"use client";

import { useEffect, useRef } from "react";
import styles from "./MapContainer.module.css";
import "maplibre-gl/dist/maplibre-gl.css";

const INITIAL_CENTER: [number, number] = [126.978, 37.5665];
const INITIAL_ZOOM = 12;

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

      map.addControl(new maplibregl.NavigationControl(), "top-right");

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
    <section className={styles.mapArea} aria-label="기본 지도 컨테이너">
      <div ref={mapRef} className={styles.mapCanvas} />
    </section>
  );
}
