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
  const [questionCount, setQuestionCount] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const createRoom = async () => {
    if (!name) return alert("Lütfen ismini gir!");
    if (questionCount < 1 || questionCount > 50) return alert("Soru sayısı 1 ile 50 arasında olmalı!");

    setIsLoading(true);

    try {
      // 1. Generate questions first
      const res = await fetch("/api/generate-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: questionCount }),
      });

      let questions: string[] = [];
      if (res.ok) {
        const data = await res.json();
        questions = data.questions || [];
      } else {
        console.error("Failed to generate questions");
        // Fallback or alert? For now, let's alert but maybe continue with empty?
        // Better to stop if we promised questions.
        alert("Soru oluşturulurken bir hata oluştu. Lütfen tekrar dene.");
        setIsLoading(false);
        return;
      }

      if (questions.length === 0) {
        alert("Hiç soru oluşturulamadı. Lütfen tekrar dene.");
        setIsLoading(false);
        return;
      }

      const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const userId = uuidv4();

      localStorage.setItem("game_user", JSON.stringify({ id: userId, name }));

      await setDoc(doc(db, "rooms", newRoomId), {
        status: "lobby",
        currentQuestion: "",
        questions: questions, // Store all generated questions
        players: [{ id: userId, name, score: 0 }],
        votes: {},
        hostId: userId,
        round: 0
      });

      router.push(`/room/${newRoomId}`);
    } catch (error) {
      console.error("Error creating room:", error);
      alert("Oda oluşturulurken bir hata oluştu.");
      setIsLoading(false);
    }
  };

  const joinRoom = () => {
    if (!name || !roomId) return alert("İsim ve Oda Kodu gerekli!");
    const userId = uuidv4();
    localStorage.setItem("game_user", JSON.stringify({ id: userId, name }));
    router.push(`/room/${roomId.toUpperCase()}`);
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-white fade-in">
        <div className="flex flex-col items-center space-y-4">
          <div className="spinner"></div>
          <p className="text-sm uppercase tracking-widest text-gray-dark animate-pulse">
            Generating {questionCount} Questions...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8 md:px-6 bg-white fade-in">
  <div className="w-full max-w-sm space-y-10">

    {/* TITLE */}
    <div className="text-center space-y-2">
      <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-tighter">
        Spot The One
      </h1>
      <p className="text-[10px] md:text-xs uppercase tracking-widest text-gray-dark">
        Who is most likely?
      </p>
    </div>

    {/* MAIN CARD */}
    <Card className="space-y-8 border-none shadow-none p-0">

      {/* NAME + QUESTION */}
      <div className="space-y-6 flex flex-col items-center">

        <Input
          placeholder="YOUR NAME"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="text-center uppercase tracking-widest w-full"
        />

        {/* QUESTIONS LINE */}
        <div className="w-full flex flex-col xs:flex-row items-center justify-center gap-3">
          <label className="text-[10px] md:text-xs uppercase tracking-widest text-gray-dark whitespace-nowrap">
            Questions:
          </label>

          <Input
            type="number"
            min={1}
            max={50}
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            className="text-center uppercase tracking-widest w-24"
          />
        </div>

        {/* CREATE BUTTON */}
        <Button
          onClick={createRoom}
          variant="primary"
          className="w-full sm:w-auto px-10 py-4"
        >
          Create New Room
        </Button>
      </div>

      {/* OR DIVIDER */}
      <div className="relative flex items-center justify-center">
        <div className="absolute w-full border-t border-gray-mid"></div>
        <span className="relative bg-white px-4 text-[10px] md:text-xs text-gray-dark uppercase tracking-widest">
          or
        </span>
      </div>

      {/* JOIN ROOM */}
      <div className="space-y-3">

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Input
            placeholder="ROOM CODE"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="text-center uppercase tracking-widest w-full"
          />

          <Button
            onClick={joinRoom}
            variant="secondary"
            className="w-full sm:w-auto px-8 py-4"
          >
            Join
          </Button>
        </div>

      </div>
    </Card>
  </div>
</main>

  );
}
