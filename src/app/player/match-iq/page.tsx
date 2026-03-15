/* ──────────────────────────────────────────────
   PLAYER MATCH IQ — Tactical Learning Cards
   Players review scenario cards generated from
   coach-logged tactical events. Swipeable cards
   with color-coded lessons and feedback.
   ────────────────────────────────────────────── */
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  IconCheck, IconTarget, IconShield, IconActivity,
  IconZap, IconChevronRight, IconTrendingUp
} from "@/components/Icons";

/* ── Mock Tactical Cards (fallback) ── */
const MOCK_CARDS = [
  {
    id: "tc1",
    tag: "Lost Shape",
    type: "Negative" as const,
    lesson: "When the ball is on the opposite flank, maintain your positional distance from teammates. Don't get attracted to the ball — hold your zone.",
    coach_note: "You drifted too narrow in the 35th minute, leaving the right channel exposed.",
    session_date: "2026-03-14",
    reviewed: false,
  },
  {
    id: "tc2",
    tag: "Great Vision",
    type: "Positive" as const,
    lesson: "Excellent awareness to spot the overlapping run early. Keep scanning the field before receiving the ball.",
    coach_note: "That switch of play in the 52nd minute was outstanding. More of that!",
    session_date: "2026-03-14",
    reviewed: false,
  },
  {
    id: "tc3",
    tag: "Pressed Too Early",
    type: "Negative" as const,
    lesson: "Wait for the pressing trigger before closing down. If the opposition has an easy out-ball, pressing just creates space behind you.",
    coach_note: "Twice in the first half you pressed the CB alone. Wait for the team to set the trap.",
    session_date: "2026-03-12",
    reviewed: false,
  },
  {
    id: "tc4",
    tag: "Smart Run",
    type: "Positive" as const,
    lesson: "Your diagonal run into the space behind the fullback was perfectly timed. Keep checking the defender's body position for cues.",
    coach_note: "That movement in the 68th minute created the goal. World-class instinct.",
    session_date: "2026-03-12",
    reviewed: false,
  },
  {
    id: "tc5",
    tag: "Wrong Passing Option",
    type: "Negative" as const,
    lesson: "When under pressure in the midfield, the safe option is always backwards or sideways. The risky forward pass only works when you have time and space.",
    coach_note: "Three turnovers from forced forward passes. Let's work on decision-making.",
    session_date: "2026-03-10",
    reviewed: true,
  },
  {
    id: "tc6",
    tag: "Won Aerial Duel",
    type: "Positive" as const,
    lesson: "Great technique on the aerial challenge — you timed your jump and angled your body perfectly. Continue working on your leap timing.",
    coach_note: "Won 4 out of 5 aerial duels today. Dominant display.",
    session_date: "2026-03-10",
    reviewed: true,
  },
];

type TacticalCard = typeof MOCK_CARDS[number];

export default function PlayerMatchIQPage() {
  const [cards, setCards] = useState<TacticalCard[]>(MOCK_CARDS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filter, setFilter] = useState<"All" | "Positive" | "Negative">("All");

  const filteredCards = filter === "All" ? cards : cards.filter(c => c.type === filter);
  const currentCard = filteredCards[currentIndex];
  const unreviewedCount = cards.filter(c => !c.reviewed).length;

  const markReviewed = () => {
    setCards(prev => prev.map(c => c.id === currentCard.id ? { ...c, reviewed: true } : c));
    if (currentIndex < filteredCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const typeColor = (type: string) =>
    type === "Positive" ? "#10B981" : type === "Negative" ? "#EF4444" : "#94A3B8";

  const typeBg = (type: string) =>
    type === "Positive" ? "bg-emerald-50 border-emerald-200" : type === "Negative" ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200";

  const typeIcon = (type: string) =>
    type === "Positive" ? <IconTrendingUp size={18} /> : <IconShield size={18} />;

  return (
    <div className="max-w-6xl mx-auto pb-24 px-4 xl:px-0 opacity-0 animate-fade-up">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-slate-900 leading-tight" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}>
          Match IQ
        </h1>
        <p className="text-slate-500 font-medium text-xs md:text-sm">
          Review tactical lessons from your coach. {unreviewedCount > 0 && <span className="text-amber-600 font-bold">{unreviewedCount} new cards to review!</span>}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-2xl mb-8 w-full md:w-max">
        {(["All", "Positive", "Negative"] as const).map(f => (
          <button
            key={f}
            onClick={() => { setFilter(f); setCurrentIndex(0); }}
            className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl text-xs font-bold transition-all
              ${filter === f ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            {f} {f !== "All" && `(${cards.filter(c => c.type === f).length})`}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Left: Card Viewer ── */}
        <div className="lg:col-span-2">
          {currentCard ? (
            <div className={`card-static p-6 md:p-8 border-2 transition-all ${typeBg(currentCard.type)}`}>
              {/* Card Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${typeColor(currentCard.type)}20`, color: typeColor(currentCard.type) }}
                  >
                    {typeIcon(currentCard.type)}
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-slate-900" style={{ fontFamily: "var(--font-heading)" }}>{currentCard.tag}</h2>
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: typeColor(currentCard.type) }}>
                      {currentCard.type} • {currentCard.session_date}
                    </span>
                  </div>
                </div>
                {currentCard.reviewed && (
                  <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-lg">
                    <IconCheck size={12} /> Reviewed
                  </span>
                )}
              </div>

              {/* Lesson */}
              <div className="mb-6">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tactical Lesson</h4>
                <p className="text-sm text-slate-700 leading-relaxed bg-white/70 p-4 rounded-xl border border-white">
                  {currentCard.lesson}
                </p>
              </div>

              {/* Coach Note */}
              <div className="mb-8">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Coach's Note</h4>
                <p className="text-sm text-slate-600 leading-relaxed italic bg-white/50 p-4 rounded-xl border border-white/70">
                  "{currentCard.coach_note}"
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {!currentCard.reviewed && (
                  <button
                    onClick={markReviewed}
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                    style={{ background: typeColor(currentCard.type) }}
                  >
                    <IconCheck size={16} /> Mark as Reviewed
                  </button>
                )}
                <button
                  onClick={() => setCurrentIndex(prev => Math.min(prev + 1, filteredCards.length - 1))}
                  disabled={currentIndex >= filteredCards.length - 1}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-30"
                >
                  Next Card <IconChevronRight size={16} />
                </button>
              </div>

              {/* Progress */}
              <div className="mt-4 text-center text-[10px] font-bold text-slate-400">
                Card {currentIndex + 1} of {filteredCards.length}
              </div>
            </div>
          ) : (
            <div className="card-static p-12 text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <IconCheck size={28} color="#10B981" />
              </div>
              <p className="font-bold text-slate-900">All caught up!</p>
              <p className="text-xs text-slate-400 mt-1">No more cards to review in this category.</p>
            </div>
          )}
        </div>

        {/* ── Right: All Cards List ── */}
        <div>
          <div className="card-static p-5">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4" style={{ fontFamily: "var(--font-heading)" }}>
              All Scenarios
            </h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
              {filteredCards.map((card, idx) => (
                <button
                  key={card.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3
                    ${currentIndex === idx ? "bg-slate-900 text-white border-slate-900" : "bg-white hover:bg-slate-50 border-slate-100"}`}
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: typeColor(card.type) }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-bold truncate ${currentIndex === idx ? "text-white" : "text-slate-900"}`}>
                      {card.tag}
                    </div>
                    <div className={`text-[10px] ${currentIndex === idx ? "text-slate-300" : "text-slate-400"}`}>
                      {card.session_date}
                    </div>
                  </div>
                  {card.reviewed && (
                    <IconCheck size={14} color={currentIndex === idx ? "#FFF" : "#10B981"} />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
