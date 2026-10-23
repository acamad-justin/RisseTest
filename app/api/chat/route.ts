import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { streamText, convertToModelMessages } from 'ai';
import { SYSTEM_RULES } from '../../../lib/systemRules';

// Extend max execution time to 30s to prevent Vercel 10s serverless timeout
export const maxDuration = 30;

function resolveCredentials() {
  const googleApiKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    '';

  if (googleApiKey && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = googleApiKey;
  }

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

  return { googleApiKey, supabaseUrl, supabaseKey };
}

export async function POST(req: Request) {
  try {
    const { googleApiKey, supabaseUrl, supabaseKey } = resolveCredentials();

    if (!googleApiKey) {
      console.error('[API /api/chat] Missing GOOGLE_GENERATIVE_AI_API_KEY environment variable.');
      return new Response(
        JSON.stringify({
          error:
            'Missing Google Generative AI API Key. Please verify GOOGLE_GENERATIVE_AI_API_KEY in your Vercel Project Settings.',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const body = await req.json().catch(() => ({}));
    const rawMessages = body.messages || [];
    const checkpointTitle = body.checkpointTitle || '';
    const moduleTitle = body.moduleTitle || body.parentModuleName || '';

    // Normalize incoming messages to ensure compatibility with convertToModelMessages
    const normalizedMessages = rawMessages.map((m: any, idx: number) => {
      const textContent = m.content || m.text || '';
      return {
        id: m.id || `msg-${idx}-${Date.now()}`,
        role: m.role === 'assistant' || m.role === 'ai' ? 'assistant' : 'user',
        content: textContent,
        parts: Array.isArray(m.parts) && m.parts.length > 0
          ? m.parts
          : [{ type: 'text', text: textContent }],
      };
    });

    const modelMessages = await convertToModelMessages(normalizedMessages);

    // Extract last user message for curriculum vector lookup
    const lastUserMessage = [...normalizedMessages]
      .reverse()
      .find((m: any) => m.role === 'user')?.content || '';

    // Safe vector embedding & Supabase retrieval (never fails the request if 0 matches or RPC error)
    let contextText = 'No specific curriculum match found.';
    if (lastUserMessage.trim() && supabaseUrl && supabaseKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: googleApiKey });
        const supabase = createClient(supabaseUrl, supabaseKey);

        const queryText = checkpointTitle
          ? `[${checkpointTitle} - ${moduleTitle}]: ${lastUserMessage}`
          : lastUserMessage;

        const embedRes = await ai.models.embedContent({
          model: 'gemini-embedding-001',
          contents: queryText,
          config: { outputDimensionality: 768 },
        });

        const queryVector = embedRes.embeddings?.[0]?.values;

        if (queryVector && queryVector.length > 0) {
          // Lowered match_threshold to 0.40 and match_count: 3 to reliably capture foundational concepts
          const { data: chunks, error: rpcError } = await supabase.rpc('match_curriculum', {
            query_embedding: queryVector,
            match_threshold: 0.40,
            match_count: 3,
          });

          if (!rpcError && Array.isArray(chunks) && chunks.length > 0) {
            contextText = chunks
              .map((c: any) => `### ${c.module_title || 'Curriculum Reference'}\n${c.content}`)
              .join('\n\n---\n\n');
          } else if (rpcError) {
            console.warn('[API /api/chat] Supabase match_curriculum RPC warning:', rpcError.message);
          }
        }
      } catch (vectorError: any) {
        // Fall back gracefully to base Socratic coaching without throwing HTTP 500
        console.warn('[API /api/chat] Vector retrieval non-fatal error:', vectorError?.message || vectorError);
      }
    }

    // Assemble rich prompt combining updated System Rules with active module context
    const fullSystemPrompt = `
${SYSTEM_RULES}

==================================================
CURRENT ACTIVE LEARNING MODULE CONTEXT
==================================================
Active Module: ${moduleTitle || 'Robotics & Control Systems Lab'}
Active Checkpoint: ${checkpointTitle || 'Robotics Fundamentals & Sensors'}

==================================================
RETRIEVED CONTEXT FROM CURRICULUM
==================================================
${contextText}
==================================================
`;

    // Instantiate Google provider explicitly with resolved API key
    const google = createGoogleGenerativeAI({
      apiKey: googleApiKey,
    });

    // Stream response using Gemini 3.5 Flash Lite
    const result = streamText({
      model: google('gemini-3.5-flash-lite'),
      system: fullSystemPrompt,
      messages: modelMessages,
    });

    return result.toTextStreamResponse({
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error: any) {
    console.error('[API /api/chat] Unhandled route error:', error);
    return new Response(
      JSON.stringify({
        error: error?.message || 'Chat generation failed due to an unexpected error.',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}