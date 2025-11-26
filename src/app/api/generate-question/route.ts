import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: "GEMINI_API_KEY is not defined" },
                { status: 500 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
      Sen "Spot The One" adlı bir parti oyununun sunucususun.
      Oyunun konsepti: Bir grup arkadaş bir odada toplanır ve ekrana bir soru gelir.
      Herkes bu soruya en çok uyan kişiyi seçer.

      Lütfen oyun için tek bir soru oluştur.
      Soru "En çok kim...", "Kim...", "Hangi arkadaşımız..." gibi kalıplarla başlamalı.
      Komik, eğlenceli, biraz utandırıcı veya düşündürücü olabilir.
      Sadece soruyu döndür, başka hiçbir metin veya açıklama ekleme.
      Örnekler:
      - Zombi istilasında ilk kim ölür?
      - Sarhoşken eski sevgilisini kim arar?
      - Bir tarikat kurmaya en meyilli kim?
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up the response just in case
        const question = text.trim();

        return NextResponse.json({ question });
    } catch (error) {
        console.error("Error generating question:", error);
        return NextResponse.json(
            { error: "Failed to generate question" },
            { status: 500 }
        );
    }
}
