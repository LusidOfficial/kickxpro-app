"use client";

import { useState } from "react";
import Link from "next/link";
import { IconTrophy } from "@/components/Icons";

// Demo bracket data
const DEMO_FIXTURES = [
  { id: 1, round: "Quarter-Finals", match: 1, teamA: "FC United", teamB: "Red Devils", scoreA: 2, scoreB: 1, status: "completed" },
  { id: 2, round: "Quarter-Finals", match: 2, teamA: "City Boys", teamB: "Blue Hawks", scoreA: 0, scoreB: 3, status: "completed" },
  { id: 3, round: "Quarter-Finals", match: 3, teamA: "Trinity FC", teamB: "Spartans", scoreA: null, scoreB: null, status: "scheduled" },
  { id: 4, round: "Quarter-Finals", match: 4, teamA: "Titans", teamB: "Warriors", scoreA: null, scoreB: null, status: "scheduled" },
  { id: 5, round: "Semi-Finals", match: 1, teamA: "FC United", teamB: "Blue Hawks", scoreA: null, scoreB: null, status: "scheduled" },
  { id: 6, round: "Semi-Finals", match: 2, teamA: "TBD", teamB: "TBD", scoreA: null, scoreB: null, status: "pending" },
  { id: 7, round: "Final", match: 1, teamA: "TBD", teamB: "TBD", scoreA: null, scoreB: null, status: "pending" },
];

export default function FixturesPage({ params }: { params: { id: string } }) {
  const [fixtures, setFixtures] = useState(DEMO_FIXTURES);

  const rounds = ["Quarter-Finals", "Semi-Finals", "Final"];

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <div className="bg-white border-b border-slate-200 pt-8 pb-6 px-4">
        <div className="max-w-6xl mx-auto">
          <Link href={`/events/${params.id}`} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 mb-4 inline-block">&larr; Back to Event Page</Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-1" style={{ fontFamily: "var(--font-heading)" }}>Tournament Fixtures</h1>
              <p className="text-slate-500">Summer KickX Cup 2026</p>
            </div>
            <div className="flex gap-3">
              <button className="bg-white border border-slate-200 text-slate-700 font-bold py-2 px-4 rounded-xl shadow-sm hover:bg-slate-50 transition-colors">
                Shuffle Bracket
              </button>
              <button className="btn-primary bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-xl shadow-md transition-all">
                Save Results
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-8">
        <div className="flex overflow-x-auto pb-8 gap-12 snap-x">
          {rounds.map((roundName, index) => {
            const roundFixtures = fixtures.filter(f => f.round === roundName);
            
            return (
              <div key={roundName} className="flex-none w-80 snap-center">
                <h3 className="text-center font-bold text-slate-700 mb-6 uppercase tracking-widest text-sm bg-slate-200/50 py-2 rounded-xl">
                  {roundName}
                </h3>
                
                <div className="space-y-6 flex flex-col justify-center h-full">
                  {roundFixtures.map((fixture) => (
                    <div key={fixture.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden ${fixture.status === 'completed' ? 'border-slate-200' : 'border-indigo-100'}`}>
                      <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Match {fixture.match}</span>
                        {fixture.status === 'completed' && <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">FT</span>}
                      </div>
                      
                      <div className="p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className={`font-bold ${fixture.scoreA !== null && fixture.scoreA > (fixture.scoreB || 0) ? 'text-slate-900' : 'text-slate-600'}`}>
                            {fixture.teamA}
                          </span>
                          <input 
                            type="number" 
                            className="w-12 h-8 text-center font-bold bg-slate-50 border border-slate-200 rounded focus:border-indigo-500 focus:outline-none"
                            value={fixture.scoreA !== null ? fixture.scoreA : ''}
                            placeholder="-"
                            onChange={() => {}}
                          />
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className={`font-bold ${fixture.scoreB !== null && fixture.scoreB > (fixture.scoreA || 0) ? 'text-slate-900' : 'text-slate-600'}`}>
                            {fixture.teamB}
                          </span>
                          <input 
                            type="number" 
                            className="w-12 h-8 text-center font-bold bg-slate-50 border border-slate-200 rounded focus:border-indigo-500 focus:outline-none"
                            value={fixture.scoreB !== null ? fixture.scoreB : ''}
                            placeholder="-"
                            onChange={() => {}}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          
          <div className="flex-none w-64 flex flex-col justify-center items-center">
            <div className="w-24 h-24 bg-gradient-to-br from-amber-200 to-amber-400 rounded-full flex items-center justify-center shadow-lg mb-4">
              <IconTrophy size={48} className="text-amber-700" />
            </div>
            <h3 className="font-bold text-slate-900 text-xl" style={{ fontFamily: "var(--font-heading)" }}>Champion</h3>
            <p className="text-slate-500 font-semibold mt-2 border-b-2 border-slate-300 min-w-32 text-center pb-1">TBD</p>
          </div>
        </div>
      </div>
    </div>
  );
}
