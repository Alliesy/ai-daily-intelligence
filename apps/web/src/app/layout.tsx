import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Daily Intelligence",
  description: "매일 읽는 한국어 AI 인텔리전스",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
