import React from 'react';

interface LogoBKProps {
  className?: string;
  size?: number | string;
  showShadow?: boolean;
}

export const LogoBK: React.FC<LogoBKProps> = ({
  className = '',
  size = 48,
  showShadow = true,
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 500 500"
      width={size}
      height={size}
      className={`inline-block select-none ${showShadow ? 'filter drop-shadow-sm' : ''} ${className}`}
      aria-label="Logo Bimbingan dan Konseling SMKN 1 Gunungguruh"
    >
      <defs>
        {/* Gradients */}
        <linearGradient id="bk-gold-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFE082" />
          <stop offset="50%" stopColor="#FFB300" />
          <stop offset="100%" stopColor="#FFA000" />
        </linearGradient>

        <linearGradient id="bk-blue-swoosh" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#00E5FF" />
          <stop offset="100%" stopColor="#0288D1" />
        </linearGradient>

        <linearGradient id="bk-navy-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#102C5E" />
          <stop offset="100%" stopColor="#081736" />
        </linearGradient>

        <path
          id="bk-motto-path"
          d="M 120,442 Q 250,470 380,442"
          fill="none"
        />
      </defs>

      {/* TRANSPARENT BACKGROUND OUTSIDE THE EMBLEM */}

      {/* Outer Golden & Navy Ring Circle */}
      <circle cx="250" cy="225" r="215" fill="#FFFFFF" stroke="#0D275A" strokeWidth="6" />
      <path
        d="M 60,225 A 190,190 0 1,1 440,225 A 190,190 0 0,1 60,225"
        fill="none"
        stroke="#FFB300"
        strokeWidth="16"
      />
      <circle cx="250" cy="225" r="180" fill="#F4F8FD" />

      {/* Top Center Golden Star */}
      <g transform="translate(250, 48)">
        <polygon
          points="0,-22 6,-6 23,-6 10,5 15,22 0,11 -15,22 -10,5 -23,-6 -6,-6"
          fill="#FFB300"
          stroke="#FFA000"
          strokeWidth="1.5"
        />
      </g>

      {/* Left Feature: Industrial Gear (Vocational Education) */}
      <g transform="translate(90, 190) scale(0.85)" fill="#1976D2">
        <path d="M -15,-45 L 15,-45 L 12,-30 L 28,-22 L 40,-32 L 60,-12 L 48,2 L 54,20 L 68,24 L 62,50 L 46,48 L 36,62 L 44,78 L 22,94 L 10,80 L -8,82 L -18,98 L -44,88 L -38,72 L -52,60 L -68,68 L -80,44 L -64,36 L -66,18 L -82,10 L -76,-16 L -58,-14 L -48,-28 L -54,-44 L -32,-56 L -24,-40 Z" />
        <circle cx="0" cy="18" r="22" fill="#F4F8FD" />
      </g>

      {/* Right Features: Wrench, Pencil, Laptop */}
      <g transform="translate(370, 180) rotate(15)" fill="#1976D2">
        {/* Wrench (Kunci Pas) */}
        <path d="M 0,-70 C -12,-70 -22,-60 -20,-48 L -14,-40 C -8,-44 0,-44 6,-40 L 12,-48 C 14,-60 8,-70 0,-70 Z M -6,-36 L -8,30 L 4,30 L 6,-36 Z" />
        {/* Pencil */}
        <path d="M 24,-20 L 32,-15 L 15,45 L 7,40 Z M 5,44 L 14,48 L 4,55 Z" fill="#FFA000" />
        {/* Laptop */}
        <rect x="18" y="2" width="38" height="26" rx="3" fill="#0D275A" />
        <rect x="22" y="6" width="30" height="18" fill="#E3F2FD" />
        <polygon points="12,28 62,28 66,33 8,33" fill="#78909C" />
      </g>

      {/* Top Silhouettes: Counselor (Guru BK) guiding Student (Siswa) */}
      <g fill="#0D275A">
        {/* Counselor (Left) */}
        <circle cx="218" cy="118" r="18" />
        <path d="M 218,140 C 195,140 178,160 174,188 L 236,188 C 238,172 232,156 226,148 C 238,154 252,168 258,180 L 264,175 C 255,158 238,140 218,140 Z" />
        {/* Student with Backpack (Right) */}
        <circle cx="274" cy="148" r="14" />
        <path d="M 274,166 C 262,166 250,178 248,198 L 292,198 C 292,185 288,175 282,170 Z" />
        {/* Backpack */}
        <rect x="286" y="174" width="10" height="18" rx="4" fill="#0D275A" />
      </g>

      {/* Dynamic 3D Lettering "BK" (Centerpiece) */}
      <g id="bk-typography">
        {/* Speed / Energy Swoosh Under BK */}
        <path
          d="M 90,265 C 160,250 280,240 405,270 C 370,285 260,288 175,278 C 140,274 105,280 90,265 Z"
          fill="url(#bk-blue-swoosh)"
        />

        {/* 3D Deep Shadow for "BK" */}
        <text
          x="248"
          y="262"
          textAnchor="middle"
          fontSize="165"
          fontWeight="900"
          fontStyle="italic"
          fontFamily="Poppins, Montserrat, sans-serif"
          fill="#081736"
        >
          BK
        </text>

        {/* Outer Navy Stroke */}
        <text
          x="242"
          y="256"
          textAnchor="middle"
          fontSize="165"
          fontWeight="900"
          fontStyle="italic"
          fontFamily="Poppins, Montserrat, sans-serif"
          fill="none"
          stroke="#0D275A"
          strokeWidth="16"
          strokeLinejoin="round"
        >
          BK
        </text>

        {/* Mid Cyan Outline */}
        <text
          x="242"
          y="256"
          textAnchor="middle"
          fontSize="165"
          fontWeight="900"
          fontStyle="italic"
          fontFamily="Poppins, Montserrat, sans-serif"
          fill="none"
          stroke="#00E5FF"
          strokeWidth="6"
          strokeLinejoin="round"
        >
          BK
        </text>

        {/* Pure Crisp White Face */}
        <text
          x="242"
          y="256"
          textAnchor="middle"
          fontSize="165"
          fontWeight="900"
          fontStyle="italic"
          fontFamily="Poppins, Montserrat, sans-serif"
          fill="#FFFFFF"
        >
          BK
        </text>
      </g>

      {/* Open White Book (Bottom Center of Emblem) */}
      <g transform="translate(250, 310)">
        <path
          d="M 0,0 C -40,-16 -90,-16 -140,-5 C -138,20 -134,35 -132,45 C -85,34 -40,35 0,50 C 40,35 85,34 132,45 C 134,35 138,20 140,-5 C 90,-16 40,-16 0,0 Z"
          fill="#FFFFFF"
          stroke="#0D275A"
          strokeWidth="3.5"
        />
        {/* Book spine & pages */}
        <path d="M 0,0 L 0,50" stroke="#0D275A" strokeWidth="3" />
        <path d="M -15,8 C -50,0 -90,0 -125,8" fill="none" stroke="#64B5F6" strokeWidth="2.5" />
        <path d="M -15,22 C -50,14 -90,14 -125,22" fill="none" stroke="#64B5F6" strokeWidth="2.5" />
        <path d="M 15,8 C 50,0 90,0 125,8" fill="none" stroke="#64B5F6" strokeWidth="2.5" />
        <path d="M 15,22 C 50,14 90,14 125,22" fill="none" stroke="#64B5F6" strokeWidth="2.5" />
      </g>

      {/* Navy Blue Ribbon Banner: "SMKN 1 GNR" */}
      <g id="navy-ribbon">
        {/* Left Ribbon Notch Tail */}
        <polygon points="30,375 75,340 75,410 30,410 46,392" fill="#071329" />
        <polygon points="55,340 75,340 75,405 55,405" fill="#FFB300" />

        {/* Right Ribbon Notch Tail */}
        <polygon points="470,375 425,340 425,410 470,410 454,392" fill="#071329" />
        <polygon points="445,340 425,340 425,405 445,405" fill="#FFB300" />

        {/* Main Ribbon Body */}
        <path
          d="M 65,360 Q 250,335 435,360 L 425,416 Q 250,392 75,416 Z"
          fill="url(#bk-navy-grad)"
          stroke="#FFB300"
          strokeWidth="4"
        />

        {/* Ribbon Text: SMKN 1 GNR */}
        <text
          x="250"
          y="396"
          textAnchor="middle"
          fontSize="35"
          fontWeight="900"
          fontFamily="Poppins, sans-serif"
          letterSpacing="3px"
          fill="#FFFFFF"
        >
          SMKN 1 GNR
        </text>
      </g>

      {/* Lower Golden Script Banner: "— Bersama Mengarahkan Masa Depan —" */}
      <g id="script-motto">
        <text
          fill="#FFFFFF"
          stroke="#071329"
          strokeWidth="2.5"
          fontSize="17.5"
          fontStyle="italic"
          fontWeight="700"
          fontFamily="Poppins, sans-serif"
          paintOrder="stroke fill"
        >
          <textPath href="#bk-motto-path" startOffset="50%" textAnchor="middle">
            — Bersama Mengarahkan Masa Depan —
          </textPath>
        </text>
      </g>
    </svg>
  );
};
