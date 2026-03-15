/* ──────────────────────────────────────────────
   PLAYER DISCIPLINE — Progress & Accountability
   Streaks, goals, effort scores, and punctuality
   tracking to drive player engagement.
   ────────────────────────────────────────────── */
"use client";

import { useState } from "react";
import {
  IconCheck, IconTarget, IconActivity, IconFire,
  IconTrendingUp, IconAward, IconPlus, IconZap
} from "@/components/Icons";

/* ── Mock Discipline Data ── */
const MOCK_EFFORT_HISTORY = [
  { date: "Mar 15", effort: 9, onTime: true },
  { date: "Mar 14", effort: 8, onTime: true },
  { date: "Mar 13", effort: 7, onTime: true },
  { date: "Mar 12", effort: 6, onTime: false },
  { date: "Mar 11", effort: 9, onTime: true },
  { date: "Mar 10", effort: 8, onTime: true },
  { date: "Mar 9", effort: 5, onTime: false },
  { date: "Mar 8", effort: 8, onTime: true },
  { date: "Mar 7", effort: 9, onTime: true },
  { date: "Mar 6", effort: 7, onTime: true },
];

const MOCK_BADGES = [
  { id: "b1", name: "10-Day Streak", icon: "🔥", earned: true, date: "Mar 14" },
  { id: "b2", name: "Always On Time", icon: "⏰", earned: true, date: "Mar 10" },
  { id: "b3", name: "Max Effort", icon: "💪", earned: false, date: null },
  { id: "b4", name: "Training Legend", icon: "🏆", earned: false, date: null },
];

export default function PlayerDisciplinePage() {
  const [goals, setGoals] = useState([
    { id: 1, title: "Arrive 10 mins early for 2 weeks", target: 14, current: 9, status: "Active" as const },
    { id: 2, title: "Hit effort score 8+ in 5 sessions", target: 5, current: 4, status: "Active" as const },
    { id: 3, title: "Complete 50 juggling reps", target: 50, current: 50, status: "Completed" as const },
  ]);

  const [newGoalText, setNewGoalText] = useState("");
  const [showNewGoal, setShowNewGoal] = useState(false);

  const currentStreak = 3;
  const avgEffort = (MOCK_EFFORT_HISTORY.reduce((sum, d) => sum + d.effort, 0) / MOCK_EFFORT_HISTORY.length).toFixed(1);
  const punctualityRate = Math.round((MOCK_EFFORT_HISTORY.filter(d => d.onTime).length / MOCK_EFFORT_HISTORY.length) * 100);

  const addGoal = () => {
    if (!newGoalText.trim()) return;
    setGoals(prev => [...prev, { id: Date.now(), title: newGoalText, target: 10, current: 0, status: "Active" }]);
    setNewGoalText("");
    setShowNewGoal(false);
  };

  const effortColor = (score: number) => {
    if (score >= 8) return "#10B981";
    if (score >= 6) return "#F59E0B";
    return "#EF4444";
  };

  return (
    <div className="max-w-6xl mx-auto pb-24 px-4 xl:px-0 opacity-0 animate-fade-up">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-slate-900 leading-tight" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}>
          Discipline Tracker
        </h1>
        <p className="text-slate-500 font-medium text-xs md:text-sm">Track your consistency, effort, and earn rewards for showing up strong.</p>
      </div>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card-static p-5 text-center relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-16 h-16 bg-amber-50 rounded-full blur-2xl" />
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-1 mb-2">
              <IconFire size={20} color="#F59E0B" />
            </div>
            <div className="text-3xl font-black text-slate-900" style={{ fontFamily: "var(--font-heading)" }}>{currentStreak}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Day Streak</div>
          </div>
        </div>

        <div className="card-static p-5 text-center relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-16 h-16 bg-emerald-50 rounded-full blur-2xl" />
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-1 mb-2">
              <IconZap size={20} color="#10B981" />
            </div>
            <div className="text-3xl font-black text-slate-900" style={{ fontFamily: "var(--font-heading)" }}>{avgEffort}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Avg Effort</div>
          </div>
        </div>

        <div className="card-static p-5 text-center relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-16 h-16 bg-blue-50 rounded-full blur-2xl" />
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-1 mb-2">
              <IconActivity size={20} color="#3B82F6" />
            </div>
            <div className="text-3xl font-black text-slate-900" style={{ fontFamily: "var(--font-heading)" }}>{punctualityRate}%</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">On Time</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Left: Effort History ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Effort Chart (Bar Visualization) */}
          <div className="card-static p-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2" style={{ fontFamily: "var(--font-heading)" }}>
              <IconTrendingUp size={16} color="#3B82F6" /> Effort History
            </h3>
            <div className="space-y-3">
              {MOCK_EFFORT_HISTORY.map((day, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-slate-400 w-12 text-right">{day.date}</span>
                  <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden relative">
                    <div
                      className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                      style={{
                        width: `${day.effort * 10}%`,
                        background: `linear-gradient(90deg, ${effortColor(day.effort)}80, ${effortColor(day.effort)})`,
                      }}
                    >
                      <span className="text-[10px] font-black text-white">{day.effort}/10</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold w-10 text-center ${day.onTime ? "text-emerald-500" : "text-red-400"}`}>
                    {day.onTime ? "✓" : "Late"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Active Goals */}
          <div className="card-static p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2" style={{ fontFamily: "var(--font-heading)" }}>
                <IconTarget size={16} color="#10B981" /> Active Goals
              </h3>
              <button
                onClick={() => setShowNewGoal(!showNewGoal)}
                className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors"
              >
                <IconPlus size={14} />
              </button>
            </div>

            {showNewGoal && (
              <div className="flex gap-2 mb-4 animate-fade-up">
                <input
                  type="text"
                  className="input flex-1 text-sm"
                  placeholder="Set a new goal..."
                  value={newGoalText}
                  onChange={e => setNewGoalText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addGoal()}
                />
                <button onClick={addGoal} className="px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-xl hover:bg-emerald-600 transition-colors">
                  Add
                </button>
              </div>
            )}

            <div className="space-y-3">
              {goals.map(goal => {
                const progress = Math.min((goal.current / goal.target) * 100, 100);
                const isComplete = goal.status === "Completed";
                return (
                  <div key={goal.id} className={`p-4 rounded-xl border transition-all ${isComplete ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-100"}`}>
                    <div className="flex items-start justify-between mb-2">
                      <span className={`text-sm font-bold ${isComplete ? "text-emerald-700" : "text-slate-900"}`}>
                        {goal.title}
                      </span>
                      {isComplete && <IconCheck size={16} color="#10B981" />}
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${progress}%`,
                          background: isComplete ? "#10B981" : `linear-gradient(90deg, #3B82F6, #60A5FA)`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-400">
                      <span>{goal.current} / {goal.target}</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Right: Badges ── */}
        <div>
          <div className="card-static p-6 sticky top-24">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2" style={{ fontFamily: "var(--font-heading)" }}>
              <IconAward size={16} color="#F59E0B" /> Badges
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {MOCK_BADGES.map(badge => (
                <div
                  key={badge.id}
                  className={`p-4 rounded-xl border text-center transition-all
                    ${badge.earned
                      ? "bg-amber-50 border-amber-200 shadow-sm"
                      : "bg-slate-50 border-slate-100 opacity-40 grayscale"
                    }`}
                >
                  <div className="text-2xl mb-2">{badge.icon}</div>
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${badge.earned ? "text-amber-700" : "text-slate-400"}`}>
                    {badge.name}
                  </div>
                  {badge.date && (
                    <div className="text-[9px] text-slate-400 mt-1">{badge.date}</div>
                  )}
                </div>
              ))}
            </div>

            {/* Coach Comment */}
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <h4 className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-2">Latest Coach Comment</h4>
              <p className="text-xs text-blue-800 leading-relaxed italic">
                "Arjun has been on a great run of consistency. Keep this up and a Streak badge is within reach. Proud of the effort!"
              </p>
              <p className="text-[10px] text-blue-500 font-medium mt-2">— Coach Anita, Mar 15</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
