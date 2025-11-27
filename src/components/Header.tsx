"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function Header() {
    const { t } = useLanguage();
    return (
        <header className="w-full border-b border-black bg-white sticky top-0 z-50">
            <div className="max-w-[440px] mx-auto px-6 h-16 flex items-center justify-between">
                <Link href="/" className="text-xl font-bold uppercase tracking-tighter hover:opacity-70 transition-opacity">
                    Spot The One
                </Link>
                <nav>
                    <Link href="/" className="text-xs font-medium uppercase tracking-widest hover:underline">
                        {t("home")}
                    </Link>
                </nav>
            </div>
        </header>
    );
}
