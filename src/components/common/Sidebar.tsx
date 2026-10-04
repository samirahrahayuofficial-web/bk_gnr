import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  FileSpreadsheet,
  HelpCircle,
  BarChart3,
  Compass,
  FileCheck2,
  Lock,
  ListTodo,
  FileText,
  Settings,
  History,
  ClipboardList,
  Sparkles,
  Layers,
  CalendarDays,
  UserCog,
} from 'lucide-react';

interface SidebarProps {
  activeMenu: string;
  onSelectMenu: (menu: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeMenu,
  onSelectMenu,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { role, currentStudent } = useAuth();

  const handleItemClick = (menu: string) => {
    onSelectMenu(menu);
    onCloseMobile();
  };

  const navItemClass = (menu: string) => {
    const isActive = activeMenu === menu;
    return `w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
      isActive
        ? 'bg-blue-700 text-white shadow-xs'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
    }`;
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      <aside
        className={`fixed md:sticky top-0 md:top-14 h-[calc(100vh-3.5rem)] z-40 w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* Peran Info Pill */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Akses Pengguna Aktif
            </span>
            <div className="text-xs font-bold text-slate-800 mt-0.5 flex items-center justify-between">
              <span>
                {role === 'ADMIN'
                  ? 'Administrator'
                  : role === 'GURU_BK'
                  ? 'Guru Bimbingan Konseling'
                  : 'Siswa SMK'}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                {role}
              </span>
            </div>
            {role === 'SISWA' && currentStudent && (
              <p className="text-[11px] text-slate-500 mt-1 truncate">
                {currentStudent.name} ({currentStudent.nis})
              </p>
            )}
          </div>

          {/* Role: ADMIN Menus */}
          {role === 'ADMIN' && (
            <div className="space-y-4">
              <div>
                <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Utama
                </p>
                <button
                  onClick={() => handleItemClick('admin-dashboard')}
                  className={navItemClass('admin-dashboard')}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard Admin</span>
                </button>
              </div>

              <div>
                <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Master Data
                </p>
                <div className="space-y-1">
                  <button
                    onClick={() => handleItemClick('master-user')}
                    className={navItemClass('master-user')}
                  >
                    <UserCog className="w-4 h-4 text-purple-600" />
                    <span>Manajemen Pengguna</span>
                  </button>
                  <button
                    onClick={() => handleItemClick('master-tahun-ajar')}
                    className={navItemClass('master-tahun-ajar')}
                  >
                    <CalendarDays className="w-4 h-4 text-emerald-600" />
                    <span>Tahun Pelajaran (T.A.)</span>
                  </button>
                  <button
                    onClick={() => handleItemClick('master-siswa')}
                    className={navItemClass('master-siswa')}
                  >
                    <Users className="w-4 h-4" />
                    <span>Data Siswa</span>
                  </button>
                  <button
                    onClick={() => handleItemClick('master-kelas')}
                    className={navItemClass('master-kelas')}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Kelas & Program Keahlian</span>
                  </button>
                </div>
              </div>

              <div>
                <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Manajemen Angket
                </p>
                <div className="space-y-1">
                  <button
                    onClick={() => handleItemClick('master-angket')}
                    className={navItemClass('master-angket')}
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Jenis & Kategori Angket</span>
                  </button>
                  <button
                    onClick={() => handleItemClick('master-pertanyaan')}
                    className={navItemClass('master-pertanyaan')}
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>Bank Pertanyaan & Opsi</span>
                  </button>
                  <button
                    onClick={() => handleItemClick('penugasan-angket')}
                    className={navItemClass('penugasan-angket')}
                  >
                    <Layers className="w-4 h-4" />
                    <span>Penugasan ke Kelas</span>
                  </button>
                </div>
              </div>

              <div>
                <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Sistem & Audit
                </p>
                <div className="space-y-1">
                  <button
                    onClick={() => handleItemClick('google-sheets')}
                    className={navItemClass('google-sheets')}
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Penyimpanan Google Sheets</span>
                  </button>
                  <button
                    onClick={() => handleItemClick('pengaturan-sistem')}
                    className={navItemClass('pengaturan-sistem')}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Pengaturan & Ambang Batas</span>
                  </button>
                  <button
                    onClick={() => handleItemClick('audit-log')}
                    className={navItemClass('audit-log')}
                  >
                    <History className="w-4 h-4" />
                    <span>Audit Log Aktivitas</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Role: GURU BK Menus */}
          {role === 'GURU_BK' && (
            <div className="space-y-4">
              <div>
                <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Dashboard
                </p>
                <button
                  onClick={() => handleItemClick('bk-dashboard')}
                  className={navItemClass('bk-dashboard')}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard Guru BK</span>
                </button>
              </div>

              <div>
                <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Asesmen & Analisis
                </p>
                <div className="space-y-1">
                  <button
                    onClick={() => handleItemClick('bk-siswa')}
                    className={navItemClass('bk-siswa')}
                  >
                    <Users className="w-4 h-4" />
                    <span>Data & Analisis Siswa</span>
                  </button>
                  <button
                    onClick={() => handleItemClick('bk-rekap-kelas')}
                    className={navItemClass('bk-rekap-kelas')}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Rekapitulasi Kelas</span>
                  </button>
                  <button
                    onClick={() => handleItemClick('bk-rekap-sekolah')}
                    className={navItemClass('bk-rekap-sekolah')}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Rekap Sekolah & Top Kebutuhan</span>
                  </button>
                  <button
                    onClick={() => handleItemClick('bk-pemetaan-karier')}
                    className={navItemClass('bk-pemetaan-karier')}
                  >
                    <Compass className="w-4 h-4" />
                    <span>Pemetaan Karier XII (BMW)</span>
                  </button>
                </div>
              </div>

              <div>
                <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Layanan & Bimbingan
                </p>
                <div className="space-y-1">
                  <button
                    onClick={() => handleItemClick('bk-tindak-lanjut')}
                    className={navItemClass('bk-tindak-lanjut')}
                  >
                    <ListTodo className="w-4 h-4" />
                    <span>Tindak Lanjut Layanan BK</span>
                  </button>
                  <button
                    onClick={() => handleItemClick('bk-catatan-konseling')}
                    className={navItemClass('bk-catatan-konseling')}
                  >
                    <Lock className="w-4 h-4" />
                    <span>Catatan Konseling (Rahasia)</span>
                  </button>
                </div>
              </div>

              <div>
                <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Laporan & Cloud Storage
                </p>
                <div className="space-y-1">
                  <button
                    onClick={() => handleItemClick('google-sheets')}
                    className={navItemClass('google-sheets')}
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Penyimpanan Google Sheets</span>
                  </button>
                  <button
                    onClick={() => handleItemClick('bk-laporan')}
                    className={navItemClass('bk-laporan')}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Export Excel & Cetak PDF</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Role: SISWA Menus */}
          {role === 'SISWA' && (
            <div className="space-y-4">
              <div>
                <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Beranda Siswa
                </p>
                <button
                  onClick={() => handleItemClick('siswa-dashboard')}
                  className={navItemClass('siswa-dashboard')}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard Saya</span>
                </button>
              </div>

              <div>
                <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Angket BK
                </p>
                <div className="space-y-1">
                  <button
                    onClick={() => handleItemClick('siswa-angket-daftar')}
                    className={navItemClass('siswa-angket-daftar')}
                  >
                    <ClipboardList className="w-4 h-4" />
                    <span>Daftar Angket</span>
                  </button>
                  <button
                    onClick={() => handleItemClick('siswa-riwayat')}
                    className={navItemClass('siswa-riwayat')}
                  >
                    <FileCheck2 className="w-4 h-4" />
                    <span>Riwayat & Hasil Angket</span>
                  </button>
                </div>
              </div>

              <div>
                <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Akun
                </p>
                <button
                  onClick={() => handleItemClick('siswa-profil')}
                  className={navItemClass('siswa-profil')}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Profil Siswa</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-[10px] text-slate-400 leading-relaxed">
          <p className="font-semibold text-slate-600">Decision Support System</p>
          <p>Membantu Guru BK memetakan kebutuhan layanan & minat karier siswa.</p>
        </div>
      </aside>
    </>
  );
};
