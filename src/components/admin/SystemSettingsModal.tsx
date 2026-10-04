import React, { useState } from 'react';
import { db } from '../../db/storage';
import { AcademicYear, SystemSettings } from '../../types/database';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { AuditService } from '../../services/AuditService';
import {
  Settings,
  X,
  Save,
  RotateCcw,
  ShieldCheck,
  School,
  Calendar,
  CheckCircle2,
  Plus,
  Trash2,
  Edit2,
  Check,
  Sparkles,
  Info,
} from 'lucide-react';

interface SystemSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
  initialTab?: 'academic-year' | 'school-profile' | 'thresholds';
}

export const SystemSettingsModal: React.FC<SystemSettingsModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  initialTab = 'academic-year',
}) => {
  const { showToast } = useNotification();
  const { currentUser, role } = useAuth();

  const [activeTab, setActiveTab] = useState<'academic-year' | 'school-profile' | 'thresholds'>(initialTab);
  const [settings, setSettings] = useState<SystemSettings>(() => db.getSettings());
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>(() => db.getAcademicYears());

  // Form for adding new Academic Year
  const [newYearName, setNewYearName] = useState('');
  const [newSemester, setNewSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');
  const [makeActiveImmediately, setMakeActiveImmediately] = useState(false);

  // State for inline edit Academic Year
  const [editingAyId, setEditingAyId] = useState<string | null>(null);
  const [editYearName, setEditYearName] = useState('');
  const [editSemester, setEditSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');

  if (!isOpen) return null;

  const refreshAcademicYears = () => {
    setAcademicYears(db.getAcademicYears());
    setSettings(db.getSettings());
  };

  const handleSetActiveYear = (ayId: string) => {
    const target = academicYears.find((a) => a.id === ayId);
    if (!target) return;

    db.setActiveAcademicYear(ayId);
    refreshAcademicYears();

    if (currentUser) {
      AuditService.log(
        currentUser.id,
        currentUser.name,
        role,
        'SET_ACTIVE_ACADEMIC_YEAR',
        'AcademicYear',
        `Mengatur Tahun Pelajaran aktif ke: ${target.name} (${target.semester})`,
        ayId
      );
    }

    showToast(
      'success',
      'Tahun Ajaran Aktif Diperbarui',
      `T.A. ${target.name} (${target.semester}) sekarang berstatus AKTIF di seluruh sistem.`
    );

    if (onSaved) onSaved();
  };

  const handleAddAcademicYear = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newYearName.trim();
    if (!cleanName) {
      showToast('warning', 'Peringatan', 'Masukkan tahun pelajaran (contoh: 2025/2026).');
      return;
    }

    // Check duplicate
    const exists = academicYears.find(
      (a) => a.name.toLowerCase() === cleanName.toLowerCase() && a.semester === newSemester
    );
    if (exists) {
      showToast('error', 'Sudah Ada', `Tahun pelajaran ${cleanName} (${newSemester}) sudah terdaftar.`);
      return;
    }

    const newAy: AcademicYear = {
      id: `ay-${cleanName.replace(/\//g, '-')}-${newSemester.toLowerCase()}-${Date.now()}`,
      name: cleanName,
      semester: newSemester,
      is_active: makeActiveImmediately || academicYears.length === 0,
      created_at: new Date().toISOString(),
    };

    db.saveAcademicYear(newAy);

    if (makeActiveImmediately || academicYears.length === 0) {
      db.setActiveAcademicYear(newAy.id);
    }

    refreshAcademicYears();
    setNewYearName('');
    setMakeActiveImmediately(false);

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

    if (onSaved) onSaved();
  };

  const startEditAy = (ay: AcademicYear) => {
    setEditingAyId(ay.id);
    setEditYearName(ay.name);
    setEditSemester(ay.semester);
  };

  const cancelEditAy = () => {
    setEditingAyId(null);
  };

  const handleSaveEditAy = (ayId: string) => {
    const cleanName = editYearName.trim();
    if (!cleanName) {
      showToast('warning', 'Peringatan', 'Nama tahun pelajaran tidak boleh kosong.');
      return;
    }

    const target = academicYears.find((a) => a.id === ayId);
    if (!target) return;

    const updated: AcademicYear = {
      ...target,
      name: cleanName,
      semester: editSemester,
    };

    db.saveAcademicYear(updated);
    if (target.is_active) {
      db.setActiveAcademicYear(target.id);
    }
    refreshAcademicYears();
    setEditingAyId(null);

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

    showToast('success', 'Diperbarui', `Tahun pelajaran ${updated.name} (${updated.semester}) berhasil diperbarui.`);
    if (onSaved) onSaved();
  };

  const handleDeleteAcademicYear = (ayId: string) => {
    const target = academicYears.find((a) => a.id === ayId);
    if (!target) return;

    if (target.is_active) {
      showToast('error', 'Tidak Diizinkan', 'Tahun pelajaran yang sedang aktif tidak dapat dihapus.');
      return;
    }

    if (confirm(`Hapus tahun pelajaran ${target.name} (${target.semester})?`)) {
      const success = db.deleteAcademicYear(ayId);
      if (success) {
        refreshAcademicYears();
        if (currentUser) {
          AuditService.log(
            currentUser.id,
            currentUser.name,
            role,
            'DELETE_ACADEMIC_YEAR',
            'AcademicYear',
            `Menghapus tahun pelajaran: ${target.name} (${target.semester})`,
            ayId
          );
        }
        showToast('info', 'Dihapus', `Tahun pelajaran ${target.name} (${target.semester}) telah dihapus.`);
        if (onSaved) onSaved();
      }
    }
  };

  const handleSaveProfileAndThresholds = (e: React.FormEvent) => {
    e.preventDefault();
    db.saveSettings(settings);
    showToast('success', 'Pengaturan Tersimpan', 'Profil sekolah dan ambang batas prioritas berhasil disimpan.');
    if (currentUser) {
      AuditService.log(
        currentUser.id,
        currentUser.name,
        role,
        'UPDATE_SETTINGS',
        'SystemSettings',
        'Memperbarui identitas sekolah dan ambang batas prioritas BK.'
      );
    }
    if (onSaved) onSaved();
    onClose();
  };

  const handleResetFactory = () => {
    if (
      confirm(
        'PERINGATAN: Seluruh data akan direset kembali ke seed data bawaan asli (50 butir BMW, 40 butir AKPD, 50 butir Kelas X). Lanjutkan?'
      )
    ) {
      db.resetToFactory();
      showToast('info', 'Reset Berhasil', 'Sistem telah dikembalikan ke kondisi seed data awal.');
      if (onSaved) onSaved();
      onClose();
    }
  };

  const activeAy = academicYears.find((a) => a.is_active) || academicYears[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-3">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-blue-300">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">
                Pengaturan Sistem & Tahun Pelajaran
              </h3>
              <p className="text-[11px] text-slate-300">
                Kelola tahun pelajaran aktif (CRUD), profil sekolah, dan ambang batas prioritas BK
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('academic-year')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-xl transition-all border-b-2 cursor-pointer ${
              activeTab === 'academic-year'
                ? 'bg-white border-blue-600 text-blue-700 shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Tahun Pelajaran (T.A.)</span>
            {activeAy && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold ml-1">
                {activeAy.name}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('school-profile')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-xl transition-all border-b-2 cursor-pointer ${
              activeTab === 'school-profile'
                ? 'bg-white border-blue-600 text-blue-700 shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <School className="w-4 h-4" />
            <span>Identitas Sekolah</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('thresholds')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-xl transition-all border-b-2 cursor-pointer ${
              activeTab === 'thresholds'
                ? 'bg-white border-blue-600 text-blue-700 shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Ambang Batas BK</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 text-xs">
          {/* TAB 1: Manajemen Tahun Pelajaran & Semester (Full CRUD) */}
          {activeTab === 'academic-year' && (
            <div className="space-y-5">
              {/* Highlight Banner of Active Academic Year */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-200 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Tahun Pelajaran & Semester Aktif Saat Ini
                    </span>
                    <h4 className="text-base font-black text-slate-900 mt-0.5">
                      T.A. {activeAy ? activeAy.name : settings.academic_year}{' '}
                      <span className="text-emerald-700 font-bold text-sm">
                        ({activeAy ? `Semester ${activeAy.semester}` : 'Aktif'})
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      Seluruh instrumen angket yang diisi siswa, rekapitulasi kebutuhan bimbingan konseling, dan laporan resmi akan menggunakan tahun pelajaran aktif ini.
                    </p>
                  </div>
                </div>
              </div>

              {/* Table of Academic Years (CRUD) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>Daftar Tahun Pelajaran Terdaftar</span>
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Total: {academicYears.length} periode
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <tr>
                        <th className="py-2.5 px-3">Tahun Pelajaran</th>
                        <th className="py-2.5 px-3">Semester</th>
                        <th className="py-2.5 px-3">Status Sistem</th>
                        <th className="py-2.5 px-3 text-center">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {academicYears.map((ay) => {
                        const isActive = ay.is_active;
                        const isEditingThis = editingAyId === ay.id;

                        if (isEditingThis) {
                          return (
                            <tr key={ay.id} className="bg-blue-50/50">
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={editYearName}
                                  onChange={(e) => setEditYearName(e.target.value)}
                                  className="w-full px-2 py-1 rounded border border-blue-400 font-mono text-xs font-bold bg-white"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <select
                                  value={editSemester}
                                  onChange={(e) => setEditSemester(e.target.value as any)}
                                  className="w-full px-2 py-1 rounded border border-blue-400 text-xs font-semibold bg-white"
                                >
                                  <option value="Ganjil">Semester Ganjil</option>
                                  <option value="Genap">Semester Genap</option>
                                </select>
                              </td>
                              <td className="py-2 px-3">
                                <span className="text-[11px] text-slate-500">Mode Edit</span>
                              </td>
                              <td className="py-2 px-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEditAy(ay.id)}
                                    className="p-1 px-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                                  >
                                    <Save className="w-3 h-3" />
                                    <span>Simpan</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEditAy}
                                    className="p-1 px-2 rounded border border-slate-300 text-slate-600 hover:bg-slate-100 text-[11px] cursor-pointer"
                                  >
                                    Batal
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <tr
                            key={ay.id}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              isActive ? 'bg-emerald-50/40 font-semibold' : ''
                            }`}
                          >
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                              {ay.name}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700">
                              Semester {ay.semester}
                            </td>
                            <td className="py-2.5 px-3">
                              {isActive ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  <span>SEDANG AKTIF</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">
                                  Tidak aktif
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center justify-center gap-1.5">
                                {!isActive && (
                                  <button
                                    type="button"
                                    onClick={() => handleSetActiveYear(ay.id)}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                                    title="Pilih sebagai tahun pelajaran aktif"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Aktifkan</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => startEditAy(ay)}
                                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                                  title="Edit Tahun / Semester"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                {!isActive && academicYears.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAcademicYear(ay.id)}
                                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                                    title="Hapus periode ini"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Form Tambah Tahun Pelajaran Baru */}
              <form
                onSubmit={handleAddAcademicYear}
                className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-purple-600" />
                    <span>Tambah Periode Tahun Pelajaran Baru</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Tahun Pelajaran:
                    </label>
                    <input
                      type="text"
                      value={newYearName}
                      onChange={(e) => setNewYearName(e.target.value)}
                      placeholder="Contoh: 2025/2026"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:outline-blue-500 bg-white"
                      required
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Format: TTTT/TTTT</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Semester:
                    </label>
                    <select
                      value={newSemester}
                      onChange={(e) => setNewSemester(e.target.value as 'Ganjil' | 'Genap')}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold focus:outline-blue-500 bg-white"
                    >
                      <option value="Ganjil">Semester Ganjil</option>
                      <option value="Genap">Semester Genap</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 select-none">
                    <input
                      type="checkbox"
                      checked={makeActiveImmediately}
                      onChange={(e) => setMakeActiveImmediately(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-medium">Langsung jadikan periode ini sebagai T.A. AKTIF</span>
                  </label>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-lg text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambahkan Periode</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: Profil & Kop Surat Sekolah */}
          {activeTab === 'school-profile' && (
            <form onSubmit={handleSaveProfileAndThresholds} className="space-y-4">
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Nama Resmi Sekolah:</label>
                    <input
                      type="text"
                      value={settings.school_name}
                      onChange={(e) => setSettings({ ...settings, school_name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">NPSN Sekolah:</label>
                    <input
                      type="text"
                      value={settings.school_npsn}
                      onChange={(e) => setSettings({ ...settings, school_npsn: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Alamat Lengkap Sekolah:</label>
                  <input
                    type="text"
                    value={settings.school_address}
                    onChange={(e) => setSettings({ ...settings, school_address: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Nama Kepala Sekolah:</label>
                    <input
                      type="text"
                      value={settings.principal_name}
                      onChange={(e) => setSettings({ ...settings, principal_name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">NIP Kepala Sekolah:</label>
                    <input
                      type="text"
                      value={settings.principal_nip}
                      onChange={(e) => setSettings({ ...settings, principal_nip: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Koordinator Guru BK:</label>
                    <input
                      type="text"
                      value={settings.lead_counselor_name}
                      onChange={(e) => setSettings({ ...settings, lead_counselor_name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">NIP Koordinator BK:</label>
                    <input
                      type="text"
                      value={settings.lead_counselor_nip}
                      onChange={(e) => setSettings({ ...settings, lead_counselor_nip: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Identitas Sekolah</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Ambang Batas Prioritas BK */}
          {activeTab === 'thresholds' && (
            <form onSubmit={handleSaveProfileAndThresholds} className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Konfigurasi Ambang Batas Persentase Prioritas Kebutuhan AKPD</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Sekolah dapat menyesuaikan batas persentase indikasi kebutuhan siswa (AKPD) secara fleksibel.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                  <span className="font-bold text-rose-800 block text-[10px] uppercase">
                    URGENT (Sangat Tinggi)
                  </span>
                  <span className="text-[10px] text-rose-600 block mt-0.5">Batas Minimum (%):</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={settings.thresholds.urgent_min}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        thresholds: { ...settings.thresholds, urgent_min: Number(e.target.value) },
                      })
                    }
                    className="w-full mt-1 px-2 py-1 rounded border border-rose-300 font-bold text-rose-900 bg-white"
                  />
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="font-bold text-amber-800 block text-[10px] uppercase">
                    HIGH (Tinggi)
                  </span>
                  <span className="text-[10px] text-amber-600 block mt-0.5">Batas Minimum (%):</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={settings.thresholds.high_min}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        thresholds: { ...settings.thresholds, high_min: Number(e.target.value) },
                      })
                    }
                    className="w-full mt-1 px-2 py-1 rounded border border-amber-300 font-bold text-amber-900 bg-white"
                  />
                </div>

                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <span className="font-bold text-blue-800 block text-[10px] uppercase">
                    MEDIUM (Sedang)
                  </span>
                  <span className="text-[10px] text-blue-600 block mt-0.5">Batas Minimum (%):</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={settings.thresholds.medium_min}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        thresholds: { ...settings.thresholds, medium_min: Number(e.target.value) },
                      })
                    }
                    className="w-full mt-1 px-2 py-1 rounded border border-blue-300 font-bold text-blue-900 bg-white"
                  />
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="font-bold text-emerald-800 block text-[10px] uppercase">
                    LOW (Rendah)
                  </span>
                  <span className="text-[10px] text-emerald-600 block mt-0.5">Batas Minimum (%):</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={settings.thresholds.low_min}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        thresholds: { ...settings.thresholds, low_min: Number(e.target.value) },
                      })
                    }
                    className="w-full mt-1 px-2 py-1 rounded border border-emerald-300 font-bold text-emerald-900 bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Ambang Batas</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <button
            type="button"
            onClick={handleResetFactory}
            className="flex items-center gap-1.5 px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Data Pabrik (Factory Reset)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
