import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../db/storage';
import { GraduationCap, Phone, MapPin, ShieldCheck, Mail, UserCheck } from 'lucide-react';

export const StudentProfile: React.FC = () => {
  const { currentStudent } = useAuth();
  if (!currentStudent) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-8 text-center max-w-lg mx-auto my-12 space-y-3">
        <GraduationCap className="w-10 h-10 text-slate-400 mx-auto" />
        <h3 className="font-bold text-slate-800 text-sm">Data Profil Siswa Belum Tersedia</h3>
        <p className="text-xs text-slate-500">
          Biodata siswa Anda belum diinput ke database. Silakan hubungi Administrator untuk proses input data baru.
        </p>
      </div>
    );
  }

  const studentClass = db.getClasses().find((c) => c.id === currentStudent.class_id);
  const program = studentClass ? db.getPrograms().find((p) => p.id === studentClass.study_program_id) : undefined;
  const settings = db.getSettings();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white font-extrabold text-3xl flex items-center justify-center shadow-md">
          {currentStudent.name.charAt(0)}
        </div>

        <div className="space-y-1">
          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-xs uppercase">
            Siswa SMK Terdaftar
          </span>
          <h2 className="text-xl font-extrabold text-slate-900">{currentStudent.name}</h2>
          <p className="text-xs text-slate-500">
            NIS: {currentStudent.nis} • NISN: {currentStudent.nisn}
          </p>
        </div>
      </div>

      {/* Details Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4 text-xs">
        <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
          Informasi Akademik & Pribadi
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[11px]">Rombongan Belajar (Kelas)</span>
            <span className="font-bold text-slate-800 text-sm">{studentClass?.name || '-'}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[11px]">Program Keahlian</span>
            <span className="font-bold text-slate-800 text-sm">{program?.name || '-'}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[11px]">Jenis Kelamin</span>
            <span className="font-bold text-slate-800 text-sm">
              {currentStudent.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[11px]">No. Telepon / WhatsApp Siswa</span>
            <span className="font-bold text-slate-800 text-sm">{currentStudent.phone || '-'}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[11px]">Nama Orang Tua / Wali</span>
            <span className="font-bold text-slate-800 text-sm">{currentStudent.parent_name || '-'}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[11px]">No. Telepon Orang Tua / Wali</span>
            <span className="font-bold text-slate-800 text-sm">{currentStudent.parent_phone || '-'}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl sm:col-span-2">
            <span className="text-slate-400 block text-[11px]">Alamat Domisili Siswa</span>
            <span className="font-bold text-slate-800 text-sm">{currentStudent.address || '-'}</span>
          </div>
        </div>
      </div>

      {/* Confidentiality Commitment */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-5 text-xs text-blue-950 flex items-start gap-3 leading-relaxed">
        <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-blue-900 text-sm">Jaminan Kerahasiaan Data Bimbingan & Konseling</h4>
          <p className="mt-1 text-slate-700">
            Seluruh jawaban angket, hasil pemetaan kebutuhan, serta sesi bimbingan Anda dilindungi
            oleh asas kerahasiaan Guru BK di {settings.school_name}. Data ini digunakan semata-mata
            untuk membantu pengembangan potensi diri, perencanaan karier, dan pendampingan belajar Anda.
          </p>
        </div>
      </div>
    </div>
  );
};
