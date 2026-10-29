import React, { useState } from 'react';
import { X, LogIn, CheckCircle2, ShieldCheck, ArrowRight, User } from 'lucide-react';
import { getUserId, setUserId, getUserStatus } from '../services/geminiService';
import { UserStatus } from '../types';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignedIn: (status: UserStatus) => void;
}

export const SignInModal: React.FC<SignInModalProps> = ({
  isOpen,
  onClose,
  onSignedIn,
}) => {
  const [accountId, setAccountId] = useState(() => getUserId());
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId.trim() || isLoading) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const cleanId = accountId.trim().toLowerCase();
      setUserId(cleanId);
      const status = await getUserStatus();

      setMessage({
        type: 'success',
        text: `Successfully signed in as ${cleanId}. ${
          status.isSubscribed
            ? `Active subscription found (${status.subscriptionPlan.toUpperCase()}).`
            : `${status.freeMessagesRemaining} of 25 free messages available.`
        }`,
      });

      setTimeout(() => {
        onSignedIn(status);
        onClose();
      }, 1200);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.message || 'Could not verify account status. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-purple-500/40 rounded-3xl shadow-[0_0_50px_rgba(139,92,246,0.25)] p-6 sm:p-7 text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-400">
            <LogIn className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Sign In to Your Account</h3>
            <p className="text-xs text-slate-400">Restore your subscription &amp; message balance</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 mb-4 leading-relaxed">
          Enter your account email or account ID below. Your conversation history on this device is safe and will not be erased.
        </p>

        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Account Email or User ID
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="e.g. yourname@example.com"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {message && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                message.type === 'success'
                  ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/60 border border-rose-800 text-rose-300'
              }`}
            >
              {message.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}

          <div className="pt-2 flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !accountId.trim()}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white text-xs font-bold shadow-md transition disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isLoading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Server-verified account and message allowance</span>
        </div>
      </div>
    </div>
  );
};
