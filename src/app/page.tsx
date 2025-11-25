"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export default function Home() {
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const router = useRouter();

  const createRoom = async () => {
    if (!name) return alert("Lütfen ismini gir!");

    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const userId = uuidv4();

    localStorage.setItem("game_user", JSON.stringify({ id: userId, name }));

    await setDoc(doc(db, "rooms", newRoomId), {
      status: "lobby",
      currentQuestion: "",
      players: [{ id: userId, name, score: 0 }],
      votes: {},
      hostId: userId,
      round: 0
    });

    router.push(`/room/${newRoomId}`);
  };

  const joinRoom = () => {
    if (!name || !roomId) return alert("İsim ve Oda Kodu gerekli!");
    const userId = uuidv4();
    localStorage.setItem("game_user", JSON.stringify({ id: userId, name }));
    router.push(`/room/${roomId.toUpperCase()}`);
  };

  return (
    <main className="home-layout fade-in">
      <h1 className="home-title">Who is Most Likely?</h1>

      <div className="home-card">
        {/* Name Input */}
        <input
          type="text"
          placeholder="Adın"
          className="home-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* Create Room Button */}
        <button className="btn mt" onClick={createRoom}>
          Yeni Oda Kur
        </button>

        <div className="divider"></div>

        {/* Join Room */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Oda Kodu"
            className="home-input"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            style={{ flex: 1, minWidth: 0 }}
          />

          <button
            className="btn-ghost"
            onClick={joinRoom}
            style={{ width: "auto", padding: "14px 16px", whiteSpace: "nowrap" }}
          >
            Katıl
          </button>
        </div>
      </div>
    </main>
  );
}
