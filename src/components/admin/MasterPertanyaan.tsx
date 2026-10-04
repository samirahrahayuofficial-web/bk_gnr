import React, { useState } from 'react';
import { db } from '../../db/storage';
import { QuestionnaireQuestion } from '../../types/database';
import { useNotification } from '../../context/NotificationContext';
import { HelpCircle, Plus, Search, Edit3, Trash2, X, Check, Eye } from 'lucide-react';

export const MasterPertanyaan: React.FC = () => {
  const { showToast } = useNotification();
  const types = db.getQuestionnaireTypes();
  const [selectedTypeId, setSelectedTypeId] = useState<string>(types[0]?.id || 'qt-akpd');
  const [selectedCatId, setSelectedCatId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const [questions, setQuestions] = useState<QuestionnaireQuestion[]>(() => db.getQuestions());
  const categories = db.getCategories().filter((c) => c.questionnaire_type_id === selectedTypeId);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionnaireQuestion | null>(null);
  const [qNumber, setQNumber] = useState<number>(1);
  const [categoryId, setCategoryId] = useState('');
  const [statement, setStatement] = useState('');
  const [isActive, setIsActive] = useState(true);

  const reloadData = () => {
    setQuestions(db.getQuestions());
  };

  const handleOpenAdd = () => {
    setEditingQuestion(null);
    const existingInType = questions.filter((q) => q.questionnaire_type_id === selectedTypeId);
    setQNumber(existingInType.length + 1);
    setCategoryId(categories[0]?.id || '');
    setStatement('');
    setIsActive(true);
    setShowModal(true);
  };

  const handleOpenEdit = (q: QuestionnaireQuestion) => {
    setEditingQuestion(q);
    setQNumber(q.question_number);
    setCategoryId(q.category_id);
    setStatement(q.statement);
    setIsActive(q.is_active);
    setShowModal(true);
  };

  const handleToggleActive = (q: QuestionnaireQuestion) => {
    q.is_active = !q.is_active;
    q.updated_at = new Date().toISOString();
    db.saveQuestion(q);
    reloadData();
    showToast('info', 'Status Diubah', `Pertanyaan #${q.question_number} sekarang ${q.is_active ? 'Aktif' : 'Nonaktif'}.`);
  };

  const handleDelete = (id: string, num: number) => {
    if (confirm(`Yakin ingin menghapus butir pertanyaan #${num}?`)) {
      db.deleteQuestion(id);
      reloadData();
      showToast('info', 'Dihapus', `Pertanyaan #${num} telah dihapus.`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statement.trim()) {
      showToast('warning', 'Peringatan', 'Teks butir pernyataan wajib diisi.');
      return;
    }

    const questionData: QuestionnaireQuestion = {
      id: editingQuestion ? editingQuestion.id : `q-${Date.now()}`,
      questionnaire_type_id: selectedTypeId,
      category_id: categoryId || categories[0]?.id || '',
      question_number: Number(qNumber),
      statement,
      is_active: isActive,
      created_at: editingQuestion ? editingQuestion.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.saveQuestion(questionData);
    reloadData();
    setShowModal(false);
    showToast('success', 'Berhasil', `Pertanyaan #${qNumber} berhasil ${editingQuestion ? 'diperbarui' : 'ditambahkan'}.`);
  };

  const currentTypeQuestions = questions.filter((q) => q.questionnaire_type_id === selectedTypeId);

  const filtered = currentTypeQuestions.filter((q) => {
    const matchesCat = !selectedCatId || q.category_id === selectedCatId;
    const matchesSearch =
      !searchQuery.trim() ||
      q.statement.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(q.question_number).includes(searchQuery);
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            <span>Bank Pertanyaan & Aspek Angket Dinamis</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tambah, sunting, atau nonaktifkan butir pernyataan tanpa perlu memodifikasi source code.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Butir Soal</span>
        </button>
      </div>

      {/* Selectors Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <select
          value={selectedTypeId}
          onChange={(e) => {
            setSelectedTypeId(e.target.value);
            setSelectedCatId('');
          }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50"
        >
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title} ({t.total_questions} Soal)
            </option>
          ))}
        </select>

        <select
          value={selectedCatId}
          onChange={(e) => setSelectedCatId(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white"
        >
          <option value="">Semua Kategori / Aspek</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari teks pernyataan atau nomor butir..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs focus:outline-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden text-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <th className="py-3 px-4 w-16 text-center">No</th>
              <th className="py-3 px-4">Teks Pernyataan Angket</th>
              <th className="py-3 px-4 w-48">Kategori / Aspek</th>
              <th className="py-3 px-4 text-center w-28">Status</th>
              <th className="py-3 px-4 text-center w-28">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  Tidak ada butir soal ditemukan.
                </td>
              </tr>
            ) : (
              filtered.map((q) => {
                const cat = categories.find((c) => c.id === q.category_id);
                return (
                  <tr key={q.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 text-center font-bold text-slate-800">
                      {q.question_number}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 leading-snug">
                      {q.statement}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold">
                        {cat?.name || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleActive(q)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                          q.is_active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {q.is_active ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(q)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(q.id, q.question_number)}
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
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">
                {editingQuestion ? 'Edit Butir Pertanyaan' : 'Tambah Butir Pertanyaan'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Nomor Butir Soal:</label>
                  <input
                    type="number"
                    value={qNumber}
                    onChange={(e) => setQNumber(Number(e.target.value))}
                    min={1}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Kategori / Aspek:</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Teks Butir Pernyataan:</label>
                <textarea
                  rows={3}
                  value={statement}
                  onChange={(e) => setStatement(e.target.value)}
                  placeholder="Tuliskan pernyataan asesmen..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium"
                  required
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded-sm"
                  />
                  <span>Aktifkan butir pertanyaan ini pada angket siswa</span>
                </label>
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
                  {editingQuestion ? 'Simpan Perubahan' : 'Simpan Butir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
