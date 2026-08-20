import React from 'react';

interface PtKdrtLogoProps {
  variant?: 'full' | 'horizontal' | 'icon';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSubtitle?: boolean;
}

export const PtKdrtLogo: React.FC<PtKdrtLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  className = '',
  showSubtitle = true,
}) => {
  // SVG of the Glowing Neon Brain with Upward Arrow
  const BrainIcon = ({ dimension = 32 }: { dimension?: number }) => (
    <div
      className="relative flex items-center justify-center rounded-xl bg-slate-950 p-1.5 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.25)] shrink-0 overflow-hidden"
      style={{ width: dimension, height: dimension }}
    >
      {/* Background Subtle Glow */}
      <div className="absolute inset-0 bg-radial from-cyan-500/20 via-transparent to-transparent pointer-events-none" />
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="neonCyan" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="50%" stopColor="#00E5FF" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
          <linearGradient id="arrowWhite" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#CBD5E1" />
            <stop offset="60%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>
        </defs>

        {/* Neural Brain Lobes Contour */}
        <path
          d="M 32 15 C 20 12, 8 24, 10 38 C 5 44, 4 56, 12 66 C 5 75, 11 88, 24 90 C 29 95, 39 98, 48 92 C 55 98, 66 98, 72 92 C 82 86, 92 78, 88 64 C 95 56, 95 40, 86 30 C 82 14, 66 8, 54 16 C 46 10, 38 10, 32 15 Z"
          stroke="url(#neonCyan)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.85"
        />

        {/* Inner Brain Folds */}
        <path
          d="M 20 40 C 30 34, 48 42, 42 58 C 38 68, 24 70, 22 82"
          stroke="url(#neonCyan)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M 32 26 C 44 26, 56 38, 52 52 C 48 64, 60 76, 72 70"
          stroke="url(#neonCyan)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M 64 24 C 76 30, 84 46, 76 60 C 70 70, 84 82, 88 74"
          stroke="url(#neonCyan)"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Dynamic Center Growth Loop & Arrow */}
        <path
          d="M 28 72 C 20 60, 32 44, 48 48 C 64 52, 56 72, 42 78 C 32 82, 26 74, 30 66 C 38 50, 68 32, 80 20"
          stroke="url(#arrowWhite)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Arrowhead */}
        <path
          d="M 70 16 L 88 14 L 86 32 Z"
          fill="url(#neonCyan)"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );

  // 1. Icon Only Variant
  if (variant === 'icon') {
    const dim = size === 'xs' ? 24 : size === 'sm' ? 28 : size === 'lg' ? 44 : size === 'xl' ? 56 : 32;
    return <BrainIcon dimension={dim} />;
  }

  // 2. Full Brand Logo (Badge with Subtitle for Login & Hero cards)
  if (variant === 'full') {
    const isSmall = size === 'sm';
    const isLarge = size === 'lg' || size === 'xl';

    return (
      <div className={`flex flex-col items-center select-none ${className}`}>
        {/* Logo Card Container */}
        <div className="relative flex flex-col items-center justify-center p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-[#0B1528] via-[#070E1B] to-[#030710] border border-cyan-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(6,182,212,0.2)]">
          <div className="flex items-center gap-3.5 sm:gap-4.5">
            <BrainIcon dimension={isLarge ? 64 : isSmall ? 40 : 52} />
            <div className="text-left">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-sans">
                PT KDRT
              </div>
              {showSubtitle && (
                <div className="text-[9px] sm:text-[11px] lg:text-xs font-extrabold tracking-[0.22em] text-cyan-300/90 uppercase font-sans mt-0.5 whitespace-nowrap">
                  AFFILIATE | AI-POWERED SOLUTIONS
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Horizontal Header / Navbar Variant
  const dim = size === 'xs' ? 26 : size === 'sm' ? 30 : size === 'lg' ? 38 : size === 'xl' ? 44 : 32;

  return (
    <div className={`flex items-center gap-2 sm:gap-2.5 select-none ${className}`}>
      <BrainIcon dimension={dim} />
      <div className="flex flex-col text-left">
        <span className="text-xs sm:text-sm font-black tracking-tight text-slate-900 group-hover:text-cyan-600 transition-colors whitespace-nowrap">
          KANTOR PT.KDRT
        </span>
        {showSubtitle && (
          <span className="text-[8px] sm:text-[9px] font-extrabold text-cyan-600 tracking-wider uppercase leading-none">
            AFFILIATE | AI-POWERED
          </span>
        )}
      </div>
    </div>
  );
};
