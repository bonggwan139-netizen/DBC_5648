import styles from "./ServiceSidebar.module.css";

type ServiceSidebarProps = {
  isSearchPanelOpen: boolean;
  onToggleSearchPanel: () => void;
};

export function ServiceSidebar({
  isSearchPanelOpen,
  onToggleSearchPanel
}: ServiceSidebarProps) {
  return (
    <div className={styles.sidebarWrap}>
      <h2 className={styles.panelTitle}>작업 패널</h2>
      <div className={styles.stepGroup}>
        <section className={styles.stepCard}>
          <div className={styles.stepHeader}>
            <span className={styles.stepBadge}>1</span>
            <h3>위치 검색</h3>
          </div>
          <button type="button" className={styles.openSearchButton} onClick={onToggleSearchPanel}>
            {isSearchPanelOpen ? "위치 검색 닫기" : "위치 검색"}
          </button>
        </section>

        <section className={styles.stepCard}>
          <div className={styles.stepHeader}>
            <span className={styles.stepBadge}>2</span>
            <h3>영역 선택</h3>
          </div>
          <p>지도의 선택 영역을 지정해 분석 범위를 확정합니다.</p>
          <div className={styles.statusBox}>상태: 대기</div>
        </section>

        <section className={styles.stepCard}>
          <div className={styles.stepHeader}>
            <span className={styles.stepBadge}>3</span>
            <h3>분석 실행</h3>
          </div>
          <button type="button" className={styles.runButton}>
            분석 실행
          </button>
        </section>
      </div>
    </div>
  );
}
