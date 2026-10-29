import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Zap,
  Shield,
  GraduationCap,
  FileText,
  Languages,
  BarChart3,
  PenTool,
  Calculator,
  FileSearch,
  Briefcase,
  MessageSquare,
  Crown,
  ChevronDown,
  Star,
  ExternalLink,
  Mic,
  Cpu,
  Clock,
  Layers,
  Check,
  HelpCircle,
  Mail,
  UserCheck
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { ActiveTool } from '../types';

interface WebsiteViewProps {
  onLaunchApp: (tool?: ActiveTool) => void;
  onOpenPricing: () => void;
  onOpenSignIn: () => void;
  freeMessagesRemaining: number;
  isSubscribed: boolean;
}

export const WebsiteView: React.FC<WebsiteViewProps> = ({
  onLaunchApp,
  onOpenPricing,
  onOpenSignIn,
  freeMessagesRemaining,
  isSubscribed,
}) => {
  const [activeDemoTab, setActiveDemoTab] = useState<ActiveTool>('chat');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toolsData = [
    {
      id: 'chat' as ActiveTool,
      name: 'AI Chat Assistant',
      shortDesc: 'Conversational intelligence with instant voice-to-text dictation and deep context reasoning.',
      icon: MessageSquare,
      color: 'from-blue-500 to-indigo-600',
      badge: 'Core Engine',
      audience: 'Everyone',
      promptExample: 'Analyze the ethical implications of quantum computing on modern data encryption.',
      responsePreview:
        'Quantum computing introduces Shor’s algorithm, which threatens classical RSA-2048 and ECC cryptography. Mitigations include Post-Quantum Cryptography (PQC) standards like lattice-based ML-KEM and hash-based digital signatures.',
      features: ['Voice dictation & real-time mic', 'Multi-turn conversation history', 'High-speed reasoning engine'],
    },
    {
      id: 'assignment' as ActiveTool,
      name: 'Academic Assignment Solver',
      shortDesc: 'Comprehensive homework assistance with academic explanations, citations, and structural outlines.',
      icon: GraduationCap,
      color: 'from-purple-500 to-pink-600',
      badge: 'Academic Pro',
      audience: 'Students & Researchers',
      promptExample: 'Explain Keynesian economics vs. Monetarism in managing stagflation.',
      responsePreview:
        'Keynesian economics advocates counter-cyclical fiscal intervention to stimulate aggregate demand, whereas Monetarism focuses on controlling the money supply to combat price inflation without compounding wage-price spirals.',
      features: ['Step-by-step methodologies', 'Academic tone & citations', 'Exam prep & study guides'],
    },
    {
      id: 'cv_builder' as ActiveTool,
      name: 'ATS CV & Resume Builder',
      shortDesc: 'Craft recruiter-ready, ATS-optimized resumes with live side-by-side preview and one-click PDF export.',
      icon: FileText,
      color: 'from-emerald-500 to-teal-600',
      badge: 'Career Accelerator',
      audience: 'Job Seekers & Executives',
      promptExample: 'Senior Software Engineer with 5+ years building distributed cloud microservices.',
      responsePreview:
        'Generated ATS Summary: Results-driven Software Engineer with 5+ years designing resilient cloud systems. Spearheaded Kubernetes migration reducing latency by 34% and cutting server expenditures by $85K/yr.',
      features: ['Real-time live formatting', 'ATS keyword enrichment', 'Instant print & PDF export'],
    },
    {
      id: 'translator' as ActiveTool,
      name: 'Multilingual Translator',
      shortDesc: 'Nuanced translations across African dialects (Yoruba, Igbo, Hausa) and major global languages.',
      icon: Languages,
      color: 'from-amber-500 to-orange-600',
      badge: 'Global Dialects',
      audience: 'International Teams',
      promptExample: 'Translate "Technology brings people closer together and creates new opportunities" into Yoruba.',
      responsePreview:
        'Yorùbá: "Ìmọ̀-ẹ̀rọ ń mú àwọn ènìyàn sún mọ́ ara wọn síi, ó sì ń pèsè àwọn ànfààní tuntun fún gbogbo wa."\n\nNotes: Preserves tonal marks and natural conversational cadence.',
      features: ['African & global languages', 'Dialect & tone preservation', 'Cultural context accuracy'],
    },
    {
      id: 'data_analyst' as ActiveTool,
      name: 'AI Data Analyst',
      shortDesc: 'Upload raw CSV or spreadsheet data for automated descriptive statistics, trend analysis, and charts.',
      icon: BarChart3,
      color: 'from-cyan-500 to-blue-600',
      badge: 'Business Intelligence',
      audience: 'Analysts & Marketers',
      promptExample: 'Upload sales_q3.csv (Region, Product, Revenue, ConversionRate)',
      responsePreview:
        'Key Findings: Total Revenue: $482,500 (+18.4% QoQ). Top performing category: Enterprise Cloud Tier ($215K). Anomaly detected: EMEA conversions dropped 4.2% during week 8 due to gateway maintenance.',
      features: ['Instant CSV table parsing', 'Statistical summaries & KPIs', 'Data-driven decision roadmaps'],
    },
    {
      id: 'writing' as ActiveTool,
      name: 'Writing Assistant',
      shortDesc: 'Refine emails, articles, proposals, and essays with calibrated tones from persuasive to executive.',
      icon: PenTool,
      color: 'from-rose-500 to-red-600',
      badge: 'Content Suite',
      audience: 'Writers & Creators',
      promptExample: 'Write an executive pitch proposal for securing seed funding from venture capitalists.',
      responsePreview:
        'Subject: Investment Memo: Testimony AI — Scalable Intelligence Architecture\n\nExecutive Summary: We are building the unified AI operating system for emerging markets and global professionals, addressing a $45B cross-productivity gap.',
      features: ['Tone & style calibration', 'Grammar & rhetorical polish', 'Copywriting & proposals'],
    },
    {
      id: 'math' as ActiveTool,
      name: 'AI Math Solver',
      shortDesc: 'Clear, step-by-step mathematical reasoning for algebra, calculus, matrices, and applied statistics.',
      icon: Calculator,
      color: 'from-indigo-500 to-violet-600',
      badge: 'STEM Intelligence',
      audience: 'Engineers & Students',
      promptExample: 'Solve the integral: ∫ x² · e^(3x) dx using integration by parts.',
      responsePreview:
        'Using tabular integration by parts:\nu = x² → u\' = 2x → u\'\' = 2 → 0\nv\' = e^(3x) → v = (1/3)e^(3x) → v₂ = (1/9)e^(3x) → v₃ = (1/27)e^(3x)\n\nResult: e^(3x) · [(x²/3) - (2x/9) + (2/27)] + C',
      features: ['Step-by-step breakdown', 'Algebra to advanced calculus', 'Mathematical proofs & formulas'],
    },
    {
      id: 'document' as ActiveTool,
      name: 'Document Assistant',
      shortDesc: 'Paste or upload dense contracts, legal filings, or research papers for instant clause extraction and Q&A.',
      icon: FileSearch,
      color: 'from-teal-500 to-emerald-600',
      badge: 'Document AI',
      audience: 'Legal & Enterprise',
      promptExample: 'Extract indemnity liabilities and termination clauses from this commercial NDA agreement.',
      responsePreview:
        'Clause Analysis:\n1. Section 4 (Indemnification): Mutual uncapped liability on confidentiality breaches.\n2. Section 9 (Termination): 30-day written notice required; survival clause remains in effect for 3 years post-termination.',
      features: ['Deep semantic extraction', 'Contract & paper summaries', 'Direct Q&A across documents'],
    },
    {
      id: 'business' as ActiveTool,
      name: 'Business Assistant',
      shortDesc: 'Formulate business plans, financial projections, competitive analyses, and go-to-market strategies.',
      icon: Briefcase,
      color: 'from-violet-500 to-purple-600',
      badge: 'Executive Suite',
      audience: 'Founders & Managers',
      promptExample: 'Create a 90-day Go-To-Market strategy for a B2B SaaS productivity platform.',
      responsePreview:
        'Phase 1 (Days 1–30): Beta testing with 50 pilot customers, qualitative user interviews, NPS tracking.\nPhase 2 (Days 31–60): Launch referral flywheel, LinkedIn founder-led content, integration partnerships.\nPhase 3 (Days 61–90): Paid CAC optimization, self-serve onboarding funnel.',
      features: ['Go-to-market frameworks', 'Unit economics modeling', 'Pitch deck outlines'],
    },
  ];

  const activeToolData = toolsData.find((t) => t.id === activeDemoTab) || toolsData[0];

  const faqs = [
    {
      q: 'How does the 25 Free Messages allowance work?',
      a: 'Every new account automatically receives 25 free AI messages upon opening the app. Only successfully processed AI requests decrement your balance. Your remaining allowance is securely saved on the server and will not reset on page refresh or browser restart.',
    },
    {
      q: 'What happens when my 25 free messages are used up?',
      a: 'After you send your 25th message, the subscription screen will automatically appear inviting you to upgrade. Your account, past chat histories, and saved CVs remain completely safe and viewable anytime without intrusive popups.',
    },
    {
      q: 'What are the subscription plans and prices?',
      a: 'We offer two transparent plans: the Monthly Subscription at $10 / month, and the Yearly Subscription at $250 / year (highlighted as our Premium Annual option). Both plans unlock unlimited AI messages and full access to all 9 specialized tools.',
    },
    {
      q: 'Can I use voice dictation in the AI chat?',
      a: 'Yes! TESTIMONY AI ASSISTANT features built-in microphone speech-to-text voice chat. Simply click the microphone icon in the chat bar and speak naturally; the assistant will transcribe and process your voice prompt instantly.',
    },
    {
      q: 'Can I export my resumes and generated reports?',
      a: 'Yes. The CV & Resume Builder includes a live print & PDF export engine formatted to pass corporate Applicant Tracking Systems (ATS). You can also copy, format, or download generated answers from any tool with one click.',
    },
    {
      q: 'Do I need my own API key or complex setup?',
      a: 'No. Everything is configured and processed securely through our server infrastructure. You do not need to configure any external API keys or code.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-purple-600/30 selection:text-purple-200">
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-purple-900/60 via-indigo-900/60 to-purple-900/60 border-b border-purple-800/40 px-4 py-2 text-center text-xs sm:text-sm text-purple-200 flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
        <span>
          Welcome to <strong className="text-white font-semibold">TESTIMONY AI ASSISTANT</strong> — 25 Free Messages Included for All New Users!
        </span>
        <button
          onClick={() => onLaunchApp('chat')}
          className="ml-2 underline text-white font-semibold hover:text-amber-300 transition text-xs"
        >
          Launch Assistant →
        </button>
      </div>

      {/* Main Website Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#070b14]/90 border-b border-slate-800/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onLaunchApp('chat')}>
            <Logo size="md" showTagline={false} />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-slate-300">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#demo" className="hover:text-white transition">Live Demo</a>
            <a href="#how-it-works" className="hover:text-white transition">How It Works</a>
            <a href="#pricing" className="hover:text-white transition">Pricing ($10/mo)</a>
            <a href="#testimonials" className="hover:text-white transition">Reviews</a>
            <a href="#faq" className="hover:text-white transition">FAQ</a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Free Message Counter Badge */}
            {!isSubscribed ? (
              <div className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-purple-300 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{freeMessagesRemaining} of 25 Free Left</span>
              </div>
            ) : (
              <div className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Pro Member</span>
              </div>
            )}

            {/* Sign In button */}
            <button
              onClick={onOpenSignIn}
              className="px-3.5 py-1.5 rounded-xl border border-slate-700 hover:border-slate-500 bg-slate-800/60 hover:bg-slate-700/60 text-xs font-medium text-slate-200 transition"
            >
              Sign In
            </button>

            {/* Launch App Primary CTA */}
            <button
              onClick={() => onLaunchApp('chat')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(139,92,246,0.4)] transition transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Launch App</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-purple-600/20 via-indigo-600/20 to-cyan-500/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute -top-10 left-10 w-72 h-72 bg-purple-900/20 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-900/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/60 border border-purple-800/50 text-purple-300 text-xs font-semibold mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span>The Complete 9-in-1 AI Operating Suite</span>
            <span className="w-1 h-1 rounded-full bg-purple-400" />
            <span className="text-amber-300 font-bold">25 Free Messages</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.12]">
            Your Intelligence.{' '}
            <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
              Your Creativity.
            </span>{' '}
            Your Success.
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Welcome to <strong className="text-white font-semibold">TESTIMONY AI ASSISTANT</strong>. Solve complex assignments, construct ATS-approved resumes, translate African & global languages, analyze data sheets, and brainstorm with voice AI — all from one unified dashboard.
          </p>

          {/* Call to Actions */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4">
            <button
              onClick={() => onLaunchApp('chat')}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm sm:text-base shadow-[0_0_30px_rgba(139,92,246,0.4)] transition transform hover:scale-102"
            >
              <span>Get Started Free (25 Messages)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="#demo"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-sm sm:text-base transition"
            >
              <span>Explore Interactive Demos</span>
            </a>

            <button
              onClick={onOpenPricing}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-purple-950/40 hover:bg-purple-900/40 border border-purple-800/40 text-purple-300 font-semibold text-sm sm:text-base transition"
            >
              <Crown className="w-4 h-4 text-amber-400" />
              <span>Plans from $10/mo</span>
            </button>
          </div>

          {/* Trust Features Bar */}
          <div className="mt-14 pt-8 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <div className="flex items-center gap-2 text-purple-400 text-sm font-semibold mb-1">
                <Zap className="w-4 h-4" />
                <span>25 Free Allowance</span>
              </div>
              <p className="text-xs text-slate-400">Every new user starts with 25 full AI generations.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold mb-1">
                <Mic className="w-4 h-4" />
                <span>Voice Speech-to-Text</span>
              </div>
              <p className="text-xs text-slate-400">Speak naturally with direct microphone dictation.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <div className="flex items-center gap-2 text-cyan-400 text-sm font-semibold mb-1">
                <Layers className="w-4 h-4" />
                <span>9 Dedicated Tools</span>
              </div>
              <p className="text-xs text-slate-400">Homework, resumes, data, translation & business.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold mb-1">
                <Shield className="w-4 h-4" />
                <span>Server-Secured</span>
              </div>
              <p className="text-xs text-slate-400">All logic verified server-side. Zero API keys needed.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Live Demo & Sandbox Section */}
      <section id="demo" className="py-16 sm:py-24 bg-[#0a0f1d] border-y border-slate-800/80 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-xs font-bold text-cyan-400 tracking-wider uppercase bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-800/40">
              Live Sandbox Preview
            </span>
            <h2 className="mt-3 text-2xl sm:text-4xl font-extrabold text-white">
              Experience the 9 AI Engines in Real Time
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-slate-400">
              Select any tool below to see sample prompts, outputs, and jump right into the actual app!
            </p>
          </div>

          {/* Demo Tabs */}
          <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 no-scrollbar">
            {toolsData.map((tool) => {
              const Icon = tool.icon;
              const isActive = activeDemoTab === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => setActiveDemoTab(tool.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]'
                      : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tool.name}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Demo Card */}
          <div className="mt-6 rounded-2xl bg-gradient-to-b from-slate-900 to-[#0c1222] border border-slate-700/80 shadow-2xl p-5 sm:p-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {activeToolData.badge}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    Best for: {activeToolData.audience}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
                  {activeToolData.name}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                  {activeToolData.shortDesc}
                </p>
              </div>

              {/* Direct Open in App Button */}
              <button
                onClick={() => onLaunchApp(activeToolData.id)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm transition shadow-[0_0_15px_rgba(139,92,246,0.3)] shrink-0"
              >
                <span>Open {activeToolData.name} in App</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Prompt & Output simulated split */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left: Input Prompt */}
              <div className="p-4 sm:p-5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-medium">
                  <span className="flex items-center gap-1.5 text-purple-300 font-semibold">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Input Prompt Example
                  </span>
                  <span>Input</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 font-mono bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                  "{activeToolData.promptExample}"
                </p>

                <div className="mt-4 pt-3 border-t border-slate-800/60">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Key Capabilities:
                  </div>
                  <ul className="space-y-1.5">
                    {activeToolData.features.map((feat, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-slate-300">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Right: AI Intelligence Output */}
              <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-b from-purple-950/20 to-slate-950/80 border border-purple-900/40">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-medium">
                  <span className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Testimony AI Generated Output
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40">
                    High Confidence
                  </span>
                </div>
                <div className="text-xs sm:text-sm text-slate-200 whitespace-pre-line leading-relaxed font-sans bg-slate-900/80 p-3.5 rounded-lg border border-purple-800/30">
                  {activeToolData.responsePreview}
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Processed in 0.38s</span>
                  <span className="text-purple-300 font-medium">Counts as 1 of your 25 free messages</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9 Features Grid Section */}
      <section id="features" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-bold text-purple-400 tracking-wider uppercase bg-purple-950/60 px-3 py-1 rounded-full border border-purple-800/40">
            Suite Architecture
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-white">
            Nine Supercharged AI Tools In One Unified App
          </h2>
          <p className="mt-2.5 text-sm sm:text-base text-slate-400">
            No need to juggle multiple subscriptions, accounts, and interfaces. Everything you need is already inside TESTIMONY AI ASSISTANT.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {toolsData.map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.id}
                className="group relative p-6 rounded-2xl bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 hover:border-purple-600/50 transition duration-300 flex flex-col justify-between shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${tool.color} flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-purple-300 bg-purple-950/80 px-2.5 py-1 rounded-full border border-purple-800/40">
                      {tool.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition">
                    {tool.name}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {tool.shortDesc}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-wrap gap-1.5">
                    {tool.features.map((f, i) => (
                      <span key={i} className="text-[10px] bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded-md">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-3">
                  <button
                    onClick={() => onLaunchApp(tool.id)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-purple-600/30 border border-slate-700 hover:border-purple-500/50 text-xs font-semibold text-slate-200 hover:text-white transition"
                  >
                    <span>Launch in App</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works (3 Steps) */}
      <section id="how-it-works" className="py-16 sm:py-20 bg-[#090d19] border-t border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-indigo-400 tracking-wider uppercase bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-800/40">
              Instant Access
            </span>
            <h2 className="mt-3 text-2xl sm:text-4xl font-extrabold text-white">
              Get Started in Three Easy Steps
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              No complicated setups or API keys required. Jump straight into work.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 relative">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold text-lg mb-4">
                1
              </div>
              <h3 className="text-base font-bold text-white">Launch the Assistant</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                Open the app with a single click. Your account is automatically created and credited with 25 free AI messages.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 relative">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-lg mb-4">
                2
              </div>
              <h3 className="text-base font-bold text-white">Pick Any of the 9 Tools</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                Dictate with voice, solve homework, write ATS resumes, translate languages, or analyze data tables in seconds.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 relative">
              <div className="w-10 h-10 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold text-lg mb-4">
                3
              </div>
              <h3 className="text-base font-bold text-white">Upgrade Anytime</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                Enjoy unlimited access for just $10/month or choose our $250/year premium annual plan with zero interruptions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans Section */}
      <section id="pricing" className="py-16 sm:py-24 max-w-6xl mx-auto px-4 sm:px-6 relative">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-bold text-amber-400 tracking-wider uppercase bg-amber-950/60 px-3 py-1 rounded-full border border-amber-800/40">
            Clear &amp; Transparent Pricing
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-white">
            Simple, Honest Plans for Every Ambition
          </h2>
          <p className="mt-2.5 text-sm sm:text-base text-slate-400">
            Start with your 25 free messages, or choose unlimited access for $10/month or $250/year.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Free Starter Card */}
          <div className="rounded-2xl p-6 sm:p-7 bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Starter</div>
              <h3 className="text-xl font-bold text-white">Free Trial</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-extrabold text-white">$0</span>
                <span className="text-xs text-slate-400 font-medium">/ 25 messages</span>
              </div>
              <p className="mt-3 text-xs text-slate-400">
                Ideal for testing out all 9 tools and trying voice chat with no upfront commitment.
              </p>

              <div className="mt-6 pt-5 border-t border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>25 free AI chat &amp; tool messages</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Access to all 9 specialized tools</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Voice speech-to-text input</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Conversation history retained</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onLaunchApp('chat')}
              className="mt-8 w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs sm:text-sm border border-slate-700 transition"
            >
              Start Free (25 Messages)
            </button>
          </div>

          {/* Monthly Plan ($10 / month) */}
          <div className="rounded-2xl p-6 sm:p-7 bg-gradient-to-b from-purple-950/40 via-slate-900 to-slate-900 border border-purple-700/60 flex flex-col justify-between relative shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">Most Flexible</span>
                <span className="text-[10px] font-bold text-purple-200 bg-purple-600/40 px-2 py-0.5 rounded-full border border-purple-500/40">
                  POPULAR
                </span>
              </div>
              <h3 className="text-xl font-bold text-white">Monthly Subscription</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-extrabold text-white">$10</span>
                <span className="text-xs text-purple-300 font-medium">/ month</span>
              </div>
              <p className="mt-3 text-xs text-slate-400">
                Full unlimited power for students, professionals, and creators on a month-to-month basis.
              </p>

              <div className="mt-6 pt-5 border-t border-purple-900/40 space-y-2.5">
                <div className="flex items-center gap-2 text-xs text-slate-200">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold">Unlimited AI messages &amp; generations</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-200">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Unlimited voice chat &amp; responses</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-200">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>High-priority server processing</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-200">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>PDF &amp; CSV report exports</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-200">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Cancel anytime with 1 click</span>
                </div>
              </div>
            </div>

            <button
              onClick={onOpenPricing}
              className="mt-8 w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(139,92,246,0.4)] transition"
            >
              Subscribe Now ($10 / month)
            </button>
          </div>

          {/* Yearly Plan ($250 / year) */}
          <div className="rounded-2xl p-6 sm:p-7 bg-gradient-to-b from-[#151c33] via-slate-900 to-slate-900 border-2 border-cyan-500/60 flex flex-col justify-between relative shadow-[0_0_30px_rgba(6,182,212,0.15)]">
            {/* Top Badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 text-white text-[11px] font-extrabold uppercase tracking-wider shadow-md">
              ★ Premium Annual Option
            </div>

            <div>
              <div className="flex items-center justify-between mb-1 mt-1">
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Maximum Value</span>
                <span className="text-[10px] font-bold text-cyan-200 bg-cyan-950/90 px-2 py-0.5 rounded-full border border-cyan-700/60">
                  VIP TIER
                </span>
              </div>
              <h3 className="text-xl font-bold text-white">Yearly Subscription</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-extrabold text-white">$250</span>
                <span className="text-xs text-cyan-300 font-medium">/ year</span>
              </div>
              <p className="mt-3 text-xs text-slate-400">
                The ultimate uninterrupted experience. Full year access with highest priority compute.
              </p>

              <div className="mt-6 pt-5 border-t border-cyan-900/40 space-y-2.5">
                <div className="flex items-center gap-2 text-xs text-slate-200">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="font-semibold">Unlimited 365-day access to all 9 tools</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-200">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="font-semibold">Highest priority compute cluster</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-200">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Zero throttling during peak hours</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-200">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Early access to new AI models &amp; tools</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-200">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Direct VIP support via email</span>
                </div>
              </div>
            </div>

            <button
              onClick={onOpenPricing}
              className="mt-8 w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm shadow-[0_0_25px_rgba(6,182,212,0.35)] transition"
            >
              Subscribe Now ($250 / year)
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials & Wall of Love */}
      <section id="testimonials" className="py-16 sm:py-20 bg-[#090e1c] border-t border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-purple-400 tracking-wider uppercase bg-purple-950/60 px-3 py-1 rounded-full border border-purple-800/40">
              User Experiences
            </span>
            <h2 className="mt-3 text-2xl sm:text-4xl font-extrabold text-white">
              Loved by Students, Job Seekers &amp; Founders
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              See what people are achieving with TESTIMONY AI ASSISTANT every single day.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed">
                  "The Assignment Solver and Math Solver saved my semester. It doesn't just hand you an answer—it explains the theoretical steps so I actually understand it for my exams."
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-600/30 border border-purple-500/40 text-purple-300 flex items-center justify-center font-bold text-xs">
                  DA
                </div>
                <div>
                  <div className="text-xs font-bold text-white">David Adeleke</div>
                  <div className="text-[10px] text-slate-400">Engineering Undergraduate</div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed">
                  "The CV &amp; Resume Builder is phenomenal. I entered my experience and it formatted a clean, ATS-compliant PDF with quantified achievements. Landed 3 interviews within a fortnight!"
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-bold text-xs">
                  CN
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Chioma N.</div>
                  <div className="text-[10px] text-slate-400">Product Manager</div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed">
                  "Being able to translate between English and Yoruba with cultural context, plus analyzing sales CSVs directly, replaces three separate tools for my agency. The $10/mo plan is a steal."
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 flex items-center justify-center font-bold text-xs">
                  TB
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Tariq B.</div>
                  <div className="text-[10px] text-slate-400">Agency Director</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Founder & Vision */}
      <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="p-8 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-800/40 flex flex-col sm:flex-row items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-cyan-400 flex items-center justify-center text-white shrink-0 shadow-lg">
            <Cpu className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">Vision &amp; Mission</span>
            <h3 className="text-xl font-bold text-white mt-1">Built with Purpose by Testimony Bassey</h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
              TESTIMONY AI ASSISTANT was engineered to democratize elite cognitive and productivity capabilities for learners, job seekers, and entrepreneurs around the world. We believe powerful AI should be accessible, lightning-fast, and intuitively designed.
            </p>
            <div className="mt-3 flex items-center gap-3 text-xs text-purple-300 font-semibold">
              <Mail className="w-3.5 h-3.5" />
              <span>Contact: testimonybassey18@gmail.com</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" className="py-16 sm:py-20 bg-[#080c17] border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-bold text-cyan-400 tracking-wider uppercase bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-800/40">
              Frequently Asked Questions
            </span>
            <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold text-white">
              Got Questions? We Have Answers.
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl bg-slate-900/60 border border-slate-800 overflow-hidden transition"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 text-xs sm:text-sm font-semibold text-white hover:text-purple-300 transition"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-purple-400' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom High-Impact CTA */}
      <section className="py-16 sm:py-24 relative overflow-hidden text-center">
        <div className="absolute inset-0 bg-radial from-purple-600/15 via-transparent to-transparent opacity-80 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Ready to Supercharge Your Day?
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
            Get instant access to all 9 tools with 25 free messages. No credit card required. Experience TESTIMONY AI ASSISTANT right now.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onLaunchApp('chat')}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-sm sm:text-base shadow-[0_0_25px_rgba(139,92,246,0.5)] transition"
            >
              <span>Launch App Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenPricing}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-sm transition"
            >
              View Pricing ($10/mo &amp; $250/yr)
            </button>
          </div>
        </div>
      </section>

      {/* Website Footer */}
      <footer className="border-t border-slate-800/80 bg-[#060911] py-12 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start">
            <Logo size="md" showTagline={true} />
            <p className="mt-2 text-xs text-slate-400 text-center md:text-left">
              The premier all-in-one AI intelligence system for learning, career, and enterprise.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
            <button onClick={() => onLaunchApp('chat')} className="hover:text-white transition">AI Chat</button>
            <button onClick={() => onLaunchApp('assignment')} className="hover:text-white transition">Assignment Solver</button>
            <button onClick={() => onLaunchApp('cv_builder')} className="hover:text-white transition">CV Builder</button>
            <button onClick={() => onLaunchApp('translator')} className="hover:text-white transition">Translator</button>
            <button onClick={() => onLaunchApp('data_analyst')} className="hover:text-white transition">Data Analyst</button>
            <button onClick={onOpenPricing} className="text-purple-300 hover:text-white transition">Pricing</button>
            <a href="mailto:testimonybassey18@gmail.com" className="hover:text-white transition">Support</a>
          </div>

          <div className="text-xs text-slate-400 text-center md:text-right">
            <div>© {new Date().getFullYear()} TESTIMONY AI ASSISTANT. All rights reserved.</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Secure Cloud Architecture • Powered by Gemini</div>
          </div>
        </div>
      </footer>
    </div>
  );
};
