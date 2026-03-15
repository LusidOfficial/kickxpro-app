/* ──────────────────────────────────────────────
   SESSIONS HUB (v2) — New Session + Drill Library + History
   Supabase-integrated. Coaches can:
   ① Create sessions with timer
   ② Browse & attach drills from library
   ③ Mark attendance
   ④ View past session history
   ────────────────────────────────────────────── */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SESSION_TYPES } from "@/lib/constants";
import { supabase } from "@/lib/supabase";
import {
  IconTimer, IconGrid, IconPlay, IconPause, IconSquare,
  IconClipboard, IconPlus, IconCheck, IconTarget, IconZap,
  IconActivity, IconShield, IconUsers
} from "@/components/Icons";

/* ── Drill Library (seed data — will transition to DB) ── */
const SEED_DRILLS = [
  { id: "d1", title: "Rondo 4v2", category: "Passing", duration_mins: 10, difficulty: "Beginner", description: "Quick one-touch passing in a tight circle. Defenders press." },
  { id: "d2", title: "1v1 Box Finishing", category: "Shooting", duration_mins: 15, difficulty: "Intermediate", description: "Attacker receives on the edge of box, beats defender, shoots." },
  { id: "d3", title: "Shuttle Sprints", category: "Fitness", duration_mins: 12, difficulty: "Advanced", description: "High-intensity interval sprints with 30s rest between sets." },
  { id: "d4", title: "Shadow Play", category: "Tactical", duration_mins: 20, difficulty: "Intermediate", description: "Full-team shape drill without opposition. Focus: movement patterns." },
  { id: "d5", title: "Cross & Finish", category: "Shooting", duration_mins: 15, difficulty: "Beginner", description: "Wingers deliver crosses; attackers finish first-time." },
  { id: "d6", title: "Pressing Triggers", category: "Tactical", duration_mins: 15, difficulty: "Advanced", description: "Team learns when to press and how to cut passing lanes." },
  { id: "d7", title: "GK Reaction Saves", category: "Goalkeeping", duration_mins: 10, difficulty: "Intermediate", description: "Rapid-fire shots from close range to train reflexes." },
  { id: "d8", title: "Agility Ladder", category: "Fitness", duration_mins: 8, difficulty: "Beginner", description: "Footwork drills through agility ladder for coordination." },
  { id: "d9", title: "Match Simulation 7v7", category: "Match Prep", duration_mins: 25, difficulty: "Intermediate", description: "Small-sided game with specific tactical objectives." },
  { id: "d10", title: "Corner Kick Routines", category: "Tactical", duration_mins: 12, difficulty: "Beginner", description: "Set-piece routines: near post, far post, short corner variations." },
];

const CATEGORY_ICONS: Record<string, JSX.Element> = {
  Passing: <IconActivity size={16} />,
  Shooting: <IconTarget size={16} />,
  Fitness: <IconZap size={16} />,
  Tactical: <IconShield size={16} />,
  Goalkeeping: <IconSquare size={16} />,
  "Match Prep": <IconPlay size={16} />,
};

const CATEGORY_COLORS: Record<string, string> = {
  Passing: "#3B82F6",
  Shooting: "#EF4444",
  Fitness: "#F59E0B",
  Tactical: "#8B5CF6",
  Goalkeeping: "#06B6D4",
  "Match Prep": "#10B981",
};

type Drill = typeof SEED_DRILLS[number];

export default function SessionsHubPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"new" | "drills" | "history">("new");

  /* ── New Session State ── */
  const [title, setTitle] = useState("");
  const [sessionType, setSessionType] = useState<string>(SESSION_TYPES[0].key);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState("");

  /* ── Timer State ── */
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(duration * 60);

  /* ── Drill Planning ── */
  const [drillLibrary, setDrillLibrary] = useState<Drill[]>(SEED_DRILLS);
  const [selectedDrills, setSelectedDrills] = useState<Drill[]>([]);
  const [drillFilter, setDrillFilter] = useState("All");

  /* ── History ── */
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  /* ── Timer Effects ── */
  useEffect(() => { setTimeLeft(duration * 60); }, [duration]);
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  /* ── Fetch drill library from DB (fall back to seed) ── */
  useEffect(() => {
    async function fetchDrills() {
      try {
        const { data, error } = await supabase.from('drills').select('*');
        if (error) throw error;
        if (data && data.length > 0) {
          setDrillLibrary(data.map(d => ({ ...d, id: d.id })));
        }
      } catch { /* use seed */ }
    }
    fetchDrills();
  }, []);

  /* ── Fetch history from DB ── */
  useEffect(() => {
    async function fetchHistory() {
      setHistoryLoading(true);
      try {
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .order('session_date', { ascending: false })
          .limit(20);
        if (error) throw error;
        if (data && data.length > 0) setSessionHistory(data);
      } catch { /* silently fail */ }
      setHistoryLoading(false);
    }
    if (activeTab === "history") fetchHistory();
  }, [activeTab]);

  /* ── Drill Helpers ── */
  const toggleDrill = (drill: Drill) => {
    setSelectedDrills(prev =>
      prev.find(d => d.id === drill.id)
        ? prev.filter(d => d.id !== drill.id)
        : [...prev, drill]
    );
  };
  const isDrillSelected = (id: string) => selectedDrills.some(d => d.id === id);
  const totalDrillMins = selectedDrills.reduce((sum, d) => sum + d.duration_mins, 0);
  const categories = ["All", ...Array.from(new Set(drillLibrary.map(d => d.category)))];
  const filteredDrills = drillFilter === "All" ? drillLibrary : drillLibrary.filter(d => d.category === drillFilter);

  /* ── Timer Helpers ── */
  const toggleTimer = () => setIsTimerRunning(!isTimerRunning);
  const endSession = () => {
    setIsTimerRunning(false);
    router.push(`/coach/evaluate?session=${sessionType}&date=${date}`);
  };
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };
  const timerProgress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;

  return (
    <div className="max-w-6xl mx-auto pb-24 px-4 xl:px-0 opacity-0 animate-fade-up">

      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-slate-900 leading-tight" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}>Sessions Hub</h1>
        <p className="text-slate-500 font-medium text-xs md:text-sm">Plan sessions, pick drills, start timers, and review history.</p>
      </div>

      {/* ── Tabs ── */}
      <div className="flex bg-slate-100 p-1 rounded-2xl mb-8 w-full md:w-max">
        {(["new", "drills", "history"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all
              ${activeTab === tab ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            {tab === "new" ? "New Session" : tab === "drills" ? "Drill Library" : "History"}
          </button>
        ))}
      </div>

      {/* ═══ TAB 1: NEW SESSION ═══ */}
      {activeTab === "new" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Col: Setup Form */}
          <div className="lg:col-span-3 space-y-6">
            <div className="card-static p-4 md:p-6 space-y-5 md:space-y-6">
              <div>
                <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Session Title</label>
                <input type="text" className="input" placeholder="e.g. Morning Drills, Match Day Prep" value={title} onChange={e => setTitle(e.target.value)} />
              </div>

              <div>
                <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Session Type</label>
                <div className="flex flex-wrap gap-2">
                  {SESSION_TYPES.map(t => (
                    <button
                      key={t.key}
                      onClick={() => setSessionType(t.key)}
                      className="px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[10px] md:text-sm font-bold transition-all border"
                      style={{
                        background: sessionType === t.key ? "rgba(16, 185, 129, 0.1)" : "#FFF",
                        color: sessionType === t.key ? "#059669" : "var(--color-text-muted)",
                        borderColor: sessionType === t.key ? "#10B981" : "var(--color-border)",
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-2"><IconGrid size={14} /> Date</label>
                  <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-2"><IconTimer size={14} /> Start Time</label>
                  <input type="time" className="input" value={startTime} onChange={e => setStartTime(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Duration (Mins)</label>
                <div className="grid grid-cols-5 gap-2">
                  {[30, 45, 60, 90, 120].map(mins => (
                    <button
                      key={mins}
                      onClick={() => setDuration(mins)}
                      className="py-1.5 md:py-2 rounded-xl text-[10px] md:text-sm font-bold transition-all border"
                      style={{
                        background: duration === mins ? "rgba(16,185,129,0.1)" : "#FFF",
                        color: duration === mins ? "#059669" : "var(--color-text-muted)",
                        borderColor: duration === mins ? "#10B981" : "var(--color-border)",
                      }}
                    >
                      {mins}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Drills Preview */}
              {selectedDrills.length > 0 && (
                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Session Drills ({selectedDrills.length}) — {totalDrillMins} min total
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedDrills.map((d, i) => (
                      <div
                        key={d.id}
                        className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer hover:bg-emerald-100 transition-colors"
                        onClick={() => toggleDrill(d)}
                      >
                        <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center">{i + 1}</span>
                        {d.title}
                        <span className="text-emerald-400 text-[10px]">✕</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Session Notes (Optional)</label>
                <textarea className="textarea min-h-[80px] text-xs md:text-sm" placeholder="Weather, team mood, tactics..." value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Right Col: Timer */}
          <div className="lg:col-span-2">
            <div className="card-static p-6 md:p-8 flex flex-col items-center sticky top-24">
              <h3 className="text-lg md:text-xl font-bold mb-6 text-slate-900" style={{ fontFamily: "var(--font-heading)" }}>Session Timer</h3>
              <div className="relative w-40 h-40 md:w-48 md:h-48 mb-6 md:mb-8 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle cx="50%" cy="50%" r="45%" fill="none" stroke="var(--color-surface-2)" strokeWidth="12" />
                  <circle
                    cx="50%" cy="50%" r="45%" fill="none"
                    stroke="#10B981" strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray="283"
                    strokeDashoffset={283 * (1 - timerProgress / 100)}
                    className="transition-all duration-1000 ease-linear"
                    style={{ filter: "drop-shadow(0 0 8px rgba(16,185,129,0.3))" }}
                  />
                </svg>
                <div className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight" style={{ fontFamily: "var(--font-heading)", fontVariantNumeric: "tabular-nums" }}>
                  {formatTime(timeLeft)}
                </div>
              </div>
              <div className="flex flex-col md:flex-row w-full gap-3">
                <button
                  onClick={toggleTimer}
                  className="flex-1 py-3 md:py-4 rounded-full flex items-center justify-center gap-2 text-xs md:text-sm font-bold text-white shadow-lg transition-transform hover:-translate-y-1 active:translate-y-0"
                  style={{ background: isTimerRunning ? "#F59E0B" : "#10B981" }}
                >
                  {isTimerRunning ? <><IconPause size={16} /> Pause</> : <><IconPlay size={16} /> Start</>}
                </button>
                <button
                  onClick={endSession}
                  className="flex-1 py-3 md:py-4 rounded-full flex items-center justify-center gap-2 text-xs md:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  <IconSquare size={16} /> End & Eval
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB 2: DRILL LIBRARY ═══ */}
      {activeTab === "drills" && (
        <div className="space-y-6">
          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setDrillFilter(cat)}
                className="px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[10px] md:text-xs font-bold border transition-all"
                style={{
                  background: drillFilter === cat ? "var(--color-text)" : "#FFF",
                  color: drillFilter === cat ? "#FFF" : "var(--color-text-muted)",
                  borderColor: drillFilter === cat ? "var(--color-text)" : "var(--color-border)",
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Drill Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDrills.map(drill => {
              const selected = isDrillSelected(drill.id);
              const catColor = CATEGORY_COLORS[drill.category] || "#94A3B8";
              return (
                <div
                  key={drill.id}
                  onClick={() => toggleDrill(drill)}
                  className={`card-static p-5 cursor-pointer transition-all relative overflow-hidden group
                    ${selected ? "ring-2 ring-emerald-500 bg-emerald-50/50" : "hover:shadow-md"}`}
                >
                  {/* Selected check */}
                  {selected && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                      <IconCheck size={14} />
                    </div>
                  )}

                  {/* Category Badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                      style={{ background: `${catColor}15`, color: catColor, border: `1px solid ${catColor}30` }}
                    >
                      {CATEGORY_ICONS[drill.category] || <IconGrid size={12} />}
                      {drill.category}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{drill.difficulty}</span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-bold text-slate-900 text-base mb-1" style={{ fontFamily: "var(--font-heading)" }}>{drill.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-3">{drill.description}</p>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs font-bold text-slate-400">
                      <IconTimer size={14} /> {drill.duration_mins} min
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${selected ? "text-emerald-600" : "text-slate-300 group-hover:text-slate-500"} transition-colors`}>
                      {selected ? "Added ✓" : "Tap to Add"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Summary Footer */}
          {selectedDrills.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 z-50 animate-fade-up">
              <span className="text-sm font-bold">{selectedDrills.length} drills selected</span>
              <span className="text-xs text-slate-400">({totalDrillMins} min total)</span>
              <button
                onClick={() => setActiveTab("new")}
                className="ml-2 px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-xl hover:bg-emerald-600 transition-colors"
              >
                Build Session →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB 3: HISTORY ═══ */}
      {activeTab === "history" && (
        <div className="grid grid-cols-1 gap-4">
          {historyLoading ? (
            <div className="text-center py-12 text-slate-400 font-medium">Loading sessions...</div>
          ) : sessionHistory.length > 0 ? (
            sessionHistory.map((hs: any) => (
              <div key={hs.id} className="card-static p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-4 border-emerald-500 hover:bg-slate-50 transition-colors group cursor-pointer">
                <div>
                  <h4 className="font-bold text-slate-900 text-base mb-1">{hs.title}</h4>
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <span>{hs.session_date}</span>
                    <span>•</span>
                    <span>{hs.duration_mins} MINS</span>
                    <span>•</span>
                    <span className="text-emerald-600 px-2 py-0.5 bg-emerald-50 rounded-md">{hs.session_type}</span>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/coach/evaluate?session=${hs.session_type}&date=${hs.session_date}`)}
                  className="w-full md:w-auto px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl md:opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2 hover:bg-emerald-600"
                >
                  <IconClipboard size={14} /> View Evals
                </button>
              </div>
            ))
          ) : (
            /* Fallback Mock History */
            [
              { id: "S1", title: "Pre-Match Tactical", session_date: "2024-05-12", duration_mins: 90, session_type: "tactical" },
              { id: "S2", title: "Fitness Intervals", session_date: "2024-05-10", duration_mins: 45, session_type: "fitness" },
              { id: "S3", title: "Shooting Drills", session_date: "2024-05-08", duration_mins: 60, session_type: "training" },
            ].map(hs => (
              <div key={hs.id} className="card-static p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-4 border-emerald-500 hover:bg-slate-50 transition-colors group cursor-pointer">
                <div>
                  <h4 className="font-bold text-slate-900 text-base mb-1">{hs.title}</h4>
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <span>{hs.session_date}</span><span>•</span><span>{hs.duration_mins} MINS</span><span>•</span>
                    <span className="text-emerald-600 px-2 py-0.5 bg-emerald-50 rounded-md">{hs.session_type}</span>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/coach/evaluate?session=${hs.session_type}&date=${hs.session_date}`)}
                  className="w-full md:w-auto px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl md:opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2 hover:bg-emerald-600"
                >
                  <IconClipboard size={14} /> View Evals
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
