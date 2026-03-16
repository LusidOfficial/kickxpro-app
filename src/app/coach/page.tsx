/* ──────────────────────────────────────────────
   COACH DASHBOARD (Light Theme + Finesse)
   Dense roster list, coach rating metrics, and
   messaging.
   ────────────────────────────────────────────── */
"use client";

import Link from "next/link";
import StatCard from "@/components/StatCard";
import { 
  IconUsers, IconClipboard, IconTarget, IconStar, IconMessageSquare, IconTrendingUp 
} from "@/components/Icons";

const DEMO_PLAYERS = [
  { id: "P001", name: "Arjun Mehta", pos: "Midfielder", latestScore: 4.2, streak: 3, lastNote: "Great vision today." },
  { id: "P002", name: "Neha Singh", pos: "Forward", latestScore: 4.8, streak: 12, lastNote: "Finishing is elite." },
  { id: "P003", name: "Rahul Joshi", pos: "Defender", latestScore: 3.5, streak: 0, lastNote: "Needs stamina work." },
  { id: "P004", name: "Sanjay Verma", pos: "Goalkeeper", latestScore: null, streak: 5, lastNote: "No notes yet." },
  { id: "P005", name: "Vikram K", pos: "Midfielder", latestScore: 3.9, streak: 2, lastNote: "Good passing range." },
  { id: "P006", name: "Anita D", pos: "Defender", latestScore: 4.1, streak: 8, lastNote: "Solid tackles." },
];

export default function CoachDashboard() {
  return (
    <div className="max-w-5xl space-y-10 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-slate-900" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}>
            Coach Dashboard
          </h1>
          <p className="text-slate-500 font-medium">Manage your squad, evaluate performance, and track your own impact.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/coach/sessions" className="btn-primary flex items-center gap-2 no-underline">
            <IconTarget size={16} /> New Session
          </Link>
          <Link href="/coach/evaluate" className="btn-secondary flex items-center gap-2 no-underline">
            <IconClipboard size={16} /> Evaluate
          </Link>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard value="24" label="Roster Size" icon={<IconUsers />} delay={0.1} />
        <StatCard value="12" label="Sessions Run" icon={<IconClipboard />} accentColor="#3B82F6" delay={0.15} />
        <StatCard value="85%" label="Avg Attendance" icon={<IconTrendingUp />} accentColor="#10B981" delay={0.2} />
        <StatCard value="4" label="Unread Msgs" icon={<IconMessageSquare />} accentColor="#F59E0B" delay={0.25} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Roster List (Takes up 2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-heading)" }}>Player Roster</h2>
            <button className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">View All →</button>
          </div>
          
          <div className="card-static overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 bg-slate-50">
              <div className="col-span-5">Player</div>
              <div className="col-span-2 text-center">Form</div>
              <div className="col-span-2 text-center">Streak</div>
              <div className="col-span-3 text-right">Actions</div>
            </div>
            
            {/* List Rows */}
            <div className="divide-y divide-slate-100">
              {DEMO_PLAYERS.map((player, i) => (
                <div 
                  key={player.id} 
                  className="grid grid-cols-12 gap-4 px-5 py-4 items-center group hover:bg-slate-50 transition-colors opacity-0 animate-fade-up"
                  style={{ animationDelay: `${0.3 + i * 0.05}s`, animationFillMode: "forwards" }}
                >
                  {/* Player Info */}
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="w-9 h-9 flex-shrink-0 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                      {player.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm group-hover:text-emerald-600 transition-colors">
                        {player.name}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">{player.pos}</div>
                    </div>
                  </div>
                  
                  {/* Form/Score */}
                  <div className="col-span-2 flex justify-center">
                    {player.latestScore ? (
                      <div className="px-2 py-1 rounded-md text-xs font-bold" style={{ background: player.latestScore >= 4 ? "#dcfce7" : "#fef3c7", color: player.latestScore >= 4 ? "#166534" : "#92400e" }}>
                        {player.latestScore.toFixed(1)}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </div>
                  
                  {/* Streak */}
                  <div className="col-span-2 flex justify-center items-center gap-1">
                    <span className="text-xs font-bold" style={{ color: player.streak > 0 ? "#10B981" : "#94A3B8" }}>{player.streak}</span>
                    <span className="text-xs text-slate-400">🔥</span>
                  </div>
                  
                  {/* Actions */}
                  <div className="col-span-3 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors" title="Message Player">
                       <IconMessageSquare size={14} />
                     </button>
                     <Link href={`/coach/evaluate?player=${player.id}`} className="w-8 h-8 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-700 flex items-center justify-center transition-colors" title="Quick Evaluate">
                       <IconClipboard size={14} />
                     </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Right Col: Coach Metrics */}
        <div className="space-y-4">
           <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-heading)" }}>My Performance</h2>
           
           <div className="card-static p-6 opacity-0 animate-fade-up" style={{ animationDelay: "0.5s", animationFillMode: "forwards" }}>
             <div className="flex items-center justify-between mb-6">
               <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Coach Rating</div>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-black text-slate-900" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.05em" }}>4.8</span>
                    <span className="text-sm font-semibold text-slate-400 mb-1.5">/ 5.0</span>
                  </div>
               </div>
               <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-500 flex items-center justify-center shadow-inner">
                 <IconStar size={24} />
               </div>
             </div>
             
             {/* Rating Bars */}
             <div className="space-y-4">
               <div>
                 <div className="flex justify-between text-xs font-semibold mb-1.5">
                   <span className="text-slate-700">Tactical Knowledge</span>
                   <span className="text-emerald-600">92%</span>
                 </div>
                 <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500 rounded-full" style={{ width: "92%" }} />
                 </div>
               </div>
               <div>
                 <div className="flex justify-between text-xs font-semibold mb-1.5">
                   <span className="text-slate-700">Motivation</span>
                   <span className="text-emerald-600">88%</span>
                 </div>
                 <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500 rounded-full" style={{ width: "88%" }} />
                 </div>
               </div>
               <div>
                 <div className="flex justify-between text-xs font-semibold mb-1.5">
                   <span className="text-slate-700">Communication</span>
                   <span className="text-emerald-600">95%</span>
                 </div>
                 <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500 rounded-full" style={{ width: "95%" }} />
                 </div>
               </div>
             </div>
             
             <div className="mt-6 pt-5 border-t border-slate-100">
               <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Top Tags from Players</div>
               <div className="flex flex-wrap gap-2">
                 <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider rounded-md border border-blue-100">Technical</span>
                 <span className="px-2.5 py-1 bg-purple-50 text-purple-600 text-[10px] font-bold uppercase tracking-wider rounded-md border border-purple-100">Patient</span>
                 <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider rounded-md border border-emerald-100">Leader</span>
               </div>
             </div>
           </div>
        </div>

      </div>
    </div>
  );
}
