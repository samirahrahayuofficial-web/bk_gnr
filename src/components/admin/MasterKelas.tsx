import React, { useState, useEffect } from 'react';
import { db } from '../../db/storage';
import { AcademicYear, ClassRoom, StudyProgram } from '../../types/database';
import { useNotification } from '../../context/NotificationContext';
import { BookOpen, Plus, Edit3, Trash2, X, School } from 'lucide-react';

export const MasterKelas: React.FC = () => {
  const { showToast } = useNotification();
  const [activeTab, setActiveTab] = useState<'classes' | 'programs' | 'academic_years'>('classes');

  const [classes, setClasses] = useState<ClassRoom[]>(() => db.getClasses());
  const [programs, setPrograms] = useState<StudyProgram[]>(() => db.getPrograms());
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>(() => db.getAcademicYears());

  useEffect(() => {
    const handleSync = () => {
      setClasses(db.getClasses());
      setPrograms(db.getPrograms());
      setAcademicYears(db.getAcademicYears());
    };
    window.addEventListener('sibks_data_synced', handleSync);
    return () => window.removeEventListener('sibks_data_synced', handleSync);
  }, []);

  // Class Modal state
  const [showClassModal, setShowClassModal] = useState(false);
  const [className, setClassName] = useState('');
  const [grade, setGrade] = useState<'X' | 'XI' | 'XII'>('X');
  const [progId, setProgId] = useState(programs[0]?.id || '');
  const [homeroom, setHomeroom] = useState('');

  // Program Modal state
  const [showProgModal, setShowProgModal] = useState(false);
  const [progCode, setProgCode] = useState('');
  const [progName, setProgName] = useState('');
  const [progDesc, setProgDesc] = useState('');

  const reloadData = () => {
    setClasses(db.getClasses());
    setPrograms(db.getPrograms());
    setAcademicYears(db.getAcademicYears());
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) return;

    const newClass: ClassRoom = {
      id: `cls-${Date.now()}`,
      name: className,
      grade,
      study_program_id: progId,
      academic_year_id: academicYears[0]?.id || 'ay-2024-ganjil',
      homeroom_teacher: homeroom,
      student_count: 36,
    };

    db.saveClass(newClass);
    reloadData();
    setShowClassModal(false);
    showToast('success', 'Kelas Ditambahkan', `Rombel ${className} berhasil disimpan.`);
    setClassName('');
    setHomeroom('');
  };

  const handleDeleteClass = (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus kelas ${name}?`)) {
      db.deleteClass(id);
      reloadData();
      showToast('info', 'Dihapus', `Kelas ${name} dihapus.`);
    }
  };

  const handleDeleteProgram = (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus program keahlian ${name}? Semua kelas pada jurusan ini juga akan terhapus.`)) {
      db.deleteProgram(id);
      reloadData();
      showToast('info', 'Dihapus', `Program keahlian ${name} berhasil dihapus.`);
    }
  };

  const handleResetAll = () => {
    if (confirm('PERINGATAN: Apakah Anda yakin ingin mengosongkan seluruh data jurusan dan rombel kelas?')) {
      db.resetStudentsAndMajors();
      reloadData();
      showToast('warning', 'Data Dikosongkan', 'Seluruh data jurusan dan kelas telah dibersihkan untuk input ulang.');
    }
  };

  const handleSaveProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!progCode.trim() || !progName.trim()) return;

    const newProg: StudyProgram = {
      id: `sp-${Date.now()}`,
      code: progCode.toUpperCase(),
      name: progName,
      description: progDesc,
    };

    db.saveProgram(newProg);
    reloadData();
    setShowProgModal(false);
    showToast('success', 'Program Keahlian Ditambahkan', `Program ${progName} berhasil disimpan.`);
    setProgCode('');
    setProgName('');
    setProgDesc('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span>Master Kelas & Program Keahlian</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen rombongan belajar, program keahlian (jurusan), dan tahun ajaran aktif.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {(classes.length > 0 || programs.length > 0) && (
            <button
              onClick={handleResetAll}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 transition-colors cursor-pointer"
              title="Kosongkan seluruh data jurusan dan rombel kelas"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span className="hidden sm:inline">Kosongkan Jurusan & Kelas</span>
            </button>
          )}
          {activeTab === 'classes' && (
            <button
              onClick={() => {
                if (programs.length === 0) {
                  showToast('warning', 'Perhatian', 'Tambahkan Program Keahlian (Jurusan) terlebih dahulu sebelum membuat kelas.');
                  setActiveTab('programs');
                  return;
                }
                setProgId(programs[0]?.id || '');
                setShowClassModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kelas</span>
            </button>
          )}
          {activeTab === 'programs' && (
            <button
              onClick={() => setShowProgModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Program</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('classes')}
          className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'classes'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Rombongan Belajar ({classes.length})
        </button>
        <button
          onClick={() => setActiveTab('programs')}
          className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'programs'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Program Keahlian ({programs.length})
        </button>
        <button
          onClick={() => setActiveTab('academic_years')}
          className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'academic_years'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Tahun Ajaran ({academicYears.length})
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden text-xs">
        {activeTab === 'classes' && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Nama Kelas</th>
                <th className="py-3 px-4">Tingkat</th>
                <th className="py-3 px-4">Program Keahlian</th>
                <th className="py-3 px-4">Wali Kelas</th>
                <th className="py-3 px-4 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Belum ada rombongan belajar (kelas). Silakan klik tombol <strong>+ Tambah Kelas</strong> di atas.
                  </td>
                </tr>
              ) : (
                classes.map((c, idx) => {
                  const prog = programs.find((p) => p.id === c.study_program_id);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px]">
                          Kelas {c.grade}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {prog ? `${prog.name} (${prog.code})` : '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{c.homeroom_teacher || '-'}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteClass(c.id, c.name)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'programs' && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Kode</th>
                <th className="py-3 px-4">Nama Program Keahlian</th>
                <th className="py-3 px-4">Keterangan / Kompetensi</th>
                <th className="py-3 px-4 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {programs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Belum ada program keahlian (jurusan). Silakan klik tombol <strong>+ Tambah Program</strong> di atas.
                  </td>
                </tr>
              ) : (
                programs.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">{p.code}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{p.name}</td>
                    <td className="py-3 px-4 text-slate-500">{p.description || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDeleteProgram(p.id, p.name)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        title="Hapus Program"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'academic_years' && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Tahun Ajaran</th>
                <th className="py-3 px-4">Semester</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {academicYears.map((ay, idx) => (
                <tr key={ay.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{ay.name}</td>
                  <td className="py-3 px-4 text-slate-700">Semester {ay.semester}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        ay.is_active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {ay.is_active ? 'Aktif' : 'Arsip'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Class Modal */}
      {showClassModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Tambah Rombel Kelas Baru</h3>
              <button onClick={() => setShowClassModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nama Kelas:</label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="Contoh: X RPL 2, XII TKJ 2"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tingkat:</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  >
                    <option value="X">Kelas X</option>
                    <option value="XI">Kelas XI</option>
                    <option value="XII">Kelas XII</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Program Keahlian:</label>
                  <select
                    value={progId}
                    onChange={(e) => setProgId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  >
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nama Wali Kelas:</label>
                <input
                  type="text"
                  value={homeroom}
                  onChange={(e) => setHomeroom(e.target.value)}
                  placeholder="Contoh: Dra. Tri Endah, M.Pd"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClassModal(false)}
                  className="px-3 py-2 rounded-lg border border-slate-300 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer"
                >
                  Simpan Kelas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Program Modal */}
      {showProgModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Tambah Program Keahlian Baru</h3>
              <button onClick={() => setShowProgModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProgram} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Kode Singkatan:</label>
                <input
                  type="text"
                  value={progCode}
                  onChange={(e) => setProgCode(e.target.value)}
                  placeholder="Contoh: RPL, TKJ, AKL"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 uppercase font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nama Program Keahlian:</label>
                <input
                  type="text"
                  value={progName}
                  onChange={(e) => setProgName(e.target.value)}
                  placeholder="Contoh: Rekayasa Perangkat Lunak"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Deskripsi:</label>
                <textarea
                  rows={2}
                  value={progDesc}
                  onChange={(e) => setProgDesc(e.target.value)}
                  placeholder="Deskripsi keahlian..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProgModal(false)}
                  className="px-3 py-2 rounded-lg border border-slate-300 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer"
                >
                  Simpan Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
