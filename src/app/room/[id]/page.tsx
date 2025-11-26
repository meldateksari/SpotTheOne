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
      updatePayload.hostId =
        updatedPlayers.length > 0 ? updatedPlayers[0].id : undefined;
    }

    await updateDoc(roomRef, updatePayload);

    // Local storage temizle
    localStorage.removeItem("game_user");

    // Anasayfaya dön
    window.location.href = "/";
  } catch (err) {
    console.error("Leave room error:", err);
  }
};


  // Game Actions
  const startGame = async () => {
    if (!roomId) return;

    let questionText = "";

    try {
      const res = await fetch("/api/generate-question");
      if (res.ok) {
        const data = await res.json();
        questionText = data.question;
      }
    } catch (error) {
      console.error("Failed to fetch question from API", error);
    }

    // Fallback if API fails
    if (!questionText) {
      //questionText = questions[Math.floor(Math.random() * questions.length)];
    }

    await updateDoc(doc(db, "rooms", roomId as string), {
      status: "voting",
      currentQuestion: questionText,
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
      {/* PREMIUM HEADER */}
      {/* PREMIUM HEADER (Sub-bar) */}
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
