"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { IconActivity, IconAward, IconCheck } from "@/components/Icons";

interface Scenario {
  scenario: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  explanation: string;
}

export default function MatchIQSimulator() {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  async function fetchScenario() {
    setLoading(true);
    setSelectedOption(null);
    setFeedback(null);
    
    try {
      const res = await fetch("/api/match-iq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate_scenario" })
      });
      const data = await res.json();
      if (data.scenario) {
        setScenario(data);
      } else {
        alert("Failed to generate scenario.");
      }
    } catch (e) {
      alert("Error connecting to AI.");
    }
    
    setLoading(false);
  }

  useEffect(() => {
    fetchScenario();
  }, []);

  const handleSelectOption = async (optionId: string, optionText: string) => {
    if (selectedOption || !scenario) return;
    
    setSelectedOption(optionId);
    setScore(prev => ({ 
      correct: prev.correct + (optionId === scenario.correctOptionId ? 1 : 0), 
      total: prev.total + 1 
    }));

    // Optionally get dynamic feedback from Gemini
    try {
      const res = await fetch("/api/match-iq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "evaluate_answer", answer: optionText, scenario: scenario.scenario })
      });
      const data = await res.json();
      if (data.feedback) {
        setFeedback(data.feedback);
      }
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2" style={{ fontFamily: "var(--font-heading)" }}>Match IQ Simulator</h1>
          <p className="text-slate-500">Test your tactical awareness in AI-generated match scenarios.</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Score</div>
          <div className="text-2xl font-bold text-indigo-600">{score.correct} / {score.total}</div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <IconActivity size={24} color="#4F46E5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Analyzing Tactics...</h2>
          <p className="text-slate-500">The AI is generating a dynamic match scenario.</p>
        </div>
      ) : scenario ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <div className="bg-slate-900 text-white p-6 rounded-2xl mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10 p-4">
              <IconAward size={100} />
            </div>
            <h2 className="text-xl font-bold mb-2 relative z-10">Match Situation</h2>
            <p className="text-slate-300 text-lg relative z-10 leading-relaxed">{scenario.scenario}</p>
          </div>

          <div className="space-y-4 mb-8">
            <h3 className="font-bold text-slate-700">What do you do?</h3>
            {scenario.options.map(opt => {
              const isSelected = selectedOption === opt.id;
              const isCorrect = opt.id === scenario.correctOptionId;
              
              let btnClass = "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50";
              if (selectedOption) {
                if (isCorrect) btnClass = "border-emerald-500 bg-emerald-50 text-emerald-900";
                else if (isSelected) btnClass = "border-red-500 bg-red-50 text-red-900";
                else btnClass = "border-slate-100 bg-slate-50 opacity-50";
              }

              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelectOption(opt.id, opt.text)}
                  disabled={selectedOption !== null}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all font-medium ${btnClass} flex items-center gap-4`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isSelected ? (isCorrect ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white') : 'bg-slate-100 text-slate-500'}`}>
                    {opt.id}
                  </div>
                  {opt.text}
                  {selectedOption && isCorrect && <div className="ml-auto text-emerald-500"><IconCheck size={20} /></div>}
                </button>
              );
            })}
          </div>

          {selectedOption && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 animate-fade-up">
              <h3 className="font-bold text-indigo-900 mb-2">Coach's Feedback</h3>
              <p className="text-indigo-800 mb-4">{scenario.explanation}</p>
              
              {feedback && (
                <div className="border-l-4 border-indigo-500 pl-4 py-1 mb-6">
                  <p className="text-slate-700 italic">" {feedback} "</p>
                </div>
              )}

              <button 
                onClick={fetchScenario}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md"
              >
                Next Scenario
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <button onClick={fetchScenario} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold">Try Again</button>
        </div>
      )}
    </div>
  );
}
