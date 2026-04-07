/* ──────────────────────────────────────────────
   COACH FEE MANAGEMENT
   Simple fee tracker — mark students Paid/Pending,
   view payment history, and send reminders.
   ────────────────────────────────────────────── */
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import StatCard from "@/components/StatCard";
import {
  IconWallet, IconUsers, IconCheck, IconTrendingUp, IconActivity
} from "@/components/Icons";

interface FeeRecord {
  id: string;
  player_id: string;
  player_name: string;
  amount: number;
  month: string;
  status: "Paid" | "Pending" | "Overdue";
  paid_at: string | null;
  due_date: string | null;
}

const MONTHS = (() => {
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toISOString().slice(0, 7));
  }
  return months;
})();

function formatMonth(m: string) {
  const [y, mo] = m.split("-");
  return new Date(parseInt(y), parseInt(mo) - 1).toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

export default function CoachFeesPage() {
  const { user } = useAuth();
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [players, setPlayers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMonth, setActiveMonth] = useState(MONTHS[0]);
  const [defaultAmount, setDefaultAmount] = useState(2000);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user, activeMonth]);

  async function loadData() {
    if (!user) return;
    setLoading(true);

    // 1. Fetch players
    const { data: pData } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "player")
      .eq("coach_id", user.id);

    const playerList = (pData || []).map(p => ({ id: p.id, name: p.full_name || "Unknown" }));
    setPlayers(playerList);

    // 2. Fetch fees for active month
    const { data: fData } = await supabase
      .from("fees")
      .select("*")
      .eq("coach_id", user.id)
      .eq("month", activeMonth);

    // 3. Merge: create a record for each player
    const feeMap = new Map((fData || []).map((f: any) => [f.player_id, f]));
    const merged: FeeRecord[] = playerList.map(p => {
      const existing = feeMap.get(p.id);
      if (existing) {
        return {
          id: existing.id,
          player_id: p.id,
          player_name: p.name,
          amount: existing.amount,
          month: activeMonth,
          status: existing.status,
          paid_at: existing.paid_at,
          due_date: existing.due_date,
        };
      }
      return {
        id: "",
        player_id: p.id,
        player_name: p.name,
        amount: defaultAmount,
        month: activeMonth,
        status: "Pending" as const,
        paid_at: null,
        due_date: null,
      };
    });

    setFees(merged);
    setLoading(false);
  }

  async function toggleFeeStatus(fee: FeeRecord) {
    if (!user) return;
    const newStatus = fee.status === "Paid" ? "Pending" : "Paid";
    const paidAt = newStatus === "Paid" ? new Date().toISOString() : null;

    if (fee.id) {
      // Update existing
      await supabase.from("fees").update({ status: newStatus, paid_at: paidAt }).eq("id", fee.id);
    } else {
      // Insert new
      const { data } = await supabase.from("fees").insert({
        player_id: fee.player_id,
        coach_id: user.id,
        amount: fee.amount,
        month: activeMonth,
        status: newStatus,
        paid_at: paidAt,
      }).select("id").single();
      if (data) fee.id = data.id;
    }

    setFees(prev => prev.map(f =>
      f.player_id === fee.player_id ? { ...f, status: newStatus, paid_at: paidAt, id: fee.id } : f
    ));

    showToast(`${fee.player_name} marked as ${newStatus}`);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  const paidCount = fees.filter(f => f.status === "Paid").length;
  const pendingCount = fees.filter(f => f.status !== "Paid").length;
  const totalCollected = fees.filter(f => f.status === "Paid").reduce((sum, f) => sum + f.amount, 0);

  return (
    <div className="max-w-5xl mx-auto pb-24 px-4 xl:px-0 opacity-0 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-slate-900 leading-tight" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}>
            Fee Management
          </h1>
          <p className="text-slate-500 font-medium text-xs md:text-sm">Track monthly fees for your students. Tap to toggle payment status.</p>
        </div>
      </div>

      {/* Month Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-4 px-4 md:mx-0 md:px-0">
        {MONTHS.map(m => (
          <button
            key={m}
            onClick={() => setActiveMonth(m)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              activeMonth === m
                ? "bg-slate-900 text-white border-slate-900 shadow-md"
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
            }`}
          >
            {formatMonth(m)}
          </button>
        ))}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard value={players.length.toString()} label="Total Students" icon={<IconUsers />} delay={0.1} />
        <StatCard value={paidCount.toString()} label="Paid" icon={<IconCheck />} accentColor="#10B981" delay={0.15} />
        <StatCard value={pendingCount.toString()} label="Pending" icon={<IconActivity />} accentColor="#F59E0B" delay={0.2} />
        <StatCard value={`₹${totalCollected.toLocaleString()}`} label="Collected" icon={<IconWallet />} accentColor="#3B82F6" delay={0.25} />
      </div>

      {/* Fee Table */}
      <div className="card-static overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50 border-b">
          <div className="col-span-5">Student</div>
          <div className="col-span-2 text-center">Amount</div>
          <div className="col-span-3 text-center">Status</div>
          <div className="col-span-2 text-right">Action</div>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-400">Loading fee records...</div>
          ) : fees.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">No students in your roster yet.</div>
          ) : fees.map((fee, i) => (
            <div
              key={fee.player_id}
              className="grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-slate-50 transition-colors opacity-0 animate-fade-up"
              style={{ animationDelay: `${0.1 + i * 0.03}s`, animationFillMode: "forwards" }}
            >
              {/* Player */}
              <div className="col-span-5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                  {fee.player_name.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="font-bold text-slate-900 text-sm truncate">{fee.player_name}</div>
              </div>

              {/* Amount */}
              <div className="col-span-2 text-center font-bold text-sm text-slate-700">
                ₹{fee.amount.toLocaleString()}
              </div>

              {/* Status */}
              <div className="col-span-3 flex justify-center">
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                  fee.status === "Paid"
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                    : fee.status === "Overdue"
                    ? "bg-red-50 text-red-600 border border-red-100"
                    : "bg-amber-50 text-amber-600 border border-amber-100"
                }`}>
                  {fee.status}
                </span>
              </div>

              {/* Action */}
              <div className="col-span-2 flex justify-end">
                <button
                  onClick={() => toggleFeeStatus(fee)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                    fee.status === "Paid"
                      ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm"
                  }`}
                >
                  {fee.status === "Paid" ? "Undo" : "Mark Paid"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reminder Section */}
      {pendingCount > 0 && (
        <div className="mt-6 card-static p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-amber-50/50 border-2 border-amber-100">
          <div>
            <div className="text-sm font-bold text-amber-800 mb-1 flex items-center gap-2">
              ⚠️ {pendingCount} student{pendingCount !== 1 ? "s" : ""} with pending fees
            </div>
            <p className="text-[10px] text-amber-600 font-medium">Send a polite reminder to all students with pending payments.</p>
          </div>
          <button
            onClick={() => showToast(`Reminder sent to ${pendingCount} student${pendingCount !== 1 ? "s" : ""}! 📨`)}
            className="px-5 py-2.5 bg-amber-500 text-white font-bold text-xs rounded-xl hover:bg-amber-600 transition-colors shadow-sm flex items-center gap-2 flex-shrink-0"
          >
            📨 Send Reminder
          </button>
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
