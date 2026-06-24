import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, history, coachId } = body;

    // Create Supabase client with Service Role for admin inserts
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

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

You have access to tools:
- search_youtube_drill: Use this when the coach asks for a video of a drill or technique.
- save_drill_to_library: Use this ONLY if the coach explicitly asks you to "save this drill", "add this to my library", etc.

Conversation History:${formattedHistory}

Coach: ${message}
Assistant:`;

    const tools = [{
      functionDeclarations: [
        {
          name: 'search_youtube_drill',
          description: 'Search YouTube for a specific football drill or technique and get the URL to share with the user.',
          parameters: {
            type: Type.OBJECT,
            properties: {
              query: { type: Type.STRING, description: 'The search query, e.g., "La Masia Rondo 4v2"' },
            },
            required: ['query'],
          },
        },
        {
          name: 'save_drill_to_library',
          description: 'Save a generated drill directly into the coach\'s private database library. Only use when explicitly requested.',
          parameters: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              category: { type: Type.STRING, description: 'e.g., Passing, Tactical, Fitness, Shooting, Goalkeeping, Match Prep' },
              duration_mins: { type: Type.NUMBER },
              difficulty: { type: Type.STRING, description: 'Beginner, Intermediate, Advanced' },
              description: { type: Type.STRING },
              media_url: { type: Type.STRING, description: 'Optional YouTube URL' },
            },
            required: ['title', 'category', 'duration_mins', 'difficulty', 'description'],
          },
        }
      ]
    }];

    // First model call
    let response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: systemPrompt,
        tools: tools,
    });

    let answer = response.text || "";

    // Check if the model wants to call a function
    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      let functionResponseData: any = {};

      if (call.name === 'search_youtube_drill') {
        const q = (call.args as any).query;
        functionResponseData = { 
          result: "Search successful", 
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}` 
        };
      } 
      else if (call.name === 'save_drill_to_library') {
        if (!coachId) {
          functionResponseData = { error: "Coach ID missing. Could not save to database." };
        } else {
          const args = call.args as any;
          const { error } = await supabaseAdmin.from('drills').insert({
            coach_id: coachId,
            title: args.title,
            category: args.category,
            duration_mins: args.duration_mins,
            difficulty: args.difficulty,
            description: args.description,
            media_url: args.media_url || null
          });
          if (error) {
            console.error("Save drill error:", error);
            functionResponseData = { error: "Failed to save drill to database due to an internal error." };
          } else {
            functionResponseData = { success: true, message: `Drill '${args.title}' successfully saved to library!` };
          }
        }
      }

      // Second call to Gemini with the function result
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          systemPrompt,
          {
            role: "model",
            parts: [{ functionCall: call }]
          },
          {
            role: "user",
            parts: [{
              functionResponse: {
                name: call.name,
                response: functionResponseData
              }
            }]
          }
        ],
        tools: tools,
      });

      answer = response.text || answer;
    }

    if (!answer) {
      answer = "I'm sorry, I couldn't generate a response.";
    }

    return NextResponse.json({ answer });
  } catch (error: any) {
    console.error("Coach Chat Error:", error);
    return NextResponse.json({ 
      answer: "I encountered an error connecting to the AI engine. Please try again later." 
    }, { status: 500 });
  }
}
