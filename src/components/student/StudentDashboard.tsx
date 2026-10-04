import React from 'react';
import { db } from '../../db/storage';
import { useAuth } from '../../context/AuthContext';
import { QuestionnaireService } from '../../services/QuestionnaireService';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  BookOpen,
  Calendar,
  AlertCircle,
  GraduationCap,
} from 'lucide-react';
import { StatCard } from '../common/StatCard';
import { LogoSMK } from '../common/LogoSMK';
import { LogoBK } from '../common/LogoBK';

interface StudentDashboardProps {
  onStartQuestionnaire: (typeId: string) => void;
  onViewHistory: () => void;
  onViewProfile: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onStartQuestionnaire,
  onViewHistory,
  onViewProfile,
}) => {
  const { currentStudent } = useAuth();

  if (!currentStudent) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-8 text-center max-w-lg mx-auto my-12 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-slate-800">
          Data Siswa Belum Terdaftar
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Akun siswa Anda telah aktif, namun data profil, NIS, atau kelas Anda belum dimasukkan ke database (saat ini sistem sedang disiapkan untuk input ulang data siswa dan jurusan oleh Administrator).
        </p>
        <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-600 border border-slate-200 text-left space-y-1">
          <p className="font-semibold text-slate-700">Langkah selanjutnya:</p>
          <p>1. Hubungi Guru BK atau Admin Sekolah untuk mendaftarkan NIS dan kelas Anda.</p>
          <p>2. Atau beralih akun melalui tombol keluar / role switcher di pojok kanan atas.</p>
        </div>
      </div>
    );
  }

  const studentClass = db.getClasses().find((c) => c.id === currentStudent.class_id);
  const studyProgram = studentClass ? db.getPrograms().find((p) => p.id === studentClass.study_program_id) : undefined;
  const assignedList = QuestionnaireService.getStudentQuestionnaires(currentStudent.id);

  const completedCount = assignedList.filter((a) => a.status === 'SUBMITTED').length;
  const inProgressCount = assignedList.filter((a) => a.status === 'IN_PROGRESS').length;
  const pendingCount = assignedList.filter((a) => a.status === 'NOT_STARTED').length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-800 text-white p-6 sm:p-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-blue-200 border border-white/20 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Portal Asesmen Digital Siswa SMK • Tingkat Kelas {studentClass?.grade || 'X'}
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Halo, {currentStudent.name}!
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 mt-2 leading-relaxed">
            Selamat datang di Sistem Informasi Bimbingan dan Konseling. Berdasarkan tingkat rombongan belajar Anda ({studentClass?.name || 'SMK'}), berikut instrumen angket resmi yang ditugaskan untuk Anda isi secara digital.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-blue-100">
            <span>NIS: <strong>{currentStudent.nis}</strong></span>
            <span>•</span>
            <span>Kelas: <strong>{studentClass?.name || '-'}</strong> ({studyProgram?.code || '-'})</span>
            <span>•</span>
            <span>Tingkat: <strong className="bg-white/20 px-2 py-0.5 rounded text-white">Kelas {studentClass?.grade || 'X'}</strong></span>
          </div>
        </div>

        {/* Logos Showcase */}
        <div className="hidden md:flex items-center gap-3 p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs shrink-0 relative z-10">
          <LogoSMK size={64} className="drop-shadow-md hover:scale-105 transition-transform" />
          <div className="w-px h-12 bg-white/20" />
          <LogoBK size={68} className="drop-shadow-md hover:scale-105 transition-transform" />
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Angket Ditugaskan"
          value={assignedList.length}
          subtitle="Total instrumen yang perlu diisi"
          icon={<ClipboardList className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Sudah Selesai"
          value={completedCount}
          subtitle="Berhasil terkirim ke Guru BK"
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="emerald"
        />
        <StatCard
          title="Belum Selesai"
          value={pendingCount + inProgressCount}
          subtitle={`${inProgressCount} sedang dikerjakan, ${pendingCount} belum`}
          icon={<Clock className="w-5 h-5" />}
          color="amber"
        />
      </div>

      {/* Questionnaire List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Daftar Angket Bimbingan & Konseling
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih salah satu angket di bawah ini untuk memulai atau melanjutkan pengisian.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignedList.length === 0 ? (
            <div className="col-span-2 p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 space-y-2">
              <ClipboardList className="w-8 h-8 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-700">Belum Ada Angket yang Ditugaskan</h4>
              <p className="text-xs text-slate-400">
                Belum ada instrumen angket aktif untuk tingkat rombel kelas Anda (Kelas {studentClass?.grade || 'X'}). Silakan hubungi Guru BK Anda.
              </p>
            </div>
          ) : (
            assignedList.map((item) => {
              const isCompleted = item.status === 'SUBMITTED';
              const isInProgress = item.status === 'IN_PROGRESS';

              return (
                <div
                  key={item.type.id}
                  className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-300 transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                        Tingkat: {item.type.target_grade === 'ALL' ? 'Semua Tingkat' : `Kelas ${item.type.target_grade}`}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isInProgress
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {isCompleted
                          ? 'Sudah Terkirim'
                          : isInProgress
                          ? 'Sedang Dikerjakan'
                          : 'Belum Diisi'}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-sm sm:text-base text-slate-900 mt-2">
                      {item.type.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {item.type.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
                    {/* Progress bar */}
                    <div>
                      <div className="flex justify-between items-center text-[11px] font-medium text-slate-500 mb-1">
                        <span>Progres Pengisian:</span>
                        <span className="font-bold text-slate-800">
                          {item.answeredCount} / {item.totalQuestions} Butir ({item.progressPct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCompleted ? 'bg-emerald-500' : 'bg-blue-600'
                          }`}
                          style={{ width: `${item.progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="pt-1 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        Total: {item.type.total_questions} butir soal
                      </span>

                      {isCompleted ? (
                        <button
                          onClick={onViewHistory}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs cursor-pointer transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Lihat Status</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onStartQuestionnaire(item.type.id)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
                        >
                          <span>{isInProgress ? 'Lanjutkan Mengisi' : 'Mulai Mengisi'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
