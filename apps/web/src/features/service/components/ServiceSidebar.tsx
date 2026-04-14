import styles from "./ServiceSidebar.module.css";

const sidebarSections = [
  {
    title: "분석 대상",
    description: "지번/주소 검색 UI가 들어올 자리"
  },
  {
    title: "분석 옵션",
    description: "필터, 기준 값 선택 UI가 들어올 자리"
  },
  {
    title: "결과 요약",
    description: "분석 결과 카드가 배치될 자리"
  }
];

export function ServiceSidebar() {
  return (
    <aside className={styles.sidebar} aria-label="분석 도구 패널">
      {sidebarSections.map((section) => (
        <section key={section.title} className={styles.sidebarCard}>
          <h3>{section.title}</h3>
          <p>{section.description}</p>
        </section>
      ))}
    </aside>
  );
}
