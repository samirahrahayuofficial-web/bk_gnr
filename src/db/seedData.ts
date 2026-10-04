import {
  AcademicYear,
  ClassRoom,
  CounselingNote,
  FollowUp,
  QuestionnaireCategory,
  QuestionnaireOption,
  QuestionnaireQuestion,
  QuestionnaireType,
  Student,
  StudyProgram,
  SystemSettings,
  Teacher,
  User,
} from '../types/database';

export const initialSettings: SystemSettings = {
  school_name: 'SMK Negeri 1 Gunungguruh',
  school_npsn: '20253725',
  school_address: 'Jl. Babakan, Cisaat, Kec. Gunungguruh, Kab. Sukabumi, Jawa Barat 43152',
  principal_name: 'Drs. H. Bambang Sudirman, M.M.',
  principal_nip: '19680512 199303 1 004',
  lead_counselor_name: 'Dra. Hj. Siti Rahmawati, M.Pd., Kons.',
  lead_counselor_nip: '19740819 199802 2 001',
  academic_year: '2024/2025',
  thresholds: {
    urgent_min: 81,
    high_min: 61,
    medium_min: 41,
    low_min: 21,
  },
};

export const initialAcademicYears: AcademicYear[] = [
  { id: 'ay-2024-ganjil', name: '2024/2025', semester: 'Ganjil', is_active: true, created_at: '2024-07-01' },
  { id: 'ay-2023-genap', name: '2023/2024', semester: 'Genap', is_active: false, created_at: '2024-01-02' },
];

import { initialStudyPrograms, initialClasses } from './schoolData';
import { initialStudents } from './allStudents';

export { initialStudyPrograms, initialClasses, initialStudents };

export const initialTeachers: Teacher[] = [
  {
    id: 'tch-1',
    nip: '19740819 199802 2 001',
    name: 'Dra. Hj. Siti Rahmawati, M.Pd., Kons.',
    gender: 'P',
    phone: '081234567890',
    specialization: 'Koordinator BK & Bimbingan Karir',
    user_id: 'usr-bk-1',
    created_at: '2024-01-01',
  },
  {
    id: 'tch-2',
    nip: '19850314 201001 1 012',
    name: 'Ahmad Fauzi, S.Pd., Kons.',
    gender: 'L',
    phone: '081298765432',
    specialization: 'Konseling Individual & Bidang Pribadi/Sosial',
    user_id: 'usr-bk-2',
    created_at: '2024-01-01',
  },
];

export const initialUsers: User[] = [
  {
    id: 'usr-administrator',
    username: 'administrator',
    name: 'Administrator Sistem BK',
    email: 'administrator@smkn1gunungguruh.sch.id',
    role: 'ADMIN',
    password: 'rahasia',
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: 'usr-admin',
    username: 'admin',
    name: 'Administrator BK & Sekolah',
    email: 'admin.bk@smkn1gunungguruh.sch.id',
    role: 'ADMIN',
    password: 'rahasia',
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: 'usr-samirah',
    username: 'samirahrahayu',
    name: 'Samirah Rahayu (Admin)',
    email: 'samirahrahayu.official@gmail.com',
    role: 'ADMIN',
    password: 'rahasia',
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: 'usr-bk-1',
    username: 'sitirahmawati',
    name: 'Dra. Hj. Siti Rahmawati, M.Pd., Kons.',
    email: 'siti.rahmawati@smkn1gunungguruh.sch.id',
    role: 'GURU_BK',
    related_id: 'tch-1',
    password: '12345678',
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: 'usr-bk-2',
    username: 'ahmadfauzi',
    name: 'Ahmad Fauzi, S.Pd., Kons.',
    email: 'ahmad.fauzi@smkn1gunungguruh.sch.id',
    role: 'GURU_BK',
    related_id: 'tch-2',
    password: '12345678',
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
];

export const initialQuestionnaireTypes: QuestionnaireType[] = [
  // 1. ANGKET KEBUTUHAN PESERTA DIDIK (AKPD) KELAS X (50 Soal)
  {
    id: 'qt-kelas-x',
    code: 'AKPD_X',
    title: 'ANGKET KEBUTUHAN PESERTA DIDIK (AKPD) KELAS X',
    description: 'Instrumen asesmen kebutuhan peserta didik SMK Kelas 10 untuk memetakan masalah belajar, pribadi, sosial, dan karir awal.',
    target_grade: 'X',
    total_questions: 50,
    scoring_model: 'AKPD_PERCENT',
    is_active: true,
    allow_student_view_result: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },

  // 2. ANGKET KEBUTUHAN PESERTA DIDIK (AKPD) KELAS XI (40 Soal)
  {
    id: 'qt-akpd',
    code: 'AKPD_XI',
    title: 'ANGKET KEBUTUHAN PESERTA DIDIK (AKPD) KELAS XI',
    description: 'Instrumen asesmen non-kognitif 4 bidang bimbingan (Pribadi, Sosial, Belajar, Karir & DUDI) untuk menentukan kebutuhan layanan BK siswa kelas XI SMK.',
    target_grade: 'XI',
    total_questions: 40,
    scoring_model: 'AKPD_PERCENT',
    is_active: true,
    allow_student_view_result: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },

  // 3. ANGKET MINAT KARIER SISWA KELAS XII SMK (BMW: 50 Soal)
  {
    id: 'qt-bmw',
    code: 'BMW',
    title: 'ANGKET MINAT KARIER SISWA KELAS XII SMK',
    description: 'Bimbingan dan Konseling (BK) — Orientasi Pasca Kelulusan (BMW: Bekerja, Melanjutkan/Kuliah, Wirausaha)',
    target_grade: 'XII',
    total_questions: 50,
    scoring_model: 'CAREER_BMW',
    is_active: true,
    allow_student_view_result: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
];

export const initialCategories: QuestionnaireCategory[] = [
  // Categories for AKPD KELAS X (50 Soal)
  { id: 'cat-x-pribadi', questionnaire_type_id: 'qt-kelas-x', code: 'PRIBADI', name: 'Bidang Pribadi', description: 'Nilai keagamaan, kejujuran, emosi, potensi diri, dan karakter', order_index: 1 },
  { id: 'cat-x-sosial', questionnaire_type_id: 'qt-kelas-x', code: 'SOSIAL', name: 'Bidang Sosial', description: 'Lingkungan baru, pertemanan, bullying, dan interaksi sosial', order_index: 2 },
  { id: 'cat-x-belajar', questionnaire_type_id: 'qt-kelas-x', code: 'BELAJAR', name: 'Bidang Belajar', description: 'Cara belajar SMK, prestasi, gaya belajar, dan pemanfaatan teknologi', order_index: 3 },
  { id: 'cat-x-karir', questionnaire_type_id: 'qt-kelas-x', code: 'KARIR', name: 'Bidang Karir', description: 'Peminatan kejuruan, hobi, bakat, dan perencanaan karir awal', order_index: 4 },

  // Categories for AKPD KELAS XI (40 Soal: 4 Bidang)
  { id: 'cat-akpd-pribadi', questionnaire_type_id: 'qt-akpd', code: 'PRIBADI', name: 'I. BIDANG PRIBADI', description: 'Pemahaman potensi diri, percaya diri, emosi, kesehatan mental dan nilai hidup', order_index: 1 },
  { id: 'cat-akpd-sosial', questionnaire_type_id: 'qt-akpd', code: 'SOSIAL', name: 'II. BIDANG SOSIAL', description: 'Hubungan pertemanan, kerja kelompok, anti-bullying, komunikasi dan empati', order_index: 2 },
  { id: 'cat-akpd-belajar', questionnaire_type_id: 'qt-akpd', code: 'BELAJAR', name: 'III. BIDANG BELAJAR', description: 'Gaya belajar, prokrastinasi, konsentrasi, motivasi dan persiapan ujian', order_index: 3 },
  { id: 'cat-akpd-karir', questionnaire_type_id: 'qt-akpd', code: 'KARIR', name: 'IV. BIDANG KARIR & DUNIA KERJA (DUDI)', description: 'Perencanaan karir, CV, wawancara kerja, kesiapan PKL dan info studi lanjut', order_index: 4 },

  // Categories for BMW KELAS XII (50 Soal: 5 Aspek)
  { id: 'cat-bmw-1', questionnaire_type_id: 'qt-bmw', code: 'ASPEK_1', name: 'ASPEK 1: ORIENTASI DAN CITA-CITA KARIER UTAMA (Soal 1 - 10)', description: 'Target utama pasca kelulusan, visi masa depan, dan impian finansial', order_index: 1 },
  { id: 'cat-bmw-2', questionnaire_type_id: 'qt-bmw', code: 'ASPEK_2', name: 'ASPEK 2: KETERAMPILAN, MINAT, DAN KEMAMPUAN DIRI (Soal 11 - 20)', description: 'Keterampilan praktis, gaya bekerja, risiko finansial, dan potensi diri', order_index: 2 },
  { id: 'cat-bmw-3', questionnaire_type_id: 'qt-bmw', code: 'ASPEK_3', name: 'ASPEK 3: KONDISI LINGKUNGAN, KELUARGA, DAN FINANSIAL (Soal 21 - 30)', description: 'Dukungan keluarga, situasi finansial, relasi sosial, dan tuntutan kemandirian', order_index: 3 },
  { id: 'cat-bmw-4', questionnaire_type_id: 'qt-bmw', code: 'ASPEK_4', name: 'ASPEK 4: KESIAPAN MENGHADAPI TANTANGAN DAN RISIKO (Soal 31 - 40)', description: 'Persaingan dunia nyata, ketahanan mental, resiliensi, dan fleksibilitas', order_index: 4 },
  { id: 'cat-bmw-5', questionnaire_type_id: 'qt-bmw', code: 'ASPEK_5', name: 'ASPEK 5: RENCANA PENGEMBANGAN DAN MASA DEPAN KARIER (Soal 41 - 50)', description: 'Rencana 5 tahun ke depan, strategi kemandirian, kepemimpinan, dan keyakinan pilihan', order_index: 5 },
];

export const defaultYesNoOptions: QuestionnaireOption[] = [
  { id: 'opt-ya', option_code: 'YA', label: 'Ya', score_weight: 1, order_index: 1 },
  { id: 'opt-tidak', option_code: 'TIDAK', label: 'Tidak', score_weight: 0, order_index: 2 },
];

// 40 Statements for AKPD KELAS XI (Exact text from PDF 2)
export const akpdQuestions: QuestionnaireQuestion[] = [
  // I. BIDANG PRIBADI (1-10)
  { id: 'akpd-q-1', questionnaire_type_id: 'qt-akpd', category_id: 'cat-akpd-pribadi', question_number: 1, statement: 'Saya belum memahami potensi, kelebihan, dan kekurangan yang ada pada diri saya.', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'akpd-q-2', questionnaire_type_id: 'qt-akpd', category_id: 'cat-akpd-pribadi', question_number: 2, statement: 'Saya merasa kurang percaya diri saat tampil di depan umum atau melakukan presentasi di kelas.', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'akpd-q-3', questionnaire_type_id: 'qt-akpd', category_id: 'cat-akpd-pribadi', question_number: 3, statement: 'Saya sering merasa cemas, stres, atau kewalahan saat menghadapi ujian dan tugas sekolah.', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'akpd-q-4', questionnaire_type_id: 'qt-akpd', category_id: 'cat-akpd-pribadi', question_number: 4, statement: 'Saya kesulitan mengelola waktu antara kegiatan belajar, membantu orang tua, berorganisasi, dan bermain.', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'akpd-q-5', questionnaire_type_id: 'qt-akpd', category_id: 'cat-akpd-pribadi', question_number: 5, statement: 'Saya merasa sulit mengendalikan emosi (mudah marah, sedih, atau frustrasi saat menghadapi masalah).', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'akpd-q-6', questionnaire_type_id: 'qt-akpd', category_id: 'cat-akpd-pribadi', question_number: 6, statement: 'Saya kurang memahami pentingnya menjaga kesehatan fisik serta kesehatan mental di usia remaja.', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'akpd-q-7', questionnaire_type_id: 'qt-akpd', category_id: 'cat-akpd-pribadi', question_number: 7, statement: 'Saya merasa sulit untuk menolak ajakan teman sebaya yang dapat berdampak negatif (peer pressure).', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'akpd-q-8', questionnaire_type_id: 'qt-akpd', category_id: 'cat-akpd-pribadi', question_number: 8, statement: 'Saya merasa membutuhkan bimbingan dalam meningkatkan kedisiplinan dan tanggung jawab diri.', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'akpd-q-9', questionnaire_type_id: 'qt-akpd', category_id: 'cat-akpd-pribadi', question_number: 9, statement: 'Saya belum mampu menjalankan ibadah dan kehidupan beragama secara rutin dan konsisten.', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'akpd-q-10', questionnaire_type_id: 'qt-akpd', category_id: 'cat-akpd-pribadi', question_number: 10, statement: 'Saya merasa ragu dan pesimis dengan kemampuan diri saya untuk sukses di masa depan.', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },

  // II. BIDANG SOSIAL (11-20)
  { id: 'akpd-q-11', questionnaire_type_id: 'qt-akpd', category_id: 'cat-akpd-sosial', question_number: 11, statement: 'Saya merasa canggung, malu, atau kesulitan dalam berteman dan bersosialisasi di lingkungan sekolah.', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'akpd-q-12', questionnaire_type_id: 'qt-akpd', category_id: 'cat-akpd-sosial', question_number: 12, statement: 'Saya sering merasa tidak nyaman atau cemas saat harus bekerja dalam tim / kelompok.', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'akpd-q-13', questionnaire_type_id: 'qt-akpd', category_id: 'cat-akpd-sosial', question_number: 13, statement: 'Saya pernah merasa menjadi korban, atau khawatir menghadapi tindakan perundungan (bullying).', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'akpd-q-14', questionnaire_type_id: 'qt-akpd', category_id: 'cat-akpd-sosial', question_number: 14, statement: 'Saya belum tahu cara menyelesaikan konflik atau perselisihan dengan teman secara sehat dan bijak.', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'akpd-q-15', questionnaire_type_id: 'qt-akpd', category_id: 'cat-akpd-sosial', question_number: 15, statement: 'Saya merasa kurang peka, empati, atau peduli terhadap kondisi sosial dan orang-orang di sekitar saya.', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'akpd-q-16', questionnaire_type_id: 'qt-akpd', category_id: 'cat-akpd-sosial', question_number: 16, statement: 'Saya kesulitan berkomunikasi secara efektif, santun, dan sopan dengan guru atau orang yang lebih tua.', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'akpd-q-17', questionnaire_type_id: 'qt-akpd', category_id: 'cat-akpd-sosial', question_number: 17, statement: 'Saya merasa norma sosial, etika pergaulan, dan sopan santun remaja perlu lebih saya pelajari.', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'akpd-q-18', questionnaire_type_id: 'qt-akpd', category_id: 'cat-akpd-sosial', question_number: 18, statement: 'Saya mengalami ketergantungan / kecanduan bermain media sosial, game online, atau gadget.', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'akpd-q-19', questionnaire_type_id: 'qt-akpd', category_id: 'cat-akpd-sosial', question_number: 19, statement: 'Saya ingin belajar cara menjadi pemimpin yang baik, tegas, dan dapat mengayomi teman-teman.', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'akpd-q-20', questionnaire_type_id: 'qt-akpd', category_id: 'cat-akpd-sosial', question_number: 20, statement: 'Saya merasa terisolasi atau kurang diterima dalam kelompok teman sebaya di kelas maupun sekolah.', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },

  // III. BIDANG BELAJAR (21-30)
  { id: 'akpd-q-21', questionnaire_type_id: 'qt-akpd', category_id: 'cat-akpd-belajar', question_number: 21, statement: 'Saya kesulitan memahami gaya belajar yang paling cocok dan efektif untuk diri saya.', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'akpd-q-22', questionnaire_type_id: 'qt-akpd', category_id: 'cat-akpd-belajar', question_number: 22, statement: 'Saya sering menunda-nunda mengerjakan PR, laporan praktik, atau tugas kejuruan tepat waktu.', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'akpd-q-23', questionnaire_type_id: 'qt-akpd', category_id: 'cat-akpd-belajar', question_number: 23, statement: 'Saya merasa prestasi belajar dan pencapaian nilai mata pelajaran kejuruan/produktif saya belum optimal.', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'akpd-q-24', questionnaire_type_id: 'qt-akpd', category_id: 'cat-akpd-belajar', question_number: 24, statement: 'Saya belum menemukan strategi belajar yang pas untuk memahami materi eksak atau teori kejuruan yang rumit.', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'akpd-q-25', questionnaire_type_id: 'qt-akpd', category_id: 'cat-akpd-belajar', question_number: 25, statement: 'Saya merasa konsentrasi dan daya ingat saya mudah terpecah saat mengikuti pembelajaran di kelas/bengkel.', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'akpd-q-26', questionnaire_type_id: 'qt-akpd', category_id: 'cat-akpd-belajar', question_number: 26, statement: 'Saya merasa khawatir dan belum siap mental dalam menghadapi Uji Kompetensi Keahlian (UKK) / Ujian Akhir.', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'akpd-q-27', questionnaire_type_id: 'qt-akpd', category_id: 'cat-akpd-belajar', question_number: 27, statement: 'Saya merasa fasilitas dan suasana belajar di rumah kurang mendukung untuk belajar dengan tenang.', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'akpd-q-28', questionnaire_type_id: 'qt-akpd', category_id: 'cat-akpd-belajar', question_number: 28, statement: 'Saya kesulitan memanfaatkan media internet dan teknologi secara produktif untuk mendukung kegiatan belajar.', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'akpd-q-29', questionnaire_type_id: 'qt-akpd', category_id: 'cat-akpd-belajar', question_number: 29, statement: 'Saya merasa kurang termotivasi dan cepat merasa bosan saat mengikuti proses pembelajaran di sekolah.', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'akpd-q-30', questionnaire_type_id: 'qt-akpd', category_id: 'cat-akpd-belajar', question_number: 30, statement: 'Saya membutuhkan bantuan dalam menyusun jadwal belajar mandiri secara teratur di rumah.', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },

  // IV. BIDANG KARIR & DUNIA KERJA (DUDI) (31-40)
  { id: 'akpd-q-31', questionnaire_type_id: 'qt-akpd', category_id: 'cat-akpd-karir', question_number: 31, statement: 'Saya belum memiliki gambaran dan perencanaan karir yang jelas setelah lulus SMK (Bekerja, Melanjutkan, Wirausaha / BMW).', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'akpd-q-32', questionnaire_type_id: 'qt-akpd', category_id: 'cat-akpd-karir', question_number: 32, statement: 'Saya merasa ragu apakah jurusan / program keahlian yang saya pilih saat ini sudah sesuai minat dan bakat saya.', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'akpd-q-33', questionnaire_type_id: 'qt-akpd', category_id: 'cat-akpd-karir', question_number: 33, statement: 'Saya belum mengetahui cara membuat Surat Lamaran Kerja dan Curriculum Vitae (CV) yang menarik dan profesional.', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'akpd-q-34', questionnaire_type_id: 'qt-akpd', category_id: 'cat-akpd-karir', question_number: 34, statement: 'Saya merasa belum memiliki kesiapan untuk menghadapi proses wawancara kerja (interview) dan psikotes kerja.', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'akpd-q-35', questionnaire_type_id: 'qt-akpd', category_id: 'cat-akpd-karir', question_number: 35, statement: 'Saya merasa belum siap secara mental, fisik, dan keterampilan untuk mengikuti Praktik Kerja Lapangan (PKL) / Magang Industri.', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'akpd-q-36', questionnaire_type_id: 'qt-akpd', category_id: 'cat-akpd-karir', question_number: 36, statement: 'Saya belum memahami etika kerja, budaya industri, serta kedisiplinan tinggi yang dituntut di dunia kerja (DUDI).', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'akpd-q-37', questionnaire_type_id: 'qt-akpd', category_id: 'cat-akpd-karir', question_number: 37, statement: 'Saya berminat mengembangkan keterampilan berwirausaha / membuat produk bernilai jual tetapi bingung memulainya.', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'akpd-q-38', questionnaire_type_id: 'qt-akpd', category_id: 'cat-akpd-karir', question_number: 38, statement: 'Saya kekurangan informasi mengenai peluang lowongan kerja, penyaluran BKK, dan profil perusahaan rekanan sekolah.', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'akpd-q-39', questionnaire_type_id: 'qt-akpd', category_id: 'cat-akpd-karir', question_number: 39, statement: 'Saya belum mengetahui informasi perguruan tinggi, politeknik, atau program beasiswa yang relevan dengan jurusan saya.', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'akpd-q-40', questionnaire_type_id: 'qt-akpd', category_id: 'cat-akpd-karir', question_number: 40, statement: 'Saya membutuhkan layanan bimbingan karir untuk merencanakan masa depan karir saya secara matang.', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
];

// 50 Questions for BMW KELAS XII (Exact text and options from PDF 1)
export const bmwDataFromPdf: {
  num: number;
  statement: string;
  a: string;
  b: string;
  c: string;
  aspectId: string;
}[] = [
  // ASPEK 1: ORIENTASI DAN CITA-CITA KARIER UTAMA (Soal 1 - 10)
  {
    num: 1,
    statement: 'Setelah lulus SMK nanti, target utama yang paling ingin segera saya capai adalah...',
    a: 'Langsung bekerja di perusahaan / industri',
    b: 'Melanjutkan kuliah di perguruan tinggi',
    c: 'Memulai dan membangun usaha sendiri',
    aspectId: 'cat-bmw-1',
  },
  {
    num: 2,
    statement: 'Ketika membayangkan masa depan 3-5 tahun ke depan, saya melihat diri saya...',
    a: 'Menjadi karyawan profesional yang sukses',
    b: 'Menjadi sarjana/ahli yang berwawasan luas',
    c: 'Menjadi pemilik usaha (owner) yang berkembang',
    aspectId: 'cat-bmw-1',
  },
  {
    num: 3,
    statement: 'Alasan terbesar saya memilih jalur karier setelah lulus adalah...',
    a: 'Ingin mandiri secara finansial dan mendapat gaji rutin',
    b: 'Ingin mendalami ilmu pengetahuan di jenjang lebih tinggi',
    c: 'Ingin bebas mengatur waktu dan menciptakan lapangan kerja',
    aspectId: 'cat-bmw-1',
  },
  {
    num: 4,
    statement: 'Menurut saya, pencapaian hidup paling membanggakan dalam 2 tahun ke depan adalah...',
    a: 'Lolos seleksi masuk di perusahaan ternama',
    b: 'Diterima di PTN/PTS favorit pilihan utama',
    c: 'Produk/jasa dari bisnis saya makin dikenal luas',
    aspectId: 'cat-bmw-1',
  },
  {
    num: 5,
    statement: 'Jika orang tua membebaskan pilihan saya setelah lulus, saya akan memilih...',
    a: 'Melamar pekerjaan sesuai bidang keahlian SMK',
    b: 'Mendaftar jalur seleksi masuk perguruan tinggi',
    c: 'Membuka usaha kreatif mandiri',
    aspectId: 'cat-bmw-1',
  },
  {
    num: 6,
    statement: 'Status sosial dan peran yang paling sesuai dengan impian saya adalah...',
    a: 'Pekerja terampil yang handal di industri',
    b: 'Akademisi, peneliti, atau profesional berpendidikan tinggi',
    c: 'Wirausahawan mandiri dan pengusaha muda',
    aspectId: 'cat-bmw-1',
  },
  {
    num: 7,
    statement: 'Prioritas hidup saya dalam jangka pendek (1 tahun setelah lulus) adalah...',
    a: 'Mendapatkan penghasilan tetap bulanan',
    b: 'Mengembangkan kapasitas akademis dan gelar',
    c: 'Mengembangkan ide bisnis dan mencari pasar',
    aspectId: 'cat-bmw-1',
  },
  {
    num: 8,
    statement: 'Pandangan saya mengenai gelar sarjana/diploma saat ini adalah...',
    a: 'Bagus, tapi memiliki pengalaman kerja praktis lebih penting',
    b: 'Sangat penting untuk menunjang karier dan masa depan saya',
    c: 'Tidak wajib, karena keberhasilan bisnis ditentukan oleh aksi nyata',
    aspectId: 'cat-bmw-1',
  },
  {
    num: 9,
    statement: 'Impian terbesar saya terkait finansial adalah...',
    a: 'Memiliki gaji bulanan yang stabil dan jenjang karier jelas',
    b: 'Menginvestasikan ilmu untuk prospek karier tingkat atas',
    c: 'Memiliki keuntungan bisnis tanpa batas dari usaha sendiri',
    aspectId: 'cat-bmw-1',
  },
  {
    num: 10,
    statement: 'Fokus utama saya saat menyusun langkah pasca SMK adalah...',
    a: 'Mencari lowongan kerja yang relevan dengan jurusan',
    b: 'Mencari informasi jurusan kuliah dan jalur beasiswa',
    c: 'Mencari ide bisnis, riset produk, dan modal awal',
    aspectId: 'cat-bmw-1',
  },

  // ASPEK 2: KETERAMPILAN, MINAT, DAN KEMAMPUAN DIRI (Soal 11 - 20)
  {
    num: 11,
    statement: 'Keterampilan praktis yang saya dapatkan selama di SMK paling ingin saya gunakan untuk...',
    a: 'Menyelesaikan tugas dan pekerjaan di perusahaan',
    b: 'Landasan dasar untuk mendalami teori saat kuliah',
    c: 'Modal utama membuat produk/jasa usaha sendiri',
    aspectId: 'cat-bmw-2',
  },
  {
    num: 12,
    statement: 'Gaya belajar dan bekerja yang paling menyenangkan bagi saya adalah...',
    a: 'Mengikuti SOP yang jelas dan instruksi kerja industri',
    b: 'Menganalisis teori, berdiskusi, dan riset mendalam',
    c: 'Mencoba hal baru, berkreasi, dan mengambil risiko',
    aspectId: 'cat-bmw-2',
  },
  {
    num: 13,
    statement: 'Ketika dihadapkan pada masalah yang rumit, saya cenderung...',
    a: 'Berdiskusi dengan atasan/rekan untuk solusinya',
    b: 'Mencari referensi literatur dan kajian akademis',
    c: 'Mencari peluang dan jalan keluar kreatif secara mandiri',
    aspectId: 'cat-bmw-2',
  },
  {
    num: 14,
    statement: 'Kemampuan interpersonal yang paling ingin saya kembangkan adalah...',
    a: 'Kerjasama tim dan adaptasi dengan budaya kerja',
    b: 'Kemampuan analisis, presentasi, dan pemikiran kritis',
    c: 'Negosiasi bisnis, pemasaran, dan pembentukan jejaring',
    aspectId: 'cat-bmw-2',
  },
  {
    num: 15,
    statement: 'Tipe tugas sekolah/praktikum yang paling saya nikmati adalah...',
    a: 'Simulasi kerja industri sesuai dengan standar SOP',
    b: 'Makalah, tugas riset, dan presentasi akademis',
    c: 'Proyek kewirausahaan / menjual produk ke konsumen',
    aspectId: 'cat-bmw-2',
  },
  {
    num: 16,
    statement: 'Saya merasa paling percaya diri ketika...',
    a: 'Mampu menyelesaikan pekerjaan tepat waktu dan rapi',
    b: 'Memahami konsep materi pelajaran yang sulit',
    c: 'Berhasil menjual barang/jasa dan mendapat keuntungan',
    aspectId: 'cat-bmw-2',
  },
  {
    num: 17,
    statement: 'Menghadapi aturan dan struktur organisasi yang ketat, saya merasa...',
    a: 'Nyaman karena ada kepastian tugas dan tanggung jawab',
    b: 'Terbiasa selama menunjang proses belajar yang baik',
    c: 'Kurang bebas, saya lebih suka membuat aturan sendiri',
    aspectId: 'cat-bmw-2',
  },
  {
    num: 18,
    statement: 'Keberanian mengambil risiko finansial dalam diri saya tergolong...',
    a: 'Rendah, saya lebih memilih pendapatan yang pasti',
    b: 'Sedang, berani berinvestasi pada biaya pendidikan',
    c: 'Tinggi, berani berspekulasi modal demi potensi bisnis',
    aspectId: 'cat-bmw-2',
  },
  {
    num: 19,
    statement: 'Kemampuan saya dalam mengelola waktu akan sangat optimal jika...',
    a: 'Mengikuti jam kerja terstruktur (shift/office hour)',
    b: 'Mengatur jadwal belajar mandiri dan kuliah',
    c: 'Mengatur sendiri fleksibilitas waktu kerja harian',
    aspectId: 'cat-bmw-2',
  },
  {
    num: 20,
    statement: 'Minat utama saya dalam pengembangan potensi diri adalah...',
    a: 'Memperdalam keahlian teknis (hard skill) industri',
    b: 'Melanjutkan studi ke jenjang S1/D4 untuk kepakaran',
    c: 'Mengasah intuisi bisnis dan kepemimpinan (leadership)',
    aspectId: 'cat-bmw-2',
  },

  // ASPEK 3: KONDISI LINGKUNGAN, KELUARGA, DAN FINANSIAL (Soal 21 - 30)
  {
    num: 21,
    statement: 'Dukungan utama yang paling diharapkan dari keluarga setelah lulus SMK adalah...',
    a: 'Merestui dan membantu mencari info lowongan kerja',
    b: 'Membimbing dan mendukung pembiayaan kuliah',
    c: 'Memberikan dorongan moral dan bantuan modal awal',
    aspectId: 'cat-bmw-3',
  },
  {
    num: 22,
    statement: 'Kondisi keuangan keluarga saat ini mendorong saya untuk...',
    a: 'Segera bekerja agar bisa membantu ekonomi keluarga',
    b: 'Mengusahakan kuliah baik mandiri maupun beasiswa',
    c: 'Membuka usaha yang cepat menghasilkan pendapatan',
    aspectId: 'cat-bmw-3',
  },
  {
    num: 23,
    statement: 'Saran atau harapan terbanyak dari orang tua/keluarga saya adalah...',
    a: 'Mandiri dan secepatnya mendapatkan pekerjaan',
    b: 'Melanjutkan pendidikan tinggi agar meraih gelar',
    c: 'Mengembangkan usaha keluarga atau merintis bisnis',
    aspectId: 'cat-bmw-3',
  },
  {
    num: 24,
    statement: 'Melihat teman-teman sebaya di sekolah, saya merasa paling terinspirasi oleh mereka yang...',
    a: 'Sudah diterima magang/kerja di perusahaan besar',
    b: 'Lolos tryout dan siap masuk perguruan tinggi negeri',
    c: 'Sudah memiliki penghasilan sendiri dari berbisnis',
    aspectId: 'cat-bmw-3',
  },
  {
    num: 25,
    statement: 'Jika mendapat dana bantuan/modal sebesar 10 juta rupiah, saya akan...',
    a: 'Menyimpannya sebagai tabungan persiapan mencari kerja',
    b: 'Menggunakannya untuk biaya pendaftaran & awal kuliah',
    c: 'Menggunakannya langsung sebagai modal awal berwirausaha',
    aspectId: 'cat-bmw-3',
  },
  {
    num: 26,
    statement: 'Jejaring sosial (relasi) yang paling banyak saya miliki saat ini adalah...',
    a: 'Alumni SMK yang sudah bekerja di berbagai industri',
    b: 'Teman-teman yang berencana melanjutkan ke perguruan tinggi',
    c: 'Pelanggan, pemasok, atau rekan sesama pelaku bisnis',
    aspectId: 'cat-bmw-3',
  },
  {
    num: 27,
    statement: 'Respons keluarga jika saya memutuskan untuk kuliah adalah...',
    a: 'Mengarahkan bekerja dulu baru kuliah dengan biaya sendiri',
    b: 'Sangat mendukung dan siap mengusahakan biayanya',
    c: 'Menyarankan lebih baik modalnya untuk usaha saja',
    aspectId: 'cat-bmw-3',
  },
  {
    num: 28,
    statement: 'Faktor lingkungan tempat tinggal saya saat ini lebih mendukung untuk...',
    a: 'Kawasan industri/perkantoran yang buka banyak lowongan',
    b: 'Lingkungan akademis dekat dengan banyak kampus',
    c: 'Lingkungan perdagangan yang ramai peluang usahanya',
    aspectId: 'cat-bmw-3',
  },
  {
    num: 29,
    statement: 'Ketika berdiskusi tentang masa depan dengan orang tua, kesepakatannya adalah...',
    a: 'Fokus melamar pekerjaan yang sesuai keahlian',
    b: 'Mendaftar kuliah terlebih dahulu sebagai prioritas',
    c: 'Mencoba peruntungan di dunia bisnis/usaha',
    aspectId: 'cat-bmw-3',
  },
  {
    num: 30,
    statement: 'Tanggapan saya terhadap tuntutan kemandirian finansial pasca lulus adalah...',
    a: 'Wajib secepatnya mandiri melalui gaji kerja',
    b: 'Bisa ditunda demi investasi ilmu di perguruan tinggi',
    c: 'Mandiri dengan menciptakan sumber penghasilan sendiri',
    aspectId: 'cat-bmw-3',
  },

  // ASPEK 4: KESIAPAN MENGHADAPI TANTANGAN DAN RISIKO (Soal 31 - 40)
  {
    num: 31,
    statement: 'Tantangan terbesar yang paling siap saya hadapi dalam kurun waktu dekat adalah...',
    a: 'Persaingan ketat dalam seleksi penerimaan karyawan',
    b: 'Persaingan ujian masuk kampus dan beban akademik',
    c: 'Ketidakpastian pasar dan risiko kerugian bisnis',
    aspectId: 'cat-bmw-4',
  },
  {
    num: 32,
    statement: 'Jika dalam 3 bulan pertama belum mencapai target pilihan saya, maka saya akan...',
    a: 'Terus melamar ke berbagai perusahaan tanpa menyerah',
    b: 'Belajar lebih keras untuk gelombang seleksi kampus berikutnya',
    c: 'Evaluasi strategi bisnis atau ganti ide usaha baru',
    aspectId: 'cat-bmw-4',
  },
  {
    num: 33,
    statement: 'Sikap saya terhadap kegagalan (misal: ditolak lamaran/kampus/rugi usaha) adalah...',
    a: 'Mengevaluasi CV dan meningkatkan keterampilan kerja',
    b: 'Menganalisis kelemahan akademis dan mencoba lagi',
    c: 'Menganggapnya sebagai biaya belajar dalam berbisnis',
    aspectId: 'cat-bmw-4',
  },
  {
    num: 34,
    statement: 'Beban tekanan yang menurut saya paling bisa saya toleransi adalah...',
    a: 'Pressures dari atasan dan tenggat waktu (deadline) kerja',
    b: 'BANYAKNYA tugas perkuliahan dan ujian akademik',
    c: 'Pusing memikirkan modal, penjualan, dan operasional usaha',
    aspectId: 'cat-bmw-4',
  },
  {
    num: 35,
    statement: 'Menghadapi ketidakpastian masa depan, saya memilih langkah yang...',
    a: 'Memiliki kepastian aturan dan jenjang karier jelas',
    b: 'Memiliki dasar akademis yang kuat untuk masa depan',
    c: 'Mengandung risiko tinggi namun hasil berpotensi besar',
    aspectId: 'cat-bmw-4',
  },
  {
    num: 36,
    statement: 'Persiapan yang paling intensif saya lakukan saat ini adalah...',
    a: 'Melatih wawancara kerja, buat CV, dan psiko-test',
    b: 'Mempelajari materi soal SBMPTN/UTBK/Mandiri kampus',
    c: 'Menyusun rencana bisnis (business plan) dan analisis pasar',
    aspectId: 'cat-bmw-4',
  },
  {
    num: 37,
    statement: 'Pandangan saya mengenai persaingan di dunia nyata adalah...',
    a: 'Bersaing secara profesional sesuai aturan perusahaan',
    b: 'Bersaing secara adil meraih prestasi akademik tertinggi',
    c: 'Bersaing secara kreatif memenangkan hati konsumen',
    aspectId: 'cat-bmw-4',
  },
  {
    num: 38,
    statement: 'Ketahanan mental saya paling teruji ketika...',
    a: 'Harus bekerja keras menyelesaikan lembur/tugas industri',
    b: 'Belajar hingga larut malam menghadapi ujian/kuliah',
    c: 'Mengalami ketidakpastian pendapatan saat merintis bisnis',
    aspectId: 'cat-bmw-4',
  },
  {
    num: 39,
    statement: 'Bagaimana Anda memandang fleksibilitas dalam bekerja?',
    a: 'Lebih menyukai jam kerja dan tugas yang sudah terstruktur',
    b: 'Suka fleksibilitas yang mendukung jadwal perkuliahan',
    c: 'Sangat menyukai bebasnya mengatur waktu kerja sendiri',
    aspectId: 'cat-bmw-4',
  },
  {
    num: 40,
    statement: 'Sikap saya jika dihadapkan pada perubahan teknologi yang cepat adalah...',
    a: 'Mempelajari skill baru sesuai kebutuhan perusahaan',
    b: 'Mempelajari teorinya di kampus agar tetap relevan',
    c: 'Memanfaatkannya sebagai peluang bisnis baru',
    aspectId: 'cat-bmw-4',
  },

  // ASPEK 5: RENCANA PENGEMBANGAN DAN MASA DEPAN KARIER (Soal 41 - 50)
  {
    num: 41,
    statement: 'Rencana peningkatan kualitas diri saya dalam 5 tahun mendatang adalah...',
    a: 'Naik jabatan menjadi supervisor/manager di perusahaan',
    b: 'Menyelesaikan studi S1/S2 dan menjadi spesialis',
    c: 'Membuka cabang usaha baru dan memperluas bisnis',
    aspectId: 'cat-bmw-5',
  },
  {
    num: 42,
    statement: 'Bagaimana Anda memandang kombinasi antara bekerja, kuliah, dan berwirausaha?',
    a: 'Bekerja dulu, setelah stabil baru kuliah/usaha',
    b: 'Kuliah dulu, setelah lulus baru fokus bekerja/usaha',
    c: 'Wirausaha dulu, jika sukses baru kuliah untuk pengayaan',
    aspectId: 'cat-bmw-5',
  },
  {
    num: 43,
    statement: 'Strategi yang akan saya gunakan untuk mencapai kemandirian hidup adalah...',
    a: 'Menabung dari penghasilan gaji rutin bulanan',
    b: 'Mengumpulkan portofolio akademis untuk karier hebat',
    c: 'Memutar modal usaha agar menghasilkan passive income',
    aspectId: 'cat-bmw-5',
  },
  {
    num: 44,
    statement: 'Dalam hal kepemimpinan, saya ingin dikenal sebagai...',
    a: 'Karyawan teladan dengan dedikasi dan loyalitas tinggi',
    b: 'Pakar/Ahli yang menjadi rujukan dalam bidang ilmu saya',
    c: 'Pemimpin/Founder yang inovatif dan menyejahterakan tim',
    aspectId: 'cat-bmw-5',
  },
  {
    num: 45,
    statement: 'Jika suatu saat saya memiliki modal yang sangat besar, saya akan...',
    a: 'Investasi aset dan tetap bekerja secara profesional',
    b: 'Membiayai pendidikan hingga tingkat tertinggi (Doktor)',
    c: 'Membangun perusahaan besar dan berinvestasi di bisnis lain',
    aspectId: 'cat-bmw-5',
  },
  {
    num: 46,
    statement: 'Visi jangka panjang saya terhadap kontribusi di masyarakat adalah...',
    a: 'Memberikan pelayanan kerja terbaik sesuai bidang profesi',
    b: 'Membagikan ilmu pengetahuan dan menjadi akademisi',
    c: 'Membuka lapangan kerja sebanyak-banyaknya bagi orang lain',
    aspectId: 'cat-bmw-5',
  },
  {
    num: 47,
    statement: 'Ketika memilih tempat untuk berkarya, kriteria utama saya adalah...',
    a: 'Perusahaan bonafid dengan fasilitas dan jaminan lengkap',
    b: 'Perguruan tinggi bereputasi bagus dan akreditasi A',
    c: 'Pasar yang potensial untuk produk/jasa yang saya tawarkan',
    aspectId: 'cat-bmw-5',
  },
  {
    num: 48,
    statement: 'Bentuk apresiasi paling bermakna atas kerja keras saya adalah...',
    a: 'Gaji tinggi, bonus kerja, dan promosi jabatan',
    b: 'Gelar akademik, publikasi karya, dan pengakuan keahlian',
    c: 'Pertumbuhan bisnis yang pesat dan kemandirian finansial',
    aspectId: 'cat-bmw-5',
  },
  {
    num: 49,
    statement: 'Bagaimana Anda menyikapi peluang kerja di luar kota / luar negeri?',
    a: 'Sangat tertarik jika menawarkan kontrak & gaji memuaskan',
    b: 'Tertarik jika dalam rangka studi lanjut / beasiswa',
    c: 'Tertarik jika untuk ekspansi jaringan pasar usaha saya',
    aspectId: 'cat-bmw-5',
  },
  {
    num: 50,
    statement: 'Secara keseluruhan, keyakinan saya pada pilihan utama saya saat ini adalah...',
    a: 'Mantap untuk langsung BEKERJA setelah lulus SMK',
    b: 'Mantap untuk melanjutkan KULIAH setelah lulus SMK',
    c: 'Mantap untuk berwirausaha / BERBISNIS setelah lulus SMK',
    aspectId: 'cat-bmw-5',
  },
];

const generateBMWQuestions = (): {
  questions: QuestionnaireQuestion[];
  optionsMap: Record<string, QuestionnaireOption[]>;
} => {
  const questions: QuestionnaireQuestion[] = [];
  const optionsMap: Record<string, QuestionnaireOption[]> = {};

  bmwDataFromPdf.forEach((item) => {
    const qNum = item.num;
    const qId = `bmw-q-${qNum}`;
    const questionObj: QuestionnaireQuestion = {
      id: qId,
      questionnaire_type_id: 'qt-bmw',
      category_id: item.aspectId,
      question_number: qNum,
      statement: item.statement,
      is_active: true,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    };
    questions.push(questionObj);

    optionsMap[qId] = [
      { id: `${qId}-opt-a`, question_id: qId, option_code: 'A', label: `a. ${item.a}`, score_weight: 1, career_tag: 'BEKERJA', order_index: 1 },
      { id: `${qId}-opt-b`, question_id: qId, option_code: 'B', label: `b. ${item.b}`, score_weight: 1, career_tag: 'KULIAH', order_index: 2 },
      { id: `${qId}-opt-c`, question_id: qId, option_code: 'C', label: `c. ${item.c}`, score_weight: 1, career_tag: 'WIRAUSAHA', order_index: 3 },
    ];
  });

  return { questions, optionsMap };
};

export const { questions: bmwQuestions, optionsMap: bmwOptionsMap } = generateBMWQuestions();

// 50 Questions for AKPD KELAS X (Exact text from PDF 3 - SMK Negeri 1 Gunungguruh)
export const kelasXStatements: { num: number; text: string; catId: string }[] = [
  { num: 1, text: 'Saya merasa belum disiplin dalam beribadah pada Tuhan YME', catId: 'cat-x-pribadi' },
  { num: 2, text: 'Saya kadang-kadang berperilaku dan bertutur kata tidak jujur', catId: 'cat-x-pribadi' },
  { num: 3, text: 'Saya kadang-kadang masih suka menyontek pada waktu tes', catId: 'cat-x-pribadi' },
  { num: 4, text: 'Saya merasa belum bisa mengendalikan emosi dengan baik', catId: 'cat-x-pribadi' },
  { num: 5, text: 'Saya belum paham tentang sikap dan perilaku asertif', catId: 'cat-x-pribadi' },
  { num: 6, text: 'Saya belum tahu cara mengenal dan memahami diri sendiri', catId: 'cat-x-pribadi' },
  { num: 7, text: 'Saya belum memahami potensi diri', catId: 'cat-x-pribadi' },
  { num: 8, text: 'Saya belum tahu perubahan dan permasalahan yang terjadi pada masa remaja', catId: 'cat-x-pribadi' },
  { num: 9, text: 'Saya belum mengenal tentang macam-macam kepribadian', catId: 'cat-x-pribadi' },
  { num: 10, text: 'Saya kurang memiliki rasa percaya diri', catId: 'cat-x-pribadi' },
  { num: 11, text: 'Saya kadang kurang menjaga kesehatan diri', catId: 'cat-x-pribadi' },
  { num: 12, text: 'Saya belum tahu ciri-ciri/sifat/prilaku pribadi yang berkarakter', catId: 'cat-x-pribadi' },
  { num: 13, text: 'Saya merasa kurang memilki tanggung jawab pada diri sendiri', catId: 'cat-x-pribadi' },
  { num: 14, text: 'Saya kesulitan mengatur waktu belajar dan bermain', catId: 'cat-x-pribadi' },
  { num: 15, text: 'Kondisi orang tua saya sedang tidak harmonis', catId: 'cat-x-pribadi' },
  { num: 16, text: 'Saya merasa tidak betah tinggal di rumah sendiri', catId: 'cat-x-pribadi' },
  { num: 17, text: 'Saya mempunyai masalah dengan anggota keluarga di rumah', catId: 'cat-x-pribadi' },
  { num: 18, text: 'Saya belum bisa menjadi pribadi yang mandiri', catId: 'cat-x-pribadi' },
  { num: 19, text: 'Saya sedang memiliki konflik pribadi', catId: 'cat-x-pribadi' },
  { num: 20, text: 'Saya belum memahami tentang norma/cara membangun berkeluarga', catId: 'cat-x-pribadi' },
  { num: 21, text: 'Saya belum banyak mengenal lingkungan sekolah baru', catId: 'cat-x-sosial' },
  { num: 22, text: 'Saya belum memahami tentang kenakalan remaja', catId: 'cat-x-sosial' },
  { num: 23, text: 'Saya masih sedikit mengetahui tentang dampak atau bahaya rokok', catId: 'cat-x-sosial' },
  { num: 24, text: 'Saya belum banyak mengenal tentang perilaku sosial yang bertanggung jawab', catId: 'cat-x-sosial' },
  { num: 25, text: 'Saya belum tahu tentang bullying dan cara mensikapinya', catId: 'cat-x-sosial' },
  { num: 26, text: 'Saya sukar bergaul dengan teman-teman di sekolah', catId: 'cat-x-sosial' },
  { num: 27, text: 'Sering saya dianggap tidak sopan pada orang lain', catId: 'cat-x-sosial' },
  { num: 28, text: 'Saya kurang memahami dampak dari media sosial', catId: 'cat-x-sosial' },
  { num: 29, text: 'Saya jarang bermain/berteman di lingkungan tempat saya tinggal', catId: 'cat-x-sosial' },
  { num: 30, text: 'Saya belum banyak teman atau sahabat', catId: 'cat-x-sosial' },
  { num: 31, text: 'Saya kurang suka berkomunikasi dengan teman lawan jenis', catId: 'cat-x-sosial' },
  { num: 32, text: 'Saya belum tahu cara belajar yang baik dan benar di SMK/MAK', catId: 'cat-x-belajar' },
  { num: 33, text: 'Saya belum tahu cara meraih prestasi di sekolah', catId: 'cat-x-belajar' },
  { num: 34, text: 'Saya belum paham tentang gaya belajar dan strategi yang sesuai dengannya', catId: 'cat-x-belajar' },
  { num: 35, text: 'Orang tua saya tidak peduli dengan kegiatan belajar saya', catId: 'cat-x-belajar' },
  { num: 36, text: 'Saya masih sering menunda-nunda tugas sekolah/pekerjaan rumah (PR)', catId: 'cat-x-belajar' },
  { num: 37, text: 'Saya merasa kesulitan dalam memahami pelajaran tertentu', catId: 'cat-x-belajar' },
  { num: 38, text: 'Saya belum tahu cara memanfaatkan sumber belajar', catId: 'cat-x-belajar' },
  { num: 39, text: 'Saya belajarnya jika akan ada tes atau ujian saja', catId: 'cat-x-belajar' },
  { num: 40, text: 'Saya belum tahu tentang struktur kurikulum yang ada di sekolah', catId: 'cat-x-belajar' },
  { num: 41, text: 'Saya merasa malas belajar dan kalau belajar sering ngantuk', catId: 'cat-x-belajar' },
  { num: 42, text: 'Saya belum terbiasa belajar bersama atau belajar kelompok', catId: 'cat-x-belajar' },
  { num: 43, text: 'Saya belum paham cara memilih lembaga bimbingan belajar yang baik', catId: 'cat-x-belajar' },
  { num: 44, text: 'Saya belum dapat memanfaatkan teknologi informasi untuk belajar', catId: 'cat-x-belajar' },
  { num: 45, text: 'Saya belum tahu cara memperoleh bantuan pendidikan (beasiswa)', catId: 'cat-x-belajar' },
  { num: 46, text: 'Saya terpaksa harus bekerja untuk mencukupi kebutuhan hidup', catId: 'cat-x-karir' },
  { num: 47, text: 'Saya merasa bingung memilih kegiatan esktrakurikuler di sekolah', catId: 'cat-x-karir' },
  { num: 48, text: 'Saya merasa belum mantap pada pilihan peminatan yang diambil', catId: 'cat-x-karir' },
  { num: 49, text: 'Saya merasa belum paham hubungan antara hobi, bakat, minat, kemampuan dan karir', catId: 'cat-x-karir' },
  { num: 50, text: 'Saya belum memiliki perencanaan karir masa depan', catId: 'cat-x-karir' },
];

export const kelasXQuestions: QuestionnaireQuestion[] = kelasXStatements.map((item) => ({
  id: `kx-q-${item.num}`,
  questionnaire_type_id: 'qt-kelas-x',
  category_id: item.catId,
  question_number: item.num,
  statement: item.text,
  is_active: true,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
}));

export const initialFollowUps: FollowUp[] = [];

export const initialCounselingNotes: CounselingNote[] = [];

export const allQuestions: QuestionnaireQuestion[] = [
  ...kelasXQuestions,
  ...akpdQuestions,
  ...bmwQuestions,
];
