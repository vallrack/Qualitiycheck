'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Users, 
  Building2, 
  Plus, 
  Trash2, 
  History, 
  Loader2, 
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  X,
  ClipboardList,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface Kpi {
  id: string;
  name: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  frequency: string;
  level: 'INSTITUCIONAL' | 'AREA' | 'PERSONAL';
  area?: string;
  userId?: string;
  history: any[];
}

export default function KpiModule() {
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'INSTITUCIONAL' | 'AREA' | 'PERSONAL'>('INSTITUCIONAL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  
  const [newKpi, setNewKpi] = useState({
    name: '',
    description: '',
    targetValue: 0,
    unit: '%',
    frequency: 'MENSUAL',
    level: 'INSTITUCIONAL',
    area: '',
    userId: ''
  });

  const [trackValue, setTrackValue] = useState({ value: 0, comment: '' });
  const [selectedEvidence, setSelectedEvidence] = useState<any>(null);

  useEffect(() => {
    fetchKpis();
  }, [filter]);

  useEffect(() => {
    if (selectedGroup) {
      fetchEvidence(selectedGroup);
    } else {
      setSelectedEvidence(null);
    }
  }, [selectedGroup]);

  const fetchEvidence = async (title: string) => {
    try {
      const res = await fetch(`/api/evidence?title=${encodeURIComponent(title)}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedEvidence(data);
      }
    } catch (e) {
      console.error('Error fetching evidence:', e);
    }
  };

  const fetchKpis = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/kpis?level=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setKpis(data);
      }
    } catch (error) {
      console.error('Error fetching KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Lógica para agrupar KPIs por prefijo [Fuente]
  const groupedKpis = kpis.reduce((acc: any, kpi) => {
    const match = kpi.name.match(/^\[(.*?)\]\s*(.*)$/);
    const groupName = match ? match[1] : 'General';
    const cleanName = match ? match[2] : kpi.name;
    
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push({ ...kpi, cleanName });
    return acc;
  }, {});

  const groupList = Object.keys(groupedKpis);

  const createKpi = async () => {
    try {
      const res = await fetch('/api/kpis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newKpi)
      });
      if (res.ok) {
        setShowAddModal(false);
        fetchKpis();
      }
    } catch (error) {
      console.error('Error creating KPI:', error);
    }
  };

  const [showTrackModal, setShowTrackModal] = useState<Kpi | null>(null);

  const trackKpi = async () => {
    if (!showTrackModal) return;
    try {
      const res = await fetch('/api/kpis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'track', 
          kpiId: showTrackModal.id, 
          value: trackValue.value, 
          comment: trackValue.comment 
        })
      });
      if (res.ok) {
        setShowTrackModal(null);
        setTrackValue({ value: 0, comment: '' });
        fetchKpis();
      }
    } catch (error) {
      console.error('Error tracking KPI:', error);
    }
  };

  const deleteKpi = async (id: string) => {
    if (!confirm('¿Seguro que desea eliminar este KPI? Se perderá el historial.')) return;
    try {
      await fetch('/api/kpis', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      fetchKpis();
    } catch (error) {
      console.error('Error deleting KPI:', error);
    }
  };

  return (
    <div className="space-y-10">
      {/* Header Panel */}
      <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <div className="flex items-center gap-2 text-red-600 font-black text-[10px] uppercase tracking-[0.2em] mb-3">
             <BarChart3 size={16} /> {selectedGroup ? `Asignatura: ${selectedGroup}` : 'Tablero de Indicadores'}
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">
            {selectedGroup ? selectedGroup : <>Métricas de <span className="text-red-600">Calidad.</span></>}
          </h2>
          <p className="text-slate-500 text-sm font-medium mt-2 max-w-md">
            {selectedGroup ? 'Detalle de indicadores extraídos para esta asignatura.' : 'Estrategia en cascada: Objetivos Institucionales, Áreas y Desempeño.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-4 justify-center">
          {selectedGroup ? (
            <button 
              onClick={() => setSelectedGroup(null)}
              className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
            >
              <ChevronRight size={14} className="rotate-180" /> Volver a la Lista
            </button>
          ) : (
            <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-2">
              {[
                { id: 'INSTITUCIONAL', label: 'Global', icon: Building2 },
                { id: 'AREA', label: 'Asignaturas', icon: Activity },
                { id: 'PERSONAL', label: 'Personal', icon: Users },
              ].map(lvl => (
                <button 
                  key={lvl.id}
                  onClick={() => setFilter(lvl.id as any)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    filter === lvl.id ? 'bg-white text-red-600 shadow-lg' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <lvl.icon size={14} />
                  {lvl.label}
                </button>
              ))}
            </div>
          )}
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-600/10 flex items-center gap-2"
          >
            <Plus size={18} /> Nuevo KPI
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-40 flex flex-col items-center justify-center gap-4">
           <Loader2 size={48} className="text-red-600 animate-spin" />
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando Indicadores...</p>
        </div>
      ) : kpis.length === 0 ? (
        <div className="py-32 bg-white rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center px-6">
           <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
              <Target size={40} />
           </div>
           <h3 className="text-xl font-black text-slate-400 uppercase tracking-tight">No hay KPIs definidos para este nivel</h3>
           <p className="text-xs text-slate-400 mt-2">Usa el botón "Nuevo KPI" para comenzar a medir el éxito.</p>
        </div>
      ) : selectedGroup ? (
        <div className="space-y-8">
          {/* Summary Cards for the Group */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
               <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Total Indicadores</div>
               <div className="text-4xl font-black text-slate-900">{groupedKpis[selectedGroup].length}</div>
               <div className="text-[9px] font-bold text-slate-400 mt-2 italic">Seguimiento activo para esta asignatura</div>
            </div>
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl shadow-slate-900/10">
               <div className="text-[10px] font-black uppercase text-red-500 tracking-widest mb-2">Cumplimiento General</div>
               <div className="text-4xl font-black">
                 {(groupedKpis[selectedGroup].reduce((acc: number, k: any) => acc + (k.currentValue / k.targetValue), 0) / groupedKpis[selectedGroup].length * 100).toFixed(0)}%
               </div>
               <div className="w-full h-1 bg-white/10 rounded-full mt-4">
                 <div className="h-full bg-red-600 rounded-full" style={{ width: '65%' }} />
               </div>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
               <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Estado Crítico</div>
               <div className="text-4xl font-black text-red-600">
                 {groupedKpis[selectedGroup].filter((k: any) => (k.currentValue / k.targetValue) < 0.5).length}
               </div>
               <div className="text-[9px] font-bold text-red-400 mt-2 uppercase tracking-widest">Requieren Atención Inmediata</div>
            </div>
          </div>

          {/* Qualitative Document Context (from AI) */}
          {selectedEvidence && selectedEvidence.aiAnalysis && (
            <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm">
               <div className="flex justify-between items-center mb-8 px-4">
                 <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                   <FileText size={20} className="text-blue-500" /> Contenido Cualitativo del Documento
                 </h3>
                 <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                   {selectedEvidence.aiAnalysis.classification?.type || 'DOCUMENTO'}
                 </span>
               </div>
               
               <div className="px-4 space-y-8">
                 <div>
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Resumen Ejecutivo</h4>
                   <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-100">
                     {selectedEvidence.aiAnalysis.executiveSummary}
                   </p>
                 </div>

                 {selectedEvidence.aiAnalysis.sections && selectedEvidence.aiAnalysis.sections.length > 0 && (
                   <div>
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Secciones Extraídas</h4>
                     <div className="grid md:grid-cols-2 gap-4">
                       {selectedEvidence.aiAnalysis.sections.map((sec: any, idx: number) => (
                         <div key={idx} className="bg-white border border-slate-200 p-5 rounded-2xl hover:shadow-md transition-shadow">
                           <h5 className="text-sm font-black text-slate-800 mb-2">{sec.title}</h5>
                           <p className="text-xs text-slate-600 line-clamp-4 hover:line-clamp-none transition-all">{sec.content}</p>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}

                 {selectedEvidence.aiAnalysis.tables && selectedEvidence.aiAnalysis.tables.length > 0 && (
                   <div>
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Tablas del Documento</h4>
                     <div className="space-y-6">
                       {selectedEvidence.aiAnalysis.tables.map((table: any, tIdx: number) => (
                         <div key={tIdx} className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                           <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                             <h5 className="text-xs font-black text-slate-800 uppercase tracking-widest">{table.title}</h5>
                           </div>
                           <div className="overflow-x-auto">
                             <table className="w-full text-left">
                               <thead>
                                 <tr className="bg-slate-900 text-white text-[10px] uppercase tracking-widest">
                                   {table.headers.map((h: string, i: number) => (
                                     <th key={i} className="px-4 py-3">{h}</th>
                                   ))}
                                 </tr>
                               </thead>
                               <tbody className="divide-y divide-slate-100">
                                 {table.rows.map((row: string[], rIdx: number) => (
                                   <tr key={rIdx} className="hover:bg-slate-50">
                                     {row.map((cell: string, cIdx: number) => (
                                       <td key={cIdx} className="px-4 py-3 text-xs text-slate-600">{cell}</td>
                                     ))}
                                   </tr>
                                 ))}
                               </tbody>
                             </table>
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
               </div>
            </div>
          )}

          {/* Detailed Table */}
          <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm">
            <div className="flex justify-between items-center mb-8 px-4">
               <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                 <ClipboardList size={20} className="text-red-600" /> Desglose Detallado
               </h3>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                 Datos Sincronizados con el SGC
               </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-y-4">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    <th className="px-6 pb-2">Indicador</th>
                    <th className="px-6 pb-2">Valor Actual</th>
                    <th className="px-6 pb-2">Meta / Unidad</th>
                    <th className="px-6 pb-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedKpis[selectedGroup].map((kpi: any, i: number) => (
                    <motion.tr 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ delay: i * 0.05 }}
                      key={kpi.id} 
                      className="bg-slate-50 hover:bg-white hover:shadow-md transition-all group border border-transparent hover:border-slate-200"
                    >
                      <td className="px-6 py-5 rounded-l-2xl">
                        <div className="font-bold text-slate-800">{kpi.cleanName}</div>
                        <div className="text-[9px] font-black text-slate-400 uppercase mt-1 italic">{kpi.description.substring(0, 50)}...</div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-black text-slate-900">{kpi.currentValue}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{kpi.unit}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-xs font-bold text-slate-500">Meta: {kpi.targetValue}{kpi.unit}</div>
                        <div className="w-24 h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                          <div 
                            className="h-full bg-red-600 transition-all" 
                            style={{ width: `${Math.min((kpi.currentValue / kpi.targetValue) * 100, 100)}%` }} 
                          />
                        </div>
                      </td>
                      <td className="px-6 py-5 rounded-r-2xl">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setShowTrackModal(kpi)}
                            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-red-600 hover:border-red-600 transition-all"
                            title="Actualizar Valor"
                          >
                            <Plus size={16} />
                          </button>
                          <button 
                            onClick={() => deleteKpi(kpi.id)}
                            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-red-600 hover:border-red-600 transition-all opacity-0 group-hover:opacity-100"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groupList.map((group) => (
            <motion.div
              key={group}
              whileHover={{ y: -10 }}
              onClick={() => setSelectedGroup(group)}
              className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-red-200 transition-all cursor-pointer group"
            >
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-red-600 group-hover:text-white transition-all mb-6">
                <Target size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight mb-2">{group}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">
                {groupedKpis[group].length} Indicadores Extraídos
              </p>
              <div className="flex -space-x-2">
                {groupedKpis[group].slice(0, 4).map((_: any, i: number) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-400">
                    {i + 1}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <Modal title="Definir Nuevo Indicador" onClose={() => setShowAddModal(false)}>
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="label-xs">Nombre del KPI</label>
                  <input 
                    type="text" 
                    value={newKpi.name}
                    onChange={e => setNewKpi({...newKpi, name: e.target.value})}
                    placeholder="Ej: Satisfacción del Cliente"
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="label-xs">Nivel Estratégico</label>
                  <select 
                    value={newKpi.level}
                    onChange={e => setNewKpi({...newKpi, level: e.target.value as any})}
                    className="input-base"
                  >
                    <option value="INSTITUCIONAL">Institucional (Global)</option>
                    <option value="AREA">Área / Departamento</option>
                    <option value="PERSONAL">Personal / Individual</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label-xs">Descripción / Objetivo</label>
                <textarea 
                  value={newKpi.description}
                  onChange={e => setNewKpi({...newKpi, description: e.target.value})}
                  className="input-base h-24"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="label-xs">Meta (Target)</label>
                  <input 
                    type="number" 
                    value={newKpi.targetValue}
                    onChange={e => setNewKpi({...newKpi, targetValue: Number(e.target.value)})}
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="label-xs">Unidad</label>
                  <input 
                    type="text" 
                    value={newKpi.unit}
                    onChange={e => setNewKpi({...newKpi, unit: e.target.value})}
                    placeholder="%, $, etc."
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="label-xs">Frecuencia</label>
                  <select 
                    value={newKpi.frequency}
                    onChange={e => setNewKpi({...newKpi, frequency: e.target.value})}
                    className="input-base"
                  >
                    <option value="MENSUAL">Mensual</option>
                    <option value="TRIMESTRAL">Trimestral</option>
                    <option value="ANUAL">Anual</option>
                  </select>
                </div>
              </div>

              {newKpi.level === 'AREA' && (
                <div>
                  <label className="label-xs">Nombre del Área</label>
                  <input 
                    type="text" 
                    value={newKpi.area}
                    onChange={e => setNewKpi({...newKpi, area: e.target.value})}
                    placeholder="Ej: Calidad, Ventas, Docencia"
                    className="input-base"
                  />
                </div>
              )}

              {newKpi.level === 'PERSONAL' && (
                <div>
                  <label className="label-xs">ID de Usuario Responsable</label>
                  <input 
                    type="text" 
                    value={newKpi.userId}
                    onChange={e => setNewKpi({...newKpi, userId: e.target.value})}
                    placeholder="UID de Firebase"
                    className="input-base"
                  />
                </div>
              )}

              <button 
                onClick={createKpi}
                className="w-full py-5 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-600/20"
              >
                Crear Indicador
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Track Modal */}
      <AnimatePresence>
        {showTrackModal && (
          <Modal title={`Actualizar: ${showTrackModal.name}`} onClose={() => setShowTrackModal(null)}>
            <div className="space-y-6">
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                 <div>
                    <div className="text-[10px] font-black uppercase text-slate-400">Meta Actual</div>
                    <div className="text-2xl font-black text-slate-900">{showTrackModal.targetValue}{showTrackModal.unit}</div>
                 </div>
                 <ArrowRight size={24} className="text-slate-300" />
                 <div className="text-right">
                    <div className="text-[10px] font-black uppercase text-slate-400">Último Valor</div>
                    <div className="text-2xl font-black text-red-600">{showTrackModal.currentValue}{showTrackModal.unit}</div>
                 </div>
              </div>

              <div>
                <label className="label-xs">Nuevo Valor Real ({showTrackModal.unit})</label>
                <input 
                  type="number" 
                  value={trackValue.value}
                  onChange={e => setTrackValue({...trackValue, value: Number(e.target.value)})}
                  className="input-base text-3xl h-20 text-center"
                />
              </div>

              <div>
                <label className="label-xs">Comentario / Observación</label>
                <textarea 
                  value={trackValue.comment}
                  onChange={e => setTrackValue({...trackValue, comment: e.target.value})}
                  className="input-base h-24"
                />
              </div>

              <button 
                onClick={trackKpi}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
              >
                Registrar Avance
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      <style jsx>{`
        .label-xs { @apply text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block; }
        .input-base { @apply w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 outline-none focus:border-red-200 transition-all text-sm font-medium; }
      `}</style>
    </div>
  );
}

function KpiCard({ kpi, onDelete, onTrack }: { kpi: Kpi, onDelete: () => void, onTrack: () => void }) {
  const progress = Math.min((kpi.currentValue / kpi.targetValue) * 100, 100);
  const isHealthy = progress >= 90;
  const isWarning = progress < 90 && progress >= 70;

  // Prepare chart data from history
  const chartData = [...kpi.history].reverse().map(h => ({
    name: new Date(h.period).toLocaleDateString('es-ES', { month: 'short' }),
    value: h.value
  }));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col gap-8 group"
    >
      <div className="flex justify-between items-start">
        <div className="flex gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
            isHealthy ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 
            isWarning ? 'bg-amber-500 text-white shadow-amber-500/20' : 
            'bg-red-500 text-white shadow-red-500/20'
          }`}>
            <TrendingUp size={28} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight">{kpi.name}</h3>
            <div className="flex items-center gap-2 mt-1">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.level}</span>
               {kpi.area && <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase">{kpi.area}</span>}
            </div>
          </div>
        </div>
        <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 p-3 text-slate-300 hover:text-red-600 transition-all">
          <Trash2 size={20} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-4">
           <div>
              <div className="text-[10px] font-black uppercase text-slate-400 mb-1">Estado Actual</div>
              <div className="text-4xl font-black text-slate-900 tracking-tighter">
                {kpi.currentValue}<span className="text-lg text-slate-400 ml-1">{kpi.unit}</span>
              </div>
           </div>
           <div>
              <div className="text-[10px] font-black uppercase text-slate-400 mb-2">Progreso Meta ({kpi.targetValue}{kpi.unit})</div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${progress}%` }}
                   className={`h-full ${isHealthy ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-red-600'}`}
                 />
              </div>
           </div>
        </div>

        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isHealthy ? "#10b981" : "#ef4444"} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={isHealthy ? "#10b981" : "#ef4444"} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="value" stroke={isHealthy ? "#10b981" : "#ef4444"} fillOpacity={1} fill="url(#colorVal)" strokeWidth={3} />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
           <History size={14} /> Frecuencia: {kpi.frequency}
        </div>
        <button 
          onClick={onTrack}
          className="px-6 py-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-900 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
        >
          Actualizar Dato <ChevronRight size={14} />
        </button>
      </div>
    </motion.div>
  );
}

function Modal({ title, children, onClose }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-[3rem] max-w-2xl w-full p-10 shadow-2xl relative my-auto"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-8 right-8 p-2 hover:bg-slate-100 rounded-full transition-colors">
          <X size={24} className="text-slate-400" />
        </button>
        <h3 className="text-2xl font-black text-slate-800 mb-8">{title}</h3>
        {children}
      </motion.div>
    </motion.div>
  );
}
