"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import { IconChevronRight } from "@/components/Icons";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Fetch profile to route appropriately
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      router.push("/admin"); // fallback if profile is missing
      return;
    }

    console.log("Logged in user role:", profile?.role);

    if (profile?.role === "coach") {
      router.push("/coach");
    } else if (profile?.role === "player") {
      router.push("/player");
    } else if (profile?.role === "parent") {
      router.push("/parent");
    } else if (profile?.role === "admin") {
      router.push("/admin");
    } else {
      router.push("/"); // final fallback
    }
  }

  return (
    <div className="min-h-screen flex flex-col noise-overlay">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm card p-6">
          <h1 className="text-2xl font-bold mb-2 font-heading text-center">Login</h1>
          <p className="text-xs text-center text-slate-500 mb-6">Welcome back to KickXPro</p>

          {error && (
            <div className="mb-4 p-3 bg-red-100/10 border border-red-500/20 text-red-500 text-xs rounded-xl text-center font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider text-slate-500">
                Email
              </label>
              <input
                type="email"
                className="input w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider text-slate-500">
                Password
              </label>
              <input
                type="password"
                className="input w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 mt-4"
            >
              {loading ? "Authenticating..." : "Sign In"}
              {!loading && <IconChevronRight size={16} />}
            </button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-3 text-sm font-medium">
            <div className="text-slate-500">
              Don't have an account?{" "}
              <Link href="/register" className="text-emerald-600 hover:text-emerald-700 font-bold underline">
                Sign Up
              </Link>
            </div>
            <Link href="/" className="text-slate-400 hover:text-slate-600 flex items-center gap-1">
              ← Back to Home
            </Link>
          </div>
          
          <div className="mt-6 pt-6 border-t border-slate-200/50 text-center">
             <p className="text-xs text-slate-500 mb-2 font-semibold">Test / Demo Accounts:</p>
             <div className="text-[10px] space-y-2 font-mono text-slate-400 bg-slate-50/50 p-3 rounded-xl border border-slate-200/30">
               <div>
                <span className="text-slate-600 font-bold block mb-0.5 uppercase tracking-tighter">Coach</span>
                coach.ramesh@kickxpro.test / kickxpro123
               </div>
               <div>
                <span className="text-slate-600 font-bold block mb-0.5 uppercase tracking-tighter">Player</span>
                arjun.mehta@kickxpro.test / kickxpro123
               </div>
               <div>
                <span className="text-slate-600 font-bold block mb-0.5 uppercase tracking-tighter">Parent</span>
                parent.mehta@kickxpro.test / kickxpro123
               </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
