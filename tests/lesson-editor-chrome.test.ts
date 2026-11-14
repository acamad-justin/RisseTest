/*
 * The lesson editor must not write its own controls into the lesson, and a
 * content box's text must be editable.
 *
 * Two reports, one component:
 *
 *   1. "When I clicked a content box and pressed the check button it produced
 *      these words in the lesson": Test Content. / Content box / Delete /
 *      Wrap: square / Overlap / 🔓🗑✓.
 *
 *      The contextual control bar lives INSIDE the canvas (it has to, or it
 *      cannot be positioned against the element). `readFlowFromDom` serialised
 *      every canvas child that was not a float, so the bar's labels and its
 *      <select> options became lesson prose the moment the canvas was read —
 *      which is exactly what closing the bar does.
 *
 *   2. "I also can't edit the contents of the content box."
 *
 *      Floats rendered through `innerHTML` inside a `contenteditable="false"`
 *      wrapper, so a content box was a picture of text: movable, deletable,
 *      uneditable.
 *
 * These lock down:
 *   • the chrome is never part of the document, at the source level and in a
 *     real mount where the control bar is actually open;
 *   • float bodies are real typing surfaces while editing, inert in preview;
 *   • typing in a body persists that body's HTML and nothing else;
 *   • dragging still works from the element, but a press in its text is a caret.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const frontendDir = new URL('../frontend', import.meta.url).pathname;
const viewSource = readFileSync(
  join(frontendDir, 'resources/js/components/mentor/LessonDocumentView.vue'),
  'utf8'
);

test('the flow reader knows the editor chrome is not lesson text', () => {
  assert.match(viewSource, /const CANVAS_CHROME_SELECTOR = \[/);
  for (const token of ['.lesson-float', '.float-controls', '[data-float-body]', '[role="toolbar"]']) {
    assert.ok(
      viewSource.includes(`'${token}'`),
      `the flow reader would serialise ${token} into the lesson`
    );
  }
  // It must read a cleaned copy, not the live canvas the teacher is typing in.
  assert.match(viewSource, /function readFlowFromDom\(\)[\s\S]{0,400}canvas\.cloneNode\(true\)/);
  assert.match(viewSource, /clone\.querySelectorAll\(CANVAS_CHROME_SELECTOR\)\.forEach\(el => el\.remove\(\)\)/);
});

test('float bodies are typing surfaces while editing, and inert in preview', () => {
  assert.match(viewSource, /function floatBodyProps\(float, extraClass = ''\)/);
  assert.match(viewSource, /'data-float-body': float\.id/);
  assert.match(viewSource, /contenteditable: props\.editable \? 'true' : 'false'/);
  // Every text-ish kind renders through it.
  assert.ok(
    (viewSource.match(/floatBodyProps\(float/g) || []).length >= 3,
    'a text-ish float kind still renders a non-editable body'
  );
});

test('a press inside the text is a caret, not a drag', () => {
  const drag = viewSource.slice(
    viewSource.indexOf('function startFloatDrag'),
    viewSource.indexOf('function startFloatDrag') + 400
  );
  assert.match(drag, /if \(floatBodyOwner\(event\.target\)\) return;/);
});

test('the control bar never reaches the document, and a content box can be typed into', async () => {
  if (!existsSync(join(frontendDir, 'node_modules', 'happy-dom'))) {
    console.log('skipped: happy-dom is not installed in frontend/node_modules');
    return;
  }

  const entryFile = join(frontendDir, '.chrome-mount-entry.js');
  const configFile = join(frontendDir, '.chrome-mount-vite.config.mjs');
  const runnerFile = join(frontendDir, '.chrome-mount-run.mjs');
  const outDirName = '.chrome-mount-dist';
  const outDir = join(frontendDir, outDirName);

  writeFileSync(entryFile, [
    "export { default as LessonDocumentView } from './resources/js/components/mentor/LessonDocumentView.vue';",
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
    "    lib: { entry: resolve(process.cwd(), '.chrome-mount-entry.js'), formats: ['es'], fileName: 'entry' },",
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
  'sessionStorage', 'FormData', 'File', 'Blob', 'getComputedStyle']) {
  if (win[key] !== undefined) globalThis[key] = win[key];
}
Object.defineProperty(globalThis, 'navigator', { value: win.navigator, configurable: true });

const { createApp, h, nextTick } = await import('vue');
const { LessonDocumentView } = await import('./OUT_DIR/entry.js');

const document_ = {
  version: 1,
  flow: '<p>Intro paragraph</p>',
  floats: [
    { id: 'f1', kind: 'callout', wrap: 'top-bottom', overlap: false, html: '<p>Test Content.</p>' },
  ],
};

const root = document.createElement('div');
document.body.appendChild(root);

const emitted = [];
const errors = [];
const app = createApp({
  setup() {
    return () => h(LessonDocumentView, {
      document: document_,
      editable: true,
      courseId: 'course-1',
      'onUpdate:document': doc => emitted.push(doc),
      'onUpdate:flow': flow => emitted.push({ flow }),
      'onUpdate-float': patch => emitted.push({ float: patch }),
    });
  },
});
app.config.errorHandler = error => errors.push(error && error.message ? error.message : String(error));
app.mount(root);
await nextTick();
await new Promise(resolve => setTimeout(resolve, 120));

const fail = (code, detail) => {
  console.error(code + ' ' + JSON.stringify(detail));
  process.exit(1);
};

const canvas = root.querySelector('.lesson-document__canvas');
if (!canvas) fail('MOUNT_NO_CANVAS', root.innerHTML.slice(0, 300));
const floatEl = canvas.querySelector('[data-float-id="f1"]');
if (!floatEl) fail('MOUNT_NO_FLOAT', canvas.innerHTML.slice(0, 400));

// ── 1. Select the element the way a teacher does: click it. That opens the
//        contextual control bar inside the canvas — the reported state.
floatEl.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
await nextTick();
await new Promise(resolve => setTimeout(resolve, 60));

const controls = canvas.querySelector('.float-controls');
if (!controls) fail('MOUNT_NO_CONTROLS', canvas.innerHTML.slice(0, 600));
if (!/Wrap: square/.test(controls.textContent)) fail('CONTROLS_UNEXPECTED', controls.textContent);

// ── 2. Read the canvas WHILE the bar is still in the DOM.
//
// This is the real sequence: the done button is focusable, so pressing it blurs
// the canvas before Vue has re-rendered the bar away. Whatever the canvas holds
// at that instant is what used to be saved — which is how the bar's own labels
// became lesson prose.
canvas.dispatchEvent(new win.Event('input', { bubbles: true }));
canvas.dispatchEvent(new win.Event('blur', { bubbles: false }));
canvas.dispatchEvent(new win.Event('focusout', { bubbles: false }));
await nextTick();
await new Promise(resolve => setTimeout(resolve, 80));

const doneButton = Array.from(controls.querySelectorAll('button'))
  .find(button => (button.getAttribute('title') || '') === 'Done');
if (!doneButton) fail('NO_DONE_BUTTON', controls.innerHTML.slice(0, 400));
doneButton.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
await nextTick();
await new Promise(resolve => setTimeout(resolve, 60));

const flows = emitted
  .map(entry => entry && entry.flow ? entry.flow : entry && entry.document ? entry.document.flow : null)
  .filter(value => typeof value === 'string');
const latestFlow = flows.pop() || '';
if (errors.length) fail('MOUNT_ERRORS', errors);

const CHROME_WORDS = ['Wrap:', 'Overlap', 'Content box', 'Delete', '✓', '🔓', 'No wrap', 'Inline'];
for (const word of CHROME_WORDS) {
  if (latestFlow.includes(word)) fail('CHROME_IN_FLOW:' + word, latestFlow);
}
if (!latestFlow.includes('Intro paragraph')) fail('FLOW_LOST', latestFlow);

// ── 3. The content box's text is a real typing surface.
const body = floatEl.querySelector('[data-float-body="f1"]');
if (!body) fail('NO_EDITABLE_BODY', floatEl.innerHTML.slice(0, 400));
if (body.getAttribute('contenteditable') !== 'true') {
  fail('BODY_NOT_EDITABLE', body.getAttribute('contenteditable'));
}

body.innerHTML = '<p>Edited inside the box</p>';
body.dispatchEvent(new win.Event('input', { bubbles: true }));
await nextTick();
await new Promise(resolve => setTimeout(resolve, 60));

// update:document carries the document itself; update:float carries a patch.
const documents = emitted.filter(entry => entry && Array.isArray(entry.floats));
const withFloat = documents.filter(doc => doc.floats.some(f => f.id === 'f1'));
const pendingFloat = withFloat[withFloat.length - 1];
if (!pendingFloat) fail('BODY_EDIT_NOT_EMITTED', emitted.length);
const pendingHtml = String((pendingFloat.floats.find(f => f.id === 'f1') || {}).html || '');
if (!pendingHtml.includes('Edited inside the box')) fail('BODY_EDIT_TEXT_LOST', pendingHtml);

// Commit on blur, then the model must hold the edited body.
body.dispatchEvent(new win.Event('focusout', { bubbles: true }));
await nextTick();
await new Promise(resolve => setTimeout(resolve, 60));

const committed = emitted
  .filter(entry => entry && Array.isArray(entry.floats) && entry.floats.some(f => f.id === 'f1'))
  .pop();
const committedFloat = committed ? committed.floats.find(f => f.id === 'f1') : null;
if (!committedFloat || !String(committedFloat.html || '').includes('Edited inside the box')) {
  fail('BODY_EDIT_NOT_COMMITTED', committedFloat);
}
// The flow is untouched by an edit to a box.
if (String(committed.flow || '') !== latestFlow) fail('FLOW_CHANGED_BY_BOX_EDIT', committed.flow);

console.log('MOUNT_OK ' + JSON.stringify({ flow: latestFlow, body: committedFloat.html }));
process.exit(0);
`.replace('OUT_DIR', outDirName));

  try {
    execFileSync('npx', ['vite', 'build', '--config', '.chrome-mount-vite.config.mjs'], {
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
      assert.fail(`editor chrome / content box editing failed.\n${failure.stderr || ''}${failure.stdout || ''}`);
    }

    assert.match(output, /MOUNT_OK /, `unexpected output: ${output}`);
  } finally {
    for (const path of [entryFile, configFile, runnerFile]) {
      if (existsSync(path)) unlinkSync(path);
    }
    rmSync(outDir, { recursive: true, force: true });
  }
});
