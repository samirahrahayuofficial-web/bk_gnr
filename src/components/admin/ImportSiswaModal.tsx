import React, { useState, useRef } from 'react';
import { db } from '../../db/storage';
import { Student, User } from '../../types/database';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { AuditService } from '../../services/AuditService';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  FileText,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface ImportSiswaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportSiswaModal: React.FC<ImportSiswaModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser, role } = useAuth();
  const { showToast } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState('');
  const [rawText, setRawText] = useState('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseError, setParseError] = useState('');

  if (!isOpen) return null;

  const classes = db.getClasses();

  // Helper to normalize class names (e.g. "XII TKR 1", "xiitkr1", "12 TKR 1")
  const findMatchingClassId = (rawClassName: string): string => {
    if (!rawClassName) return classes[0]?.id || 'cls-xii-to-1';
    const clean = rawClassName.trim().toUpperCase().replace(/\s+/g, ' ');
    
    // Direct match
    const direct = classes.find((c) => c.name.toUpperCase() === clean);
    if (direct) return direct.id;

    // Partial match
    const partial = classes.find((c) => clean.includes(c.name.toUpperCase()) || c.name.toUpperCase().includes(clean));
    if (partial) return partial.id;

    return classes[0]?.id || 'cls-xii-to-1';
  };

  const handleDownloadTemplate = () => {
    const csvContent =
      'No,NIS,Nama Siswa,L/P,Kelas,NISN,No Telepon,Nama Orang Tua,Alamat\n' +
      '1,124255900,ABDUL MULKI MULYA,L,XII TO 1,124255900,081234567890,Orang Tua,Kabupaten Sukabumi\n' +
      '2,124255901,ADE MUHAMAD FASHA,L,XII TO 1,124255901,081234567891,Orang Tua,Kabupaten Sukabumi\n' +
      '3,124255933,SITI FITRIANI RAMADANI,P,XII TO 1,124255933,081234567892,Orang Tua,Kabupaten Sukabumi\n' +
      '4,126277002,ABDUL AZIZ HAKIM,L,X TO 1,126277002,081234567893,Orang Tua,Kabupaten Sukabumi\n' +
      '5,125266407,ABDUL MUIZ ALMALIK,L,XI TO 1,125266407,081234567894,Orang Tua,Kabupaten Sukabumi\n';

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Template_Import_Siswa_SMKN1Gunungguruh.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setParseError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRawText(text);
      parseCSV(text);
    };
    reader.onerror = () => {
      setParseError('Gagal membaca file. Pastikan format file adalah CSV atau TXT.');
    };
    reader.readAsText(file);
  };

  const parseCSV = (content: string) => {
    try {
      const lines = content
        .split(/\r\n|\n|\r/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length < 2) {
        setParseError('File tidak memiliki data baris yang cukup.');
        setParsedRows([]);
        return;
      }

      // Detect delimiter: comma, semicolon, or tab
      const firstLine = lines[0];
      let delimiter = ',';
      if (firstLine.includes(';') && (firstLine.match(/;/g) || []).length >= (firstLine.match(/,/g) || []).length) {
        delimiter = ';';
      } else if (firstLine.includes('\t')) {
        delimiter = '\t';
      }

      const rows: any[] = [];
      const headerIndex = 0; // First line is header
      const headers = lines[headerIndex].split(delimiter).map((h) => h.trim().toLowerCase().replace(/["']/g, ''));

      // Find column indices
      const nisIdx = headers.findIndex((h) => h.includes('nis') && !h.includes('nisn')) !== -1 
        ? headers.findIndex((h) => h.includes('nis') && !h.includes('nisn')) 
        : 1;
      const nameIdx = headers.findIndex((h) => h.includes('nama')) !== -1 
        ? headers.findIndex((h) => h.includes('nama')) 
        : 2;
      const genderIdx = headers.findIndex((h) => h.includes('l/p') || h.includes('jk') || h.includes('gender') || h.includes('kelamin')) !== -1
        ? headers.findIndex((h) => h.includes('l/p') || h.includes('jk') || h.includes('gender') || h.includes('kelamin'))
        : 3;
      const classIdx = headers.findIndex((h) => h.includes('kelas') || h.includes('rombel')) !== -1
        ? headers.findIndex((h) => h.includes('kelas') || h.includes('rombel'))
        : 4;
      const nisnIdx = headers.findIndex((h) => h.includes('nisn')) !== -1
        ? headers.findIndex((h) => h.includes('nisn'))
        : -1;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;

        // Simple CSV splitter handling quoted values
        const cols = line.split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ''));
        if (cols.length < 2) continue;

        const rawNis = cols[nisIdx] || cols[0];
        const rawName = cols[nameIdx] || cols[1];
        const rawGender = (cols[genderIdx] || 'L').toUpperCase().startsWith('P') ? 'P' : 'L';
        const rawClass = cols[classIdx] || '';
        const rawNisn = nisnIdx >= 0 ? cols[nisnIdx] || rawNis : rawNis;

        if (rawNis && rawName) {
          const matchedClassId = findMatchingClassId(rawClass);
          const matchedClassName = classes.find((c) => c.id === matchedClassId)?.name || rawClass || 'Kelas X';

          rows.push({
            nis: rawNis.replace(/[^0-9]/g, '') || rawNis,
            name: rawName.toUpperCase(),
            gender: rawGender,
            rawClass,
            class_id: matchedClassId,
            className: matchedClassName,
            nisn: rawNisn.replace(/[^0-9]/g, '') || rawNis,
          });
        }
      }

      if (rows.length === 0) {
        setParseError('Tidak dapat membaca data siswa dari format file ini.');
      } else {
        setParsedRows(rows);
      }
    } catch (err: any) {
      setParseError('Terjadi kesalahan saat memproses data: ' + err.message);
    }
  };

  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) {
      showToast('warning', 'Data Kosong', 'Tidak ada data siswa yang valid untuk diimpor.');
      return;
    }

    setIsProcessing(true);
    try {
      if (importMode === 'replace') {
        // Delete all old students from local and cloud
        db.deleteAllStudents();
      }

      const newStudents: Student[] = [];
      const newUsers: User[] = [];

      parsedRows.forEach((row, index) => {
        const studentId = `std-${row.nis || index + 1}`;
        const studentObj: Student = {
          id: studentId,
          name: row.name,
          nis: row.nis,
          nisn: row.nisn || row.nis,
          gender: row.gender as 'L' | 'P',
          class_id: row.class_id,
          phone: '0',
          parent_name: 'Orang Tua / Wali',
          parent_phone: '0',
          address: 'Kabupaten Sukabumi',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        newStudents.push(studentObj);

        // User account
        const userObj: User = {
          id: `usr-std-${studentObj.id}`,
          username: studentObj.nis,
          name: studentObj.name,
          role: 'SISWA',
          email: `${studentObj.nis}@smkn1gunungguruh.sch.id`,
          password: studentObj.nis,
          is_active: true,
          related_id: studentObj.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        newUsers.push(userObj);
      });

      // Save locally & sync to Firestore
      if (importMode === 'replace') {
        localStorage.setItem('sibks_students_v2', JSON.stringify(newStudents));
        
        // Retain non-student users
        const nonStudentUsers = db.getUsers().filter((u) => u.role !== 'SISWA');
        const finalUsers = [...nonStudentUsers, ...newUsers];
        localStorage.setItem('sibks_users_v2', JSON.stringify(finalUsers));

        // Push directly to cloud in batch
        db.saveStudentsDirectly(newStudents, finalUsers);
      } else {
        newStudents.forEach((s) => db.saveStudent(s));
        newUsers.forEach((u) => db.saveUser(u));
      }

      if (currentUser) {
        AuditService.log(
          currentUser.id,
          currentUser.name,
          role,
          'IMPORT_STUDENTS',
          'Student',
          `Mengimpor ${newStudents.length} data siswa baru (${importMode === 'replace' ? 'Timpa Semua' : 'Tambahkan'}).`
        );
      }

      showToast(
        'success',
        'Impor Berhasil',
        `Berhasil mengimpor ${newStudents.length} data siswa ke dalam sistem & Cloud Firestore.`
      );

      onSuccess();
      onClose();
    } catch (e: any) {
      showToast('error', 'Gagal Impor', e.message || 'Terjadi kesalahan saat mengimpor data.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Impor Data Siswa Baru (CSV / Excel)
              </h3>
              <p className="text-[11px] text-slate-500">
                Unggah file daftar hadir / siswa untuk memperbarui seluruh database siswa.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="py-4 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Step 1: Download Template */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-slate-600" />
              <div>
                <p className="font-bold text-slate-800">Unduh Format Template CSV</p>
                <p className="text-[11px] text-slate-500">
                  Gunakan format kolom: NIS, Nama Siswa, L/P, Kelas, NISN
                </p>
              </div>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Template</span>
            </button>
          </div>

          {/* Step 2: Upload File */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">Pilih File CSV Siswa:</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/60 hover:bg-blue-50/30 rounded-2xl p-6 text-center cursor-pointer transition-colors"
            >
              <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="font-bold text-slate-700 text-xs">
                {fileName ? fileName : 'Klik untuk memilih file CSV atau seret file ke sini'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Mendukung format .csv dan .txt (pemisah koma / titik koma)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Parse Error */}
          {parseError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Step 3: Parsed Preview */}
          {parsedRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{parsedRows.length} Siswa Berhasil Terdeteksi</span>
                </span>
                <span className="text-[11px] text-slate-400">Menampilkan 5 data pertama</span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0">
                    <tr>
                      <th className="py-2 px-3">No</th>
                      <th className="py-2 px-3">NIS</th>
                      <th className="py-2 px-3">Nama Siswa</th>
                      <th className="py-2 px-3">L/P</th>
                      <th className="py-2 px-3">Kelas Terdeteksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-1.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-1.5 px-3 font-mono font-bold text-slate-800">{row.nis}</td>
                        <td className="py-1.5 px-3 text-slate-900 font-semibold">{row.name}</td>
                        <td className="py-1.5 px-3 text-slate-600">{row.gender}</td>
                        <td className="py-1.5 px-3 text-blue-700 font-bold">{row.className}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mode Selection */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                <p className="font-bold text-amber-900 text-xs">Pilih Mode Impor:</p>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-bold text-rose-700">
                      Ganti & Timpa Semua Data Siswa Lama (Direkomendasikan jika NIS lama salah)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Tambahkan ke Data Siswa yang Sudah Ada</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={parsedRows.length === 0 || isProcessing}
            onClick={handleExecuteImport}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Memproses Impor...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Impor {parsedRows.length > 0 ? `${parsedRows.length} Siswa` : ''}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
