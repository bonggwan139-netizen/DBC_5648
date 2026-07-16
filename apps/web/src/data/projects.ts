export type ProjectItem = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imageSrc: string;
  href: string;
};

export const projects: ProjectItem[] = [
  {
    id: "dbc-map",
    title: "DBC-MAP",
    subtitle: "도시계획 대상지 분석 서비스",
    description:
      "대상지를 지정하면 토지·건축물·자연환경·도시계획 정보를 분석하고 토지조서와 검토보고서를 생성하는 웹 기반 도시계획 실무 도구입니다.",
    imageSrc: "/images/dbc-map-cover.jpg",
    href: "/portfolio/dbc-map"
  }
];
