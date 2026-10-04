import React, { useState, useEffect } from 'react';
import { db } from '../../db/storage';
import { AnalysisService } from '../../services/AnalysisService';
import { ReportingService } from '../../services/ReportingService';
import { useNotification } from '../../context/NotificationContext';
import { Compass, FileSpreadsheet, Users, Briefcase, GraduationCap, Rocket, Scale } from 'lucide-react';
import { CareerBadge } from '../common/CareerBadge';
import { StudentDetailModal } from './StudentDetailModal';

export const CareerRecapView: React.FC = () => {
  const { showToast } = useNotification();
  const [syncKey, setSyncKey] = useState(0);

  useEffect(() => {
    const handleSync = () => setSyncKey((k) => k + 1);
    window.addEventListener('sibks_data_synced', handleSync);
    return () => window.removeEventListener('sibks_data_synced', handleSync);
  }, []);

  const [selectedDominant, setSelectedDominant] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const students = db.getStudents();
  const classes = db.getClasses();
  const responses = db.getResponses().filter((r) => r.questionnaire_type_id === 'qt-bmw' && r.status === 'SUBMITTED');

  const careerList = responses.map((r) => {
    const s = students.find((std) => std.id === r.student_id);
    const cls = s ? classes.find((c) => c.id === s.class_id) : undefined;
    const { careerResult } = AnalysisService.calculateResponseAnalysis(r.id);
    return {
      response: r,
      student: s,
      studentClass: cls,
      careerResult,
    };
  });

  const filtered = careerList.filter((item) => {
    if (!item.student || !item.careerResult) return false;
    if (selectedDominant && item.careerResult.dominant_career !== selectedDominant) return false;
    return true;
  });

  let countBekerja = 0;
  let countKuliah = 0;
  let countWirausaha = 0;
  let countKombinasi = 0;

  careerList.forEach((c) => {
    if (c.careerResult?.dominant_career === 'BEKERJA') countBekerja++;
    else if (c.careerResult?.dominant_career === 'KULIAH') countKuliah++;
    else if (c.careerResult?.dominant_career === 'WIRAUSAHA') countWirausaha++;
    else countKombinasi++;
  });

  const handleExport = () => {
    ReportingService.exportBMWRecap();
    showToast('success', 'Ekspor Berhasil', 'Data pemetaan minat karier BMW telah diunduh.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Compass className="w-5 h-5 text-blue-600" />
            <span>Pemetaan Minat Karier Kelas XII (BMW)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Orientasi jalur masa depan pasca kelulusan SMK: Bekerja (B), Melanjutkan Kuliah (M), dan Wirausaha (W).
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Export Excel BMW</span>
        </button>
      </div>

      {/* 4 Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <button
          onClick={() => setSelectedDominant(selectedDominant === 'BEKERJA' ? '' : 'BEKERJA')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            selectedDominant === 'BEKERJA'
              ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-500/20'
              : 'bg-white border-slate-200 hover:border-sky-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-sky-800 uppercase">Bekerja di Industri</span>
            <Briefcase className="w-4 h-4 text-sky-600" />
          </div>
          <h3 className="text-2xl font-black text-sky-950 mt-1">{countBekerja} Siswa</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Klik untuk filter data</p>
        </button>

        <button
          onClick={() => setSelectedDominant(selectedDominant === 'KULIAH' ? '' : 'KULIAH')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            selectedDominant === 'KULIAH'
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase">Melanjutkan Kuliah</span>
            <GraduationCap className="w-4 h-4 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-black text-emerald-950 mt-1">{countKuliah} Siswa</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Klik untuk filter data</p>
        </button>

        <button
          onClick={() => setSelectedDominant(selectedDominant === 'WIRAUSAHA' ? '' : 'WIRAUSAHA')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            selectedDominant === 'WIRAUSAHA'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800 uppercase">Membangun Usaha</span>
            <Rocket className="w-4 h-4 text-amber-600" />
          </div>
          <h3 className="text-2xl font-black text-amber-950 mt-1">{countWirausaha} Siswa</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Klik untuk filter data</p>
        </button>

        <button
          onClick={() => setSelectedDominant(selectedDominant === 'KOMBINASI' ? '' : 'KOMBINASI')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            selectedDominant === 'KOMBINASI'
              ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-500/20'
              : 'bg-white border-slate-200 hover:border-purple-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-800 uppercase">Kombinasi / Seimbang</span>
            <Scale className="w-4 h-4 text-purple-600" />
          </div>
          <h3 className="text-2xl font-black text-purple-950 mt-1">{countKombinasi} Siswa</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Klik untuk filter data</p>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h4 className="font-bold text-slate-800 text-sm">
            Daftar Siswa Responden Angket Karier BMW
            {selectedDominant && ` (Difilter: ${selectedDominant})`}
          </h4>
          {selectedDominant && (
            <button
              onClick={() => setSelectedDominant('')}
              className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>

        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-600 font-semibold">
              <th className="py-3 px-4 w-12 text-center">No</th>
              <th className="py-3 px-4">Nama Siswa</th>
              <th className="py-3 px-4">Kelas</th>
              <th className="py-3 px-4 text-center">Bekerja (A)</th>
              <th className="py-3 px-4 text-center">Kuliah (B)</th>
              <th className="py-3 px-4 text-center">Wirausaha (C)</th>
              <th className="py-3 px-4 text-center">Kecenderungan Utama</th>
              <th className="py-3 px-4 text-center w-24">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  Tidak ada responden yang cocok dengan kriteria filter.
                </td>
              </tr>
            ) : (
              filtered.map((item, idx) => (
                <tr key={item.response.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">{item.student?.name}</span>
                    <span className="text-[11px] text-slate-400">NIS: {item.student?.nis}</span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-700">
                    {item.studentClass?.name || '-'}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-sky-700">
                    {item.careerResult?.count_a_bekerja} ({item.careerResult?.pct_bekerja}%)
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-700">
                    {item.careerResult?.count_b_kuliah} ({item.careerResult?.pct_kuliah}%)
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-amber-700">
                    {item.careerResult?.count_c_wirausaha} ({item.careerResult?.pct_wirausaha}%)
                  </td>
                  <td className="py-3 px-4 text-center">
                    <CareerBadge career={item.careerResult?.dominant_career || 'KOMBINASI'} />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => setSelectedStudentId(item.student?.id || null)}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md font-semibold text-[11px] cursor-pointer"
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <StudentDetailModal
        studentId={selectedStudentId}
        isOpen={!!selectedStudentId}
        onClose={() => setSelectedStudentId(null)}
      />
    </div>
  );
};
