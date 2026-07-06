/* ──────────────────────────────────────────────
   MARKETPLACE — Main storefront landing page.
   Public page — no auth required.
   Premium sports marketplace aesthetic.
   ────────────────────────────────────────────── */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import {
  IconStar,
  IconTrophy,
  IconZap,
  IconShield,
  IconWallet,
  IconChevronRight,
  IconTarget,
  IconUsers,
} from "@/components/Icons";

/* ── Types ── */
interface MarketplaceProduct {
  id: string;
  title: string;
  description: string;
  price_kxc: number;
  category: string;
  is_active: boolean;
  image_url?: string;
}

/* ── Coin Pack Mini-Cards Data ── */
const COIN_PACKS = [
  {
    name: "Pro",
    coins: 500,
    price: "$4.99",
    icon: <IconZap size={22} color="#F59E0B" />,
    popular: false,
  },
  {
    name: "Elite",
    coins: 1200,
    price: "$9.99",
    icon: <IconStar size={22} color="#F59E0B" />,
    popular: true,
  },
  {
    name: "Champion",
    coins: 3000,
    price: "$19.99",
    icon: <IconTrophy size={22} color="#F59E0B" />,
    popular: false,
  },
];

/* ── Coming Soon Categories ── */
const COMING_SOON = [
  {
    title: "Coach Sessions",
    emoji: "🎯",
    description: "Book 1-on-1 sessions with licensed coaches",
  },
  {
    title: "Physical Merch",
    emoji: "👕",
    description: "Premium KickXPro gear and training equipment",
  },
  {
    title: "Academy Bundles",
    emoji: "🏟️",
    description: "Complete training programs with certifications",
  },
];

export default function MarketplacePage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from("marketplace_products")
        .select("*")
        .eq("category", "digital")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching products:", error);
      } else {
        setProducts(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      {/* ═══════════════════════════════════════════
          HERO SECTION
          ═══════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)",
        }}
      >
        {/* Emerald accent glows */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 600,
            height: 600,
            background: "rgba(16, 185, 129, 0.08)",
            filter: "blur(120px)",
            top: "-20%",
            right: "-5%",
          }}
        />
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 400,
            height: 400,
            background: "rgba(16, 185, 129, 0.06)",
            filter: "blur(100px)",
            bottom: "-10%",
            left: "10%",
          }}
        />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-5 py-20 md:py-28 text-center">
          <div
            className="opacity-0 animate-fade-up"
            style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  background: "#10B981",
                  boxShadow: "0 0 8px #10B981",
                }}
              />
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">
                Now Open
              </span>
            </div>

            <h1
              className="text-4xl md:text-6xl font-black text-white mb-4"
              style={{
                fontFamily: "var(--font-heading)",
                letterSpacing: "-0.02em",
              }}
            >
              KickXPro{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                Marketplace
              </span>
            </h1>
            <p className="text-base md:text-lg text-slate-400 max-w-lg mx-auto mb-10 leading-relaxed">
              Everything you need to level up your football game
            </p>

            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link
                href="/marketplace/coins"
                className="btn-primary flex items-center gap-2 no-underline text-sm px-7 py-3"
              >
                <IconWallet size={16} />
                Buy KickX Coins
              </Link>
              <a
                href="#products"
                className="btn-secondary flex items-center gap-2 no-underline text-sm px-7 py-3"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  borderColor: "rgba(255,255,255,0.12)",
                  color: "#FFFFFF",
                }}
              >
                Browse Products
                <IconChevronRight size={14} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          KICKX COINS BANNER
          ═══════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-5 -mt-8 relative z-20">
        <div
          className="opacity-0 animate-fade-up"
          style={{ animationDelay: "0.25s", animationFillMode: "forwards" }}
        >
          <div
            className="rounded-2xl border p-6 md:p-8"
            style={{
              background:
                "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 50%, #FFFBEB 100%)",
              borderColor: "rgba(245, 158, 11, 0.2)",
              boxShadow: "0 8px 30px rgba(245, 158, 11, 0.08)",
            }}
          >
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <IconStar size={20} color="#F59E0B" />
                </div>
                <div>
                  <h2
                    className="text-lg font-black text-slate-900"
                    style={{
                      fontFamily: "var(--font-heading)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    KickX Coins
                  </h2>
                  <p className="text-xs text-slate-500">
                    Power your marketplace purchases
                  </p>
                </div>
              </div>
              <Link
                href="/marketplace/coins"
                className="text-sm font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 no-underline transition-colors"
              >
                View All Packs
                <IconChevronRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {COIN_PACKS.map((pack) => (
                <div
                  key={pack.name}
                  className={`relative rounded-xl p-4 transition-all hover:shadow-md hover:-translate-y-0.5 ${
                    pack.popular
                      ? "bg-white ring-2 ring-amber-400 shadow-lg"
                      : "bg-white/70 border border-amber-200/50"
                  }`}
                >
                  {pack.popular && (
                    <span className="absolute -top-2.5 right-3 px-2.5 py-0.5 rounded-full bg-amber-500 text-[9px] font-black text-white uppercase tracking-wider">
                      Most Popular
                    </span>
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                      {pack.icon}
                    </div>
                    <div>
                      <div
                        className="text-sm font-bold text-slate-900"
                        style={{ fontFamily: "var(--font-heading)" }}
                      >
                        {pack.name}
                      </div>
                      <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wide">
                        {pack.coins.toLocaleString()} coins
                      </div>
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-xl font-black text-slate-900">
                      {pack.price}
                    </span>
                    <Link
                      href="/marketplace/coins"
                      className="text-xs font-bold text-amber-600 hover:text-amber-700 no-underline"
                    >
                      Get →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          DIGITAL PRODUCTS GRID
          ═══════════════════════════════════════════ */}
      <section id="products" className="max-w-5xl mx-auto px-5 py-16">
        <div
          className="opacity-0 animate-fade-up"
          style={{ animationDelay: "0.35s", animationFillMode: "forwards" }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <IconTarget size={18} color="#10B981" />
            </div>
            <h2
              className="text-2xl font-black text-slate-900"
              style={{
                fontFamily: "var(--font-heading)",
                letterSpacing: "-0.02em",
              }}
            >
              Training & Development
            </h2>
          </div>
          <p className="text-sm text-slate-500 mb-8 ml-12">
            Digital products to sharpen your skills and unlock your potential
          </p>

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse"
                >
                  <div className="w-full h-32 bg-slate-100 rounded-xl mb-4" />
                  <div className="h-5 bg-slate-100 rounded w-3/4 mb-3" />
                  <div className="h-3 bg-slate-100 rounded w-full mb-2" />
                  <div className="h-3 bg-slate-100 rounded w-2/3 mb-5" />
                  <div className="flex justify-between items-center">
                    <div className="h-6 bg-slate-100 rounded w-20" />
                    <div className="h-8 bg-slate-100 rounded-xl w-24" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && products.length === 0 && (
            <div className="card-static rounded-2xl p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <IconTarget size={28} color="#94A3B8" />
              </div>
              <h3
                className="text-lg font-bold text-slate-900 mb-2"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Products Coming Soon
              </h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
                We&apos;re curating the best digital training resources. Check
                back soon or grab some KickX Coins to be ready!
              </p>
              <Link
                href="/marketplace/coins"
                className="btn-primary inline-flex items-center gap-2 no-underline text-sm px-6 py-2.5"
              >
                <IconWallet size={14} />
                Get KickX Coins
              </Link>
            </div>
          )}

          {/* Products Grid */}
          {!loading && products.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product, i) => (
                <div
                  key={product.id}
                  className="group bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 opacity-0 animate-fade-up"
                  style={{
                    animationDelay: `${0.4 + i * 0.08}s`,
                    animationFillMode: "forwards",
                  }}
                >
                  {/* Product Visual Header */}
                  <div
                    className="h-36 flex items-center justify-center relative"
                    style={{
                      background:
                        "linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 50%, #F0FDFA 100%)",
                    }}
                  >
                    <IconZap
                      size={44}
                      color="#10B981"
                      className="opacity-20 group-hover:opacity-30 transition-opacity"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="p-5">
                    <h3
                      className="text-base font-bold text-slate-900 mb-1.5 line-clamp-1"
                      style={{
                        fontFamily: "var(--font-heading)",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {product.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-2">
                      {product.description}
                    </p>

                    <div className="flex items-center justify-between">
                      {/* Price in KXC */}
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">
                          <IconStar size={10} color="#F59E0B" />
                        </div>
                        <span className="text-sm font-black text-slate-900">
                          {product.price_kxc.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          KXC
                        </span>
                      </div>

                      {/* CTA */}
                      <Link
                        href={`/marketplace/product/${product.id}`}
                        className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-bold no-underline hover:bg-emerald-100 transition-colors"
                      >
                        View Details
                        <IconChevronRight size={12} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          COMING SOON SECTION
          ═══════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-5 pb-20">
        <div
          className="opacity-0 animate-fade-up"
          style={{ animationDelay: "0.5s", animationFillMode: "forwards" }}
        >
          <div className="text-center mb-8">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              On The Horizon
            </span>
            <h2
              className="text-xl font-black text-slate-900 mt-2"
              style={{
                fontFamily: "var(--font-heading)",
                letterSpacing: "-0.02em",
              }}
            >
              More Coming Soon
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {COMING_SOON.map((item, i) => (
              <div
                key={item.title}
                className="card-static rounded-2xl p-6 text-center opacity-0 animate-fade-up"
                style={{
                  animationDelay: `${0.55 + i * 0.1}s`,
                  animationFillMode: "forwards",
                  filter: "grayscale(30%)",
                  opacity: 0,
                }}
              >
                <div className="text-4xl mb-4 grayscale-[20%]">
                  {item.emoji}
                </div>
                <h3
                  className="text-sm font-bold text-slate-700 mb-1.5"
                  style={{
                    fontFamily: "var(--font-heading)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  {item.description}
                </p>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <IconShield size={10} color="#94A3B8" />
                  Coming Soon
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
