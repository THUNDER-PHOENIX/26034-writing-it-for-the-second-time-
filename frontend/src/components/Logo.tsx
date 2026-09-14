import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export function Logo({ className = "", size = 40, showText = false }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Emblem / Badge SVG */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-md flex-shrink-0"
      >
        {/* Background Shield */}
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="50%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>

        {/* Outer Hexagon / Shield */}
        <path
          d="M50 4L90 20V52C90 76 72 92 50 98C28 92 10 76 10 52V20L50 4Z"
          fill="url(#logoGrad)"
          stroke="#93c5fd"
          strokeWidth="2.5"
        />

        {/* Inner Scales of Legal Metrology (Weights & Measures) */}
        {/* Central Fulcrum / Pillar */}
        <path d="M50 22V66M44 66H56M40 70H60" stroke="url(#goldGrad)" strokeWidth="3" strokeLinecap="round" />

        {/* Balance Beam */}
        <path d="M26 32L50 28L74 32" stroke="url(#goldGrad)" strokeWidth="2.8" strokeLinecap="round" />

        {/* Left Pan (Weights / Standards) */}
        <path d="M26 32L18 46M26 32L34 46" stroke="#e0f2fe" strokeWidth="1.5" />
        <path d="M16 46Q26 52 36 46Z" fill="url(#goldGrad)" />

        {/* Right Pan (Packaged Commodity Verification) */}
        <path d="M74 32L66 46M74 32L82 46" stroke="#e0f2fe" strokeWidth="1.5" />
        <path d="M64 46Q74 52 84 46Z" fill="url(#goldGrad)" />

        {/* Central Packaged Commodity Box with Checkmark */}
        <rect x="42" y="44" width="16" height="14" rx="2" fill="#ffffff" stroke="#1e40af" strokeWidth="1.5" />
        {/* Barcode lines inside box */}
        <line x1="45" y1="47" x2="45" y2="55" stroke="#1e40af" strokeWidth="1.2" />
        <line x1="48" y1="47" x2="48" y2="55" stroke="#1e40af" strokeWidth="1" />
        <line x1="51" y1="47" x2="51" y2="55" stroke="#1e40af" strokeWidth="1.2" />
        <line x1="54" y1="47" x2="54" y2="55" stroke="#1e40af" strokeWidth="1" />

        {/* Verified Green Tick Badge */}
        <circle cx="70" cy="70" r="14" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
        <path d="M64 70L68 74L76 65" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {showText && (
        <div className="flex flex-col">
          <div className="font-bold text-slate-900 leading-tight text-base tracking-tight">
            LEGAL METROLOGY
          </div>
          <div className="text-[11px] font-semibold text-blue-700 tracking-wider uppercase">
            PCR 2011 • PS 26034
          </div>
        </div>
      )}
    </div>
  );
}
