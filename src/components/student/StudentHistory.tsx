import React, { useState } from 'react';
import { db } from '../../db/storage';
import { AnalysisService } from '../../services/AnalysisService';
import { useAuth } from '../../context/AuthContext';
import { FileCheck2, Calendar, Eye, Compass, BarChart3, AlertCircle } from 'lucide-react';
import { PriorityBadge } from '../common/PriorityBadge';
import { CareerBadge } from '../common/CareerBadge';

export const StudentHistory: React.FC = () => {
  const { currentStudent } = useAuth();
  const [selectedResponseId, setSelectedResponseId] = useState<string | null>(null);

  if (!currentStudent) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-8 text-center max-w-lg mx-auto my-12 space-y-3">
        <FileCheck2 className="w-10 h-10 text-slate-400 mx-auto" />
        <h3 className="font-bold text-slate-800 text-sm">Riwayat Angket Belum Tersedia</h3>
        <p className="text-xs text-slate-500">
          Data siswa belum terdaftar di database. Silakan hubungi Administrator Sekolah.
        </p>
      </div>
    );
  }

  const responses = db
    .getResponses()
    .filter((r) => r.student_id === currentStudent.id && r.status === 'SUBMITTED')
    .sort((a, b) => new Date(b.submitted_at || b.created_at).getTime() - new Date(a.submitted_at || a.created_at).getTime());

  const types = db.getQuestionnaireTypes();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <FileCheck2 className="w-5 h-5 text-blue-600" />
          <span>Riwayat Pengisian & Hasil Angket</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Daftar instrumen angket BK yang telah Anda selesaikan beserta ringkasan hasil yang diizinkan Guru BK.
        </p>
      </div>

      {responses.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
          Belum ada angket yang dikirimkan. Silakan isi angket melalui menu Daftar Angket.
        </div>
      ) : (
        <div className="space-y-4">
          {responses.map((resp) => {
            const type = types.find((t) => t.id === resp.questionnaire_type_id);
            const { categoryAnalysis, careerResult } = AnalysisService.calculateResponseAnalysis(resp.id);
            const isExpanded = selectedResponseId === resp.id;

            return (
              <div
                key={resp.id}
                className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                      Terkirim & Tersimpan
                    </span>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 mt-1">
                      {type?.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Dikirim pada: {resp.submitted_at ? new Date(resp.submitted_at).toLocaleDateString('id-ID', { dateStyle: 'long' }) : '-'}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedResponseId(isExpanded ? null : resp.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg text-xs self-start sm:self-auto cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isExpanded ? 'Tutup Rincian' : 'Lihat Hasil Asesmen'}</span>
                  </button>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    {/* Category Based Result (AKPD or Kelas X) */}
                    {categoryAnalysis && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200">
                            <span className="text-[10px] font-bold text-blue-700 uppercase">Rata-rata Kebutuhan</span>
                            <h4 className="text-xl font-black text-blue-950 mt-1">{categoryAnalysis.overall_percentage}%</h4>
                          </div>

                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="text-[10px] font-bold text-slate-600 uppercase">Tingkat Indikasi</span>
                            <div className="mt-1.5">
                              <PriorityBadge level={categoryAnalysis.priority_level} size="sm" />
                            </div>
                          </div>

                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="text-[10px] font-bold text-slate-600 uppercase">Fokus Utama</span>
                            <h4 className="text-xs font-bold text-slate-900 mt-1 truncate">{categoryAnalysis.highest_need_category}</h4>
                          </div>
                        </div>

                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                                <th className="py-2 px-3">Bidang / Aspek</th>
                                <th className="py-2 px-3 text-center">Skor (%)</th>
                                <th className="py-2 px-3 text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {categoryAnalysis.category_results.map((c) => (
                                <tr key={c.category_id}>
                                  <td className="py-2 px-3 font-medium text-slate-800">{c.category_name}</td>
                                  <td className="py-2 px-3 text-center font-bold text-blue-700">{c.percentage}%</td>
                                  <td className="py-2 px-3 text-center">
                                    <PriorityBadge level={c.priority_level} label={c.interpretation} />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* BMW Result */}
                    {careerResult && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="p-3 bg-sky-50 rounded-xl border border-sky-200">
                            <span className="text-[10px] font-bold text-sky-800 uppercase">Bekerja (A)</span>
                            <h4 className="text-xl font-black text-sky-950 mt-1">{careerResult.pct_bekerja}%</h4>
                          </div>

                          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                            <span className="text-[10px] font-bold text-emerald-800 uppercase">Kuliah (B)</span>
                            <h4 className="text-xl font-black text-emerald-950 mt-1">{careerResult.pct_kuliah}%</h4>
                          </div>

                          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                            <span className="text-[10px] font-bold text-amber-800 uppercase">Wirausaha (C)</span>
                            <h4 className="text-xl font-black text-amber-950 mt-1">{careerResult.pct_wirausaha}%</h4>
                          </div>
                        </div>

                        <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase">Kecenderungan Utama</span>
                            <CareerBadge career={careerResult.dominant_career} />
                          </div>
                          <h4 className="text-sm font-bold text-blue-300">{careerResult.career_title}</h4>
                          <div className="pt-2 border-t border-slate-800">
                            <p className="text-[11px] font-semibold text-slate-300">Rekomendasi Bimbingan Karier:</p>
                            <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-200 text-[11px]">
                              {careerResult.bk_recommendations.map((rec, i) => (
                                <li key={i}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
