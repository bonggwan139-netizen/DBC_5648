"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import type { ProjectItem } from "@/data/projects";

type ProjectCardProps = {
  project: ProjectItem;
  isHovered: boolean;
  offset: number;
  onHover: () => void;
  onLeave: () => void;
};

export function ProjectCard({ project, isHovered, offset, onHover, onLeave }: ProjectCardProps) {
  return (
    <motion.div
      animate={{ scale: isHovered ? 1.045 : 1, x: offset }}
      transition={{ type: "spring", stiffness: 260, damping: 24, mass: 0.8 }}
      className="h-[430px] w-[340px]"
      onHoverStart={onHover}
      onHoverEnd={onLeave}
    >
      <Link
        href={project.href}
        className="group flex h-full flex-col rounded-[28px] border border-stroke bg-white p-5 shadow-[0_12px_28px_rgba(36,49,94,0.08)] transition hover:shadow-[0_18px_34px_rgba(36,49,94,0.12)]"
      >
        <div className="relative h-[170px] overflow-hidden rounded-2xl border border-slate-100">
          <Image src={project.imageSrc} alt={project.title} fill className="object-cover" sizes="340px" priority />
        </div>
        <div className="mt-5 flex flex-col gap-2">
          <p className="text-2xl font-semibold tracking-tight text-text">{project.title}</p>
          <p className="text-sm font-medium text-slate-500">{project.subtitle}</p>
          <p className="mt-2 text-sm leading-6 text-muted">{project.description}</p>
        </div>
      </Link>
    </motion.div>
  );
}
