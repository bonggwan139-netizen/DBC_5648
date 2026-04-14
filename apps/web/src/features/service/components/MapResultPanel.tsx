import type { MockSearchItem, SearchStatus } from "../types/search";
import styles from "./MapOverlay.module.css";

type MapResultPanelProps = {
  status: SearchStatus;
  resultItem: MockSearchItem | null;
  errorMessage: string | null;
};

export function MapResultPanel({
  status,
  resultItem,
  errorMessage
}: MapResultPanelProps) {
  const sectionData = [
    {
      title: "선택 대상 정보",
      value: resultItem?.targetName ?? "검색 후 선택 대상 정보가 표시됩니다."
    },
    {
      title: "기본 위치 정보",
      value:
        resultItem === null
          ? "행정구역/지번/도로명 주소가 표시됩니다."
          : `${resultItem.lotAddress} · ${resultItem.roadAddress}`
    },
    {
      title: "분석 결과 요약",
      value: resultItem?.summary ?? "분석 요약값이 표시됩니다."
    },
    {
      title: "비고 / 안내 문구",
      value: resultItem?.note ?? "주의사항 및 검토 포인트가 표시됩니다."
    }
  ];

  return (
    <section className={styles.resultPanel} aria-label="검색 결과 요약 패널">
      <h3 className={styles.resultTitle}>검색 결과 요약</h3>
      <p className={styles.resultStatus}>
        상태: {status === "idle" ? "대기" : status === "loading" ? "조회중" : status === "success" ? "성공" : "실패"}
      </p>
      {errorMessage !== null && <p className={styles.resultError}>{errorMessage}</p>}
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
