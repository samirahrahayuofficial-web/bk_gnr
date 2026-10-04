import React, { useState, useEffect } from 'react';
import { db } from '../../db/storage';
import { AcademicYear } from '../../types/database';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { AuditService } from '../../services/AuditService';
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Search,
  X,
  Save,
  Check,
  CalendarDays,
  Sparkles,
  Layers,
  AlertCircle,
} from 'lucide-react';

export const MasterTahunAjar: React.FC = () => {
  const { showToast } = useNotification();
  const { currentUser, role } = useAuth();

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>(() => db.getAcademicYears());

  useEffect(() => {
    const handleSync = () => setAcademicYears(db.getAcademicYears());
    window.addEventListener('sibks_data_synced', handleSync);
    return () => window.removeEventListener('sibks_data_synced', handleSync);
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [semesterFilter, setSemesterFilter] = useState<'ALL' | 'Ganjil' | 'Genap'>('ALL');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formSemester, setFormSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');
  const [formIsActive, setFormIsActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const refreshData = () => {
    setAcademicYears(db.getAcademicYears());
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormName('');
    setFormSemester('Ganjil');
    setFormIsActive(false);
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const openEditModal = (ay: AcademicYear) => {
    setEditingId(ay.id);
    setFormName(ay.name);
    setFormSemester(ay.semester);
    setFormIsActive(ay.is_active);
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setErrorMessage('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanName = formName.trim();
    if (!cleanName) {
      setErrorMessage('Nama Tahun Pelajaran wajib diisi (contoh: 2024/2025).');
      return;
    }

    // Check duplicate (name + semester) excluding current editing
    const duplicate = academicYears.find(
      (a) =>
        a.id !== editingId &&
        a.name.toLowerCase() === cleanName.toLowerCase() &&
        a.semester === formSemester
    );

    if (duplicate) {
      setErrorMessage(`Tahun Pelajaran ${cleanName} (${formSemester}) sudah terdaftar.`);
      return;
    }

    if (editingId) {
      // UPDATE
      const target = academicYears.find((a) => a.id === editingId);
      if (!target) return;

      const updated: AcademicYear = {
        ...target,
        name: cleanName,
        semester: formSemester,
        is_active: formIsActive,
      };

      db.saveAcademicYear(updated);

      if (formIsActive) {
        db.setActiveAcademicYear(updated.id);
      }

      if (currentUser) {
        AuditService.log(
          currentUser.id,
          currentUser.name,
          role,
          'UPDATE_ACADEMIC_YEAR',
          'AcademicYear',
          `Memperbarui tahun pelajaran: ${updated.name} (${updated.semester})`,
          updated.id
        );
      }

      showToast(
        'success',
        'Tahun Pelajaran Diperbarui',
        `Data T.A. ${updated.name} (${updated.semester}) berhasil diperbarui.`
      );
    } else {
      // CREATE
      const newAy: AcademicYear = {
        id: `ay-${cleanName.replace(/[^a-zA-Z0-9]/g, '-')}-${formSemester.toLowerCase()}-${Date.now()}`,
        name: cleanName,
        semester: formSemester,
        is_active: formIsActive || academicYears.length === 0,
        created_at: new Date().toISOString(),
      };

      db.saveAcademicYear(newAy);

      if (formIsActive || academicYears.length === 0) {
        db.setActiveAcademicYear(newAy.id);
      }

      if (currentUser) {
        AuditService.log(
          currentUser.id,
          currentUser.name,
          role,
          'CREATE_ACADEMIC_YEAR',
          'AcademicYear',
          `Menambahkan tahun pelajaran baru: ${newAy.name} (${newAy.semester})`,
          newAy.id
        );
      }

      showToast(
        'success',
        'Tahun Pelajaran Ditambahkan',
        `T.A. ${newAy.name} (${newAy.semester}) berhasil ditambahkan.`
      );
    }

    refreshData();
    closeModal();
  };

  const handleSetActive = (ayId: string) => {
    const target = academicYears.find((a) => a.id === ayId);
    if (!target) return;

    db.setActiveAcademicYear(ayId);
    refreshData();

    if (currentUser) {
      AuditService.log(
        currentUser.id,
        currentUser.name,
        role,
        'SET_ACTIVE_ACADEMIC_YEAR',
        'AcademicYear',
        `Mengaktifkan tahun pelajaran: ${target.name} (${target.semester})`,
        ayId
      );
    }

    showToast(
      'success',
      'Tahun Ajaran Aktif',
      `T.A. ${target.name} (${target.semester}) sekarang menjadi periode AKTIF di seluruh sistem.`
    );
  };

  const handleDelete = (ay: AcademicYear) => {
    if (ay.is_active) {
      showToast(
        'error',
        'Gagal Menghapus',
        'Tahun pelajaran yang sedang berstatus AKTIF tidak dapat dihapus. Silakan aktifkan tahun ajaran lain terlebih dahulu.'
      );
      return;
    }

    if (
      confirm(
        `Apakah Anda yakin ingin menghapus Tahun Pelajaran ${ay.name} (${ay.semester})? Tindakan ini tidak dapat dibatalkan.`
      )
    ) {
      const success = db.deleteAcademicYear(ay.id);
      if (success) {
        refreshData();
        if (currentUser) {
          AuditService.log(
            currentUser.id,
            currentUser.name,
            role,
            'DELETE_ACADEMIC_YEAR',
            'AcademicYear',
            `Menghapus tahun pelajaran: ${ay.name} (${ay.semester})`,
            ay.id
          );
        }
        showToast('info', 'Dihapus', `Tahun pelajaran ${ay.name} (${ay.semester}) telah dihapus.`);
      }
    }
  };

  const activeAy = academicYears.find((a) => a.is_active) || academicYears[0];

  const filteredList = academicYears.filter((ay) => {
    const matchSearch =
      ay.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ay.semester.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSemester = semesterFilter === 'ALL' || ay.semester === semesterFilter;
    return matchSearch && matchSemester;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-white/10 text-blue-300">
              <CalendarDays className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold text-blue-200 uppercase tracking-wider">
              Master Data Sistem
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Manajemen Tahun Pelajaran & Semester
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            Kelola periode tahun ajaran dan semester aktif sekolah. Seluruh instrumen angket, pengelompokan kelas, dan laporan rekapitulasi BK terikat pada tahun ajaran yang sedang aktif.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Tahun Pelajaran</span>
        </button>
      </div>

      {/* Active Academic Year Highlight Card */}
      {activeAy && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                  Tahun Pelajaran Aktif Saat Ini
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  LIVE
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                T.A. {activeAy.name} • Semester {activeAy.semester}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Periode ini berlaku untuk pengisian angket AKPD, pemetaan minat BMW, dan laporan resmi BK.
              </p>
            </div>
          </div>

          <button
            onClick={() => openEditModal(activeAy)}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer self-stretch sm:self-auto justify-center"
          >
            <Edit2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Edit Periode Ini</span>
          </button>
        </div>
      )}

      {/* Filter and Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <h3 className="font-extrabold text-sm text-slate-900">
              Daftar Seluruh Tahun Pelajaran ({academicYears.length})
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 sm:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari tahun / semester..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-blue-500 bg-slate-50 focus:bg-white transition-colors"
              />
            </div>

            {/* Semester Filter */}
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 focus:bg-white"
            >
              <option value="ALL">Semua Semester</option>
              <option value="Ganjil">Semester Ganjil</option>
              <option value="Genap">Semester Genap</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Tahun Pelajaran</th>
                <th className="py-3 px-4">Semester</th>
                <th className="py-3 px-4">Status di Sistem</th>
                <th className="py-3 px-4">Tanggal Dibuat</th>
                <th className="py-3 px-4 text-center">Aksi / Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                    Tidak ada data tahun pelajaran yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredList.map((ay) => {
                  const isActive = ay.is_active;
                  return (
                    <tr
                      key={ay.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isActive ? 'bg-emerald-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <span>{ay.name}</span>
                          {isActive && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-emerald-600 text-white">
                              UTAMA
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-700">
                        Semester {ay.semester}
                      </td>

                      <td className="py-3 px-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>SEDANG AKTIF</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
                            Tidak Aktif
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {ay.created_at ? new Date(ay.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        }) : '-'}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {!isActive && (
                            <button
                              type="button"
                              onClick={() => handleSetActive(ay.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                              title="Jadikan tahun ajaran ini sebagai yang aktif"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Jadikan Aktif</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => openEditModal(ay)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                            title="Edit Tahun Pelajaran"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {!isActive && (
                            <button
                              type="button"
                              onClick={() => handleDelete(ay)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-rose-600 hover:border-rose-200 transition-colors cursor-pointer"
                              title="Hapus Tahun Pelajaran"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Academic Year */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-300" />
                <h3 className="font-bold text-sm">
                  {editingId ? 'Edit Tahun Pelajaran' : 'Tambah Tahun Pelajaran Baru'}
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tahun Pelajaran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: 2024/2025 atau 2025/2026"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:outline-blue-500 bg-white"
                  required
                  autoFocus
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Format standar: <strong>TTTT/TTTT</strong> (misal: 2024/2025)
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Semester <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      formSemester === 'Ganjil'
                        ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="semester"
                      checked={formSemester === 'Ganjil'}
                      onChange={() => setFormSemester('Ganjil')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Semester Ganjil</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      formSemester === 'Genap'
                        ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="semester"
                      checked={formSemester === 'Genap'}
                      onChange={() => setFormSemester('Genap')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Semester Genap</span>
                  </label>
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">
                      Jadikan sebagai Tahun Pelajaran AKTIF
                    </span>
                    <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                      Jika dicentang, tahun pelajaran lain otomatis menjadi tidak aktif dan seluruh sistem akan menggunakan periode ini.
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingId ? 'Simpan Perubahan' : 'Tambahkan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
