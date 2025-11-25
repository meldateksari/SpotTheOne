"use client";

import { QRCodeSVG } from "qrcode.react";
import { Player } from "@/types";

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
    <div className="lobby-wrapper fade-in">
      {/* Title */}
      <h2 className="lobby-title">
        Lobi Kodu:
        <span className="lobby-room-id">{roomId}</span>
      </h2>

      {/* QR Container */}
      <div className="qr-box">
        <QRCodeSVG value={shareUrl} size={180} />
      </div>

      {/* Players */}
      <div className="players-box">
        <h3 className="players-title">Oyuncular ({players.length})</h3>
        <ul className="players-list">
          {players.map((p) => (
            <li key={p.id} className="player-item">
              {p.name}
            </li>
          ))}
        </ul>
      </div>

      {/* Start button */}
      {isHost ? (
        <button onClick={onStartGame} className="btn">
          Oyunu Başlat
        </button>
      ) : (
        <p className="waiting-text">Oda sahibinin başlatması bekleniyor...</p>
      )}
    </div>
  );
}
