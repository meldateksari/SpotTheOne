"use client";

import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSelector from "@/components/common/LanguageSelector";
import HowToPlayModal from "@/components/common/HowToPlayModal";

export default function Header() {
    const { t } = useLanguage();
    const [showHowToPlay, setShowHowToPlay] = useState(false);

    return (
        <>
            <header className="w-full border-b border-black bg-white sticky top-0 z-50">
                <div className="max-w-[440px] mx-auto px-6 h-16 flex items-center justify-between relative">
                    <Link href="/" className="text-xl font-bold uppercase tracking-tighter hover:opacity-70 transition-opacity">
                        Spot The One
                    </Link>
                    <nav className="flex items-center gap-4">
                        <button
                            onClick={() => setShowHowToPlay(true)}
                            className="text-black hover:opacity-70 transition-opacity flex items-center justify-center"
                            title={t("howToPlay")}
                        >
                            <span className="material-symbols-outlined text-2xl">help</span>
                        </button>
                        <Link href="/" className="text-xs font-medium uppercase tracking-widest hover:underline hidden sm:block">
                            {t("home")}
                        </Link>
                        <LanguageSelector />
                    </nav>
                </div>
            </header>

            {showHowToPlay && (
                <HowToPlayModal onClose={() => setShowHowToPlay(false)} />
            )}
        </>
    );
}
