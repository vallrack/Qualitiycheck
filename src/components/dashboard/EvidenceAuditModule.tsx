'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileCheck, 
  Upload, 
  Bot, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Search,
  BookOpen
} from 'lucide-react';

export default function EvidenceAuditModule() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const [title, setTitle] = useState('');
  const [type, setType] = useState('CURRICULUM');
  const [standard, setStandard] = useState('ISO 21001');
  const [contentExtracted, setContentExtracted] = useState('');

  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/quality/evidence-history'); // we will implement this or mock it
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMockData = () => {
    setTitle('Diseño Curricular - Técnico en Sistemas V2');
    setType('CURRICULUM');
    setStandard('NTC 5581');
    setContentExtracted(`
      OBJETIVO DEL PROGRAMA: Formar técnicos con alta competencia laboral en el mantenimiento de equipos de cómputo.
      PERFIL DE INGRESO: Estudiantes de grado 10 con afinidad tecnológica.
      METODOLOGÍA: El 70% del programa se desarrollará mediante taller práctico en los laboratorios de Ciudad Don Bosco. El 30% restante será teoría enfocada en la competencia específica de redes.
      EVALUACIÓN: Se evaluará mediante la entrega de proyectos prácticos y resolución de problemas de hardware.
    `);
  };

  const handleAnalyze = async () => {
    if (!title || contentExtracted.length < 20) {
      alert('Por favor provea un título y el contenido extraído del documento.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/ai/evaluate-evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, type, contentExtracted, standard })
      });
      
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        // Add to local history optimistically
        setHistory([data, ...history]);
      } else {
        alert(data.error || 'Error al evaluar');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Left Side: Upload & Input */}
        <div className="flex-1 bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-600/20">
              <Bot size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-800">Auditoría Documental Universal</h2>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">IA Evaluadora de Normativas</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Título del Documento</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 transition-all"
                  placeholder="Ej: Encuesta Satisfacción 2026"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Norma a Evaluar</label>
                <select 
                  value={standard}
                  onChange={e => setStandard(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 transition-all"
                >
                  <option value="ISO 21001">ISO 21001 (Calidad Educativa)</option>
                  <option value="NTC 5555">NTC 5555 (Sistemas de Gestión ETDH)</option>
                  <option value="NTC 5581">NTC 5581 (Programas ETDH)</option>
                  <option value="Ley 1620">Ley 1620 (Convivencia Escolar)</option>
                </select>
              </div>
            </div>

            <div className="border-2 border-dashed border-slate-200 rounded-[2rem] p-6 text-center hover:border-indigo-300 hover:bg-indigo-50/50 transition-all">
              <Upload className="mx-auto text-slate-300 mb-2" size={32} />
              <p className="text-sm font-bold text-slate-600 mb-1">Cargar PDF o Excel (Simulado)</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">O pega el texto directamente abajo</p>
              <button onClick={handleMockData} className="mt-4 text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline">
                [ Autocompletar con Ejemplo Práctico ]
              </button>
            </div>

            <div>
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Texto Extraído del Documento</label>
               <textarea 
                  value={contentExtracted}
                  onChange={e => setContentExtracted(e.target.value)}
                  className="w-full h-40 bg-slate-50 border border-slate-100 rounded-[2rem] p-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all resize-none"
                  placeholder="Pega aquí el contenido a analizar por la IA..."
               />
            </div>

            <button 
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full bg-slate-900 text-white px-8 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl disabled:bg-slate-300 flex justify-center items-center gap-3"
            >
              {loading ? <span className="animate-pulse">Analizando con IA...</span> : <><FileCheck size={20} /> Iniciar Auditoría de Cumplimiento</>}
            </button>
          </div>
        </div>

        {/* Right Side: Results */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div 
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-bl-[100px] -z-10" />
                
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-black text-slate-800">Reporte de Auditoría IA</h3>
                    <p className="text-[10px] font-black uppercase text-indigo-500 tracking-widest mt-1">Nivel de Cumplimiento</p>
                  </div>
                  <div className={`text-5xl font-black ${result.complianceScore >= 80 ? 'text-emerald-500' : result.complianceScore >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                    {result.complianceScore}%
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Search size={14} /> Hallazgos (Conformidades y No Conformidades)
                    </h4>
                    <div className="space-y-2">
                      {result.aiAnalysis?.findings?.map((f: string, i: number) => (
                        <div key={i} className={`p-4 rounded-2xl text-sm font-medium border ${f.includes('✅') ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>

                  {result.aiAnalysis?.recommendations?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <AlertTriangle size={14} /> Plan de Acción Recomendado
                      </h4>
                      <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600 font-medium">
                        {result.aiAnalysis.recommendations.map((r: string, i: number) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="h-full bg-slate-50 rounded-[2.5rem] border border-slate-200 border-dashed flex flex-col items-center justify-center p-12 text-center text-slate-400">
                <BookOpen size={64} className="mb-4 opacity-20" />
                <h3 className="text-lg font-black text-slate-600 mb-2">Esperando Documento</h3>
                <p className="text-sm font-medium max-w-sm">Sube una evidencia y haz clic en "Iniciar Auditoría" para que el motor de IA evalúe el grado de cumplimiento normativo.</p>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
