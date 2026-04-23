import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createCohere } from '@ai-sdk/cohere';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createGroq } from '@ai-sdk/groq';
import { generateObject, generateText } from 'ai';
import { z } from 'zod';

// Provider initializers (lazy, to avoid build-time errors)
const getOpenAI    = () => createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
const getDeepSeek  = () => createDeepSeek({ apiKey: process.env.DEEPSEEK_API_KEY });
const getGoogle    = () => createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY });
const getGroq      = () => createGroq({ apiKey: process.env.GROQ_API_KEY });
const getCohere    = () => createCohere({ apiKey: process.env.COHERE_API_KEY });
const getQwen      = () => createOpenAI({ apiKey: process.env.QWEN_API_KEY, baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1' });
const getGenspark  = () => createOpenAI({ apiKey: process.env.GENSPARK_API_KEY, baseURL: 'https://api.genspark.ai/v1' });

// ─────────────────────────────────────────────────────────────
// Models ordered by quality & JSON-schema support
// ─────────────────────────────────────────────────────────────
function getModels() {
  return [
    // DeepSeek: great with structured output + cheap
    ...(process.env.DEEPSEEK_API_KEY ? [{ name: 'DeepSeek', provider: getDeepSeek()('deepseek-chat') }] : []),
    // Google Gemini 2.0 flash - current stable
    ...(process.env.GOOGLE_GENERATIVE_AI_API_KEY ? [{ name: 'Google', provider: getGoogle()('gemini-2.0-flash') }] : []),
    // Genspark (OpenAI-compatible endpoint)
    ...(process.env.GENSPARK_API_KEY ? [{ name: 'Genspark', provider: getGenspark()('gpt-4o') }] : []),
    // Qwen (Alibaba) - OpenAI compatible, good JSON schema support
    ...(process.env.QWEN_API_KEY ? [{ name: 'Qwen', provider: getQwen()('qwen-plus') }] : []),
    // OpenAI GPT-4o-mini (if quota available)
    ...(process.env.OPENAI_API_KEY ? [{ name: 'OpenAI', provider: getOpenAI()('gpt-4o-mini') }] : []),
    // Groq: use llama-3.3-70b-versatile which supports tool use / structured outputs
    ...(process.env.GROQ_API_KEY ? [{ name: 'Groq', provider: getGroq()('llama-3.3-70b-versatile') }] : []),
    // Cohere as last resort
    ...(process.env.COHERE_API_KEY ? [{ name: 'Cohere', provider: getCohere()('command-r-plus-08-2024') }] : []),
  ];
}

async function runWithFallbacks(fn: (model: any) => Promise<any>) {
  const models = getModels();
  if (models.length === 0) throw new Error('No hay claves de API de IA configuradas.');

  let lastError = '';
  for (const m of models) {
    try {
      console.log(`[AI] Intentando con ${m.name}...`);
      const result = await fn(m.provider);
      console.log(`[AI] Éxito con ${m.name}`);
      return result;
    } catch (e: any) {
      console.warn(`[AI] Falló ${m.name}: ${e.message?.substring(0, 120)}`);
      lastError = `${m.name}: ${e.message}`;
    }
  }

  throw new Error(`Todos los proveedores de IA fallaron. Último: ${lastError}`);
}

// Text-based fallback: ask model to return JSON as plain text, then parse
async function runWithTextFallback(prompt: string): Promise<any> {
  const models = getModels();
  let lastError = '';
  for (const m of models) {
    try {
      console.log(`[AI-Text] Intentando con ${m.name}...`);
      const { text } = await generateText({
        model: m.provider,
        prompt: `${prompt}\n\nResponde ÚNICAMENTE con JSON válido, sin markdown, sin \`\`\`json, solo el objeto JSON puro.`,
      });
      // Strip any markdown fences if model added them
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      console.log(`[AI-Text] Éxito con ${m.name}`);
      return parsed;
    } catch (e: any) {
      console.warn(`[AI-Text] Falló ${m.name}: ${e.message?.substring(0, 100)}`);
      lastError = `${m.name}: ${e.message}`;
    }
  }
  throw new Error(`Fallback de texto también falló. Último: ${lastError}`);
}

// ─────────────────────────────────────────────────────────────
// Schema (all fields required, no .optional() for strict mode)
// ─────────────────────────────────────────────────────────────
const documentSchema = z.object({
  classification: z.object({
    type: z.enum(['ACTA', 'INFORME', 'ENCUESTA', 'SGC_MANUAL', 'CURRICULO', 'PROCESO', 'OTRO']),
    confidence: z.number(),
    reasoning: z.string(),
    title: z.string()
  }),
  executiveSummary: z.string(),
  sections: z.array(z.object({
    title: z.string(),
    content: z.string()
  })),
  keyPoints: z.array(z.string()),
  entities: z.array(z.object({
    name: z.string(),
    type: z.enum(['PERSONA', 'FECHA', 'LEY_NORMA', 'ORGANIZACION', 'LUGAR', 'OTRO']),
    context: z.string()
  })),
  metrics: z.array(z.object({
    name: z.string(),
    value: z.number(),
    unit: z.string(),
    context: z.string()
  })),
  tables: z.array(z.object({
    title: z.string(),
    headers: z.array(z.string()),
    rows: z.array(z.array(z.string()))
  })),
  actionPlan: z.object({
    summary: z.string(),
    actions: z.array(z.object({
      task: z.string(),
      responsible: z.string(),
      deadline: z.string()
    }))
  })
});

const ANALYSIS_PROMPT = (text: string) => `
Actúa como un experto en Gestión de Calidad (SGC) e ISO 21001.
Analiza exhaustivamente el siguiente documento institucional y extrae TODA la información relevante.

INSTRUCCIONES PRECISAS:
1. Clasifica el tipo de documento.
2. Escribe un resumen ejecutivo detallado (mínimo 3 oraciones).
3. Extrae TODAS las SECCIONES de texto del documento (títulos y sus párrafos correspondientes) para digitalizar el contenido completo de forma fiel.
4. Lista los puntos clave o hallazgos más importantes.
5. Identifica entidades: personas, fechas, leyes o normas, organizaciones y lugares.
6. Extrae TODOS los indicadores numéricos como KPIs (créditos, horas, porcentajes, etc.).
7. RECONSTRUYE LAS TABLAS DEL DOCUMENTO: identifica cada tabla (p.ej. "Contenido por Unidades", "Plan de Evaluación", "Planeación Semanal") y reconstruye su estructura con cabeceras y filas exactas.
8. Lista compromisos o tareas. Si no hay fecha límite, usa "No especificada".

TEXTO DEL DOCUMENTO:
${text.substring(0, 14000)}
`;

// ─────────────────────────────────────────────────────────────
// Main export: Full document analysis
// ─────────────────────────────────────────────────────────────
export async function fullDocumentAnalysis(text: string) {
  const prompt = ANALYSIS_PROMPT(text);

  // Stage 1: Try structured generateObject (best quality)
  try {
    return await runWithFallbacks(async (model) => {
      const { object } = await generateObject({
        model,
        schema: documentSchema,
        prompt,
      });
      return object;
    });
  } catch (e1: any) {
    console.warn('[AI] generateObject falló en todos. Intentando con texto plano...');
  }

  // Stage 2: Text-based fallback — instruct model to return raw JSON
  const jsonPrompt = `${prompt}

Devuelve EXACTAMENTE este JSON (sin markdown, sin texto extra):
{
  "classification": { "type": "CURRICULO", "confidence": 0.9, "reasoning": "...", "title": "..." },
  "executiveSummary": "...",
  "sections": [{ "title": "Título de sección", "content": "Texto completo del párrafo..." }],
  "keyPoints": ["...", "..."],
  "entities": [{ "name": "...", "type": "PERSONA", "context": "..." }],
  "metrics": [{ "name": "...", "value": 0, "unit": "...", "context": "..." }],
  "tables": [{ "title": "...", "headers": ["col1", "col2"], "rows": [["val1", "val2"]] }],
  "actionPlan": { "summary": "...", "actions": [{ "task": "...", "responsible": "...", "deadline": "..." }] }
}`;

  return await runWithTextFallback(jsonPrompt);
}

// ─────────────────────────────────────────────────────────────
// Generic text generation (for AI assistant, etc.)
// ─────────────────────────────────────────────────────────────
export async function analyzeCaseWithAI(description: string) {
  return await runWithFallbacks(async (model) => {
    const { text } = await generateText({ model, prompt: description });
    return text;
  });
}
