import type { Metadata } from "next";
import localFont from "next/font/local";
import { Header } from "@/components/layout/Header";
import "./globals.css";

const pretendard = localFont({
  src: "../../public/fonts/Pretendard-Black.woff2",
  variable: "--font-pretendard",
  weight: "900",
  display: "swap"
});

export const metadata: Metadata = {
  title: "DBC Portfolio",
  description: "Personal portfolio for urban planning and digital tools"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${pretendard.variable} min-h-screen bg-background text-text antialiased`}>
        <Header />
        <main className="pt-14">{children}</main>
      </body>
    </html>
  );
}
