import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export async function POST(request: Request) {
  try {
    const { action, answer, scenario } = await request.json();

    if (!ai) {
      return NextResponse.json({ error: "AI Engine offline" }, { status: 500 });
    }

    if (action === 'generate_scenario') {
      const prompt = `You are a professional football tactician. Create a realistic, challenging Match IQ scenario for a youth player.
The scenario should describe a specific moment in a match (e.g., "You are a CDM receiving the ball from the CB under high pressure...").
Provide 3 multiple choice options (A, B, C) for what the player should do.
Return the response strictly as JSON with this schema:
{
  "scenario": "description of the situation",
  "options": [
    { "id": "A", "text": "Option A text" },
    { "id": "B", "text": "Option B text" },
    { "id": "C", "text": "Option C text" }
  ],
  "correctOptionId": "A",
  "explanation": "Why this is the best choice."
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      let text = response.text || "";
      // Strip markdown code blocks
      text = text.replace(/```json\s*/, "").replace(/```\s*$/, "").trim();
      
      const data = JSON.parse(text);
      return NextResponse.json(data);
    } 
    else if (action === 'evaluate_answer') {
      // For MVP, we pass the correct option in the scenario object itself, but if we wanted dynamic feedback:
      const prompt = `A youth football player was given this scenario: "${scenario}".
They chose this action: "${answer}".
Give them a short, encouraging 2-sentence feedback on their decision from the perspective of an elite coach.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      return NextResponse.json({ feedback: response.text });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Match IQ Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
