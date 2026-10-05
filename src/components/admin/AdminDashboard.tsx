import React, { useState, useEffect } from 'react';
import { db } from '../../db/storage';
import { StatCard } from '../common/StatCard';
import {
  Users,
  BookOpen,
  FileSpreadsheet,
  HelpCircle,
  History,
  Settings,
  ShieldCheck,
  CheckCircle2,
  Layers,
  ArrowRight,
  UserCog,
  Calendar,
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (menu: string) => void;
  onOpenSettings: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigate,
  onOpenSettings,
}) => {
  const [syncKey, setSyncKey] = useState(0);

  useEffect(() => {
    const handleSync = () => setSyncKey((k) => k + 1);
    window.addEventListener('sibks_data_synced', handleSync);
    return () => window.removeEventListener('sibks_data_synced', handleSync);
  }, []);

  const users = db.getUsers();
  const students = db.getStudents();
  const teachers = db.getTeachers();
  const classes = db.getClasses();
  const types = db.getQuestionnaireTypes();
  const questions = db.getQuestions();
  const responses = db.getResponses();
  const logs = db.getAuditLogs().slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-sm">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-purple-200 border border-white/20 mb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          Hak Akses Administrator Sistem Sekolah
        </span>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight">
          Pusat Kontrol & Manajemen Sistem SIBKS
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
          Kelola akun pengguna, reset kata sandi, status akun, master data siswa, rombel kelas, bank butir pertanyaan angket dinamis,
          penugasan instrumen ke rombel, dan audit log kepatuhan data.
        </p>

        <div className="mt-5 flex flex-wrap gap-2.5">
          <button
            onClick={() => onNavigate('master-user')}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <UserCog className="w-4 h-4" />
            <span>Kelola Akun Pengguna</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onNavigate('master-tahun-ajar')}
            className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 transition-colors cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>Tahun Pelajaran (CRUD T.A.)</span>
          </button>
          <button
            onClick={() => onNavigate('master-siswa')}
            className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 transition-colors cursor-pointer"
          >
            <Users className="w-4 h-4" />
            <span>Kelola Siswa</span>
          </button>
          <button
            onClick={() => onNavigate('master-pertanyaan')}
            className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Bank Pertanyaan Dinamis</span>
          </button>
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            <span>Pengaturan Ambang Batas</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Akun Pengguna"
          value={users.length}
          subtitle={`${users.filter((u) => u.is_active !== false).length} aktif`}
          icon={<UserCog className="w-5 h-5" />}
          color="purple"
        />
        <StatCard
          title="Total Siswa"
          value={students.length}
          subtitle="Terdaftar di database"
          icon={<Users className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Guru BK"
          value={teachers.length}
          subtitle="Konselor aktif"
          icon={<ShieldCheck className="w-5 h-5" />}
          color="purple"
        />
        <StatCard
          title="Rombel Kelas"
          value={classes.length}
          subtitle="Tingkat X, XI, XII"
          icon={<BookOpen className="w-5 h-5" />}
          color="emerald"
        />
        <StatCard
          title="Jenis Angket"
          value={types.length}
          subtitle="AKPD, BMW, Kelas X"
          icon={<FileSpreadsheet className="w-5 h-5" />}
          color="amber"
        />
        <StatCard
          title="Bank Butir Soal"
          value={questions.length}
          subtitle="Pertanyaan dinamis"
          icon={<HelpCircle className="w-5 h-5" />}
          color="slate"
        />
        <StatCard
          title="Total Respon"
          value={responses.length}
          subtitle="Jawaban tersimpan"
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="blue"
        />
      </div>

      {/* Grid: Quick Actions & Recent Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Module shortcuts */}
        <div className="lg:col-span-6 bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Modul Navigasi Utama Administrator</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <button
              onClick={() => onNavigate('master-siswa')}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30 text-left transition-all cursor-pointer flex items-center justify-between"
            >
              <div>
                <strong className="text-slate-900 block font-bold">Data Siswa</strong>
                <span className="text-[11px] text-slate-500">Kelola identitas & kelas</span>
              </div>
              <Users className="w-4 h-4 text-blue-600" />
            </button>

            <button
              onClick={() => onNavigate('master-kelas')}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30 text-left transition-all cursor-pointer flex items-center justify-between"
            >
              <div>
                <strong className="text-slate-900 block font-bold">Kelas & Jurusan</strong>
                <span className="text-[11px] text-slate-500">Program keahlian SMK</span>
              </div>
              <BookOpen className="w-4 h-4 text-blue-600" />
            </button>

            <button
              onClick={() => onNavigate('master-angket')}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30 text-left transition-all cursor-pointer flex items-center justify-between"
            >
              <div>
                <strong className="text-slate-900 block font-bold">Manajemen Angket</strong>
                <span className="text-[11px] text-slate-500">Tipe & penugasan rombel</span>
              </div>
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            </button>

            <button
              onClick={() => onNavigate('master-pertanyaan')}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30 text-left transition-all cursor-pointer flex items-center justify-between"
            >
              <div>
                <strong className="text-slate-900 block font-bold">Bank Butir Soal</strong>
                <span className="text-[11px] text-slate-500">Konfigurasi dinamis</span>
              </div>
              <HelpCircle className="w-4 h-4 text-blue-600" />
            </button>
          </div>
        </div>

        {/* Recent Audit Logs */}
        <div className="lg:col-span-6 bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Aktivitas Sistem Terakhir</h3>
            <button
              onClick={() => onNavigate('audit-log')}
              className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
            >
              Lihat Semua
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/60 flex items-start justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-800">{log.user_name}</span>
                    <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1.5 rounded">
                      {log.action}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{log.details}</p>
                </div>
                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
