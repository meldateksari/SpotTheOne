"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

import { useLanguage } from "@/context/LanguageContext";

export default function GameOverModal() {
    const router = useRouter();
    const { t } = useLanguage();

    useEffect(() => {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => {
            return Math.random() * (max - min) + min;
        };

        // ❗ any kaldırıldı
        const interval: NodeJS.Timeout = setInterval(() => {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                clearInterval(interval);
                return;
            }

            const particleCount = 50 * (timeLeft / duration);

            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
            });
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
            });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    const handleHome = () => {
        localStorage.removeItem("game_user");
        router.push("/");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm fade-in">
            <div className="bg-white p-12 max-w-md w-full text-center space-y-8 relative overflow-hidden">
                <div className="space-y-4">
                    <h2 className="text-4xl font-bold uppercase tracking-tighter">
                        {t("gameOver")}
                    </h2>
                    <p className="text-sm uppercase tracking-widest text-gray-dark">
                        {t("thanksPlaying")}
                    </p>
                </div>

                <div className="w-full border-t border-gray-mid"></div>

                <Button onClick={handleHome} variant="primary" className="w-full">
                    {t("returnHome")}
                </Button>
            </div>
        </div>
    );
}
