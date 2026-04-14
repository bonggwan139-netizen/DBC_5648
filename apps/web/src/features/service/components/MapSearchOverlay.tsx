import styles from "./MapOverlay.module.css";

export function MapSearchOverlay() {
  return (
    <section className={styles.searchPanel} aria-label="토지분석 검색">
      <div className={styles.searchRow}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="주소 또는 지번을 입력하세요"
          aria-label="주소 또는 지번 입력"
        />
        <button className={styles.searchButton} type="button">
          검색
        </button>
      </div>
      <p className={styles.searchPlaceholder}>검색 결과 영역은 다음 단계에서 연결됩니다.</p>
    </section>
  );
}
