'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  ShieldAlert, 
  Clock, 
  Search, 
  Filter, 
  HelpCircle, 
  X,
  FileText,
  User,
  AlertTriangle,
  Download
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function AuditLogModule() {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit?limit=100');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setStats(data.stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(l => 
    l.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.userId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const helpInstructions = [
    { title: 'Trazabilidad Total', text: 'Cada acción crítica (crear, editar, eliminar, firmar) queda registrada de forma inmutable, cumpliendo con la norma ISO 9001.' },
    { title: 'Niveles de Prioridad', text: 'Los eventos se clasifican en: Low (informativo), Medium (cambios normales), High (riesgo) y Critical (fallas o seguridad).' },
    { title: 'Doble Capa de Seguridad', text: 'Los logs se guardan tanto en la base de datos local (MySQL) como en la nube (Firestore) para garantizar que no puedan ser alterados.' },
    { title: 'Auditorías Externas', text: 'En caso de una auditoría de ICONTEC o Secretaría de Educación, este panel sirve como evidencia oficial de control del sistema.' }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const exportExcel = () => {
    const rows = filteredLogs.map((log) => ({
      'Fecha & Hora': new Date(log.timestamp).toLocaleString('es-CO'),
      'Usuario (UID)': log.userId,
      'Acción Realizada': log.action,
      'Recurso Afectado': log.resource,
      'Prioridad': log.priority.toUpperCase()
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 25 }, { wch: 30 }, { wch: 35 }, { wch: 40 }, { wch: 15 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Auditoria');
    XLSX.writeFile(wb, `auditoria_sgc_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-slate-900 rounded-2xl text-white shadow-xl">
              <Activity size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-800">Centro de Auditoría y Trazabilidad</h2>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Logs inmutables del sistema SGC</p>
            </div>
          </div>
          
          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por usuario o acción..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-slate-400 transition-all"
              />
            </div>
            <button 
              onClick={() => setShowHelp(true)}
              className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition-all border border-blue-100"
              title="Instrucciones de Auditoría"
            >
              <HelpCircle size={24} />
            </button>
            <button 
              onClick={exportExcel}
              className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-100 transition-all border border-emerald-100"
              title="Exportar a Excel"
            >
              <Download size={24} />
            </button>
            <button 
              onClick={fetchLogs}
              className="bg-slate-900 text-white px-4 rounded-2xl hover:bg-slate-800 transition-all shadow-md flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
            >
              <Filter size={18} /> Actualizar
            </button>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="text-2xl font-black text-slate-800">{stats.total}</div>
              <div className="text-[10px] font-black uppercase text-slate-400">Total Eventos</div>
            </div>
            <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
              <div className="text-2xl font-black text-red-600">{stats.critical}</div>
              <div className="text-[10px] font-black uppercase text-red-400">Alertas Críticas</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
              <div className="text-2xl font-black text-orange-600">{stats.high}</div>
              <div className="text-[10px] font-black uppercase text-orange-400">Riesgo Alto</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
              <div className="text-2xl font-black text-blue-600">{stats.today}</div>
              <div className="text-[10px] font-black uppercase text-blue-400">Eventos Hoy</div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="pb-4 pl-4">Fecha & Hora</th>
                <th className="pb-4">Usuario (UID)</th>
                <th className="pb-4">Acción Realizada</th>
                <th className="pb-4">Recurso Afectado</th>
                <th className="pb-4 text-right pr-4">Prioridad</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12 text-slate-400 font-bold uppercase tracking-widest text-xs">Cargando registros inmutables...</td></tr>
              ) : filteredLogs.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-slate-400 font-bold uppercase tracking-widest text-xs">No hay eventos registrados.</td></tr>
              ) : filteredLogs.map((log, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.02, 0.5) }}
                  key={log.id} 
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td className="py-4 pl-4 font-bold text-slate-500 whitespace-nowrap text-xs">
                    <Clock size={12} className="inline mr-1" />
                    {new Date(log.timestamp).toLocaleString('es-CO')}
                  </td>
                  <td className="py-4 font-black text-slate-700 text-xs truncate max-w-[150px]">
                    <User size={12} className="inline mr-1 text-blue-500" />
                    {log.userId === 'SYSTEM' ? 'SISTEMA AUTOMÁTICO' : log.userId}
                  </td>
                  <td className="py-4 font-bold text-slate-800">
                    {log.action}
                  </td>
                  <td className="py-4 font-medium text-slate-500 text-xs">
                    <FileText size={12} className="inline mr-1" />
                    {log.resource}
                  </td>
                  <td className="py-4 pr-4 text-right">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider border ${getPriorityColor(log.priority)}`}>
                      {log.priority === 'critical' && <AlertTriangle size={10} className="mr-1" />}
                      {log.priority}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showHelp && (
        <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[2.5rem] max-w-2xl w-full p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8">
              <button onClick={() => setShowHelp(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} className="text-slate-400" /></button>
            </div>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg"><Activity size={32} /></div>
              <div>
                <h3 className="text-2xl font-black text-slate-800">Manual de Control</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Módulo: Auditoría y Trazabilidad</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {helpInstructions.map((item, i) => (
                <div key={i} className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <h4 className="text-sm font-black text-indigo-600 mb-2 uppercase tracking-tight">{item.title}</h4>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 p-6 bg-slate-900 rounded-3xl text-white">
              <p className="text-xs font-black uppercase tracking-widest mb-1">🔒 Seguridad Inmutable</p>
              <p className="text-[11px] font-medium leading-relaxed opacity-90">Ningún usuario, ni siquiera el Administrador, puede alterar o eliminar estos registros. Esto garantiza la total transparencia exigida por las entidades de vigilancia educativa.</p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
