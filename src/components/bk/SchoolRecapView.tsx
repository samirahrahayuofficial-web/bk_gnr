import React from 'react';
import { db } from '../../db/storage';
import { AnalysisService } from '../../services/AnalysisService';
import { BidangBarChart } from '../charts/BidangBarChart';
import { CareerDonutChart } from '../charts/CareerDonutChart';
import { Sparkles, Users, Award, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { PriorityBadge } from '../common/PriorityBadge';

export const SchoolRecapView: React.FC = () => {
  const overview = AnalysisService.getSchoolOverview();
  const classes = db.getClasses();
  const students = db.getStudents();
  const responses = db.getResponses().filter((r) => r.status === 'SUBMITTED');

  // Participation by Class
  const classStats = classes.map((c) => {
    const classStudents = students.filter((s) => s.class_id === c.id);
    const studentIds = new Set(classStudents.map((s) => s.id));
    const submittedCount = responses.filter((r) => studentIds.has(r.student_id)).length;
    const rate = classStudents.length > 0 ? Math.round((submittedCount / classStudents.length) * 100) : 0;

    return {
      class: c,
      total: classStudents.length,
      submitted: submittedCount,
      rate,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <span>Rekapitulasi Sekolah & Tren Kebutuhan Keseluruhan</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Ikhtisar partisipasi pengisian, distribusi 4 bidang bimbingan, dan daftar butir kebutuhan prioritas.
        </p>
      </div>

      {/* 2 Main Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <BidangBarChart
            data={overview.bidangDistribution}
            title="Analisis 4 Bidang Bimbingan & Konseling Sekolah"
            subtitle="Rata-rata akumulasi kebutuhan dari angket AKPD seluruh rombel"
          />
        </div>

        <div className="lg:col-span-5">
          <CareerDonutChart
            bekerja={overview.careerDistribution.bekerja}
            kuliah={overview.careerDistribution.kuliah}
            wirausaha={overview.careerDistribution.wirausaha}
            kombinasi={overview.careerDistribution.kombinasi}
            total={overview.careerDistribution.total}
            title="Orientasi Minat Karier SMK (BMW)"
            subtitle="Distribusi pilihan Bekerja, Kuliah, Wirausaha"
          />
        </div>
      </div>

      {/* Partisipasi Rombongan Belajar (Kelas) */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm md:text-base">
              Tingkat Partisipasi Pengisian per Rombongan Belajar
            </h3>
            <p className="text-xs text-slate-500">
              Monitoring penyelesaian pengisian angket digital di setiap kelas.
            </p>
          </div>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
            Total Partisipasi: {overview.participationRate}%
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classStats.map((cs) => (
            <div
              key={cs.class.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-sm">{cs.class.name}</span>
                <span className="font-bold text-blue-700">{cs.rate}%</span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all"
                  style={{ width: `${cs.rate}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>{cs.submitted} dari {cs.total} siswa terisi</span>
                <span>Tingkat {cs.class.grade}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top 10 Needs Detailed Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5">
        <h3 className="font-bold text-slate-900 text-sm md:text-base mb-1">
          Peringkat 10 Kebutuhan Siswa Paling Mendesak di Sekolah
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Data ini menjadi dasar utama perumusan Program Tahunan & Semesteran BK (Prosem & Prota).
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-3 w-12 text-center">Rank</th>
                <th className="py-2.5 px-3 w-16 text-center">Item</th>
                <th className="py-2.5 px-3">Butir Pernyataan AKPD</th>
                <th className="py-2.5 px-3 w-40">Bidang Bimbingan</th>
                <th className="py-2.5 px-3 w-28 text-center">Jumlah 'YA'</th>
                <th className="py-2.5 px-3 w-36">Persentase</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {overview.top10Needs.map((need, idx) => (
                <tr key={need.question_id} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-3 text-center font-bold text-slate-400">#{idx + 1}</td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-800">{need.question_number}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-800">{need.statement}</td>
                  <td className="py-2.5 px-3 text-slate-600">{need.category_name}</td>
                  <td className="py-2.5 px-3 text-center font-bold text-blue-700">
                    {need.total_yes} / {need.total_respondents}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${need.percentage}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-800 text-[11px]">{need.percentage}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
