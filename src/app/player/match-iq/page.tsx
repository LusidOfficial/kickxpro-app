/* ──────────────────────────────────────────────
   PLAYER MATCH IQ — Tactical Learning Cards
   Players review scenario cards generated from
   coach-logged tactical events. Swipeable cards
   with color-coded lessons and feedback.
   ────────────────────────────────────────────── */
"use client";

import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  IconCheck, IconChevronRight, IconTrendingUp, IconShield,
  IconActivity, IconTarget, IconPlay
} from "@/components/Icons";

/* ── Mock Data ── */
const MOCK_CARDS = [
  {
    id: "tc1",
    tag: "Lost Shape",
    type: "Negative" as const,
    lesson: "When the ball is on the opposite flank, maintain your positional distance from teammates. Don't get attracted to the ball — hold your zone.",
    coach_note: "You drifted too narrow in the 35th minute, leaving the right channel exposed.",
    session_date: "2026-03-14",
    reviewed: false,
    video_link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Example video link
  },
  {
    id: "tc2",
    tag: "Great Vision",
    type: "Positive" as const,
    lesson: "Excellent awareness to spot the overlapping run early. Keep scanning the field before receiving the ball.",
    coach_note: "That switch of play in the 52nd minute was outstanding. More of that!",
    session_date: "2026-03-14",
    reviewed: false,
    video_link: null,
  },
  {
    id: "tc3",
    tag: "Pressed Too Early",
    type: "Negative" as const,
    lesson: "Wait for the pressing trigger before closing down. If the opposition has an easy out-ball, pressing just creates space behind you.",
    coach_note: "Twice in the first half you pressed the CB alone. Wait for the team to set the trap.",
    session_date: "2026-03-12",
    reviewed: false,
    video_link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
  {
    id: "tc4",
    tag: "Smart Run",
    type: "Positive" as const,
    lesson: "Your diagonal run into the space behind the fullback was perfectly timed. Keep checking the defender's body position for cues.",
    coach_note: "That movement in the 68th minute created the goal. World-class instinct.",
    session_date: "2026-03-12",
    reviewed: false,
    video_link: null,
  },
  {
    id: "tc5",
    tag: "Wrong Passing Option",
    type: "Negative" as const,
    lesson: "When under pressure in the midfield, the safe option is always backwards or sideways. The risky forward pass only works when you have time and space.",
    coach_note: "Three turnovers from forced forward passes. Let's work on decision-making.",
    session_date: "2026-03-10",
    reviewed: true,
    video_link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
  {
    id: "tc6",
    tag: "Won Aerial Duel",
    type: "Positive" as const,
    lesson: "Great technique on the aerial challenge — you timed your jump and angled your body perfectly. Continue working on your leap timing.",
    coach_note: "Won 4 out of 5 aerial duels today. Dominant display.",
    session_date: "2026-03-10",
    reviewed: true,
    video_link: null,
  },
];

type TacticalCard = typeof MOCK_CARDS[number];

export default function PlayerMatchIQPage() {
  const [cards, setCards] = useState<TacticalCard[]>(MOCK_CARDS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filter, setFilter] = useState<"All" | "Positive" | "Negative">("All");
  const [view, setView] = useState<"cards" | "progress">("cards");
  const [quizMode, setQuizMode] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const filteredCards = filter === "All" ? cards : cards.filter(c => c.type === filter);
  
  // Group identical cards together
  const groupedCards = useMemo(() => {
    const map = new Map<string, TacticalCard & { count: number; instances: TacticalCard[] }>();
    filteredCards.forEach(c => {
      // Create a unique key based on the tag
      const key = `${c.tag}-${c.type}`;
      if (map.has(key)) {
        const existing = map.get(key)!;
        existing.count += 1;
        existing.instances.push(c);
        // Keep the latest date
        if (new Date(c.session_date) > new Date(existing.session_date)) {
           existing.session_date = c.session_date;
        }
        // If any in group is unreviewed, whole group is considered unreviewed
        if (!c.reviewed) existing.reviewed = false;
      } else {
        map.set(key, { ...c, count: 1, instances: [c] });
      }
    });
    return Array.from(map.values());
  }, [filteredCards]);

  useEffect(() => {
    if (currentIndex >= groupedCards.length) {
      setCurrentIndex(Math.max(0, groupedCards.length - 1));
    }
  }, [groupedCards.length, currentIndex]);

  const currentGroup = groupedCards[currentIndex];
  const unreviewedCount = cards.filter(c => !c.reviewed).length;

  const markReviewed = () => {
    if (!currentGroup) return;
    const idsToMark = currentGroup.instances.map((i: any) => i.id);
    setCards(prev => prev.map(c => idsToMark.includes(c.id) ? { ...c, reviewed: true } : c));
    if (currentIndex < groupedCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setRevealed(false); // Reset reveal on next card
    }
  };

  const nextCard = () => {
    setCurrentIndex(prev => Math.min(prev + 1, groupedCards.length - 1));
    setRevealed(false); // Reset reveal on next card
  };

  const typeColor = (type: string) =>
    type === "Positive" ? "#10B981" : type === "Negative" ? "#EF4444" : "#94A3B8";

  const typeBg = (type: string) =>
    type === "Positive" ? "bg-emerald-50 border-emerald-200" : type === "Negative" ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200";

  const typeIcon = (type: string) =>
    type === "Positive" ? <IconTrendingUp size={18} /> : <IconShield size={18} />;

  // Progress Calculation 
  const totalPositives = cards.filter(c => c.type === "Positive").length;
  const totalNegatives = cards.filter(c => c.type === "Negative").length;
  const learningScore = Math.round((totalPositives / (totalPositives + totalNegatives || 1)) * 100);

  return (
    <div className="max-w-6xl mx-auto pb-24 px-4 xl:px-0 opacity-0 animate-fade-up">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-slate-900 leading-tight" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}>
          Match IQ
        </h1>
        <p className="text-slate-500 font-medium text-xs md:text-sm">
          Review tactical lessons from your coach. {unreviewedCount > 0 && <span className="text-amber-600 font-bold">{unreviewedCount} new cards!</span>}
        </p>
      </div>

      {/* Main View Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-2xl mb-6 w-full md:w-max mx-auto md:mx-0">
        <button
          onClick={() => setView("cards")}
          className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${view === "cards" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          Tactical Cards
        </button>
        <button
          onClick={() => setView("progress")}
          className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${view === "progress" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          Learning Progress
        </button>
      </div>

      {view === "progress" ? (
        <div className="card-static p-6 md:p-10 border-indigo-100 bg-indigo-50/30">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2" style={{ fontFamily: "var(--font-heading)" }}>Your Tactical IQ Growth</h2>
            <p className="text-slate-500 text-sm max-w-lg mx-auto">Track your positive reinforcements versus areas of improvement to see how your game intelligence is developing over the season.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center">
              <div className="text-4xl font-black text-emerald-500 mb-2">{totalPositives}</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Positive Habits</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-blue-600 opacity-10" />
               <div className="text-5xl font-black text-indigo-600 mb-2 relative z-10">{learningScore}%</div>
               <div className="text-xs font-bold text-indigo-900/60 uppercase tracking-widest relative z-10">IQ Score</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center">
              <div className="text-4xl font-black text-red-500 mb-2">{totalNegatives}</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Fixable Errors</div>
            </div>
          </div>
          
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-4 mb-4" style={{ fontFamily: "var(--font-heading)" }}>Top Areas of Improvement (Recurring)</h3>
            <div className="space-y-4">
               {groupedCards.filter((g: any) => g.type === "Negative" && g.count > 1).map((g: any) => (
                 <div key={g.tag} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-red-50/50 rounded-xl border border-red-100">
                   <div>
                     <div className="font-bold text-slate-900 text-sm mb-1">{g.tag}</div>
                     <div className="text-xs text-slate-500">Logged {g.count} times. You need to focus on this heavily.</div>
                   </div>
                   <div className="bg-red-100 text-red-700 px-3 py-1 rounded-lg text-xs font-bold shrink-0">
                     x{g.count} Occurrences
                   </div>
                 </div>
               ))}
               {groupedCards.filter((g: any) => g.type === "Negative" && g.count > 1).length === 0 && (
                 <div className="text-sm text-slate-500 text-center py-4">No recurring tactical errors found. Keep it up!</div>
               )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Card Filters */}
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
            <div className="lg:col-span-2 relative">
              {currentGroup ? (
                <div className={`card-static p-6 md:p-8 border-2 transition-all relative z-10 ${typeBg(currentGroup.type)}`}>
                  {/* Grouped Badge */}
                  {currentGroup.count > 1 && (
                    <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full shadow-lg flex items-center justify-center font-black text-white text-xs z-20" style={{ background: typeColor(currentGroup.type) }}>
                      x{currentGroup.count}
                    </div>
                  )}
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: `${typeColor(currentGroup.type)}20`, color: typeColor(currentGroup.type) }}
                      >
                        {typeIcon(currentGroup.type)}
                      </div>
                      <div>
                        <h2 className="font-bold text-lg text-slate-900" style={{ fontFamily: "var(--font-heading)" }}>{currentGroup.tag}</h2>
                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: typeColor(currentGroup.type) }}>
                          {currentGroup.type} • Updated {currentGroup.session_date}
                        </span>
                      </div>
                    </div>
                    {currentGroup.reviewed && (
                      <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-lg">
                        <IconCheck size={12} /> Reviewed
                      </span>
                    )}
                  </div>

                  {/* Lesson with Quiz Mode */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                       <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tactical Lesson</h4>
                       <button
                         onClick={() => { setQuizMode(!quizMode); setRevealed(false); }}
                         className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 border
                           ${quizMode ? "bg-indigo-50 text-indigo-600 border-indigo-200" : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"}`}
                       >
                         {quizMode ? "Turn Off Quiz" : "Quiz Mode"}
                       </button>
                    </div>
                    <div 
                      className={`p-4 rounded-xl border transition-all duration-300 relative overflow-hidden
                        ${quizMode && !revealed ? "bg-slate-900 border-slate-800 cursor-pointer hover:bg-slate-800 group" : "bg-white/70 border-white"}`}
                      onClick={() => { if (quizMode && !revealed) setRevealed(true); }}
                    >
                      {quizMode && !revealed ? (
                        <div className="flex flex-col items-center justify-center py-4 text-center">
                          <span className="text-xl mb-2 opacity-50 block group-hover:scale-110 transition-transform">🧠</span>
                          <span className="text-sm font-bold text-slate-300">Think deeply... what did the coach say about '{currentGroup.tag}'?</span>
                          <span className="text-xs text-indigo-400 mt-2 font-medium">Click to reveal answer</span>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-700 leading-relaxed">
                          {currentGroup.lesson}
                          {quizMode && <span className="block mt-4 text-xs font-bold text-indigo-500 bg-indigo-50 p-2 rounded-lg text-center">Hope you got it right!</span>}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Coach Notes (List if multiple) */}
                  <div className="mb-8">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Coach's Logbook</h4>
                    <div className="space-y-2">
                       {currentGroup.instances.map((instance: any, idx: number) => (
                         <div key={idx} className="bg-white/50 p-3 md:p-4 rounded-xl border border-white/70">
                            <div className="text-[10px] font-bold text-slate-400 mb-1">{instance.session_date}</div>
                            <p className="text-sm text-slate-600 leading-relaxed italic">"{instance.coach_note}"</p>
                         </div>
                       ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    {!currentGroup.reviewed && (
                      <button
                        onClick={markReviewed}
                        className="flex-1 py-3 rounded-xl text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                        style={{ background: typeColor(currentGroup.type) }}
                      >
                        <IconCheck size={16} /> Mark as Reviewed
                      </button>
                    )}
                    <button
                      onClick={nextCard}
                      disabled={currentIndex >= groupedCards.length - 1}
                      className="flex-1 py-3 rounded-xl text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-30"
                    >
                      Next Card <IconChevronRight size={16} />
                    </button>
                  </div>

                  {/* Progress */}
                  <div className="mt-4 text-center text-[10px] font-bold text-slate-400">
                    Card {currentIndex + 1} of {groupedCards.length} 
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
              
              {/* Stack Effect for identical cards */}
              {currentGroup && currentGroup.count > 1 && (
                 <div className="absolute top-2 left-2 right-2 bottom-[-8px] bg-slate-100 rounded-2xl border border-slate-200 -z-10" />
              )}
              {currentGroup && currentGroup.count > 2 && (
                 <div className="absolute top-4 left-4 right-4 bottom-[-16px] bg-slate-50 rounded-2xl border border-slate-100 -z-20" />
              )}
            </div>

            {/* ── Right Col: All Cards List & Coach Videos ── */}
            <div className="space-y-6">
              
              {/* All Cards List */}
              <div className="card-static p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest" style={{ fontFamily: "var(--font-heading)" }}>
                    All Scenarios
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{groupedCards.length} Unique</span>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                  {groupedCards.map((card: any, idx: number) => (
                    <button
                      key={card.tag}
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 relative
                        ${currentIndex === idx ? "bg-slate-900 text-white border-slate-900 shadow-xl" : "bg-white hover:bg-slate-50 border-slate-100"}`}
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
                          Updated {card.session_date}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {card.count > 1 && (
                          <div className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${currentIndex === idx ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-500"}`}>
                            x{card.count}
                          </div>
                        )}
                        {card.reviewed ? (
                          <IconCheck size={14} color={currentIndex === idx ? "#FFF" : "#10B981"} />
                        ) : (
                          <div className={`w-2 h-2 rounded-full animate-pulse ${currentIndex === idx ? "bg-amber-400" : "bg-amber-500"}`} />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Coach Video Library */}
              <div className="card-static p-6 sticky top-24">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2" style={{ fontFamily: "var(--font-heading)" }}>
                  <IconPlay size={16} color="#3B82F6" /> Coach Video Library
                </h3>
                <p className="text-xs text-slate-500 mb-6 leading-relaxed">Watch these tactical breakdowns to better understand your recurring habits.</p>
                
                <div className="space-y-4">
                  {[
                    { title: "Holding Shape on Opposite Flank", len: "4:12" },
                    { title: "When to Press vs Drop", len: "6:30" },
                    { title: "Scanning Before Receiving", len: "3:45" },
                  ].map((vid, idx) => (
                    <div key={idx} className="group relative overflow-hidden rounded-xl border border-slate-200 cursor-pointer">
                      <div className="absolute inset-0 bg-slate-900 opacity-60 transition-opacity group-hover:opacity-40" />
                      <div className="h-24 bg-slate-800 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white backdrop-blur-sm group-hover:scale-110 transition-transform">
                          <IconPlay size={16} color="white" />
                        </div>
                      </div>
                      <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                        {vid.len}
                      </div>
                      <div className="p-3 bg-white group-hover:bg-slate-50 transition-colors">
                        <div className="font-bold text-xs text-slate-900 line-clamp-1">{vid.title}</div>
                        <div className="text-[10px] text-slate-500 uppercase font-medium mt-1">Tactical • Coach Anita</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );
}
