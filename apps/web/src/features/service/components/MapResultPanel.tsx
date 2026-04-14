import type { MockSearchItem, SearchStatus } from "../types/search";
import styles from "./MapOverlay.module.css";

type MapResultPanelProps = {
  status: SearchStatus;
  results: MockSearchItem[];
  selectedResultId: string | null;
  onSelectResult: (item: MockSearchItem) => void;
  errorMessage: string | null;
  docked?: boolean;
};

export function MapResultPanel({
  status,
  resultItem,
  errorMessage,
  docked = false
}: MapResultPanelProps) {
  const selectedItem = results.find((item) => item.id === selectedResultId) ?? null;

  const sectionData = [
    {
      title: "선택 대상 정보",
      value: selectedItem?.targetName ?? "검색 후 선택 대상 정보가 표시됩니다."
    },
    {
      title: "기본 위치 정보",
      value:
        selectedItem === null
          ? "행정구역/지번/도로명 주소가 표시됩니다."
          : `${selectedItem.lotAddress} · ${selectedItem.roadAddress}`
    },
    {
      title: "분석 결과 요약",
      value: selectedItem?.summary ?? "분석 요약값이 표시됩니다."
    },
    {
      title: "비고 / 안내 문구",
      value: selectedItem?.note ?? "주의사항 및 검토 포인트가 표시됩니다."
    }
  ];

  return (
    <section
      className={`${styles.resultPanel} ${docked ? styles.resultPanelDocked : ""}`}
      aria-label="검색 결과 요약 패널"
    >
      <h3 className={styles.resultTitle}>검색 결과 요약</h3>
      <p className={styles.resultStatus}>
        상태: {status === "idle" ? "대기" : status === "loading" ? "조회중" : status === "success" ? "성공" : "실패"}
      </p>
      {selectedItem !== null && <p className={styles.selectedTarget}>선택 대상: {selectedItem.targetName}</p>}
      {errorMessage !== null && <p className={styles.resultError}>{errorMessage}</p>}

      <div className={styles.resultList}>
        {results.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.id === selectedResultId ? styles.resultListItemActive : styles.resultListItem}
            onClick={() => onSelectResult(item)}
          >
            {item.targetName}
          </button>
        ))}
      </div>

      <div className={styles.resultSections}>
        {sectionData.map((section) => (
          <article key={section.title} className={styles.resultSectionCard}>
            <h4>{section.title}</h4>
            <p>{section.value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
