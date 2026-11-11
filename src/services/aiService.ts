// src/services/aiService.ts
// AI features for Smart Campus 360 using the Gemini REST API (no extra npm packages needed).
//   1. classifyComplaint()       -> suggests category, priority, department, safety flag
//   2. findSimilarComplaints()   -> semantic duplicate detection using embeddings
//
// Needs VITE_GEMINI_API_KEY in your .env file. If the key is missing, every function
// returns null / [] so the app keeps working exactly as before.

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
// Main model first, then fallbacks used when Google returns 503 (overloaded) or 404.
const CHAT_MODELS = [
  (import.meta.env.VITE_GEMINI_MODEL as string) || 'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
];
const EMBED_MODEL = (import.meta.env.VITE_GEMINI_EMBED_MODEL as string) || 'gemini-embedding-001';
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export const isAiEnabled = (): boolean => Boolean(API_KEY);

// ---------- Types ----------

export type AiPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export interface AiClassification {
  category: string;      // one of the categories you pass in
  department: string;    // one of the departments you pass in
  priority: AiPriority;
  isSafetyHazard: boolean;
  confidence: number;    // 0 to 1
  reason: string;        // short explanation shown to the user
}

export interface SimilarComplaint<T> {
  complaint: T;
  score: number;         // cosine similarity, 0 to 1
}

// ---------- 1. Classification ----------

export async function classifyComplaint(
  title: string,
  description: string,
  categories: string[],
  departments: string[],
): Promise<AiClassification | null> {
  if (!API_KEY || (!title.trim() && !description.trim())) return null;

  const prompt = `You are the triage assistant for a college campus complaint system.
Classify the complaint below.

Allowed categories: ${categories.join(', ')}
Allowed departments: ${departments.join(', ')}

Priority rules:
- Critical: danger to people (fire, sparks, gas smell, electric shock, flooding, structural damage, medical).
- High: blocks teaching, labs, exams, water or power for many people.
- Medium: inconvenient but a workaround exists.
- Low: cosmetic or minor.

Complaint title: ${title}
Complaint description: ${description}

Reply with JSON only, using exactly one allowed category and one allowed department.`;

  const body = JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          category: { type: 'STRING', enum: categories },
          department: { type: 'STRING', enum: departments },
          priority: { type: 'STRING', enum: ['Critical', 'High', 'Medium', 'Low'] },
          isSafetyHazard: { type: 'BOOLEAN' },
          confidence: { type: 'NUMBER' },
          reason: { type: 'STRING' },
        },
        required: ['category', 'department', 'priority', 'isSafetyHazard', 'confidence', 'reason'],
      },
    },
  });

  // Try the main model first, then lighter fallbacks if Google says it's overloaded.
  for (const model of CHAT_MODELS) {
    const maxAttempts = model === CHAT_MODELS[0] ? 2 : 1;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.info(`[AI] trying ${model} (attempt ${attempt})...`);
        const res = await fetch(`${BASE}/${model}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
          body,
          signal: AbortSignal.timeout(12000), // give up on a hung request after 12s
        });

        if (res.ok) {
          const data = await res.json();
          const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!text) break; // empty answer: try next model
          return JSON.parse(text) as AiClassification;
        }

        console.warn(`[AI] ${model} attempt ${attempt} failed:`, res.status);
        // 503 = overloaded, 429 = rate limit -> wait and retry, then move to next model
        if (res.status === 503 || res.status === 429) {
          await sleep(attempt * 1000);
          continue;
        }
        // 404 = model name not available for this key -> try next model
        break;
      } catch (err) {
        console.warn(`[AI] ${model} error:`, err);
        break;
      }
    }
  }
  return null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------- 2. Semantic duplicate detection ----------

const embeddingCache = new Map<string, number[]>();

async function embedMany(texts: string[]): Promise<number[][] | null> {
  if (!API_KEY) return null;

  const missing = texts.filter((t) => !embeddingCache.has(t));
  if (missing.length) {
    try {
      // Gemini allows up to 100 texts per batch call
      for (let i = 0; i < missing.length; i += 100) {
        const chunk = missing.slice(i, i + 100);
        const res = await fetch(`${BASE}/${EMBED_MODEL}:batchEmbedContents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
          body: JSON.stringify({
            requests: chunk.map((text) => ({
              model: `models/${EMBED_MODEL}`,
              content: { parts: [{ text }] },
              taskType: 'SEMANTIC_SIMILARITY',
            })),
          }),
        });
        if (!res.ok) {
          console.warn('[AI] embed failed:', res.status, await res.text());
          return null;
        }
        const data = await res.json();
        data.embeddings.forEach((e: { values: number[] }, idx: number) =>
          embeddingCache.set(chunk[idx], e.values),
        );
      }
    } catch (err) {
      console.warn('[AI] embed error:', err);
      return null;
    }
  }
  return texts.map((t) => embeddingCache.get(t)!);
}

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}

/**
 * Finds open complaints that mean the same thing as the new one, even if worded differently.
 * @param newText   title + description (+ location) of the complaint being written
 * @param existing  open complaints to compare against
 * @param toText    how to turn one existing complaint into text, e.g. c => `${c.title} ${c.description} ${c.location}`
 * @param threshold 0.80 is a good start; raise it if you get too many false matches
 */
export async function findSimilarComplaints<T>(
  newText: string,
  existing: T[],
  toText: (c: T) => string,
  threshold = 0.8,
  limit = 3,
): Promise<SimilarComplaint<T>[]> {
  if (!API_KEY || !newText.trim() || existing.length === 0) return [];

  const texts = existing.map(toText);
  const vectors = await embedMany([newText, ...texts]);
  if (!vectors) return [];

  const [query, ...rest] = vectors;
  return rest
    .map((v, i) => ({ complaint: existing[i], score: cosine(query, v) }))
    .filter((r) => r.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}