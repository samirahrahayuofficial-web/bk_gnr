import React from 'react';

interface LogoSMKProps {
  className?: string;
  size?: number | string;
  showShadow?: boolean;
}

export const LogoSMK: React.FC<LogoSMKProps> = ({
  className = '',
  size = 48,
  showShadow = true,
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 400"
      width={size}
      height={size}
      className={`inline-block select-none ${showShadow ? 'filter drop-shadow-sm' : ''} ${className}`}
      aria-label="Logo SMK Negeri 1 Gunungguruh"
    >
      <defs>
        {/* Paths for curved text */}
        <path
          id="smk-upper-path"
          d="M 44,142 Q 200,18 356,142"
          fill="none"
        />
        <path
          id="smk-lower-path"
          d="M 90,366 Q 200,402 310,366"
          fill="none"
        />
        {/* Gradients */}
        <linearGradient id="smk-yellow-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF133" />
          <stop offset="100%" stopColor="#FDD835" />
        </linearGradient>
        <radialGradient id="globe-grad" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#42A5F5" />
          <stop offset="100%" stopColor="#1565C0" />
        </radialGradient>
      </defs>

      {/* Main Pentagon Shield (Segi Lima) with TRANSPARENT background outside */}
      <polygon
        points="200,14 386,144 324,386 76,386 14,144"
        fill="url(#smk-yellow-grad)"
        stroke="#111111"
        strokeWidth="7"
        strokeLinejoin="round"
      />
      <polygon
        points="200,24 374,148 316,374 84,374 26,148"
        fill="none"
        stroke="#111111"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Top Curved Text: SMK NEGERI 1 GUNUNGGURUH */}
      <text
        fill="#D32F2F"
        fontSize="17.5"
        fontWeight="900"
        fontFamily="Poppins, sans-serif"
        letterSpacing="1.2px"
      >
        <textPath href="#smk-upper-path" startOffset="50%" textAnchor="middle">
          SMK NEGERI 1 GUNUNGGURUH
        </textPath>
      </text>

      {/* Decorative Ornaments (Traditional Torches / Black flourishes above globe) */}
      <g fill="#111111">
        <path d="M 195,115 C 180,105 150,110 135,130 C 145,138 165,125 180,132 C 188,124 192,118 195,115 Z" />
        <path d="M 205,115 C 220,105 250,110 265,130 C 255,138 235,125 220,132 C 212,124 208,118 205,115 Z" />
        <circle cx="160" cy="115" r="4.5" />
        <circle cx="240" cy="115" r="4.5" />
        <path d="M 125,142 C 115,152 118,172 130,178 C 135,168 132,154 125,142 Z" />
        <path d="M 275,142 C 285,152 282,172 270,178 C 265,168 268,154 275,142 Z" />
      </g>

      {/* Industrial Half-Gear at bottom of globe */}
      <g fill="#111111">
        <path d="M 130,265 L 140,265 L 142,275 L 152,277 L 156,268 L 166,270 L 167,280 L 178,283 L 184,275 L 194,277 L 195,286 L 205,286 L 206,277 L 216,275 L 222,283 L 233,280 L 234,270 L 244,268 L 248,277 L 258,275 L 260,265 L 270,265 C 265,305 235,325 200,325 C 165,325 135,305 130,265 Z" />
        <circle cx="200" cy="270" r="16" fill="url(#smk-yellow-grad)" stroke="#111111" strokeWidth="3" />
      </g>

      {/* Center Globe (Dunia) */}
      <circle cx="200" cy="225" r="54" fill="url(#globe-grad)" stroke="#111111" strokeWidth="2.5" />
      {/* Continents (Green Map landmasses) */}
      <g fill="#43A047">
        <path d="M 170,200 Q 185,190 200,195 Q 215,200 220,215 Q 210,230 190,225 Q 175,230 170,215 Z" />
        <path d="M 215,225 Q 235,220 242,235 Q 240,250 225,255 Q 215,245 215,225 Z" />
        <path d="M 160,235 Q 175,240 178,255 Q 165,265 155,250 Z" />
      </g>
      {/* Globe Lat/Long grid lines */}
      <ellipse cx="200" cy="225" rx="54" ry="22" fill="none" stroke="#BBDEFB" strokeWidth="1" strokeDasharray="3,2" opacity="0.6" />
      <line x1="200" y1="171" x2="200" y2="279" stroke="#BBDEFB" strokeWidth="1" opacity="0.5" />

      {/* Azure Wings (Sayap Biru) */}
      {/* Left Wing */}
      <g fill="#00B0FF" stroke="#0288D1" strokeWidth="1.5">
        <path d="M 148,225 C 120,210 88,200 70,215 C 72,228 85,232 100,234 C 80,240 76,252 86,260 C 102,262 118,252 140,248 C 118,260 115,274 130,278 C 146,275 152,258 152,246 Z" />
      </g>
      {/* Right Wing */}
      <g fill="#00B0FF" stroke="#0288D1" strokeWidth="1.5">
        <path d="M 252,225 C 280,210 312,200 330,215 C 328,228 315,232 300,234 C 320,240 324,252 314,260 C 298,262 282,252 260,248 C 282,260 285,274 270,278 C 254,275 248,258 248,246 Z" />
      </g>

      {/* Manual Hand Drill (Bor Tangan Tradisional) - Center Feature */}
      <g id="hand-drill">
        {/* Top Handle (Orange wood) */}
        <rect x="174" y="152" width="52" height="18" rx="7" fill="#E65100" stroke="#111111" strokeWidth="2" />
        <rect x="178" y="155" width="44" height="12" rx="5" fill="#FF9800" />
        
        {/* Vertical shaft connecting top handle */}
        <rect x="195" y="170" width="10" height="20" fill="#212121" />

        {/* Crank Frame (Black metal bow) */}
        <path
          d="M 200,190 L 222,190 L 222,235 L 200,235 L 200,275"
          fill="none"
          stroke="#111111"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Side Crank Grip (Orange wood knob) */}
        <rect x="216" y="206" width="16" height="26" rx="6" fill="#FF9800" stroke="#111111" strokeWidth="2" />

        {/* Drill Chuck & Bit (Mata Bor ke Bawah) */}
        <polygon points="194,275 206,275 203,298 200,305 197,298" fill="#424242" stroke="#111111" strokeWidth="1.5" />
        <line x1="200" y1="280" x2="200" y2="302" stroke="#9E9E9E" strokeWidth="1" />
      </g>

      {/* Computer Mouse (Ungu / Purple Mouse on lower left) */}
      <g id="computer-mouse">
        {/* Mouse Cord */}
        <path
          d="M 172,262 C 160,250 148,270 162,280 C 180,290 190,275 196,272"
          fill="none"
          stroke="#111111"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Mouse Body */}
        <ellipse cx="166" cy="272" rx="16" ry="12" fill="#5E35B1" stroke="#111111" strokeWidth="2" />
        <path d="M 166,260 L 166,270" stroke="#111111" strokeWidth="1.5" />
        <ellipse cx="166" cy="265" rx="3" ry="2" fill="#00E5FF" />
      </g>

      {/* Bottom Curved Text: KAB. SUKABUMI */}
      <text
        fill="#111111"
        fontSize="21"
        fontWeight="900"
        fontFamily="Poppins, sans-serif"
        letterSpacing="2.5px"
      >
        <textPath href="#smk-lower-path" startOffset="50%" textAnchor="middle">
          KAB. SUKABUMI
        </textPath>
      </text>
    </svg>
  );
};
