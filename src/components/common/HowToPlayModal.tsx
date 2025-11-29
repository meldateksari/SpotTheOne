"use client";

import { useLanguage } from "@/context/LanguageContext";

interface HowToPlayModalProps {
    onClose: () => void;
}

export default function HowToPlayModal({ onClose }: HowToPlayModalProps) {
    const { t } = useLanguage();

    return (
        <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center p-4 fade-in">
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-6 right-6 text-white p-2 hover:bg-white/10 rounded-full transition-colors z-50"
            >
                <span className="material-symbols-outlined text-3xl">close</span>
            </button>

            <div className="w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-black text-white p-6 text-center">
                    <h2 className="text-2xl font-bold uppercase tracking-widest">{t("howToPlay")}</h2>
                    <p className="text-xs uppercase tracking-widest opacity-70 mt-1">
                        {t("howToPlayDesc")}
                    </p>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto space-y-8">

                    {/* Steps */}
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold text-lg">1</div>
                            <div>
                                <h3 className="font-bold uppercase tracking-wide text-lg">{t("step1")}</h3>
                                <p className="text-gray-600 mt-1">{t("step1Desc")}</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold text-lg">2</div>
                            <div>
                                <h3 className="font-bold uppercase tracking-wide text-lg">{t("step2")}</h3>
                                <p className="text-gray-600 mt-1">{t("step2Desc")}</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold text-lg">3</div>
                            <div>
                                <h3 className="font-bold uppercase tracking-wide text-lg">{t("step3")}</h3>
                                <p className="text-gray-600 mt-1">{t("step3Desc")}</p>
                            </div>
                        </div>
                    </div>

                    {/* Scoring Info */}
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        <h3 className="font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined">military_tech</span>
                            {t("scoring")}
                        </h3>
                        <p className="text-sm text-gray-600">
                            {t("step3Desc")}
                        </p>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 flex justify-center">
                    <button
                        onClick={onClose}
                        className="bg-black text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
                    >
                        {t("close")}
                    </button>
                </div>
            </div>
        </div>
    );
}
