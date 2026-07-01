"use client";

import { useState } from "react";
import { IconTrophy, IconClipboard, IconActivity } from "@/components/Icons";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
export default function CreateEvent() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [eventType, setEventType] = useState("tournament");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [entryFee, setEntryFee] = useState("0");
  const [maxTeams, setMaxTeams] = useState("16");
  const [prizePool, setPrizePool] = useState("");

  const handlePublish = async () => {
    if (!user || !title || !date) {
      alert("Please fill in Title and Date");
      return;
    }
    setLoading(true);

    const { data, error } = await supabase.from("events").insert({
      title,
      event_date: date,
      location,
      entry_fee: parseFloat(entryFee) || 0,
      max_teams: parseInt(maxTeams) || 16,
      prize_pool: prizePool,
      coach_id: user.id,
      status: "registration_open"
    }).select("id").single();

    setLoading(false);

    if (error) {
      console.error(error);
      alert("Failed to create event");
    } else if (data) {
      router.push(`/events/${data.id}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-up">
      <div className="mb-8">
        <Link href="/coach/sessions" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 mb-4 inline-block">&larr; Back to Hub</Link>
        <h1 className="text-3xl font-bold text-slate-900 mb-2" style={{ fontFamily: "var(--font-heading)" }}>Create New Event</h1>
        <p className="text-slate-500">Host a tournament, trial, or camp. Collect payments directly.</p>
      </div>

      <div className="flex gap-4 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className={`h-2 flex-1 rounded-full transition-colors duration-300 ${s <= step ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
        ))}
      </div>

      <div className="card-static bg-white border border-slate-200 p-8 rounded-2xl shadow-sm">
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Event Basics</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button 
                onClick={() => setEventType("tournament")}
                className={`p-4 border-2 rounded-xl text-left transition-all ${eventType === "tournament" ? "border-indigo-600 bg-indigo-50" : "border-slate-200 hover:border-indigo-200"}`}
              >
                <IconTrophy size={24} className={`mb-2 ${eventType === "tournament" ? "text-indigo-600" : "text-slate-400"}`} />
                <h3 className="font-bold text-slate-900">Tournament</h3>
                <p className="text-xs text-slate-500 mt-1">Multi-team competition with fixtures</p>
              </button>
              <button 
                onClick={() => setEventType("trial")}
                className={`p-4 border-2 rounded-xl text-left transition-all ${eventType === "trial" ? "border-indigo-600 bg-indigo-50" : "border-slate-200 hover:border-indigo-200"}`}
              >
                <IconActivity size={24} className={`mb-2 ${eventType === "trial" ? "text-indigo-600" : "text-slate-400"}`} />
                <h3 className="font-bold text-slate-900">Trial / Camp</h3>
                <p className="text-xs text-slate-500 mt-1">Individual player registration</p>
              </button>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Event Title</label>
              <input 
                type="text" 
                placeholder="e.g., Summer KickX Cup 2026" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-indigo-500 transition-all"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button onClick={() => setStep(2)} className="btn-primary bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all">Next: Logistics</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Logistics</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Date</label>
                <input 
                  type="date" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-indigo-500 transition-all" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Location</label>
                <input 
                  type="text" 
                  placeholder="e.g., Main Turf Pitch" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-indigo-500 transition-all" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Max Teams / Players</label>
              <input 
                type="number" 
                placeholder="16" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-indigo-500 transition-all" 
                value={maxTeams}
                onChange={(e) => setMaxTeams(e.target.value)}
              />
            </div>

            <div className="pt-4 flex justify-between">
              <button onClick={() => setStep(1)} className="text-slate-500 font-bold hover:text-slate-700">Back</button>
              <button onClick={() => setStep(3)} className="btn-primary bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all">Next: Monetization</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Monetization & Prizes</h2>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Entry Fee (₹)</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 font-bold text-slate-400">₹</span>
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-3 text-slate-900 focus:outline-none focus:border-indigo-500 transition-all text-lg font-bold" 
                    value={entryFee}
                    onChange={(e) => setEntryFee(e.target.value)}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">Leave 0 for free entry. Payments processed via Razorpay.</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Prize Pool / Rewards</label>
              <textarea 
                placeholder="e.g., 1st Prize: ₹50,000 + Trophy. 2nd Prize: ₹25,000" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-indigo-500 transition-all h-24 resize-none"
                value={prizePool}
                onChange={(e) => setPrizePool(e.target.value)}
              ></textarea>
            </div>

            <div className="pt-4 flex justify-between">
              <button onClick={() => setStep(2)} className="text-slate-500 font-bold hover:text-slate-700">Back</button>
              <button onClick={() => setStep(4)} className="btn-primary bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all">Review & Launch</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-fade-in text-center py-8">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <IconTrophy size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Ready to Launch!</h2>
            <p className="text-slate-500 max-w-md mx-auto mb-8">Your event page will be created immediately. You will receive a public link to share with teams for registration and payment.</p>
            
            <div className="flex justify-center gap-4">
              <button onClick={() => setStep(3)} className="text-slate-500 font-bold hover:text-slate-700 px-6">Back</button>
              <button 
                onClick={handlePublish}
                disabled={loading}
                className="btn-primary bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all disabled:opacity-50"
              >
                {loading ? "Publishing..." : "Publish Event"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
