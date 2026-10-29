import React, { useState } from 'react';
import {
  PenTool,
  Sparkles,
  Mail,
  FileText,
  CheckCircle,
  Copy,
  Check,
  RotateCcw,
  Sliders,
  Type,
  BookOpen,
  Share2,
} from 'lucide-react';
import { callGeminiGenerate } from '../services/geminiService';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

interface WritingAssistantViewProps {
  onOpenSubscriptionModal: () => void;
  isPro: boolean;
}

export const WritingAssistantView: React.FC<WritingAssistantViewProps> = ({
  onOpenSubscriptionModal,
  isPro,
}) => {
  const [category, setCategory] = useState<'email' | 'essay' | 'report' | 'grammar' | 'rewrite' | 'social' | 'proposal'>('email');
  const [tone, setTone] = useState<'professional' | 'friendly' | 'creative' | 'academic' | 'simple'>('professional');
  const [promptInput, setPromptInput] = useState('');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const categories = [
    { id: 'email', name: 'Work & Client Email', icon: Mail, desc: 'Clear, polite, action-oriented' },
    { id: 'essay', name: 'Academic Essay', icon: BookOpen, desc: 'Thesis, body arguments & conclusion' },
    { id: 'report', name: 'Executive Report', icon: FileText, desc: 'Findings, analysis & recommendations' },
    { id: 'grammar', name: 'Grammar & Polish', icon: CheckCircle, desc: 'Flawless phrasing & punctuation' },
    { id: 'rewrite', name: 'Rephrase & Paraphrase', icon: RotateCcw, desc: 'Enhance clarity or change tone' },
    { id: 'social', name: 'Social Media Caption', icon: Share2, desc: 'Engaging hooks & viral posts' },
    { id: 'proposal', name: 'Business Proposal', icon: PenTool, desc: 'Persuasive pitches & outlines' },
  ] as const;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim() || isLoading) return;

    setIsLoading(true);

    const systemInstruction = `You are Testimony AI Senior Professional Writer & Editor.
Task Type: ${category.toUpperCase()}
Chosen Tone: ${tone} (Professional = crisp, workplace-ready; Friendly = warm, personable; Creative = inventive, expressive; Academic = evidence-backed, formal; Simple = accessible, clear, 5th-grade reading level).
Craft the highest-quality draft. Structure properly with appropriate headings or formatting.`;

    try {
      const res = await callGeminiGenerate({
        prompt: promptInput,
        systemInstruction,
        temperature: tone === 'creative' ? 0.8 : 0.4,
      });

      setOutput(res);
    } catch (err: any) {
      setOutput('Generation failed: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
          <PenTool className="w-4 h-4" />
          <span>Content Creation Studio</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
          AI Writing &amp; Communication Assistant
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Craft emails, academic essays, executive reports, grammar improvements, and social captions with tone customization.
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => {
          const Icon = c.icon;
          const isSelected = category === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                isSelected
                  ? 'bg-purple-600/30 border-purple-500 text-white shadow-md'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5 text-purple-400" />
              <span>{c.name}</span>
            </button>
          );
        })}
      </div>

      {/* Editor Form */}
      <form onSubmit={handleGenerate} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        {/* Tone Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">Desired Tone:</span>
            <div className="inline-flex rounded-xl bg-slate-950 p-0.5 border border-slate-800 text-xs">
              {(['professional', 'friendly', 'creative', 'academic', 'simple'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  className={`px-3 py-1 rounded-lg capitalize font-medium transition ${
                    tone === t ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Prompt Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Describe what you want to write or paste text to refine:
          </label>
          <textarea
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            rows={5}
            placeholder={
              category === 'email'
                ? "e.g., 'Write a polite follow-up email to a hiring manager after an interview, highlighting enthusiasm and relevant software engineering skills...'"
                : category === 'grammar'
                ? "Paste any paragraph with typos or poor flow to get it perfected and explained..."
                : "Enter topic, key arguments, audience, or raw notes..."
            }
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={!promptInput.trim() || isLoading}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Crafting Masterpiece...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Text</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Output Display */}
      {output && (
        <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-5 sm:p-7 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="font-bold text-white text-sm">Generated Result</span>
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
                  <span>Copy Content</span>
                </>
              )}
            </button>
          </div>

          <div className="text-slate-200">
            <MarkdownRenderer content={output} />
          </div>
        </div>
      )}
    </div>
  );
};
