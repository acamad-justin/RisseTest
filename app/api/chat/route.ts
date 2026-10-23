import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { SYSTEM_RULES } from '../../../lib/systemRules';

export const maxDuration = 30;

// Dynamic import prevents Vercel ERR_REQUIRE_ESM crash
async function getAiSdk() {
  const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
  const { streamText, convertToModelMessages } = await import('ai');
  return { createGoogleGenerativeAI, streamText, convertToModelMessages };
}

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

// ── GET /api/chat: Live Diagnostics Endpoint ──────────────────────────────────
export async function GET() {
  const { googleApiKey, supabaseUrl, supabaseKey } = resolveCredentials();

  const report: any = {
    service: 'Risse AI Chat API',
    status: 'checking',
    timestamp: new Date().toISOString(),
    environment: {
      hasGoogleKey: Boolean(googleApiKey),
      googleKeyPreview: googleApiKey
        ? `${googleApiKey.slice(0, 8)}... (${googleApiKey.length} chars)`
        : 'MISSING (Set GOOGLE_GENERATIVE_AI_API_KEY on Vercel)',
      hasSupabaseUrl: Boolean(supabaseUrl),
      supabaseUrlPreview: supabaseUrl || 'MISSING (Set SUPABASE_URL on Vercel)',
      hasSupabaseKey: Boolean(supabaseKey),
      supabaseKeyPreview: supabaseKey
        ? `${supabaseKey.slice(0, 10)}... (${supabaseKey.length} chars)`
        : 'MISSING (Set SUPABASE_SERVICE_ROLE_KEY on Vercel)',
    },
    liveTests: {},
  };

  // 1. Live Google Gemini Test
  if (googleApiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: googleApiKey });
      const testRes = await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: 'test ping',
      });
      report.liveTests.gemini = {
        status: 'SUCCESS',
        model: 'gemini-3.5-flash-lite',
        sampleResponse: testRes?.text?.trim()?.slice(0, 60) || 'OK',
      };
    } catch (geminiErr: any) {
      report.liveTests.gemini = {
        status: 'FAILED',
        error: geminiErr?.message || String(geminiErr),
        errorCode: geminiErr?.status || geminiErr?.statusCode || 'UNKNOWN',
      };
    }
  } else {
    report.liveTests.gemini = {
      status: 'SKIPPED',
      reason: 'GOOGLE_GENERATIVE_AI_API_KEY is not defined',
    };
  }

  // 2. Live Supabase pgvector RPC Test
  if (supabaseUrl && supabaseKey) {
    try {
      const sb = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await sb.rpc('match_curriculum', {
        query_embedding: Array(768).fill(0),
        match_threshold: 0.40,
        match_count: 1,
      });

      if (error) {
        report.liveTests.supabase = {
          status: 'RPC_ERROR',
          error: error.message,
        };
      } else {
        report.liveTests.supabase = {
          status: 'SUCCESS',
          matchesFound: Array.isArray(data) ? data.length : 0,
        };
      }
    } catch (sbErr: any) {
      report.liveTests.supabase = {
        status: 'FAILED',
        error: sbErr?.message || String(sbErr),
      };
    }
  } else {
    report.liveTests.supabase = {
      status: 'SKIPPED',
      reason: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not defined',
    };
  }

  const allGood =
    report.liveTests.gemini?.status === 'SUCCESS' &&
    report.liveTests.supabase?.status === 'SUCCESS';

  report.status = allGood ? 'HEALTHY' : 'DEGRADED_OR_CONFIG_ERROR';

  return new Response(JSON.stringify(report, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

// ── POST /api/chat: Streaming Chat Handler ────────────────────────────────────
export async function POST(req: Request) {
  let stage = 'credentials_check';
  const { googleApiKey, supabaseUrl, supabaseKey } = resolveCredentials();

  try {
    if (!googleApiKey) {
      return new Response(
        JSON.stringify({
          error:
            'Missing Google Generative AI API Key on Vercel. Please add GOOGLE_GENERATIVE_AI_API_KEY to your Vercel Project Environment Variables and redeploy.',
          stage: 'credentials_check',
          debug: {
            hasGoogleKey: false,
            hasSupabaseUrl: Boolean(supabaseUrl),
            hasSupabaseKey: Boolean(supabaseKey),
          },
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    stage = 'loading_ai_sdk';
    const { createGoogleGenerativeAI, streamText, convertToModelMessages } = await getAiSdk();

    stage = 'parsing_payload';
    const body = await req.json().catch(() => ({}));
    const rawMessages = body.messages || [];
    const checkpointTitle = body.checkpointTitle || '';
    const moduleTitle = body.moduleTitle || body.parentModuleName || '';

    stage = 'normalizing_messages';
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

    // Extract student's latest query
    const lastUserMessage = [...normalizedMessages]
      .reverse()
      .find((m: any) => m.role === 'user')?.content || '';

    // Safe vector embedding & Supabase retrieval
    stage = 'curriculum_retrieval';
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
            console.warn('[API /api/chat] Supabase match_curriculum warning:', rpcError.message);
          }
        }
      } catch (vectorError: any) {
        console.warn('[API /api/chat] Vector retrieval non-fatal error:', vectorError?.message || vectorError);
      }
    }

    // Assemble prompt
    stage = 'prompt_assembly';
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

    // Instantiate Google provider and stream
    stage = 'gemini_stream';
    const google = createGoogleGenerativeAI({
      apiKey: googleApiKey,
    });

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
    console.error(`[API /api/chat Error during stage "${stage}"]:`, error);
    return new Response(
      JSON.stringify({
        error: error?.message || 'Chat generation failed due to an unexpected server error.',
        stage,
        details: error?.stack || String(error),
        envStatus: {
          hasGoogleKey: Boolean(googleApiKey),
          hasSupabaseUrl: Boolean(supabaseUrl),
          hasSupabaseKey: Boolean(supabaseKey),
        },
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