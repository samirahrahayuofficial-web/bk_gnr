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
  X,
  AlertTriangle,
  Lock,
  Layers,
  ArrowDownToLine,
  Database,
  Calendar,
  LogOut,
} from 'lucide-react';
import { User } from 'firebase/auth';

interface GoogleSheetsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncCompleted?: () => void;
}

export const GoogleSheetsSyncModal: React.FC<GoogleSheetsSyncModalProps> = ({
  isOpen,
  onClose,
  onSyncCompleted,
}) => {
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

  // Confirmation dialog state for destructive/mutating operation
  const [showConfirmSync, setShowConfirmSync] = useState(false);

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

    // Check token state
    getGoogleAccessToken().then((token) => {
      setHasToken(!!token);
    });

    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  const totalStudents = db.getStudents().length;
  const totalResponses = db.getResponses().filter((r) => r.status === 'SUBMITTED').length;
  const totalFollowUps = db.getFollowUps().length;

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
    setShowConfirmSync(false);
    setIsSyncing(true);

    try {
      let token = await getGoogleAccessToken();
      if (!token) {
        // Prompt sign in if token expired
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

      if (onSyncCompleted) onSyncCompleted();
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
      if (onSyncCompleted) onSyncCompleted();
    } catch (err: any) {
      showToast('error', 'Impor Gagal', err.message || 'Gagal memuat data dari spreadsheet.');
    } finally {
      setIsPulling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">Integrasi Penyimpanan Google Sheets</h3>
              <p className="text-[11px] text-slate-300">Sinkronisasi data siswa, angket, dan tindak lanjut BK</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 text-xs">
          {/* Status Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Status Koneksi Akun Google
              </span>
              {googleUser && hasToken ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Terhubung
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Belum Terhubung
                </span>
              )}
            </div>

            {googleUser && hasToken ? (
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs uppercase">
                    {googleUser.email?.charAt(0) || 'G'}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">{googleUser.displayName || 'Pengguna Google'}</span>
                    <span className="text-[11px] text-slate-500 font-mono">{googleUser.email}</span>
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
              <div className="pt-1">
                <p className="text-slate-500 mb-3 leading-relaxed">
                  Hubungkan akun Google Anda untuk memungkinkan SIBKS membuat spreadsheet baru secara otomatis di Google Drive dan menyinkronkan data secara real-time.
                </p>

                {/* Standard Google Sign In Button */}
                <button
                  type="button"
                  onClick={handleGoogleConnect}
                  disabled={isAuthenticating}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  <span>{isAuthenticating ? 'Menghubungkan ke Google...' : 'Sambungkan dengan Akun Google'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Connected Spreadsheet Info */}
          {spreadsheetId && (
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Spreadsheet Aktif di Google Drive</span>
                </span>
                {spreadsheetUrl && (
                  <a
                    href={spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-bold text-[11px] underline"
                  >
                    <span>Buka di Google Sheets</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              <div className="text-[11px] text-slate-600 space-y-0.5">
                <p><strong>Judul File:</strong> {spreadsheetName || 'SIBKS Database'}</p>
                <p><strong>ID Spreadsheet:</strong> <span className="font-mono">{spreadsheetId}</span></p>
                {lastSyncTime && (
                  <p className="text-emerald-800">
                    <strong>Sinkronisasi Terakhir:</strong> {lastSyncTime}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 5 Sheets Tabs Overview */}
          <div className="space-y-2">
            <span className="font-bold text-slate-700 text-xs block">
              Lembar Kerja (Tabs) yang Disinkronkan:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between">
                <span>1. <strong>DATA_SISWA</strong> ({totalStudents} siswa)</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between">
                <span>2. <strong>REKAP_AKPD</strong> ({totalResponses} respons)</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between">
                <span>3. <strong>MINAT_KARIER_BMW</strong> (Kelas XII)</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between">
                <span>4. <strong>TINDAK_LANJUT_BK</strong> ({totalFollowUps} tindak lanjut)</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between sm:col-span-2">
                <span>5. <strong>LOG_AUDIT</strong> (Riwayat kepatuhan & aktivitas)</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            {spreadsheetId && (
              <button
                type="button"
                onClick={handlePullData}
                disabled={isPulling || !hasToken}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer disabled:opacity-40"
              >
                <ArrowDownToLine className="w-3.5 h-3.5" />
                <span>{isPulling ? 'Memuat...' : 'Tarik Siswa dari Sheet'}</span>
              </button>
            )}

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold cursor-pointer"
              >
                Tutup
              </button>

              <button
                type="button"
                disabled={!hasToken || isSyncing}
                onClick={() => setShowConfirmSync(true)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Explicit User Confirmation Dialog for Mutating Google Sheets Data (MANDATORY REQUIREMENT) */}
      {showConfirmSync && (
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
                Tindakan ini akan memperbarui data pada spreadsheet{' '}
                <strong>{spreadsheetName || 'SIBKS Database'}</strong> dengan data terbaru dari aplikasi:
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
                onClick={() => setShowConfirmSync(false)}
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
