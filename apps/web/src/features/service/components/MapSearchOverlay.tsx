import type { SearchStatus } from "../types/search";
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
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSearch();
            }
          }}
          placeholder="주소 또는 지번을 입력하세요"
          aria-label="주소 또는 지번 입력"
        />
        <button
          className={styles.searchButton}
          type="button"
          onClick={onSearch}
          disabled={isLoading}
        >
          {isLoading ? "조회중" : "검색"}
        </button>
      </div>
      <p className={styles.searchPlaceholder}>검색 결과 패널은 mock API 응답으로 표시됩니다.</p>
    </section>
  );
}
