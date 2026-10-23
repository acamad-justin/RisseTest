import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { google } from '@ai-sdk/google';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { streamText, convertToModelMessages } from 'ai';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || '' });

import { SYSTEM_RULES } from '../../../lib/systemRules';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawMessages = body.messages || [];
    const checkpointTitle = body.checkpointTitle || '';
    const moduleTitle = body.moduleTitle || body.parentModuleName || '';

    // Normalize messages to CoreMessage format ({ role: 'user' | 'assistant', content: string })
    const formattedMessages = rawMessages.map((m: any) => ({
      role: (m.role === 'ai' || m.sender === 'ai' || m.role === 'assistant') ? 'assistant' : 'user',
      content: m.content || m.text || '',
    }));

    const lastUserMessage = formattedMessages
      .filter((m: any) => m.role === 'user')
      .slice(-1)[0]?.content || '';

    // 1. Embed student message using gemini-embedding-001 (contextualized with topic if available)
    let contextText = 'No specific curriculum match found.';
    try {
      if (lastUserMessage.trim()) {
        const queryText = checkpointTitle 
          ? `[${checkpointTitle} - ${moduleTitle}]: ${lastUserMessage}` 
          : lastUserMessage;

        const embedRes = await ai.models.embedContent({
          model: 'gemini-embedding-001',
          contents: queryText,
          config: { outputDimensionality: 768 },
        });

        const queryVector = embedRes.embeddings?.[0]?.values;

        // 2. Query Supabase pgvector RPC
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
            console.error('match_curriculum RPC error:', error.message);
          }
        }
      }
    } catch (err) {
      console.error('Vector retrieval error:', err);
    }

    // 3. Assemble Prompt with active module & checkpoint context
    const fullPrompt = `
${SYSTEM_RULES}
CURRENT MODULE: ${moduleTitle || 'Robotics Curriculum'}
CURRENT CHECKPOINT TOPIC: ${checkpointTitle || 'Robotics Fundamentals'}

=========================
RETRIEVED CONTEXT FROM CURRICULUM:
${contextText}
=========================
`;

    // 4. Stream response using Gemini 3.5 Flash Lite
    const result = streamText({
      model: google('gemini-3.5-flash-lite'),
      system: fullPrompt,
      messages: formattedMessages,
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error('Chat route error:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Chat generation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}