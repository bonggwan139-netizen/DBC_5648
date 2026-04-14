import styles from "./ServiceSidebar.module.css";

const steps = [
  { title: "STEP 1", subtitle: "위치 검색", desc: "주소/지번을 검색해 분석 위치를 설정하세요." },
  { title: "STEP 2", subtitle: "영역 선택", desc: "지도에서 분석할 폴리곤 영역을 지정하세요." }
];

export function ServiceSidebar() {
  return (
    <aside className={styles.sidebar} aria-label="분석 도구 패널">
      {steps.map((step) => (
        <section key={step.title} className={styles.stepCard}>
          <p>{step.title}</p>
          <h3>{step.subtitle}</h3>
          <span>{step.desc}</span>
        </section>
      ))}
      <section className={styles.stepCard}>
        <p>STEP 3</p>
        <h3>분석 실행</h3>
        <button type="button" className={styles.runBtn}>
          분석 실행
        </button>
      </section>
    </aside>
  );
}
