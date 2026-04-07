/* ──────────────────────────────────────────────
   LANDING PAGE — Portal selector with hero,
   animated cards, registration CTA, and
   KickXPro branding. No emoji — all SVG icons.
   ────────────────────────────────────────────── */
"use client";

import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { IconUser, IconClipboard, IconShield, IconChevronRight, IconPlusCircle } from "@/components/Icons";

const PORTALS = [
  {
    role: "Player",
    href: "/player",
    description: "Your progress, evaluations, and coach feedback",
    iconComponent: <IconUser size={26} color="#00C853" />,
    accent: "#00C853",
  },
  {
    role: "Coach",
    href: "/coach",
    description: "Run sessions, evaluate players, track development",
    iconComponent: <IconClipboard size={26} color="#60A5FA" />,
    accent: "#60A5FA",
  },
  {
    role: "Parent",
    href: "/parent",
    description: "Monitor your child's progress, attendance and reports",
    iconComponent: <IconShield size={26} color="#8B5CF6" />,
    accent: "#8B5CF6",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col noise-overlay">
      {/* Ambient Glows */}
      <div className="fixed rounded-full pointer-events-none" style={{ width: 500, height: 500, background: "rgba(0,200,83,0.04)", filter: "blur(150px)", top: "-10%", left: "30%" }} />
      <div className="fixed rounded-full pointer-events-none" style={{ width: 400, height: 400, background: "rgba(96,165,250,0.03)", filter: "blur(130px)", bottom: "10%", right: "20%" }} />

      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-5 pb-16 relative z-10">
        {/* Hero */}
        <div className="text-center mb-12 opacity-0 animate-fade-up" style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}>
          {/* 3D Interactive Logo Mark */}
          <div className="relative w-44 h-44 md:w-52 md:h-52 mx-auto mb-8 xball-hero">
            <Image 
              src="/xball.png" 
              alt="KickXPro 3D Ball" 
              fill 
              className="object-contain"
              priority
            />
          </div>

          {/* Branded Text Logo */}
          <div className="relative w-72 h-16 md:w-80 md:h-20 mx-auto mb-4">
             <Image 
               src="/logo-text.png" 
               alt="KickXPro" 
               fill 
               className="object-contain"
               priority
             />
          </div>

          <p className="text-sm md:text-base max-w-md mx-auto" style={{ color: "var(--color-text-muted)", lineHeight: 1.7 }}>
            AI-powered sports performance platform for coaches and players.
            Evaluate, track progress, and unlock potential.
          </p>
        </div>

        {/* Portal Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl mb-8">
          {PORTALS.map((portal, i) => (
            <Link
              key={portal.role}
              href={portal.href}
              className="card p-6 flex flex-col items-start gap-4 no-underline group opacity-0 animate-fade-up"
              style={{
                animationDelay: `${0.2 + i * 0.1}s`,
                animationFillMode: "forwards",
              }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ background: `${portal.accent}10` }}
              >
                {portal.iconComponent}
              </div>
              <div>
                <div className="text-base font-bold mb-1" style={{ fontFamily: "var(--font-heading)" }}>
                  {portal.role}
                </div>
                <div className="text-xs leading-relaxed" style={{ color: "var(--color-text-dim)" }}>
                  {portal.description}
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold mt-auto" style={{ color: portal.accent }}>
                Open Portal <IconChevronRight size={14} color={portal.accent} />
              </div>
            </Link>
          ))}
        </div>

        {/* Register & Login CTA */}
        <div className="opacity-0 animate-fade-up flex items-center justify-center gap-4" style={{ animationDelay: "0.5s", animationFillMode: "forwards" }}>
          <Link
            href="/login"
            className="btn-primary flex items-center gap-2 no-underline text-sm px-6 py-2.5"
          >
            Sign In To Portal
          </Link>
          <Link
            href="/register"
            className="btn-secondary flex items-center gap-2 no-underline text-sm px-6 py-2.5"
          >
            <IconPlusCircle size={16} />
            Register
          </Link>
        </div>

        {/* Platform status + Disclaimer */}
        <div className="mt-10 text-center opacity-0 animate-fade-up" style={{ animationDelay: "0.6s", animationFillMode: "forwards" }}>
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full" style={{ background: "#00C853", boxShadow: "0 0 8px #00C853" }} />
            <span className="text-xs font-medium" style={{ color: "var(--color-text-dim)" }}>Platform Online</span>
          </div>
          <p className="text-xs max-w-sm mx-auto" style={{ color: "var(--color-text-dim)", lineHeight: 1.6 }}>
            Designed for ages 12+. Parental or guardian supervision recommended for users under 16 years.
          </p>
        </div>
      </main>
    </div>
  );
}
