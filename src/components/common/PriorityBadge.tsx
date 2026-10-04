import React from 'react';
import { PriorityLevel } from '../../types/database';

interface PriorityBadgeProps {
  level: PriorityLevel;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ level, label, size = 'sm' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1 font-medium',
    lg: 'text-sm px-3 py-1.5 font-semibold',
  }[size];

  const config = {
    URGENT: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20',
      dot: 'bg-rose-600 animate-pulse',
      text: label || 'Sangat Tinggi (Mendesak)',
    },
    HIGH: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20',
      dot: 'bg-amber-500',
      text: label || 'Tinggi',
    },
    MEDIUM: {
      bg: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/20',
      dot: 'bg-blue-500',
      text: label || 'Sedang',
    },
    LOW: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20',
      dot: 'bg-emerald-500',
      text: label || 'Rendah / Mandiri',
    },
  }[level] || {
    bg: 'bg-slate-50 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
    text: label || 'Normal',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-xs ${config.bg} ${sizeClasses}`}
      title="Indikasi Kebutuhan Layanan BK (Bukan Diagnosis Psikologis)"
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.text}</span>
    </span>
  );
};
