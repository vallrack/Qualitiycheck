'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText, Search, Plus, Filter, FileCheck, FileX, Clock, PenTool, AlertCircle, Eye, HelpCircle, X, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function QualityDocumentModule() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [docToSign, setDocToSign] = useState<any | null>(null);

  const helpInstructions = [
    { title: 'Sincronizar', text: 'Usa este botón para restaurar documentos que ya existen en las carpetas del servidor.' },
    { title: 'Nuevo Registro', text: 'Permite crear un registro manual o subir archivos físicos (PDF/Excel) en masa.' },
    { title: 'Flujo de Aprobación', text: 'Los documentos nuevos entran "EN REVISIÓN". Deben ser aprobados mediante Firma Digital para pasar a "VIGENTE".' },
    { title: 'Versiones', text: 'El sistema controla la versión (V1, V2...). Al subir uno nuevo, asegúrate de actualizar este campo.' }
  ];

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Error al cargar documentos');
      }
    } catch (e) {
      console.error(e);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleSync = async () => {
    setLoading(true);
    try {
      await fetch('/api/documents?sync=true');
      fetchDocuments();
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCreate = async (formData: any) => {
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowAddForm(false);
        fetchDocuments();
      }
    } catch (e) { console.error(e); }
  };

  const handleApprove = (doc: any) => {
    setDocToSign(doc);
    setShowSignaturePad(true);
  };

  const filteredDocs = documents.filter(d => 
    d.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredDocs.map(d => ({
      Código: d.code, Título: d.title, Tipo: d.type, Versión: d.version, Estado: d.status
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Documentos');
    XLSX.writeFile(wb, `maestro_documentos_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Listado Maestro de Documentos', 14, 20);
    autoTable(doc, {
      startY: 30,
      head: [['Código', 'Título', 'Tipo', 'Versión', 'Estado']],
      body: filteredDocs.map(d => [d.code, d.title, d.type, d.version, d.status])
    });
    doc.save(`maestro_documentos_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-800 flex items-center gap-2">
              <FileText className="text-red-600" /> Listado Maestro de Documentos
            </h2>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Cumplimiento NTC 5555 & ISO 21001</p>
          </div>
          
          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por código o título..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-red-600 transition-all"
              />
            </div>
            <button 
              onClick={() => setShowHelp(true)}
              className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition-all border border-blue-100"
              title="Instrucciones de Uso"
            >
              <HelpCircle size={24} />
            </button>
            <button 
              onClick={handleSync}
              className="bg-slate-900 text-white px-4 rounded-2xl hover:bg-slate-800 transition-all shadow-md flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hidden lg:flex"
              title="Restaurar Normas desde Archivos"
            >
              <Filter size={18} /> Sync
            </button>
            <button onClick={exportExcel} className="hidden lg:flex items-center gap-2 px-4 py-3 bg-emerald-50 text-emerald-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-100 transition-all border border-emerald-100">
              <FileSpreadsheet size={16} /> Excel
            </button>
            <button onClick={exportPDF} className="hidden lg:flex items-center gap-2 px-4 py-3 bg-rose-50 text-rose-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-rose-100 transition-all border border-rose-100">
              <FileText size={16} /> PDF
            </button>
            <button 
              onClick={() => setShowAddForm(true)}
              className="bg-red-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-600/20 flex items-center gap-2"
            >
              <Plus size={16} /> Nuevo Documento
            </button>
          </div>
        </div>

        {showHelp && (
          <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[2.5rem] max-w-2xl w-full p-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8">
                <button onClick={() => setShowHelp(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} className="text-slate-400" /></button>
              </div>
              
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg"><HelpCircle size={32} /></div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800">Guía de Operación</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Módulo: Listado Maestro de Documentos</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {helpInstructions.map((item, i) => (
                  <div key={i} className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <h4 className="text-sm font-black text-red-600 mb-2 uppercase tracking-tight">{item.title}</h4>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-10 p-6 bg-red-600 rounded-3xl text-white">
                <p className="text-xs font-black uppercase tracking-widest mb-1">💡 Tip de Calidad</p>
                <p className="text-[11px] font-medium leading-relaxed opacity-90">Según la norma ISO 9001, todos los documentos deben ser legibles e identificables. Mantener el Listado Maestro actualizado es el corazón de la auditoría.</p>
              </div>
            </motion.div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 p-4 rounded-2xl mb-6 flex items-center gap-3 text-red-600 font-bold text-sm">
            <AlertCircle size={20} />
            {error}
            <button onClick={fetchDocuments} className="ml-auto bg-red-600 text-white px-3 py-1 rounded-lg text-xs">Reintentar</button>
          </div>
        )}

        {/* Documents Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-widest text-slate-400">
                <th className="pb-4 pl-4">Código</th>
                <th className="pb-4">Título del Documento</th>
                <th className="pb-4">Versión</th>
                <th className="pb-4">Área</th>
                <th className="pb-4">Estado</th>
                <th className="pb-4 text-right pr-4">Acciones (Workflow)</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-400 font-bold">Cargando maestro documental...</td></tr>
              ) : filteredDocs.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-300 font-bold uppercase tracking-widest text-xs">No hay documentos registrados. Use "Sincronizar" o "Nuevo".</td></tr>
              ) : filteredDocs.map((doc, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={doc.id} 
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors group"
                >
                  <td className="py-4 pl-4 font-black text-slate-700">{doc.code}</td>
                  <td className="py-4 font-bold text-slate-900">{doc.title}</td>
                  <td className="py-4 font-bold text-slate-500 whitespace-nowrap">
                    <span className="bg-slate-200 text-slate-700 px-2 py-1 rounded text-xs">{doc.version}</span>
                  </td>
                  <td className="py-4 font-bold text-slate-500">{doc.area}</td>
                  <td className="py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      doc.status === 'VIGENTE' ? 'bg-green-100 text-green-700' : 
                      doc.status === 'EN_REVISION' ? 'bg-yellow-100 text-yellow-700' : 
                      'bg-red-100 text-red-700'
                    }`}>
                      {doc.status === 'VIGENTE' && <FileCheck size={12} />}
                      {doc.status === 'EN_REVISION' && <Clock size={12} />}
                      {doc.status === 'OBSOLETO' && <FileX size={12} />}
                      {doc.status}
                    </span>
                  </td>
                  <td className="py-4 pr-4">
                    <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      {doc.status === 'EN_REVISION' && (
                        <button 
                          onClick={() => handleApprove(doc)}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-blue-600 hover:text-white transition-all"
                        >
                          <PenTool size={14} /> Aprobar (Firma)
                        </button>
                      )}
                      {doc.physicalPath && (
                        <button 
                          onClick={() => window.open(doc.physicalPath, '_blank')}
                          className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all flex items-center gap-1"
                        >
                          <Eye size={14} /> Ver
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[2rem] max-w-lg w-full p-8 shadow-2xl">
            <h3 className="text-xl font-black text-slate-800 mb-6 uppercase tracking-tight">Nuevo Registro Maestro</h3>
            <AddDocumentForm onSubmit={handleCreate} onCancel={() => setShowAddForm(false)} />
          </motion.div>
        </div>
      )}

      {showSignaturePad && (
        <SignatureModal doc={docToSign} onClose={() => setShowSignaturePad(false)} onRefresh={fetchDocuments} />
      )}
    </div>
  );
}

function AddDocumentForm({ onSubmit, onCancel }: { onSubmit: (data: any) => void, onCancel: () => void }) {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  const [form, setForm] = useState({ code: '', title: '', area: 'Gestión de Calidad', version: 'V1' });
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);

  const handleBulkUpload = async () => {
    // For each file, we create a record and upload the physical file
    for (const file of bulkFiles) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('code', `DOC-${file.name.split('.')[0].toUpperCase().slice(0, 10)}`);
      formData.append('title', file.name.split('.')[0].replace(/-/g, ' '));
      formData.append('area', 'Gestión de Calidad');
      formData.append('version', 'V1');

      try {
        await fetch('/api/documents', {
          method: 'POST',
          body: formData // No headers needed for FormData, browser sets it automatically
        });
      } catch (e) {
        console.error('Error uploading file:', file.name, e);
      }
    }
    onSubmit(null); // Just to trigger a refresh and close form
  };

  return (
    <div className="space-y-6">
      <div className="flex border-b border-slate-100">
        <button 
          onClick={() => setActiveTab('single')}
          className={`flex-1 pb-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'single' ? 'text-red-600 border-b-2 border-red-600' : 'text-slate-400'}`}
        >
          Individual
        </button>
        <button 
          onClick={() => setActiveTab('bulk')}
          className={`flex-1 pb-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'bulk' ? 'text-red-600 border-b-2 border-red-600' : 'text-slate-400'}`}
        >
          Masivo (Excel/PDF)
        </button>
      </div>

      {activeTab === 'single' ? (
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Código</label>
            <input 
              type="text" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" placeholder="EJ: PR-CAL-01"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Título</label>
            <input 
              type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" placeholder="Nombre del proceso o documento"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Área Institucional</label>
            <select 
              value={form.area} onChange={e => setForm({...form, area: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold"
            >
              <option>Gestión de Calidad</option>
              <option>Gestión Académica</option>
              <option>Gestión Directiva</option>
              <option>Diseño Curricular</option>
            </select>
          </div>
          <div className="flex gap-4 pt-4">
            <button onClick={onCancel} className="flex-1 py-3 font-bold text-slate-400 uppercase text-xs tracking-widest">Cancelar</button>
            <button onClick={() => onSubmit(form)} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-red-600/20">Guardar</button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-slate-200 rounded-[2rem] p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
            <input 
              type="file" multiple className="hidden" id="bulk-doc-input" 
              onChange={e => setBulkFiles(Array.from(e.target.files || []))}
            />
            <label htmlFor="bulk-doc-input" className="cursor-pointer space-y-4 block">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto text-red-600">
                <Plus size={32} />
              </div>
              <div>
                <p className="text-sm font-black text-slate-700 uppercase tracking-tight">Seleccionar Archivos</p>
                <p className="text-xs font-bold text-slate-400 mt-1">Sube múltiples PDF o Excel para registrar en masa</p>
              </div>
            </label>
          </div>
          
          {bulkFiles.length > 0 && (
            <div className="bg-white border border-slate-100 rounded-2xl p-4 max-h-40 overflow-y-auto space-y-2">
              {bulkFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-3 text-xs font-bold text-slate-600">
                  <FileText size={14} className="text-red-600" /> {f.name}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button onClick={onCancel} className="flex-1 py-3 font-bold text-slate-400 uppercase text-xs tracking-widest">Cancelar</button>
            <button 
              disabled={bulkFiles.length === 0}
              onClick={handleBulkUpload} 
              className="flex-1 py-3 bg-red-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-red-600/20 disabled:bg-slate-200"
            >
              Registrar {bulkFiles.length} Archivos
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component for Digital Signature
function SignatureModal({ doc, onClose, onRefresh }: { doc: any, onClose: () => void, onRefresh?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
  }, []);

  const startDrawing = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const approveDocument = async () => {
    try {
      const res = await fetch('/api/documents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: doc.id, status: 'VIGENTE' })
      });
      if (res.ok) {
        onClose();
        if (onRefresh) onRefresh();
      }
    } catch (e) { console.error(e); }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-6">
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[2rem] max-w-xl w-full p-8 shadow-2xl">
        <h3 className="text-xl font-black text-slate-800 mb-2">Aprobación mediante Firma</h3>
        <p className="text-sm text-slate-500 mb-6 font-medium">Validación para el documento: <strong className="text-red-600">{doc?.code} - {doc?.title}</strong></p>
        
        <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl overflow-hidden mb-4 relative">
          <canvas
            ref={canvasRef}
            width={500}
            height={200}
            className="w-full bg-transparent cursor-crosshair"
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerOut={stopDrawing}
          />
          <div className="absolute bottom-2 left-4 text-[10px] text-slate-300 uppercase tracking-widest font-black pointer-events-none">
            [ PAD DE FIRMA MANUSCRITA ]
          </div>
        </div>

        <div className="flex justify-between">
          <button onClick={clearSignature} className="text-slate-500 font-bold text-sm hover:text-slate-800 uppercase tracking-widest">
            Limpiar Pad
          </button>
          <div className="flex gap-4">
            <button onClick={onClose} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all uppercase text-xs tracking-widest">
              Cancelar
            </button>
            <button onClick={approveDocument} className="px-6 py-3 font-black text-white bg-green-600 hover:bg-green-700 rounded-xl transition-all shadow-lg shadow-green-600/20 uppercase text-xs tracking-widest flex items-center gap-2">
              <FileCheck size={16} /> Procesar Firma
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
