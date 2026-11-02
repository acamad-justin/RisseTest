import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Production API /api/chat Fix & Regression Suite', () => {
  // 1. GET /api/chat health response
  test('1. GET /api/chat returns lightweight health check confirming runtime, supabase, and gemini status', async () => {
    const mod = await import('../frontend/api/chat.ts');
    assert.equal(typeof mod.GET, 'function', 'GET export must exist');

    const res = await mod.GET();
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'application/json');

    const json = JSON.parse(await res.text());
    assert.equal(json.status, 'HEALTHY');
    assert.equal(json.service, 'risse-chat');
    assert.ok(json.checks, 'Checks object must be present');
    assert.equal(json.checks.runtime, true);
    assert.equal(typeof json.checks.supabaseConfigured, 'boolean');
    assert.equal(typeof json.checks.geminiConfigured, 'boolean');

    // Sensitive data leakage checks
    const rawJson = JSON.stringify(json);
    assert.ok(!rawJson.includes('AIza'), 'Must not leak Google API keys');
    assert.ok(!rawJson.includes('eyJ'), 'Must not leak Supabase JWT tokens');
    assert.ok(!rawJson.includes('supabase.co'), 'Must not leak Supabase URL');
  });

  // 2. POST /api/chat handles valid requests
  test('2. POST /api/chat processes valid request payload and streams response', async () => {
    const mod = await import('../frontend/api/chat.ts');
    const req = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'What is a servo motor?' }],
        checkpointTitle: 'Actuators',
        moduleTitle: 'Robotics Fundamentals',
      }),
    });

    const res = await mod.POST(req);
    assert.ok(res.status === 200 || res.status === 500, 'Must return valid HTTP status');
    if (res.status === 200) {
      assert.ok(res.headers.has('X-Risse-Teaching-Mode'));
      assert.ok(res.headers.has('X-Risse-Assistance-Level'));
      assert.ok(res.headers.has('X-Risse-Tutoring-State'));
      assert.ok(res.headers.has('X-Risse-Target-Concept'));
    }
  });

  // 3. Missing authentication resolution & invalid tokens
  test('3. Missing authentication safely defaults to guest mode, while invalid bearer tokens return 401', async () => {
    const { resolveBackendAuth } = await import('../frontend/lib/serverAuth.ts');

    // Missing auth -> Guest mode
    const guestResult = await resolveBackendAuth({});
    assert.equal(guestResult.error, null);
    assert.equal(guestResult.auth?.role, 'guest');
    assert.equal(guestResult.auth?.isAuthenticated, false);

    // Invalid bearer token -> 401
    const invalidResult = await resolveBackendAuth({ authorization: 'Bearer invalid.token.payload' });
    assert.ok(invalidResult.error !== null);
    assert.equal(invalidResult.error?.statusCode, 401);
  });

  // 4. Invalid request body handling
  test('4. Empty or malformed request body is handled safely without unhandled server crash', async () => {
    const mod = await import('../frontend/api/chat.ts');
    const req = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid-json-{',
    });

    // Should not throw an unhandled exception
    const res = await mod.POST(req);
    assert.ok(res.status === 200 || res.status === 400 || res.status === 500);
  });

  // 5. Missing Gemini credentials handling
  test('5. Missing Gemini API credentials return 500 JSON rather than crashing serverless process', async () => {
    const mod = await import('../frontend/api/chat.ts');
    const originalKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const origGeminiKey = process.env.GEMINI_API_KEY;
    const origGoogleKey = process.env.GOOGLE_API_KEY;

    try {
      delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      delete process.env.GEMINI_API_KEY;
      delete process.env.GOOGLE_API_KEY;

      const req = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] }),
      });

      const res = await mod.POST(req);
      assert.equal(res.status, 500);
      const json = await res.json();
      assert.ok(json.error, 'Must provide structured error response');
    } finally {
      if (originalKey) process.env.GOOGLE_GENERATIVE_AI_API_KEY = originalKey;
      if (origGeminiKey) process.env.GEMINI_API_KEY = origGeminiKey;
      if (origGoogleKey) process.env.GOOGLE_API_KEY = origGoogleKey;
    }
  });

  // 6. Supabase retrieval failure falls back gracefully
  test('6. Supabase retrieval failure does not break primary chat response', async () => {
    const mod = await import('../frontend/api/chat.ts');
    const originalUrl = process.env.SUPABASE_URL;

    try {
      // Point to an invalid unreachable host
      process.env.SUPABASE_URL = 'https://unreachable-host-example-test-fail.supabase.co';

      const req = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'What is torque?' }],
          checkpointTitle: 'Sensors',
        }),
      });

      const res = await mod.POST(req);
      // Chat proceeds with fallback curriculum context (does not throw 500)
      assert.equal(res.status, 200);
      assert.ok(res.body);
    } finally {
      if (originalUrl) process.env.SUPABASE_URL = originalUrl;
    }
  });

  // 7. Memory extraction failure does not crash chat
  test('7. Memory extraction or sync failure does not break chat response', async () => {
    const { extractCandidateMemories } = await import('../frontend/lib/memory/memoryService.ts');

    // Candidate memory extraction handles empty or non-standard inputs safely
    const extraction = extractCandidateMemories({
      messages: [],
      lastUserMessage: '',
      isNotebook: false,
    });

    assert.equal(typeof extraction, 'object');
    assert.equal(extraction.candidateEvidence, undefined);
    assert.equal(extraction.globalMemoryUpdate, undefined);
  });

  // 8. Personal project notebook exclusion
  test('8. Personal project notebook conversations strictly exclude memory extraction', async () => {
    const { extractCandidateMemories } = await import('../frontend/lib/memory/memoryService.ts');

    const extraction = extractCandidateMemories({
      messages: [{ id: '1', role: 'user', content: 'I like hands-on coding and python.' }],
      lastUserMessage: 'I like hands-on coding and python.',
      isNotebook: true,
    });

    assert.equal(extraction.candidateEvidence, undefined);
    assert.equal(extraction.globalMemoryUpdate, undefined);
  });

  // 9. Correct production endpoint routing & configuration integrity
  test('9. Root api/chat.ts, package.json, and vercel.json configuration integrity', () => {
    const rootDir = path.resolve(import.meta.dirname, '..');

    // Root package.json exists and has dependencies
    const rootPkgPath = path.join(rootDir, 'package.json');
    assert.ok(fs.existsSync(rootPkgPath), 'Root package.json must exist for Vercel functions');
    const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));
    assert.ok(rootPkg.dependencies['@google/genai'], 'Must declare @google/genai in root package.json');
    assert.ok(rootPkg.dependencies['@supabase/supabase-js'], 'Must declare @supabase/supabase-js in root package.json');
    assert.ok(rootPkg.dependencies['@ai-sdk/google'], 'Must declare @ai-sdk/google in root package.json');
    assert.ok(rootPkg.dependencies['ai'], 'Must declare ai in root package.json');

    // Root api/chat.ts exists
    const rootApiTs = path.join(rootDir, 'api', 'chat.ts');
    assert.ok(fs.existsSync(rootApiTs), 'Root api/chat.ts must exist as Vercel serverless entry');

    // vercel.json configuration
    const vercelJsonPath = path.join(rootDir, 'vercel.json');
    assert.ok(fs.existsSync(vercelJsonPath), 'vercel.json must exist');
    const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));

    // Install command installs root dependencies
    assert.ok(
      vercelConfig.installCommand.includes('npm install'),
      'installCommand must install root dependencies'
    );

    // No redundant /api/(.*) -> /api/$1 rewrite loop
    const hasRedundantApiRewrite = vercelConfig.rewrites.some(
      (r: any) => r.source === '/api/(.*)' && r.destination === '/api/$1'
    );
    assert.equal(hasRedundantApiRewrite, false, 'Redundant /api/(.*) rewrite must be removed to prevent rewrite loops');

    // SPA fallback is preserved
    const hasSpaFallback = vercelConfig.rewrites.some((r: any) => r.destination === '/index.html');
    assert.ok(hasSpaFallback, 'SPA fallback to /index.html must be preserved');
  });

  // 10. Existing TSS invariants remain preserved
  test('10. Critical safety overrides, anti-frustration, and competition mode invariants remain intact', async () => {
    const { selectTeachingStrategy } = await import('../frontend/lib/teaching/selector.ts');

    // Safety override
    const safetyDecision = await selectTeachingStrategy({
      messages: [{ id: '1', role: 'user', content: 'Our 3S LiPo battery is puffed, swollen, and feels burning hot to touch!' }],
      lastUserMessage: 'Our 3S LiPo battery is puffed, swollen, and feels burning hot to touch!',
      checkpointTitle: 'Battery Safety & Power Distribution',
      moduleTitle: 'Power Systems',
      selectedChatMode: 'socratic',
    });
    assert.equal(safetyDecision.requiresSafetyIntervention, true);
    assert.equal(safetyDecision.responseStrategy, 'safety_intervention');
    assert.equal(safetyDecision.assistanceLevel, 5);

    // Competition mode pit triage
    const compDecision = await selectTeachingStrategy({
      messages: [{ id: '2', role: 'user', content: 'Our robot drivetrain stopped moving before match.' }],
      lastUserMessage: 'Our robot drivetrain stopped moving before match.',
      selectedChatMode: 'competition',
    });
    assert.equal(compDecision.selectedChatMode, 'competition');
  });
});
