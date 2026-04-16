"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PixelLogo } from "@/components/logo/PixelLogo";

export function Header() {
  const pathname = usePathname();
  const active = pathname?.startsWith("/portfolio");

  return (
    <header className="fixed inset-x-0 top-0 z-40 h-14 border-b border-slate-200/90 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex h-full w-full max-w-canvas items-center justify-between px-6">
        <Link href="/" className="shrink-0">
          <PixelLogo />
        </Link>

        <nav aria-label="Primary" className="flex items-center justify-center">
          <Link
            href="/portfolio"
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            Portfolio
          </Link>
        </nav>

        <button
          type="button"
          aria-label="Menu (coming soon)"
          disabled
          className="group flex h-8 w-8 cursor-not-allowed flex-col items-center justify-center gap-1 rounded-md border border-slate-200 bg-slate-50 opacity-80"
        >
          <span className="h-[1.5px] w-4 bg-slate-500" />
          <span className="h-[1.5px] w-4 bg-slate-500" />
          <span className="h-[1.5px] w-4 bg-slate-500" />
        </button>
      </div>
    </header>
  );
}
