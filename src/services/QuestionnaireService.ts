import { db } from '../db/storage';
import {
  QuestionnaireAnswer,
  QuestionnaireAssignment,
  QuestionnaireCategory,
  QuestionnaireOption,
  QuestionnaireQuestion,
  QuestionnaireResponse,
  QuestionnaireType,
} from '../types/database';
import { defaultYesNoOptions } from '../db/seedData';

export interface StudentQuestionnaireStatus {
  type: QuestionnaireType;
  assignment?: QuestionnaireAssignment;
  response?: QuestionnaireResponse;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED';
  answeredCount: number;
  totalQuestions: number;
  progressPct: number;
}

export class QuestionnaireService {
  public static getAllTypes(): QuestionnaireType[] {
    return db.getQuestionnaireTypes();
  }

  public static getTypeById(id: string): QuestionnaireType | undefined {
    return db.getQuestionnaireTypes().find((t) => t.id === id);
  }

  public static getCategoriesByType(typeId: string): QuestionnaireCategory[] {
    return db
      .getCategories()
      .filter((c) => c.questionnaire_type_id === typeId)
      .sort((a, b) => a.order_index - b.order_index);
  }

  public static getQuestionsByType(typeId: string): QuestionnaireQuestion[] {
    return db
      .getQuestions()
      .filter((q) => q.questionnaire_type_id === typeId && q.is_active)
      .sort((a, b) => a.question_number - b.question_number);
  }

  public static getOptionsForQuestion(questionId: string, type: QuestionnaireType): QuestionnaireOption[] {
    if (type.scoring_model === 'CAREER_BMW') {
      const map = db.getOptionsMap();
      if (map[questionId]) return map[questionId];
    }
    return defaultYesNoOptions;
  }

  /**
   * Get questionnaires available for a student according to their grade and class assignment
   */
  public static getQuestionnairesForGrade(grade: 'X' | 'XI' | 'XII' | string): QuestionnaireType[] {
    return db
      .getQuestionnaireTypes()
      .filter((t) => t.is_active && (t.target_grade === grade || t.target_grade === 'ALL'));
  }

  public static getStudentQuestionnaires(studentId: string): StudentQuestionnaireStatus[] {
    const student = db.getStudents().find((s) => s.id === studentId);
    if (!student) return [];

    const studentClass = db.getClasses().find((c) => c.id === student.class_id);
    const grade = studentClass?.grade || 'X';

    const assignments = db.getAssignments().filter(
      (a) => a.class_id === student.class_id && a.is_active
    );

    const allTypes = db.getQuestionnaireTypes().filter((t) => t.is_active);
    const responses = db.getResponses().filter((r) => r.student_id === studentId);
    const answers = db.getAnswers();

    return allTypes
      .filter((type) => {
        // Tampilkan angket sesuai rombel/kelas siswa:
        // Kelas X -> AKPD KELAS X
        // Kelas XI -> AKPD KELAS XI
        // Kelas XII -> ANGKET MINAT KARIER KELAS XII (BMW)
        // Serta angket target ALL atau yang secara spesifik ditugaskan ke kelasnya
        return (
          type.target_grade === grade ||
          type.target_grade === 'ALL' ||
          assignments.some((a) => a.questionnaire_type_id === type.id)
        );
      })
      .map((type) => {
        const assignment = assignments.find((a) => a.questionnaire_type_id === type.id);
        const response = responses.find((r) => r.questionnaire_type_id === type.id);
        const questions = db.getQuestions().filter((q) => q.questionnaire_type_id === type.id && q.is_active);
        const totalQuestions = questions.length;

        let answeredCount = 0;
        let status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' = 'NOT_STARTED';

        if (response) {
          const respAnswers = answers.filter((a) => a.response_id === response.id);
          answeredCount = respAnswers.length;
          if (response.status === 'SUBMITTED') {
            status = 'SUBMITTED';
          } else {
            status = answeredCount > 0 ? 'IN_PROGRESS' : 'NOT_STARTED';
          }
        }

        const progressPct =
          totalQuestions > 0 ? Math.min(100, Math.round((answeredCount / totalQuestions) * 100)) : 0;

        return {
          type,
          assignment,
          response,
          status,
          answeredCount,
          totalQuestions,
          progressPct,
        };
      });
  }

  /**
   * Save a single answer in draft/realtime
   */
  public static saveAnswer(
    studentId: string,
    questionnaireTypeId: string,
    questionId: string,
    optionCode: string,
    scoreValue: number,
    careerTag?: 'BEKERJA' | 'KULIAH' | 'WIRAUSAHA'
  ): QuestionnaireResponse {
    let response = db
      .getResponses()
      .find((r) => r.student_id === studentId && r.questionnaire_type_id === questionnaireTypeId);

    if (!response) {
      response = {
        id: `resp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        student_id: studentId,
        questionnaire_type_id: questionnaireTypeId,
        status: 'DRAFT',
        started_at: new Date().toISOString(),
        can_reedit: true,
        total_answered: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.saveResponse(response);
    }

    const existingAnswers = db.getAnswers().filter((a) => a.response_id === response!.id);
    const existingIndex = existingAnswers.findIndex((a) => a.question_id === questionId);

    const newAnswer: QuestionnaireAnswer = {
      id: existingIndex >= 0 ? existingAnswers[existingIndex].id : `ans-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      response_id: response.id,
      question_id: questionId,
      selected_option_code: optionCode,
      score_value: scoreValue,
      career_tag: careerTag,
    };

    if (existingIndex >= 0) {
      existingAnswers[existingIndex] = newAnswer;
    } else {
      existingAnswers.push(newAnswer);
    }

    db.saveAnswers(response.id, existingAnswers);

    response.total_answered = existingAnswers.length;
    response.updated_at = new Date().toISOString();
    db.saveResponse(response);

    return response;
  }

  /**
   * Validate and submit response
   */
  public static submitResponse(
    responseId: string,
    initialCareerChoice?: 'BEKERJA' | 'KULIAH' | 'WIRAUSAHA',
    studentNotes?: string
  ): { success: boolean; message: string; missingNumbers: number[] } {
    const response = db.getResponses().find((r) => r.id === responseId);
    if (!response) return { success: false, message: 'Respon tidak ditemukan.', missingNumbers: [] };

    const type = db.getQuestionnaireTypes().find((t) => t.id === response.questionnaire_type_id);
    const questions = db
      .getQuestions()
      .filter((q) => q.questionnaire_type_id === response.questionnaire_type_id && q.is_active)
      .sort((a, b) => a.question_number - b.question_number);

    const answers = db.getAnswers().filter((a) => a.response_id === responseId);
    const answeredQuestionIds = new Set(answers.map((a) => a.question_id));

    const missingNumbers: number[] = [];
    questions.forEach((q) => {
      if (!answeredQuestionIds.has(q.id)) {
        missingNumbers.push(q.question_number);
      }
    });

    if (missingNumbers.length > 0) {
      return {
        success: false,
        message: `Masih ada ${missingNumbers.length} butir pertanyaan yang belum dijawab. Mohon periksa kembali.`,
        missingNumbers,
      };
    }

    response.status = 'SUBMITTED';
    response.submitted_at = new Date().toISOString();
    response.can_reedit = false;
    response.total_answered = answers.length;
    if (initialCareerChoice) {
      response.initial_career_choice = initialCareerChoice;
    }
    if (studentNotes !== undefined) {
      response.student_notes = studentNotes;
    }
    response.updated_at = new Date().toISOString();
    db.saveResponse(response);
    
    // Explicitly guarantee all answers are synced to cloud on submission
    if (answers.length > 0) {
      db.saveAnswers(response.id, answers);
    }

    return {
      success: true,
      message: 'Angket berhasil dikirim dan tersimpan dengan baik.',
      missingNumbers: [],
    };
  }

  /**
   * Re-open response permission for student (allowed by Guru BK or Admin)
   */
  public static reOpenResponse(responseId: string): boolean {
    const response = db.getResponses().find((r) => r.id === responseId);
    if (!response) return false;
    response.status = 'DRAFT';
    response.can_reedit = true;
    response.updated_at = new Date().toISOString();
    db.saveResponse(response);
    return true;
  }

  /**
   * Completely delete / reset a response and all associated answers
   * Useful when Guru BK wants to clear trial/mistake data so student can retake cleanly
   */
  public static deleteStudentResponse(responseId: string): boolean {
    const response = db.getResponses().find((r) => r.id === responseId);
    if (!response) return false;
    db.deleteResponse(responseId);
    return true;
  }

  /**
   * Reset all or specific questionnaire responses for a student
   */
  public static resetStudentQuestionnaires(studentId: string, questionnaireTypeId?: string): boolean {
    const responses = db.getResponses().filter((r) => {
      if (r.student_id !== studentId) return false;
      if (questionnaireTypeId && r.questionnaire_type_id !== questionnaireTypeId) return false;
      return true;
    });

    if (responses.length === 0) return false;

    responses.forEach((r) => {
      db.deleteResponse(r.id);
    });

    return true;
  }
}
