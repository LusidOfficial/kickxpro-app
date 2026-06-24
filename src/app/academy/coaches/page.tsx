"use client";

import { useState } from "react";
import { IconUser, IconAward } from "@/components/Icons";

const DEMO_COACHES = [
  { id: "1", name: "Coach Sarah Jenkins", role: "Head Coach - U12", students: 24, status: "Active" },
  { id: "2", name: "Coach Mike Thompson", role: "Assistant Coach - U10", students: 18, status: "Active" },
  { id: "3", name: "Coach David Lee", role: "Goalkeeper Coach", students: 8, status: "Active" },
  { id: "4", name: "Coach Emma Wilson", role: "Head Coach - U15", students: 22, status: "On Leave" },
];

export default function ManageCoaches() {
  const [coaches] = useState(DEMO_COACHES);
  const [isInviting, setIsInviting] = useState(false);

  return (
    <div className="max-w-5xl animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1" style={{ fontFamily: "var(--font-heading)" }}>Manage Coaches</h1>
          <p className="text-slate-500">View and manage your academy's coaching staff.</p>
        </div>
        <button 
          onClick={() => setIsInviting(true)}
          className="btn-primary bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition-all flex items-center gap-2"
        >
          <IconUser size={18} />
          Invite Coach
        </button>
      </div>

      {isInviting && (
        <div className="mb-8 p-6 bg-white border border-indigo-100 rounded-2xl shadow-sm animate-fade-down">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Invite New Coach</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <input 
              type="email" 
              placeholder="coach@example.com" 
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
            />
            <select className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-indigo-500 transition-all">
              <option>Head Coach</option>
              <option>Assistant Coach</option>
              <option>Specialist Coach</option>
            </select>
            <button 
              onClick={() => setIsInviting(false)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-xl transition-all"
            >
              Send Invite
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-4 px-6 font-semibold text-slate-700 text-sm">Coach Name</th>
                <th className="py-4 px-6 font-semibold text-slate-700 text-sm">Assigned Role</th>
                <th className="py-4 px-6 font-semibold text-slate-700 text-sm">Students</th>
                <th className="py-4 px-6 font-semibold text-slate-700 text-sm">Status</th>
                <th className="py-4 px-6 font-semibold text-slate-700 text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coaches.map((coach) => (
                <tr key={coach.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors last:border-0">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                        {coach.name.charAt(6)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{coach.name}</p>
                        <p className="text-xs text-slate-500">ID: {coach.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <IconAward size={16} className="text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">{coach.role}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                      {coach.students} players
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      coach.status === 'Active' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${coach.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                      {coach.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold transition-colors mr-4">
                      View
                    </button>
                    <button className="text-slate-400 hover:text-red-600 text-sm font-semibold transition-colors">
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
