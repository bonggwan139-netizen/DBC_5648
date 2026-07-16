import { ProjectRail } from "@/components/portfolio/ProjectRail";
import { projects } from "@/data/projects";

export default function PortfolioPage() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-56px)] w-full max-w-canvas items-center justify-center py-8">
      <div className="grid h-[760px] w-full grid-cols-[minmax(320px,420px)_minmax(0,1fr)] gap-10 rounded-card border border-stroke bg-white px-12 py-12 shadow-soft">
        <div className="flex flex-col justify-center">
          <h1 className="text-[72px] font-semibold leading-[0.95] text-text">
            <span className="block">DBC-</span>
            <span className="block">ANALYSIS</span>
          </h1>
        </div>

        <div className="flex min-w-0 items-center justify-center">
          <ProjectRail items={projects} />
        </div>
      </div>
    </section>
  );
}
