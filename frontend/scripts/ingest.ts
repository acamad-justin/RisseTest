// scripts/ingest.ts
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Search for .env files across multiple common directories
const envCandidates = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), 'frontend/.env.local'),
  path.resolve(__dirname, '../../.env.local'),
  path.resolve(__dirname, '../.env.local'),
  path.resolve(process.cwd(), '../.env.local'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../.env'),
];

for (const envPath of envCandidates) {
  try {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
    }
  } catch (_) {}
}
dotenv.config();

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  '';

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

const googleApiKey =
  process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase URL and Key are required. Check your .env.local configuration.');
  process.exit(1);
}

if (!googleApiKey) {
  console.error('❌ Error: Google Generative AI API Key is required. Check GOOGLE_GENERATIVE_AI_API_KEY in .env.local.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const ai = new GoogleGenAI({ apiKey: googleApiKey });

async function run() {
  const curriculumCandidates = [
    path.resolve(process.cwd(), 'curriculum.md'),
    path.resolve(process.cwd(), '../curriculum.md'),
    path.resolve(__dirname, '../../curriculum.md'),
    path.resolve(__dirname, '../curriculum.md'),
  ];

  const curriculumPath = curriculumCandidates.find(p => fs.existsSync(p));

  if (!curriculumPath) {
    console.error('❌ Error: curriculum.md not found in candidates:', curriculumCandidates);
    process.exit(1);
  }

  console.log(`Loading curriculum from: ${curriculumPath}`);
  const fileContent = fs.readFileSync(curriculumPath, 'utf-8');
  const sections = fileContent.split(/\n---+\n/).map(s => s.trim()).filter(Boolean);

  console.log('Clearing existing curriculum chunks from Supabase...');
  const { error: deleteError } = await supabase
    .from('knowledge_chunks')
    .delete()
    .not('id', 'is', null);

  if (deleteError) {
    console.error('Error clearing table:', deleteError.message);
    return;
  }
  console.log('  ✓ Old chunks cleared.\n');

  console.log(`Ingesting ${sections.length} modules into Supabase...\n`);

  for (let i = 0; i < sections.length; i++) {
    const text = sections[i];
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    // Prefer grabbing the '## Heading' line so table headers like '| 01 |' are ignored
    const headingLine = lines.find(l => l.startsWith('#')) || lines[0] || `Module ${i + 1}`;
    const title = headingLine
      .replace(/^[#*\s-]+/, '')
      .replace(/^\d+\.\s*/, '')
      .replace(/\|.*/, '')
      .trim();

    console.log(`[${i + 1}/${sections.length}] Embedding: ${title}...`);

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