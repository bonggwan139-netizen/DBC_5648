import { IsometricCityGraphic } from "@/shared/components/IsometricCityGraphic";

export default function AboutPage() {
  return (
    <section className="about-page">
      <h2>DBC_UB 소개</h2>
      <div className="about-split">
        <div className="about-features">
          <h3>핵심 기능</h3>
          <ul>
            <li>위치 검색</li>
            <li>영역 선택</li>
            <li>분석 실행</li>
          </ul>
        </div>

        <div className="about-map-preview">
          <div className="about-selection-box">
            <div className="selection-area" />
          </div>
          <IsometricCityGraphic className="about-city-visual" subdued />
        </div>
      </div>

      <div className="about-search-bar" role="search">
        <input type="text" placeholder="위치를 검색해 도시계획 분석을 시작하세요" aria-label="도시계획 검색" />
      </div>
    </section>
  );
}
