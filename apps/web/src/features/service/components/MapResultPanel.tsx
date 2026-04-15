import resultPanelStyles from "./MapResultPanel.module.css";
import overlayStyles from "./MapOverlay.module.css";

const resultSections = [
  {
    title: "선택 대상 정보",
    placeholder: "선택된 필지/건물 정보가 여기에 표시됩니다."
  },
  {
    title: "기본 위치 정보",
    placeholder: "행정구역, 지번, 도로명 주소 등 위치 메타정보가 표시됩니다."
  },
  {
    title: "분석 결과 요약",
    placeholder: "용도지역, 인접도로, 개발 참고지표 등 요약값이 표시됩니다."
  },
  {
    title: "비고 / 안내 문구",
    placeholder: "데이터 최신일, 해석 주의사항, 검토 포인트가 표시됩니다."
  }
];

export function MapResultPanel() {
  return (
    <aside className={resultPanelStyles.resultPanel} aria-label="검색 결과 요약 패널">
      <h3 className={overlayStyles.resultTitle}>검색 결과 요약</h3>
      <div className={overlayStyles.resultSections}>
        {resultSections.map((section) => {
          return (
            <article key={section.title} className={overlayStyles.resultSectionCard}>
              <h4>{section.title}</h4>
              <p>{section.placeholder}</p>
            </article>
          );
        })}
      </div>
    </aside>
  );
}
