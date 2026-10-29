import React, { useState } from 'react';
import {
  X,
  Check,
  Crown,
  Zap,
  Sparkles,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  Lock,
  ArrowRight,
  KeyRound,
  Eye,
  EyeOff,
  Star,
  CheckCircle,
} from 'lucide-react';
import { SubscriptionPlan, SubscriptionState } from '../types';
import { unlockOwnerPass } from '../services/geminiService';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: SubscriptionState;
  onUpgrade: (plan: 'weekly' | 'monthly' | 'yearly') => Promise<void>;
  onCancelSubscription: () => Promise<void>;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  subscription,
  onUpgrade,
  onCancelSubscription,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Owner VIP Secret Pass State
  const [ownerPassword, setOwnerPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUnlockingOwner, setIsUnlockingOwner] = useState(false);
  const [ownerSuccessMessage, setOwnerSuccessMessage] = useState<string | null>(null);
  const [ownerErrorMessage, setOwnerErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isOwnerActive = subscription.isOwner || subscription.plan === 'owner_vip';

  const handleCheckout = async (planToCheckout?: 'weekly' | 'monthly' | 'yearly') => {
    const plan = planToCheckout || selectedPlan;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      await onUpgrade(plan);
      setPaymentSuccess(true);
      setTimeout(() => {
        setPaymentSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment verification failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnlockOwnerPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerPassword.trim()) {
      setOwnerErrorMessage('Please type the owner password.');
      return;
    }

    setIsUnlockingOwner(true);
    setOwnerErrorMessage(null);
    setOwnerSuccessMessage(null);

    try {
      const res = await unlockOwnerPass(ownerPassword.trim());
      setOwnerSuccessMessage('Owner VIP Verified! 100% Free Lifetime Pass activated.');
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      setOwnerErrorMessage(err.message || 'Incorrect owner password. This pass is reserved exclusively for the owner.');
    } finally {
      setIsUnlockingOwner(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-purple-500/40 rounded-3xl shadow-[0_0_50px_rgba(139,92,246,0.25)] p-5 sm:p-7 text-slate-100 overflow-y-auto max-h-[94vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          aria-label="Close subscription plans"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center max-w-lg mx-auto mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/40 text-purple-300 text-xs font-semibold mb-2.5">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>TESTIMONY AI ASSISTANT PRO</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Subscription Plans &amp; Pricing
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Choose your flexible plan. 100% free owner VIP bypass available for the creator.
          </p>
        </div>

        {/* If user is currently subscribed / owner active */}
        {subscription.isActive && subscription.plan !== 'free' ? (
          <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-950/60 to-slate-900 border border-purple-600/40 text-center space-y-4 mb-6">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-block px-3 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold mb-1">
                {isOwnerActive
                  ? '👑 OWNER 100% FREE LIFETIME VIP ACTIVE'
                  : subscription.plan === 'weekly'
                  ? 'WEEKLY PLAN ACTIVE ($5/WK)'
                  : subscription.plan === 'yearly'
                  ? 'YEARLY PLAN ACTIVE ($250/YR)'
                  : 'MONTHLY PLAN ACTIVE ($10/MO)'}
              </div>
              <h3 className="text-lg font-bold text-white mt-1">
                {isOwnerActive
                  ? 'Welcome Owner! You have permanent unlimited free access.'
                  : 'Your subscription is verified and active.'}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                {isOwnerActive
                  ? 'As the owner, all AI capabilities, voice notes, live chat, solving, and documents are 100% free with no expiration.'
                  : 'Enjoy unlimited AI messages, continuous microphone audio notes, studio male voice, assignments, CV builder, and live chat.'}
              </p>
              {subscription.expiryDate && !isOwnerActive && (
                <p className="text-xs text-purple-300 font-mono mt-2">
                  Active until: {new Date(subscription.expiryDate).toLocaleDateString()}
                </p>
              )}
            </div>

            <div className="pt-2 flex flex-wrap justify-center gap-3">
              {!isOwnerActive && (
                <button
                  type="button"
                  onClick={onCancelSubscription}
                  className="px-4 py-2 text-xs text-rose-400 hover:text-rose-300 bg-rose-950/30 hover:bg-rose-950/50 border border-rose-800/40 rounded-xl transition cursor-pointer"
                >
                  Cancel Subscription
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl transition cursor-pointer shadow-md"
              >
                Return to App
              </button>
            </div>
          </div>
        ) : null}

        {/* Regular Subscription Plans for users */}
        {(!subscription.isActive || subscription.plan === 'free') && (
          <>
            {/* 3 Plans Grid: $5/wk, $10/mo, $250/yr */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-6">
              {/* PLAN 1: $5 Weekly Plan */}
              <div
                onClick={() => setSelectedPlan('weekly')}
                className={`relative cursor-pointer rounded-2xl p-4 sm:p-5 border transition-all flex flex-col justify-between ${
                  selectedPlan === 'weekly'
                    ? 'bg-gradient-to-b from-indigo-900/50 to-slate-900 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.25)] ring-1 ring-indigo-400/50'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                      Weekly Plan
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-700">
                      Flexible
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1 my-2">
                    <span className="text-3xl font-black text-white">$5</span>
                    <span className="text-xs text-slate-400">/ week</span>
                  </div>

                  <p className="text-xs text-slate-400 mb-3">
                    Fast, affordable 7-day access. Perfect for urgent assignments, homework, and quick tasks.
                  </p>

                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>Unlimited Chat &amp; Voice notes</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>Live 1-on-1 Male Voice chat</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>Assignment &amp; Math solver</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>ATS Resume builder</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCheckout('weekly');
                    }}
                    disabled={isProcessing}
                    className="w-full py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Choose $5 / week</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* PLAN 2: $10 Monthly Plan */}
              <div
                onClick={() => setSelectedPlan('monthly')}
                className={`relative cursor-pointer rounded-2xl p-4 sm:p-5 border transition-all flex flex-col justify-between ${
                  selectedPlan === 'monthly'
                    ? 'bg-gradient-to-b from-purple-900/50 to-slate-900 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.3)] ring-1 ring-purple-400/50'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                      Monthly Plan
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-700">
                      ★ Popular
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1 my-2">
                    <span className="text-3xl font-black text-white">$10</span>
                    <span className="text-xs text-slate-400">/ month</span>
                  </div>

                  <p className="text-xs text-slate-400 mb-3">
                    Full 30 days of high-performance intelligence for students, jobseekers, and professionals.
                  </p>

                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>Everything in Weekly plan</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>30 days continuous access</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>20+ Language translator</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>Long-term human chat memory</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCheckout('monthly');
                    }}
                    disabled={isProcessing}
                    className="w-full py-2.5 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-500 text-white shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Choose $10 / mo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* PLAN 3: $250 Yearly Plan */}
              <div
                onClick={() => setSelectedPlan('yearly')}
                className={`relative cursor-pointer rounded-2xl p-4 sm:p-5 border transition-all flex flex-col justify-between ${
                  selectedPlan === 'yearly'
                    ? 'bg-gradient-to-b from-cyan-900/50 to-slate-900 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/50'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                      Yearly Plan
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-700">
                      VIP Annual
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1 my-2">
                    <span className="text-3xl font-black text-white">$250</span>
                    <span className="text-xs text-slate-400">/ year</span>
                  </div>

                  <p className="text-xs text-slate-400 mb-3">
                    A full year of uninterrupted priority intelligence, business strategy, and CSV data analyst.
                  </p>

                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Full 365 days coverage</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Priority ultra-fast response</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>CSV Data tables &amp; charts</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Full Business pitch builder</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCheckout('yearly');
                    }}
                    disabled={isProcessing}
                    className="w-full py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Choose $250 / yr</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Error notice if payment verification failed */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                {errorMessage}
              </div>
            )}

            {/* Secure Checkout Strip */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 mb-6">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-medium text-slate-300">
                  <CreditCard className="w-4 h-4 text-purple-400" />
                  Secure Verified Checkout for Users
                </span>
                <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                  <Lock className="w-3 h-3" /> 256-bit encrypted
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <div className="text-xs text-slate-300">
                  Selected Plan:{' '}
                  <strong className="text-white">
                    {selectedPlan === 'weekly'
                      ? '$5 / week (Weekly Plan)'
                      : selectedPlan === 'yearly'
                      ? '$250 / year (Yearly Plan)'
                      : '$10 / month (Monthly Plan)'}
                  </strong>
                </div>

                <button
                  type="button"
                  disabled={isProcessing || paymentSuccess}
                  onClick={() => handleCheckout(selectedPlan)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 shadow-[0_0_20px_rgba(147,51,234,0.35)] transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Activating Plan...</span>
                    </>
                  ) : paymentSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <span>Subscription Activated!</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-white" />
                      <span>
                        Subscribe for{' '}
                        {selectedPlan === 'weekly'
                          ? '$5 / week'
                          : selectedPlan === 'yearly'
                          ? '$250 / year'
                          : '$10 / month'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {/* OWNER EXCLUSIVE 100% FREE VIP UNLOCK SECTION */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-950/30 via-slate-950 to-purple-950/30 border border-amber-500/40 relative overflow-hidden">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Crown className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Owner &amp; Creator Access (100% Free)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-semibold">
                    Owner Password Required
                  </span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Exclusive 100% free pass for the owner. Payment plans apply to all other users.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleUnlockOwnerPass} className="mt-3 space-y-2.5">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  placeholder="Enter owner password (e.g. ravenBLAKE@2008)..."
                  className="w-full bg-slate-900/90 border border-amber-500/30 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={isUnlockingOwner || !ownerPassword.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs transition shadow-[0_0_15px_rgba(245,158,11,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                {isUnlockingOwner ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-950/40 border-t-slate-950 rounded-full animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Unlock 100% Free Pass</span>
                  </>
                )}
              </button>
            </div>

            {ownerSuccessMessage && (
              <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{ownerSuccessMessage}</span>
              </div>
            )}

            {ownerErrorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs">
                {ownerErrorMessage}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
