import type { Metadata } from "next";
import localFont from "next/font/local";
import { Header } from "@/components/layout/Header";
import "./globals.css";

const pretendard = localFont({
  src: [
    {
      path: "../../public/fonts/Pretendard-Light.woff2",
      weight: "300",
      style: "normal"
    },
    {
      path: "../../public/fonts/Pretendard-Regular.woff2",
      weight: "400",
      style: "normal"
    },
    {
      path: "../../public/fonts/Pretendard-Medium.woff2",
      weight: "500",
      style: "normal"
    },
    {
      path: "../../public/fonts/Pretendard-SemiBold.woff2",
      weight: "600",
      style: "normal"
    },
    {
      path: "../../public/fonts/Pretendard-Bold.woff2",
      weight: "700",
      style: "normal"
    },
    {
      path: "../../public/fonts/Pretendard-Black.woff2",
      weight: "900",
      style: "normal"
    }
  ],
  variable: "--font-pretendard",
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
