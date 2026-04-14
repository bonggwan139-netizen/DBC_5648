import type { SearchStatus } from "../types/search";
import styles from "./MapOverlay.module.css";

type MapSearchOverlayProps = {
  query: string;
  status: SearchStatus;
  visible?: boolean;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
};

export function MapSearchOverlay({
  query,
  status,
  visible = true,
  onQueryChange,
  onSearch
}: MapSearchOverlayProps) {
  const isLoading = status === "loading";

  return (
    <section
      className={`${styles.searchPanel} ${visible ? "" : styles.hiddenPanel}`}
      aria-label="토지분석 검색"
      aria-hidden={!visible}
    >
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
