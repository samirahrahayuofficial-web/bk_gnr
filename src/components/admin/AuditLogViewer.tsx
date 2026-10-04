import React, { useState } from 'react';
import { AuditService } from '../../services/AuditService';
import { History, Search, Filter, ShieldCheck, User } from 'lucide-react';

export const AuditLogViewer: React.FC = () => {
  const [logs] = useState(() => AuditService.getLogs());
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = logs.filter((l) => {
    return (
      !searchQuery.trim() ||
      l.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.details.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <History className="w-5 h-5 text-blue-600" />
          <span>Audit Log Aktivitas Sistem</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Rekam jejak seluruh aktivitas login, perubahan master data, pengisian angket, dan ekspor laporan demi kepatuhan & transparansi data.
        </p>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama pengguna, aksi, atau rincian audit log..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs focus:outline-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden text-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <th className="py-3 px-4 w-40">Waktu & Tanggal</th>
              <th className="py-3 px-4 w-48">Pengguna (Aktor)</th>
              <th className="py-3 px-4 w-36">Aksi / Event</th>
              <th className="py-3 px-4">Rincian Aktivitas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-400">
                  Tidak ada rekaman audit log yang cocok.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                    {new Date(log.timestamp).toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-800 block">{log.user_name}</span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      Peran: {log.user_role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold text-[10px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium leading-relaxed">
                    {log.details}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
