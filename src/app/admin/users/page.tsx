/* ──────────────────────────────────────────────
   ADMIN USERS — User management page with
   create user form and deactivation.
   ────────────────────────────────────────────── */
"use client";

import { useState, useEffect } from "react";

/* ── Types ── */
interface PlatformUser {
  uid: string;
  name: string;
  role: string;
  academy: string;
  status: string;
  created: string;
}

/* ── Demo data ── */
const DEMO_USERS: PlatformUser[] = [
  { uid: "COACH_001", name: "Coach Anita", role: "C", academy: "Trinity FC", status: "active", created: "2026-03-14" },
  { uid: "P001", name: "Arjun Mehta", role: "P", academy: "Trinity FC", status: "active", created: "2026-03-13" },
  { uid: "P002", name: "Neha Singh", role: "P", academy: "Trinity FC", status: "active", created: "2026-03-12" },
  { uid: "COACH_002", name: "Coach Vikram", role: "C", academy: "Star Sports", status: "active", created: "2026-03-11" },
  { uid: "P003", name: "Rahul Joshi", role: "P", academy: "Star Sports", status: "inactive", created: "2026-03-10" },
  { uid: "ADMIN_001", name: "Super Admin", role: "A", academy: "", status: "active", created: "2026-02-01" },
];

export default function UsersPage() {
  const [users, setUsers] = useState<PlatformUser[]>(DEMO_USERS);
  const [showForm, setShowForm] = useState(false);
  const [isLive, setIsLive] = useState(false);

  // New user form
  const [newUid, setNewUid] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("P");
  const [newAcademy, setNewAcademy] = useState("");

  /* Try to load live data */
  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    fetch(`${apiBase}/admin/users`)
      .then((res) => res.json())
      .then((data) => {
        if (data.users?.length > 0) {
          setUsers(data.users);
          setIsLive(true);
        }
      })
      .catch(() => {/* Demo */});
  }, []);

  /** Handle create user */
  async function handleCreate() {
    if (!newUid || !newName) return;

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    try {
      await fetch(`${apiBase}/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: newUid, name: newName, role: newRole, academy: newAcademy }),
      });
    } catch {
      /* demo mode — just add locally */
    }

    setUsers((prev) => [
      { uid: newUid.toUpperCase(), name: newName, role: newRole, academy: newAcademy, status: "active", created: new Date().toISOString() },
      ...prev,
    ]);
    setNewUid("");
    setNewName("");
    setNewRole("P");
    setNewAcademy("");
    setShowForm(false);
  }

  /** Handle deactivate */
  async function handleDeactivate(uid: string) {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    try {
      await fetch(`${apiBase}/admin/users/${uid}/deactivate`, { method: "PUT" });
    } catch {
      /* demo */
    }
    setUsers((prev) =>
      prev.map((u) => (u.uid === uid ? { ...u, status: "inactive" } : u))
    );
  }

  /** Role config */
  function roleConfig(role: string) {
    const config: Record<string, { label: string; color: string; bg: string }> = {
      C: { label: "Coach", color: "#60A5FA", bg: "rgba(96,165,250,0.1)" },
      P: { label: "Player", color: "#00C853", bg: "rgba(0,200,83,0.1)" },
      A: { label: "Admin", color: "#A78BFA", bg: "rgba(167,139,250,0.1)" },
    };
    return config[role] || { label: role, color: "#8896A7", bg: "rgba(255,255,255,0.05)" };
  }

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-bold mb-1"
            style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}
          >
            User Management
          </h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Create, view, and manage platform users
          </p>
        </div>
        <button
          className="btn-primary flex items-center gap-2"
          onClick={() => setShowForm(!showForm)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          Add User
        </button>
      </div>

      {/* Data indicator */}
      <div className="flex items-center gap-2 mb-6">
        <span
          className="w-2 h-2 rounded-full"
          style={{
            background: isLive ? "#00C853" : "#F59E0B",
            boxShadow: isLive ? "0 0 8px #00C853" : "0 0 8px #F59E0B",
          }}
        />
        <span className="text-xs" style={{ color: "var(--color-text-dim)" }}>
          {isLive ? "Live data" : "Demo data"} · {users.length} users
        </span>
      </div>

      {/* Create User Form */}
      {showForm && (
        <div
          className="card-static p-6 mb-6 animate-fade-up"
          style={{ animationFillMode: "forwards" }}
        >
          <h3 className="text-sm font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
            New User
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--color-text-dim)" }}>UID</label>
              <input className="input" placeholder="e.g. P004" value={newUid} onChange={(e) => setNewUid(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--color-text-dim)" }}>Name</label>
              <input className="input" placeholder="Full name" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--color-text-dim)" }}>Role</label>
              <select className="input" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                <option value="P">Player</option>
                <option value="C">Coach</option>
                <option value="A">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--color-text-dim)" }}>Academy</label>
              <input className="input" placeholder="Academy name" value={newAcademy} onChange={(e) => setNewAcademy(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3">
            <button className="btn-primary" onClick={handleCreate}>Create User</button>
            <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="card-static overflow-hidden">
        {/* Header */}
        <div
          className="grid grid-cols-6 gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b"
          style={{ color: "var(--color-text-dim)", borderColor: "var(--color-border)" }}
        >
          <span>User</span>
          <span>UID</span>
          <span>Role</span>
          <span>Academy</span>
          <span>Status</span>
          <span>Action</span>
        </div>

        {/* Rows */}
        {users.map((user, i) => {
          const rc = roleConfig(user.role);
          return (
            <div
              key={user.uid}
              className="grid grid-cols-6 gap-4 px-5 py-3.5 border-b items-center opacity-0 animate-fade-up"
              style={{
                borderColor: "var(--color-border)",
                animationDelay: `${0.05 + i * 0.03}s`,
                animationFillMode: "forwards",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: rc.bg, color: rc.color }}
                >
                  {user.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <span className="text-sm font-medium truncate">{user.name}</span>
              </div>
              <span className="text-xs font-mono" style={{ color: "var(--color-text-dim)" }}>{user.uid}</span>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full w-fit"
                style={{ background: rc.bg, color: rc.color }}
              >
                {rc.label}
              </span>
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{user.academy || "—"}</span>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full w-fit"
                style={{
                  background: user.status === "active" ? "rgba(0,200,83,0.1)" : "rgba(239,68,68,0.1)",
                  color: user.status === "active" ? "#00C853" : "#EF4444",
                }}
              >
                {user.status}
              </span>
              <div>
                {user.status === "active" && (
                  <button
                    onClick={() => handleDeactivate(user.uid)}
                    className="text-xs px-3 py-1 rounded-full transition-all"
                    style={{
                      background: "rgba(239,68,68,0.08)",
                      color: "#EF4444",
                      border: "1px solid rgba(239,68,68,0.15)",
                    }}
                  >
                    Deactivate
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
