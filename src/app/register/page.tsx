/* ──────────────────────────────────────────────
   REGISTRATION PAGE — Role selection + form
   for new players and coaches.
   ────────────────────────────────────────────── */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { IconUser, IconClipboard, IconChevronRight, IconCheck } from "@/components/Icons";

type Role = "player" | "coach";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [academy, setAcademy] = useState("");
  const [extra, setExtra] = useState(""); // position for player, specialty for coach
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role || !name || !email) return;

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const uid = `${role === "player" ? "P" : "C"}_${Date.now()}`;

    try {
      await fetch(`${apiBase}/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          name,
          role: role === "player" ? "P" : "C",
          academy,
        }),
      });
    } catch {
      /* demo mode — continue anyway */
    }

    setSubmitted(true);
    setTimeout(() => {
      router.push(role === "player" ? "/player" : "/coach");
    }, 2000);
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="opacity-0 animate-scale-in" style={{ animationFillMode: "forwards" }}>
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: "rgba(0,200,83,0.12)" }}
            >
              <IconCheck size={32} color="#00C853" />
            </div>
            <h2
              className="text-2xl font-bold text-center mb-2"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Welcome, {name}!
            </h2>
            <p className="text-sm text-center" style={{ color: "var(--color-text-muted)" }}>
              Redirecting to your {role} dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Ambient glows */}
      <div
        className="fixed rounded-full pointer-events-none"
        style={{ width: 400, height: 400, background: "rgba(0,200,83,0.04)", filter: "blur(120px)", top: -100, left: "20%" }}
      />
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-5 py-10 relative z-10">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8 opacity-0 animate-fade-up" style={{ animationFillMode: "forwards" }}>
            <h1
              className="text-2xl font-bold mb-2"
              style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}
            >
              Join <span className="text-gradient">KickXPro</span>
            </h1>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              Select your role and create your profile
            </p>
          </div>

          {/* Role Selection */}
          {!role && (
            <div className="space-y-3 opacity-0 animate-fade-up" style={{ animationDelay: "0.15s", animationFillMode: "forwards" }}>
              <button
                onClick={() => setRole("player")}
                className="w-full glass-card flex items-center gap-4 text-left transition-all hover:border-[rgba(0,200,83,0.3)] group"
                style={{ padding: "20px", cursor: "pointer", border: "1px solid var(--color-border)" }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(0,200,83,0.08)" }}
                >
                  <IconUser size={22} color="#00C853" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm mb-0.5" style={{ fontFamily: "var(--font-heading)" }}>
                    I&apos;m a Player
                  </div>
                  <div className="text-xs" style={{ color: "var(--color-text-dim)" }}>
                    Track your progress, view evaluations, and level up
                  </div>
                </div>
                <IconChevronRight size={16} color="var(--color-text-dim)" />
              </button>

              <button
                onClick={() => setRole("coach")}
                className="w-full glass-card flex items-center gap-4 text-left transition-all hover:border-[rgba(96,165,250,0.3)] group"
                style={{ padding: "20px", cursor: "pointer", border: "1px solid var(--color-border)" }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(96,165,250,0.08)" }}
                >
                  <IconClipboard size={22} color="#60A5FA" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm mb-0.5" style={{ fontFamily: "var(--font-heading)" }}>
                    I&apos;m a Coach
                  </div>
                  <div className="text-xs" style={{ color: "var(--color-text-dim)" }}>
                    Run sessions, evaluate players, and build your reputation
                  </div>
                </div>
                <IconChevronRight size={16} color="var(--color-text-dim)" />
              </button>
            </div>
          )}

          {/* Registration Form */}
          {role && (
            <form onSubmit={handleSubmit} className="space-y-4 opacity-0 animate-fade-up" style={{ animationFillMode: "forwards" }}>
              {/* Role badge */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider"
                    style={{
                      background: role === "player" ? "rgba(0,200,83,0.1)" : "rgba(96,165,250,0.1)",
                      color: role === "player" ? "#00C853" : "#60A5FA",
                      border: `1px solid ${role === "player" ? "rgba(0,200,83,0.2)" : "rgba(96,165,250,0.2)"}`,
                    }}
                  >
                    {role}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setRole(null)}
                  className="text-xs no-underline"
                  style={{ color: "var(--color-text-dim)", background: "none", border: "none", cursor: "pointer" }}
                >
                  Change role
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--color-text-dim)" }}>
                  Full Name *
                </label>
                <input
                  className="input"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--color-text-dim)" }}>
                  Email *
                </label>
                <input
                  className="input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--color-text-dim)" }}>
                  Academy
                </label>
                <input
                  className="input"
                  placeholder="Academy or club name"
                  value={academy}
                  onChange={(e) => setAcademy(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--color-text-dim)" }}>
                  {role === "player" ? "Position" : "Coaching Specialty"}
                </label>
                <input
                  className="input"
                  placeholder={role === "player" ? "e.g. Midfielder, Striker" : "e.g. Youth Development, Fitness"}
                  value={extra}
                  onChange={(e) => setExtra(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-primary w-full mt-6 py-3 text-sm flex items-center justify-center gap-2">
                Create Account
                <IconChevronRight size={16} />
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
