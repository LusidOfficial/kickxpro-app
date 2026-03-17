/* ──────────────────────────────────────────────
   ADMIN DASHBOARD — Platform stats overview,
   recent activity, and quick actions.
   Updated with professional SVG icons.
   ────────────────────────────────────────────── */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import StatCard from "@/components/StatCard";
import { IconUsers, IconUser, IconClipboard, IconTrophy, IconAward, IconActivity, IconBarChart } from "@/components/Icons";

const DEMO_STATS = { total_users: 24, coaches: 6, players: 16, admins: 2, total_notes: 48, total_academies: 3, total_sessions: 87 };
const DEMO_RECENT_USERS = [
  { uid: "COACH_001", name: "Coach Anita", role: "C", academy: "Trinity FC", status: "active", created: "2026-03-14" },
  { uid: "P001", name: "Arjun Mehta", role: "P", academy: "Trinity FC", status: "active", created: "2026-03-13" },
  { uid: "P002", name: "Neha Singh", role: "P", academy: "Trinity FC", status: "active", created: "2026-03-12" },
  { uid: "COACH_002", name: "Coach Vikram", role: "C", academy: "Star Sports", status: "active", created: "2026-03-11" },
  { uid: "P003", name: "Rahul Joshi", role: "P", academy: "Star Sports", status: "inactive", created: "2026-03-10" },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(DEMO_STATS);
  const [users, setUsers] = useState(DEMO_RECENT_USERS);
  const [isLive, setIsLive] = useState(false);
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    fetch(`${apiBase}/admin/stats`).then((r) => r.json()).then((d) => { if (d.total_users !== undefined) { setStats(d); setIsLive(true); } }).catch(() => {});
    fetch(`${apiBase}/admin/users`).then((r) => r.json()).then((d) => { if (d.users?.length > 0) setUsers(d.users); }).catch(() => {});
  }, []);

  function roleLabel(role: string) {
    const config: Record<string, { label: string; color: string; bg: string }> = {
      C: { label: "Coach", color: "#60A5FA", bg: "rgba(96,165,250,0.1)" },
      P: { label: "Player", color: "#00C853", bg: "rgba(0,200,83,0.1)" },
      A: { label: "Admin", color: "#A78BFA", bg: "rgba(167,139,250,0.1)" },
    };
    const c = config[role] || { label: role, color: "#8896A7", bg: "rgba(255,255,255,0.05)" };
    return <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: c.bg, color: c.color }}>{c.label}</span>;
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 card-static text-center animate-fade-up border-2 border-indigo-100">
         <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
           <IconAward size={32} color="#A78BFA" />
         </div>
         <h1 className="text-2xl font-bold mb-2 text-slate-900" style={{ fontFamily: "var(--font-heading)" }}>Admin Portal Access</h1>
         <p className="text-sm text-slate-500 mb-8 px-4">Protected Route. Please enter the master password to access platform ops.</p>
         <input 
           type="password" 
           value={password} 
           onChange={e => setPassword(e.target.value)} 
           onKeyDown={e => { if (e.key === 'Enter' && password === 'kickxadmin26') setIsAuthenticated(true); }}
           className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-center tracking-widest text-slate-900 font-bold outline-none focus:border-indigo-400 focus:bg-white transition-all mb-4" 
           placeholder="••••••••" 
         />
         <button 
           onClick={() => { if(password === 'kickxadmin26') setIsAuthenticated(true); }}
           className="w-full btn-primary bg-indigo-600 hover:bg-indigo-700 shadow-md font-bold py-3 text-sm"
         >
           Authenticate
         </button>
         <div className="mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-50">Demo Pass: kickxadmin26</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}>Admin Dashboard</h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Platform operations &amp; analytics overview</p>
        </div>
        <Link href="/admin/users" className="btn-secondary flex items-center gap-2 no-underline text-sm">
          <IconUsers size={14} /> Manage Users
        </Link>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <span className="w-2 h-2 rounded-full" style={{ background: isLive ? "#00C853" : "#F59E0B", boxShadow: isLive ? "0 0 8px #00C853" : "0 0 8px #F59E0B" }} />
        <span className="text-xs" style={{ color: "var(--color-text-dim)" }}>{isLive ? "Live data" : "Demo data"}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard value={stats.total_users} label="Total Users" icon={<IconUsers size={18} color="#A78BFA" />} accentColor="#A78BFA" delay={0.1} />
        <StatCard value={stats.coaches} label="Coaches" icon={<IconUser size={18} color="#60A5FA" />} accentColor="#60A5FA" delay={0.15} />
        <StatCard value={stats.players} label="Players" icon={<IconActivity size={18} color="#00C853" />} accentColor="#00C853" delay={0.2} />
        <StatCard value={stats.total_sessions} label="Sessions" icon={<IconClipboard size={18} color="#A78BFA" />} accentColor="#A78BFA" delay={0.25} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard value={stats.total_notes} label="Coach Notes" icon={<IconBarChart size={18} color="#60A5FA" />} accentColor="#60A5FA" delay={0.3} />
        <StatCard value={stats.total_academies} label="Academies" icon={<IconTrophy size={18} color="#A78BFA" />} accentColor="#A78BFA" delay={0.35} />
        <StatCard value={stats.admins} label="Admins" icon={<IconAward size={18} color="#F59E0B" />} accentColor="#F59E0B" delay={0.4} />
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-heading)" }}>Recent Users</h2>
          <Link href="/admin/users" className="text-xs font-semibold no-underline" style={{ color: "#A78BFA" }}>View All →</Link>
        </div>
        <div className="card-static overflow-hidden">
          <div className="grid grid-cols-5 gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b" style={{ color: "var(--color-text-dim)", borderColor: "var(--color-border)" }}>
            <span>User</span><span>Role</span><span>Academy</span><span>Status</span><span>Created</span>
          </div>
          {users.slice(0, 5).map((user, i) => (
            <div key={user.uid} className="grid grid-cols-5 gap-4 px-5 py-3.5 border-b opacity-0 animate-fade-up items-center" style={{ borderColor: "var(--color-border)", animationDelay: `${0.1 + i * 0.05}s`, animationFillMode: "forwards" }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: "rgba(167,139,250,0.1)", color: "#A78BFA" }}>
                  {user.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <span className="text-sm font-medium truncate">{user.name}</span>
              </div>
              <div>{roleLabel(user.role)}</div>
              <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{user.academy || "—"}</div>
              <div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: user.status === "active" ? "rgba(0,200,83,0.1)" : "rgba(239,68,68,0.1)", color: user.status === "active" ? "#00C853" : "#EF4444" }}>{user.status}</span>
              </div>
              <div className="text-xs" style={{ color: "var(--color-text-dim)" }}>{user.created ? new Date(user.created).toLocaleDateString() : "—"}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
