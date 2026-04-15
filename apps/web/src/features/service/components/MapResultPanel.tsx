import styles from "./MapResultPanel.module.css";

export function MapResultPanel() {
  return (
    <aside className={styles.resultPanel} aria-label="분석 결과 패널">
      <div className={styles.emptyState}>분석을 실행하면 결과가 이 패널에 표시됩니다.</div>

      <article className={styles.resultCard}>
        <h3>분석 요약</h3>
        <div className={styles.valueGroup}>
          <p className={styles.label}>면적</p>
          <p className={styles.value}>0 ㎡</p>
        </div>
        <div className={styles.valueGroup}>
          <p className={styles.label}>위치</p>
          <p className={styles.value}>선택 대기</p>
        </div>
      </article>

      <article className={styles.resultCard}>
        <h3>분석 결과</h3>
        <div className={styles.placeholderBlock}>확장 가능한 결과 영역</div>
      </article>

      <article className={styles.resultCard}>
        <h3>추가 정보</h3>
        <div className={styles.placeholderBlock}>추가 지표 및 메모 영역</div>
      </article>
    </aside>
  );
}
