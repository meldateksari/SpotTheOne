import { useEffect, useState } from "react";
import { Player } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface VotingProps {
  question: string;
  players: Player[];
  hasVoted: boolean;
  onVote: (playerId: string) => void;
  isHost: boolean;
  onShowResults: () => void;
  votedPlayers: string[];
  votingStartedAt: number;
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
}: VotingProps) {
  const [timeLeft, setTimeLeft] = useState(10);

  useEffect(() => {
    if (!votingStartedAt) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - votingStartedAt) / 1000);
      const remaining = Math.max(0, 10 - elapsed);

      setTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [votingStartedAt]);

  const allVoted = votedPlayers.length === players.length;
  const canShowResults = allVoted || timeLeft === 0;

  return (
    <div className="w-full max-w-4xl mx-auto p-6 flex flex-col items-center space-y-12 fade-in">
      <div className="text-center space-y-4 max-w-2xl">
        <span className="text-xs font-bold tracking-[0.2em] uppercase text-gray-dark">
          Question
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
            className={`
              relative p-6 text-sm font-bold uppercase tracking-widest transition-all duration-300 border
              ${hasVoted
                ? "bg-gray-light text-gray-400 border-transparent cursor-not-allowed"
                : "bg-white text-black border-gray-mid hover:bg-black hover:text-white hover:border-black"
              }
            `}
          >
            {player.name}
          </button>
        ))}
      </div>

      <div className="w-full max-w-md text-center space-y-4">
        {hasVoted && !isHost && (
          <div className="p-4 border border-black bg-black text-white">
            <p className="text-xs uppercase tracking-widest animate-pulse">
              Vote cast. Waiting for results...
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
              ? `Waiting for votes (${timeLeft}s)...`
              : "End Voting & Show Results"
            }
          </Button>
        )}
      </div>
    </div>
  );
}