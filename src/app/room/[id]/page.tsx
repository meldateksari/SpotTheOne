"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc, getDoc } from "firebase/firestore";
import { questions } from "@/utils/questions";
import { RoomData, Player } from "@/types";

import Lobby from "@/components/Lobby";
import Voting from "@/components/Voting";
import Results from "@/components/Results";

export default function RoomPage() {
  const { id: roomId } = useParams();

  const [currentUser] = useState<Player | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("game_user");
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });

  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const hasJoinedRef = useRef(false);

  // Odaya giriş
  useEffect(() => {
    if (!currentUser || !roomId || hasJoinedRef.current) return;

    const joinRoom = async () => {
      try {
        const roomRef = doc(db, "rooms", roomId as string);
        const snap = await getDoc(roomRef);

        if (!snap.exists()) return;

        const data = snap.data() as RoomData;
        const players = data.players || [];

        const alreadyInRoom = players.some(
          (p: Player) => p.id === currentUser.id
        );

        if (!alreadyInRoom) {
          await updateDoc(roomRef, {
            players: [...players, currentUser]
          });
        }

        hasJoinedRef.current = true;
      } catch (err) {
        console.error("Odaya katılma hatası:", err);
      }
    };

    joinRoom();
  }, [currentUser, roomId]);

  // Firestore realtime listener
  useEffect(() => {
    if (!roomId) return;

    const roomRef = doc(db, "rooms", roomId as string);

    const unsubscribe = onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as RoomData;
        setRoomData(data);

        if (data.status === "results") setHasVoted(false);
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  // Game Actions
  const startGame = async () => {
    if (!roomId) return;
    const randomQuestion =
      questions[Math.floor(Math.random() * questions.length)];

    await updateDoc(doc(db, "rooms", roomId as string), {
      status: "voting",
      currentQuestion: randomQuestion,
      votes: {}
    });
  };

  const castVote = async (targetPlayerId: string) => {
    if (hasVoted || !roomId || !roomData) return;

    setHasVoted(true);

    const currentVotes = roomData.votes || {};
    const newCount = (currentVotes[targetPlayerId] || 0) + 1;

    await updateDoc(doc(db, "rooms", roomId as string), {
      [`votes.${targetPlayerId}`]: newCount
    });
  };

  const showResults = async () => {
    if (!roomId) return;

    await updateDoc(doc(db, "rooms", roomId as string), {
      status: "results"
    });
  };

  // Loading ekranı
  if (!roomData || !currentUser) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  const isHost = roomData.hostId === currentUser.id;

  return (
    <main className="room-wrapper fade-in">
      {/* PREMIUM HEADER */}
      <header className="room-header">
        <span className="room-header-text">Oda: {roomId}</span>
        <span className="room-header-text">
          {currentUser.name} {isHost ? "• Host" : ""}
        </span>
      </header>

      {/* LOBBY */}
      {roomData.status === "lobby" && (
        <Lobby
          roomId={roomId as string}
          players={roomData.players}
          isHost={isHost}
          onStartGame={startGame}
        />
      )}

      {/* VOTING */}
      {roomData.status === "voting" && (
        <Voting
          question={roomData.currentQuestion}
          players={roomData.players}
          hasVoted={hasVoted}
          onVote={castVote}
          isHost={isHost}
          onShowResults={showResults}
        />
      )}

      {/* RESULTS */}
      {roomData.status === "results" && (
        <Results
          question={roomData.currentQuestion}
          players={roomData.players}
          votes={roomData.votes}
          isHost={isHost}
          onNextRound={startGame}
        />
      )}
    </main>
  );
}
