'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  TrendingUp,
  Users,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Activity,
  ChevronRight,
  Search,
  Loader2,
  RefreshCw,
  PieChart,
  BarChart3,
  Award,
  ArrowRight,
  HelpCircle,
  X
} from 'lucide-react';

interface Program {
  id: string;
  name: string;
  code: string;
  type: string;
  version: string;
}

interface EvaluationStats {
  approvalRate: number;
  averageGrade: number;
  curriculumCoverage: number;
  satisfaction: number;
  studentCount: number;
  subjectCount: number;
  latestSurvey: any;
}

export default function QualityEvaluationModule() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [stats, setStats] = useState<EvaluationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [auditing, setAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);
  const [showHelp, setShowHelp] = useState(false);

  const helpInstructions = [
    { title: 'Selección', text: 'Elige el programa técnico o formal que deseas auditar. El sistema cargará sus indicadores automáticamente.' },
    { title: 'Revisión KPIs', text: 'El Paso 1 muestra el rendimiento real (SIEE). Si no hay datos, puedes usar el "Modo Manual".' },
    { title: 'Checklist Normativo', text: 'El Paso 2 requiere verificar cláusulas de la NTC 5555 o ISO 21001 para asegurar el cumplimiento legal.' },
    { title: 'IA Auditora', text: 'El dictamen final es generado por inteligencia artificial, evaluando riesgos y sugiriendo planes de acción.' }
  ];
  const [auditStep, setAuditStep] = useState<'kpis' | 'checklist' | 'results'>('kpis');
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/quality/evaluate-program');
      if (res.ok) {
        const data = await res.json();
        setPrograms(data);
        if (data.length > 0 && !selectedProgramId) setSelectedProgramId(data[0].id);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const ntcRequirements = [
    { id: 'ntc_42', label: 'NTC 5555 (4.2): Documentación y manual de calidad al día', detail: 'Evidencia de registros y control de documentos.' },
    { id: 'ntc_62', label: 'NTC 5555 (6.2): Perfil docente (Técnico + Pedagógico)', detail: 'Verificación de HV y certificados de competencia.' },
    { id: 'ntc_71', label: 'NTC 5555 (7.1): Infraestructura y ambiente de aprendizaje', detail: 'Talleres, laboratorios y herramientas disponibles.' },
    { id: 'ntc_75', label: 'NTC 5555 (7.5): Prestación del servicio (Pedaogía)', detail: 'Guías de aprendizaje y seguimiento a cohortes.' },
    { id: 'ntc_5581', label: 'NTC 5581: Diseño curricular por competencias', detail: 'Módulos alineados con el CNO.' }
  ];

  const isoRequirements = [
    { id: 'iso_44', label: 'ISO 21001 (4.4): SGOE Documentado', detail: 'Procesos de enseñanza-aprendizaje definidos.' },
    { id: 'iso_82', label: 'ISO 21001 (8.2): Requisitos de aprendizaje', detail: 'Necesidades de estudiantes y beneficiarios cubiertas.' },
    { id: 'iso_91', label: 'ISO 21001 (9.1): Seguimiento y evaluación', detail: 'Medición de la eficacia del aprendizaje.' }
  ];

  const currentChecklist = programs.find(p => p.id === selectedProgramId)?.type === 'ETDH' ? ntcRequirements : isoRequirements;

  const fetchStats = async (id: string) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/quality/evaluate-program?programId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPrograms(); }, []);
  useEffect(() => { if (selectedProgramId) fetchStats(selectedProgramId); }, [selectedProgramId]);

  const [isManualMode, setIsManualMode] = useState(false);
  const [manualKpis, setManualKpis] = useState({
    approvalRate: 0,
    averageGrade: 0,
    satisfaction: 0,
    curriculumCoverage: 0
  });

  const handleRunAudit = async () => {
    if (!selectedProgramId) return;
    setAuditing(true);
    setAuditResult(null);
    try {
      const program = programs.find(p => p.id === selectedProgramId);
      const res = await fetch('/api/quality/evaluate-program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          programId: selectedProgramId, 
          standard: program?.type === 'ETDH' ? 'NTC 5555 / 5581' : 'ISO 21001',
          checklistResults: checklist,
          manualKpis: isManualMode ? manualKpis : null,
          findings: 'Auditoría integral basada en ' + (isManualMode ? 'KPIs ingresados manualmente' : 'datos automatizados del SIEE')
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAuditResult(data.findings);
        setAuditStep('results');
      }
    } catch (e) { console.error(e); }
    finally { setAuditing(false); }
  };

  const toggleCheck = (id: string) => {
    setChecklist(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading && programs.length === 0) {
    return (
      <div className="py-40 flex flex-col items-center justify-center text-slate-400">
        <Loader2 size={48} className="animate-spin mb-4" />
        <p className="text-xs font-black uppercase tracking-widest">Iniciando Auditor Maestro...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Superior Header & Selector */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-slate-900 rounded-2xl text-white shadow-xl">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Auditoría Maestra de Calidad</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Cumplimiento Normativo ETDH & Formal</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-200/50">
            <button 
              onClick={() => setShowHelp(true)}
              className="ml-2 p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all border border-blue-100"
              title="Instrucciones del Proceso"
            >
              <HelpCircle size={20} />
            </button>
            <span className="text-[10px] font-black uppercase text-slate-400">Programa a Evaluar:</span>
            {programs.length > 0 ? (
              <select 
                value={selectedProgramId} 
                onChange={(e) => { setSelectedProgramId(e.target.value); setAuditStep('kpis'); setAuditResult(null); setChecklist({}); }}
                className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              >
                {programs.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                ))}
              </select>
            ) : (
              <div className="bg-amber-50 text-amber-600 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest border border-amber-100">
                No hay programas disponibles.
              </div>
            )}
          </div>
        </div>
      </div>

      {showHelp && (
        <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[2.5rem] max-w-2xl w-full p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8">
              <button onClick={() => setShowHelp(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} className="text-slate-400" /></button>
            </div>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-red-600 rounded-2xl text-white shadow-lg"><HelpCircle size={32} /></div>
              <div>
                <h3 className="text-2xl font-black text-slate-800">Manual de Auditoría</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Módulo: Evaluación de Calidad (PHVA)</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {helpInstructions.map((item, i) => (
                <div key={i} className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <h4 className="text-sm font-black text-blue-600 mb-2 uppercase tracking-tight">{item.title}</h4>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 p-6 bg-slate-900 rounded-3xl text-white">
              <p className="text-xs font-black uppercase tracking-widest mb-1">🎯 Objetivo del Módulo</p>
              <p className="text-[11px] font-medium leading-relaxed opacity-90">Este módulo automatiza la auditoría de programas educativos bajo el estándar NTC 5555, asegurando que la institución esté siempre lista para la renovación de su registro calificado.</p>
            </div>
          </motion.div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {auditStep === 'kpis' && (
          <motion.div 
            key="kpis"
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            className="space-y-10"
          >
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200">
              <div>
                <h4 className="text-sm font-black uppercase text-slate-900 tracking-widest">Fuentes de Datos Académicos</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">¿Desea usar datos automáticos o ingresar valores manuales?</p>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button 
                  onClick={() => setIsManualMode(false)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${!isManualMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                >
                  Automático (SIEE)
                </button>
                <button 
                  onClick={() => setIsManualMode(true)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${isManualMode ? 'bg-red-600 text-white shadow-sm' : 'text-slate-400'}`}
                >
                  Manual (Declarado)
                </button>
              </div>
            </div>

            {/* KPI Dashboard / Manual Form */}
            {isManualMode ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-red-50/30 p-8 rounded-[3rem] border border-red-100/50">
                <ManualInput label="Tasa Aprobación (%)" value={manualKpis.approvalRate} onChange={v => setManualKpis({...manualKpis, approvalRate: Number(v)})} />
                <ManualInput label="Promedio SIEE (0-5)" value={manualKpis.averageGrade} onChange={v => setManualKpis({...manualKpis, averageGrade: Number(v)})} />
                <ManualInput label="Satisfacción (0-5)" value={manualKpis.satisfaction} onChange={v => setManualKpis({...manualKpis, satisfaction: Number(v)})} />
                <ManualInput label="Cobertura Curricular (%)" value={manualKpis.curriculumCoverage} onChange={v => setManualKpis({...manualKpis, curriculumCoverage: Number(v)})} />
              </div>
            ) : (
              stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <KPICard label="Éxito Académico" value={`${stats.approvalRate.toFixed(1)}%`} sub="Tasa de Aprobación" icon={Award} color="text-emerald-600 bg-emerald-50" />
                  <KPICard label="Promedio Global" value={stats.averageGrade.toFixed(2)} sub="Escala SIEE" icon={TrendingUp} color="text-blue-600 bg-blue-50" />
                  <KPICard label="Satisfacción" value={`${stats.satisfaction.toFixed(1)}/5.0`} sub="Encuestas NTC 5555" icon={Activity} color="text-amber-600 bg-amber-50" />
                  <KPICard label="Cobertura Currículo" value={`${stats.curriculumCoverage.toFixed(0)}%`} sub="Diseño vs. Planeación" icon={PieChart} color="text-purple-600 bg-purple-50" />
                </div>
              )
            )}

            <div className="bg-slate-900 rounded-[3rem] p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="max-w-xl">
                <h4 className="text-2xl font-black mb-2 tracking-tight">Paso 1: Revisión de Indicadores</h4>
                <p className="text-slate-400 text-sm font-medium">Los datos académicos arriba mostrados son el primer insumo para la auditoría. Si los KPIs están en verde, proceda a la verificación de requisitos normativos.</p>
              </div>
              <button 
                onClick={() => setAuditStep('checklist')}
                className="bg-white text-slate-900 px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-xl shadow-white/5"
              >
                Siguiente: Checklist Normativo <ChevronRight className="inline ml-2" size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {auditStep === 'checklist' && (
          <motion.div 
            key="checklist"
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            className="bg-white rounded-[3rem] border border-slate-200 p-12 shadow-xl"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
              <div>
                <h4 className="text-3xl font-black text-slate-900 tracking-tighter">Paso 2: Verificación de Requisitos</h4>
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-1">
                  Estándar Aplicable: {programs.find(p => p.id === selectedProgramId)?.type === 'ETDH' ? 'NTC 5555 / 5581 (ETDH)' : 'ISO 21001 (Formal)'}
                </p>
              </div>
              <button 
                onClick={() => setAuditStep('kpis')}
                className="text-slate-400 font-black text-xs uppercase tracking-widest hover:text-red-600 transition-colors"
              >
                Volver a KPIs
              </button>
            </div>

            <div className="grid gap-4 mb-12">
              {currentChecklist.map((req) => (
                <div 
                  key={req.id} 
                  onClick={() => toggleCheck(req.id)}
                  className={`flex items-center gap-6 p-6 rounded-3xl border-2 transition-all cursor-pointer ${
                    checklist[req.id] ? 'bg-emerald-50 border-emerald-500 shadow-lg shadow-emerald-500/10' : 'bg-slate-50 border-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                    checklist[req.id] ? 'bg-emerald-500 text-white' : 'bg-white text-slate-300'
                  }`}>
                    {checklist[req.id] ? <CheckCircle2 size={24} /> : <div className="w-5 h-5 border-2 border-slate-200 rounded-full" />}
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-800 uppercase tracking-tight">{req.label}</div>
                    <div className="text-xs font-medium text-slate-500 mt-0.5">{req.detail}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <button 
                onClick={handleRunAudit}
                disabled={auditing}
                className="bg-red-600 text-white px-12 py-6 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-700 transition-all shadow-2xl shadow-red-600/30 flex items-center gap-3 disabled:bg-slate-300"
              >
                {auditing ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} />}
                {auditing ? 'Generando Dictamen IA...' : 'Finalizar y Generar Auditoría Maestra'}
              </button>
            </div>
          </motion.div>
        )}

        {auditStep === 'results' && auditResult && (
          <motion.div 
            key="results"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
          >
            {/* Score & Conclusion */}
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="bg-slate-900 p-10 rounded-[3rem] border border-white/10 flex flex-col items-center justify-center shadow-2xl">
                <div className="text-6xl font-black text-red-500 mb-2">{auditResult.score}%</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cumplimiento Global</div>
                <div className="mt-8 px-6 py-2 bg-white/5 rounded-full text-[9px] font-black uppercase text-red-400 border border-red-500/20">Auditado por Antigravity AI</div>
              </div>
              <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col justify-center">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-red-600 mb-4">Dictamen Técnico del Auditor Maestro</h4>
                <p className="text-xl font-bold text-slate-800 leading-snug italic">"{auditResult.conclusion}"</p>
                <div className="mt-8 flex gap-4">
                  <button onClick={() => setAuditStep('checklist')} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-600 transition-colors">Volver al Checklist</button>
                  <button onClick={() => window.print()} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-600 transition-colors">Imprimir Informe</button>
                </div>
              </div>
            </div>

            {/* Strengths & Non-Conformities */}
            <div className="grid md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <h4 className="text-sm font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2 ml-2">
                  <CheckCircle2 size={20} /> Fortalezas del Programa
                </h4>
                <div className="space-y-3">
                  {auditResult.strengths.map((s: string, i: number) => (
                    <div key={i} className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl text-sm text-emerald-900 font-bold shadow-sm">
                      {s}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-sm font-black uppercase tracking-widest text-red-600 flex items-center gap-2 ml-2">
                  <AlertTriangle size={20} /> No Conformidades & Hallazgos
                </h4>
                <div className="space-y-3">
                  {auditResult.nonConformities.map((nc: any, i: number) => (
                    <div key={i} className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:border-red-200 transition-all group">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-[10px] font-black uppercase text-red-600 tracking-widest bg-red-50 px-2 py-0.5 rounded">{nc.requirement}</div>
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${nc.severity === 'MAJOR' ? 'bg-red-600 text-white' : 'bg-amber-100 text-amber-600'}`}>{nc.severity}</span>
                      </div>
                      <p className="text-sm text-slate-700 font-medium leading-relaxed">{nc.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Plan */}
            <section className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/20 rounded-full blur-3xl -mr-20 -mt-20 opacity-50" />
               <h4 className="text-sm font-black uppercase tracking-[0.3em] text-red-500 mb-8 flex items-center gap-3">
                 <ArrowRight size={22} /> Plan de Mejoramiento Institucional (PMI)
               </h4>
               <div className="grid md:grid-cols-2 gap-12 relative z-10">
                 <div className="text-sm font-medium leading-relaxed text-slate-300 whitespace-pre-wrap bg-white/5 p-8 rounded-[2rem] border border-white/10">
                   {auditResult.actionPlan}
                 </div>
                 <div className="space-y-6">
                    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                      <div className="text-xs font-black uppercase text-red-500 mb-2">Siguiente Paso Sugerido</div>
                      <p className="text-xs text-slate-400">Actualizar el manual de procesos académicos en el módulo de Documentos para reflejar el cierre de hallazgos.</p>
                    </div>
                    <div className="bg-red-600/10 border border-red-600/20 p-6 rounded-2xl">
                      <div className="text-xs font-black uppercase text-red-400 mb-2">Meta de Calidad</div>
                      <p className="text-xs text-slate-300">Alcanzar un cumplimiento del 100% en el numeral 7.5 de la NTC 5555 antes de la próxima auditoría de seguimiento.</p>
                    </div>
                 </div>
               </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-3 gap-10">
        <div className="space-y-8">
           <section className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
             <h3 className="text-lg font-black text-slate-900 mb-6">Listado Maestro SGC</h3>
             <div className="space-y-4">
               {[
                 { code: 'NTC-5555', title: 'SGC Formación Trabajo' },
                 { code: 'NTC-5581', title: 'Programas de Sistemas' },
                 { code: 'ISO-21001', title: 'Gestión Educativa' }
               ].map((doc, i) => (
                 <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-red-200 transition-all">
                   <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-red-600">
                     <FileText size={18} />
                   </div>
                   <div className="flex-1 min-w-0">
                     <div className="text-[10px] font-black text-red-600 uppercase tracking-widest">{doc.code}</div>
                     <div className="text-xs font-bold text-slate-800 truncate">{doc.title}</div>
                   </div>
                   <ChevronRight size={16} className="text-slate-300 group-hover:text-red-600 transition-colors" />
                 </div>
               ))}
             </div>
           </section>

           <section className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-600/20">
             <Activity size={32} className="mb-4 opacity-50" />
             <h4 className="text-lg font-black tracking-tight mb-2">Monitoreo en Tiempo Real</h4>
             <p className="text-blue-100 text-[10px] font-medium leading-relaxed uppercase tracking-wider">
               Los indicadores mostrados se sincronizan automáticamente con las notas registradas por los docentes en el SIEE.
             </p>
           </section>
        </div>
      </div>
    </div>
  );
}

function KPICard({ label, value, sub, icon: Icon, color }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm relative overflow-hidden group hover:border-slate-400 transition-all"
    >
      <div className={`absolute -bottom-4 -right-4 p-8 rounded-full ${color} opacity-10 group-hover:scale-110 transition-transform`}>
        <Icon size={48} />
      </div>
      <div className="relative z-10">
        <div className="text-3xl font-black text-slate-900 mb-1">{value}</div>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</div>
        <div className="text-[9px] font-bold text-slate-400 opacity-60">{sub}</div>
      </div>
    </motion.div>
  );
}

function ManualInput({ label, value, onChange }: { label: string, value: number, onChange: (v: string) => void }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm">
      <label className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-2 block">{label}</label>
      <input 
        type="number" 
        value={value} 
        onChange={e => onChange(e.target.value)}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600/10"
      />
    </div>
  );
}
