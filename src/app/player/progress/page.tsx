/* ──────────────────────────────────────────────
   PLAYER PROGRESS PAGE
   Displays session history, evaluation trends,
   completed drills, and coach feedback timeline.
   ────────────────────────────────────────────── */
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import RadarChart from "@/components/RadarChart";
import { SKILL_METRICS } from "@/lib/constants";
import {
  IconTrendingUp, IconClipboard, IconTarget, IconStar,
  IconCheck, IconActivity, IconCalendar, IconChevronRight
} from "@/components/Icons";

interface Evaluation {
  id: string;
  session_id: string;
  coach_id: string;
  scores: Record<string, number>;
  strengths: string[];
  focus_areas: string[];
  summary: string;
  badge_awarded: string | null;
  created_at: string;
  session_title?: string;
  session_date?: string;
  coach_name?: string;
}

interface AttendanceRecord {
  session_id: string;
  status: string;
  marked_at: string;
  session_title?: string;
  session_date?: string;
}

interface GoalRecord {
  id: string;
  title: string;
  category: string;
  status: string;
  description: string | null;
  due_date: string | null;
  created_at: string;
}

export default function PlayerProgressPage() {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [goals, setGoals] = useState<GoalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEval, setSelectedEval] = useState<Evaluation | null>(null);
  const [activeTab, setActiveTab] = useState<"timeline" | "skills" | "attendance" | "goals">("timeline");

  useEffect(() => {
    if (!user) return;
    loadProgressData();
  }, [user]);

  async function loadProgressData() {
    if (!user) return;
    setLoading(true);

    // 1. Fetch all evaluations with session details
    const { data: evalData } = await supabase
      .from("evaluations")
      .select("*")
      .eq("player_id", user.id)
      .order("created_at", { ascending: false });

    if (evalData && evalData.length > 0) {
      // Enrich with session and coach info
      const sessionIds = [...new Set(evalData.map(e => e.session_id))];
      const coachIds = [...new Set(evalData.map(e => e.coach_id))];

      const { data: sessions } = await supabase
        .from("sessions")
        .select("id, title, session_date")
        .in("id", sessionIds);

      const { data: coaches } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", coachIds);

      const sessionMap = new Map((sessions || []).map(s => [s.id, s]));
      const coachMap = new Map((coaches || []).map(c => [c.id, c]));

      const enriched: Evaluation[] = evalData.map(e => ({
        ...e,
        session_title: sessionMap.get(e.session_id)?.title || "Untitled Session",
        session_date: sessionMap.get(e.session_id)?.session_date || "",
        coach_name: coachMap.get(e.coach_id)?.full_name || "Coach",
      }));
      setEvaluations(enriched);
    }

    // 2. Fetch attendance
    const { data: attData } = await supabase
      .from("attendance_logs")
      .select("session_id, status, marked_at")
      .eq("player_id", user.id)
      .order("marked_at", { ascending: false })
      .limit(30);

    if (attData && attData.length > 0) {
      const sessionIds = [...new Set(attData.map(a => a.session_id))];
      const { data: sessions } = await supabase
        .from("sessions")
        .select("id, title, session_date")
        .in("id", sessionIds);

      const sessionMap = new Map((sessions || []).map(s => [s.id, s]));
      setAttendance(attData.map(a => ({
        ...a,
        session_title: sessionMap.get(a.session_id)?.title || "Session",
        session_date: sessionMap.get(a.session_id)?.session_date || "",
      })));
    }

    // 3. Fetch goals
    const { data: goalsData } = await supabase
      .from("goals")
      .select("*")
      .eq("player_id", user.id)
      .order("created_at", { ascending: false });

    if (goalsData) setGoals(goalsData);

    setLoading(false);
  }

  // Compute skill trend data: average score per metric across all evaluations
  const skillTrends = SKILL_METRICS.map(m => {
    const values = evaluations
      .filter(e => e.scores && e.scores[m.key] !== undefined)
      .map(e => e.scores[m.key]);
    const avg = values.length > 0 ? Math.round(values.reduce((s, v) => s + v, 0) / values.length) : 0;
    const latest = values.length > 0 ? values[0] : 0;
    const oldest = values.length > 1 ? values[values.length - 1] : latest;
    const change = latest - oldest;
    return { key: m.key, label: m.short, fullLabel: m.label, avg, latest, change, count: values.length };
  });

  const latestRadarData = skillTrends.map(s => ({ label: s.label, value: s.latest > 0 ? s.latest / 20 : 0 }));
  const overallAvg = skillTrends.reduce((s, t) => s + t.latest, 0) / Math.max(skillTrends.filter(s => s.latest > 0).length, 1);

  const attendanceRate = attendance.length > 0
    ? Math.round((attendance.filter(a => a.status === "Present" || a.status === "Late").length / attendance.length) * 100)
    : 0;

  const achievedGoals = goals.filter(g => g.status === "achieved").length;

  const tabs = [
    { key: "timeline" as const, label: "Timeline", icon: <IconCalendar size={14} /> },
    { key: "skills" as const, label: "Skill Trends", icon: <IconTrendingUp size={14} /> },
    { key: "attendance" as const, label: "Attendance", icon: <IconActivity size={14} /> },
    { key: "goals" as const, label: "Goals", icon: <IconTarget size={14} /> },
  ];

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-20 text-center">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
        <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading your progress...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-20 px-4 xl:px-0 space-y-8">
      {/* Header */}
      <div className="opacity-0 animate-fade-up" style={{ animationFillMode: "forwards" }}>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}>
          My Progress
        </h1>
        <p className="text-slate-500 font-medium text-sm">Track your development journey — evaluations, attendance, and goals.</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 opacity-0 animate-fade-up" style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}>
        <div className="card-static p-4 text-center">
          <div className="text-3xl font-black text-slate-900" style={{ fontFamily: "var(--font-heading)" }}>{evaluations.length}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Evaluations</div>
        </div>
        <div className="card-static p-4 text-center">
          <div className="text-3xl font-black text-emerald-600" style={{ fontFamily: "var(--font-heading)" }}>{Math.round(overallAvg)}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Overall Score</div>
        </div>
        <div className="card-static p-4 text-center">
          <div className="text-3xl font-black text-blue-600" style={{ fontFamily: "var(--font-heading)" }}>{attendanceRate}%</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Attendance Rate</div>
        </div>
        <div className="card-static p-4 text-center">
          <div className="text-3xl font-black text-amber-500" style={{ fontFamily: "var(--font-heading)" }}>{achievedGoals}/{goals.length}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Goals Achieved</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 opacity-0 animate-fade-up" style={{ animationDelay: "0.15s", animationFillMode: "forwards" }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
              activeTab === tab.key
                ? "bg-slate-900 text-white border-slate-900 shadow-md"
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="opacity-0 animate-fade-up" style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}>

        {/* TIMELINE TAB */}
        {activeTab === "timeline" && (
          <div className="space-y-4">
            {evaluations.length === 0 ? (
              <div className="card-static p-12 text-center">
                <IconClipboard size={40} color="#CBD5E1" />
                <h3 className="text-lg font-bold text-slate-400 mt-4 mb-2">No evaluations yet</h3>
                <p className="text-sm text-slate-400">Your coach will evaluate you after training sessions. Check back soon!</p>
              </div>
            ) : evaluations.map((ev, i) => (
              <button
                key={ev.id}
                onClick={() => setSelectedEval(selectedEval?.id === ev.id ? null : ev)}
                className="w-full card-static p-5 text-left hover:shadow-md transition-all border-l-4 group"
                style={{ borderLeftColor: "#10B981" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
                      {ev.session_title}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      <span>{ev.session_date ? new Date(ev.session_date).toLocaleDateString() : new Date(ev.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>by {ev.coach_name}</span>
                    </div>
                    {ev.summary && (
                      <p className={`text-xs text-slate-500 mt-2 leading-relaxed ${selectedEval?.id !== ev.id ? "line-clamp-2" : ""}`}>
                        {ev.summary}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {ev.badge_awarded && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-bold border border-amber-100">
                        <IconStar size={10} /> {ev.badge_awarded}
                      </span>
                    )}
                    <div className="score-ring text-sm" style={{ width: 40, height: 40, fontSize: "0.85rem" }}>
                      {Object.values(ev.scores || {}).length > 0
                        ? Math.round(Object.values(ev.scores).reduce((s, v) => s + v, 0) / Object.values(ev.scores).length)
                        : "—"}
                    </div>
                  </div>
                </div>

                {/* Expanded Detail */}
                {selectedEval?.id === ev.id && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 animate-fade-up">
                    {/* Scores */}
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {SKILL_METRICS.map(m => (
                        <div key={m.key} className="text-center p-2 bg-slate-50 rounded-xl">
                          <div className="text-lg font-black text-slate-900">{ev.scores[m.key] || 0}</div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase">{m.short}</div>
                        </div>
                      ))}
                    </div>

                    {/* Strengths & Focus */}
                    {ev.strengths.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Strengths</div>
                        <div className="flex flex-wrap gap-1.5">
                          {ev.strengths.map(s => (
                            <span key={s} className="trait-chip strength text-[10px]">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {ev.focus_areas.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Focus Areas</div>
                        <div className="flex flex-wrap gap-1.5">
                          {ev.focus_areas.map(f => (
                            <span key={f} className="trait-chip focus-area text-[10px]">{f}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* SKILLS TAB */}
        {activeTab === "skills" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <div className="card-static p-6 relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-emerald-50 rounded-full blur-3xl opacity-40 pointer-events-none" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10">
                <IconTarget size={16} color="#059669" /> Current Skill Radar
              </h3>
              <div className="relative z-10 flex justify-center">
                <RadarChart data={latestRadarData} size={280} />
              </div>
            </div>

            {/* Skill Breakdown */}
            <div className="card-static p-6">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <IconTrendingUp size={16} color="#3B82F6" /> Skill Breakdown
              </h3>
              <div className="space-y-4">
                {skillTrends.map(skill => (
                  <div key={skill.key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700">{skill.fullLabel}</span>
                        <span className="text-[10px] font-bold text-slate-400">({skill.label})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900">{skill.latest}</span>
                        {skill.change !== 0 && skill.count > 1 && (
                          <span className={`text-[10px] font-bold ${skill.change > 0 ? "text-emerald-600" : "text-red-500"}`}>
                            {skill.change > 0 ? "+" : ""}{skill.change}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${skill.latest}%`,
                          background: skill.latest >= 80 ? "#10B981" : skill.latest >= 60 ? "#3B82F6" : "#F59E0B"
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ATTENDANCE TAB */}
        {activeTab === "attendance" && (
          <div className="space-y-4">
            {/* Attendance Rate Card */}
            <div className="card-static p-6 flex items-center gap-6">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black text-white shadow-lg"
                  style={{ background: attendanceRate >= 80 ? "#10B981" : attendanceRate >= 60 ? "#F59E0B" : "#EF4444" }}>
                  {attendanceRate}%
                </div>
              </div>
              <div>
                <div className="text-lg font-bold text-slate-900">Attendance Rate</div>
                <div className="text-xs text-slate-500 mt-1">
                  {attendance.filter(a => a.status === "Present").length} present, {attendance.filter(a => a.status === "Late").length} late, {attendance.filter(a => a.status === "Absent").length} absent out of {attendance.length} sessions
                </div>
              </div>
            </div>

            {/* Dot Grid */}
            <div className="card-static p-5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Session History</div>
              <div className="flex flex-wrap gap-1.5">
                {attendance.map((a, i) => (
                  <div
                    key={i}
                    title={`${a.session_title} — ${a.session_date} (${a.status})`}
                    className="w-4 h-4 rounded-sm cursor-help"
                    style={{
                      background: a.status === "Present" ? "#10B981" : a.status === "Late" ? "#F59E0B" : "#EF4444",
                      opacity: 0.8,
                    }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-4 mt-3 text-[10px] font-bold text-slate-400">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-500" /> Present</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-500" /> Late</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500" /> Absent</span>
              </div>
            </div>

            {/* Recent Attendance List */}
            <div className="space-y-2">
              {attendance.slice(0, 10).map((a, i) => (
                <div key={i} className="card-static p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ${
                      a.status === "Present" ? "bg-emerald-500" : a.status === "Late" ? "bg-amber-500" : "bg-red-400"
                    }`}>
                      {a.status === "Present" ? "✓" : a.status === "Late" ? "⏰" : "✕"}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">{a.session_title}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">{a.session_date}</div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${
                    a.status === "Present" ? "bg-emerald-50 text-emerald-600" :
                    a.status === "Late" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-500"
                  }`}>
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GOALS TAB */}
        {activeTab === "goals" && (
          <div className="space-y-4">
            {goals.length === 0 ? (
              <div className="card-static p-12 text-center">
                <IconTarget size={40} color="#CBD5E1" />
                <h3 className="text-lg font-bold text-slate-400 mt-4 mb-2">No goals set yet</h3>
                <p className="text-sm text-slate-400">Your coach will assign goals based on your evaluations.</p>
              </div>
            ) : (
              <>
                {/* Progress Bar */}
                <div className="card-static p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-600">Goal Completion</span>
                    <span className="text-sm font-black text-emerald-600">{achievedGoals}/{goals.length}</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${goals.length > 0 ? (achievedGoals / goals.length) * 100 : 0}%` }} />
                  </div>
                </div>

                {/* Goal List */}
                {goals.map(g => {
                  const isDone = g.status === "achieved";
                  return (
                    <div key={g.id} className={`card-static p-4 flex items-start gap-4 ${isDone ? "opacity-70" : ""}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isDone ? "bg-emerald-500 text-white" :
                        g.status === "in_progress" ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"
                      }`}>
                        {isDone ? <IconCheck size={16} /> : <IconTarget size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-bold text-sm ${isDone ? "text-slate-400 line-through" : "text-slate-900"}`}>
                          {g.title}
                        </div>
                        {g.description && <p className="text-xs text-slate-500 mt-1">{g.description}</p>}
                        <div className="flex items-center gap-2 mt-2 text-[10px] font-bold text-slate-400 uppercase">
                          {g.category && <span className="px-2 py-0.5 bg-slate-100 rounded">{g.category}</span>}
                          {g.due_date && <span>Due: {new Date(g.due_date).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg flex-shrink-0 ${
                        isDone ? "bg-emerald-50 text-emerald-600" :
                        g.status === "in_progress" ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400"
                      }`}>
                        {g.status.replace("_", " ")}
                      </span>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
