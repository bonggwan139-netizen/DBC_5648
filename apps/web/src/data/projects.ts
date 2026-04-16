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
    subtitle: "Urban Planning Analysis Service",
    description:
      "A web-based spatial analysis workspace designed for urban planning review, site understanding, regulation context, and decision support. It is structured to connect map layers, planning logic, and service-ready interfaces in one practical environment.",
    imageSrc: "/images/dbc-map-cover.jpg",
    href: "/portfolio/dbc-map"
  }
];
