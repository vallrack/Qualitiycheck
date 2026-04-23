'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell
} from 'recharts';
import { Users, FileWarning, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';

export default function DashboardCharts() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
        
        const res = await fetch('/api/stats', { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        } else {
          setError(`Error HTTP: ${res.status}`);
        }
      } catch (err: any) {
        console.error("Error fetching stats:", err);
        setError(err.name === 'AbortError' ? 'Tiempo de espera agotado al conectar con la base de datos' : err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="h-64 rounded-[3rem] border border-slate-200 bg-white flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="animate-spin mb-4" size={32} />
        <span className="text-xs font-black uppercase tracking-widest">Calculando Estadísticas...</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="h-64 rounded-[3rem] border border-red-200 bg-red-50 flex flex-col items-center justify-center text-red-500">
        <AlertTriangle className="mb-4" size={32} />
        <span className="text-xs font-black uppercase tracking-widest mb-2">Error de Conexión</span>
        <span className="text-[10px] font-bold text-red-400 text-center max-w-xs">{error || 'No se pudieron cargar las estadísticas'}</span>
      </div>
    );
  }

  const COLORS = {
    NORMAL: '#0f172a',
    URGENT: '#f59e0b',
    CRITICAL: '#dc2626'
  };

  const TYPE_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-10">
      {/* Top Value Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-red-600 text-white p-8 rounded-[2.5rem] shadow-xl shadow-red-600/20 relative overflow-hidden"
        >
          <Users size={48} className="absolute -bottom-4 -right-4 opacity-10" />
          <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">Total Estudiantes</div>
          <div className="text-5xl font-black">{stats.totals.students}</div>
          <div className="mt-4 text-xs font-bold opacity-90 flex items-center gap-2">
             <TrendingUp size={14} /> Sincronizado Mysql/Firebase
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden"
        >
          <FileWarning size={48} className="absolute -bottom-4 -right-4 text-slate-100" />
          <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-2">Casos Convivencia</div>
          <div className="text-5xl font-black text-slate-900">{stats.totals.cases}</div>
          <div className="mt-4 text-[10px] font-black uppercase text-slate-500 tracking-wider">Histórico Ley 1620</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden"
        >
          <AlertTriangle size={48} className="absolute -bottom-4 -right-4 text-slate-800" />
          <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-2">Criticidad Actual</div>
          <div className="text-5xl font-black text-red-500">
             {stats.severity?.find((s:any) => s.name === 'CRITICAL')?.value || 0}
          </div>
          <div className="mt-4 text-[10px] font-black uppercase text-slate-500 tracking-wider">Casos Críticos Abiertos</div>
        </motion.div>
      </div>

      {/* Main Charts */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Trend Area Chart */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm lg:col-span-2">
          <div className="mb-8">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Tendencia Semanal</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Nuevos reportes en los últimos 7 días</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.weeklyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <CartesianGrid vertical={false} stroke="#ecfeff" strokeDasharray="3 3" />
                <RechartsTooltip 
                   contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                   itemStyle={{ color: '#0f172a', fontWeight: 900 }}
                />
                <Area type="monotone" dataKey="cases" stroke="#dc2626" strokeWidth={4} fillOpacity={1} fill="url(#colorCases)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown Bar Chart */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
          <div className="mb-8">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Por Tipo (Ley 1620)</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Distribución Histórica</p>
          </div>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.types} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} />
                  <RechartsTooltip cursor={{fill: '#f8fafc'}} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {stats.types.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
