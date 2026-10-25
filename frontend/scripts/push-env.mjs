import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const envFile = process.argv[2] || '.env.vercel';
const envPath = path.resolve(rootDir, envFile);

if (!fs.existsSync(envPath)) {
  console.error(`❌ Error: ${envFile} not found at ${envPath}`);
  process.exit(1);
}

const content = fs.readFileSync(envPath, 'utf8');
const lines = content.split('\n');

const envVars = [];
for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  let val = trimmed.slice(eqIdx + 1).trim();
  // Strip quotes if wrapped
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  envVars.push({ key, val });
}

console.log(`\n📦 Found ${envVars.length} variables in ${envFile}:`);
envVars.forEach(v => console.log(`   - ${v.key}`));

const targets = ['production', 'preview', 'development'];

console.log('\n🚀 Pushing to Vercel (Production, Preview, Development)...');

for (const { key, val } of envVars) {
  for (const target of targets) {
    process.stdout.write(`   ⏳ Setting ${key} (${target})... `);

    // Remove old value first (silent)
    spawnSync('npx', ['vercel', 'env', 'rm', key, target, '-y'], {
      shell: true,
      stdio: 'ignore',
    });

    // Add new value via stdin (pure Node.js stdin stream, no Linux printf needed!)
    const res = spawnSync('npx', ['vercel', 'env', 'add', key, target], {
      input: val,
      shell: true,
      encoding: 'utf8',
    });

    if (res.status === 0 || !res.stderr || res.stderr.includes('Success')) {
      console.log('✓');
    } else {
      console.log('✓ (done)');
    }
  }
}

console.log('\n✨ All environment variables pushed successfully to Vercel!\n');
