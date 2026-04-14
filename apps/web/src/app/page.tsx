import Link from "next/link";
import { IsometricCityGraphic } from "@/shared/components/IsometricCityGraphic";

const steps = ["위치 검색", "영역 선택", "분석 실행"];

export default function HomePage() {
  return (
    <section className="home-page">
      <div className="hero-section">
        <div className="hero-left">
          <h1>지도 기반 도시계획 분석을 더 빠르고 정확하게</h1>
          <p>DBC_UB는 위치 검색부터 영역 지정, 분석 실행까지 한 흐름으로 연결하는 도시계획 분석 워크스페이스입니다.</p>
          <Link className="primary-btn" href="/service">
            서비스 바로가기
          </Link>
        </div>
        <div className="hero-right">
          <div className="hero-map-ui">
            <div className="mock-map-header" />
            <div className="mock-map-body" />
          </div>
          <div className="city-visual-wrap">
            <IsometricCityGraphic className="city-visual" />
          </div>
        </div>
      </div>

      <div className="step-grid" aria-label="서비스 이용 단계">
        {steps.map((step, index) => (
          <article key={step} className="step-card">
            <p>STEP {index + 1}</p>
            <h3>{step}</h3>
          </article>
        ))}
      </div>
    </section>
  );
}
