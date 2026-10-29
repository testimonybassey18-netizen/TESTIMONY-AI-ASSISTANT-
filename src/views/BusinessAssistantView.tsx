import React, { useState } from 'react';
import {
  Briefcase,
  Sparkles,
  Lightbulb,
  Rocket,
  Target,
  FileCheck2,
  Copy,
  Check,
  Building,
  Calendar,
} from 'lucide-react';
import { callGeminiGenerate } from '../services/geminiService';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

interface BusinessAssistantViewProps {
  onOpenSubscriptionModal: () => void;
  isPro: boolean;
}

export const BusinessAssistantView: React.FC<BusinessAssistantViewProps> = ({
  onOpenSubscriptionModal,
  isPro,
}) => {
  const [toolType, setToolType] = useState<'ideas' | 'plan' | 'marketing' | 'names' | 'product' | 'roadmap'>('ideas');
  const [industry, setIndustry] = useState('Technology & E-commerce');
  const [inputDetails, setInputDetails] = useState('');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const tools = [
    { id: 'ideas', name: 'Business Ideas', icon: Lightbulb, desc: 'High-potential concepts with low startup cost' },
    { id: 'plan', name: 'Lean Business Plan', icon: FileCheck2, desc: 'Value prop, target market & revenue model' },
    { id: 'marketing', name: 'Marketing Strategy', icon: Target, desc: 'Customer acquisition, channels & funnels' },
    { id: 'names', name: 'Brand Name Brainstorm', icon: Building, desc: 'Memorable brand names & taglines' },
    { id: 'product', name: 'Product Descriptions', icon: Rocket, desc: 'Compelling sales copy for items/services' },
    { id: 'roadmap', name: 'Action Roadmap', icon: Calendar, desc: '30-60-90 day execution milestones' },
  ] as const;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputDetails.trim() || isLoading) return;

    setIsLoading(true);

    const prompts = {
      ideas: `Generate 3 innovative, realistic business ideas in the ${industry} sector based on: "${inputDetails}". For each idea, detail: The Core Problem, Proposed Solution, Monetization Model, and Estimated Capital Needed. Clearly distinguish market suggestions from financial guarantees.`,
      plan: `Write an actionable, structured Lean Business Plan in the ${industry} sector for: "${inputDetails}". Include: Executive Summary, Target Customer Profile, Value Proposition, Key Revenue Streams, Cost Structure, and Unfair Competitive Advantage.`,
      marketing: `Develop a comprehensive, low-budget Go-To-Market & Marketing Strategy for: "${inputDetails}". Detail organic social channels, referral loops, SEO strategy, paid ad test angles, and key conversion metrics.`,
      names: `Brainstorm 15 catchy, brandable, modern company or product names in the ${industry} sector for: "${inputDetails}". Include a 1-sentence tagline and domain name availability style for each.`,
      product: `Write high-converting, magnetic product descriptions and benefit bullet points for: "${inputDetails}".`,
      roadmap: `Create a step-by-step 30-60-90 day practical execution plan for launching or growing: "${inputDetails}". Detail specific weekly deliverables.`,
    };

    const systemInstruction = `You are Testimony AI Senior Startup Strategist and Venture Consultant.
Provide high-value, realistic, commercially sound advice. Never guarantee future profits or fabricate regulatory licenses. Distinguish strategic suggestions from verified facts.`;

    try {
      const res = await callGeminiGenerate({
        prompt: prompts[toolType],
        systemInstruction,
        temperature: 0.6,
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
          <Briefcase className="w-4 h-4" />
          <span>Entrepreneurship &amp; Venture Suite</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
          AI Business &amp; Startup Assistant
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Brainstorm viable ideas, draft lean business plans, generate brand names, and craft 30-60-90 day execution roadmaps.
        </p>
      </div>

      {/* Tool Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {tools.map((t) => {
          const Icon = t.icon;
          const isSelected = toolType === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setToolType(t.id)}
              className={`p-3 rounded-xl text-left border transition flex flex-col justify-between gap-2 ${
                isSelected
                  ? 'bg-purple-600/30 border-purple-500 text-white shadow-md'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4 text-purple-400" />
              <div>
                <div className="font-bold text-xs">{t.name}</div>
                <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{t.desc}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Input Form */}
      <form onSubmit={handleGenerate} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Industry or Sector
            </label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. EdTech, Eco Fashion, Food Delivery, SaaS, Healthcare"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Describe your business concept, target customer, or objectives:
          </label>
          <textarea
            value={inputDetails}
            onChange={(e) => setInputDetails(e.target.value)}
            rows={4}
            placeholder="e.g. 'An online platform helping university students find verified roommates and split bills safely in major cities...'"
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={!inputDetails.trim() || isLoading}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Strategizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Strategy</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Output */}
      {output && (
        <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-5 sm:p-7 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="font-bold text-white text-sm">Strategic Plan Output</span>
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
                  <span>Copy Strategy</span>
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
