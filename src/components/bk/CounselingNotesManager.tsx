import React, { useState, useEffect } from 'react';
import { db } from '../../db/storage';
import { CounselingService } from '../../services/CounselingService';
import { BKServiceType, CounselingNote } from '../../types/database';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Lock, Plus, Search, Calendar, Trash2, ShieldAlert } from 'lucide-react';

export const CounselingNotesManager: React.FC = () => {
  const { currentTeacher, role } = useAuth();
  const { showToast } = useNotification();

  const [notes, setNotes] = useState<CounselingNote[]>(() => CounselingService.getAllCounselingNotes());

  useEffect(() => {
    const handleSync = () => setNotes(CounselingService.getAllCounselingNotes());
    window.addEventListener('sibks_data_synced', handleSync);
    return () => window.removeEventListener('sibks_data_synced', handleSync);
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [studentId, setStudentId] = useState(db.getStudents()[0]?.id || '');
  const [serviceType, setServiceType] = useState<BKServiceType>('Konseling Individual');
  const [topic, setTopic] = useState('');
  const [problemSummary, setProblemSummary] = useState('');
  const [counselingText, setCounselingText] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [followUpPlan, setFollowUpPlan] = useState('');

  const students = db.getStudents();
  const classes = db.getClasses();

  const reloadData = () => {
    setNotes(CounselingService.getAllCounselingNotes());
  };

  const handleDelete = (id: string) => {
    if (confirm('Yakin ingin menghapus catatan konseling ini?')) {
      CounselingService.deleteCounselingNote(id);
      reloadData();
      showToast('info', 'Dihapus', 'Catatan konseling telah dihapus.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !counselingText.trim()) {
      showToast('warning', 'Peringatan', 'Topik dan catatan konseling wajib diisi.');
      return;
    }

    const newNote: CounselingNote = {
      id: `cn-${Date.now()}`,
      student_id: studentId,
      teacher_id: currentTeacher?.id || 'tch-1',
      counselor_name: currentTeacher?.name || 'Guru BK',
      date: new Date().toISOString().split('T')[0],
      service_type: serviceType,
      topic,
      problem_summary: problemSummary,
      notes: counselingText,
      recommendation,
      follow_up_plan: followUpPlan,
      status: 'Tersimpan',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    CounselingService.saveCounselingNote(newNote);
    reloadData();
    setShowAddModal(false);
    showToast('success', 'Catatan Disimpan', 'Catatan konseling rahasia tersimpan dengan enkripsi data.');
    setTopic('');
    setProblemSummary('');
    setCounselingText('');
    setRecommendation('');
    setFollowUpPlan('');
  };

  const filteredNotes = notes.filter((cn) => {
    const s = students.find((std) => std.id === cn.student_id);
    const matchesSearch =
      !searchQuery.trim() ||
      s?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cn.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cn.notes.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Privacy Notice Banner */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 text-xs leading-relaxed">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-amber-900 text-sm">Prinsip Kerahasiaan Konseling (Confidentiality)</h4>
          <p className="mt-0.5 text-amber-800">
            Seluruh data dalam menu ini bersifat sangat rahasia (Privileged Information) sesuai kode etik Bimbingan dan Konseling.
            Data ini hanya dapat diakses oleh Guru BK yang bersangkutan dan Administrator sekolah berwenang.
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-600" />
            <span>Catatan Konseling Rahasia</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dokumentasi berkala konseling individual dan bimbingan mendalam siswa.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Catatan Konseling</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari siswa atau topik konseling..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs focus:outline-amber-500"
          />
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredNotes.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
            Belum ada catatan konseling yang tersimpan atau cocok dengan pencarian.
          </div>
        ) : (
          filteredNotes.map((cn) => {
            const student = students.find((s) => s.id === cn.student_id);
            const studentClass = student ? classes.find((c) => c.id === student.class_id) : undefined;

            return (
              <div
                key={cn.id}
                className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs hover:border-amber-300 transition-all space-y-3 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900">
                        {cn.topic}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold text-[10px]">
                        {cn.service_type}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Siswa: <strong>{student?.name}</strong> ({studentClass?.name || '-'}) • Konselor: {cn.counselor_name} • Tanggal: {new Date(cn.date).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDelete(cn.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 self-end sm:self-auto cursor-pointer"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {cn.problem_summary && (
                  <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <strong>Ringkasan Masalah:</strong> {cn.problem_summary}
                  </p>
                )}

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 leading-relaxed text-slate-800">
                  <span className="font-bold text-slate-900 block mb-1">Catatan Interaksi & Konseling:</span>
                  <p className="whitespace-pre-line">{cn.notes}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-[11px]">
                  {cn.recommendation && (
                    <div className="p-2.5 rounded-lg bg-blue-50/50 border border-blue-100 text-blue-900">
                      <strong>Rekomendasi Konselor:</strong> {cn.recommendation}
                    </div>
                  )}
                  {cn.follow_up_plan && (
                    <div className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100 text-emerald-900">
                      <strong>Rencana Tindak Lanjut:</strong> {cn.follow_up_plan}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600" />
              <span>Input Catatan Konseling Rahasia</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Pilih Siswa:</label>
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium"
                >
                  {students.map((s) => {
                    const c = classes.find((cls) => cls.id === s.class_id);
                    return (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.nis}) — {c?.name}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Topik Konseling:</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Contoh: Hambatan belajar dan motivasi..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Jenis Layanan:</label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  >
                    <option value="Konseling Individual">Konseling Individual</option>
                    <option value="Bimbingan Karir & DUDI">Bimbingan Karir & DUDI</option>
                    <option value="Konseling Kelompok">Konseling Kelompok</option>
                    <option value="Kolaborasi / Alih Tangan Kasus (Referal)">
                      Kolaborasi / Alih Tangan Kasus (Referal)
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Ringkasan Masalah:</label>
                <input
                  type="text"
                  value={problemSummary}
                  onChange={(e) => setProblemSummary(e.target.value)}
                  placeholder="Garis besar permasalahan yang dikemukakan siswa..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Catatan Proses Konseling (Rahasia):
                </label>
                <textarea
                  rows={4}
                  value={counselingText}
                  onChange={(e) => setCounselingText(e.target.value)}
                  placeholder="Catatan detail sesi konseling, suasana emosi siswa, kesepakatan, dan komitmen perubahan..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Rekomendasi:</label>
                  <input
                    type="text"
                    value={recommendation}
                    onChange={(e) => setRecommendation(e.target.value)}
                    placeholder="Rekomendasi langkah..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Rencana Evaluasi:</label>
                  <input
                    type="text"
                    value={followUpPlan}
                    onChange={(e) => setFollowUpPlan(e.target.value)}
                    placeholder="Rencana pertemuan lanjutan..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 rounded-lg border border-slate-300 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold cursor-pointer"
                >
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
