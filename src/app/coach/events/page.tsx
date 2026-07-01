/* ──────────────────────────────────────────────
   COACH EVENTS & ANNOUNCEMENTS HUB
   Create & manage events, tournaments, and
   academy-wide announcements.
   ────────────────────────────────────────────── */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import {
  IconCalendar, IconPlus, IconTarget, IconCheck,
  IconMessageSquare, IconStar, IconActivity, IconChevronRight
} from "@/components/Icons";

interface EventItem {
  id: string;
  title: string;
  description: string | null;
  event_type: "tournament" | "trial" | "friendly" | "camp" | "other";
  event_date: string;
  event_time: string | null;
  location: string | null;
  coach_id: string;
  created_at: string;
}

const EVENT_TYPES = [
  { key: "tournament", label: "Tournament", color: "#8B5CF6", emoji: "🏆" },
  { key: "friendly", label: "Friendly Match", color: "#10B981", emoji: "⚽" },
  { key: "trial", label: "Trial / Open Day", color: "#F59E0B", emoji: "🎯" },
  { key: "camp", label: "Training Camp", color: "#3B82F6", emoji: "🏕️" },
  { key: "other", label: "Other", color: "#64748B", emoji: "📋" },
];

export default function CoachEventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadEvents();
  }, [user]);

  async function loadEvents() {
    if (!user) return;
    setLoading(true);

    const { data } = await supabase
      .from("events")
      .select("*")
      .eq("coach_id", user.id)
      .order("created_at", { ascending: false });

    if (data) setEvents(data as EventItem[]);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this event?")) return;
    await supabase.from("events").delete().eq("id", id);
    loadEvents();
  }

  function getTypeConfig(type: string) {
    return EVENT_TYPES.find(t => t.key === type) || EVENT_TYPES[0];
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
    <div className="max-w-4xl space-y-8 pb-20">
      {/* Header */}
      <div className="opacity-0 animate-fade-up flex items-start justify-between gap-4" style={{ animationFillMode: "forwards" }}>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}>
            Events & Announcements
          </h1>
          <p className="text-slate-500 font-medium text-sm">Post updates, tournaments, and announcements for your players.</p>
        </div>
        <Link
          href="/coach/events/create"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all bg-emerald-600 text-white hover:bg-emerald-700 shadow-md no-underline"
        >
          <IconPlus size={16} /> New Event
        </Link>
      </div>

      {/* Events List */}
      {events.length === 0 ? (
        <div className="card-static p-12 text-center opacity-0 animate-fade-up" style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}>
          <IconCalendar size={40} color="#CBD5E1" />
          <h3 className="text-lg font-bold text-slate-400 mt-4 mb-2">No events yet</h3>
          <p className="text-sm text-slate-400">Create your first announcement or event to share with players.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event, i) => {
            const typeConfig = getTypeConfig(event.event_type);
            const isPast = event.event_date && new Date(event.event_date) < new Date();
            return (
              <div
                key={event.id}
                className={`card-static p-5 border-l-4 hover:shadow-md transition-all opacity-0 animate-fade-up ${isPast ? "opacity-60" : ""}`}
                style={{ borderLeftColor: typeConfig.color, animationDelay: `${0.1 + i * 0.04}s`, animationFillMode: "forwards" }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{typeConfig.emoji}</span>
                      <span className="text-sm font-bold text-slate-900">{event.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg border" style={{ background: `${typeConfig.color}10`, color: typeConfig.color, borderColor: `${typeConfig.color}30` }}>
                        {typeConfig.label}
                      </span>
                      {isPast && <span className="text-[9px] font-bold bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">PAST</span>}
                    </div>
                    {event.description && (
                      <p className="text-xs text-slate-500 leading-relaxed mt-1">{event.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-[10px] font-bold text-slate-400 uppercase">
                      {event.event_date && <span>📅 {new Date(event.event_date).toLocaleDateString()}</span>}
                      {event.location && <span>📍 {event.location}</span>}
                      <span>Posted {new Date(event.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="text-xs font-bold text-red-400 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50 flex-shrink-0"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
