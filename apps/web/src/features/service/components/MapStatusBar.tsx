import styles from "./MapOverlay.module.css";

export function MapStatusBar() {
  return (
    <section className={styles.statusBar} aria-label="지도 상태 정보">
      <span>좌표: ---, ---</span>
      <span>축척: 1:---</span>
      <span>상태: 대기</span>
    </section>
  );
}
