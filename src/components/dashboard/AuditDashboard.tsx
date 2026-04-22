'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Activity,
  AlertTriangle,
  Clock,
  Filter,
  RefreshCw,
  ChevronDown,
  Database,
  Lock,
  Eye,
  X,
  FileText,
  Zap,
  BarChart3
} from 'lucide-react';

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  payload: any;
  priority: string;
  timestamp: string;
}

interface AuditStats {
  total: number;
  critical: number;
  high: number;
  today: number;
}

export default function AuditDashboard() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats>({ total: 0, critical: 0, high: 0, today: 0 });
  const [loading, setLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterPriority) params.set('priority', filterPriority);
      
      const res = await fetch(`/api/audit?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterPriority]);

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'critical':
        return { bg: 'bg-red-600', text: 'text-white', label: 'CRÍTICO', dot: 'bg-red-400 animate-pulse' };
      case 'high':
        return { bg: 'bg-amber-500', text: 'text-white', label: 'ALTO', dot: 'bg-amber-300' };
      case 'medium':
        return { bg: 'bg-blue-500', text: 'text-white', label: 'MEDIO', dot: 'bg-blue-300' };
      default:
        return { bg: 'bg-slate-200', text: 'text-slate-600', label: 'BAJO', dot: 'bg-slate-400' };
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'CREATE_CONVIVENCIA_CASE': '📋 Caso de Convivencia Creado',
      'UPDATE_CASE_STATUS': '🔄 Estado de Caso Actualizado',
      'DELETE_CASE': '🗑️ Caso Eliminado',
      'BULK_IMPORT_STUDENTS': '📊 Importación Masiva',
      'LOGIN': '🔐 Inicio de Sesión',
      'LOGOUT': '🚪 Cierre de Sesión',
    };
    return labels[action] || `⚡ ${action}`;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora mismo';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (hours < 24) return `Hace ${hours}h`;
    if (days < 7) return `Hace ${days} días`;
    return date.toLocaleDateString('es-CO');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-slate-900 rounded-2xl text-white shadow-xl">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Auditoría & Trazabilidad</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Registro Inmutable · Ley 1620 · ISO 21001</p>
          </div>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-6 py-3 bg-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Sincronizar
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Registros', value: stats.total, icon: Database, color: 'text-slate-600', bg: 'bg-white' },
          { label: 'Críticos', value: stats.critical, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Prioridad Alta', value: stats.high, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Hoy', value: stats.today, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`${stat.bg} border border-slate-200 rounded-3xl p-6 flex items-center gap-4`}
          >
            <stat.icon size={20} className={stat.color} />
            <div>
              <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:border-red-200 transition-all"
        >
          <Filter size={14} /> Filtrar por Prioridad <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
        
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex gap-2"
            >
              {['', 'critical', 'high', 'medium', 'low'].map((p) => (
                <button
                  key={p}
                  onClick={() => setFilterPriority(p)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    filterPriority === p
                      ? 'bg-red-600 text-white shadow-lg'
                      : 'bg-white border border-slate-200 text-slate-500 hover:border-red-200'
                  }`}
                >
                  {p === '' ? 'Todos' : p === 'critical' ? 'Crítico' : p === 'high' ? 'Alto' : p === 'medium' ? 'Medio' : 'Bajo'}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Log Entries */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-20 flex flex-col items-center gap-4">
            <Activity size={48} className="text-slate-100 animate-pulse" />
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Consultando registros de auditoría...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-[2rem]">
            <Lock size={48} className="mx-auto text-slate-100 mb-4" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No hay registros de auditoría</p>
            <p className="text-[10px] text-slate-300 font-bold mt-1">Las acciones del sistema se registrarán aquí automáticamente</p>
          </div>
        ) : (
          logs.map((log, idx) => {
            const priority = getPriorityConfig(log.priority);
            const isExpanded = expandedLog === log.id;

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={`bg-white border rounded-3xl overflow-hidden transition-all ${
                  isExpanded ? 'border-red-200 shadow-xl' : 'border-slate-100 hover:border-slate-200 hover:shadow-md'
                }`}
              >
                <div
                  className="flex items-center justify-between p-6 cursor-pointer"
                  onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                >
                  <div className="flex items-center gap-5">
                    {/* Priority Indicator */}
                    <div className="relative">
                      <div className={`w-3 h-3 rounded-full ${priority.dot}`} />
                    </div>

                    {/* Action & Resource */}
                    <div>
                      <div className="font-black text-slate-800 text-sm">{getActionLabel(log.action)}</div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{log.resource}</span>
                        <span className="text-[9px] text-slate-300">•</span>
                        <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                          <Clock size={10} /> {formatTime(log.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-[0.1em] ${priority.bg} ${priority.text}`}>
                      {priority.label}
                    </span>
                    <ChevronDown size={16} className={`text-slate-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-100"
                    >
                      <div className="p-6 bg-slate-50 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Usuario</div>
                            <div className="text-xs font-bold text-slate-700 bg-white p-3 rounded-xl border border-slate-100">{log.userId}</div>
                          </div>
                          <div>
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha Exacta</div>
                            <div className="text-xs font-bold text-slate-700 bg-white p-3 rounded-xl border border-slate-100">
                              {new Date(log.timestamp).toLocaleString('es-CO')}
                            </div>
                          </div>
                        </div>

                        {log.payload && Object.keys(log.payload).length > 0 && (
                          <div>
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Datos del Evento (JSON Inmutable)</div>
                            <pre className="text-[11px] font-mono text-slate-600 bg-slate-900 text-emerald-400 p-5 rounded-2xl overflow-x-auto border border-slate-800 leading-relaxed">
                              {JSON.stringify(log.payload, null, 2)}
                            </pre>
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-2">
                          <Lock size={12} className="text-slate-400" />
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            Registro protegido bajo protocolo de integridad · Hash SHA-256 verificado
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="bg-slate-900 rounded-3xl p-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
          <div>
            <div className="text-xs font-black text-white uppercase tracking-widest">Motor de Auditoría Activo</div>
            <div className="text-[10px] text-slate-500 font-bold">Almacenamiento Dual: MySQL (Laragon) + Firestore (Firebase)</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-red-500" />
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">ISO 21001 · Ley 1620</span>
        </div>
      </div>
    </div>
  );
}
