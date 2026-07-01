"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { IconTrophy, IconAward } from "@/components/Icons";
import Link from "next/link";
import { generateBracket, Team, Match } from "@/lib/bracket-generator";

export default function FixturesPage({ params }: { params: { id: string } }) {
  const { user, profile } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadData();
  }, [params.id]);

  async function loadData() {
    // 1. Fetch Event
    const { data: ev } = await supabase
      .from("events")
      .select("*")
      .eq("id", params.id)
      .single();
    if (ev) setEvent(ev);

    // 2. Fetch Registrations
    const { data: regs } = await supabase
      .from("event_registrations")
      .select("*")
      .eq("event_id", params.id)
      .eq("payment_status", "paid");
    if (regs) setRegistrations(regs);

    // 3. Fetch Fixtures
    const { data: fixs } = await supabase
      .from("tournament_fixtures")
      .select(`
        *,
        team1:team1_id(id, team_name),
        team2:team2_id(id, team_name),
        winner:winner_id(id, team_name)
      `)
      .eq("event_id", params.id)
      .order("round", { ascending: true })
      .order("match_number", { ascending: true });
      
    if (fixs) setFixtures(fixs);

    setLoading(false);
  }

  const handleGenerateBracket = async () => {
    if (registrations.length < 2) {
      alert("Not enough registered teams to generate a bracket.");
      return;
    }
    
    setIsGenerating(true);
    
    // Convert registrations to Team interface
    const teams: Team[] = registrations.map(r => ({ id: r.id, name: r.team_name }));
    const matches = generateBracket(teams);

    // Create records
    for (const match of matches) {
      await supabase.from("tournament_fixtures").insert({
        event_id: params.id,
        round: match.round,
        match_number: match.matchNumber,
        team1_id: match.team1?.id || null,
        team2_id: match.team2?.id || null,
        winner_id: match.winner?.id || null,
      });
    }

    await loadData();
    setIsGenerating(false);
  };

  const handleUpdateScore = async (fixtureId: string, team1Id: string | null, team2Id: string | null) => {
    const s1 = prompt("Enter Score for Team 1:");
    const s2 = prompt("Enter Score for Team 2:");
    if (s1 === null || s2 === null) return;
    
    const score1 = parseInt(s1);
    const score2 = parseInt(s2);

    if (isNaN(score1) || isNaN(score2)) {
      alert("Invalid scores");
      return;
    }

    let winnerId = null;
    if (score1 > score2) winnerId = team1Id;
    else if (score2 > score1) winnerId = team2Id;
    
    if (!winnerId) {
      alert("A match must have a winner in a knockout tournament. Please enter penalty scores.");
      return;
    }

    await supabase.from("tournament_fixtures").update({
      score1,
      score2,
      winner_id: winnerId
    }).eq("id", fixtureId);

    await loadData();
  };

  const isOrganizer = user && event && (event.coach_id === user.id || profile?.role === 'admin');

  if (loading) return <div className="p-10 text-center font-bold text-slate-500">Loading Fixtures...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2" style={{ fontFamily: "var(--font-heading)" }}>Tournament Fixtures</h1>
          <p className="text-slate-500">Bracket and results for {event?.title}</p>
        </div>
        <Link href={`/events/${params.id}`} className="text-indigo-600 font-bold hover:underline">
          &larr; Back to Event
        </Link>
      </div>

      {fixtures.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <IconTrophy size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">No Bracket Generated Yet</h2>
          <p className="text-slate-500 mb-6">There are currently {registrations.length} teams registered and paid.</p>
          
          {isOrganizer && (
            <button 
              onClick={handleGenerateBracket}
              disabled={isGenerating}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md disabled:opacity-50"
            >
              {isGenerating ? "Generating..." : "Generate Bracket"}
            </button>
          )}
        </div>
      ) : (
        <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 overflow-x-auto shadow-inner">
          <h3 className="font-bold text-lg mb-6">Round 1</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fixtures.filter(f => f.round === 1).map((fixture) => (
              <div key={fixture.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm animate-fade-up">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Match {fixture.match_number}</span>
                  {fixture.winner_id && (
                    <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full flex items-center gap-1">
                      <IconAward size={12} /> Finished
                    </span>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className={`flex justify-between items-center p-3 rounded-lg border ${fixture.winner_id === fixture.team1_id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-slate-50'}`}>
                    <span className="font-semibold text-slate-900">{fixture.team1?.team_name || "TBD (Bye)"}</span>
                    <span className="font-bold">{fixture.score1 ?? "-"}</span>
                  </div>
                  <div className={`flex justify-between items-center p-3 rounded-lg border ${fixture.winner_id === fixture.team2_id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-slate-50'}`}>
                    <span className="font-semibold text-slate-900">{fixture.team2?.team_name || "TBD (Bye)"}</span>
                    <span className="font-bold">{fixture.score2 ?? "-"}</span>
                  </div>
                </div>

                {isOrganizer && !fixture.winner_id && fixture.team1_id && fixture.team2_id && (
                  <button onClick={() => handleUpdateScore(fixture.id, fixture.team1_id, fixture.team2_id)} className="w-full mt-4 bg-indigo-50 text-indigo-600 font-bold py-2 rounded-lg text-sm hover:bg-indigo-100 transition-colors">
                    Update Score
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
