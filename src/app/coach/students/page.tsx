/* ──────────────────────────────────────────────
   MY STUDENTS — Simple student management
   Coach adds students by email, views roster.
   One-tap add, no technical jargon.
   ────────────────────────────────────────────── */
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import {
  IconUsers, IconPlus, IconCheck, IconUser, IconChevronRight, IconAward, IconClipboard
} from "@/components/Icons";
import ProPaywall from "@/components/ProPaywall";
import { RANK_TIERS, PlayerTier } from "@/lib/constants";

const DEFAULT_STUDENT_PASSWORD = "kickxpro123";

interface Student {
  id: string;
  full_name: string;
  email: string;
  position: string;
  age: number | null;
  overall_score: number;
  tier: PlayerTier;
}

interface NewCredentials {
  name: string;
  email: string;
  password: string;
}

export default function MyStudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscriptionTier, setSubscriptionTier] = useState("free");

  // Add student form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPosition, setNewPosition] = useState("MID");
  const [newAge, setNewAge] = useState("");
  const [newLevel, setNewLevel] = useState<PlayerTier>("Beginner");
  const [newMedicalInjuries, setNewMedicalInjuries] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [lastCredentials, setLastCredentials] = useState<NewCredentials | null>(null);

  useEffect(() => {
    if (!user) return;
    loadStudents();
  }, [user]);

  async function loadStudents() {
    if (!user) return;
    setLoading(true);

    const { data: coachData } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", user.id)
      .single();
      
    if (coachData && coachData.subscription_tier) {
      setSubscriptionTier(coachData.subscription_tier);
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "player")
      .eq("coach_id", user.id)
      .order("full_name");

    if (!error && data) {
      setStudents(data.map(p => ({
        id: p.id,
        full_name: p.full_name || "Unknown",
        email: p.email || "",
        position: p.position || "MID",
        age: p.age,
        overall_score: p.overall_score || 0,
        tier: (p.tier as PlayerTier) || "Beginner",
      })));
    }
    setLoading(false);
  }

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !newName.trim() || !newEmail.trim()) return;

    setSaving(true);
    setError("");

    try {
      // Step 1: Check if this email already exists as a user
      // We try to sign them up — if they already exist, we get an error
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: newEmail.trim(),
        password: DEFAULT_STUDENT_PASSWORD,
      });

      let playerId: string | null = null;

      if (signUpError) {
        // User might already exist — try to find them by email in profiles
        // For local Supabase, the error message may vary
        if (signUpError.message.includes("already registered") || signUpError.message.includes("already been registered")) {
          // Find the existing user's profile
          const { data: existing } = await supabase
            .from("profiles")
            .select("id, coach_id")
            .eq("role", "player")
            .limit(100);

          // We need to match by email — but profiles don't have email.
          // In this case, show proper feedback
          setError("A user with this email already exists. If they're already a player in the system, ask them to log in — they'll automatically appear in your roster.");
          setSaving(false);
          return;
        } else {
          throw signUpError;
        }
      }

      if (signUpData?.user) {
        playerId = signUpData.user.id;

        // Step 2: Create/update their profile and link to this coach
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: playerId,
          full_name: newName.trim(),
          email: newEmail.trim(),
          role: "player",
          position: newPosition,
          age: newAge ? parseInt(newAge) : null,
          tier: newLevel,
          medical_injuries: newMedicalInjuries,
          overall_score: 0,
          coach_id: user.id,
          academy_id: null,
        });

        if (profileError) throw profileError;

        // Step 3: Add to local state
        setStudents(prev => [...prev, {
          id: playerId!,
          full_name: newName.trim(),
          email: newEmail.trim(),
          position: newPosition,
          age: newAge ? parseInt(newAge) : null,
          overall_score: 0,
          tier: newLevel,
        }]);

        // Step 4: Show credentials so coach can share with student
        setLastCredentials({
          name: newName.trim(),
          email: newEmail.trim(),
          password: DEFAULT_STUDENT_PASSWORD,
        });

        // Reset form
        setNewName("");
        setNewEmail("");
        setNewPosition("MID");
        setNewAge("");
        setNewLevel("Beginner");
        setNewMedicalInjuries("");
        setShowAddForm(false);
        showToast(`${newName.trim()} added to your squad! 🎉`);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    }

    setSaving(false);
  }

  async function removeStudent(studentId: string, studentName: string) {
    if (!confirm(`Remove ${studentName} from your squad? They can still log in but won't be linked to you.`)) return;

    await supabase.from("profiles").update({ coach_id: null }).eq("id", studentId);
    setStudents(prev => prev.filter(s => s.id !== studentId));
    showToast(`${studentName} removed from squad`);
  }

  async function handleTierChange(studentId: string, oldTier: PlayerTier, newTier: PlayerTier, currentScore: number) {
    if (oldTier === newTier) return;
    
    const tierOrder = ["Beginner", "Intermediate", "Advanced", "Elite", "Pro"];
    const oldIndex = tierOrder.indexOf(oldTier);
    const newIndex = tierOrder.indexOf(newTier);
    
    // Difference in levels (e.g., +1 for Beginner -> Intermediate)
    const diff = newIndex - oldIndex;
    
    // If upgrading, score drops by 20 per tier level. If demoting, score increases.
    const scoreDiff = diff * 20;
    let newScore = currentScore - scoreDiff;
    
    // Ensure bounds (0-100 logic roughly)
    if (newScore < 0) newScore = 0;
    if (newScore > 100) newScore = 100;
    
    // Optimistic UI update
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, tier: newTier, overall_score: newScore } : s));
    
    const { error } = await supabase.from("profiles").update({ tier: newTier, overall_score: newScore }).eq("id", studentId);
    if (error) {
      showToast("Failed to update tier.");
      loadStudents(); // revert
    } else {
      // Adjust all historical evaluations so radars and report cards scale down/up automatically
      const { data: evals } = await supabase.from("evaluations").select("*").eq("player_id", studentId);
      if (evals && evals.length > 0) {
        for (const e of evals) {
          if (e.scores) {
            const updatedScores: Record<string, number> = { ...e.scores };
            for (const key in updatedScores) {
               updatedScores[key] = Math.max(0, Math.min(100, updatedScores[key] - scoreDiff));
            }
            await supabase.from("evaluations").update({ scores: updatedScores }).eq("id", e.id);
          }
        }
      }
      showToast(`Tier updated to ${newTier}. Historical scores scaled by ${-scoreDiff}.`);
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  const positions = ["GK", "CB", "LB", "RB", "MID", "CM", "LW", "RW", "ST", "FWD"];

  return (
    <div className="max-w-4xl mx-auto pb-24 px-4 xl:px-0 opacity-0 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-slate-900 leading-tight" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}>
            My Students
          </h1>
          <p className="text-slate-500 font-medium text-xs md:text-sm">Add students to your squad and manage your roster.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary flex items-center gap-2 self-start"
        >
          <IconPlus size={16} /> Add Student
        </button>
      </div>

      {/* Add Student Form or Paywall */}
      {showAddForm && (
        subscriptionTier !== "pro" && students.length >= 10 ? (
          <div className="animate-fade-up">
            <ProPaywall featureName="Add more than 10 players" />
          </div>
        ) : (
        <div className="card-static p-6 mb-8 animate-fade-up border-2 border-emerald-100">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-1 flex items-center gap-2" style={{ fontFamily: "var(--font-heading)" }}>
            <IconUser size={16} color="#10B981" /> Add a New Student
          </h3>
          <p className="text-xs text-slate-500 mb-5">Enter their details below. They'll be instantly added to your squad.</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleAddStudent}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Student Name *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Arjun Mehta"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Email *</label>
                <input
                  type="email"
                  className="input"
                  placeholder="student@example.com"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Position</label>
                <div className="flex flex-wrap gap-1.5">
                  {positions.map(pos => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => setNewPosition(pos)}
                      className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all"
                      style={{
                        background: newPosition === pos ? "rgba(16,185,129,0.1)" : "#FFF",
                        color: newPosition === pos ? "#059669" : "var(--color-text-muted)",
                        borderColor: newPosition === pos ? "#10B981" : "var(--color-border)",
                      }}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Age</label>
                <input
                  type="number"
                  className="input"
                  placeholder="e.g. 16"
                  value={newAge}
                  onChange={e => setNewAge(e.target.value)}
                  min="5"
                  max="35"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Level</label>
                <select
                  className="input"
                  value={newLevel}
                  onChange={e => setNewLevel(e.target.value as PlayerTier)}
                >
                  {Object.keys(RANK_TIERS).map(tier => (
                    <option key={tier} value={tier}>{tier}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Past Medical Injuries (Optional)</label>
                <textarea
                  className="input min-h-[42px] py-2"
                  placeholder="e.g. Sprained ankle in 2023"
                  value={newMedicalInjuries}
                  onChange={e => setNewMedicalInjuries(e.target.value)}
                  rows={1}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving || !newName.trim() || !newEmail.trim()} className="btn-primary disabled:opacity-50 flex items-center gap-2">
                {saving ? "Adding..." : "Add to My Squad"}
                {!saving && <IconChevronRight size={14} />}
              </button>
              <button type="button" onClick={() => { setShowAddForm(false); setError(""); }} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
        )
      )}

      {/* ── Credentials Card (shown after adding a student) ── */}
      {lastCredentials && (
        <div className="card-static p-6 mb-6 border-2 border-emerald-200 bg-emerald-50/30 animate-fade-up">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="font-bold text-emerald-800 text-sm flex items-center gap-2" style={{ fontFamily: "var(--font-heading)" }}>
                <IconCheck size={16} /> Student Added Successfully!
              </h3>
              <p className="text-xs text-emerald-600 mt-1">Share these login details with <strong>{lastCredentials.name}</strong> so they can access their Player Portal.</p>
            </div>
            <button onClick={() => setLastCredentials(null)} className="text-emerald-400 hover:text-emerald-600 text-lg font-bold">✕</button>
          </div>
          <div className="bg-white rounded-xl border border-emerald-200 p-4 space-y-3 relative">
            <button 
              onClick={() => {
                navigator.clipboard.writeText(`Login URL: ${window.location.origin}/login\nEmail: ${lastCredentials.email}\nPassword: ${lastCredentials.password}`);
                showToast("Credentials copied to clipboard!");
              }}
              className="absolute top-2 right-2 p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              title="Copy credentials"
            >
              <IconClipboard size={16} />
            </button>
            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">Email</div>
              <div className="font-bold text-slate-900 text-sm font-mono break-all text-right max-w-[70%]">{lastCredentials.email}</div>
            </div>
            <div className="border-t border-slate-100" />
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Password</div>
              <div className="font-bold text-emerald-700 text-sm font-mono bg-emerald-50 px-3 py-1 rounded-lg">{lastCredentials.password}</div>
            </div>
            <div className="border-t border-slate-100" />
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Login URL</div>
              <div className="text-xs text-slate-500 font-mono">localhost:3000/login</div>
            </div>
          </div>
          <p className="text-[10px] text-amber-600 font-bold mt-3">⚠️ Please note: the student should change this password after first login.</p>
        </div>
      )}

      {/* Student Count */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
          <IconUsers size={14} />
          <span className="text-xs font-bold">{students.length} Student{students.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Student List */}
      {loading ? (
        <div className="card-static p-12 text-center text-sm text-slate-400">Loading your students...</div>
      ) : students.length === 0 ? (
        <div className="card-static p-12 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <IconUsers size={32} color="#CBD5E1" />
          </div>
          <h3 className="text-lg font-bold text-slate-400 mb-2">No students yet</h3>
          <p className="text-sm text-slate-400 mb-6">Tap the "Add Student" button above to add your first player.</p>
          <button onClick={() => setShowAddForm(true)} className="btn-primary inline-flex items-center gap-2">
            <IconPlus size={16} /> Add Your First Student
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {students.map((student, i) => (
            <div
              key={student.id}
              className="card-static p-4 flex items-center gap-4 group hover:shadow-md transition-all opacity-0 animate-fade-up"
              style={{ animationDelay: `${0.05 + i * 0.03}s`, animationFillMode: "forwards" }}
            >
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
                {student.full_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 text-sm truncate">{student.full_name}</h3>
                {student.email && (
                  <div className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{student.email}</div>
                )}
                <div className="flex gap-2 text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                  <span>{student.position}</span>
                  {student.age && <><span>•</span><span>AGE {student.age}</span></>}
                </div>
              </div>

              {/* Score Badge & Tier Select */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <select 
                    value={student.tier}
                    onChange={(e) => handleTierChange(student.id, student.tier, e.target.value as PlayerTier, student.overall_score)}
                    className="text-[10px] font-bold uppercase tracking-widest bg-slate-50 border border-slate-200 rounded-md px-2 py-1 outline-none focus:border-emerald-400 cursor-pointer text-slate-700"
                    style={{ color: RANK_TIERS[student.tier]?.color || '#10B981' }}
                  >
                    {Object.keys(RANK_TIERS).map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  {student.overall_score > 0 && (
                    <div className="text-[10px] text-slate-500 font-bold mt-1">
                      Score: {(student.overall_score / 10).toFixed(1)}/10
                    </div>
                  )}
                </div>

                {/* Remove button */}
                <button
                  onClick={() => removeStudent(student.id, student.full_name)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                  title="Remove from squad"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
