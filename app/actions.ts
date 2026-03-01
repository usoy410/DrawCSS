"use server";

import { getGeminiModel } from "@/lib/gemini";

export async function processImageToCode(base64Image: string) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not set");
    }

    const model = getGeminiModel();

    // Remove data URL prefix if present
    const base64Data = base64Image.split(",")[1] || base64Image;

    const maxRetries = 2;
    let attempt = 0;

    async function tryGenerate(): Promise<{ code: string }> {
        try {
            const result = await model.generateContentStream([
                {
                    inlineData: {
                        data: base64Data,
                        mimeType: "image/png",
                    },
                },
                "Convert this sketch into a responsive Tailwind CSS and HTML component. Follow the system instructions exactly.",
            ]);

            let text = "";
            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                text += chunkText;
            }

            return { code: text };
        } catch (error: any) {
            console.error(`Gemini API Error (Attempt ${attempt + 1}):`, error);

            // Check for 429 Too Many Requests
            if (error?.status === 429 && attempt < maxRetries) {
                attempt++;
                const delay = 5000 * attempt; // 5s, 10s backoff
                console.log(`Rate limited. Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return tryGenerate();
            }

            if (error?.status === 429) {
                throw new Error("API_RATE_LIMIT");
            }

            throw new Error("GENERIC_API_ERROR");
        }
    }

    return tryGenerate();
}
