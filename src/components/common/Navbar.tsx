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

export const Navbar: React.FC<NavbarProps> = ({ onOpenSettings, onOpenGoogleSheets }) => {
  const { currentUser, role, logout } = useAuth();
  const { showToast } = useNotification();
  const [settings, setSettings] = useState(() => db.getSettings());

  useEffect(() => {
    const handleSync = () => setSettings(db.getSettings());
    window.addEventListener('sibks_data_synced', handleSync);
    return () => window.removeEventListener('sibks_data_synced', handleSync);
  }, []);

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

        {/* Right actions: Profile, Cloud status, Settings & Logout */}
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

          {/* User Role Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold bg-slate-50 border-slate-200 text-slate-700">
            {role === 'ADMIN' && <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />}
            {role === 'GURU_BK' && <UserCheck className="w-3.5 h-3.5 text-blue-600" />}
            {role === 'SISWA' && <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />}
            <span>
              {role === 'ADMIN' ? 'Administrator' : role === 'GURU_BK' ? 'Guru BK' : 'Siswa'}
            </span>
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
