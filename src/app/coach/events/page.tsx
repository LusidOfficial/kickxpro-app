/* ──────────────────────────────────────────────
   COACH EVENTS & ANNOUNCEMENTS HUB
   Create & manage events, tournaments, and
   academy-wide announcements.
   ────────────────────────────────────────────── */
"use client";

import { useState, useEffect } from "react";
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
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState("announcement");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !title.trim()) return;
    setSaving(true);

    if (!eventDate) {
      setSaving(false);
      return;
    }
    const { error } = await supabase.from("events").insert({
      title: title.trim(),
      description: description.trim() || null,
      event_type: eventType,
      event_date: eventDate,
      location: location.trim() || null,
      coach_id: user.id,
    });

    if (!error) {
      setTitle("");
      setDescription("");
      setEventType("tournament");
      setEventDate("");
      setLocation("");
      setShowForm(false);
      setToast("Event created successfully! 🎉");
      setTimeout(() => setToast(""), 3000);
      loadEvents();
    }
    setSaving(false);
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
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
            showForm
              ? "bg-slate-200 text-slate-600"
              : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md"
          }`}
        >
          <IconPlus size={16} /> {showForm ? "Cancel" : "New Event"}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="card-static p-6 animate-fade-up border-l-4 border-emerald-500">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Create New Event</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            {/* Type Selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Type</label>
              <div className="flex flex-wrap gap-2">
                {EVENT_TYPES.map(type => (
                  <button
                    key={type.key}
                    type="button"
                    onClick={() => setEventType(type.key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      eventType === type.key
                        ? "text-white shadow-md"
                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                    }`}
                    style={{ background: eventType === type.key ? type.color : undefined, borderColor: eventType === type.key ? type.color : undefined }}
                  >
                    {type.emoji} {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Title *</label>
              <input
                type="text"
                className="input"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Inter-Academy U16 Cup"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Description</label>
              <textarea
                className="input"
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Add details, rules, requirements..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Date</label>
                <input
                  type="date"
                  className="input"
                  value={eventDate}
                  onChange={e => setEventDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Location</label>
                <input
                  type="text"
                  className="input"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. Central Stadium, Gate 3"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn-primary py-3 px-6 flex items-center gap-2"
            >
              {saving ? "Posting..." : "Post Event"} <IconCheck size={16} />
            </button>
          </form>
        </div>
      )}

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

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-slide-in font-bold text-sm">
          <IconCheck size={16} /> {toast}
        </div>
      )}
    </div>
  );
}
