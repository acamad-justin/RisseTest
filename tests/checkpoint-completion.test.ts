/*
 * Checkpoint completion — no end-of-topic assessment, no gate.
 *
 * The product rule: a student reads the lesson and marks it complete from the
 * lesson header. Nothing at the end of a lesson is graded and nothing blocks
 * progression. That has to hold for lessons authored before the rule as well —
 * stored evidence of an assessment must be ignored, not resurrected.
 *
 * These lock down:
 *   1. The lesson renders no assessment section, even when the data carries one.
 *   2. "Complete Checkpoint" completes unconditionally — no pass check.
 *   3. The mentor's Studio has no assessment configuration to set.
 *   4. The generator asks for and emits no graded assessment, in the AI prompt,
 *      in its fallbacks, and in the client-side curriculum engine.
 *   5. At runtime, clicking Complete emits the event on a lesson whose stored
 *      assessment says it is required.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const frontendDir = new URL('../frontend', import.meta.url).pathname;
const read = path => readFileSync(join(frontendDir, path), 'utf8');

test('the lesson renders no end-of-topic assessment', () => {
  const source = read('resources/js/components/CheckpointContentView.vue');
  assert.doesNotMatch(source, /topic-assessment-section/);
  assert.doesNotMatch(source, /End-of-Topic Assessment & Mastery Check/);
  assert.doesNotMatch(source, /btn-submit-topic-assessment/);
  assert.doesNotMatch(source, /submitAssessment/);
});

test('completing a checkpoint is not gated on an assessment', () => {
  const source = read('resources/js/components/CheckpointContentView.vue');
  assert.doesNotMatch(source, /required_to_unlock_next/);
  assert.doesNotMatch(source, /isAssessmentPassed/);

  const start = source.indexOf('async function handleCompleteCheckpoint()');
  const end = source.indexOf('\n}', start);
  const body = source.slice(start, end);
  assert.ok(!/assessment/i.test(body), 'handleCompleteCheckpoint must not consult an assessment');
  assert.match(body, /emit\('complete-checkpoint'/);
});

test('the mentor cannot configure an assessment that does not exist', () => {
  const source = read('resources/js/views/mentor/curriculum/CurriculumDesigner.vue');
  assert.doesNotMatch(source, /End-of-Topic Assessment Configuration/);
  assert.doesNotMatch(source, /addAssessmentQuestion/);
  assert.doesNotMatch(source, /passing_score_percentage/);
});

test('the generator neither asks for nor emits a graded assessment', () => {
  const service = read('server/moduleStudioAiService.ts');

  // The prompt no longer requests one, and says so explicitly.
  assert.match(service, /No graded assessment:/);
  assert.doesNotMatch(service, /Configurable End-of-Topic Assessment:/);
  assert.doesNotMatch(service, /"assessment": \{/);

  // Every return path uses the empty assessment, including the cached seed and
  // the mock, so a generated lesson can never carry one.
  assert.match(service, /const NO_END_OF_TOPIC_ASSESSMENT: NodeAssessmentConfig = \{\s*format: 'multiple_choice',\s*passing_threshold: 80,\s*questions: \[\],\s*\}/);
  assert.doesNotMatch(service, /assessment: matchAuth\.assessment/);
  assert.doesNotMatch(service, /assessment: t\.assessment/);
  assert.doesNotMatch(service, /assessment: parsed\.assessment/);

  // The client-side curriculum engine follows the same rule.
  const engine = read('lib/mentor/curriculumAiEngine.ts');
  assert.doesNotMatch(engine, /assessment: topic\.assessment/);
});

test('a generated node still carries its formative questions', () => {
  // The quiz shown inline is a study aid, not a checkpoint gate: removing the
  // graded assessment must not take the formative questions with it.
  const service = read('server/moduleStudioAiService.ts');
  assert.match(service, /assessment_questions/);
  const engine = read('lib/mentor/curriculumAiEngine.ts');
  assert.match(engine, /assessment_questions:/);
});

test('clicking Complete Checkpoint works even when the stored lesson required it', async () => {
  if (!existsSync(join(frontendDir, 'node_modules', 'happy-dom'))) {
    console.log('skipped: happy-dom is not installed in frontend/node_modules');
    return;
  }

  const entryFile = join(frontendDir, '.complete-mount-entry.js');
  const configFile = join(frontendDir, '.complete-mount-vite.config.mjs');
  const runnerFile = join(frontendDir, '.complete-mount-run.mjs');
  const outDirName = '.complete-mount-dist';
  const outDir = join(frontendDir, outDirName);

  writeFileSync(entryFile, [
    "export { default as CheckpointContentView } from './resources/js/components/CheckpointContentView.vue';",
    '',
  ].join('\n'));

  writeFileSync(configFile, [
    "import { defineConfig } from 'vite';",
    "import vue from '@vitejs/plugin-vue';",
    "import { resolve } from 'node:path';",
    'export default defineConfig({',
    '  plugins: [vue()],',
    '  logLevel: "silent",',
    '  build: {',
    "    lib: { entry: resolve(process.cwd(), '.complete-mount-entry.js'), formats: ['es'], fileName: 'entry' },",
    `    outDir: '${outDirName}',`,
    '    cssCodeSplit: false,',
    '    minify: false,',
    "    rollupOptions: { external: ['vue'], preserveEntrySignatures: 'strict' },",
    '  },',
    '});',
    '',
  ].join('\n'));

  writeFileSync(runnerFile, String.raw`
import { Window } from 'happy-dom';

const win = new Window({ url: 'https://localhost/' });
for (const key of ['window', 'document', 'DOMParser', 'Node', 'HTMLElement', 'Element', 'SVGElement',
  'MouseEvent', 'Event', 'CustomEvent', 'MutationObserver', 'customElements', 'localStorage',
  'sessionStorage', 'FormData', 'File', 'Blob']) {
  if (win[key] !== undefined) globalThis[key] = win[key];
}
Object.defineProperty(globalThis, 'navigator', { value: win.navigator, configurable: true });
globalThis.getComputedStyle = win.getComputedStyle.bind(win);
globalThis.fetch = () => Promise.reject(new Error('offline'));

const { createApp, h, nextTick } = await import('vue');
const { CheckpointContentView } = await import('./OUT_DIR/entry.js');

// A lesson authored under the OLD rule: it carries a graded assessment that
// claims to be required, and old UI gated the button on passing it.
const checkpointData = {
  id: 'cp-1',
  title: 'What is Robotics?',
  node_content: {
    introduction: 'Robotics is the design and operation of robots.',
    core_lesson: 'A robot is an automatically operated machine.',
  },
  assessment: {
    format: 'multiple_choice',
    passing_threshold: 80,
    required_to_unlock_next: true,
    questions: [{
      id: 'q1',
      type: 'multiple_choice',
      question: 'Which two characteristics set a robot apart?',
      options: ['A) Autonomy', 'B) Colour'],
      correct_answer: 'A',
      explanation: 'Autonomy and precision.',
    }],
  },
};

const root = document.createElement('div');
document.body.appendChild(root);

const events = [];
const errors = [];
const app = createApp({
  setup() {
    return () => h(CheckpointContentView, {
      checkpointTitle: 'What is Robotics?',
      parentModuleName: 'Robotics Foundations',
      moduleData: {
        id: 1,
        currentStep: 0,
        totalSteps: 2,
        checkpoints: [checkpointData],
      },
      checkpointData,
      readOnly: false,
      editable: false,
      previewMode: false,
      'onComplete-checkpoint': payload => events.push({ type: 'complete-checkpoint', payload }),
      'onBack': () => events.push({ type: 'back' }),
      'onNotify': message => events.push({ type: 'notify', message }),
    });
  },
});
app.config.errorHandler = error => errors.push(error && error.message ? error.message : String(error));

try {
  app.mount(root);
  await nextTick();
  await new Promise(resolve => setTimeout(resolve, 150));
} catch (error) {
  errors.push(error && error.message ? error.message : String(error));
}

const html = root.innerHTML;
const button = root.querySelector('#btn-complete-checkpoint');

if (errors.length) {
  console.error('MOUNT_ERRORS ' + JSON.stringify(errors));
  process.exit(1);
}
if (/topic-assessment-section/.test(html) || /Mastery Check/.test(html)) {
  console.error('MOUNT_ASSESSMENT_RENDERED');
  process.exit(1);
}
if (!button) {
  console.error('MOUNT_NO_BUTTON ' + html.slice(0, 300));
  process.exit(1);
}
if (button.getAttribute('aria-disabled') === 'true' || button.disabled) {
  console.error('MOUNT_BUTTON_DISABLED');
  process.exit(1);
}

button.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
await nextTick();
await new Promise(resolve => setTimeout(resolve, 100));

const completed = events.some(event => event.type === 'complete-checkpoint');
if (!completed) {
  console.error('MOUNT_NOT_COMPLETED ' + JSON.stringify(events));
  process.exit(1);
}
const blocked = events.some(event => event.type === 'notify' && /assessment|mastery/i.test(String(event.message)));
if (blocked) {
  console.error('MOUNT_BLOCKED ' + JSON.stringify(events));
  process.exit(1);
}

console.log('MOUNT_OK ' + JSON.stringify({ events: events.map(event => event.type) }));
process.exit(0);
`.replace('OUT_DIR', outDirName));

  try {
    execFileSync('npx', ['vite', 'build', '--config', '.complete-mount-vite.config.mjs'], {
      cwd: frontendDir,
      stdio: 'pipe',
      timeout: 180_000,
    });

    let output = '';
    try {
      output = execFileSync('node', [runnerFile], {
        cwd: frontendDir,
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 120_000,
      });
    } catch (error) {
      const failure = error as { stdout?: string; stderr?: string };
      assert.fail(`completing the checkpoint did not work.\n${failure.stderr || ''}${failure.stdout || ''}`);
    }

    assert.match(output, /MOUNT_OK /, `unexpected output: ${output}`);
  } finally {
    for (const path of [entryFile, configFile, runnerFile]) {
      if (existsSync(path)) unlinkSync(path);
    }
    rmSync(outDir, { recursive: true, force: true });
  }
});
