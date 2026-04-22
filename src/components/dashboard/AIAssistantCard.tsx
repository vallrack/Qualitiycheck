'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Bot, ShieldCheck, AlertCircle, Loader2, ChevronRight } from 'lucide-react';

export default function AIAssistantCard() {
  const [description, setDescription] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!description || description.length < 10) return;
    setLoading(true);
    setAnalysis(null);
    try {
      const res = await fetch('/api/ai/analyze-case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });
      const data = await res.json();
      setAnalysis(data);
    } catch (error) {
      console.error('Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm relative overflow-hidden group">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl group-hover:bg-red-500/10 transition-colors" />

      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-2xl bg-red-600 text-white shadow-lg shadow-red-600/20">
          <Sparkles size={24} />
        </div>
        <div>
          <h3 className="text-2xl font-black text-slate-900 leading-tight">Asistente AI Normativo</h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Ejército de Inteligencia Activo</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="relative">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe la situación de convivencia para análisis..."
            className="w-full h-32 bg-slate-50 border border-slate-100 rounded-[2rem] p-6 text-sm font-medium focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all resize-none"
          />
          <button
            onClick={handleAnalyze}
            disabled={loading || !description}
            className="absolute bottom-4 right-4 bg-red-600 text-white p-4 rounded-2xl hover:bg-red-700 disabled:bg-slate-200 transition-all shadow-lg"
          >
            {loading ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
          </button>
        </div>

        <AnimatePresence>
          {analysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 pt-8 border-t border-slate-100 space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  analysis.type === 3 ? 'bg-red-600 text-white' : 
                  analysis.type === 2 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  Situación Tipo {analysis.type}
                </div>
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-400 uppercase tracking-tighter">
                  Riesgo: <span className={analysis.riskLevel === 'Critical' ? 'text-red-600' : 'text-slate-600'}>{analysis.riskLevel}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <h4 className="flex items-center gap-2 text-sm font-black text-slate-900 mb-2 uppercase tracking-tight">
                  <Bot size={18} className="text-red-600" /> Razonamiento Pedagógico
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed font-secondary italic">
                  "{analysis.reasoning}"
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100/50">
                  <ShieldCheck size={20} className="text-emerald-600 shrink-0 mt-1" />
                  <div>
                    <div className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-1">Protocolo Ley 1620</div>
                    <p className="text-xs text-emerald-700 leading-tight font-medium">{analysis.suggestedProtocol}</p>
                  </div>
                </div>
              </div>

              <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                Abrir Expediente con este Análisis <ChevronRight size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {!analysis && !loading && (
          <div className="text-center py-8">
            <AlertCircle size={32} className="mx-auto text-slate-100 mb-3" />
            <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.2em]">Esperando datos para análisis táctico</p>
          </div>
        )}
      </div>
    </div>
  );
}
