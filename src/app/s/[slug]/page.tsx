'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Star, Loader2, AlertCircle, ChevronRight, Building2 } from 'lucide-react';
import { useParams } from 'next/navigation';

interface Question {
  id: string;
  text: string;
  type: 'rating' | 'text' | 'yesno';
  required?: boolean;
}

interface Survey {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  target: string;
}

export default function PublicSurveyPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [institution, setInstitution] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/surveys/${slug}`).then(r => r.json()),
      fetch('/api/settings').then(r => r.json()).catch(() => null)
    ]).then(([surveyData, inst]) => {
      if (surveyData.error) { setError(surveyData.error); }
      else setSurvey(surveyData);
      if (inst) setInstitution(inst);
      setLoading(false);
    });
  }, [slug]);

  const setAnswer = (qId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const handleSubmit = async () => {
    if (!survey) return;
    // Validate required
    const missing = survey.questions.filter(q => q.required && (answers[q.id] === undefined || answers[q.id] === ''));
    if (missing.length > 0) {
      alert(`Por favor responde las preguntas obligatorias: ${missing.map(q => q.text.slice(0, 30)).join(', ')}`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/surveys/${survey.id}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers })
      });
      if (res.ok) setSubmitted(true);
      else setError('Error al enviar. Por favor intenta de nuevo.');
    } catch { setError('Error de conexión. Por favor intenta de nuevo.'); }
    finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-slate-400" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
        <h1 className="text-xl font-black text-slate-900 mb-2">Encuesta no disponible</h1>
        <p className="text-slate-500">{error}</p>
      </div>
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md"
      >
        <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={48} className="text-emerald-400" />
        </div>
        <h1 className="text-3xl font-black text-white mb-3">¡Gracias por tu respuesta!</h1>
        <p className="text-slate-400 leading-relaxed">
          Tu opinión ha sido registrada exitosamente y ayudará a mejorar la calidad del servicio de{' '}
          <span className="text-white font-bold">{institution?.displayName || institution?.name || 'nuestra institución'}</span>.
        </p>
        {institution?.logoUrl && (
          <img src={institution.logoUrl} alt="Logo" className="h-12 object-contain mx-auto mt-8 opacity-60" onError={e => { e.currentTarget.style.display = 'none'; }} />
        )}
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Fixed background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          {institution?.logoUrl ? (
            <img src={institution.logoUrl} alt="Logo" className="h-12 object-contain mx-auto mb-4"
              onError={e => { e.currentTarget.style.display = 'none'; }} />
          ) : (
            <div className="inline-flex items-center gap-2 text-slate-600 font-black text-xs uppercase tracking-[0.2em] mb-4 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
              <Building2 size={14} /> {institution?.displayName || institution?.name || 'SGC Institucional'}
            </div>
          )}
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">{survey?.title}</h1>
          {survey?.description && (
            <p className="text-slate-500 mt-2 leading-relaxed max-w-lg mx-auto">{survey.description}</p>
          )}
          <div className="inline-block mt-3 px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-full">
            {survey?.target}
          </div>
        </motion.div>

        {/* Questions */}
        <div className="space-y-5">
          {survey?.questions.map((q, idx) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm p-7"
            >
              <div className="flex gap-3 items-start mb-4">
                <span className="w-7 h-7 rounded-xl bg-slate-900 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p className="font-black text-slate-900 leading-snug">
                  {q.text}
                  {q.required && <span className="text-red-500 ml-1">*</span>}
                </p>
              </div>

              {q.type === 'rating' && (
                <div className="flex gap-2 flex-wrap justify-center">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => setAnswer(q.id, star)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all ${
                        answers[q.id] >= star
                          ? 'border-amber-400 bg-amber-50 text-amber-600'
                          : 'border-slate-100 bg-slate-50 text-slate-300 hover:border-amber-200'
                      }`}
                    >
                      <Star size={24} fill={answers[q.id] >= star ? 'currentColor' : 'none'} />
                      <span className="text-[10px] font-black">{star}</span>
                    </button>
                  ))}
                </div>
              )}

              {q.type === 'yesno' && (
                <div className="flex gap-4">
                  {[{ val: true, label: 'Sí ✅' }, { val: false, label: 'No ❌' }].map(opt => (
                    <button
                      key={String(opt.val)}
                      onClick={() => setAnswer(q.id, opt.val)}
                      className={`flex-1 py-4 rounded-2xl border-2 font-black text-sm transition-all ${
                        answers[q.id] === opt.val
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {q.type === 'text' && (
                <textarea
                  rows={3}
                  placeholder="Escribe tu respuesta aquí..."
                  value={answers[q.id] || ''}
                  onChange={e => setAnswer(q.id, e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none resize-none transition-all"
                />
              )}
            </motion.div>
          ))}
        </div>

        {/* Submit */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-8">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-slate-900 hover:bg-red-600 text-white font-black text-sm uppercase tracking-widest py-5 rounded-3xl flex items-center justify-center gap-3 transition-all duration-300 disabled:opacity-60 shadow-xl shadow-slate-900/20"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <ChevronRight size={18} />}
            {submitting ? 'Enviando...' : 'Enviar Respuestas'}
          </button>
          <p className="text-center text-[10px] text-slate-400 mt-4 font-bold">
            Tus respuestas son anónimas y se usan únicamente para mejorar la calidad del servicio institucional.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
