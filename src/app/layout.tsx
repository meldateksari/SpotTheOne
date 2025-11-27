// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Who is Most Likely?",
  description: "Arkadaş grubunla oynayabileceğin anonim oylama oyunu.",
};

// Components
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <head>
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@400&display=swap"
  />
</head>


      {/* footer’ın her zaman aşağıda durması için flex layout */}
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <Header />

        {/* Sayfa içeriği */}
        <div className="page-wrapper flex-grow">
          {children}
        </div>

        {/* Her sayfada en altta görünen footer */}
        <Footer />
      </body>
    </html>
  );
}
