'use client';

import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ShieldCheck, Heart, Award, Globe, CheckCircle2, ChevronRight, GraduationCap, BarChart3, Database } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  const [institution, setInstitution] = React.useState<any>(null);

  React.useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(setInstitution).catch(() => {});
  }, []);

  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 selection:bg-red-500/10 overflow-x-hidden font-sans">
      
      {/* Dynamic 3D-like Glowing Mesh Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          animate={{ rotate: 360, scale: [1, 1.1, 1] }} 
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-gradient-to-br from-red-600/10 to-transparent rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ rotate: -360, scale: [1, 1.2, 1] }} 
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-gradient-to-tl from-slate-300/30 to-transparent rounded-full blur-[140px]" 
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      {/* Glassmorphism Header */}
      <nav className="fixed top-0 w-full z-50 px-6 py-6 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex justify-between items-center bg-white/70 backdrop-blur-xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] px-8 py-4">
          {institution?.logoUrl ? (
            <img 
              src={institution.logoUrl} 
              alt="Institución" 
              className="h-10 md:h-12 w-auto object-contain"
              onError={(e) => { e.currentTarget.src = "https://ciudaddonbosco.org/wp-content/uploads/2025/07/CIUDAD-DON-BOSCO_CABECERA-04-1024x284.png"; }}
            />
          ) : (
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">
              {institution?.displayName || institution?.name || 'Sistema de Gestión'}
            </h1>
          )}
          <div className="hidden md:flex items-center gap-12 text-sm font-black text-slate-600 uppercase tracking-widest">
            <a href="#" className="hover:text-red-600 transition-colors">Institución</a>
            <a href="#" className="hover:text-red-600 transition-colors">SGC Educativo</a>
            <a href="#" className="hover:text-red-600 transition-colors">Normatividad</a>
          </div>
          <Link href="/login" className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all hover:pr-6 group">
            Ingresar <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </nav>

      <main className="relative pt-48 lg:pt-56 pb-32 px-6 max-w-[90rem] mx-auto z-10">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 pr-0 lg:pr-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-slate-200 shadow-sm text-red-600 text-[10px] font-black uppercase tracking-[0.2em] mb-12">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              Antigravity SGC 3.0 Live
            </div>
            
            <h1 className="text-6xl md:text-7xl lg:text-[6rem] font-black leading-[0.95] mb-8 text-slate-900 tracking-tighter">
              EXCELENCIA <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-400">
                CON SENTIDO.
              </span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-slate-500 leading-relaxed mb-14 max-w-2xl font-medium tracking-tight">
              Plataforma de inteligencia y control operativo. Auditable, inmutable y diseñada para {institution?.name || 'su institución'} bajo estándares internacionales de calidad.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-center mb-20">
              <Link href="/login" className="w-full sm:w-auto bg-slate-900 text-white text-sm font-black uppercase tracking-widest px-12 py-5 rounded-2xl shadow-2xl shadow-slate-900/20 hover:bg-slate-800 transition-all flex justify-center items-center gap-3 group">
                Acceso al SGC <ChevronRight className="group-hover:translate-x-1 transition-transform" size={18} />
              </Link>
              <button className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-white border border-slate-200 text-slate-600 font-black text-sm uppercase tracking-widest hover:border-red-200 hover:text-red-600 transition-all flex justify-center items-center gap-3 shadow-sm">
                <Database size={18} /> Auditoría Pública
              </button>
            </div>

            <div className="flex items-center gap-12 lg:gap-20">
              <div>
                <div className="text-4xl lg:text-5xl font-black text-slate-900">Ley 1620</div>
                <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-2 flex items-center gap-1">
                  <ShieldCheck size={12} className="text-emerald-500" /> Garantía Normativa
                </div>
              </div>
              <div className="w-px h-12 bg-slate-200" />
              <div>
                <div className="text-4xl lg:text-5xl font-black text-slate-900">100%</div>
                <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-2 flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-blue-500" /> Auditabilidad Real
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Content - Abstract UI Visuals */}
          <motion.div 
            className="lg:col-span-5 relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "circOut", delay: 0.2 }}
          >
            <div className="relative z-10">
              {/* Main Image Plate */}
              <div className="bg-white p-3 rounded-[3rem] border border-white/40 shadow-[0_20px_50px_rgb(0,0,0,0.1)] backdrop-blur-2xl relative overflow-hidden transform rotate-2 hover:rotate-0 transition-transform duration-700">
                <img 
                  src={institution?.logoUrl || "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1024&q=80"} 
                  alt={institution?.displayName || institution?.name || "Campus Institucional"} 
                  className="rounded-[2.5rem] w-full h-[600px] object-contain bg-slate-50 grayscale-[0.3] brightness-110 contrast-125 hover:grayscale-0 transition-all duration-700 p-8"
                />
                
                <div className="absolute inset-0 rounded-[2.5rem] ring-1 ring-inset ring-black/10" />

                {/* Floating Cards */}
                <motion.div 
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-10 -left-12 bg-white/90 backdrop-blur-xl p-5 rounded-3xl border border-white/50 shadow-2xl flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <BarChart3 size={24} />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Sistema SIEE</div>
                    <div className="font-black text-slate-900">Sincronizado</div>
                  </div>
                </motion.div>

                <motion.div 
                  animate={{ y: [0, 15, 0] }}
                  transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute bottom-12 -right-8 bg-slate-900/90 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 shadow-2xl w-64"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-white">
                      <ShieldCheck size={18} className="text-red-500" />
                      <span className="text-xs font-black uppercase tracking-widest">Audit Trail</span>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  </div>
                  <div className="space-y-3">
                    <div className="h-2 bg-slate-800 rounded-full w-full overflow-hidden">
                      <div className="h-full bg-red-500 w-[95%]" />
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full w-3/4 overflow-hidden">
                      <div className="h-full bg-emerald-500 w-[80%]" />
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Decorator Blur */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-red-600/20 to-blue-600/20 blur-[100px] -z-10 rounded-full" />
          </motion.div>
        </div>
      </main>

      {/* Feature Grid */}
      <section className="relative z-10 bg-white border-t border-slate-100 py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-4">Arquitectura de Clase Mundial</h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Tecnología al servicio del carisma salesiano</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Award, title: "Certificación ISO 21001", desc: "Listado maestro de documentos, auditorías automatizadas y trazabilidad exigida por NTC 5555." },
              { icon: GraduationCap, title: "Expediente 360", desc: "Visión unificada del estudiante: notas, planes de mejoramiento PHVA y casos de convivencia." },
              { icon: ShieldCheck, title: "Inmutabilidad L1620", desc: "Doble escritura (Dual-Write) en bases de datos relacionales y NoSQL para garantizar la integridad legal." }
            ].map((feature, idx) => (
              <div key={idx} className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 hover:border-red-200 hover:bg-white hover:shadow-[0_20px_40px_rgb(0,0,0,0.04)] transition-all duration-500 group">
                <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 group-hover:text-red-600 group-hover:scale-110 transition-all mb-8">
                  <feature.icon size={28} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-4">{feature.title}</h3>
                <p className="text-sm font-medium text-slate-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
