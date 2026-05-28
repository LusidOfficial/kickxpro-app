import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Initialize the SDK if the key is available
const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { playerName, scores, strengths, focusAreas, badge } = body;

    // Fallback template logic if no API key is provided
    if (!ai) {
      return NextResponse.json(generateTemplateSummary(playerName, scores, strengths, focusAreas, badge));
    }

    const prompt = `You are a professional youth soccer coach. Write a concise, encouraging 2-3 sentence progress report summary for a player named ${playerName}.
    
    Here is their latest evaluation data:
    - Recent Badge Awarded: ${badge || 'None'}
    - Key Strengths: ${strengths.join(', ') || 'General effort'}
    - Focus Areas (Needs Improvement): ${focusAreas.join(', ') || 'Consistency'}
    - Scores (out of 10): PAC: ${scores.pac/10}, SHO: ${scores.sho/10}, PAS: ${scores.pas/10}, DRI: ${scores.dri/10}, DEF: ${scores.def/10}, PHY: ${scores.phy/10}

    Also, generate exactly 2 highly specific, actionable quests/tasks for the player based on their focus areas and lowest scores. These should be things they can practice on their own (e.g. "Complete 30 wall passes with left foot"). Categorize them into 'technical', 'tactical', 'physical', or 'discipline'.

    Respond STRICTLY in the following JSON format, and do not include markdown formatting like \`\`\`json:
    {
      "summary": "Your encouraging paragraph here.",
      "suggestedGoals": [
        { "title": "Task 1", "category": "technical" },
        { "title": "Task 2", "category": "physical" }
      ]
    }`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
    });

    // Remove markdown code blocks if the model still outputs them
    const textResp = response.text || "{}";
    const cleanJsonStr = textResp.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanJsonStr);

    return NextResponse.json({ summary: parsed.summary, suggestedGoals: parsed.suggestedGoals });
  } catch (error) {
    console.error("AI Summary Error:", error);
    
    // Fallback to template if API call fails
    try {
        const body = await request.json();
        const { playerName, scores, strengths, focusAreas, badge } = body;
        return NextResponse.json(generateTemplateSummary(playerName, scores, strengths, focusAreas, badge));
    } catch (e) {
        return NextResponse.json({ 
          summary: "Good effort this session. Keep working hard and focusing on development.",
          suggestedGoals: []
        });
    }
  }
}

function generateTemplateSummary(
  name: string,
  scores: any,
  strengths: string[],
  focusAreas: string[],
  badge: string
) {
  let s = `${name} had a solid session.`;
  if (strengths.length > 0) {
    s += ` Showed excellent work in ${strengths.map((st) => st.toLowerCase()).join(" and ")}.`;
  }
  if (focusAreas.length > 0) {
    s += ` Next time, we'll focus on improving ${focusAreas.map((fa) => fa.toLowerCase()).join(" and ")}.`;
  }
  if (badge) {
    s += ` Awarded the ${badge} badge!`;
  }
  
  const suggestedGoals = focusAreas.map(fa => ({
    title: `Practice and improve your ${fa}`,
    category: 'technical'
  })).slice(0, 2);

  return { summary: s, suggestedGoals };
}
