// src/types/index.ts
export interface Player {
  id: string;
  name: string;
  score?: number;
  avatar: string;
  peerId?: string;
}

export interface RoomData {
  status: "lobby" | "voting" | "results" | "gameover";
  players: Player[];
  currentQuestion: string;
  questions?: string[];
  votes: { [key: string]: number };
  hostId: string;
  round: number;
  votingStartedAt?: number;
  votedPlayers?: string[];
  language?: string;
  voiceParticipants?: string[];
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: number;
}