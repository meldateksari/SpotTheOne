import { QRCodeSVG } from "qrcode.react";
import { Player } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface LobbyProps {
  roomId: string;
  players: Player[];
  isHost: boolean;
  onStartGame: () => void;
}

export default function Lobby({ roomId, players, isHost, onStartGame }: LobbyProps) {
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/room/${roomId}`
      : "";

  return (
    <div className="w-full max-w-md mx-auto space-y-8 fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-xs uppercase tracking-widest text-gray-dark">Room Code</h2>
        <p className="text-4xl font-bold tracking-tighter">{roomId}</p>
      </div>

      <Card className="flex flex-col items-center justify-center p-8 space-y-6">
        <div className="bg-white p-2 border border-gray-mid">
          <QRCodeSVG value={shareUrl} size={160} />
        </div>
        <p className="text-xs uppercase tracking-widest text-gray-dark text-center">
          Scan to join
        </p>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-mid pb-2">
          <h3 className="text-sm uppercase tracking-widest">Players</h3>
          <span className="text-sm font-bold">{players.length}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {players.map((p) => (
            <div
              key={p.id}
              className="bg-gray-light p-3 text-sm text-center uppercase tracking-wide border border-transparent hover:border-black transition-colors"
            >
              {p.name}
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 flex justify-center">
        {isHost ? (
          <Button onClick={onStartGame} variant="primary" className="w-auto px-12">
            Start Game
          </Button>
        ) : (
          <div className="text-center p-4 border border-gray-mid bg-gray-light w-full">
            <p className="text-xs uppercase tracking-widest animate-pulse">
              Waiting for host to start...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
