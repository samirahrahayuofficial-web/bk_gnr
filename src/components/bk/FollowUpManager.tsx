import React, { useState, useEffect } from 'react';
import { db } from '../../db/storage';
import { CounselingService } from '../../services/CounselingService';
import { BKServiceType, FollowUp, FollowUpStatus } from '../../types/database';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
  ListTodo,
  Plus,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  Edit3,
} from 'lucide-react';

export const FollowUpManager: React.FC = () => {
  const { currentTeacher } = useAuth();
  const { showToast } = useNotification();

  const [followUps, setFollowUps] = useState<FollowUp[]>(() => CounselingService.getAllFollowUps());

  useEffect(() => {
    const handleSync = () => setFollowUps(CounselingService.getAllFollowUps());
    window.addEventListener('sibks_data_synced', handleSync);
    return () => window.removeEventListener('sibks_data_synced', handleSync);
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterBidang, setFilterBidang] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [studentId, setStudentId] = useState(db.getStudents()[0]?.id || '');
  const [bidang, setBidang] = useState<'Pribadi' | 'Sosial' | 'Belajar' | 'Karir'>('Karir');
  const [serviceType, setServiceType] = useState<BKServiceType>('Konseling Individual');
  const [problemNeed, setProblemNeed] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [counselorNotes, setCounselorNotes] = useState('');
  const [status, setStatus] = useState<FollowUpStatus>('Dalam Proses');
  const [nextDate, setNextDate] = useState('');

  const students = db.getStudents();
  const classes = db.getClasses();

  const reloadData = () => {
    setFollowUps(CounselingService.getAllFollowUps());
  };

  const handleStatusChange = (id: string, newStatus: FollowUpStatus) => {
    CounselingService.updateFollowUpStatus(id, newStatus);
    reloadData();
    showToast('success', 'Status Diperbarui', `Status tindak lanjut diubah menjadi: ${newStatus}`);
  };

  const handleDelete = (id: string) => {
    if (confirm('Yakin ingin menghapus catatan tindak lanjut ini?')) {
      CounselingService.deleteFollowUp(id);
      reloadData();
      showToast('info', 'Dihapus', 'Data tindak lanjut berhasil dihapus.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!problemNeed.trim()) {
      showToast('warning', 'Peringatan', 'Deskripsi kebutuhan wajib diisi.');
      return;
    }

    const newFu: FollowUp = {
      id: `fu-${Date.now()}`,
      student_id: studentId,
      teacher_id: currentTeacher?.id || 'tch-1',
      counselor_name: currentTeacher?.name || 'Guru BK',
      date: new Date().toISOString().split('T')[0],
      bidang,
      service_type: serviceType,
      problem_need: problemNeed,
      recommendation,
      counselor_notes: counselorNotes,
      status,
      next_follow_up_date: nextDate || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    CounselingService.saveFollowUp(newFu);
    reloadData();
    setShowAddModal(false);
    showToast('success', 'Berhasil', 'Tindak lanjut layanan BK berhasil ditambahkan.');
    setProblemNeed('');
    setRecommendation('');
    setCounselorNotes('');
    setNextDate('');
  };

  const filteredFollowUps = followUps.filter((f) => {
    const s = students.find((std) => std.id === f.student_id);
    const matchesSearch =
      !searchQuery.trim() ||
      s?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.problem_need.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !filterStatus || f.status === filterStatus;
    const matchesBidang = !filterBidang || f.bidang === filterBidang;
    return matchesSearch && matchesStatus && matchesBidang;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-blue-600" />
            <span>Manajemen Tindak Lanjut Layanan BK</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoring penanganan bimbingan klasikal, kelompok, konseling individual, dan bimbingan karir.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Tindak Lanjut</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari siswa atau topik permasalahan..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs focus:outline-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-700"
          >
            <option value="">Semua Status</option>
            <option value="Belum Ditindaklanjuti">Belum Ditindaklanjuti</option>
            <option value="Dalam Proses">Dalam Proses</option>
            <option value="Perlu Monitoring">Perlu Monitoring</option>
            <option value="Selesai">Selesai</option>
          </select>

          <select
            value={filterBidang}
            onChange={(e) => setFilterBidang(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-700"
          >
            <option value="">Semua Bidang</option>
            <option value="Pribadi">Bidang Pribadi</option>
            <option value="Sosial">Bidang Sosial</option>
            <option value="Belajar">Bidang Belajar</option>
            <option value="Karir">Bidang Karir</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredFollowUps.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
            Tidak ada data tindak lanjut yang sesuai filter.
          </div>
        ) : (
          filteredFollowUps.map((fu) => {
            const student = students.find((s) => s.id === fu.student_id);
            const studentClass = student ? classes.find((c) => c.id === student.class_id) : undefined;

            return (
              <div
                key={fu.id}
                className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs hover:border-blue-300 transition-all space-y-3 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900">
                        {student?.name || 'Siswa'}
                      </span>
                      <span className="text-slate-400 font-medium">
                        ({studentClass?.name || '-'})
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold text-[10px]">
                        {fu.service_type}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-[10px]">
                        Bidang {fu.bidang}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Konselor: <strong>{fu.counselor_name}</strong> • Tanggal: {new Date(fu.date).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={fu.status}
                      onChange={(e) => handleStatusChange(fu.id, e.target.value as FollowUpStatus)}
                      className={`px-3 py-1 rounded-full text-xs font-bold border cursor-pointer ${
                        fu.status === 'Selesai'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : fu.status === 'Dalam Proses'
                          ? 'bg-blue-50 text-blue-700 border-blue-300'
                          : fu.status === 'Perlu Monitoring'
                          ? 'bg-purple-50 text-purple-700 border-purple-300'
                          : 'bg-amber-50 text-amber-700 border-amber-300'
                      }`}
                    >
                      <option value="Belum Ditindaklanjuti">Belum Ditindaklanjuti</option>
                      <option value="Dalam Proses">Dalam Proses</option>
                      <option value="Perlu Monitoring">Perlu Monitoring</option>
                      <option value="Selesai">Selesai</option>
                    </select>

                    <button
                      onClick={() => handleDelete(fu.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-100 space-y-1.5">
                  <p className="text-slate-800 font-medium leading-relaxed">
                    <strong>Kebutuhan / Permasalahan:</strong> {fu.problem_need}
                  </p>
                  {fu.recommendation && (
                    <p className="text-slate-600 leading-relaxed">
                      <strong>Rekomendasi Layanan:</strong> {fu.recommendation}
                    </p>
                  )}
                  {fu.counselor_notes && (
                    <p className="text-slate-500 text-[11px]">
                      <strong>Catatan Konselor:</strong> {fu.counselor_notes}
                    </p>
                  )}
                </div>

                {fu.next_follow_up_date && (
                  <div className="flex items-center gap-1.5 text-[11px] text-blue-700 font-semibold">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Jadwal Tindak Lanjut Berikutnya: {new Date(fu.next_follow_up_date).toLocaleDateString('id-ID', { dateStyle: 'long' })}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base mb-4">
              Tambah Tindak Lanjut Layanan BK
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
                  <label className="block text-slate-700 font-semibold mb-1">Bidang Layanan:</label>
                  <select
                    value={bidang}
                    onChange={(e) => setBidang(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  >
                    <option value="Karir">Bidang Karir & DUDI</option>
                    <option value="Belajar">Bidang Belajar</option>
                    <option value="Pribadi">Bidang Pribadi</option>
                    <option value="Sosial">Bidang Sosial</option>
                  </select>
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
                    <option value="Bimbingan Kelompok">Bimbingan Kelompok</option>
                    <option value="Bimbingan Klasikal">Bimbingan Klasikal</option>
                    <option value="Konseling Kelompok">Konseling Kelompok</option>
                    <option value="Kolaborasi / Alih Tangan Kasus (Referal)">
                      Kolaborasi / Alih Tangan Kasus (Referal)
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Permasalahan / Kebutuhan:</label>
                <textarea
                  rows={2}
                  value={problemNeed}
                  onChange={(e) => setProblemNeed(e.target.value)}
                  placeholder="Deskripsikan indikasi kebutuhan hasil angket atau observasi..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Rekomendasi Tindakan:</label>
                <input
                  type="text"
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                  placeholder="Rekomendasi materi atau pendampingan..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Status Awal:</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  >
                    <option value="Belum Ditindaklanjuti">Belum Ditindaklanjuti</option>
                    <option value="Dalam Proses">Dalam Proses</option>
                    <option value="Perlu Monitoring">Perlu Monitoring</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tanggal Monitoring:</label>
                  <input
                    type="date"
                    value={nextDate}
                    onChange={(e) => setNextDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Catatan Guru BK:</label>
                <input
                  type="text"
                  value={counselorNotes}
                  onChange={(e) => setCounselorNotes(e.target.value)}
                  placeholder="Catatan tambahan..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
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
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
