import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "암살단 타이머 — Smoke Timer",
  description: "실시간 협동 쿨다운 추적기",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
