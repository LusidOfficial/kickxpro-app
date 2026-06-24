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
import { useAuth } from "@/lib/auth-context";
import {
  IconTimer, IconGrid, IconPlay, IconPause, IconSquare,
  IconClipboard, IconPlus, IconCheck, IconTarget, IconZap,
  IconActivity, IconShield, IconUsers, IconX, IconEdit, IconSave
} from "@/components/Icons";

type Drill = {
  id: string;
  title: string;
  category: string;
  duration_mins: number;
  difficulty: string;
  description: string;
  coach_id?: string;
  media_url?: string;
};

const CATEGORY_COLORS: Record<string, string> = {
  Passing: "#3B82F6", Shooting: "#EF4444", Fitness: "#F59E0B",
  Tactical: "#8B5CF6", Goalkeeping: "#06B6D4", "Match Prep": "#10B981",
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Passing: <IconUsers size={12} />,
  Shooting: <IconLightning size={12} />,
  Fitness: <IconLightning size={12} />,
  Tactical: <IconBrain size={12} />,
  Goalkeeping: <IconShield size={12} />,
  "Match Prep": <IconWhistle size={12} />,
};

export default function SessionsHubPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"new" | "drills" | "history">("new");

  /* ── New Session State ── */
  const [title, setTitle] = useState("");
  const [sessionType, setSessionType] = useState<string>(SESSION_TYPES[0].key);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState("");
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringPattern, setRecurringPattern] = useState("weekly");
  
  /* ── Roster State ── */
  const [myPlayers, setMyPlayers] = useState<{id: string, name: string, pos: string}[]>([]);

  /* ── Timer State ── */
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(duration * 60);

  /* ── Drill Planning ── */
  const [drillLibrary, setDrillLibrary] = useState<Drill[]>([]);
  const [selectedDrills, setSelectedDrills] = useState<Drill[]>([]);
  const [drillFilter, setDrillFilter] = useState("All");

  /* ── History ── */
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  /* ── Drill Modal & Editing ── */
  const [showDrillModal, setShowDrillModal] = useState(false);
  const [editingDrill, setEditingDrill] = useState<Drill | null>(null);
  const [isEditingMode, setIsEditingMode] = useState(false);

  const handleDrillClick = (drill: Drill) => {
    setEditingDrill(drill);
    setIsEditingMode(false);
    setShowDrillModal(true);
  };

  const handleCreateDrill = () => {
    setEditingDrill({
      id: `new_${Date.now()}`,
      title: "",
      category: "Passing",
      duration_mins: 15,
      difficulty: "Beginner",
      description: "",
      media_url: "",
      coach_id: user?.id
    });
    setIsEditingMode(true);
    setShowDrillModal(true);
  };

  const handleSaveDrill = async () => {
    if (!editingDrill) return;
    
    const isNew = editingDrill.id.startsWith("new_");
    let drillToSave = { ...editingDrill };
    let finalId = drillToSave.id;
    
    if (!isNew && !drillToSave.coach_id && isEditingMode) {
       // editing a template creates a new copy
       finalId = `custom_${Date.now()}`;
       drillToSave.coach_id = user?.id;
    }

    try {
      if (user) {
         const isInsert = finalId.startsWith("new_") || finalId.startsWith("custom_");
         const payload = {
           title: drillToSave.title,
           category: drillToSave.category,
           duration_mins: drillToSave.duration_mins,
           difficulty: drillToSave.difficulty,
           description: drillToSave.description,
           coach_id: user.id,
           media_url: drillToSave.media_url || null
         };

         if (isInsert) {
           const { data } = await supabase.from('drills').insert(payload).select().single();
           if (data) finalId = data.id;
         } else {
           await supabase.from('drills').update(payload).eq('id', finalId);
         }
      }
    } catch (err) { console.error(err); }

    drillToSave.id = finalId;

    setDrillLibrary(prev => {
      const exists = prev.find(d => d.id === drillToSave.id);
      if (exists) return prev.map(d => d.id === drillToSave.id ? drillToSave : d);
      return [drillToSave, ...prev];
    });

    setIsEditingMode(false);
    setEditingDrill(drillToSave);
  };

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

  /* ── Fetch Drill Library & Roster ── */
  useEffect(() => {
    if (!user) return;
    
    async function initData() {
      // 1. Fetch drills
      try {
        const { data } = await supabase.from('drills').select('*');
        if (data && data.length > 0) {
          setDrillLibrary(data.map(d => ({ ...d, id: d.id })));
        }
      } catch { /* use seed */ }
      
      // 2. Fetch players for attendance list
      try {
         const { data, error } = await supabase
           .from('profiles')
           .select('id, full_name, role, position')
           .eq('role', 'player')
           .eq('coach_id', user!.id);
           
         if (!error && data) {
           setMyPlayers(data.map((p) => ({
             id: p.id,
             name: p.full_name || "Unknown",
             pos: p.position || p.full_name?.substring(0, 2).toUpperCase() || "PL"
           })));
         }
      } catch {}
    }
    initData();
  }, [user]);

  /* ── Fetch history from DB ── */
  useEffect(() => {
    if (!user) return;
    async function fetchHistory() {
      setHistoryLoading(true);
      try {
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .eq('coach_id', user!.id)
          .order('session_date', { ascending: false })
          .limit(20);
        if (error) throw error;
        if (data) setSessionHistory(data);
      } catch { /* fail silently */ }
      setHistoryLoading(false);
    }
    if (activeTab === "history") fetchHistory();
  }, [activeTab, user]);

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

  /* ── Timer Helpers & Session Action ── */
  const toggleTimer = () => setIsTimerRunning(!isTimerRunning);
  
  const endSession = async () => {
    setIsTimerRunning(false);
    
    if (!user) return;
    try {
      // Store session data including attendance into DB
      const { data, error } = await supabase.from("sessions").insert({
        coach_id: user.id,
        title: title || `${sessionType} Session`,
        session_type: sessionType,
        session_date: date,
        start_time: startTime + ":00", // DB needs HH:MM:SS format 
        duration_mins: duration,
        notes: notes,
        is_recurring: isRecurring,
        recurring_pattern: isRecurring ? recurringPattern : null,
        attendance: attendance
      }).select("id").single();
      
      if (!error && data) {
         router.push(`/coach/evaluate?session_id=${data.id}&date=${date}`);
         return;
      } else {
         console.error(error);
      }
    } catch(err) { console.error(err); }
    
    // Fallback if insertion fails
    router.push(`/coach/evaluate?session=${sessionType}&date=${date}`);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };
  
  const totalSeconds = duration * 60;
  const elapsedSeconds = totalSeconds - timeLeft;
  
  // Determine current active drill based on elapsed time
  let currentActiveDrill = null;
  let currentDrillColor = "#10B981";
  let currentDrillTimeLeft = timeLeft;
  let currentDrillProgress = (elapsedSeconds / totalSeconds) * 100;
  
  if (selectedDrills.length > 0) {
    let accumulatedSeconds = 0;
    for (const drill of selectedDrills) {
      const drillSeconds = drill.duration_mins * 60;
      accumulatedSeconds += drillSeconds;
      if (elapsedSeconds <= accumulatedSeconds) {
        currentActiveDrill = drill;
        currentDrillColor = CATEGORY_COLORS[drill.category] || "#10B981";
        const drillElapsed = elapsedSeconds - (accumulatedSeconds - drillSeconds);
        currentDrillTimeLeft = drillSeconds - drillElapsed;
        currentDrillProgress = (drillElapsed / drillSeconds) * 100;
        break;
      }
    }
  }

  // Calculate SVG stroke dashes for the ring segments (for aesthetics)
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (currentDrillProgress / 100) * circumference;

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

              {/* Recurring Session Toggle */}
              <div className="card-static border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="isRecurring" 
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                  />
                  <label htmlFor="isRecurring" className="text-xs font-bold text-slate-700 cursor-pointer">Make this a recurring session</label>
                </div>
                {isRecurring && (
                  <div className="mt-3 ml-7 flex items-center gap-3 animate-fade-up">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Repeats:</label>
                    <select className="input py-1.5 text-xs" value={recurringPattern} onChange={e => setRecurringPattern(e.target.value)}>
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                )}
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

              {/* Selected Drills Preview & Timeline */}
              {selectedDrills.length > 0 && (
                <div className="card-static border-emerald-100 bg-emerald-50/30 p-4 md:p-5">
                  <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                    Session Timeline ({selectedDrills.length} Drills)
                  </label>
                  
                  {/* Visual Combo Bar */}
                  <div className="w-full h-3 md:h-5 bg-white rounded-full overflow-hidden flex shadow-inner border border-slate-200 mb-4">
                    {selectedDrills.map((d, i) => (
                      <div 
                        key={d.id + i}
                        className="h-full transition-all hover:brightness-110 flex items-center justify-center border-r border-white/20 last:border-0 cursor-pointer"
                        style={{ 
                          width: `${(d.duration_mins / totalDrillMins) * 100}%`,
                          background: CATEGORY_COLORS[d.category] || "#10B981"
                        }}
                        title={`${d.title} (${d.duration_mins}m)`}
                      />
                    ))}
                  </div>

                  <div className="flex justify-between items-center mb-5 text-[10px] md:text-xs font-bold text-slate-500 border-b border-emerald-100 pb-4">
                    <span>0m</span>
                    <span className="text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md">{totalDrillMins} mins total</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selectedDrills.map((d, i) => (
                      <div
                        key={d.id + i}
                        className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 rounded-xl px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-bold cursor-pointer hover:border-red-200 hover:bg-red-50 transition-colors shadow-sm group"
                        onClick={() => toggleDrill(d)}
                      >
                        <span className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: CATEGORY_COLORS[d.category] || "#10B981" }}></span>
                        {d.title} ({d.duration_mins}m)
                        <span className="text-slate-400 group-hover:text-red-500 ml-1">✕</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attendance Marking (Step 5) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">5. Mark Attendance</label>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {Object.keys(attendance).length} / {myPlayers.length} Marked
                  </span>
                </div>
                
                <div className="card-static p-4 max-h-[300px] overflow-y-auto custom-scrollbar space-y-2">
                  {myPlayers.length === 0 ? (
                    <div className="text-center text-xs text-slate-400 py-4">No players in squad.</div>
                  ) : myPlayers.map((p: any) => {
                    const status = attendance[p.id] || null;
                    return (
                      <div key={p.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50/50 border border-transparent hover:border-slate-200 transition-all">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${status ? 'bg-white shadow-sm' : 'bg-slate-100 text-slate-400'}`}>
                            {p.pos}
                          </div>
                          <span className="text-sm font-bold text-slate-700">{p.name}</span>
                        </div>
                        
                        <div className="flex bg-white/50 p-1 rounded-lg border border-slate-100">
                          {(['Present', 'Late', 'Absent'] as const).map(s => (
                            <button
                              key={s}
                              onClick={() => setAttendance(prev => ({ ...prev, [p.id]: s }))}
                              className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all
                                ${status === s 
                                  ? (s === 'Present' ? 'bg-emerald-500 text-white shadow-md' : s === 'Late' ? 'bg-amber-500 text-white shadow-md' : 'bg-red-500 text-white shadow-md') 
                                  : 'text-slate-400 hover:text-slate-600'}`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Session Notes (Optional)</label>
                <textarea className="textarea min-h-[80px] text-xs md:text-sm" placeholder="Weather, team mood, tactics..." value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Right Col: Timer & Execution */}
          <div className="lg:col-span-2">
            <div className="card-static p-6 md:p-8 flex flex-col items-center justify-center min-h-[400px] sticky top-24 pitch-accent">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6" style={{ fontFamily: "var(--font-heading)" }}>Session Timer</h3>
              
              <div className="relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center mb-8">
                {/* Background Ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 140 140">
                  <circle cx="70" cy="70" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="8" />
                  
                  {/* Progress Ring */}
                  <circle 
                    cx="70" 
                    cy="70" 
                    r={radius} 
                    fill="none" 
                    stroke={currentDrillColor} 
                    strokeWidth="8" 
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-1000 ease-linear"
                  />
                  
                  {/* Decorative dots for each drill segment */}
                  {selectedDrills.length > 0 && selectedDrills.reduce((acc, drill, index) => {
                    const drillSeconds = drill.duration_mins * 60;
                    acc.accum += drillSeconds;
                    const percent = acc.accum / (duration * 60);
                    if (percent < 1) { // Don't draw at exactly 100%
                      const angle = percent * 2 * Math.PI;
                      const x = 70 + radius * Math.cos(angle);
                      const y = 70 + radius * Math.sin(angle);
                      acc.elements.push(
                        <circle key={index} cx={x} cy={y} r="3" fill="#FFF" stroke="#CBD5E1" strokeWidth="1" />
                      );
                    }
                    return acc;
                  }, { accum: 0, elements: [] as JSX.Element[] }).elements}
                </svg>
                
                <div className="text-center absolute flex flex-col items-center justify-center w-full px-2">
                  <div className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight transition-colors duration-500" style={{ fontFamily: "var(--font-heading)", fontVariantNumeric: "tabular-nums", color: isTimerRunning ? currentDrillColor : '#0F172A' }}>
                    {formatTime(currentDrillTimeLeft)}
                  </div>
                  {currentActiveDrill ? (
                    <div className="flex flex-col items-center mt-1">
                      <div className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md truncate max-w-[140px]" style={{ background: `${currentDrillColor}15`, color: currentDrillColor }}>
                        {currentActiveDrill.title}
                      </div>
                      <div className="mt-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-full">
                        Total left: {formatTime(timeLeft)}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-0.5 rounded-md" style={{ background: '#F1F5F9' }}>
                      {isTimerRunning ? "Free Play" : "Ready"}
                    </div>
                  )}
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
                  className="flex-1 py-3 md:py-4 rounded-full flex items-center justify-center gap-2 text-xs md:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400"
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
          {/* Action Bar & Category Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
            <button
              onClick={handleCreateDrill}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-colors shadow-sm w-max"
            >
              <IconPlus size={16} /> Create Session/Drill
            </button>
          </div>

          {/* Drill Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDrills.map(drill => {
              const selected = isDrillSelected(drill.id);
              const catColor = CATEGORY_COLORS[drill.category] || "#94A3B8";
              return (
                <div
                  key={drill.id}
                  onClick={() => handleDrillClick(drill)}
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
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${selected ? "text-emerald-600" : "text-slate-400 group-hover:text-emerald-500"} transition-colors`}>
                      {selected ? "Selected ✓" : "View Details"}
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

      {/* ═══ DRILL MODAL ═══ */}
      {showDrillModal && editingDrill && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-up">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900" style={{ fontFamily: "var(--font-heading)" }}>
                {isEditingMode ? (editingDrill.id.startsWith("new_") ? "Create Drill Card" : "Edit Drill Card") : "Drill Details"}
              </h3>
              <button onClick={() => setShowDrillModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <IconX size={20} />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
              {isEditingMode ? (
                // EDIT MODE
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Title</label>
                    <input 
                      type="text" 
                      className="input w-full" 
                      value={editingDrill.title} 
                      onChange={e => setEditingDrill({...editingDrill, title: e.target.value})} 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Category</label>
                      <select 
                        className="input w-full" 
                        value={editingDrill.category} 
                        onChange={e => setEditingDrill({...editingDrill, category: e.target.value})}
                      >
                        {["Passing", "Shooting", "Fitness", "Tactical", "Goalkeeping", "Match Prep"].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Difficulty</label>
                      <select 
                        className="input w-full" 
                        value={editingDrill.difficulty} 
                        onChange={e => setEditingDrill({...editingDrill, difficulty: e.target.value})}
                      >
                        {["Beginner", "Intermediate", "Advanced", "Elite"].map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Media URL (YouTube/Image)</label>
                    <input 
                      type="url" 
                      placeholder="https://..."
                      className="input w-full text-xs" 
                      value={editingDrill.media_url || ""} 
                      onChange={e => setEditingDrill({...editingDrill, media_url: e.target.value})} 
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Duration (Mins)</label>
                    <input 
                      type="number" 
                      className="input w-full" 
                      value={editingDrill.duration_mins} 
                      onChange={e => setEditingDrill({...editingDrill, duration_mins: parseInt(e.target.value) || 0})} 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Description</label>
                    <textarea 
                      className="textarea w-full min-h-[100px]" 
                      value={editingDrill.description} 
                      onChange={e => setEditingDrill({...editingDrill, description: e.target.value})} 
                    />
                  </div>
                  {!editingDrill.coach_id && !editingDrill.id.startsWith("new_") && (
                    <div className="p-3 bg-amber-50 text-amber-700 rounded-xl text-xs font-medium border border-amber-200">
                      You are editing a template. Saving will create a new custom card in your library.
                    </div>
                  )}
                </div>
              ) : (
                // VIEW MODE
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold uppercase">
                        {editingDrill.category}
                      </span>
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase">
                        {editingDrill.difficulty}
                      </span>
                      {!editingDrill.coach_id && (
                        <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-100 rounded-lg text-[10px] font-bold uppercase">
                          Template
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">{editingDrill.title}</h2>
                    <div className="flex items-center gap-1 text-xs font-bold text-slate-400 mt-1">
                      <IconTimer size={14} /> {editingDrill.duration_mins} mins
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 mb-1">Description</h4>
                    <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                      {editingDrill.description || "No description provided."}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
              {isEditingMode ? (
                <>
                  <button 
                    onClick={() => {
                      if (editingDrill.id.startsWith("new_")) setShowDrillModal(false);
                      else setIsEditingMode(false);
                    }} 
                    className="px-4 py-2 text-slate-500 font-bold text-sm hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveDrill}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white font-bold text-sm rounded-xl hover:bg-emerald-600 shadow-sm transition-colors"
                  >
                    <IconSave size={16} /> Save Card
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => setIsEditingMode(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 shadow-sm transition-colors"
                  >
                    <IconEdit size={16} /> Edit
                  </button>
                  
                  <button 
                    onClick={() => {
                      toggleDrill(editingDrill);
                      setShowDrillModal(false);
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 font-bold text-sm rounded-xl shadow-sm transition-colors ${
                      isDrillSelected(editingDrill.id)
                        ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                        : "bg-slate-900 text-white hover:bg-black"
                    }`}
                  >
                    {isDrillSelected(editingDrill.id) ? (
                      <>Remove from Session</>
                    ) : (
                      <><IconPlus size={16} /> Add to Session</>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
