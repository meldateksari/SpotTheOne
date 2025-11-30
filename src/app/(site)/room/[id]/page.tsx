"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc, getDoc, arrayUnion, deleteDoc, addDoc, collection } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import Toast from "@/components/ui/Toast";

import { useLanguage } from "@/context/LanguageContext";
import { Language } from "@/utils/translations";

import { RoomData, Player } from "@/types";

import AvatarSelector from "@/components/common/AvatarSelector";
import Lobby from "@/components/features/game/Lobby";
import Voting from "@/components/features/game/Voting";
import Results from "@/components/features/game/Results";
import GameOverScreen from "@/components/features/game/GameOverScreen";
import Chat from "@/components/features/chat/Chat";
import VoiceChat from "@/components/features/chat/VoiceChat";

import AlertModal from "@/components/ui/AlertModal";
import { Tooltip } from "@/components/ui/Tooltip";

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
  const [isSharing, setIsSharing] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // ALERT STATE
  const [alertInfo, setAlertInfo] = useState<{ show: boolean; message: string; title?: string }>({
    show: false,
    message: "",
  });

  // Refs for state access in effects/callbacks
  const joinedRoomIdRef = useRef<string | null>(null);
  const roomDataRef = useRef<RoomData | null>(null);
  const currentUserRef = useRef<Player | null>(null);
  const isLeavingRef = useRef(false);

  useEffect(() => {
    roomDataRef.current = roomData;
  }, [roomData]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // ===========================================================
  // JOIN ROOM
  // ===========================================================
  useEffect(() => {
    if (!currentUser || !roomId) return;

    // Prevent double joining or joining if already joined this specific room
    if (joinedRoomIdRef.current === roomId) return;

    const joinRoom = async () => {
      try {
        const roomRef = doc(db, "rooms", roomId as string);
        const snap = await getDoc(roomRef);
        if (!snap.exists()) return;

        const data = snap.data() as RoomData;
        const players = data.players || [];

        if (data.language) setLanguage(data.language as Language);

        const alreadyInRoom = players.some((p) => p.id === currentUser.id);

        // 🔥 CHECK IF GAME STARTED
        if (!alreadyInRoom && data.status !== "lobby") {
          setAlertInfo({
            show: true,
            title: t("error") || "Error",
            message: t("gameAlreadyStarted"),
          });
          return;
        }

        if (!alreadyInRoom) {
          await updateDoc(roomRef, {
            players: [...players, currentUser]
          });
        }

        joinedRoomIdRef.current = roomId as string;
        isLeavingRef.current = false; // Reset leave flag for new room

      } catch (err) {
        console.error("Join error:", err);
        setAlertInfo({
          show: true,
          title: t("error") || "Error",
          message: t("roomJoinError"),
        });
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
      if (!docSnap.exists()) {
        // Room deleted (e.g. by host or timeout)
        localStorage.removeItem("game_user");
        router.push("/");
        return;
      }

      const data = docSnap.data() as RoomData;
      setRoomData(data);

      if (data.status === "results") setHasVoted(false);
      if (data.status === "gameover") setShowGameOver(true);
    });
  }, [roomId]);

  // ===========================================================
  // LEAVE ROOM LOGIC
  // ===========================================================
  // Stable callback for leaving
  const handleLeaveRoom = async () => {
    // Prevent double execution
    if (isLeavingRef.current) return;
    isLeavingRef.current = true;

    const user = currentUserRef.current;
    const data = roomDataRef.current;
    // Use the roomId from the ref if possible, or the current roomId.
    // Since this runs on unmount, roomId might be stale if we didn't capture it?
    // But joinedRoomIdRef tracks the room we are actually IN.
    const targetRoomId = joinedRoomIdRef.current || roomId;

    if (!targetRoomId || !user || !data) return;

    const roomRef = doc(db, "rooms", targetRoomId as string);

    // Add "Player Left" message to chat
    try {
      await addDoc(collection(db, "rooms", targetRoomId as string, "messages"), {
        senderId: "system",
        senderName: "System",
        text: "Player Left", // Fallback text
        translationKey: "playerLeft",
        translationParams: { name: user.name },
        createdAt: Date.now()
      });
    } catch (err) {
      console.error("Error sending leave message:", err);
    }

    // Re-fetch latest data to ensure atomic-ish update? 
    // Or just use what we have. Local state might be slightly stale.
    // Ideally we should use transaction or arrayRemove, but arrayRemove needs exact object.
    // Filter is safer.
    const updatedPlayers = data.players.filter((p) => p.id !== user.id);

    // If no players left, delete room
    if (updatedPlayers.length === 0) {
      await deleteDoc(roomRef);
    } else {
      const updatePayload: Partial<RoomData> = { players: updatedPlayers };

      if (data.hostId === user.id) {
        updatePayload.hostId = updatedPlayers[0]?.id || "";
      }

      await updateDoc(roomRef, updatePayload);
    }
  };

  const leaveRoom = async () => {
    await handleLeaveRoom();
    localStorage.removeItem("game_user");
    router.push("/");
  };

  // Handle browser close / tab close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      handleLeaveRoom();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [roomId]); // Re-bind if roomId changes

  // Handle component unmount (navigation away)
  useEffect(() => {
    return () => {
      handleLeaveRoom();
    };
  }, []);

  // ===========================================================
  // GAME ACTIONS
  // ===========================================================
  const startGame = async (duration: number = 30) => {
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
      round: currentRound + 1,
      questionDuration: duration // Save duration
    });
  };

  const castVote = async (targetPlayerId: string) => {
    if (hasVoted || !roomId || !roomData) return;

    setHasVoted(true);

    const newCount = (roomData.votes?.[targetPlayerId] || 0) + 1;

    await updateDoc(doc(db, "rooms", roomId as string), {
      [`votes.${targetPlayerId}`]: newCount,
      [`playerVotes.${currentUser?.id}`]: targetPlayerId,
      votedPlayers: arrayUnion(currentUser?.id)
    });
  };

  const showResults = async () => {
    if (!roomId || !roomData) return;

    // Calculate Scores
    const votes = roomData.votes || {};
    const players = roomData.players || [];

    // Find winner ID
    const winnerId = Object.keys(votes).reduce((a, b) =>
      (votes[a] || 0) > (votes[b] || 0) ? a : b
      , players[0]?.id);

    // Find players who voted for the winner
    // We need to track WHO voted for WHOM. 
    // Currently we only track vote counts: { [targetId]: count } and votedPlayers: [voterId]
    // We are missing the link of "Voter X voted for Target Y".
    // To fix this properly without changing data structure too much:
    // We can't know who voted for whom with current structure.
    // We need to update castVote to store votes as { [voterId]: targetId } or similar.
    // BUT, changing data structure now might break things.
    // Let's check castVote.

    // Wait, I need to check castVote implementation first.
    // It does: `votes.${targetPlayerId}`: newCount.
    // It does NOT store who voted for whom.

    // CRITICAL: I cannot implement scoring based on "who voted for winner" without storing that info.
    // Alternative: The person who got the most votes gets points? 
    // "Spot The One" usually means "Who is most likely?".
    // If I am "Most likely to eat pizza", do I get points? Or do people who voted for me get points?
    // Usually, the goal is to match the majority.

    // I will update castVote to store individual votes in a separate field `playerVotes: { [voterId]: targetId }`.
    // Then I can calculate scores here.

    // Since I cannot change castVote in this same tool call easily (it's a different function),
    // I will first update showResults to just set status, AND I will update castVote in the next step.
    // OR I can do both if they are close. They are in the same file.

    // Let's assume I will update castVote to store `playerVotes`.
    // So here I will use `roomData.playerVotes`.

    const playerVotes = roomData.playerVotes || {};
    const updatedPlayers = players.map(p => {
      if (playerVotes[p.id] === winnerId) {
        return { ...p, score: (p.score || 0) + 10 }; // +10 points for correct vote
      }
      return p;
    });

    await updateDoc(doc(db, "rooms", roomId as string), {
      status: "results",
      players: updatedPlayers
    });
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
                maxLength={15}
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

      {/* HEADER */}
      <header className="w-full flex flex-col md:flex-row md:justify-between md:items-center gap-3 py-4 border-b border-gray-mid mb-6">

        <div className="flex items-center gap-2 text-xs uppercase tracking-widest">
          <span className="text-gray-500">{t("roomLabel")}</span>
          <span className="text-black font-bold">{roomId}</span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              setShowToast(true);
            }}
            className="ml-2 p-1 hover:bg-gray-100 rounded"
            title="Copy Link"
          >
            <span className="material-symbols-outlined text-sm">content_copy</span>
          </button>
          {typeof navigator !== "undefined" && navigator.share && (
            <button
              onClick={async () => {
                if (isSharing) return;
                setIsSharing(true);
                try {
                  await navigator.share({
                    title: "Spot The One",
                    text: `Join my room: ${roomId}`,
                    url: window.location.href,
                  });
                } catch (err) {
                  console.log("Share failed or canceled:", err);
                } finally {
                  setIsSharing(false);
                }
              }}
              className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
              title="Share"
              disabled={isSharing}
            >
              <span className="material-symbols-outlined text-sm">share</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs uppercase tracking-widest">

          <img
            src={`/animals/${currentUser.avatar}`}
            className="w-8 h-8 object-contain rounded"
          />

          <Tooltip content={currentUser.name} className="truncate max-w-[100px] md:max-w-[150px]">
            {currentUser.name}
          </Tooltip>

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
          round={roomData.round || 1}
          duration={roomData.questionDuration || 30}
        />
      )}

      {roomData.status === "results" && (
        <Results
          question={roomData.currentQuestion}
          players={roomData.players}
          votes={roomData.votes}
          isHost={isHost}
          onNextRound={() => startGame(roomData.questionDuration || 30)}
          currentRound={roomData.round || 0}
          totalQuestions={roomData.questions?.length || 0}
        />
      )}

      {roomData.status === "gameover" && (
        <GameOverScreen
          roomId={roomId as string}
          players={roomData.players}
          isHost={isHost}
        />
      )}

      {/* CHAT */}
      <Chat roomId={roomId as string} currentUser={currentUser} players={roomData.players} />

      {/* VOICE CHAT */}
      <VoiceChat
        roomId={roomId as string}
        currentUser={currentUser}
        players={roomData.players}
        voiceParticipants={roomData.voiceParticipants || []}
        hostId={roomData.hostId}
      />

      {/* TOAST NOTIFICATION */}
      <Toast
        message={t("linkCopied") || "Link Copied!"}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

      {/* ALERT MODAL */}
      <AlertModal
        isOpen={alertInfo.show}
        title={alertInfo.title}
        message={alertInfo.message}
        onClose={() => {
          setAlertInfo({ ...alertInfo, show: false });
          router.push("/");
        }}
      />

    </main>
  );
}
