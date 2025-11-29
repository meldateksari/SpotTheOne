"use client";

import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Language } from "@/utils/translations";

export default function LanguageSelector() {
    const { language, setLanguage } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const languages: { code: Language; label: string }[] = [
        { code: "tr", label: "TÜRKÇE" },
        { code: "en", label: "ENGLISH" },
        { code: "de", label: "DEUTSCH" },
        { code: "es", label: "ESPAÑOL" },
        { code: "ru", label: "РУССКИЙ" },
    ];

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative z-50" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="
          flex items-center gap-2 px-3 py-2 
          bg-white/80 backdrop-blur-sm 
          border border-gray-200 
          rounded-full shadow-sm 
          hover:border-black transition-all
        "
            >
                <span className="material-symbols-outlined text-[18px] md:text-[20px]">language</span>
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest min-w-[20px]">
                    {language}
                </span>
                <span className="material-symbols-outlined text-[16px] text-gray-500">
                    {isOpen ? "expand_less" : "expand_more"}
                </span>
            </button>

            {isOpen && (
                <div className="
          absolute right-0 mt-2 w-32 
          bg-white border border-gray-200 
          shadow-xl rounded-xl overflow-hidden 
          animate-in fade-in slide-in-from-top-2 duration-200
        ">
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => {
                                setLanguage(lang.code);
                                setIsOpen(false);
                            }}
                            className={`
                w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors
                ${language === lang.code
                                    ? "bg-black text-white"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-black"}
              `}
                        >
                            {lang.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
