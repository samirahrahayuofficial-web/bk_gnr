import { db } from '../db/storage';
import { AnalysisService } from './AnalysisService';

export class ReportingService {
  /**
   * Helper to download CSV with UTF-8 BOM for Microsoft Excel
   */
  public static downloadCSV(filename: string, headers: string[], rows: (string | number)[][]): void {
    const formatCell = (val: string | number) => {
      const str = String(val ?? '').replace(/"/g, '""');
      return `"${str}"`;
    };

    const headerLine = headers.map(formatCell).join(',');
    const bodyLines = rows.map((r) => r.map(formatCell).join(',')).join('\r\n');
    const csvContent = '\uFEFF' + headerLine + '\r\n' + bodyLines;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Export Master Data Siswa to Excel/CSV
   */
  public static exportStudents(): void {
    const students = db.getStudents();
    const classes = db.getClasses();
    const programs = db.getPrograms();

    const headers = [
      'No',
      'NIS',
      'NISN',
      'Nama Siswa',
      'Jenis Kelamin',
      'Kelas',
      'Program Keahlian',
      'No. Telepon',
      'Nama Orang Tua / Wali',
      'No. Telepon Ortu',
      'Alamat',
    ];

    const rows = students.map((s, idx) => {
      const cls = classes.find((c) => c.id === s.class_id);
      const prog = cls ? programs.find((p) => p.id === cls.study_program_id) : undefined;

      return [
        idx + 1,
        s.nis,
        s.nisn,
        s.name,
        s.gender === 'L' ? 'Laki-laki' : 'Perempuan',
        cls ? cls.name : '-',
        prog ? prog.name : '-',
        s.phone || '-',
        s.parent_name || '-',
        s.parent_phone || '-',
        s.address || '-',
      ];
    });

    this.downloadCSV('Data_Siswa_SIBKS', headers, rows);
  }

  /**
   * Export Rekapitulasi AKPD
   */
  public static exportAKPDRecap(classId?: string): void {
    const students = db.getStudents();
    const classes = db.getClasses();
    const responses = db
      .getResponses()
      .filter((r) => r.questionnaire_type_id === 'qt-akpd' && r.status === 'SUBMITTED');

    let filtered = responses;
    if (classId) {
      const studentIdsInClass = new Set(
        students.filter((s) => s.class_id === classId).map((s) => s.id)
      );
      filtered = responses.filter((r) => studentIdsInClass.has(r.student_id));
    }

    const headers = [
      'No',
      'NIS',
      'Nama Siswa',
      'Kelas',
      'Pribadi (%)',
      'Sosial (%)',
      'Belajar (%)',
      'Karir (%)',
      'Rata-rata Kebutuhan (%)',
      'Tingkat Prioritas',
      'Kebutuhan Tertinggi',
      'Tanggal Pengisian',
    ];

    const rows = filtered.map((r, idx) => {
      const s = students.find((std) => std.id === r.student_id);
      const cls = s ? classes.find((c) => c.id === s.class_id) : undefined;
      const { categoryAnalysis } = AnalysisService.calculateResponseAnalysis(r.id);

      const cr = categoryAnalysis?.category_results || [];
      const prib = cr.find((c) => c.category_code === 'PRIBADI')?.percentage ?? 0;
      const sos = cr.find((c) => c.category_code === 'SOSIAL')?.percentage ?? 0;
      const bel = cr.find((c) => c.category_code === 'BELAJAR')?.percentage ?? 0;
      const kar = cr.find((c) => c.category_code === 'KARIR')?.percentage ?? 0;

      return [
        idx + 1,
        s ? s.nis : '-',
        s ? s.name : 'Unknown',
        cls ? cls.name : '-',
        `${prib}%`,
        `${sos}%`,
        `${bel}%`,
        `${kar}%`,
        `${categoryAnalysis?.overall_percentage ?? 0}%`,
        categoryAnalysis?.priority_level ?? 'LOW',
        categoryAnalysis?.highest_need_category ?? '-',
        r.submitted_at ? new Date(r.submitted_at).toLocaleDateString('id-ID') : '-',
      ];
    });

    this.downloadCSV('Rekap_Hasil_AKPD_SIBKS', headers, rows);
  }

  /**
   * Export Rekapitulasi BMW Kelas XII
   */
  public static exportBMWRecap(classId?: string): void {
    const students = db.getStudents();
    const classes = db.getClasses();
    const responses = db
      .getResponses()
      .filter((r) => r.questionnaire_type_id === 'qt-bmw' && r.status === 'SUBMITTED');

    let filtered = responses;
    if (classId) {
      const studentIdsInClass = new Set(
        students.filter((s) => s.class_id === classId).map((s) => s.id)
      );
      filtered = responses.filter((r) => studentIdsInClass.has(r.student_id));
    }

    const headers = [
      'No',
      'NIS',
      'Nama Siswa',
      'Kelas',
      'Bekerja (A)',
      'Persentase Bekerja (%)',
      'Kuliah (B)',
      'Persentase Kuliah (%)',
      'Wirausaha (C)',
      'Persentase Wirausaha (%)',
      'Kecenderungan Minat Karier',
      'Tanggal Pengisian',
    ];

    const rows = filtered.map((r, idx) => {
      const s = students.find((std) => std.id === r.student_id);
      const cls = s ? classes.find((c) => c.id === s.class_id) : undefined;
      const { careerResult } = AnalysisService.calculateResponseAnalysis(r.id);

      return [
        idx + 1,
        s ? s.nis : '-',
        s ? s.name : 'Unknown',
        cls ? cls.name : '-',
        careerResult?.count_a_bekerja ?? 0,
        `${careerResult?.pct_bekerja ?? 0}%`,
        careerResult?.count_b_kuliah ?? 0,
        `${careerResult?.pct_kuliah ?? 0}%`,
        careerResult?.count_c_wirausaha ?? 0,
        `${careerResult?.pct_wirausaha ?? 0}%`,
        careerResult?.career_title ?? '-',
        r.submitted_at ? new Date(r.submitted_at).toLocaleDateString('id-ID') : '-',
      ];
    });

    this.downloadCSV('Rekap_Minat_Karier_BMW_SIBKS', headers, rows);
  }

  /**
   * Export Priority Mapping List
   */
  public static exportPriorityList(): void {
    const students = db.getStudents();
    const classes = db.getClasses();
    const responses = db
      .getResponses()
      .filter((r) => r.status === 'SUBMITTED' && r.questionnaire_type_id === 'qt-akpd');

    const headers = [
      'No',
      'NIS',
      'Nama Siswa',
      'Kelas',
      'Indikasi Prioritas Layanan',
      'Tingkat Kebutuhan (%)',
      'Bidang Kebutuhan Dominan',
      'Rekomendasi Tindak Lanjut Awal',
    ];

    const rows = responses.map((r, idx) => {
      const s = students.find((std) => std.id === r.student_id);
      const cls = s ? classes.find((c) => c.id === s.class_id) : undefined;
      const { categoryAnalysis } = AnalysisService.calculateResponseAnalysis(r.id);

      return [
        idx + 1,
        s ? s.nis : '-',
        s ? s.name : 'Unknown',
        cls ? cls.name : '-',
        categoryAnalysis?.priority_level ?? 'LOW',
        `${categoryAnalysis?.overall_percentage ?? 0}%`,
        categoryAnalysis?.highest_need_category ?? '-',
        categoryAnalysis?.indication_summary ?? '-',
      ];
    });

    this.downloadCSV('Pemetaan_Prioritas_Kebutuhan_Siswa_SIBKS', headers, rows);
  }
}
