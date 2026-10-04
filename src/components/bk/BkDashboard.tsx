import React, { useState, useEffect } from 'react';
import { AnalysisService } from '../../services/AnalysisService';
import { StatCard } from '../common/StatCard';
import { BidangBarChart } from '../charts/BidangBarChart';
import { CareerDonutChart } from '../charts/CareerDonutChart';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ClipboardList,
  Compass,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  ListTodo,
  Cloud,
} from 'lucide-react';
import { ReportingService } from '../../services/ReportingService';
import { useNotification } from '../../context/NotificationContext';
import { CloudSyncService } from '../../services/CloudSyncService';

interface BkDashboardProps {
  onNavigate: (menu: string) => void;
}

export const BkDashboard: React.FC<BkDashboardProps> = ({ onNavigate }) => {
  const [syncTick, setSyncTick] = useState(0);

  useEffect(() => {
    const handleSync = () => setSyncTick((t) => t + 1);
    window.addEventListener('sibks_data_synced', handleSync);
    return () => window.removeEventListener('sibks_data_synced', handleSync);
  }, []);

  const overview = AnalysisService.getSchoolOverview();
  const { showToast } = useNotification();
  const [isPulling, setIsPulling] = useState(false);

  const handlePullFromCloud = async () => {
    setIsPulling(true);
    const res = await CloudSyncService.pullAllDataFromCloud();
    setIsPulling(false);
    if (res.success) {
      if (res.isQuotaWarning) {
        showToast('warning', 'Mode Database Lokal Aktif', res.message);
      } else {
        showToast('success', 'Sinkronisasi Cloud Berhasil', res.message);
      }
    } else {
      showToast('error', 'Gagal Sinkronisasi', res.message);
    }
  };

  const handleExportAKPD = () => {
    ReportingService.exportAKPDRecap();
    showToast('success', 'Ekspor Berhasil', 'Rekapitulasi AKPD telah diunduh.');
  };

  const handleExportBMW = () => {
    ReportingService.exportBMWRecap();
    showToast('success', 'Ekspor Berhasil', 'Rekapitulasi Minat Karier BMW telah diunduh.');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-blue-200 border border-white/20 mb-3">
            <TrendingUp className="w-3.5 h-3.5" />
            Decision Support System Guru Bimbingan dan Konseling
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Dashboard Pemetaan Kebutuhan & Minat Siswa
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Pantau hasil asesmen diagnostik non-kognitif, indikasi kebutuhan layanan bimbingan
            (AKPD & Kelas X), serta orientasi minat karier siswa kelas XII (BMW).
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <button
              onClick={() => onNavigate('bk-siswa')}
              className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>Data & Analisis Siswa</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigate('bk-tindak-lanjut')}
              className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 transition-colors cursor-pointer"
            >
              <ListTodo className="w-4 h-4" />
              <span>Tindak Lanjut Layanan</span>
            </button>
            <button
              onClick={handlePullFromCloud}
              disabled={isPulling}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Tarik seluruh data respon dan isian siswa terbaru dari Cloud Firestore"
            >
              <Cloud className={`w-4 h-4 ${isPulling ? 'animate-spin' : ''}`} />
              <span>{isPulling ? 'Menyinkronkan...' : 'Sinkronkan Data Cloud'}</span>
            </button>
            <button
              onClick={handleExportAKPD}
              className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6 Key Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Siswa"
          value={overview.totalStudents}
          subtitle="Terdaftar aktif"
          icon={<Users className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Sudah Mengisi"
          value={overview.completedStudentsCount}
          subtitle={`${overview.participationRate}% partisipasi`}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="emerald"
        />
        <StatCard
          title="Belum Mengisi"
          value={overview.pendingStudentsCount}
          subtitle="Menunggu pengisian"
          icon={<Clock className="w-5 h-5" />}
          color="amber"
        />
        <StatCard
          title="Angket Aktif"
          value={overview.activeQuestionnairesCount}
          subtitle="AKPD, BMW, Kelas X"
          icon={<ClipboardList className="w-5 h-5" />}
          color="slate"
        />
        <StatCard
          title="Prioritas Tinggi"
          value={overview.highOrUrgentCount}
          subtitle="Indikasi kebutuhan mendesak"
          icon={<AlertTriangle className="w-5 h-5" />}
          color="rose"
        />
        <StatCard
          title="Tindak Lanjut"
          value={overview.activeFollowUpsCount}
          subtitle="Dalam penanganan"
          icon={<ListTodo className="w-5 h-5" />}
          color="purple"
        />
      </div>

      {/* Charts Section: 4 Bidang AKPD & BMW Career Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <BidangBarChart data={overview.bidangDistribution} />
        </div>

        <div className="lg:col-span-5">
          <CareerDonutChart
            bekerja={overview.careerDistribution.bekerja}
            kuliah={overview.careerDistribution.kuliah}
            wirausaha={overview.careerDistribution.wirausaha}
            kombinasi={overview.careerDistribution.kombinasi}
            total={overview.careerDistribution.total}
          />
        </div>
      </div>

      {/* Top 10 Student Needs Section */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm md:text-base flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-600" />
              <span>Top 10 Indikasi Kebutuhan Siswa Paling Dominan</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Butir-butir pernyataan angket AKPD yang paling banyak dipilih ("YA") oleh siswa.
            </p>
          </div>
          <button
            onClick={() => onNavigate('bk-rekap-sekolah')}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>Lihat Semua Analisis</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-3 w-12 text-center">Rank</th>
                <th className="py-2.5 px-3 w-16 text-center">No. Item</th>
                <th className="py-2.5 px-3">Pernyataan Kebutuhan Siswa</th>
                <th className="py-2.5 px-3 w-36">Bidang BK</th>
                <th className="py-2.5 px-3 w-28 text-center">Responden "YA"</th>
                <th className="py-2.5 px-3 w-36">Persentase</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {overview.top10Needs.map((item, idx) => (
                <tr key={item.question_id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                    #{idx + 1}
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                    {item.question_number}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-800 leading-snug">
                    {item.statement}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 font-medium">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px]">
                      {item.category_name}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-blue-700">
                    {item.total_yes} / {item.total_respondents}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-800 text-[11px] w-8">
                        {item.percentage}%
                      </span>
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
