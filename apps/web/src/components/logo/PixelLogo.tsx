export function PixelLogo() {
  return (
    <div className="flex items-center gap-3">
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className="h-6 w-6 text-slate-900"
        fill="currentColor"
      >
        <rect x="2" y="2" width="4" height="4" rx="0.4" />
        <rect x="8" y="2" width="4" height="4" rx="0.4" />
        <rect x="14" y="2" width="4" height="4" rx="0.4" />
        <rect x="4" y="8" width="12" height="4" rx="0.4" />
        <rect x="2" y="12" width="4" height="4" rx="0.4" />
        <rect x="14" y="12" width="4" height="4" rx="0.4" />
      </svg>
      <span className="font-mono text-sm font-bold tracking-[0.32em] text-slate-900">DBC</span>
    </div>
  );
}
