/* ──────────────────────────────────────────────
   PLAYER REPORT CARD
   Auto-generated progress report card showing
   evaluation summary, radar chart, attendance,
   goals, and coach comments. Printable layout.
   ────────────────────────────────────────────── */
"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import RadarChart from "@/components/RadarChart";
import AISummaryFeedback from "@/components/AISummaryFeedback";
import { SKILL_METRICS, RANK_TIERS, PlayerTier } from "@/lib/constants";
import {
  IconClipboard, IconTarget, IconActivity, IconStar,
  IconCheck, IconTrendingUp, IconAward, IconUser
} from "@/components/Icons";

export default function ReportCardPage() {
  const { user } = useAuth();
  const reportRef = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState<any>(null);
  const [coachName, setCoachName] = useState("");
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [attendance, setAttendance] = useState({ present: 0, late: 0, absent: 0, total: 0 });
  const [goals, setGoals] = useState({ achieved: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadReportData();
  }, [user]);

  async function loadReportData() {
    if (!user) return;
    setLoading(true);

    // Profile
    const { data: pData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (pData) {
      setProfile(pData);
      if (pData.coach_id) {
        const { data: coach } = await supabase.from("profiles").select("full_name").eq("id", pData.coach_id).single();
        if (coach) setCoachName(coach.full_name || "Coach");
      }
    }

    // Evaluations (last 6)
    const { data: evalData } = await supabase
      .from("evaluations")
      .select("*")
      .eq("player_id", user.id)
      .order("created_at", { ascending: false })
      .limit(6);
    if (evalData) setEvaluations(evalData);

    // Attendance
    const { data: attData } = await supabase
      .from("attendance_logs")
      .select("status")
      .eq("player_id", user.id);
    if (attData) {
      setAttendance({
        present: attData.filter(a => a.status === "Present").length,
        late: attData.filter(a => a.status === "Late").length,
        absent: attData.filter(a => a.status === "Absent").length,
        total: attData.length,
      });
    }

    // Goals
    const { data: goalData } = await supabase
      .from("goals")
      .select("status")
      .eq("player_id", user.id);
    if (goalData) {
      setGoals({
        achieved: goalData.filter(g => g.status === "achieved").length,
        total: goalData.length,
      });
    }

    setLoading(false);
  }

  // Compute skill averages
  const skillAverages = SKILL_METRICS.map(m => {
    const scores = evaluations.map(e => e.scores?.[m.key]).filter((v): v is number => v != null && v > 0);
    const avg = scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : null;
    return { key: m.key, label: m.short, fullLabel: m.label, avg };
  });

  const ratedSkills = skillAverages.filter(s => s.avg !== null);
  const overallAvg = ratedSkills.length > 0 ? ratedSkills.reduce((s, t) => s + (t.avg || 0), 0) / ratedSkills.length : 0;
  const radarData = skillAverages.map(s => ({ label: s.label, value: s.avg !== null ? s.avg / 20 : 0 }));
  const rank = RANK_TIERS[(profile?.tier as PlayerTier) || 'Beginner'] || RANK_TIERS.Beginner;
  const attendanceRate = attendance.total > 0
    ? Math.round(((attendance.present + attendance.late) / attendance.total) * 100) : 0;

  // All strengths/focus areas aggregated
  const allStrengths = [...new Set(evaluations.flatMap(e => e.strengths || []))];
  const allFocus = [...new Set(evaluations.flatMap(e => e.focus_areas || []))];

  // Latest badge
  const latestBadge = evaluations.find(e => e.badge_awarded)?.badge_awarded;

  function handlePrint() {
    window.print();
  }

  async function handleSendEmail() {
    setSendingEmail(true);
    try {
      const res = await fetch("/api/send-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerEmail: user?.email || "parent@example.com",
          playerName: profile?.full_name || "Player",
          coachName: coachName,
          summary: evaluations[0]?.summary || "No recent summary.",
          scores: evaluations[0]?.scores || {},
          reportUrl: window.location.href,
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert("Report card emailed successfully!");
      } else {
        alert("Failed to send email: " + data.error);
      }
    } catch (e) {
      alert("An error occurred while sending the email.");
    } finally {
      setSendingEmail(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-20 text-center">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
        <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Generating report card...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-24 px-4 xl:px-0 space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between opacity-0 animate-fade-up" style={{ animationFillMode: "forwards" }}>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}>
            Progress Report Card
          </h1>
          <p className="text-sm text-slate-500 font-medium">Auto-generated from your latest evaluations</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSendEmail}
            disabled={sendingEmail}
            className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 flex items-center gap-2 text-sm print:hidden transition-all disabled:opacity-50 font-bold px-4 py-2 rounded-xl"
          >
            <span className="text-base">✉️</span> {sendingEmail ? "Sending..." : "Send to Parent"}
          </button>
          <button
            onClick={handlePrint}
            className="btn-primary flex items-center gap-2 text-sm print:hidden"
          >
            <IconClipboard size={16} /> Download / Print
          </button>
        </div>
      </div>

      {/* Report Card (printable area) */}
      <div ref={reportRef} className="card-static p-6 md:p-10 space-y-8 opacity-0 animate-fade-up print:shadow-none print:border-none" style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}>
        
        {/* Report Header */}
        <div className="flex items-start justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-2xl font-black text-white shadow-lg border-2 border-white">
              {profile?.full_name?.substring(0, 2).toUpperCase() || "PL"}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-heading)" }}>
                {profile?.full_name || "Player"}
              </h2>
              <div className="flex items-center gap-3 text-xs font-bold text-slate-400 uppercase mt-0.5">
                <span>{profile?.position || "MID"}</span>
                <span>•</span>
                <span>AGE {profile?.age || "--"}</span>
                <span>•</span>
                <span>Coach: {coachName}</span>
              </div>
              {latestBadge && (
                <div className="flex items-center gap-1 mt-2 px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px] font-bold border border-amber-100 w-fit">
                  <IconAward size={12} /> {latestBadge}
                </div>
              )}
            </div>
          </div>
          
          {/* Rank Badge */}
          <div className="text-center flex-shrink-0">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black shadow-md border-2"
              style={{ background: rank.bgColor, color: rank.color, borderColor: rank.borderColor }}>
              {(overallAvg / 10).toFixed(1)}
            </div>
            <div className="text-[10px] font-black mt-1 uppercase" style={{ color: rank.color }}>{profile?.tier || 'Beginner'}</div>
          </div>
        </div>

        {/* Two Column: Radar + Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Radar */}
          <div className="flex flex-col items-center">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 self-start">
              <IconTarget size={14} color="#059669" /> Skill Breakdown
            </h3>
            <RadarChart data={radarData} size={250} />
          </div>

          {/* Skills Table */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <IconTrendingUp size={14} color="#3B82F6" /> Attribute Scores
            </h3>
            <div className="space-y-3">
              {skillAverages.map(skill => (
                <div key={skill.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-700">{skill.fullLabel}</span>
                    <span className={`text-sm font-black ${skill.avg !== null ? 'text-slate-900' : 'text-slate-400 italic'}`}>
                      {skill.avg !== null ? (skill.avg / 10).toFixed(1) : 'N/A'}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    {skill.avg !== null ? (
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${skill.avg}%`,
                          background: skill.avg >= 80 ? "#10B981" : skill.avg >= 60 ? "#3B82F6" : "#F59E0B"
                        }}
                      />
                    ) : (
                      <div className="h-full rounded-full bg-slate-200/50" style={{ width: '100%' }}>
                        <div className="h-full w-full flex items-center justify-center">
                          <div className="w-2/3 h-0.5 bg-slate-200 rounded" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
          <div className="text-center p-4 bg-slate-50 rounded-xl">
            <div className="text-2xl font-black text-slate-900">{evaluations.length}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">Evaluations</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <div className="text-2xl font-black text-blue-600">{attendanceRate}%</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">Attendance</div>
          </div>
          <div className="text-center p-4 bg-emerald-50 rounded-xl">
            <div className="text-2xl font-black text-emerald-600">{goals.achieved}/{goals.total}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">Goals Achieved</div>
          </div>
          <div className="text-center p-4 bg-amber-50 rounded-xl">
            <div className="text-2xl font-black text-amber-600">{(overallAvg / 10).toFixed(1)}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">Overall Rating</div>
          </div>
        </div>

        {/* Strengths & Focus Areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <IconStar size={14} color="#10B981" /> Key Strengths
            </h3>
            {allStrengths.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {allStrengths.map(s => (
                  <span key={s} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-100">
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No strengths tagged yet.</p>
            )}
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <IconTarget size={14} color="#F59E0B" /> Development Focus
            </h3>
            {allFocus.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {allFocus.map(f => (
                  <span key={f} className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold border border-amber-100">
                    {f}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No focus areas tagged yet.</p>
            )}
          </div>
        </div>

        {/* Coach Comments */}
        {evaluations.length > 0 && evaluations[0].summary && (
          <div className="pt-4 border-t border-slate-200">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <IconUser size={14} color="#8B5CF6" /> Latest Coach Assessment
            </h3>
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
              <p className="text-sm text-purple-800 leading-relaxed italic">"{evaluations[0].summary}"</p>
              <p className="text-[10px] font-bold text-purple-500 mt-2 uppercase">
                — {coachName} • {new Date(evaluations[0].created_at).toLocaleDateString()}
              </p>
            </div>
            <AISummaryFeedback evaluationId={evaluations[0].id} role="player" />
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] font-bold text-slate-300 uppercase tracking-widest">
          <span>Generated by KickXPro</span>
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
