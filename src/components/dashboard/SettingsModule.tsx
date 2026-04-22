'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, Loader2, Building2, BarChart3, Upload } from 'lucide-react';
import ExcelImporter from './ExcelImporter';

export default function SettingsModule() {
  const [activeTab, setActiveTab] = useState<'INSTITUCION' | 'SIEE' | 'IMPORTACION'>('INSTITUCION');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [config, setConfig] = useState({
    name: '',
    displayName: '',
    logoUrl: '',
    nit: '',
    type: 'FORMAL',
    sieeScale: {
      min: 1.0,
      max: 5.0,
      passing: 3.0,
      levels: [
        { name: 'Bajo', min: 1.0, max: 2.9 },
        { name: 'Básico', min: 3.0, max: 3.9 },
        { name: 'Alto', min: 4.0, max: 4.5 },
        { name: 'Superior', min: 4.6, max: 5.0 }
      ]
    }
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setConfig({
            ...data,
            sieeScale: data.sieeScale || {
              min: 1.0, max: 5.0, passing: 3.0,
              levels: [
                { name: 'Bajo', min: 1.0, max: 2.9 },
                { name: 'Básico', min: 3.0, max: 3.9 },
                { name: 'Alto', min: 4.0, max: 4.5 },
                { name: 'Superior', min: 4.6, max: 5.0 }
              ]
            }
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        alert('Configuración guardada exitosamente.');
      } else {
        alert('Error al guardar la configuración.');
      }
    } catch (e) {
      console.error(e);
      alert('Error de red al guardar.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-300" size={48} /></div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-slate-900 rounded-2xl text-white shadow-xl shadow-slate-900/20">
            <Settings size={28} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Configuración del SGC</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Parametrización Institucional</p>
          </div>
        </div>
        {activeTab !== 'IMPORTACION' && (
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-red-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-600/20 disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Guardar Cambios
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
        {[
          { id: 'INSTITUCION', label: 'Datos Institucionales', icon: Building2 },
          { id: 'SIEE', label: 'Escala SIEE', icon: BarChart3 },
          { id: 'IMPORTACION', label: 'Importación Masiva', icon: Upload }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
              activeTab === tab.id 
                ? 'bg-white text-red-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm"
      >
        {activeTab === 'INSTITUCION' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Razón Social</label>
              <input 
                type="text" 
                value={config.name}
                onChange={e => setConfig({ ...config, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Nombre Comercial (Plataforma)</label>
              <input 
                type="text" 
                value={config.displayName || ''}
                onChange={e => setConfig({ ...config, displayName: e.target.value })}
                placeholder="Ej: SGC Acme Corp"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">URL del Logo Institucional</label>
              <input 
                type="text" 
                value={config.logoUrl || ''}
                onChange={e => setConfig({ ...config, logoUrl: e.target.value })}
                placeholder="https://midominio.com/logo.png"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-red-500"
              />
              <p className="text-[10px] font-bold text-slate-400 mt-2">Pega aquí el enlace directo a tu imagen (PNG o SVG recomendado).</p>
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">NIT Institucional</label>
              <input 
                type="text" 
                value={config.nit}
                onChange={e => setConfig({ ...config, nit: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Modalidad SGC Base</label>
              <select 
                value={config.type}
                onChange={e => setConfig({ ...config, type: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-red-500"
              >
                <option value="FORMAL">Educación Formal (Colegio)</option>
                <option value="ETDH">Formación para el Trabajo (ETDH)</option>
                <option value="CORPORATE">Empresa Corporativa (Sin Módulos Educativos)</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'SIEE' && (
          <div className="space-y-10 max-w-3xl">
            <div className="grid grid-cols-3 gap-6">
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-center">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Nota Mínima</label>
                <input 
                  type="number" step="0.1"
                  value={config.sieeScale.min}
                  onChange={e => setConfig({ ...config, sieeScale: { ...config.sieeScale, min: parseFloat(e.target.value) } })}
                  className="w-24 bg-white border border-slate-200 rounded-xl px-4 py-2 text-xl font-black text-slate-900 text-center focus:outline-none focus:border-red-500 mx-auto"
                />
              </div>
              <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 text-center">
                <label className="block text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Nota Aprobatoria</label>
                <input 
                  type="number" step="0.1"
                  value={config.sieeScale.passing}
                  onChange={e => setConfig({ ...config, sieeScale: { ...config.sieeScale, passing: parseFloat(e.target.value) } })}
                  className="w-24 bg-white border border-emerald-200 rounded-xl px-4 py-2 text-xl font-black text-emerald-700 text-center focus:outline-none focus:border-emerald-500 mx-auto"
                />
              </div>
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-center">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Nota Máxima</label>
                <input 
                  type="number" step="0.1"
                  value={config.sieeScale.max}
                  onChange={e => setConfig({ ...config, sieeScale: { ...config.sieeScale, max: parseFloat(e.target.value) } })}
                  className="w-24 bg-white border border-slate-200 rounded-xl px-4 py-2 text-xl font-black text-slate-900 text-center focus:outline-none focus:border-red-500 mx-auto"
                />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-800 mb-4 border-b border-slate-100 pb-2">Niveles de Desempeño</h4>
              <div className="space-y-3">
                {config.sieeScale.levels.map((level, idx) => (
                  <div key={idx} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <input 
                      type="text" 
                      value={level.name}
                      onChange={e => {
                        const newLevels = [...config.sieeScale.levels];
                        newLevels[idx].name = e.target.value;
                        setConfig({ ...config, sieeScale: { ...config.sieeScale, levels: newLevels } });
                      }}
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:border-red-500"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-400">Min:</span>
                      <input 
                        type="number" step="0.1" value={level.min}
                        onChange={e => {
                          const newLevels = [...config.sieeScale.levels];
                          newLevels[idx].min = parseFloat(e.target.value);
                          setConfig({ ...config, sieeScale: { ...config.sieeScale, levels: newLevels } });
                        }}
                        className="w-20 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-center focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-400">Max:</span>
                      <input 
                        type="number" step="0.1" value={level.max}
                        onChange={e => {
                          const newLevels = [...config.sieeScale.levels];
                          newLevels[idx].max = parseFloat(e.target.value);
                          setConfig({ ...config, sieeScale: { ...config.sieeScale, levels: newLevels } });
                        }}
                        className="w-20 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-center focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'IMPORTACION' && (
          <div className="pt-4">
            <ExcelImporter />
          </div>
        )}
      </motion.div>
    </div>
  );
}
