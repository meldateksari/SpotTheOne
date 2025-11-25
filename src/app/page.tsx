"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

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
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-white fade-in">
      <div className="w-full max-w-md space-y-12">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold uppercase tracking-tighter">Spot The One</h1>
          <p className="text-xs uppercase tracking-widest text-gray-dark">Who is most likely?</p>
        </div>

        <Card className="space-y-8 border-none shadow-none p-0">
          <div className="space-y-6 flex flex-col items-center">
            <Input
              placeholder="YOUR NAME"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-center uppercase tracking-widest"
            />

            <Button onClick={createRoom} variant="primary" className="w-auto px-12">
              Create New Room
            </Button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="absolute w-full border-t border-gray-mid"></div>
            <span className="relative bg-white px-4 text-xs text-gray-dark uppercase tracking-widest">or</span>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4">
              <Input
                placeholder="ROOM CODE"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="text-center uppercase tracking-widest"
              />
              <Button onClick={joinRoom} variant="secondary" className="w-auto px-8">
                Join
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
