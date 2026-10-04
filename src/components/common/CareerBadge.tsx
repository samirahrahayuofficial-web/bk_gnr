import React from 'react';

interface CareerBadgeProps {
  career: 'BEKERJA' | 'KULIAH' | 'WIRAUSAHA' | 'KOMBINASI' | string;
  percentage?: number;
}

export const CareerBadge: React.FC<CareerBadgeProps> = ({ career, percentage }) => {
  const c = career?.toUpperCase();

  const config = {
    BEKERJA: {
      bg: 'bg-sky-50 text-sky-800 border-sky-200',
      label: 'Bekerja',
      icon: '💼',
    },
    KULIAH: {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      label: 'Kuliah',
      icon: '🎓',
    },
    WIRAUSAHA: {
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      label: 'Wirausaha',
      icon: '🚀',
    },
    KOMBINASI: {
      bg: 'bg-purple-50 text-purple-800 border-purple-200',
      label: 'Kombinasi / Seimbang',
      icon: '⚖️',
    },
  }[c] || {
    bg: 'bg-slate-50 text-slate-700 border-slate-200',
    label: career,
    icon: '🎯',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg}`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
      {percentage !== undefined && (
        <span className="font-bold opacity-80">({percentage}%)</span>
      )}
    </span>
  );
};
