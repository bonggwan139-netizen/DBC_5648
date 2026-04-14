import type { Metadata } from "next";
import Link from "next/link";
import { MainNav } from "@/shared/components/MainNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "DBC_UB",
  description: "지도 기반 도시계획 분석 웹서비스"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <header className="site-header">
          <div className="header-inner">
            <Link href="/" className="brand-logo" aria-label="DBC_UB 홈으로 이동">
              DBC_UB
            </Link>
            <MainNav />
          </div>
        </header>
        <main className="page-container">{children}</main>
      </body>
    </html>
  );
}
