import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { db } from '../../db/storage';
import { LogoSMK } from './LogoSMK';
import { LogoBK } from './LogoBK';
import {
  GraduationCap,
  ShieldCheck,
  UserCheck,
  LogOut,
  ChevronDown,
  School,
  Bell,
  Sliders,
  Check,
  FileSpreadsheet,
  Cloud,
} from 'lucide-react';
import { UserRole } from '../../types/database';

interface NavbarProps {
  onOpenSettings?: () => void;
  onOpenAuditLogs?: () => void;
  onOpenGoogleSheets?: () => void;
  activeMenu: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSettings, onOpenAuditLogs, onOpenGoogleSheets }) => {
  const { currentUser, role, switchRole, logout } = useAuth();
  const { showToast } = useNotification();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [settings, setSettings] = useState(() => db.getSettings());

  useEffect(() => {
    const handleSync = () => setSettings(db.getSettings());
    window.addEventListener('sibks_data_synced', handleSync);
    return () => window.removeEventListener('sibks_data_synced', handleSync);
  }, []);

  const handleRoleSelect = (targetRole: UserRole, targetId?: string) => {
    switchRole(targetRole, targetId);
    setRoleDropdownOpen(false);
    const roleLabels: Record<UserRole, string> = {
      ADMIN: 'Administrator',
      GURU_BK: 'Guru Bimbingan dan Konseling',
      SISWA: 'Siswa (Muhammad Rizky Pratama - XII RPL 1)',
    };
    showToast('info', 'Beralih Peran Pengguna', `Sekarang Anda bertindak sebagai: ${roleLabels[targetRole]}`);
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/90 shadow-2xs">
      <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center -space-x-2.5 shrink-0">
            <LogoSMK size={40} className="relative z-10 transition-transform hover:scale-105" />
            <LogoBK size={42} className="relative z-0 transition-transform hover:scale-105" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg">
                SIBKS
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                SMKN 1 Gunungguruh
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium truncate max-w-[200px] sm:max-w-xs">
              Layanan Bimbingan dan Konseling
            </p>
          </div>
        </div>

        {/* Center / Academic Year */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1 rounded-full text-xs text-slate-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>T.A. <strong>{settings.academic_year}</strong></span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500 font-normal">Sistem Penunjang Keputusan BK</span>
        </div>

        {/* Right actions: Role switcher & profile */}
        <div className="flex items-center gap-2.5">
          {/* Real-time Cloud Sync Badge */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
            title="Multi-Device Cloud Firestore Aktif & Tersinkronisasi"
          >
            <Cloud className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline">Cloud Sync</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          {/* Quick Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
              title="Ganti Peran (Role Switcher)"
            >
              {role === 'ADMIN' && <ShieldCheck className="w-4 h-4 text-purple-600" />}
              {role === 'GURU_BK' && <UserCheck className="w-4 h-4 text-blue-600" />}
              {role === 'SISWA' && <GraduationCap className="w-4 h-4 text-emerald-600" />}
              <span className="hidden md:inline">Peran:</span>
              <span className="text-slate-900">
                {role === 'ADMIN' ? 'Admin' : role === 'GURU_BK' ? 'Guru BK' : 'Siswa'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs">
                <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Beralih Hak Akses (RBAC)
                </div>

                <button
                  onClick={() => handleRoleSelect('ADMIN')}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    role === 'ADMIN' ? 'bg-purple-50/60 font-semibold text-purple-700' : 'text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <div>
                      <div className="font-semibold">Administrator</div>
                      <div className="text-[10px] text-slate-500">Kelola master data & sistem</div>
                    </div>
                  </div>
                  {role === 'ADMIN' && <Check className="w-4 h-4 text-purple-600" />}
                </button>

                <button
                  onClick={() => handleRoleSelect('GURU_BK')}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    role === 'GURU_BK' ? 'bg-blue-50/60 font-semibold text-blue-700' : 'text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="font-semibold">Guru Bimbingan Konseling</div>
                      <div className="text-[10px] text-slate-500">Analisis, prioritas, & konseling</div>
                    </div>
                  </div>
                  {role === 'GURU_BK' && <Check className="w-4 h-4 text-blue-600" />}
                </button>

                <div className="border-t border-slate-100 my-1"></div>

                {db.getStudents().length > 0 ? (
                  db.getStudents().slice(0, 5).map((std) => {
                    const cls = db.getClasses().find((c) => c.id === std.class_id);
                    return (
                      <button
                        key={std.id}
                        onClick={() => handleRoleSelect('SISWA', std.id)}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                          role === 'SISWA' && currentUser?.related_id === std.id ? 'bg-emerald-50 font-semibold text-emerald-700' : 'text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <GraduationCap className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div className="truncate">
                            <div className="font-semibold truncate">{std.name}</div>
                            <div className="text-[10px] text-slate-500 truncate">
                              NIS: {std.nis} • {cls ? cls.name : 'Siswa'}
                            </div>
                          </div>
                        </div>
                        {role === 'SISWA' && currentUser?.related_id === std.id && (
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="px-3 py-2 text-[11px] text-slate-400 italic">
                    Belum ada data siswa terdaftar. (Input di Master Siswa)
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Google Sheets Integration Trigger */}
          {onOpenGoogleSheets && (
            <button
              onClick={onOpenGoogleSheets}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-emerald-800 transition-colors cursor-pointer shadow-2xs"
              title="Integrasi Penyimpanan Google Sheets"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Google Sheets</span>
            </button>
          )}

          {/* Quick System Settings Trigger */}
          {role === 'ADMIN' && onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Pengaturan Sekolah & Ambang Batas Prioritas"
            >
              <Sliders className="w-4 h-4" />
            </button>
          )}

          {/* User info */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs uppercase">
              {currentUser?.name.charAt(0) || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[130px]">
                {currentUser?.name}
              </p>
              <p className="text-[10px] text-slate-400 leading-tight">
                {currentUser?.role === 'ADMIN'
                  ? 'Administrator'
                  : currentUser?.role === 'GURU_BK'
                  ? 'Guru BK'
                  : 'Siswa'}
              </p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={() => {
              logout();
              showToast('info', 'Keluar', 'Anda telah keluar dari akun.');
            }}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Keluar ke Halaman Login"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
