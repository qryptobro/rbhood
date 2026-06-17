import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ReactNode } from "react";

export const viewport: Viewport = {
  themeColor: "#080808",
};

export const metadata: Metadata = {
  title: "rbhood ai — ИИ-анализ активов",
  description: "Выбери актив — ИИ даст полный анализ за секунды",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "rbhood ai",
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Orbitron:wght@400;500;600;700&family=Exo+2:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col bg-[#0A0A0A] text-[#FAFAFA]">
        {children}
      </body>
    </html>
  );
}
