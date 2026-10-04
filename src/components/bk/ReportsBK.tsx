import React, { useState, useMemo } from 'react';
import { db } from '../../db/storage';
import { ReportingService } from '../../services/ReportingService';
import { useNotification } from '../../context/NotificationContext';
import {
  FileText,
  FileSpreadsheet,
  Printer,
  Download,
  CheckCircle,
  ShieldCheck,
  Search,
  UserCheck,
  GraduationCap,
} from 'lucide-react';
import { PrintableReportModal } from '../reports/PrintableReportModal';
import { Student } from '../../types/database';

export const ReportsBK: React.FC = () => {
  const { showToast } = useNotification();
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<Student | undefined>(undefined);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  const students = db.getStudents();
  const classes = db.getClasses();

  const handleExportStudents = () => {
    ReportingService.exportStudents();
    showToast('success', 'Ekspor Berhasil', 'Data Master Siswa berhasil diunduh dalam format Excel (CSV).');
  };

  const handleExportAKPD = () => {
    ReportingService.exportAKPDRecap();
    showToast('success', 'Ekspor Berhasil', 'Rekapitulasi Asesmen AKPD berhasil diunduh.');
  };

  const handleExportBMW = () => {
    ReportingService.exportBMWRecap();
    showToast('success', 'Ekspor Berhasil', 'Rekapitulasi Minat Karier BMW berhasil diunduh.');
  };

  const handleExportPriorities = () => {
    ReportingService.exportPriorityList();
    showToast('success', 'Ekspor Berhasil', 'Daftar Prioritas Layanan BK berhasil diunduh.');
  };

  const handleOpenStudentReport = (student: Student) => {
    setSelectedStudentForReport(student);
    setIsPrintModalOpen(true);
  };

  const handleOpenGeneralReport = () => {
    setSelectedStudentForReport(undefined);
    setIsPrintModalOpen(true);
  };

  // Filtered students for quick report generation
  const filteredStudents = useMemo(() => {
    if (!studentSearchQuery.trim()) return [];
    return students
      .filter(
        (s) =>
          s.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
          s.nis.includes(studentSearchQuery)
      )
      .slice(0, 8);
  }, [students, studentSearchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <span>Pusat Laporan & Ekspor Dokumen Resmi BK</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Cetak Laporan Hasil Asesmen Bimbingan & Konseling Siswa (termasuk isi angket & catatan konseling) atau unduh dalam format Excel.
        </p>
      </div>

      {/* Official Individual Student Report Generator Section */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-blue-300" />
              <h3 className="text-base font-bold text-white">
                Cetak Laporan Hasil Asesmen & Catatan Konseling Siswa
              </h3>
            </div>
            <p className="text-xs text-blue-100/90 leading-relaxed">
              Dokumen resmi berkop sekolah memuat hasil analisis indikasi kebutuhan, rincian butir angket yang dipilih, rekomendasi BK, pemetaan minat karier BMW, rekam jejak konseling, dan kolom tanda tangan Kepala Sekolah & Koordinator BK.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenGeneralReport}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer border border-white/20 whitespace-nowrap"
            >
              Cetak Rekapitulasi Umum
            </button>
          </div>
        </div>

        {/* Quick Search Student to Print */}
        <div className="mt-5 pt-5 border-t border-white/15">
          <label className="block text-xs font-semibold text-blue-200 mb-2">
            Cari Siswa untuk Cetak Laporan Individual (Ketik Nama / NIS Siswa):
          </label>
          <div className="relative max-w-xl">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={studentSearchQuery}
              onChange={(e) => setStudentSearchQuery(e.target.value)}
              placeholder="Ketik NIS (misal: 96095807) atau nama siswa..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white text-slate-900 text-xs font-medium focus:outline-blue-400"
            />
          </div>

          {/* Search Results Dropdown / Cards */}
          {filteredStudents.length > 0 && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl bg-white/10 p-2.5 rounded-xl border border-white/15">
              {filteredStudents.map((s) => {
                const cls = classes.find((c) => c.id === s.class_id);
                return (
                  <button
                    key={s.id}
                    onClick={() => handleOpenStudentReport(s)}
                    className="flex items-center justify-between p-2.5 bg-white hover:bg-blue-50 text-slate-900 rounded-lg text-xs font-semibold transition-colors text-left cursor-pointer shadow-2xs"
                  >
                    <div>
                      <span className="block font-bold text-slate-900">{s.name}</span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        NIS: {s.nis} • {cls?.name || '-'}
                      </span>
                    </div>
                    <Printer className="w-4 h-4 text-blue-600 shrink-0 ml-2" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Grid of Excel Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Report 1: AKPD */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">
              Rekapitulasi Asesmen AKPD (4 Bidang)
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Memuat skor per bidang (Pribadi, Sosial, Belajar, Karir), persentase akumulasi, tingkat prioritas indikasi kebutuhan, dan tanggal pengisian siswa.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">Format: Excel (.csv UTF-8)</span>
            <button
              onClick={handleExportAKPD}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Excel</span>
            </button>
          </div>
        </div>

        {/* Report 2: BMW */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">
              Rekapitulasi Minat Karier BMW (Kelas XII)
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Memuat proporsi butir pilihan Bekerja (A), Kuliah (B), Wirausaha (C), persentase masing-masing jalur, dan status kecenderungan utama.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">Format: Excel (.csv UTF-8)</span>
            <button
              onClick={handleExportBMW}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Excel</span>
            </button>
          </div>
        </div>

        {/* Report 3: Priority Mapping */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">
              Daftar Pemetaan Prioritas Layanan BK Siswa
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Daftar klasifikasi siswa berdasarkan level indikasi kebutuhan (Urgent, High, Medium, Low) beserta catatan indikasi awal bimbingan.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">Format: Excel (.csv UTF-8)</span>
            <button
              onClick={handleExportPriorities}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Excel</span>
            </button>
          </div>
        </div>

        {/* Report 4: Master Siswa */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">
              Master Data Siswa Sekolah
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Daftar identitas lengkap seluruh siswa: NIS, NISN, nama lengkap, kelas, program keahlian, nomor telepon, orang tua, dan alamat.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">Format: Excel (.csv UTF-8)</span>
            <button
              onClick={handleExportStudents}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Printable Report Modal */}
      <PrintableReportModal
        isOpen={isPrintModalOpen}
        onClose={() => {
          setIsPrintModalOpen(false);
          setSelectedStudentForReport(undefined);
        }}
        student={selectedStudentForReport}
        title={
          selectedStudentForReport
            ? `Laporan Hasil Asesmen Bimbingan & Konseling Siswa`
            : `Laporan Resmi Rekapitulasi Layanan Bimbingan dan Konseling`
        }
      />
    </div>
  );
};
