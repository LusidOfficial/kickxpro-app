/* ──────────────────────────────────────────────
   COACH EARNINGS & PAYOUTS HUB
   Monetization center for the "Coach Pro" SKU.
   Features: Referral Payouts (₹750-₹1250),
   Subscription status, and Fraud flags.
   ────────────────────────────────────────────── */
"use client";

import { useState } from "react";
import StatCard from "@/components/StatCard";
import { 
  IconWallet, IconUsers, IconTrendingUp, IconActivity,
  IconCheck, IconShield, IconStar
} from "@/components/Icons";

const REFERRALS = [
  { id: "R1", name: "Karan Johar", date: "2026-03-20", status: "Validated", amount: 1250 },
  { id: "R2", name: "Ananya P.", date: "2026-03-18", status: "Pending (Trial)", amount: 0 },
  { id: "R3", name: "Samarth V.", date: "2026-03-15", status: "Validated", amount: 750 },
  { id: "R4", name: "Ritika S.", date: "2026-03-10", status: "Flagged", amount: 0 },
];

export default function CoachEarningsPage() {
  const [activePlan, setActivePlan] = useState("Coach Pro");
  
  const totalEarnings = REFERRALS.filter(r => r.status === "Validated").reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="max-w-5xl space-y-10 pb-20 opacity-0 animate-fade-up">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-slate-900" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}>
            Earnings Hub
          </h1>
          <p className="text-slate-500 font-medium">Track your referral payouts, subscription status, and performance bonuses.</p>
        </div>
        <div className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl flex items-center gap-3 shadow-xl">
           <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plan:</div>
           <div className="text-sm font-black text-emerald-400 flex items-center gap-2">
             {activePlan} <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
           </div>
        </div>
      </div>

      {/* Wallet Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-static p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden group">
           <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
           <IconWallet size={32} color="#10B981" className="mb-4" />
           <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Payouts</div>
           <div className="text-4xl font-black font-heading tracking-tight text-white mb-2">₹{totalEarnings.toLocaleString()}</div>
           <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
             <IconTrendingUp size={12} /> +₹1,250 this week
           </div>
        </div>

        <div className="card-static p-6 relative group">
           <IconUsers size={32} color="#3B82F6" className="mb-4" />
           <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Referred Students</div>
           <div className="text-4xl font-black font-heading tracking-tight text-slate-900 mb-2">14</div>
           <div className="text-xs font-bold text-blue-600">8 Validated • 4 Pending</div>
        </div>

        <div className="card-static p-6 relative group">
           <IconStar size={32} color="#F59E0B" className="mb-4" />
           <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Retention Bonus</div>
           <div className="text-4xl font-black font-heading tracking-tight text-slate-900 mb-2">92%</div>
           <div className="text-xs font-bold text-amber-600">Eligible for ₹5,000 Milestone</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Referral Log */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-heading)" }}>Referral History</h2>
            <button className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 uppercase tracking-widest">New Referral QR</button>
          </div>

          <div className="card-static overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50 border-b">
              <div className="col-span-5">Student</div>
              <div className="col-span-4">Status</div>
              <div className="col-span-3 text-right">Amount</div>
            </div>
            
            <div className="divide-y divide-slate-100">
              {REFERRALS.map(r => (
                <div key={r.id} className="grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-slate-50 transition-colors">
                  <div className="col-span-5">
                    <div className="font-bold text-slate-900 text-sm whitespace-nowrap">{r.name}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{r.date}</div>
                  </div>
                  <div className="col-span-4">
                    <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider
                      ${r.status === 'Validated' ? 'bg-emerald-50 text-emerald-600' : r.status === 'Flagged' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                      {r.status}
                    </span>
                  </div>
                  <div className="col-span-3 text-right font-black text-slate-900 text-sm">
                    {r.amount > 0 ? `₹${r.amount}` : "—"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Plan Info & Anti-Fraud */}
        <div className="space-y-6">
          <div className="card-static p-6 bg-blue-50 border-blue-100">
             <h3 className="text-sm font-bold text-blue-900 uppercase tracking-widest mb-4 flex items-center gap-2">
               <IconShield size={16} /> Coach Pro Rules
             </h3>
             <ul className="space-y-4">
               <li className="flex gap-3">
                 <IconCheck size={16} className="text-blue-600 shrink-0 mt-0.5" />
                 <p className="text-xs text-blue-800 leading-relaxed">
                   <strong>Valid Referral:</strong> Student must attend ≥4 sessions with no refund within 14 days.
                 </p>
               </li>
               <li className="flex gap-3">
                 <IconCheck size={16} className="text-blue-600 shrink-0 mt-0.5" />
                 <p className="text-xs text-blue-800 leading-relaxed">
                   <strong>Anti-Fraud:</strong> Self-referral or suspicious academy clusters will flag payouts for manual review.
                 </p>
               </li>
               <li className="flex gap-3">
                 <IconCheck size={16} className="text-blue-600 shrink-0 mt-0.5" />
                 <p className="text-xs text-blue-800 leading-relaxed">
                   <strong>Threshold:</strong> Payouts process automatically every Friday for balances over ₹2,000.
                 </p>
               </li>
             </ul>
             <button className="w-full mt-6 py-2.5 bg-white text-blue-700 font-bold text-xs uppercase tracking-widest border border-blue-200 rounded-xl hover:bg-white/50 transition-colors">
               Manage Subscription
             </button>
          </div>

          <div className="card-static p-6 border-dashed border-2">
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Earning Tips</h3>
             <p className="text-xs text-slate-400 leading-relaxed italic">
               "Coaches with 100% attendance logging see 40% higher year-over-year retention bonuses. Keep your data consistent!"
             </p>
          </div>
        </div>

      </div>
    </div>
  );
}
