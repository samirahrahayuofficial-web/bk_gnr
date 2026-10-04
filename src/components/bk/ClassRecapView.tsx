import React, { useState, useMemo, useEffect } from 'react';
import { db } from '../../db/storage';
import { AnalysisService, ClassRecapSummary } from '../../services/AnalysisService';
import { ReportingService } from '../../services/ReportingService';
import { useNotification } from '../../context/NotificationContext';
import {
  BarChart3,
  FileSpreadsheet,
  Printer,
  Users,
  CheckCircle2,
  GraduationCap,
  Layers,
  Sparkles,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { PriorityBadge } from '../common/PriorityBadge';
import { CareerBadge } from '../common/CareerBadge';
import { PrintableReportModal } from '../reports/PrintableReportModal';
import { StudentDetailModal } from './StudentDetailModal';

export const ClassRecapView: React.FC = () => {
  const { showToast } = useNotification();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const handleSync = () => setRefreshKey((k) => k + 1);
    window.addEventListener('sibks_data_synced', handleSync);
    return () => window.removeEventListener('sibks_data_synced', handleSync);
  }, []);

  const classes = useMemo(() => db.getClasses(), [refreshKey]);
  const types = useMemo(() => db.getQuestionnaireTypes(), [refreshKey]);

  // Grade level selection: 'X' | 'XI' | 'XII'
  const [selectedGrade, setSelectedGrade] = useState<'X' | 'XI' | 'XII'>('X');

  // Filter classes according to selected grade
  const gradeClasses = useMemo(() => {
    return classes.filter((c) => c.grade === selectedGrade);
  }, [classes, selectedGrade]);

  // Selected Class ID within the grade
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  // Selected student for detail dossier modal
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // Auto select first class when grade changes
  useEffect(() => {
    if (gradeClasses.length > 0) {
      if (!gradeClasses.some((c) => c.id === selectedClassId)) {
        setSelectedClassId(gradeClasses[0].id);
      }
    } else {
      setSelectedClassId('');
    }
  }, [selectedGrade, gradeClasses, selectedClassId]);

  // Automatically determine the matching questionnaire type for the selected grade
  const activeQuestionnaireType = useMemo(() => {
    if (selectedGrade === 'X') {
      return types.find((t) => t.id === 'qt-kelas-x' || t.target_grade === 'X') || types[0];
    } else if (selectedGrade === 'XI') {
      return types.find((t) => t.id === 'qt-akpd' || t.target_grade === 'XI') || types[0];
    } else {
      return types.find((t) => t.id === 'qt-bmw' || t.target_grade === 'XII') || types[0];
    }
  }, [types, selectedGrade]);

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  // Calculate class recap data
  const recap: ClassRecapSummary | null = useMemo(() => {
    if (!selectedClassId || !activeQuestionnaireType) return null;
    return AnalysisService.getClassRecapitulation(selectedClassId, activeQuestionnaireType.id);
  }, [selectedClassId, activeQuestionnaireType, refreshKey]);

  // Class students and their individual answers
  const classStudents = useMemo(() => {
    if (!selectedClassId) return [];
    return db.getStudents().filter((s) => s.class_id === selectedClassId);
  }, [selectedClassId, refreshKey]);

  const studentResponsesList = useMemo(() => {
    if (!selectedClassId || !activeQuestionnaireType) return [];
    const responses = db.getResponses().filter(
      (r) => r.questionnaire_type_id === activeQuestionnaireType.id && r.status === 'SUBMITTED'
    );
    const respMap = new Map(responses.map((r) => [r.student_id, r]));

    return classStudents.map((s) => {
      const resp = respMap.get(s.id);
      const analysis = resp ? AnalysisService.calculateResponseAnalysis(resp.id) : undefined;
      return {
        student: s,
        response: resp,
        analysis,
      };
    });
  }, [classStudents, selectedClassId, activeQuestionnaireType, refreshKey]);

  const handleExportExcel = () => {
    if (!selectedClassId) return;
    if (selectedGrade === 'XII') {
      ReportingService.exportBMWRecap(selectedClassId);
    } else {
      ReportingService.exportAKPDRecap(selectedClassId);
    }
    showToast('success', 'Ekspor Berhasil', `Rekapitulasi kelas ${selectedClass?.name} berhasil diunduh.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>Rekapitulasi Hasil Angket per Tingkatan & Kelas</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Agregasi rata-rata kebutuhan dan minat per rombel dengan struktur bidang/aspek khusus per tingkat kelas.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={() => setIsPrintOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Rekap</span>
          </button>
        </div>
      </div>

      {/* Grade Selector Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedGrade('X')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            selectedGrade === 'X'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Tingkat X (Angket Kelas X - 4 Bidang)</span>
        </button>

        <button
          onClick={() => setSelectedGrade('XI')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            selectedGrade === 'XI'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Tingkat XI (AKPD 40 Butir - 4 Bidang)</span>
        </button>

        <button
          onClick={() => setSelectedGrade('XII')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            selectedGrade === 'XII'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Tingkat XII (Minat Karier BMW 50 Butir)</span>
        </button>
      </div>

      {/* Rombel Class Selector */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-auto flex-1">
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Pilih Rombongan Belajar (Kelas {selectedGrade}):
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-800 shadow-2xs"
          >
            {gradeClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — Wali Kelas: {c.homeroom_teacher || '-'}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-auto bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-600">
          <span className="text-[11px] font-semibold text-slate-400 block uppercase">Instrumen Aktif:</span>
          <span className="font-bold text-slate-800">{activeQuestionnaireType?.title}</span>
        </div>
      </div>

      {/* Recap Content */}
      {!recap ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
          Silakan pilih kelas untuk melihat rekapitulasi data.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Jumlah Siswa Kelas</span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{recap.total_students}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Siswa terdaftar</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Responden Masuk</span>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">{recap.total_submitted}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">{recap.participation_rate}% partisipasi angket</p>
            </div>

            {selectedGrade !== 'XII' ? (
              <>
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Rata-rata Kebutuhan</span>
                  <h3 className="text-2xl font-black text-blue-600 mt-1">{recap.overall_average_pct}%</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Indikasi kebutuhan kelas</p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Tingkat Prioritas</span>
                  <div className="mt-2">
                    <PriorityBadge level={recap.overall_priority_level} size="md" />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Dominan Bekerja (A)</span>
                  <h3 className="text-2xl font-black text-sky-600 mt-1">
                    {recap.career_summary?.total_bekerja || 0} Siswa
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Rata-rata {recap.career_summary?.avg_bekerja_pct}%
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Dominan Kuliah (B)</span>
                  <h3 className="text-2xl font-black text-emerald-600 mt-1">
                    {recap.career_summary?.total_kuliah || 0} Siswa
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Rata-rata {recap.career_summary?.avg_kuliah_pct}%
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Table: Breakdown per Bidang (Untuk Kelas X dan Kelas XI) */}
          {selectedGrade !== 'XII' ? (
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    Tabel Rekapitulasi Rata-rata Kebutuhan per Bidang — Tingkat {selectedGrade} ({recap.class_name})
                  </h4>
                  <p className="text-xs text-slate-500">
                    Instrumen: <strong>{activeQuestionnaireType?.title}</strong> ({activeQuestionnaireType?.total_questions} Butir)
                  </p>
                </div>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                  {recap.total_submitted} dari {recap.total_students} Siswa Sudah Mengisi
                </span>
              </div>

              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4">Bidang / Aspek Bimbingan</th>
                    <th className="py-3 px-4 text-center w-36">Jumlah Siswa Pengisi</th>
                    <th className="py-3 px-4 text-center w-48">Rata-rata Persentase Kebutuhan</th>
                    <th className="py-3 px-4 text-center w-36">Tingkat Indikasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recap.category_averages.map((cat, idx) => (
                    <tr key={cat.category_id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{cat.category_name}</td>
                      <td className="py-3 px-4 text-center font-medium text-slate-600">{recap.total_submitted}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${cat.average_pct}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-800">{cat.average_pct}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <PriorityBadge level={cat.priority_level} label={cat.interpretation} />
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
                    <td colSpan={2} className="py-3 px-4 text-right">Rata-rata Kebutuhan Keseluruhan:</td>
                    <td className="py-3 px-4 text-center">{recap.total_submitted}</td>
                    <td className="py-3 px-4 text-center text-blue-700 font-extrabold">{recap.overall_average_pct}%</td>
                    <td className="py-3 px-4 text-center">
                      <PriorityBadge level={recap.overall_priority_level} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            /* Table: BMW CAREER RECAP (Kelas XII) */
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    Distribusi Orientasi Karier Lulusan (BMW) — Kelas {recap.class_name}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Instrumen: <strong>{activeQuestionnaireType?.title}</strong> (50 Butir Pilihan Arah Karier)
                  </p>
                </div>
                <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-lg border border-purple-200">
                  {recap.total_submitted} dari {recap.total_students} Siswa Sudah Mengisi
                </span>
              </div>

              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-3 px-4">Pilihan Arah Masa Depan</th>
                    <th className="py-3 px-4 text-center w-36">Jumlah Siswa Dominan</th>
                    <th className="py-3 px-4 text-center w-48">Rata-rata Skor (%)</th>
                    <th className="py-3 px-4 text-center w-36">Kategori</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-2">
                      <span className="text-base">💼</span>
                      <span>Bekerja di Industri / Perusahaan (A)</span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-sky-700">
                      {recap.career_summary?.total_bekerja || 0} Siswa
                    </td>
                    <td className="py-3 px-4 text-center font-bold">
                      {recap.career_summary?.avg_bekerja_pct || 0}%
                    </td>
                    <td className="py-3 px-4 text-center">
                      <CareerBadge career="BEKERJA" />
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-2">
                      <span className="text-base">🎓</span>
                      <span>Melanjutkan Kuliah di Perguruan Tinggi (B)</span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-700">
                      {recap.career_summary?.total_kuliah || 0} Siswa
                    </td>
                    <td className="py-3 px-4 text-center font-bold">
                      {recap.career_summary?.avg_kuliah_pct || 0}%
                    </td>
                    <td className="py-3 px-4 text-center">
                      <CareerBadge career="KULIAH" />
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-2">
                      <span className="text-base">🚀</span>
                      <span>Membangun Wirausaha Mandiri (C)</span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-amber-700">
                      {recap.career_summary?.total_wirausaha || 0} Siswa
                    </td>
                    <td className="py-3 px-4 text-center font-bold">
                      {recap.career_summary?.avg_wirausaha_pct || 0}%
                    </td>
                    <td className="py-3 px-4 text-center">
                      <CareerBadge career="WIRAUSAHA" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Individual Student Roster in this Class */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h4 className="font-bold text-slate-800 text-sm">
                Daftar Hasil Pengisian Siswa Rombel {selectedClass?.name}
              </h4>
              <p className="text-xs text-slate-500">
                Data individual seluruh siswa terdaftar di rombel ini beserta status pengisian dan tingkat prioritas.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3 w-10 text-center">No</th>
                    <th className="py-2.5 px-3">Nama Siswa</th>
                    <th className="py-2.5 px-3">NIS</th>
                    <th className="py-2.5 px-3 text-center">Status Angket</th>
                    <th className="py-2.5 px-3 text-center">Hasil Asesmen / Peminatan</th>
                    <th className="py-2.5 px-3 text-center w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentResponsesList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Belum ada siswa terdaftar di rombel ini.
                      </td>
                    </tr>
                  ) : (
                    studentResponsesList.map((item, idx) => {
                      const isSubmitted = item.response?.status === 'SUBMITTED';
                      const needAnalysis = item.analysis?.categoryAnalysis;
                      const careerResult = item.analysis?.careerResult;

                      return (
                        <tr key={item.student.id} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">{item.student.name}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">{item.student.nis}</td>
                          <td className="py-2.5 px-3 text-center">
                            {isSubmitted ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Lengkap</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 italic">
                                <AlertCircle className="w-3 h-3 text-amber-500" />
                                <span>Belum Mengisi</span>
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {selectedGrade !== 'XII' ? (
                              needAnalysis ? (
                                <div className="flex items-center justify-center gap-2">
                                  <PriorityBadge level={needAnalysis.priority_level} size="sm" />
                                  <span className="font-semibold text-slate-700">{needAnalysis.overall_percentage}%</span>
                                  <span className="text-[10px] text-slate-400">({needAnalysis.highest_need_category})</span>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">-</span>
                              )
                            ) : (
                              careerResult ? (
                                <div className="flex items-center justify-center gap-2">
                                  <CareerBadge career={careerResult.dominant_career} />
                                  <span className="text-[10px] text-slate-500">
                                    B:{careerResult.pct_bekerja}% K:{careerResult.pct_kuliah}% W:{careerResult.pct_wirausaha}%
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">-</span>
                              )
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => setSelectedStudentId(item.student.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md font-semibold text-xs cursor-pointer transition-colors"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Dossier</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Printable Report */}
      <PrintableReportModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        title={`Rekapitulasi Hasil Angket Kelas ${selectedClass?.name || ''}`}
        classRecap={recap}
      />

      {/* Student Dossier Modal */}
      <StudentDetailModal
        studentId={selectedStudentId}
        isOpen={!!selectedStudentId}
        onClose={() => setSelectedStudentId(null)}
        onRefreshData={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
};
