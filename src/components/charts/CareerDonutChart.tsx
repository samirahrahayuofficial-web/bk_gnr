import React from 'react';

interface CareerDonutChartProps {
  bekerja: number;
  kuliah: number;
  wirausaha: number;
  kombinasi?: number;
  total?: number;
  title?: string;
  subtitle?: string;
}

export const CareerDonutChart: React.FC<CareerDonutChartProps> = ({
  bekerja,
  kuliah,
  wirausaha,
  kombinasi = 0,
  title = 'Distribusi Minat Karier Kelas XII (BMW)',
  subtitle = 'Proporsi orientasi siswa: Bekerja, Melanjutkan Kuliah, dan Wirausaha',
}) => {
  const sum = bekerja + kuliah + wirausaha + kombinasi;
  const safeTotal = sum > 0 ? sum : 1;

  const pctBekerja = Math.round((bekerja / safeTotal) * 100);
  const pctKuliah = Math.round((kuliah / safeTotal) * 100);
  const pctWirausaha = Math.round((wirausaha / safeTotal) * 100);
  const pctKombinasi = Math.round((kombinasi / safeTotal) * 100);

  // SVG Donut calculation
  const radius = 64;
  const circumference = 2 * Math.PI * radius;

  const strokeBekerja = (pctBekerja / 100) * circumference;
  const strokeKuliah = (pctKuliah / 100) * circumference;
  const strokeWirausaha = (pctWirausaha / 100) * circumference;
  const strokeKombinasi = (pctKombinasi / 100) * circumference;

  const offsetBekerja = 0;
  const offsetKuliah = strokeBekerja;
  const offsetWirausaha = strokeBekerja + strokeKuliah;
  const offsetKombinasi = strokeBekerja + strokeKuliah + strokeWirausaha;

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div>
        <h3 className="font-semibold text-slate-800 text-sm md:text-base">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="my-4 flex flex-col sm:flex-row items-center justify-center gap-6">
        <div className="relative w-36 h-36 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
            <circle
              cx="80"
              cy="80"
              r={radius}
              className="text-slate-100"
              strokeWidth="22"
              stroke="currentColor"
              fill="transparent"
            />
            {sum > 0 && (
              <>
                {/* Bekerja: Blue */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke="#0284c7"
                  strokeWidth="22"
                  strokeDasharray={`${strokeBekerja} ${circumference}`}
                  strokeDashoffset={-offsetBekerja}
                  fill="transparent"
                  strokeLinecap="round"
                />
                {/* Kuliah: Emerald */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke="#10b981"
                  strokeWidth="22"
                  strokeDasharray={`${strokeKuliah} ${circumference}`}
                  strokeDashoffset={-offsetKuliah}
                  fill="transparent"
                  strokeLinecap="round"
                />
                {/* Wirausaha: Amber */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke="#f59e0b"
                  strokeWidth="22"
                  strokeDasharray={`${strokeWirausaha} ${circumference}`}
                  strokeDashoffset={-offsetWirausaha}
                  fill="transparent"
                  strokeLinecap="round"
                />
                {/* Kombinasi: Purple */}
                {kombinasi > 0 && (
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    stroke="#8b5cf6"
                    strokeWidth="22"
                    strokeDasharray={`${strokeKombinasi} ${circumference}`}
                    strokeDashoffset={-offsetKombinasi}
                    fill="transparent"
                    strokeLinecap="round"
                  />
                )}
              </>
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xl font-extrabold text-slate-800">{sum}</span>
            <span className="text-[11px] text-slate-500 font-medium">Responden</span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2 text-xs w-full sm:w-auto">
          <div className="flex items-center justify-between gap-4 py-1 border-b border-slate-100">
            <span className="flex items-center gap-2 text-slate-700 font-medium">
              <span className="w-3 h-3 rounded-md bg-sky-600 inline-block" />
              Bekerja
            </span>
            <span className="font-bold text-slate-900">{bekerja} ({pctBekerja}%)</span>
          </div>

          <div className="flex items-center justify-between gap-4 py-1 border-b border-slate-100">
            <span className="flex items-center gap-2 text-slate-700 font-medium">
              <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block" />
              Kuliah
            </span>
            <span className="font-bold text-slate-900">{kuliah} ({pctKuliah}%)</span>
          </div>

          <div className="flex items-center justify-between gap-4 py-1 border-b border-slate-100">
            <span className="flex items-center gap-2 text-slate-700 font-medium">
              <span className="w-3 h-3 rounded-md bg-amber-500 inline-block" />
              Wirausaha
            </span>
            <span className="font-bold text-slate-900">{wirausaha} ({pctWirausaha}%)</span>
          </div>

          {kombinasi > 0 && (
            <div className="flex items-center justify-between gap-4 py-1">
              <span className="flex items-center gap-2 text-slate-700 font-medium">
                <span className="w-3 h-3 rounded-md bg-purple-500 inline-block" />
                Kombinasi
              </span>
              <span className="font-bold text-slate-900">{kombinasi} ({pctKombinasi}%)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
