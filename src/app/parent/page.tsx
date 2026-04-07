/* ──────────────────────────────────────────────
   PARENT DASHBOARD
   Read-only view of their child's performance,
   attendance, fees, and recent evaluations.
   ────────────────────────────────────────────── */
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import RadarChart from "@/components/RadarChart";
import StatCard from "@/components/StatCard";
import { SKILL_METRICS } from "@/lib/constants";
import {
  IconUser, IconTarget, IconClipboard, IconActivity,
  IconCheck, IconWallet, IconTrendingUp, IconStar
} from "@/components/Icons";

export default function ParentDashboard() {
  const { user, profile } = useAuth();
  const [childProfile, setChildProfile] = useState<any>(null);
  const [coachProfile, setCoachProfile] = useState<any>(null);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [feeStatus, setFeeStatus] = useState<string | null>(null);
  const [attendanceRate, setAttendanceRate] = useState(0);
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

    setLoading(false);
  }

  // Compute radar data from latest evaluation
  const latestEval = evaluations[0];
  const radarData = SKILL_METRICS.map(m => ({
    label: m.short,
    value: latestEval?.scores?.[m.key] ? latestEval.scores[m.key] / 20 : 0,
  }));

  const overallScore = latestEval?.scores
    ? Math.round(Object.values(latestEval.scores as Record<string, number>).reduce((s, v) => s + v, 0) / Object.values(latestEval.scores).length)
    : 0;

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-20 text-center">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
        <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading child data...</div>
      </div>
    );
  }

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
        <StatCard value={overallScore.toString()} label="Overall Score" icon={<IconStar />} accentColor="#10B981" delay={0.1} />
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
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-slate-900">{new Date(ev.created_at).toLocaleDateString()}</span>
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 font-black text-sm flex items-center justify-center">{avg}</div>
                    </div>
                    {ev.summary && <p className="text-xs text-slate-500 line-clamp-2">{ev.summary}</p>}
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
    </div>
  );
}
