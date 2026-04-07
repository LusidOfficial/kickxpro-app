/* ──────────────────────────────────────────────
   PLAYER MESSAGES — Direct messaging with coach
   Player-side chat interface.
   ────────────────────────────────────────────── */
"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import {
  IconMessageSquare, IconSend, IconUser
} from "@/components/Icons";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read_status: boolean;
}

export default function PlayerMessagesPage() {
  const { user } = useAuth();
  const [coachProfile, setCoachProfile] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadData() {
    if (!user) return;

    // 1. Get player profile to find coach
    const { data: pData } = await supabase
      .from("profiles")
      .select("coach_id")
      .eq("id", user.id)
      .single();

    if (pData?.coach_id) {
      // 2. Get coach profile
      const { data: cData } = await supabase
        .from("profiles")
        .select("id, full_name, position")
        .eq("id", pData.coach_id)
        .single();

      if (cData) {
        setCoachProfile(cData);

        // 3. Fetch messages between player and coach
        const { data: mData } = await supabase
          .from("messages")
          .select("*")
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${pData.coach_id}),and(sender_id.eq.${pData.coach_id},receiver_id.eq.${user.id})`)
          .order("created_at", { ascending: true });

        if (mData) setMessages(mData);

        // Mark incoming messages as read
        await supabase
          .from("messages")
          .update({ read_status: true })
          .eq("sender_id", pData.coach_id)
          .eq("receiver_id", user.id)
          .eq("read_status", false);
      }
    }
    setLoading(false);
  }

  async function sendMessage() {
    if (!user || !coachProfile || !newMessage.trim()) return;
    setSending(true);

    const { data, error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: coachProfile.id,
      content: newMessage.trim(),
    }).select("*").single();

    if (!error && data) {
      setMessages(prev => [...prev, data]);
      setNewMessage("");
    }
    setSending(false);
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center text-slate-400 font-medium opacity-0 animate-fade-up">
        Loading messages...
      </div>
    );
  }

  if (!coachProfile) {
    return (
      <div className="max-w-4xl mx-auto p-8 opacity-0 animate-fade-up">
        <div className="card-static p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <IconUser size={28} color="#CBD5E1" />
          </div>
          <p className="font-bold text-slate-400 mb-1">No coach assigned</p>
          <p className="text-xs text-slate-400">Contact your academy to be assigned to a coach.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-6 px-4 xl:px-0 opacity-0 animate-fade-up" style={{ height: "calc(100vh - 140px)" }}>
      <div className="card-static overflow-hidden flex flex-col h-full">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-white flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
            {coachProfile.full_name?.substring(0, 2).toUpperCase() || "C"}
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm">{coachProfile.full_name || "Your Coach"}</div>
            <div className="text-[10px] text-slate-400 font-medium uppercase">Head Coach</div>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-slate-400 font-bold">Online</span>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <IconMessageSquare size={24} color="#CBD5E1" />
              </div>
              <p className="text-sm text-slate-400 font-bold">No messages yet</p>
              <p className="text-xs text-slate-400">Send your first message to your coach!</p>
            </div>
          )}
          {messages.map(msg => {
            const isPlayer = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isPlayer ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm font-medium leading-relaxed ${
                  isPlayer
                    ? "bg-emerald-600 text-white rounded-br-sm shadow-md"
                    : "bg-white text-slate-700 border border-slate-200 rounded-bl-sm shadow-sm"
                }`}>
                  {msg.content}
                  <div className={`text-[9px] mt-1 ${isPlayer ? "text-emerald-200" : "text-slate-400"}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Input Box */}
        <div className="p-3 border-t border-slate-100 bg-white flex items-end gap-3 flex-shrink-0">
          <textarea
            className="flex-1 resize-none bg-slate-100 rounded-xl p-3 text-sm border-none outline-none focus:ring-2 ring-emerald-500 transition-shadow max-h-[100px]"
            placeholder="Message your coach..."
            rows={1}
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <button
            onClick={sendMessage}
            disabled={sending || !newMessage.trim()}
            className="p-3 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-colors shadow-sm active:scale-95 disabled:opacity-50"
          >
            <IconSend size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
