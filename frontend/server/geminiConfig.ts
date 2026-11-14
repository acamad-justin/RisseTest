// frontend/server/geminiConfig.ts
/**
 * RISSE AI — Centralized Gemini Configuration & Model Allocation (Server-Side)
 *
 * Implements strict model separation sharing a single API key:
 * - Existing AI Chatbot: gemini-3.5-flash-lite
 * - Module Studio (Document Analysis, Module/Node/Lesson Gen): gemini-3.1-flash-lite
 * - Advanced Review / Quality Assurance: gemini-3.8-flash
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment files across root, frontend, and backend contexts
const envCandidates = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), 'frontend/.env.local'),
  path.resolve(process.cwd(), '../frontend/.env.local'),
  path.resolve(process.cwd(), '../.env.local'),
  path.resolve(process.cwd(), 'backend/.env.local'),
  path.resolve(process.cwd(), '.env'),
];

for (const p of envCandidates) {
  try {
    if (fs.existsSync(p)) dotenv.config({ path: p });
  } catch (_) {}
}
dotenv.config();

export interface GeminiConfig {
  apiKey: string;
  chatModel: string;
  moduleStudioModel: string;
  advancedReviewModel: string;
  mockMode: boolean;
  dailyBudget: number;
  supabaseUrl: string;
  supabaseKey: string;
}

/**
 * Valid supported Gemini models in the project SDK.
 */
export const SUPPORTED_GEMINI_MODELS = new Set([
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
]);

/**
 * Resolves all Gemini and Supabase configurations from server environment variables.
 */
export function resolveGeminiConfig(): GeminiConfig {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    '';

  const chatModel = process.env.GEMINI_CHAT_MODEL || 'gemini-3.5-flash-lite';
  const moduleStudioModel = process.env.GEMINI_MODULE_STUDIO_MODEL || 'gemini-3.1-flash-lite';
  const advancedReviewModel = process.env.GEMINI_ADVANCED_REVIEW_MODEL || 'gemini-3.8-flash';

  const mockMode = process.env.GEMINI_MOCK_MODE === 'true';
  const dailyBudget = parseInt(process.env.MODULE_STUDIO_DAILY_BUDGET || '50', 10);

  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    '';

  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';

  return {
    apiKey,
    chatModel,
    moduleStudioModel,
    advancedReviewModel,
    mockMode,
    dailyBudget,
    supabaseUrl,
    supabaseKey,
  };
}

/**
 * Validates that a requested model is recognized and supported.
 * Throws a clear configuration error if unsupported.
 */
export function validateModelOrThrow(modelName: string, roleName: string): string {
  if (!modelName || typeof modelName !== 'string') {
    throw new Error(`[GeminiConfig] Invalid model specified for ${roleName}: Model identifier cannot be empty.`);
  }

  const trimmed = modelName.trim();
  if (!SUPPORTED_GEMINI_MODELS.has(trimmed)) {
    throw new Error(
      `[GeminiConfig] Unsupported Gemini model '${trimmed}' configured for ${roleName}. ` +
      `Supported models: ${Array.from(SUPPORTED_GEMINI_MODELS).join(', ')}`
    );
  }

  return trimmed;
}

