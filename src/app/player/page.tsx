/* ──────────────────────────────────────────────
   PLAYER DASHBOARD (Light Theme + Finesse)
   Crisp overview, interactive goals, coach rating,
   and new messaging inbox.
   ────────────────────────────────────────────── */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import StatCard from "@/components/StatCard";
import RadarChart from "@/components/RadarChart";
import StreakIndicator from "@/components/StreakIndicator";
import RankBadge from "@/components/RankBadge";
import { COACH_TAGS, SKILL_METRICS } from "@/lib/constants";
import { 
  IconClipboard, IconCheck, IconActivity, IconFire, IconStar, 
  IconUser, IconMessageSquare, IconTrendingUp, IconTarget, IconAward, IconShield, IconPlay
} from "@/components/Icons";

/* ── Default state for fallback ── */
const FALLBACK_EVAL = {
  date: "--",
  overallScore: 0,
  summary: "No sessions evaluated yet.",
  strengths: [],
  focusAreas: [],
  radarData: SKILL_METRICS.map(m => ({ label: m.short, value: 0 })),
};

const DEMO_MESSAGES: any[] = [];

export default function PlayerDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Real Data State
  const [profile, setProfile] = useState<any>(null);
  const [coachProfile, setCoachProfile] = useState<any>(null);
  const [latestEval, setLatestEval] = useState<any>(FALLBACK_EVAL);
  const [stats, setStats] = useState({ sessions: 0, attendance: 0, evaluations: 0, streak: 0 });
  const [loading, setLoading] = useState(true);

  const [goals, setGoals] = useState<any[]>([]);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showMedical, setShowMedical] = useState(false);
  const [medicalReason, setMedicalReason] = useState("");
  const [medicalDetails, setMedicalDetails] = useState("");
  const [sendingMedical, setSendingMedical] = useState(false);
  const [inviteToast, setInviteToast] = useState(false);
  const [feeStatus, setFeeStatus] = useState<"Paid" | "Pending" | null>(null);
  const [nextSession, setNextSession] = useState<{ title: string; date: string; time: string; type: string; duration: number; daysUntil: number; curriculum?: string } | null>(null);
  
  // Live session for parents
  const [liveSession, setLiveSession] = useState<{ title: string; startTime: string; elapsed: number } | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      
      // 1. Fetch Profile
      const { data: pData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (pData) {
        setProfile(pData);
        // 2. Fetch Coach
        if (pData.coach_id) {
           const { data: cData } = await supabase.from("profiles").select("*").eq("id", pData.coach_id).single();
           if (cData) setCoachProfile(cData);
        }
      }

      // 3. Fetch Evaluations
      const { data: evals } = await supabase.from("evaluations").select("*").eq("player_id", user.id).order("created_at", { ascending: false });
      
      if (evals && evals.length > 0) {
        const latest = evals[0];
        
        // Calculate rolling average across all evaluations (matching printable report card)
        const skillAverages = SKILL_METRICS.map(m => {
          const scores = evals.map(e => e.scores?.[m.key]).filter((v): v is number => v != null && v > 0);
          const avg = scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : null;
          return { avg };
        });
        const ratedSkills = skillAverages.filter(s => s.avg !== null);
        const rollingOverallAvg = ratedSkills.length > 0 ? ratedSkills.reduce((s, t) => s + (t.avg || 0), 0) / ratedSkills.length : 0;

        const formattedRadar = SKILL_METRICS.map(m => ({ 
           label: m.short, 
           value: ((latest.scores && latest.scores[m.key]) || 1) / 20 
         }));

        setLatestEval({
          date: new Date(latest.created_at).toLocaleDateString(),
          overallScore: rollingOverallAvg,
          summary: latest.summary || "No notes provided.",
          strengths: latest.strengths || [],
          focusAreas: latest.focus_areas || [],
          radarData: formattedRadar,
          badgeAwarded: latest.badge_awarded,
        });

        // Calculate simple stats
        setStats({
          sessions: evals.length, 
          attendance: 100, // mock attendance %
          evaluations: evals.length,
          streak: evals.length > 0 ? 1 : 0
        });
      }

      // 4. Fetch Goals from DB
      const { data: goalsData } = await supabase
        .from("goals")
        .select("*")
        .eq("player_id", user.id)
        .in("status", ["not_started", "in_progress", "achieved"])
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (goalsData) setGoals(goalsData);

      // 5b. Fetch fees status for this player
      const currentMonth = new Date().toISOString().slice(0, 7);
      const { data: feeData } = await supabase
        .from("fees")
        .select("status")
        .eq("player_id", user.id)
        .eq("month", currentMonth)
        .single();
      if (feeData) setFeeStatus(feeData.status === "Paid" ? "Paid" : "Pending");
      else setFeeStatus(null);

      // 5a. Fetch next upcoming session from coach
      if (pData?.coach_id) {
        const todayStr = new Date().toISOString().split("T")[0];
        const { data: nextSess } = await supabase
          .from("sessions")
          .select("title, session_date, start_time, session_type, duration_mins, notes")
          .eq("coach_id", pData.coach_id)
          .gte("session_date", todayStr)
          .order("session_date", { ascending: true })
          .limit(1)
          .single();
        if (nextSess) {
          const sessDate = new Date(nextSess.session_date);
          const todayDate = new Date(todayStr);
          const diffDays = Math.ceil((sessDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
          setNextSession({
            title: nextSess.title,
            date: sessDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
            time: nextSess.start_time?.slice(0, 5) || "TBD",
            type: nextSess.session_type || "training",
            duration: nextSess.duration_mins || 60,
            daysUntil: diffDays,
            curriculum: nextSess.notes || undefined,
          });
        }
      }

      // 5. Fetch recent messages
      if (pData?.coach_id) {
        const { data: msgData } = await supabase
          .from("messages")
          .select("*")
          .or(`sender_id.eq.${pData.coach_id},receiver_id.eq.${pData.coach_id}`)
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order("created_at", { ascending: false })
          .limit(3);

        if (msgData) {
          setRecentMessages(msgData.map(m => ({
            id: m.id,
            from: m.sender_id === user.id ? "You" : (coachProfile?.full_name || "Coach"),
            text: m.content,
            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            unread: !m.read_status && m.sender_id !== user.id
          })));
        }
      }

      setLoading(false);
    }
    loadData();
  }, [user]);

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
        // compute elapsed manually since we just have start_time as 'HH:MM:SS'
        const start = new Date(`${data.session_date}T${data.start_time}`);
        const diff = Math.max(0, Math.floor((Date.now() - start.getTime()) / 1000));
        setLiveSession({ title: data.title, startTime: data.start_time, elapsed: diff });
      } else {
        setLiveSession(null);
      }
    }

    checkLive();
    const interval = setInterval(checkLive, 10000); // Check every 10 seconds
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

  const toggleGoal = async (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const newStatus = goal.status === "achieved" ? "in_progress" : "achieved";
    await supabase.from("goals").update({ status: newStatus }).eq("id", goalId);
    setGoals(goals.map(g => g.id === goalId ? { ...g, status: newStatus } : g));
  };

  const handleInvite = async () => {
    try {
      const inviteUrl = `${window.location.origin}/register?ref=${user?.id?.slice(0,8) || 'kickxpro'}`;
      await navigator.clipboard.writeText(inviteUrl);
    } catch { /* fallback: do nothing */ }
    setInviteToast(true);
    setTimeout(() => setInviteToast(false), 3000);
  };

  const [coachRating, setCoachRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const submitRating = async () => {
    if (!user || !coachProfile || coachRating === 0) return;
    try {
      const { error } = await supabase.from("coach_ratings").upsert({
        coach_id: coachProfile.id,
        player_id: user.id,
        rating: coachRating,
        tags: selectedTags,
      }, { onConflict: "coach_id,player_id" });
      if (error) console.error("Rating save error:", error);
    } catch (e) {
      console.error("Failed to save rating:", e);
    }
    setRatingSubmitted(true);
    setTimeout(() => {
      setRatingSubmitted(false);
      setCoachRating(0);
      setSelectedTags([]);
    }, 3000);
  };

  const submitMedical = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !coachProfile || !medicalReason) return;
    setSendingMedical(true);
    
    const messageContent = `[MEDICAL/ABSENCE REPORT]\nReason: ${medicalReason}\nDetails: ${medicalDetails || "None provided"}`;
    
    await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: coachProfile.id,
      content: messageContent,
    });
    
    setSendingMedical(false);
    setShowMedical(false);
    setMedicalReason("");
    setMedicalDetails("");
    setInviteToast(true); // Re-using toast for success
    setTimeout(() => setInviteToast(false), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">

      {/* ── FEES REMINDER BANNER (orange, shown if pending) ── */}
      {feeStatus === "Pending" && (
        <div className="flex items-center gap-4 px-5 py-4 rounded-2xl border-2 animate-fade-up"
          style={{ background: "rgba(249,115,22,0.06)", borderColor: "rgba(249,115,22,0.25)" }}>
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">💳</span>
          </div>
          <div className="flex-1">
            <div className="font-bold text-orange-700 text-sm">Monthly Fee Pending</div>
            <div className="text-orange-600 text-xs font-medium mt-0.5">Your fee payment for this month hasn't been received yet. Please contact your coach.</div>
          </div>
          <div className="px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0" style={{ background: "rgba(249,115,22,0.12)", color: "#C2410C" }}>Pending</div>
        </div>
      )}
      
      {/* ── LIVE SESSION BANNER (shown to parents/players if running) ── */}
      {liveSession && (
        <div className="flex items-center gap-4 px-5 py-4 rounded-2xl border-2 animate-fade-up bg-emerald-500 text-white"
          style={{ borderColor: "#059669" }}>
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 animate-pulse">
            <IconActivity size={24} color="white" />
          </div>
          <div className="flex-1">
            <div className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              Live Session in Progress
            </div>
            <div className="font-medium mt-0.5 text-emerald-50">
              {liveSession.title}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black font-mono">
              {Math.floor(liveSession.elapsed / 60).toString().padStart(2, '0')}:{(liveSession.elapsed % 60).toString().padStart(2, '0')}
            </div>
            <div className="text-[10px] font-bold uppercase text-emerald-100 opacity-80">Elapsed</div>
          </div>
        </div>
      )}

      {/* Header Profile Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
           <div className="relative group cursor-pointer">
             <div className="w-20 h-20 md:w-24 md:h-24 rounded-[2rem] bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-3xl font-black text-white shadow-lg border-4 border-white overflow-hidden transition-transform group-hover:scale-105">
               {profile?.full_name ? profile.full_name.substring(0,2).toUpperCase() : "P"}
               {/* Hover Overlay for Upload */}
               <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
               </div>
             </div>
             <div className="absolute -bottom-2 -right-2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg border-2 border-white pointer-events-none">
               {profile?.position || "PLY"}
             </div>
           </div>
           
           <div>
             <h1 className="text-3xl md:text-4xl font-bold mb-1 text-slate-900" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}>
               {profile?.full_name || "Academy Player"}
             </h1>
             <div className="flex items-center gap-3 text-xs md:text-sm font-bold text-slate-500 uppercase tracking-widest">
                <span>AGE {profile?.age || "--"}</span>
                <span>•</span>
                <span>KickXPro Player</span>
             </div>
             
             {/* Earned Badges Row */}
             {latestEval.badgeAwarded && (
               <div className="flex gap-2 mt-3">
                 <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-bold border border-amber-100">
                   <IconAward size={12} /> {latestEval.badgeAwarded}
                 </div>
               </div>
             )}
           </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard value={stats.sessions.toString()} label="Sessions" icon={<IconClipboard />} delay={0.1} />
        <StatCard value={`${stats.attendance}%`} label="Attendance" icon={<IconActivity />} accentColor="#3B82F6" delay={0.15} />
        <StatCard value={stats.evaluations.toString()} label="Evaluations" icon={<IconTrendingUp />} accentColor="#10B981" delay={0.2} />
        <StatCard value={stats.streak.toString()} label="Day Streak" icon={<IconFire />} accentColor="#F59E0B" delay={0.25} />
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
              <RadarChart data={latestEval.radarData} size={300} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <StreakIndicator 
              streak={stats.streak} 
              records={[
                { date: "Current", present: true },
              ]} 
              maxDots={7} 
            />
            <RankBadge avgScore={latestEval.overallScore} tier={profile?.tier} />
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
            <div className="card-static p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl relative overflow-hidden group cursor-pointer" onClick={() => router.push('/player/schedule')}>
               <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl group-hover:bg-emerald-500/30 transition-colors pointer-events-none" />
               <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 relative z-10">
                 <IconPlay size={14} color="#10B981" /> Next Session
               </h3>
               <div className="relative z-10">
                 {nextSession ? (
                   <>
                     <div className="text-2xl font-black font-heading mb-1 tracking-tight">{nextSession.date}, {nextSession.time}</div>
                     <div className="flex items-center gap-2">
                       <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 rounded inline-block">
                         {nextSession.type.replace('_', ' ')}
                       </span>
                       <span className="text-[10px] font-bold text-slate-400">{nextSession.duration} min</span>
                     </div>
                     {nextSession.daysUntil === 0 && <div className="mt-2 text-xs font-black text-emerald-400 animate-pulse">🔴 TODAY</div>}
                     {nextSession.daysUntil === 1 && <div className="mt-2 text-xs font-bold text-amber-400">Tomorrow</div>}
                     {nextSession.daysUntil > 1 && <div className="mt-2 text-xs font-bold text-slate-500">In {nextSession.daysUntil} days</div>}
                     {nextSession.curriculum && (
                       <div className="mt-4 pt-3 border-t border-slate-700/50">
                         <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Curriculum</div>
                         <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                           {nextSession.curriculum}
                         </p>
                       </div>
                     )}
                   </>
                 ) : (
                   <>
                     <div className="text-lg font-bold text-slate-500 mb-1">No Upcoming Session</div>
                     <div className="text-xs text-slate-600">Check with your coach for the schedule.</div>
                   </>
                 )}
               </div>
            </div>
          </div>

        </div>

        {/* Right Col: Coach & Feedback */}
        <div className="space-y-8">
          
          {/* Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <button 
              onClick={handleInvite}
              className="flex items-center justify-center gap-1.5 p-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl shadow-md font-bold text-xs hover:scale-105 transition-transform"
            >
              <IconUser size={16} /> Invite
            </button>
            <button 
              onClick={() => setShowMedical(true)} 
              className="flex items-center justify-center gap-1.5 p-3 bg-white text-rose-600 border border-rose-200 rounded-xl shadow-sm font-bold text-xs hover:bg-rose-50 transition-colors group"
            >
              <IconActivity size={16} className="text-rose-500 group-hover:text-rose-600 transition-colors" /> Medical
            </button>
            <button 
              onClick={() => setShowFAQ(true)} 
              className="flex items-center justify-center gap-1.5 p-3 bg-white text-slate-700 border border-slate-200 rounded-xl shadow-sm font-bold text-xs md:col-span-1 col-span-2 hover:bg-slate-50 transition-colors group"
            >
              <IconShield size={16} className="text-slate-400 group-hover:text-blue-500 transition-colors" /> Help
            </button>
          </div>

          {/* Coach Card & Inbox */}
          <div className="card-static p-6 relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-50 rounded-full blur-2xl group-hover:bg-blue-100 transition-colors pointer-events-none" />
            
            <div className="flex items-center justify-between mb-4 relative z-10">
               <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                 <IconUser size={16} color="#3B82F6" /> Your Coach
               </h3>
               <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">Academy Team</span>
            </div>

            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 text-white flex items-center justify-center text-lg font-black shadow-md border-2 border-white">
                {coachProfile?.full_name ? coachProfile.full_name.substring(0,2).toUpperCase() : "C"}
              </div>
              <div>
                <div className="font-bold text-slate-900 tracking-tight text-lg">{coachProfile ? coachProfile.full_name : "Unassigned"}</div>
                <div className="text-xs font-medium text-slate-500">{coachProfile ? "Head Coach" : "Contact academy"}</div>
              </div>
            </div>

            {/* NEW: Messages Inbox */}
            <div className="pt-4 border-t border-slate-100 relative z-10">
               <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                 <span className="flex items-center gap-2">
                   Direct Messages
                   {recentMessages.filter(m => m.unread).length > 0 && (
                     <span className="bg-amber-100 text-amber-700 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">{recentMessages.filter(m => m.unread).length}</span>
                   )}
                 </span>
                 <button onClick={() => router.push("/player/messages")} className="text-[10px] font-bold text-emerald-600 hover:text-emerald-800 transition-colors">View All →</button>
               </h4>
               <div className="space-y-2">
                 {recentMessages.length === 0 ? (
                   <p className="text-xs text-slate-400 py-2">No messages yet.</p>
                 ) : recentMessages.map(msg => (
                   <div key={msg.id} onClick={() => router.push("/player/messages")} className={`p-3 rounded-xl border ${msg.unread ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-transparent'} transition-colors cursor-pointer hover:border-blue-200`}>
                     <div className="flex justify-between items-center mb-1">
                       <span className={`text-xs font-bold ${msg.unread ? 'text-blue-900' : 'text-slate-700'}`}>{msg.from}</span>
                       <span className="text-[10px] text-slate-400 font-medium">{msg.time}</span>
                     </div>
                     <p className={`text-xs leading-relaxed ${msg.unread ? 'text-blue-800' : 'text-slate-500'} truncate`}>{msg.text}</p>
                   </div>
                 ))}
               </div>
            </div>
          </div>

          {/* Action Quests (AI & Coach Goals) */}
          <div className="card-static p-0 overflow-hidden border-2 border-emerald-100">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4"></div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 relative z-10">
                <IconTarget size={18} color="white" /> Action Quests
              </h3>
              <p className="text-[10px] text-emerald-50 font-bold opacity-90 mt-1 relative z-10">
                Complete these tasks assigned by your coach to level up your game.
              </p>
            </div>
            
            <div className="p-4 space-y-3 bg-white">
              {goals.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-2 border border-slate-100">
                    <IconTarget size={20} color="#94A3B8" />
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Active Quests</p>
                  <p className="text-[10px] text-slate-400 mt-1">Play hard! Your coach will assign quests soon.</p>
                </div>
              ) : goals.map((g) => {
                const isDone = g.status === "achieved";
                
                // Color map by category
                let catColor = "text-slate-500 bg-slate-100 border-slate-200";
                if (g.category === "technical") catColor = "text-blue-600 bg-blue-50 border-blue-200";
                if (g.category === "tactical") catColor = "text-purple-600 bg-purple-50 border-purple-200";
                if (g.category === "physical") catColor = "text-orange-600 bg-orange-50 border-orange-200";
                
                return (
                  <button
                    key={g.id}
                    onClick={() => toggleGoal(g.id)}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 transition-all group relative overflow-hidden ${
                      isDone 
                        ? 'bg-emerald-50/50 border-emerald-100 opacity-70' 
                        : 'bg-white border-slate-100 hover:border-emerald-200 hover:shadow-md'
                    }`}
                  >
                    {isDone && <div className="absolute inset-0 bg-emerald-100/30 animate-pulse pointer-events-none"></div>}
                    
                    <div className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all shrink-0 relative z-10 ${
                      isDone 
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-inner scale-110' 
                        : 'border-slate-300 bg-white group-hover:border-emerald-400 group-hover:bg-emerald-50'
                    }`}>
                      {isDone && <IconCheck size={14} />}
                    </div>
                    
                    <div className="flex-1 text-left relative z-10">
                      <span className={`text-sm font-bold transition-colors block leading-tight ${isDone ? 'text-emerald-700 line-through decoration-emerald-300/50' : 'text-slate-800 group-hover:text-emerald-700'}`}>
                        {g.title}
                      </span>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${isDone ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : catColor}`}>
                          {g.category || 'General'}
                        </span>
                        {!isDone && <span className="text-[9px] font-bold text-slate-400">Tap to complete</span>}
                        {isDone && <span className="text-[9px] font-black text-emerald-600">Quest Completed! +50 XP</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
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
                  How was your last session with {coachProfile?.full_name ? coachProfile.full_name.split(' ')[0] : 'your coach'}? Your feedback builds their profile.
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

            <button onClick={() => setShowFAQ(false)} className="btn-primary w-full mt-6 py-3">Got it!</button>
          </div>
        </div>
      )}

      {/* Medical/Absence Modal */}
      {showMedical && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-up">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-rose-100 rounded-full blur-2xl pointer-events-none" />
            <h2 className="text-xl font-bold text-slate-900 mb-2 font-heading flex items-center gap-2">
              <IconActivity className="text-rose-500" /> Report Medical / Absence
            </h2>
            <p className="text-sm text-slate-500 mb-6">Notify your coach about illness, injury, or planned absences.</p>
            
            <form onSubmit={submitMedical} className="space-y-4 relative z-10">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Reason</label>
                <select 
                  className="input w-full"
                  value={medicalReason}
                  onChange={(e) => setMedicalReason(e.target.value)}
                  required
                >
                  <option value="" disabled>Select reason...</option>
                  <option value="Illness">Sick / Illness</option>
                  <option value="Injury">Injury</option>
                  <option value="Family Emergency">Family Emergency</option>
                  <option value="Travel / Vacation">Travel / Vacation</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Additional Details</label>
                <textarea 
                  className="input w-full" 
                  rows={3} 
                  placeholder="Expected return date, specific symptoms, etc."
                  value={medicalDetails}
                  onChange={(e) => setMedicalDetails(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowMedical(false)} 
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={sendingMedical || !medicalReason}
                  className="flex-1 py-3 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 disabled:opacity-50 transition-colors"
                >
                  {sendingMedical ? "Sending..." : "Send Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
