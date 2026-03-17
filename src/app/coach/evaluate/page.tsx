/* ──────────────────────────────────────────────
   EVALUATE PLAYER (State Fix & Incentives)
   Each player has an isolated evaluation state.
   Includes "Award Badge" (Incentive) feature.
   ────────────────────────────────────────────── */
"use client";

import { useState, useMemo, useEffect } from "react";
import { STRENGTH_TRAITS, FOCUS_TRAITS, SKILL_METRICS } from "@/lib/constants";
import RadarChart from "@/components/RadarChart";
import { IconClipboard, IconCheck, IconAward } from "@/components/Icons";

const DEMO_PLAYERS = [
  { id: "P001", num: 10, name: "Arjun M." },
  { id: "P002", num: 8, name: "Neha S." },
  { id: "P003", num: 4, name: "Rahul J." },
  { id: "P004", num: 9, name: "Sanjay V." },
];

interface EvalData {
  scores: Record<string, number>;
  strengths: string[];
  focusAreas: string[];
  summary: string;
  badgeAwarded: string | null;
  saved: boolean;
}

const DEFAULT_EVAL: EvalData = {
  scores: { pace: 65, shooting: 60, passing: 70, dribbling: 68, defending: 50, physical: 62 },
  strengths: [],
  focusAreas: [],
  summary: "",
  badgeAwarded: null,
  saved: false,
};

const INCENTIVE_BADGES = [
  { id: "motm", label: "Player of the Match", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  { id: "playmaker", label: "Playmaker", color: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
  { id: "rock", label: "Defensive Rock", color: "#10B981", bg: "rgba(16,185,129,0.1)" },
  { id: "workhorse", label: "Workhorse", color: "#8B5CF6", bg: "rgba(139,92,246,0.1)" },
];

export default function EvaluatePage() {
  const [activePlayerId, setActivePlayerId] = useState(DEMO_PLAYERS[0].id);
  const [evaluations, setEvaluations] = useState<Record<string, EvalData>>({});
  const [showToast, setShowToast] = useState(false);

  // Initialize or get current player data
  const currentData = evaluations[activePlayerId] || DEFAULT_EVAL;

  const updateCurrentData = (updates: Partial<EvalData>) => {
    setEvaluations(prev => ({
      ...prev,
      [activePlayerId]: { ...(prev[activePlayerId] || DEFAULT_EVAL), ...updates }
    }));
  };

  const handleScoreChange = (key: string, value: number) => {
    updateCurrentData({ scores: { ...currentData.scores, [key]: value } });
  };

  const toggleStrength = (trait: string) => {
    const arr = currentData.strengths.includes(trait)
      ? currentData.strengths.filter(t => t !== trait)
      : [...currentData.strengths, trait];
    updateCurrentData({ strengths: arr });
  };

  const toggleFocus = (trait: string) => {
    const arr = currentData.focusAreas.includes(trait)
      ? currentData.focusAreas.filter(t => t !== trait)
      : [...currentData.focusAreas, trait];
    updateCurrentData({ focusAreas: arr });
  };

  const toggleBadge = (badgeId: string) => {
    updateCurrentData({ badgeAwarded: currentData.badgeAwarded === badgeId ? null : badgeId });
  };

  const generateSummary = () => {
    const s = currentData.strengths.length > 0 ? `Showed great ${currentData.strengths.join(" and ")}.` : "";
    const f = currentData.focusAreas.length > 0 ? ` Needs to focus on ${currentData.focusAreas.join(" and ")} for the next session.` : "";
    const b = currentData.badgeAwarded ? ` Awarded the ${INCENTIVE_BADGES.find(x => x.id === currentData.badgeAwarded)?.label} badge!` : "";
    updateCurrentData({ summary: `Solid performance today. ${s}${f}${b}` });
  };

  const handleSave = () => {
    updateCurrentData({ saved: true });
    setShowToast(true);
    
    setTimeout(() => {
      setShowToast(false);
      // Auto move to next unsaved player
      const currentIndex = DEMO_PLAYERS.findIndex(p => p.id === activePlayerId);
      if (currentIndex < DEMO_PLAYERS.length - 1) {
        setActivePlayerId(DEMO_PLAYERS[currentIndex + 1].id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 2000);
  };

  const radarData = useMemo(() => {
    return SKILL_METRICS.map(m => ({ label: m.short, value: ((currentData.scores[m.key] || 1) / 20) }));
  }, [currentData.scores]);

  const overallScore = Math.round(
    Object.values(currentData.scores).reduce((a, b) => a + b, 0) / Math.max(1, Object.keys(currentData.scores).length)
  );

  return (
    <div className="max-w-5xl mx-auto pb-32 relative px-4 xl:px-0">
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-slide-in font-bold">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <IconCheck size={14} color="white" />
          </div>
          Evaluation Saved for {DEMO_PLAYERS.find(p => p.id === activePlayerId)?.name}!
        </div>
      )}

      {/* Header */}
      <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2 text-slate-900" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}>Player Evaluation</h1>
          <p className="text-slate-500 font-medium text-xs md:text-sm">Follow the steps below to complete the session report.</p>
        </div>
        
        {/* Overall Score Badge */}
        <div className="flex items-center gap-3 bg-white px-3 md:px-4 py-2 rounded-2xl shadow-sm border border-slate-100 self-start md:self-auto">
           <span className="text-[10px] md:text-xs font-bold text-slate-400 tracking-wider">OVERALL</span>
           <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-lg md:text-xl font-black text-white shadow-inner" style={{ background: "linear-gradient(135deg, #10B981, #059669)", fontFamily: "var(--font-heading)" }}>
             {overallScore}
           </div>
        </div>
      </div>

      {/* Step 1: Select Player */}
      <h3 className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">1. Select Player</h3>
      <div className="flex overflow-x-auto gap-2 md:gap-3 pb-4 mb-6 custom-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
        {DEMO_PLAYERS.map((player) => {
          const isSaved = evaluations[player.id]?.saved;
          return (
            <button
              key={player.id}
              onClick={() => setActivePlayerId(player.id)}
              className="flex-shrink-0 flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-2.5 rounded-full border transition-all"
              style={{
                background: activePlayerId === player.id ? "var(--color-brand)" : "#FFFFFF",
                borderColor: activePlayerId === player.id ? "var(--color-brand)" : (isSaved ? "#10B981" : "var(--color-border)"),
                color: activePlayerId === player.id ? "#FFFFFF" : "var(--color-text)",
                boxShadow: activePlayerId === player.id ? "0 4px 12px rgba(0,200,83,0.3)" : "none"
              }}
            >
               <div className="w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold" 
                   style={{ background: activePlayerId === player.id ? "rgba(255,255,255,0.2)" : (isSaved ? "#dcfce7" : "rgba(0,0,0,0.05)"), color: isSaved && activePlayerId !== player.id ? "#166534" : "inherit" }}>
                {isSaved ? <IconCheck size={12} /> : player.num}
              </div>
              <span className="font-bold text-xs md:text-sm tracking-tight">{player.name}</span>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        
        {/* Left Col: Sliders (Step 2) */}
        <div className="space-y-6">
           <div>
             <h3 className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">2. Adjust Core Attributes (1-99)</h3>
             <div className="card-static p-4 md:p-6 space-y-6 md:space-y-7">
              {SKILL_METRICS.map((metric) => {
                const val = currentData.scores[metric.key] || 1;
                return (
                  <div key={metric.key}>
                    <div className="flex justify-between text-[10px] md:text-xs font-bold mb-2 md:mb-3 uppercase tracking-wider text-slate-600">
                      <span>{metric.label}</span>
                      <span className="text-emerald-600 text-xs md:text-sm font-black">{val}</span>
                    </div>
                    <div className="relative h-3 md:h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 shadow-inner">
                      <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-300 ease-out" 
                           style={{ 
                             width: `${val}%`, 
                             background: val < 40 ? "linear-gradient(90deg, #F87171, #EF4444)" : val < 75 ? "linear-gradient(90deg, #FBBF24, #F59E0B)" : "linear-gradient(90deg, #34D399, #10B981)" 
                           }} 
                      />
                      {/* Visible Thumb Knob */}
                      <div 
                        className="absolute top-1/2 -translate-y-1/2 w-6 h-6 md:w-7 md:h-7 rounded-full bg-white shadow-lg border-2 flex items-center justify-center text-[8px] md:text-[9px] font-black transition-all duration-300 ease-out pointer-events-none z-10"
                        style={{ 
                          left: `calc(${val}% - 14px)`,
                          borderColor: val < 40 ? "#EF4444" : val < 75 ? "#F59E0B" : "#10B981",
                          color: val < 40 ? "#EF4444" : val < 75 ? "#F59E0B" : "#10B981"
                        }}
                      >
                        {val}
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="99"
                        value={val}
                        onChange={(e) => handleScoreChange(metric.key, parseInt(e.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                      />
                    </div>
                  </div>
                );
              })}
             </div>
           </div>
           
           <div className="card-static p-4 md:p-6 flex justify-center items-center bg-slate-50 border-dashed border-2 overflow-hidden">
              <RadarChart data={radarData} size={240} />
           </div>
        </div>

        {/* Right Col: Traits, Badges, Report (Step 3 & 4) */}
        <div className="space-y-6">
          
          <div>
            <h3 className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">3. Tag Traits & Awards</h3>
            <div className="card-static p-4 md:p-6 space-y-6 md:space-y-8">
              
              {/* Incentives / Badges */}
              <div>
                <div className="text-xs md:text-sm font-bold text-blue-600 mb-3 flex items-center gap-2">
                  <IconAward size={16} /> Award Incentive (Optional)
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {INCENTIVE_BADGES.map((badge) => {
                    const active = currentData.badgeAwarded === badge.id;
                    return (
                      <button
                        key={badge.id}
                        onClick={() => toggleBadge(badge.id)}
                        className={`p-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2`}
                        style={{
                          background: active ? badge.bg : "transparent",
                          borderColor: active ? badge.color : "var(--color-border)",
                          color: active ? badge.color : "var(--color-text-muted)"
                        }}
                      >
                        <IconAward size={14} /> {badge.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <div className="text-xs md:text-sm font-bold text-emerald-600 mb-3 flex items-center gap-2">
                  <IconCheck size={16} /> Notable Strengths
                </div>
                <div className="flex flex-wrap gap-2">
                  {STRENGTH_TRAITS.map(trait => (
                    <button
                      key={trait}
                      onClick={() => toggleStrength(trait)}
                      className={`trait-chip text-[10px] md:text-xs px-3 py-1.5 md:px-4 md:py-2 ${currentData.strengths.includes(trait) ? "strength" : ""}`}
                    >
                      {trait}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs md:text-sm font-bold text-amber-600 mb-3 flex items-center gap-2">
                  <IconClipboard size={16} /> Development Focus
                </div>
                <div className="flex flex-wrap gap-2">
                  {FOCUS_TRAITS.map(trait => (
                    <button
                      key={trait}
                      onClick={() => toggleFocus(trait)}
                      className={`trait-chip text-[10px] md:text-xs px-3 py-1.5 md:px-4 md:py-2 ${currentData.focusAreas.includes(trait) ? "focus-area" : ""}`}
                    >
                      {trait}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                4. KickXPro Report
              </h3>
              <button 
                onClick={generateSummary}
                className="text-[10px] md:text-xs font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 border border-emerald-200 group"
              >
                Auto Create <span className="group-hover:scale-110 transition-transform">📋</span>
              </button>
            </div>
            
            <div className="relative rounded-2xl p-1 bg-slate-900 shadow-xl overflow-hidden group">
               {/* Ambient Glow */}
               <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none transition-opacity group-focus-within:opacity-100 opacity-40" />
               <textarea
                className="relative z-10 w-full h-28 md:h-32 p-3 md:p-4 bg-slate-900/50 border border-slate-700/50 rounded-xl outline-none font-medium text-slate-100 text-xs md:text-sm leading-relaxed placeholder:text-slate-600 focus:border-emerald-500/40 transition-colors resize-none custom-scrollbar"
                placeholder="Click Auto Create or manually type tactical notes for this player..."
                value={currentData.summary}
                onChange={(e) => updateCurrentData({ summary: e.target.value })}
              />
            </div>
          </div>

        </div>
      </div>

      {/* Floating Save Button */}
      <div className="fixed bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-40 transition-transform">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 md:gap-3 px-6 md:px-8 py-3 md:py-4 rounded-full bg-slate-900 hover:bg-black text-white text-sm md:text-base font-bold tracking-wide transition-all shadow-2xl active:scale-95"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          <IconClipboard size={18} color="white" /> Save {DEMO_PLAYERS.find(p => p.id === activePlayerId)?.name.split(" ")[0]}'s Report
        </button>
      </div>

    </div>
  );
}
