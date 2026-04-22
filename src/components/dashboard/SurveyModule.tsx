'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList, Plus, Trash2, Link, Copy, CheckCircle2, BarChart3,
  Upload, Loader2, AlertCircle, Star, X, Eye, EyeOff, FileSpreadsheet,
  ArrowLeft, ChevronDown, ChevronUp, RefreshCw
} from 'lucide-react';

interface Question {
  id: string;
  text: string;
  type: 'rating' | 'text' | 'yesno';
  required: boolean;
}

interface Survey {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  target: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  _count?: { responses: number };
}

const TARGET_OPTIONS = ['ESTUDIANTE', 'DOCENTE', 'ACUDIENTE', 'EGRESADO', 'EMPLEADO'];
const QUESTION_TYPES = [
  { id: 'rating', label: '⭐ Calificación (1-5)' },
  { id: 'yesno', label: '✅ Sí / No' },
  { id: 'text', label: '📝 Respuesta libre' },
];

function generateId() { return Math.random().toString(36).slice(2, 9); }
function generateSlug(title: string) {
  return title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 50)
    + '-' + Math.random().toString(36).slice(2, 6);
}

export default function SurveyModule() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'create' | 'results'>('list');
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [results, setResults] = useState<any>(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formTarget, setFormTarget] = useState('ESTUDIANTE');
  const [formSlug, setFormSlug] = useState('');
  const [formQuestions, setFormQuestions] = useState<Question[]>([
    { id: generateId(), text: '', type: 'rating', required: true }
  ]);
  const [saving, setSaving] = useState(false);

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchSurveys = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/surveys');
      if (res.ok) setSurveys(await res.json());
    } catch { showToast('Error cargando encuestas', 'err'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSurveys(); }, []);

  const handleCreate = async () => {
    if (!formTitle.trim() || formQuestions.some(q => !q.text.trim())) {
      showToast('Completa el título y todas las preguntas', 'err'); return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle, description: formDesc, target: formTarget,
          slug: formSlug || generateSlug(formTitle),
          questions: formQuestions
        })
      });
      if (res.ok) {
        showToast('¡Encuesta creada exitosamente!');
        setView('list');
        resetForm();
        fetchSurveys();
      } else {
        const d = await res.json();
        showToast(d.error || 'Error al crear', 'err');
      }
    } finally { setSaving(false); }
  };

  const resetForm = () => {
    setFormTitle(''); setFormDesc(''); setFormTarget('ESTUDIANTE'); setFormSlug('');
    setFormQuestions([{ id: generateId(), text: '', type: 'rating', required: true }]);
  };

  const addQuestion = () => setFormQuestions(prev => [...prev, { id: generateId(), text: '', type: 'rating', required: false }]);
  const removeQuestion = (id: string) => setFormQuestions(prev => prev.filter(q => q.id !== id));
  const updateQuestion = (id: string, patch: Partial<Question>) =>
    setFormQuestions(prev => prev.map(q => q.id === id ? { ...q, ...patch } : q));

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/s/${slug}`);
    showToast('¡Link copiado al portapapeles! 🔗');
  };

  const toggleActive = async (survey: Survey) => {
    await fetch(`/api/surveys/${survey.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !survey.isActive })
    });
    fetchSurveys();
    showToast(`Encuesta ${survey.isActive ? 'desactivada' : 'activada'}`);
  };

  const deleteSurvey = async (id: string) => {
    if (!confirm('¿Eliminar esta encuesta y todas sus respuestas?')) return;
    await fetch(`/api/surveys/${id}`, { method: 'DELETE' });
    fetchSurveys();
    showToast('Encuesta eliminada');
  };

  const openResults = async (survey: Survey) => {
    setSelectedSurvey(survey);
    setView('results');
    setLoadingResults(true);
    try {
      const res = await fetch(`/api/surveys/${survey.id}/responses`);
      if (res.ok) setResults(await res.json());
    } catch { showToast('Error cargando resultados', 'err'); }
    finally { setLoadingResults(false); }
  };

  const handleImport = async (surveyId: string, file: File) => {
    setImporting(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch(`/api/surveys/${surveyId}/import`, { method: 'POST', body: fd });
      const d = await res.json();
      if (res.ok) showToast(`✅ ${d.imported} respuestas importadas de ${d.total} filas`);
      else showToast(d.error || 'Error al importar', 'err');
      if (selectedSurvey?.id === surveyId) openResults(selectedSurvey);
      else fetchSurveys();
    } finally { setImporting(false); }
  };

  // ── RESULTS VIEW ────────────────────────────────────────────────────────────
  if (view === 'results' && selectedSurvey) {
    return (
      <div className="space-y-6">
        <button onClick={() => { setView('list'); setResults(null); }}
          className="flex items-center gap-2 text-sm font-black text-slate-500 hover:text-red-600 transition-colors uppercase tracking-widest">
          <ArrowLeft size={16} /> Volver a Encuestas
        </button>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] p-8 text-white">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-black">{selectedSurvey.title}</h2>
              <p className="text-slate-400 text-sm mt-1">Audiencia: {selectedSurvey.target}</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <label className={`flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer font-black text-xs uppercase tracking-widest transition-all ${importing ? 'bg-slate-700 opacity-50' : 'bg-white/10 hover:bg-white/20'}`}>
                {importing ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
                Importar Excel
                <input type="file" accept=".xlsx,.xls,.csv" className="hidden"
                  onChange={e => e.target.files?.[0] && handleImport(selectedSurvey.id, e.target.files[0])}
                  disabled={importing} />
              </label>
              <button onClick={() => copyLink(selectedSurvey.slug)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-xl font-black text-xs uppercase tracking-widest transition-all">
                <Copy size={14} /> Copiar Link
              </button>
            </div>
          </div>
          {results && (
            <div className="grid grid-cols-3 gap-4 mt-6">
              {[
                { label: 'Total Respuestas', value: results.total, color: 'text-white' },
                { label: 'Online', value: results.onlineCount, color: 'text-emerald-400' },
                { label: 'Excel Importado', value: results.importCount, color: 'text-blue-400' },
              ].map(s => (
                <div key={s.label} className="bg-white/5 rounded-2xl p-4 text-center">
                  <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] uppercase font-black text-slate-500 tracking-widest mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {loadingResults ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-slate-400" /></div>
        ) : results?.stats?.length > 0 ? (
          <div className="space-y-4">
            {results.stats.map((s: any, i: number) => (
              <div key={s.questionId} className="bg-white rounded-3xl border border-slate-200 p-7 shadow-sm">
                <div className="flex items-start gap-3 mb-5">
                  <span className="w-7 h-7 rounded-xl bg-slate-900 text-white text-[10px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
                  <p className="font-black text-slate-900">{s.text}</p>
                </div>

                {s.type === 'rating' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl font-black text-amber-500">{s.avg.toFixed(1)}</div>
                      <div>
                        <div className="flex gap-0.5">{[1,2,3,4,5].map(st => <Star key={st} size={18} className={st <= Math.round(s.avg) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} />)}</div>
                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{s.answered} respuestas</div>
                      </div>
                    </div>
                    {Object.entries(s.distribution || {}).reverse().map(([star, count]: any) => (
                      <div key={star} className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-400 w-4">{star}★</span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: s.answered > 0 ? `${(count / s.answered) * 100}%` : '0%' }} />
                        </div>
                        <span className="text-[10px] font-black text-slate-500 w-8 text-right">{count}</span>
                      </div>
                    ))}
                  </div>
                )}

                {s.type === 'yesno' && (
                  <div className="flex gap-4">
                    {[{ label: 'Sí', count: s.yes, color: 'bg-emerald-500' }, { label: 'No', count: s.no, color: 'bg-red-500' }].map(opt => (
                      <div key={opt.label} className="flex-1 bg-slate-50 rounded-2xl p-5 text-center border border-slate-100">
                        <div className={`w-3 h-3 rounded-full ${opt.color} mx-auto mb-2`} />
                        <div className="text-3xl font-black text-slate-900">{opt.count}</div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{opt.label}</div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {s.answered > 0 ? Math.round((opt.count / s.answered) * 100) : 0}%
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {s.type === 'text' && s.answers?.length > 0 && (
                  <div className="space-y-2">
                    {s.answers.map((a: string, ai: number) => (
                      <div key={ai} className="bg-slate-50 rounded-2xl px-5 py-3 text-sm text-slate-700 border border-slate-100">
                        "{a}"
                      </div>
                    ))}
                    {s.answered > 10 && <p className="text-[10px] text-slate-400 font-bold">Mostrando 10 de {s.answered} respuestas de texto</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
            <BarChart3 size={48} className="text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-black">Aún no hay respuestas.</p>
            <p className="text-slate-400 text-sm mt-1">Comparte el link o importa un Excel con resultados.</p>
          </div>
        )}
      </div>
    );
  }

  // ── CREATE FORM ─────────────────────────────────────────────────────────────
  if (view === 'create') {
    return (
      <div className="space-y-6">
        <button onClick={() => setView('list')}
          className="flex items-center gap-2 text-sm font-black text-slate-500 hover:text-red-600 transition-colors uppercase tracking-widest">
          <ArrowLeft size={16} /> Volver
        </button>

        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 space-y-6">
          <h2 className="text-xl font-black text-slate-900">Nueva Encuesta de Satisfacción</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Título *</label>
              <input value={formTitle} onChange={e => setFormTitle(e.target.value)}
                placeholder="Ej: Satisfacción Estudiantil 2024-1"
                className="w-full border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold focus:border-slate-900 focus:outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Audiencia</label>
              <select value={formTarget} onChange={e => setFormTarget(e.target.value)}
                className="w-full border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold focus:border-slate-900 focus:outline-none bg-white">
                {TARGET_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Descripción (opcional)</label>
            <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={2}
              placeholder="Breve explicación del propósito de la encuesta..."
              className="w-full border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold focus:border-slate-900 focus:outline-none resize-none" />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Identificador URL (slug)</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400 font-bold">/s/</span>
              <input value={formSlug} onChange={e => setFormSlug(e.target.value)}
                placeholder={`se generará automático`}
                className="flex-1 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold focus:border-slate-900 focus:outline-none" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preguntas *</label>
              <button onClick={addQuestion}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all">
                <Plus size={12} /> Agregar
              </button>
            </div>
            <div className="space-y-4">
              {formQuestions.map((q, idx) => (
                <div key={q.id} className="flex gap-3 items-start bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <span className="w-7 h-7 rounded-xl bg-slate-900 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-1">{idx + 1}</span>
                  <div className="flex-1 space-y-3">
                    <input value={q.text} onChange={e => updateQuestion(q.id, { text: e.target.value })}
                      placeholder="Escribe la pregunta..."
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-slate-900 focus:outline-none bg-white" />
                    <div className="flex gap-3 flex-wrap">
                      <select value={q.type} onChange={e => updateQuestion(q.id, { type: e.target.value as any })}
                        className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none bg-white">
                        {QUESTION_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                      </select>
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer">
                        <input type="checkbox" checked={q.required} onChange={e => updateQuestion(q.id, { required: e.target.checked })} />
                        Obligatoria
                      </label>
                    </div>
                  </div>
                  {formQuestions.length > 1 && (
                    <button onClick={() => removeQuestion(q.id)}
                      className="p-2 text-slate-400 hover:text-red-600 transition-colors rounded-xl hover:bg-red-50">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button onClick={handleCreate} disabled={saving}
            className="w-full bg-slate-900 hover:bg-red-600 text-white font-black text-sm uppercase tracking-widest py-4 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-60">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {saving ? 'Creando...' : 'Crear Encuesta y Generar Link Público'}
          </button>
        </div>
      </div>
    );
  }

  // ── SURVEY LIST ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-2xl text-white text-sm font-black shadow-xl ${toast.type === 'ok' ? 'bg-emerald-600' : 'bg-red-600'}`}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-slate-900 rounded-3xl text-white shadow-xl shadow-slate-900/20">
            <ClipboardList size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Encuestas de Satisfacción</h1>
            <p className="text-sm text-slate-500 font-medium">ISO 21001 · NTC 5555 · NTC 5581</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchSurveys} className="p-3 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all">
            <RefreshCw size={16} className="text-slate-500" />
          </button>
          <button onClick={() => setView('create')}
            className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-slate-900/20">
            <Plus size={14} /> Nueva Encuesta
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-slate-300" /></div>
      ) : surveys.length === 0 ? (
        <div className="bg-white rounded-[2rem] border border-slate-200 p-16 text-center">
          <ClipboardList size={48} className="text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-black text-slate-900 mb-2">No hay encuestas aún</h3>
          <p className="text-slate-400 mb-6">Crea tu primera encuesta de satisfacción y comparte el link público.</p>
          <button onClick={() => setView('create')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-all">
            <Plus size={14} /> Crear Primera Encuesta
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {surveys.map(survey => (
            <div key={survey.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 hover:border-slate-300 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <h3 className="font-black text-slate-900">{survey.title}</h3>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border ${
                      survey.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>{survey.isActive ? 'Activa' : 'Inactiva'}</span>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-200">
                      {survey.target}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold">
                    <span>📊 {survey._count?.responses ?? 0} respuestas</span>
                    <span>📅 {new Date(survey.createdAt).toLocaleDateString('es-CO')}</span>
                    <span className="font-mono text-slate-300">/s/{survey.slug}</span>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap shrink-0">
                  <button onClick={() => copyLink(survey.slug)}
                    className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                    <Copy size={12} /> Link
                  </button>
                  <button onClick={() => openResults(survey)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all">
                    <BarChart3 size={12} /> Resultados
                  </button>
                  <button onClick={() => toggleActive(survey)}
                    className={`p-2 rounded-xl border transition-all ${survey.isActive ? 'border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}>
                    {survey.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button onClick={() => deleteSurvey(survey.id)}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
