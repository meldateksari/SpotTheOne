"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";

export default function Header() {
    const { t } = useLanguage();
    return (
        <header className="w-full border-b border-black bg-white sticky top-0 z-50">
            <div className="max-w-[440px] mx-auto px-6 h-16 flex items-center justify-between relative">
                <Link href="/" className="text-xl font-bold uppercase tracking-tighter hover:opacity-70 transition-opacity">
                    Spot The One
                </Link>
                <nav className="flex items-center gap-4">
                    <Link href="/" className="text-xs font-medium uppercase tracking-widest hover:underline">
                        {t("home")}
                    </Link>
                    <LanguageSelector />
                </nav>
            </div>
        </header>
    );
}
