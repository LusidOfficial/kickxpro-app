"use client";

import { useState } from "react";
import { IconUsers, IconActivity } from "@/components/Icons";

const DEMO_STUDENTS = [
  { id: "P001", name: "Arjun Mehta", age: 11, team: "U12 Elite", coach: "Sarah Jenkins", status: "Active", lastEval: "8.5" },
  { id: "P002", name: "Rahul Joshi", age: 9, team: "U10 Pro", coach: "Mike Thompson", status: "Active", lastEval: "7.2" },
  { id: "P003", name: "Neha Singh", age: 14, team: "U15 Girls", coach: "Emma Wilson", status: "Injured", lastEval: "9.1" },
  { id: "P004", name: "Kabir Das", age: 11, team: "U12 Elite", coach: "Sarah Jenkins", status: "Active", lastEval: "6.8" },
];

export default function StudentDirectory() {
  const [students] = useState(DEMO_STUDENTS);
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="max-w-5xl animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-1" style={{ fontFamily: "var(--font-heading)" }}>Student Directory</h1>
        <p className="text-slate-500">Master list of all players enrolled in your academy.</p>
      </div>

      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <IconUsers size={18} className="absolute left-4 top-3.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search students by name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm"
          />
        </div>
        <select className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium focus:outline-none shadow-sm hidden sm:block">
          <option>All Coaches</option>
          <option>Sarah Jenkins</option>
          <option>Mike Thompson</option>
        </select>
        <select className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium focus:outline-none shadow-sm hidden sm:block">
          <option>All Teams</option>
          <option>U12 Elite</option>
          <option>U10 Pro</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-4 px-6 font-semibold text-slate-700 text-sm">Player Name</th>
                <th className="py-4 px-6 font-semibold text-slate-700 text-sm">Team</th>
                <th className="py-4 px-6 font-semibold text-slate-700 text-sm">Assigned Coach</th>
                <th className="py-4 px-6 font-semibold text-slate-700 text-sm">Latest Eval</th>
                <th className="py-4 px-6 font-semibold text-slate-700 text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((student) => (
                <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors last:border-0">
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-bold text-slate-900">{student.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-500">Age: {student.age}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        <span className="text-xs text-slate-500">ID: {student.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                      {student.team}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm font-medium text-slate-700">{student.coach}</span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <IconActivity size={16} className="text-emerald-500" />
                      <span className="font-bold text-slate-900">{student.lastEval}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold transition-colors">
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No students found matching "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
