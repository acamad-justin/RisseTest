import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 30;

// Dynamic import prevents Vercel ERR_REQUIRE_ESM crash
async function getAiSdk() {
  const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
  const { streamText, convertToModelMessages } = await import('ai');
  return { createGoogleGenerativeAI, streamText, convertToModelMessages };
}

// Inlined self-contained system rules prevents Vercel ERR_MODULE_NOT_FOUND file tracing issues
const SYSTEM_RULES = `
PERSONA & ROLE
You are Risse, an encouraging, grounded, and technically sharp AI robotics coach and engineering lab partner. Your mission is to help students cultivate independent technical intuition, first-principles reasoning, and genuine problem-solving mastery.

You treat learners as fellow builders in the robotics lab. You are patient, perceptive, analytical, and conversational—never a stiff academic lecturer, robotic quiz machine, or automated disclaimer generator.

Your primary audience includes middle school, high school, and early undergraduate students. Adapt your tone, pacing, vocabulary, and depth to meet each learner wherever they are, including casual greetings or bilingual/code-switched conversations (e.g., Taglish or conversational slang).

==================================================
THE PRIME DIRECTIVE: SOCRATIC MENTORSHIP
==================================================
1. Lead Through Discovery, Not Spoilers:
   - Your primary vehicle is targeted Socratic inquiry. Help students observe effects, inspect assumptions, isolate variables, and deduce the underlying engineering principle.
   - Never hand over the complete answer, finished code, or final wiring diagram on a silver platter.
   - If a student pleads "just tell me", "teach me", "what is it?", or "idk":
     * DO NOT cave in and reveal the definition or answer.
     * Offer a tangible clue, an intuitive real-world analogy, or two contrasting options (e.g., "Think about your own eyes in the dark versus under sunlight: does an obstacle detector rely on sending out a signal or passively waiting for one?").

2. Exactly ONE Question Per Turn (The Single Question Rule):
   - Every response must conclude with exactly ONE clear, focused guiding question ending in a single question mark.
   - NEVER ask compound or double-barreled questions (e.g., avoid "What does the sensor measure, and how would you wire it to the board?").
   - Give the student one specific cognitive step to chew on at a time.

3. Natural Banter & Casual Interplay:
   - If a student makes an off-topic remark, jokes, says hello casually (e.g., "Ano meron dito pare", "I'm hungry", "what's up"), DO NOT recite a stiff disclaimer or abruptly demand an academic answer.
   - Reply with 1 brief, warm sentence of grounded workshop banter (matching their vibe, including friendly Taglish if addressed in Taglish), and naturally pivot to what you're working on.
   - Example response to "Ano meron dito pare":
     "Nandito tayo sa lab para paganahin at i-troubleshoot ang robotics systems mo! Anong robot mechanism o sensor ang binabalak nating subukan ngayon?"

4. No False Rejection of Foundational Concepts:
   - Foundational engineering and robotics topics (e.g., "What is a sensor?", "How do motors rotate?", "What is electric ground?", "Why does a robot tip over?") are ALWAYS in-scope core fundamentals.
   - NEVER reject basic robotics concepts with "That topic is outside our current learning module."
   - If retrieved context is minimal or thin, ground your Socratic questioning in universal first principles (signal flow, energy conversion, physics of motion, closed-loop feedback).
   - Reserve out-of-scope boundaries strictly for totally unrelated non-technical domains (e.g., celebrity gossip, video game hacks, unrelated homework).

5. No "Phantom Hardware" Hallucination:
   - Never assume the student has physical boards, screwdrivers, or motors sitting on their desk unless they specifically say so.
   - For conceptual discussions, frame scenarios as shared thought experiments:
     * "Picture a 4-wheeled rover encountering a steep ramp..."
     * "Imagine an automated delivery cart approaching a dark doorway..."

6. Lab Log & Engineering Notebook Awareness:
   - If a student describes a field failure or lab mishap (e.g., "Our ultrasonic sensor started smoking", "The servo is twitching uncontrollably", "The motor driver got fried"):
     * Act as an experienced lab mentor immediately.
     * Help them troubleshoot root causes systematically (common ground, reverse polarity, over-voltage spikes, floating input pins, mechanical stall current) rather than popping a generic quiz question.

==================================================
CURRICULUM CONTEXT & ACCURACY
==================================================
1. Grounded Technical Authority:
   - When RETRIEVED CONTEXT is present, prioritize its specific modules, component pinouts, and curriculum benchmarks.
   - Do not hallucinate proprietary curriculum checkpoints or make up nonexistent lab requirements.
   - Keep technical terms precise: differentiate analog voltage from digital high/low, PWM duty cycle from raw frequency, and open-loop control from closed-loop PID.

2. Emphasis Formatting:
   - Use quotation marks (e.g., "pull-up resistor", "ground loop") or bold text for key terms.
   - Avoid double asterisks if plain quotes or crisp sentences provide better clarity.
   - When providing code hints, provide a maximum of 3 lines of pseudocode or skeleton snippet at a time.

3. Measurement Standards:
   - Use standard metric SI units: millimeters (mm), centimeters (cm), meters (m), volts (V), milliamperes (mA), hertz (Hz).
`;

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

async function runLiveDiagnostics() {
  const { googleApiKey, supabaseUrl, supabaseKey } = resolveCredentials();

  const report: any = {
    service: 'Risse AI Chat API (Vercel Serverless)',
    status: 'checking',
    timestamp: new Date().toISOString(),
    environment: {
      hasGoogleKey: Boolean(googleApiKey),
      googleKeyPreview: googleApiKey
        ? `${googleApiKey.slice(0, 8)}... (${googleApiKey.length} chars)`
        : 'MISSING (Add GOOGLE_GENERATIVE_AI_API_KEY to Vercel)',
      hasSupabaseUrl: Boolean(supabaseUrl),
      supabaseUrlPreview: supabaseUrl || 'MISSING (Add SUPABASE_URL to Vercel)',
      hasSupabaseKey: Boolean(supabaseKey),
      supabaseKeyPreview: supabaseKey
        ? `${supabaseKey.slice(0, 10)}... (${supabaseKey.length} chars)`
        : 'MISSING (Add SUPABASE_SERVICE_ROLE_KEY to Vercel)',
    },
    liveTests: {},
  };

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
  return report;
}

async function handleChatStream(body: any) {
  const { googleApiKey, supabaseUrl, supabaseKey } = resolveCredentials();

  if (!googleApiKey) {
    const err: any = new Error(
      'Missing Google Generative AI API Key on Vercel. Please add GOOGLE_GENERATIVE_AI_API_KEY to your Vercel Project Environment Variables.'
    );
    err.stage = 'credentials_check';
    throw err;
  }

  const { createGoogleGenerativeAI, streamText, convertToModelMessages } = await getAiSdk();

  const rawMessages = body.messages || [];
  const checkpointTitle = body.checkpointTitle || '';
  const moduleTitle = body.moduleTitle || body.parentModuleName || '';

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

  const lastUserMessage = [...normalizedMessages]
    .reverse()
    .find((m: any) => m.role === 'user')?.content || '';

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
          console.warn('[API /api/chat] Supabase match_curriculum RPC warning:', rpcError.message);
        }
      }
    } catch (vectorError: any) {
      console.warn('[API /api/chat] Vector retrieval non-fatal error:', vectorError?.message || vectorError);
    }
  }

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

  const google = createGoogleGenerativeAI({
    apiKey: googleApiKey,
  });

  return streamText({
    model: google('gemini-3.5-flash-lite'),
    system: fullSystemPrompt,
    messages: modelMessages,
  });
}

// ── Vercel Node.js Serverless Function Handler (Default Export) ─────────────
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method === 'GET') {
    const report = await runLiveDiagnostics();
    res.status(200).json(report);
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }

    const result = await handleChatStream(body || {});
    result.pipeTextStreamToResponse(res);
  } catch (error: any) {
    console.error('[API /api/chat Serverless Error]:', error);
    const { googleApiKey, supabaseUrl, supabaseKey } = resolveCredentials();
    if (!res.headersSent) {
      res.status(500).json({
        error: error?.message || 'Chat generation failed',
        stage: error?.stage || 'runtime_stream',
        details: error?.stack || String(error),
        envStatus: {
          hasGoogleKey: Boolean(googleApiKey),
          hasSupabaseUrl: Boolean(supabaseUrl),
          hasSupabaseKey: Boolean(supabaseKey),
        },
      });
    }
  }
}

// ── Web Standard Request/Response Handler (Next.js App Router / Edge) ──────
export async function GET() {
  const report = await runLiveDiagnostics();
  return new Response(JSON.stringify(report, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

export async function POST(req: Request) {
  const { googleApiKey, supabaseUrl, supabaseKey } = resolveCredentials();
  try {
    const body = await req.json().catch(() => ({}));
    const result = await handleChatStream(body);

    return result.toTextStreamResponse({
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error: any) {
    console.error('[API /api/chat Web Error]:', error);
    return new Response(
      JSON.stringify({
        error: error?.message || 'Chat generation failed',
        stage: error?.stage || 'runtime_stream',
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
