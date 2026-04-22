import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createCohere } from '@ai-sdk/cohere';
import { generateText, generateObject } from 'ai';
import { z } from 'zod';

// Initialize the "Army" Providers
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY,
});

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY,
});

const cohere = createCohere({
  apiKey: process.env.COHERE_API_KEY,
});

/**
 * AI Orchestrator Service
 * Manages the multi-model intelligence layer for the SGC.
 */
export const AIOrchestrator = {
  /**
   * Analyzes a convivencia case and suggests classification (Tipo I, II, III)
   */
  async analyzeCase(description: string) {
    // We prioritize Google Gemini for its high-context reasoning or Groq for speed
    const model = google('gemini-1.5-pro-latest');

    try {
      const response = await generateObject({
        model,
        schema: z.object({
          type: z.number().describe('Situación Tipo I, II, o III'),
          reasoning: z.string().describe('Explicación pedagógica y normativa'),
          suggestedProtocol: z.string().describe('Pasos a seguir según la Ley 1620'),
          riskLevel: z.enum(['Low', 'Medium', 'High', 'Critical']),
          anonymousDescription: z.string().describe('Versión técnica y objetiva de los hechos (sin nombres)'),
        }),
        prompt: `Como Auditor Maestro del Sistema de Gestión de Calidad (NTC 5581, NTC 5555, ISO 21001) y experto legal en Convivencia Escolar Colombiana (Ley 1620 y Decreto 1965), analiza los siguientes hechos:
        
        ### CONTEXTO INSTITUCIONAL (RAG Activo):
        Debes basar tu clasificación estrictamente en los lineamientos de las Normas ISO/NTC integradas en nuestro Listado Maestro de Documentos. El debido proceso debe blindar jurídicamente a la institución ante entes territoriales. Fallar en la ruta podría desencadenar hallazgos de no-conformidad mayor (ISO 9001).

        ### CASO A EVALUAR:
        ---
        ${description}
        ---
        
        Tu objetivo es:
        1. Clasificar el caso (I, II, III).
        2. Justificar normativamente el porqué según la ley.
        3. Dictar la ruta exacta de atención inmediata.`,
      });

      return response.object;
    } catch (error) {
      console.error('AI Analysis failed, falling back to next soldier...', error);
      // Fallback logic could go here
      throw error;
    }
  },

  /**
   * Analyzes academic performance and suggests a PHVA Improvement Plan (PMI)
   */
  async analyzePerformance(data: { studentName: string, subject: string, grades: any[], modality: string }) {
    const model = google('gemini-1.5-flash');

    try {
      const response = await generateObject({
        model,
        schema: z.object({
          planear: z.string().describe('Diagnóstico pedagógico y metas de aprendizaje'),
          hacer: z.string().describe('Estrategias y actividades de recuperación/nivelación'),
          verificar: z.string().describe('Indicadores de logro y forma de evaluar el avance'),
          actuar: z.string().describe('Compromisos sugeridos para el estudiante y acudiente'),
          priority: z.enum(['NORMAL', 'ALTA', 'CRITICA']),
          riskAnalysis: z.string().describe('Breve análisis del riesgo académico detectado'),
        }),
        prompt: `Como Consultor Pedagógico Senior experto en el Decreto 1290 (Evaluación Estudiantil en Colombia) y la norma ISO 21001:2018, analiza el rendimiento académico de:
        
        ESTUDIANTE: ${data.studentName}
        ASIGNATURA: ${data.subject}
        MODALIDAD: ${data.modality}
        HISTORIAL DE NOTAS: ${JSON.stringify(data.grades)}
        
        Tu tarea es generar un Plan de Mejoramiento Individual (PMI) basado en el ciclo PHVA. 
        - Si las notas son bajas (< 3.0), el tono debe ser de intervención urgente.
        - Si no hay notas suficientes, sugiere un plan preventivo basado en la asignatura.
        - Las actividades deben ser pedagógicamente viables y enfocadas en competencias.`,
      });

      return response.object;
    } catch (error) {
      console.error('AI Performance Analysis failed:', error);
      throw error;
    }
  },

  /**
   * Performs a Master Audit on an educational program based on ISO/NTC standards.
   */
  async masterAuditProgram(data: { 
    programName: string, 
    standard: string, 
    kpis: { approvalRate: number, retentionRate: number, satisfaction: number },
    curriculumCoverage: number,
    normativeChecklist?: any,
    findings?: string
  }) {
    const model = google('gemini-1.5-pro-latest');

    try {
      const response = await generateObject({
        model,
        schema: z.object({
          score: z.number().describe('Porcentaje de cumplimiento (0-100)'),
          strengths: z.array(z.string()).describe('Fortalezas detectadas'),
          nonConformities: z.array(z.object({
            requirement: z.string().describe('Cláusula o requisito específico (Ej: NTC 5555 Numeral 4.2)'),
            description: z.string().describe('Evidencia del incumplimiento detectada en datos o checklist'),
            severity: z.enum(['MINOR', 'MAJOR']),
          })).describe('No conformidades encontradas'),
          actionPlan: z.string().describe('Plan de acción sugerido (PHVA) para cierre de brechas'),
          conclusion: z.string().describe('Dictamen final del auditor maestro sobre la viabilidad de certificación'),
        }),
        prompt: `Actúa como Auditor Maestro LÍDER Certificado en ISO 21001:2018 y NTC 5555/5581. 
        Debes auditar con RIGOR TÉCNICO el siguiente programa académico:
        
        PROGRAMA: ${data.programName}
        NORMA DE REFERENCIA: ${data.standard}
        
        ### EVIDENCIA CUANTITATIVA (KPIs):
        - Tasa de Aprobación: ${data.kpis.approvalRate}% (Meta mínima sugerida: 80%)
        - Tasa de Retención: ${data.kpis.retentionRate}% (Meta mínima sugerida: 85%)
        - Índice de Satisfacción: ${data.kpis.satisfaction}/5.0 (Meta mínima: 4.0)
        - Cobertura Curricular: ${data.curriculumCoverage}% (Debe ser > 95% para programas técnicos)
        
        ### VERIFICACIÓN NORMATIVA (Checklist Manual):
        ${JSON.stringify(data.normativeChecklist || 'No se proporcionó verificación manual.')}
        
        ### HALLAZGOS ADICIONALES:
        ${data.findings || 'No hay hallazgos adicionales.'}
        
        TU TAREA:
        1. Evalúa el cumplimiento basándote en los numerales específicos de la norma (NTC 5555 para SGC Institucional ETDH, NTC 5581 para requisitos de programas).
        2. Si la satisfacción es < 4.0 o la aprobación < 80%, genera una No Conformidad Mayor citando fallas en el "Proceso de Evaluación" o "Satisfacción del Cliente".
        3. Si la cobertura curricular es < 90%, cita incumplimiento en "Diseño y Desarrollo del Programa".
        4. El Plan de Acción debe ser una ruta crítica para asegurar la renovación del registro calificado o la certificación de calidad.`,
      });

      return response.object;
    } catch (error) {
      console.error('AI Master Audit failed:', error);
      throw error;
    }
  },

  /**
   * General assistant for various SGC tasks
   */
  async generalAssistant(prompt: string, provider: 'openai' | 'google' | 'groq' = 'google') {
    const selectedModel = provider === 'openai' 
      ? openai('gpt-4o') 
      : provider === 'groq' 
        ? groq('llama3-70b-8192') 
        : google('gemini-1.5-flash');

    const { text } = await generateText({
      model: selectedModel,
      prompt,
    });

    return text;
  }
};
