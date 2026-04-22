'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
  X,
  Download,
  GraduationCap,
  ClipboardList,
  ChevronRight,
  BookOpen,
  BarChart3,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type ImportMode = 'students' | 'curriculum' | 'informes';

interface ImportResult {
  success: boolean;
  summary: {
    totalRows: number;
    created: number;
    skipped: number;
    errors: string[];
  };
}

interface CurriculumResult {
  success: boolean;
  summary: {
    createdAreas: number;
    createdSubjects: number;
    createdPlans: number;
  };
}

// ─── Mode Config ──────────────────────────────────────────────────────────────
const getMODES = (isETDH: boolean) => [
  {
    id: 'students' as ImportMode,
    label: 'Estudiantes',
    sublabel: 'Padrón institucional',
    icon: Users,
    color: 'red',
    apiUrl: '/api/students/import',
    templateUrl: isETDH ? '/templates/plantilla_estudiantes_etdh.xlsx' : '/templates/plantilla_estudiantes_colegio.xlsx',
    templateName: isETDH ? 'plantilla_estudiantes_etdh.xlsx' : 'plantilla_estudiantes_colegio.xlsx',
    description: isETDH ? 'Importa aprendices con documento, carrera base y ficha.' : 'Importa el listado oficial de estudiantes con su documento, grado o carrera y cohorte/ficha de matrícula.',
    columns: ['Nombre Completo', 'Documento de Identidad', isETDH ? 'Carrera' : 'Grado o Carrera', isETDH ? 'Ficha / Cohorte' : 'Cohorte o Ficha (opcional)'],
  },
  {
    id: 'curriculum' as ImportMode,
    label: isETDH ? 'Programas ETDH' : 'Carreras / Currículo',
    sublabel: 'Estructura Curricular',
    icon: BookOpen,
    color: 'blue',
    apiUrl: '/api/curriculum/import',
    templateUrl: '/templates/plantilla_curriculo.xlsx',
    templateName: 'plantilla_curriculo.xlsx',
    description: isETDH ? 'Importa los programas técnicos, módulos y competencias laborales.' : 'Importa la estructura de carreras o áreas académicas con sus módulos, asignaturas y competencias.',
    columns: [isETDH ? 'Programa' : 'Carrera o Área', isETDH ? 'Módulo' : 'Módulo o Asignatura', isETDH ? 'Norma Laboral' : 'Competencia o Logro', 'Referencia DBA (opcional)', 'Horas Semanales (opcional)', 'Periodo (opcional)'],
  },
  {
    id: 'informes' as ImportMode,
    label: isETDH ? 'Evaluación Formativa' : 'Informes / Notas',
    sublabel: isETDH ? 'Notas de Módulo' : 'Calificaciones SIEE',
    icon: BarChart3,
    color: 'emerald',
    apiUrl: '/api/siee/import',
    templateUrl: '/templates/plantilla_informes.xlsx',
    templateName: 'plantilla_informes.xlsx',
    description: isETDH ? 'Importa calificaciones técnicas (Conocimiento, Desempeño, Producto).' : 'Importa las calificaciones del SIEE (Cognitivo, Personal y Social).',
    columns: ['Documento de Identidad', isETDH ? 'Módulo' : 'Asignatura o Módulo', 'Periodo (1-4)', isETDH ? 'Nota Conocimiento' : 'Nota Cognitiva (0-5)', isETDH ? 'Nota Desempeño' : 'Nota Personal (0-5)', isETDH ? 'Nota Producto' : 'Nota Social (0-5)', 'Observaciones (opcional)'],
  },
];

const COLOR_MAP: Record<string, Record<string, string>> = {
  red:     { bg: 'bg-red-600',     light: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-600',     shadow: 'shadow-red-600/20',   hover: 'hover:border-red-400',   active: 'bg-red-600 text-white shadow-lg shadow-red-600/30' },
  blue:    { bg: 'bg-blue-600',    light: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-600',    shadow: 'shadow-blue-600/20',   hover: 'hover:border-blue-400',  active: 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' },
  emerald: { bg: 'bg-emerald-600', light: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', shadow: 'shadow-emerald-600/20', hover: 'hover:border-emerald-400', active: 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' },
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ExcelImporter() {
  const [activeMode, setActiveMode] = useState<ImportMode>('students');
  const [modality, setModality] = useState<'FORMAL' | 'ETDH'>('FORMAL');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | CurriculumResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [institutionType, setInstitutionType] = useState('FORMAL');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/institution').then(r => r.json()).then(d => {
      if (d && d.type) setInstitutionType(d.type);
    }).catch(e => console.error(e));
  }, []);

  const MODES = getMODES(modality === 'ETDH');
  const mode = MODES.find((m) => m.id === activeMode)!;
  const colors = COLOR_MAP[mode.color];

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const switchMode = (id: ImportMode) => {
    setActiveMode(id);
    reset();
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls') || droppedFile.name.endsWith('.csv'))) {
      setFile(droppedFile);
      setResult(null);
      setError(null);
    } else {
      setError('Solo se aceptan archivos .xlsx, .xls o .csv');
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('modality', modality);
      const res = await fetch(mode.apiUrl, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error desconocido al procesar el archivo');
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setUploading(false);
    }
  };

  // ─── Result renderer ──────────────────────────────────────────────────────
  const renderResult = () => {
    if (!result) return null;
    const r = result as any;

    // Curriculum result
    if (r.summary?.createdAreas !== undefined) {
      return (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Stat label="Carreras / Áreas" value={r.summary.createdAreas} color="blue" />
          <Stat label="Módulos / Asignaturas" value={r.summary.createdSubjects} color="blue" />
          <Stat label="Planes Registrados" value={r.summary.createdPlans} color="blue" />
        </div>
      );
    }

    // Students / Informes result
    return (
      <>
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Stat label="Filas Leídas" value={r.summary.totalRows} color="slate" />
          <Stat label="Registrados" value={r.summary.created} color={mode.color === 'red' ? 'emerald' : mode.color} />
          <Stat label="Omitidos" value={r.summary.skipped} color="amber" />
        </div>
        {r.summary.errors?.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle size={15} className="text-red-600" />
              <span className="text-xs font-black text-red-600 uppercase tracking-widest">Detalles de errores</span>
            </div>
            {r.summary.errors.map((err: string, idx: number) => (
              <p key={idx} className="text-xs text-red-500 font-medium mb-1">• {err}</p>
            ))}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="space-y-8">
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <div className={`p-4 ${colors.bg} rounded-2xl text-white shadow-xl ${colors.shadow}`}>
          <FileSpreadsheet size={28} />
        </div>
        <div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Centro de Importación Masiva</h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Selecciona el tipo de datos a cargar</p>
        </div>
      </div>

      {/* ─── Mode Selector ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {MODES.map((m) => {
          const c = COLOR_MAP[m.color];
          const isActive = activeMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => switchMode(m.id)}
              className={`group relative flex flex-col items-start gap-3 p-6 rounded-[1.5rem] border-2 transition-all text-left ${
                isActive
                  ? `${c.active} border-transparent`
                  : `bg-white border-slate-200 ${c.hover} hover:bg-slate-50`
              }`}
            >
              <m.icon size={24} className={isActive ? 'text-white' : c.text} />
              <div>
                <div className={`font-black text-sm leading-tight ${isActive ? 'text-white' : 'text-slate-800'}`}>{m.label}</div>
                <div className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${isActive ? 'text-white/70' : 'text-slate-400'}`}>{m.sublabel}</div>
              </div>
              {isActive && <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50" />}
            </button>
          );
        })}
      </div>

      {/* ─── Modality Switcher (For Students Mode) ────────────────────────── */}
      {activeMode === 'students' && (
        <div className="flex justify-center">
          <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1">
            <button
              onClick={() => setModality('FORMAL')}
              className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                modality === 'FORMAL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Plantilla Colegio
            </button>
            <button
              onClick={() => setModality('ETDH')}
              className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                modality === 'ETDH' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Plantilla Carrera (ETDH)
            </button>
          </div>
        </div>
      )}

      {/* ─── Mode Info & Template Download ───────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeMode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={`${colors.light} ${colors.border} border rounded-3xl p-6`}
        >
          <div className="flex flex-col md:flex-row md:items-start gap-6 justify-between">
            <div className="space-y-3 flex-1">
              <p className="text-sm font-bold text-slate-700">{mode.description}</p>
              <div className="flex flex-wrap gap-2">
                {mode.columns.map((col, i) => (
                  <span key={i} className={`text-[10px] font-black px-3 py-1 rounded-lg ${colors.light} ${colors.border} border ${colors.text} uppercase tracking-wide`}>
                    {col}
                  </span>
                ))}
              </div>
            </div>
            <a
              href={mode.templateUrl}
              download={mode.templateName}
              className={`shrink-0 flex items-center gap-2 px-6 py-3 bg-white border ${colors.border} hover:${colors.light} rounded-2xl text-xs font-black uppercase ${colors.text} tracking-widest transition-all shadow-sm whitespace-nowrap`}
            >
              <Download size={15} /> Descargar Plantilla
            </a>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ─── Drop Zone / Result ───────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div
            key={`dropzone-${activeMode}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-[2.5rem] p-16 text-center cursor-pointer transition-all ${
                isDragging
                  ? `${colors.border} ${colors.light} shadow-xl`
                  : file
                    ? 'border-emerald-400 bg-emerald-50'
                    : `border-slate-200 bg-white ${colors.hover} hover:bg-slate-50/50`
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />

              {file ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="p-6 bg-emerald-100 rounded-3xl">
                    <FileSpreadsheet size={48} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-900">{file.name}</p>
                    <p className="text-xs text-slate-400 font-bold">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); reset(); }}
                    className="text-xs text-red-600 font-black uppercase tracking-widest hover:underline flex items-center gap-1"
                  >
                    <X size={14} /> Cambiar Archivo
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className={`p-6 rounded-3xl transition-all ${isDragging ? colors.light : 'bg-slate-100'}`}>
                    <Upload size={48} className={isDragging ? colors.text : 'text-slate-300'} />
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-900">
                      Arrastra tu Excel de <span className={colors.text}>{mode.label}</span> aquí
                    </p>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                      o haz clic para seleccionar · .xlsx, .xls, .csv
                    </p>
                  </div>
                </div>
              )}
            </div>

            {file && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center mt-8"
              >
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className={`${colors.bg} text-white px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:opacity-90 transition-all shadow-xl ${colors.shadow} disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3`}
                >
                  {uploading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Procesando Registros...
                    </>
                  ) : (
                    <>
                      <mode.icon size={20} />
                      Importar {mode.label} al SGC
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 bg-emerald-100 rounded-2xl">
                <CheckCircle2 size={32} className="text-emerald-600" />
              </div>
              <div>
                <h4 className="text-xl font-black text-slate-900">¡Importación Completada!</h4>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                  Resumen · {mode.label}
                </p>
              </div>
            </div>

            {renderResult()}

            <button
              onClick={reset}
              className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all"
            >
              Importar Otro Archivo
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Error Toast ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-red-600 text-white p-6 rounded-3xl shadow-xl shadow-red-600/20 flex items-start gap-4"
          >
            <AlertCircle size={24} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-sm mb-1">Error en la Importación</p>
              <p className="text-xs text-white/80 font-medium">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="ml-auto shrink-0">
              <X size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    slate:   'bg-slate-50 border-slate-100 text-slate-900',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-600',
    amber:   'bg-amber-50 border-amber-200 text-amber-600',
    blue:    'bg-blue-50 border-blue-200 text-blue-600',
  };
  const cls = colorMap[color] || colorMap.slate;
  return (
    <div className={`${cls} border rounded-3xl p-6 text-center`}>
      <div className="text-3xl font-black">{value}</div>
      <div className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-70">{label}</div>
    </div>
  );
}
