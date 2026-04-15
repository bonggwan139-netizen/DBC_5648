import { ProjectRail } from "@/components/portfolio/ProjectRail";
import { projects } from "@/data/projects";

export default function PortfolioPage() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-56px)] w-full max-w-canvas items-center justify-center py-8">
      <div className="grid h-[760px] w-full grid-cols-[240px_1fr] gap-14 rounded-card border border-stroke bg-white px-12 py-12 shadow-soft">
        <div className="flex flex-col justify-center">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Portfolio</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-text">Selected Work</h1>
          <p className="mt-5 text-sm leading-6 text-muted">
            A focused set of digital projects spanning spatial analysis and practical planning workflows.
          </p>
        </div>

        <div className="flex items-center">
          <ProjectRail items={projects} />
        </div>
      </div>
    </section>
  );
}
