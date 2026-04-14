"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { requestMockSearch } from "../api/searchMock";
import type { MockSearchItem, SearchStatus } from "../types/search";
import styles from "./MapContainer.module.css";
import { MapResultPanel } from "./MapResultPanel";
import { MapSearchOverlay } from "./MapSearchOverlay";
import { MapStatusBar } from "./MapStatusBar";
import "maplibre-gl/dist/maplibre-gl.css";

const INITIAL_CENTER: [number, number] = [126.978, 37.5665];
const INITIAL_ZOOM = 12;

type MapContainerProps = {
  isSearchPanelOpen?: boolean;
  resultPanelHost?: HTMLDivElement | null;
};

export function MapContainer({ isSearchPanelOpen = true, resultPanelHost = null }: MapContainerProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [resultItem, setResultItem] = useState<MockSearchItem | null>(null);
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

      cleanup = () => {
        map.remove();
      };
    };

    void setupMap();

    return () => {
      cleanup?.();
    };
  }, []);

  const handleSearch = async () => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length === 0 || status === "loading") {
      return;
    }

    setStatus("loading");
    setErrorMessage(null);

    try {
      const response = await requestMockSearch(trimmedQuery);
      setResultItem(response.items[0] ?? null);
      setStatus("success");
    } catch {
      setResultItem(null);
      setStatus("error");
      setErrorMessage("검색 요청에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  const resultPanelNode = (
    <MapResultPanel
      status={status}
      resultItem={resultItem}
      errorMessage={errorMessage}
      docked
    />
  );

  return (
    <section className={styles.mapArea} aria-label="기본 지도 컨테이너">
      <div className={styles.topToolbar} aria-hidden="true">
        <button type="button">◻</button>
        <button type="button">✛</button>
        <button type="button">⌖</button>
      </div>

      <div ref={mapRef} className={styles.mapCanvas} />
      <MapSearchOverlay
        query={query}
        status={status}
        visible={isSearchPanelOpen}
        onQueryChange={setQuery}
        onSearch={handleSearch}
      />
      <MapStatusBar />

      {resultPanelHost ? createPortal(resultPanelNode, resultPanelHost) : resultPanelNode}
    </section>
  );
}
