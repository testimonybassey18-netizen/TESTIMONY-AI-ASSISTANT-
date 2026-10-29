import React from 'react';
import { Menu, Crown, Sun, Moon, Sparkles, Globe, Radio, KeyRound } from 'lucide-react';
import { ActiveTool, SubscriptionState } from '../types';
import { Logo } from './Logo';

interface HeaderProps {
  onToggleSidebar: () => void;
  activeTool: ActiveTool;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenSubscriptionModal: () => void;
  subscription: SubscriptionState;
  freeMessagesRemaining: number;
  onGoToWebsite?: () => void;
  onNavigateLiveChat?: () => void;
  onOpenFreeAccessModal?: () => void;
  onExitFreePlan?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  activeTool,
  theme,
  onToggleTheme,
  onOpenSubscriptionModal,
  subscription,
  freeMessagesRemaining,
  onGoToWebsite,
  onNavigateLiveChat,
  onOpenFreeAccessModal,
  onExitFreePlan,
}) => {
  const toolTitles: Record<ActiveTool, string> = {
    chat: 'AI Chat Assistant',
    live_chat: 'Live Chat (Instant Voice)',
    job_scanner: 'Market Intelligence & Job Radar',
    assignment: 'AI Assignment Solver',
    cv_builder: 'AI CV & Resume Builder',
    translator: 'AI Multilingual Translator',
    data_analyst: 'AI Data Analyst',
    writing: 'AI Writing Assistant',
    math: 'AI Math Solver',
    document: 'AI Document Assistant',
    business: 'AI Business Assistant',
    settings: 'Settings & Preferences',
  };

  const isOwner = subscription.isOwner || subscription.plan === 'owner_vip';
  const isPro = (subscription.isActive && subscription.plan !== 'free') || isOwner;

  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile hamburger & logo/title */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 lg:hidden transition cursor-pointer"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex lg:hidden">
          <Logo
            size="sm"
            onSecretLogoClick={onOpenFreeAccessModal}
            isOwnerFreeActive={isOwner}
            onExitFreePlan={onExitFreePlan}
          />
        </div>

        <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-800 ml-2">
          <span className="text-xs font-semibold text-purple-300 bg-purple-950/60 px-2.5 py-1 rounded-full border border-purple-800/40">
            {toolTitles[activeTool]}
          </span>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* LIVE CHAT BUTTON */}
        {onNavigateLiveChat && (
          <button
            onClick={onNavigateLiveChat}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition shadow-md cursor-pointer ${
              activeTool === 'live_chat'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                : 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/70 hover:border-emerald-400'
            }`}
            title="Start real-time 1-on-1 discussion"
          >
            <div className="relative flex items-center justify-center">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <span className="font-extrabold">Live Chat</span>
          </button>
        )}

        {/* Allowance Counter Badge / Owner Badge */}
        {isOwner ? (
          <div className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold shadow-[0_0_12px_rgba(245,158,11,0.2)]">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>OWNER VIP (FREE)</span>
          </div>
        ) : isPro ? (
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>Unlimited Pro</span>
          </div>
        ) : (
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-purple-300 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            <span>{freeMessagesRemaining} of 25 free left</span>
          </div>
        )}

        {/* Subscription status or Upgrade Button */}
        {isOwner ? (
          <button
            onClick={onOpenSubscriptionModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:border-amber-400 text-xs font-bold transition shadow-[0_0_15px_rgba(245,158,11,0.15)] cursor-pointer"
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">OWNER VIP</span>
            <span className="sm:hidden">VIP</span>
          </button>
        ) : isPro ? (
          <button
            onClick={onOpenSubscriptionModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-amber-500/40 text-amber-300 hover:border-amber-400 text-xs font-bold transition shadow-[0_0_15px_rgba(245,158,11,0.15)] cursor-pointer"
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>PRO ACTIVE</span>
          </button>
        ) : (
          <button
            onClick={onOpenSubscriptionModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(139,92,246,0.3)] transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span className="hidden sm:inline">Upgrade Plan</span>
            <span className="text-[10px] opacity-90 hidden md:inline">($5/wk · $10/mo)</span>
            <span className="sm:hidden">Upgrade</span>
          </button>
        )}

        {/* Website Link button */}
        {onGoToWebsite && (
          <button
            onClick={onGoToWebsite}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer"
            title="Visit Product Website"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Website</span>
          </button>
        )}

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white transition cursor-pointer"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
        </button>
      </div>
    </header>
  );
};
