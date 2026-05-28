/* ──────────────────────────────────────────────
   EVALUATE PLAYER (State Fix & Incentives)
   Each player has an isolated evaluation state.
   Includes "Award Badge" (Incentive) feature.
   ────────────────────────────────────────────── */
"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { STRENGTH_TRAITS, FOCUS_TRAITS, SKILL_METRICS } from "@/lib/constants";
import RadarChart from "@/components/RadarChart";
import { IconClipboard, IconCheck, IconAward } from "@/components/Icons";
import { supabase } from "@/lib/supabase";
import { IconTarget } from "@/components/Icons";
import { useAuth } from "@/lib/auth-context";

interface Player {
  id: string;
  pos: string;
  name: string;
}

interface EvalData {
  scores: Record<string, number>;
  strengths: string[];
  focusAreas: string[];
  summary: string;
  badgeAwarded: string | null;
  goalTitle: string;
  goalCategory: string;
  suggestedGoals: { title: string; category: string; selected: boolean }[];
  saved: boolean;
}

const DEFAULT_EVAL: EvalData = {
  scores: { pace: 65, shooting: 60, passing: 70, dribbling: 68, defending: 50, physical: 62 },
  strengths: [],
  focusAreas: [],
  summary: "",
  badgeAwarded: null,
  goalTitle: "",
  goalCategory: "technical",
  suggestedGoals: [],
  saved: false,
};

const INCENTIVE_BADGES = [
  { id: "motm", label: "Player of the Match", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  { id: "playmaker", label: "Playmaker", color: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
  { id: "rock", label: "Defensive Rock", color: "#10B981", bg: "rgba(16,185,129,0.1)" },
  { id: "workhorse", label: "Workhorse", color: "#8B5CF6", bg: "rgba(139,92,246,0.1)" },
];

function EvaluateContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get("session_id");

  const [players, setPlayers] = useState<Player[]>([]);
  const [activePlayerId, setActivePlayerId] = useState("");
  const [evaluations, setEvaluations] = useState<Record<string, EvalData>>({});
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  useEffect(() => {
    async function fetchPlayers() {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, position")
        .eq("role", "player")
        .eq("coach_id", user.id);

      if (data && data.length > 0) {
        const pList = data.map((d) => ({ 
          id: d.id, 
          name: d.full_name, 
          pos: d.position || d.full_name.substring(0, 2).toUpperCase() 
        }));
        setPlayers(pList);
        setActivePlayerId(pList[0].id);
      }
      setLoading(false);
    }
    fetchPlayers();
  }, [user]);

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

  const toggleSuggestedGoal = (index: number) => {
    const updated = [...currentData.suggestedGoals];
    updated[index].selected = !updated[index].selected;
    updateCurrentData({ suggestedGoals: updated });
  };

  const generateSummary = async () => {
    setGeneratingSummary(true);
    const activePlayer = players.find(p => p.id === activePlayerId);
    
    try {
      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: activePlayer?.name || "Player",
          scores: currentData.scores,
          strengths: currentData.strengths,
          focusAreas: currentData.focusAreas,
          badge: currentData.badgeAwarded ? INCENTIVE_BADGES.find(x => x.id === currentData.badgeAwarded)?.label : null
        })
      });
      const data = await response.json();
      
      const goals = (data.suggestedGoals || []).map((g: any) => ({ ...g, selected: true }));
      updateCurrentData({ summary: data.summary, suggestedGoals: goals });
    } catch (error) {
      console.error("Failed to generate summary", error);
      // Fallback
      const s = currentData.strengths.length > 0 ? `Showed great ${currentData.strengths.join(" and ")}.` : "";
      const f = currentData.focusAreas.length > 0 ? ` Needs to focus on ${currentData.focusAreas.join(" and ")} for the next session.` : "";
      const b = currentData.badgeAwarded ? ` Awarded the ${INCENTIVE_BADGES.find(x => x.id === currentData.badgeAwarded)?.label} badge!` : "";
      updateCurrentData({ 
        summary: `Solid performance today. ${s}${f}${b}`,
        suggestedGoals: currentData.focusAreas.map(fa => ({ title: `Practice your ${fa}`, category: 'technical', selected: true })).slice(0, 2)
      });
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleSave = async () => {
    if (!user || !activePlayerId) return;

    // Save evaluation to Supabase
    try {
       let evalSessionId = sessionId;

       // If no session linked, create a quick evaluation session
       if (!evalSessionId) {
         const { data: quickSession } = await supabase.from("sessions").insert({
           coach_id: user.id,
           title: "Quick Evaluation",
           session_type: "training",
           session_date: new Date().toISOString().split("T")[0],
           start_time: new Date().toTimeString().split(" ")[0],
           duration_mins: 0,
           notes: "Auto-created from quick evaluation"
         }).select("id").single();
         if (quickSession) evalSessionId = quickSession.id;
       }

       if (evalSessionId) {
         const { error: evalError } = await supabase.from("evaluations").upsert({
           session_id: evalSessionId,
           player_id: activePlayerId,
           coach_id: user.id,
           scores: currentData.scores,
           strengths: currentData.strengths,
           focus_areas: currentData.focusAreas,
           badge_awarded: currentData.badgeAwarded,
           summary: currentData.summary
         }, { onConflict: "session_id,player_id" });
         if (evalError) {
           console.error("Eval save error:", evalError);
           // Try insert if upsert fails (table may not have unique constraint yet)
           await supabase.from("evaluations").insert({
             session_id: evalSessionId,
             player_id: activePlayerId,
             coach_id: user.id,
             scores: currentData.scores,
             strengths: currentData.strengths,
             focus_areas: currentData.focusAreas,
             badge_awarded: currentData.badgeAwarded,
             summary: currentData.summary
           });
         }
       }

       // Save goals
       const goalsToSave = [];
       if (currentData.goalTitle.trim()) {
         goalsToSave.push({
           player_id: activePlayerId,
           coach_id: user.id,
           category: currentData.goalCategory,
           title: currentData.goalTitle.trim(),
           status: "not_started",
         });
       }

       currentData.suggestedGoals.forEach(g => {
         if (g.selected) {
           goalsToSave.push({
             player_id: activePlayerId,
             coach_id: user.id,
             category: g.category || "technical",
             title: g.title,
             status: "not_started",
           });
         }
       });

       if (goalsToSave.length > 0) {
         await supabase.from("goals").insert(goalsToSave);
       }
    } catch (err) {
       console.error(err);
    }

    updateCurrentData({ saved: true });
    setShowToast(true);
    
    setTimeout(() => {
      setShowToast(false);
      // Auto move to next unsaved player
      const currentIndex = players.findIndex(p => p.id === activePlayerId);
      if (currentIndex < players.length - 1) {
        setActivePlayerId(players[currentIndex + 1].id);
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

  if (loading) return <div className="p-10 text-center text-slate-500 font-medium">Loading roster...</div>;
  if (!players.length) return <div className="p-10 text-center text-slate-500 font-medium border border-slate-200 bg-white rounded-xl mx-5 mt-10">No players assigned to your squad yet. Add players to evaluate them.</div>;

  return (
    <div className="max-w-5xl mx-auto pb-32 relative px-4 xl:px-0">
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-slide-in font-bold">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <IconCheck size={14} color="white" />
          </div>
          Evaluation Saved for {players.find(p => p.id === activePlayerId)?.name}!
        </div>
      )}

      {/* Header */}
      <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2 text-slate-900" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}>Player Evaluation</h1>
          <p className="text-slate-500 font-medium text-xs md:text-sm">
            {sessionId ? "Rate your players after the session." : "Rate your players. A session will be created automatically."}
          </p>
        </div>
        
        {/* Overall Score Badge */}
        <div className="flex items-center gap-3 bg-white px-3 md:px-4 py-2 rounded-2xl shadow-sm border border-slate-100 self-start md:self-auto">
           <span className="text-[10px] md:text-xs font-bold text-slate-400 tracking-wider">OVERALL</span>
           <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-lg md:text-xl font-black text-white shadow-inner" style={{ background: "linear-gradient(135deg, #10B981, #059669)", fontFamily: "var(--font-heading)" }}>
             {(overallScore / 10).toFixed(1)}
           </div>
        </div>
      </div>

      {/* Step 1: Select Player */}
      <h3 className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">1. Select Player</h3>
      <div className="flex overflow-x-auto gap-2 md:gap-3 pb-4 mb-6 custom-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
        {players.map((player) => {
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
                {isSaved ? <IconCheck size={12} /> : player.pos}
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
             <h3 className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">2. Adjust Core Attributes (1-10)</h3>
             <div className="card-static p-4 md:p-6 space-y-6 md:space-y-7">
              {SKILL_METRICS.map((metric) => {
                const rawVal = currentData.scores[metric.key] || 1;
                const displayVal = Math.max(1, Math.round(rawVal / 10)); // 1 to 10
                const widthPercent = (displayVal / 10) * 100;
                
                return (
                  <div key={metric.key}>
                    <div className="flex justify-between text-[10px] md:text-xs font-bold mb-2 md:mb-3 uppercase tracking-wider text-slate-600">
                      <span>{metric.label}</span>
                      <span className="text-emerald-600 text-xs md:text-sm font-black">{displayVal}</span>
                    </div>
                    <div className="relative h-3 md:h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 shadow-inner">
                      <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-300 ease-out" 
                           style={{ 
                             width: `${widthPercent}%`, 
                             background: displayVal < 4 ? "linear-gradient(90deg, #F87171, #EF4444)" : displayVal < 8 ? "linear-gradient(90deg, #FBBF24, #F59E0B)" : "linear-gradient(90deg, #34D399, #10B981)" 
                           }} 
                      />
                      {/* Visible Thumb Knob */}
                      <div 
                        className="absolute top-1/2 -translate-y-1/2 w-6 h-6 md:w-7 md:h-7 rounded-full bg-white shadow-lg border-2 flex items-center justify-center text-[10px] font-black transition-all duration-300 ease-out pointer-events-none z-10"
                        style={{ 
                          left: `calc(${widthPercent}% - 14px)`,
                          borderColor: displayVal < 4 ? "#EF4444" : displayVal < 8 ? "#F59E0B" : "#10B981",
                          color: displayVal < 4 ? "#EF4444" : displayVal < 8 ? "#F59E0B" : "#10B981"
                        }}
                      >
                        {displayVal}
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={displayVal}
                        onChange={(e) => handleScoreChange(metric.key, parseInt(e.target.value) * 10)}
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

           {/* Step 5: Assign Goal */}
           <div className="pt-2">
             <h3 className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
               <IconTarget size={14} color="#10B981" /> 5. Assign Goal (Optional)
             </h3>
             <div className="card-static p-4 md:p-5 space-y-4 border-2 border-dashed border-emerald-100">
               <div className="flex flex-wrap gap-2">
                 {["technical", "tactical", "physical", "discipline"].map(cat => (
                   <button
                     key={cat}
                     onClick={() => updateCurrentData({ goalCategory: cat })}
                     className="px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all capitalize"
                     style={{
                       background: currentData.goalCategory === cat ? "rgba(16,185,129,0.1)" : "#FFF",
                       color: currentData.goalCategory === cat ? "#059669" : "var(--color-text-muted)",
                       borderColor: currentData.goalCategory === cat ? "#10B981" : "var(--color-border)",
                     }}
                   >
                     {cat}
                   </button>
                 ))}
               </div>
               <input
                 type="text"
                 className="input text-sm"
                 placeholder="e.g. Improve weak foot passing accuracy"
                 value={currentData.goalTitle}
                 onChange={e => updateCurrentData({ goalTitle: e.target.value })}
               />

               {currentData.suggestedGoals.length > 0 && (
                 <div className="mt-4 pt-4 border-t border-emerald-100/50">
                   <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                     <IconAward size={12} color="#F59E0B" /> AI Suggested Quests
                   </div>
                   <div className="space-y-2">
                     {currentData.suggestedGoals.map((goal, idx) => (
                       <label key={idx} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 bg-white hover:bg-slate-50 cursor-pointer transition-colors group">
                         <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0 ${goal.selected ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-300'}`}>
                           {goal.selected && <IconCheck size={12} />}
                         </div>
                         <div>
                           <div className="text-sm font-medium text-slate-700">{goal.title}</div>
                           <div className="text-[10px] font-bold text-slate-400 uppercase">{goal.category}</div>
                         </div>
                       </label>
                     ))}
                   </div>
                 </div>
               )}
             </div>
           </div>

         </div>

          <div className="pt-2">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                4. KickXPro Report
              </h3>
              <div className="flex gap-2">
                {currentData.summary && (
                  <button 
                    onClick={generateSummary}
                    disabled={generatingSummary}
                    className="text-[10px] md:text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 border border-slate-200 group disabled:opacity-50"
                  >
                    {generatingSummary ? "..." : "Regenerate"} <span className="group-hover:rotate-180 transition-transform block">🔄</span>
                  </button>
                )}
                <button 
                  onClick={generateSummary}
                  disabled={generatingSummary}
                  className="text-[10px] md:text-xs font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 border border-emerald-200 group disabled:opacity-50"
                >
                  {generatingSummary ? "AI Thinking..." : "Auto Create"} <span className="group-hover:scale-110 transition-transform block">📋</span>
                </button>
              </div>
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
          <IconClipboard size={18} color="white" /> Save {players.find(p => p.id === activePlayerId)?.name.split(" ")[0]}'s Report
        </button>
      </div>

    </div>
  );
}

export default function EvaluatePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading evaluation...</div>}>
      <EvaluateContent />
    </Suspense>
  );
}
