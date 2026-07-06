"use client";

import { useState } from "react";
import { IconShield, IconZap, IconCheck } from "./Icons";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

interface ProPaywallProps {
  featureName: string;
}

export default function ProPaywall({ featureName }: ProPaywallProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpgrade = async () => {
    if (!user) return;
    setLoading(true);
    setError("");

    try {
      // 1. Create Razorpay order
      const res = await fetch("/api/create-razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          amount: 1299, 
          currency: "INR", 
          eventId: "pro_upgrade",
          notes: {
            user_id: user.id,
            product_type: "coach_pro_subscription"
          }
        }),
      });
      
      const order = await res.json();
      if (!order || !order.id) throw new Error("Failed to create order");

      // 2. Initialize Razorpay options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: 1299 * 100,
        currency: "INR",
        name: "KickXPro",
        description: "Pro Coach 30-Day Pass",
        order_id: order.id,
        handler: async function (response: any) {
          // Payment successful, update Supabase profile
          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              subscription_tier: "pro",
              subscription_status: "active",
              subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            })
            .eq("id", user.id);
            
          if (updateError) {
            console.error("Profile update error", updateError);
            setError("Payment succeeded, but upgrading your account failed. Please contact support.");
          } else {
            // Reload page to reflect new tier
            window.location.reload();
          }
        },
        prefill: {
          email: user.email,
        },
        theme: {
          color: "#10B981", // Emerald 500
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        setError(response.error.description || "Payment failed");
      });
      rzp.open();

    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-emerald-200 bg-emerald-50 rounded-3xl mx-4 my-8">
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
        <IconShield className="w-8 h-8 text-emerald-600" />
      </div>
      
      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        Upgrade to Pro Coach
      </h2>
      <p className="text-slate-600 mb-8 max-w-md">
        The <strong>{featureName}</strong> feature is exclusively available to Pro Coaches. Upgrade now to unlock the full potential of KickXPro.
      </p>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8 w-full max-w-sm text-left">
        <div className="flex items-end gap-1 mb-4">
          <span className="text-3xl font-black text-slate-900">₹1,299</span>
          <span className="text-slate-500 font-medium mb-1">/ 30 Days</span>
        </div>
        
        <ul className="space-y-3">
          <li className="flex items-start gap-2 text-slate-600 text-sm">
            <IconCheck className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>Manage unlimited players in your roster</span>
          </li>
          <li className="flex items-start gap-2 text-slate-600 text-sm">
            <IconCheck className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>Generate PDF Report Cards for parents</span>
          </li>
          <li className="flex items-start gap-2 text-slate-600 text-sm">
            <IconCheck className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>Full access to AI Assistant Coach</span>
          </li>
        </ul>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-6 w-full max-w-sm border border-red-100">
          {error}
        </div>
      )}

      <button
        onClick={handleUpgrade}
        disabled={loading}
        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-10 rounded-full transition-transform active:scale-95 shadow-lg shadow-emerald-200 flex items-center gap-2 disabled:opacity-70 disabled:active:scale-100"
      >
        <IconZap className="w-5 h-5" />
        {loading ? "Processing..." : "Unlock Pro Now"}
      </button>
      
      <p className="text-xs text-slate-400 mt-6 max-w-xs">
        Secure payment processing. You will be charged ₹1299 for a 30-day Pro Pass.
      </p>
    </div>
  );
}
