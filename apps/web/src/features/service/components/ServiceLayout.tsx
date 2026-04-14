"use client";

import { useState } from "react";
import styles from "./ServiceLayout.module.css";
import { MapContainer } from "./MapContainer";
import { ServiceSidebar } from "./ServiceSidebar";

const resultCards = ["분석 요약", "결과 요약", "추가 정보"];

export function ServiceLayout() {
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

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
          <ServiceSidebar />
        </div>
      </aside>

      <main className={styles.serviceMapStage}>
        <MapContainer />
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
          <h3 className={styles.resultPanelTitle}>결과 패널</h3>
          <div className={styles.resultCardList}>
            {resultCards.map((title) => (
              <article key={title} className={styles.resultCard}>
                <h4>{title}</h4>
                <p>분석 실행 후 데이터가 표시됩니다.</p>
              </article>
            ))}
          </div>
        </div>
      </aside>
    </section>
  );
}
