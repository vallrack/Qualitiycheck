'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Search, Filter, X, ChevronLeft, ChevronRight,
  AlertTriangle, Edit2, Save, FileText, Loader2, Calendar,
  CheckCircle2, XCircle, Activity, User, Eye
} from 'lucide-react';
import { generateConvivenciaAct } from '@/lib/pdf-export';

export default function ConvivenciaModule() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ status: '', closureNotes: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      // Usaremos la ruta existente que escupe todos los casos
      const res = await fetch('/api/convivencia');
      let data = await res.json();
      
      // Guard: ensure data is always an array
      if (!Array.isArray(data)) {
        console.warn('[ConvivenciaModule] API did not return an array:', data);
        data = [];
      }

      if (search) {
        data = data.filter((c: any) => 
          c.student?.name?.toLowerCase().includes(search.toLowerCase()) || 
          c.description?.toLowerCase().includes(search.toLowerCase())
        );
      }
      if (statusFilter) {
        data = data.filter((c: any) => c.status === statusFilter);
      }
      if (typeFilter) {
        data = data.filter((c: any) => c.type?.toString() === typeFilter);
      }

      setCases(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter]);

  useEffect(() => {
    const t = setTimeout(() => { fetchCases(); }, 350);
    return () => clearTimeout(t);
  }, [search, statusFilter, typeFilter, fetchCases]);

  const startEdit = (c: any) => {
    setEditingId(c.id);
    const existingNotes = c.protocolStatus?.closureNotes || '';
    setEditForm({ status: c.status, closureNotes: existingNotes });
  };

  const saveEdit = async (id: string, currentCase: any) => {
    setSaving(true);
    try {
      const payload = {
         status: editForm.status,
         protocolStatus: {
           ...(currentCase.protocolStatus || {}),
           closureNotes: editForm.closureNotes
         }
      };

      const res = await fetch(`/api/convivencia/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast('Caso actualizado exitosamente');
        setEditingId(null);
        fetchCases();
      } else {
        const d = await res.json();
        showToast(d.error || 'Error al actualizar', 'err');
      }
    } finally {
      setSaving(false);
    }
  };

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

      {/* Evidence Viewer Modal */}
      <AnimatePresence>
        {selectedEvidence && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-10"
            onClick={() => setSelectedEvidence(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="relative max-w-5xl w-full bg-white rounded-[3rem] overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <img src={selectedEvidence} alt="Evidencia" className="w-full h-auto max-h-[80vh] object-contain bg-slate-100" />
            </motion.div>
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
              className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-slate-900 p-8 text-white">
                <h4 className="text-xl font-black tracking-tight">Resolución del Caso</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Modificar estado y añadir conclusiones</p>
              </div>
              <div className="p-8 space-y-4">
                <div>
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Estado del Caso</label>
                   <select
                     value={editForm.status}
                     onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                     className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-600/20"
                   >
                     <option value="OPEN">Abierto (En Proceso)</option>
                     <option value="CLOSED">Cerrado (Concluido)</option>
                   </select>
                </div>
                <div>
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Observaciones / Sanciones Aplicadas (Resolución)</label>
                   <textarea
                     value={editForm.closureNotes}
                     onChange={(e) => setEditForm(prev => ({ ...prev, closureNotes: e.target.value }))}
                     placeholder="Ej: Se llegó a un acuerdo. Suspensión de 3 días..."
                     className="w-full h-32 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-600/20 resize-none"
                   />
                </div>
                
                <div className="flex gap-4 pt-4">
                  <button onClick={() => setEditingId(null)} className="flex-1 py-4 rounded-2xl border-2 border-slate-100 font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all">Cancelar</button>
                  <button onClick={() => saveEdit(editingId, cases.find(c => c.id === editingId))} disabled={saving} className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Actualizar Caso
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-slate-900 rounded-2xl text-white shadow-xl">
            <Activity size={28} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Comité de Convivencia</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
              Ley 1620 · {cases.length} Casos Encontrados
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-[2rem] p-6 flex flex-wrap gap-4 items-center shadow-sm">
        <div className="flex-1 min-w-[220px] relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por estudiante o relato..."
            className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-300"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
        >
          <option value="">Cualquier Estado</option>
          <option value="OPEN">Abiertos</option>
          <option value="CLOSED">Cerrados</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
        >
          <option value="">Cualquier Tipo</option>
          <option value="1">Tipo 1</option>
          <option value="2">Tipo 2</option>
          <option value="3">Tipo 3</option>
        </select>
        {(search || statusFilter || typeFilter) && (
          <button onClick={() => { setSearch(''); setStatusFilter(''); setTypeFilter(''); }} className="flex items-center gap-1 text-xs font-black text-red-600 hover:underline uppercase tracking-widest">
            <X size={14} /> Limpiar
          </button>
        )}
      </div>

      {/* Data Grip / Cards */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400 bg-white rounded-[3rem]">
          <Loader2 size={40} className="animate-spin mb-4" />
          <p className="text-xs font-black uppercase tracking-widest">Cargando expedientes...</p>
        </div>
      ) : cases.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-300 bg-white rounded-[3rem]">
          <ShieldCheck size={52} className="mb-4" />
          <p className="text-sm font-black uppercase tracking-widest text-slate-400">
            No hay casos reportados bajo estos filtros
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
           {cases.map((c, idx) => (
             <motion.div 
               key={c.id}
               initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
               className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col"
             >
                <div className="flex justify-between items-start mb-6">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-600">
                         <User size={20} />
                      </div>
                      <div>
                         <h4 className="font-black text-slate-900 text-lg leading-tight">{c.student.name}</h4>
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Grado {c.student.grade} · DOC {c.student.documentId}
                         </span>
                      </div>
                   </div>
                   <div className="flex flex-col items-end gap-2">
                       <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                          c.status === 'OPEN' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                       }`}>
                          {c.status === 'OPEN' ? 'Abierto' : 'Cerrado'}
                       </span>
                       <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-slate-100 text-slate-600`}>
                          TIPO {c.type}
                       </span>
                   </div>
                </div>

                <div className="flex-1 bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-6">
                   <p className="text-sm text-slate-600 leading-relaxed font-medium line-clamp-3">
                      "{c.description}"
                   </p>
                   {c.protocolStatus?.closureNotes && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                         <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 block mb-1">Resolución Final</span>
                         <p className="text-xs text-slate-500 font-medium">"{c.protocolStatus.closureNotes}"</p>
                      </div>
                   )}
                </div>

                <div className="flex items-center justify-between mt-auto">
                   <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-widest">
                      <Calendar size={12} /> {new Date(c.createdAt).toLocaleDateString()}
                   </div>
                   <div className="flex items-center gap-2">
                      <button
                         onClick={() => generateConvivenciaAct(c)}
                         className="p-2 py-2.5 px-4 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all flex items-center gap-2 text-[10px] uppercase font-black tracking-widest shadow-lg shadow-slate-900/20"
                      >
                         <FileText size={14} /> Acta
                      </button>
                      <button
                         onClick={() => startEdit(c)}
                         className="p-2 py-2.5 px-4 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all flex items-center gap-2 text-[10px] uppercase font-black tracking-widest"
                      >
                         <Edit2 size={14} /> Gestionar
                      </button>
                      {c.evidence && c.evidence.length > 0 && (
                         <button
                           onClick={() => setSelectedEvidence(c.evidence[0])}
                           className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all shadow-sm"
                           title="Ver Evidencia"
                         >
                           <Eye size={14} />
                         </button>
                      )}
                   </div>
                </div>
             </motion.div>
           ))}
        </div>
      )}
    </div>
  );
}
