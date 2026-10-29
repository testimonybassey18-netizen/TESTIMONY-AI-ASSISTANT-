import React, { useState } from 'react';
import {
  Sparkles,
  Crown,
  Lock,
  ArrowRight,
  LogIn,
  RotateCcw,
  CheckCircle,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';
import { unlockOwnerPass } from '../services/geminiService';

interface FreeLimitExpiredModalProps {
  isOpen: boolean;
  onUpgradeMyPlan: () => void;
  onViewSubscriptionPlans: () => void;
  onSignIn: () => void;
  onReturnToMyConversations: () => void;
}

export const FreeLimitExpiredModal: React.FC<FreeLimitExpiredModalProps> = ({
  isOpen,
  onUpgradeMyPlan,
  onViewSubscriptionPlans,
  onSignIn,
  onReturnToMyConversations,
}) => {
  const [ownerPassword, setOwnerPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [ownerSuccess, setOwnerSuccess] = useState<string | null>(null);
  const [ownerError, setOwnerError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleOwnerUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerPassword.trim()) {
      setOwnerError('Please enter owner password.');
      return;
    }

    setIsUnlocking(true);
    setOwnerError(null);
    try {
      await unlockOwnerPass(ownerPassword.trim());
      setOwnerSuccess('Owner Verified! 100% Free Lifetime VIP Pass activated.');
      setTimeout(() => {
        onReturnToMyConversations();
      }, 1500);
    } catch (err: any) {
      setOwnerError(err.message || 'Incorrect owner password.');
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-purple-500/50 rounded-3xl shadow-[0_0_60px_rgba(147,51,234,0.3)] p-6 sm:p-8 text-slate-100 overflow-y-auto max-h-[92vh]">
        {/* Glow badge */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-0.5 shadow-xl">
            <div className="w-full h-full bg-[#0b0f19] rounded-[14px] flex items-center justify-center text-purple-400">
              <Lock className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Heading and Subheading */}
        <div className="text-center space-y-2 mb-5">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Your Free Messages Have Ended!
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            You have used all 25 of your free AI messages. Subscribe to TESTIMONY AI ASSISTANT to continue enjoying your AI assistant.
          </p>
        </div>

        {/* Pricing Peek: $5 Weekly, $10 Monthly, $250 Yearly */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs mb-5">
          <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-800/40">
            <div className="font-semibold text-white">Weekly Plan</div>
            <div className="text-sm font-extrabold text-indigo-300 mt-0.5">$5 / week</div>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/40">
            <div className="font-semibold text-white">Monthly Plan</div>
            <div className="text-sm font-extrabold text-purple-300 mt-0.5">$10 / month</div>
          </div>
          <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-800/40">
            <div className="font-semibold text-white">Yearly Plan</div>
            <div className="text-sm font-extrabold text-cyan-300 mt-0.5">$250 / year</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 mb-5">
          {/* Button 1: Upgrade My Plan */}
          <button
            type="button"
            onClick={onUpgradeMyPlan}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 shadow-[0_0_20px_rgba(147,51,234,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Crown className="w-4 h-4 text-amber-300" />
            <span>Upgrade My Plan ($5/wk · $10/mo · $250/yr)</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Button 2: View Subscription Plans */}
          <button
            type="button"
            onClick={onViewSubscriptionPlans}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm text-purple-200 bg-purple-950/60 hover:bg-purple-900/60 border border-purple-700/60 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>View Subscription Plans</span>
          </button>

          {/* Button 3 & 4 Grid: Sign In / Switch Account & Return */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={onSignIn}
              className="py-2.5 px-3 rounded-xl font-medium text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-cyan-400" />
              <span>Switch Account</span>
            </button>

            <button
              type="button"
              onClick={onReturnToMyConversations}
              className="py-2.5 px-3 rounded-xl font-medium text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Past Chats</span>
            </button>
          </div>
        </div>

        {/* Owner 100% Free Pass Section */}
        <div className="pt-4 border-t border-slate-800">
          <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 mb-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Are you the owner? Unlock 100% Free Lifetime VIP</span>
            </div>
            <form onSubmit={handleOwnerUnlock} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  placeholder="Owner password (ravenBLAKE@2008)..."
                  className="w-full bg-slate-900 border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 pr-8"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <button
                type="submit"
                disabled={isUnlocking || !ownerPassword.trim()}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition disabled:opacity-50 cursor-pointer"
              >
                {isUnlocking ? '...' : 'Unlock Free'}
              </button>
            </form>
            {ownerSuccess && (
              <p className="text-[11px] text-emerald-400 mt-1.5 font-medium">{ownerSuccess}</p>
            )}
            {ownerError && (
              <p className="text-[11px] text-rose-400 mt-1.5 font-medium">{ownerError}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
