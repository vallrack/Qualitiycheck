'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Users, 
  FileText, 
  BarChart3, 
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  Activity,
  LogOut,
  Settings,
  Bell,
  Search,
  LayoutDashboard,
  ExternalLink,
  Eye,
  Calendar,
  RefreshCw as RefreshCwIcon,
  User as UserIcon,
  Menu,
  X,
  Moon,
  Sun,
  Target,
  Brain,
  GraduationCap as GraduationCapIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { auth } from '@/lib/firebase-client';
import { signOut } from 'firebase/auth';
import AIAssistantCard from '@/components/dashboard/AIAssistantCard';
import ConvivenciaWizard from '@/components/dashboard/ConvivenciaWizard';
import SettingsModule from '@/components/dashboard/SettingsModule';
import AuditLogModule from '@/components/dashboard/AuditLogModule';
import CurriculumBuilder from '@/components/dashboard/CurriculumBuilder';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import SieeModule from '@/components/dashboard/SieeModule';
import StudentsModule from '@/components/dashboard/StudentsModule';
import PHVAModule from '@/components/dashboard/PHVAModule';
import UsersModule from '@/components/dashboard/UsersModule';
import ConvivenciaModule from '@/components/dashboard/ConvivenciaModule';
import QualityDocumentModule from '@/components/dashboard/QualityDocumentModule';
import QualityEvaluationModule from '@/components/dashboard/QualityEvaluationModule';
import EvidenceAuditModule from '@/components/dashboard/EvidenceAuditModule';
import SurveyModule from '@/components/dashboard/SurveyModule';
import DofaModule from '@/components/dashboard/DofaModule';
import KpiModule from '@/components/dashboard/KpiModule';
import DocumentIntelligence from '@/components/dashboard/DocumentIntelligence';
import { generateConvivenciaAct } from '@/lib/pdf-export';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = React.useState('Dashboard');
  const [showWizard, setShowWizard] = React.useState(false);
  const [user, setUser] = useState<any>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [helpModal, setHelpModal] = useState<{ title: string; items: any[] } | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [theme, setTheme] = useState('light');
  const [institution, setInstitution] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Check saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    if (savedTheme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  const sectionHelp: Record<string, { title: string; items: { title: string; text: string }[] }> = {
    'Estudiantes': {
      title: 'Módulo de Estudiantes',
      items: [
        { title: 'Buscar Estudiante', text: 'Usa la barra de búsqueda para filtrar por nombre, documento o grado.' },
        { title: 'Importar Masivo', text: 'Carga un archivo Excel con los estudiantes desde el módulo Configuración.' },
        { title: 'Perfil del Estudiante', text: 'Haz clic en un estudiante para ver su historial académico y casos de convivencia.' },
      ]
    },
    'Convivencia (L1620)': {
      title: 'Comité de Convivencia — Ley 1620',
      items: [
        { title: 'Nuevo Caso', text: 'Usa el botón rojo "Nuevo Caso" para registrar un incidente. La IA lo clasificará automáticamente en Tipo I, II o III.' },
        { title: 'Gestionar Caso', text: 'Haz clic en "Gestionar" para actualizar el estado de un caso (Abierto / Cerrado) y añadir resoluciones.' },
        { title: 'Generar Acta', text: 'El botón "Acta" exporta el caso en un PDF oficial listo para firmar.' },
      ]
    },
    'Gestión Curricular': {
      title: 'Constructor Curricular',
      items: [
        { title: 'Diseño por Áreas', text: 'Crea asignaturas organizadas por área del conocimiento (Ley 115).' },
        { title: 'Planeación por Período', text: 'Registra los DBA, competencias e indicadores de logro para cada período.' },
        { title: 'Vinculación', text: 'Asocia las asignaturas a los grados y al programa institucional.' },
      ]
    },
    'Evaluación SIEE': {
      title: 'Sistema Institucional de Evaluación',
      items: [
        { title: 'Registro de Notas', text: 'Los docentes ingresan aquí las dimensiones (Cognitiva, Personal, Social) de cada estudiante.' },
        { title: 'Escala Institucional', text: 'El sistema aplica la escala de desempeño definida en la configuración (Bajo, Básico, Alto, Superior).' },
        { title: 'Alertas Tempranas', text: 'Estudiantes con notas bajo 3.0 aparecerán automáticamente marcados para Plan de Mejoramiento.' },
      ]
    },
    'Ciclo PHVA': {
      title: 'Planes de Mejoramiento Individual (PHVA)',
      items: [
        { title: 'Planear', text: 'La IA diagnostica el desempeño y propone metas de aprendizaje personalizadas.' },
        { title: 'Hacer', text: 'El sistema sugiere actividades de nivelación según la asignatura y el nivel de riesgo.' },
        { title: 'Verificar y Actuar', text: 'Se definen indicadores de seguimiento y compromisos para el estudiante y su acudiente.' },
      ]
    },
    'Evaluación de Calidad': {
      title: 'Auditoría Maestra de Calidad (NTC 5555)',
      items: [
        { title: 'Paso 1 — KPIs', text: 'Revisa o ingresa manualmente los indicadores de aprobación, satisfacción y cobertura.' },
        { title: 'Paso 2 — Checklist', text: 'Verifica los numerales de la norma aplicable (NTC 5555 para ETDH, ISO 21001 para Formal).' },
        { title: 'Paso 3 — Dictamen IA', text: 'La IA genera el informe de cumplimiento con fortalezas, no conformidades y plan de acción.' },
      ]
    },
    'Gestión Documental': {
      title: 'Listado Maestro de Documentos',
      items: [
        { title: 'Sincronizar', text: 'Importa automáticamente los documentos existentes en la carpeta /normas del servidor.' },
        { title: 'Subida Masiva', text: 'Arrastra múltiples archivos PDF o Excel para registrarlos en masa.' },
        { title: 'Ciclo de Vida', text: 'Cada documento pasa por: EN REVISIÓN → Firma Digital → VIGENTE.' },
      ]
    },
    'Auditoría IA': {
      title: 'Auditoría Documental Universal',
      items: [
        { title: 'Evaluación Normativa', text: 'Carga documentos (Encuestas, Diseños Curriculares, SIEE) y evalúalos contra cualquier norma (ISO 21001, NTC 5555).' },
        { title: 'Análisis de IA', text: 'El motor extrae el texto y determina el nivel de cumplimiento y los hallazgos de forma automática.' },
      ]
    },
    'Gestión de Usuarios': {
      title: 'Administración de Cuentas y Roles',
      items: [
        { title: 'Roles Disponibles', text: 'Admin: acceso total. Coordinador: gestión académica. Docente: solo notas y PHVA.' },
        { title: 'Crear Usuario', text: 'Al registrar un usuario se crea en Firebase Auth y en la base de datos de forma simultánea.' },
        { title: 'Seguridad RBAC', text: 'Los permisos se aplican automáticamente. El usuario solo verá los módulos de su rol.' },
      ]
    },
    'Auditoría & Logs': {
      title: 'Centro de Trazabilidad del Sistema',
      items: [
        { title: 'Registro Inmutable', text: 'Cada acción crítica queda registrada de forma permanente en MySQL y Firestore.' },
        { title: 'Niveles de Alerta', text: 'Low (info), Medium (cambios), High (riesgo), Critical (fallas o seguridad).' },
        { title: 'Evidencia para Auditorías', text: 'Este panel sirve como evidencia oficial ante ICONTEC o la Secretaría de Educación.' },
      ]
    },
    'Matriz DOFA': {
      title: 'Análisis Estratégico (SWOT)',
      items: [
        { title: 'Cuadrantes', text: 'Define Fortalezas, Oportunidades, Debilidades y Amenazas para el análisis de contexto ISO 21001.' },
        { title: 'Importación', text: 'Carga tus análisis existentes desde archivos Excel o Word directamente.' },
        { title: 'Categorización', text: 'Clasifica cada factor por área (Académica, Administrativa) para reportes detallados.' },
      ]
    },
    'Gestión de KPIs': {
      title: 'Tablero de Indicadores Clave',
      items: [
        { title: 'Niveles', text: 'Configura KPIs Institucionales, por Área o Personales para un seguimiento en cascada.' },
        { title: 'Metas', text: 'Define valores objetivo y monitorea el progreso en tiempo real con gráficos de tendencia.' },
        { title: 'Historial', text: 'Registra avances periódicos y mantén un registro inmutable del desempeño de calidad.' },
      ]
    },
    'Inteligencia Documental': {
      title: 'Cerebro de Gestión IA',
      items: [
        { title: 'Clasificación', text: 'Sube cualquier archivo y la IA identificará si es un acta, informe o manual automáticamente.' },
        { title: 'Extracción', text: 'Extrae métricas, KPIs y planes de acción directamente del texto del documento.' },
        { title: 'Sincronización', text: 'Los datos hallados pueden sincronizarse con tus tableros de control con un solo clic.' },
      ]
    },
  };

  const handleLogout = () => {
    // Instant logout: clear cookie and hard redirect immediately to the main website
    Cookies.remove('session');
    window.location.href = '/';
    // Fire-and-forget Firebase signOut in background
    signOut(auth).catch(() => {});
  };

  const fetchCases = async () => {
    setLoadingCases(true);
    try {
      const res = await fetch('/api/convivencia');
      if (res.ok) {
        const data = await res.json();
        setCases(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
    } finally {
      setLoadingCases(false);
    }
  };

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        router.push('/login');
      }
    } catch (e) { console.error(e); }
  };

  const fetchInstitution = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setInstitution(data);
      }
    } catch (e) { console.error(e); }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markNotificationRead = async (id: string, link?: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      if (link) {
        setActiveTab(link);
        setShowNotificationsDropdown(false);
      }
    } catch (e) { console.error(e); }
  };

  const markAllNotificationsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllRead' })
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchUser();
    fetchInstitution();
    fetchCases();
    fetchNotifications();
  }, [activeTab, showWizard]);

  const stats = [
    { label: 'Indice de Calidad', value: '98.2%', change: '+0.4%', icon: ShieldCheck, trend: 'up' },
    { label: 'Casos Abiertos (1620)', value: cases.length.toString(), change: '+2', icon: Activity, trend: 'up' },
    { label: 'Documentos Maestros', value: '145', change: '+5', icon: FileText, trend: 'up' },
    { label: 'Alertas Tempranas', value: '02', change: 'Estable', icon: AlertTriangle, trend: 'neutral' },
  ];

  const allMenuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'COORDINADOR', 'DOCENTE'], type: 'ALL' },
    { label: 'Estudiantes', icon: Users, roles: ['ADMIN', 'COORDINADOR', 'DOCENTE'], type: 'EDU' },
    { label: 'Convivencia (L1620)', icon: Activity, roles: ['ADMIN', 'COORDINADOR'], type: 'EDU' },
    { label: 'Gestión Curricular', icon: GraduationCapIcon, roles: ['ADMIN', 'COORDINADOR'], type: 'EDU' },
    { label: 'Evaluación SIEE', icon: BarChart3, roles: ['ADMIN', 'COORDINADOR', 'DOCENTE'], type: 'EDU' },
    { label: 'Ciclo PHVA', icon: RefreshCwIcon, roles: ['ADMIN', 'COORDINADOR'], type: 'EDU' },
    { label: 'Evaluación de Calidad', icon: ShieldCheck, roles: ['ADMIN', 'COORDINADOR'], type: 'ALL' },
    { label: 'Matriz DOFA', icon: Target, roles: ['ADMIN', 'COORDINADOR'], type: 'ALL' },
    { label: 'Inteligencia Documental', icon: Brain, roles: ['ADMIN', 'COORDINADOR'], type: 'ALL' },
    { label: 'Métricas e Indicadores', icon: BarChart3, roles: ['ADMIN', 'COORDINADOR', 'DOCENTE'], type: 'ALL' },
    { label: 'Encuestas', icon: Bell, roles: ['ADMIN', 'COORDINADOR'], type: 'ALL' },
    { label: 'Gestión Documental', icon: FileText, roles: ['ADMIN', 'COORDINADOR'], type: 'ALL' },
    { label: 'Gestión de Usuarios', icon: UserIcon, roles: ['ADMIN'], type: 'ALL' },
    { label: 'Auditoría & Logs', icon: ShieldCheck, roles: ['ADMIN'], type: 'ALL' },
    { label: 'Configuración', icon: Settings, roles: ['ADMIN'], type: 'ALL' },
  ];

  const isCorporate = institution?.type === 'CORPORATE';
  const menuItems = allMenuItems.filter(item => {
    if (user && !item.roles.includes(user.role)) return false;
    if (isCorporate && item.type === 'EDU') return false;
    return true;
  });

  const SidebarContent = () => (
    <>
      <div className="p-8 border-b border-slate-100 bg-white cursor-pointer" onClick={() => { setActiveTab('Dashboard'); setShowWizard(false); setIsSidebarOpen(false); }}>
        {institution?.logoUrl ? (
          <img 
            src={institution.logoUrl} 
            alt="Logo Institucional" 
            className="h-10 w-auto object-contain"
            onError={(e) => { e.currentTarget.src = "https://ciudaddonbosco.org/wp-content/uploads/2025/07/CIUDAD-DON-BOSCO_CABECERA-04-1024x284.png"; }}
          />
        ) : (
          <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">
            {institution?.displayName || institution?.name || 'Sistema Gestión'}
          </h1>
        )}
      </div>
      
      <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
        {menuItems.map((item, idx) => (
          <div 
            key={idx} 
            onClick={() => {
              setActiveTab(item.label);
              if (item.label !== 'Convivencia (L1620)') setShowWizard(false);
              setIsSidebarOpen(false);
              router.refresh(); // Force fresh data on every navigation
              // Show help modal if instructions exist for this section
              if (sectionHelp[item.label]) {
                setHelpModal(sectionHelp[item.label]);
              }
            }}
            className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all cursor-pointer group ${
              activeTab === item.label ? 'bg-red-600 text-white shadow-xl shadow-red-600/20' : 'text-slate-500 hover:bg-slate-50 hover:text-red-600'
            }`}
          >
            <item.icon size={22} className={activeTab === item.label ? '' : 'group-hover:scale-110 transition-transform'} />
            <span className="font-bold text-[13px] uppercase tracking-widest">{item.label}</span>
          </div>
        ))}
      </nav>

      <div className="p-8 border-t border-slate-100">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-5 py-3 rounded-2xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all font-bold text-sm"
        >
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
        {/* Global Section Help Modal */}
        <AnimatePresence>
          {helpModal && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[250] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6"
              onClick={() => setHelpModal(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-[2.5rem] max-w-2xl w-full p-10 shadow-2xl relative"
                onClick={e => e.stopPropagation()}
              >
                <button onClick={() => setHelpModal(null)} className="absolute top-8 right-8 p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={24} className="text-slate-400" />
                </button>
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-red-600 rounded-2xl text-white shadow-lg">
                    <ShieldCheck size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800">{helpModal.title}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Guía de Operación del Módulo</p>
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  {helpModal.items.map((item: any, i: number) => (
                    <div key={i} className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                      <h4 className="text-xs font-black text-red-600 uppercase tracking-tight mb-2">{item.title}</h4>
                      <p className="text-[11px] text-slate-600 font-medium leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setHelpModal(null)}
                  className="mt-8 w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all"
                >
                  Entendido — Ir al módulo
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Evidence Viewer Modal */}
      <AnimatePresence>
        {selectedEvidence && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-10"
            onClick={() => setSelectedEvidence(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="relative max-w-5xl w-full bg-white rounded-[3rem] overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-6 right-6 z-10">
                <button 
                  onClick={() => setSelectedEvidence(null)}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white p-3 rounded-2xl transition-all"
                >
                  <LogOut size={24} className="rotate-180" />
                </button>
              </div>
              <img 
                src={selectedEvidence} 
                alt="Evidencia" 
                className="w-full h-auto max-h-[80vh] object-contain bg-slate-100"
              />
              <div className="p-8 bg-white flex justify-between items-center">
                <div>
                  <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Vista Previa de Evidencia</h4>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Almacenamiento Local Seguro</p>
                </div>
                <a 
                  href={selectedEvidence} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all flex items-center gap-2"
                >
                  Abrir en Nueva Pestaña <ExternalLink size={16} />
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Convivencia Wizard Modal */}
      <AnimatePresence>
        {showWizard && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6 overflow-y-auto"
            onClick={() => setShowWizard(false)}
          >
            <div className="relative max-w-4xl w-full my-auto" onClick={e => e.stopPropagation()}>
              <div className="absolute -top-12 right-0 z-10 flex gap-2">
                <button 
                  onClick={() => setShowWizard(false)}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white p-2 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
                >
                  <LogOut size={16} className="rotate-180" /> Cerrar Mago
                </button>
              </div>
              <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}>
                 <ConvivenciaWizard institution={institution} onComplete={() => { setShowWizard(false); fetchCases(); }} />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 bg-white border-r border-slate-200 flex-col h-screen sticky top-0 shrink-0 shadow-sm">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm lg:hidden"
            />
            <motion.aside 
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="fixed inset-y-0 left-0 z-[60] w-72 bg-white flex flex-col shadow-2xl lg:hidden"
            >
              <div className="absolute top-6 right-6 lg:hidden">
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                  <X size={24} />
                </button>
              </div>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Superior Status Bar */}
        <header className="h-20 lg:h-24 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 lg:px-10 flex justify-between items-center sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:text-red-600 transition-colors"
            >
              <Menu size={24} />
            </button>
            <div className="hidden md:flex items-center gap-4 bg-slate-100 px-6 py-3 rounded-2xl border border-slate-200/50 w-[300px] xl:w-[450px]">
              <Search size={18} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar..." 
                className="bg-transparent border-none outline-none text-sm w-full text-slate-700 font-bold" 
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4 lg:gap-8">
            <motion.button 
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-full transition-all"
            >
              {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
            </motion.button>
            <div className="relative hidden sm:block">
              <button 
                onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                className="relative p-2 text-slate-500 hover:text-red-600 hover:bg-slate-50 rounded-full transition-all"
              >
                <Bell size={22} />
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-white animate-pulse" />
                )}
              </button>

              <AnimatePresence>
                {showNotificationsDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotificationsDropdown(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-12 right-0 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50"
                    >
                      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h4 className="font-black text-slate-800">Notificaciones</h4>
                        <button 
                          onClick={markAllNotificationsRead}
                          className="text-[9px] font-black uppercase tracking-widest text-red-600 hover:text-red-700"
                        >
                          Marcar leídas
                        </button>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-slate-400">
                            <Bell className="mx-auto mb-2 opacity-50" size={24} />
                            <p className="text-[10px] font-black uppercase tracking-widest">No hay notificaciones</p>
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div 
                              key={n.id} 
                              onClick={() => markNotificationRead(n.id, n.link)}
                              className={`p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors ${!n.isRead ? 'bg-red-50/30' : ''}`}
                            >
                              <div className="flex gap-3">
                                <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${!n.isRead ? 'bg-red-600' : 'bg-transparent'}`} />
                                <div>
                                  <h5 className="text-xs font-black text-slate-800 mb-0.5">{n.title}</h5>
                                  <p className="text-[11px] text-slate-500 font-medium leading-snug line-clamp-2">{n.message}</p>
                                  <span className="text-[9px] font-bold text-slate-400 mt-2 block">
                                    {new Date(n.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <div className="h-10 w-px bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-3 lg:gap-4 group cursor-pointer bg-slate-50 p-1.5 lg:p-2 pr-3 lg:pr-4 rounded-2xl border border-slate-200/50 hover:border-red-200 transition-all">
              <div className="w-9 h-9 lg:w-12 lg:h-12 rounded-xl bg-red-600 flex items-center justify-center font-black text-white shadow-lg shadow-red-600/20 text-xs lg:text-base">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="max-w-[120px] truncate">
                <div className="text-[11px] lg:text-sm font-black text-slate-900 leading-tight truncate">{user?.name || 'Cargando...'}</div>
                <div className="text-[8px] lg:text-[10px] uppercase font-black text-red-600 tracking-widest">{user?.role || '...'}</div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-12 max-w-[1400px] mx-auto w-full space-y-6 lg:space-y-12">
          {activeTab === 'Dashboard' && !showWizard ? (
            <>
              <motion.div 
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }}
                className="flex justify-between items-end"
              >
                <div>
                  <div className="flex items-center gap-2 text-red-600 font-black text-[10px] lg:text-xs uppercase tracking-[0.2em] mb-2 lg:mb-3">
                    <Building2 size={16} /> Ciudad Don Bosco
                  </div>
                  <h1 className="text-3xl lg:text-5xl font-black text-slate-900 tracking-tighter">Panel <span className="text-red-600">SGC.</span></h1>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 mt-6 lg:mt-0">
                  <button 
                    onClick={() => { setActiveTab('Convivencia (L1620)'); setShowWizard(true); }}
                    className="bg-red-600 text-white px-6 lg:px-8 py-3 lg:py-4 rounded-xl lg:rounded-2xl text-[10px] lg:text-sm font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-600/10"
                  >
                    Nuevo Caso
                  </button>
                  <button 
                    onClick={() => setActiveTab('Evaluación SIEE')}
                    className="bg-white border-2 border-slate-100 text-slate-600 px-8 py-3.5 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                  >
                    Reporte SIEE
                  </button>
                </div>
              </motion.div>

              {/* Executive Stats Banner */}
              <ExecutiveStats />

              {/* Dynamic Stats Grid & Charts */}
              <div className="w-full">
                <DashboardCharts />
              </div>

              <div className="grid lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">
                  <AIAssistantCard />
                  
                  <section className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm">
                    <div className="flex justify-between items-center mb-10">
                      <h3 className="text-2xl font-black tracking-tight text-slate-900">Seguimiento de Convivencia</h3>
                      <button 
                         onClick={fetchCases}
                         className="text-red-600 text-sm font-black flex items-center gap-1 hover:underline uppercase tracking-widest"
                      >
                         Actualizar Sincronización <ChevronRight size={16} />
                      </button>
                    </div>
                    <div className="space-y-6">
                      {loadingCases ? (
                        <div className="text-center py-20 flex flex-col items-center gap-4">
                           <Activity size={48} className="text-slate-100 animate-pulse" />
                           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Sincronizando con MySQL Laragon...</p>
                        </div>
                      ) : cases.length === 0 ? (
                        <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-[2rem]">
                           <FileText size={48} className="mx-auto text-slate-100 mb-4" />
                           <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No se han registrado casos de convivencia aún</p>
                        </div>
                      ) : (
                        cases.map((c, idx) => (
                          <div key={idx} className="flex flex-col gap-4 p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:border-red-200 hover:bg-white hover:shadow-xl transition-all group">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-red-600 font-black shadow-sm group-hover:bg-red-600 group-hover:text-white transition-all">
                                  {idx + 1}
                                </div>
                                <div>
                                  <h4 className="font-black text-slate-800 text-lg flex items-center gap-2">
                                    {c.student.name} 
                                    <span className="text-[9px] font-black bg-slate-200 px-2 py-0.5 rounded text-slate-500 uppercase">{c.student.grade}</span>
                                  </h4>
                                  <div className="flex items-center gap-4 mt-1">
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                      <ShieldCheck size={12} className="text-red-600" /> Situación Tipo {c.type}
                                    </p>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                      <Calendar size={12} /> {new Date(c.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <span className={`text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.15em] ${
                                c.severity === 'CRITICAL' ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-600'
                              }`}>
                                {c.severity === 'CRITICAL' ? 'Prioridad Máxima' : 'SGC Normal'}
                              </span>
                            </div>

                            <div className="bg-white/50 border border-slate-100 p-6 rounded-2xl italic text-xs text-slate-500 font-medium leading-relaxed">
                              "{c.description}"
                            </div>

                            <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-100">
                              <button
                                onClick={() => generateConvivenciaAct(c)}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white border border-slate-900 rounded-xl hover:bg-slate-800 transition-all text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/10"
                              >
                                <FileText size={14} /> Descargar Acta PDF
                              </button>
                             {c.evidence && c.evidence.length > 0 && (
                              <div className="flex flex-wrap gap-2 pt-2">
                                {c.evidence.map((ev: string, evIdx: number) => (
                                  <button 
                                    key={evIdx}
                                    onClick={() => setSelectedEvidence(ev)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:border-red-600 hover:text-red-600 transition-all text-[10px] font-black uppercase tracking-tight"
                                  >
                                    <Eye size={12} /> Ver Evidencia #{evIdx + 1}
                                  </button>
                                ))}
                              </div>
                            )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                </div>

                <section className="bg-slate-900 rounded-[3rem] p-10 shadow-2xl flex flex-col text-white">
                  <div className="flex items-center justify-between mb-10">
                    <h3 className="text-2xl font-black tracking-tight">Status SGC</h3>
                    <Activity size={24} className="text-red-500" />
                  </div>
                  <div className="flex-1 space-y-8">
                    {[
                      { log: 'MySQL Redundant Log', status: 'Inalterable', time: 'Verificado' },
                      { log: 'FS Static Storage', status: 'Cero Costo', time: 'Local' },
                      { log: 'Integridad Normativa', status: 'Cumplimiento', time: 'Ley 1620' },
                    ].map((a, idx) => (
                      <div key={idx} className="flex items-center justify-between p-5 rounded-3xl bg-white/5 border border-white/10">
                        <div>
                          <div className="text-sm font-bold text-white mb-1">{a.log}</div>
                          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{a.time}</div>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest">{a.status}</span>
                           <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </>
          ) : activeTab === 'Estudiantes' ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-6xl mx-auto"
            >
              <StudentsModule />
            </motion.div>
          ) : activeTab === 'Convivencia (L1620)' ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-6xl mx-auto space-y-6"
            >
              <div className="flex justify-end">
                <button 
                  onClick={() => setShowWizard(true)}
                  className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-600/20"
                >
                  + Abrir Nuevo Caso (L1620)
                </button>
              </div>
              <ConvivenciaModule />
            </motion.div>
          ) : activeTab === 'Ciclo PHVA' || activeTab === 'Evaluación de Calidad' || activeTab === 'Gestión Documental' || activeTab === 'Auditoría IA' || activeTab === 'Encuestas' || activeTab === 'Matriz DOFA' || activeTab === 'Métricas e Indicadores' || activeTab === 'Inteligencia Documental' ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-6xl mx-auto"
            >
              {activeTab === 'Ciclo PHVA' && <PHVAModule />}
              {activeTab === 'Evaluación de Calidad' && <QualityEvaluationModule />}
              {activeTab === 'Gestión Documental' && <QualityDocumentModule />}
              {activeTab === 'Auditoría IA' && <EvidenceAuditModule />}
              {activeTab === 'Encuestas' && <SurveyModule />}
              {activeTab === 'Matriz DOFA' && <DofaModule />}
              {activeTab === 'Métricas e Indicadores' && <KpiModule />}
              {activeTab === 'Inteligencia Documental' && <DocumentIntelligence onTabChange={setActiveTab} />}
            </motion.div>
          ) : activeTab === 'Configuración' ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto"
            >
              <SettingsModule />
            </motion.div>
          ) : activeTab === 'Gestión de Usuarios' ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-6xl mx-auto"
            >
              <UsersModule />
            </motion.div>
          ) : activeTab === 'Auditoría & Logs' ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-6xl mx-auto"
            >
              <AuditLogModule />
            </motion.div>
          ) : activeTab === 'Gestión Curricular' ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-5xl mx-auto"
            >
              <CurriculumBuilder />
            </motion.div>
          ) : activeTab === 'Evaluación SIEE' ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-6xl mx-auto"
            >
              <SieeModule />
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-40 text-center">
               <ShieldCheck size={64} className="text-slate-100 mb-6" />
               <h2 className="text-3xl font-black text-slate-300 tracking-tighter uppercase">Módulo en Desarrollo</h2>
               <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-2">Próximamente disponible en SGC CDB</p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

function ExecutiveStats() {
  const [data, setData] = React.useState<any>(null);

  React.useEffect(() => {
    fetch('/api/stats/executive')
      .then(r => r.ok ? r.json() : null)
      .then(d => setData(d))
      .catch(() => {});
  }, []);

  if (!data) return null;

  const items = [
    { label: 'Documentos Vigentes', value: data.documents?.active ?? '—', sub: `${data.documents?.pending ?? 0} en revisión`, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Programas Activos', value: data.programs?.total ?? '—', sub: `${data.programs?.students ?? 0} estudiantes`, color: 'text-blue-600 bg-blue-50' },
    { label: 'Casos Convivencia', value: data.convivencia?.open ?? '—', sub: `${data.convivencia?.critical ?? 0} críticos`, color: 'text-amber-600 bg-amber-50' },
    { label: 'Eventos de Auditoría', value: data.logs?.total ?? '—', sub: `${data.logs?.critical ?? 0} alertas críticas`, color: 'text-red-600 bg-red-50' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item, i) => (
        <div key={i} className={`p-6 rounded-3xl border ${item.color.replace('text-', 'border-').replace('600', '100')}`}>
          <div className={`text-3xl font-black ${item.color.split(' ')[0]} mb-1`}>{item.value}</div>
          <div className="text-[10px] font-black uppercase text-slate-600 tracking-widest">{item.label}</div>
          <div className="text-[9px] font-bold text-slate-400 mt-1">{item.sub}</div>
        </div>
      ))}
    </div>
  );
}

