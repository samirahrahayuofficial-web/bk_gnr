import React, { useState } from 'react';
import { db } from '../../db/storage';
import { QuestionnaireAssignment, QuestionnaireCategory, QuestionnaireType } from '../../types/database';
import { useNotification } from '../../context/NotificationContext';
import { FileSpreadsheet, Plus, CheckCircle, Clock, Layers, Calendar, X } from 'lucide-react';

export const MasterAngket: React.FC = () => {
  const { showToast } = useNotification();
  const [types, setTypes] = useState<QuestionnaireType[]>(() => db.getQuestionnaireTypes());
  const [categories, setCategories] = useState<QuestionnaireCategory[]>(() => db.getCategories());
  const [assignments, setAssignments] = useState<QuestionnaireAssignment[]>(() => db.getAssignments());

  const classes = db.getClasses();

  // Assignment Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState(types[0]?.id || '');
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || '');
  const [startDate, setStartDate] = useState('2024-08-01');
  const [endDate, setEndDate] = useState('2024-12-31');

  const reloadData = () => {
    setTypes(db.getQuestionnaireTypes());
    setCategories(db.getCategories());
    setAssignments(db.getAssignments());
  };

  const handleToggleActive = (type: QuestionnaireType) => {
    type.is_active = !type.is_active;
    type.updated_at = new Date().toISOString();
    db.saveQuestionnaireType(type);
    reloadData();
    showToast('info', 'Status Diperbarui', `Angket ${type.title} sekarang ${type.is_active ? 'Aktif' : 'Nonaktif'}.`);
  };

  const handleToggleAllowResult = (type: QuestionnaireType) => {
    type.allow_student_view_result = !type.allow_student_view_result;
    type.updated_at = new Date().toISOString();
    db.saveQuestionnaireType(type);
    reloadData();
    showToast('info', 'Izin Hasil Diperbarui', `Izin lihat hasil siswa diubah.`);
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    const newAsg: QuestionnaireAssignment = {
      id: `asg-${Date.now()}`,
      questionnaire_type_id: selectedTypeId,
      class_id: selectedClassId,
      academic_year_id: 'ay-2024-ganjil',
      start_date: startDate,
      end_date: endDate,
      is_active: true,
      assigned_by: 'tch-1',
    };

    db.saveAssignment(newAsg);
    reloadData();
    setShowAssignModal(false);
    showToast('success', 'Penugasan Berhasil', 'Angket berhasil ditugaskan ke rombel kelas target.');
  };

  const handleDeleteAssignment = (id: string) => {
    db.deleteAssignment(id);
    reloadData();
    showToast('info', 'Penugasan Dihapus', 'Penugasan kelas telah dibatalkan.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            <span>Manajemen Jenis Angket & Penugasan Rombel</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi model scoring (AKPD, BMW, Kategori), izin lihat hasil siswa, dan jadwal pengisian.
          </p>
        </div>

        <button
          onClick={() => setShowAssignModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Layers className="w-4 h-4" />
          <span>Tugaskan Angket ke Kelas</span>
        </button>
      </div>

      {/* 3 Main Types Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {types.map((type) => {
          const catList = categories.filter((c) => c.questionnaire_type_id === type.id);

          return (
            <div
              key={type.id}
              className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-700">
                    {type.code}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      type.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {type.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>

                <h3 className="font-bold text-sm sm:text-base text-slate-900 mt-2">
                  {type.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {type.description}
                </p>

                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Jumlah Butir Pertanyaan:</span>
                    <strong className="text-slate-900">{type.total_questions} Soal</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Model Scoring:</span>
                    <strong className="text-blue-700">{type.scoring_model}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Sasaran Tingkat:</span>
                    <strong className="text-slate-900">
                      {type.target_grade === 'ALL' ? 'Semua Tingkat' : `Kelas ${type.target_grade}`}
                    </strong>
                  </div>
                </div>

                {/* Categories Breakdown */}
                <div className="mt-3 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Kategori / Aspek ({catList.length}):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {catList.map((c) => (
                      <span
                        key={c.id}
                        className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-medium"
                      >
                        {c.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-slate-700">Status Aktif Instrumen:</span>
                  <input
                    type="checkbox"
                    checked={type.is_active}
                    onChange={() => handleToggleActive(type)}
                    className="w-4 h-4 text-blue-600 rounded-sm"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-slate-700">Izinkan Siswa Lihat Hasil:</span>
                  <input
                    type="checkbox"
                    checked={type.allow_student_view_result}
                    onChange={() => handleToggleAllowResult(type)}
                    className="w-4 h-4 text-blue-600 rounded-sm"
                  />
                </label>
              </div>
            </div>
          );
        })}
      </div>

      {/* Class Assignments Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden text-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-slate-800 text-sm">
              Daftar Penugasan Angket ke Rombongan Belajar
            </h4>
            <p className="text-xs text-slate-500">
              Siswa di kelas terkait akan otomatis mendapatkan instrumen di portal mereka.
            </p>
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-600 font-semibold">
              <th className="py-3 px-4 w-12 text-center">No</th>
              <th className="py-3 px-4">Instrumen Angket</th>
              <th className="py-3 px-4">Target Kelas</th>
              <th className="py-3 px-4">Rentang Waktu Pengisian</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-center w-24">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {assignments.map((asg, idx) => {
              const qt = types.find((t) => t.id === asg.questionnaire_type_id);
              const cls = classes.find((c) => c.id === asg.class_id);

              return (
                <tr key={asg.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{qt?.title}</td>
                  <td className="py-3 px-4 font-semibold text-slate-700">{cls?.name || '-'}</td>
                  <td className="py-3 px-4 text-slate-600">
                    {asg.start_date} s.d. {asg.end_date}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                      Aktif
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleDeleteAssignment(asg.id)}
                      className="text-rose-600 hover:underline font-semibold cursor-pointer"
                    >
                      Batalkan
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Tugaskan Angket ke Kelas</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Pilih Angket:</label>
                <select
                  value={selectedTypeId}
                  onChange={(e) => setSelectedTypeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium"
                >
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Pilih Kelas Target:</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.grade})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tanggal Mulai:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Batas Selesai:</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-3 py-2 rounded-lg border border-slate-300 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer"
                >
                  Simpan Penugasan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
