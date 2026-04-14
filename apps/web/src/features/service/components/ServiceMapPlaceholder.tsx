import styles from "./ServiceLayout.module.css";

export function ServiceMapPlaceholder() {
  return (
    <section className={styles.mapArea} aria-label="지도 영역 플레이스홀더">
      <div className={styles.mapPlaceholderBox}>
        <p>Map Placeholder</p>
        <small>향후 지도 라이브러리와 분석 오버레이를 연결할 메인 캔버스</small>
      </div>
    </section>
  );
}
