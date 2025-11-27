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

import { RoomData, Player } from "@/types";

import AvatarSelector from "@/components/AvatarSelector";
import Lobby from "@/components/Lobby";
import Voting from "@/components/Voting";
import Results from "@/components/Results";
import GameOverModal from "@/components/GameOverModal";
import Chat from "@/components/Chat";

export default function RoomPage() {
  const { id: roomId } = useParams();
  const router = useRouter();
  const { t, setLanguage } = useLanguage();

  // ---- GLOBAL AVATAR STATE (her zaman var olacak) ----
  const [tempAvatar, setTempAvatar] = useState("bear.png");

  // ---- CURRENT USER ----
  const [currentUser, setCurrentUser] = useState<Player | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("game_user");
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });

  // ROOM DATA & OTHERS
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const hasJoinedRef = useRef(false);

  // ===========================================================
  // JOIN ROOM
  // ===========================================================
  useEffect(() => {
    if (!currentUser || !roomId || hasJoinedRef.current) return;

    const joinRoom = async () => {
      try {
        const roomRef = doc(db, "rooms", roomId as string);
        const snap = await getDoc(roomRef);
        if (!snap.exists()) return;

        const data = snap.data() as RoomData;
        const players = data.players || [];

        if (data.language) setLanguage(data.language as Language);

        const alreadyInRoom = players.some((p) => p.id === currentUser.id);
        if (!alreadyInRoom) {
          await updateDoc(roomRef, {
            players: [...players, currentUser]
          });
        }

        hasJoinedRef.current = true;

      } catch (err) {
        console.error("Join error:", err);
        alert(t("roomJoinError"));
      }
    };

    joinRoom();
  }, [currentUser, roomId]);

  // ===========================================================
  // LISTENER
  // ===========================================================
  useEffect(() => {
    if (!roomId) return;

    const roomRef = doc(db, "rooms", roomId as string);

    return onSnapshot(roomRef, (docSnap) => {
      if (!docSnap.exists()) return;

      const data = docSnap.data() as RoomData;
      setRoomData(data);

      if (data.status === "results") setHasVoted(false);
      if (data.status === "gameover") setShowGameOver(true);
    });
  }, [roomId]);

  // ===========================================================
  // LEAVE ROOM
  // ===========================================================
  const leaveRoom = async () => {
    if (!roomId || !currentUser || !roomData) return;

    const roomRef = doc(db, "rooms", roomId as string);

    const updatedPlayers = roomData.players.filter((p) => p.id !== currentUser.id);
    const updatePayload: Partial<RoomData> = { players: updatedPlayers };

    if (roomData.hostId === currentUser.id) {
      updatePayload.hostId = updatedPlayers[0]?.id || "";
    }

    await updateDoc(roomRef, updatePayload);
    localStorage.removeItem("game_user");
    router.push("/");
  };

  // ===========================================================
  // GAME ACTIONS
  // ===========================================================
  const startGame = async () => {
    if (!roomId || !roomData) return;

    const currentRound = roomData.round || 0;
    const questions = roomData.questions || [];

    if (currentRound >= questions.length) {
      await updateDoc(doc(db, "rooms", roomId as string), { status: "gameover" });
      return;
    }

    await updateDoc(doc(db, "rooms", roomId as string), {
      status: "voting",
      currentQuestion: questions[currentRound],
      votes: {},
      votedPlayers: [],
      votingStartedAt: Date.now(),
      round: currentRound + 1
    });
  };

  const castVote = async (targetPlayerId: string) => {
    if (hasVoted || !roomId || !roomData) return;

    setHasVoted(true);

    const newCount = (roomData.votes?.[targetPlayerId] || 0) + 1;

    await updateDoc(doc(db, "rooms", roomId as string), {
      [`votes.${targetPlayerId}`]: newCount,
      votedPlayers: arrayUnion(currentUser?.id)
    });
  };

  const showResults = async () => {
    if (!roomId) return;
    await updateDoc(doc(db, "rooms", roomId as string), { status: "results" });
  };

  // ===========================================================
  // LOADING
  // ===========================================================
  if (!roomData) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  // ===========================================================
  // USER NOT LOGGED (QR)
  // ===========================================================
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
              const name = new FormData(e.currentTarget).get("name") as string;
              if (!name.trim()) return;

              const userId = uuidv4();
              const user: Player = {
                id: userId,
                name: name.trim(),
                score: 0,
                avatar: tempAvatar,  // 🔥 GLOBAL TEMP AVATAR
              };

              localStorage.setItem("game_user", JSON.stringify(user));
              setCurrentUser(user);
            }}
            className="space-y-4"
          >

            <div className="flex w-full gap-2">
              <AvatarSelector value={tempAvatar} onChange={setTempAvatar} />
              <Input
                name="name"
                placeholder={t("yourName")}
                className="text-center uppercase tracking-widest w-full"
                required
              />
            </div>

            <Button type="submit" variant="primary" className="w-full">
              {t("joinGame")}
            </Button>

          </form>

        </Card>
      </main>
    );
  }

  // ===========================================================
  // HOST CHECK
  // ===========================================================
  const isHost = roomData.hostId === currentUser.id;

  // ===========================================================
  // MAIN UI
  // ===========================================================
  return (
    <main className="room-wrapper fade-in px-4 md:px-8 w-full max-w-2xl mx-auto">

      {showGameOver && <GameOverModal />}

      {/* HEADER */}
      <header className="w-full flex flex-col md:flex-row md:justify-between md:items-center gap-3 py-4 border-b border-gray-mid mb-6">

        <div className="flex items-center gap-2 text-xs uppercase tracking-widest">
          <span className="text-gray-500">{t("roomLabel")}</span>
          <span className="text-black font-bold">{roomId}</span>
        </div>

        <div className="flex items-center gap-2 text-xs uppercase tracking-widest">

          <img
            src={`/animals/${currentUser.avatar}`}
            className="w-8 h-8 object-contain rounded"
          />

          <span>{currentUser.name}</span>

          {isHost && (
            <span className="bg-black text-white px-2 py-1 text-[10px] tracking-widest">
              {t("hostLabel")}
            </span>
          )}

          <button
            onClick={leaveRoom}
            className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            {t("leave")}
          </button>

        </div>

      </header>

      {/* SCREENS */}
      {roomData.status === "lobby" && (
        <Lobby
          roomId={roomId as string}
          players={roomData.players}
          isHost={isHost}
          onStartGame={startGame}
          hostId={roomData.hostId}
        />
      )}

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

      {roomData.status === "results" && (
        <Results
          question={roomData.currentQuestion}
          players={roomData.players}
          votes={roomData.votes}
          isHost={isHost}
          onNextRound={startGame}
        />
      )}

      {/* CHAT */}
      <Chat roomId={roomId as string} currentUser={currentUser} />

    </main>
  );
}
