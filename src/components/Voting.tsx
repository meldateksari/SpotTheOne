// src/components/Voting.tsx
"use client";
import { Player } from "@/types";

interface VotingProps {
  question: string;
  players: Player[];
  hasVoted: boolean;
  onVote: (playerId: string) => void;
  isHost: boolean;
  onShowResults: () => void;
}

export default function Voting({
  question,
  players,
  hasVoted,
  onVote,
  isHost,
  onShowResults,
}: VotingProps) {
  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto p-4">
      <div className="mt-4 mb-10 text-center w-full">
        <span className="text-sm text-purple-400 font-bold tracking-[0.2em] uppercase">
          Soru
        </span>
        <h1 className="text-3xl md:text-5xl font-black text-white mt-4 leading-tight drop-shadow-lg">
          {question}
        </h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
        {players.map((player) => (
          <button
            key={player.id}
            onClick={() => onVote(player.id)}
            disabled={hasVoted}
            className={`
              relative overflow-hidden p-6 rounded-2xl text-lg font-bold transition-all duration-200
              ${
                hasVoted
                  ? "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700"
                  : "bg-gray-800 hover:bg-purple-600 text-white shadow-lg hover:shadow-purple-500/50 border border-gray-600 hover:border-purple-400 hover:-translate-y-1"
              }
            `}
          >
            {player.name}
          </button>
        ))}
      </div>

      <div className="mt-12 text-center h-16">
        {hasVoted && !isHost && (
          <p className="text-green-400 font-medium animate-bounce">
            Oyun kullanıldı! Sonuçlar bekleniyor...
          </p>
        )}

        {isHost && (
          <button
            onClick={onShowResults}
            className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg transition transform active:scale-95"
          >
            Oylamayı Bitir & Sonuçları Göster 🛑
          </button>
        )}
      </div>
    </div>
  );
}