/* ──────────────────────────────────────────────
   ADMIN TOURNAMENT MANAGER
   Create and manage events, assign teams/coaches.
   ────────────────────────────────────────────── */
"use client";

import { useState } from "react";
import { IconTrophy, IconCalendar, IconPlus, IconCheck } from "@/components/Icons";

const DEMO_TEAMS = [
  "Trinity FC U18", "Spartans Academy", "Metro United", "KickX Elite"
];

export default function TournamentsPage() {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [tournaments, setTournaments] = useState([
    { id: 1, name: "Summer City Cup", date: "2026-06-15", location: "Grand Stadium", price: "$500", teams: ["Trinity FC U18", "Metro United"], status: "Upcoming" },
    { id: 2, name: "KickX Regional Qualifiers", date: "2026-04-20", location: "North Pitch 1", price: "Free", teams: ["Spartans Academy", "KickX Elite", "Trinity FC U18"], status: "Active" }
  ]);

  const toggleTeam = (team: string) => {
    if (selectedTeams.includes(team)) {
      setSelectedTeams(selectedTeams.filter(t => t !== team));
    } else {
      setSelectedTeams([...selectedTeams, team]);
    }
  };

  const createTournament = () => {
    if (!name || selectedTeams.length === 0) return;
    setTournaments([
      { id: Date.now(), name, date: date || "TBD", location: location || "TBD", price: price || "Free", teams: selectedTeams, status: "Upcoming" },
      ...tournaments
    ]);
    setShowModal(false);
    setName("");
    setDate("");
    setLocation("");
    setPrice("");
    setSelectedTeams([]);
  };

  return (
    <div className="max-w-6xl mx-auto pb-24 px-4 xl:px-0 opacity-0 animate-fade-up">

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-slate-900 leading-tight" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}>Tournament Manager</h1>
          <p className="text-slate-500 font-medium text-xs md:text-sm">Create and track academy events and competitive fixtures.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary py-2.5 px-5 flex items-center gap-2"
        >
          <IconPlus size={16} /> New Tournament
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments.map((t) => (
          <div key={t.id} className="card-static p-6 flex flex-col h-full border-t-4 border-purple-500">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <IconTrophy size={20} />
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md ${t.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                {t.status}
              </span>
            </div>
            
            <h3 className="text-lg font-bold text-slate-900 mb-1">{t.name}</h3>
            <div className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-2">
              <IconCalendar size={14} /> {t.date}
            </div>
            
            <div className="flex items-center gap-4 text-xs font-bold text-slate-400 mb-6">
               <span className="flex items-center gap-1">📍 {t.location}</span>
               <span className="flex items-center gap-1">💵 {t.price}</span>
            </div>

            <div className="mt-auto">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Participating Teams</div>
              <div className="flex flex-wrap gap-2">
                {t.teams.map((team, idx) => (
                  <span key={idx} className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                    {team}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: "var(--font-heading)" }}>Create Tournament</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Tournament Name</label>
                <input 
                  type="text" 
                  className="input text-sm" 
                  placeholder="e.g. Winter Cup 2026" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Start Date</label>
                <input 
                  type="date" 
                  className="input text-sm" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Location</label>
                <input 
                  type="text" 
                  className="input text-sm" 
                  placeholder="e.g. Center Pitch" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Registration Price</label>
                <input 
                  type="text" 
                  className="input text-sm" 
                  placeholder="e.g. $150 or Free" 
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Assign Teams</label>
                <div className="grid grid-cols-2 gap-2">
                  {DEMO_TEAMS.map((team) => (
                    <button
                      key={team}
                      onClick={() => toggleTeam(team)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        selectedTeams.includes(team) 
                        ? 'bg-purple-50 border-purple-200 text-purple-700 shadow-sm' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${selectedTeams.includes(team) ? 'bg-purple-500 border-purple-500 text-white' : 'border-slate-300'}`}>
                        {selectedTeams.includes(team) && <IconCheck size={10} />}
                      </div>
                      {team}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
               <button onClick={() => setShowModal(false)} className="flex-1 py-3 font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">Cancel</button>
               <button onClick={createTournament} className="flex-1 py-3 font-bold text-white bg-purple-600 rounded-xl shadow-md hover:bg-purple-700">Create Event</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
