import { useEffect, useState } from "react";
import { Player } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/context/LanguageContext";

interface VotingProps {
  question: string;
  players: Player[];
  hasVoted: boolean;
  onVote: (playerId: string) => void;
  isHost: boolean;
  onShowResults: () => void;
  votedPlayers: string[];
  votingStartedAt: number;
  round: number;
  duration: number;
}

export default function Voting({
  question,
  players,
  hasVoted,
  onVote,
  isHost,
  onShowResults,
  votedPlayers,
  votingStartedAt,
  round,
  duration,
}: VotingProps) {
  const { t } = useLanguage();
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (!votingStartedAt) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - votingStartedAt) / 1000);
      const remaining = Math.max(0, duration - elapsed);

      setTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [votingStartedAt, duration]);

  const allVoted = votedPlayers.length === players.length;
  const canShowResults = allVoted || timeLeft === 0;

  return (
    <div className="w-full max-w-4xl mx-auto p-6 flex flex-col items-center space-y-12 fade-in">
      {/* Timer Bar */}
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-black transition-all duration-1000 ease-linear"
          style={{ width: `${(timeLeft / duration) * 100}%` }}
        />
      </div>

      <div className="text-center space-y-4 max-w-2xl">
        <span className="text-xs font-bold tracking-[0.2em] uppercase text-gray-dark">
          {t("questionLabel")} {round}
        </span>
        <h1 className="text-3xl md:text-5xl font-bold uppercase tracking-tighter leading-tight">
          {question}
        </h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
        {players.map((player) => (
          <button
            key={player.id}
            onClick={() => onVote(player.id)}
            disabled={hasVoted}
            title={player.name}
            className={`
              relative p-6 text-sm font-bold uppercase tracking-widest transition-all duration-300 border break-words
              ${hasVoted
                ? "bg-gray-light text-gray-400 border-transparent cursor-not-allowed"
                : "bg-white text-black border-gray-mid hover:bg-black hover:text-white hover:border-black"
              }
            `}
          >
            <span className="line-clamp-2">{player.name}</span>
          </button>
        ))}
      </div>

      <div className="w-full max-w-md text-center space-y-4">
        {hasVoted && !isHost && (
          <div className="p-4 border border-black bg-black text-white">
            <p className="text-xs uppercase tracking-widest animate-pulse">
              {t("voteCast")}
            </p>
          </div>
        )}

        {isHost && (
          <Button
            onClick={onShowResults}
            variant="primary"
            className="w-full"
            disabled={!canShowResults}
          >
            {!canShowResults
              ? t("waitingForVotes", { seconds: timeLeft })
              : t("endVoting")
            }
          </Button>
        )}
      </div>
    </div>
  );
}