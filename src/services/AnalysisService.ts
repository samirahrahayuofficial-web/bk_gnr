import { db } from '../db/storage';
import {
  CareerResult,
  CategoryScoreResult,
  PriorityLevel,
  Student,
  StudentAnalysis,
} from '../types/database';
import { CareerAnalysisService } from './CareerAnalysisService';
import { ScoringService } from './ScoringService';

export interface ClassRecapSummary {
  class_id: string;
  class_name: string;
  grade: string;
  total_students: number;
  total_submitted: number;
  participation_rate: number;
  questionnaire_type_id: string;
  category_averages: {
    category_id: string;
    category_name: string;
    average_pct: number;
    priority_level: PriorityLevel;
    interpretation: string;
  }[];
  overall_average_pct: number;
  overall_priority_level: PriorityLevel;
  priority_counts: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
  career_summary?: {
    total_bekerja: number;
    total_kuliah: number;
    total_wirausaha: number;
    total_kombinasi: number;
    avg_bekerja_pct: number;
    avg_kuliah_pct: number;
    avg_wirausaha_pct: number;
  };
}

export interface TopNeedItem {
  question_id: string;
  question_number: number;
  statement: string;
  category_name: string;
  total_yes: number;
  total_respondents: number;
  percentage: number;
}

export class AnalysisService {
  /**
   * Recalculate analysis dynamically from raw answers in DB
   */
  public static calculateResponseAnalysis(responseId: string): {
    categoryAnalysis?: StudentAnalysis;
    careerResult?: CareerResult;
  } {
    const responses = db.getResponses();
    const resp = responses.find((r) => r.id === responseId);
    if (!resp) return {};

    const types = db.getQuestionnaireTypes();
    const type = types.find((t) => t.id === resp.questionnaire_type_id);
    if (!type) return {};

    const questions = db.getQuestions().filter((q) => q.questionnaire_type_id === type.id);
    const categories = db.getCategories().filter((c) => c.questionnaire_type_id === type.id);
    
    // Comprehensive student identification
    const student = db.getStudents().find((s) => s.id === resp.student_id || s.nis === resp.student_id);
    const allStudentIds = new Set<string>();
    if (resp.student_id) allStudentIds.add(resp.student_id);
    if (student) {
      allStudentIds.add(student.id);
      allStudentIds.add(student.nis);
      allStudentIds.add(`std-${student.nis}`);
    }

    const allDbAnswers = db.getAnswers();
    let answers = allDbAnswers.filter((a) => {
      if (!a) return false;
      if (a.response_id === resp.id) return true;
      if (a.response_id && allStudentIds.has(a.response_id)) return true;
      if (a.response_id && Array.from(allStudentIds).some((sid) => a.response_id.includes(sid))) return true;
      if (a.id && a.id.includes(resp.id)) return true;
      if (a.id && Array.from(allStudentIds).some((sid) => a.id.includes(sid))) return true;
      return false;
    });

    // Fallback: Check localStorage draft if student filled locally
    if (answers.length === 0 && resp.student_id) {
      try {
        const draftKeys = [
          `sibks_draft_${resp.student_id}_${resp.questionnaire_type_id}`,
          student ? `sibks_draft_${student.id}_${resp.questionnaire_type_id}` : '',
          student ? `sibks_draft_${student.nis}_${resp.questionnaire_type_id}` : '',
        ].filter(Boolean);

        for (const dKey of draftKeys) {
          const draftStr = localStorage.getItem(dKey);
          if (draftStr) {
            const draftMap = JSON.parse(draftStr);
            if (draftMap && Object.keys(draftMap).length > 0) {
              const restored: any[] = Object.entries(draftMap).map(([qId, val]: [string, any]) => ({
                id: `ans-${resp.id}-${qId}`,
                response_id: resp.id,
                question_id: qId,
                selected_option_code: val.optionCode,
                score_value: val.scoreValue,
                career_tag: val.careerTag,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }));
              db.saveAnswers(resp.id, restored);
              answers = restored;
              break;
            }
          }
        }
      } catch (e) {}
    }

    const settings = db.getSettings();

    if (type.scoring_model === 'CAREER_BMW') {
      const careerResult = CareerAnalysisService.calculateBMW(
        questions,
        categories,
        answers,
        resp.student_id,
        resp.id
      );
      return { careerResult };
    } else {
      const categoryAnalysis = ScoringService.calculateCategoryScoring(
        type,
        categories,
        questions,
        answers,
        settings,
        resp.student_id,
        resp.id
      );
      return { categoryAnalysis };
    }
  }

  /**
   * Get all analyses for a student
   */
  public static getStudentAnalyses(studentId: string) {
    const student = db.getStudents().find((s) => s.id === studentId || s.nis === studentId);
    const validIds = new Set<string>();
    validIds.add(studentId);
    if (student) {
      validIds.add(student.id);
      validIds.add(student.nis);
      validIds.add(`std-${student.nis}`);
    }

    const responses = db
      .getResponses()
      .filter((r) => validIds.has(r.student_id) && r.status === 'SUBMITTED');

    const results = responses.map((r) => {
      const type = db.getQuestionnaireTypes().find((t) => t.id === r.questionnaire_type_id);
      const calculated = this.calculateResponseAnalysis(r.id);
      return {
        response: r,
        type,
        ...calculated,
      };
    });

    return results;
  }

  /**
   * Calculate Class Recapitulation
   */
  public static getClassRecapitulation(
    classId: string,
    questionnaireTypeId: string
  ): ClassRecapSummary | null {
    const cls = db.getClasses().find((c) => c.id === classId);
    if (!cls) return null;

    const students = db.getStudents().filter((s) => s.class_id === classId);
    const studentIds = new Set<string>();
    students.forEach((s) => {
      studentIds.add(s.id);
      studentIds.add(s.nis);
      studentIds.add(`std-${s.nis}`);
    });

    const responses = db.getResponses().filter(
      (r) =>
        r.questionnaire_type_id === questionnaireTypeId &&
        r.status === 'SUBMITTED' &&
        studentIds.has(r.student_id)
    );

    const type = db.getQuestionnaireTypes().find((t) => t.id === questionnaireTypeId);
    const categories = db.getCategories().filter((c) => c.questionnaire_type_id === questionnaireTypeId);
    const settings = db.getSettings();

    const totalStudents = students.length;
    const totalSubmitted = responses.length;
    const participationRate =
      totalStudents > 0 ? Math.round((totalSubmitted / totalStudents) * 100) : 0;

    const priorityCounts = { urgent: 0, high: 0, medium: 0, low: 0 };

    if (type?.scoring_model === 'CAREER_BMW') {
      let sumA = 0;
      let sumB = 0;
      let sumC = 0;
      let bkrCount = 0;
      let klhCount = 0;
      let wirCount = 0;
      let komCount = 0;

      responses.forEach((r) => {
        const { careerResult } = this.calculateResponseAnalysis(r.id);
        if (careerResult) {
          sumA += careerResult.pct_bekerja;
          sumB += careerResult.pct_kuliah;
          sumC += careerResult.pct_wirausaha;
          if (careerResult.dominant_career === 'BEKERJA') bkrCount++;
          else if (careerResult.dominant_career === 'KULIAH') klhCount++;
          else if (careerResult.dominant_career === 'WIRAUSAHA') wirCount++;
          else komCount++;
        }
      });

      const count = responses.length || 1;
      return {
        class_id: classId,
        class_name: cls.name,
        grade: cls.grade,
        total_students: totalStudents,
        total_submitted: totalSubmitted,
        participation_rate: participationRate,
        questionnaire_type_id: questionnaireTypeId,
        category_averages: [],
        overall_average_pct: 0,
        overall_priority_level: 'LOW',
        priority_counts: priorityCounts,
        career_summary: {
          total_bekerja: bkrCount,
          total_kuliah: klhCount,
          total_wirausaha: wirCount,
          total_kombinasi: komCount,
          avg_bekerja_pct: Math.round(sumA / count),
          avg_kuliah_pct: Math.round(sumB / count),
          avg_wirausaha_pct: Math.round(sumC / count),
        },
      };
    }

    // Category-based (AKPD or Kelas X)
    const categoryTotals: Record<string, { sumPct: number; count: number; name: string }> = {};
    categories.forEach((cat) => {
      categoryTotals[cat.id] = { sumPct: 0, count: 0, name: cat.name };
    });

    let overallSum = 0;

    responses.forEach((r) => {
      const { categoryAnalysis } = this.calculateResponseAnalysis(r.id);
      if (categoryAnalysis) {
        overallSum += categoryAnalysis.overall_percentage;
        const p = categoryAnalysis.priority_level;
        if (p === 'URGENT') priorityCounts.urgent++;
        else if (p === 'HIGH') priorityCounts.high++;
        else if (p === 'MEDIUM') priorityCounts.medium++;
        else priorityCounts.low++;

        categoryAnalysis.category_results.forEach((cr) => {
          if (categoryTotals[cr.category_id]) {
            categoryTotals[cr.category_id].sumPct += cr.percentage;
            categoryTotals[cr.category_id].count++;
          }
        });
      }
    });

    const respCount = responses.length || 1;
    const overallAvgPct = Math.round(overallSum / respCount);
    const { level: overallPriority } = ScoringService.getPriorityLevel(overallAvgPct, settings);

    const categoryAverages = categories.map((cat) => {
      const stat = categoryTotals[cat.id];
      const avgPct = stat && stat.count > 0 ? Math.round(stat.sumPct / stat.count) : 0;
      const { level, label } = ScoringService.getPriorityLevel(avgPct, settings);
      return {
        category_id: cat.id,
        category_name: cat.name,
        average_pct: avgPct,
        priority_level: level,
        interpretation: label,
      };
    });

    return {
      class_id: classId,
      class_name: cls.name,
      grade: cls.grade,
      total_students: totalStudents,
      total_submitted: totalSubmitted,
      participation_rate: participationRate,
      questionnaire_type_id: questionnaireTypeId,
      category_averages: categoryAverages,
      overall_average_pct: overallAvgPct,
      overall_priority_level: overallPriority,
      priority_counts: priorityCounts,
    };
  }

  /**
   * Top 10 Most Common Student Needs
   */
  public static getTop10Needs(questionnaireTypeId?: string): TopNeedItem[] {
    const questions = db.getQuestions();
    const categories = db.getCategories();
    const allResponses = db.getResponses().filter((r) => r.status === 'SUBMITTED');
    const responses = questionnaireTypeId
      ? allResponses.filter((r) => r.questionnaire_type_id === questionnaireTypeId)
      : allResponses.filter((r) => r.questionnaire_type_id !== 'qt-bmw');

    if (responses.length === 0) return [];

    const stats: TopNeedItem[] = [];
    const questionItems = questionnaireTypeId
      ? questions.filter((q) => q.questionnaire_type_id === questionnaireTypeId)
      : questions.filter((q) => q.questionnaire_type_id !== 'qt-bmw');

    questionItems.forEach((q) => {
      const qTypeResponses = responses.filter((r) => r.questionnaire_type_id === q.questionnaire_type_id);
      if (qTypeResponses.length === 0) return;

      const responseIds = new Set(qTypeResponses.map((r) => r.id));
      const studentIds = new Set(qTypeResponses.map((r) => r.student_id));
      const answers = db
        .getAnswers()
        .filter((a) => responseIds.has(a.response_id) || studentIds.has(a.response_id));
      const qNum = String(q.question_number);

      const yesCount = answers.filter((a) => {
        const matchesQ =
          a.question_id === q.id ||
          a.question_id === qNum ||
          a.question_id?.endsWith(`-${qNum}`) ||
          a.question_id?.endsWith(`_${qNum}`);
        if (!matchesQ) return false;
        const code = String(a.selected_option_code || '').trim().toUpperCase();
        return (
          Number(a.score_value) > 0 ||
          code === 'YA' ||
          code === 'Y' ||
          code === '1' ||
          code === 'A' ||
          code === 'TRUE'
        );
      }).length;

      const pct = Math.round((yesCount / qTypeResponses.length) * 100);
      const cat = categories.find((c) => c.id === q.category_id);

      stats.push({
        question_id: q.id,
        question_number: q.question_number,
        statement: q.statement,
        category_name: cat ? cat.name : '-',
        total_yes: yesCount,
        total_respondents: qTypeResponses.length,
        percentage: pct,
      });
    });

    stats.sort((a, b) => b.percentage - a.percentage);
    return stats.slice(0, 10);
  }

  /**
   * Comprehensive School-Wide Statistics
   */
  public static getSchoolOverview() {
    const students = db.getStudents();
    const responses = db.getResponses();
    const submittedResponses = responses.filter((r) => r.status === 'SUBMITTED');

    // Unique students who completed at least one questionnaire
    const studentIdToStudent = new Map<string, Student>();
    students.forEach((s) => {
      studentIdToStudent.set(s.id, s);
      studentIdToStudent.set(s.nis, s);
      studentIdToStudent.set(`std-${s.nis}`, s);
    });

    const completedStudentSet = new Set<string>();
    submittedResponses.forEach((r) => {
      const matched = studentIdToStudent.get(r.student_id);
      if (matched) {
        completedStudentSet.add(matched.id);
      } else {
        completedStudentSet.add(r.student_id);
      }
    });

    const totalStudents = students.length;
    const completedStudentsCount = completedStudentSet.size;
    const pendingStudentsCount = Math.max(0, totalStudents - completedStudentsCount);
    const participationRate =
      totalStudents > 0 ? Math.round((completedStudentsCount / totalStudents) * 100) : 0;

    // High and Urgent priority count
    let highOrUrgentCount = 0;
    const followUps = db.getFollowUps();
    const activeFollowUpsCount = followUps.filter(
      (f) => f.status === 'Belum Ditindaklanjuti' || f.status === 'Dalam Proses'
    ).length;

    // Check priority for AKPD & Kelas X respondents
    const needAssessmentResponses = submittedResponses.filter(
      (r) => r.questionnaire_type_id !== 'qt-bmw'
    );
    needAssessmentResponses.forEach((r) => {
      const { categoryAnalysis } = this.calculateResponseAnalysis(r.id);
      if (
        categoryAnalysis &&
        (categoryAnalysis.priority_level === 'HIGH' || categoryAnalysis.priority_level === 'URGENT')
      ) {
        highOrUrgentCount++;
      }
    });

    // 4 Bidang Distribution across all need assessment questionnaires
    const bidangStats: Record<string, { totalPct: number; count: number; name: string }> = {
      PRIBADI: { totalPct: 0, count: 0, name: 'Pribadi' },
      SOSIAL: { totalPct: 0, count: 0, name: 'Sosial' },
      BELAJAR: { totalPct: 0, count: 0, name: 'Belajar' },
      KARIR: { totalPct: 0, count: 0, name: 'Karir & DUDI' },
    };

    needAssessmentResponses.forEach((r) => {
      const { categoryAnalysis } = this.calculateResponseAnalysis(r.id);
      if (categoryAnalysis) {
        categoryAnalysis.category_results.forEach((cr) => {
          let code = cr.category_code?.toUpperCase();
          if (!code || !bidangStats[code]) {
            const lowName = cr.category_name.toLowerCase();
            if (lowName.includes('pribadi')) code = 'PRIBADI';
            else if (lowName.includes('sosial')) code = 'SOSIAL';
            else if (lowName.includes('belajar')) code = 'BELAJAR';
            else if (lowName.includes('karir')) code = 'KARIR';
          }
          if (code && bidangStats[code]) {
            bidangStats[code].totalPct += cr.percentage;
            bidangStats[code].count++;
          }
        });
      }
    });

    const bidangDistribution = Object.values(bidangStats).map((b) => ({
      name: b.name,
      average: b.count > 0 ? Math.round(b.totalPct / b.count) : 0,
    }));

    // BMW Career Stats
    const bmwResponses = submittedResponses.filter((r) => r.questionnaire_type_id === 'qt-bmw');
    let careerA = 0;
    let careerB = 0;
    let careerC = 0;
    let careerKom = 0;

    bmwResponses.forEach((r) => {
      const { careerResult } = this.calculateResponseAnalysis(r.id);
      if (careerResult) {
        if (careerResult.dominant_career === 'BEKERJA') careerA++;
        else if (careerResult.dominant_career === 'KULIAH') careerB++;
        else if (careerResult.dominant_career === 'WIRAUSAHA') careerC++;
        else careerKom++;
      }
    });

    return {
      totalStudents,
      completedStudentsCount,
      pendingStudentsCount,
      participationRate,
      activeQuestionnairesCount: db.getQuestionnaireTypes().filter((t) => t.is_active).length,
      highOrUrgentCount,
      activeFollowUpsCount,
      bidangDistribution,
      careerDistribution: {
        bekerja: careerA,
        kuliah: careerB,
        wirausaha: careerC,
        kombinasi: careerKom,
        total: bmwResponses.length,
      },
      top10Needs: this.getTop10Needs(),
    };
  }
}
