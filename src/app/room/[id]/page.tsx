"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc, getDoc, arrayUnion } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/context/LanguageContext";
import { Language } from "@/utils/translations";

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
  const { t, setLanguage } = useLanguage();

  const [currentUser, setCurrentUser] = useState<Player | null>(() => {
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

        // Sync language from room
        if (data.language) {
          setLanguage(data.language as Language);
        }

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
        alert(t("roomJoinError"));
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

        // Ensure language is synced if it changes or on first load via snapshot too
        if (data.language) {
          // We can check if it's different to avoid loops, but setLanguage usually handles it.
          // However, to be safe, we might want to only set it if different.
          // But since we can't easily access current language inside this callback without dependency,
          // we rely on the component re-render or just set it.
          // Actually, let's not set it here repeatedly to avoid re-renders if not needed.
          // The initial join handles it. But if I join via link without being in the room yet?
          // The joinRoom effect handles it.
        }

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
      alert(t("roomLeaveError"));
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
  // Loading ekranı (Sadece roomData yoksa)
  if (!roomData) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  // Eğer kullanıcı yoksa (QR ile gelmişse) isim isteme ekranı
  if (!currentUser) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-white fade-in">
        <Card className="w-full max-w-sm p-8 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold uppercase tracking-tighter">{t("joinRoomTitle")}</h2>
            <p className="text-xs uppercase tracking-widest text-gray-dark">{t("enterNameJoin")}</p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const name = formData.get("name") as string;
              if (!name.trim()) return;

              const userId = uuidv4();
              const user = { id: userId, name: name.trim(), score: 0 }; // Initialize score

              localStorage.setItem("game_user", JSON.stringify(user));
              setCurrentUser(user);
            }}
            className="space-y-4"
          >
            <Input
              name="name"
              placeholder={t("yourName")}
              className="text-center uppercase tracking-widest"
              autoFocus
              required
            />
            <Button type="submit" variant="primary" className="w-full">
              {t("joinGame")}
            </Button>
          </form>
        </Card>
      </main>
    );
  }

  const isHost = roomData.hostId === currentUser.id;

  return (
    <main className="room-wrapper fade-in px-4 md:px-8 w-full max-w-2xl mx-auto">
      {showGameOver && <GameOverModal />}

      {/* PREMIUM RESPONSIVE HEADER */}
      <header className="
      w-full 
      flex flex-col 
      md:flex-row 
      md:justify-between 
      md:items-center 
      gap-3 
      py-4 
      border-b border-gray-mid 
      mb-6
    "
      >
        {/* Left */}
        <div className="flex items-center gap-2 text-[11px] md:text-xs font-medium uppercase tracking-widest">
          <span className="text-gray-500">{t("roomLabel")}</span>
          <span className="text-black font-bold break-all">{roomId}</span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 text-[11px] md:text-xs font-medium uppercase tracking-widest">

          <span className="text-black break-all">{currentUser.name}</span>

          {isHost && (
            <span className="bg-black text-white px-2 py-1 text-[9px] md:text-[10px] tracking-widest">
              {t("hostLabel")}
            </span>
          )}

          {/* Leave Button */}
          <button
            onClick={leaveRoom}
            className="flex items-center gap-1 text-[11px] md:text-xs text-red-600 hover:text-red-800 transition-all"
          >
            <span className="material-symbols-outlined text-[16px] md:text-[20px]">
              logout
            </span>
            <span className="font-premium">{t("leave")}</span>
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
