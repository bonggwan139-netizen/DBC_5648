import styles from "./ServiceSidebar.module.css";

type ServiceSidebarProps = {
  onOpenSearchPanel: () => void;
};

export function ServiceSidebar({ onOpenSearchPanel }: ServiceSidebarProps) {
  return (
    <section className={styles.sidebar} aria-label="작업 패널">
      <section className={styles.stepCard}>
        <header className={styles.stepHeader}>
          <button type="button" className={styles.stepButton} onClick={onOpenSearchPanel}>
            <span className={styles.stepBadge}>1</span>
            <h3>위치 검색</h3>
          </button>
        </header>
        <div className={styles.stepContent}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="주소 또는 지번 입력"
            aria-label="위치 검색어 입력"
          />
          <button className={styles.searchButton} type="button" onClick={onOpenSearchPanel}>
            검색
          </button>
        </div>
      </section>

      <section className={styles.stepCard}>
        <header className={styles.stepHeader}>
          <span className={styles.stepBadge}>2</span>
          <h3>영역 선택</h3>
        </header>
        <div className={styles.stepContent}>
          <p className={styles.helperText}>지도에서 분석할 영역을 직접 지정하세요.</p>
          <div className={styles.statusBox}>선택 상태: 대기 중</div>
        </div>
      </section>

      <section className={styles.stepCard}>
        <header className={styles.stepHeader}>
          <span className={styles.stepBadge}>3</span>
          <h3>분석 실행</h3>
        </header>
        <div className={styles.stepContent}>
          <button className={styles.runButton} type="button">
            분석 실행
          </button>
        </div>
      </section>
    </section>
  );
}
