import React, { useState, useMemo } from 'react';
import { db } from '../../db/storage';
import { Student } from '../../types/database';
import { useNotification } from '../../context/NotificationContext';
import { AuditService } from '../../services/AuditService';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Plus,
  Search,
  Edit3,
  Trash2,
  FileSpreadsheet,
  X,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Layers,
  RotateCcw,
} from 'lucide-react';
import { ReportingService } from '../../services/ReportingService';
import { initialStudents, initialClasses, initialStudyPrograms } from '../../db/seedData';

export const MasterSiswa: React.FC = () => {
  const { currentUser, role } = useAuth();
  const { showToast } = useNotification();

  const [students, setStudents] = useState<Student[]>(() => db.getStudents());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<'ALL' | 'X' | 'XI' | 'XII'>('ALL');
  const [selectedProgram, setSelectedProgram] = useState<string>('ALL');
  const [selectedClass, setSelectedClass] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [nis, setNis] = useState('');
  const [nisn, setNisn] = useState('');
  const [gender, setGender] = useState<'L' | 'P'>('L');
  const [classId, setClassId] = useState(db.getClasses()[0]?.id || '');
  const [phone, setPhone] = useState('0');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [address, setAddress] = useState('');

  const classes = db.getClasses();
  const programs = db.getPrograms();

  const reloadData = () => {
    setStudents(db.getStudents());
  };

  const handleOpenAdd = () => {
    if (classes.length === 0) {
      showToast('warning', 'Belum Ada Kelas', 'Silakan tambahkan Program Keahlian dan Rombel Kelas terlebih dahulu di Master Kelas.');
      return;
    }
    setEditingStudent(null);
    setName('');
    setNis('');
    setNisn('');
    setGender('L');
    setClassId(classes[0]?.id || '');
    setPhone('0');
    setParentName('');
    setParentPhone('');
    setAddress('Kabupaten Sukabumi');
    setShowModal(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setName(student.name);
    setNis(student.nis);
    setNisn(student.nisn);
    setGender(student.gender);
    setClassId(student.class_id);
    setPhone(student.phone || '0');
    setParentName(student.parent_name || '');
    setParentPhone(student.parent_phone || '');
    setAddress(student.address || '');
    setShowModal(true);
  };

  const handleResetToDefaultSeed = () => {
    if (confirm(`PERINGATAN: Apakah Anda yakin ingin memulihkan / reload seluruh master ${initialStudents.length} data siswa resmi (Kelas X, XI, XII seluruh jurusan)?`)) {
      localStorage.setItem('sibks_students', JSON.stringify(initialStudents));
      localStorage.setItem('sibks_classes', JSON.stringify(initialClasses));
      localStorage.setItem('sibks_programs', JSON.stringify(initialStudyPrograms));
      localStorage.setItem('sibks_school_data_populated_v2', 'true');
      reloadData();
      showToast('success', 'Data Dipulihkan', `Berhasil memuat ${initialStudents.length} data siswa lengkap.`);
    }
  };

  const handleResetAllStudents = () => {
    if (confirm('PERINGATAN: Apakah Anda yakin ingin mengosongkan seluruh data siswa? Seluruh data hasil angket siswa juga akan dibersihkan.')) {
      db.resetStudents();
      reloadData();
      showToast('warning', 'Data Siswa Dikosongkan', 'Seluruh data siswa berhasil dibersihkan untuk input ulang.');
    }
  };

  const handleDelete = (id: string, sName: string) => {
    if (confirm(`Yakin ingin menghapus data siswa: ${sName}?`)) {
      db.deleteStudent(id);
      const studentUsers = db.getUsers().filter((u) => u.related_id === id);
      studentUsers.forEach((u) => db.deleteUser(u.id));
      if (currentUser) {
        AuditService.log(
          currentUser.id,
          currentUser.name,
          role,
          'DELETE_STUDENT',
          'Student',
          `Menghapus siswa: ${sName}`,
          id
        );
      }
      reloadData();
      showToast('info', 'Dihapus', `Data siswa ${sName} berhasil dihapus.`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !nis.trim()) {
      showToast('warning', 'Peringatan', 'Nama siswa dan NIS wajib diisi.');
      return;
    }

    const studentData: Student = {
      id: editingStudent ? editingStudent.id : `std-${Date.now()}`,
      name,
      nis,
      nisn: nisn || nis,
      gender,
      class_id: classId,
      phone: phone || '0',
      parent_name: parentName,
      parent_phone: parentPhone,
      address,
      created_at: editingStudent ? editingStudent.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.saveStudent(studentData);

    // Ensure User account exists for this student
    const users = db.getUsers();
    const existingUser = users.find((u) => u.related_id === studentData.id || u.username === studentData.nis);
    if (!existingUser) {
      db.saveUser({
        id: `usr-${studentData.id}`,
        username: studentData.nis,
        name: studentData.name,
        email: `${studentData.nis}@siswa.smkn1gunungguruh.sch.id`,
        role: 'SISWA',
        related_id: studentData.id,
        password: '12345678',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } else {
      db.saveUser({
        ...existingUser,
        name: studentData.name,
        username: studentData.nis,
        updated_at: new Date().toISOString(),
      });
    }

    if (currentUser) {
      AuditService.log(
        currentUser.id,
        currentUser.name,
        role,
        editingStudent ? 'UPDATE_STUDENT' : 'CREATE_STUDENT',
        'Student',
        `${editingStudent ? 'Memperbarui' : 'Menambahkan'} siswa: ${name}`,
        studentData.id
      );
    }

    reloadData();
    setShowModal(false);
    showToast(
      'success',
      'Berhasil',
      `Data siswa ${name} berhasil ${editingStudent ? 'diperbarui' : 'ditambahkan'}.`
    );
  };

  // Filtered classes based on selected grade and program
  const availableClasses = useMemo(() => {
    return classes.filter((c) => {
      const matchGrade = selectedGrade === 'ALL' || c.grade === selectedGrade;
      const matchProg = selectedProgram === 'ALL' || c.study_program_id === selectedProgram;
      return matchGrade && matchProg;
    });
  }, [classes, selectedGrade, selectedProgram]);

  // Filtered Students
  const filtered = useMemo(() => {
    return students.filter((s) => {
      const cls = classes.find((c) => c.id === s.class_id);
      
      const matchesSearch =
        !searchQuery.trim() ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nis.includes(searchQuery) ||
        s.nisn.includes(searchQuery);

      const matchesGrade = selectedGrade === 'ALL' || (cls && cls.grade === selectedGrade);
      const matchesProg = selectedProgram === 'ALL' || (cls && cls.study_program_id === selectedProgram);
      const matchesClass = !selectedClass || s.class_id === selectedClass;

      return matchesSearch && matchesGrade && matchesProg && matchesClass;
    });
  }, [students, classes, searchQuery, selectedGrade, selectedProgram, selectedClass]);

  // Summary counts
  const stats = useMemo(() => {
    let countX = 0;
    let countXI = 0;
    let countXII = 0;

    students.forEach((s) => {
      const cls = classes.find((c) => c.id === s.class_id);
      if (cls?.grade === 'X') countX++;
      else if (cls?.grade === 'XI') countXI++;
      else if (cls?.grade === 'XII') countXII++;
    });

    return { total: students.length, countX, countXI, countXII };
  }, [students, classes]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentSafePage = Math.min(currentPage, totalPages);
  const startIndex = (currentSafePage - 1) * pageSize;
  const paginatedStudents = filtered.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Master Data Siswa</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengelolaan data induk peserta didik Kelas X, XI, XII seluruh program keahlian dengan autentikasi NIS.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleResetToDefaultSeed}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200 transition-colors cursor-pointer"
            title="Muat ulang 1.400+ data siswa default"
          >
            <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
            <span>Reload Data Siswa Lengkap</span>
          </button>
          {students.length > 0 && (
            <button
              onClick={handleResetAllStudents}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 transition-colors cursor-pointer"
              title="Kosongkan seluruh data siswa untuk input ulang"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span className="hidden sm:inline">Kosongkan</span>
            </button>
          )}
          <button
            onClick={() => ReportingService.exportStudents()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Ekspor Excel</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Siswa</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Siswa</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-black text-slate-900 mt-1">{stats.total.toLocaleString('id-ID')}</p>
          <span className="text-[10px] text-slate-400">Terdaftar di Sistem</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600">Kelas X</span>
            <GraduationCap className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-slate-900 mt-1">{stats.countX.toLocaleString('id-ID')}</p>
          <span className="text-[10px] text-slate-400">Angket Kelas X (50 Butir)</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-600">Kelas XI</span>
            <GraduationCap className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xl font-black text-slate-900 mt-1">{stats.countXI.toLocaleString('id-ID')}</p>
          <span className="text-[10px] text-slate-400">Angket AKPD (40 Butir)</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-600">Kelas XII</span>
            <GraduationCap className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-xl font-black text-slate-900 mt-1">{stats.countXII.toLocaleString('id-ID')}</p>
          <span className="text-[10px] text-slate-400">Angket BMW (50 Butir)</span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari nama siswa, NIS, atau NISN..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs focus:outline-blue-500"
          />
        </div>

        {/* Tingkat */}
        <select
          value={selectedGrade}
          onChange={(e) => {
            setSelectedGrade(e.target.value as any);
            setSelectedClass('');
            setCurrentPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 w-full md:w-auto font-medium"
        >
          <option value="ALL">Semua Tingkat</option>
          <option value="X">Kelas X</option>
          <option value="XI">Kelas XI</option>
          <option value="XII">Kelas XII</option>
        </select>

        {/* Jurusan */}
        <select
          value={selectedProgram}
          onChange={(e) => {
            setSelectedProgram(e.target.value);
            setSelectedClass('');
            setCurrentPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 w-full md:w-auto font-medium"
        >
          <option value="ALL">Semua Jurusan</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} - {p.name}
            </option>
          ))}
        </select>

        {/* Kelas */}
        <select
          value={selectedClass}
          onChange={(e) => {
            setSelectedClass(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 w-full md:w-auto font-medium"
        >
          <option value="">Semua Rombel ({availableClasses.length})</option>
          {availableClasses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <th className="py-3 px-4 w-12 text-center">No</th>
              <th className="py-3 px-4">Nama Siswa</th>
              <th className="py-3 px-4">NIS / NISN</th>
              <th className="py-3 px-4">Kelas & Jurusan</th>
              <th className="py-3 px-4">Telepon</th>
              <th className="py-3 px-4 text-center w-28">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedStudents.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  Tidak ada data siswa yang cocok dengan filter pencarian.
                </td>
              </tr>
            ) : (
              paginatedStudents.map((s, idx) => {
                const cls = classes.find((c) => c.id === s.class_id);
                const prog = cls ? programs.find((p) => p.id === cls.study_program_id) : undefined;

                return (
                  <tr key={s.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 text-center font-bold text-slate-400">{startIndex + idx + 1}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{s.name}</span>
                      <span className="text-[11px] text-slate-400">
                        {s.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      <span className="font-semibold">{s.nis}</span>
                      {s.nisn && s.nisn !== s.nis && (
                        <span className="text-slate-400 text-[11px] block">NISN: {s.nisn}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 block">{cls?.name || '-'}</span>
                      <span className="text-[11px] text-slate-400">{prog?.code} - {prog?.name || '-'}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="font-mono text-xs">{s.phone || '0'}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id, s.name)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          <div className="text-xs text-slate-500">
            Menampilkan <span className="font-bold text-slate-800">{filtered.length === 0 ? 0 : startIndex + 1}</span> -{' '}
            <span className="font-bold text-slate-800">{Math.min(startIndex + pageSize, filtered.length)}</span> dari{' '}
            <span className="font-bold text-slate-800">{filtered.length}</span> siswa
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <span>Per halaman:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 rounded border border-slate-200 bg-white text-xs"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentSafePage <= 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-700 px-2">
                Hal {currentSafePage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentSafePage >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base">
                {editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nama Lengkap Siswa:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: ABDUL AZIZ HAKIM"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">NIS (Nomor Induk Siswa):</label>
                  <input
                    type="text"
                    value={nis}
                    onChange={(e) => setNis(e.target.value)}
                    placeholder="Contoh: 107753390"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">NISN:</label>
                  <input
                    type="text"
                    value={nisn}
                    onChange={(e) => setNisn(e.target.value)}
                    placeholder="Contoh: 107753390"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Kelas (Rombel):</label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.grade})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Jenis Kelamin:</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">No. Telp / WhatsApp:</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-2 rounded-lg border border-slate-300 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer"
                >
                  {editingStudent ? 'Simpan Perubahan' : 'Tambah Siswa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
