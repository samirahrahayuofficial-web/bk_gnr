import {
  AcademicYear,
  AuditLog,
  ClassRoom,
  CounselingNote,
  FollowUp,
  QuestionnaireAssignment,
  QuestionnaireCategory,
  QuestionnaireOption,
  QuestionnaireQuestion,
  QuestionnaireResponse,
  QuestionnaireAnswer,
  QuestionnaireType,
  Student,
  StudyProgram,
  SystemSettings,
  Teacher,
  User,
  CareerResult,
  StudentAnalysis,
} from '../types/database';
import {
  akpdQuestions,
  bmwOptionsMap,
  bmwQuestions,
  defaultYesNoOptions,
  initialAcademicYears,
  initialCategories,
  initialClasses,
  initialCounselingNotes,
  initialFollowUps,
  initialQuestionnaireTypes,
  initialSettings,
  initialStudents,
  initialStudyPrograms,
  initialTeachers,
  initialUsers,
  kelasXQuestions,
} from './seedData';

const STORAGE_KEYS = {
  SETTINGS: 'sibks_settings_v2',
  USERS: 'sibks_users_v2',
  STUDENTS: 'sibks_students_v2',
  TEACHERS: 'sibks_teachers_v2',
  CLASSES: 'sibks_classes_v2',
  PROGRAMS: 'sibks_programs_v2',
  ACADEMIC_YEARS: 'sibks_academic_years_v2',
  QUESTIONNAIRE_TYPES: 'sibks_qt_types_v2',
  CATEGORIES: 'sibks_categories_v2',
  QUESTIONS: 'sibks_questions_v2',
  OPTIONS_MAP: 'sibks_options_map_v2',
  ASSIGNMENTS: 'sibks_assignments_v2',
  RESPONSES: 'sibks_responses_v2',
  ANSWERS: 'sibks_answers_v2',
  FOLLOW_UPS: 'sibks_follow_ups_v2',
  COUNSELING_NOTES: 'sibks_counseling_notes_v2',
  AUDIT_LOGS: 'sibks_audit_logs_v2',
};

// Seed initial questionnaire responses so BK dashboard and reports have realistic initial data
function generateSeedResponses(): {
  responses: QuestionnaireResponse[];
  answers: QuestionnaireAnswer[];
} {
  return { responses: [], answers: [] };
}

// Initial assignments (empty, will be configured after new classes and jurusan are input)
const initialAssignments: QuestionnaireAssignment[] = [];

class RelationalDatabase {
  private get<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultValue;
      return JSON.parse(data) as T;
    } catch {
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }

  constructor() {
    this.initDatabase();
    this.applyPopulateSchoolDataMigration();
    this.applyUserManagementMigration();
    this.applyAcademicYearMigration();
  }

  private applyPopulateSchoolDataMigration(): void {
    const isPopulated = localStorage.getItem('sibks_school_data_populated_v2');
    const currentStudents = this.get<Student[]>(STORAGE_KEYS.STUDENTS, []);
    const currentClasses = this.get<ClassRoom[]>(STORAGE_KEYS.CLASSES, []);
    const currentPrograms = this.get<StudyProgram[]>(STORAGE_KEYS.PROGRAMS, []);

    if (!isPopulated || currentStudents.length < initialStudents.length || currentClasses.length < initialClasses.length) {
      this.set(STORAGE_KEYS.PROGRAMS, initialStudyPrograms);
      this.set(STORAGE_KEYS.CLASSES, initialClasses);
      this.set(STORAGE_KEYS.STUDENTS, initialStudents);
      localStorage.setItem('sibks_school_data_populated_v2', 'true');
    }
  }

  private applyAcademicYearMigration(): void {
    const list = this.get<AcademicYear[]>(STORAGE_KEYS.ACADEMIC_YEARS, initialAcademicYears);
    if (!list || list.length === 0) {
      this.set(STORAGE_KEYS.ACADEMIC_YEARS, initialAcademicYears);
    } else {
      const active = list.find((a) => a.is_active);
      if (active) {
        const settings = this.getSettings();
        const expected = `${active.name} (${active.semester})`;
        if (!settings.academic_year || !settings.academic_year.includes(active.name)) {
          settings.academic_year = expected;
          this.saveSettings(settings);
        }
      } else if (list.length > 0) {
        list[0].is_active = true;
        this.set(STORAGE_KEYS.ACADEMIC_YEARS, list);
        const settings = this.getSettings();
        settings.academic_year = `${list[0].name} (${list[0].semester})`;
        this.saveSettings(settings);
      }
    }
  }

  private applyUserManagementMigration(): void {
    const users = this.get<User[]>(STORAGE_KEYS.USERS, initialUsers);
    let updated = false;

    // 1. Ensure 'administrator' user exists with password 'rahasia'
    const adminMaster = users.find((u) => u.username.toLowerCase() === 'administrator');
    if (!adminMaster) {
      users.unshift({
        id: 'usr-administrator',
        username: 'administrator',
        name: 'Administrator Sistem BK',
        email: 'administrator@smkn1gunungguruh.sch.id',
        role: 'ADMIN',
        password: 'rahasia',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      updated = true;
    } else {
      if (adminMaster.password !== 'rahasia') {
        adminMaster.password = 'rahasia';
        updated = true;
      }
      if (adminMaster.is_active === undefined) {
        adminMaster.is_active = true;
        updated = true;
      }
    }

    // 2. Ensure 'admin' user has password 'rahasia' and is_active: true
    const adminUser = users.find((u) => u.username.toLowerCase() === 'admin');
    if (adminUser) {
      if (!adminUser.password) {
        adminUser.password = 'rahasia';
        updated = true;
      }
      if (adminUser.is_active === undefined) {
        adminUser.is_active = true;
        updated = true;
      }
    }

    // 3. Ensure all other users have default password '12345678' and is_active: true if not set
    users.forEach((u) => {
      if (!u.password) {
        u.password = (u.username.toLowerCase() === 'administrator' || u.username.toLowerCase() === 'admin') ? 'rahasia' : '12345678';
        updated = true;
      }
      if (u.is_active === undefined) {
        u.is_active = true;
        updated = true;
      }
    });

    if (updated) {
      this.set(STORAGE_KEYS.USERS, users);
    }
  }

  private applyResetStudentsAndMajorsMigration(): void {
    const isReset = localStorage.getItem('sibks_reset_students_and_majors_v3');
    if (!isReset) {
      this.resetStudentsAndMajors();
      localStorage.setItem('sibks_reset_students_and_majors_v3', 'true');
    }
  }

  public resetStudentsAndMajors(): void {
    this.set(STORAGE_KEYS.STUDENTS, []);
    this.set(STORAGE_KEYS.PROGRAMS, []);
    this.set(STORAGE_KEYS.CLASSES, []);
    this.set(STORAGE_KEYS.RESPONSES, []);
    this.set(STORAGE_KEYS.ANSWERS, []);
    this.set(STORAGE_KEYS.FOLLOW_UPS, []);
    this.set(STORAGE_KEYS.COUNSELING_NOTES, []);
    this.set(STORAGE_KEYS.ASSIGNMENTS, []);
    const remainingUsers = this.getUsers().filter((u) => u.role !== 'SISWA');
    this.set(STORAGE_KEYS.USERS, remainingUsers);
  }

  public resetStudents(): void {
    this.set(STORAGE_KEYS.STUDENTS, []);
    this.set(STORAGE_KEYS.RESPONSES, []);
    this.set(STORAGE_KEYS.ANSWERS, []);
    this.set(STORAGE_KEYS.FOLLOW_UPS, []);
    this.set(STORAGE_KEYS.COUNSELING_NOTES, []);
    const remainingUsers = this.getUsers().filter((u) => u.role !== 'SISWA');
    this.set(STORAGE_KEYS.USERS, remainingUsers);
  }

  public initDatabase(forceReset = false): void {
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      this.set(STORAGE_KEYS.SETTINGS, initialSettings);
      this.set(STORAGE_KEYS.USERS, initialUsers);
      this.set(STORAGE_KEYS.STUDENTS, initialStudents);
      this.set(STORAGE_KEYS.TEACHERS, initialTeachers);
      this.set(STORAGE_KEYS.CLASSES, initialClasses);
      this.set(STORAGE_KEYS.PROGRAMS, initialStudyPrograms);
      this.set(STORAGE_KEYS.ACADEMIC_YEARS, initialAcademicYears);
      this.set(STORAGE_KEYS.QUESTIONNAIRE_TYPES, initialQuestionnaireTypes);
      this.set(STORAGE_KEYS.CATEGORIES, initialCategories);

      // Merge all questions
      const allQuestions = [...akpdQuestions, ...bmwQuestions, ...kelasXQuestions];
      this.set(STORAGE_KEYS.QUESTIONS, allQuestions);
      this.set(STORAGE_KEYS.OPTIONS_MAP, bmwOptionsMap);

      this.set(STORAGE_KEYS.ASSIGNMENTS, initialAssignments);

      const { responses, answers } = generateSeedResponses();
      this.set(STORAGE_KEYS.RESPONSES, responses);
      this.set(STORAGE_KEYS.ANSWERS, answers);

      this.set(STORAGE_KEYS.FOLLOW_UPS, initialFollowUps);
      this.set(STORAGE_KEYS.COUNSELING_NOTES, initialCounselingNotes);

      const initialAudit: AuditLog[] = [
        {
          id: 'log-1',
          user_id: 'usr-admin',
          user_name: 'Administrator',
          user_role: 'ADMIN',
          action: 'INIT_SYSTEM',
          entity: 'System',
          details: 'Inisialisasi sistem SIBKS dan pemuatan seed data angket AKPD, BMW, dan Kelas X berhasil.',
          timestamp: new Date().toISOString(),
        },
      ];
      this.set(STORAGE_KEYS.AUDIT_LOGS, initialAudit);
    }
  }

  // Settings
  public getSettings(): SystemSettings {
    const s = this.get<SystemSettings>(STORAGE_KEYS.SETTINGS, initialSettings);
    if (s.school_name !== initialSettings.school_name) {
      s.school_name = initialSettings.school_name;
      s.school_npsn = initialSettings.school_npsn;
      s.school_address = initialSettings.school_address;
      this.set(STORAGE_KEYS.SETTINGS, s);
    }
    return s;
  }
  public saveSettings(settings: SystemSettings): void {
    this.set(STORAGE_KEYS.SETTINGS, settings);
  }

  // Users
  public getUsers(): User[] {
    return this.get<User[]>(STORAGE_KEYS.USERS, initialUsers);
  }
  public saveUser(user: User): void {
    const list = this.getUsers();
    const idx = list.findIndex((u) => u.id === user.id);
    if (idx >= 0) list[idx] = user;
    else list.push(user);
    this.set(STORAGE_KEYS.USERS, list);
  }
  public deleteUser(id: string): void {
    const list = this.getUsers().filter((u) => u.id !== id);
    this.set(STORAGE_KEYS.USERS, list);
  }
  public toggleUserStatus(id: string): boolean {
    const list = this.getUsers();
    const user = list.find((u) => u.id === id);
    if (user) {
      user.is_active = user.is_active === false ? true : false;
      user.updated_at = new Date().toISOString();
      this.set(STORAGE_KEYS.USERS, list);
      return user.is_active;
    }
    return false;
  }
  public resetUserPassword(id: string, newPassword = '12345678'): boolean {
    const list = this.getUsers();
    const user = list.find((u) => u.id === id);
    if (user) {
      user.password = newPassword;
      user.updated_at = new Date().toISOString();
      this.set(STORAGE_KEYS.USERS, list);
      return true;
    }
    return false;
  }

  // Students
  public getStudents(): Student[] {
    return this.get<Student[]>(STORAGE_KEYS.STUDENTS, initialStudents);
  }
  public saveStudent(student: Student): void {
    const list = this.getStudents();
    const idx = list.findIndex((s) => s.id === student.id);
    if (idx >= 0) list[idx] = student;
    else list.push(student);
    this.set(STORAGE_KEYS.STUDENTS, list);
  }
  public deleteStudent(id: string): void {
    const list = this.getStudents().filter((s) => s.id !== id);
    this.set(STORAGE_KEYS.STUDENTS, list);
  }

  // Teachers
  public getTeachers(): Teacher[] {
    return this.get<Teacher[]>(STORAGE_KEYS.TEACHERS, initialTeachers);
  }
  public saveTeacher(teacher: Teacher): void {
    const list = this.getTeachers();
    const idx = list.findIndex((t) => t.id === teacher.id);
    if (idx >= 0) list[idx] = teacher;
    else list.push(teacher);
    this.set(STORAGE_KEYS.TEACHERS, list);
  }

  // Classes
  public getClasses(): ClassRoom[] {
    return this.get<ClassRoom[]>(STORAGE_KEYS.CLASSES, initialClasses);
  }
  public saveClass(cls: ClassRoom): void {
    const list = this.getClasses();
    const idx = list.findIndex((c) => c.id === cls.id);
    if (idx >= 0) list[idx] = cls;
    else list.push(cls);
    this.set(STORAGE_KEYS.CLASSES, list);
  }
  public deleteClass(id: string): void {
    const list = this.getClasses().filter((c) => c.id !== id);
    this.set(STORAGE_KEYS.CLASSES, list);
  }

  // Study Programs
  public getPrograms(): StudyProgram[] {
    return this.get<StudyProgram[]>(STORAGE_KEYS.PROGRAMS, initialStudyPrograms);
  }
  public saveProgram(prog: StudyProgram): void {
    const list = this.getPrograms();
    const idx = list.findIndex((p) => p.id === prog.id);
    if (idx >= 0) list[idx] = prog;
    else list.push(prog);
    this.set(STORAGE_KEYS.PROGRAMS, list);
  }
  public deleteProgram(id: string): void {
    const list = this.getPrograms().filter((p) => p.id !== id);
    this.set(STORAGE_KEYS.PROGRAMS, list);
    // Also remove any classes associated with this program
    const classes = this.getClasses().filter((c) => c.study_program_id !== id);
    this.set(STORAGE_KEYS.CLASSES, classes);
  }

  // Academic Years
  public getAcademicYears(): AcademicYear[] {
    return this.get<AcademicYear[]>(STORAGE_KEYS.ACADEMIC_YEARS, initialAcademicYears);
  }
  public getActiveAcademicYear(): AcademicYear | undefined {
    const list = this.getAcademicYears();
    return list.find((a) => a.is_active) || list[0];
  }
  public saveAcademicYear(ay: AcademicYear): void {
    const list = this.getAcademicYears();
    const idx = list.findIndex((a) => a.id === ay.id);
    if (idx >= 0) list[idx] = ay;
    else list.push(ay);
    this.set(STORAGE_KEYS.ACADEMIC_YEARS, list);
  }
  public setActiveAcademicYear(id: string): void {
    const list = this.getAcademicYears();
    let selectedAy: AcademicYear | undefined;
    list.forEach((a) => {
      if (a.id === id) {
        a.is_active = true;
        selectedAy = a;
      } else {
        a.is_active = false;
      }
    });
    this.set(STORAGE_KEYS.ACADEMIC_YEARS, list);

    // Sync with settings.academic_year
    if (selectedAy) {
      const settings = this.getSettings();
      settings.academic_year = `${selectedAy.name} (${selectedAy.semester})`;
      this.saveSettings(settings);
    }
  }
  public deleteAcademicYear(id: string): boolean {
    const list = this.getAcademicYears();
    const target = list.find((a) => a.id === id);
    if (!target || target.is_active) {
      return false; // Cannot delete active academic year
    }
    const filtered = list.filter((a) => a.id !== id);
    this.set(STORAGE_KEYS.ACADEMIC_YEARS, filtered);
    return true;
  }

  // Questionnaire Types
  public getQuestionnaireTypes(): QuestionnaireType[] {
    return this.get<QuestionnaireType[]>(STORAGE_KEYS.QUESTIONNAIRE_TYPES, initialQuestionnaireTypes);
  }
  public saveQuestionnaireType(qt: QuestionnaireType): void {
    const list = this.getQuestionnaireTypes();
    const idx = list.findIndex((q) => q.id === qt.id);
    if (idx >= 0) list[idx] = qt;
    else list.push(qt);
    this.set(STORAGE_KEYS.QUESTIONNAIRE_TYPES, list);
  }

  // Categories
  public getCategories(): QuestionnaireCategory[] {
    return this.get<QuestionnaireCategory[]>(STORAGE_KEYS.CATEGORIES, initialCategories);
  }
  public saveCategory(cat: QuestionnaireCategory): void {
    const list = this.getCategories();
    const idx = list.findIndex((c) => c.id === cat.id);
    if (idx >= 0) list[idx] = cat;
    else list.push(cat);
    this.set(STORAGE_KEYS.CATEGORIES, list);
  }
  public deleteCategory(id: string): void {
    const list = this.getCategories().filter((c) => c.id !== id);
    this.set(STORAGE_KEYS.CATEGORIES, list);
  }

  // Questions
  public getQuestions(): QuestionnaireQuestion[] {
    return this.get<QuestionnaireQuestion[]>(STORAGE_KEYS.QUESTIONS, []);
  }
  public saveQuestion(question: QuestionnaireQuestion): void {
    const list = this.getQuestions();
    const idx = list.findIndex((q) => q.id === question.id);
    if (idx >= 0) list[idx] = question;
    else list.push(question);
    this.set(STORAGE_KEYS.QUESTIONS, list);
  }
  public deleteQuestion(id: string): void {
    const list = this.getQuestions().filter((q) => q.id !== id);
    this.set(STORAGE_KEYS.QUESTIONS, list);
  }

  // Options
  public getOptionsMap(): Record<string, QuestionnaireOption[]> {
    return this.get<Record<string, QuestionnaireOption[]>>(STORAGE_KEYS.OPTIONS_MAP, bmwOptionsMap);
  }
  public saveQuestionOptions(questionId: string, options: QuestionnaireOption[]): void {
    const map = this.getOptionsMap();
    map[questionId] = options;
    this.set(STORAGE_KEYS.OPTIONS_MAP, map);
  }

  // Assignments
  public getAssignments(): QuestionnaireAssignment[] {
    return this.get<QuestionnaireAssignment[]>(STORAGE_KEYS.ASSIGNMENTS, initialAssignments);
  }
  public saveAssignment(asg: QuestionnaireAssignment): void {
    const list = this.getAssignments();
    const idx = list.findIndex((a) => a.id === asg.id);
    if (idx >= 0) list[idx] = asg;
    else list.push(asg);
    this.set(STORAGE_KEYS.ASSIGNMENTS, list);
  }
  public deleteAssignment(id: string): void {
    const list = this.getAssignments().filter((a) => a.id !== id);
    this.set(STORAGE_KEYS.ASSIGNMENTS, list);
  }

  // Responses
  public getResponses(): QuestionnaireResponse[] {
    return this.get<QuestionnaireResponse[]>(STORAGE_KEYS.RESPONSES, []);
  }
  public saveResponse(resp: QuestionnaireResponse): void {
    const list = this.getResponses();
    const idx = list.findIndex((r) => r.id === resp.id);
    if (idx >= 0) list[idx] = resp;
    else list.push(resp);
    this.set(STORAGE_KEYS.RESPONSES, list);
  }
  public deleteResponse(id: string): void {
    const list = this.getResponses().filter((r) => r.id !== id);
    this.set(STORAGE_KEYS.RESPONSES, list);
    this.deleteAnswersByResponseId(id);
  }

  // Answers
  public getAnswers(): QuestionnaireAnswer[] {
    return this.get<QuestionnaireAnswer[]>(STORAGE_KEYS.ANSWERS, []);
  }
  public saveAnswers(responseId: string, newAnswers: QuestionnaireAnswer[]): void {
    let list = this.getAnswers().filter((a) => a.response_id !== responseId);
    list = [...list, ...newAnswers];
    this.set(STORAGE_KEYS.ANSWERS, list);
  }
  public deleteAnswersByResponseId(responseId: string): void {
    const list = this.getAnswers().filter((a) => a.response_id !== responseId);
    this.set(STORAGE_KEYS.ANSWERS, list);
  }

  // Follow Ups
  public getFollowUps(): FollowUp[] {
    return this.get<FollowUp[]>(STORAGE_KEYS.FOLLOW_UPS, initialFollowUps);
  }
  public saveFollowUp(fu: FollowUp): void {
    const list = this.getFollowUps();
    const idx = list.findIndex((f) => f.id === fu.id);
    if (idx >= 0) list[idx] = fu;
    else list.push(fu);
    this.set(STORAGE_KEYS.FOLLOW_UPS, list);
  }
  public deleteFollowUp(id: string): void {
    const list = this.getFollowUps().filter((f) => f.id !== id);
    this.set(STORAGE_KEYS.FOLLOW_UPS, list);
  }

  // Counseling Notes
  public getCounselingNotes(): CounselingNote[] {
    return this.get<CounselingNote[]>(STORAGE_KEYS.COUNSELING_NOTES, initialCounselingNotes);
  }
  public saveCounselingNote(cn: CounselingNote): void {
    const list = this.getCounselingNotes();
    const idx = list.findIndex((c) => c.id === cn.id);
    if (idx >= 0) list[idx] = cn;
    else list.push(cn);
    this.set(STORAGE_KEYS.COUNSELING_NOTES, list);
  }
  public deleteCounselingNote(id: string): void {
    const list = this.getCounselingNotes().filter((c) => c.id !== id);
    this.set(STORAGE_KEYS.COUNSELING_NOTES, list);
  }

  // Audit Logs
  public getAuditLogs(): AuditLog[] {
    return this.get<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  }
  public addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const list = this.getAuditLogs();
    const newLog: AuditLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    list.unshift(newLog);
    // keep max 500 logs
    if (list.length > 500) list.pop();
    this.set(STORAGE_KEYS.AUDIT_LOGS, list);
  }

  // Re-seed helper
  public resetToFactory(): void {
    this.initDatabase(true);
  }
}

export const db = new RelationalDatabase();
