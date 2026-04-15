"use client";

import { useState } from "react";
import styles from "./ServiceLayout.module.css";
import { MapContainer } from "./MapContainer";
import { MapResultPanel } from "./MapResultPanel";
import { ServiceSidebar } from "./ServiceSidebar";

export function ServiceLayout() {
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false);

  return (
    <section
      className={styles.workspace}
      aria-label="도시계획 분석 워크스페이스"
      data-left-collapsed={isLeftCollapsed}
      data-right-collapsed={isRightCollapsed}
    >
      <aside className={styles.leftPane}>
        <ServiceSidebar onOpenSearchPanel={() => setIsSearchPanelOpen(true)} />
        <button
          type="button"
          className={styles.leftToggle}
          onClick={() => setIsLeftCollapsed((prev) => !prev)}
          aria-label="좌측 패널 접기/펼치기"
        >
          {isLeftCollapsed ? "›" : "‹"}
        </button>
      </aside>

      <MapContainer
        isSearchPanelOpen={isSearchPanelOpen}
        onCloseSearchPanel={() => setIsSearchPanelOpen(false)}
      />

      <aside className={styles.rightPane}>
        <MapResultPanel />
        <button
          type="button"
          className={styles.rightToggle}
          onClick={() => setIsRightCollapsed((prev) => !prev)}
          aria-label="우측 패널 접기/펼치기"
        >
          {isRightCollapsed ? "‹" : "›"}
        </button>
      </aside>
    </section>
  );
}
