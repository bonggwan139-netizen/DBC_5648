import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import "./globals.css";

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
      <body className="min-h-screen bg-background text-text antialiased">
        <Header />
        <main className="pt-14">{children}</main>
      </body>
    </html>
  );
}
