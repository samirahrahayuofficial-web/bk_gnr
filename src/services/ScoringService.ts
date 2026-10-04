import {
  CategoryScoreResult,
  PriorityLevel,
  QuestionnaireAnswer,
  QuestionnaireCategory,
  QuestionnaireQuestion,
  QuestionnaireType,
  StudentAnalysis,
  SystemSettings,
} from '../types/database';

export class ScoringService {
  /**
   * Determine priority level from percentage using configurable settings
   */
  public static getPriorityLevel(
    percentage: number,
    settings: SystemSettings
  ): { level: PriorityLevel; label: string } {
    const { urgent_min, high_min, medium_min, low_min } = settings.thresholds;

    if (percentage >= urgent_min) {
      return { level: 'URGENT', label: 'Sangat Tinggi' };
    }
    if (percentage >= high_min) {
      return { level: 'HIGH', label: 'Tinggi' };
    }
    if (percentage >= medium_min) {
      return { level: 'MEDIUM', label: 'Sedang' };
    }
    if (percentage >= low_min) {
      return { level: 'LOW', label: 'Rendah' };
    }
    return { level: 'LOW', label: 'Sangat Rendah' };
  }

  /**
   * Calculate category-based scoring for AKPD and Kelas X
   */
  public static calculateCategoryScoring(
    type: QuestionnaireType,
    categories: QuestionnaireCategory[],
    questions: QuestionnaireQuestion[],
    answers: QuestionnaireAnswer[],
    settings: SystemSettings,
    studentId: string,
    responseId: string
  ): StudentAnalysis {
    const questionCatMap = new Map<string, string>();
    questions.forEach((q) => {
      questionCatMap.set(q.id, q.category_id);
    });

    const categoryResults: CategoryScoreResult[] = categories.map((cat) => {
      const catQuestions = questions.filter((q) => q.category_id === cat.id);
      const totalItems = catQuestions.length;

      let answeredYes = 0;
      catQuestions.forEach((q) => {
        const ans = answers.find((a) => a.question_id === q.id);
        if (ans && (ans.selected_option_code === 'YA' || ans.score_value > 0)) {
          answeredYes++;
        }
      });

      const percentage = totalItems > 0 ? Math.round((answeredYes / totalItems) * 100) : 0;
      const { level, label } = this.getPriorityLevel(percentage, settings);

      return {
        category_id: cat.id,
        category_name: cat.name,
        category_code: cat.code,
        total_items: totalItems,
        answered_yes_or_target: answeredYes,
        percentage,
        priority_level: level,
        interpretation: label,
      };
    });

    const totalQuestions = questions.length;
    const totalYes = answers.filter(
      (a) => a.selected_option_code === 'YA' || a.score_value > 0
    ).length;
    const overallPercentage =
      totalQuestions > 0 ? Math.round((totalYes / totalQuestions) * 100) : 0;

    const { level: overallPriority } = this.getPriorityLevel(overallPercentage, settings);

    // Find highest need category
    let highestCat = categoryResults[0]?.category_name || '-';
    let highestScore = -1;
    categoryResults.forEach((cat) => {
      if (cat.percentage > highestScore) {
        highestScore = cat.percentage;
        highestCat = cat.category_name;
      }
    });

    const indicationSummary =
      overallPriority === 'URGENT' || overallPriority === 'HIGH'
        ? `Indikasi kebutuhan layanan BK tergolong ${overallPriority === 'URGENT' ? 'Sangat Tinggi (Mendesak)' : 'Tinggi'}, dengan fokus utama pada ${highestCat}. Disarankan untuk dijadwalkan sesi bimbingan atau konseling segera.`
        : overallPriority === 'MEDIUM'
        ? `Indikasi kebutuhan layanan BK tergolong Sedang pada area ${highestCat}. Dapat diberikan penguatan melalui bimbingan kelompok atau klasikal.`
        : `Indikasi kebutuhan layanan BK tergolong Rendah/Mandiri. Siswa menunjukkan adaptasi dan perkembangan yang relatif stabil.`;

    return {
      id: `analysis-${responseId}`,
      response_id: responseId,
      student_id: studentId,
      questionnaire_type_id: type.id,
      total_questions: totalQuestions,
      total_yes: totalYes,
      overall_percentage: overallPercentage,
      category_results: categoryResults,
      highest_need_category: highestCat,
      priority_level: overallPriority,
      indication_summary: indicationSummary,
      calculated_at: new Date().toISOString(),
    };
  }
}
