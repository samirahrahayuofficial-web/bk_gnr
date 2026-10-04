import React, { useMemo } from 'react';
import { db } from '../../db/storage';
import { Student, CareerResult, StudentAnalysis, QuestionnaireQuestion } from '../../types/database';
import { Printer, X, CheckCircle2, AlertTriangle, ShieldCheck, HeartHandshake, ListOrdered, Calendar, Lock } from 'lucide-react';
import { PriorityBadge } from '../common/PriorityBadge';
import { CareerBadge } from '../common/CareerBadge';
import { LogoSMK } from '../common/LogoSMK';
import { LogoBK } from '../common/LogoBK';
import { AnalysisService } from '../../services/AnalysisService';
import { CounselingService } from '../../services/CounselingService';

interface PrintableReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: Student;
  analysis?: StudentAnalysis;
  careerResult?: CareerResult;
  classRecap?: any;
  title: string;
}

export const PrintableReportModal: React.FC<PrintableReportModalProps> = ({
  isOpen,
  onClose,
  student,
  analysis: propAnalysis,
  careerResult: propCareerResult,
  classRecap,
  title,
}) => {
  if (!isOpen) return null;

  const settings = db.getSettings();
  const studentClass = student ? db.getClasses().find((c) => c.id === student.class_id) : undefined;
  const program = studentClass ? db.getPrograms().find((p) => p.id === studentClass.study_program_id) : undefined;

  // Retrieve analyses if student is provided
  const analyses = useMemo(() => {
    if (!student) return [];
    return AnalysisService.getStudentAnalyses(student.id);
  }, [student]);

  // Primary Need Assessment (Kelas X or AKPD XI)
  const analysis: StudentAnalysis | undefined = useMemo(() => {
    if (propAnalysis) return propAnalysis;
    const need = analyses.find((a) => a.categoryAnalysis && a.response?.status === 'SUBMITTED');
    return need?.categoryAnalysis;
  }, [propAnalysis, analyses]);

  // Career Result (BMW XII)
  const careerResult: CareerResult | undefined = useMemo(() => {
    if (propCareerResult) return propCareerResult;
    const bmw = analyses.find((a) => a.careerResult && a.response?.status === 'SUBMITTED');
    return bmw?.careerResult;
  }, [propCareerResult, analyses]);

  // Detailed items where student answered "YA" (isi butir angket)
  const detailedYesItems = useMemo(() => {
    if (!student) return [];
    const submittedResponses = db.getResponses().filter((r) => r.student_id === student.id && r.status === 'SUBMITTED');
    const responseIds = new Set(submittedResponses.map((r) => r.id));
    const studentAnswers = db.getAnswers().filter((a) => responseIds.has(a.response_id) && (a.selected_option_code === 'YA' || a.score_value > 0));

    const questions = db.getQuestions();
    const categories = db.getCategories();

    return studentAnswers.map((ans) => {
      const q = questions.find((item) => item.id === ans.question_id);
      const cat = q ? categories.find((c) => c.id === q.category_id) : undefined;
      return {
        question_number: q?.question_number || 0,
        statement: q?.statement || '',
        category_name: cat?.name || 'Umum',
      };
    }).sort((a, b) => a.question_number - b.question_number);
  }, [student]);

  // Counseling Notes for this student
  const counselingNotes = useMemo(() => {
    if (!student) return [];
    return CounselingService.getCounselingNotesByStudent(student.id);
  }, [student]);

  // Follow-up records for this student
  const followUps = useMemo(() => {
    if (!student) return [];
    return CounselingService.getFollowUpsByStudent(student.id);
  }, [student]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:border-none print:shadow-none print:max-w-none print:w-full">
        {/* Header Modal - Hide on print */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between print:hidden shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-bold text-sm text-white">Pratinjau Dokumen Laporan Resmi BK</h3>
              <p className="text-[11px] text-slate-400">Siap cetak atau simpan sebagai dokumen PDF resmi</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
              title="Tutup Jendela"
            >
              <X className="w-4 h-4" />
              <span>Tutup</span>
            </button>
          </div>
        </div>

        {/* Printable Area with Official School Kop */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 print:p-0 print:overflow-visible text-slate-900 leading-normal" id="printable-doc">
          {/* KOP SURAT SEKOLAH */}
          <div className="border-b-2 border-slate-900 pb-3 mb-6 relative flex items-center justify-between gap-4">
            <div className="shrink-0">
              <LogoSMK size={72} />
            </div>
            <div className="flex-1 text-center font-sans">
              <h2 className="text-xs sm:text-sm uppercase tracking-widest text-slate-600 font-bold">
                Pemerintah Daerah Provinsi Jawa Barat • Dinas Pendidikan
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-500 uppercase font-semibold">
                Cabang Dinas Pendidikan Wilayah V • Kabupaten Sukabumi
              </p>
              <h1 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-slate-950 mt-0.5">
                {settings.school_name}
              </h1>
              <p className="text-[11px] sm:text-xs text-blue-900 font-bold uppercase mt-0.5">
                Layanan Bimbingan dan Konseling (BK)
              </p>
              <p className="text-[10px] text-slate-500">
                NPSN: {settings.school_npsn} | {settings.school_address} • T.A. {settings.academic_year}
              </p>
            </div>
            <div className="shrink-0">
              <LogoBK size={74} />
            </div>
          </div>

          {/* JUDUL LAPORAN */}
          <div className="text-center my-6">
            <h3 className="text-base sm:text-lg font-sans font-bold uppercase underline decoration-1 underline-offset-4">
              {title}
            </h3>
            <p className="text-xs font-sans text-slate-500 mt-1 font-mono">
              Nomor Registrasi Dokumen: BK/{new Date().getFullYear()}/
              {student ? student.nis : 'REKAP'}/
              {Math.floor(1000 + Math.random() * 9000)}
            </p>
          </div>

          {/* IDENTITAS SISWA (jika ada) */}
          {student && (
            <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200 font-sans text-xs">
              <h4 className="font-bold text-slate-800 uppercase text-[11px] mb-2 tracking-wider">
                Identitas Peserta Didik
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5">
                <div className="flex">
                  <span className="w-36 text-slate-500">Nama Siswa</span>
                  <span className="font-bold text-slate-900">: {student.name}</span>
                </div>
                <div className="flex">
                  <span className="w-36 text-slate-500">NIS / NISN</span>
                  <span className="font-mono text-slate-900">: {student.nis} / {student.nisn}</span>
                </div>
                <div className="flex">
                  <span className="w-36 text-slate-500">Kelas & Rombel</span>
                  <span className="font-semibold text-slate-900">: {studentClass?.name || '-'} (Tingkat {studentClass?.grade || '-'})</span>
                </div>
                <div className="flex">
                  <span className="w-36 text-slate-500">Program Keahlian</span>
                  <span className="text-slate-900">: {program?.name || '-'}</span>
                </div>
                <div className="flex">
                  <span className="w-36 text-slate-500">Jenis Kelamin</span>
                  <span className="text-slate-900">: {student.gender === 'L' ? 'Laki-laki (L)' : 'Perempuan (P)'}</span>
                </div>
                <div className="flex">
                  <span className="w-36 text-slate-500">Tanggal Dokumen</span>
                  <span className="text-slate-900">: {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</span>
                </div>
              </div>
            </div>
          )}

          {/* BAGIAN A: TABEL HASIL ASESMEN KEBUTUHAN PER BIDANG */}
          {analysis && (
            <div className="font-sans mb-6">
              <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">A</span>
                <span>Hasil Analisis Indikasi Kebutuhan Layanan BK</span>
              </h4>
              <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                      <th className="py-2.5 px-3 border-r border-slate-300 w-12 text-center">No</th>
                      <th className="py-2.5 px-3 border-r border-slate-300">Bidang / Aspek Layanan</th>
                      <th className="py-2.5 px-3 border-r border-slate-300 text-center w-24">Jumlah Item</th>
                      <th className="py-2.5 px-3 border-r border-slate-300 text-center w-24">Item 'YA'</th>
                      <th className="py-2.5 px-3 border-r border-slate-300 text-center w-28">Persentase (%)</th>
                      <th className="py-2.5 px-3 text-center w-36">Tingkat Indikasi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.category_results.map((c, idx) => (
                      <tr key={c.category_id} className="border-b border-slate-200">
                        <td className="py-2 px-3 border-r border-slate-200 text-center">{idx + 1}</td>
                        <td className="py-2 px-3 border-r border-slate-200 font-medium text-slate-900">
                          {c.category_name}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 text-center">{c.total_items}</td>
                        <td className="py-2 px-3 border-r border-slate-200 text-center font-bold text-blue-700">
                          {c.answered_yes_or_target}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 text-center font-bold">
                          {c.percentage}%
                        </td>
                        <td className="py-2 px-3 text-center">
                          <PriorityBadge level={c.priority_level} label={c.interpretation} />
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                      <td colSpan={2} className="py-2.5 px-3 text-right border-r border-slate-200">
                        Rata-rata Kebutuhan Keseluruhan
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center">
                        {analysis.total_questions}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center font-bold text-blue-700">
                        {analysis.total_yes}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center text-blue-900">
                        {analysis.overall_percentage}%
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <PriorityBadge level={analysis.priority_level} />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Rekomendasi Catatan BK */}
              <div className="mt-3 p-3.5 bg-blue-50/50 rounded-lg border border-blue-200 text-xs">
                <span className="font-bold text-blue-900 block mb-1">
                  Catatan Indikasi Kebutuhan Guru BK:
                </span>
                <p className="text-slate-700 leading-relaxed">{analysis.indication_summary}</p>
                <p className="text-[11px] text-slate-500 mt-1.5 italic">
                  * Catatan: Data ini merupakan Sistem Pendukung Keputusan (DSS) bimbingan dan konseling untuk
                  pemetaan kebutuhan program, bukan diagnosis psikologis.
                </p>
              </div>
            </div>
          )}

          {/* BAGIAN B: RINCIAN BUTIR PERNYATAAN / MASALAH YANG DIISI SISWA */}
          {detailedYesItems.length > 0 && (
            <div className="font-sans mb-6">
              <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">B</span>
                  <span>Rincian Butir Masalah / Kebutuhan yang Dipilih Siswa (Jawaban "YA")</span>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  Total: {detailedYesItems.length} Butir Terindikasi
                </span>
              </h4>
              <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                      <th className="py-2 px-3 w-12 text-center border-r border-slate-300">No</th>
                      <th className="py-2 px-3 w-40 border-r border-slate-300">Bidang Bimbingan</th>
                      <th className="py-2 px-3">Pernyataan Masalah / Kebutuhan yang Dialami Siswa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {detailedYesItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="py-2 px-3 text-center font-bold text-slate-500 border-r border-slate-200">
                          {item.question_number}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-700 border-r border-slate-200">
                          {item.category_name}
                        </td>
                        <td className="py-2 px-3 text-slate-900">
                          {item.statement}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* BAGIAN C: HASIL BMW KELAS XII (jika ada) */}
          {careerResult && (
            <div className="font-sans mb-6">
              <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
                  {detailedYesItems.length > 0 ? 'C' : 'B'}
                </span>
                <span>Hasil Pemetaan Minat Karier Lulusan (BMW)</span>
              </h4>
              <div className="border border-slate-300 rounded-lg overflow-hidden text-xs mb-3">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                      <th className="py-2.5 px-3 border-r border-slate-300">Pilihan Arah Karier Pasca Kelulusan</th>
                      <th className="py-2.5 px-3 border-r border-slate-300 text-center w-28">Jumlah Poin</th>
                      <th className="py-2.5 px-3 border-r border-slate-300 text-center w-32">Persentase (%)</th>
                      <th className="py-2.5 px-3 text-center w-36">Status Orientasi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="py-2.5 px-3 border-r border-slate-200 font-medium text-slate-800">
                        Bekerja di Industri / Perusahaan (A)
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center font-bold">
                        {careerResult.count_a_bekerja}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center font-bold text-sky-700">
                        {careerResult.pct_bekerja}%
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <CareerBadge career="BEKERJA" />
                      </td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-2.5 px-3 border-r border-slate-200 font-medium text-slate-800">
                        Melanjutkan Pendidikan / Kuliah (B)
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center font-bold">
                        {careerResult.count_b_kuliah}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center font-bold text-emerald-700">
                        {careerResult.pct_kuliah}%
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <CareerBadge career="KULIAH" />
                      </td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-2.5 px-3 border-r border-slate-200 font-medium text-slate-800">
                        Wirausaha / Membuka Usaha Mandiri (C)
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center font-bold">
                        {careerResult.count_c_wirausaha}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center font-bold text-amber-700">
                        {careerResult.pct_wirausaha}%
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <CareerBadge career="WIRAUSAHA" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Kesimpulan Dominan */}
              <div className="p-3.5 bg-emerald-50/60 rounded-lg border border-emerald-200 text-xs">
                <span className="font-bold text-emerald-900 block mb-1">
                  Kesimpulan Orientasi Utama: {careerResult.career_title}
                </span>
                <p className="text-slate-700 font-semibold mb-1">
                  Rekomendasi Bimbingan Karier & Hubungan DUDI:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                  {careerResult.bk_recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* BAGIAN D: REKAM JEJAK CATATAN KONSELING & TINDAK LANJUT BK */}
          {student && (
            <div className="font-sans mb-6">
              <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
                  {careerResult ? (detailedYesItems.length > 0 ? 'D' : 'C') : (detailedYesItems.length > 0 ? 'C' : 'B')}
                </span>
                <span>Rekam Jejak Catatan Konseling & Tindak Lanjut Layanan BK</span>
              </h4>

              {counselingNotes.length === 0 && followUps.length === 0 ? (
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
                  <p className="italic">
                    Belum tercatat sesi konseling individual khusus untuk siswa ini. Layanan bimbingan klasikal dan pencegahan berjalan sesuai hasil asesmen kebutuhan di atas.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Catatan Konseling Table */}
                  {counselingNotes.length > 0 && (
                    <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
                      <div className="bg-slate-100 px-3 py-1.5 font-bold text-slate-800 border-b border-slate-300">
                        Catatan Konseling Individual / Kelompok ({counselingNotes.length} Sesi)
                      </div>
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                            <th className="py-2 px-3 w-24 border-r border-slate-200">Tanggal</th>
                            <th className="py-2 px-3 w-36 border-r border-slate-200">Jenis Layanan</th>
                            <th className="py-2 px-3 w-44 border-r border-slate-200">Topik Permasalahan</th>
                            <th className="py-2 px-3">Catatan Pembahasan & Rekomendasi Guru BK</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {counselingNotes.map((cn) => (
                            <tr key={cn.id}>
                              <td className="py-2 px-3 border-r border-slate-200 font-mono">{cn.date}</td>
                              <td className="py-2 px-3 border-r border-slate-200 font-medium text-slate-800">{cn.service_type}</td>
                              <td className="py-2 px-3 border-r border-slate-200 font-semibold text-slate-900">{cn.topic}</td>
                              <td className="py-2 px-3 text-slate-700">
                                <div>{cn.notes}</div>
                                {cn.recommendation && (
                                  <div className="text-[11px] text-blue-700 mt-1 font-semibold">
                                    Rekomendasi: {cn.recommendation}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Tindak Lanjut Table */}
                  {followUps.length > 0 && (
                    <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
                      <div className="bg-slate-100 px-3 py-1.5 font-bold text-slate-800 border-b border-slate-300">
                        Rencana & Realisasi Tindak Lanjut Layanan ({followUps.length} Tindakan)
                      </div>
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                            <th className="py-2 px-3 w-24 border-r border-slate-200">Tanggal</th>
                            <th className="py-2 px-3 w-28 border-r border-slate-200">Bidang</th>
                            <th className="py-2 px-3 w-36 border-r border-slate-200">Bentuk Layanan</th>
                            <th className="py-2 px-3 border-r border-slate-200">Fokus Kebutuhan</th>
                            <th className="py-2 px-3 w-24 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {followUps.map((fu) => (
                            <tr key={fu.id}>
                              <td className="py-2 px-3 border-r border-slate-200 font-mono">{fu.date}</td>
                              <td className="py-2 px-3 border-r border-slate-200 font-semibold">{fu.bidang}</td>
                              <td className="py-2 px-3 border-r border-slate-200 text-slate-800">{fu.service_type}</td>
                              <td className="py-2 px-3 border-r border-slate-200 text-slate-700">{fu.problem_need}</td>
                              <td className="py-2 px-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  fu.status === 'Selesai' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {fu.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* REKAP KELAS (jika mode rekap kelas) */}
          {classRecap && !student && (
            <div className="font-sans mb-6">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs mb-4">
                <span className="font-bold text-slate-800 block text-sm">
                  Ringkasan Kelas: {classRecap.class_name} (Tingkat {classRecap.grade})
                </span>
                <p className="text-slate-600 mt-1">
                  Total Siswa: {classRecap.total_students} | Responden: {classRecap.total_submitted} ({classRecap.participation_rate}%) | Rata-rata Kebutuhan: {classRecap.overall_average_pct}%
                </p>
              </div>

              {classRecap.category_averages && classRecap.category_averages.length > 0 && (
                <div className="border border-slate-300 rounded-lg overflow-hidden text-xs mb-4">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 font-bold">
                        <th className="py-2 px-3 border-r border-slate-300 w-12 text-center">No</th>
                        <th className="py-2 px-3 border-r border-slate-300">Bidang / Aspek</th>
                        <th className="py-2 px-3 border-r border-slate-300 text-center w-32">Rata-rata Kebutuhan (%)</th>
                        <th className="py-2 px-3 text-center w-36">Tingkat Indikasi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classRecap.category_averages.map((c: any, idx: number) => (
                        <tr key={idx} className="border-b border-slate-200">
                          <td className="py-2 px-3 text-center border-r border-slate-200">{idx + 1}</td>
                          <td className="py-2 px-3 font-semibold border-r border-slate-200">{c.category_name}</td>
                          <td className="py-2 px-3 text-center font-bold border-r border-slate-200">{c.average_pct}%</td>
                          <td className="py-2 px-3 text-center">
                            <PriorityBadge level={c.priority_level} label={c.interpretation} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TANDA TANGAN RESMI */}
          <div className="font-sans text-xs mt-10 pt-4 grid grid-cols-2 gap-8 text-center break-inside-avoid">
            <div>
              <p className="text-slate-600">Mengetahui,</p>
              <p className="font-bold text-slate-900">Kepala {settings.school_name}</p>
              <div className="h-20" />
              <p className="font-bold text-slate-900 underline">{settings.principal_name}</p>
              <p className="text-slate-500 text-[11px]">NIP. {settings.principal_nip}</p>
            </div>

            <div>
              <p className="text-slate-600">
                Sukabumi, {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}
              </p>
              <p className="font-bold text-slate-900">Koordinator Bimbingan & Konseling</p>
              <div className="h-20" />
              <p className="font-bold text-slate-900 underline">{settings.lead_counselor_name}</p>
              <p className="text-slate-500 text-[11px]">NIP. {settings.lead_counselor_nip}</p>
            </div>
          </div>
        </div>

        {/* Footer Action Bar - Hide on print */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between print:hidden shrink-0">
          <span className="text-xs text-slate-500">
            Gunakan tombol <strong>Cetak / Simpan PDF</strong> untuk menghasilkan dokumen resmi atau simpan format PDF.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              Tutup Pratinjau
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
