// Database schema and type definitions for SIBKS (Sistem Informasi Bimbingan dan Konseling Sekolah)

export type UserRole = 'ADMIN' | 'GURU_BK' | 'SISWA';

export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type FollowUpStatus = 'Belum Ditindaklanjuti' | 'Dalam Proses' | 'Selesai' | 'Perlu Monitoring';

export type BKServiceType = 
  | 'Bimbingan Klasikal'
  | 'Bimbingan Kelompok'
  | 'Konseling Individual'
  | 'Konseling Kelompok'
  | 'Bimbingan Karir & DUDI'
  | 'Kolaborasi / Alih Tangan Kasus (Referal)';

export interface Role {
  id: string;
  name: UserRole;
  description: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  related_id?: string; // student_id or teacher_id
  password?: string;
  is_active?: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface AcademicYear {
  id: string;
  name: string; // e.g. "2024/2025"
  semester: 'Ganjil' | 'Genap';
  is_active: boolean;
  created_at: string;
}

export interface StudyProgram {
  id: string;
  code: string; // e.g. "RPL", "TKJ", "AKL", "OTKP"
  name: string; // e.g. "Rekayasa Perangkat Lunak"
  description?: string;
}

export interface ClassRoom {
  id: string;
  name: string; // e.g. "X RPL 1", "XII TKJ 2"
  grade: 'X' | 'XI' | 'XII';
  study_program_id: string;
  academic_year_id: string;
  homeroom_teacher?: string;
  student_count?: number;
}

export interface Student {
  id: string;
  nis: string;
  nisn: string;
  name: string;
  gender: 'L' | 'P';
  class_id: string;
  phone?: string;
  address?: string;
  parent_name?: string;
  parent_phone?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Teacher {
  id: string;
  nip: string;
  name: string;
  gender: 'L' | 'P';
  phone?: string;
  specialization?: string;
  user_id?: string;
  created_at: string;
}

export type QuestionnaireCode = 'AKPD' | 'BMW' | 'KELAS_X';

export interface QuestionnaireType {
  id: string;
  code: QuestionnaireCode | string;
  title: string;
  description: string;
  target_grade: 'X' | 'XI' | 'XII' | 'ALL';
  total_questions: number;
  scoring_model: 'AKPD_PERCENT' | 'CAREER_BMW' | 'CATEGORY_WEIGHTED';
  is_active: boolean;
  allow_student_view_result: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuestionnaireCategory {
  id: string;
  questionnaire_type_id: string;
  code: string;
  name: string; // e.g. "Bidang Pribadi", "Orientasi dan Cita-cita Karier Utama"
  description?: string;
  order_index: number;
}

export interface QuestionnaireOption {
  id: string;
  question_id?: string; // optional if generic
  option_code: 'YA' | 'TIDAK' | 'A' | 'B' | 'C' | string;
  label: string; // e.g. "Ya", "Bekerja di industri", etc.
  score_weight: number; // e.g. 1 for Ya, 0 for Tidak
  career_tag?: 'BEKERJA' | 'KULIAH' | 'WIRAUSAHA';
  order_index: number;
}

export interface QuestionnaireQuestion {
  id: string;
  questionnaire_type_id: string;
  category_id: string;
  question_number: number;
  statement: string;
  default_options?: QuestionnaireOption[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuestionnaireAssignment {
  id: string;
  questionnaire_type_id: string;
  class_id: string;
  academic_year_id: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  assigned_by: string;
}

export interface QuestionnaireResponse {
  id: string;
  assignment_id?: string;
  questionnaire_type_id: string;
  student_id: string;
  status: 'DRAFT' | 'SUBMITTED';
  started_at: string;
  submitted_at?: string;
  can_reedit: boolean; // Guru BK can re-enable editing
  total_answered: number;
  initial_career_choice?: 'BEKERJA' | 'KULIAH' | 'WIRAUSAHA'; // Rencana Utama Pasca Lulus (Kelas XII BMW)
  student_notes?: string; // Catatan/harapan khusus siswa ke Guru BK (Kelas XI AKPD Bagian D)
  created_at: string;
  updated_at: string;
}

export interface QuestionnaireAnswer {
  id: string;
  response_id: string;
  question_id: string;
  selected_option_code: string; // "YA", "TIDAK", "A", "B", "C"
  score_value: number;
  career_tag?: 'BEKERJA' | 'KULIAH' | 'WIRAUSAHA';
}

export interface CategoryScoreResult {
  category_id: string;
  category_name: string;
  category_code: string;
  total_items: number;
  answered_yes_or_target: number;
  percentage: number;
  priority_level: PriorityLevel;
  interpretation: string;
}

export interface StudentAnalysis {
  id: string;
  response_id: string;
  student_id: string;
  questionnaire_type_id: string;
  total_questions: number;
  total_yes: number;
  overall_percentage: number;
  category_results: CategoryScoreResult[];
  highest_need_category: string;
  priority_level: PriorityLevel; // URGENT, HIGH, MEDIUM, LOW
  indication_summary: string; // "Indikasi kebutuhan layanan BK: ..."
  calculated_at: string;
}

export interface CareerResult {
  id: string;
  response_id: string;
  student_id: string;
  total_questions: number;
  count_a_bekerja: number;
  count_b_kuliah: number;
  count_c_wirausaha: number;
  pct_bekerja: number;
  pct_kuliah: number;
  pct_wirausaha: number;
  dominant_career: 'BEKERJA' | 'KULIAH' | 'WIRAUSAHA' | 'KOMBINASI';
  career_title: string; // e.g. "Kecenderungan Dominan Bekerja"
  bk_recommendations: string[];
  aspect_breakdown?: {
    aspect_name: string;
    bekerja: number;
    kuliah: number;
    wirausaha: number;
  }[];
  calculated_at: string;
}

export interface CounselingNote {
  id: string;
  student_id: string;
  teacher_id: string;
  counselor_name: string;
  date: string;
  service_type: BKServiceType;
  topic: string;
  problem_summary: string;
  notes: string; // confidential
  recommendation: string;
  follow_up_plan: string;
  status: 'Tersimpan' | 'Tindak Lanjut Diperlukan' | 'Selesai';
  created_at: string;
  updated_at: string;
}

export interface FollowUp {
  id: string;
  student_id: string;
  teacher_id: string;
  counselor_name: string;
  date: string;
  bidang: 'Pribadi' | 'Sosial' | 'Belajar' | 'Karir';
  problem_need: string;
  service_type: BKServiceType;
  recommendation: string;
  counselor_notes: string;
  status: FollowUpStatus;
  next_follow_up_date?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  action: string;
  entity: string;
  entity_id?: string;
  details: string;
  timestamp: string;
}

export interface SystemSettings {
  school_name: string;
  school_npsn: string;
  school_address: string;
  principal_name: string;
  principal_nip: string;
  lead_counselor_name: string;
  lead_counselor_nip: string;
  academic_year: string;
  thresholds: {
    urgent_min: number; // default 81
    high_min: number;   // default 61
    medium_min: number; // default 41
    low_min: number;    // default 21
  };
}
