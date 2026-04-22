'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, Filter, X, ChevronLeft, ChevronRight,
  AlertTriangle, ShieldCheck, BookOpen, Edit2, Save,
  FileSpreadsheet, Loader2, User, Calendar, Hash,
  GraduationCap, CheckCircle2, XCircle, ArrowLeft,
  TrendingDown, TrendingUp, FileText, Menu,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { generateBoletin } from '@/lib/pdf-export';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Student {
  id: string;
  name: string;
  documentId: string;
  grade: string;
  cohort?: string;
  createdAt: string;
  _count: { cases: number; evaluations: number };
}

interface StudentProfile {
  student: Student & {
    cases: any[];
    evaluations: any[];
  };
  gradeSummary: {
    subjectName: string;
    areaName: string;
    periods: Record<number, number>;
    average: number;
    atRisk: boolean;
  }[];
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function StudentsModule() {
  const [students, setStudents]     = useState<Student[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [pages, setPages]           = useState(1);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [gradeFilter, setGradeFilter]   = useState('');
  const [cohortFilter, setCohortFilter] = useState('');
  const [gradeOptions, setGradeOptions]   = useState<string[]>([]);
  const [cohortOptions, setCohortOptions] = useState<string[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [activeModality, setActiveModality] = useState<'FORMAL' | 'ETDH'>('FORMAL');
  const [loadingProfile, setLoadingProfile]   = useState(false);
  const [boletinLoading, setBoletinLoading]   = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [editForm, setEditForm]     = useState({ name: '', grade: '', cohort: '' });
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [aiRisk, setAiRisk]         = useState<any>(null);

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchStudents = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20' });
      params.set('modality', activeModality);
      if (search)       params.set('search', search);
      if (gradeFilter)  params.set('grade', gradeFilter);
      if (cohortFilter) params.set('cohort', cohortFilter);

      const res  = await fetch(`/api/students?${params}`);
      const data = await res.json();
      setStudents(data.students || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      if (data.filters?.grades)  setGradeOptions(data.filters.grades);
      if (data.filters?.cohorts) setCohortOptions(data.filters.cohorts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, gradeFilter, cohortFilter, page, activeModality]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchStudents(1); }, 350);
    return () => clearTimeout(t);
  }, [search, gradeFilter, cohortFilter, activeModality]);

  useEffect(() => { fetchStudents(page); }, [page]);

  // Load profile
  const openProfile = async (id: string) => {
    setLoadingProfile(true);
    setAiRisk(null);
    try {
      const res  = await fetch(`/api/students/${id}`);
      const data = await res.json();
      setSelectedStudent(data);

      // AI Prediction
      fetch('/api/ai/predict-dropout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: id, gradeSummary: data.gradeSummary })
      }).then(r => r.json()).then(prediction => {
        setAiRisk(prediction);
      }).catch(() => {});

    } catch (e) {
      showToast('Error cargando perfil', 'err');
    } finally {
      setLoadingProfile(false);
    }
  };

  const downloadBoletin = async (studentId: string) => {
    setBoletinLoading(true);
    try {
      const res  = await fetch(`/api/siee/boletin?studentId=${studentId}`);
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Error generando boletín', 'err'); return; }
      if (!data.subjects?.length) { showToast('El estudiante no tiene evaluaciones registradas', 'err'); return; }
      generateBoletin(data);
      showToast('Boletín descargado exitosamente');
    } catch (e) {
      showToast('Error generando el boletín', 'err');
    } finally {
      setBoletinLoading(false);
    }
  };

  // Edit inline
  const startEdit = (s: Student) => {
    setEditingId(s.id);
    setEditForm({ name: s.name, grade: s.grade, cohort: s.cohort || '' });
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/students', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...editForm }),
      });
      if (res.ok) {
        showToast('Estudiante actualizado');
        setEditingId(null);
        fetchStudents();
        if (selectedStudent?.student.id === id) openProfile(id);
      } else {
        const d = await res.json();
        showToast(d.error || 'Error al guardar', 'err');
      }
    } finally {
      setSaving(false);
    }
  };

  // Export to Excel
  const exportExcel = () => {
    const rows = students.map((s) => ({
      'Nombre': s.name,
      'Documento': s.documentId,
      'Grado / Carrera': s.grade,
      'Cohorte / Ficha': s.cohort || '',
      'Casos Convivencia': s._count.cases,
      'Evaluaciones': s._count.evaluations,
      'Registrado': new Date(s.createdAt).toLocaleDateString(),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 30 }, { wch: 16 }, { wch: 24 }, { wch: 20 }, { wch: 18 }, { wch: 14 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Estudiantes');
    XLSX.writeFile(wb, `padron_estudiantes_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF('p', 'pt', 'a4');
    doc.setFontSize(16);
    doc.text('Padrón de Estudiantes', 40, 40);
    const tableData = students.map((s) => [
      s.name,
      s.documentId,
      s.grade,
      s.cohort || 'N/A',
      s._count.cases.toString(),
      s._count.evaluations.toString()
    ]);
    autoTable(doc, {
      startY: 60,
      head: [['Nombre', 'Documento', 'Grado', 'Cohorte', 'Casos', 'Evals']],
      body: tableData,
    });
    doc.save(`padron_estudiantes_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // ─── Profile Panel ──────────────────────────────────────────────────────
  if (selectedStudent) {
    const { student, gradeSummary } = selectedStudent;
    const atRiskCount = gradeSummary.filter((s) => s.atRisk).length;

    return (
      <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
        {/* Back */}
        <button
          onClick={() => setSelectedStudent(null)}
          className="flex items-center gap-2 text-sm font-black text-slate-500 hover:text-red-600 transition-colors uppercase tracking-widest"
        >
          <ArrowLeft size={16} /> Volver al Padrón
        </button>

        {/* Header Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[3rem] p-10 text-white relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-64 h-64 bg-red-600/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 w-full lg:w-auto text-center lg:text-left">
              <div className="w-20 h-20 rounded-3xl bg-red-600 flex items-center justify-center text-3xl font-black shadow-xl shadow-red-600/30 shrink-0">
                {student.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl lg:text-3xl font-black tracking-tight">{student.name}</h2>
                <div className="flex flex-wrap justify-center lg:justify-start gap-4 mt-2">
                  <span className="flex items-center gap-1.5 text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <Hash size={12} /> {student.documentId}
                  </span>
                  <span className="flex items-center gap-1.5 text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <GraduationCap size={12} /> {student.grade}
                  </span>
                  {student.cohort && (
                    <span className="flex items-center gap-1.5 text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <Calendar size={12} /> {student.cohort}
                    </span>
                  )}
                </div>
              </div>
            </div>


            <div className="flex flex-wrap gap-4 pt-4 lg:pt-0 w-full lg:w-auto">
              <div className="text-center bg-white/5 rounded-2xl px-4 lg:px-6 py-3 lg:py-4 flex-1 sm:flex-none">
                <div className="text-xl lg:text-2xl font-black text-red-400">{student._count.cases}</div>
                <div className="text-[8px] lg:text-[9px] uppercase font-black text-slate-500 tracking-widest">Casos L1620</div>
              </div>
              <div className="text-center bg-white/5 rounded-2xl px-4 lg:px-6 py-3 lg:py-4 flex-1 sm:flex-none">
                <div className="text-xl lg:text-2xl font-black text-emerald-400">{gradeSummary.length}</div>
                <div className="text-[8px] lg:text-[9px] uppercase font-black text-slate-500 tracking-widest">Asignaturas</div>
              </div>
              {atRiskCount > 0 && (
                <div className="text-center bg-red-600/20 border border-red-500/30 rounded-2xl px-4 lg:px-6 py-3 lg:py-4 flex-1 sm:flex-none">
                  <div className="text-xl lg:text-2xl font-black text-red-400">{atRiskCount}</div>
                  <div className="text-[8px] lg:text-[9px] uppercase font-black text-red-400 tracking-widest">En Riesgo</div>
                </div>
              )}
            </div>
          </div>
          {/* Edit button */}
          <div className="mt-8 lg:mt-0 lg:absolute lg:top-8 lg:right-8 flex flex-wrap gap-3">
            <button
              onClick={() => downloadBoletin(student.id)}
              disabled={boletinLoading}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-60"
            >
              {boletinLoading
                ? <Loader2 size={14} className="animate-spin" />
                : <FileText size={14} />}
              PDF
            </button>
            <button
              onClick={() => { startEdit(student); }}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              <Edit2 size={14} /> Editar
            </button>
          </div>
        </div>

        {/* AI Risk Predictor - always visible */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] p-6 text-white relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-red-600/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <TrendingDown size={14} /> Predictor IA — Riesgo de Deserción Escolar
              </span>
              {aiRisk && (
                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${
                  aiRisk.riskLevel === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                  aiRisk.riskLevel === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                  'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                }`}>
                  {aiRisk.riskLevel === 'CRITICAL' ? '🚨 Riesgo Crítico' : aiRisk.riskLevel === 'MEDIUM' ? '⚠️ Riesgo Medio' : '✅ Bajo Riesgo'}
                </span>
              )}
            </div>
            {aiRisk ? (
              <>
                <div className="flex items-center gap-6 mb-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      <span>Probabilidad de Deserción</span>
                      <span>{aiRisk.score}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          aiRisk.riskLevel === 'CRITICAL' ? 'bg-gradient-to-r from-red-600 to-red-400' :
                          aiRisk.riskLevel === 'MEDIUM' ? 'bg-gradient-to-r from-amber-600 to-amber-400' :
                          'bg-gradient-to-r from-emerald-600 to-emerald-400'
                        }`}
                        style={{ width: `${aiRisk.score}%` }}
                      />
                    </div>
                  </div>
                  <div className={`text-4xl font-black ${
                    aiRisk.riskLevel === 'CRITICAL' ? 'text-red-400' :
                    aiRisk.riskLevel === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>{aiRisk.score}%</div>
                </div>
                {aiRisk.factors?.length > 0 && (
                  <div className="space-y-1.5 border-t border-slate-700 pt-4">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Factores detectados:</div>
                    {aiRisk.factors.map((f: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-[11px] text-slate-300">
                        <span className="text-red-400 shrink-0 mt-0.5">▸</span> {f}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-4 py-2">
                <div className="w-10 h-10 rounded-2xl bg-slate-700 flex items-center justify-center">
                  <Loader2 size={20} className="animate-spin text-slate-400" />
                </div>
                <div>
                  <div className="text-sm font-black text-slate-300">Analizando perfil académico con IA...</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Procesando historial SIEE, asistencia y casos de convivencia</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Grade Summary */}
        {gradeSummary.length > 0 && (
          <div className="bg-white rounded-[2rem] lg:rounded-[3rem] border border-slate-200 p-6 lg:p-10 shadow-sm">
            <h3 className="text-lg lg:text-xl font-black text-slate-900 tracking-tight mb-8">
              Desempeño Académico — SIEE
            </h3>
            <div className="overflow-x-auto -mx-6 lg:mx-0">
              <div className="inline-block min-w-full align-middle px-6 lg:px-0">
                <table className="w-full text-sm text-left">
                <thead className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="pb-4 pr-6">Asignatura</th>
                    <th className="pb-4 px-4 text-center">P1</th>
                    <th className="pb-4 px-4 text-center">P2</th>
                    <th className="pb-4 px-4 text-center">P3</th>
                    <th className="pb-4 px-4 text-center">P4</th>
                    <th className="pb-4 px-4 text-center">Promedio</th>
                    <th className="pb-4 pl-4 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {gradeSummary.map((row, i) => (
                    <tr key={i} className={row.atRisk ? 'bg-red-50/50' : ''}>
                      <td className="py-4 pr-6">
                        <div className="font-black text-slate-900">{row.subjectName}</div>
                        <div className="text-[10px] text-slate-400 font-bold">{row.areaName}</div>
                      </td>
                      {[1, 2, 3, 4].map((p) => (
                        <td key={p} className="px-4 py-3 text-center">
                          <span className={`font-black text-sm ${
                            row.periods[p] === undefined ? 'text-slate-200' :
                            row.periods[p] < 3.0 ? 'text-red-600' : 'text-slate-700'
                          }`}>
                            {row.periods[p] !== undefined ? row.periods[p].toFixed(1) : '—'}
                          </span>
                        </td>
                      ))}
                      <td className="px-4 py-3 text-center">
                        <span className={`font-black text-base ${row.atRisk ? 'text-red-600' : 'text-emerald-600'}`}>
                          {row.average.toFixed(1)}
                        </span>
                      </td>
                      <td className="pl-4 py-3 text-center">
                        {row.atRisk ? (
                          <span className="flex items-center gap-1 text-[9px] font-black text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded-lg uppercase w-fit mx-auto">
                            <TrendingDown size={10} /> Riesgo
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg uppercase w-fit mx-auto">
                            <TrendingUp size={10} /> Aprobado
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

        {/* Cases */}
        {student.cases.length > 0 && (
          <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-8">
              Historial de Convivencia — Ley 1620
            </h3>
            <div className="space-y-4">
              {student.cases.map((c: any) => (
                <div key={c.id} className="flex items-start gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    c.severity === 'CRITICAL' ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-600'
                  }`}>
                    <AlertTriangle size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-black text-sm text-slate-900">Situación Tipo {c.type}</span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                        c.status === 'OPEN' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>{c.status}</span>
                      <span className="text-[10px] text-slate-400 font-bold">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{c.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  // ─── Main List ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-[200] px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-bold text-white ${
              toast.type === 'ok' ? 'bg-slate-900' : 'bg-red-600'
            }`}
          >
            {toast.type === 'ok' ? <CheckCircle2 size={18} className="text-emerald-400" /> : <XCircle size={18} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingId && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-xl flex items-center justify-center p-6"
            onClick={() => setEditingId(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-slate-900 p-8 text-white">
                <h4 className="text-xl font-black tracking-tight">Editar Estudiante</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Cambios con trazabilidad en auditoría</p>
              </div>
              <div className="p-8 space-y-4">
                {[
                  { label: 'Nombre Completo', key: 'name', placeholder: 'Ej: Juan Pérez' },
                  { label: 'Grado o Carrera', key: 'grade', placeholder: 'Ej: 10 o Técnico Sistemas' },
                  { label: 'Cohorte / Ficha', key: 'cohort', placeholder: 'Ej: FICHA-2024-01' },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">{label}</label>
                    <input
                      value={(editForm as any)[key]}
                      onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                      placeholder={placeholder}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-300"
                    />
                  </div>
                ))}
                <div className="flex gap-4 pt-2">
                  <button onClick={() => setEditingId(null)} className="flex-1 py-4 rounded-2xl border-2 border-slate-100 font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all">Cancelar</button>
                  <button onClick={() => saveEdit(editingId)} disabled={saving} className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Guardar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header with Integrated Tabs */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 pb-8 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="p-3 lg:p-4 bg-red-600 rounded-2xl text-white shadow-xl shadow-red-600/20">
              <Users size={24} className="lg:w-7 lg:h-7" />
            </div>
            <div>
              <h3 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
                {activeModality === 'FORMAL' ? 'Padrón Colegio' : 'Carreras (ETDH)'}
              </h3>
              <p className="text-[9px] lg:text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
                {total} {activeModality === 'FORMAL' ? 'Estudiantes' : 'Aprendices'}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full sm:w-auto">
              <button
                onClick={() => { setActiveModality('FORMAL'); setPage(1); }}
                className={`flex-1 sm:flex-none px-4 lg:px-6 py-2.5 rounded-xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeModality === 'FORMAL' ? 'bg-white text-red-600 shadow-md' : 'text-slate-400'
                }`}
              >
                Colegio
              </button>
              <button
                onClick={() => { setActiveModality('ETDH'); setPage(1); }}
                className={`flex-1 sm:flex-none px-4 lg:px-6 py-2.5 rounded-xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeModality === 'ETDH' ? 'bg-white text-red-600 shadow-md' : 'text-slate-400'
                }`}
              >
                ETDH
              </button>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={exportExcel}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all hover:bg-emerald-700 shadow-lg"
              >
                <FileSpreadsheet size={14} /> Excel
              </button>
              <button
                onClick={exportPDF}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-2xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all hover:bg-red-700 shadow-lg"
              >
                <FileText size={14} /> PDF
              </button>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
          <div className="md:col-span-2 relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-300"
            />
          </div>
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 focus:outline-none"
          >
            <option value="">{activeModality === 'FORMAL' ? 'Todos los Grados' : 'Todas las Carreras'}</option>
            {gradeOptions.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <div className="flex items-center gap-4">
            <select
              value={cohortFilter}
              onChange={(e) => setCohortFilter(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 focus:outline-none"
            >
              <option value="">{activeModality === 'FORMAL' ? 'Todas las Cohortes' : 'Todas las Fichas'}</option>
              {cohortOptions.map((c) => <option key={c} value={c!}>{c}</option>)}
            </select>
            {(search || gradeFilter || cohortFilter) && (
              <button onClick={() => { setSearch(''); setGradeFilter(''); setCohortFilter(''); }} className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-all">
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400">
            <Loader2 size={40} className="animate-spin mb-4" />
            <p className="text-xs font-black uppercase tracking-widest">Cargando padrón institucional...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-300">
            <User size={52} className="mb-4" />
            <p className="text-sm font-black uppercase tracking-widest text-slate-400">
              {search || gradeFilter || cohortFilter ? 'Sin resultados para esta búsqueda' : 'No hay estudiantes registrados'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200">
                <tr>
                  <th className="px-8 py-5">Estudiante</th>
                  <th className="px-4 py-5">Documento</th>
                  <th className="px-4 py-5">Grado / Carrera</th>
                  <th className="px-4 py-5">Cohorte</th>
                  <th className="px-4 py-5 text-center">Casos</th>
                  <th className="px-4 py-5 text-center">Evaluaciones</th>
                  <th className="px-8 py-5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s, idx) => (
                  <motion.tr
                    key={s.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 font-black text-sm shrink-0">
                          {s.name.charAt(0)}
                        </div>
                        <button
                          onClick={() => openProfile(s.id)}
                          className="font-black text-slate-900 hover:text-red-600 transition-colors text-left"
                        >
                          {s.name}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-500 text-xs tracking-wider">{s.documentId}</td>
                    <td className="px-4 py-4">
                      <span className="text-xs font-black bg-slate-100 text-slate-600 px-3 py-1 rounded-lg">{s.grade}</span>
                    </td>
                    <td className="px-4 py-4 text-xs font-bold text-slate-400">{s.cohort || '—'}</td>
                    <td className="px-4 py-4 text-center">
                      {s._count.cases > 0 ? (
                        <span className="text-xs font-black text-red-600 bg-red-50 border border-red-100 px-2.5 py-1 rounded-lg">{s._count.cases}</span>
                      ) : <span className="text-slate-300 font-bold">0</span>}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-xs font-black text-slate-600">{s._count.evaluations}</span>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openProfile(s.id)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-600 transition-all text-slate-500"
                          title="Ver Perfil"
                        >
                          <User size={15} />
                        </button>
                        <button
                          onClick={() => startEdit(s)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-600 transition-all text-slate-500"
                          title="Editar"
                        >
                          <Edit2 size={15} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Página {page} de {pages} · {total} estudiantes
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-3 rounded-xl bg-white border border-slate-200 text-slate-500 hover:border-red-300 hover:text-red-600 transition-all disabled:opacity-40 shadow-sm"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="p-3 rounded-xl bg-white border border-slate-200 text-slate-500 hover:border-red-300 hover:text-red-600 transition-all disabled:opacity-40 shadow-sm"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
