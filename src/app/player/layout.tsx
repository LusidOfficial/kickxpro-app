"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import FeedbackWidget from "@/components/FeedbackWidget";
import { NAV_ITEMS } from "@/lib/constants";
import {
  IconGrid, IconTarget, IconActivity, IconMessageSquare, IconTrendingUp,
  IconCalendar, IconAward, IconBarChart, IconZap
} from "@/components/Icons";

function getIcon(name: string, color: string) {
  const props = { size: 18, color };
  switch (name) {
    case "grid": return <IconGrid {...props} />;
    case "target": return <IconTarget {...props} />;
    case "activity": return <IconActivity {...props} />;
    case "message-square": return <IconMessageSquare {...props} />;
    case "trending-up": return <IconTrendingUp {...props} />;
    case "calendar": return <IconCalendar {...props} />;
    case "award": return <IconAward {...props} />;
    case "bar-chart": return <IconBarChart {...props} />;
    case "zap": return <IconZap {...props} />;
    default: return <IconGrid {...props} />;
  }
}

export default function PlayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isClassic, setIsClassic] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("kickxpro_player_classic_mode");
    if (saved === "true") setIsClassic(true);
  }, []);

  const toggle = () => {
    const next = !isClassic;
    setIsClassic(next);
    localStorage.setItem("kickxpro_player_classic_mode", String(next));
  };

  const navItems = isClassic
    ? [...NAV_ITEMS.playerClassic]
    : [...NAV_ITEMS.player];

  const accentColor = "#00C853";

  return (
    <ProtectedRoute role="player">
      <div className="min-h-screen flex flex-col">
        <Navbar role="player" />
        <div className="flex flex-1">
          {/* Sidebar */}
          <aside
            className="w-56 flex-shrink-0 border-r hidden md:flex flex-col bg-white"
            style={{ borderColor: "var(--color-border)", minHeight: "calc(100vh - 64px)" }}
          >
            {/* View Toggle Button */}
            <div className="px-3 pt-4 pb-1">
              <button
                onClick={toggle}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border"
                style={{
                  background: isClassic ? "rgba(139,92,246,0.08)" : "rgba(16,185,129,0.08)",
                  borderColor: isClassic ? "rgba(139,92,246,0.2)" : "rgba(16,185,129,0.2)",
                  color: isClassic ? "#7C3AED" : "#059669",
                }}
              >
                <span>{isClassic ? "⚡ V2 (Full Features)" : "✨ Simplified (MVP)"}</span>
                <span className="text-[9px] opacity-60">Switch →</span>
              </button>
            </div>

            {/* Navigation Items */}
            <nav className="flex flex-col gap-1.5 py-4 px-3">
              {navItems.map(item => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/player" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm no-underline transition-all relative overflow-hidden group"
                    style={{
                      background: isActive ? `${accentColor}10` : "transparent",
                      color: isActive ? "#0F172A" : "var(--color-text-muted)",
                      fontWeight: isActive ? 700 : 500,
                    }}
                  >
                    {isActive && (
                      <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-md"
                        style={{ background: accentColor, boxShadow: `0 0 8px ${accentColor}80` }}
                      />
                    )}
                    <div className="z-10 group-hover:scale-110 transition-transform">
                      {getIcon(item.icon, isActive ? accentColor : "#64748B")}
                    </div>
                    <span className="z-10">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-6 md:p-8 relative z-10 overflow-y-auto">
            {children}
          </main>
        </div>
        <FeedbackWidget role="player" />
      </div>
    </ProtectedRoute>
  );
}
