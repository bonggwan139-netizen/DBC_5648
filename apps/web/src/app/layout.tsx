import type { Metadata } from "next";
import { MainNav } from "@/shared/components/MainNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Urban Planning Lab",
  description: "도시계획 분석 실험용 웹 애플리케이션"
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
          <h1>Urban Planning Lab</h1>
          <MainNav />
        </header>
        <main className="page-container">{children}</main>
      </body>
    </html>
  );
}
