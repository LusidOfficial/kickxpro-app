/* ──────────────────────────────────────────────
   PLAYER AI ASSISTANT
   Chat interface for players — asks about skills,
   training tips, nutrition, and self-improvement.
   ────────────────────────────────────────────── */
"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import {
  IconSend, IconActivity, IconTarget, IconStar, IconTrendingUp
} from "@/components/Icons";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: { title: string; type: string }[];
  attachmentUrl?: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  { label: "Coach's Advice", prompt: "What should I practice based on my Coach's latest evaluation? Give me specific drills I can do today.", icon: <IconStar size={14} /> },
  { label: "Watch Drills", prompt: "Based on my focus areas from my coach, suggest 3 drills I can practice at home with YouTube links to watch.", icon: <IconTarget size={14} /> },
  { label: "Nutrition", prompt: "What should a young football player eat before and after training for maximum performance?", icon: <IconActivity size={14} /> },
  { label: "Growth Plan", prompt: "Based on my evaluations, create a weekly improvement plan. What should I focus on each day?", icon: <IconTrendingUp size={14} /> },
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
  const [attachment, setAttachment] = useState<File | null>(null);
  const [apiStatus, setApiStatus] = useState<"online" | "offline" | "checking">("checking");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  async function checkBackendHealth() {
    // The backend is now internal Next.js API, so it's always online if the app is running.
    setApiStatus("online");
  }

  useEffect(() => {
    checkBackendHealth();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(content: string) {
    if ((!content.trim() && !attachment) || loading || !user) return;

    let attachmentBase64: string | undefined;
    let attachmentType: string | undefined;
    let attachmentPreviewUrl: string | undefined;

    if (attachment) {
      attachmentPreviewUrl = URL.createObjectURL(attachment);
      attachmentType = attachment.type;
      
      const buffer = await attachment.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );
      attachmentBase64 = base64;
    }

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: content.trim() || "Analyzed attachment",
      attachmentUrl: attachmentPreviewUrl,
      timestamp: new Date(),
    };

    const history = messages.map(m => ({ role: m.role, content: m.content }));

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setAttachment(null);
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`/api/player-chat`, { 
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ 
          message: content.trim() || "Analyze this media", 
          history, 
          playerId: user.id,
          attachment: attachmentBase64 ? {
            inlineData: {
              data: attachmentBase64,
              mimeType: attachmentType
            }
          } : undefined
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.answer || "I couldn't generate a response. Try asking in a different way!",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        const data = await res.json();
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.answer || "⚠️ The AI backend returned an error.",
          timestamp: new Date(),
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "⚠️ Could not connect to the AI service. Please check your internet connection.",
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
                  // Parse markdown links and bold text
                  const parts = block.split(/(\[.*?\]\(.*?\)|\*\*.*?\*\*)/g);
                  return (
                    <span key={bi}>
                      {parts.map((part, pi) => {
                        // Check for markdown links [text](url)
                        const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
                        if (linkMatch) {
                          return (
                            <a key={pi} href={linkMatch[2]} target="_blank" rel="noopener noreferrer"
                              className="text-emerald-600 underline underline-offset-2 hover:text-emerald-800 font-semibold">
                              {linkMatch[1]}
                            </a>
                          );
                        }
                        // Check for bold **text**
                        const boldMatch = part.match(/^\*\*(.*?)\*\*$/);
                        if (boldMatch) {
                          return <strong key={pi} className={msg.role === "user" ? "text-emerald-100" : "text-slate-900"}>{boldMatch[1]}</strong>;
                        }
                        return <span key={pi}>{part}</span>;
                      })}
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

              {msg.attachmentUrl && (
                <div className="mt-3 rounded-lg overflow-hidden border border-slate-200">
                  {msg.attachmentUrl.startsWith("blob:") ? (
                     <video src={msg.attachmentUrl} controls className="max-w-full max-h-48 object-cover" />
                  ) : null}
                </div>
              )}
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
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        {attachment && (
          <div className="flex items-center justify-between bg-slate-100 p-2 rounded-lg">
            <span className="text-xs text-slate-600 font-medium truncate">{attachment.name}</span>
            <button type="button" onClick={() => setAttachment(null)} className="text-red-500 font-bold text-xs px-2 hover:bg-red-100 rounded-full">×</button>
          </div>
        )}
        <div className="flex items-center gap-3">
          <label className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-3 rounded-xl font-bold cursor-pointer transition-colors flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 0V5a.5.5 0 0 1 1 0v7a.5.5 0 0 0 1 0V3a1.5 1.5 0 1 0-3 0v9a2.5 2.5 0 0 0 5 0V5a.5.5 0 0 1 1 0v7a3.5 3.5 0 1 1-7 0V3z"/>
            </svg>
            <input 
              type="file" 
              accept="video/mp4,video/webm,image/jpeg,image/png"
              className="hidden" 
              onChange={e => setAttachment(e.target.files ? e.target.files[0] : null)}
              disabled={loading}
            />
          </label>
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
            disabled={loading || (!input.trim() && !attachment)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <IconSend size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
