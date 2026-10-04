import { db } from '../db/storage';
import { AnalysisService } from './AnalysisService';

const SAVED_SPREADSHEET_ID_KEY = 'sibks_google_spreadsheet_id';
const SAVED_SPREADSHEET_URL_KEY = 'sibks_google_spreadsheet_url';
const SAVED_SPREADSHEET_NAME_KEY = 'sibks_google_spreadsheet_name';
const SAVED_LAST_SYNC_KEY = 'sibks_google_last_sync';

export interface SheetsSyncResult {
  success: boolean;
  spreadsheetId: string;
  spreadsheetUrl: string;
  syncedTabs: string[];
  totalRowsSynced: number;
  timestamp: string;
  error?: string;
}

export class GoogleSheetsService {
  public static getSavedSpreadsheetId(): string | null {
    return localStorage.getItem(SAVED_SPREADSHEET_ID_KEY);
  }

  public static getSavedSpreadsheetUrl(): string | null {
    return localStorage.getItem(SAVED_SPREADSHEET_URL_KEY);
  }

  public static getSavedSpreadsheetName(): string | null {
    return localStorage.getItem(SAVED_SPREADSHEET_NAME_KEY);
  }

  public static getLastSyncTime(): string | null {
    return localStorage.getItem(SAVED_LAST_SYNC_KEY);
  }

  public static saveSpreadsheetMetadata(id: string, url: string, name: string): void {
    localStorage.setItem(SAVED_SPREADSHEET_ID_KEY, id);
    localStorage.setItem(SAVED_SPREADSHEET_URL_KEY, url);
    localStorage.setItem(SAVED_SPREADSHEET_NAME_KEY, name);
  }

  public static clearSpreadsheetMetadata(): void {
    localStorage.removeItem(SAVED_SPREADSHEET_ID_KEY);
    localStorage.removeItem(SAVED_SPREADSHEET_URL_KEY);
    localStorage.removeItem(SAVED_SPREADSHEET_NAME_KEY);
    localStorage.removeItem(SAVED_LAST_SYNC_KEY);
  }

  /**
   * Create a new structured BK Spreadsheet on user's Google Drive
   */
  public static async createBKSpreadsheet(accessToken: string): Promise<{ id: string; url: string; title: string }> {
    const settings = db.getSettings();
    const title = `SIBKS - ${settings.school_name} (Database BK)`;

    const payload = {
      properties: {
        title,
        timeZone: 'Asia/Jakarta',
      },
      sheets: [
        { properties: { title: 'DATA_SISWA', gridProperties: { frozenRowCount: 1 } } },
        { properties: { title: 'REKAP_AKPD', gridProperties: { frozenRowCount: 1 } } },
        { properties: { title: 'MINAT_KARIER_BMW', gridProperties: { frozenRowCount: 1 } } },
        { properties: { title: 'TINDAK_LANJUT_BK', gridProperties: { frozenRowCount: 1 } } },
        { properties: { title: 'LOG_AUDIT', gridProperties: { frozenRowCount: 1 } } },
      ],
    };

    const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Gagal membuat Google Spreadsheet baru.');
    }

    const data = await res.json();
    const spreadsheetId = data.spreadsheetId;
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    this.saveSpreadsheetMetadata(spreadsheetId, spreadsheetUrl, title);
    return { id: spreadsheetId, url: spreadsheetUrl, title };
  }

  /**
   * Synchronize all local BK data to Google Sheets tabs
   */
  public static async syncAllData(accessToken: string, targetSpreadsheetId?: string): Promise<SheetsSyncResult> {
    let spreadsheetId = targetSpreadsheetId || this.getSavedSpreadsheetId();

    // If no spreadsheet exists yet, create one automatically
    if (!spreadsheetId) {
      const created = await this.createBKSpreadsheet(accessToken);
      spreadsheetId = created.id;
    }

    // 1. Prepare DATA_SISWA
    const students = db.getStudents();
    const classes = db.getClasses();
    const programs = db.getPrograms();

    const dataSiswaRows: (string | number)[][] = [
      [
        'No',
        'NIS',
        'NISN',
        'Nama Lengkap Siswa',
        'Jenis Kelamin',
        'Kelas',
        'Program Keahlian',
        'No. Telepon / WA',
        'Nama Orang Tua / Wali',
        'No. Telepon Wali',
        'Alamat Domisili',
      ],
      ...students.map((s, idx) => {
        const cls = classes.find((c) => c.id === s.class_id);
        const prog = cls ? programs.find((p) => p.id === cls.study_program_id) : undefined;
        return [
          idx + 1,
          s.nis,
          s.nisn,
          s.name,
          s.gender === 'L' ? 'Laki-laki' : 'Perempuan',
          cls ? cls.name : '-',
          prog ? `${prog.name} (${prog.code})` : '-',
          s.phone || '-',
          s.parent_name || '-',
          s.parent_phone || '-',
          s.address || '-',
        ];
      }),
    ];

    // 2. Prepare REKAP_AKPD
    const akpdResponses = db
      .getResponses()
      .filter((r) => r.questionnaire_type_id === 'qt-akpd' && r.status === 'SUBMITTED');

    const rekapAkpdRows: (string | number)[][] = [
      [
        'No',
        'NIS',
        'Nama Siswa',
        'Kelas',
        'Bidang Pribadi (%)',
        'Bidang Sosial (%)',
        'Bidang Belajar (%)',
        'Bidang Karir (%)',
        'Rata-rata Kebutuhan (%)',
        'Tingkat Prioritas Layanan',
        'Kebutuhan Tertinggi',
        'Catatan Indikasi Layanan BK',
        'Tanggal Pengisian',
      ],
      ...akpdResponses.map((r, idx) => {
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
          s?.nis || '-',
          s?.name || 'Unknown',
          cls?.name || '-',
          `${prib}%`,
          `${sos}%`,
          `${bel}%`,
          `${kar}%`,
          `${categoryAnalysis?.overall_percentage ?? 0}%`,
          categoryAnalysis?.priority_level ?? 'LOW',
          categoryAnalysis?.highest_need_category ?? '-',
          categoryAnalysis?.indication_summary ?? '-',
          r.submitted_at ? new Date(r.submitted_at).toLocaleDateString('id-ID') : '-',
        ];
      }),
    ];

    // 3. Prepare MINAT_KARIER_BMW
    const bmwResponses = db
      .getResponses()
      .filter((r) => r.questionnaire_type_id === 'qt-bmw' && r.status === 'SUBMITTED');

    const rekapBmwRows: (string | number)[][] = [
      [
        'No',
        'NIS',
        'Nama Siswa',
        'Kelas',
        'Poin Bekerja (A)',
        'Persentase Bekerja (%)',
        'Poin Kuliah (B)',
        'Persentase Kuliah (%)',
        'Poin Wirausaha (C)',
        'Persentase Wirausaha (%)',
        'Kecenderungan Minat Utama',
        'Rekomendasi Bimbingan BK',
        'Tanggal Pengisian',
      ],
      ...bmwResponses.map((r, idx) => {
        const s = students.find((std) => std.id === r.student_id);
        const cls = s ? classes.find((c) => c.id === s.class_id) : undefined;
        const { careerResult } = AnalysisService.calculateResponseAnalysis(r.id);

        return [
          idx + 1,
          s?.nis || '-',
          s?.name || 'Unknown',
          cls?.name || '-',
          careerResult?.count_a_bekerja ?? 0,
          `${careerResult?.pct_bekerja ?? 0}%`,
          careerResult?.count_b_kuliah ?? 0,
          `${careerResult?.pct_kuliah ?? 0}%`,
          careerResult?.count_c_wirausaha ?? 0,
          `${careerResult?.pct_wirausaha ?? 0}%`,
          careerResult?.career_title ?? '-',
          careerResult?.bk_recommendations?.join(' | ') ?? '-',
          r.submitted_at ? new Date(r.submitted_at).toLocaleDateString('id-ID') : '-',
        ];
      }),
    ];

    // 4. Prepare TINDAK_LANJUT_BK
    const followUps = db.getFollowUps();
    const tindakLanjutRows: (string | number)[][] = [
      [
        'No',
        'Nama Siswa',
        'Kelas',
        'Tanggal',
        'Bidang Layanan',
        'Jenis Layanan BK',
        'Deskripsi Kebutuhan / Masalah',
        'Rekomendasi Konselor',
        'Status Penanganan',
        'Monitoring Berikutnya',
        'Konselor BK',
      ],
      ...followUps.map((fu, idx) => {
        const s = students.find((std) => std.id === fu.student_id);
        const cls = s ? classes.find((c) => c.id === s.class_id) : undefined;
        return [
          idx + 1,
          s?.name || '-',
          cls?.name || '-',
          fu.date,
          fu.bidang,
          fu.service_type,
          fu.problem_need,
          fu.recommendation || '-',
          fu.status,
          fu.next_follow_up_date || '-',
          fu.counselor_name,
        ];
      }),
    ];

    // 5. Prepare LOG_AUDIT
    const auditLogs = db.getAuditLogs().slice(0, 50);
    const auditRows: (string | number)[][] = [
      ['No', 'Waktu & Tanggal', 'Nama Pengguna', 'Peran (Role)', 'Aksi / Event', 'Rincian Aktivitas'],
      ...auditLogs.map((l, idx) => [
        idx + 1,
        new Date(l.timestamp).toLocaleString('id-ID'),
        l.user_name,
        l.user_role,
        l.action,
        l.details,
      ]),
    ];

    // Push each tab data via batchUpdate values
    const dataPayload = {
      valueInputOption: 'USER_ENTERED',
      data: [
        { range: 'DATA_SISWA!A1:K', values: dataSiswaRows },
        { range: 'REKAP_AKPD!A1:M', values: rekapAkpdRows },
        { range: 'MINAT_KARIER_BMW!A1:M', values: rekapBmwRows },
        { range: 'TINDAK_LANJUT_BK!A1:K', values: tindakLanjutRows },
        { range: 'LOG_AUDIT!A1:F', values: auditRows },
      ],
    };

    const updateRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataPayload),
      }
    );

    if (!updateRes.ok) {
      const err = await updateRes.json();
      throw new Error(err.error?.message || 'Gagal menyinkronkan data ke Google Sheets.');
    }

    const now = new Date().toLocaleString('id-ID');
    localStorage.setItem(SAVED_LAST_SYNC_KEY, now);

    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
    const totalRows =
      dataSiswaRows.length +
      rekapAkpdRows.length +
      rekapBmwRows.length +
      tindakLanjutRows.length +
      auditRows.length -
      5;

    return {
      success: true,
      spreadsheetId,
      spreadsheetUrl,
      syncedTabs: ['DATA_SISWA', 'REKAP_AKPD', 'MINAT_KARIER_BMW', 'TINDAK_LANJUT_BK', 'LOG_AUDIT'],
      totalRowsSynced: totalRows,
      timestamp: now,
    };
  }

  /**
   * Import students from Google Sheets DATA_SISWA tab back into app
   */
  public static async pullStudentsFromSheet(accessToken: string, spreadsheetId: string): Promise<number> {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/DATA_SISWA!A2:K`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!res.ok) {
      throw new Error('Gagal membaca data siswa dari tab DATA_SISWA di Google Sheets.');
    }

    const data = await res.json();
    const rows = data.values || [];
    let updatedCount = 0;

    const classes = db.getClasses();
    const defaultClassId = classes[0]?.id || 'cls-x-rpl-1';

    rows.forEach((row: string[]) => {
      const nis = row[1]?.trim();
      const name = row[3]?.trim();
      if (nis && name) {
        const nisn = row[2]?.trim() || nis;
        const gender = row[4]?.trim().toUpperCase().startsWith('P') ? 'P' : 'L';
        const className = row[5]?.trim();
        const matchedClass = classes.find((c) => c.name.toLowerCase() === className?.toLowerCase());
        const phone = row[7]?.trim();
        const parentName = row[8]?.trim();
        const parentPhone = row[9]?.trim();
        const address = row[10]?.trim();

        const existing = db.getStudents().find((s) => s.nis === nis);
        db.saveStudent({
          id: existing ? existing.id : `std-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          nis,
          nisn,
          name,
          gender: gender as 'L' | 'P',
          class_id: matchedClass ? matchedClass.id : defaultClassId,
          phone,
          parent_name: parentName,
          parent_phone: parentPhone,
          address,
          created_at: existing ? existing.created_at : new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        updatedCount++;
      }
    });

    return updatedCount;
  }
}
