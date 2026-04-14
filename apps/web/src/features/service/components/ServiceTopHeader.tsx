import styles from "./ServiceTopHeader.module.css";

export function ServiceTopHeader() {
  return (
    <header className={styles.topHeader}>
      <div>
        <p className={styles.eyebrow}>지도 기반 토지분석</p>
        <h2 className={styles.title}>분석 서비스 워크스페이스</h2>
      </div>
      <div className={styles.headerStatus}>초기 골격 단계</div>
    </header>
  );
}
