"use client";

import { useState } from "react";
import { IconMessageSquare, IconTarget, IconActivity } from "@/components/Icons";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

export default function FeedbackWidget({ role }: { role: "coach" | "player" | "parent" }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<"bug" | "feature">("feature");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !message.trim()) return;

    setStatus("submitting");
    
    try {
      await supabase.from("feedback").insert({
        user_id: user.id,
        role,
        type,
        message: message.trim(),
      });
      setStatus("success");
      setTimeout(() => {
        setIsOpen(false);
        setMessage("");
        setStatus("idle");
      }, 2000);
    } catch (err) {
      console.error(err);
      setStatus("idle");
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform z-50 group"
        title="Leave Feedback"
      >
        <IconMessageSquare size={20} />
        {/* Subtle tooltip */}
        <span className="absolute right-14 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap font-bold">
          Feedback
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-fade-up" style={{ animationDuration: '0.2s' }}>
      <div className="bg-slate-900 p-4 flex items-center justify-between">
        <h3 className="text-white font-bold text-sm flex items-center gap-2">
          <IconMessageSquare size={16} /> Beta Feedback
        </h3>
        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
          ✕
        </button>
      </div>

      <div className="p-4">
        {status === "success" ? (
          <div className="text-center py-6 text-emerald-600 font-bold flex flex-col items-center gap-2">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mb-2 mx-auto">
              ✓
            </div>
            Thanks for your feedback!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setType("feature")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-bold transition-colors ${type === "feature" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                <IconTarget size={14} /> Suggestion
              </button>
              <button
                type="button"
                onClick={() => setType("bug")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-bold transition-colors ${type === "bug" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                <IconActivity size={14} /> Bug
              </button>
            </div>
            
            <textarea
              required
              placeholder={type === "feature" ? "I wish I could..." : "I tried to click X and..."}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-slate-400 focus:ring-2 focus:ring-slate-100 outline-none resize-none"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />

            <button
              type="submit"
              disabled={status === "submitting" || !message.trim()}
              className="w-full bg-slate-900 text-white rounded-xl py-2.5 text-sm font-bold shadow-md hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {status === "submitting" ? "Sending..." : "Send Feedback"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
