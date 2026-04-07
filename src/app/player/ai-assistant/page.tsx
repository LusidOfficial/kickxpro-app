/* ──────────────────────────────────────────────
   PLAYER AI ASSISTANT
   Chat interface for players — asks about skills,
   training tips, nutrition, and self-improvement.
   ────────────────────────────────────────────── */
"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  IconSend, IconActivity, IconTarget, IconStar, IconTrendingUp
} from "@/components/Icons";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: { title: string; type: string }[];
  timestamp: Date;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const QUICK_PROMPTS = [
  { label: "Training Tips", prompt: "What are the best training drills I can do at home to improve my dribbling skills?", icon: <IconTarget size={14} /> },
  { label: "Nutrition", prompt: "What should a young football player eat before and after training for maximum performance?", icon: <IconActivity size={14} /> },
  { label: "Mental Game", prompt: "How can I improve my focus and mental toughness during competitive matches?", icon: <IconStar size={14} /> },
  { label: "Growth Plan", prompt: "Based on my evaluations, what should I focus on to become a better overall player?", icon: <IconTrendingUp size={14} /> },
];

export default function PlayerAIAssistantPage() {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hey ${profile?.full_name?.split(" ")[0] || "there"}! 👋 I'm your personal AI training assistant.\n\nI can help you with:\n\n• **Training tips** — Home drills, warm-ups, cool-downs\n• **Nutrition advice** — What to eat for peak performance\n• **Mental game** — Focus, confidence, pressure handling\n• **Skill development** — Personalized improvement plans\n\nPick a topic below or ask me anything about football!`,
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<"online" | "offline" | "checking">("checking");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkBackendHealth();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function checkBackendHealth() {
    try {
      const res = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) setApiStatus("online");
      else setApiStatus("offline");
    } catch {
      setApiStatus("offline");
    }
  }

  async function sendMessage(content: string) {
    if (!content.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Add player context to the question
      const contextualQuery = `[Player: ${profile?.full_name || "Unknown"}, Position: ${profile?.position || "MID"}] ${content.trim()}`;
      const params = new URLSearchParams({ q: contextualQuery, web_search: "false" });
      const res = await fetch(`${API_URL}/ask?${params}`, { signal: AbortSignal.timeout(30000) });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.answer || "I couldn't generate a response. Try asking in a different way!",
          sources: data.sources || [],
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "⚠️ The AI backend returned an error. The backend server may need to be started. Ask your coach or admin to ensure the AI service is running.",
          timestamp: new Date(),
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "⚠️ Could not connect to the AI service. This feature requires the backend server to be running. Please check with your coach.",
        timestamp: new Date(),
      }]);
    }

    setLoading(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col px-4 xl:px-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 opacity-0 animate-fade-up" style={{ animationFillMode: "forwards" }}>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}>
            AI Training Assistant
          </h1>
          <p className="text-slate-500 text-xs font-medium">Your personal football development guide</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${
            apiStatus === "online" ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" :
            apiStatus === "offline" ? "bg-red-400" : "bg-amber-400 animate-pulse"
          }`} />
          <span className="text-[10px] font-bold text-slate-400 uppercase">
            {apiStatus === "online" ? "AI Online" : apiStatus === "offline" ? "AI Offline" : "Checking..."}
          </span>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 opacity-0 animate-fade-up" style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}>
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-5 py-4 ${
              msg.role === "user"
                ? "bg-emerald-600 text-white rounded-br-md"
                : "bg-white border border-slate-200 text-slate-700 rounded-bl-md shadow-sm"
            }`}>
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {msg.content.split("```").map((block, bi) => {
                  if (bi % 2 === 1) {
                    return (
                      <pre key={bi} className="bg-slate-800 text-emerald-300 p-3 rounded-lg my-2 text-xs font-mono overflow-x-auto">
                        {block.replace(/^\w+\n/, "")}
                      </pre>
                    );
                  }
                  return (
                    <span key={bi}>
                      {block.split("**").map((part, pi) =>
                        pi % 2 === 1
                          ? <strong key={pi} className={msg.role === "user" ? "text-emerald-100" : "text-slate-900"}>{part}</strong>
                          : <span key={pi}>{part}</span>
                      )}
                    </span>
                  );
                })}
              </div>

              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Sources</div>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.sources.map((src, si) => (
                      <span key={si} className="text-[10px] font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                        {src.title || src.type}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className={`text-[9px] mt-2 ${msg.role === "user" ? "text-emerald-200" : "text-slate-300"}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-5 py-4 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-xs text-slate-400 font-medium">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      {messages.length <= 2 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {QUICK_PROMPTS.map((qp, i) => (
            <button
              key={i}
              onClick={() => sendMessage(qp.prompt)}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-all"
            >
              {qp.icon} {qp.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <input
          type="text"
          className="input flex-1"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about training, nutrition, skills..."
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <IconSend size={16} />
        </button>
      </form>
    </div>
  );
}
