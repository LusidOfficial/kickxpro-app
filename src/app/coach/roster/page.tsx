/* ──────────────────────────────────────────────
   DETAILED ROSTER PAGE (Coach Portal)
   Mobile-first, scannable grid with detailed stats,
   awards, and a mocked messaging interface.
   ────────────────────────────────────────────── */
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { IconSend, IconClipboard, IconAward, IconChevronRight, IconTrendingUp } from "@/components/Icons";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

const MOCK_ROSTER = [
  { id: "P001", num: 10, name: "Arjun M.", pos: "ST", age: 18, ovr: 72, trend: "+3", stats: { goals: 14, assists: 3, mins: 1080 }, form: ['W', 'L', 'W', 'W', 'W'], awards: [{id: "motm", name: "Player of the Match"}] },
  { id: "P002", num: 8, name: "Neha S.", pos: "CM", age: 17, ovr: 81, trend: "+1", stats: { goals: 4, assists: 12, mins: 1240 }, form: ['W', 'W', 'D', 'W', 'W'], awards: [{id: "playmaker", name: "Playmaker"}, {id: "workhorse", name: "Workhorse"}] },
  { id: "P003", num: 4, name: "Rahul J.", pos: "CB", age: 19, ovr: 68, trend: "-1", stats: { goals: 1, assists: 1, mins: 1400 }, form: ['L', 'L', 'D', 'W', 'L'], awards: [{id: "rock", name: "Defensive Rock"}] },
  { id: "P004", num: 9, name: "Sanjay V.", pos: "ST", age: 18, ovr: 77, trend: "+2", stats: { goals: 11, assists: 5, mins: 980 }, form: ['W', 'W', 'W', 'L', 'D'], awards: [] },
  { id: "P005", num: 1, name: "Aarav K.", pos: "GK", age: 16, ovr: 65, trend: "0", stats: { goals: 0, assists: 0, mins: 810 }, form: ['W', 'L', 'L', 'W', 'D'], awards: [] },
  { id: "P006", num: 7, name: "Priya R.", pos: "RW", age: 18, ovr: 70, trend: "+1", stats: { goals: 6, assists: 8, mins: 1120 }, form: ['W', 'D', 'W', 'W', 'L'], awards: [] },
];

export default function RosterPage() {
  const { user } = useAuth();
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [roster, setRoster] = useState(MOCK_ROSTER);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlayers() {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'player')
          .eq('coach_id', user.id);
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          // Map DB response to the UI shape
          const liveRoster = data.map((p, idx) => ({
            id: p.id,
            num: idx + 20, // arbitrary number for now
            name: p.full_name,
            pos: p.position || 'MID',
            age: p.age || 18,
            ovr: p.overall_score || 70,
            trend: "+0",
            stats: { goals: 0, assists: 0, mins: 0 },
            form: ['D', 'D', 'D'] as string[],
            awards: [] as any[]
          }));
          setRoster(liveRoster);
        } else {
          setRoster([]); // Empty if no players
        }
      } catch (err) {
        console.warn('Supabase fetch failed.', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchPlayers();
  }, [user]);

  const activePlayer = roster.find(p => p.id === selectedPlayer);

  const sendMessage = () => {
    if (!message.trim()) return;
    setMessage("");
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      setSelectedPlayer(null); // Close sidebar automatically on send
    }, 2000);
  };

  return (
    <div className="relative max-w-6xl mx-auto pb-32 px-4 xl:px-0 opacity-0 animate-fade-up flex flex-col lg:flex-row gap-6">

      {/* Main Roster List */}
      <div className={`flex-1 transition-all ${selectedPlayer ? "hidden lg:block lg:w-2/3" : "w-full"}`}>
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-slate-900 leading-tight" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}>Squad Roster</h1>
          <p className="text-slate-500 font-medium text-xs md:text-sm">Manage your players, view precise stats, and send direct feedback metrics.</p>
        </div>

        {/* ── Football Pitch Visualization ── */}
        <div className="mb-8 relative w-full aspect-[4/3] max-w-2xl mx-auto rounded-3xl overflow-hidden shadow-sm border border-emerald-900/10">
          {/* Pitch Background */}
          <div className="absolute inset-0 bg-[#0A7131] pitch-stripes" />
          
          {/* Pitch Lines SVG */}
          <svg className="absolute inset-0 w-full h-full opacity-60 pointer-events-none" viewBox="0 0 100 130" preserveAspectRatio="none">
            {/* Outer Boundary */}
            <rect x="5" y="5" width="90" height="120" fill="none" stroke="#fff" strokeWidth="0.5" />
            {/* Center Line */}
            <line x1="5" y1="65" x2="95" y2="65" stroke="#fff" strokeWidth="0.5" />
            {/* Center Circle */}
            <circle cx="50" cy="65" r="12" fill="none" stroke="#fff" strokeWidth="0.5" />
            <circle cx="50" cy="65" r="1.5" fill="#fff" />
            {/* Top Penalty Area */}
            <rect x="25" y="5" width="50" height="22" fill="none" stroke="#fff" strokeWidth="0.5" />
            <rect x="38" y="5" width="24" height="8" fill="none" stroke="#fff" strokeWidth="0.5" />
            <path d="M 38 27 A 15 15 0 0 0 62 27" fill="none" stroke="#fff" strokeWidth="0.5" />
            <circle cx="50" cy="20" r="1" fill="#fff" />
            {/* Bottom Penalty Area */}
            <rect x="25" y="103" width="50" height="22" fill="none" stroke="#fff" strokeWidth="0.5" />
            <rect x="38" y="117" width="24" height="8" fill="none" stroke="#fff" strokeWidth="0.5" />
            <path d="M 38 103 A 15 15 0 0 1 62 103" fill="none" stroke="#fff" strokeWidth="0.5" />
            <circle cx="50" cy="110" r="1" fill="#fff" />
            {/* Corner Arcs */}
            <path d="M 5 10 A 5 5 0 0 0 10 5" fill="none" stroke="#fff" strokeWidth="0.5" />
            <path d="M 90 5 A 5 5 0 0 0 95 10" fill="none" stroke="#fff" strokeWidth="0.5" />
            <path d="M 5 120 A 5 5 0 0 1 10 125" fill="none" stroke="#fff" strokeWidth="0.5" />
            <path d="M 95 120 A 5 5 0 0 0 90 125" fill="none" stroke="#fff" strokeWidth="0.5" />
          </svg>

          {/* Player Mapping */}
          {roster.map(p => {
             // Map standard positions to SVG percentages (x, y)
             // Using bottom half for defense, top half for attack
             let top = "50%", left = "50%";
             if (p.pos === "GK") { top = "90%"; left = "50%"; }
             else if (p.pos === "CB") { top = "75%"; left = "50%"; } // Need to scatter if multiple CBs, but fine for mockup
             else if (p.pos === "FB" || p.pos === "RB") { top = "75%"; left = "85%"; }
             else if (p.pos === "LB") { top = "75%"; left = "15%"; }
             else if (p.pos === "CM" || p.pos === "MID") { top = "55%"; left = "50%"; }
             else if (p.pos === "RW") { top = "30%"; left = "80%"; }
             else if (p.pos === "LW") { top = "30%"; left = "20%"; }
             else if (p.pos === "ST" || p.pos === "FWD") { top = "20%"; left = "50%"; }
             
             // In demo data: Arjun(ST), Sanjay(ST), Neha(CM), Rahul(CB), Priya(RW), Aarav(GK)
             // Manually scatter overlapping STs for demo aesthetics
             if (p.id === "P001") { top = "20%"; left = "40%"; } // Arjun ST
             if (p.id === "P004") { top = "20%"; left = "60%"; } // Sanjay ST

             const isSelected = selectedPlayer === p.id;
             const formColor = p.form.filter(f => f === 'W').length >= 3 ? "#10B981" : 
                               p.form.filter(f => f === 'L').length >= 3 ? "#EF4444" : "#F59E0B";

             return (
               <button
                 key={`pitch-${p.id}`}
                 onClick={() => setSelectedPlayer(p.id)}
                 className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] transition-all duration-300 shadow-xl z-10 border-2
                   ${isSelected ? "ring-4 ring-white scale-125 z-20" : "hover:scale-110"}`}
                 style={{
                   top, 
                   left,
                   backgroundColor: isSelected ? "#fff" : formColor,
                   borderColor: isSelected ? formColor : "#fff",
                   color: isSelected ? formColor : "#fff"
                 }}
               >
                 {p.pos || p.name.substring(0, 2).toUpperCase()}
               </button>
             );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {roster.map((player) => (
            <div 
              key={player.id}
              onClick={() => setSelectedPlayer(player.id)}
              className={`card-static p-4 flex items-center gap-4 cursor-pointer transition-all ${selectedPlayer === player.id ? "ring-2 ring-emerald-500" : "hover:shadow-md"}`}
            >
              {/* Avatar / Position */}
              <div className="w-12 h-12 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-[10px] md:text-xs font-black text-slate-500 uppercase">
                {player.pos || player.name.substring(0, 2).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 tracking-tight">{player.name}</h3>
                <div className="flex gap-2 text-[10px] font-bold text-slate-500 uppercase">
                  <span>{player.pos}</span>•<span>AGE {player.age}</span>
                </div>
              </div>

              {/* Ovr Score */}
              <div className="flex flex-col items-end gap-1">
                <div className="w-10 h-8 rounded-lg bg-emerald-50 text-emerald-600 font-black text-sm flex items-center justify-center">
                  {(player.ovr / 10).toFixed(1)}
                </div>
                {player.trend !== "0" && (
                  <span className={`text-[9px] font-bold ${player.trend.startsWith("+") ? "text-emerald-500" : "text-red-500"}`}>
                    {player.trend} 
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Player Detail Slide-over (Right Col UI) */}
      {selectedPlayer && activePlayer && (
        <div className="lg:w-1/3 bg-white fixed inset-0 z-50 lg:static lg:z-auto lg:rounded-3xl lg:border lg:border-slate-200 lg:shadow-xl lg:h-[calc(100vh-100px)] overflow-y-auto w-full animate-slide-in flex flex-col">
          
          {/* Header */}
          <div className="p-6 bg-slate-900 text-white relative flex-shrink-0">
             <button 
              onClick={() => setSelectedPlayer(null)}
              className="lg:hidden absolute top-6 right-6 p-2 bg-white/10 rounded-full font-bold text-xs"
             >
               Close
             </button>
             
             <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-xl font-black mb-4 border-2 border-white/30 uppercase tracking-widest">
                {activePlayer.pos || activePlayer.name.substring(0, 2).toUpperCase()}
             </div>
             <h2 className="text-2xl font-bold font-heading mb-1">{activePlayer.name}</h2>
             <div className="flex gap-4 text-xs font-medium text-emerald-400">
                <span>Position: {activePlayer.pos}</span>
                <span>Age: {activePlayer.age}</span>
                <span>Overall: {(activePlayer.ovr / 10).toFixed(1)}</span>
             </div>
          </div>

          <div className="p-6 flex-1 flex flex-col space-y-8 bg-slate-50 custom-scrollbar">
            
            {/* Quick Stats Grid */}
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Season Stats</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white border text-center py-3 rounded-xl shadow-sm">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Goals</div>
                  <div className="text-xl font-black text-slate-900">{activePlayer.stats.goals}</div>
                </div>
                <div className="bg-white border text-center py-3 rounded-xl shadow-sm">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assists</div>
                  <div className="text-xl font-black text-slate-900">{activePlayer.stats.assists}</div>
                </div>
                <div className="bg-white border text-center py-3 rounded-xl shadow-sm">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Minutes</div>
                  <div className="text-xl font-black text-slate-900">{activePlayer.stats.mins}'</div>
                </div>
              </div>
            </div>

            {/* Recent Form */}
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <IconTrendingUp size={14} /> Recent Form
              </h4>
              <div className="flex gap-2">
                {activePlayer.form.map((res, i) => (
                  <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm
                    ${res === 'W' ? 'bg-emerald-500' : res === 'D' ? 'bg-amber-400' : 'bg-red-500'}
                  `}>
                    {res}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Awards Section */}
            {activePlayer.awards.length > 0 && (
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Recent Awards</h4>
                <div className="flex flex-wrap gap-2">
                  {activePlayer.awards.map((aw) => (
                    <div key={aw.id} className="flex items-center gap-2 px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-lg text-xs font-bold border border-cyan-100">
                      <IconAward size={14} /> {aw.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Messaging Mock */}
            <div className="flex-1 flex flex-col">
               <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Direct Message</h4>
               <div className="flex-1 border border-slate-200 bg-white rounded-2xl flex flex-col overflow-hidden shadow-sm">
                 <div className="p-4 flex-1 bg-slate-50/50 flex flex-col justify-end">
                    <div className="bg-slate-200 self-start px-4 py-2 rounded-2xl rounded-tl-sm text-sm text-slate-700 max-w-[85%] font-medium">
                      Coach, how was my positioning today?
                    </div>
                 </div>
                 <div className="p-3 border-t bg-white flex items-end gap-2">
                   <textarea
                     className="flex-1 resize-none bg-slate-100 rounded-xl p-3 text-sm border-none outline-none focus:ring-2 ring-emerald-500 transition-shadow max-h-[100px]"
                     placeholder={`Message ${activePlayer.name}...`}
                     rows={1}
                     value={message}
                     onChange={(e) => setMessage(e.target.value)}
                   />
                   <button 
                     onClick={sendMessage}
                     className="p-3 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-colors shadow-sm active:scale-95"
                   >
                     <IconSend size={18} />
                   </button>
                 </div>
               </div>
            </div>

          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-slide-in font-bold">
          Message sent successfully!
        </div>
      )}

    </div>
  );
}
