import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, history } = body;

    if (!ai) {
      return NextResponse.json({ 
        answer: "The Gemini API key is missing. Please add GOOGLE_GEMINI_API_KEY to your .env.local file." 
      }, { status: 500 });
    }

    // Format the conversation history for Gemini
    const formattedHistory = history && history.length > 0 
      ? history.map((msg: any) => `\n${msg.role === 'user' ? 'Coach' : 'Assistant'}: ${msg.content}`).join('') 
      : '';

    const systemPrompt = `You are KickXPro Coach Assistant, an elite AI mentor for youth football coaches.
Your goal is to help coaches plan sessions, generate drills, draft parent communications, and provide tactical advice.
Always be professional, concise, and structured. Use bullet points where appropriate.
If a coach asks for a drill, provide: Name, Setup, Instructions, and Coaching Points.
Do not wrap your output in JSON, just output raw markdown text.

Conversation History:${formattedHistory}

Coach: ${message}
Assistant:`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: systemPrompt,
    });

    const answer = response.text || "I'm sorry, I couldn't generate a response.";

    return NextResponse.json({ answer });
  } catch (error: any) {
    console.error("Coach Chat Error:", error);
    return NextResponse.json({ 
      answer: "I encountered an error connecting to the AI engine. Please try again later." 
    }, { status: 500 });
  }
}
