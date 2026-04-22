'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus, Shield, Mail, Lock, Trash2, 
  UserCheck, Loader2, AlertCircle, Search,
  GraduationCap, Briefcase, Key, CheckCircle2, X, HelpCircle, FileSpreadsheet, FileText,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  _count?: { subjects: number };
}

const ROLES = [
  { id: 'ADMIN', label: 'Administrador', icon: Shield, color: 'text-red-600 bg-red-50', desc: 'Soberanía total sobre el sistema y auditoría.' },
  { id: 'COORDINADOR', label: 'Coordinador', icon: Briefcase, color: 'text-blue-600 bg-blue-50', desc: 'Gestión académica, convivencia y PHVA.' },
  { id: 'DOCENTE', label: 'Docente', icon: GraduationCap, color: 'text-emerald-600 bg-emerald-50', desc: 'Carga de notas y seguimiento a estudiantes.' },
];

export default function UsersModule() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const helpInstructions = [
    { title: 'Roles del Sistema', text: 'Administrador: acceso total. Coordinador: gestión académica y convivencia. Docente: notas y PHVA.' },
    { title: 'Crear Usuario', text: 'Al crear un usuario, se registra en Firebase Auth y en la base de datos local. El usuario recibirá acceso inmediato.' },
    { title: 'Seguridad (RBAC)', text: 'El sistema aplica Control de Acceso Basado en Roles. Cada usuario solo verá las secciones permitidas por su rol.' },
    { title: 'Eliminar Acceso', text: 'Al eliminar un usuario, se revoca su acceso de inmediato. Pasa el cursor sobre la tarjeta para ver el botón de eliminar.' }
  ];

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'DOCENTE' as string,
  });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      showToast('Error al cargar usuarios', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      
      if (res.ok) {
        showToast('Usuario institucional creado exitosamente');
        setShowModal(false);
        setForm({ name: '', email: '', password: '', role: 'DOCENTE' });
        fetchUsers();
      } else {
        const data = await res.json();
        showToast(data.error || 'Error al crear usuario', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este usuario? Revocará todo acceso de inmediato.')) return;
    
    try {
      const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== id));
        showToast('Acceso revocado correctamente');
      }
    } catch (e) {
      showToast('Error al eliminar', 'error');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredUsers.map(u => ({
      Nombre: u.name, Email: u.email, Rol: u.role, Creado: new Date(u.createdAt).toLocaleDateString()
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');
    XLSX.writeFile(wb, `usuarios_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Directorio de Usuarios', 14, 20);
    autoTable(doc, {
      startY: 30,
      head: [['Nombre', 'Email', 'Rol', 'Creado']],
      body: filteredUsers.map(u => [u.name, u.email, u.role, new Date(u.createdAt).toLocaleDateString()])
    });
    doc.save(`usuarios_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-slate-900 rounded-3xl text-white shadow-xl shadow-slate-900/20">
            <Key size={28} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Gestión de Cuentas</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Control Institucional · RBAC</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowHelp(true)}
            className="flex items-center gap-2 px-4 py-3 bg-blue-50 text-blue-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-100 transition-all border border-blue-100 hidden md:flex"
          >
            <HelpCircle size={16} /> Guía
          </button>
          <button onClick={exportExcel} className="hidden md:flex items-center gap-2 px-4 py-3 bg-emerald-50 text-emerald-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-100 transition-all">
            <FileSpreadsheet size={16} /> Excel
          </button>
          <button onClick={exportPDF} className="hidden md:flex items-center gap-2 px-4 py-3 bg-rose-50 text-rose-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-rose-100 transition-all">
            <FileText size={16} /> PDF
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
          >
            <UserPlus size={16} /> Crear Invitación
          </button>
        </div>
      </div>

      {/* Search & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-2 relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-600 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold focus:border-red-600 focus:outline-none transition-all"
          />
        </div>
        <div className="bg-white p-4 border border-slate-100 rounded-2xl flex items-center gap-4">
           <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center font-black text-slate-900">{users.length}</div>
           <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Usuarios</div>
        </div>
        <div className="bg-white p-4 border border-slate-100 rounded-2xl flex items-center gap-4">
           <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-black">{users.filter(u => u.role === 'DOCENTE').length}</div>
           <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Docentes Activos</div>
        </div>
      </div>

      {/* Users Table / Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center">
          <Loader2 size={40} className="animate-spin text-slate-200 mb-4" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Autenticando usuarios...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => {
            const roleCfg = ROLES.find(r => r.id === user.role) || ROLES[2];
            return (
              <motion.div 
                layout
                key={user.id}
                className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-4 rounded-3xl ${roleCfg.color}`}>
                    <roleCfg.icon size={24} />
                  </div>
                  <button 
                    onClick={() => handleDelete(user.id)}
                    className="p-3 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="space-y-4">
                   <div>
                      <h4 className="text-lg font-black text-slate-900 leading-tight">{user.name}</h4>
                      <p className="text-sm font-medium text-slate-400 truncate">{user.email}</p>
                   </div>

                   <div className="flex items-center gap-3">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${roleCfg.color.replace('bg-','border-')}`}>
                        {roleCfg.label}
                      </span>
                      {user.role === 'DOCENTE' && (
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          {user._count?.subjects || 0} Materias
                        </span>
                      )}
                   </div>

                   <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                     <div className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">Desde {new Date(user.createdAt).toLocaleDateString()}</div>
                     <UserCheck size={14} className="text-emerald-500" />
                   </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[2.5rem] max-w-2xl w-full p-10 shadow-2xl">
            <div className="absolute top-10 right-10">
              <button onClick={() => setShowHelp(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} className="text-slate-400" /></button>
            </div>
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-lg"><Key size={32} /></div>
              <div>
                <h3 className="text-2xl font-black text-slate-800">Guía de Usuarios y Roles</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Módulo: Gestión de Cuentas (RBAC)</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {helpInstructions.map((item, i) => (
                <div key={i} className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <h4 className="text-sm font-black text-red-600 mb-2 uppercase tracking-tight">{item.title}</h4>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 p-6 bg-red-600 rounded-3xl text-white">
              <p className="text-xs font-black uppercase tracking-widest mb-1">🔐 Principio de Menor Privilegio</p>
              <p className="text-[11px] font-medium leading-relaxed opacity-90">Asigna siempre el rol mínimo necesario. Un Docente no necesita acceder a los Logs de Auditoría ni a la Gestión de Usuarios.</p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-slate-900 p-10 text-white relative">
                 <h4 className="text-2xl font-black tracking-tight">Nueva Cuenta</h4>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Soberanía de Datos SGC</p>
                 <button onClick={() => setShowModal(false)} className="absolute top-10 right-10 p-2 hover:bg-white/10 rounded-xl">
                   <X size={20} />
                 </button>
              </div>

              <form onSubmit={handleCreate} className="p-10 space-y-6">
                <div className="space-y-4">
                  <div className="relative">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-4 mb-1 block">Nombre Completo</label>
                    <input 
                      type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                      placeholder="Ej: Lic. Adriana Gomez"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold focus:border-slate-900 focus:outline-none transition-all"
                    />
                  </div>

                  <div className="relative">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-4 mb-1 block">Correo Institucional</label>
                    <input 
                      type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                      placeholder="agomez@donbosco.org"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold focus:border-slate-900 focus:outline-none transition-all"
                    />
                  </div>

                  <div className="relative">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-4 mb-1 block">Contraseña Inicial</label>
                    <input 
                      type="password" required value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold focus:border-slate-900 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-4 mb-1 block">Rol de Usuario</label>
                  <div className="grid grid-cols-3 gap-3">
                    {ROLES.map(r => (
                      <button
                        key={r.id} type="button"
                        onClick={() => setForm({...form, role: r.id})}
                        className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                          form.role === r.id ? 'border-red-600 bg-red-50 text-red-600' : 'border-slate-50 text-slate-400'
                        }`}
                      >
                        <r.icon size={18} />
                        <span className="text-[8px] font-black uppercase tracking-tighter">{r.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  type="submit" disabled={saving}
                  className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black text-xs uppercase tracking-[0.25em] hover:bg-slate-800 disabled:bg-slate-200 transition-all flex items-center justify-center gap-3 mt-4"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <UserCheck size={18} />} Crear Usuario
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      {toast && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className={`fixed bottom-10 right-10 z-[110] px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 ${
            toast.type === 'success' ? 'bg-slate-900 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="text-emerald-400" /> : <AlertCircle />}
          <span className="text-xs font-black uppercase tracking-widest">{toast.msg}</span>
        </motion.div>
      )}
    </div>
  );
}
