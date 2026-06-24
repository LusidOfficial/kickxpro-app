"use client";

import { useState } from "react";
import { IconTrophy, IconActivity, IconClipboard, IconUsers } from "@/components/Icons";
import Link from "next/link";

export default function PublicEventPage({ params }: { params: { id: string } }) {
  const [isRegistering, setIsRegistering] = useState(false);

  // Demo Event Data
  const event = {
    title: "Summer KickX Cup 2026",
    type: "Tournament",
    date: "August 15, 2026",
    location: "Main Turf Pitch, KickX Academy",
    entryFee: 1500,
    prizePool: "1st Prize: ₹50,000 + Trophy\n2nd Prize: ₹25,000",
    maxTeams: 16,
    registeredTeams: 12,
    status: "Registration Open",
    host: "KickX Academy Admin"
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* Hero Header */}
      <div className="bg-indigo-900 text-white pt-20 pb-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-300 via-indigo-900 to-transparent"></div>
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-800/50 text-indigo-200 text-xs font-bold mb-6 border border-indigo-700/50">
            <IconTrophy size={14} /> {event.type}
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
            {event.title}
          </h1>
          <p className="text-xl text-indigo-200 mb-8 max-w-2xl mx-auto">
            Hosted by {event.host}
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 text-sm font-semibold">
            <div className="flex items-center gap-2 bg-indigo-950/40 px-4 py-2 rounded-xl backdrop-blur-sm border border-indigo-800/30">
              <IconClipboard size={18} className="text-indigo-400" /> {event.date}
            </div>
            <div className="flex items-center gap-2 bg-indigo-950/40 px-4 py-2 rounded-xl backdrop-blur-sm border border-indigo-800/30">
              <IconActivity size={18} className="text-indigo-400" /> {event.location}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-12 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main Details */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
              <h2 className="text-2xl font-bold text-slate-900 mb-6" style={{ fontFamily: "var(--font-heading)" }}>Tournament Details</h2>
              <p className="text-slate-600 mb-8 leading-relaxed">
                Join us for the ultimate summer football showdown. Gather your squad and compete against the best teams in the city for massive cash prizes and the championship trophy.
              </p>
              
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                    <IconTrophy size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Prize Pool</h3>
                </div>
                <div className="pl-13">
                  <p className="text-slate-700 font-semibold whitespace-pre-line">{event.prizePool}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "var(--font-heading)" }}>Tournament Bracket</h2>
                <Link href={`/events/${params.id}/fixtures`} className="text-indigo-600 font-bold hover:text-indigo-800 text-sm">View Full Bracket &rarr;</Link>
              </div>
              <div className="h-48 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center">
                <p className="text-slate-400 font-medium">Fixtures will be generated once registration closes.</p>
              </div>
            </div>
          </div>

          {/* Registration Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 sticky top-6">
              <div className="text-center mb-6">
                <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-2">Entry Fee</p>
                <div className="text-4xl font-bold text-slate-900">₹{event.entryFee}</div>
                <p className="text-slate-400 text-xs mt-1">per team</p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Status</span>
                  <span className="font-bold text-emerald-600">{event.status}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Spots Filled</span>
                  <span className="font-bold text-slate-900">{event.registeredTeams} / {event.maxTeams}</span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full" 
                    style={{ width: `${(event.registeredTeams / event.maxTeams) * 100}%` }}
                  ></div>
                </div>
              </div>

              {!isRegistering ? (
                <button 
                  onClick={() => setIsRegistering(true)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-md hover:shadow-lg flex justify-center items-center gap-2"
                >
                  <IconUsers size={20} />
                  Register Team Now
                </button>
              ) : (
                <div className="animate-fade-up">
                  <div className="pt-4 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-700 mb-2">Team Name</label>
                    <input type="text" placeholder="e.g., FC United" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 mb-4" />
                    
                    <label className="block text-xs font-bold text-slate-700 mb-2">Captain's Contact</label>
                    <input type="text" placeholder="Phone or Email" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 mb-6" />

                    <button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all shadow-md flex justify-center items-center gap-2">
                      Pay ₹{event.entryFee} via Razorpay
                    </button>
                    <button onClick={() => setIsRegistering(false)} className="w-full mt-3 text-slate-500 text-sm font-semibold hover:text-slate-700">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
