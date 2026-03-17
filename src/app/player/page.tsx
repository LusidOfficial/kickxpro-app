/* ──────────────────────────────────────────────
   PLAYER DASHBOARD (Light Theme + Finesse)
   Crisp overview, interactive goals, coach rating,
   and new messaging inbox.
   ────────────────────────────────────────────── */
"use client";

import { useState } from "react";
import StatCard from "@/components/StatCard";
import RadarChart from "@/components/RadarChart";
import StreakIndicator from "@/components/StreakIndicator";
import RankBadge from "@/components/RankBadge";
import { COACH_TAGS } from "@/lib/constants";
import { 
  IconClipboard, IconCheck, IconActivity, IconFire, IconStar, 
  IconUser, IconMessageSquare, IconTrendingUp, IconTarget, IconAward, IconShield, IconPlay
} from "@/components/Icons";

/* ── Demo data ── */
const DEMO_COACH = {
  name: "Coach Anita",
  specialty: "High Performance Strategy",
  academy: "Trinity FC",
  avatar: "CA",
};

const LATEST_EVAL = {
  date: "14-03-2026",
  overallScore: 84,
  summary: "Solid performance today. Showed great Vision and Composure. Needs to focus on Weak Foot and Stamina for the next session.",
  strengths: ["Vision", "Composure"],
  focusAreas: ["Weak Foot", "Stamina"],
  radarData: [
    { label: "PAC", value: 3.5 },
    { label: "SHO", value: 4.0 },
    { label: "PAS", value: 4.5 },
    { label: "DRI", value: 3.8 },
    { label: "DEF", value: 2.5 },
    { label: "PHY", value: 3.2 },
  ],
};

const DEMO_MESSAGES = [
  { id: 1, from: "Coach Anita", text: "Great work on your passing drills yesterday. Keep reviewing the tape.", time: "2h ago", unread: true },
  { id: 2, from: "Admin", text: "Your subscription renews next week.", time: "1d ago", unread: false },
];

export default function PlayerDashboard() {
  const [goals, setGoals] = useState([
    { id: 1, text: "Improve weak foot passing", done: false },
    { id: 2, text: "Complete 5 feedback sessions", done: true },
    { id: 3, text: "Maintain 10-day streak", done: false },
  ]);

  const [showFAQ, setShowFAQ] = useState(false);
  const [inviteToast, setInviteToast] = useState(false);

  const toggleGoal = (id: number) => {
    setGoals(goals.map(g => g.id === id ? { ...g, done: !g.done } : g));
  };

  const handleInvite = () => {
    setInviteToast(true);
    setTimeout(() => setInviteToast(false), 3000);
  };

  const [coachRating, setCoachRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const submitRating = () => {
    setRatingSubmitted(true);
    setTimeout(() => {
      setRatingSubmitted(false);
      setCoachRating(0);
      setSelectedTags([]);
    }, 3000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      
      {/* Header Profile Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
           <div className="relative group cursor-pointer">
             <div className="w-20 h-20 md:w-24 md:h-24 rounded-[2rem] bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-3xl font-black text-white shadow-lg border-4 border-white overflow-hidden transition-transform group-hover:scale-105">
               AM
               {/* Hover Overlay for Upload */}
               <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
               </div>
               <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" title="Upload profile picture" />
             </div>
             <div className="absolute -bottom-2 -right-2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg border-2 border-white pointer-events-none">
               ST
             </div>
           </div>
           
           <div>
             <h1 className="text-3xl md:text-4xl font-bold mb-1 text-slate-900" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}>
               Arjun <span className="text-emerald-600">M.</span>
             </h1>
             <div className="flex items-center gap-3 text-xs md:text-sm font-bold text-slate-500 uppercase tracking-widest">
                <span>AGE 18</span>
                <span>•</span>
                <span>KickXPro Pilot</span>
             </div>
             
             {/* Earned Badges Row */}
             <div className="flex gap-2 mt-3">
               <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-bold border border-amber-100">
                 <IconAward size={12} /> Player of the Match
               </div>
               <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold border border-blue-100">
                 <IconAward size={12} /> Playmaker
               </div>
             </div>
           </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard value="12" label="Sessions" icon={<IconClipboard />} delay={0.1} />
        <StatCard value="85%" label="Attendance" icon={<IconActivity />} accentColor="#3B82F6" delay={0.15} />
        <StatCard value="8" label="Evaluations" icon={<IconTrendingUp />} accentColor="#10B981" delay={0.2} />
        <StatCard value="3" label="Day Streak" icon={<IconFire />} accentColor="#F59E0B" delay={0.25} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Radar & Progress (2 cols) */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="card-static p-8 relative overflow-hidden">
            {/* Soft background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-50 rounded-full blur-3xl opacity-50 pointer-events-none" />
            
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-6 relative z-10 uppercase tracking-widest">
              <IconTarget size={18} color="#059669" /> Current Skill Radar
            </div>
            
            <div className="relative z-10 flex justify-center -mt-4">
              <RadarChart data={LATEST_EVAL.radarData} size={300} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StreakIndicator 
              streak={3} 
              records={[
                { date: "15-03", present: true },
                { date: "14-03", present: true },
                { date: "13-03", present: true },
                { date: "12-03", present: false },
                { date: "11-03", present: true },
              ]} 
              maxDots={14} 
            />
            <RankBadge avgScore={3.8} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Weekly Performance Spark */}
            <div className="card-static p-5 bg-white shadow-sm border border-slate-200/60 rounded-2xl relative overflow-hidden group">
               <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                 Weekly Effort Spark
                 <span className="text-emerald-500 font-black">+12%</span>
               </h3>
               <div className="flex items-end h-16 gap-1 mt-2">
                 {[6, 8, 7, 5, 9, 8, 9].map((val, i) => (
                   <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 group/bar relative">
                     <div 
                       className="w-full rounded-t-sm transition-all duration-500 ease-out group-hover/bar:bg-emerald-400 cursor-pointer"
                       style={{ 
                         height: `${(val / 10) * 100}%`,
                         background: val >= 8 ? "#10B981" : val >= 6 ? "#3B82F6" : "#94A3B8"
                       }}
                     />
                     {/* Tooltip on hover */}
                     <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none z-10">
                       {val}/10
                     </div>
                   </div>
                 ))}
               </div>
            </div>

            {/* Next Session */}
            <div className="card-static p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl relative overflow-hidden group">
               <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl group-hover:bg-emerald-500/30 transition-colors pointer-events-none" />
               <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 relative z-10">
                 <IconPlay size={14} color="#10B981" /> Next Session
               </h3>
               <div className="relative z-10">
                 <div className="text-2xl font-black font-heading mb-1 tracking-tight">Wed, 5:30 PM</div>
                 <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 rounded inline-block">
                   Tactical Focus
                 </div>
               </div>
            </div>
          </div>

        </div>

        {/* Right Col: Coach & Feedback */}
        <div className="space-y-8">
          
          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={handleInvite}
              className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl shadow-md font-bold text-xs md:text-sm hover:scale-105 transition-transform"
            >
              <IconUser size={16} /> Invite Friend
            </button>
            <button 
              onClick={() => setShowFAQ(true)} 
              className="flex items-center justify-center gap-2 p-3 bg-white text-slate-700 border border-slate-200 rounded-xl shadow-sm font-bold text-xs md:text-sm hover:bg-slate-50 transition-colors group"
            >
              <IconShield size={16} className="text-slate-400 group-hover:text-blue-500 transition-colors" /> How it Works
            </button>
          </div>

          {/* Coach Card & Inbox */}
          <div className="card-static p-6 relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-50 rounded-full blur-2xl group-hover:bg-blue-100 transition-colors pointer-events-none" />
            
            <div className="flex items-center justify-between mb-4 relative z-10">
               <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                 <IconUser size={16} color="#3B82F6" /> Your Coach
               </h3>
               <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{DEMO_COACH.academy}</span>
            </div>

            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 text-white flex items-center justify-center text-lg font-black shadow-md border-2 border-white">
                {DEMO_COACH.avatar}
              </div>
              <div>
                <div className="font-bold text-slate-900 tracking-tight text-lg">{DEMO_COACH.name}</div>
                <div className="text-xs font-medium text-slate-500">{DEMO_COACH.specialty}</div>
              </div>
            </div>

            {/* NEW: Messages Inbox */}
            <div className="pt-4 border-t border-slate-100 relative z-10">
               <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                 Direct Messages
                 <span className="bg-amber-100 text-amber-700 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">1</span>
               </h4>
               <div className="space-y-2">
                 {DEMO_MESSAGES.map(msg => (
                   <div key={msg.id} className={`p-3 rounded-xl border ${msg.unread ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-transparent'} transition-colors cursor-pointer hover:border-blue-200`}>
                     <div className="flex justify-between items-center mb-1">
                       <span className={`text-xs font-bold ${msg.unread ? 'text-blue-900' : 'text-slate-700'}`}>{msg.from}</span>
                       <span className="text-[10px] text-slate-400 font-medium">{msg.time}</span>
                     </div>
                     <p className={`text-xs leading-relaxed ${msg.unread ? 'text-blue-800' : 'text-slate-500'}`}>{msg.text}</p>
                   </div>
                 ))}
               </div>
            </div>
          </div>

          {/* Goals (Interactive) */}
          <div className="card-static p-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <IconTarget size={16} color="#10B981" /> Active Goals
            </h3>
            <div className="space-y-3">
              {goals.map((g) => (
                <button
                  key={g.id}
                  onClick={() => toggleGoal(g.id)}
                  className="goal-btn w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group"
                >
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${g.done ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' : 'border-slate-300 bg-white group-hover:border-emerald-400'}`}>
                    {g.done && <IconCheck size={12} />}
                  </div>
                  <span className={`text-sm font-medium transition-colors ${g.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                    {g.text}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Coach Rating */}
          <div className="card-static p-6 border-2 border-transparent hover:border-amber-100 transition-colors">
            {ratingSubmitted ? (
               <div className="text-center py-8 animate-scale-in">
                 <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                   <IconCheck size={32} />
                 </div>
                 <div className="font-bold text-slate-900 mb-1">Rating Submitted!</div>
                 <div className="text-xs text-slate-500">Thank you for your feedback.</div>
               </div>
            ) : (
                <>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <IconStar size={16} color="#F59E0B" /> Rate Your Coach
                </h3>
                <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                  How was your last session with {DEMO_COACH.name.split(" ")[0]}? Your feedback builds their profile.
                </p>
                
                <div className="flex gap-2 mb-6 justify-center bg-slate-50 py-3 rounded-xl border border-slate-100">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      className="star-btn"
                      onClick={() => setCoachRating(star)}
                    >
                      <IconStar size={28} color={star <= coachRating ? "#F59E0B" : "#CBD5E1"} />
                    </button>
                  ))}
                </div>

                {coachRating > 0 && (
                  <div className="animate-fade-up">
                    <div className="text-xs font-bold text-slate-600 mb-3">What stood out? (Optional)</div>
                    <div className="flex flex-wrap gap-2 mb-5">
                      {COACH_TAGS.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            selectedTags.includes(tag) 
                            ? "bg-amber-50 text-amber-700 border-amber-200 shadow-sm" 
                            : "bg-white text-slate-500 border-slate-200 hover:border-amber-100 hover:bg-slate-50"
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                    <button 
                      onClick={submitRating}
                      className="w-full btn-primary shadow-md hover:shadow-lg transition-shadow"
                    >
                      Submit Evaluation
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </div>
      {/* Top Level Toasts & Modals */}
      {inviteToast && (
        <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center justify-center gap-3 z-50 animate-slide-in font-bold text-sm">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <IconCheck size={14} color="white" />
          </div>
          Invite link copied! Your coach will approve them.
        </div>
      )}

      {showFAQ && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowFAQ(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 md:p-8 animate-scale-in relative border border-slate-100" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowFAQ(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 w-8 h-8 rounded-full flex items-center justify-center">
               ✕
            </button>
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3" style={{ fontFamily: "var(--font-heading)" }}>
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center"><IconShield size={20} /></div> 
              KickXPro Guide
            </h2>
            
            <div className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2"><IconTrendingUp size={16} color="#10B981" /> Player Tiers & Ranks</h4>
                <p className="text-xs text-slate-600 leading-relaxed">Your Rank (e.g., Academy Prospect, First Team) is calculated by your rolling average Evaluation Score over your last training sessions. Consistently score above 80 to rank up!</p>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2"><IconActivity size={16} color="#3B82F6" /> Improvement Rate</h4>
                <p className="text-xs text-slate-600 leading-relaxed">This metric shows how fast you are growing. If your core attributes in the Radar Chart expand week-over-week, your Improvement Rate spikes, increasing your odds of a team promotion.</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2"><IconUser size={16} color="#F59E0B" /> Inviting Teammates</h4>
                <p className="text-xs text-slate-600 leading-relaxed">When you invite a friend, they are sent directly to your Coach's approval queue. Once accepted, they join your team roster automatically and can compare stats.</p>
              </div>
            </div>

            <button onClick={() => setShowFAQ(false)} className="w-full mt-8 btn-primary font-bold py-3.5 shadow-md">Got it, let's play!</button>
          </div>
        </div>
      )}

    </div>
  );
}
