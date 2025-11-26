"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc, getDoc, arrayUnion } from "firebase/firestore";

// ... existing imports ...


import { questions } from "@/utils/questions";
import { RoomData, Player } from "@/types";

import Lobby from "@/components/Lobby";
import Voting from "@/components/Voting";
import Results from "@/components/Results";
import GameOverModal from "@/components/GameOverModal";

// ... existing imports ...

export default function RoomPage() {
  const { id: roomId } = useParams();
  const router = useRouter();

  const [currentUser] = useState<Player | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("game_user");
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });

  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
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
        if (data.status === "gameover") setShowGameOver(true);
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  //odadan cıkma
  const leaveRoom = async () => {
    if (!roomId || !currentUser || !roomData) return;

    const roomRef = doc(db, "rooms", roomId as string);

    try {
      // Çıkan oyuncuyu listeden çıkar
      const updatedPlayers: Player[] = roomData.players.filter(
        (p) => p.id !== currentUser.id
      );

      // Güncellenecek payload tipi
      const updatePayload: Partial<RoomData> = {
        players: updatedPlayers
      };

      // Host çıkıyorsa yeni host belirle
      if (roomData.hostId === currentUser.id) {
        if (updatedPlayers.length > 0) {
          updatePayload.hostId = updatedPlayers[0].id;
        } else {
          updatePayload.hostId = "";
        }
      }

      await updateDoc(roomRef, updatePayload);

      // Local storage temizle
      localStorage.removeItem("game_user");

      router.push("/");
    } catch (err) {
      console.error("Leave room error:", err);
      alert("Odadan çıkarken bir hata oluştu.");
    }
  };

  // Game Actions
  const startGame = async () => {
    if (!roomId || !roomData) return;

    const currentRound = roomData.round || 0;
    const questions = roomData.questions || [];

    if (currentRound >= questions.length) {
      // Global Game Over update
      await updateDoc(doc(db, "rooms", roomId as string), {
        status: "gameover"
      });
      return;
    }

    const questionText = questions[currentRound];

    await updateDoc(doc(db, "rooms", roomId as string), {
      status: "voting",
      currentQuestion: questionText,
      votes: {},
      votedPlayers: [], // Reset voted players
      votingStartedAt: Date.now(), // Start timer
      round: currentRound + 1
    });
  };

  const castVote = async (targetPlayerId: string) => {
    if (hasVoted || !roomId || !roomData) return;

    setHasVoted(true);

    const currentVotes = roomData.votes || {};
    const newCount = (currentVotes[targetPlayerId] || 0) + 1;

    await updateDoc(doc(db, "rooms", roomId as string), {
      [`votes.${targetPlayerId}`]: newCount,
      votedPlayers: arrayUnion(currentUser?.id) // Add current user to voted list
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
      {showGameOver && <GameOverModal />}

      {/* PREMIUM HEADER */}
      {/* ... existing header ... */}
      <header className="w-full flex justify-between items-center py-4 border-b border-gray-mid mb-8">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest">
          <span className="text-gray-500">Room</span>
          <span className="text-black font-bold">{roomId}</span>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest">
          <span className="text-black">{currentUser.name}</span>
          {isHost && (
            <span className="bg-black text-white px-2 py-1 text-[10px] tracking-widest">
              HOST
            </span>
          )}
          {/* Leave Button */}
          <button
            onClick={leaveRoom}
            className="flex items-center gap-1 text-xs font-premium text-red-600 hover:text-red-800 transition-all"
          >
            <span className="material-symbols-outlined">door_open</span>
            Leave
          </button>
        </div>
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
          votedPlayers={roomData.votedPlayers || []}
          votingStartedAt={roomData.votingStartedAt || 0}
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
