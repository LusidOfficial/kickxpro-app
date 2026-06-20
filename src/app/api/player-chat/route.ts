import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { supabase } from '@/lib/supabase';

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, history, playerId } = body;

    if (!ai) {
      return NextResponse.json({ 
        answer: "The AI engine is currently unavailable." 
      }, { status: 500 });
    }

    if (!playerId) {
      return NextResponse.json({ 
        answer: "Error: No player ID provided to the AI Assistant." 
      }, { status: 400 });
    }

    // Fetch the player's recent evaluations and active goals
    const { data: evals } = await supabase
      .from("evaluations")
      .select("*")
      .eq("player_id", playerId)
      .order("created_at", { ascending: false })
      .limit(2);

    let coachName = "Your Coach";
    if (evals && evals.length > 0 && evals[0].coach_id) {
      const { data: coachData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", evals[0].coach_id)
        .single();
      if (coachData && coachData.full_name) {
        coachName = coachData.full_name;
      }
    }

    const { data: goals } = await supabase
      .from("goals")
      .select("title, category, status")
      .eq("player_id", playerId)
      .in("status", ["not_started", "in_progress"]);

    // Build context string
    let contextStr = "No recent evaluation data found.";
    if (evals && evals.length > 0) {
      const latest = evals[0];
      contextStr = `Latest Coach Evaluation (Date: ${new Date(latest.created_at).toLocaleDateString()}, Coach: ${coachName}):
- Summary: ${latest.summary || "None"}
- Strengths: ${(latest.strengths || []).join(", ") || "None"}
- Focus Areas: ${(latest.focus_areas || []).join(", ") || "None"}
- Scores (out of 20): PAC: ${latest.scores?.pac}, SHO: ${latest.scores?.sho}, PAS: ${latest.scores?.pas}, DRI: ${latest.scores?.dri}, DEF: ${latest.scores?.def}, PHY: ${latest.scores?.phy}
- Badge Awarded: ${latest.badge_awarded || "None"}
`;
    }

    let goalsStr = "No active goals.";
    if (goals && goals.length > 0) {
      goalsStr = `Active Goals / Action Quests:
${goals.map(g => `- ${g.title} (${g.category})`).join("\n")}
`;
    }

    // Format the conversation history for Gemini
    const formattedHistory = history && history.length > 0 
      ? history.map((msg: any) => `\n${msg.role === 'user' ? 'Player' : 'Mentor'}: ${msg.content}`).join('') 
      : '';

    const systemPrompt = `You are the KickXPro AI Mentor for a youth football (soccer) player.
Your goal is to help the player improve, answer their questions about football, and give them actionable advice based on what their coach has observed.
You are encouraging, simple to understand, and speak directly to the player (a kid/teen). Use emojis.
Do not use complicated jargon unless explaining it.
Always reference their focus areas and active goals if relevant.
When you give advice based on their evaluation, explicitly mention the coach's name (e.g., "Coach ${coachName} noted that you have great pace but need to work on...") to let the player know the source of the feedback.

Here is the data from their coach:
=== COACH DATA ===
${contextStr}
${goalsStr}
=== END COACH DATA ===

Conversation History:${formattedHistory}

Player: ${message}
Mentor:`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: systemPrompt,
    });

    const answer = response.text || "I'm sorry, I couldn't think of a response. Keep practicing!";

    return NextResponse.json({ answer });
  } catch (error: any) {
    console.error("Player Chat Error:", error);
    return NextResponse.json({ 
      answer: "I'm having trouble connecting to my brain right now! Please try again later." 
    }, { status: 500 });
  }
}
