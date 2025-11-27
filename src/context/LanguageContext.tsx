"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translations, Language } from "@/utils/translations";

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>("en");
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // 1. Check Local Storage
        const savedLang = localStorage.getItem("app_language") as Language;
        if (savedLang && translations[savedLang]) {
            setLanguageState(savedLang);
        } else {
            // 2. Check Device Language
            const deviceLang = navigator.language.split("-")[0] as Language;
            if (translations[deviceLang]) {
                setLanguageState(deviceLang);
            } else {
                setLanguageState("en"); // Default
            }
        }
        setIsLoaded(true);
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem("app_language", lang);
    };

    const t = (key: string, params?: Record<string, string | number>) => {
        let text = translations[language][key] || key;

        if (params) {
            Object.entries(params).forEach(([paramKey, paramValue]) => {
                text = text.replace(`{${paramKey}}`, String(paramValue));
            });
        }

        return text;
    };

    if (!isLoaded) {
        return null; // or a loading spinner
    }

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}
