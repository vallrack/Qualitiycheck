'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileUp, 
  Brain, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  BarChart3, 
  ClipboardList, 
  Search, 
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  FileText,
  Trash2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

export default function DocumentIntelligence({ onTabChange }: { onTabChange?: (tab: string) => void }) {
  const [files, setFiles] = useState<{file: File, status: string, analysis?: any, error?: string}[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [isSynced, setIsSynced] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const newFiles = selectedFiles.map(f => ({ file: f, status: 'PENDIENTE' }));
    setFiles(prev => [...prev, ...newFiles]);
    e.target.value = ''; // Reset input
  };

  useEffect(() => {
    const processNext = async () => {
      if (isProcessing) return;
      
      const nextIndex = files.findIndex(f => f.status === 'PENDIENTE');
      if (nextIndex === -1) return;

      setIsProcessing(true);
      updateFileStatus(nextIndex, 'LEYENDO');

      try {
        const fileObj = files[nextIndex].file;
        let text = '';
        const extension = fileObj.name.split('.').pop()?.toLowerCase();

        if (extension === 'docx') {
          const buffer = await fileObj.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer: buffer });
          text = result.value;
        } else if (extension === 'xlsx' || extension === 'xls') {
          const buffer = await fileObj.arrayBuffer();
          const workbook = XLSX.read(buffer);
          text = workbook.SheetNames.map(name => XLSX.utils.sheet_to_txt(workbook.Sheets[name])).join('\n');
        } else if (extension === 'pdf') {
          const buffer = await fileObj.arrayBuffer();
          const pdfjs = await import('pdfjs-dist');
          pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
          const pdf = await pdfjs.getDocument({ data: buffer }).promise;
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            fullText += content.items.map((item: any) => item.str).join(' ') + '\n';
          }
          text = fullText;
        } else if (extension === 'txt' || extension === 'csv') {
          text = await fileObj.text();
        } else {
          throw new Error('Formato no soportado');
        }

        updateFileStatus(nextIndex, 'ANALIZANDO');

        const analysisPrompt = `Actúa como experto en Gestión de Calidad (SGC) e ISO 21001.
Analiza exhaustivamente este documento institucional y devuelve ÚNICAMENTE un objeto JSON válido (sin markdown, sin \`\`\`json).

El JSON debe tener EXACTAMENTE esta estructura:
{
  "classification": { "type": "CURRICULO", "confidence": 0.95, "reasoning": "razón breve", "title": "título del doc" },
  "executiveSummary": "resumen ejecutivo detallado de al menos 3 oraciones",
  "sections": [{ "title": "Título de sección", "content": "Texto completo del párrafo o sección..." }],
  "keyPoints": ["punto clave 1", "punto clave 2", "punto clave 3"],
  "entities": [{ "name": "nombre", "type": "PERSONA", "context": "contexto" }],
  "metrics": [{ "name": "nombre del KPI", "value": 0, "unit": "unidad", "context": "contexto" }],
  "tables": [{ "title": "nombre de la tabla", "headers": ["col1", "col2"], "rows": [["val1", "val2"]] }],
  "actionPlan": { "summary": "resumen del plan", "actions": [{ "task": "tarea", "responsible": "responsable", "deadline": "fecha o No especificada" }] }
}

Tipos válidos para classification.type: ACTA, INFORME, ENCUESTA, SGC_MANUAL, CURRICULO, PROCESO, OTRO
Tipos válidos para entities.type: PERSONA, FECHA, LEY_NORMA, ORGANIZACION, LUGAR, OTRO

RECONSTRUYE TODAS LAS TABLAS DEL DOCUMENTO (unidades, evaluación, semanas, etc.) en el campo "tables".
EXTRAE TODAS LAS SECCIONES DE TEXTO en "sections" para capturar el contenido completo del documento.
EXTRAE TODOS los valores numéricos como métricas.

DOCUMENTO:
${text.substring(0, 14000)}`;

        let data: any = null;

        // ── Intento 1: Puter.js (GPT-4o gratis, sin cuota) ─────────────────
        const puter = (window as any).puter;
        if (puter?.ai?.chat) {
          try {
            console.log('[Puter] Analizando con GPT-4o gratuito...');
            const response = await puter.ai.chat(analysisPrompt, { model: 'gpt-4o' });
            const rawText = typeof response === 'string' ? response : response?.message?.content?.[0]?.text ?? '';
            const clean = rawText.replace(/```json|```/g, '').trim();
            data = JSON.parse(clean);
            console.log('[Puter] ¡Éxito!');
          } catch (puterErr: any) {
            console.warn('[Puter] Falló:', puterErr.message, '— usando servidor de respaldo...');
          }
        }

        // ── Intento 2: Servidor (fallback con claves API) ───────────────────
        if (!data) {
          const res = await fetch('/api/ai/process-document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, filename: fileObj.name })
          });
          if (!res.ok) throw new Error('Fallo en servidor IA');
          data = await res.json();
        }

        updateFileStatus(nextIndex, 'LISTO', data);
        if (!selectedAnalysis) setSelectedAnalysis(data);
      } catch (err: any) {
        updateFileStatus(nextIndex, 'ERROR', null, err.message);
      } finally {
        setIsProcessing(false);
      }
    };

    processNext();
  }, [files, isProcessing]);

  const updateFileStatus = (index: number, status: string, analysis?: any, error?: string) => {
    setFiles(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], status, analysis, error };
      return copy;
    });
  };

  const handleSyncKpi = async (kpi: any, fileName: string) => {
    setSyncing(kpi.name + fileName);
    const sourceName = fileName.includes('.') ? fileName.substring(0, fileName.lastIndexOf('.')) : fileName;
    try {
      const res = await fetch('/api/ai/sync-kpi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...kpi, source: sourceName })
      });
      if (res.ok) {
        setIsSynced(true);
      } else {
        throw new Error('Fallo al sincronizar');
      }
    } catch (err) {
      alert('Error al sincronizar ' + kpi.name);
    } finally {
      setSyncing(null);
    }
  };

  const handleSyncAllQueue = async () => {
    setSyncing('ALL');
    try {
      for (const f of files) {
        if (f.status === 'LISTO' && f.analysis) {
          const sourceName = f.file.name.includes('.') ? f.file.name.substring(0, f.file.name.lastIndexOf('.')) : f.file.name;
          
          // 1. Guardar el documento completo en QualityEvidence
          await fetch('/api/ai/sync-document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: sourceName, analysis: f.analysis })
          });

          // 2. Guardar las métricas individuales en Kpi / KpiValue
          if (f.analysis.metrics) {
            for (const metric of f.analysis.metrics) {
              await fetch('/api/ai/sync-kpi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...metric, source: sourceName })
              });
            }
          }
        }
      }
      setIsSynced(true);
      alert('¡Sincronización masiva de todos los archivos completada!');
    } catch (err) {
      alert('Error en sincronización masiva');
    } finally {
      setSyncing(null);
    }
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-[100px] -mr-48 -mt-48" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-600/20 rounded-full text-red-500 text-[10px] font-black uppercase tracking-widest mb-6">
              <Brain size={14} /> Inteligencia Institucional
            </div>
            <h2 className="text-5xl font-black tracking-tighter leading-none mb-6">
              Análisis <span className="text-red-500">Documental</span> con IA.
            </h2>
            <p className="text-slate-400 text-lg font-medium leading-relaxed">
              Sube tus Cartas Descriptivas, Actas o Informes. Nuestra IA extraerá automáticamente KPIs, compromisos y resúmenes para el SGC.
            </p>
          </div>
          
          <div className="w-full md:w-auto">
            <label className={`
              cursor-pointer group relative flex flex-col items-center justify-center p-12 rounded-[2.5rem] border-2 border-dashed transition-all duration-500
              ${files.length === 0 ? 'border-slate-700 bg-slate-800/50 hover:border-red-500 hover:bg-slate-800' : 'border-red-500 bg-slate-900'}
            `}>
              <input type="file" className="hidden" onChange={handleFileSelect} multiple />
              
              <div className="text-center">
                <div className="w-20 h-20 bg-red-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-red-600/20 mb-6 mx-auto group-hover:scale-110 group-hover:rotate-6 transition-transform">
                  <FileUp size={32} />
                </div>
                <div className="text-sm font-black uppercase tracking-widest text-white">Subir Documentos</div>
                <div className="text-[10px] font-bold text-slate-500 mt-2">Puedes seleccionar varios archivos</div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Processing List */}
      {files.length > 0 && (
        <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-100 px-4 py-2 rounded-full border border-slate-200">
                {files.filter(f => f.status === 'LISTO').length} de {files.length} Procesados
              </span>
              {isProcessing && (
                <span className="text-[9px] font-bold text-red-600 animate-pulse uppercase tracking-widest">
                  Analizando uno por uno para máxima precisión...
                </span>
              )}
              <button 
                onClick={() => { setFiles([]); setSelectedAnalysis(null); setIsSynced(false); }}
                className="p-3 text-slate-400 hover:text-red-600 transition-all"
                title="Limpiar Lista"
              >
                <Trash2 size={20} />
              </button>
            </div>
            {files.some(f => f.status === 'LISTO') && (
              <div className="flex gap-4">
                {isSynced && (
                  <button 
                    onClick={() => onTabChange?.('Métricas e Indicadores')}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
                  >
                    <ArrowRight size={14} className="text-red-500" />
                    Ir a Métricas
                  </button>
                )}
                <button 
                  onClick={handleSyncAllQueue}
                  disabled={syncing === 'ALL'}
                  className="flex items-center gap-2 px-8 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-600/10"
                >
                  {syncing === 'ALL' ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
                  Sincronizar Todo el Lote
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {files.map((f, i) => (
              <div 
                key={i} 
                onClick={() => f.status === 'LISTO' && setSelectedAnalysis(f.analysis)}
                className={`p-6 rounded-3xl border transition-all cursor-pointer ${
                  f.status === 'LISTO' ? 'bg-slate-50 border-slate-100 hover:border-red-200 hover:shadow-md' : 'bg-slate-50/50 border-slate-100 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${f.status === 'LISTO' ? 'bg-emerald-100 text-emerald-600' : f.status === 'ERROR' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                      <FileText size={20} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">{f.file.name}</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Estado: {f.status}
                      </div>
                    </div>
                  </div>
                  
                  {f.status === 'LISTO' && f.analysis?.metrics && (
                    <div className="flex gap-2">
                       {f.analysis.metrics.slice(0, 5).map((m: any, mi: number) => (
                         <span key={mi} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-black text-slate-500 uppercase">
                           {m.name}: {m.value}
                         </span>
                       ))}
                    </div>
                  )}

                  {f.status === 'LEYENDO' || f.status === 'ANALIZANDO' ? (
                    <Loader2 size={20} className="animate-spin text-red-600" />
                  ) : f.status === 'LISTO' ? (
                    <CheckCircle2 size={20} className="text-emerald-500" />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results Section */}
      <AnimatePresence>
        {selectedAnalysis && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="grid lg:grid-cols-3 gap-8">
            
            {/* Classification & Summary */}
            <div className="lg:col-span-1 space-y-8">
              <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                   <div className="p-3 bg-red-600 rounded-2xl text-white"><ShieldCheck size={24} /></div>
                   <div>
                      <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Documento Identificado</div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">{selectedAnalysis.classification.type}</h3>
                   </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Resumen Ejecutivo</p>
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-sm text-slate-600 font-medium leading-relaxed">{selectedAnalysis.executiveSummary}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Puntos Clave</p>
                    <ul className="space-y-2">
                      {selectedAnalysis.keyPoints?.map((point: string, i: number) => (
                        <li key={i} className="flex gap-2 text-xs text-slate-600 font-medium">
                          <span className="text-red-500 font-black">•</span> {point}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {selectedAnalysis.entities?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Entidades Detectadas</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedAnalysis.entities.map((ent: any, i: number) => (
                          <span key={i} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase border border-blue-100" title={ent.context}>
                            {ent.name} ({ent.type})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sections Display */}
                {selectedAnalysis.sections && selectedAnalysis.sections.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                      <FileText size={14} className="text-blue-500" />
                      Contenido Extraído (Editable)
                    </h4>
                    <div className="space-y-4">
                      {selectedAnalysis.sections.map((sec: any, idx: number) => (
                        <div key={idx} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                          <input 
                            className="text-sm font-bold text-slate-800 bg-transparent border-none w-full p-0 focus:ring-0 mb-2" 
                            value={sec.title ?? ''}
                            onChange={(e) => {
                              const newSections = [...selectedAnalysis.sections];
                              newSections[idx].title = e.target.value;
                              setSelectedAnalysis({...selectedAnalysis, sections: newSections});
                            }}
                          />
                          <textarea 
                            className="text-sm text-slate-600 bg-transparent border-none w-full p-0 focus:ring-0 resize-y min-h-[60px]" 
                            value={sec.content ?? ''}
                            onChange={(e) => {
                              const newSections = [...selectedAnalysis.sections];
                              newSections[idx].content = e.target.value;
                              setSelectedAnalysis({...selectedAnalysis, sections: newSections});
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                   <span className="text-[10px] font-black uppercase text-slate-400">Confianza IA</span>
                   <span className="text-sm font-black text-red-600">{(selectedAnalysis.classification.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>

            {/* Metrics & KPIs Table */}
            <div className="lg:col-span-2 space-y-8">
               <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm min-h-full">
                  <div className="flex justify-between items-center mb-10">
                     <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><BarChart3 size={24} /></div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Métricas Extraídas (Editables)</h3>
                     </div>
                     <div className="flex items-center gap-4">
                        {isSynced && (
                          <button 
                            onClick={() => onTabChange?.('Métricas e Indicadores')}
                            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
                          >
                            <ArrowRight size={14} className="text-red-500" />
                            Ir a Métricas
                          </button>
                        )}
                        <span className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                          {selectedAnalysis.metrics.length} Hallados
                        </span>
                     </div>
                  </div>

                  {selectedAnalysis.metrics.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-300">
                       <Search size={48} className="mb-4 opacity-20" />
                       <p className="text-xs font-black uppercase tracking-widest">No se detectaron métricas cuantitativas</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-separate border-spacing-y-4">
                        <thead>
                          <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            <th className="px-6 pb-2">Nombre del Indicador</th>
                            <th className="px-6 pb-2">Valor</th>
                            <th className="px-6 pb-2">Unidad</th>
                            <th className="px-6 pb-2">Contexto / Fuente</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedAnalysis.metrics.map((metric: any, i: number) => (
                            <motion.tr 
                              initial={{ opacity: 0, x: -10 }} 
                              animate={{ opacity: 1, x: 0 }} 
                              transition={{ delay: i * 0.05 }}
                              key={i} 
                              className="bg-slate-50 hover:bg-white hover:shadow-md transition-all group border border-transparent hover:border-slate-200"
                            >
                              <td className="px-6 py-5 rounded-l-2xl">
                                <input 
                                  type="text" 
                                  value={metric.name ?? ''} 
                                  onChange={(e) => {
                                    const newMetrics = [...selectedAnalysis.metrics];
                                    newMetrics[i].name = e.target.value;
                                    setSelectedAnalysis({...selectedAnalysis, metrics: newMetrics});
                                  }}
                                  className="bg-transparent border-none font-bold text-slate-800 focus:ring-0 w-full p-0"
                                />
                              </td>
                              <td className="px-6 py-5">
                                <input 
                                  type="number" 
                                  value={metric.value ?? 0} 
                                  onChange={(e) => {
                                    const newMetrics = [...selectedAnalysis.metrics];
                                    newMetrics[i].value = Number(e.target.value);
                                    setSelectedAnalysis({...selectedAnalysis, metrics: newMetrics});
                                  }}
                                  className="bg-transparent border-none font-black text-red-600 focus:ring-0 w-20 p-0"
                                />
                              </td>
                              <td className="px-6 py-5">
                                <input 
                                  type="text" 
                                  value={metric.unit ?? ''} 
                                  onChange={(e) => {
                                    const newMetrics = [...selectedAnalysis.metrics];
                                    newMetrics[i].unit = e.target.value;
                                    setSelectedAnalysis({...selectedAnalysis, metrics: newMetrics});
                                  }}
                                  className="bg-transparent border-none text-[10px] font-black text-slate-400 uppercase focus:ring-0 w-16 p-0"
                                />
                              </td>
                              <td className="px-6 py-5 rounded-r-2xl">
                                <p className="text-xs text-slate-500 italic max-w-xs truncate" title={metric.context ?? ''}>
                                  {metric.context ?? ''}
                                </p>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Dynamic Tables from Document */}
                  {selectedAnalysis.tables?.length > 0 && (
                    <div className="mt-16 space-y-12">
                      <div className="flex items-center gap-3 mb-4">
                         <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl"><ClipboardList size={24} /></div>
                         <div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Tablas del Documento</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estructuras originales reconstruidas por IA</p>
                         </div>
                      </div>

                      {selectedAnalysis.tables.map((table: any, tIndex: number) => (
                        <div key={tIndex} className="bg-slate-50/50 rounded-[2.5rem] border border-slate-100 p-8">
                           <h4 className="text-sm font-black text-slate-800 mb-6 uppercase tracking-widest flex items-center gap-2">
                             <div className="w-2 h-2 bg-purple-500 rounded-full" /> {table.title}
                           </h4>
                           <div className="overflow-x-auto">
                             <table className="w-full text-left border-collapse">
                               <thead>
                                 <tr>
                                   {table.headers.map((header: string, hIndex: number) => (
                                     <th key={hIndex} className="bg-slate-900 text-white p-4 text-[9px] font-black uppercase tracking-widest first:rounded-tl-xl last:rounded-tr-xl border border-slate-800">
                                       {header}
                                     </th>
                                   ))}
                                 </tr>
                               </thead>
                               <tbody>
                                 {table.rows.map((row: string[], rIndex: number) => (
                                   <tr key={rIndex} className="bg-white hover:bg-slate-50 transition-colors">
                                     {row.map((cell: string, cIndex: number) => (
                                       <td key={cIndex} className="p-0 border border-slate-200">
                                         <textarea 
                                           value={cell ?? ''} 
                                           onChange={(e) => {
                                             const newTables = [...selectedAnalysis.tables];
                                             newTables[tIndex].rows[rIndex][cIndex] = e.target.value;
                                             setSelectedAnalysis({...selectedAnalysis, tables: newTables});
                                           }}
                                           className="w-full p-4 text-xs text-slate-600 font-medium bg-transparent border-none focus:ring-2 focus:ring-purple-500/20 min-h-[60px] resize-none"
                                         />
                                       </td>
                                     ))}
                                   </tr>
                                 ))}
                               </tbody>
                             </table>
                           </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-12 pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-white">
                           <Zap size={20} />
                        </div>
                        <div>
                           <p className="text-sm font-black text-slate-900 tracking-tight">IA Generativa en Acción</p>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Análisis realizado con GPT-4o</p>
                        </div>
                     </div>
                     <button 
                       onClick={() => setSelectedAnalysis(null)}
                       className="px-8 py-4 bg-slate-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 hover:text-slate-600 transition-all flex items-center gap-2"
                     >
                        <X size={16} /> Cerrar Detalle
                     </button>
                  </div>
               </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {files.length === 0 && (
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Search, title: 'Búsqueda Inteligente', desc: 'Identifica patrones complejos y datos ocultos en segundos.' },
            { icon: Sparkles, title: 'Enriquecimiento Automático', desc: 'Categoriza y estructura la información para cumplimiento ISO.' },
            { icon: ShieldCheck, title: 'Validación de Calidad', desc: 'Asegura que la evidencia documental sea consistente y veraz.' }
          ].map((feat, i) => (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }} key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 mb-6">
                <feat.icon size={24} />
              </div>
              <h4 className="text-lg font-black text-slate-900 tracking-tight mb-2">{feat.title}</h4>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
