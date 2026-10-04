import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { db } from '../../db/storage';
import { QuestionnaireService } from '../../services/QuestionnaireService';
import { Student, ClassRoom, StudyProgram, QuestionnaireType } from '../../types/database';
import {
  Lock,
  User as UserIcon,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  KeyRound,
  AlertCircle,
  HelpCircle,
  GraduationCap,
  CheckCircle2,
  BookOpen,
  ClipboardList,
  Search,
  ArrowLeft,
  School,
} from 'lucide-react';
import { LogoSMK } from './LogoSMK';
import { LogoBK } from './LogoBK';

export const LoginPage: React.FC = () => {
  const { login, loginStudentByNis } = useAuth();
  const { showToast } = useNotification();
  const settings = db.getSettings();

  // Mode: 'STUDENT_PORTAL' (no password, just NIS) or 'STAFF_LOGIN' (Admin & Guru BK)
  const [activeTab, setActiveTab] = useState<'STUDENT_PORTAL' | 'STAFF_LOGIN'>('STUDENT_PORTAL');

  // Student flow state
  const [studentStep, setStudentStep] = useState<'INPUT_NIS' | 'CONFIRM_PROFILE'>('INPUT_NIS');
  const [studentNisInput, setStudentNisInput] = useState('');
  const [foundStudent, setFoundStudent] = useState<Student | null>(null);
  const [studentClass, setStudentClass] = useState<ClassRoom | null>(null);
  const [studentProgram, setStudentProgram] = useState<StudyProgram | null>(null);
  const [studentQuestionnaires, setStudentQuestionnaires] = useState<QuestionnaireType[]>([]);
  const [studentError, setStudentError] = useState('');
  const [isSearchingStudent, setIsSearchingStudent] = useState(false);

  // Staff login state
  const [staffUsername, setStaffUsername] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [staffError, setStaffError] = useState('');
  const [isStaffLoading, setIsStaffLoading] = useState(false);

  // Student Step 1: Search student by NIS
  const handleSearchStudentNis = (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError('');

    const clean = studentNisInput.trim().toLowerCase();
    if (!clean) {
      setStudentError('Silakan masukkan NIS Anda terlebih dahulu.');
      return;
    }

    setIsSearchingStudent(true);

    try {
      const allStudents = db.getStudents();
      const student = allStudents.find(
        (s) => s.nis.toLowerCase() === clean || s.nisn.toLowerCase() === clean
      );

      if (!student) {
        if (allStudents.length === 0) {
          setStudentError(
            `Data siswa belum terdaftar di database sistem. Hubungi Administrator untuk menginput data siswa dan rombel kelas.`
          );
        } else {
          setStudentError(
            `Siswa dengan NIS "${studentNisInput.trim()}" tidak ditemukan. Pastikan NIS Anda sudah benar atau hubungi Guru BK / Admin Sekolah.`
          );
        }
        return;
      }

      // Resolve class and study program
      const cls = db.getClasses().find((c) => c.id === student.class_id) || null;
      const prog = cls ? db.getPrograms().find((p) => p.id === cls.study_program_id) || null : null;

      // Resolve questionnaires for their grade
      const grade = cls?.grade || 'X';
      const qTypes = QuestionnaireService.getQuestionnairesForGrade(grade);

      setFoundStudent(student);
      setStudentClass(cls);
      setStudentProgram(prog);
      setStudentQuestionnaires(qTypes);
      setStudentStep('CONFIRM_PROFILE');
    } finally {
      setIsSearchingStudent(false);
    }
  };

  // Student Step 2: Confirm profile and proceed to fill questionnaires
  const handleConfirmStudentEntry = () => {
    if (!foundStudent) return;

    const result = loginStudentByNis(foundStudent.nis);
    if (result.success) {
      showToast(
        'success',
        'Identitas Terverifikasi',
        `Selamat datang, ${foundStudent.name}! Silakan isi instrumen angket Anda.`
      );
    } else {
      setStudentError(result.message || 'Gagal memproses akses siswa.');
      setStudentStep('INPUT_NIS');
      showToast('error', 'Akses Ditolak', result.message || 'Gagal memproses akses siswa.');
    }
  };

  const handleResetStudentSearch = () => {
    setStudentStep('INPUT_NIS');
    setFoundStudent(null);
    setStudentClass(null);
    setStudentProgram(null);
    setStudentQuestionnaires([]);
    setStudentError('');
  };

  // Staff login handler
  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError('');

    const cleanUser = staffUsername.trim();
    const cleanPass = staffPassword.trim();

    if (!cleanUser) {
      setStaffError('Silakan masukkan username atau NIP Anda.');
      return;
    }
    if (!cleanPass) {
      setStaffError('Silakan masukkan kata sandi (password).');
      return;
    }

    setIsStaffLoading(true);

    try {
      const result = login(cleanUser, cleanPass);
      if (result.success) {
        showToast('success', 'Berhasil Masuk', result.message || 'Selamat datang di SIBKS!');
      } else {
        setStaffError(result.message || 'Username atau kata sandi tidak sesuai.');
        showToast('error', 'Login Gagal', result.message || 'Kredensial tidak valid.');
      }
    } finally {
      setIsStaffLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 flex flex-col justify-between p-4 sm:p-6 lg:p-8 selection:bg-blue-600 selection:text-white">
      {/* Top Branding Bar */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between py-2 text-white">
        <div className="flex items-center gap-3">
          <div className="flex items-center -space-x-2 shrink-0">
            <LogoSMK size={38} className="relative z-10" />
            <LogoBK size={40} className="relative z-0" />
          </div>
          <div>
            <h1 className="font-extrabold text-base sm:text-lg tracking-tight">SIBKS</h1>
            <p className="text-[11px] text-blue-200">SMK Negeri 1 Gunungguruh • Bimbingan & Konseling</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs border border-white/10">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>T.A. {settings.academic_year}</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-5xl w-full mx-auto my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-6">
        {/* Left Side: System Info & Description */}
        <div className="lg:col-span-5 text-white space-y-5">
          {/* Logo Showcase with Transparent Background */}
          <div className="inline-flex items-center gap-4 p-3.5 rounded-2xl bg-white/5 border border-white/15 backdrop-blur-xs">
            <LogoSMK size={68} className="drop-shadow-md transition-transform hover:scale-105" />
            <div className="w-px h-12 bg-white/20" />
            <LogoBK size={72} className="drop-shadow-md transition-transform hover:scale-105" />
            <div className="text-left text-xs leading-tight pr-2">
              <span className="font-black text-amber-300 block text-xs tracking-wide">SMKN 1 GUNUNGGURUH</span>
              <span className="text-[11px] text-blue-200 font-medium mt-0.5 block">Layanan Bimbingan & Konseling</span>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Portal Siswa & Guru BK • Tahun Pelajaran {settings.academic_year}</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Instrumen Asesmen Digital Siswa
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {settings.school_name}
            </p>
          </div>

          <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed">
            Siswa dapat langsung memasukkan NIS tanpa kata sandi untuk melihat profil dan mengisi instrumen angket resmi (AKPD Kelas X, AKPD Kelas XI, atau Minat Karier BMW Kelas XII) sesuai rombongan belajarnya.
          </p>

          <div className="grid grid-cols-3 gap-2.5 pt-2">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
              <span className="text-base sm:text-lg font-bold text-amber-300">Kelas X</span>
              <p className="text-[10px] text-slate-400 mt-0.5">AKPD Kelas X</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
              <span className="text-base sm:text-lg font-bold text-blue-300">Kelas XI</span>
              <p className="text-[10px] text-slate-400 mt-0.5">AKPD Kelas XI</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
              <span className="text-base sm:text-lg font-bold text-emerald-300">Kelas XII</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Karier BMW</p>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Portal Card */}
        <div className="lg:col-span-7 bg-white rounded-2xl shadow-2xl p-6 sm:p-7 border border-slate-200 text-slate-800 space-y-5">
          {/* Top Switcher Tabs: Siswa vs Guru/Admin */}
          <div className="flex rounded-xl bg-slate-100 p-1 gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('STUDENT_PORTAL');
                setStudentError('');
              }}
              className={`flex-1 py-2.5 px-3 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'STUDENT_PORTAL'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Portal Siswa (Isi NIS)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('STAFF_LOGIN');
                setStaffError('');
              }}
              className={`flex-1 py-2.5 px-3 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'STAFF_LOGIN'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Login Guru BK / Admin</span>
            </button>
          </div>

          {/* ================= TAB 1: PORTAL SISWA (NO LOGIN, JUST NIS -> NEXT -> PROFILE -> FILL) ================= */}
          {activeTab === 'STUDENT_PORTAL' && (
            <div className="space-y-4">
              {/* STEP 1: Input NIS */}
              {studentStep === 'INPUT_NIS' && (
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 mb-1.5">
                      <GraduationCap className="w-3.5 h-3.5" />
                      Langkah 1: Masukkan Nomor Induk Siswa
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                      Cek Identitas & Mulai Angket
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Siswa tidak memerlukan kata sandi. Cukup ketik NIS Anda lalu klik <strong>Lanjutkan</strong>.
                    </p>
                  </div>

                  {studentError && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="leading-snug">{studentError}</div>
                    </div>
                  )}

                  <form onSubmit={handleSearchStudentNis} className="space-y-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5 text-xs">
                        Nomor Induk Siswa (NIS) / NISN <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={studentNisInput}
                          onChange={(e) => setStudentNisInput(e.target.value)}
                          placeholder="Masukkan nomor NIS Anda (contoh: 22231001)"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-xs font-mono font-semibold focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                          autoFocus
                          required
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        * Hubungi wali kelas atau Guru BK jika Anda lupa nomor NIS Anda.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isSearchingStudent}
                      className="w-full py-3 px-4 bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                    >
                      <span>{isSearchingStudent ? 'Mencari Data Siswa...' : 'Lanjutkan (Next)'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}

              {/* STEP 2: Profil Siswa Muncul -> Tampilkan Angket Sesuai Kelasnya */}
              {studentStep === 'CONFIRM_PROFILE' && foundStudent && (
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Langkah 2: Data Siswa Ditemukan
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                      Konfirmasi Identitas Siswa
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pastikan informasi profil di bawah ini benar milik Anda sebelum mengisi angket.
                    </p>
                  </div>

                  {/* Profile Card */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/40 border border-blue-200/90 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
                        <GraduationCap className="w-7 h-7" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                          Peserta Didik Terverifikasi
                        </span>
                        <h4 className="text-base sm:text-lg font-black text-slate-900 truncate">
                          {foundStudent.name}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-600">
                          <span className="font-mono font-semibold">NIS: {foundStudent.nis}</span>
                          {foundStudent.nisn && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-slate-500">NISN: {foundStudent.nisn}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-blue-200/70 text-xs">
                      <div className="bg-white p-2.5 rounded-xl border border-blue-100 shadow-2xs">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">Kelas & Rombel</span>
                        <strong className="text-slate-900 font-bold text-xs mt-0.5 block truncate">
                          {studentClass ? studentClass.name : 'Belum ditentukan'}
                        </strong>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-blue-100 shadow-2xs">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">Tingkat Kelas</span>
                        <strong className="text-blue-700 font-bold text-xs mt-0.5 block">
                          Kelas {studentClass?.grade || 'X'}
                        </strong>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-blue-100 shadow-2xs col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">Jurusan / Keahlian</span>
                        <strong className="text-slate-900 font-bold text-xs mt-0.5 block truncate">
                          {studentProgram ? studentProgram.name : 'Umum'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Questionnaire Target List According to Class */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <ClipboardList className="w-4 h-4 text-emerald-600" />
                        <span>Angket yang Ditampilkan Sesuai Kelas Anda:</span>
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Kelas {studentClass?.grade || 'X'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {studentQuestionnaires.length > 0 ? (
                        studentQuestionnaires.map((qt) => (
                          <div
                            key={qt.id}
                            className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3 text-xs"
                          >
                            <div className="space-y-0.5">
                              <h5 className="font-extrabold text-slate-900">{qt.title}</h5>
                              <p className="text-[11px] text-slate-500 leading-snug">{qt.description}</p>
                            </div>
                            <span className="shrink-0 px-2 py-1 rounded-lg bg-blue-100 text-blue-800 text-[10px] font-bold">
                              {qt.total_questions} Soal
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                          Belum ada instrumen angket yang aktif untuk tingkat kelas Anda.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleResetStudentSearch}
                      className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Bukan Saya / Ganti NIS</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleConfirmStudentEntry}
                      className="flex-1 py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Benar, Mulai Isi Angket</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 2: LOGIN GURU BK & ADMINISTRATOR ================= */}
          {activeTab === 'STAFF_LOGIN' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 mb-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                  Khusus Guru BK & Administrator
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Masuk ke Portal Staf Sekolah
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gunakan kredensial akun terdaftar untuk analisis, konseling, dan manajemen master data.
                </p>
              </div>

              {staffError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{staffError}</span>
                </div>
              )}

              <form onSubmit={handleStaffLogin} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Username / NIP <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={staffUsername}
                      onChange={(e) => setStaffUsername(e.target.value)}
                      placeholder="administrator, sitirahmawati, dll"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kata Sandi (Password) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showStaffPassword ? 'text' : 'password'}
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      placeholder="Masukkan kata sandi"
                      className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowStaffPassword(!showStaffPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      {showStaffPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isStaffLoading}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  <span>{isStaffLoading ? 'Memverifikasi...' : 'Masuk ke Sistem SIBKS'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-6xl w-full mx-auto text-center text-[11px] text-slate-400 py-2 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>© {new Date().getFullYear()} {settings.school_name} • Layanan Bimbingan dan Konseling</span>
        <span className="text-[10px] bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
          Tahun Pelajaran Aktif: <strong>{settings.academic_year}</strong>
        </span>
      </div>
    </div>
  );
};
