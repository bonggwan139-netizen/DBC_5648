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
    subtitle: "공간정보 기반 토지분석 웹서비스",
    description:
      "대상지를 지정하면 토지 현황을 분석하고 토지조서와 검토보고서를 생성하는 웹서비스입니다.",
    imageSrc: "/images/dbc-map-cover.jpg",
    href: "/portfolio/dbc-map"
  }
];
