// src/types/index.ts
export interface Player {
  id: string;
  name: string;
  score?: number;
}

export interface RoomData {
  status: "lobby" | "voting" | "results";
  players: Player[];
  currentQuestion: string;
  votes: { [key: string]: number };
  hostId: string;
  round: number;
}