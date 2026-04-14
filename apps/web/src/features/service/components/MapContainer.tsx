"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import { requestMockSearch } from "../api/searchMock";
import { moveMapToResult } from "../lib/mapNavigation";
import type { MockSearchItem, SearchStatus } from "../types/search";
import styles from "./MapContainer.module.css";
import { MapResultPanel } from "./MapResultPanel";
import { MapSearchOverlay } from "./MapSearchOverlay";
import { MapStatusBar } from "./MapStatusBar";
import "maplibre-gl/dist/maplibre-gl.css";

const INITIAL_CENTER: [number, number] = [126.978, 37.5665];
const INITIAL_ZOOM = 12;

export function MapContainer() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<MapLibreMap | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [results, setResults] = useState<MockSearchItem[]>([]);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const handleSelectResult = (item: MockSearchItem) => {
    setSelectedResultId(item.id);
    moveMapToResult(mapInstanceRef.current, item.longitude, item.latitude);
  };

  const handleSearch = async () => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length === 0 || status === "loading") {
      return;
    }

    setStatus("loading");
    setErrorMessage(null);

    try {
      const response = await requestMockSearch(trimmedQuery);
      setResults(response.items);
      setSelectedResultId(null);
      setStatus("success");
    } catch {
      setResults([]);
      setSelectedResultId(null);
      setStatus("error");
      setErrorMessage("검색 요청에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  return (
    <section className={styles.mapArea} aria-label="기본 지도 컨테이너">
      <div className={styles.topToolbar} aria-hidden="true">
        <button type="button">◻</button>
        <button type="button">✛</button>
        <button type="button">⌖</button>
      </div>
      <div className={styles.rightControls} aria-hidden="true">
        <button type="button">+</button>
        <button type="button">−</button>
        <button type="button">☰</button>
      </div>
      <div className={styles.selectionArea} aria-hidden="true" />

      <div ref={mapRef} className={styles.mapCanvas} />
      <MapSearchOverlay
        query={query}
        status={status}
        onQueryChange={setQuery}
        onSearch={handleSearch}
      />
      <MapResultPanel
        status={status}
        results={results}
        selectedResultId={selectedResultId}
        onSelectResult={handleSelectResult}
        errorMessage={errorMessage}
      />
      <MapStatusBar />
    </section>
  );
}
