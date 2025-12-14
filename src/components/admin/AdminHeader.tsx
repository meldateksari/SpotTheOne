"use client";

import LanguageSelector from "@/components/common/LanguageSelector";
import { useLanguage } from "@/context/LanguageContext";

export default function AdminHeader() {
    const { t } = useLanguage();

    return (
        <header className="h-16 border-b border-gray-mid bg-white sticky top-0 z-40 px-8 flex items-center justify-end">
            <div className="flex items-center gap-4">
                {/* Future header items like User Profile can go here */}
                <LanguageSelector />
            </div>
        </header>
    );
}
