'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  FileText, 
  ShieldCheck, 
  AlertTriangle, 
  ChevronRight, 
  ChevronLeft, 
  Upload, 
  CheckCircle2, 
  Search,
  UserPlus,
  Info,
  Scale,
  Camera,
  Loader2
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const formSchema = z.object({
  studentId: z.string().min(1, "Debe seleccionar un estudiante"),
  type: z.number().min(1).max(3),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  severity: z.string().default('NORMAL'),
  involvedParticipants: z.string().optional(),
});

type Step = 'SELECT' | 'DETAILS' | 'PROTOCOL' | 'EVIDENCE' | 'SUCCESS';

export default function ConvivenciaWizard({ onComplete, institution }: { onComplete?: () => void, institution?: any }) {
  const [step, setStep] = useState<Step>('SELECT');
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 1,
      severity: 'NORMAL',
    }
  });

  const selectedType = watch('type');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        // En producción esto sería una API de búsqueda, aquí traemos el seed
        const res = await fetch('/api/students');
        if (res.ok) {
          const data = await res.json();
          // La API ahora devuelve { students, total, ... }, extraemos el array
          setStudents(Array.isArray(data.students) ? data.students : (Array.isArray(data) ? data : []));
        }
      } catch (e) {
        console.error('Error fetching students');
      }
    };
    fetchStudents();
  }, []);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.documentId.includes(searchTerm)
  );

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      // 1. Subir archivos localmente (File System) si existen
      let evidenceUrls: string[] = [];
      if (files.length > 0) {
        setUploading(true);
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        if (!uploadRes.ok) {
          throw new Error('Error al subir archivos localmente');
        }
        
        const uploadData = await uploadRes.json();
        evidenceUrls = uploadData.urls;
        setUploading(false);
      }

      // 2. Crear caso en base de datos
      const caseData = {
        ...data,
        reporterId: 'system-admin', // En prod viene del auth context
        evidence: evidenceUrls,
        protocolStatus: {
          mediationDone: selectedType === 1,
          parentsNotified: selectedType > 1,
          committeeNotified: selectedType === 3,
        }
      };

      const res = await fetch('/api/convivencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(caseData),
      });

      if (res.ok) {
        setStep('SUCCESS');
      } else {
        console.error('Error al registrar el caso');
      }
    } catch (e) {
      console.error('Submit failed', e);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    const desc = watch('description');
    const type = watch('type');
    const severity = watch('severity');

    if (!desc || desc.length < 10) {
      alert('Por favor escribe al menos una breve descripción de los hechos para que la IA tenga contexto.');
      return;
    }

    setGeneratingPlan(true);
    try {
      const res = await fetch('/api/ai/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: desc, type, severity })
      });
      
      if (res.ok) {
        const data = await res.json();
        // Append the AI plan to the existing description
        setValue('description', desc + '\n\n--- PLAN DE MEJORAMIENTO (Generado por IA) ---\n' + data.plan);
      } else {
        alert('Error al generar el plan con IA.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingPlan(false);
    }
  };

  const steps: { id: Step; label: string; icon: any }[] = [
    { id: 'SELECT', label: 'Estudiante', icon: Users },
    { id: 'DETAILS', label: 'Relato', icon: FileText },
    { id: 'PROTOCOL', label: 'Protocolo', icon: ShieldCheck },
    { id: 'EVIDENCE', label: 'Evidencia', icon: Camera },
  ];

  return (
    <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-2xl">
      {/* Header / Stepper */}
      <div className="bg-slate-900 p-10 text-white">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black tracking-tight">Registro de Convivencia</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Motor de Cumplimiento Ley 1620</p>
          </div>
          <div className="hidden md:flex gap-2">
            {steps.map((s, idx) => (
              <div 
                key={s.id}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  step === s.id ? 'bg-red-600 shadow-lg shadow-red-600/40' : 'bg-white/5 text-slate-500'
                }`}
              >
                <s.icon size={18} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
            selectedType === 1 ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-white/10 text-white/40'
          }`}>Situación Tipo I</div>
          <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
            selectedType === 2 ? 'bg-amber-500 border-amber-500 text-white' : 'border-white/10 text-white/40'
          }`}>Situación Tipo II</div>
          <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
            selectedType === 3 ? 'bg-red-600 border-red-600 text-white' : 'border-white/10 text-white/40'
          }`}>Situación Tipo III</div>
        </div>
      </div>

      <div className="p-10">
        <AnimatePresence mode="wait">
          {step === 'SELECT' && (
            <motion.div 
              key="select"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                <Search className="text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar estudiante por nombre o documento..."
                  className="bg-transparent border-none outline-none w-full font-bold text-slate-700"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredStudents.map((s) => (
                  <div 
                    key={s.id}
                    onClick={() => {
                      setSelectedStudent(s);
                      setValue('studentId', s.id);
                    }}
                    className={`p-6 rounded-3xl border transition-all cursor-pointer flex items-center justify-between ${
                      selectedStudent?.id === s.id ? 'border-red-600 bg-red-50' : 'border-slate-100 hover:border-red-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-500">
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-black text-slate-900">{s.name}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.grade} · {s.documentId}</div>
                      </div>
                    </div>
                    {selectedStudent?.id === s.id && <CheckCircle2 className="text-red-600" size={20} />}
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end">
                <button 
                  disabled={!selectedStudent}
                  onClick={() => setStep('DETAILS')}
                  className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-all flex items-center gap-2 disabled:bg-slate-200"
                >
                  Siguiente Paso <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'DETAILS' && (
            <motion.div 
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="bg-red-50 p-6 rounded-3xl border border-red-100 flex gap-4">
                <Info className="text-red-600 mt-1" size={20} />
                <div>
                  <div className="text-xs font-black text-red-900 uppercase tracking-widest mb-1">Análisis de Gravedad</div>
                  <p className="text-[11px] text-red-700 leading-tight">Define si la situación es esporádica (Tipo I), repetitiva sin lesiones graves (Tipo II) o constituye un presunto delito (Tipo III).</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map(t => (
                  <button
                    key={t}
                    onClick={() => setValue('type', t)}
                    className={`py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border-2 transition-all ${
                      selectedType === t ? 'border-red-600 bg-red-600 text-white shadow-lg' : 'border-slate-100 text-slate-400 hover:border-red-200'
                    }`}
                  >
                    Tipo {t}
                  </button>
                ))}
              </div>

              <div className="space-y-2 relative">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex justify-between items-end">
                  <span>Descripción del Suceso y Compromisos</span>
                  <button
                    onClick={handleGeneratePlan}
                    disabled={generatingPlan}
                    type="button"
                    className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 transition-colors disabled:opacity-50"
                  >
                    {generatingPlan ? <Loader2 size={12} className="animate-spin" /> : <span>✨</span>}
                    {generatingPlan ? 'Redactando con IA...' : 'Redactar Plan con IA'}
                  </button>
                </label>
                <textarea 
                  {...register('description')}
                  className="w-full h-48 bg-slate-50 border border-slate-100 rounded-[2rem] p-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all resize-none"
                  placeholder="Detalla los hechos, lugar, fecha y partes involucradas. Luego, puedes presionar 'Redactar Plan con IA' para generar los compromisos."
                />
                {errors.description && <span className="text-red-600 text-[10px] font-bold ml-4">{errors.description.message}</span>}
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-between">
                <button onClick={() => setStep('SELECT')} className="text-slate-400 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:text-red-600 transition-all">
                  <ChevronLeft size={16} /> Regresar
                </button>
                <button 
                  onClick={() => setStep('PROTOCOL')}
                  className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center gap-2"
                >
                  Ver Protocolo Legal <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'PROTOCOL' && (
            <motion.div 
              key="protocol"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                  <Scale size={24} />
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-900 tracking-tight">Acciones Obligatorias</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Ruta de Atención Integral</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { text: 'Atención inmediata en salud (si aplica)', required: true },
                  { text: 'Informar a padres/acudientes', required: selectedType > 1 },
                  { text: 'Remisión a Autoridad Competente', required: selectedType === 3 },
                  { text: 'Citar Comité de Convivencia', required: selectedType > 1 },
                  { text: 'Acta de compromisos y mediación', required: true },
                ].map((item, idx) => (
                  <div key={idx} className={`p-5 rounded-3xl border flex items-center justify-between ${item.required ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-100 opacity-50'}`}>
                    <div className="flex items-center gap-4">
                      {item.required ? <CheckCircle2 className="text-emerald-500" size={18} /> : <div className="w-[18px]" />}
                      <span className="text-xs font-bold text-slate-700">{item.text}</span>
                    </div>
                    {item.required && <span className="text-[8px] font-black bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase tracking-tighter">Obligatorio</span>}
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-between">
                <button onClick={() => setStep('DETAILS')} className="text-slate-400 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:text-red-600 transition-all">
                  <ChevronLeft size={16} /> Regresar
                </button>
                <button 
                  onClick={() => setStep('EVIDENCE')}
                  className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center gap-2"
                >
                  Subir Evidencias <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'EVIDENCE' && (
            <motion.div 
              key="evidence"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div 
                className="border-4 border-dashed border-slate-100 rounded-[3rem] p-16 text-center hover:border-red-200 hover:bg-red-50/30 transition-all cursor-pointer group"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <Upload size={48} className="mx-auto text-slate-200 group-hover:text-red-600 group-hover:scale-110 transition-all mb-4" />
                <h4 className="text-lg font-black text-slate-900 mb-1">Cargar Archivos Probatorios</h4>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Fotos, Videos o Documentos (PDF)</p>
                <input 
                  id="file-upload"
                  type="file" 
                  multiple 
                  className="hidden" 
                  onChange={(e) => {
                    if (e.target.files) setFiles(Array.from(e.target.files));
                  }}
                />
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <Camera size={16} className="text-red-600" />
                        <span className="text-xs font-bold text-slate-700">{f.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-black">{(f.size / 1024).toFixed(0)} KB</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-6 border-t border-slate-100 flex justify-between">
                <button onClick={() => setStep('PROTOCOL')} className="text-slate-400 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:text-red-600 transition-all">
                  <ChevronLeft size={16} /> Regresar
                </button>
                <button 
                  onClick={handleSubmit(onSubmit)}
                  disabled={loading}
                  className="bg-red-600 text-white px-12 py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-red-700 transition-all shadow-xl shadow-red-600/20 flex items-center gap-3 disabled:bg-slate-200"
                >
                  {loading ? (
                    <> <Loader2 size={18} className="animate-spin" /> {uploading ? 'Subiendo Archivos...' : 'Registrando Caso...'} </>
                  ) : (
                    <> <ShieldCheck size={20} /> Firmar y Finalizar </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {step === 'SUCCESS' && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 space-y-8"
            >
              <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto text-white shadow-2xl shadow-emerald-500/40">
                <CheckCircle2 size={48} />
              </div>
              <div>
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">¡Caso Registrado!</h3>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Expediente almacenado inalterablemente en SGC</p>
              </div>
              <div className="pt-8">
                <button 
                  onClick={() => onComplete?.()}
                  className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-all"
                >
                  Volver al Panel Principal
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Footer Branding */}
      <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-between items-center">
        <div className="flex items-center gap-2">
           <AlertTriangle size={14} className="text-red-600" />
           <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Protocolo Seguro bajo Ley 1620 de 2013</span>
        </div>
        {institution?.logoUrl ? (
          <img 
            src={institution.logoUrl} 
            alt="Logo" 
            className="h-4 opacity-30 grayscale object-contain"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
            {institution?.displayName || institution?.name || 'SGC'}
          </span>
        )}
      </div>
    </div>
  );
}
