import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  Sparkles,
  HelpCircle,
  FileCheck,
  Check,
  Copy,
  RotateCcw,
  AlertCircle,
  Brain,
  Lightbulb,
} from 'lucide-react';
import { callGeminiGenerate } from '../services/geminiService';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

interface AssignmentSolverViewProps {
  onOpenSubscriptionModal: () => void;
  isPro: boolean;
}

export const AssignmentSolverView: React.FC<AssignmentSolverViewProps> = ({
  onOpenSubscriptionModal,
  isPro,
}) => {
  const [subject, setSubject] = useState('General');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [mode, setMode] = useState<'solve' | 'explain' | 'quiz' | 'structure'>('solve');
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const subjects = [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Computer Science',
    'History',
    'Literature & English',
    'Economics',
    'Business & Accounting',
    'Law & Government',
    'Philosophy',
    'General Studies',
  ];

  const handleSolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    const modePrompts = {
      solve: `Solve this assignment question step by step. Explain each step clearly so the student genuinely understands how the solution was achieved. Highlight formulas, rules, or core theorems used. Encourage active learning.`,
      explain: `Explain this topic or lesson in simple, memorable language with real-world analogies, historical or practical examples, and clear takeaways.`,
      quiz: `Generate a 5-question multiple choice & short-answer practice exam quiz based on this topic to test the student's mastery, followed by an Answer Key with detailed explanations.`,
      structure: `Review and improve the structure, argument flow, vocabulary, and grammar of this assignment or essay outline. Provide constructive feedback and an improved draft without fabricating citations.`,
    };

    const systemInstruction = `You are Testimony AI Academic Mentor.
Subject: ${subject}
Student Explanation Level: ${level} (Beginner = simple analogies, no assumed prior knowledge; Intermediate = high school / introductory college level; Advanced = rigorous undergraduate/graduate level).
Goal: ${modePrompts[mode]}
Never invent citations or historical dates. Always show your reasoning clearly.`;

    try {
      const output = await callGeminiGenerate({
        prompt: `Assignment Query:\n${query}`,
        systemInstruction,
        temperature: 0.4,
      });

      setResult(output);
    } catch (err: any) {
      setError(err?.message || 'Failed to solve assignment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
            <GraduationCap className="w-4 h-4" />
            <span>Academic Excellence Suite</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
            AI Assignment &amp; Exam Solver
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Step-by-step solutions, exam prep, and concept simplifications for students worldwide.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Difficulty:</span>
          <div className="inline-flex rounded-xl bg-slate-900 border border-slate-800 p-0.5 text-xs">
            {(['beginner', 'intermediate', 'advanced'] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setLevel(lvl)}
                className={`px-2.5 py-1 rounded-lg capitalize font-medium transition ${
                  level === lvl ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Solver Form */}
      <form onSubmit={handleSolve} className="space-y-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        {/* Controls row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select School Subject
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-purple-500"
            >
              {subjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Task Mode
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setMode('solve')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border text-center transition ${
                  mode === 'solve'
                    ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Step-by-Step Solution
              </button>
              <button
                type="button"
                onClick={() => setMode('explain')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border text-center transition ${
                  mode === 'explain'
                    ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Explain Concept
              </button>
              <button
                type="button"
                onClick={() => setMode('quiz')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border text-center transition ${
                  mode === 'quiz'
                    ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Exam Practice Quiz
              </button>
              <button
                type="button"
                onClick={() => setMode('structure')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border text-center transition ${
                  mode === 'structure'
                    ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Improve Structure &amp; Grammar
              </button>
            </div>
          </div>
        </div>

        {/* Question Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
            <span>Paste your assignment question, problem, or topic:</span>
            <span className="text-[11px] text-slate-500 font-normal">Supports equations, questions &amp; essays</span>
          </label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={4}
            placeholder="e.g., 'Solve 2x^2 + 5x - 3 = 0 showing all quadratic formula steps' or 'Explain photosynthesis light-dependent vs light-independent reactions' or paste your essay prompt..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Brain className="w-4 h-4 text-purple-400" />
            <span>Encourages understanding over shortcuts</span>
          </div>

          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Solving &amp; Reasoning...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Solve &amp; Explain</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-200 text-xs sm:text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <div>
            <div className="font-semibold">Unable to process assignment</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-5 sm:p-7 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              <span>Testimony AI Academic Explanation ({subject})</span>
            </div>
            <button
              onClick={handleCopy}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white transition flex items-center gap-1.5"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Copied Solution</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Notes</span>
                </>
              )}
            </button>
          </div>

          <div className="text-slate-200">
            <MarkdownRenderer content={result} />
          </div>
        </div>
      )}
    </div>
  );
};
