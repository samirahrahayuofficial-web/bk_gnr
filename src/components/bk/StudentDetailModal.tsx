import React, { useState, useEffect } from 'react';
import { db } from '../../db/storage';
import { AnalysisService } from '../../services/AnalysisService';
import { QuestionnaireService } from '../../services/QuestionnaireService';
import { CounselingService } from '../../services/CounselingService';
import { Student, FollowUp, CounselingNote, BKServiceType, FollowUpStatus } from '../../types/database';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
  X,
  Printer,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Phone,
  MapPin,
  Lock,
  ListTodo,
  FileText,
  Compass,
  AlertTriangle,
  Plus,
  ArrowRight,
  Trash2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { PriorityBadge } from '../common/PriorityBadge';
import { CareerBadge } from '../common/CareerBadge';
import { PrintableReportModal } from '../reports/PrintableReportModal';

interface StudentDetailModalProps {
  studentId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onRefreshData?: () => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  studentId,
  isOpen,
  onClose,
  onRefreshData,
}) => {
  const { currentTeacher } = useAuth();
  const { showToast } = useNotification();
  const [activeTab, setActiveTab] = useState<'akpd' | 'bmw' | 'kelas_x' | 'tindak_lanjut' | 'konseling'>('akpd');
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // Reset Confirmation Modal State
  const [resetConfirmModal, setResetConfirmModal] = useState<{
    responseId?: string;
    questionnaireTitle: string;
    mode: 'SINGLE' | 'ALL';
  } | null>(null);

  // New Follow-Up Form State
  const [showAddFollowUp, setShowAddFollowUp] = useState(false);
  const [fuBidang, setFuBidang] = useState<'Pribadi' | 'Sosial' | 'Belajar' | 'Karir'>('Karir');
  const [fuService, setFuService] = useState<BKServiceType>('Konseling Individual');
  const [fuProblem, setFuProblem] = useState('');
  const [fuRecommendation, setFuRecommendation] = useState('');
  const [fuNotes, setFuNotes] = useState('');
  const [fuStatus, setFuStatus] = useState<FollowUpStatus>('Dalam Proses');
  const [fuNextDate, setFuNextDate] = useState('');

  // New Counseling Note Form State
  const [showAddNote, setShowAddNote] = useState(false);
  const [cnService, setCnService] = useState<BKServiceType>('Konseling Individual');
  const [cnTopic, setCnTopic] = useState('');
  const [cnProblem, setCnProblem] = useState('');
  const [cnNotes, setCnNotes] = useState('');
  const [cnRecommendation, setCnRecommendation] = useState('');
  const [cnPlan, setCnPlan] = useState('');

  const student = studentId ? db.getStudents().find((s) => s.id === studentId) : null;
  const studentClass = student ? db.getClasses().find((c) => c.id === student.class_id) : undefined;
  const studyProgram = studentClass ? db.getPrograms().find((p) => p.id === studentClass.study_program_id) : undefined;

  // Set default tab based on student grade
  useEffect(() => {
    if (studentClass?.grade === 'X') {
      setActiveTab('kelas_x');
    } else if (studentClass?.grade === 'XII') {
      setActiveTab('bmw');
    } else {
      setActiveTab('akpd');
    }
  }, [studentId, isOpen, studentClass?.grade]);

  if (!isOpen || !studentId || !student) return null;

  const analyses = AnalysisService.getStudentAnalyses(studentId);
  const akpdData = analyses.find(
    (a) => a.type?.code === 'AKPD' || a.type?.code === 'AKPD_XI' || a.type?.id === 'qt-akpd'
  );
  const bmwData = analyses.find(
    (a) => a.type?.code === 'BMW' || a.type?.id === 'qt-bmw'
  );
  const kelasXData = analyses.find(
    (a) => a.type?.code === 'KELAS_X' || a.type?.code === 'AKPD_X' || a.type?.id === 'qt-kelas-x'
  );

  const followUps = CounselingService.getFollowUpsByStudent(studentId);
  const counselingNotes = CounselingService.getCounselingNotesByStudent(studentId);

  const handleReOpen = (responseId?: string) => {
    if (!responseId) return;
    const ok = QuestionnaireService.reOpenResponse(responseId);
    if (ok) {
      showToast('success', 'Akses Dibuka', 'Siswa sekarang dapat mengubah/mengisi kembali angket ini.');
      if (onRefreshData) onRefreshData();
    }
  };

  const handleExecuteReset = () => {
    if (!resetConfirmModal || !student) return;

    if (resetConfirmModal.mode === 'SINGLE' && resetConfirmModal.responseId) {
      QuestionnaireService.deleteStudentResponse(resetConfirmModal.responseId);
      showToast(
        'success',
        'Hasil Angket Direset',
        `Hasil pengisian "${resetConfirmModal.questionnaireTitle}" untuk siswa ${student.name} telah berhasil dihapus. Siswa dapat mengisi kembali dari awal.`
      );
    } else if (resetConfirmModal.mode === 'ALL') {
      QuestionnaireService.resetStudentQuestionnaires(student.id);
      showToast(
        'success',
        'Seluruh Angket Direset',
        `Semua data respon angket untuk siswa ${student.name} telah berhasil dikosongkan.`
      );
    }

    setResetConfirmModal(null);
    if (onRefreshData) onRefreshData();
  };

  const handleSaveFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fuProblem.trim()) {
      showToast('warning', 'Peringatan', 'Harap isi deskripsi kebutuhan/masalah siswa.');
      return;
    }

    const newFu: FollowUp = {
      id: `fu-${Date.now()}`,
      student_id: student.id,
      teacher_id: currentTeacher?.id || 'tch-1',
      counselor_name: currentTeacher?.name || 'Guru BK',
      date: new Date().toISOString().split('T')[0],
      bidang: fuBidang,
      problem_need: fuProblem,
      service_type: fuService,
      recommendation: fuRecommendation,
      counselor_notes: fuNotes,
      status: fuStatus,
      next_follow_up_date: fuNextDate || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    CounselingService.saveFollowUp(newFu);
    showToast('success', 'Tindak Lanjut Disimpan', 'Rencana tindak lanjut layanan BK telah ditambahkan.');
    setShowAddFollowUp(false);
    setFuProblem('');
    setFuRecommendation('');
    setFuNotes('');
    if (onRefreshData) onRefreshData();
  };

  const handleSaveCounselingNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cnTopic.trim() || !cnNotes.trim()) {
      showToast('warning', 'Peringatan', 'Topik dan catatan konseling wajib diisi.');
      return;
    }

    const newNote: CounselingNote = {
      id: `cn-${Date.now()}`,
      student_id: student.id,
      teacher_id: currentTeacher?.id || 'tch-1',
      counselor_name: currentTeacher?.name || 'Guru BK',
      date: new Date().toISOString().split('T')[0],
      service_type: cnService,
      topic: cnTopic,
      problem_summary: cnProblem,
      notes: cnNotes,
      recommendation: cnRecommendation,
      follow_up_plan: cnPlan,
      status: 'Tersimpan',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    CounselingService.saveCounselingNote(newNote);
    showToast('success', 'Catatan Rahasia Tersimpan', 'Catatan konseling individual tersimpan dengan aman.');
    setShowAddNote(false);
    setCnTopic('');
    setCnNotes('');
    setCnProblem('');
    setCnRecommendation('');
    setCnPlan('');
    if (onRefreshData) onRefreshData();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-base">
              {student.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-base text-white">{student.name}</h3>
              <p className="text-xs text-slate-300">
                NIS: {student.nis} | Kelas: {studentClass?.name} | {studyProgram?.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Reset All Button */}
            {analyses.length > 0 && (
              <button
                onClick={() =>
                  setResetConfirmModal({
                    questionnaireTitle: 'Semua Angket Siswa',
                    mode: 'ALL',
                  })
                }
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-900/60 hover:bg-rose-800 text-rose-200 hover:text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-rose-700/60"
                title="Hapus / Reset semua pengisian angket siswa ini"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden md:inline">Reset Semua Angket</span>
              </button>
            )}

            <button
              onClick={() => setIsPrintOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Cetak Dokumen PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 text-xs font-semibold overflow-x-auto shrink-0">
          {studentClass?.grade === 'X' ? (
            <>
              <button
                onClick={() => setActiveTab('kelas_x')}
                className={`py-3 px-3.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'kelas_x'
                    ? 'border-emerald-600 text-emerald-700 bg-white font-bold'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Angket Kebutuhan Kelas X (4 Bidang / 50 Butir)
              </button>
              <button
                onClick={() => setActiveTab('akpd')}
                className={`py-3 px-3.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'akpd'
                    ? 'border-blue-600 text-blue-700 bg-white font-bold'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                AKPD Kelas XI
              </button>
              <button
                onClick={() => setActiveTab('bmw')}
                className={`py-3 px-3.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'bmw'
                    ? 'border-blue-600 text-blue-700 bg-white font-bold'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Minat Karier BMW
              </button>
            </>
          ) : studentClass?.grade === 'XII' ? (
            <>
              <button
                onClick={() => setActiveTab('bmw')}
                className={`py-3 px-3.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'bmw'
                    ? 'border-purple-600 text-purple-700 bg-white font-bold'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Minat Karier BMW (Kelas XII - 50 Butir)
              </button>
              <button
                onClick={() => setActiveTab('akpd')}
                className={`py-3 px-3.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'akpd'
                    ? 'border-blue-600 text-blue-700 bg-white font-bold'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Asesmen Kebutuhan (AKPD)
              </button>
              <button
                onClick={() => setActiveTab('kelas_x')}
                className={`py-3 px-3.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'kelas_x'
                    ? 'border-blue-600 text-blue-700 bg-white font-bold'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Angket Kelas X
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('akpd')}
                className={`py-3 px-3.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'akpd'
                    ? 'border-blue-600 text-blue-700 bg-white font-bold'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Angket AKPD Kelas XI (4 Bidang / 40 Butir)
              </button>
              <button
                onClick={() => setActiveTab('bmw')}
                className={`py-3 px-3.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'bmw'
                    ? 'border-blue-600 text-blue-700 bg-white font-bold'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Minat Karier BMW (Kelas XII)
              </button>
              <button
                onClick={() => setActiveTab('kelas_x')}
                className={`py-3 px-3.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'kelas_x'
                    ? 'border-blue-600 text-blue-700 bg-white font-bold'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Angket Kelas X
              </button>
            </>
          )}
          <button
            onClick={() => setActiveTab('tindak_lanjut')}
            className={`py-3 px-3.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'tindak_lanjut'
                ? 'border-blue-600 text-blue-700 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Tindak Lanjut BK ({followUps.length})
          </button>
          <button
            onClick={() => setActiveTab('konseling')}
            className={`py-3 px-3.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'konseling'
                ? 'border-blue-600 text-blue-700 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Catatan Konseling Rahasia ({counselingNotes.length})</span>
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: AKPD */}
          {activeTab === 'akpd' && (
            <div className="space-y-6">
              {!akpdData || !akpdData.categoryAnalysis ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2 opacity-80" />
                  <p className="font-semibold text-slate-700 text-sm">
                    Siswa belum menyelesaikan Angket Kebutuhan Peserta Didik (AKPD)
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Instrumen 40 item belum dikirimkan atau masih berstatus draft.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200">
                      <span className="text-[11px] font-semibold text-blue-700 uppercase">
                        Rata-rata Kebutuhan
                      </span>
                      <h4 className="text-2xl font-black text-blue-900 mt-1">
                        {akpdData.categoryAnalysis.overall_percentage}%
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {akpdData.categoryAnalysis.total_yes} dari {akpdData.categoryAnalysis.total_questions} butir 'YA'
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[11px] font-semibold text-slate-600 uppercase">
                        Tingkat Indikasi
                      </span>
                      <div className="mt-2">
                        <PriorityBadge level={akpdData.categoryAnalysis.priority_level} size="md" />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">Prioritas perhatian Guru BK</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 sm:col-span-2">
                      <span className="text-[11px] font-semibold text-slate-600 uppercase">
                        Bidang Kebutuhan Tertinggi
                      </span>
                      <h4 className="text-base font-bold text-slate-800 mt-1">
                        {akpdData.categoryAnalysis.highest_need_category}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {akpdData.categoryAnalysis.indication_summary}
                      </p>
                    </div>
                  </div>

                  {/* 4 Bidang Table */}
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm mb-3">
                      Rincian 4 Bidang Layanan Bimbingan & Konseling
                    </h4>
                    <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                            <th className="py-2.5 px-3">Bidang Asesmen</th>
                            <th className="py-2.5 px-3 text-center">Jumlah Butir</th>
                            <th className="py-2.5 px-3 text-center">Jawaban "YA"</th>
                            <th className="py-2.5 px-3 text-center">Persentase</th>
                            <th className="py-2.5 px-3 text-center">Tingkat Indikasi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {akpdData.categoryAnalysis.category_results.map((c) => (
                            <tr key={c.category_id} className="hover:bg-slate-50/50">
                              <td className="py-3 px-3 font-semibold text-slate-800">{c.category_name}</td>
                              <td className="py-3 px-3 text-center text-slate-600">{c.total_items}</td>
                              <td className="py-3 px-3 text-center font-bold text-blue-700">
                                {c.answered_yes_or_target}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-blue-600 rounded-full"
                                      style={{ width: `${c.percentage}%` }}
                                    />
                                  </div>
                                  <span className="font-bold text-slate-800">{c.percentage}%</span>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <PriorityBadge level={c.priority_level} label={c.interpretation} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Actions: Re-Open and Reset */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold text-slate-800 block">Pengaturan Hasil Pengisian Angket:</span>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Buka hak pengisian jika siswa perlu merevisi jawaban, atau reset pengisian jika terdapat kesalahan/uji coba.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        onClick={() => handleReOpen(akpdData.response.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer transition-colors"
                        title="Ubah status menjadi DRAFT agar siswa dapat mengubah jawaban"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                        <span>Buka Hak Revisi</span>
                      </button>

                      <button
                        onClick={() =>
                          setResetConfirmModal({
                            responseId: akpdData.response.id,
                            questionnaireTitle: 'AKPD Kelas XI',
                            mode: 'SINGLE',
                          })
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold cursor-pointer border border-rose-200 transition-colors"
                        title="Hapus seluruh jawaban AKPD siswa ini agar dapat mengisi ulang dari awal"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Reset Hasil Angket</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BMW CAREER */}
          {activeTab === 'bmw' && (
            <div className="space-y-6">
              {!bmwData || !bmwData.careerResult ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <Compass className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-80" />
                  <p className="font-semibold text-slate-700 text-sm">
                    Siswa belum menyelesaikan Angket Minat Karier BMW
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Angket 50 butir pemetaan karier (Bekerja, Kuliah, Wirausaha) belum diisi.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* BMW Result Big Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Bekerja */}
                    <div
                      className={`p-5 rounded-xl border transition-all ${
                        bmwData.careerResult.dominant_career === 'BEKERJA'
                          ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-500/20'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-sky-800 uppercase tracking-wide">
                          Bekerja di Industri (A)
                        </span>
                        <span className="text-xl">💼</span>
                      </div>
                      <h4 className="text-3xl font-black text-sky-900 mt-2">
                        {bmwData.careerResult.pct_bekerja}%
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {bmwData.careerResult.count_a_bekerja} dari {bmwData.careerResult.total_questions} butir pilihan A
                      </p>
                    </div>

                    {/* Kuliah */}
                    <div
                      className={`p-5 rounded-xl border transition-all ${
                        bmwData.careerResult.dominant_career === 'KULIAH'
                          ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                          Melanjutkan Kuliah (B)
                        </span>
                        <span className="text-xl">🎓</span>
                      </div>
                      <h4 className="text-3xl font-black text-emerald-900 mt-2">
                        {bmwData.careerResult.pct_kuliah}%
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {bmwData.careerResult.count_b_kuliah} dari {bmwData.careerResult.total_questions} butir pilihan B
                      </p>
                    </div>

                    {/* Wirausaha */}
                    <div
                      className={`p-5 rounded-xl border transition-all ${
                        bmwData.careerResult.dominant_career === 'WIRAUSAHA'
                          ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/20'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">
                          Wirausaha Mandiri (C)
                        </span>
                        <span className="text-xl">🚀</span>
                      </div>
                      <h4 className="text-3xl font-black text-amber-900 mt-2">
                        {bmwData.careerResult.pct_wirausaha}%
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {bmwData.careerResult.count_c_wirausaha} dari {bmwData.careerResult.total_questions} butir pilihan C
                      </p>
                    </div>
                  </div>

                  {/* Kesimpulan Dominan & Rekomendasi BK */}
                  <div className="p-5 rounded-xl bg-slate-900 text-white space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                        Hasil Analisis Minat Karier Utama
                      </span>
                      <CareerBadge career={bmwData.careerResult.dominant_career} />
                    </div>
                    <h3 className="text-xl font-bold text-blue-300">
                      {bmwData.careerResult.career_title}
                    </h3>
                    <div>
                      <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        Rekomendasi Bimbingan & Pendampingan Karier BK:
                      </p>
                      <ul className="space-y-1.5 text-xs text-slate-200">
                        {bmwData.careerResult.bk_recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-blue-400 mt-0.5">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Breakdown 5 Aspek BMW */}
                  {bmwData.careerResult.aspect_breakdown && (
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm mb-3">
                        Rincian Distribusi Pilihan Berdasarkan 5 Aspek BMW
                      </h4>
                      <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                              <th className="py-2.5 px-3">Aspek Penilaian</th>
                              <th className="py-2.5 px-3 text-center text-sky-700">Bekerja (A)</th>
                              <th className="py-2.5 px-3 text-center text-emerald-700">Kuliah (B)</th>
                              <th className="py-2.5 px-3 text-center text-amber-700">Wirausaha (C)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {bmwData.careerResult.aspect_breakdown.map((asp, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="py-2.5 px-3 font-medium text-slate-800">{asp.aspect_name}</td>
                                <td className="py-2.5 px-3 text-center font-bold text-sky-700">
                                  {asp.bekerja}
                                </td>
                                <td className="py-2.5 px-3 text-center font-bold text-emerald-700">
                                  {asp.kuliah}
                                </td>
                                <td className="py-2.5 px-3 text-center font-bold text-amber-700">
                                  {asp.wirausaha}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Actions: Re-Open and Reset for BMW */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold text-slate-800 block">Pengaturan Hasil Angket BMW:</span>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Buka hak revisi atau hapus data jika ada kesalahan pilihan orientasi karier siswa.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        onClick={() => handleReOpen(bmwData.response.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                        <span>Buka Hak Revisi</span>
                      </button>

                      <button
                        onClick={() =>
                          setResetConfirmModal({
                            responseId: bmwData.response.id,
                            questionnaireTitle: 'Minat Karier BMW Kelas XII',
                            mode: 'SINGLE',
                          })
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold cursor-pointer border border-rose-200 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Reset Hasil Angket</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: KELAS X */}
          {activeTab === 'kelas_x' && (
            <div className="space-y-6">
              {!kelasXData || !kelasXData.categoryAnalysis ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-80" />
                  <p className="font-semibold text-slate-700 text-sm">
                    Tidak ada data Angket Kebutuhan Peserta Didik Kelas X
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Instrumen ini khusus diisi oleh siswa baru kelas X untuk adaptasi awal di SMK.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200">
                      <span className="text-[11px] font-semibold text-blue-700 uppercase">
                        Rata-rata Kebutuhan Adaptasi
                      </span>
                      <h4 className="text-2xl font-black text-blue-900 mt-1">
                        {kelasXData.categoryAnalysis.overall_percentage}%
                      </h4>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[11px] font-semibold text-slate-600 uppercase">
                        Tingkat Indikasi
                      </span>
                      <div className="mt-2">
                        <PriorityBadge level={kelasXData.categoryAnalysis.priority_level} size="md" />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[11px] font-semibold text-slate-600 uppercase">
                        Fokus Kebutuhan Utama
                      </span>
                      <h4 className="text-sm font-bold text-slate-800 mt-1">
                        {kelasXData.categoryAnalysis.highest_need_category}
                      </h4>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                          <th className="py-2.5 px-3">Aspek Penyesuaian Siswa Baru</th>
                          <th className="py-2.5 px-3 text-center">Jumlah Butir</th>
                          <th className="py-2.5 px-3 text-center">Jawaban "YA"</th>
                          <th className="py-2.5 px-3 text-center">Persentase</th>
                          <th className="py-2.5 px-3 text-center">Tingkat Indikasi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {kelasXData.categoryAnalysis.category_results.map((c) => (
                          <tr key={c.category_id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-3 font-semibold text-slate-800">{c.category_name}</td>
                            <td className="py-3 px-3 text-center text-slate-600">{c.total_items}</td>
                            <td className="py-3 px-3 text-center font-bold text-blue-700">
                              {c.answered_yes_or_target}
                            </td>
                            <td className="py-3 px-3 text-center font-bold">{c.percentage}%</td>
                            <td className="py-3 px-3 text-center">
                              <PriorityBadge level={c.priority_level} label={c.interpretation} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Actions: Re-Open and Reset for Kelas X */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold text-slate-800 block">Pengaturan Hasil Angket Kelas X:</span>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Buka hak revisi atau hapus hasil pengisian siswa baru ini jika terjadi kesalahan atau uji coba.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        onClick={() => handleReOpen(kelasXData.response.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                        <span>Buka Hak Revisi</span>
                      </button>

                      <button
                        onClick={() =>
                          setResetConfirmModal({
                            responseId: kelasXData.response.id,
                            questionnaireTitle: 'Angket Kebutuhan Kelas X',
                            mode: 'SINGLE',
                          })
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold cursor-pointer border border-rose-200 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Reset Hasil Angket</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: TINDAK LANJUT BK */}
          {activeTab === 'tindak_lanjut' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    Daftar Tindak Lanjut Layanan Bimbingan & Konseling
                  </h4>
                  <p className="text-xs text-slate-500">
                    Aksi konkret guru BK atas pemetaan kebutuhan siswa.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddFollowUp(!showAddFollowUp)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Tindak Lanjut</span>
                </button>
              </div>

              {/* Form Add Follow Up */}
              {showAddFollowUp && (
                <form
                  onSubmit={handleSaveFollowUp}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs"
                >
                  <h5 className="font-bold text-slate-800 text-sm">Formulir Rencana Tindak Lanjut Baru</h5>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Bidang Layanan</label>
                      <select
                        value={fuBidang}
                        onChange={(e) => setFuBidang(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="Karir">Bidang Karir & DUDI</option>
                        <option value="Belajar">Bidang Belajar</option>
                        <option value="Pribadi">Bidang Pribadi</option>
                        <option value="Sosial">Bidang Sosial</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Jenis Layanan BK</label>
                      <select
                        value={fuService}
                        onChange={(e) => setFuService(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="Konseling Individual">Konseling Individual</option>
                        <option value="Bimbingan Karir & DUDI">Bimbingan Karir & DUDI</option>
                        <option value="Bimbingan Kelompok">Bimbingan Kelompok</option>
                        <option value="Bimbingan Klasikal">Bimbingan Klasikal</option>
                        <option value="Konseling Kelompok">Konseling Kelompok</option>
                        <option value="Kolaborasi / Alih Tangan Kasus (Referal)">
                          Kolaborasi / Alih Tangan Kasus (Referal)
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Status Penanganan</label>
                      <select
                        value={fuStatus}
                        onChange={(e) => setFuStatus(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="Belum Ditindaklanjuti">Belum Ditindaklanjuti</option>
                        <option value="Dalam Proses">Dalam Proses</option>
                        <option value="Selesai">Selesai</option>
                        <option value="Perlu Monitoring">Perlu Monitoring</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      Deskripsi Masalah / Kebutuhan Siswa
                    </label>
                    <textarea
                      rows={2}
                      value={fuProblem}
                      onChange={(e) => setFuProblem(e.target.value)}
                      placeholder="Uraikan alasan atau indikasi kebutuhan yang mendasari tindak lanjut ini..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Rekomendasi Tindakan</label>
                      <input
                        type="text"
                        value={fuRecommendation}
                        onChange={(e) => setFuRecommendation(e.target.value)}
                        placeholder="Misal: Ikuti pelatihan public speaking / konseling..."
                        className="w-full px-3 py-2 rounded-lg border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Tanggal Evaluasi / Lanjutan</label>
                      <input
                        type="date"
                        value={fuNextDate}
                        onChange={(e) => setFuNextDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Catatan Tambahan Konselor</label>
                    <textarea
                      rows={2}
                      value={fuNotes}
                      onChange={(e) => setFuNotes(e.target.value)}
                      placeholder="Catatan hasil tindak lanjut..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddFollowUp(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 font-semibold cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer"
                    >
                      Simpan Tindak Lanjut
                    </button>
                  </div>
                </form>
              )}

              {/* List Follow Ups */}
              {followUps.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                  Belum ada catatan tindak lanjut layanan BK untuk siswa ini.
                </div>
              ) : (
                <div className="space-y-3">
                  {followUps.map((fu) => (
                    <div
                      key={fu.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 shadow-2xs space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{fu.service_type}</span>
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-200">
                            {fu.bidang}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            fu.status === 'Selesai'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {fu.status}
                        </span>
                      </div>

                      <p className="text-slate-700">{fu.problem_need}</p>

                      {fu.recommendation && (
                        <p className="text-slate-600 text-[11px]">
                          <strong>Rekomendasi:</strong> {fu.recommendation}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                        <span>Konselor: {fu.counselor_name}</span>
                        <span>{new Date(fu.date).toLocaleDateString('id-ID')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: CATATAN KONSELING RAHASIA */}
          {activeTab === 'konseling' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-amber-600" />
                    <span>Catatan Konseling Rahasia Siswa</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    Hanya dapat diakses oleh Guru BK yang memiliki izin dan akun terdaftar.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddNote(!showAddNote)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Catatan Konseling</span>
                </button>
              </div>

              {/* Form Add Counseling Note */}
              {showAddNote && (
                <form
                  onSubmit={handleSaveCounselingNote}
                  className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-3 text-xs"
                >
                  <h5 className="font-bold text-slate-800 text-sm">Entri Baru Catatan Konseling Individual</h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Topik Utama Konseling</label>
                      <input
                        type="text"
                        value={cnTopic}
                        onChange={(e) => setCnTopic(e.target.value)}
                        placeholder="Misal: Penyesuaian diri di bengkel / motivasi belajar..."
                        className="w-full px-3 py-2 rounded-lg border border-slate-300"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Jenis Layanan</label>
                      <select
                        value={cnService}
                        onChange={(e) => setCnService(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="Konseling Individual">Konseling Individual</option>
                        <option value="Konseling Kelompok">Konseling Kelompok</option>
                        <option value="Bimbingan Karir & DUDI">Bimbingan Karir & DUDI</option>
                        <option value="Kolaborasi / Alih Tangan Kasus (Referal)">
                          Alih Tangan Kasus (Referal)
                        </option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Ringkasan Masalah yang Disampaikan</label>
                    <textarea
                      rows={2}
                      value={cnProblem}
                      onChange={(e) => setCnProblem(e.target.value)}
                      placeholder="Keluhan atau isu yang dihadapi siswa..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      Catatan Proses Konseling (Rahasia Guru BK)
                    </label>
                    <textarea
                      rows={3}
                      value={cnNotes}
                      onChange={(e) => setCnNotes(e.target.value)}
                      placeholder="Tuliskan dinamika interaksi konseling, respon siswa, dan komitmen yang terbangun..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Rekomendasi</label>
                      <input
                        type="text"
                        value={cnRecommendation}
                        onChange={(e) => setCnRecommendation(e.target.value)}
                        placeholder="Rekomendasi tindakan..."
                        className="w-full px-3 py-2 rounded-lg border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Rencana Tindak Lanjut</label>
                      <input
                        type="text"
                        value={cnPlan}
                        onChange={(e) => setCnPlan(e.target.value)}
                        placeholder="Rencana evaluasi..."
                        className="w-full px-3 py-2 rounded-lg border border-slate-300"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddNote(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 font-semibold cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold cursor-pointer"
                    >
                      Simpan Catatan Rahasia
                    </button>
                  </div>
                </form>
              )}

              {/* Note List */}
              {counselingNotes.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                  Belum ada catatan konseling individual yang tersimpan untuk siswa ini.
                </div>
              ) : (
                <div className="space-y-3">
                  {counselingNotes.map((cn) => (
                    <div
                      key={cn.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 shadow-2xs space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{cn.topic}</span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px]">
                            {cn.service_type}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {new Date(cn.date).toLocaleDateString('id-ID')} • {cn.counselor_name}
                        </span>
                      </div>

                      <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                        {cn.notes}
                      </p>

                      {cn.recommendation && (
                        <p className="text-slate-600 text-[11px]">
                          <strong>Rekomendasi:</strong> {cn.recommendation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Reset Response */}
      {resetConfirmModal && (
        <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-rose-200 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Konfirmasi Reset Hasil Pengisian Angket
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin menghapus hasil pengisian <strong>{resetConfirmModal.questionnaireTitle}</strong> untuk siswa <strong>{student.name} (NIS: {student.nis})</strong>?
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-amber-900">
                <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                <span>Efek Reset Pengisian:</span>
              </span>
              <p className="text-[11px] text-amber-800 leading-normal">
                Seluruh data jawaban butir angket siswa ini akan dihapus bersih. Status siswa akan kembali menjadi <strong>Belum Mengisi</strong> dan siswa dapat mengisi kembali dari awal.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setResetConfirmModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteReset}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-sm transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Reset Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Report Modal */}
      <PrintableReportModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        student={student}
        analysis={akpdData?.categoryAnalysis}
        careerResult={bmwData?.careerResult}
        title="Laporan Hasil Asesmen Bimbingan & Konseling Siswa"
      />
    </div>
  );
};
