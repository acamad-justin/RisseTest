/*
 * Preview unlocks every node.
 *
 * A mentor reviewing a module has to be able to open any lesson in it. Locking
 * nodes behind simulated progress means either completing lessons as a student or
 * faking progress to read node 4 — which defeats the point of previewing.
 *
 * These lock down:
 *   1. The preview asks for it, ModuleExperience forwards it, the roadmap obeys it.
 *   2. A locked node is openable in preview and still refuses for a student.
 *   3. Students are unaffected: nothing in the student workspace sets the flag.
 *   4. The preview node does not present itself as locked (no padlock, no
 *      "complete previous step" tooltip), because a clickable padlock is a lie.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const frontendDir = new URL('../frontend', import.meta.url).pathname;
const read = path => readFileSync(join(frontendDir, path), 'utf8');

test('the preview requests unlocked navigation, and it is forwarded', () => {
  const designer = read('resources/js/views/mentor/curriculum/CurriculumDesigner.vue');
  assert.match(designer, /:allow-locked-navigation="true"/);

  const experience = read('resources/js/components/ModuleExperience.vue');
  assert.match(experience, /allowLockedNavigation: \{ type: Boolean, default: false \}/);
  assert.match(experience, /<ModuleRoadmapView[\s\S]{0,400}:allow-locked-navigation="allowLockedNavigation"/);
});

test('the roadmap treats every node as open when previewing', () => {
  const roadmap = read('resources/js/components/ModuleRoadmapView.vue');

  assert.match(roadmap, /allowLockedNavigation: \{\s*type: Boolean,\s*default: false,?\s*\}/);
  assert.match(roadmap, /function isNodeOpen\(idx\) \{\s*return props\.allowLockedNavigation \|\| idx <= currentStep\.value;\s*\}/);

  // Clicking a node asks the one question that decides reachability.
  const click = roadmap.slice(roadmap.indexOf('function handleNodeClick'), roadmap.indexOf('function handleNodeClick') + 400);
  assert.match(click, /if \(isNodeOpen\(idx\)\)/);
  assert.doesNotMatch(click, /if \(idx <= currentStep\.value\)/);

  // The locked class is only applied when the node really is locked.
  assert.match(roadmap, /'node-locked': idx > currentStep && !allowLockedNavigation/);

  // Preview nodes render without the padlock.
  assert.match(roadmap, /v-else-if="allowLockedNavigation"/);
  assert.match(roadmap, /open-pill/);
});

test('students are untouched by the flag', () => {
  const app = read('resources/js/App.vue');
  assert.doesNotMatch(app, /allow-locked-navigation/);
  assert.doesNotMatch(app, /allowLockedNavigation/);

  // The student workspace renders ModuleExperience without it, so the default
  // (locked) applies.
  assert.match(app, /<ModuleExperience/);
});

test('in preview, every node opens; for a student, only the reached ones do', async () => {
  if (!existsSync(join(frontendDir, 'node_modules', 'happy-dom'))) {
    console.log('skipped: happy-dom is not installed in frontend/node_modules');
    return;
  }

  const entryFile = join(frontendDir, '.unlock-mount-entry.js');
  const configFile = join(frontendDir, '.unlock-mount-vite.config.mjs');
  const runnerFile = join(frontendDir, '.unlock-mount-run.mjs');
  const outDirName = '.unlock-mount-dist';
  const outDir = join(frontendDir, outDirName);

  writeFileSync(entryFile, [
    "export { default as ModuleRoadmapView } from './resources/js/components/ModuleRoadmapView.vue';",
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
    "    lib: { entry: resolve(process.cwd(), '.unlock-mount-entry.js'), formats: ['es'], fileName: 'entry' },",
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

const win = new Window({ url: 'https://localhost/mentor' });
for (const key of ['window', 'document', 'DOMParser', 'Node', 'HTMLElement', 'Element', 'SVGElement',
  'MouseEvent', 'Event', 'CustomEvent', 'MutationObserver', 'customElements', 'localStorage',
  'sessionStorage', 'FormData', 'File', 'Blob', 'navigator']) {
  if (win[key] !== undefined && key !== 'navigator') globalThis[key] = win[key];
}
Object.defineProperty(globalThis, 'navigator', { value: win.navigator, configurable: true });
globalThis.getComputedStyle = win.getComputedStyle.bind(win);
globalThis.fetch = () => Promise.reject(new Error('offline'));

const { createApp, h, nextTick } = await import('vue');
const { ModuleRoadmapView } = await import('./OUT_DIR/entry.js');

const moduleData = {
  id: 7,
  title: 'Robotics Foundations',
  currentStep: 1,
  totalSteps: 3,
  checkpoints: [
    { id: 'cp-1', name: 'What is Robotics?', x: 120, y: 120 },
    { id: 'cp-2', name: 'Robotics Standards', x: 420, y: 220 },
    { id: 'cp-3', name: 'Sensors and Signals', x: 720, y: 120 },
  ],
};

async function mountRoadmap(allowLockedNavigation) {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const events = [];
  const errors = [];
  const app = createApp({
    setup() {
      return () => h(ModuleRoadmapView, {
        moduleData,
        readOnly: true,
        allowLockedNavigation,
        'onSelect-checkpoint': cp => events.push({ type: 'select', id: cp.id }),
        'onNotify': message => events.push({ type: 'notify', message }),
      });
    },
  });
  app.config.errorHandler = error => errors.push(error && error.message ? error.message : String(error));
  app.mount(root);
  await nextTick();
  await new Promise(resolve => setTimeout(resolve, 120));
  return { root, events, errors, app };
}

const click = async (root, id) => {
  const node = root.querySelector('[id="node-checkpoint-' + id + '"]');
  if (!node) return false;
  node.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  await nextTick();
  await new Promise(resolve => setTimeout(resolve, 60));
  return true;
};

// ── Preview: the third node is past the current step, and must still open.
const preview = await mountRoadmap(true);
if (preview.errors.length) {
  console.error('MOUNT_ERRORS ' + JSON.stringify(preview.errors));
  process.exit(1);
}
const previewNode = preview.root.querySelector('[id="node-checkpoint-cp-3"]');
if (!previewNode) {
  console.error('MOUNT_NO_NODE ' + preview.root.innerHTML.slice(0, 300));
  process.exit(1);
}
if (previewNode.classList.contains('node-locked')) {
  console.error('PREVIEW_NODE_LOCKED');
  process.exit(1);
}
if (/🔒/.test(previewNode.textContent || '')) {
  console.error('PREVIEW_NODE_SHOWS_PADLOCK ' + previewNode.textContent);
  process.exit(1);
}
await click(preview.root, 'cp-3');
if (!preview.events.some(event => event.type === 'select' && event.id === 'cp-3')) {
  console.error('PREVIEW_NODE_DID_NOT_OPEN ' + JSON.stringify(preview.events));
  process.exit(1);
}

// ── Student: the same node stays shut.
const student = await mountRoadmap(false);
const studentNode = student.root.querySelector('[id="node-checkpoint-cp-3"]');
if (!studentNode || !studentNode.classList.contains('node-locked')) {
  console.error('STUDENT_NODE_NOT_LOCKED');
  process.exit(1);
}
await click(student.root, 'cp-3');
if (student.events.some(event => event.type === 'select' && event.id === 'cp-3')) {
  console.error('STUDENT_NODE_OPENED ' + JSON.stringify(student.events));
  process.exit(1);
}
if (!student.events.some(event => event.type === 'notify' && /locked/i.test(String(event.message)))) {
  console.error('STUDENT_NOT_TOLD_IT_IS_LOCKED ' + JSON.stringify(student.events));
  process.exit(1);
}

console.log('MOUNT_OK ' + JSON.stringify({ preview: preview.events.map(e => e.type), student: student.events.map(e => e.type) }));
process.exit(0);
`.replace('OUT_DIR', outDirName));

  try {
    execFileSync('npx', ['vite', 'build', '--config', '.unlock-mount-vite.config.mjs'], {
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
      assert.fail(`preview node navigation failed.\n${failure.stderr || ''}${failure.stdout || ''}`);
    }

    assert.match(output, /MOUNT_OK /, `unexpected output: ${output}`);
  } finally {
    for (const path of [entryFile, configFile, runnerFile]) {
      if (existsSync(path)) unlinkSync(path);
    }
    rmSync(outDir, { recursive: true, force: true });
  }
});
