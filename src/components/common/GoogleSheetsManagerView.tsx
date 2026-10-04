import React, { useState, useEffect } from 'react';
import {
  googleSignIn,
  googleLogout,
  getGoogleAccessToken,
  initGoogleAuth,
  auth,
} from '../../services/GoogleAuthService';
import { GoogleSheetsService, SheetsSyncResult } from '../../services/GoogleSheetsService';
import { useNotification } from '../../context/NotificationContext';
import { db } from '../../db/storage';
import {
  FileSpreadsheet,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  Layers,
  ArrowDownToLine,
  Database,
  Calendar,
  LogOut,
  Users,
  Award,
  ListTodo,
  History,
  ShieldCheck,
} from 'lucide-react';
import { User } from 'firebase/auth';

export const GoogleSheetsManagerView: React.FC = () => {
  const { showToast } = useNotification();
  const [googleUser, setGoogleUser] = useState<User | null>(auth.currentUser);
  const [hasToken, setHasToken] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => GoogleSheetsService.getLastSyncTime());
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(() => GoogleSheetsService.getSavedSpreadsheetId());
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(() => GoogleSheetsService.getSavedSpreadsheetUrl());
  const [spreadsheetName, setSpreadsheetName] = useState<string | null>(() => GoogleSheetsService.getSavedSpreadsheetName());

  // Explicit confirmation modal for writing/overwriting Google Sheets data
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (user, token) => {
        setGoogleUser(user);
        setHasToken(!!token);
      },
      () => {
        setGoogleUser(auth.currentUser);
        setHasToken(false);
      }
    );

    getGoogleAccessToken().then((token) => {
      setHasToken(!!token);
    });

    return () => unsubscribe();
  }, []);

  const totalStudents = db.getStudents().length;
  const totalResponses = db.getResponses().filter((r) => r.status === 'SUBMITTED').length;
  const totalFollowUps = db.getFollowUps().length;
  const totalLogs = db.getAuditLogs().length;

  const handleGoogleConnect = async () => {
    setIsAuthenticating(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setHasToken(true);
        showToast(
          'success',
          'Terhubung dengan Google',
          `Akun ${res.user.email} berhasil terhubung dengan izin Google Sheets.`
        );
      }
    } catch (err: any) {
      showToast('error', 'Gagal Terhubung', err.message || 'Otorisasi Google dibatalkan.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGoogleDisconnect = async () => {
    await googleLogout();
    setGoogleUser(null);
    setHasToken(false);
    showToast('info', 'Terputus', 'Koneksi akun Google berhasil diputuskan.');
  };

  const handleExecuteSync = async () => {
    setShowConfirmModal(false);
    setIsSyncing(true);

    try {
      let token = await getGoogleAccessToken();
      if (!token) {
        const cred = await googleSignIn();
        token = cred?.accessToken || null;
      }

      if (!token) {
        throw new Error('Akses token Google tidak tersedia. Silakan hubungkan akun Google Anda.');
      }

      const result: SheetsSyncResult = await GoogleSheetsService.syncAllData(token, spreadsheetId || undefined);

      setSpreadsheetId(result.spreadsheetId);
      setSpreadsheetUrl(result.spreadsheetUrl);
      setLastSyncTime(result.timestamp);
      setSpreadsheetName(GoogleSheetsService.getSavedSpreadsheetName());

      showToast(
        'success',
        'Sinkronisasi Berhasil!',
        `Telah menyinkronkan ${result.totalRowsSynced} baris data ke 5 tab Google Sheets.`
      );
    } catch (err: any) {
      console.error(err);
      showToast('error', 'Sinkronisasi Gagal', err.message || 'Terjadi kesalahan saat menulis ke Google Sheets.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullData = async () => {
    if (!spreadsheetId) {
      showToast('warning', 'Peringatan', 'Belum ada Google Spreadsheet yang terhubung.');
      return;
    }

    setIsPulling(true);
    try {
      const token = await getGoogleAccessToken();
      if (!token) {
        throw new Error('Akses token Google tidak tersedia. Silakan sambungkan akun Google.');
      }

      const count = await GoogleSheetsService.pullStudentsFromSheet(token, spreadsheetId);
      showToast('success', 'Data Diimpor', `Berhasil memuat/memperbarui ${count} data siswa dari Google Sheets.`);
    } catch (err: any) {
      showToast('error', 'Impor Gagal', err.message || 'Gagal memuat data dari spreadsheet.');
    } finally {
      setIsPulling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white p-6 sm:p-8 shadow-sm">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-emerald-200 border border-white/20 mb-3">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
            Penyimpanan Cloud Terpadu Google Sheets
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Integrasi & Penyimpanan Data ke Google Sheets
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 mt-2 leading-relaxed">
            Hubungkan data master siswa, hasil angket AKPD, pemetaan karier BMW, serta rencana tindak lanjut
            layanan BK langsung ke akun Google Spreadsheet Anda secara terstruktur dan aman.
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            {googleUser && hasToken ? (
              <button
                onClick={() => setShowConfirmModal(true)}
                disabled={isSyncing}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Data ke Google Sheets'}</span>
              </button>
            ) : (
              <button
                onClick={handleGoogleConnect}
                disabled={isAuthenticating}
                className="flex items-center gap-2 px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer"
              >
                <span>{isAuthenticating ? 'Menghubungkan...' : 'Sambungkan Akun Google'}</span>
              </button>
            )}

            {spreadsheetUrl && (
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs border border-white/20 transition-colors"
              >
                <span>Buka di Google Sheets</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Account & Spreadsheet Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Google Account Status */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Status Otorisasi Akun Google
              </span>
              {googleUser && hasToken ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Terhubung & Siap
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Belum Terhubung
                </span>
              )}
            </div>

            {googleUser && hasToken ? (
              <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm uppercase">
                    {googleUser.email?.charAt(0) || 'G'}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                      {googleUser.displayName || 'Pengguna Google'}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-mono">{googleUser.email}</p>
                  </div>
                </div>

                <button
                  onClick={handleGoogleDisconnect}
                  className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Putuskan</span>
                </button>
              </div>
            ) : (
              <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
                Sambungkan akun Google Anda untuk memberikan izin akses membaca dan menulis file spreadsheet di Google Drive Anda.
              </div>
            )}
          </div>

          {!hasToken && (
            <button
              onClick={handleGoogleConnect}
              disabled={isAuthenticating}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>{isAuthenticating ? 'Menghubungkan...' : 'Masuk dengan Akun Google'}</span>
            </button>
          )}
        </div>

        {/* Card 2: Connected Spreadsheet Target */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Google Spreadsheet Tujuan
              </span>
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            </div>

            {spreadsheetId ? (
              <div className="mt-3 p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 text-xs space-y-1.5">
                <span className="font-extrabold text-emerald-950 block text-sm">
                  {spreadsheetName || 'SIBKS Database Spreadsheet'}
                </span>
                <p className="text-[11px] text-slate-500 font-mono truncate">
                  ID: {spreadsheetId}
                </p>
                {lastSyncTime && (
                  <p className="text-[11px] text-emerald-800 font-semibold pt-1 border-t border-emerald-200/80">
                    Sinkronisasi Terakhir: {lastSyncTime}
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                Belum ada spreadsheet yang dibuat. Sistem akan otomatis membuat file baru saat sinkronisasi pertama kali dijalankan.
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            {spreadsheetUrl ? (
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-bold"
              >
                <span>Buka Lembar Kerja</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <span className="text-slate-400 text-[11px]">Belum dibuat di Google Drive</span>
            )}

            {spreadsheetId && (
              <button
                onClick={handlePullData}
                disabled={isPulling || !hasToken}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs cursor-pointer disabled:opacity-40"
              >
                <ArrowDownToLine className="w-3.5 h-3.5" />
                <span>{isPulling ? 'Memuat...' : 'Tarik Siswa dari Sheet'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5 Sheets Tabs Details */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 text-sm md:text-base">
            Daftar Tab yang Tersedia di Google Spreadsheet
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Setiap kategori data disimpan pada lembar kerja terpisah untuk memudahkan Guru BK dan Sekolah menyusun arsip digital.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* Tab 1 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-600" />
                <span>DATA_SISWA</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px]">
                {totalStudents} Siswa
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Kolom: NIS, NISN, Nama Lengkap, Jenis Kelamin, Kelas, Jurusan, Nomor HP, Orang Tua, Alamat.
            </p>
          </div>

          {/* Tab 2 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>REKAP_AKPD</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                {totalResponses} Hasil
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Kolom: Persentase Pribadi, Sosial, Belajar, Karir, Rata-rata Kebutuhan, Tingkat Prioritas, Catatan BK.
            </p>
          </div>

          {/* Tab 3 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                <span>MINAT_KARIER_BMW</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold text-[10px]">
                Kelas XII
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Kolom: Poin Bekerja (A), Kuliah (B), Wirausaha (C), Persentase, Kecenderungan Dominan, Rekomendasi BK.
            </p>
          </div>

          {/* Tab 4 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <ListTodo className="w-4 h-4 text-purple-600" />
                <span>TINDAK_LANJUT_BK</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold text-[10px]">
                {totalFollowUps} Tindak Lanjut
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Kolom: Siswa, Kelas, Tanggal, Bidang, Jenis Layanan, Masalah/Kebutuhan, Rekomendasi, Status.
            </p>
          </div>

          {/* Tab 5 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <History className="w-4 h-4 text-slate-600" />
                <span>LOG_AUDIT</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px]">
                {totalLogs} Rekaman
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Kolom: Waktu & Tanggal, Pengguna, Peran, Aksi yang Dilakukan, Rincian Perubahan Data.
            </p>
          </div>

          {/* Security Assurance */}
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 space-y-2 text-blue-950">
            <div className="flex items-center gap-1.5 font-bold text-blue-900">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Kerahasiaan & Keamanan</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Data spreadsheet disimpan langsung di Google Drive akun sekolah Anda. Tidak disimpan pada server pihak ketiga.
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Mutating/Overwriting Google Sheets Data (Mandatory Workspace Skill Rule) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4 text-xs">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-base font-bold text-slate-900">
                Konfirmasi Pembaruan Data di Google Sheets
              </h4>
              <p className="text-slate-500 leading-relaxed">
                Tindakan ini akan memperbarui dan menulis data pada spreadsheet{' '}
                <strong>{spreadsheetName || 'SIBKS Database'}</strong> dengan data terbaru aplikasi:
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1 border border-slate-200 text-slate-700">
              <p>• <strong>{totalStudents}</strong> data siswa ke tab <code>DATA_SISWA</code></p>
              <p>• <strong>{totalResponses}</strong> rekap AKPD ke tab <code>REKAP_AKPD</code></p>
              <p>• Hasil pemetaan karier ke tab <code>MINAT_KARIER_BMW</code></p>
              <p>• <strong>{totalFollowUps}</strong> catatan tindak lanjut ke tab <code>TINDAK_LANJUT_BK</code></p>
              <p>• Log audit aktivitas ke tab <code>LOG_AUDIT</code></p>
            </div>

            <p className="text-[11px] text-slate-500 italic text-center">
              Apakah Anda yakin ingin melanjutkan penulisan data ke Google Sheets?
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteSync}
                className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-xs cursor-pointer"
              >
                Ya, Sinkronkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
