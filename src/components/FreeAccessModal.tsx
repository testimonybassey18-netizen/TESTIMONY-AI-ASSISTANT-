import React, { useState } from 'react';
import {
  X,
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  Crown,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  Radio,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { unlockOwnerPass } from '../services/geminiService';

interface FreeAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  isUnlocked: boolean;
  onUnlockedSuccess: () => void;
  onNavigateToLiveChat?: () => void;
  onNavigateToChat?: () => void;
  onExitFreePlan?: () => void;
}

export const FreeAccessModal: React.FC<FreeAccessModalProps> = ({
  isOpen,
  onClose,
  isUnlocked,
  onUnlockedSuccess,
  onNavigateToLiveChat,
  onNavigateToChat,
  onExitFreePlan,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMessage('Please enter the security password.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Strict validation against master owner password ravenBLAKE@2008
    if (password.trim() !== 'ravenBLAKE@2008') {
      setIsVerifying(false);
      setErrorMessage('Access Denied: Incorrect password. No one can access the 100% free platform without the master owner key.');
      return;
    }

    try {
      await unlockOwnerPass(password.trim());
      setSuccessMessage('Access Granted! 100% Free Lifetime VIP Platform unlocked.');
      onUnlockedSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLockPlatform = () => {
    if (onExitFreePlan) {
      onExitFreePlan();
    } else {
      try {
        localStorage.removeItem('testimony_owner_unlocked');
        window.location.reload();
      } catch (e) {}
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-3xl shadow-[0_0_60px_rgba(245,158,11,0.25)] p-6 sm:p-8 text-slate-100 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {isUnlocked ? (
          /* UNLOCKED DASHBOARD */
          <div className="text-center space-y-5">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.4)]">
              <Crown className="w-8 h-8" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold mb-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>100% FREE OWNER ACCESS ACTIVE</span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Welcome, Testimony Bassey!
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-sm mx-auto leading-relaxed">
                You have permanent, 100% free lifetime access to the entire platform. No payments, no limits, and no message counters.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-left text-xs">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="text-slate-400 text-[11px]">Free Usage Status</div>
                <div className="font-extrabold text-amber-300 mt-0.5 text-sm">∞ Unlimited Free</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="text-slate-400 text-[11px]">Live Voice Chat</div>
                <div className="font-extrabold text-emerald-400 mt-0.5 text-sm">Male &amp; Female Free</div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              {onNavigateToLiveChat && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToLiveChat();
                  }}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Radio className="w-4 h-4 text-white" />
                  <span>Enter Free Live 1-on-1 Chat</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {onNavigateToChat && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToChat();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-purple-600 hover:bg-purple-500 text-white shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Enter Free AI Chat Assistant</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleLockPlatform}
                className="w-full py-2 rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition cursor-pointer"
              >
                Lock Free Platform (Re-require Password)
              </button>
            </div>
          </div>
        ) : (
          /* LOCKED GATE: PASSWORD REQUIRED */
          <div>
            <div className="text-center space-y-2 mb-6">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                <KeyRound className="w-7 h-7" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                100% Free Platform Access
              </h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                This 100% free platform is password-protected. Enter the master owner password to bypass all payment and unlock unlimited free usage.
              </p>
            </div>

            <form onSubmit={handleVerifyPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Enter Master Password</span>
                  <span className="text-[10px] text-amber-400">Owner Access Only</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter owner key to unlock..."
                    className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition pr-10"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-start gap-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/60 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isVerifying || !password.trim()}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isVerifying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950/40 border-t-slate-950 rounded-full animate-spin" />
                    <span>Verifying Master Key...</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>Verify &amp; Enter 100% Free Platform</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 pt-3 border-t border-slate-800 text-center">
              <p className="text-[11px] text-slate-500">
                Unauthorized users will be redirected to the standard payment plan.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
