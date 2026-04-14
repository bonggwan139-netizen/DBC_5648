"use client";

import { useState } from "react";
import styles from "./ServiceLayout.module.css";
import { MapContainer } from "./MapContainer";
import { ServiceSidebar } from "./ServiceSidebar";

export function ServiceLayout() {
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false);
  const [resultPanelHost, setResultPanelHost] = useState<HTMLDivElement | null>(null);

  return (
    <section className={styles.serviceShell}>
      <aside className={`${styles.serviceLeftPanel} ${leftCollapsed ? styles.collapsed : ""}`}>
        <button
          className={`${styles.toggleButton} ${styles.leftToggle}`}
          type="button"
          onClick={() => setLeftCollapsed((prev) => !prev)}
          aria-label={leftCollapsed ? "좌측 패널 펼치기" : "좌측 패널 접기"}
        >
          {leftCollapsed ? ">" : "<"}
        </button>
        <div className={styles.panelInner}>
          <ServiceSidebar
            isSearchPanelOpen={isSearchPanelOpen}
            onToggleSearchPanel={() => setIsSearchPanelOpen((prev) => !prev)}
          />
        </div>
      </aside>

      <main className={styles.serviceMapStage}>
        <MapContainer
          isSearchPanelOpen={isSearchPanelOpen}
          resultPanelHost={resultPanelHost}
        />
      </main>

      <aside className={`${styles.serviceRightPanel} ${rightCollapsed ? styles.collapsed : ""}`}>
        <button
          className={`${styles.toggleButton} ${styles.rightToggle}`}
          type="button"
          onClick={() => setRightCollapsed((prev) => !prev)}
          aria-label={rightCollapsed ? "우측 패널 펼치기" : "우측 패널 접기"}
        >
          {rightCollapsed ? "<" : ">"}
        </button>
        <div className={styles.panelInner}>
          <div ref={setResultPanelHost} className={styles.resultPanelHost} />
        </div>
      </aside>
    </section>
  );
}
