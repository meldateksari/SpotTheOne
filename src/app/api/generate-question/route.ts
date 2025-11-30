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
      // First try to parse the text as is (after markdown cleaning)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      questions = JSON.parse(text);
    } catch (err) {
      // If that fails, try to extract the JSON array from the text
      const firstBracket = text.indexOf("[");
      const lastBracket = text.lastIndexOf("]");

      if (firstBracket !== -1 && lastBracket !== -1) {
        const extractedText = text.substring(firstBracket, lastBracket + 1);
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          questions = JSON.parse(extractedText);
        } catch (err2) {
          console.warn("Extracted JSON parse failed, attempting fallback parsing:", extractedText);
          // Fallback logic on the extracted text
          text = extractedText; // Update text to use in fallbacks

          // Fallback 1: Try to fix single quotes
          try {
            const fixedText = text.replace(/'/g, '"');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            questions = JSON.parse(fixedText);
          } catch (err3) {
            // Fallback 2: Manual parsing
            if (text.startsWith("[") && text.endsWith("]")) {
              const content = text.slice(1, -1);
              questions = content
                .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
                .map(q => q.trim().replace(/^['"]|['"]$/g, "").trim())
                .filter(q => q.length > 0);
            } else {
              questions = text.split("\n").filter((q) => q.trim().length > 0);
            }
          }
        }
      } else {
        // No brackets found, fallback to newline split
        questions = text.split("\n").filter((q) => q.trim().length > 0);
      }
    }

    // Edge case: If the result is a string (double encoded JSON), parse it again
    // We cast to any because at runtime 'questions' might be a string if JSON.parse returned a string
    if (typeof questions === "string") {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        questions = JSON.parse(questions as any);
      } catch (e) {
        // If it's just a string, wrap it in an array
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        questions = [questions as any];
      }
    }

    // Edge case: If questions is an array but contains a single string that looks like a JSON array
    // e.g. ['["Q1", "Q2"]']
    if (Array.isArray(questions) && questions.length === 1 && typeof questions[0] === "string") {
      const firstQ = questions[0].trim();
      if (firstQ.startsWith("[") && firstQ.endsWith("]")) {
        try {
          const parsed = JSON.parse(firstQ);
          if (Array.isArray(parsed)) {
            questions = parsed;
          }
        } catch (e) {
          // Ignore parse error, keep as is
        }
      }
    }

    // Ensure we have an array
    if (!Array.isArray(questions)) {
      questions = [String(questions)];
    }

    // Final cleanup of strings
    questions = questions.map(q => String(q).trim()).filter(q => q.length > 0);

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Error generating questions:", error);
    return NextResponse.json(
      { error: "Failed to generate questions" },
      { status: 500 }
    );
  }
}
