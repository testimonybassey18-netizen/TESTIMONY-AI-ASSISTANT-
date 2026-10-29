import React, { useState } from 'react';
import { Crown, LogOut, KeyRound } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  onSecretLogoClick?: () => void;
  isOwnerFreeActive?: boolean;
  onExitFreePlan?: () => void;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showTagline = false,
  onSecretLogoClick,
  isOwnerFreeActive = false,
  onExitFreePlan,
}) => {
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-13 h-13',
  };

  const textSizes = {
    sm: 'text-sm sm:text-base',
    md: 'text-base sm:text-lg',
    lg: 'text-xl sm:text-2xl',
  };

  const handleEmblemClick = (e: React.MouseEvent) => {
    if (onSecretLogoClick) {
      e.stopPropagation();
      onSecretLogoClick();
    }
  };

  const handleDirectExit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onExitFreePlan) {
      onExitFreePlan();
    } else {
      try {
        localStorage.removeItem('testimony_owner_unlocked');
        window.location.reload();
      } catch (err) {}
    }
  };

  return (
    <div className="flex items-center gap-3 select-none">
      {/* Interactive AI "T" Emblem with hidden 100% Free Plan trigger */}
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={handleEmblemClick}
          className={`relative ${iconSizes[size]} rounded-xl flex items-center justify-center p-0.5 bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 shadow-[0_0_20px_rgba(139,92,246,0.35)] group transition-transform hover:scale-105 active:scale-95 duration-200 cursor-pointer`}
          title={
            isOwnerFreeActive
              ? "Testimony AI (T) • 100% Free Owner Plan Active (Click to Exit or Manage)"
              : "Testimony AI (T) • Click to enter 100% Free Plan with password"
          }
          aria-label="Testimony AI T Emblem"
        >
          <div className="w-full h-full bg-[#0b0f19] rounded-[10px] flex items-center justify-center relative overflow-hidden">
            {/* Subtle neural background glow */}
            <div className="absolute inset-0 bg-radial from-purple-500/20 via-transparent to-transparent opacity-75" />

            {/* Stylized AI "T" emblem */}
            <svg
              className="w-3/5 h-3/5 text-white relative z-10 drop-shadow-[0_2px_8px_rgba(99,102,241,0.6)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Top crossbar with neural node caps */}
              <path d="M4 6h16" />
              <circle cx="4" cy="6" r="1.5" fill="#38bdf8" stroke="none" />
              <circle cx="20" cy="6" r="1.5" fill="#c084fc" stroke="none" />

              {/* Center stem */}
              <path d="M12 6v13" />

              {/* Sparkle node at bottom */}
              <circle cx="12" cy="19" r="1.5" fill="#818cf8" stroke="none" />

              {/* Quantum energy arcs */}
              <path d="M8 12c1.5 1.5 6.5 1.5 8 0" stroke="rgba(216, 180, 254, 0.7)" strokeWidth="1.5" />
            </svg>

            {/* Active Owner Free Indicator */}
            {isOwnerFreeActive && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
            )}
          </div>
        </button>

        {/* Hidden under the AI logo T: 100% free plan entry / exit indicator */}
        {isOwnerFreeActive ? (
          <button
            type="button"
            onClick={handleDirectExit}
            className="text-[9px] font-bold text-amber-400 hover:text-rose-400 mt-0.5 tracking-tighter flex items-center gap-0.5 transition cursor-pointer"
            title="Click to Exit 100% Free Plan"
          >
            <span>Exit Free</span>
            <LogOut className="w-2.5 h-2.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleEmblemClick}
            className="text-[9px] font-semibold text-slate-500 hover:text-amber-400 mt-0.5 tracking-tighter opacity-70 hover:opacity-100 transition cursor-pointer"
            title="Hidden 100% Free Plan (Password Required)"
          >
            Free
          </button>
        )}
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`font-black tracking-tight text-white ${textSizes[size]}`}>
            TESTIMONY
          </span>
          <span className={`font-extrabold tracking-wider bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent ${textSizes[size]}`}>
            AI
          </span>
          <span className={`font-bold tracking-tight text-slate-300 ${textSizes[size]}`}>
            ASSISTANT
          </span>
        </div>
        {showTagline && (
          <span className="text-[11px] font-medium text-slate-400 tracking-wide hidden sm:block">
            Your Intelligence. Your Creativity. Your Success.
          </span>
        )}
      </div>
    </div>
  );
};
