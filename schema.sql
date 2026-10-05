-- ==============================================================================
-- DATABASE SCHEMA: SISTEM INFORMASI BIMBINGAN DAN KONSELING (SIBKS)
-- SMKN 1 GUNUNGGURUH
-- Target: MySQL 8.0+ / TiDB Cloud Serverless (utf8mb4)
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `sibks_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `sibks_db`;

-- 1. Tabel Pengaturan Sistem & Ambang Batas Prioritas
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` VARCHAR(50) PRIMARY KEY,
  `data` JSON NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabel Akun Pengguna & Hak Akses (RBAC)
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(100) PRIMARY KEY,
  `username` VARCHAR(100) UNIQUE NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255),
  `role` ENUM('ADMIN', 'GURU_BK', 'SISWA') NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `related_id` VARCHAR(100),
  `created_at` VARCHAR(50),
  `updated_at` VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabel Guru & Konselor BK
CREATE TABLE IF NOT EXISTS `teachers` (
  `id` VARCHAR(100) PRIMARY KEY,
  `nip` VARCHAR(100),
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255),
  `phone` VARCHAR(50),
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` VARCHAR(50),
  `updated_at` VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabel Tahun Ajaran
CREATE TABLE IF NOT EXISTS `academic_years` (
  `id` VARCHAR(100) PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `semester` VARCHAR(50) NOT NULL,
  `is_active` BOOLEAN DEFAULT FALSE,
  `created_at` VARCHAR(50),
  `updated_at` VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tabel Program Keahlian / Jurusan
CREATE TABLE IF NOT EXISTS `study_programs` (
  `id` VARCHAR(100) PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `head_of_program` VARCHAR(255),
  `created_at` VARCHAR(50),
  `updated_at` VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Tabel Rombongan Belajar (Kelas)
CREATE TABLE IF NOT EXISTS `classes` (
  `id` VARCHAR(100) PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `grade` VARCHAR(20) NOT NULL,
  `program_id` VARCHAR(100),
  `homeroom_teacher` VARCHAR(255),
  `academic_year_id` VARCHAR(100),
  `created_at` VARCHAR(50),
  `updated_at` VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Tabel Master Siswa (600+ Roster SMKN 1 Gunungguruh)
CREATE TABLE IF NOT EXISTS `students` (
  `id` VARCHAR(100) PRIMARY KEY,
  `nis` VARCHAR(50) NOT NULL,
  `nisn` VARCHAR(50),
  `name` VARCHAR(255) NOT NULL,
  `gender` VARCHAR(10) NOT NULL,
  `class_id` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(50),
  `parent_name` VARCHAR(255),
  `parent_phone` VARCHAR(50),
  `address` TEXT,
  `created_at` VARCHAR(50),
  `updated_at` VARCHAR(50),
  INDEX `idx_students_nis` (`nis`),
  INDEX `idx_students_class` (`class_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Tabel Jenis Angket (AKPD, BMW, Kelas X)
CREATE TABLE IF NOT EXISTS `questionnaire_types` (
  `id` VARCHAR(100) PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `target_grade` VARCHAR(20),
  `scoring_model` VARCHAR(50) NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` VARCHAR(50),
  `updated_at` VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Tabel Bidang / Kategori Layanan BK
CREATE TABLE IF NOT EXISTS `categories` (
  `id` VARCHAR(100) PRIMARY KEY,
  `questionnaire_type_id` VARCHAR(100) NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `weight` DECIMAL(5,2) DEFAULT 1.0,
  `order_index` INT DEFAULT 0,
  `created_at` VARCHAR(50),
  `updated_at` VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Tabel Butir Pertanyaan Angket
CREATE TABLE IF NOT EXISTS `questions` (
  `id` VARCHAR(100) PRIMARY KEY,
  `questionnaire_type_id` VARCHAR(100) NOT NULL,
  `category_id` VARCHAR(100) NOT NULL,
  `question_number` INT NOT NULL,
  `statement` TEXT NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` VARCHAR(50),
  `updated_at` VARCHAR(50),
  INDEX `idx_questions_type_num` (`questionnaire_type_id`, `question_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Tabel Opsi Pilihan Jawaban
CREATE TABLE IF NOT EXISTS `options_map` (
  `id` VARCHAR(100) PRIMARY KEY,
  `question_id` VARCHAR(100) NOT NULL,
  `option_code` VARCHAR(10) NOT NULL,
  `label` TEXT NOT NULL,
  `score_weight` DECIMAL(5,2) DEFAULT 1.0,
  `career_tag` VARCHAR(50),
  `order_index` INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Tabel Penugasan Angket ke Kelas
CREATE TABLE IF NOT EXISTS `assignments` (
  `id` VARCHAR(100) PRIMARY KEY,
  `questionnaire_type_id` VARCHAR(100) NOT NULL,
  `class_id` VARCHAR(100) NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `assigned_at` VARCHAR(50),
  `deadline` VARCHAR(50),
  `created_at` VARCHAR(50),
  `updated_at` VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Tabel Respon Pengisian Siswa
CREATE TABLE IF NOT EXISTS `responses` (
  `id` VARCHAR(100) PRIMARY KEY,
  `questionnaire_type_id` VARCHAR(100) NOT NULL,
  `student_id` VARCHAR(100) NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED',
  `started_at` VARCHAR(50),
  `submitted_at` VARCHAR(50),
  `can_reedit` BOOLEAN DEFAULT FALSE,
  `total_answered` INT DEFAULT 0,
  `initial_career_choice` VARCHAR(100),
  `student_notes` TEXT,
  `created_at` VARCHAR(50),
  `updated_at` VARCHAR(50),
  INDEX `idx_responses_student` (`student_id`),
  INDEX `idx_responses_type` (`questionnaire_type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Tabel Butir Jawaban Siswa
CREATE TABLE IF NOT EXISTS `answers` (
  `id` VARCHAR(100) PRIMARY KEY,
  `response_id` VARCHAR(100) NOT NULL,
  `question_id` VARCHAR(100) NOT NULL,
  `selected_option_code` VARCHAR(10) NOT NULL,
  `score_value` DECIMAL(5,2) DEFAULT 0,
  `career_tag` VARCHAR(50),
  `created_at` VARCHAR(50),
  `updated_at` VARCHAR(50),
  INDEX `idx_answers_resp` (`response_id`),
  INDEX `idx_answers_q` (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Tabel Tindak Lanjut Layanan BK
CREATE TABLE IF NOT EXISTS `follow_ups` (
  `id` VARCHAR(100) PRIMARY KEY,
  `student_id` VARCHAR(100) NOT NULL,
  `category_id` VARCHAR(100),
  `action_type` VARCHAR(100) NOT NULL,
  `description` TEXT NOT NULL,
  `target_date` VARCHAR(50),
  `status` VARCHAR(50) NOT NULL DEFAULT 'PLANNED',
  `notes` TEXT,
  `created_at` VARCHAR(50),
  `updated_at` VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Tabel Catatan Konseling Individual / Kelompok
CREATE TABLE IF NOT EXISTS `counseling_notes` (
  `id` VARCHAR(100) PRIMARY KEY,
  `student_id` VARCHAR(100) NOT NULL,
  `date` VARCHAR(50) NOT NULL,
  `counselor_name` VARCHAR(255) NOT NULL,
  `topic` VARCHAR(255) NOT NULL,
  `summary` TEXT NOT NULL,
  `agreement` TEXT,
  `is_confidential` BOOLEAN DEFAULT TRUE,
  `created_at` VARCHAR(50),
  `updated_at` VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Tabel Log Aktivitas (Audit Trail)
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` VARCHAR(100) PRIMARY KEY,
  `user_id` VARCHAR(100),
  `user_name` VARCHAR(255),
  `user_role` VARCHAR(50),
  `action` VARCHAR(100) NOT NULL,
  `entity` VARCHAR(100) NOT NULL,
  `details` TEXT,
  `timestamp` VARCHAR(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
