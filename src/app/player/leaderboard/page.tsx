/* ──────────────────────────────────────────────
   SQUAD LEADERBOARD
   Shows ranked players by overall score, attendance,
   most improved, and streak. Pink/Gold aesthetic
   with weekly "Player of the Week" highlight.
   ────────────────────────────────────────────── */
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import {
  IconTrendingUp, IconStar, IconActivity, IconTarget,
  IconFire, IconAward, IconUsers, IconCheck
} from "@/components/Icons";

interface LeaderboardEntry {
  id: string;
  name: string;
  position: string;
  overallScore: number;
  attendanceRate: number;
  streak: number;
  goalsAchieved: number;
  totalGoals: number;
  evalCount: number;
  improvement: number;
}

type SortKey = "score" | "attendance" | "improvement" | "goals";

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("score");

  useEffect(() => {
    if (!user) return;
    loadLeaderboard();
  }, [user]);

  async function loadLeaderboard() {
    if (!user) return;
    setLoading(true);

    // 1. Get player's coach_id to find squad
    const { data: myProfile } = await supabase
      .from("profiles")
      .select("coach_id")
      .eq("id", user.id)
      .single();

    if (!myProfile?.coach_id) {
      setLoading(false);
      return;
    }

    // 2. Get all squad members
    const { data: players } = await supabase
      .from("profiles")
      .select("id, full_name, position, overall_score")
      .eq("coach_id", myProfile.coach_id)
      .eq("role", "player")
      .order("overall_score", { ascending: false });

    if (!players || players.length === 0) {
      setLoading(false);
      return;
    }

    const playerIds = players.map(p => p.id);

    // 3. Fetch attendance data
    const { data: attData } = await supabase
      .from("attendance_logs")
      .select("player_id, status")
      .in("player_id", playerIds);

    // 4. Fetch goals
    const { data: goalData } = await supabase
      .from("goals")
      .select("player_id, status")
      .in("player_id", playerIds);

    // 5. Fetch evaluations for improvement
    const { data: evalData } = await supabase
      .from("evaluations")
      .select("player_id, overall_score, created_at")
      .in("player_id", playerIds)
      .order("created_at", { ascending: false });

    // Build entries
    const leaderboard: LeaderboardEntry[] = players.map(p => {
      // Attendance
      const playerAtt = (attData || []).filter(a => a.player_id === p.id);
      const presentCount = playerAtt.filter(a => a.status === "Present" || a.status === "Late").length;
      const attendanceRate = playerAtt.length > 0 ? Math.round((presentCount / playerAtt.length) * 100) : 0;

      // Goals
      const playerGoals = (goalData || []).filter(g => g.player_id === p.id);
      const goalsAchieved = playerGoals.filter(g => g.status === "achieved").length;

      // Evaluations & improvement
      const playerEvals = (evalData || []).filter(e => e.player_id === p.id);
      const latestScore = playerEvals.length > 0 ? playerEvals[0].overall_score : 0;
      const oldestScore = playerEvals.length > 1 ? playerEvals[playerEvals.length - 1].overall_score : latestScore;
      const improvement = latestScore - oldestScore;

      // Calculate streak (consecutive present sessions)
      let streak = 0;
      const sorted = playerAtt.sort((a, b) => 0); // maintain order
      for (const att of playerAtt) {
        if (att.status === "Present") streak++;
        else break;
      }

      return {
        id: p.id,
        name: p.full_name || "Unknown",
        position: p.position || "MID",
        overallScore: p.overall_score || latestScore || 0,
        attendanceRate,
        streak,
        goalsAchieved,
        totalGoals: playerGoals.length,
        evalCount: playerEvals.length,
        improvement,
      };
    });

    setEntries(leaderboard);
    setLoading(false);
  }

  // Sort entries
  const sortedEntries = [...entries].sort((a, b) => {
    switch (sortKey) {
      case "score": return b.overallScore - a.overallScore;
      case "attendance": return b.attendanceRate - a.attendanceRate;
      case "improvement": return b.improvement - a.improvement;
      case "goals": return b.goalsAchieved - a.goalsAchieved;
      default: return 0;
    }
  });

  // Player of the Week = top scorer
  const playerOfWeek = sortedEntries[0];
  const isCurrentUser = (id: string) => id === user?.id;

  const sortOptions: { key: SortKey; label: string; icon: JSX.Element }[] = [
    { key: "score", label: "Overall Score", icon: <IconStar size={14} /> },
    { key: "attendance", label: "Attendance", icon: <IconActivity size={14} /> },
    { key: "improvement", label: "Most Improved", icon: <IconTrendingUp size={14} /> },
    { key: "goals", label: "Goals Done", icon: <IconTarget size={14} /> },
  ];

  function getMedalColor(rank: number): string {
    if (rank === 0) return "from-amber-400 to-yellow-600";
    if (rank === 1) return "from-slate-300 to-slate-500";
    if (rank === 2) return "from-orange-400 to-orange-700";
    return "from-slate-200 to-slate-300";
  }

  function getMedalEmoji(rank: number): string {
    if (rank === 0) return "🥇";
    if (rank === 1) return "🥈";
    if (rank === 2) return "🥉";
    return `#${rank + 1}`;
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-20 text-center">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
        <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-24 px-4 xl:px-0 space-y-8">
      {/* Header */}
      <div className="opacity-0 animate-fade-up" style={{ animationFillMode: "forwards" }}>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}>
          Squad Leaderboard
        </h1>
        <p className="text-slate-500 font-medium text-sm">See how you stack up against your teammates. Updated after every evaluation.</p>
      </div>

      {/* Player of the Week */}
      {playerOfWeek && (
        <div className="card-static p-6 relative overflow-hidden border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 opacity-0 animate-fade-up" style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}>
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-amber-200/40 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 text-white flex items-center justify-center text-2xl shadow-lg border-2 border-white">
              🏆
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Player of the Week</div>
              <div className="text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-heading)" }}>{playerOfWeek.name}</div>
              <div className="flex items-center gap-3 mt-1 text-xs font-bold text-slate-500">
                <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded">{playerOfWeek.position}</span>
                <span>Score: {playerOfWeek.overallScore}</span>
                <span>•</span>
                <span>{playerOfWeek.attendanceRate}% attendance</span>
              </div>
            </div>
            <div className="flex-shrink-0 text-center">
              <div className="text-4xl font-black text-amber-600" style={{ fontFamily: "var(--font-heading)" }}>{playerOfWeek.overallScore}</div>
              <div className="text-[10px] font-bold text-amber-500 uppercase">Rating</div>
            </div>
          </div>
        </div>
      )}

      {/* Sort Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 opacity-0 animate-fade-up" style={{ animationDelay: "0.15s", animationFillMode: "forwards" }}>
        {sortOptions.map(opt => (
          <button
            key={opt.key}
            onClick={() => setSortKey(opt.key)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
              sortKey === opt.key
                ? "bg-slate-900 text-white border-slate-900 shadow-md"
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
            }`}
          >
            {opt.icon} {opt.label}
          </button>
        ))}
      </div>

      {/* Leaderboard Table */}
      {sortedEntries.length === 0 ? (
        <div className="card-static p-12 text-center opacity-0 animate-fade-up" style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}>
          <IconUsers size={40} color="#CBD5E1" />
          <h3 className="text-lg font-bold text-slate-400 mt-4 mb-2">No squad data yet</h3>
          <p className="text-sm text-slate-400">The leaderboard will populate after your coach starts evaluating players.</p>
        </div>
      ) : (
        <div className="space-y-2 opacity-0 animate-fade-up" style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}>
          {sortedEntries.map((entry, rank) => {
            const isMe = isCurrentUser(entry.id);
            return (
              <div
                key={entry.id}
                className={`card-static p-4 flex items-center gap-4 transition-all hover:shadow-md ${
                  isMe ? "border-2 border-emerald-200 bg-emerald-50/30" : ""
                } ${rank < 3 ? "border-l-4" : ""}`}
                style={{
                  borderLeftColor: rank === 0 ? "#F59E0B" : rank === 1 ? "#94A3B8" : rank === 2 ? "#C2410C" : undefined,
                }}
              >
                {/* Rank */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${
                  rank < 3
                    ? `bg-gradient-to-br ${getMedalColor(rank)} text-white shadow-md`
                    : "bg-slate-100 text-slate-500"
                }`}>
                  {rank < 3 ? getMedalEmoji(rank) : `#${rank + 1}`}
                </div>

                {/* Avatar */}
                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-md border-2 border-white ${
                  isMe ? "bg-gradient-to-br from-emerald-400 to-teal-600" : "bg-gradient-to-br from-slate-400 to-slate-600"
                }`}>
                  {entry.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-sm ${isMe ? "text-emerald-700" : "text-slate-900"}`}>{entry.name}</span>
                    {isMe && <span className="text-[9px] font-black bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded">YOU</span>}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                    <span>{entry.position}</span>
                    <span>•</span>
                    <span>{entry.evalCount} eval{entry.evalCount !== 1 ? "s" : ""}</span>
                    {entry.streak > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-orange-500 flex items-center gap-0.5"><IconFire size={10} /> {entry.streak}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Stats Pills */}
                <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                  <div className="text-center px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="text-xs font-black text-slate-900">{entry.attendanceRate}%</div>
                    <div className="text-[8px] font-bold text-slate-400 uppercase">ATT</div>
                  </div>
                  <div className="text-center px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="text-xs font-black text-slate-900">{entry.goalsAchieved}/{entry.totalGoals}</div>
                    <div className="text-[8px] font-bold text-slate-400 uppercase">GOALS</div>
                  </div>
                  {entry.improvement !== 0 && (
                    <div className={`text-center px-3 py-1.5 rounded-lg border ${
                      entry.improvement > 0 ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"
                    }`}>
                      <div className={`text-xs font-black ${entry.improvement > 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {entry.improvement > 0 ? "+" : ""}{entry.improvement}
                      </div>
                      <div className="text-[8px] font-bold text-slate-400 uppercase">TREND</div>
                    </div>
                  )}
                </div>

                {/* Score Badge */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0 ${
                  entry.overallScore >= 80 ? "bg-emerald-50 text-emerald-600" :
                  entry.overallScore >= 60 ? "bg-blue-50 text-blue-600" :
                  "bg-slate-50 text-slate-500"
                }`}>
                  {entry.overallScore}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
