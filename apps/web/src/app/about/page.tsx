import { IsometricCityGraphic } from "@/shared/components/IsometricCityGraphic";

const featureCards = [
  { title: "위치 검색", desc: "분석 대상 위치를 빠르게 찾고 기준점을 설정합니다." },
  { title: "영역 선택", desc: "지도에서 대상 영역을 지정해 분석 범위를 고정합니다." },
  { title: "분석 실행", desc: "핵심 지표를 요약해 의사결정에 필요한 정보를 제공합니다." }
];

export default function AboutPage() {
  return (
    <section className="about-page">
      <div className="about-main-section">
        <div className="about-left">
          <h2>서비스 소개</h2>
          <p>DBC_UB는 도시계획 실무 흐름에 맞춰 설계된 지도 기반 분석 서비스입니다. 입력-선택-분석 단계를 명확하게 나누어 빠른 검토를 지원합니다.</p>

          <div className="feature-card-list">
            {featureCards.map((feature) => (
              <article key={feature.title} className="feature-card">
                <h3>{feature.title}</h3>
                <span>{feature.desc}</span>
              </article>
            ))}
          </div>
        </div>

        <div className="about-visual">
          <div className="about-overlay-card">
            <div className="about-overlay-map">
              <div className="selection-area" />
            </div>
          </div>
          <IsometricCityGraphic className="about-city-visual" subdued />
        </div>
      </div>

      <div className="about-search-bar" role="search">
        <span className="search-icon">⌕</span>
        <input type="text" placeholder="위치를 검색해 도시계획 분석을 시작하세요" aria-label="도시계획 검색" />
        <button type="button">검색</button>
      </div>
    </section>
  );
}
