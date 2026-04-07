/* ──────────────────────────────────────────────
   SIDEBAR (Light Theme Update)
   Updated active state for light mode readability
   with glowing left border and subtle shading.
   ────────────────────────────────────────────── */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconGrid, IconPlusCircle, IconUsers, IconClipboard, IconTimer, IconMessageSquare, IconWallet,
  IconShield, IconActivity, IconTarget, IconTrendingUp, IconCalendar, IconAward, IconBarChart,
  IconFire, IconStar, IconZap
} from "@/components/Icons";

interface SidebarItem {
  href: string;
  label: string;
  icon: string;
}

interface SidebarProps {
  items: SidebarItem[];
  accentColor?: string;
}

function getIcon(name: string, color: string) {
  const props = { size: 18, color };
  switch (name) {
    case "grid": return <IconGrid {...props} />;
    case "plus-circle": return <IconPlusCircle {...props} />;
    case "users": return <IconUsers {...props} />;
    case "clipboard": return <IconClipboard {...props} />;
    case "timer": return <IconTimer {...props} />;
    case "message-square": return <IconMessageSquare {...props} />;
    case "wallet": return <IconWallet {...props} />;
    case "shield": return <IconShield {...props} />;
    case "activity": return <IconActivity {...props} />;
    case "target": return <IconTarget {...props} />;
    case "trending-up": return <IconTrendingUp {...props} />;
    case "calendar": return <IconCalendar {...props} />;
    case "award": return <IconAward {...props} />;
    case "bar-chart": return <IconBarChart {...props} />;
    case "fire": return <IconFire {...props} />;
    case "star": return <IconStar {...props} />;
    case "zap": return <IconZap {...props} />;
    default: return <IconGrid {...props} />;
  }
}

export default function Sidebar({ items, accentColor = "#00C853" }: SidebarProps) {
  const pathname = usePathname();

  // Highlight fix: Ensure parent routes match (e.g. /coach/sessions matches /coach/sessions)
  return (
    <aside
      className="w-56 flex-shrink-0 border-r hidden md:flex flex-col py-6 px-3 gap-2 bg-white"
      style={{
        borderColor: "var(--color-border)",
        minHeight: "calc(100vh - 64px)",
      }}
    >
      {items.map((item) => {
        // Only active if exact match, or if it's the dashboard (meaning exact matches only to avoid dashboard always active)
        const isActive = pathname === item.href || (item.href !== "/coach" && item.href !== "/player" && item.href !== "/admin" && pathname.startsWith(item.href));
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm no-underline transition-all relative overflow-hidden group`}
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
    </aside>
  );
}
