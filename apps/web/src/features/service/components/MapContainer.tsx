import styles from "./MapContainer.module.css";

export function MapContainer() {
  return (
    <section className={styles.mapArea} aria-label="지도 컨테이너 플레이스홀더">
      <div className={styles.mapPlaceholderBox}>
        <p>Map Container Placeholder</p>
        <small>다음 단계에서 실제 지도 라이브러리 캔버스가 연결될 영역</small>
      </div>
    </section>
  );
}
