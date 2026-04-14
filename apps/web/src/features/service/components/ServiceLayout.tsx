"use client";

import { useState } from "react";
import styles from "./ServiceLayout.module.css";
import { MapContainer } from "./MapContainer";
import { ServiceSidebar } from "./ServiceSidebar";

const summaryCards = [
  { title: "분석 요약", desc: "선택 영역의 기본 지표와 요약 결과가 표시됩니다." },
  { title: "결과 카드", desc: "용도지역, 인접 인프라, 개발 가능성 결과가 표시됩니다." },
  { title: "추가 정보", desc: "규제/행정 참고 정보와 후속 검토 항목이 표시됩니다." }
];

export function ServiceLayout() {
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  return (
    <section className={styles.workspace}>
      <div className={`${styles.leftPanel} ${leftCollapsed ? styles.collapsed : ""}`}>
        <button
          className={`${styles.toggleBtn} ${styles.leftToggle}`}
          onClick={() => setLeftCollapsed((prev) => !prev)}
          type="button"
          aria-label={leftCollapsed ? "좌측 패널 펼치기" : "좌측 패널 접기"}
        >
          {leftCollapsed ? ">" : "<"}
        </button>
        {!leftCollapsed && <ServiceSidebar />}
      </div>

      <div className={styles.mapCenter}>
        <MapContainer />
      </div>

      <div className={`${styles.rightPanel} ${rightCollapsed ? styles.collapsed : ""}`}>
        <button
          className={`${styles.toggleBtn} ${styles.rightToggle}`}
          onClick={() => setRightCollapsed((prev) => !prev)}
          type="button"
          aria-label={rightCollapsed ? "우측 패널 펼치기" : "우측 패널 접기"}
        >
          {rightCollapsed ? "<" : ">"}
        </button>
        {!rightCollapsed && (
          <div className={styles.resultCards}>
            {summaryCards.map((card) => (
              <article key={card.title} className={styles.resultCard}>
                <h3>{card.title}</h3>
                <p>{card.desc}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
