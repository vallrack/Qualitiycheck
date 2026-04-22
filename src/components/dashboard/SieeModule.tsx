'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Users, Save, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

export default function SieeModule() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [period, setPeriod] = useState<number>(1);
  const [students, setStudents] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [savingStatus, setSavingStatus] = useState<Record<string, 'idle' | 'saving' | 'saved' | 'error'>>({});

  useEffect(() => {
    // Cargar materias formales
    fetch('/api/curriculum')
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) {
          console.error("Invalid curriculum data received:", data);
          return;
        }
        // Extraer materias de las áreas
        const allSubjects: any[] = [];
        data.forEach((area: any) => {
          area.subjects?.forEach((sub: any) => {
            allSubjects.push({ ...sub, areaName: area.name });
          });
        });
        setSubjects(allSubjects);
      })
      .catch(err => console.error("Error fetching curriculum:", err));
  }, []);

  useEffect(() => {
    if (!selectedSubject) return;
    const loadClassroom = async () => {
      setLoading(true);
      try {
        const sub = subjects.find(s => s.id === selectedSubject);
        if (!sub) return;

        // 1. Obtener estudiantes del grado correspondiente a la materia
        const stuRes = await fetch(`/api/students?grade=${sub.grade}`);
        const stuData = await stuRes.json();
        
        // 2. Obtener evaluaciones previas de esta materia y periodo
        const evalRes = await fetch(`/api/siee?subjectId=${sub.id}&period=${period}`);
        let evalData = [];
        if (evalRes.ok) {
           evalData = await evalRes.json();
        }

        const evalMap: Record<string, any> = {};
        evalData.forEach((e: any) => {
          evalMap[e.studentId] = {
            cognitiveScore: e.cognitiveScore,
            personalScore: e.personalScore,
            socialScore: e.socialScore,
            finalScore: e.finalScore,
            observations: e.observations || ''
          };
        });

        setStudents(stuData.students || []);
        setEvaluations(evalMap);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadClassroom();
  }, [selectedSubject, period, subjects]);

  const handleScoreChange = (studentId: string, field: string, value: string) => {
    let num = parseFloat(value);
    if (isNaN(num)) num = 0;
    if (num > 5) num = 5; // Max scale in Colombia standard is usually 5.0
    if (num < 0) num = 0;

    setEvaluations(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { cognitiveScore: 0, personalScore: 0, socialScore: 0, observations: '' }),
        [field]: field === 'observations' ? value : num
      }
    }));
  };

  const calculatePreview = (studentId: string) => {
    const ev = evaluations[studentId];
    if (!ev) return 0;
    return (ev.cognitiveScore * 0.6 + ev.personalScore * 0.2 + ev.socialScore * 0.2).toFixed(1);
  };

  const saveEvaluation = async (studentId: string) => {
    const ev = evaluations[studentId];
    if (!ev) return;

    setSavingStatus(prev => ({ ...prev, [studentId]: 'saving' }));

    try {
      const res = await fetch('/api/siee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          subjectId: selectedSubject,
          period,
          cognitiveScore: ev.cognitiveScore,
          personalScore: ev.personalScore,
          socialScore: ev.socialScore,
          observations: ev.observations
        }),
      });

      if (res.ok) {
        setSavingStatus(prev => ({ ...prev, [studentId]: 'saved' }));
        setTimeout(() => setSavingStatus(prev => ({ ...prev, [studentId]: 'idle' })), 3000);
      } else {
        setSavingStatus(prev => ({ ...prev, [studentId]: 'error' }));
      }
    } catch {
      setSavingStatus(prev => ({ ...prev, [studentId]: 'error' }));
    }
  };

  return (
    <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center border border-red-100 shadow-inner">
          <BookOpen size={28} />
        </div>
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Evaluación SIEE</h2>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">
            Ministerio de Educación Nacional - Decreto 1290
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 shadow-inner flex flex-wrap gap-6 items-end mb-10">
        <div className="flex-1 min-w-[250px]">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Asignatura y Grado</label>
          <select 
            value={selectedSubject} 
            onChange={e => setSelectedSubject(e.target.value)}
            className="w-full bg-white border border-slate-300 text-slate-700 text-sm font-bold rounded-2xl focus:ring-red-500 focus:border-red-500 block p-3"
          >
            <option value="">-- Seleccionar Asignatura --</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name} - Grado {s.grade} ({s.areaName})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Período Académico</label>
          <select 
            value={period} 
            onChange={e => setPeriod(Number(e.target.value))}
            className="bg-white border border-slate-300 text-slate-700 text-sm font-bold rounded-2xl focus:ring-red-500 focus:border-red-500 p-3 w-40"
          >
            {[1, 2, 3, 4].map(p => (
              <option key={p} value={p}>Período {p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading State or Table */}
      {selectedSubject && (
        <div className="border border-slate-200 rounded-[2rem] overflow-hidden">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="animate-spin mb-4" size={32} />
              <span className="text-xs font-black uppercase tracking-widest">Cargando nómina de estudiantes...</span>
            </div>
          ) : students.length === 0 ? (
            <div className="p-20 flex flex-col items-center justify-center text-slate-400">
              <Users size={48} className="mb-4 opacity-50" />
              <span className="text-sm font-bold">No hay estudiantes matriculados en este grado.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Estudiante</th>
                    <th className="px-4 py-4 w-24 text-center">Cognitivo (60%)</th>
                    <th className="px-4 py-4 w-24 text-center">Personal (20%)</th>
                    <th className="px-4 py-4 w-24 text-center">Social (20%)</th>
                    <th className="px-4 py-4 w-24 text-center text-red-600">Nota Final</th>
                    <th className="px-6 py-4 w-24 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold">
                  {students.map(student => (
                    <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 text-slate-900 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-black text-slate-500">
                           {student.name.charAt(0)}
                        </div>
                        {student.name}
                      </td>
                      <td className="px-4 py-2">
                        <input type="number" step="0.1" max="5" min="0"
                          title="Dimensión Cognitiva"
                          value={evaluations[student.id]?.cognitiveScore || ''}
                          onChange={e => handleScoreChange(student.id, 'cognitiveScore', e.target.value)}
                          className="w-full bg-white border border-slate-200 text-center rounded-xl p-2 focus:ring-red-500 focus:border-red-500 transition-all font-black text-slate-700"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input type="number" step="0.1" max="5" min="0" title="Dimensión Personal"
                          value={evaluations[student.id]?.personalScore || ''}
                          onChange={e => handleScoreChange(student.id, 'personalScore', e.target.value)}
                          className="w-full bg-white border border-slate-200 text-center rounded-xl p-2 focus:ring-red-500 focus:border-red-500 transition-all font-black text-slate-700"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input type="number" step="0.1" max="5" min="0" title="Dimensión Social"
                          value={evaluations[student.id]?.socialScore || ''}
                          onChange={e => handleScoreChange(student.id, 'socialScore', e.target.value)}
                          className="w-full bg-white border border-slate-200 text-center rounded-xl p-2 focus:ring-red-500 focus:border-red-500 transition-all font-black text-slate-700"
                        />
                      </td>
                      <td className="px-4 py-2 text-center text-lg font-black text-red-600">
                        {calculatePreview(student.id)}
                      </td>
                      <td className="px-6 py-2 text-center">
                        <button 
                          onClick={() => saveEvaluation(student.id)}
                          disabled={savingStatus[student.id] === 'saving'}
                          className={`p-2 rounded-xl text-white transition-all w-10 h-10 flex items-center justify-center shadow-lg ${
                            savingStatus[student.id] === 'saved' ? 'bg-emerald-500 shadow-emerald-500/20' 
                            : savingStatus[student.id] === 'error' ? 'bg-amber-500' 
                            : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/20'
                          }`}
                        >
                          {savingStatus[student.id] === 'saving' ? <Loader2 size={16} className="animate-spin" />
                           : savingStatus[student.id] === 'saved' ? <CheckCircle size={16} /> 
                           : savingStatus[student.id] === 'error' ? <AlertTriangle size={16} /> 
                           : <Save size={16} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
