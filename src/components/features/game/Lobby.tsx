import { QRCodeSVG } from "qrcode.react";
import { Player } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/context/LanguageContext";
import { Tooltip } from "@/components/ui/Tooltip";
import { useState } from "react";

interface LobbyProps {
  roomId: string;
  players: Player[];
  isHost: boolean;
  onStartGame: (duration: number) => void;
  hostId?: string;
}

export default function Lobby({ roomId, players, isHost, onStartGame, hostId }: LobbyProps) {
  const { t } = useLanguage();
  const [duration, setDuration] = useState(15);
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
                <Tooltip content={p.name} className="truncate">
                  {p.name}
                </Tooltip>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isHost && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-mid pb-2">
            <h3 className="text-sm uppercase tracking-widest">{t("durationSelection")}</h3>
            <span className="text-sm font-bold">{duration}{t("secondsShort")}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[10, 15, 20].map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`
                  p-3 text-sm font-bold uppercase tracking-widest border transition-all
                  ${duration === d
                    ? "bg-black text-white border-black"
                    : "bg-white text-black border-gray-mid hover:border-black"
                  }
                `}
              >
                {d}{t("secondsShort")}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="pt-4 flex justify-center">
        {isHost ? (
          <Button onClick={() => onStartGame(duration)} variant="primary" className="w-auto px-12">
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
