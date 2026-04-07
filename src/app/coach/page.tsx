/* ──────────────────────────────────────────────
   COACH DASHBOARD — Clean overview with fee alerts,
   coach rating display, and enriched session details.
   ────────────────────────────────────────────── */
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import StatCard from "@/components/StatCard";
import {
  IconUsers, IconClipboard, IconWallet, IconTarget,
  IconPlus, IconPlay, IconCheck, IconChevronRight, IconTrendingUp,
  IconStar, IconActivity, IconMessageSquare
} from "@/components/Icons";

interface SessionDetail {
  id: string;
  title: string;
  session_date: string;
  start_time: string;
  duration_mins: number;
  session_type: string;
  notes: string | null;
  drills: { title: string; category: string; duration_mins: number }[];
  attendees: { name: string; status: string; position: string }[];
  presentCount: number;
  totalCount: number;
}

const SESSION_COLORS: Record<string, string> = {
  training: "#10B981", tactical: "#8B5CF6",
  match_day: "#EF4444", fitness: "#F59E0B", recovery: "#06B6D4"
};

export default function CoachDashboard() {
  const { user, profile } = useAuth();
  const [studentCount, setStudentCount] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [feesPaid, setFeesPaid] = useState(0);
  const [feesPending, setFeesPending] = useState(0);
  const [pendingPlayerNames, setPendingPlayerNames] = useState<string[]>([]);
  const [recentSessions, setRecentSessions] = useState<SessionDetail[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionDetail | null>(null);
  const [coachRating, setCoachRating] = useState<{ avg: number; count: number } | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  async function loadData() {
    if (!user) return;

    // 1. Student count
    const { count: sc } = await supabase
      .from("profiles")
      .select("id", { count: "exact" })
      .eq("role", "player")
      .eq("coach_id", user.id);
    setStudentCount(sc || 0);

    // 2. Session count (this month)
    const monthStart = new Date();
    monthStart.setDate(1);
    const { count: sessCount } = await supabase
      .from("sessions")
      .select("id", { count: "exact" })
      .eq("coach_id", user.id)
      .gte("session_date", monthStart.toISOString().split("T")[0]);
    setSessionCount(sessCount || 0);

    // 3. Fees summary (current month) + pending player names
    const currentMonth = new Date().toISOString().slice(0, 7);
    const { data: feeData } = await supabase
      .from("fees")
      .select("status, player_id")
      .eq("coach_id", user.id)
      .eq("month", currentMonth);

    if (feeData) {
      setFeesPaid(feeData.filter(f => f.status === "Paid").length);
      const pendingIds = feeData.filter(f => f.status !== "Paid").map(f => f.player_id);
      setFeesPending(pendingIds.length);

      if (pendingIds.length > 0) {
        const { data: pendingProfiles } = await supabase
          .from("profiles")
          .select("full_name")
          .in("id", pendingIds);
        if (pendingProfiles) {
          setPendingPlayerNames(pendingProfiles.map(p => p.full_name || "Unknown"));
        }
      }
    }

    // 4. Recent sessions with enriched details
    const { data: rs } = await supabase
      .from("sessions")
      .select("id, title, session_date, start_time, duration_mins, session_type, notes")
      .eq("coach_id", user.id)
      .order("session_date", { ascending: false })
      .limit(5);

    if (rs && rs.length > 0) {
      // Fetch attendance and drill info for these sessions
      const sessionIds = rs.map(s => s.id);

      const { data: attLogs } = await supabase
        .from("attendance_logs")
        .select("session_id, player_id, status")
        .in("session_id", sessionIds);

      const { data: sessionDrills } = await supabase
        .from("session_drills")
        .select("session_id, drill_id, order_index")
        .in("session_id", sessionIds)
        .order("order_index");

      // Get drill details
      const drillIds = [...new Set((sessionDrills || []).map(sd => sd.drill_id))];
      let drillMap = new Map<string, { title: string; category: string; duration_mins: number }>();
      if (drillIds.length > 0) {
        const { data: drills } = await supabase
          .from("drills")
          .select("id, title, category, duration_mins")
          .in("id", drillIds);
        if (drills) {
          drillMap = new Map(drills.map(d => [d.id, { title: d.title, category: d.category, duration_mins: d.duration_mins }]));
        }
      }

      // Get player names for attendance
      const playerIds = [...new Set((attLogs || []).map(a => a.player_id))];
      let playerMap = new Map<string, { name: string; position: string }>();
      if (playerIds.length > 0) {
        const { data: players } = await supabase
          .from("profiles")
          .select("id, full_name, position")
          .in("id", playerIds);
        if (players) {
          playerMap = new Map(players.map(p => [p.id, { name: p.full_name || "Unknown", position: p.position || "MID" }]));
        }
      }

      const enrichedSessions: SessionDetail[] = rs.map(s => {
        const sAttendance = (attLogs || []).filter(a => a.session_id === s.id);
        const sDrills = (sessionDrills || []).filter(sd => sd.session_id === s.id);

        return {
          ...s,
          drills: sDrills.map(sd => drillMap.get(sd.drill_id) || { title: "Unknown Drill", category: "Unknown", duration_mins: 0 }),
          attendees: sAttendance.map(a => ({
            name: playerMap.get(a.player_id)?.name || "Unknown",
            status: a.status,
            position: playerMap.get(a.player_id)?.position || "MID",
          })),
          presentCount: sAttendance.filter(a => a.status === "Present" || a.status === "Late").length,
          totalCount: sAttendance.length,
        };
      });
      setRecentSessions(enrichedSessions);
    }

    // 5. Coach rating
    const { data: ratingsData } = await supabase
      .from("coach_ratings")
      .select("rating")
      .eq("coach_id", user.id);

    if (ratingsData && ratingsData.length > 0) {
      const avg = ratingsData.reduce((s, r) => s + r.rating, 0) / ratingsData.length;
      setCoachRating({ avg: Math.round(avg * 10) / 10, count: ratingsData.length });
    }

    // 6. Unread messages count
    const { count: msgCount } = await supabase
      .from("messages")
      .select("id", { count: "exact" })
      .eq("receiver_id", user.id)
      .eq("read_status", false);
    setUnreadMessages(msgCount || 0);

    setLoading(false);
  }

  return (
    <div className="max-w-5xl space-y-10 pb-20 opacity-0 animate-fade-up" style={{ animationFillMode: "forwards" }}>

      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-slate-900" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}>
            Welcome back, {profile?.full_name?.split(" ")[0] || "Coach"} 👋
          </h1>
          <p className="text-slate-500 font-medium">Here's your squad overview for today.</p>
        </div>
        {/* Coach Rating Badge */}
        {coachRating && (
          <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border-2 border-amber-100 rounded-2xl self-start">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <IconStar key={star} size={16} color={star <= Math.round(coachRating.avg) ? "#F59E0B" : "#CBD5E1"} />
              ))}
            </div>
            <div>
              <div className="text-sm font-black text-amber-800">{coachRating.avg}</div>
              <div className="text-[10px] font-bold text-amber-600">{coachRating.count} review{coachRating.count !== 1 ? "s" : ""}</div>
            </div>
          </div>
        )}
      </div>

      {/* ── FEE COLLECTION ALERT ── */}
      {feesPending > 0 && (
        <Link
          href="/coach/fees"
          className="flex items-center gap-4 px-5 py-4 rounded-2xl border-2 no-underline animate-fade-up hover:shadow-md transition-all group"
          style={{ background: "rgba(249,115,22,0.06)", borderColor: "rgba(249,115,22,0.25)" }}
        >
          <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
            <IconWallet size={24} color="#EA580C" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-orange-700 text-sm flex items-center gap-2">
              ⚠️ {feesPending} student{feesPending !== 1 ? "s" : ""} with pending fees
            </div>
            <div className="text-orange-600 text-xs font-medium mt-0.5">
              {pendingPlayerNames.length > 0
                ? `${pendingPlayerNames.slice(0, 3).join(", ")}${pendingPlayerNames.length > 3 ? ` +${pendingPlayerNames.length - 3} more` : ""}`
                : "Collect outstanding fees for this month."}
            </div>
          </div>
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0 bg-orange-500 text-white group-hover:bg-orange-600 transition-colors shadow-sm">
            Collect Now <IconChevronRight size={12} />
          </div>
        </Link>
      )}

      {/* Unread Messages Alert */}
      {unreadMessages > 0 && (
        <Link
          href="/coach/messages"
          className="flex items-center gap-4 px-5 py-3 rounded-2xl border-2 no-underline animate-fade-up hover:shadow-md transition-all group"
          style={{ background: "rgba(59,130,246,0.05)", borderColor: "rgba(59,130,246,0.2)" }}
        >
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <IconMessageSquare size={20} color="#3B82F6" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-blue-700 text-sm">{unreadMessages} unread message{unreadMessages !== 1 ? "s" : ""}</div>
          </div>
          <span className="text-[10px] font-bold text-blue-500 group-hover:text-blue-700 transition-colors">View →</span>
        </Link>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/coach/attendance"
          className="no-underline flex items-center gap-4 px-5 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 group"
        >
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <IconPlay size={20} />
          </div>
          <div className="flex-1">
            <div className="font-bold text-sm">Start Session</div>
            <div className="text-[10px] text-emerald-100 font-medium">Take attendance now</div>
          </div>
          <IconChevronRight size={16} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          href="/coach/students"
          className="no-underline flex items-center gap-4 px-5 py-4 rounded-2xl bg-white border-2 border-slate-200 text-slate-700 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group"
        >
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <IconPlus size={20} color="#3B82F6" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-sm">Add Student</div>
            <div className="text-[10px] text-slate-400 font-medium">Grow your squad</div>
          </div>
          <IconChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          href="/coach/fees"
          className="no-underline flex items-center gap-4 px-5 py-4 rounded-2xl bg-white border-2 border-slate-200 text-slate-700 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group"
        >
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
            <IconWallet size={20} color="#F59E0B" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-sm">View Fees</div>
            <div className="text-[10px] text-slate-400 font-medium">Track payments</div>
          </div>
          <IconChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard value={studentCount.toString()} label="Total Students" icon={<IconUsers />} delay={0.1} />
        <StatCard value={sessionCount.toString()} label="Sessions This Month" icon={<IconClipboard />} accentColor="#3B82F6" delay={0.15} />
        <StatCard value={feesPaid.toString()} label="Fees Paid" icon={<IconCheck />} accentColor="#10B981" delay={0.2} />
        <StatCard value={feesPending.toString()} label="Fees Pending" icon={<IconWallet />} accentColor="#F59E0B" delay={0.25} />
      </div>

      {/* Zero-State Onboarding */}
      {!loading && studentCount === 0 && sessionCount === 0 && (
        <div className="card-static p-8 relative overflow-hidden border-2 border-dashed border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 animate-fade-up">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-100 rounded-full blur-3xl opacity-50 pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-xl font-bold text-slate-900 mb-2" style={{ fontFamily: "var(--font-heading)" }}>
              🎉 Welcome to KickXPro!
            </h2>
            <p className="text-sm text-slate-500 mb-6">Get your academy up and running in 3 simple steps:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link href="/coach/students" className="no-underline flex flex-col items-center gap-3 p-5 bg-white rounded-2xl border-2 border-blue-100 hover:border-blue-300 hover:shadow-md transition-all group">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">👤</div>
                <div className="font-bold text-sm text-slate-900">Step 1: Add Players</div>
                <div className="text-[10px] text-slate-400 font-medium text-center">Add your first students to your squad roster.</div>
              </Link>
              <Link href="/coach/attendance" className="no-underline flex flex-col items-center gap-3 p-5 bg-white rounded-2xl border-2 border-emerald-100 hover:border-emerald-300 hover:shadow-md transition-all group">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">⚡</div>
                <div className="font-bold text-sm text-slate-900">Step 2: Run a Session</div>
                <div className="text-[10px] text-slate-400 font-medium text-center">Schedule and start your first training session.</div>
              </Link>
              <Link href="/coach/evaluate" className="no-underline flex flex-col items-center gap-3 p-5 bg-white rounded-2xl border-2 border-purple-100 hover:border-purple-300 hover:shadow-md transition-all group">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">📊</div>
                <div className="font-bold text-sm text-slate-900">Step 3: Evaluate</div>
                <div className="text-[10px] text-slate-400 font-medium text-center">Rate player skills with FIFA-style metrics.</div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Recent Sessions — Enriched */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <IconTrendingUp size={14} /> Recent Sessions
          </h2>
          <Link href="/coach/attendance" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 no-underline transition-colors">
            View All →
          </Link>
        </div>

        {loading ? (
          <div className="card-static p-8 text-center text-sm text-slate-400">Loading...</div>
        ) : recentSessions.length === 0 ? (
          <div className="card-static p-8 text-center">
            <p className="text-sm text-slate-400 mb-3">No sessions yet. Start your first one!</p>
            <Link href="/coach/attendance" className="btn-primary inline-flex items-center gap-2 no-underline text-sm">
              <IconPlay size={14} /> Start Session
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recentSessions.map((session, i) => {
              const tc = SESSION_COLORS[session.session_type] || "#94A3B8";
              const isExpanded = selectedSession?.id === session.id;
              return (
                <div key={session.id}>
                  <button
                    onClick={() => setSelectedSession(isExpanded ? null : session)}
                    className="w-full card-static p-4 flex items-center justify-between gap-4 hover:shadow-md transition-all opacity-0 animate-fade-up border-l-4 group text-left"
                    style={{ animationDelay: `${0.3 + i * 0.05}s`, animationFillMode: "forwards", borderLeftColor: tc }}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${tc}15`, color: tc }}>
                        <IconClipboard size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-sm truncate">{session.title}</div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 flex-wrap">
                          <span>{session.session_date}</span>
                          <span>•</span>
                          <span>{session.start_time?.slice(0, 5) || "--"}</span>
                          <span>•</span>
                          <span>{session.duration_mins} mins</span>
                          {session.totalCount > 0 && (
                            <span className="text-emerald-600">{session.presentCount}/{session.totalCount} present</span>
                          )}
                          {session.drills.length > 0 && (
                            <span className="text-purple-500">{session.drills.length} drill{session.drills.length !== 1 ? "s" : ""}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 flex items-center gap-1 transition-colors px-2.5 py-1.5 rounded-lg">
                        {isExpanded ? "Hide ▲" : "Details ▼"}
                      </span>
                    </div>
                  </button>

                  {/* Expanded Session Detail */}
                  {isExpanded && (
                    <div className="card-static p-5 mt-1 ml-4 border-l-4 space-y-4 animate-fade-up" style={{ borderLeftColor: tc }}>
                      {/* Notes */}
                      {session.notes && (
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Session Notes</div>
                          <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">{session.notes}</p>
                        </div>
                      )}

                      {/* Drills */}
                      {session.drills.length > 0 && (
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Drills ({session.drills.length})</div>
                          <div className="flex flex-wrap gap-2">
                            {session.drills.map((drill, di) => (
                              <span key={di} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-[10px] font-bold border border-purple-100">
                                <span className="w-2 h-2 rounded-full" style={{ background: "#8B5CF6" }} />
                                {drill.title} ({drill.duration_mins}m)
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Attendees */}
                      {session.attendees.length > 0 && (
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                            Attendance ({session.presentCount} present, {session.totalCount - session.presentCount} absent)
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {session.attendees.map((att, ai) => (
                              <div key={ai} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold ${
                                att.status === "Present" ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                                att.status === "Late" ? "bg-amber-50 border-amber-200 text-amber-700" :
                                "bg-red-50 border-red-200 text-red-500"
                              }`}>
                                <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 flex-shrink-0">
                                  {att.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="truncate">{att.name}</div>
                                  <div className="text-[9px] text-slate-400">{att.position}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Link
                          href={`/coach/evaluate?session_id=${session.id}`}
                          className="no-underline flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-colors"
                        >
                          <IconTarget size={12} /> Evaluate Players
                        </Link>
                        <Link
                          href={`/coach/attendance?open=${session.id}`}
                          className="no-underline flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
                        >
                          Full Attendance View
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
