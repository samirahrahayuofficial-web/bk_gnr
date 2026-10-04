import React from 'react';

interface BidangBarChartProps {
  data: {
    name: string;
    average: number;
    color?: string;
  }[];
  title?: string;
  subtitle?: string;
}

export const BidangBarChart: React.FC<BidangBarChartProps> = ({
  data,
  title = 'Distribusi Kebutuhan Siswa Berdasarkan Bidang BK (AKPD)',
  subtitle = 'Rata-rata persentase indikasi kebutuhan siswa per bidang bimbingan',
}) => {
  const defaultColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs">
      <div className="mb-4">
        <h3 className="font-semibold text-slate-800 text-sm md:text-base">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="space-y-4">
        {data.map((item, index) => {
          const color = item.color || defaultColors[index % defaultColors.length];
          return (
            <div key={item.name} className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-medium">
                <span className="text-slate-700 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  {item.name}
                </span>
                <span className="font-bold text-slate-900">{item.average}%</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden relative">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${Math.min(100, Math.max(0, item.average))}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
        <span>Kategori: 0-20% Sangat Rendah | 21-40% Rendah | 41-60% Sedang | 61-80% Tinggi | &gt;80% Sangat Tinggi</span>
      </div>
    </div>
  );
};
