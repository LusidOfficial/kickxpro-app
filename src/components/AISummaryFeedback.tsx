"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

export default function AISummaryFeedback({ 
  evaluationId, 
  role 
}: { 
  evaluationId: string;
  role: "player" | "parent"
}) {
  const { user } = useAuth();
  const [feedbackState, setFeedbackState] = useState<"idle" | "up" | "down" | "submitted">("idle");
  const [missingText, setMissingText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVote = async (vote: "up" | "down") => {
    if (!user) return;
    setFeedbackState(vote);

    if (vote === "up") {
      try {
        await supabase.from("feedback").insert({
          user_id: user.id,
          role,
          type: "ai_report",
          message: "Positive feedback on AI summary",
          context: { evaluation_id: evaluationId, vote: "up" }
        });
        setFeedbackState("submitted");
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSubmitNegative = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !missingText.trim()) return;
    
    setIsSubmitting(true);
    try {
      await supabase.from("feedback").insert({
        user_id: user.id,
        role,
        type: "ai_report",
        message: missingText.trim(),
        context: { evaluation_id: evaluationId, vote: "down" }
      });
      setFeedbackState("submitted");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (feedbackState === "submitted") {
    return (
      <div className="mt-3 text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-2 rounded-lg inline-block border border-slate-100">
        Thanks for your feedback!
      </div>
    );
  }

  return (
    <div className="mt-3">
      {feedbackState === "idle" && (
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Was this summary helpful?</span>
          <div className="flex gap-1">
            <button 
              onClick={() => handleVote("up")}
              className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 border border-slate-100 hover:border-emerald-200 transition-colors flex items-center justify-center text-sm"
            >
              👍
            </button>
            <button 
              onClick={() => handleVote("down")}
              className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-100 hover:border-rose-200 transition-colors flex items-center justify-center text-sm"
            >
              👎
            </button>
          </div>
        </div>
      )}

      {feedbackState === "down" && (
        <form onSubmit={handleSubmitNegative} className="bg-slate-50 p-3 rounded-xl border border-slate-200 mt-2 animate-fade-down relative">
          <div className="absolute -top-1.5 left-6 w-3 h-3 bg-slate-50 border-t border-l border-slate-200 transform rotate-45"></div>
          <label className="block text-[10px] font-bold text-slate-500 mb-2 relative z-10">What was missing or incorrect?</label>
          <div className="flex gap-2 relative z-10">
            <input 
              type="text" 
              className="input flex-1 text-xs py-1.5 px-3 bg-white"
              placeholder="e.g. Too generic, missing tactical focus..."
              value={missingText}
              onChange={(e) => setMissingText(e.target.value)}
              autoFocus
            />
            <button 
              type="submit" 
              disabled={isSubmitting || !missingText.trim()}
              className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50 transition-opacity"
            >
              {isSubmitting ? "..." : "Send"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
