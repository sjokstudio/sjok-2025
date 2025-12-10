import { GoogleGenAI, Type, Schema } from "@google/genai";
import { MusicAnalysis } from "../types";

// Initialize the Gemini API client exclusively with process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MOOD_MAPPING_INSTRUCTION = `
You are an expert Music Theory Analyst. 
Analyze the provided audio file to detect the BPM (Beats Per Minute) and the Musical Key (e.g., C Major, F# Minor).

Based on the detected Key, provide a "Mood Description" in Simplified Chinese using the following logic guide:
- Major Keys: Generally bright, happy, energetic, or pure. (e.g., C Major -> 纯真、光明; D Major -> 胜利、凯旋)
- Minor Keys: Generally sad, melancholic, soft, or dark. (e.g., A Minor -> 柔美、哀愁; E Minor -> 忧郁、深沉)

Output Requirements:
1. "bpm": An integer estimation.
2. "key": The musical key (e.g. "C Major").
3. "mood": A poetic, 2-sentence description of the emotional atmosphere in Simplified Chinese.
4. "explanation": A brief technical explanation (in Chinese) of why this key and tempo create this mood.
`;

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    bpm: { type: Type.INTEGER, description: "The estimated beats per minute" },
    key: { type: Type.STRING, description: "The detected musical key (e.g. C Major)" },
    mood: { type: Type.STRING, description: "Emotional mood description in Chinese" },
    explanation: { type: Type.STRING, description: "Technical explanation in Chinese" }
  },
  required: ["bpm", "key", "mood", "explanation"]
};

export const analyzeAudioWithGemini = async (base64Data: string, mimeType: string): Promise<MusicAnalysis> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: MOOD_MAPPING_INSTRUCTION
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.3,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini.");

    const result = JSON.parse(text) as MusicAnalysis;
    return result;

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw error;
  }
};