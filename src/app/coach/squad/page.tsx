/* ──────────────────────────────────────────────
   COACH SQUAD — Create & manage squads/batches
   Coaches can create teams, add/remove players,
   and view squad composition at a glance.
   ────────────────────────────────────────────── */
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import {
  IconShield, IconPlus, IconUsers, IconCheck, IconClipboard, IconTarget
} from "@/components/Icons";

interface Team {
  id: string;
  name: string;
  age_group: string | null;
  level: string | null;
  status: string;
  playerCount?: number;
}

interface Player {
  id: string;
  full_name: string;
  position: string;
  age: number;
}

export default function CoachSquadPage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [teamPlayers, setTeamPlayers] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  // New team form
  const [showNewTeam, setShowNewTeam] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAgeGroup, setNewAgeGroup] = useState("");
  const [newLevel, setNewLevel] = useState("Beginner");

  // Active team for player management
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  async function loadData() {
    if (!user) return;
    setLoading(true);

    // Fetch teams
    const { data: tData } = await supabase
      .from("teams")
      .select("*")
      .eq("coach_id", user.id)
      .order("created_at", { ascending: false });

    // Fetch all players assigned to this coach
    const { data: pData } = await supabase
      .from("profiles")
      .select("id, full_name, position, age")
      .eq("role", "player")
      .eq("coach_id", user.id);

    // Fetch team_players mappings
    if (tData) {
      const teamIds = tData.map(t => t.id);
      const { data: tpData } = await supabase
        .from("team_players")
        .select("team_id, player_id")
        .in("team_id", teamIds.length > 0 ? teamIds : ["__none__"]);

      const mapping: Record<string, string[]> = {};
      (tpData || []).forEach((tp: any) => {
        if (!mapping[tp.team_id]) mapping[tp.team_id] = [];
        mapping[tp.team_id].push(tp.player_id);
      });
      setTeamPlayers(mapping);

      setTeams(tData.map(t => ({ ...t, playerCount: (mapping[t.id] || []).length })));
      if (tData.length > 0 && !activeTeamId) setActiveTeamId(tData[0].id);
    }

    if (pData) setAllPlayers(pData.map(p => ({
      ...p,
      full_name: p.full_name || "Unknown",
      position: p.position || "MID",
      age: p.age || 16
    })));

    setLoading(false);
  }

  async function createTeam() {
    if (!user || !newName.trim()) return;
    setSaving(true);

    const { data, error } = await supabase.from("teams").insert({
      coach_id: user.id,
      name: newName.trim(),
      age_group: newAgeGroup || null,
      level: newLevel,
    }).select("*").single();

    if (!error && data) {
      setTeams(prev => [{ ...data, playerCount: 0 }, ...prev]);
      setActiveTeamId(data.id);
      setNewName("");
      setNewAgeGroup("");
      setShowNewTeam(false);
      showToast("Squad created!");
    }
    setSaving(false);
  }

  async function togglePlayer(playerId: string) {
    if (!activeTeamId || !user) return;
    const current = teamPlayers[activeTeamId] || [];
    const isIn = current.includes(playerId);

    if (isIn) {
      await supabase.from("team_players").delete()
        .eq("team_id", activeTeamId)
        .eq("player_id", playerId);
      setTeamPlayers(prev => ({
        ...prev,
        [activeTeamId]: prev[activeTeamId].filter(id => id !== playerId)
      }));
    } else {
      await supabase.from("team_players").insert({
        team_id: activeTeamId,
        player_id: playerId,
      });
      setTeamPlayers(prev => ({
        ...prev,
        [activeTeamId]: [...(prev[activeTeamId] || []), playerId]
      }));
    }

    // Update count
    setTeams(prev => prev.map(t =>
      t.id === activeTeamId
        ? { ...t, playerCount: (teamPlayers[activeTeamId] || []).length + (isIn ? -1 : 1) }
        : t
    ));
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  const activeTeam = teams.find(t => t.id === activeTeamId);
  const activeMembers = activeTeamId ? (teamPlayers[activeTeamId] || []) : [];

  return (
    <div className="max-w-6xl mx-auto pb-24 px-4 xl:px-0 opacity-0 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-slate-900 leading-tight" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}>
            Squad Management
          </h1>
          <p className="text-slate-500 font-medium text-xs md:text-sm">Create squads, assign players, and organize your training groups.</p>
        </div>
        <button
          onClick={() => setShowNewTeam(!showNewTeam)}
          className="btn-primary flex items-center gap-2 self-start"
        >
          <IconPlus size={16} /> New Squad
        </button>
      </div>

      {/* New Team Form */}
      {showNewTeam && (
        <div className="card-static p-6 mb-8 animate-fade-up border-2 border-emerald-100">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2" style={{ fontFamily: "var(--font-heading)" }}>
            <IconShield size={16} color="#10B981" /> Create New Squad
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Squad Name *</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. U-16 Main Squad"
                value={newName}
                onChange={e => setNewName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Age Group</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. U-14, U-16"
                value={newAgeGroup}
                onChange={e => setNewAgeGroup(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Level</label>
              <div className="flex gap-2">
                {["Beginner", "Intermediate", "Advanced"].map(lvl => (
                  <button
                    key={lvl}
                    onClick={() => setNewLevel(lvl)}
                    className="flex-1 py-2 rounded-xl text-xs font-bold border transition-all"
                    style={{
                      background: newLevel === lvl ? "rgba(16,185,129,0.1)" : "#FFF",
                      color: newLevel === lvl ? "#059669" : "var(--color-text-muted)",
                      borderColor: newLevel === lvl ? "#10B981" : "var(--color-border)",
                    }}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={createTeam} disabled={saving || !newName.trim()} className="btn-primary disabled:opacity-50">
              {saving ? "Creating..." : "Create Squad"}
            </button>
            <button onClick={() => setShowNewTeam(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Squad List */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Your Squads</h3>
          {loading ? (
            <div className="card-static p-8 text-center text-sm text-slate-400">Loading squads...</div>
          ) : teams.length === 0 ? (
            <div className="card-static p-8 text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <IconShield size={24} color="#CBD5E1" />
              </div>
              <p className="text-sm font-bold text-slate-400 mb-1">No squads yet</p>
              <p className="text-xs text-slate-400">Create your first squad to group players.</p>
            </div>
          ) : teams.map(team => (
            <button
              key={team.id}
              onClick={() => setActiveTeamId(team.id)}
              className={`w-full text-left card-static p-4 flex items-center gap-4 transition-all ${activeTeamId === team.id ? "ring-2 ring-emerald-500 bg-emerald-50/30" : "hover:shadow-md"}`}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-100 text-emerald-700">
                <IconShield size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900 text-sm truncate">{team.name}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {team.age_group || "All Ages"} • {team.level || "Open"}
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-lg">
                <IconUsers size={12} color="#64748B" />
                <span className="text-xs font-bold text-slate-600">{team.playerCount || 0}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Right: Player Assignment */}
        <div className="lg:col-span-2">
          {activeTeam ? (
            <div className="card-static p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-heading)" }}>{activeTeam.name}</h2>
                  <p className="text-xs text-slate-500 font-medium">{activeMembers.length} players assigned • Tap to add or remove</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                  <IconTarget size={14} />
                  <span className="text-xs font-bold">{activeTeam.level || "Open"}</span>
                </div>
              </div>

              {allPlayers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-slate-400 font-medium">No players in your roster yet.</p>
                  <p className="text-xs text-slate-400 mt-1">Players need to be assigned to your coach profile first.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {allPlayers.map(player => {
                    const isInTeam = activeMembers.includes(player.id);
                    return (
                      <button
                        key={player.id}
                        onClick={() => togglePlayer(player.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left group ${isInTeam ? "bg-emerald-50 border-emerald-200 shadow-sm" : "bg-white border-slate-100 hover:border-slate-300"}`}
                      >
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${isInTeam ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                          {isInTeam ? <IconCheck size={16} /> : player.full_name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-bold truncate ${isInTeam ? "text-emerald-900" : "text-slate-700"}`}>{player.full_name}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">{player.position} • AGE {player.age}</div>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isInTeam ? "text-emerald-600" : "text-slate-300 group-hover:text-slate-500"} transition-colors`}>
                          {isInTeam ? "In Squad" : "Add"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="card-static p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <IconClipboard size={28} color="#CBD5E1" />
              </div>
              <p className="font-bold text-slate-400">Select or create a squad</p>
              <p className="text-xs text-slate-400 mt-1">Then assign players from your roster.</p>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-slide-in font-bold text-sm">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <IconCheck size={14} color="white" />
          </div>
          {toast}
        </div>
      )}
    </div>
  );
}
