'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Plus,
  ChevronRight,
  ChevronDown,
  Layers,
  Clock,
  FileText,
  CheckCircle2,
  X,
  Loader2,
  Target,
  PenLine,
  GraduationCap,
  AlertCircle,
  Download
} from 'lucide-react';

interface SubjectArea {
  id: string;
  name: string;
  code: string;
  description?: string;
  subjects: Subject[];
}

interface Subject {
  id: string;
  name: string;
  grade: string;
  weeklyHours: number;
  plans: CurriculumPlan[];
}

interface CurriculumPlan {
  id: string;
  period: number;
  dbaReference?: string;
  competency: string;
  indicator?: string;
  methodology?: string;
  evaluationCriteria?: string;
}

type ModalType = 'area' | 'subject' | 'plan' | null;

export default function CurriculumBuilder() {
  const [areas, setAreas] = useState<SubjectArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedArea, setExpandedArea] = useState<string | null>(null);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalType>(null);
  const [saving, setSaving] = useState(false);
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [toast, setToast] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [importingETDH, setImportingETDH] = useState(false);
  const [institutionType, setInstitutionType] = useState('FORMAL');

  // Form States
  const [areaForm, setAreaForm] = useState({ name: '', code: '', description: '' });
  const [subjectForm, setSubjectForm] = useState({ name: '', grade: '', weeklyHours: 4 });
  const [planForm, setPlanForm] = useState({ period: 1, dbaReference: '', competency: '', indicator: '', methodology: '', evaluationCriteria: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resAreas, resInst] = await Promise.all([
        fetch('/api/curriculum?type=areas'),
        fetch('/api/institution')
      ]);
      
      if (resAreas.ok) setAreas(await resAreas.json());
      if (resInst.ok) {
        const instData = await resInst.json();
        setInstitutionType(instData.type || 'FORMAL');
      }
    } catch (e) {
      console.error('Error fetching data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const isETDH = institutionType === 'ETDH';
  const termArea = isETDH ? 'Programa Técnico' : 'Área Académica';
  const termSubject = isETDH ? 'Módulo Especifico' : 'Asignatura';
  const termGrade = isETDH ? 'Carrera base' : 'Grado';
  const termPlan = isETDH ? 'Competencia Laboral' : 'Plan Curricular';

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreateArea = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/curriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'area', ...areaForm }),
      });
      if (res.ok) {
        showToast(`${termArea} creada exitosamente`);
        setModal(null);
        setAreaForm({ name: '', code: '', description: '' });
        fetchData();
      } else {
        const data = await res.json();
        showToast(`Error: ${data.error}`);
      }
    } catch (e) { showToast('Error de conexión'); }
    finally { setSaving(false); }
  };

  const handleCreateSubject = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/curriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'subject', areaId: selectedAreaId, ...subjectForm }),
      });
      if (res.ok) {
        showToast(`${termSubject} creada exitosamente`);
        setModal(null);
        setSubjectForm({ name: '', grade: '', weeklyHours: 4 });
        fetchData();
      } else {
        const data = await res.json();
        showToast(`Error: ${data.error}`);
      }
    } catch (e) { showToast('Error de conexión'); }
    finally { setSaving(false); }
  };

  const handleCreatePlan = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/curriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'plan', subjectId: selectedSubjectId, ...planForm }),
      });
      if (res.ok) {
        showToast(`${termPlan} registrada`);
        setModal(null);
        setPlanForm({ period: 1, dbaReference: '', competency: '', indicator: '', methodology: '', evaluationCriteria: '' });
        fetchData();
      } else {
        const data = await res.json();
        showToast(`Error: ${data.error}`);
      }
    } catch (e) { showToast('Error de conexión'); }
    finally { setSaving(false); }
  };

  const handleETDHImport = async (file: File) => {
    if (!file) return;
    setImportingETDH(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/curriculum/import', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        showToast(`Éxito: Registros creados.`);
        fetchData();
      } else {
        showToast(`Error: ${data.error}`);
      }
    } catch {
      showToast('Error de conexión subiendo Excel ETDH');
    } finally {
      setImportingETDH(false);
    }
  };

  const grades = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];

  const totalSubjects = areas.reduce((acc, a) => acc + a.subjects.length, 0);
  const totalPlans = areas.reduce((acc, a) => acc + a.subjects.reduce((s, sub) => s + sub.plans.length, 0), 0);

  return (
    <div className="space-y-8">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-[200] bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-bold"
          >
            <CheckCircle2 size={18} className="text-emerald-400" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Overlay */}
      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-6"
            onClick={() => setModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal: Create Area */}
              {modal === 'area' && (
                <div>
                  <div className="bg-slate-900 p-8 text-white">
                    <h4 className="text-xl font-black tracking-tight">Nueva {termArea}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{isETDH ? 'Estructura Modular ETDH' : 'Ley 115/94 · Artículo 23'}</p>
                  </div>
                  <div className="p-8 space-y-5">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nombre del {termArea}</label>
                      <input
                        value={areaForm.name}
                        onChange={e => setAreaForm({ ...areaForm, name: e.target.value })}
                        placeholder={isETDH ? "Ej: Técnico en Sistemas" : "Ej: Matemáticas"}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-300"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Código</label>
                      <input
                        value={areaForm.code}
                        onChange={e => setAreaForm({ ...areaForm, code: e.target.value.toUpperCase() })}
                        placeholder="Ej: MAT"
                        maxLength={5}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold uppercase focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-300"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Descripción (Opcional)</label>
                      <textarea
                        value={areaForm.description}
                        onChange={e => setAreaForm({ ...areaForm, description: e.target.value })}
                        placeholder="Descripción del área según los lineamientos del MEN..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-medium h-24 resize-none focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-300"
                      />
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button onClick={() => setModal(null)} className="flex-1 py-4 rounded-2xl border-2 border-slate-100 font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all">Cancelar</button>
                      <button onClick={handleCreateArea} disabled={saving || !areaForm.name || !areaForm.code} className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Crear {termArea}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal: Create Subject */}
              {modal === 'subject' && (
                <div>
                  <div className="bg-slate-900 p-8 text-white">
                    <h4 className="text-xl font-black tracking-tight">Nueva {termSubject}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Plan de estudios institucional</p>
                  </div>
                  <div className="p-8 space-y-5">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nombre de {termSubject}</label>
                      <input
                        value={subjectForm.name}
                        onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })}
                        placeholder={isETDH ? "Ej: Soporte Técnico" : "Ej: Álgebra, Biología, Lengua Castellana"}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-300"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">{termGrade}</label>
                        <select
                          value={subjectForm.grade}
                          onChange={e => setSubjectForm({ ...subjectForm, grade: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-300"
                        >
                          <option value="">Seleccionar...</option>
                          {!isETDH ? grades.map(g => <option key={g} value={g}>Grado {g}°</option>) : <option value="Aplica ETDH">Aplica ETDH</option>}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Horas Semanales</label>
                        <input
                          type="number"
                          value={subjectForm.weeklyHours}
                          onChange={e => setSubjectForm({ ...subjectForm, weeklyHours: parseInt(e.target.value) || 1 })}
                          min={1} max={20}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-300"
                        />
                      </div>
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button onClick={() => setModal(null)} className="flex-1 py-4 rounded-2xl border-2 border-slate-100 font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all">Cancelar</button>
                      <button onClick={handleCreateSubject} disabled={saving || !subjectForm.name || !subjectForm.grade} className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Crear {termSubject}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal: Create Curriculum Plan */}
              {modal === 'plan' && (
                <div>
                  <div className="bg-red-600 p-8 text-white">
                    <h4 className="text-xl font-black tracking-tight">{isETDH ? 'Nueva Competencia' : 'Plan Curricular por Período'}</h4>
                    <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest mt-1">{isETDH ? 'Norma de Competencia Laboral' : 'DBA · Decreto 1290 · Competencias MEN'}</p>
                  </div>
                  <div className="p-8 space-y-5 max-h-[60vh] overflow-y-auto">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Período Académico</label>
                      <div className="grid grid-cols-4 gap-2">
                        {[1, 2, 3, 4].map(p => (
                          <button
                            key={p}
                            onClick={() => setPlanForm({ ...planForm, period: p })}
                            className={`py-3 rounded-xl font-black text-xs uppercase transition-all ${
                              planForm.period === p ? 'bg-red-600 text-white shadow-lg' : 'bg-slate-50 border border-slate-200 text-slate-500'
                            }`}
                          >
                            P{p}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Referencia DBA (Opcional)</label>
                      <input
                        value={planForm.dbaReference}
                        onChange={e => setPlanForm({ ...planForm, dbaReference: e.target.value })}
                        placeholder="Ej: DBA-MAT-6-01"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-300"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Competencia / Logro</label>
                      <textarea
                        value={planForm.competency}
                        onChange={e => setPlanForm({ ...planForm, competency: e.target.value })}
                        placeholder="Describe la competencia o el logro que el estudiante debe alcanzar..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-medium h-24 resize-none focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-300"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Indicador de Desempeño (Opcional)</label>
                      <textarea
                        value={planForm.indicator}
                        onChange={e => setPlanForm({ ...planForm, indicator: e.target.value })}
                        placeholder="Ej: El estudiante resuelve ecuaciones lineales con una variable..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-medium h-20 resize-none focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-300"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Metodología (Opcional)</label>
                      <textarea
                        value={planForm.methodology}
                        onChange={e => setPlanForm({ ...planForm, methodology: e.target.value })}
                        placeholder="Estrategias didácticas y pedagógicas para el periodo..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-medium h-20 resize-none focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-300"
                      />
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button onClick={() => setModal(null)} className="flex-1 py-4 rounded-2xl border-2 border-slate-100 font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all">Cancelar</button>
                      <button onClick={handleCreatePlan} disabled={saving || !planForm.competency} className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Target size={16} />} Registrar Plan
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-red-600 rounded-2xl text-white shadow-xl shadow-red-600/20">
            <BookOpen size={28} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Constructor Curricular</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Plan de Estudios · DBA · Ley 115</p>
          </div>
        </div>
        <button
          onClick={() => setModal('area')}
          className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
        >
          <Plus size={16} /> Nueva Área
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center">
          <div className="text-3xl font-black text-slate-900">{areas.length}</div>
          <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">{termArea}s</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center">
          <div className="text-3xl font-black text-red-600">{totalSubjects}</div>
          <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">{termSubject}s</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center">
          <div className="text-3xl font-black text-emerald-600">{totalPlans}</div>
          <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">{termPlan}s</div>
        </div>
      </div>

      {/* Importador Masivo ETDH */}
      <div 
        className={`border-2 border-dashed rounded-[2.5rem] p-8 text-center transition-all ${isDragging ? 'border-red-500 bg-red-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400'}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleETDHImport(e.dataTransfer.files[0]);
          }
        }}
      >
        <div className="flex flex-col items-center gap-3">
          {importingETDH ? (
             <div className="flex flex-col items-center">
               <Loader2 size={32} className="animate-spin text-red-600 mb-2" />
               <p className="text-xs font-black uppercase text-slate-500 tracking-widest">Inyectando Plan de Estudios ETDH...</p>
             </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 mb-2">
                <FileText size={20} />
              </div>
              <div>
                <p className="text-sm font-black text-slate-800">Arrastra tu Excel de Carreras Técnicas aquí (ETDH)</p>
                <p className="text-[10px] text-slate-400 font-bold tracking-widest mt-1">El archivo debe contener las columnas: [Carrera] [Módulo] [Competencia]</p>
              </div>
              <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                <a 
                  href="/templates/plantilla_curriculo.xlsx" 
                  download
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-[10px] font-black uppercase text-red-600 tracking-widest transition-all"
                >
                  <Download size={14} /> Descargar Plantilla Módulos ETDH
                </a>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Area List */}
      {loading ? (
        <div className="text-center py-20 flex flex-col items-center gap-4">
          <Loader2 size={48} className="text-slate-100 animate-spin" />
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Cargando malla curricular...</p>
        </div>
      ) : areas.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-[2rem]">
          <BookOpen size={48} className="mx-auto text-slate-100 mb-4" />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No hay áreas académicas registradas</p>
          <p className="text-[10px] text-slate-300 font-bold mt-1">Crea tu primera área para comenzar a construir el plan de estudios</p>
        </div>
      ) : (
        <div className="space-y-4">
          {areas.map((area, aIdx) => {
            const isExpanded = expandedArea === area.id;
            return (
              <motion.div
                key={area.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: aIdx * 0.05 }}
                className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden"
              >
                {/* Area Header */}
                <div
                  className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 transition-all"
                  onClick={() => setExpandedArea(isExpanded ? null : area.id)}
                >
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 font-black text-sm">
                      {area.code}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-lg">{area.name}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{area.subjects.length} {termSubject}s</span>
                        {area.description && (
                          <>
                            <span className="text-slate-200">•</span>
                            <span className="text-[9px] text-slate-400 font-medium">{area.description}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedAreaId(area.id); setModal('subject'); }}
                      className="px-4 py-2 bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-tight text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all"
                    >
                      + {termSubject}
                    </button>
                    <ChevronDown size={20} className={`text-slate-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Subjects */}
                <AnimatePresence>
                  {isExpanded && area.subjects.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-100"
                    >
                      <div className="p-6 space-y-3">
                        {area.subjects.map((subject) => {
                          const isSubExpanded = expandedSubject === subject.id;
                          return (
                            <div key={subject.id} className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                              <div
                                className="flex items-center justify-between p-5 cursor-pointer hover:bg-white transition-all"
                                onClick={() => setExpandedSubject(isSubExpanded ? null : subject.id)}
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                                    <PenLine size={16} className="text-slate-500" />
                                  </div>
                                  <div>
                                    <span className="font-bold text-slate-800 text-sm">{subject.name}</span>
                                    <div className="flex items-center gap-3 mt-0.5">
                                      {!isETDH && <span className="text-[9px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded">Grado {subject.grade}°</span>}
                                      {isETDH && <span className="text-[9px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded">Módulo Técnico</span>}
                                      <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1"><Clock size={10} /> {subject.weeklyHours}h/sem</span>
                                      <span className="text-[9px] text-slate-400 font-bold">{subject.plans.length} {isETDH ? 'competencias' : 'planes'}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setSelectedSubjectId(subject.id); setModal('plan'); }}
                                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-tight text-slate-500 hover:border-red-200 hover:text-red-600 transition-all"
                                  >
                                    + Plan
                                  </button>
                                  <ChevronDown size={16} className={`text-slate-300 transition-transform ${isSubExpanded ? 'rotate-180' : ''}`} />
                                </div>
                              </div>

                              {/* Plans */}
                              <AnimatePresence>
                                {isSubExpanded && subject.plans.length > 0 && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="border-t border-slate-100"
                                  >
                                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {subject.plans.map((plan) => (
                                        <div key={plan.id} className="bg-white border border-slate-100 rounded-xl p-4 space-y-2">
                                          <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-black bg-red-600 text-white px-2 py-0.5 rounded uppercase">Período {plan.period}</span>
                                            {plan.dbaReference && <span className="text-[8px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{plan.dbaReference}</span>}
                                          </div>
                                          <p className="text-xs text-slate-700 font-medium leading-relaxed">{plan.competency}</p>
                                          {plan.indicator && <p className="text-[10px] text-slate-400 italic">📌 {plan.indicator}</p>}
                                        </div>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {isExpanded && area.subjects.length === 0 && (
                  <div className="p-8 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-400 font-bold">No hay asignaturas en esta área aún</p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="bg-slate-900 rounded-3xl p-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
          <div>
            <div className="text-xs font-black text-white uppercase tracking-widest">Constructor Curricular Activo</div>
            <div className="text-[10px] text-slate-500 font-bold">Ley 115/94 · Decreto 1290 · DBA MEN · NTC 5555</div>
          </div>
        </div>
        <Layers size={20} className="text-red-500" />
      </div>
    </div>
  );
}
