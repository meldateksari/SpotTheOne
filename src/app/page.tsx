"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import AvatarSelector from "@/components/AvatarSelector";

export default function Home() {
  const { t, language } = useLanguage();

  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [category, setCategory] = useState("general");
  const [avatar, setAvatar] = useState("bear.png");

  const router = useRouter();

  const categories = [
    { key: "love", label: t("cat_love") },
    { key: "general", label: t("cat_general") },
    { key: "friendship", label: t("cat_friendship") },
    { key: "funny", label: t("cat_funny") },
    { key: "career", label: t("cat_career") },
  ];

  // -------------------------------------------------------
  // 🔥 LOADING SCREEN (ÖNCE BU RETURN EDİLMELİ!)
  // -------------------------------------------------------
  if (isLoading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-white fade-in">
        <div className="flex flex-col items-center space-y-4">
          <div className="spinner"></div>
          <p className="text-sm uppercase tracking-widest text-gray-dark animate-pulse">
            {t("generating", { count: questionCount })}
          </p>
        </div>
      </main>
    );
  }

  // -------------------------------------------------------
  // 🔥 CREATE ROOM
  // -------------------------------------------------------
  const createRoom = async () => {
    if (!name) return alert(t("enterName"));
    if (questionCount < 1 || questionCount > 50)
      return alert(t("questionCountError"));

    // Loading ekranı hemen açılsın
    setIsLoading(true);
    await new Promise((res) => setTimeout(res, 50));

    try {
      // Sorular arka planda oluşturuluyor
      const res = await fetch("/api/generate-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count: questionCount,
          category: category,
          language: language,
        }),
      });

      let questions: string[] = [];
      if (res.ok) {
        const data = await res.json();
        questions = data.questions || [];
      }

      if (questions.length === 0) {
        alert(t("noQuestions"));
        setIsLoading(false);
        return;
      }

      // Oda oluştur
      const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const userId = uuidv4();

      localStorage.setItem(
        "game_user",
        JSON.stringify({ id: userId, name, avatar })
      );

      await setDoc(doc(db, "rooms", newRoomId), {
        status: "lobby",
        currentQuestion: "",
        questions,
        players: [{ id: userId, name, score: 0, avatar }],
        votes: {},
        hostId: userId,
        round: 0,
        language,
      });

      // → Odaya git
      router.push(`/room/${newRoomId}`);
    } catch (error) {
      console.error("Error creating room:", error);
      alert(t("createRoomError"));
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------
  // JOIN ROOM
  // -------------------------------------------------------
  const joinRoom = () => {
    if (!name || !roomId) return alert(t("joinError"));

    const userId = uuidv4();
    localStorage.setItem(
      "game_user",
      JSON.stringify({ id: userId, name, avatar })
    );

    router.push(`/room/${roomId.toUpperCase()}`);
  };

  // -------------------------------------------------------
  // UI
  // -------------------------------------------------------
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-white">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>

      <div className="w-full max-w-sm space-y-10">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold uppercase tracking-tighter">
            Spot The One
          </h1>
          <p className="text-xs uppercase tracking-widest text-gray-dark">
            {t("subtitle")}
          </p>
        </div>

        <Card className="space-y-8 p-0 border-none shadow-none">
          <div className="space-y-6 flex flex-col items-center">
            {/* NAME */}
            <Input
              placeholder={t("yourName")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-center uppercase tracking-widest w-full"
            />

            {/* AVATAR */}
            <AvatarSelector value={avatar} onChange={setAvatar} />

            {/* QUESTIONS */}
            <div className="w-full flex items-center justify-center gap-3">
              <label className="text-xs uppercase tracking-widest text-gray-dark">
                {t("questionsLabel")}
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

            {/* CATEGORY */}
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((cat) => (
                <Button
                  key={cat.key}
                  variant={category === cat.key ? "primary" : "secondary"}
                  className="px-4 py-2 text-xs"
                  onClick={() => setCategory(cat.key)}
                >
                  {cat.label}
                </Button>
              ))}
            </div>

            <Button
              onClick={createRoom}
              variant="primary"
              className="w-full px-10 py-4"
            >
              {t("createRoom")}
            </Button>
          </div>

          {/* OR */}
          <div className="relative flex items-center justify-center">
            <div className="absolute w-full border-t border-gray-mid"></div>
            <span className="relative bg-white px-4 text-xs text-gray-dark uppercase tracking-widest">
              {t("or")}
            </span>
          </div>

          {/* JOIN */}
          <div className="space-y-3">
            <Input
              placeholder={t("roomCode")}
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="text-center uppercase tracking-widest w-full"
            />

            <Button
              onClick={joinRoom}
              variant="secondary"
              className="w-full px-10 py-4"
            >
              {t("join")}
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
