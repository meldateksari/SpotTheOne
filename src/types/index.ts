// src/types/index.ts
export interface Player {
  id: string;
  name: string;
  score?: number;
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
}