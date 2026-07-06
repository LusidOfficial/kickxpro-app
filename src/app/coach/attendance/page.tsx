/* ──────────────────────────────────────────────
   ATTENDANCE — 3-step flow:
   1. Setup (type + drills)
   2. Take Attendance (tap student grid)
   3. Session Running (live timer + activity)
   ────────────────────────────────────────────── */
"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SESSION_TYPES } from "@/lib/constants";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import {
  IconCheck, IconTimer, IconPlay, IconClipboard, IconTarget,
  IconActivity, IconShield, IconSquare, IconZap, IconGrid, IconUsers, IconArrowLeft, IconPause,
  IconPlus, IconX, IconEdit, IconSave
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
type AttendanceStatus = "Present" | "Late" | "Absent" | null;
// 3 steps: "setup" | "attendance" | "running"
type FlowStep = "idle" | "setup" | "attendance" | "running";

interface Student { id: string; name: string; position: string; }
interface AttendanceRecord { playerId: string; status: AttendanceStatus; markedAt: string | null; }
interface PastSession {
  id: string; title: string; session_date: string;
  duration_mins: number; session_type?: string; notes?: string;
  presentCount?: number; totalCount?: number;
}
interface SessionDetail extends PastSession {
  attendees: { name: string; status: string; time: string }[];
}

function AttendanceContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [upcomingSessionRSVPs, setUpcomingSessionRSVPs] = useState<{ title: string; count: number } | null>(null);

  // Flow step
  const [step, setStep] = useState<FlowStep>("idle");

  /* ── Drill Modal & Editing ── */
  const [drillLibrary, setDrillLibrary] = useState<Drill[]>([]);
  const [showDrillModal, setShowDrillModal] = useState(false);
  const [editingDrill, setEditingDrill] = useState<Drill | null>(null);
  const [isEditingMode, setIsEditingMode] = useState(false);

  // Step 1 — Setup
  const [sessionType, setSessionType] = useState<string>(SESSION_TYPES[0].key);
  const [showDrills, setShowDrills] = useState(false);
  const [selectedDrills, setSelectedDrills] = useState<Drill[]>([]);
  const [drillFilter, setDrillFilter] = useState("All");

  // Step 2 — Attendance
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});

  // Step 3 — Running session
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0); // seconds
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // History
  const [pastSessions, setPastSessions] = useState<PastSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionDetail | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => { if (!user) return; loadData(); }, [user]);

  // Auto-open session detail if ?open=id is in URL
  useEffect(() => {
    const openId = searchParams?.get("open");
    if (openId && pastSessions.length > 0 && !selectedSession) {
      const s = pastSessions.find(p => p.id === openId);
      if (s) openSessionDetail(s);
    }
  }, [searchParams, pastSessions]);

  // Live timer
  useEffect(() => {
    if (step === "running" && sessionStartTime) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - sessionStartTime.getTime()) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [step, sessionStartTime]);

  async function loadData() {
    if (!user) return;
    setLoading(true);
    const { data: pData } = await supabase
      .from("profiles").select("id, full_name, position")
      .eq("role", "player").eq("coach_id", user.id).order("full_name");
    if (pData) setStudents(pData.map(p => ({ id: p.id, name: p.full_name || "Unknown", position: p.position || "MID" })));

    const { data: sData } = await supabase
      .from("sessions").select("id, title, session_date, duration_mins, session_type, notes")
      .eq("coach_id", user.id).order("session_date", { ascending: false }).limit(3);
    if (sData) {
      const withCounts = await Promise.all(sData.map(async s => {
        const { count: pCount } = await supabase.from("attendance_logs").select("id", { count: "exact", head: true }).eq("session_id", s.id).in("status", ["Present", "Late"]);
        const { count: tCount } = await supabase.from("attendance_logs").select("id", { count: "exact", head: true }).eq("session_id", s.id);
        return { ...s, presentCount: pCount || 0, totalCount: tCount || 0 };
      }));
      setPastSessions(withCounts);
    }

    // Fetch upcoming session RSVPs
    const todayStr = new Date().toISOString().split("T")[0];
    const { data: nextSession } = await supabase
      .from("sessions").select("id, title")
      .eq("coach_id", user.id).gte("session_date", todayStr)
      .order("session_date", { ascending: true }).limit(1).single();

    if (nextSession) {
      const { count } = await supabase.from("session_responses")
        .select("*", { count: "exact", head: true })
        .eq("session_id", nextSession.id).eq("response", "going");
      setUpcomingSessionRSVPs({ title: nextSession.title, count: count || 0 });
    }

    // Fetch custom drills
    const { data: customDrills } = await supabase.from("drills").select("*");
    
    const DEFAULT_DRILLS: Drill[] = [
      { id: "def_1", title: "Rondo 4v1", category: "Passing", duration_mins: 15, difficulty: "Beginner", description: "Basic passing and pressing under pressure." },
      { id: "def_2", title: "Dynamic Stretching", category: "Fitness", duration_mins: 10, difficulty: "Beginner", description: "Warmup targeting hamstrings, quads, and calves." },
      { id: "def_3", title: "Shooting Gallery", category: "Shooting", duration_mins: 20, difficulty: "Intermediate", description: "Quick-fire shooting from the edge of the box." },
      { id: "def_4", title: "High Press Tactical", category: "Tactical", duration_mins: 25, difficulty: "Advanced", description: "Team shape and triggers for a high press." },
      { id: "def_5", title: "Attacking Overloads", category: "Match Prep", duration_mins: 30, difficulty: "Elite", description: "3v2 and 4v3 scenarios in the final third." },
      { id: "def_6", title: "Goalkeeper Distribution", category: "Goalkeeping", duration_mins: 15, difficulty: "Intermediate", description: "Playing out from the back under pressure." }
    ];

    let combinedDrills = [...DEFAULT_DRILLS];

    if (customDrills && customDrills.length > 0) {
      const formatted = customDrills.map(d => ({
        id: d.id,
        title: d.title,
        category: d.category || "Passing",
        duration_mins: d.duration_mins || 15,
        difficulty: d.difficulty || "Beginner",
        description: d.description || "",
        coach_id: d.coach_id,
        media_url: d.media_url
      }));
      // Prevent duplicates if DB already seeded the defaults
      const formattedFiltered = formatted.filter(d => !DEFAULT_DRILLS.some(def => def.title === d.title));
      combinedDrills = [...combinedDrills, ...formattedFiltered];
    }
    
    setDrillLibrary(combinedDrills);

    setLoading(false);
  }

  async function openSessionDetail(session: PastSession) {
    const { data: logs } = await supabase
      .from("attendance_logs").select("status, marked_at, player_id")
      .eq("session_id", session.id);
    const attendees = (logs || []).map(l => {
      const s = students.find(st => st.id === l.player_id);
      return { name: s?.name || "Unknown", status: l.status, time: l.marked_at ? new Date(l.marked_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--" };
    });
    setSelectedSession({ ...session, attendees });
  }

  /* ── Drill helpers ── */
  const toggleDrill = (d: Drill) => setSelectedDrills(prev => prev.find(x => x.id === d.id) ? prev.filter(x => x.id !== d.id) : [...prev, d]);
  const isDrillSelected = (id: string) => selectedDrills.some(d => d.id === id);
  const totalDrillMins = selectedDrills.reduce((s, d) => s + d.duration_mins, 0);
  const categories = ["All", ...Array.from(new Set(drillLibrary.map(d => d.category)))];
  const filteredDrills = drillFilter === "All" ? drillLibrary : drillLibrary.filter(d => d.category === drillFilter);

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
           coach_id: user.id
         };

         if (isInsert) {
           const { data } = await supabase.from("drills").insert(payload).select().single();
           if (data) finalId = data.id;
         } else {
           await supabase.from("drills").update(payload).eq("id", finalId);
         }
      }
    } catch (err) { console.error(err); }

    drillToSave.id = finalId;

    setDrillLibrary(prev => {
      const idx = prev.findIndex(d => d.id === drillToSave.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = drillToSave;
        return next;
      }
      return [...prev, drillToSave];
    });

    setEditingDrill(null);
    setShowDrillModal(false);
    showToastMsg("Drill saved successfully!");
  };

  /* ── Step transitions ── */
  function proceedToAttendance() {
    const initial: Record<string, AttendanceRecord> = {};
    students.forEach(s => { initial[s.id] = { playerId: s.id, status: null, markedAt: null }; });
    setAttendance(initial);
    setStep("attendance");
  }

  async function startRunning() {
    const now = new Date();
    const typeLabel = SESSION_TYPES.find(t => t.key === sessionType)?.label || "Training";
    const title = `${typeLabel} — ${now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}`;
    setSessionTitle(title);
    setSessionStartTime(now);
    setElapsed(0);
    setStep("running");

    if (user) {
      const { data, error } = await supabase.from("sessions").insert({
        coach_id: user.id,
        title: title,
        session_type: sessionType,
        session_date: now.toISOString().split("T")[0],
        start_time: now.toTimeString().split(" ")[0],
        duration_mins: 0,
        notes: "Live Session",
      }).select("id").single();
      if (!error && data) {
        setActiveSessionId(data.id);
      }
    }
  }

  function tapStudent(studentId: string) {
    const current = attendance[studentId]?.status;
    const now = new Date().toISOString();
    let ns: AttendanceStatus = current === null ? "Present" : current === "Present" ? "Late" : current === "Late" ? "Absent" : null;
    setAttendance(prev => ({ ...prev, [studentId]: { playerId: studentId, status: ns, markedAt: ns ? now : null } }));
  }

  async function endSession() {
    if (!user || !sessionStartTime) return;
    setSaving(true);
    try {
      const drillNotes = selectedDrills.length > 0 ? `Drills: ${selectedDrills.map(d => d.title).join(", ")}` : "";
      const finalDuration = Math.max(Math.round(elapsed / 60), 1);
      const notes = `${presentCount}P / ${lateCount}L / ${absentCount}A. ${drillNotes}`;

      let sessionId = activeSessionId;

      if (sessionId) {
        // Update existing live session
        await supabase.from("sessions").update({
          duration_mins: finalDuration,
          notes: notes,
        }).eq("id", sessionId);
      } else {
        // Fallback insert if startRunning failed to set activeSessionId
        const { data, error } = await supabase.from("sessions").insert({
          coach_id: user.id,
          title: sessionTitle,
          session_type: sessionType,
          session_date: sessionStartTime.toISOString().split("T")[0],
          start_time: sessionStartTime.toTimeString().split(" ")[0],
          duration_mins: finalDuration,
          notes: notes,
        }).select("id").single();
        if (error) throw error;
        if (data) sessionId = data.id;
      }

      if (sessionId) {
        const logs = Object.values(attendance).filter(a => a.status !== null).map(a => ({
          session_id: sessionId, player_id: a.playerId,
          status: a.status!, marked_by: user.id, marked_at: a.markedAt || new Date().toISOString(),
        }));
        if (logs.length > 0) await supabase.from("attendance_logs").insert(logs);
      }

      setActiveSessionId(null);
      setStep("idle");
      setSessionStartTime(null);
      setAttendance({});
      setSelectedDrills([]);
      showToastMsg("Session saved! ✅");
      loadData();

      if (sessionId) {
        setTimeout(() => {
          if (confirm("Session saved! Evaluate players now?")) {
            const categories = Array.from(new Set(selectedDrills.map(d => d.category))).join(",");
            router.push(`/coach/evaluate?session_id=${sessionId}&categories=${encodeURIComponent(categories)}`);
          }
        }, 500);
      }
    } catch (err) { console.error(err); showToastMsg("Error saving session."); }
    setSaving(false);
  }

  function showToastMsg(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3500); }

  const presentCount = Object.values(attendance).filter(a => a.status === "Present").length;
  const lateCount = Object.values(attendance).filter(a => a.status === "Late").length;
  const absentCount = Object.values(attendance).filter(a => a.status === "Absent").length;
  const markedCount = presentCount + lateCount + absentCount;

  function getStatusColor(status: AttendanceStatus) {
    switch (status) {
      case "Present": return { bg: "bg-emerald-500", text: "text-white", ring: "ring-emerald-300", label: "✓ Present" };
      case "Late": return { bg: "bg-amber-500", text: "text-white", ring: "ring-amber-300", label: "⏰ Late" };
      case "Absent": return { bg: "bg-red-400", text: "text-white", ring: "ring-red-300", label: "✕ Absent" };
      default: return { bg: "bg-slate-100", text: "text-slate-400", ring: "", label: "Tap" };
    }
  }

  function getTypeColor(key: string) { return SESSION_TYPES.find(t => t.key === key)?.color || "#94A3B8"; }
  function formatElapsed(s: number) {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  function formatTime(iso: string | null) { return iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""; }

  return (
    <div className="max-w-5xl mx-auto pb-24 px-4 xl:px-0 opacity-0 animate-fade-up">

      {/* ════════════════════════════════════════
          STEP INDICATOR (only shown during flow)
          ════════════════════════════════════════ */}
      {step !== "idle" && (
        <div className="flex items-center gap-2 mb-6">
          {[
            { key: "setup", label: "1. Setup" },
            { key: "attendance", label: "2. Attendance" },
            { key: "running", label: "3. Session" },
          ].map((s, i) => {
            const isActive = step === s.key;
            const isDone = (step === "attendance" && i === 0) || (step === "running" && i < 2);
            return (
              <div key={s.key} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${isActive ? "bg-emerald-600 text-white shadow-md" : isDone ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                  {isDone ? <IconCheck size={12} /> : null}
                  {s.label}
                </div>
                {i < 2 && <div className={`w-6 h-0.5 rounded ${isDone || isActive ? "bg-emerald-300" : "bg-slate-200"}`} />}
              </div>
            );
          })}
          <button onClick={() => setStep("idle")} className="ml-auto text-[10px] font-bold text-slate-400 hover:text-slate-600">Cancel</button>
        </div>
      )}

      {/* ════════════════════════════════════════
          HEADER
          ════════════════════════════════════════ */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-slate-900 leading-tight" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}>
            {step === "idle" ? "Attendance" : step === "setup" ? "Session Setup" : step === "attendance" ? "Mark Attendance" : "Session Running"}
          </h1>
          <p className="text-slate-500 font-medium text-xs md:text-sm">
            {step === "idle" ? "Start a session to take attendance." :
              step === "setup" ? "Choose session type and load your drills." :
              step === "attendance" ? "Tap each student to mark their status." :
              "Session is live! Timer is running."}
          </p>
        </div>
        {step === "idle" && (
          <div className="flex flex-col items-end gap-2 self-start">
            <button onClick={() => setStep("setup")} disabled={students.length === 0}
              className="btn-primary flex items-center gap-2 text-sm py-3 px-6 shadow-lg disabled:opacity-50">
              <IconPlay size={16} /> Start Today's Session
            </button>
            {upcomingSessionRSVPs && (
              <div className="text-[10px] font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border flex items-center gap-1.5">
                <IconCheck size={12} color="#10B981" /> 
                {upcomingSessionRSVPs.count} {upcomingSessionRSVPs.count === 1 ? 'player has' : 'players have'} RSVP'd "Going" to next session
              </div>
            )}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════
          STEP 1 — SETUP
          ════════════════════════════════════════ */}
      {step === "setup" && (
        <div className="card-static p-6 mb-8 border-2 border-emerald-100 space-y-6 animate-fade-up">

          {/* Session Type */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Session Type</label>
            <div className="flex flex-wrap gap-2">
              {SESSION_TYPES.map(t => (
                <button key={t.key} onClick={() => setSessionType(t.key)}
                  className="px-4 py-2 rounded-xl text-sm font-bold transition-all border-2"
                  style={{
                    background: sessionType === t.key ? `${t.color}15` : "#FFF",
                    color: sessionType === t.key ? t.color : "var(--color-text-muted)",
                    borderColor: sessionType === t.key ? t.color : "var(--color-border)",
                  }}>
                  <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: t.color }} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Drill Library */}
          <div className="flex items-center justify-between">
            <button onClick={() => setShowDrills(!showDrills)}
              className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-emerald-600 transition-colors">
              <IconClipboard size={14} />
              {showDrills ? "Hide Drill Library ▲" : "Pick Drills from Library ▼"}
              {selectedDrills.length > 0 && (
                <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md text-[10px]">
                  {selectedDrills.length} selected ({totalDrillMins}m)
                </span>
              )}
            </button>
            <button
              onClick={handleCreateDrill}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-colors shadow-sm"
            >
              <IconPlus size={14} /> Create Session/Drill
            </button>
          </div>

          {showDrills && (
            <div className="space-y-4 animate-fade-up">
              <div className="flex flex-wrap gap-1.5">
                {categories.map(cat => (
                  <button key={cat} onClick={() => setDrillFilter(cat)}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all"
                    style={{
                      background: drillFilter === cat ? "#0F172A" : "#FFF",
                      color: drillFilter === cat ? "#FFF" : "var(--color-text-muted)",
                      borderColor: drillFilter === cat ? "#0F172A" : "var(--color-border)",
                    }}>{cat}</button>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
                {filteredDrills.map(drill => {
                  const sel = isDrillSelected(drill.id);
                  const clr = CATEGORY_COLORS[drill.category] || "#94A3B8";
                  return (
                    <div key={drill.id} onClick={() => handleDrillClick(drill)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all relative ${sel ? "border-emerald-500 bg-emerald-50/60 shadow-sm" : "border-slate-200 hover:border-slate-300 bg-white"}`}>
                      {sel && <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center"><IconCheck size={11} /></div>}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase mb-2" style={{ background: `${clr}15`, color: clr, border: `1px solid ${clr}30` }}>
                        {drill.category}
                      </span>
                      <div className="font-bold text-slate-900 text-sm mb-1">{drill.title}</div>
                      <div className="text-[10px] text-slate-500 mb-2">{drill.description}</div>
                      <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><IconTimer size={11} /> {drill.duration_mins}m</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Timeline */}
          {selectedDrills.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                Session Timeline ({selectedDrills.length} Drills • {totalDrillMins}m)
              </div>
              <div className="w-full h-4 bg-white rounded-full overflow-hidden flex shadow-inner border border-slate-200 mb-3">
                {selectedDrills.map((d, i) => (
                  <div key={d.id + i} className="h-full" title={`${d.title} (${d.duration_mins}m)`}
                    style={{ width: `${(d.duration_mins / totalDrillMins) * 100}%`, background: CATEGORY_COLORS[d.category] || "#10B981" }} />
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedDrills.map((d, i) => (
                  <span key={d.id + i} onClick={() => toggleDrill(d)}
                    className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-600 cursor-pointer hover:border-red-200 hover:bg-red-50 transition-colors">
                    <span className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[d.category] }} />
                    {d.title} ({d.duration_mins}m) <span className="text-slate-300 ml-0.5">✕</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <button onClick={proceedToAttendance}
            className="w-full py-3.5 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:bg-emerald-700 transition-colors">
            <IconUsers size={16} /> Next: Mark Attendance →
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════
          STEP 2 — TAKE ATTENDANCE
          ════════════════════════════════════════ */}
      {step === "attendance" && (
        <div className="space-y-6 mb-10 animate-fade-up">
          {/* Summary bar */}
          <div className="card-static p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
            style={{ background: `${getTypeColor(sessionType)}08`, borderLeft: `4px solid ${getTypeColor(sessionType)}` }}>
            <div>
              <div className="font-bold text-slate-900 text-sm">{SESSION_TYPES.find(t => t.key === sessionType)?.label} Session</div>
              {selectedDrills.length > 0 && <div className="text-[10px] text-slate-500">{selectedDrills.length} drills loaded • {totalDrillMins}m planned</div>}
            </div>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg">{presentCount} Present</span>
              <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg">{lateCount} Late</span>
              <span className="px-2.5 py-1 bg-red-100 text-red-600 rounded-lg">{absentCount} Absent</span>
            </div>
          </div>

          <div className="text-center text-xs text-slate-400 font-medium">
            Tap once = <span className="text-emerald-600 font-bold">Present</span> → Again = <span className="text-amber-600 font-bold">Late</span> → Again = <span className="text-red-500 font-bold">Absent</span> → Again = Reset
          </div>

          {/* Student tap grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {students.map(student => {
              const record = attendance[student.id];
              const status = record?.status;
              const colors = getStatusColor(status);
              return (
                <button key={student.id} onClick={() => tapStudent(student.id)}
                  className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all transform active:scale-95 cursor-pointer
                    ${status === "Present" ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-200 shadow-lg" :
                      status === "Late" ? "border-amber-400 bg-amber-50 ring-2 ring-amber-200 shadow-lg" :
                      status === "Absent" ? "border-red-400 bg-red-50 ring-2 ring-red-200 shadow-lg" :
                      "border-slate-200 hover:border-slate-300 bg-white hover:shadow-md"}`}>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-black transition-all ${colors.bg} ${colors.text} shadow-md`}>
                    {status === "Present" ? "✓" : status === "Late" ? "⏰" : status === "Absent" ? "✕" : student.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="text-sm font-bold text-slate-700 truncate max-w-full">{student.name}</div>
                  <div className={`text-xs font-black uppercase tracking-wider ${status === "Present" ? "text-emerald-600" : status === "Late" ? "text-amber-600" : status === "Absent" ? "text-red-500" : "text-slate-300"}`}>
                    {colors.label}
                  </div>
                  {record?.markedAt && <div className="text-[9px] font-medium text-slate-400">{formatTime(record.markedAt)}</div>}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col items-center gap-3 pt-4">
            <div className="text-xs text-slate-400 font-medium">{markedCount} of {students.length} marked</div>
            <button onClick={startRunning} disabled={markedCount === 0}
              className="px-8 py-3.5 rounded-full bg-emerald-600 text-white font-bold text-sm flex items-center gap-2 shadow-xl hover:bg-emerald-700 transition-all disabled:opacity-50 active:scale-95">
              <IconPlay size={16} /> Start Session Timer →
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          STEP 3 — SESSION RUNNING (Live Timer)
          ════════════════════════════════════════ */}
      {step === "running" && (
        <div className="space-y-6 mb-10 animate-fade-up">

          {/* Live Timer Card */}
          <div className="card-static p-6 text-center border-2" style={{ background: `${getTypeColor(sessionType)}06`, borderColor: `${getTypeColor(sessionType)}30` }}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: getTypeColor(sessionType) }} />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Session Live</span>
            </div>
            <div className="text-6xl md:text-7xl font-black text-slate-900 mb-1 tabular-nums" style={{ fontFamily: "var(--font-heading)" }}>
              {formatElapsed(elapsed)}
            </div>
            <div className="text-sm font-bold text-slate-500 mb-4">{sessionTitle}</div>
            {selectedDrills.length > 0 && (
              <div className="text-xs text-slate-400">
                Drills: {selectedDrills.map(d => d.title).join(" → ")}
              </div>
            )}
          </div>

          {/* Attendance Summary */}
          <div className="card-static p-4">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Attendance Summary</div>
            <div className="flex justify-around text-center">
              <div>
                <div className="text-2xl font-black text-emerald-600">{presentCount}</div>
                <div className="text-[10px] font-bold text-slate-400">Present</div>
              </div>
              <div>
                <div className="text-2xl font-black text-amber-500">{lateCount}</div>
                <div className="text-[10px] font-bold text-slate-400">Late</div>
              </div>
              <div>
                <div className="text-2xl font-black text-red-400">{absentCount}</div>
                <div className="text-[10px] font-bold text-slate-400">Absent</div>
              </div>
              <div>
                <div className="text-2xl font-black text-slate-400">{students.length - markedCount}</div>
                <div className="text-[10px] font-bold text-slate-400">Unmarked</div>
              </div>
            </div>
          </div>

          {/* Who's Here */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {students.map(student => {
              const record = attendance[student.id];
              const status = record?.status;
              const colors = getStatusColor(status);
              return (
                <div key={student.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold
                  ${status === "Present" ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                    status === "Late" ? "bg-amber-50 border-amber-200 text-amber-700" :
                    status === "Absent" ? "bg-red-50 border-red-200 text-red-500" :
                    "bg-slate-50 border-slate-200 text-slate-400"}`}>
                  <span>{status === "Present" ? "✓" : status === "Late" ? "⏰" : status === "Absent" ? "✕" : "—"}</span>
                  <span>{student.name.split(" ")[0]}</span>
                </div>
              );
            })}
          </div>

          {/* End Session */}
          <div className="flex flex-col items-center gap-3 pt-4">
            <button onClick={endSession} disabled={saving}
              className="px-8 py-4 rounded-full bg-slate-900 text-white font-bold text-sm flex items-center gap-2 shadow-xl hover:bg-black transition-all disabled:opacity-50 active:scale-95">
              {saving ? "Saving..." : "End Session & Save"}
              {!saving && <IconCheck size={16} />}
            </button>
            <div className="text-[10px] text-slate-400">This will save the session, attendance, and offer to evaluate players.</div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          SESSION HISTORY (last 3)
          ════════════════════════════════════════ */}
      {step === "idle" && (
        <div>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <IconTimer size={14} /> Recent Sessions
          </h2>
          {loading ? (
            <div className="card-static p-8 text-center text-sm text-slate-400">Loading...</div>
          ) : pastSessions.length === 0 ? (
            <div className="card-static p-8 text-center">
              <p className="text-sm text-slate-400">No sessions yet. Start your first one above!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pastSessions.map((session, i) => {
                const tc = getTypeColor(session.session_type || "training");
                return (
                  <button key={session.id} onClick={() => openSessionDetail(session)}
                    className="w-full card-static p-4 flex items-center justify-between gap-3 hover:shadow-md transition-all text-left border-l-4 group opacity-0 animate-fade-up"
                    style={{ animationDelay: `${0.1 + i * 0.04}s`, animationFillMode: "forwards", borderLeftColor: tc }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${tc}15`, color: tc }}>
                        <IconClipboard size={18} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">{session.title}</div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                          <span>{session.session_date}</span>
                          <span>•</span>
                          <span>{session.duration_mins}m</span>
                          {session.presentCount !== undefined && session.totalCount !== undefined && (
                            <span className="text-emerald-600">{session.presentCount}/{session.totalCount} present</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-600 transition-colors">View Details →</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════
          SESSION DETAIL MODAL
          ════════════════════════════════════════ */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 p-4 animate-fade-up" onClick={() => setSelectedSession(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-bold text-slate-900 text-lg" style={{ fontFamily: "var(--font-heading)" }}>{selectedSession.title}</div>
                <div className="text-xs text-slate-400 font-medium mt-0.5">{selectedSession.session_date} • {selectedSession.duration_mins} mins</div>
              </div>
              <button onClick={() => setSelectedSession(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
            </div>

            {/* Notes */}
            {selectedSession.notes && (
              <div className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3 border border-slate-100">{selectedSession.notes}</div>
            )}

            {/* Attendance Breakdown */}
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Attendance ({selectedSession.attendees?.length || 0} marked)</div>
              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {selectedSession.attendees && selectedSession.attendees.length > 0 ? selectedSession.attendees.map((a, i) => (
                  <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-bold
                    ${a.status === "Present" ? "bg-emerald-50 text-emerald-700" : a.status === "Late" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-500"}`}>
                    <span>{a.name}</span>
                    <span className="text-xs">{a.status} {a.time ? `• ${a.time}` : ""}</span>
                  </div>
                )) : (<div className="text-xs text-slate-400 text-center py-3">No attendance records found for this session.</div>)}
              </div>
            </div>

            <button onClick={() => router.push(`/coach/evaluate?session_id=${selectedSession.id}`)}
              className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center gap-2">
              <IconTarget size={15} /> Evaluate Players
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 font-bold text-sm">
          <IconCheck size={14} color="white" />
          {toast}
        </div>
      )}
      {/* ════════════════════════════════════════
          DRILL MODAL
          ════════════════════════════════════════ */}
      {showDrillModal && editingDrill && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-up">
            
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2" style={{ fontFamily: "var(--font-heading)" }}>
                {isEditingMode ? (editingDrill.id.startsWith("new_") ? "Create New Card" : "Edit Card") : "Card Details"}
              </h3>
              <button 
                onClick={() => setShowDrillModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors"
              >
                <IconX size={16} />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-5 md:p-6 overflow-y-auto custom-scrollbar flex-1">
              {isEditingMode ? (
                // EDIT MODE
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Drill Title</label>
                    <input 
                      type="text" 
                      className="input w-full" 
                      placeholder="e.g. Pep's Rondo" 
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
                        {["Passing", "Shooting", "Fitness", "Tactical", "Goalkeeping", "Match Prep"].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Difficulty</label>
                      <select 
                        className="input w-full" 
                        value={editingDrill.difficulty} 
                        onChange={e => setEditingDrill({...editingDrill, difficulty: e.target.value})}
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
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
                    {isDrillSelected(editingDrill.id) ? "Remove from Session" : "Add to Session"}
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

export default function AttendancePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-400">Loading attendance...</div>}>
      <AttendanceContent />
    </Suspense>
  );
}
