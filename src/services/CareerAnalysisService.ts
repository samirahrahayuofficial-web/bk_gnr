import {
  CareerResult,
  QuestionnaireAnswer,
  QuestionnaireCategory,
  QuestionnaireQuestion,
} from '../types/database';

export class CareerAnalysisService {
  public static calculateBMW(
    questions: QuestionnaireQuestion[],
    categories: QuestionnaireCategory[],
    answers: QuestionnaireAnswer[],
    studentId: string,
    responseId: string
  ): CareerResult {
    let countA = 0;
    let countB = 0;
    let countC = 0;

    answers.forEach((ans) => {
      const code = ans.selected_option_code?.toUpperCase();
      if (code === 'A' || ans.career_tag === 'BEKERJA') {
        countA++;
      } else if (code === 'B' || ans.career_tag === 'KULIAH') {
        countB++;
      } else if (code === 'C' || ans.career_tag === 'WIRAUSAHA') {
        countC++;
      }
    });

    const totalQuestions = questions.length || 50;
    const totalAnswered = countA + countB + countC || totalQuestions;

    const pctA = Math.round((countA / totalAnswered) * 100);
    const pctB = Math.round((countB / totalAnswered) * 100);
    const pctC = Math.round((countC / totalAnswered) * 100);

    let dominant: 'BEKERJA' | 'KULIAH' | 'WIRAUSAHA' | 'KOMBINASI' = 'KOMBINASI';
    let careerTitle = 'Kecenderungan Kombinasi / Seimbang';
    const recommendations: string[] = [];

    if (pctA > 50) {
      dominant = 'BEKERJA';
      careerTitle = 'Kecenderungan Dominan Bekerja';
      recommendations.push(
        'Pembekalan pembuatan CV profesional, teknik wawancara kerja, bursa kerja khusus (BKK), dan pemetaan industri yang sesuai dengan keahlian SMK.'
      );
    } else if (pctB > 50) {
      dominant = 'KULIAH';
      careerTitle = 'Kecenderungan Dominan Kuliah';
      recommendations.push(
        'Bimbingan orientasi jurusan PTN/PTS, info jalur SNBP/SNBT/Mandiri, beasiswa (KIP-Kuliah), dan persiapan ujian akademik.'
      );
    } else if (pctC > 50) {
      dominant = 'WIRAUSAHA';
      careerTitle = 'Kecenderungan Dominan Wirausaha';
      recommendations.push(
        'Pelatihan business plan, literasi keuangan, strategi pemasaran digital, serta pendampingan program wirausaha muda.'
      );
    } else if (pctA <= 40 && pctB <= 40 && pctC <= 40) {
      dominant = 'KOMBINASI';
      careerTitle = 'Kecenderungan Kombinasi / Seimbang';
      recommendations.push(
        'Konseling individual terfokus untuk membantu memprioritaskan langkah utama (Primary Career Path).'
      );
    } else {
      // One is highest between 41% - 50%
      const max = Math.max(pctA, pctB, pctC);
      if (max === pctA) {
        dominant = 'BEKERJA';
        careerTitle = 'Condong Bekerja (Kombinasi Potensial)';
        recommendations.push(
          'Pembekalan pembuatan CV profesional, teknik wawancara kerja, bursa kerja khusus (BKK), dan pemetaan industri yang sesuai dengan keahlian SMK.'
        );
      } else if (max === pctB) {
        dominant = 'KULIAH';
        careerTitle = 'Condong Kuliah (Kombinasi Potensial)';
        recommendations.push(
          'Bimbingan orientasi jurusan PTN/PTS, info jalur SNBP/SNBT/Mandiri, beasiswa (KIP-Kuliah), dan persiapan ujian akademik.'
        );
      } else {
        dominant = 'WIRAUSAHA';
        careerTitle = 'Condong Wirausaha (Kombinasi Potensial)';
        recommendations.push(
          'Pelatihan business plan, literasi keuangan, strategi pemasaran digital, serta pendampingan program wirausaha muda.'
        );
      }
    }

    // Aspect breakdown
    const aspectBreakdown = categories.map((cat) => {
      const catQuestions = questions.filter((q) => q.category_id === cat.id);
      let catA = 0;
      let catB = 0;
      let catC = 0;

      catQuestions.forEach((q) => {
        const ans = answers.find((a) => a.question_id === q.id);
        const code = ans?.selected_option_code?.toUpperCase();
        if (code === 'A' || ans?.career_tag === 'BEKERJA') catA++;
        else if (code === 'B' || ans?.career_tag === 'KULIAH') catB++;
        else if (code === 'C' || ans?.career_tag === 'WIRAUSAHA') catC++;
      });

      return {
        aspect_name: cat.name,
        bekerja: catA,
        kuliah: catB,
        wirausaha: catC,
      };
    });

    return {
      id: `career-${responseId}`,
      response_id: responseId,
      student_id: studentId,
      total_questions: totalQuestions,
      count_a_bekerja: countA,
      count_b_kuliah: countB,
      count_c_wirausaha: countC,
      pct_bekerja: pctA,
      pct_kuliah: pctB,
      pct_wirausaha: pctC,
      dominant_career: dominant,
      career_title: careerTitle,
      bk_recommendations: recommendations,
      aspect_breakdown: aspectBreakdown,
      calculated_at: new Date().toISOString(),
    };
  }
}
