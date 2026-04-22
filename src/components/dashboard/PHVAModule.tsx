'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw, Plus, ChevronDown, ChevronRight,
  AlertTriangle, CheckCircle2, Clock, XCircle,
  TrendingDown, Loader2, X, Save, BookOpen,
  Target, Eye, RotateCcw, CheckSquare, FileText,
} from 'lucide-react';
import { generateActaPMI } from '@/lib/pdf-export';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Plan {
  id: string;
  studentId: string;
  subjectId?: string;
  planear: string;
  hacer: string;
  verificar?: string;
  actuar?: string;
  period: number;
  status: string;
  priority: string;
  dueDate?: string;
  createdAt: string;
  student: { id: string; name: string; grade: string; documentId: string };
  subject?: { id: string; name: string };
}

interface AtRisk {
  id: string; name: string; grade: string; documentId: string;
  avgScore: number; evalCount: number;
}

const STATUS_CFG: Record<string, { label: string; color: string; icon: any }> = {
  ACTIVO:        { label: 'Activo',        color: 'bg-amber-100 text-amber-700 border-amber-200',   icon: Clock },
  EN_SEGUIMIENTO:{ label: 'Seguimiento',   color: 'bg-blue-100 text-blue-700 border-blue-200',      icon: Eye },
  CERRADO:       { label: 'Cerrado',       color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
};

const PRIORITY_CFG: Record<string, { label: string; dot: string }> = {
  NORMAL:  { label: 'Normal',   dot: 'bg-slate-400' },
  ALTA:    { label: 'Alta',     dot: 'bg-amber-500' },
  CRITICA: { label: 'Crítica',  dot: 'bg-red-600' },
};

// ─── PHVA Step Card ───────────────────────────────────────────────────────────
function PhvaStep({ letter, color, title, value }: { letter: string; color: string; title: string; value?: string }) {
  if (!value) return null;
  return (
    <div className={`flex gap-3 p-4 rounded-2xl border ${color} bg-opacity-30`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 ${color.replace('border', 'bg').replace('text', 'text')}`}>
        {letter}
      </div>
      <div>
        <div className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-70">{title}</div>
        <p className="text-xs font-medium leading-relaxed">{value}</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PHVAModule() {
  const [plans, setPlans]       = useState<Plan[]>([]);
  const [atRisk, setAtRisk]     = useState<AtRisk[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [toast, setToast]       = useState<string | null>(null);

  const handleAIGenerate = async () => {
    if (!form.studentId) {
      showToast('Selecciona un estudiante primero para el análisis de IA');
      return;
    }
    setGeneratingAI(true);
    try {
      const res = await fetch('/api/ai/analyze-phva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: form.studentId, subjectId: form.subjectId || undefined }),
      });
      if (res.ok) {
        const data = await res.json();
        setForm({
          ...form,
          planear: data.planear,
          hacer: data.hacer,
          verificar: data.verificar,
          actuar: data.actuar,
          priority: data.priority,
        });
        showToast('Plan generado por Antigravity AI. Revisa los campos.');
      } else {
        showToast('Error al generar el plan con IA');
      }
    } catch (e) {
      console.error(e);
      showToast('Error de conexión con el servicio de IA');
    } finally {
      setGeneratingAI(false);
    }
  };

  const [form, setForm] = useState({
    studentId: '', subjectId: '', planear: '', hacer: '',
    verificar: '', actuar: '', period: 1, priority: 'NORMAL', dueDate: '',
  });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = filterStatus ? `?status=${filterStatus}` : '';
      const [phvaRes, currRes] = await Promise.all([
        fetch(`/api/phva${params}`),
        fetch('/api/curriculum?type=areas'),
      ]);
      const phvaData = await phvaRes.json();
      const currData = await currRes.json();

      setPlans(Array.isArray(phvaData.plans) ? phvaData.plans : []);
      setAtRisk(Array.isArray(phvaData.atRisk) ? phvaData.atRisk : []);

      const allSubjects: any[] = [];
      if (Array.isArray(currData)) {
        currData.forEach((area: any) => {
          area.subjects?.forEach((s: any) => allSubjects.push({ ...s, areaName: area.name }));
        });
      } else {
        console.error("Invalid curriculum data in PHVA:", currData);
      }
      setSubjects(allSubjects);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filterStatus]);

  const handleCreate = async () => {
    if (!form.studentId || !form.planear || !form.hacer) {
      showToast('Completa: Estudiante, Diagnóstico (Planear) y Actividades (Hacer)');
      return;
    }
    setSaving(true);
    try {
      const res  = await fetch('/api/phva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, subjectId: form.subjectId || undefined, dueDate: form.dueDate || undefined }),
      });
      if (res.ok) {
        showToast('Plan de Mejoramiento creado exitosamente');
        setShowModal(false);
        setForm({ studentId: '', subjectId: '', planear: '', hacer: '', verificar: '', actuar: '', period: 1, priority: 'NORMAL', dueDate: '' });
        fetchData();
      } else {
        const d = await res.json();
        showToast(d.error || 'Error al crear el plan');
      }
    } finally { setSaving(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch('/api/phva', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    showToast(`Plan actualizado a: ${STATUS_CFG[status]?.label}`);
    fetchData();
  };

  const filteredPlans = plans.filter(p => !filterStatus || p.status === filterStatus);
  const activeCount   = plans.filter(p => p.status === 'ACTIVO').length;
  const trackCount    = plans.filter(p => p.status === 'EN_SEGUIMIENTO').length;
  const closedCount   = plans.filter(p => p.status === 'CERRADO').length;

  return (
    <div className="space-y-8">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-[200] bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-bold"
          >
            <CheckCircle2 size={18} className="text-emerald-400" /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div initial={{ scale: 0.93, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93 }}
              className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-t-[2.5rem] text-white sticky top-0 z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xl font-black tracking-tight">Nuevo Plan de Mejoramiento</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Ciclo PHVA · ISO 21001 · Decreto 1290</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={handleAIGenerate}
                      disabled={generatingAI || !form.studentId}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-slate-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-red-600/20"
                    >
                      {generatingAI ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <RefreshCw size={14} />
                      )}
                      {generatingAI ? 'Analizando...' : 'Asistente Antigravity'}
                    </button>
                    <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-white/10 transition-all">
                      <X size={20} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-6">
                {/* Student select */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Estudiante *</label>
                    <select value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-600/20">
                      <option value="">-- Selecciona un estudiante en riesgo --</option>
                      {atRisk.map(s => (
                        <option key={s.id} value={s.id}>{s.name} · {s.grade} · Prom: {Number(s.avgScore).toFixed(1)}</option>
                      ))}
                    </select>
                    {atRisk.length === 0 && <p className="text-[10px] text-amber-600 font-bold mt-1">No se detectaron estudiantes en riesgo aún (promedio &lt; 3.0)</p>}
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Asignatura (Opcional)</label>
                    <select value={form.subjectId} onChange={e => setForm({ ...form, subjectId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-600/20">
                      <option value="">General (todas las asignaturas)</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name} — Gr {s.grade}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Período</label>
                    <select value={form.period} onChange={e => setForm({ ...form, period: parseInt(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-600/20">
                      {[1,2,3,4].map(p => <option key={p} value={p}>Período {p}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Prioridad</label>
                    <div className="flex gap-2">
                      {['NORMAL','ALTA','CRITICA'].map(p => (
                        <button key={p} onClick={() => setForm({ ...form, priority: p })}
                          className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all border ${
                            form.priority === p ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-500 border-slate-200'
                          }`}>{p}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Fecha Límite (Opcional)</label>
                    <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-600/20" />
                  </div>
                </div>

                {/* PHVA Fields */}
                {[
                  { key: 'planear',   label: 'P — PLANEAR',   placeholder: 'Diagnóstico del bajo rendimiento y metas de mejora...', required: true,  color: 'border-blue-300 bg-blue-50' },
                  { key: 'hacer',     label: 'H — HACER',     placeholder: 'Actividades, talleres o estrategias de recuperación...', required: true,  color: 'border-emerald-300 bg-emerald-50' },
                  { key: 'verificar', label: 'V — VERIFICAR', placeholder: 'Indicadores y mecanismos para comprobar el avance...', required: false, color: 'border-amber-300 bg-amber-50' },
                  { key: 'actuar',    label: 'A — ACTUAR',    placeholder: 'Compromisos finales y ajustes al plan si aplica...', required: false,  color: 'border-purple-300 bg-purple-50' },
                ].map(({ key, label, placeholder, required, color }) => (
                  <div key={key}>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                      {label} {required && <span className="text-red-600">*</span>}
                    </label>
                    <textarea value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                      placeholder={placeholder} rows={3}
                      className={`w-full border rounded-2xl px-5 py-4 text-sm font-medium resize-none focus:outline-none focus:ring-2 focus:ring-red-600/20 ${color}`}
                    />
                  </div>
                ))}

                <div className="flex gap-4 pt-2">
                  <button onClick={() => setShowModal(false)} className="flex-1 py-4 rounded-2xl border-2 border-slate-100 font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all">Cancelar</button>
                  <button onClick={handleCreate} disabled={saving} className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Crear Plan PHVA
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl text-white shadow-xl shadow-blue-600/20">
            <RotateCcw size={28} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Ciclo PHVA — Mejoramiento</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Planes de Mejoramiento Individual · ISO 21001</p>
          </div>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20">
          <Plus size={16} /> Nuevo PMI
        </button>
      </div>

      {/* ─── Stats ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'En Riesgo',     val: atRisk.length,  color: 'bg-red-600 text-white shadow-red-600/20',     icon: AlertTriangle },
          { label: 'PMI Activos',   val: activeCount,    color: 'bg-amber-50 text-amber-700 border border-amber-200', icon: Clock },
          { label: 'Seguimiento',   val: trackCount,     color: 'bg-blue-50 text-blue-700 border border-blue-200',   icon: Eye },
          { label: 'Cerrados',      val: closedCount,    color: 'bg-emerald-50 text-emerald-700 border border-emerald-200', icon: CheckCircle2 },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`p-6 rounded-3xl shadow-sm relative overflow-hidden ${s.color}`}>
            <s.icon size={40} className="absolute -bottom-3 -right-3 opacity-10" />
            <div className="text-3xl font-black">{s.val}</div>
            <div className="text-[9px] font-black uppercase tracking-widest mt-1 opacity-70">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* ─── At-Risk Panel ──────────────────────────────────────────────── */}
      {atRisk.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-[2rem] p-8">
          <div className="flex items-center gap-3 mb-6">
            <TrendingDown size={20} className="text-red-600" />
            <h4 className="text-base font-black text-red-700 uppercase tracking-widest">Estudiantes en Riesgo Académico</h4>
            <span className="text-[9px] bg-red-600 text-white font-black px-2 py-0.5 rounded uppercase">Promedio &lt; 3.0</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {atRisk.map((s) => (
              <div key={s.id} className="bg-white border border-red-100 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="font-black text-slate-900 text-sm">{s.name}</div>
                  <div className="text-[10px] text-slate-500 font-bold">{s.grade}</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-red-600">{Number(s.avgScore).toFixed(1)}</div>
                  <button onClick={() => { setForm({ ...form, studentId: s.id }); setShowModal(true); }}
                    className="text-[9px] font-black text-red-600 hover:underline uppercase tracking-widest">
                    Crear PMI
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Filter ─────────────────────────────────────────────────────── */}
      <div className="flex gap-3">
        {['', 'ACTIVO', 'EN_SEGUIMIENTO', 'CERRADO'].map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
              filterStatus === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
            }`}>
            {s === '' ? 'Todos' : STATUS_CFG[s]?.label || s}
          </button>
        ))}
      </div>

      {/* ─── Plans List ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="py-20 flex flex-col items-center text-slate-400">
          <Loader2 size={40} className="animate-spin mb-4" />
          <p className="text-xs font-black uppercase tracking-widest">Cargando planes de mejoramiento...</p>
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="py-20 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center text-slate-300">
          <Target size={52} className="mb-4" />
          <p className="text-sm font-black uppercase tracking-widest text-slate-400">No hay planes de mejoramiento registrados</p>
          <button onClick={() => setShowModal(true)} className="mt-4 text-xs font-black text-red-600 hover:underline uppercase tracking-widest">
            Crear el primero
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPlans.map((plan, idx) => {
            const isExp = expandedPlan === plan.id;
            const statusCfg = STATUS_CFG[plan.status] || STATUS_CFG.ACTIVO;
            const priCfg   = PRIORITY_CFG[plan.priority] || PRIORITY_CFG.NORMAL;

            return (
              <motion.div key={plan.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
                {/* Plan header */}
                <div className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 transition-all"
                  onClick={() => setExpandedPlan(isExp ? null : plan.id)}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-600">
                      {plan.student.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-slate-900">{plan.student.name}</span>
                        <span className="text-[9px] bg-slate-100 text-slate-500 font-black px-2 py-0.5 rounded uppercase">{plan.student.grade}</span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                        <span className="flex items-center gap-1 text-[9px] font-black text-slate-400">
                          <span className={`w-1.5 h-1.5 rounded-full ${priCfg.dot}`} /> {priCfg.label}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                        {plan.subject ? plan.subject.name : 'General'} · Período {plan.period}
                        {plan.dueDate && ` · Vence: ${new Date(plan.dueDate).toLocaleDateString()}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* PDF Export */}
                    <button onClick={(e) => { e.stopPropagation(); generateActaPMI(plan); }}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Descargar Acta PMI (PDF)"
                    >
                      <FileText size={18} />
                    </button>

                    {/* Quick actions */}
                    {plan.status === 'ACTIVO' && (
                      <button onClick={(e) => { e.stopPropagation(); updateStatus(plan.id, 'EN_SEGUIMIENTO'); }}
                        className="px-3 py-1.5 text-[9px] font-black uppercase bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-all">
                        Poner en Seguimiento
                      </button>
                    )}
                    {plan.status === 'EN_SEGUIMIENTO' && (
                      <button onClick={(e) => { e.stopPropagation(); updateStatus(plan.id, 'CERRADO'); }}
                        className="px-3 py-1.5 text-[9px] font-black uppercase bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-all">
                        Cerrar Plan
                      </button>
                    )}
                    <ChevronDown size={18} className={`text-slate-300 transition-transform ${isExp ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Plan detail */}
                <AnimatePresence>
                  {isExp && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} className="border-t border-slate-100">
                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="col-span-1 md:col-span-2 p-4 rounded-2xl border border-blue-200 bg-blue-50">
                          <div className="text-[9px] font-black uppercase tracking-widest text-blue-600 mb-1">P — Planear · Diagnóstico</div>
                          <p className="text-xs font-medium text-blue-900 leading-relaxed">{plan.planear}</p>
                        </div>
                        <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50">
                          <div className="text-[9px] font-black uppercase tracking-widest text-emerald-600 mb-1">H — Hacer · Actividades</div>
                          <p className="text-xs font-medium text-emerald-900 leading-relaxed">{plan.hacer}</p>
                        </div>
                        {plan.verificar && (
                          <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50">
                            <div className="text-[9px] font-black uppercase tracking-widest text-amber-600 mb-1">V — Verificar · Indicadores</div>
                            <p className="text-xs font-medium text-amber-900 leading-relaxed">{plan.verificar}</p>
                          </div>
                        )}
                        {plan.actuar && (
                          <div className="p-4 rounded-2xl border border-purple-200 bg-purple-50">
                            <div className="text-[9px] font-black uppercase tracking-widest text-purple-600 mb-1">A — Actuar · Compromisos</div>
                            <p className="text-xs font-medium text-purple-900 leading-relaxed">{plan.actuar}</p>
                          </div>
                        )}
                        <div className="col-span-1 md:col-span-2 text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                          Creado: {new Date(plan.createdAt).toLocaleDateString()} · ID: {plan.id.slice(0, 8)}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
