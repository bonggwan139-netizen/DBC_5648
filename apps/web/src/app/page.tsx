import Link from "next/link";
import { IsometricCityGraphic } from "@/shared/components/IsometricCityGraphic";

const steps = [
  { title: "위치 검색", desc: "분석할 위치를 주소 또는 지번으로 빠르게 찾습니다." },
  { title: "영역 선택", desc: "지도 위에서 분석할 영역을 직관적으로 지정합니다." },
  { title: "분석 실행", desc: "선택한 영역의 핵심 지표를 즉시 확인합니다." }
];

export default function HomePage() {
  return (
    <section className="home-page">
      <div className="hero-section">
        <div className="hero-left">
          <h1>지도 기반 도시계획 분석</h1>
          <p>DBC_UB는 위치 검색부터 영역 선택, 분석 실행까지 이어지는 도시계획 분석 워크플로우를 제공합니다.</p>
          <Link className="primary-btn" href="/service">
            서비스 바로가기
          </Link>
        </div>

        <div className="hero-visual">
          <div className="hero-overlay-card">
            <div className="overlay-header" />
            <div className="overlay-row" />
            <div className="overlay-row short" />
            <div className="overlay-map-chip" />
          </div>
          <IsometricCityGraphic className="city-visual" />
        </div>
      </div>

      <div className="step-grid" aria-label="서비스 이용 단계">
        {steps.map((step, index) => (
          <article key={step.title} className="step-card">
            <p className="step-number">STEP {index + 1}</p>
            <h3>{step.title}</h3>
            <span>{step.desc}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
