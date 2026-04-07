/* ──────────────────────────────────────────────
   PLAYER SCHEDULE PAGE
   Weekly/monthly calendar view of upcoming
   sessions with time, type, and countdown.
   ────────────────────────────────────────────── */
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import {
  IconCalendar, IconClipboard, IconActivity, IconTimer
} from "@/components/Icons";

interface SessionItem {
  id: string;
  title: string;
  session_date: string;
  start_time: string;
  duration_mins: number;
  session_type: string;
  notes: string | null;
  coach_name: string;
}

const SESSION_COLORS: Record<string, { color: string; label: string; emoji: string }> = {
  training: { color: "#10B981", label: "Training", emoji: "⚡" },
  tactical: { color: "#8B5CF6", label: "Tactical", emoji: "🧠" },
  match_day: { color: "#EF4444", label: "Match Day", emoji: "🏟️" },
  fitness: { color: "#F59E0B", label: "Fitness", emoji: "💪" },
  recovery: { color: "#06B6D4", label: "Recovery", emoji: "🧊" },
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function PlayerSchedulePage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "week">("list");

  useEffect(() => {
    if (!user) return;
    loadSchedule();
  }, [user]);

  async function loadSchedule() {
    if (!user) return;
    setLoading(true);

    // Get player's coach
    const { data: profile } = await supabase
      .from("profiles")
      .select("coach_id")
      .eq("id", user.id)
      .single();

    if (!profile?.coach_id) {
      setLoading(false);
      return;
    }

    // Get sessions from coach
    const { data: sessionsData } = await supabase
      .from("sessions")
      .select("id, title, session_date, start_time, duration_mins, session_type, notes")
      .eq("coach_id", profile.coach_id)
      .order("session_date", { ascending: true });

    if (sessionsData) {
      // Get coach name
      const { data: coach } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", profile.coach_id)
        .single();

      setSessions(sessionsData.map(s => ({
        ...s,
        coach_name: coach?.full_name || "Coach",
      })));
    }

    setLoading(false);
  }

  const now = new Date();
  const today = now.toISOString().split("T")[0];

  // Separate upcoming and past
  const upcomingSessions = sessions.filter(s => s.session_date >= today);
  const pastSessions = sessions.filter(s => s.session_date < today).reverse();

  // Get next session for hero card
  const nextSession = upcomingSessions[0];

  function getDaysUntil(date: string): number {
    const diff = new Date(date).getTime() - new Date(today).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  function formatTime(time: string | null): string {
    if (!time) return "--:--";
    return time.slice(0, 5);
  }

  // Week view data
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-20 text-center">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
        <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading schedule...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-24 px-4 xl:px-0 space-y-8">
      {/* Header */}
      <div className="opacity-0 animate-fade-up flex items-start justify-between" style={{ animationFillMode: "forwards" }}>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}>
            Training Schedule
          </h1>
          <p className="text-slate-500 font-medium text-sm">Your upcoming sessions at a glance.</p>
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          <button onClick={() => setViewMode("list")} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === "list" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>
            List
          </button>
          <button onClick={() => setViewMode("week")} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === "week" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>
            Week
          </button>
        </div>
      </div>

      {/* Next Session Hero */}
      {nextSession && (
        <div className="card-static p-6 relative overflow-hidden border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 opacity-0 animate-fade-up" style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}>
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-emerald-200/40 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-md"
              style={{ background: SESSION_COLORS[nextSession.session_type]?.color || "#10B981", color: "white" }}>
              {SESSION_COLORS[nextSession.session_type]?.emoji || "⚡"}
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Next Session</div>
              <div className="text-lg font-bold text-slate-900" style={{ fontFamily: "var(--font-heading)" }}>
                {nextSession.title}
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs font-bold text-slate-500">
                <span>📅 {new Date(nextSession.session_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                <span>⏰ {formatTime(nextSession.start_time)}</span>
                <span>⏱️ {nextSession.duration_mins} min</span>
              </div>
            </div>
            <div className="flex-shrink-0 text-center">
              {getDaysUntil(nextSession.session_date) === 0 ? (
                <div className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-black text-sm shadow-md">TODAY</div>
              ) : (
                <>
                  <div className="text-3xl font-black text-emerald-600" style={{ fontFamily: "var(--font-heading)" }}>
                    {getDaysUntil(nextSession.session_date)}
                  </div>
                  <div className="text-[10px] font-bold text-emerald-500 uppercase">day{getDaysUntil(nextSession.session_date) !== 1 ? "s" : ""} left</div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Week View */}
      {viewMode === "week" && (
        <div className="grid grid-cols-7 gap-2 opacity-0 animate-fade-up" style={{ animationDelay: "0.15s", animationFillMode: "forwards" }}>
          {weekDays.map((day, i) => {
            const daySessions = sessions.filter(s => s.session_date === day);
            const isToday = day === today;
            return (
              <div key={day} className={`card-static p-3 min-h-[140px] ${isToday ? "border-2 border-emerald-300 bg-emerald-50/50 shadow-md" : ""}`}>
                <div className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${isToday ? "text-emerald-600" : "text-slate-400"}`}>
                  {DAYS[i]}
                </div>
                <div className={`text-lg font-bold mb-2 ${isToday ? "text-emerald-700" : "text-slate-600"}`}>
                  {new Date(day).getDate()}
                </div>
                <div className="space-y-1.5">
                  {daySessions.map(s => {
                    const typeConfig = SESSION_COLORS[s.session_type] || SESSION_COLORS.training;
                    return (
                      <div key={s.id} className="p-2 rounded-lg border" style={{ background: `${typeConfig.color}08`, borderColor: `${typeConfig.color}25` }}>
                        <div className="text-[10px] font-bold flex items-center gap-1 mb-0.5" style={{ color: typeConfig.color }}>
                          {typeConfig.emoji} {formatTime(s.start_time)}
                        </div>
                        <div className="text-[9px] font-bold text-slate-600 truncate leading-tight">
                          {s.title.length > 18 ? s.title.slice(0, 18) + '…' : s.title}
                        </div>
                        <div className="text-[8px] font-bold mt-0.5 uppercase" style={{ color: typeConfig.color, opacity: 0.7 }}>
                          {typeConfig.label} · {s.duration_mins}m
                        </div>
                      </div>
                    );
                  })}
                  {daySessions.length === 0 && (
                    <div className="text-[9px] text-slate-300 text-center py-3">—</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="space-y-6">
          {/* Upcoming */}
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <IconCalendar size={14} /> Upcoming ({upcomingSessions.length})
            </h2>
            {upcomingSessions.length === 0 ? (
              <div className="card-static p-8 text-center">
                <p className="text-sm text-slate-400">No upcoming sessions scheduled.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingSessions.map((session, i) => {
                  const typeConfig = SESSION_COLORS[session.session_type] || SESSION_COLORS.training;
                  return (
                    <div key={session.id} className="card-static p-4 border-l-4 flex items-center gap-4 hover:shadow-md transition-all" style={{ borderLeftColor: typeConfig.color }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: `${typeConfig.color}10` }}>
                        {typeConfig.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-slate-900 truncate">{session.title}</div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                          <span>{new Date(session.session_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                          <span>•</span>
                          <span>{formatTime(session.start_time)}</span>
                          <span>•</span>
                          <span>{session.duration_mins} min</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-lg" style={{ background: `${typeConfig.color}10`, color: typeConfig.color }}>
                        {typeConfig.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Past Sessions */}
          {pastSessions.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <IconTimer size={14} /> Past Sessions ({pastSessions.length})
              </h2>
              <div className="space-y-2">
                {pastSessions.slice(0, 10).map(session => {
                  const typeConfig = SESSION_COLORS[session.session_type] || SESSION_COLORS.training;
                  return (
                    <div key={session.id} className="card-static p-3 border-l-4 flex items-center gap-3 opacity-60" style={{ borderLeftColor: typeConfig.color }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0" style={{ background: `${typeConfig.color}10` }}>
                        {typeConfig.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs text-slate-700 truncate">{session.title}</div>
                        <div className="text-[10px] text-slate-400">{session.session_date} • {session.duration_mins} min</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
