/* ──────────────────────────────────────────────
   NAVBAR (Light Theme + User Mock)
   Crisp header, shadow, user profile mock
   ────────────────────────────────────────────── */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { NAV_ITEMS } from "@/lib/constants";
import { IconLogout, IconSettings, IconGrid, IconTimer, IconClipboard, IconUsers } from "@/components/Icons";

export default function Navbar({ role }: { role?: string } = {}) {
  const pathname = usePathname();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Determine portal from route
  const isCoach = pathname?.startsWith("/coach");
  const isPlayer = pathname?.startsWith("/player");
  const isAdmin = pathname?.startsWith("/admin");

  const NavIcons: Record<string, JSX.Element> = {
    "grid": <IconGrid size={20} />,
    "timer": <IconTimer size={20} />,
    "clipboard": <IconClipboard size={20} />,
    "users": <IconUsers size={20} />
  };

  const currentNav = isCoach ? NAV_ITEMS.coach : isPlayer ? NAV_ITEMS.player : isAdmin ? NAV_ITEMS.admin : [];

  return (
    <nav className="h-16 border-b bg-white border-slate-200 shadow-sm flex items-center justify-between px-4 md:px-6 sticky top-0 z-50">
      
      {/* Brand & Portal Type */}
      <div className="flex items-center gap-4">
        {/* Mobile Hamburger Toggle */}
        {(isCoach || isPlayer || isAdmin) && (
          <button 
            className="md:hidden p-2 -ml-2 text-slate-500 rounded-lg hover:bg-slate-100"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        <Link href="/" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
          <Image
            src="/logo-text.png"
            alt="KickXPro Logo"
            width={140}
            height={32}
            className="w-auto h-7 md:h-8"
            priority
          />
        </Link>
        
        {isCoach && <span className="hidden md:inline-flex px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest ml-2 border border-blue-100">Coach Portal</span>}
        {isPlayer && <span className="hidden md:inline-flex px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest ml-2 border border-emerald-100">Player Portal</span>}
        {isAdmin && <span className="hidden md:inline-flex px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-black uppercase tracking-widest ml-2 border border-purple-100">Admin Portal</span>}
      </div>

      {/* Right Side Tools */}
      <div className="flex items-center gap-2 md:gap-4 relative">
        <Link href="/" className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors hidden sm:block">
          Switch Portal
        </Link>
        
        {/* Profile Avatar Mock */}
        <div 
           className="relative flex items-center gap-3 cursor-pointer p-1.5 rounded-full hover:bg-slate-50 transition-colors"
           onClick={() => setShowProfileMenu(!showProfileMenu)}
        >
          <div className="hidden sm:block text-right">
             <div className="text-sm font-bold text-slate-900 leading-none">Demo User</div>
             <div className="text-[10px] font-semibold text-slate-400 mt-1">KickXPro Beta</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-xs font-bold text-white shadow-sm ring-2 ring-white">
            DU
          </div>
        </div>

        {/* Profile Dropdown Mock */}
        {showProfileMenu && (
          <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 animate-fade-up !duration-150 z-50">
            <button className="w-full text-left px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2">
              <IconSettings size={14} /> Account Settings
            </button>
            <div className="h-px bg-slate-100 my-1"></div>
            <button className="w-full text-left px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2">
              <IconLogout size={14} /> Log Out
            </button>
          </div>
        )}
      </div>

      {/* Mobile Nav Overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm md:hidden" onClick={() => setShowMobileMenu(false)}>
          <div className="absolute left-0 top-0 bottom-0 w-[240px] bg-white shadow-2xl animate-slide-in p-6 flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-8 border-b pb-6">
               <span className="text-xl font-black text-slate-900">Push<span className="text-emerald-500">X</span></span>
               <button className="ml-auto p-2 bg-slate-100 rounded-full" onClick={() => setShowMobileMenu(false)}>
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                 </svg>
               </button>
            </div>
            
            <div className="flex-1 flex flex-col gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-2">Navigation</span>
              {currentNav.map(item => {
                const isActive = pathname === item.href || (item.href !== "/coach" && item.href !== "/player" && item.href !== "/admin" && pathname?.startsWith(item.href));
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    onClick={() => setShowMobileMenu(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all ${isActive ? "bg-emerald-50 text-emerald-600" : "text-slate-600 hover:bg-slate-50"}`}
                  >
                    {NavIcons[item.icon] || <IconGrid size={20} />}
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
