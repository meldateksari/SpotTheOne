// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Who is Most Likely?",
  description: "Arkadaş grubunla oynayabileceğin anonim oylama oyunu.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        {/* SAYFAYI ORTALAYAN PREMIUM WRAPPER */}
        <div className="page-wrapper">
          {children}
        </div>
      </body>
    </html>
  );
}
