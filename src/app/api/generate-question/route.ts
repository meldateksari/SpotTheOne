import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Allowed category values
type CategoryType = "love" | "general" | "friendship" | "funny" | "career";
type LanguageType = "tr" | "en" | "de" | "es" | "ru";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is missing" },
        { status: 500 }
      );
    }

    const body = await request.json();

    const count: number = body.count || 10;
    const category: CategoryType = body.category || "general";
    const language: LanguageType = body.language || "tr";

    // Category descriptions in Turkish (used for context)
    const categoryDescriptions = {
      love: "Aşk, romantizm ve ilişkiler",
      general: "Genel ve karışık konular",
      friendship: "Arkadaşlık ve sosyal ilişkiler",
      funny: "Komik ve eğlenceli durumlar",
      career: "İş hayatı ve kariyer"
    } as const;

    const languageNames = {
      tr: "Turkish",
      en: "English",
      de: "German",
      es: "Spanish",
      ru: "Russian"
    };

    const categoryText = categoryDescriptions[category];
    const targetLanguage = languageNames[language];

    const prompt = `
      Sen "Spot The One" isimli bir parti oyununun sunucususun.
      Oyuncular bir soruyu görür ve grubun içinden soruya en çok kimin uyduğunu seçer.

      Kategori: ${categoryText}
      Hedef Dil: ${targetLanguage}

      Lütfen bu kategoriye uygun ${count} adet eğlenceli, yaratıcı ve birbirinden tamamen farklı soru oluştur.
      
      ÖNEMLİ: Sorular TAMAMEN ${targetLanguage} dilinde olmalı.
      
      Sorular şu kalıplardan biriyle başlamalı (veya hedef dildeki karşılığıyla):
      - "En çok kim..." (Who is most likely to...)
      - "Kim..." (Who...)
      - "Hangi arkadaşımız..." (Which friend...)

      Sorular komik, eğlenceli, biraz utandırıcı veya düşündürücü olabilir.

      ÇIKTI SADECE geçerli bir JSON dizisi olmalı.
      Örnek:
      ["Soru 1?", "Soru 2?", "Soru 3?"]

      Ekstra metin, açıklama, markdown veya kod bloğu ekleme.
    `;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    // Clean JSON if Gemini returns with codeblock
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    let questions: string[] = [];

    try {
      questions = JSON.parse(text);
    } catch (err) {
      console.error("JSON parse failed, fallback used:", text);
      questions = text.split("\n").filter((q) => q.trim().length > 0);
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Error generating questions:", error);
    return NextResponse.json(
      { error: "Failed to generate questions" },
      { status: 500 }
    );
  }
}
