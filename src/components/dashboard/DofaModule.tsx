'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  FileUp, 
  Download, 
  Search, 
  ShieldCheck, 
  AlertTriangle, 
  Target, 
  Zap,
  Loader2,
  FileText,
  X,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';

type DofaType = 'FORTALEZA' | 'DEBILIDAD' | 'OPORTUNIDAD' | 'AMENAZA';

interface DofaItem {
  id: string;
  type: DofaType;
  description: string;
  category: string;
  priority: string;
}

export default function DofaModule() {
  const [items, setItems] = useState<DofaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [showAddModal, setShowAddModal] = useState<DofaType | null>(null);
  const [newItem, setNewItem] = useState({ description: '', category: 'GENERAL', priority: 'NORMAL' });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dofa');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Error fetching DOFA:', error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (type: DofaType) => {
    if (!newItem.description.trim()) return;

    try {
      const res = await fetch('/api/dofa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newItem, type })
      });
      if (res.ok) {
        setShowAddModal(null);
        setNewItem({ description: '', category: 'GENERAL', priority: 'NORMAL' });
        fetchItems();
      }
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const res = await fetch('/api/dofa', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) fetchItems();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      let rawItems: any[] = [];

      if (extension === 'xlsx' || extension === 'xls') {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(worksheet);
        
        rawItems = json.map((row: any) => ({
          type: String(row.Tipo || row.TYPE || '').toUpperCase().includes('FORTALEZA') ? 'FORTALEZA' :
                String(row.Tipo || row.TYPE || '').toUpperCase().includes('DEBILIDAD') ? 'DEBILIDAD' :
                String(row.Tipo || row.TYPE || '').toUpperCase().includes('OPORTUNIDAD') ? 'OPORTUNIDAD' : 'AMENAZA',
          description: row.Descripcion || row.Description || row.TEXTO || '',
          category: row.Categoria || row.Category || 'GENERAL'
        }));
      } else if (extension === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        const text = result.value;
        
        // Simple heuristic classification for DOCX
        const lines = text.split('\n').filter(l => l.trim().length > 10);
        let currentType: DofaType = 'FORTALEZA';
        
        lines.forEach(line => {
          const upper = line.toUpperCase();
          if (upper.includes('FORTALEZA')) currentType = 'FORTALEZA';
          else if (upper.includes('DEBILIDAD')) currentType = 'DEBILIDAD';
          else if (upper.includes('OPORTUNIDAD')) currentType = 'OPORTUNIDAD';
          else if (upper.includes('AMENAZA')) currentType = 'AMENAZA';
          else {
            rawItems.push({ type: currentType, description: line.trim(), category: 'IMPORTADO' });
          }
        });
      }

      if (rawItems.length > 0) {
        await fetch('/api/dofa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rawItems)
        });
        fetchItems();
      }
    } catch (error) {
      console.error('Import error:', error);
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const Quadrant = ({ type, title, icon: Icon, color, bg }: { type: DofaType, title: string, icon: any, color: string, bg: string }) => {
    const quadrantItems = items.filter(i => i.type === type);

    return (
      <div className={`p-8 rounded-[2.5rem] border ${bg} shadow-sm flex flex-col h-full group hover:shadow-xl transition-all duration-500`}>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${color} text-white shadow-lg`}>
              <Icon size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight text-slate-800 uppercase">{title}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Factores {type === 'FORTALEZA' || type === 'DEBILIDAD' ? 'Internos' : 'Externos'}</p>
            </div>
          </div>
          <button 
            onClick={() => setShowAddModal(type)}
            className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-600 hover:border-red-200 hover:scale-110 transition-all shadow-sm"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
          {quadrantItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-10">
              <Icon size={40} className="mb-2" />
              <p className="text-[10px] font-black uppercase tracking-widest">Sin registros</p>
            </div>
          ) : (
            quadrantItems.map((item) => (
              <motion.div 
                layout
                key={item.id}
                className="p-4 bg-white/60 backdrop-blur-sm border border-slate-100 rounded-2xl flex justify-between items-start gap-3 group/item hover:border-red-200 transition-colors"
              >
                <div className="flex-1">
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">{item.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-slate-100 text-slate-400 rounded-md tracking-tighter">{item.category}</span>
                  </div>
                </div>
                <button 
                  onClick={() => deleteItem(item.id)}
                  className="opacity-0 group-item/item:opacity-100 p-2 text-slate-300 hover:text-red-600 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10">
      {/* Header Panel */}
      <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <div className="flex items-center gap-2 text-red-600 font-black text-[10px] uppercase tracking-[0.2em] mb-3">
             <Target size={16} /> Planeación Estratégica
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Matriz <span className="text-red-600">DOFA.</span></h2>
          <p className="text-slate-500 text-sm font-medium mt-2 max-w-md">Análisis institucional bajo la norma ISO 21001. Evalúa el contexto interno y externo de Ciudad Don Bosco.</p>
        </div>

        <div className="flex flex-wrap gap-4 justify-center">
          <label className="cursor-pointer bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex items-center gap-2">
            {importing ? <Loader2 size={18} className="animate-spin" /> : <FileUp size={18} />}
            <span>Importar (.docx / .xlsx)</span>
            <input type="file" className="hidden" accept=".docx,.xlsx,.xls" onChange={handleFileUpload} disabled={importing} />
          </label>
          <button className="bg-white border-2 border-slate-100 text-slate-600 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2">
            <Download size={18} /> Exportar Reporte
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-40 flex flex-col items-center justify-center gap-4">
           <Loader2 size={48} className="text-red-600 animate-spin" />
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargando Matriz Estratégica...</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          <Quadrant type="FORTALEZA" title="Fortalezas" icon={ShieldCheck} color="bg-emerald-500" bg="bg-emerald-50/30 border-emerald-100" />
          <Quadrant type="OPORTUNIDAD" title="Oportunidades" icon={Sparkles} color="bg-blue-500" bg="bg-blue-50/30 border-blue-100" />
          <Quadrant type="DEBILIDAD" title="Debilidades" icon={AlertTriangle} color="bg-orange-500" bg="bg-orange-50/30 border-orange-100" />
          <Quadrant type="AMENAZA" title="Amenazas" icon={Zap} color="bg-red-500" bg="bg-red-50/30 border-red-100" />
        </div>
      )}

      {/* Add Item Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setShowAddModal(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] max-w-xl w-full p-10 shadow-2xl relative"
              onClick={e => e.stopPropagation()}
            >
              <button onClick={() => setShowAddModal(null)} className="absolute top-8 right-8 p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={24} className="text-slate-400" />
              </button>
              
              <h3 className="text-2xl font-black text-slate-800 mb-6">Nuevo Elemento: {showAddModal}</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Descripción del factor</label>
                  <textarea 
                    value={newItem.description}
                    onChange={e => setNewItem({...newItem, description: e.target.value})}
                    placeholder="Ej: Infraestructura tecnológica de última generación..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 outline-none focus:border-red-200 transition-all text-sm font-medium h-32"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Categoría</label>
                    <select 
                      value={newItem.category}
                      onChange={e => setNewItem({...newItem, category: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 outline-none text-xs font-black uppercase"
                    >
                      <option value="GENERAL">General</option>
                      <option value="ACADEMICO">Académico</option>
                      <option value="ADMINISTRATIVO">Administrativo</option>
                      <option value="CONVIVENCIA">Convivencia</option>
                      <option value="INFRAESTRUCTURA">Infraestructura</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Prioridad</label>
                    <select 
                      value={newItem.priority}
                      onChange={e => setNewItem({...newItem, priority: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 outline-none text-xs font-black uppercase"
                    >
                      <option value="BAJA">Baja</option>
                      <option value="NORMAL">Normal</option>
                      <option value="ALTA">Alta</option>
                    </select>
                  </div>
                </div>

                <button 
                  onClick={() => addItem(showAddModal)}
                  className="w-full py-5 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-600/20"
                >
                  Guardar en Matriz
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
