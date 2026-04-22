'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LogIn, 
  Mail, 
  Lock, 
  ArrowRight, 
  ShieldCheck, 
  Loader2,
  Building2,
  AlertCircle
} from 'lucide-react';
import Cookies from 'js-cookie';
import { auth } from '@/lib/firebase-client';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [institution, setInstitution] = useState<any>(null);
  const router = useRouter();

  React.useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(setInstitution).catch(() => {});
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      
      // Set session cookie (valid for 7 days)
      Cookies.set('session', token, { expires: 7 });
      
      router.push('/dashboard');
    } catch (err: any) {
      setError('Credenciales inválidas o error de conexión. Verifica tus datos.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {/* Background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-slate-500/10 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-red-600 font-black text-xs uppercase tracking-[0.2em] mb-4 bg-red-50 px-4 py-2 rounded-full border border-red-100">
             <Building2 size={16} /> {institution?.displayName || institution?.name || 'Gestión Institucional'}
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Acceso al <span className="text-red-600">SGC.</span></h1>
          <p className="text-slate-500 mt-2 font-medium">
            {institution?.type === 'CORPORATE' ? 'Sistema de Gestión Institucional' : 'Sistema de Gestión de Calidad SIEE'}
          </p>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-200 relative">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Institucional Email</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-600 transition-colors">
                  <Mail size={18} />
                </div>
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre.apellido@institucion.com"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold focus:bg-white focus:border-red-600 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña Segura</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-600 transition-colors">
                  <Lock size={18} />
                </div>
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold focus:bg-white focus:border-red-600 focus:outline-none transition-all"
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3 text-red-600"
              >
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p className="text-xs font-bold leading-relaxed">{error}</p>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 disabled:bg-slate-300 transition-all shadow-xl shadow-red-600/20 flex items-center justify-center gap-3 relative overflow-hidden"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <span>Validar Credenciales</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <Link href="/" className="flex items-center justify-center mt-8 text-xs font-bold text-slate-400 hover:text-red-600 transition-colors uppercase tracking-widest gap-2">
            Volver a la Web Principal
          </Link>
        </div>

        <div className="mt-10 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2 grayscale brightness-125 opacity-50">
            <ShieldCheck size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Encriptación SSL 256-bit</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
