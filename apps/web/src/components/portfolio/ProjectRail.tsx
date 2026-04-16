"use client";

import { useState } from "react";
import { ProjectCard } from "@/components/portfolio/ProjectCard";
import type { ProjectItem } from "@/data/projects";

type ProjectRailProps = {
  items: ProjectItem[];
};

export function ProjectRail({ items }: ProjectRailProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="flex min-h-[460px] w-[980px] items-center gap-6 overflow-visible">
      {items.map((project, index) => {
        const isHovered = hoveredIndex === index;

        let offset = 0;
        if (hoveredIndex !== null && hoveredIndex !== index) {
          offset = index < hoveredIndex ? -8 : 8;
        }

        return (
          <ProjectCard
            key={project.id}
            project={project}
            isHovered={isHovered}
            offset={offset}
            onHover={() => setHoveredIndex(index)}
            onLeave={() => setHoveredIndex(null)}
          />
        );
      })}
    </div>
  );
}
