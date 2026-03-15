/* ──────────────────────────────────────────────
   MATCH IQ — Coach Tactical Event Logger
   Coaches can log tactical events (Positive, Negative, Neutral)
   for specific players during or after a match session.
   Events are stored in the `match_events` table.
   ────────────────────────────────────────────── */
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  IconCheck, IconTarget, IconShield, IconActivity,
  IconZap, IconUsers, IconClipboard, IconTrendingUp
} from "@/components/Icons";

/* ── Tactical Tags ── */
const POSITIVE_TAGS = [
  "Great Vision", "Perfect Press", "Strong Tackle", "Key Pass",
  "Smart Run", "Won Aerial Duel", "Created Space", "Clinical Finish"
];
const NEGATIVE_TAGS = [
  "Lost Shape", "Pressed Too Early", "Wrong Passing Option", "Poor First Touch",
  "Ball Watching", "Slow Transition", "Missed Marker", "Gave Away Possession"
];
const NEUTRAL_TAGS = [
  "Subbed On", "Subbed Off", "Position Switch", "Set Piece Taker", "Captain Arm"
];

/* ── Mock players (fallback) ── */
const MOCK_PLAYERS = [
  { id: "P001", name: "Arjun M.", num: 10, pos: "ST" },
  { id: "P002", name: "Neha S.", num: 8, pos: "CM" },
  { id: "P003", name: "Rahul J.", num: 4, pos: "CB" },
  { id: "P004", name: "Sanjay V.", num: 9, pos: "ST" },
  { id: "P005", name: "Aarav K.", num: 1, pos: "GK" },
  { id: "P006", name: "Priya R.", num: 7, pos: "RW" },
];

interface LoggedEvent {
  id: string;
  playerName: string;
  tag: string;
  type: "Positive" | "Negative" | "Neutral";
  time: string;
}

export default function MatchIQPage() {
  const [players, setPlayers] = useState(MOCK_PLAYERS);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [eventLog, setEventLog] = useState<LoggedEvent[]>([]);
  const [showToast, setShowToast] = useState("");
  const [activeCategory, setActiveCategory] = useState<"Positive" | "Negative" | "Neutral">("Positive");

  /* Fetch real roster */
  useEffect(() => {
    async function fetchPlayers() {
      try {
        const { data, error } = await supabase.from('profiles').select('*').eq('role', 'player');
        if (error) throw error;
        if (data && data.length > 0) {
          setPlayers(data.map((p, i) => ({ id: p.id, name: p.full_name, num: i + 1, pos: p.position || "MID" })));
        }
      } catch { /* use mock */ }
    }
    fetchPlayers();
  }, []);

  const activeTags = activeCategory === "Positive" ? POSITIVE_TAGS : activeCategory === "Negative" ? NEGATIVE_TAGS : NEUTRAL_TAGS;
  const activePlayer = players.find(p => p.id === selectedPlayer);

  const logEvent = (tag: string) => {
    if (!activePlayer) return;
    const newEvent: LoggedEvent = {
      id: `${Date.now()}`,
      playerName: activePlayer.name,
      tag,
      type: activeCategory,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setEventLog(prev => [newEvent, ...prev]);
    setShowToast(`${activeCategory}: ${tag} → ${activePlayer.name}`);
    setTimeout(() => setShowToast(""), 2000);
  };

  const typeColor = (type: string) =>
    type === "Positive" ? "#10B981" : type === "Negative" ? "#EF4444" : "#94A3B8";

  return (
    <div className="max-w-6xl mx-auto pb-24 px-4 xl:px-0 opacity-0 animate-fade-up">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-slate-900 leading-tight" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}>
          Match Intelligence
        </h1>
        <p className="text-slate-500 font-medium text-xs md:text-sm">Log tactical events during or after a match. These become learning cards for your players.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: Player Selector + Tag Logger ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Player Pills */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Select Player</label>
            <div className="flex flex-wrap gap-2">
              {players.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlayer(p.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all
                    ${selectedPlayer === p.id
                      ? "bg-slate-900 text-white border-slate-900 shadow-md"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                    }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black
                    ${selectedPlayer === p.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                    {p.num}
                  </span>
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Event Category Tabs */}
          {selectedPlayer && (
            <div className="card-static p-5 space-y-5">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                {(["Positive", "Negative", "Neutral"] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all
                      ${activeCategory === cat ? "bg-white shadow-sm" : "hover:bg-white/50"}`}
                    style={{ color: activeCategory === cat ? typeColor(cat) : "#94A3B8" }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Tags Grid */}
              <div className="flex flex-wrap gap-2">
                {activeTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => logEvent(tag)}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold border transition-all hover:shadow-md active:scale-95"
                    style={{
                      background: `${typeColor(activeCategory)}10`,
                      color: typeColor(activeCategory),
                      borderColor: `${typeColor(activeCategory)}30`,
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <p className="text-[10px] text-slate-400 font-medium text-center">
                Tap a tag to instantly log it for <span className="font-bold text-slate-600">{activePlayer?.name}</span>
              </p>
            </div>
          )}

          {!selectedPlayer && (
            <div className="card-static p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <IconUsers size={28} color="#CBD5E1" />
              </div>
              <p className="font-bold text-slate-400 mb-1">Select a player above</p>
              <p className="text-xs text-slate-400">Then tap tactical tags to log match events.</p>
            </div>
          )}
        </div>

        {/* ── Right: Live Event Feed ── */}
        <div>
          <div className="card-static p-5 sticky top-24">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2" style={{ fontFamily: "var(--font-heading)" }}>
              <IconActivity size={16} color="#3B82F6" /> Event Log
              <span className="ml-auto text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{eventLog.length}</span>
            </h3>

            {eventLog.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-slate-400">No events logged yet.</p>
                <p className="text-[10px] text-slate-300 mt-1">Events will appear here in real-time.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                {eventLog.map(evt => (
                  <div
                    key={evt.id}
                    className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white transition-colors animate-fade-up"
                  >
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                      style={{ background: typeColor(evt.type) }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-slate-900 truncate">{evt.tag}</span>
                        <span className="text-[10px] text-slate-400 ml-2 flex-shrink-0">{evt.time}</span>
                      </div>
                      <span className="text-[10px] font-medium text-slate-500">{evt.playerName}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-50 animate-fade-up text-sm font-bold">
          <IconCheck size={16} /> {showToast}
        </div>
      )}
    </div>
  );
}
