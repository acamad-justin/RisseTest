import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { google } from '@ai-sdk/google';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { streamText } from 'ai';
import { SYSTEM_RULES } from '../lib/systemRules';

function getCredentials() {
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

async function processChatRequest(body: any) {
  const { googleApiKey, supabaseUrl, supabaseKey } = getCredentials();

  const rawMessages = body?.messages || [];
  const checkpointTitle = body?.checkpointTitle || '';
  const moduleTitle = body?.moduleTitle || body?.parentModuleName || '';

  // Normalize messages
  const formattedMessages = rawMessages.map((m: any) => ({
    role: (m.role === 'ai' || m.sender === 'ai' || m.role === 'assistant') ? 'assistant' : 'user',
    content: m.content || m.text || '',
  }));

  const lastUserMessage = formattedMessages
    .filter((m: any) => m.role === 'user')
    .slice(-1)[0]?.content || '';

  let contextText = 'No specific curriculum match found.';

  // Vector retrieval if keys are present
  if (googleApiKey && supabaseUrl && supabaseKey && lastUserMessage.trim()) {
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
      if (queryVector) {
        const { data: chunks, error } = await supabase.rpc('match_curriculum', {
          query_embedding: queryVector,
          match_threshold: 0.20,
          match_count: 5,
        });

        if (!error && chunks && chunks.length > 0) {
          contextText = chunks
            .map((c: any) => `### ${c.module_title || 'Curriculum Section'}\n${c.content}`)
            .join('\n\n---\n\n');
        } else if (error) {
          console.warn('match_curriculum warning:', error.message);
        }
      }
    } catch (err: any) {
      console.warn('Vector retrieval error:', err?.message || err);
    }
  }

  const fullPrompt = `
${SYSTEM_RULES}
CURRENT MODULE: ${moduleTitle || 'Robotics Curriculum'}
CURRENT CHECKPOINT TOPIC: ${checkpointTitle || 'Robotics Fundamentals'}

=========================
RETRIEVED CONTEXT FROM CURRICULUM:
${contextText}
=========================
`;

  const result = streamText({
    model: google('gemini-3.5-flash-lite'),
    system: fullPrompt,
    messages: formattedMessages,
  });

  return result;
}

// ── Vercel Node.js Serverless Function Handler (Default Export) ─────────────
export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
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

    const result = await processChatRequest(body || {});
    result.pipeTextStreamToResponse(res);
  } catch (error: any) {
    console.error('[Vercel Chat API Error]:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error?.message || 'Chat generation failed' });
    }
  }
}

// ── Web Standard Request/Response Handler (Edge / Next.js / Fetch compatible) ─
export async function POST(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch (e) {
      body = {};
    }

    const result = await processChatRequest(body);
    return result.toTextStreamResponse({
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error: any) {
    console.error('[Web Chat API Error]:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Chat generation failed' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
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
