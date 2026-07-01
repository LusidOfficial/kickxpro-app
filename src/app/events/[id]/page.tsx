"use client";

import { useState, useEffect } from "react";
import { IconTrophy, IconActivity, IconClipboard, IconUsers, IconCheck } from "@/components/Icons";
import Link from "next/link";
import Script from "next/script";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

export default function PublicEventPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);
  const [teamName, setTeamName] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [registeredCount, setRegisteredCount] = useState(0);

  useEffect(() => {
    async function loadEvent() {
      // 1. Fetch Event Details
      const { data: ev } = await supabase
        .from("events")
        .select(`*, creator:profiles!events_coach_id_fkey(full_name)`)
        .eq("id", params.id)
        .single();
        
      if (ev) setEvent(ev);

      // 2. Count Registrations
      const { count } = await supabase
        .from("event_registrations")
        .select("*", { count: 'exact', head: true })
        .eq("event_id", params.id);
        
      if (count !== null) setRegisteredCount(count);

      setLoading(false);
    }
    loadEvent();
  }, [params.id]);

  const handleRazorpayPayment = async () => {
    if (!user) {
      alert("Please log in to register!");
      return;
    }
    if (!teamName) {
      alert("Please enter a team name.");
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Create Order via our Backend API
      const res = await fetch('/api/create-razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: event?.entry_fee || 0,
          currency: "INR",
          eventId: params.id
        })
      });
      const order = await res.json();

      if (order.error) {
        alert("Failed to create order: " + order.error);
        setIsProcessing(false);
        return;
      }

      // 2. Initialize Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder", 
        amount: order.amount,
        currency: order.currency,
        name: "KickXPro Tournament",
        description: `Registration for ${event.title}`,
        order_id: order.id,
        handler: async function (response: any) {
          // Payment Successful, save to DB
          const { error } = await supabase.from("event_registrations").insert({
            event_id: params.id,
            profile_id: user.id,
            team_name: teamName,
            payment_status: "paid",
            amount_due: event?.entry_fee || 0,
            payment_reference: response.razorpay_payment_id
          });

          if (error) {
            if (error.code === '23505') alert("You are already registered for this event!");
            else alert("Registration failed saving to DB: " + error.message);
          } else {
            setPaymentSuccess(true);
            setRegisteredCount(prev => prev + 1);
          }
        },
        prefill: {
          name: "Football Team",
          email: user?.email || "coach@example.com",
        },
        theme: {
          color: "#4F46E5",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      
      rzp.on('payment.failed', function (response: any) {
        alert("Payment failed: " + response.error.description);
      });
      
      rzp.open();
    } catch (err: any) {
      alert("Payment initiation failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-bold text-slate-500">Loading Tournament...</div>;
  }

  if (!event) {
    return <div className="min-h-screen flex items-center justify-center font-bold text-slate-500">Event Not Found</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      {/* Hero Header */}
      <div className="bg-indigo-900 text-white pt-20 pb-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-300 via-indigo-900 to-transparent"></div>
        <div className="max-w-6xl w-full mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-800/50 text-indigo-200 text-xs font-bold mb-6 border border-indigo-700/50">
            <IconTrophy size={14} /> Tournament
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
            {event.title}
          </h1>
          <p className="text-xl text-indigo-200 mb-8 max-w-2xl mx-auto">
            Hosted by {event.creator?.full_name || "KickX Coach"}
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 text-sm font-semibold">
            <div className="flex items-center gap-2 bg-indigo-950/40 px-4 py-2 rounded-xl backdrop-blur-sm border border-indigo-800/30">
              <IconClipboard size={18} className="text-indigo-400" /> {event.event_date || "TBD"}
            </div>
            <div className="flex items-center gap-2 bg-indigo-950/40 px-4 py-2 rounded-xl backdrop-blur-sm border border-indigo-800/30">
              <IconActivity size={18} className="text-indigo-400" /> {event.location || "TBD"}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
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
                  <p className="text-slate-700 font-semibold whitespace-pre-line">{event.prize_pool || "TBD"}</p>
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
                <div className="text-4xl font-bold text-slate-900">₹{event.entry_fee || 0}</div>
                <p className="text-slate-400 text-xs mt-1">per team</p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Status</span>
                  <span className="font-bold text-emerald-600 capitalize">{event.status.replace("_", " ")}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Spots Filled</span>
                  <span className="font-bold text-slate-900">{registeredCount} / {event.max_teams || 16}</span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full" 
                    style={{ width: `${(registeredCount / (event.max_teams || 16)) * 100}%` }}
                  ></div>
                </div>
              </div>

              {paymentSuccess ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center animate-fade-in">
                  <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                    <IconCheck size={24} />
                  </div>
                  <h3 className="font-bold text-emerald-900 mb-1">Registration Complete!</h3>
                  <p className="text-sm text-emerald-700 font-medium">Your team is officially enrolled in the tournament.</p>
                </div>
              ) : !isRegistering ? (
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
                    <input 
                      type="text" 
                      placeholder="e.g., FC United" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 mb-4" 
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                    />
                    
                    <button 
                      onClick={handleRazorpayPayment}
                      disabled={isProcessing}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all shadow-md flex justify-center items-center gap-2 disabled:opacity-50"
                    >
                      {isProcessing ? "Processing via Razorpay..." : `Pay ₹${event.entry_fee || 0} via Razorpay`}
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
