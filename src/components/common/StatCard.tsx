import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: 'blue' | 'emerald' | 'amber' | 'rose' | 'purple' | 'slate';
  badge?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = 'blue',
  badge,
}) => {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'hover:border-blue-300',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'hover:border-emerald-300',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'hover:border-amber-300',
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'hover:border-rose-300',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'hover:border-purple-300',
    },
    slate: {
      bg: 'bg-slate-50',
      text: 'text-slate-600',
      border: 'hover:border-slate-300',
    },
  }[color];

  return (
    <div
      className={`bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs transition-all duration-200 ${colorMap.border} flex flex-col justify-between`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <h4 className="text-2xl font-bold text-slate-800 mt-1">{value}</h4>
        </div>
        <div className={`p-2.5 rounded-xl ${colorMap.bg} ${colorMap.text}`}>{icon}</div>
      </div>

      {(subtitle || badge) && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>{subtitle}</span>
          {badge && (
            <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full text-[11px]">
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
