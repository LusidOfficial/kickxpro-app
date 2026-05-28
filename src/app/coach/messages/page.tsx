/* ──────────────────────────────────────────────
   COACH MESSAGES — Direct messaging to players
   Real-time chat interface using the messages
   table from Supabase.
   ────────────────────────────────────────────── */
"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import {
  IconMessageSquare, IconSend, IconUsers, IconCheck
} from "@/components/Icons";

interface Player {
  id: string;
  name: string;
  position: string;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read_status: boolean;
}

export default function CoachMessagesPage() {
  const { user } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    fetchPlayers();
  }, [user]);

  useEffect(() => {
    if (!activePlayerId || !user) return;
    fetchMessages();
  }, [activePlayerId, user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchPlayers() {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, position")
      .eq("role", "player")
      .eq("coach_id", user.id);

    if (data) {
      const list = data.map(p => ({ id: p.id, name: p.full_name || "Unknown", position: p.position || "MID" }));
      
      // Fetch unread counts globally for this coach
      const { data: unreadData } = await supabase
        .from("messages")
        .select("sender_id")
        .eq("receiver_id", user.id)
        .eq("read_status", false);
        
      const counts: Record<string, number> = {};
      if (unreadData) {
        unreadData.forEach(msg => {
          counts[msg.sender_id] = (counts[msg.sender_id] || 0) + 1;
        });
      }
      setUnreadCounts(counts);

      // Sort list to put players with unread messages at the top
      list.sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0));

      setPlayers(list);
      if (list.length > 0) setActivePlayerId(list[0].id);
    }
    setLoading(false);
  }

  async function fetchMessages() {
    if (!user || !activePlayerId) return;

    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${activePlayerId}),and(sender_id.eq.${activePlayerId},receiver_id.eq.${user.id})`)
      .order("created_at", { ascending: true });

    if (data) setMessages(data);

    // Mark incoming messages as read
    await supabase
      .from("messages")
      .update({ read_status: true })
      .eq("sender_id", activePlayerId)
      .eq("receiver_id", user.id)
      .eq("read_status", false);
      
    setUnreadCounts(prev => ({ ...prev, [activePlayerId]: 0 }));
  }

  async function sendMessage() {
    if (!user || !activePlayerId || !newMessage.trim()) return;
    setSending(true);

    const { data, error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: activePlayerId,
      content: newMessage.trim(),
    }).select("*").single();

    if (!error && data) {
      setMessages(prev => [...prev, data]);
      setNewMessage("");
    }
    setSending(false);
  }

  const activePlayer = players.find(p => p.id === activePlayerId);

  return (
    <div className="max-w-6xl mx-auto pb-24 px-4 xl:px-0 opacity-0 animate-fade-up">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-slate-900 leading-tight" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}>
          Messages
        </h1>
        <p className="text-slate-500 font-medium text-xs md:text-sm">Direct communication with your players.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" style={{ height: "calc(100vh - 240px)" }}>

        {/* Left: Player List */}
        <div className="lg:col-span-1 card-static overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
              <IconUsers size={14} /> Players ({players.length})
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-6 text-center text-xs text-slate-400">Loading...</div>
            ) : players.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No players in roster.</div>
            ) : players.map(player => (
              <button
                key={player.id}
                onClick={() => setActivePlayerId(player.id)}
                className={`w-full text-left p-4 flex items-center gap-3 transition-all ${
                  activePlayerId === player.id ? "bg-emerald-50 border-l-4 border-emerald-500" : "hover:bg-slate-50 border-l-4 border-transparent"
                }`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                  activePlayerId === player.id ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"
                }`}>
                  {player.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-slate-900 truncate flex items-center justify-between">
                    {player.name}
                    {(unreadCounts[player.id] || 0) > 0 && (
                      <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                        {unreadCounts[player.id]}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">{player.position}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Chat Window */}
        <div className="lg:col-span-3 card-static overflow-hidden flex flex-col">
          {activePlayer ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-white">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                  {activePlayer.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">{activePlayer.name}</div>
                  <div className="text-[10px] text-slate-400 font-medium uppercase">{activePlayer.position} • Player</div>
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
                    <p className="text-xs text-slate-400">Start the conversation with {activePlayer.name}.</p>
                  </div>
                )}
                {messages.map(msg => {
                  const isCoach = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isCoach ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm font-medium leading-relaxed ${
                        isCoach
                          ? "bg-emerald-600 text-white rounded-br-sm shadow-md"
                          : "bg-white text-slate-700 border border-slate-200 rounded-bl-sm shadow-sm"
                      }`}>
                        {msg.content}
                        <div className={`text-[9px] mt-1 ${isCoach ? "text-emerald-200" : "text-slate-400"}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Input Box */}
              <div className="p-3 border-t border-slate-100 bg-white flex items-end gap-3">
                <textarea
                  className="flex-1 resize-none bg-slate-100 rounded-xl p-3 text-sm border-none outline-none focus:ring-2 ring-emerald-500 transition-shadow max-h-[100px]"
                  placeholder={`Message ${activePlayer.name}...`}
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
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconMessageSquare size={28} color="#CBD5E1" />
                </div>
                <p className="font-bold text-slate-400">Select a player to message</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
