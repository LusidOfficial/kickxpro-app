"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { IconWallet, IconZap, IconShield } from "@/components/Icons";

declare global {
  interface Window {
    Razorpay: any;
  }
}

/* ──────────────────────────────────────────────
   PACK DATA
   ────────────────────────────────────────────── */
interface CoinPack {
  name: string;
  emoji: string;
  kxc: number;
  bonus: number;
  priceINR: number;
  gradient: string;
  glowBorder: string;
  badge: string | null;
  popular: boolean;
}

const PACKS: CoinPack[] = [
  {
    name: "Starter",
    emoji: "🥉",
    kxc: 50,
    bonus: 0,
    priceINR: 49,
    gradient: "from-slate-700 via-slate-800 to-slate-900",
    glowBorder: "border-slate-600/40",
    badge: null,
    popular: false,
  },
  {
    name: "Mid",
    emoji: "🥈",
    kxc: 150,
    bonus: 10,
    priceINR: 129,
    gradient: "from-blue-600 via-blue-700 to-blue-900",
    glowBorder: "border-blue-500/40",
    badge: null,
    popular: false,
  },
  {
    name: "Pro",
    emoji: "🥇",
    kxc: 500,
    bonus: 25,
    priceINR: 399,
    gradient: "from-purple-600 via-purple-700 to-purple-900",
    glowBorder: "border-purple-500/40",
    badge: "MOST POPULAR",
    popular: true,
  },
  {
    name: "Elite",
    emoji: "🏆",
    kxc: 1200,
    bonus: 100,
    priceINR: 899,
    gradient: "from-amber-500 via-amber-600 to-amber-800",
    glowBorder: "border-amber-400/40",
    badge: null,
    popular: false,
  },
  {
    name: "Champion",
    emoji: "💎",
    kxc: 3000,
    bonus: 500,
    priceINR: 1999,
    gradient: "from-emerald-500 via-teal-600 to-teal-800",
    glowBorder: "border-emerald-400/40",
    badge: "BEST VALUE",
    popular: false,
  },
];

/* ──────────────────────────────────────────────
   FAQ DATA
   ────────────────────────────────────────────── */
const FAQS = [
  {
    q: "What are KickX Coins?",
    a: "Virtual currency for premium features and products on KickXPro.",
  },
  {
    q: "Can I get a refund?",
    a: "Coins are non-refundable but never expire.",
  },
  {
    q: "How do I spend them?",
    a: "Browse the marketplace for training plans, coaching sessions, and more.",
  },
];

/* ──────────────────────────────────────────────
   PAGE
   ────────────────────────────────────────────── */
export default function KickXCoinsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [processingPack, setProcessingPack] = useState<string | null>(null);

  /* ── Razorpay Purchase Flow ── */
  const handleBuy = async (pack: CoinPack) => {
    // Not logged in → redirect to login
    if (!user) {
      router.push("/login");
      return;
    }

    setProcessingPack(pack.name);

    try {
      // 1. Create Razorpay Order via API
      const res = await fetch("/api/create-razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: pack.priceINR,
          currency: "INR",
          eventId: "kxc_topup_" + pack.name.toLowerCase(),
          notes: {
            user_id: user.id,
            product_type: "kxc_coins",
            kxc_amount: pack.kxc + pack.bonus,
            pack_name: pack.name
          }
        }),
      });
      const order = await res.json();

      if (order.error) {
        alert("Failed to create order: " + order.error);
        setProcessingPack(null);
        return;
      }

      // 2. Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder",
        amount: order.amount,
        currency: order.currency,
        name: "KickXPro",
        description: `${pack.name} Pack — ${pack.kxc + pack.bonus} KXC`,
        order_id: order.id,
        handler: async function (response: any) {
          // 3. Payment succeeded — credit wallet
          const totalKxc = pack.kxc + pack.bonus;

          // Upsert wallet balance
          const { data: wallet } = await supabase
            .from("kickx_wallet")
            .select("balance")
            .eq("user_id", user.id)
            .single();

          if (wallet) {
            await supabase
              .from("kickx_wallet")
              .update({ balance: wallet.balance + totalKxc })
              .eq("user_id", user.id);
          } else {
            await supabase
              .from("kickx_wallet")
              .insert({ user_id: user.id, balance: totalKxc });
          }

          // Insert transaction record
          await supabase.from("kickx_transactions").insert({
            user_id: user.id,
            type: "topup",
            amount: totalKxc,
            description: pack.name + " Pack",
            reference_id: order.id,
          });

          alert(`✅ ${totalKxc} KXC added to your wallet!`);
        },
        prefill: {
          email: user.email || "",
        },
        theme: {
          color: "#10B981",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        alert("Payment failed: " + response.error.description);
      });
      rzp.open();
    } catch (err) {
      alert("Payment initiation failed. Please try again.");
    } finally {
      setProcessingPack(null);
    }
  };

  /* ── UI ── */
  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />

      {/* ═══ Hero ═══ */}
      <div className="bg-slate-900 text-white pt-20 pb-28 px-4 relative overflow-hidden">
        {/* Decorative radial gradient */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,_#10b981_0%,_transparent_50%),radial-gradient(circle_at_70%_80%,_#6366f1_0%,_transparent_50%)]" />

        <div className="max-w-5xl w-full mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold mb-6 border border-emerald-500/20">
            <IconWallet size={14} /> Top Up
          </div>

          <h1
            className="text-4xl md:text-6xl font-bold mb-4 tracking-tight"
            style={{
              fontFamily: "var(--font-heading)",
              letterSpacing: "-0.02em",
            }}
          >
            KickX Coins
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-xl mx-auto">
            Power up your football journey
          </p>
        </div>
      </div>

      {/* ═══ Pack Cards ═══ */}
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PACKS.map((pack, i) => (
            <div
              key={pack.name}
              className="animate-fade-up"
              style={{ animationDelay: `${i * 100}ms`, opacity: 0 }}
            >
              <div
                className={`relative rounded-xl overflow-hidden transition-transform duration-300 hover:scale-105 ${
                  pack.popular
                    ? "ring-2 ring-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.25)]"
                    : ""
                }`}
              >
                {/* Badge */}
                {pack.badge && (
                  <div
                    className={`absolute top-0 right-0 z-10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-bl-xl ${
                      pack.popular
                        ? "bg-purple-500 text-white"
                        : "bg-emerald-500 text-white"
                    }`}
                  >
                    {pack.badge}
                  </div>
                )}

                {/* Card Body */}
                <div
                  className={`bg-gradient-to-br ${pack.gradient} p-6 flex flex-col items-center text-white`}
                >
                  {/* Emoji */}
                  <span className="text-5xl mb-3 drop-shadow-lg">
                    {pack.emoji}
                  </span>

                  {/* Pack Name */}
                  <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">
                    {pack.name} Pack
                  </p>

                  {/* KXC Amount */}
                  <h2
                    className="text-4xl font-bold mb-1"
                    style={{
                      fontFamily: "var(--font-heading)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {pack.kxc.toLocaleString()}
                    <span className="text-base font-semibold ml-1 opacity-70">
                      KXC
                    </span>
                  </h2>

                  {/* Bonus */}
                  {pack.bonus > 0 && (
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-300 mb-2">
                      <IconZap size={14} />+{pack.bonus} Bonus
                    </span>
                  )}
                  {pack.bonus === 0 && <div className="h-6 mb-2" />}

                  {/* Divider */}
                  <div className="w-full h-px bg-white/10 my-3" />

                  {/* Price */}
                  <p className="text-2xl font-bold mb-4">
                    ₹{pack.priceINR}
                  </p>

                  {/* Buy Button */}
                  <button
                    onClick={() => handleBuy(pack)}
                    disabled={processingPack === pack.name}
                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                      pack.popular
                        ? "bg-white text-purple-700 hover:bg-purple-50 shadow-lg"
                        : "bg-white/15 text-white hover:bg-white/25 backdrop-blur-sm border border-white/10"
                    }`}
                  >
                    <IconShield size={16} />
                    {processingPack === pack.name
                      ? "Processing..."
                      : "Buy Now"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ FAQ Section ═══ */}
      <div className="max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <h2
          className="text-2xl font-bold text-slate-900 mb-8 text-center"
          style={{
            fontFamily: "var(--font-heading)",
            letterSpacing: "-0.02em",
          }}
        >
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="card-static rounded-xl p-6 animate-fade-up"
              style={{ animationDelay: `${(PACKS.length + i) * 100}ms`, opacity: 0 }}
            >
              <h3 className="font-bold text-slate-900 mb-2">{faq.q}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
