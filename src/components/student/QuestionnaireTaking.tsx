import React, { useState, useEffect } from 'react';
import { db } from '../../db/storage';
import { QuestionnaireService } from '../../services/QuestionnaireService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
  QuestionnaireQuestion,
  QuestionnaireOption,
} from '../../types/database';
import {
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Send,
  School,
  FileText,
  Printer,
  Sparkles,
  Lock,
  Check,
  LayoutList,
  Columns3,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PrintableReportModal } from '../reports/PrintableReportModal';
import { AnalysisService } from '../../services/AnalysisService';
import { LogoSMK } from '../common/LogoSMK';
import { LogoBK } from '../common/LogoBK';

interface QuestionnaireTakingProps {
  questionnaireTypeId: string;
  onFinish: () => void;
  onCancel: () => void;
}

export const QuestionnaireTaking: React.FC<QuestionnaireTakingProps> = ({
  questionnaireTypeId,
  onFinish,
  onCancel,
}) => {
  const { currentStudent } = useAuth();
  const { showToast } = useNotification();
  const settings = db.getSettings();

  const type = db.getQuestionnaireTypes().find((t) => t.id === questionnaireTypeId);
  const questions = db
    .getQuestions()
    .filter((q) => q.questionnaire_type_id === questionnaireTypeId && q.is_active)
    .sort((a, b) => a.question_number - b.question_number);

  const categories = db
    .getCategories()
    .filter((c) => c.questionnaire_type_id === questionnaireTypeId)
    .sort((a, b) => a.order_index - b.order_index);

  // Student class & grade
  const studentClass = db.getClasses().find((c) => c.id === currentStudent?.class_id);
  const studyProgram = studentClass
    ? db.getPrograms().find((p) => p.id === studentClass.study_program_id)
    : undefined;
  const studentGrade = studentClass?.grade || 'X';

  // Local answers state mapped by question_id -> { optionCode, scoreValue, careerTag }
  const [answersMap, setAnswersMap] = useState<
    Record<string, { optionCode: string; scoreValue: number; careerTag?: any }>
  >({});

  // Specific state for Kelas XII BMW: Rencana Utama Pasca Lulus
  const [initialCareerChoice, setInitialCareerChoice] = useState<'BEKERJA' | 'KULIAH' | 'WIRAUSAHA' | undefined>(undefined);

  // Specific state for Kelas XI AKPD: Bagian D Catatan Siswa
  const [studentNotes, setStudentNotes] = useState<string>('');

  const [responseId, setResponseId] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [canReedit, setCanReedit] = useState<boolean>(true);
  const [missingNumbers, setMissingNumbers] = useState<number[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  // View mode: 'TABLE' (Lembar Dokumen Resmi) vs 'PAGINATED' (Per Halaman)
  const [viewMode, setViewMode] = useState<'TABLE' | 'PAGINATED'>('TABLE');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Load existing draft or submitted answers
  useEffect(() => {
    if (!currentStudent || !type) return;

    const existingResp = db
      .getResponses()
      .find(
        (r) =>
          r.student_id === currentStudent.id && r.questionnaire_type_id === questionnaireTypeId
      );

    if (existingResp) {
      setResponseId(existingResp.id);
      setIsSubmitted(existingResp.status === 'SUBMITTED');
      setCanReedit(existingResp.can_reedit);
      if (existingResp.initial_career_choice) {
        setInitialCareerChoice(existingResp.initial_career_choice);
      }
      if (existingResp.student_notes) {
        setStudentNotes(existingResp.student_notes);
      }

      const existingAnswers = db.getAnswers().filter((a) => a.response_id === existingResp.id);
      const map: Record<string, { optionCode: string; scoreValue: number; careerTag?: any }> = {};
      existingAnswers.forEach((a) => {
        map[a.question_id] = {
          optionCode: a.selected_option_code,
          scoreValue: a.score_value,
          careerTag: a.career_tag,
        };
      });
      setAnswersMap(map);
    }
  }, [currentStudent, questionnaireTypeId, type]);

  if (!type || !currentStudent) return null;

  // Grade matching validation
  const isGradeMatched = type.target_grade === 'ALL' || type.target_grade === studentGrade;
  if (!isGradeMatched) {
    return (
      <div className="bg-white rounded-2xl border border-amber-200 p-8 text-center space-y-4 max-w-xl mx-auto my-12 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">
          Akses Angket Terbatas Tingkat Kelas
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Angket <strong>{type.title}</strong> diperuntukkan khusus bagi siswa <strong>Kelas {type.target_grade}</strong>. Anda saat ini terdaftar di <strong>Kelas {studentClass?.name || studentGrade}</strong>.
        </p>
        <div className="pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Kembali ke Angket Sesuai Kelas Saya
          </button>
        </div>
      </div>
    );
  }

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answersMap).length;
  const progressPct = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const totalPages = Math.ceil(totalQuestions / pageSize);

  const paginatedQuestions = questions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSelectOption = (
    question: QuestionnaireQuestion,
    optionCode: string,
    scoreValue: number,
    careerTag?: any
  ) => {
    if (isSubmitted && !canReedit) return;

    // Update local state
    setAnswersMap((prev) => ({
      ...prev,
      [question.id]: { optionCode, scoreValue, careerTag },
    }));

    // Auto save to database in background
    const resp = QuestionnaireService.saveAnswer(
      currentStudent.id,
      questionnaireTypeId,
      question.id,
      optionCode,
      scoreValue,
      careerTag
    );
    if (!responseId && resp) {
      setResponseId(resp.id);
    }

    // Remove from missing if answered
    if (missingNumbers.includes(question.question_number)) {
      setMissingNumbers((prev) => prev.filter((n) => n !== question.question_number));
    }
  };

  const handleOpenSubmitConfirm = () => {
    // Check missing items
    const missing: number[] = [];
    questions.forEach((q) => {
      if (!answersMap[q.id]) {
        missing.push(q.question_number);
      }
    });

    setMissingNumbers(missing);

    if (missing.length > 0) {
      showToast(
        'warning',
        'Belum Lengkap',
        `Masih ada ${missing.length} butir pertanyaan yang belum diisi. Mohon lengkapi seluruhnya.`
      );
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = () => {
    setShowConfirmModal(false);

    let activeRespId = responseId;
    if (!activeRespId) {
      let existingResp = db
        .getResponses()
        .find(
          (r) =>
            r.student_id === currentStudent.id && r.questionnaire_type_id === questionnaireTypeId
        );
      if (!existingResp) {
        existingResp = {
          id: `resp-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          questionnaire_type_id: questionnaireTypeId,
          student_id: currentStudent.id,
          status: 'DRAFT',
          started_at: new Date().toISOString(),
          can_reedit: true,
          total_answered: Object.keys(answersMap).length,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        db.saveResponse(existingResp);
      }
      activeRespId = existingResp.id;
      setResponseId(activeRespId);
    }

    const res = QuestionnaireService.submitResponse(
      activeRespId,
      initialCareerChoice,
      studentNotes
    );

    if (!res.success) {
      setMissingNumbers(res.missingNumbers);
      showToast('warning', 'Pengisian Belum Lengkap', res.message);
      return;
    }

    setIsSubmitted(true);
    setCanReedit(false);

    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    showToast(
      'success',
      'Pengisian Selesai!',
      'Jawaban angket berhasil dikirim ke Guru Bimbingan dan Konseling.'
    );
  };

  // Group questions by category for authentic table display
  const isBMW = type.scoring_model === 'CAREER_BMW';
  const isKelasXI = type.code === 'AKPD_XI' || type.id === 'qt-akpd';
  const isKelasX = type.code === 'AKPD_X' || type.id === 'qt-kelas-x';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Controls & Navigation Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Kembali ke Beranda Siswa</span>
        </button>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs">
            <button
              onClick={() => setViewMode('TABLE')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                viewMode === 'TABLE' ? 'bg-white shadow-2xs text-blue-700' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Lembar Utuh (Tabel Lampiran)</span>
            </button>
            <button
              onClick={() => setViewMode('PAGINATED')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                viewMode === 'PAGINATED' ? 'bg-white shadow-2xs text-blue-700' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>Per 10 Butir</span>
            </button>
          </div>

          {isSubmitted && (
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Hasil</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-slate-700 flex items-center gap-2">
            <span>Progres Pengisian:</span>
            <strong className="text-slate-900">{answeredCount} dari {totalQuestions} Pertanyaan Terjawab</strong>
          </span>
          <span className="font-extrabold text-blue-700">{progressPct}%</span>
        </div>
        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
          <div
            className={`h-full rounded-full transition-all duration-300 ease-out ${
              progressPct === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-600 to-indigo-600'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {missingNumbers.length > 0 && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              Butir yang belum diisi: <strong>{missingNumbers.join(', ')}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Formal Questionnaire Document (Matching the Attachment Style) */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 sm:p-10 space-y-8 print:shadow-none print:border-none print:p-0">
        {/* Document Header (KOP RESMI) */}
        <div className="border-b-2 border-slate-900 pb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="shrink-0">
              <LogoSMK size={68} className="drop-shadow-xs" />
            </div>
            <div className="flex-1 text-center space-y-0.5">
              <p className="text-[10px] sm:text-[11px] font-bold text-slate-600 uppercase tracking-widest">
                PEMERINTAH DAERAH PROVINSI JAWA BARAT • DINAS PENDIDIKAN
              </p>
              <p className="text-[9px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                CABANG DINAS PENDIDIKAN WILAYAH V • KABUPATEN SUKABUMI
              </p>
              <h1 className="text-sm sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                {settings.school_name}
              </h1>
              <p className="text-[11px] sm:text-xs font-bold text-blue-900 uppercase">
                LAYANAN BIMBINGAN DAN KONSELING (BK)
              </p>
              <p className="text-[9px] sm:text-[10px] text-slate-500">
                {settings.school_address} • Tahun Ajaran {settings.academic_year}
              </p>
            </div>
            <div className="shrink-0">
              <LogoBK size={70} className="drop-shadow-xs" />
            </div>
          </div>
        </div>

        {/* Title of the Questionnaire */}
        <div className="text-center space-y-1 py-1">
          <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
            {type.title}
          </h2>
          {isBMW && (
            <p className="text-xs font-semibold text-slate-600">
              Bimbingan dan Konseling (BK) — Orientasi Pasca Kelulusan (BMW: Bekerja, Melanjutkan/Kuliah, Wirausaha)
            </p>
          )}
          {isKelasXI && (
            <p className="text-xs font-semibold text-slate-600">
              SISWA SEKOLAH MENENGAH KEJURUAN (SMK)
            </p>
          )}
        </div>

        {/* Bagian A: IDENTITAS SISWA */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 sm:p-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
              A
            </span>
            <span>IDENTITAS SISWA</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-6 text-xs text-slate-700">
            <div className="flex">
              <span className="w-36 font-semibold text-slate-500 shrink-0">Nama Lengkap</span>
              <span className="font-bold text-slate-900">: {currentStudent.name}</span>
            </div>
            <div className="flex">
              <span className="w-36 font-semibold text-slate-500 shrink-0">Kelas / Program</span>
              <span className="font-semibold text-slate-900">: {studentClass?.name || '-'} / {studyProgram?.code || '-'}</span>
            </div>
            <div className="flex">
              <span className="w-36 font-semibold text-slate-500 shrink-0">Jenis Kelamin</span>
              <span className="font-semibold text-slate-900">: {currentStudent.gender === 'L' ? 'Laki-laki (L)' : 'Perempuan (P)'}</span>
            </div>
            <div className="flex">
              <span className="w-36 font-semibold text-slate-500 shrink-0">NIS / NISN</span>
              <span className="font-semibold text-slate-900">: {currentStudent.nis} / {currentStudent.nisn || '-'}</span>
            </div>
            <div className="flex">
              <span className="w-36 font-semibold text-slate-500 shrink-0">Tanggal Pengisian</span>
              <span className="font-semibold text-slate-900">: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>

          {/* Khusus Kelas XII BMW: Rencana Utama Pasca Lulus */}
          {isBMW && (
            <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center gap-3 text-xs">
              <span className="font-bold text-slate-800 shrink-0">Rencana Utama Pasca Lulus :</span>
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 hover:text-blue-700">
                  <input
                    type="radio"
                    name="initial_career"
                    disabled={isSubmitted && !canReedit}
                    checked={initialCareerChoice === 'BEKERJA'}
                    onChange={() => setInitialCareerChoice('BEKERJA')}
                    className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>[ ] Bekerja</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 hover:text-purple-700">
                  <input
                    type="radio"
                    name="initial_career"
                    disabled={isSubmitted && !canReedit}
                    checked={initialCareerChoice === 'KULIAH'}
                    onChange={() => setInitialCareerChoice('KULIAH')}
                    className="w-3.5 h-3.5 text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                  <span>[ ] Kuliah / Melanjutkan</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 hover:text-amber-700">
                  <input
                    type="radio"
                    name="initial_career"
                    disabled={isSubmitted && !canReedit}
                    checked={initialCareerChoice === 'WIRAUSAHA'}
                    onChange={() => setInitialCareerChoice('WIRAUSAHA')}
                    className="w-3.5 h-3.5 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <span>[ ] Wirausaha</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Bagian B: PETUNJUK PENGISIAN */}
        <div className="bg-blue-50/60 rounded-xl border border-blue-100 p-4 sm:p-5 space-y-2 text-xs text-blue-950">
          <h3 className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-blue-900 border-b border-blue-200/60 pb-1">
            <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center font-bold text-[10px]">
              B
            </span>
            <span>PETUNJUK PENGISIAN</span>
          </h3>

          {isBMW && (
            <div className="space-y-1.5 leading-relaxed text-[11px] sm:text-xs">
              <p>1. Angket ini bertujuan untuk memetakan kecenderungan minat karier Anda setelah lulus dari SMK.</p>
              <p>2. Bacalah setiap pernyataan dengan teliti dan pilih <strong>SATU</strong> jawaban dari 3 opsi yang paling mencerminkan kondisi atau cita-cita Anda saat ini:</p>
              <ul className="pl-4 list-disc space-y-0.5 font-medium text-slate-800">
                <li><strong>A = Bekerja</strong> (Langsung masuk dunia kerja / industri / perusahaan)</li>
                <li><strong>B = Kuliah</strong> (Melanjutkan pendidikan ke perguruan tinggi / akademi)</li>
                <li><strong>C = Wirausaha</strong> (Membuka usaha mandiri / berbisnis / entrepreneur)</li>
              </ul>
              <p>3. Jawablah dengan jujur sesuai dengan keyakinan diri Anda. Tidak ada jawaban benar atau salah.</p>
            </div>
          )}

          {isKelasXI && (
            <div className="space-y-1.5 leading-relaxed text-[11px] sm:text-xs">
              <p>1. Angket ini bertujuan untuk memetakan kebutuhan, masalah, dan minat Anda agar Layanan Bimbingan dan Konseling (BK) dapat memberikan bantuan yang tepat.</p>
              <p>2. Angket ini <strong>BUKAN TES</strong>, sehingga tidak ada jawaban benar atau salah dan tidak akan mempengaruhi nilai akademik Anda.</p>
              <p>3. Bacalah setiap pernyataan dengan cermat dan jujur sesuai dengan kondisi nyata yang sedang Anda alami atau butuhkan saat ini.</p>
              <p>4. Berikan tanda centang pada kolom <strong>[ Ya ]</strong> jika pernyataan tersebut sesuai/menggambarkan kondisi Anda, atau kolom <strong>[ Tidak ]</strong> jika tidak sesuai.</p>
            </div>
          )}

          {isKelasX && (
            <div className="space-y-1.5 leading-relaxed text-[11px] sm:text-xs">
              <p>1. Di bawah ini bukan alat tes, tetapi angket yang berisi tentang berbagai masalah yang sering dihadapi siswa.</p>
              <p>2. Jawaban Anda sangat bermanfaat untuk membantu keberhasilan belajar di sekolah ini.</p>
              <p>3. Pilihlah jawaban yang paling sesuai dengan kondisi Anda saat ini, dengan cara memberikan tanda pada kolom <strong>YA</strong> atau <strong>TIDAK</strong>.</p>
              <p>4. Jawaban Anda akan kami rahasiakan, untuk itu jawablah dengan sungguh-sungguh.</p>
              <p>5. Selamat mengerjakan.</p>
            </div>
          )}
        </div>

        {/* Bagian C: DAFTAR PERNYATAAN KEBUTUHAN / MINAT KARIER */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                C
              </span>
              <span>DAFTAR PERNYATAAN {isBMW ? 'ANGKET KARIER' : 'KEBUTUHAN SISWA'}</span>
            </h3>
            <span className="text-[11px] text-slate-500">
              Total: {totalQuestions} Butir Soal
            </span>
          </div>

          {/* Render Table (Full Table Mode) */}
          {viewMode === 'TABLE' && (
            <div className="border border-slate-300 rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  {/* Table Header */}
                  <thead>
                    <tr className="bg-slate-800 text-white font-bold text-center">
                      <th className="p-3 w-12 border-r border-slate-700">No</th>
                      <th className="p-3 text-left border-r border-slate-700">
                        {isBMW ? 'Pernyataan Angket Karier' : 'Pernyataan Kebutuhan / Masalah Siswa'}
                      </th>
                      {isBMW ? (
                        <>
                          <th className="p-2 sm:p-3 w-28 sm:w-32 border-r border-slate-700 bg-blue-900/80">
                            Opsi A<br /><span className="text-[10px] font-normal text-blue-200">(Bekerja)</span>
                          </th>
                          <th className="p-2 sm:p-3 w-28 sm:w-32 border-r border-slate-700 bg-purple-900/80">
                            Opsi B<br /><span className="text-[10px] font-normal text-purple-200">(Kuliah)</span>
                          </th>
                          <th className="p-2 sm:p-3 w-28 sm:w-32 bg-amber-900/80">
                            Opsi C<br /><span className="text-[10px] font-normal text-amber-200">(Wirausaha)</span>
                          </th>
                        </>
                      ) : (
                        <>
                          <th className="p-2 sm:p-3 w-20 sm:w-24 border-r border-slate-700 bg-emerald-900/80">
                            Ya
                          </th>
                          <th className="p-2 sm:p-3 w-20 sm:w-24 bg-slate-700">
                            Tidak
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {categories.map((cat) => {
                      const catQuestions = questions.filter((q) => q.category_id === cat.id);
                      if (catQuestions.length === 0) return null;

                      return (
                        <React.Fragment key={cat.id}>
                          {/* Category Header Row */}
                          <tr className="bg-blue-50/80 border-y border-blue-200">
                            <td
                              colSpan={isBMW ? 5 : 4}
                              className="p-2.5 px-4 font-extrabold text-blue-900 text-xs uppercase tracking-wide"
                            >
                              {cat.name}
                            </td>
                          </tr>

                          {/* Category Questions */}
                          {catQuestions.map((q) => {
                            const currentAns = answersMap[q.id];
                            const options = QuestionnaireService.getOptionsForQuestion(q.id, type);
                            const optA = options.find((o) => o.option_code === 'A');
                            const optB = options.find((o) => o.option_code === 'B');
                            const optC = options.find((o) => o.option_code === 'C');
                            const optYa = options.find((o) => o.option_code === 'YA');
                            const optTidak = options.find((o) => o.option_code === 'TIDAK');

                            return (
                              <tr
                                key={q.id}
                                className={`border-b border-slate-200 hover:bg-slate-50 transition-colors ${
                                  !currentAns ? 'bg-amber-50/20' : ''
                                }`}
                              >
                                <td className="p-3 text-center font-bold text-slate-600 border-r border-slate-200 align-top">
                                  {q.question_number}
                                </td>

                                <td className="p-3 border-r border-slate-200 align-top leading-relaxed text-slate-800">
                                  <div className="font-medium">{q.statement}</div>

                                  {/* Sub-options for BMW */}
                                  {isBMW && (
                                    <div className="mt-2 space-y-1 pl-1 text-[11px] text-slate-600">
                                      <div className={`${currentAns?.optionCode === 'A' ? 'font-bold text-blue-800' : ''}`}>
                                        {optA?.label || 'a. Bekerja'}
                                      </div>
                                      <div className={`${currentAns?.optionCode === 'B' ? 'font-bold text-purple-800' : ''}`}>
                                        {optB?.label || 'b. Kuliah'}
                                      </div>
                                      <div className={`${currentAns?.optionCode === 'C' ? 'font-bold text-amber-800' : ''}`}>
                                        {optC?.label || 'c. Wirausaha'}
                                      </div>
                                    </div>
                                  )}
                                </td>

                                {isBMW ? (
                                  <>
                                    {/* Option A Radio */}
                                    <td className="p-2 text-center border-r border-slate-200 align-middle">
                                      <button
                                        type="button"
                                        disabled={isSubmitted && !canReedit}
                                        onClick={() =>
                                          optA && handleSelectOption(q, 'A', optA.score_weight, 'BEKERJA')
                                        }
                                        className={`w-full py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
                                          currentAns?.optionCode === 'A'
                                            ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-300'
                                            : 'bg-slate-100 hover:bg-blue-50 text-slate-700 border border-slate-200'
                                        }`}
                                      >
                                        <span>[ A ]</span>
                                        {currentAns?.optionCode === 'A' && <Check className="w-3.5 h-3.5" />}
                                      </button>
                                    </td>

                                    {/* Option B Radio */}
                                    <td className="p-2 text-center border-r border-slate-200 align-middle">
                                      <button
                                        type="button"
                                        disabled={isSubmitted && !canReedit}
                                        onClick={() =>
                                          optB && handleSelectOption(q, 'B', optB.score_weight, 'KULIAH')
                                        }
                                        className={`w-full py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
                                          currentAns?.optionCode === 'B'
                                            ? 'bg-purple-600 text-white shadow-xs ring-2 ring-purple-300'
                                            : 'bg-slate-100 hover:bg-purple-50 text-slate-700 border border-slate-200'
                                        }`}
                                      >
                                        <span>[ B ]</span>
                                        {currentAns?.optionCode === 'B' && <Check className="w-3.5 h-3.5" />}
                                      </button>
                                    </td>

                                    {/* Option C Radio */}
                                    <td className="p-2 text-center align-middle">
                                      <button
                                        type="button"
                                        disabled={isSubmitted && !canReedit}
                                        onClick={() =>
                                          optC && handleSelectOption(q, 'C', optC.score_weight, 'WIRAUSAHA')
                                        }
                                        className={`w-full py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
                                          currentAns?.optionCode === 'C'
                                            ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-300'
                                            : 'bg-slate-100 hover:bg-amber-50 text-slate-700 border border-slate-200'
                                        }`}
                                      >
                                        <span>[ C ]</span>
                                        {currentAns?.optionCode === 'C' && <Check className="w-3.5 h-3.5" />}
                                      </button>
                                    </td>
                                  </>
                                ) : (
                                  <>
                                    {/* Ya Button */}
                                    <td className="p-2 text-center border-r border-slate-200 align-middle">
                                      <button
                                        type="button"
                                        disabled={isSubmitted && !canReedit}
                                        onClick={() =>
                                          optYa && handleSelectOption(q, 'YA', optYa.score_weight)
                                        }
                                        className={`w-full py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
                                          currentAns?.optionCode === 'YA'
                                            ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-300'
                                            : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 border border-slate-200'
                                        }`}
                                      >
                                        <span>Ya</span>
                                        {currentAns?.optionCode === 'YA' && <Check className="w-3.5 h-3.5" />}
                                      </button>
                                    </td>

                                    {/* Tidak Button */}
                                    <td className="p-2 text-center align-middle">
                                      <button
                                        type="button"
                                        disabled={isSubmitted && !canReedit}
                                        onClick={() =>
                                          optTidak && handleSelectOption(q, 'TIDAK', optTidak.score_weight)
                                        }
                                        className={`w-full py-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
                                          currentAns?.optionCode === 'TIDAK'
                                            ? 'bg-slate-700 text-white shadow-xs ring-2 ring-slate-400'
                                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
                                        }`}
                                      >
                                        <span>Tidak</span>
                                      </button>
                                    </td>
                                  </>
                                )}
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Render Paginated View Mode */}
          {viewMode === 'PAGINATED' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="font-semibold text-slate-600">
                  Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong> (Butir {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalQuestions)})
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 disabled:opacity-40 cursor-pointer text-xs"
                  >
                    Sebelumnya
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 disabled:opacity-40 cursor-pointer text-xs"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {paginatedQuestions.map((q) => {
                  const currentAns = answersMap[q.id];
                  const options = QuestionnaireService.getOptionsForQuestion(q.id, type);

                  return (
                    <div
                      key={q.id}
                      className={`p-4 rounded-xl border transition-all ${
                        currentAns ? 'bg-white border-slate-200' : 'bg-amber-50/30 border-amber-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {q.question_number}
                        </span>
                        <div className="flex-1 space-y-3">
                          <p className="font-semibold text-slate-900 text-xs sm:text-sm">
                            {q.statement}
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {options.map((opt) => {
                              const isSelected = currentAns?.optionCode === opt.option_code;
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  disabled={isSubmitted && !canReedit}
                                  onClick={() => handleSelectOption(q, opt.option_code, opt.score_weight, opt.career_tag)}
                                  className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center justify-between ${
                                    isSelected
                                      ? opt.career_tag === 'BEKERJA' || opt.option_code === 'YA'
                                        ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                                        : opt.career_tag === 'KULIAH'
                                        ? 'bg-purple-600 text-white border-purple-600 font-bold shadow-xs'
                                        : opt.career_tag === 'WIRAUSAHA'
                                        ? 'bg-amber-600 text-white border-amber-600 font-bold shadow-xs'
                                        : 'bg-slate-700 text-white border-slate-700 font-bold shadow-xs'
                                      : 'bg-slate-50 hover:bg-white border-slate-200 text-slate-700'
                                  }`}
                                >
                                  <span>{opt.label}</span>
                                  {isSelected && <Check className="w-4 h-4 shrink-0 ml-1" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Khusus Kelas XI: Bagian D CATATAN / HARAPAN KHUSUS SISWA (Opsional) */}
        {isKelasXI && (
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 sm:p-5 space-y-2 text-xs">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                D
              </span>
              <span>CATATAN / HARAPAN KHUSUS SISWA (Opsional)</span>
            </h3>
            <p className="text-slate-600 text-[11px]">
              Tuliskan topik atau masalah lain yang sangat ingin Anda konsultasikan/diskusikan dengan Guru BK:
            </p>
            <textarea
              rows={3}
              value={studentNotes}
              disabled={isSubmitted && !canReedit}
              onChange={(e) => setStudentNotes(e.target.value)}
              placeholder="Contoh: Saya membutuhkan bimbingan tentang memilih tempat PKL yang tepat dan ingin konsultasi mengenai cara mengatasi rasa cemas saat presentasi."
              className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none bg-white text-slate-800 font-medium"
            />
          </div>
        )}

        {/* Lembar Tanda Tangan / Pengesahan Dokumen */}
        <div className="pt-6 border-t border-slate-200 grid grid-cols-2 text-center text-xs text-slate-700 gap-6">
          <div className="space-y-16">
            <p className="font-medium">Mengetahui,<br />Guru Bimbingan dan Konseling (BK)</p>
            <div>
              <p className="font-bold underline text-slate-900">{settings.lead_counselor_name}</p>
              <p className="text-[10px] text-slate-500">NIP. {settings.lead_counselor_nip}</p>
            </div>
          </div>

          <div className="space-y-16">
            <p className="font-medium">
              Sukabumi, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br />
              Siswa / Responden
            </p>
            <div>
              <p className="font-bold underline text-slate-900">{currentStudent.name}</p>
              <p className="text-[10px] text-slate-500">NIS. {currentStudent.nis} / NISN. {currentStudent.nisn || '-'}</p>
            </div>
          </div>
        </div>

        {/* Bottom Submission Action Bar */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            Status Angket:{' '}
            <span className={`font-bold ${isSubmitted ? 'text-emerald-600' : 'text-amber-600'}`}>
              {isSubmitted ? 'Terkirim ke Guru BK' : `${answeredCount} dari ${totalQuestions} Terisi`}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {isSubmitted ? (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Jawaban Berhasil Terkirim</span>
                </span>
                <button
                  onClick={onFinish}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer transition-colors"
                >
                  Selesai & Ke Riwayat
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleOpenSubmitConfirm}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Kirim Jawaban Angket</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 text-blue-700">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Send className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">
                  Konfirmasi Pengiriman Angket
                </h4>
                <p className="text-[11px] text-slate-500">{type.title}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Seluruh <strong>{totalQuestions}</strong> butir pertanyaan telah Anda jawab. Apakah Anda yakin ingin mengirimkan lembar angket ini ke Guru Bimbingan dan Konseling?
            </p>

            {isBMW && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-1">
                <span className="font-bold text-blue-900">Rencana Utama Pasca Lulus:</span>
                <p className="text-blue-800">
                  {initialCareerChoice ? `[ ${initialCareerChoice} ]` : 'Belum memilih (dapat diubah nanti)'}
                </p>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Periksa Kembali
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Ya, Kirim Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Report Modal */}
      {isPrintModalOpen && (
        <PrintableReportModal
          isOpen={isPrintModalOpen}
          title={type.title}
          student={currentStudent}
          careerResult={responseId ? AnalysisService.calculateResponseAnalysis(responseId).careerResult : undefined}
          analysis={responseId ? AnalysisService.calculateResponseAnalysis(responseId).categoryAnalysis : undefined}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}
    </div>
  );
};
