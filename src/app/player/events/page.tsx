/* ──────────────────────────────────────────────
   PLAYER EVENTS & ANNOUNCEMENTS
   Read-only view of events posted by player's
   coach. Shows upcoming and past events.
   ────────────────────────────────────────────── */
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import {
  IconCalendar, IconActivity, IconTarget, IconStar
} from "@/components/Icons";

interface EventItem {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  event_date: string | null;
  location: string | null;
  created_at: string;
  coach_name?: string;
}

const TYPE_CONFIG: Record<string, { label: string; color: string; emoji: string }> = {
  tournament: { label: "Tournament", color: "#8B5CF6", emoji: "🏆" },
  friendly: { label: "Friendly", color: "#10B981", emoji: "⚽" },
  trial: { label: "Trial", color: "#F59E0B", emoji: "🎯" },
  camp: { label: "Camp", color: "#3B82F6", emoji: "🏕️" },
  other: { label: "Other", color: "#64748B", emoji: "📋" },
};

export default function PlayerEventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "upcoming" | "past">("all");

  useEffect(() => {
    if (!user) return;
    loadEvents();
  }, [user]);

  async function loadEvents() {
    if (!user) return;
    setLoading(true);

    // Get player's coach_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("coach_id")
      .eq("id", user.id)
      .single();

    if (!profile?.coach_id) {
      setLoading(false);
      return;
    }

    // Get events from coach
    const { data: eventsData } = await supabase
      .from("events")
      .select("*")
      .eq("coach_id", profile.coach_id)
      .order("event_date", { ascending: false });

    if (eventsData) {
      // Get coach name
      const { data: coach } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", profile.coach_id)
        .single();

      setEvents(eventsData.map(e => ({
        ...e,
        coach_name: coach?.full_name || "Coach",
      })));
    }

    setLoading(false);
  }

  const now = new Date();
  const filteredEvents = events.filter(e => {
    if (activeFilter === "upcoming") return e.event_date && new Date(e.event_date) >= now;
    if (activeFilter === "past") return e.event_date && new Date(e.event_date) < now;
    return true;
  });

  // Separate upcoming events for countdown display
  const upcomingEvents = events
    .filter(e => e.event_date && new Date(e.event_date) >= now)
    .sort((a, b) => new Date(a.event_date!).getTime() - new Date(b.event_date!).getTime())
    .slice(0, 3);

  function getDaysUntil(date: string): number {
    const diff = new Date(date).getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-20 text-center">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
        <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading events...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-24 px-4 xl:px-0 space-y-8">
      {/* Header */}
      <div className="opacity-0 animate-fade-up" style={{ animationFillMode: "forwards" }}>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}>
          Events & News
        </h1>
        <p className="text-slate-500 font-medium text-sm">Stay updated on tournaments, announcements, and academy news.</p>
      </div>

      {/* Upcoming Countdown Cards */}
      {upcomingEvents.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 opacity-0 animate-fade-up" style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}>
          {upcomingEvents.map(event => {
            const config = TYPE_CONFIG[event.event_type] || TYPE_CONFIG.announcement;
            const daysLeft = getDaysUntil(event.event_date!);
            return (
              <div key={event.id} className="card-static p-4 border-t-4 text-center" style={{ borderTopColor: config.color }}>
                <div className="text-2xl mb-1">{config.emoji}</div>
                <div className="text-sm font-bold text-slate-900 truncate">{event.title}</div>
                <div className="mt-2">
                  <span className="text-2xl font-black" style={{ color: config.color, fontFamily: "var(--font-heading)" }}>
                    {daysLeft}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">day{daysLeft !== 1 ? "s" : ""} left</span>
                </div>
                {event.location && (
                  <div className="text-[10px] text-slate-400 font-medium mt-1">📍 {event.location}</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 opacity-0 animate-fade-up" style={{ animationDelay: "0.15s", animationFillMode: "forwards" }}>
        {(["all", "upcoming", "past"] as const).map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all capitalize ${
              activeFilter === filter
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Events Feed */}
      {filteredEvents.length === 0 ? (
        <div className="card-static p-12 text-center opacity-0 animate-fade-up" style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}>
          <IconCalendar size={40} color="#CBD5E1" />
          <h3 className="text-lg font-bold text-slate-400 mt-4 mb-2">No events yet</h3>
          <p className="text-sm text-slate-400">Your coach will post announcements and events here.</p>
        </div>
      ) : (
        <div className="space-y-3 opacity-0 animate-fade-up" style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}>
          {filteredEvents.map((event, i) => {
            const config = TYPE_CONFIG[event.event_type] || TYPE_CONFIG.announcement;
            const isPast = event.event_date && new Date(event.event_date) < now;
            return (
              <div
                key={event.id}
                className={`card-static p-5 border-l-4 transition-all ${isPast ? "opacity-60" : "hover:shadow-md"}`}
                style={{ borderLeftColor: config.color }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: `${config.color}10` }}>
                    {config.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-bold text-slate-900">{event.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg" style={{ background: `${config.color}10`, color: config.color }}>
                        {config.label}
                      </span>
                      {isPast && <span className="text-[9px] font-bold bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">PAST</span>}
                    </div>
                    {event.description && (
                      <p className="text-xs text-slate-500 leading-relaxed mt-1">{event.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-[10px] font-bold text-slate-400">
                      {event.event_date && <span>📅 {new Date(event.event_date).toLocaleDateString()}</span>}
                      {event.location && <span>📍 {event.location}</span>}
                      <span>by {event.coach_name}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
