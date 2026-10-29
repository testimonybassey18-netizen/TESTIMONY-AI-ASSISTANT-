import React, { useState } from 'react';
import {
  Settings,
  Moon,
  Sun,
  Crown,
  Trash2,
  ShieldCheck,
  Sparkles,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { UserPreferences } from '../types';

interface SettingsViewProps {
  preferences: UserPreferences;
  onUpdatePreferences: (updated: Partial<UserPreferences>) => void;
  onClearAllChats: () => void;
  onOpenSubscriptionModal: () => void;
  freeMessagesRemaining: number;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  preferences,
  onUpdatePreferences,
  onClearAllChats,
  onOpenSubscriptionModal,
  freeMessagesRemaining,
}) => {
  const [clearedNotice, setClearedNotice] = useState(false);

  const handleClearChats = () => {
    if (window.confirm('Are you sure you want to delete all conversation history? This cannot be undone.')) {
      onClearAllChats();
      setClearedNotice(true);
      setTimeout(() => setClearedNotice(false), 2000);
    }
  };

  const isPro = preferences.subscription.isActive && preferences.subscription.plan !== 'free';

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-4xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
          <Settings className="w-4 h-4" />
          <span>System &amp; Experience Preferences</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
          Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Manage your subscription plans, appearance theme, free message allowance, and privacy controls.
        </p>
      </div>

      {/* Subscription Paywall & Membership Section */}
      <div className="bg-gradient-to-br from-purple-950/40 via-slate-900 to-indigo-950/30 border border-purple-500/40 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-400">
              <Crown className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>TESTIMONY AI ASSISTANT Membership</span>
                {isPro ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    PRO ACTIVE ({preferences.subscription.plan.toUpperCase()})
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800">
                    {freeMessagesRemaining} of 25 Free Messages Left
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Monthly Plan: $10 / month • Yearly Plan: $250 / year
              </p>
            </div>
          </div>

          <button
            onClick={onOpenSubscriptionModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 fill-white" />
            <span>
              {isPro ? 'Manage Plan' : 'Upgrade My Plan'}
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
          <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="font-bold text-white mb-1 flex items-center justify-between">
                <span>Monthly Subscription</span>
                <span className="text-purple-400 font-extrabold">$10 / month</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Unlimited AI messages, voice chat, homework &amp; exam solutions, and ATS CV downloads.
              </p>
            </div>
            <button
              onClick={onOpenSubscriptionModal}
              className="mt-3 text-xs font-semibold text-purple-400 hover:text-purple-300 underline underline-offset-4 text-left"
            >
              Select Monthly Plan →
            </button>
          </div>

          <div className="p-3.5 bg-slate-950/70 rounded-xl border border-cyan-800/60 flex flex-col justify-between">
            <div>
              <div className="font-bold text-cyan-300 mb-1 flex items-center justify-between">
                <span>Yearly Subscription</span>
                <span className="text-cyan-400 font-extrabold">$250 / year</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Premium Annual Option: Full-year priority processing speed, deep data analysis, and venture strategy.
              </p>
            </div>
            <button
              onClick={onOpenSubscriptionModal}
              className="mt-3 text-xs font-semibold text-cyan-400 hover:text-cyan-300 underline underline-offset-4 text-left"
            >
              Select Premium Yearly Plan →
            </button>
          </div>
        </div>
      </div>

      {/* Appearance & Interface */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-white border-b border-slate-800 pb-2">
          Interface &amp; Display
        </h2>

        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-white text-xs sm:text-sm">Color Theme</div>
            <div className="text-xs text-slate-400">Choose between dark aesthetic and light mode</div>
          </div>
          <div className="inline-flex rounded-xl bg-slate-950 border border-slate-800 p-0.5 text-xs">
            <button
              onClick={() => onUpdatePreferences({ theme: 'dark' })}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition ${
                preferences.theme === 'dark' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Dark (Default)</span>
            </button>
            <button
              onClick={() => onUpdatePreferences({ theme: 'light' })}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition ${
                preferences.theme === 'light' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Light</span>
            </button>
          </div>
        </div>
      </div>

      {/* AI Engine Status Card (Fully Configured Server-Side) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Google Gemini AI Engine</span>
            </h2>
            <p className="text-xs text-slate-400">
              Powered by Google AI Studio official runtime models.
            </p>
          </div>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Configured &amp; Active</span>
          </span>
        </div>

        <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80 text-xs text-slate-300 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Integration:</span>
            <span className="font-semibold text-white">Google AI Studio Server-Side Secrets</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Active Architecture:</span>
            <span className="font-mono text-purple-300">Gemini 3.1 Flash Lite + Gemini 3.8 Flash</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Status:</span>
            <span className="text-emerald-400 font-medium">Automatic Authentication (No manual key needed)</span>
          </div>
        </div>
      </div>

      {/* Privacy & History Management */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Privacy &amp; Data Control</span>
        </h2>

        <p className="text-xs text-slate-400 leading-relaxed">
          Testimony AI respects your privacy. Conversations and CV contents are stored exclusively on your device in local browser storage. We do not sell your personal data or track your assignments.
        </p>

        <div className="pt-2 flex items-center justify-between border-t border-slate-800">
          <div>
            <div className="font-semibold text-white text-xs sm:text-sm">Clear Conversation History</div>
            <div className="text-[11px] text-slate-500">Remove all stored chats and questions</div>
          </div>
          <button
            onClick={handleClearChats}
            className="px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-950/70 text-rose-300 border border-rose-800/60 text-xs font-semibold transition flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All Chats</span>
          </button>
        </div>

        {clearedNotice && (
          <p className="text-xs text-emerald-400">All conversations have been erased.</p>
        )}
      </div>
    </div>
  );
};
