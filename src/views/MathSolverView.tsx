import React, { useState } from 'react';
import {
  Calculator,
  Sparkles,
  Check,
  Copy,
  Brain,
  RotateCcw,
  BookOpen,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import { callGeminiGenerate } from '../services/geminiService';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

interface MathSolverViewProps {
  onOpenSubscriptionModal: () => void;
  isPro: boolean;
}

export const MathSolverView: React.FC<MathSolverViewProps> = ({
  onOpenSubscriptionModal,
  isPro,
}) => {
  const [topic, setTopic] = useState<'algebra' | 'arithmetic' | 'calculus' | 'geometry' | 'statistics' | 'practice'>('algebra');
  const [mathInput, setMathInput] = useState('');
  const [solution, setSolution] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const sampleMathPrompts = [
    { label: 'Quadratic Equation', text: 'Solve for x: 3x^2 - 11x - 4 = 0 using factoring and quadratic formula.' },
    { label: 'Calculus Derivative', text: 'Find the first derivative of f(x) = (3x^2 + 2) / (x - 1) using the quotient rule.' },
    { label: 'Geometry & Volume', text: 'A cylinder has a radius of 4cm and height of 10cm. Calculate volume and total surface area.' },
    { label: 'Probability & Stats', text: 'In a deck of 52 cards, what is the probability of drawing 2 aces consecutively without replacement?' },
  ];

  const handleSolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mathInput.trim() || isLoading) return;

    setIsLoading(true);

    const systemInstruction = `You are Testimony AI Mathematical Solver.
Category: ${topic.toUpperCase()}
Follow these principles:
1. Always state the problem clearly.
2. Provide step-by-step reasoning with every algebraic or arithmetic transformation clearly written.
3. Box or bold the final answer.
4. Clearly distinguish exact calculated answers (e.g. fractions, radicals, π) from approximations/estimates.
5. Provide a verification or sanity check step.
6. Provide one similar practice problem with its solution hidden or at the end for the learner.`;

    try {
      const res = await callGeminiGenerate({
        prompt: mathInput,
        systemInstruction,
        temperature: 0.1,
      });

      setSolution(res);
    } catch (err: any) {
      setSolution('Error solving problem: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!solution) return;
    navigator.clipboard.writeText(solution);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
          <Calculator className="w-4 h-4" />
          <span>Step-by-Step STEM Engine</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
          AI Math &amp; Equation Solver
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Solve algebra, arithmetic, geometry, calculus, and statistics with step-by-step proofs and practice problems.
        </p>
      </div>

      {/* Topic selection tabs */}
      <div className="flex flex-wrap gap-2">
        {(['algebra', 'arithmetic', 'calculus', 'geometry', 'statistics', 'practice'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTopic(t)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize border transition ${
              topic === t
                ? 'bg-purple-600/30 border-purple-500 text-white'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {t === 'practice' ? 'Practice Quiz Mode' : t}
          </button>
        ))}
      </div>

      {/* Solver Form */}
      <form onSubmit={handleSolve} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Enter Mathematical Equation, Word Problem, or Formula:
          </label>
          <textarea
            value={mathInput}
            onChange={(e) => setMathInput(e.target.value)}
            rows={3}
            placeholder="e.g., 'Solve 2x + 7 = 19' or 'Integrate (x^3 + 4x) dx' or 'Calculate compound interest on $5,000 at 6% for 4 years compounded monthly'"
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500 font-mono"
          />
        </div>

        {/* Sample clickers */}
        <div className="space-y-1.5">
          <span className="text-[11px] text-slate-400 font-medium">Quick Examples:</span>
          <div className="flex flex-wrap gap-2">
            {sampleMathPrompts.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setMathInput(s.text)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-purple-500/50 transition"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={!mathInput.trim() || isLoading}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Calculating Steps...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Calculate &amp; Explain Steps</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Solution */}
      {solution && (
        <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-5 sm:p-7 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="font-bold text-white text-sm">Step-by-Step Solution</span>
            <button
              onClick={handleCopy}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition flex items-center gap-1.5"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Solution</span>
                </>
              )}
            </button>
          </div>

          <div className="text-slate-200">
            <MarkdownRenderer content={solution} />
          </div>
        </div>
      )}
    </div>
  );
};
