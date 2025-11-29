import { QRCodeSVG } from "qrcode.react";
import { Player } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/context/LanguageContext";

interface LobbyProps {
  roomId: string;
  players: Player[];
  isHost: boolean;
  onStartGame: () => void;
  hostId?: string;
}

export default function Lobby({ roomId, players, isHost, onStartGame, hostId }: LobbyProps) {
  const { t } = useLanguage();
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/room/${roomId}`
      : "";

  return (
    <div className="w-full max-w-md mx-auto space-y-8 fade-in pb-12">
      <div className="text-center space-y-2">
        <h2 className="text-xs uppercase tracking-widest text-gray-dark">{t("roomCode")}</h2>
        <p className="text-4xl font-bold tracking-tighter">{roomId}</p>
      </div>

      <Card className="flex flex-col items-center justify-center p-8 space-y-6">
        <div className="bg-white p-2 border border-gray-mid">
          <QRCodeSVG value={shareUrl} size={160} />
        </div>
        <p className="text-xs uppercase tracking-widest text-gray-dark text-center">
          {t("scanToJoin")}
        </p>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-mid pb-2">
          <h3 className="text-sm uppercase tracking-widest">{t("playersTitle")}</h3>
          <span className="text-sm font-bold">{players.length}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {players.map((p) => (
            <div
              key={p.id}
              className="bg-gray-light p-3 text-sm text-center uppercase tracking-wide border border-transparent hover:border-black transition-colors flex items-center justify-center gap-1 overflow-hidden"
            >
              {p.id === hostId && (
                <span className="material-symbols-outlined text-[16px] text-yellow-600">
                  crown
                </span>
              )}
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={`/animals/${p.avatar}`}
                  className="w-6 h-6 object-contain rounded-full bg-white border border-gray-300 flex-shrink-0"
                  alt={p.name}
                />
                <span className="truncate">{p.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 flex justify-center">
        {isHost ? (
          <Button onClick={onStartGame} variant="primary" className="w-auto px-12">
            {t("startGame")}
          </Button>
        ) : (
          <div className="text-center p-4 border border-gray-mid bg-gray-light w-full">
            <p className="text-xs uppercase tracking-widest animate-pulse">
              {t("waitingForHost")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
