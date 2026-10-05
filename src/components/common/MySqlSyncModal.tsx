import React, { useState, useEffect } from 'react';
import { MySqlSyncService, MySqlStatus } from '../../services/MySqlSyncService';
import { useNotification } from '../../context/NotificationContext';
import {
  Database,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  CheckCircle2,
  AlertTriangle,
  Server,
  Layers,
  Users,
  FileSpreadsheet,
  X,
  ExternalLink,
} from 'lucide-react';

interface MySqlSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MySqlSyncModal: React.FC<MySqlSyncModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useNotification();
  const [status, setStatus] = useState<MySqlStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const fetchStatus = async () => {
    setIsLoading(true);
    const s = await MySqlSyncService.checkStatus(true);
    setStatus(s);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePushAll = async () => {
    setIsSyncing(true);
    const res = await MySqlSyncService.pushAllToMySql();
    setIsSyncing(false);
    if (res.success) {
      showToast('success', 'Berhasil Sinkronisasi MySQL', res.message);
      fetchStatus();
    } else {
      showToast('error', 'Gagal Sinkronisasi', res.message);
    }
  };

  const handlePullAll = async () => {
    setIsSyncing(true);
    const res = await MySqlSyncService.pullAllFromMySql();
    setIsSyncing(false);
    if (res.success) {
      showToast('success', 'Berhasil Tarik Data MySQL', res.message);
      fetchStatus();
    } else {
      showToast('error', 'Gagal Tarik Data', res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-800 to-blue-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/20">
              <Database className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Koneksi Database TiDB Cloud MySQL
                <span className="text-[10px] bg-cyan-500/30 text-cyan-200 px-2 py-0.5 rounded-full border border-cyan-400/40">
                  MySQL 8.0 Compatible
                </span>
              </h2>
              <p className="text-xs text-cyan-200">
                Penyimpanan Relasional Cloud Serverless Terpusat SMKN 1 Gunungguruh
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Connection Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-700">Status Server TiDB Cloud</span>
              </div>
              <button
                onClick={fetchStatus}
                disabled={isLoading}
                className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                Periksa Ulang
              </button>
            </div>

            {status?.connected ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Terhubung ke <strong>{status.host || 'TiDB Cloud'}</strong> (Database: <code>{status.database}</code>)</span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-500 block font-medium">Siswa Terdaftar</span>
                    <span className="text-base font-extrabold text-slate-800">{status.stats?.totalStudents || 0}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-500 block font-medium">Respon Angket</span>
                    <span className="text-base font-extrabold text-emerald-600">{status.stats?.totalResponses || 0}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-500 block font-medium">Butir Jawaban</span>
                    <span className="text-base font-extrabold text-blue-600">{status.stats?.totalAnswers || 0}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Menghubungkan ke Backend MySQL Service...</p>
                  <p className="text-[11px] text-amber-600/90 mt-0.5">
                    {status?.error || 'Pastikan backend server sedang berjalan di port 3000.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handlePushAll}
              disabled={isSyncing}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <UploadCloud className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
              <span>Kirim & Sinkronkan Semua ke MySQL</span>
            </button>

            <button
              onClick={handlePullAll}
              disabled={isSyncing}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            >
              <DownloadCloud className="w-4 h-4 text-blue-600" />
              <span>Tarik Semua Data dari MySQL</span>
            </button>
          </div>

          {/* Instructions note */}
          <div className="bg-blue-50 border border-blue-200/80 rounded-xl p-3 text-[11px] text-blue-900 leading-relaxed">
            <strong>Info TiDB Cloud:</strong> Setiap kali siswa mengirimkan angket, data langsung otomatis tersimpan ke tabel <code>responses</code> dan <code>answers</code> di TiDB Cloud MySQL secara bersamaan.
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
