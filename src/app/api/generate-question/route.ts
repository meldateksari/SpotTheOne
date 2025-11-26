import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: "GEMINI_API_KEY is not defined" },
                { status: 500 }
            );
        }

        const body = await request.json();
        const count = body.count || 10; // Default to 10 if not specified

        // Limit count to be safe (1-50)
        const safeCount = Math.max(1, Math.min(50, count));

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
      Sen "Spot The One" adlı bir parti oyununun sunucususun.
      Oyunun konsepti: Bir grup arkadaş bir odada toplanır ve ekrana bir soru gelir.
      Herkes bu soruya en çok uyan kişiyi seçer.

      Lütfen oyun için ${safeCount} adet birbirinden farklı soru oluştur.
      Sorular "En çok kim...", "Kim...", "Hangi arkadaşımız..." gibi kalıplarla başlamalı.
      Komik, eğlenceli, biraz utandırıcı veya düşündürücü olabilir.
      
      Çıktıyı SADECE geçerli bir JSON dizisi (array of strings) olarak ver.
      Örnek format:
      ["Soru 1?", "Soru 2?", "Soru 3?"]
      
      Başka hiçbir metin, markdown formatı (\`\`\`json gibi) veya açıklama ekleme. Sadece saf JSON dizisi.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean up potential markdown code blocks if Gemini adds them
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();

        let questions: string[] = [];
        try {
            questions = JSON.parse(text);
        } catch (e) {
            console.error("Failed to parse JSON from Gemini:", text);
            // Fallback if parsing fails - try to split by newlines if it looks like a list
            questions = text.split("\n").filter(line => line.trim().length > 0);
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
