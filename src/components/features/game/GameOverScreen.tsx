"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { useRouter } from "next/navigation";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase.client";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";
import { Player } from "@/types";

interface GameOverScreenProps {
    roomId: string;
    players: Player[];
    isHost: boolean;
}

export default function GameOverScreen({ roomId, players, isHost }: GameOverScreenProps) {
    const router = useRouter();
    const { t } = useLanguage();
    const [timeLeft, setTimeLeft] = useState(180); // 3 minutes

    // Sort players by score (highest first)
    const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));

    useEffect(() => {
        // Confetti animation
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => {
            return Math.random() * (max - min) + min;
        };

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

    // Countdown Timer & Auto Delete
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    if (isHost) {
                        deleteRoom();
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isHost]);

    const deleteRoom = async () => {
        try {
            await deleteDoc(doc(db, "rooms", roomId));
            // Redirect happens via snapshot listener in RoomPage
        } catch (error) {
            console.error("Error deleting room:", error);
        }
    };

    const handleHome = () => {
        localStorage.removeItem("game_user");
        router.push("/");
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center fade-in overflow-y-auto py-12 px-4">
            <div className="w-full max-w-2xl space-y-12 text-center">

                <div className="space-y-4">
                    <h1 className="text-5xl md:text-7xl font-bold uppercase tracking-tighter">
                        {t("gameOver")}
                    </h1>
                    <p className="text-sm uppercase tracking-widest text-gray-dark">
                        {t("thanksPlaying")}
                    </p>
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl font-bold uppercase tracking-widest border-b border-black pb-4">
                        {t("leaderboard")}
                    </h2>

                    <div className="space-y-3">
                        {sortedPlayers.map((player, index) => (
                            <div
                                key={player.id}
                                className={`flex items-center justify-between p-4 border ${index === 0 ? 'border-black bg-black text-white' : 'border-gray-mid bg-white text-black'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <span className="text-lg font-bold w-6">{index + 1}.</span>
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={`/animals/${player.avatar}`}
                                            className="w-10 h-10 object-contain bg-white rounded-full p-1"
                                        />
                                        <span className="uppercase tracking-widest text-sm font-medium">
                                            {player.name}
                                        </span>
                                    </div>
                                </div>
                                <span className="text-xl font-bold">{player.score}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-4 pt-8">
                    <p className="text-xs uppercase tracking-widest text-red-500 animate-pulse">
                        {t("roomClosingIn", { seconds: timeLeft })}
                    </p>

                    <Button onClick={handleHome} variant="primary" className="w-full max-w-md mx-auto">
                        {t("returnHome")}
                    </Button>
                </div>

            </div>
        </div>
    );
}
