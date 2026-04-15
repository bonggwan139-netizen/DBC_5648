import styles from "./MapOverlay.module.css";

type MapSearchOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function MapSearchOverlay({ isOpen, onClose }: MapSearchOverlayProps) {
  return (
    <section
      className={`${styles.searchPanel} ${isOpen ? styles.searchPanelVisible : styles.searchPanelHidden}`}
      aria-label="토지분석 검색"
      aria-hidden={!isOpen}
    >
      <div className={styles.searchPanelHeader}>
        <strong>위치 검색</strong>
        <button type="button" className={styles.searchCloseButton} onClick={onClose} aria-label="검색 패널 닫기">
          닫기
        </button>
      </div>
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
