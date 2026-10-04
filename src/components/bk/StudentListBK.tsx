import React, { useState, useMemo } from 'react';
import { db } from '../../db/storage';
import { AnalysisService } from '../../services/AnalysisService';
import { Student } from '../../types/database';
import {
  Search,
  Filter,
  Eye,
  FileSpreadsheet,
  Users,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { PriorityBadge } from '../common/PriorityBadge';
import { CareerBadge } from '../common/CareerBadge';
import { ReportingService } from '../../services/ReportingService';
import { useNotification } from '../../context/NotificationContext';
import { StudentDetailModal } from './StudentDetailModal';

export const StudentListBK: React.FC = () => {
  const { showToast } = useNotification();
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<'ALL' | 'X' | 'XI' | 'XII'>('ALL');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'SUBMITTED' | 'UNSUBMITTED'>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const students = useMemo(() => db.getStudents(), [refreshKey]);
  const classes = useMemo(() => db.getClasses(), [refreshKey]);
  const programs = useMemo(() => db.getPrograms(), [refreshKey]);

  const handleExport = () => {
    ReportingService.exportStudents();
    showToast('success', 'Ekspor Berhasil', 'Data siswa berhasil diunduh dalam format Excel (CSV).');
  };

  // Filter classes based on selected grade
  const availableClasses = useMemo(() => {
    if (selectedGrade === 'ALL') return classes;
    return classes.filter((c) => c.grade === selectedGrade);
  }, [classes, selectedGrade]);

  // Pre-calculate analyses for all students for performant filtering and display
  const studentAnalysesMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof AnalysisService.getStudentAnalyses>>();
    students.forEach((s) => {
      map.set(s.id, AnalysisService.getStudentAnalyses(s.id));
    });
    return map;
  }, [students, refreshKey]);

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const cls = classes.find((c) => c.id === s.class_id);
      const studentGrade = cls?.grade;

      // Grade filter
      if (selectedGrade !== 'ALL' && studentGrade !== selectedGrade) return false;

      // Class filter
      if (selectedClass && s.class_id !== selectedClass) return false;

      // Search query filter (Name, NIS, NISN)
      const matchesSearch =
        !searchQuery.trim() ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nis.includes(searchQuery) ||
        s.nisn.includes(searchQuery);
      if (!matchesSearch) return false;

      const analyses = studentAnalysesMap.get(s.id) || [];
      const hasSubmitted = analyses.some((a) => a.response?.status === 'SUBMITTED');

      // Status filter
      if (selectedStatus === 'SUBMITTED' && !hasSubmitted) return false;
      if (selectedStatus === 'UNSUBMITTED' && hasSubmitted) return false;

      // Priority filter (checks any completed category assessment)
      if (selectedPriority) {
        const needAssessment = analyses.find(
          (a) => a.categoryAnalysis && a.response?.status === 'SUBMITTED'
        );
        const p = needAssessment?.categoryAnalysis?.priority_level;
        if (selectedPriority !== p) return false;
      }

      return true;
    });
  }, [students, classes, selectedGrade, selectedClass, searchQuery, selectedStatus, selectedPriority, studentAnalysesMap]);

  // Global summary statistics
  const stats = useMemo(() => {
    let totalX = 0, subX = 0;
    let totalXI = 0, subXI = 0;
    let totalXII = 0, subXII = 0;
    let urgentHighCount = 0;

    students.forEach((s) => {
      const cls = classes.find((c) => c.id === s.class_id);
      const analyses = studentAnalysesMap.get(s.id) || [];
      const hasSub = analyses.some((a) => a.response?.status === 'SUBMITTED');

      if (cls?.grade === 'X') {
        totalX++;
        if (hasSub) subX++;
      } else if (cls?.grade === 'XI') {
        totalXI++;
        if (hasSub) subXI++;
      } else if (cls?.grade === 'XII') {
        totalXII++;
        if (hasSub) subXII++;
      }

      const needAnalysis = analyses.find((a) => a.categoryAnalysis && a.response?.status === 'SUBMITTED');
      if (needAnalysis?.categoryAnalysis?.priority_level === 'URGENT' || needAnalysis?.categoryAnalysis?.priority_level === 'HIGH') {
        urgentHighCount++;
      }
    });

    return {
      total: students.length,
      totalSubmitted: subX + subXI + subXII,
      totalX, subX,
      totalXI, subXI,
      totalXII, subXII,
      urgentHighCount,
    };
  }, [students, classes, studentAnalysesMap]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const currentSafePage = Math.min(currentPage, totalPages);
  const startIndex = (currentSafePage - 1) * pageSize;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Data & Analisis Asesmen Siswa</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoring hasil pengisian instrumen BK Kelas X, AKPD Kelas XI, serta Minat Karier BMW Kelas XII.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Ekspor Data Excel</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Siswa</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-black text-slate-900 mt-1">
            {stats.total.toLocaleString('id-ID')}
          </p>
          <span className="text-[10px] text-slate-400">
            {stats.totalSubmitted} Siswa Sudah Mengisi
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600">Responden Kelas X</span>
            <GraduationCap className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-slate-900 mt-1">
            {stats.subX} <span className="text-xs font-normal text-slate-400">/ {stats.totalX}</span>
          </p>
          <span className="text-[10px] text-slate-400">
            {stats.totalX > 0 ? Math.round((stats.subX / stats.totalX) * 100) : 0}% Angket Kelas X
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-600">Responden Kelas XI</span>
            <GraduationCap className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xl font-black text-slate-900 mt-1">
            {stats.subXI} <span className="text-xs font-normal text-slate-400">/ {stats.totalXI}</span>
          </p>
          <span className="text-[10px] text-slate-400">
            {stats.totalXI > 0 ? Math.round((stats.subXI / stats.totalXI) * 100) : 0}% AKPD 4 Bidang
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-600">Responden Kelas XII</span>
            <GraduationCap className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-xl font-black text-slate-900 mt-1">
            {stats.subXII} <span className="text-xs font-normal text-slate-400">/ {stats.totalXII}</span>
          </p>
          <span className="text-[10px] text-slate-400">
            {stats.totalXII > 0 ? Math.round((stats.subXII / stats.totalXII) * 100) : 0}% Karier BMW
          </span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari nama siswa, NIS (cth: 96095807), atau NISN..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs focus:outline-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Grade Level Filter */}
          <select
            value={selectedGrade}
            onChange={(e) => {
              setSelectedGrade(e.target.value as any);
              setSelectedClass('');
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 font-semibold"
          >
            <option value="ALL">Semua Tingkat</option>
            <option value="X">Kelas X</option>
            <option value="XI">Kelas XI</option>
            <option value="XII">Kelas XII</option>
          </select>

          {/* Class Filter */}
          <select
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 font-semibold"
          >
            <option value="">Semua Rombel ({availableClasses.length})</option>
            {availableClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value as any);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 font-medium"
          >
            <option value="ALL">Semua Status</option>
            <option value="SUBMITTED">Sudah Mengisi</option>
            <option value="UNSUBMITTED">Belum Mengisi</option>
          </select>

          {/* Priority Level Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => {
              setSelectedPriority(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 font-medium"
          >
            <option value="">Semua Prioritas</option>
            <option value="URGENT">Sangat Tinggi (URGENT)</option>
            <option value="HIGH">Tinggi (HIGH)</option>
            <option value="MEDIUM">Sedang (MEDIUM)</option>
            <option value="LOW">Rendah / Mandiri (LOW)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Identitas Siswa</th>
                <th className="py-3 px-4">Kelas & Program</th>
                <th className="py-3 px-4 text-center">Hasil Asesmen Kebutuhan (X / XI)</th>
                <th className="py-3 px-4 text-center">Minat Karier XII (BMW)</th>
                <th className="py-3 px-4 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Tidak ditemukan data siswa yang sesuai filter pencarian.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((s, idx) => {
                  const cls = classes.find((c) => c.id === s.class_id);
                  const prog = cls ? programs.find((p) => p.id === cls.study_program_id) : undefined;
                  const analyses = studentAnalysesMap.get(s.id) || [];

                  // Find primary need assessment (Kelas X or AKPD XI)
                  const needAssessment = analyses.find(
                    (a) => a.categoryAnalysis && a.response?.status === 'SUBMITTED'
                  );
                  
                  // Find BMW career assessment
                  const bmw = analyses.find(
                    (a) => (a.type?.code === 'BMW' || a.careerResult) && a.response?.status === 'SUBMITTED'
                  );

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-center font-bold text-slate-400">
                        {startIndex + idx + 1}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {s.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">
                              {s.name}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500">
                              NIS: <strong className="text-slate-700">{s.nis}</strong> • {s.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block">
                          {cls ? cls.name : '-'}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {prog ? prog.code : '-'} ({cls?.grade || '-'})
                        </span>
                      </td>

                      {/* Hasil Asesmen Kebutuhan (Kelas X atau XI) */}
                      <td className="py-3 px-4 text-center">
                        {needAssessment?.categoryAnalysis ? (
                          <div className="flex flex-col items-center gap-1">
                            <PriorityBadge
                              level={needAssessment.categoryAnalysis.priority_level}
                              size="sm"
                            />
                            <span className="text-[10px] text-slate-600 font-medium">
                              Kebutuhan {needAssessment.categoryAnalysis.overall_percentage}% • {needAssessment.categoryAnalysis.highest_need_category}
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono">
                              ({needAssessment.type?.title ? (cls?.grade === 'X' ? 'Angket X' : 'AKPD XI') : 'Asesmen'})
                            </span>
                          </div>
                        ) : cls?.grade === 'XII' ? (
                          <span className="text-[11px] text-slate-400 italic">Fokus BMW XII</span>
                        ) : (
                          <div className="inline-flex items-center gap-1 text-slate-400 text-[11px] italic">
                            <AlertCircle className="w-3 h-3 text-amber-500" />
                            <span>Belum mengisi</span>
                          </div>
                        )}
                      </td>

                      {/* Minat Karier XII BMW */}
                      <td className="py-3 px-4 text-center">
                        {bmw?.careerResult ? (
                          <div className="flex flex-col items-center gap-1">
                            <CareerBadge career={bmw.careerResult.dominant_career} />
                            <span className="text-[10px] text-slate-500">
                              B:{bmw.careerResult.pct_bekerja}% • K:{bmw.careerResult.pct_kuliah}% • W:{bmw.careerResult.pct_wirausaha}%
                            </span>
                          </div>
                        ) : cls?.grade !== 'XII' ? (
                          <span className="text-[11px] text-slate-400 italic">Tingkat {cls?.grade || 'X/XI'}</span>
                        ) : (
                          <div className="inline-flex items-center gap-1 text-slate-400 text-[11px] italic">
                            <AlertCircle className="w-3 h-3 text-amber-500" />
                            <span>Belum mengisi</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedStudentId(s.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Dossier BK</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          <div className="text-xs text-slate-500">
            Menampilkan <span className="font-bold text-slate-800">{filteredStudents.length === 0 ? 0 : startIndex + 1}</span> -{' '}
            <span className="font-bold text-slate-800">{Math.min(startIndex + pageSize, filteredStudents.length)}</span> dari{' '}
            <span className="font-bold text-slate-800">{filteredStudents.length}</span> siswa
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <span>Per halaman:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 rounded border border-slate-200 bg-white text-xs"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentSafePage <= 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-700 px-2">
                Hal {currentSafePage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentSafePage >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Student Detail Modal */}
      <StudentDetailModal
        studentId={selectedStudentId}
        isOpen={!!selectedStudentId}
        onClose={() => setSelectedStudentId(null)}
        onRefreshData={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
};
