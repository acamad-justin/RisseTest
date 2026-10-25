// scripts/ingest.ts
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! });

async function run() {
  const fileContent = fs.readFileSync('./curriculum.md', 'utf-8');
  const sections = fileContent.split(/\n---+\n/).map(s => s.trim()).filter(Boolean);

  console.log(`Ingesting ${sections.length} modules into Supabase...\n`);

  for (let i = 0; i < sections.length; i++) {
    const text = sections[i];
    const firstLine = text.split('\n').find(l => l.trim().length > 0) || `Module ${i + 1}`;
    const title = firstLine.replace(/^[#*\s-]+/, '').replace(/\|.*/, '').trim();

    console.log(`[${i + 1}/${sections.length}] Embedding: ${title}...`);

    // ✅ New
    const response = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: text,
      config: { outputDimensionality: 768 },
    });

    const embedding = response.embeddings?.[0]?.values;

    const { error } = await supabase.from('knowledge_chunks').insert({
      module_title: title,
      content: text,
      embedding,
    });

    if (error) console.error('Supabase Error:', error.message);
    else console.log('  ✓ Stored');
  }
  console.log('\nAll chunks stored successfully.');
}

run();