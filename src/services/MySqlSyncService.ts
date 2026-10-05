import { db } from '../db/storage';
import { QuestionnaireResponse, QuestionnaireAnswer } from '../types/database';

export interface MySqlStatus {
  connected: boolean;
  database?: string;
  host?: string;
  error?: string;
  stats?: {
    totalStudents: number;
    totalResponses: number;
    totalAnswers: number;
    totalUsers: number;
    totalClasses: number;
  };
}

export class MySqlSyncService {
  private static statusCache: MySqlStatus | null = null;
  private static lastCheck: number = 0;

  /**
   * Check connection status of TiDB Cloud MySQL
   */
  public static async checkStatus(force = false): Promise<MySqlStatus> {
    const now = Date.now();
    if (!force && this.statusCache && now - this.lastCheck < 15000) {
      return this.statusCache;
    }

    try {
      const res = await fetch('/api/mysql/status');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      this.statusCache = data;
      this.lastCheck = now;
      return data;
    } catch (e: any) {
      this.statusCache = {
        connected: false,
        error: e?.message || 'Server connection failed',
      };
      this.lastCheck = now;
      return this.statusCache;
    }
  }

  /**
   * Push all current datasets to TiDB Cloud MySQL
   */
  public static async pushAllToMySql(): Promise<{ success: boolean; message: string }> {
    try {
      const payload = {
        settings: db.getSettings(),
        users: db.getUsers(),
        students: db.getStudents(),
        classes: db.getClasses(),
        programs: db.getPrograms(),
        academicYears: db.getAcademicYears(),
        teachers: db.getTeachers(),
        questionnaireTypes: db.getQuestionnaireTypes(),
        categories: db.getCategories(),
        questions: db.getQuestions(),
        optionsMap: db.getOptionsMap(),
        assignments: db.getAssignments(),
        responses: db.getResponses(),
        answers: db.getAnswers(),
        followUps: db.getFollowUps(),
        counselingNotes: db.getCounselingNotes(),
        auditLogs: db.getAuditLogs(),
      };

      const res = await fetch('/api/mysql/push-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menyimpan ke MySQL');
      }

      await this.checkStatus(true);
      return { success: true, message: 'Seluruh data berhasil disinkronkan ke TiDB Cloud MySQL!' };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Koneksi ke TiDB MySQL gagal' };
    }
  }

  /**
   * Pull all records from TiDB Cloud MySQL into the application
   */
  public static async pullAllFromMySql(): Promise<{ success: boolean; message: string; count?: number }> {
    try {
      const res = await fetch('/api/mysql/pull-all');
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal mengambil data dari MySQL');
      }

      const d = json.data;
      if (d.settings) db.saveSettings(d.settings);
      if (d.users && d.users.length) localStorage.setItem('sibks_users_v2', JSON.stringify(d.users));
      if (d.students && d.students.length) localStorage.setItem('sibks_students_v2', JSON.stringify(d.students));
      if (d.classes && d.classes.length) localStorage.setItem('sibks_classes_v2', JSON.stringify(d.classes));
      if (d.programs && d.programs.length) localStorage.setItem('sibks_programs_v2', JSON.stringify(d.programs));
      if (d.academicYears && d.academicYears.length) localStorage.setItem('sibks_academic_years_v2', JSON.stringify(d.academicYears));
      if (d.teachers && d.teachers.length) localStorage.setItem('sibks_teachers_v2', JSON.stringify(d.teachers));
      if (d.assignments && d.assignments.length) localStorage.setItem('sibks_assignments_v2', JSON.stringify(d.assignments));
      if (d.responses && d.responses.length) localStorage.setItem('sibks_responses_v2', JSON.stringify(d.responses));
      if (d.answers && d.answers.length) localStorage.setItem('sibks_answers_v2', JSON.stringify(d.answers));
      if (d.followUps && d.followUps.length) localStorage.setItem('sibks_follow_ups_v2', JSON.stringify(d.followUps));
      if (d.counselingNotes && d.counselingNotes.length) localStorage.setItem('sibks_counseling_notes_v2', JSON.stringify(d.counselingNotes));
      if (d.auditLogs && d.auditLogs.length) localStorage.setItem('sibks_audit_logs_v2', JSON.stringify(d.auditLogs));

      window.dispatchEvent(new CustomEvent('sibks_data_synced'));
      await this.checkStatus(true);

      const totalItems = (d.responses?.length || 0) + (d.students?.length || 0);
      return {
        success: true,
        count: totalItems,
        message: `Berhasil menarik ${d.responses?.length || 0} respon dan ${d.students?.length || 0} data siswa dari TiDB MySQL.`,
      };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Koneksi ke TiDB MySQL gagal' };
    }
  }

  /**
   * Sync single response and answers in real-time to MySQL
   */
  public static async syncResponseToMySql(
    response: QuestionnaireResponse,
    answers: QuestionnaireAnswer[]
  ): Promise<void> {
    try {
      await fetch('/api/mysql/response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response, answers }),
      });
    } catch (e) {
      console.warn('Silent fallback: MySQL sync error:', e);
    }
  }
}
