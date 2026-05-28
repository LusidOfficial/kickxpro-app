/* ──────────────────────────────────────────────
   PARENT DASHBOARD
   Read-only view of their child's performance,
   attendance, fees, and recent evaluations.
   ────────────────────────────────────────────── */
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import StatCard from "@/components/StatCard";
import RadarChart from "@/components/RadarChart";
import AISummaryFeedback from "@/components/AISummaryFeedback";
import { SKILL_METRICS } from "@/lib/constants";
import {
  IconUser, IconTarget, IconClipboard, IconActivity,
  IconCheck, IconWallet, IconTrendingUp, IconStar, IconPlusCircle, IconCalendar
} from "@/components/Icons";

export default function ParentDashboard() {
  const { user, profile } = useAuth();
  const [childProfile, setChildProfile] = useState<any>(null);
  const [coachProfile, setCoachProfile] = useState<any>(null);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [feeStatus, setFeeStatus] = useState<string | null>(null);
  const [attendanceRate, setAttendanceRate] = useState(0);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [liveSession, setLiveSession] = useState<{ title: string; startTime: string; elapsed: number } | null>(null);
  
  // Absence Modal State
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
  const [absenceReason, setAbsenceReason] = useState("");
  const [absenceSending, setAbsenceSending] = useState(false);
  const [absenceSuccess, setAbsenceSuccess] = useState(false);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !profile?.child_id) return;
    loadChildData();
  }, [user, profile]);

  async function loadChildData() {
    if (!profile?.child_id) return;
    const childId = profile.child_id;

    // 1. Child profile
    const { data: child } = await supabase.from("profiles").select("*").eq("id", childId).single();
    if (child) {
      setChildProfile(child);
      // Coach info
      if (child.coach_id) {
        const { data: coach } = await supabase.from("profiles").select("id, full_name, email").eq("id", child.coach_id).single();
        if (coach) setCoachProfile(coach);
      }
    }

    // 2. Evaluations
    const { data: evals } = await supabase
      .from("evaluations")
      .select("*")
      .eq("player_id", childId)
      .order("created_at", { ascending: false })
      .limit(5);
    if (evals) setEvaluations(evals);

    // 3. Goals
    const { data: goalsData } = await supabase
      .from("goals")
      .select("*")
      .eq("player_id", childId)
      .order("created_at", { ascending: false });
    if (goalsData) setGoals(goalsData);

    // 4. Attendance
    const { data: attLogs } = await supabase
      .from("attendance_logs")
      .select("status")
      .eq("player_id", childId);
    if (attLogs && attLogs.length > 0) {
      const present = attLogs.filter(a => a.status === "Present" || a.status === "Late").length;
      setAttendanceRate(Math.round((present / attLogs.length) * 100));
    }

    // 5. Fee status
    const currentMonth = new Date().toISOString().slice(0, 7);
    const { data: fee } = await supabase
      .from("fees")
      .select("status")
      .eq("player_id", childId)
      .eq("month", currentMonth)
      .single();
    if (fee) setFeeStatus(fee.status);

    // 6. Upcoming sessions with RSVP
    if (child.coach_id) {
      const todayStr = new Date().toISOString().split("T")[0];
      const { data: sessions } = await supabase
        .from("sessions")
        .select("id, title, session_date, start_time, duration_mins")
        .eq("coach_id", child.coach_id)
        .gte("session_date", todayStr)
        .order("session_date", { ascending: true })
        .limit(3);
        
      if (sessions && sessions.length > 0) {
        const { data: responses } = await supabase
          .from("session_responses")
          .select("session_id, response")
          .eq("player_id", childId);
          
        const responseMap = (responses || []).reduce((acc: any, r: any) => {
           acc[r.session_id] = r.response;
           return acc;
        }, {});
        
        setUpcomingSessions(sessions.map(s => ({ ...s, response: responseMap[s.id] || null })));
      }
    }

    setLoading(false);
  }

  async function handleRSVP(sessionId: string, response: "going" | "not_going") {
    if (!profile?.child_id) return;
    
    setUpcomingSessions(prev => prev.map(s => s.id === sessionId ? { ...s, response } : s));
    
    const { error } = await supabase.from("session_responses").upsert({
      session_id: sessionId,
      player_id: profile.child_id,
      response
    }, { onConflict: "session_id,player_id" });
    
    if (error) console.error("RSVP error:", error);
  }

  // Poll for Live Session
  useEffect(() => {
    if (!coachProfile?.id) return;
    
    async function checkLive() {
      const todayStr = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("sessions")
        .select("title, start_time, session_date")
        .eq("coach_id", coachProfile.id)
        .eq("session_date", todayStr)
        .eq("duration_mins", 0)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        const start = new Date(`${data.session_date}T${data.start_time}`);
        const diff = Math.max(0, Math.floor((Date.now() - start.getTime()) / 1000));
        setLiveSession({ title: data.title, startTime: data.start_time, elapsed: diff });
      } else {
        setLiveSession(null);
      }
    }

    checkLive();
    const interval = setInterval(checkLive, 10000);
    return () => clearInterval(interval);
  }, [coachProfile]);

  // Live timer tick
  useEffect(() => {
    if (!liveSession) return;
    const interval = setInterval(() => {
      setLiveSession(prev => prev ? { ...prev, elapsed: prev.elapsed + 1 } : null);
    }, 1000);
    return () => clearInterval(interval);
  }, [liveSession?.startTime]);


  // Compute radar data from latest evaluation
  const latestEval = evaluations[0];
  const radarData = SKILL_METRICS.map(m => ({
    label: m.short,
    value: latestEval?.scores?.[m.key] ? latestEval.scores[m.key] / 20 : 0,
  }));

  // Calculate historical rolling average
  const skillAverages = SKILL_METRICS.map(m => {
    const scores = evaluations.map(e => e.scores?.[m.key]).filter((v): v is number => v != null && v > 0);
    const avg = scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : null;
    return { key: m.key, label: m.short, fullLabel: m.label, avg };
  });
  const ratedSkills = skillAverages.filter(s => s.avg !== null);
  const overallScore = ratedSkills.length > 0 ? ratedSkills.reduce((s, t) => s + (t.avg || 0), 0) / ratedSkills.length : 0;

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-20 text-center">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
        <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading child data...</div>
      </div>
    );
  }

  const submitAbsence = async () => {
    if (!profile?.child_id || !coachProfile?.id || !absenceReason.trim()) return;
    setAbsenceSending(true);
    const content = `MEDICAL ABSENCE: ${childProfile?.full_name || "My child"} will be absent.\nReason: ${absenceReason.trim()}`;
    await supabase.from("messages").insert({
      sender_id: profile.child_id, // Sent on behalf of the child
      receiver_id: coachProfile.id,
      content
    });
    setAbsenceSending(false);
    setAbsenceSuccess(true);
    setTimeout(() => {
      setAbsenceSuccess(false);
      setIsAbsenceModalOpen(false);
      setAbsenceReason("");
    }, 2000);
  };

  if (!profile?.child_id || !childProfile) {
    return (
      <div className="max-w-5xl mx-auto py-20 text-center">
        <IconUser size={48} color="#CBD5E1" />
        <h2 className="text-xl font-bold text-slate-400 mt-4 mb-2">No Child Linked</h2>
        <p className="text-sm text-slate-400">Please contact the academy admin to link your child's account to your parent profile.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-20 px-4 xl:px-0 space-y-8 opacity-0 animate-fade-up" style={{ animationFillMode: "forwards" }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded inline-block mb-2 border border-purple-100">
            PARENT VIEW • READ ONLY
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}>
            {childProfile.full_name}'s Progress
          </h1>
          <p className="text-slate-500 font-medium text-sm">
            Viewing your child's development as tracked by their coach.
          </p>
        </div>

        {/* Coach Info */}
        {coachProfile && (
          <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-100 rounded-2xl flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 text-white flex items-center justify-center text-xs font-black">
              {coachProfile.full_name?.substring(0, 2).toUpperCase() || "CO"}
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">{coachProfile.full_name}</div>
              <div className="text-[10px] font-medium text-blue-600">Head Coach</div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {coachProfile && (
        <div className="flex justify-end -mt-4">
          <button 
            onClick={() => setIsAbsenceModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl font-bold text-xs transition-colors border border-rose-100 shadow-sm"
          >
            <IconPlusCircle size={16} /> Report Absence / Illness
          </button>
        </div>
      )}

      {/* Upcoming Sessions & RSVP */}
      {upcomingSessions.length > 0 && (
        <div className="card-static p-5 mb-4 border-2 border-indigo-100 shadow-[0_4px_20px_rgba(79,70,229,0.05)]">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
            <IconCalendar size={16} color="#4F46E5" /> Upcoming Sessions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {upcomingSessions.map(session => (
              <div key={session.id} className="p-3 bg-white border-2 border-slate-100 rounded-xl flex flex-col justify-between hover:border-indigo-200 hover:shadow-md transition-all">
                <div className="mb-3">
                  <div className="text-xs font-bold text-slate-900 truncate">{session.title}</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                    {new Date(session.session_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} • {session.start_time.slice(0,5)}
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-auto">
                  <button 
                    onClick={() => handleRSVP(session.id, "going")}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg border-2 transition-colors ${session.response === "going" ? "bg-emerald-500 text-white border-emerald-500 shadow-sm" : "bg-white text-emerald-600 border-emerald-100 hover:bg-emerald-50 hover:border-emerald-200"}`}
                  >
                    ✓ Going
                  </button>
                  <button 
                    onClick={() => handleRSVP(session.id, "not_going")}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg border-2 transition-colors ${session.response === "not_going" ? "bg-rose-500 text-white border-rose-500 shadow-sm" : "bg-white text-rose-600 border-rose-100 hover:bg-rose-50 hover:border-rose-200"}`}
                  >
                    ✗ Not Going
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Session Banner */}
      {liveSession && (
        <div className="card-static overflow-hidden border-2 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.15)] animate-fade-up relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500 animate-pulse" />
          <div className="p-5 flex flex-col md:flex-row items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center flex-shrink-0 relative">
              <div className="absolute inset-0 rounded-2xl bg-emerald-400 animate-ping opacity-20" />
              <div className="w-4 h-4 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded">
                  Live Now
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">{liveSession.title}</h3>
              <p className="text-sm font-medium text-slate-500">
                Started at {liveSession.startTime.slice(0, 5)}
              </p>
            </div>
            <div className="flex-shrink-0 text-center bg-slate-900 text-white px-6 py-3 rounded-2xl w-full md:w-auto shadow-inner">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Session Timer</div>
              <div className="text-2xl font-black font-mono tracking-wider text-emerald-400">
                {Math.floor(liveSession.elapsed / 60).toString().padStart(2, "0")}:
                {(liveSession.elapsed % 60).toString().padStart(2, "0")}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fee Alert */}
      {feeStatus === "Pending" && (
        <div className="flex items-center gap-4 px-5 py-4 rounded-2xl border-2"
          style={{ background: "rgba(249,115,22,0.06)", borderColor: "rgba(249,115,22,0.25)" }}>
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
            <IconWallet size={20} color="#EA580C" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-orange-700 text-sm">Fee Payment Pending</div>
            <div className="text-orange-600 text-xs font-medium mt-0.5">
              Monthly fee for {childProfile.full_name} hasn't been received. Please contact the coach.
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0 bg-orange-100 text-orange-700">Pending</div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard value={(overallScore / 10).toFixed(1)} label="Overall Score" icon={<IconStar />} accentColor="#10B981" delay={0.1} />
        <StatCard value={evaluations.length.toString()} label="Evaluations" icon={<IconClipboard />} delay={0.15} />
        <StatCard value={`${attendanceRate}%`} label="Attendance" icon={<IconActivity />} accentColor="#3B82F6" delay={0.2} />
        <StatCard value={`${goals.filter(g => g.status === "achieved").length}/${goals.length}`} label="Goals Done" icon={<IconTarget />} accentColor="#F59E0B" delay={0.25} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar */}
        <div className="card-static p-6 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-purple-50 rounded-full blur-3xl opacity-40 pointer-events-none" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10">
            <IconTarget size={16} color="#8B5CF6" /> Skill Radar
          </h3>
          <div className="relative z-10 flex justify-center">
            <RadarChart data={radarData} size={260} fillColor="rgba(139,92,246,0.15)" strokeColor="#8B5CF6" />
          </div>
        </div>

        {/* Recent Evaluations */}
        <div className="card-static p-6">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
            <IconTrendingUp size={16} color="#10B981" /> Recent Evaluations
          </h3>
          {evaluations.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">No evaluations yet. Check back after training sessions.</p>
          ) : (
            <div className="space-y-3">
              {evaluations.map(ev => {
                const avg = ev.scores
                  ? Math.round(Object.values(ev.scores as Record<string, number>).reduce((s, v) => s + v, 0) / Object.values(ev.scores).length)
                  : 0;
                return (
                  <div key={ev.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">Session Review</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase">{new Date(ev.created_at).toLocaleDateString()}</div>
                      </div>
                      <div className="w-10 h-8 rounded-lg bg-emerald-100 text-emerald-700 font-black flex items-center justify-center text-sm">
                        {(avg / 10).toFixed(1)}
                      </div>
                    </div>
                    {ev.summary && (
                      <div className="mb-2">
                        <p className="text-xs text-slate-600 line-clamp-2">{ev.summary}</p>
                        <AISummaryFeedback evaluationId={ev.id} role="parent" />
                      </div>
                    )}
                    {ev.badge_awarded && (
                      <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px] font-bold border border-amber-100">
                        <IconStar size={10} /> {ev.badge_awarded}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Goals Progress */}
      <div className="card-static p-6">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
          <IconTarget size={16} color="#F59E0B" /> Development Goals
        </h3>
        {goals.length === 0 ? (
          <p className="text-xs text-slate-400 py-2">No goals assigned yet.</p>
        ) : (
          <div className="space-y-3">
            {goals.map(g => (
              <div key={g.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
                  g.status === "achieved" ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"
                }`}>
                  {g.status === "achieved" ? <IconCheck size={14} /> : <IconTarget size={14} />}
                </div>
                <div className="flex-1">
                  <span className={`text-sm font-medium ${g.status === "achieved" ? "text-slate-400 line-through" : "text-slate-700"}`}>
                    {g.title}
                  </span>
                  {g.category && <span className="text-[10px] font-bold text-slate-400 uppercase ml-2">{g.category}</span>}
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                  g.status === "achieved" ? "bg-emerald-50 text-emerald-600" :
                  g.status === "in_progress" ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400"
                }`}>
                  {g.status.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Absence / Illness Modal */}
      {isAbsenceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setIsAbsenceModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
              <IconPlusCircle size={20} color="#E11D48" /> Report Absence
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              Notify {coachProfile?.full_name || "the coach"} that {childProfile?.full_name} will not be able to attend.
            </p>

            {absenceSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-sm text-center flex items-center justify-center gap-2">
                <IconCheck size={18} /> Absence reported successfully.
              </div>
            ) : (
              <>
                <textarea
                  value={absenceReason}
                  onChange={(e) => setAbsenceReason(e.target.value)}
                  placeholder="Reason for absence (e.g. Fever, family emergency...)"
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-900 focus:outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-50 transition-all resize-none h-32 mb-4"
                />
                <button
                  onClick={submitAbsence}
                  disabled={!absenceReason.trim() || absenceSending}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-[0_4px_12px_rgba(225,29,72,0.3)] transition-all disabled:opacity-50"
                >
                  {absenceSending ? "Sending..." : "Notify Coach"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
