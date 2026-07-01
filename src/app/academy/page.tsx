"use client";

import { useState } from "react";
import StatCard from "@/components/StatCard";
import { IconUsers, IconUser, IconClipboard, IconActivity } from "@/components/Icons";

export default function AcademyDashboard() {
  const [stats] = useState({
    coaches: 8,
    students: 142,
    active_tournaments: 2,
    revenue: "$4,250",
  });

  return (
    <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2" style={{ fontFamily: "var(--font-heading)" }}>Academy Dashboard</h1>
        <p className="text-slate-500">Welcome back. Here is your academy's overview.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard value={stats.coaches} label="Active Coaches" icon={<IconUser size={20} color="#60A5FA" />} accentColor="#60A5FA" delay={0.1} />
        <StatCard value={stats.students} label="Total Students" icon={<IconUsers size={20} color="#00C853" />} accentColor="#00C853" delay={0.2} />
        <StatCard value={stats.active_tournaments} label="Tournaments" icon={<IconClipboard size={20} color="#F59E0B" />} accentColor="#F59E0B" delay={0.3} />
        <StatCard value={stats.revenue} label="Monthly Revenue" icon={<IconActivity size={20} color="#A78BFA" />} accentColor="#A78BFA" delay={0.4} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="card-static p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4" style={{ fontFamily: "var(--font-heading)" }}>Recent Activity</h2>
          <div className="space-y-4">
            {[
              { id: 1, text: "Coach Sarah added 3 new students", time: "2 hours ago" },
              { id: 2, text: "Summer Cup 2026 reached 16 teams", time: "5 hours ago" },
              { id: 3, text: "New payout processed: $850.00", time: "1 day ago" },
              { id: 4, text: "Coach Mike completed U12 Evaluations", time: "2 days ago" },
            ].map((activity) => (
              <div key={activity.id} className="flex items-center justify-between pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                <p className="text-sm text-slate-700 font-medium">{activity.text}</p>
                <span className="text-xs text-slate-400">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card-static p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4" style={{ fontFamily: "var(--font-heading)" }}>Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <button className="flex flex-col items-center justify-center p-6 bg-slate-50 hover:bg-indigo-50 rounded-xl transition-colors border border-slate-100 hover:border-indigo-100 group">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                <IconUser size={20} color="#4F46E5" />
              </div>
              <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-700">Invite Coach</span>
            </button>
            <button className="flex flex-col items-center justify-center p-6 bg-slate-50 hover:bg-emerald-50 rounded-xl transition-colors border border-slate-100 hover:border-emerald-100 group">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                <IconClipboard size={20} color="#10B981" />
              </div>
              <span className="text-sm font-bold text-slate-700 group-hover:text-emerald-700">New Tournament</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
