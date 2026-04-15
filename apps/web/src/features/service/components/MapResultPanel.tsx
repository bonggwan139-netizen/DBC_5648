import resultPanelStyles from "./MapResultPanel.module.css";
import overlayStyles from "./MapOverlay.module.css";

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
