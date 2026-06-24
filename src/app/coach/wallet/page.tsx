"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { IconClipboard, IconUsers, IconActivity, IconCheck } from "@/components/Icons";

export default function CoachWalletPage() {
  const { user, profile } = useAuth();
  const [referralCode, setReferralCode] = useState<string>("");
  const [referredPlayers, setReferredPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user || !profile) return;
    loadWalletData();
  }, [user, profile]);

  async function loadWalletData() {
    try {
      setLoading(true);
      let currentCode = profile?.referral_code;

      // 1. Generate referral code if none exists
      if (!currentCode) {
        currentCode = `COACH-${profile?.full_name?.split(" ")[0].toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
        await supabase.from("profiles").update({ referral_code: currentCode }).eq("id", user?.id);
      }
      setReferralCode(currentCode);

      // 2. Fetch referred players
      const { data: players } = await supabase
        .from("profiles")
        .select("id, full_name, created_at, academy_id")
        .eq("referred_by_coach_id", user?.id);

      if (players) setReferredPlayers(players);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Wallet...</div>;

  const estimatedEarnings = referredPlayers.length * 5.00; // $5 per player placeholder

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2 font-heading">Affiliate Wallet</h1>
        <p className="text-slate-500 text-sm">Manage your referrals, track your students, and view payouts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Referral Code Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <IconClipboard size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Your Coach Code</h2>
              <p className="text-xs text-slate-500">Share this with your players when they sign up</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono font-bold text-slate-800 text-lg tracking-wider">
              {referralCode}
            </div>
            <button 
              onClick={copyCode}
              className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                copied ? "bg-emerald-100 text-emerald-700" : "bg-slate-900 text-white hover:bg-slate-800"
              }`}
            >
              {copied ? <><IconCheck size={16} /> Copied</> : "Copy Code"}
            </button>
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-emerald-600 rounded-2xl p-6 shadow-sm text-white relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500 rounded-full opacity-50 blur-2xl pointer-events-none" />
          <h2 className="font-bold text-emerald-100 text-sm mb-1">Est. Monthly Earnings</h2>
          <div className="text-4xl font-black tracking-tight mb-4">${estimatedEarnings.toFixed(2)}</div>
          
          <button disabled className="w-full bg-white/20 hover:bg-white/30 transition-colors text-white text-xs font-bold py-2.5 rounded-lg backdrop-blur-sm">
            Connect Stripe (Coming Soon)
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <IconUsers size={18} className="text-slate-400" />
            Referred Players ({referredPlayers.length})
          </h3>
        </div>
        
        {referredPlayers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <IconUsers size={24} />
            </div>
            <h4 className="font-bold text-slate-900 mb-1">No players yet</h4>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Share your Coach Code with your team. When they sign up for KickXPro Premium, they'll appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {referredPlayers.map((player) => (
              <div key={player.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                    {player.full_name?.charAt(0) || "P"}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{player.full_name}</div>
                    <div className="text-xs text-slate-500">Joined {new Date(player.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md uppercase tracking-wider">
                  Active
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
