import React, { useState, useMemo, useEffect } from 'react';
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
  CheckSquare,
  Square,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { ReportingService } from '../../services/ReportingService';
import { initialStudents, initialClasses, initialStudyPrograms } from '../../db/seedData';

export const MasterSiswa: React.FC = () => {
  const { currentUser, role } = useAuth();
  const { showToast } = useNotification();

  const [students, setStudents] = useState<Student[]>(() => db.getStudents());

  useEffect(() => {
    const handleSync = () => setStudents(db.getStudents());
    window.addEventListener('sibks_data_synced', handleSync);
    return () => window.removeEventListener('sibks_data_synced', handleSync);
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<'ALL' | 'X' | 'XI' | 'XII'>('ALL');
  const [selectedProgram, setSelectedProgram] = useState<string>('ALL');
  const [selectedClass, setSelectedClass] = useState('');

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Delete All Modal State
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

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
  const [classId, setClassId] = useState('');
  const [phone, setPhone] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [address, setAddress] = useState('');

  const classes = db.getClasses();
  const programs = db.getPrograms();

  const reloadData = () => {
    setStudents(db.getStudents());
    setSelectedIds(new Set());
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
      localStorage.setItem('sibks_students_v2', JSON.stringify(initialStudents));
      localStorage.setItem('sibks_classes_v2', JSON.stringify(initialClasses));
      localStorage.setItem('sibks_programs_v2', JSON.stringify(initialStudyPrograms));
      reloadData();
      showToast('success', 'Data Dipulihkan', `Berhasil memuat ${initialStudents.length} data siswa lengkap.`);
    }
  };

  // Single Delete
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

  // Bulk Delete Selected
  const handleBulkDeleteSelected = () => {
    const count = selectedIds.size;
    if (count === 0) return;

    if (confirm(`PERINGATAN: Apakah Anda yakin ingin menghapus ${count} data siswa yang dipilih? Tindakan ini tidak dapat dibatalkan.`)) {
      const idsArray = Array.from(selectedIds);
      db.deleteStudentsBatch(idsArray);
      if (currentUser) {
        AuditService.log(
          currentUser.id,
          currentUser.name,
          role,
          'DELETE_STUDENT',
          'Student',
          `Menghapus massal (bulk delete) ${count} data siswa.`
        );
      }
      reloadData();
      showToast('success', 'Bulk Hapus Berhasil', `${count} data siswa berhasil dihapus dari sistem dan cloud.`);
    }
  };

  // Bulk Delete All Students
  const handleConfirmDeleteAll = () => {
    setIsDeleting(true);
    try {
      const totalCount = students.length;
      db.deleteAllStudents();
      if (currentUser) {
        AuditService.log(
          currentUser.id,
          currentUser.name,
          role,
          'DELETE_STUDENT',
          'Student',
          `Mengosongkan / Menghapus seluruh ${totalCount} data siswa dari database.`
        );
      }
      setShowDeleteAllModal(false);
      setConfirmDeleteText('');
      reloadData();
      showToast('warning', 'Seluruh Data Siswa Terhapus', `Berhasil menghapus ${totalCount} data siswa dari database lokal & cloud.`);
    } catch (e) {
      showToast('error', 'Gagal', 'Terjadi kesalahan saat menghapus seluruh data siswa.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !nis.trim()) {
      showToast('warning', 'Peringatan', 'Nama siswa dan NIS wajib diisi.');
      return;
    }

    // Check duplicate NIS
    const existingNis = students.find((s) => s.nis === nis && s.id !== editingStudent?.id);
    if (existingNis) {
      showToast('warning', 'NIS Terdaftar', `NIS ${nis} sudah digunakan oleh siswa ${existingNis.name}.`);
      return;
    }

    const studentData: Student = {
      id: editingStudent ? editingStudent.id : `std-${Date.now()}`,
      name: name.trim(),
      nis: nis.trim(),
      nisn: nisn.trim() || nis.trim(),
      gender,
      class_id: classId,
      phone: phone.trim() || '0',
      parent_name: parentName.trim() || 'Orang Tua / Wali',
      parent_phone: parentPhone.trim() || phone.trim() || '0',
      address: address.trim() || 'Kabupaten Sukabumi',
      created_at: editingStudent ? editingStudent.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.saveStudent(studentData);

    // Auto-create/sync student user account for login
    const allUsers = db.getUsers();
    let studentUser = allUsers.find((u) => u.related_id === studentData.id || u.username === studentData.nis);

    if (!studentUser) {
      studentUser = {
        id: `usr-std-${studentData.id}`,
        username: studentData.nis,
        name: studentData.name,
        role: 'SISWA',
        email: `${studentData.nis}@smkn1gunungguruh.sch.id`,
        password: studentData.nis,
        is_active: true,
        related_id: studentData.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.saveUser(studentUser);
    } else {
      studentUser.name = studentData.name;
      studentUser.username = studentData.nis;
      studentUser.updated_at = new Date().toISOString();
      db.saveUser(studentUser);
    }

    if (currentUser) {
      AuditService.log(
        currentUser.id,
        currentUser.name,
        role,
        editingStudent ? 'UPDATE_STUDENT' : 'CREATE_STUDENT',
        'Student',
        `${editingStudent ? 'Memperbarui' : 'Menambahkan'} siswa: ${name} (${nis})`,
        studentData.id
      );
    }

    setShowModal(false);
    reloadData();
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

  // Check if all on current page are selected
  const isAllCurrentPageSelected =
    paginatedStudents.length > 0 && paginatedStudents.every((s) => selectedIds.has(s.id));

  const toggleSelectAllCurrentPage = () => {
    const newSet = new Set(selectedIds);
    if (isAllCurrentPageSelected) {
      paginatedStudents.forEach((s) => newSet.delete(s.id));
    } else {
      paginatedStudents.forEach((s) => newSet.add(s.id));
    }
    setSelectedIds(newSet);
  };

  const toggleSelectStudent = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const selectAllFiltered = () => {
    const newSet = new Set(filtered.map((s) => s.id));
    setSelectedIds(newSet);
    showToast('info', 'Semua Terpilih', `${filtered.length} siswa hasil filter telah dipilih.`);
  };

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
          {students.length > 0 && (
            <button
              onClick={() => {
                setConfirmDeleteText('');
                setShowDeleteAllModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 transition-colors cursor-pointer"
              title="Hapus / Kosongkan seluruh data siswa dari sistem dan cloud"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Bulk Hapus Semua Siswa</span>
            </button>
          )}

          <button
            onClick={handleResetToDefaultSeed}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200 transition-colors cursor-pointer"
            title="Muat ulang 1.400+ data siswa default"
          >
            <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden md:inline">Reload Data Lengkap</span>
          </button>

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

      {/* Floating / Sticky Bulk Action Bar when items selected */}
      {selectedIds.size > 0 && (
        <div className="sticky top-16 z-20 bg-amber-50 border border-amber-300 rounded-2xl p-3.5 shadow-md flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
            <CheckSquare className="w-4 h-4 text-amber-700" />
            <span>{selectedIds.size} siswa terpilih dari total {filtered.length} siswa terfilter</span>
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.size < filtered.length && (
              <button
                onClick={selectAllFiltered}
                className="px-3 py-1.5 bg-amber-200/80 hover:bg-amber-300 text-amber-900 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Pilih Semua {filtered.length} Siswa
              </button>
            )}

            <button
              onClick={handleBulkDeleteSelected}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus {selectedIds.size} Siswa Terpilih</span>
            </button>

            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Stat Cards */}
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
              <th className="py-3 px-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllCurrentPageSelected}
                  onChange={toggleSelectAllCurrentPage}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  title="Pilih / Batalkan Semua di Halaman Ini"
                />
              </th>
              <th className="py-3 px-3 w-12 text-center">No</th>
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
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  Tidak ada data siswa yang cocok dengan filter pencarian.
                </td>
              </tr>
            ) : (
              paginatedStudents.map((s, idx) => {
                const cls = classes.find((c) => c.id === s.class_id);
                const prog = cls ? programs.find((p) => p.id === cls.study_program_id) : undefined;
                const isSelected = selectedIds.has(s.id);

                return (
                  <tr
                    key={s.id}
                    className={`transition-colors ${
                      isSelected ? 'bg-amber-50/70' : 'hover:bg-slate-50/60'
                    }`}
                  >
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectStudent(s.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-400">{startIndex + idx + 1}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{s.name}</span>
                      <span className="text-[11px] text-slate-400">
                        {s.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      <span className="font-semibold">{s.nis}</span>
                      {s.nisn && s.nisn !== s.nis && (
                        <span className="text-[10px] text-slate-400 block">NISN: {s.nisn}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold border border-blue-200">
                        {cls?.name || '-'}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">{prog?.name}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{s.phone}</td>
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

      {/* Confirmation Modal for Bulk Delete All */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-rose-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-center font-extrabold text-slate-900 text-base">
              Konfirmasi Hapus Semua Data Siswa
            </h3>

            <p className="text-center text-xs text-slate-600 mt-2 leading-relaxed">
              Anda akan menghapus seluruh <strong>{students.length} data siswa</strong> dari sistem dan Cloud Firestore. Seluruh akun login siswa dan rekapitulasi angket terkait juga akan dibersihkan.
            </p>

            <div className="my-4 p-3 bg-rose-50/70 border border-rose-200 rounded-xl text-[11px] text-rose-800 space-y-1">
              <p className="font-bold">⚠️ Perhatian Khusus:</p>
              <p>Tindakan ini tidak dapat dibatalkan. Jika Anda hanya ingin menginput ulang, pastikan Anda telah mengekspor cadangan (Excel) terlebih dahulu.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-600 font-semibold mb-1">
                  Ketik <strong>HAPUS SEMUA</strong> untuk konfirmasi:
                </label>
                <input
                  type="text"
                  value={confirmDeleteText}
                  onChange={(e) => setConfirmDeleteText(e.target.value)}
                  placeholder="Ketik: HAPUS SEMUA"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:outline-rose-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteAllModal(false);
                    setConfirmDeleteText('');
                  }}
                  className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batalkan
                </button>
                <button
                  type="button"
                  disabled={confirmDeleteText !== 'HAPUS SEMUA' || isDeleting}
                  onClick={handleConfirmDeleteAll}
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Semua'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Muhammad Rizky Pratama"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">NIS (Nomor Induk Siswa):</label>
                  <input
                    type="text"
                    required
                    value={nis}
                    onChange={(e) => setNis(e.target.value)}
                    placeholder="Contoh: 96095807"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono focus:outline-blue-500"
                  />
                  <span className="text-[10px] text-slate-400">Digunakan untuk login siswa</span>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">NISN (Opsional):</label>
                  <input
                    type="text"
                    value={nisn}
                    onChange={(e) => setNisn(e.target.value)}
                    placeholder="Contoh: 0068392019"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono focus:outline-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Jenis Kelamin:</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'L' | 'P')}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Rombel Kelas:</label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">No. WhatsApp / HP:</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Nama Orang Tua / Wali:</label>
                  <input
                    type="text"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="Nama Ayah/Ibu/Wali"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Alamat Tempat Tinggal:</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Alamat domisili siswa..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold cursor-pointer"
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
