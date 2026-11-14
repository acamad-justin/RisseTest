/*
 * Lesson formatting — what survives an edit, a blur and a save.
 *
 * The editor runs with `styleWithCSS`, so the browser writes formatting as inline
 * CSS (<span style="font-weight: bold">) rather than as <b>. The sanitizer runs on
 * every input, every blur and every save, so any property it does not allow is
 * silently deleted the moment the teacher clicks outside the text — which is
 * exactly what happened to bold, italic and underline.
 *
 * These lock down:
 *   1. Every formatting the toolbar can produce survives sanitizing.
 *   2. Sanitizing is idempotent, so a blur cannot rewrite the document into a
 *      different shape than the one the editor shows.
 *   3. Unsafe CSS is still dropped — declaration by declaration, not wholesale.
 *   4. Block wrappers the browser creates (div on Enter, from paste) keep their
 *      boundaries instead of merging into one run of text.
 *   5. In a real mounted editor, clicking outside the canvas does not remove
 *      bold, and the emitted document is the formatted one.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const frontendDir = new URL('../frontend', import.meta.url).pathname;

const { sanitizeLessonHtml, sanitizeInlineStyle } = await import(
  '../frontend/lib/mentor/richLessonContent.ts'
);

test('the formatting the toolbar produces survives sanitizing', () => {
  // Exactly what Chrome emits after clicking Bold / Italic / Underline, because
  // the editor enables `styleWithCSS` before running the command.
  const cases = [
    ['<p><span style="font-weight: bold;">bold</span></p>', 'font-weight: bold'],
    ['<p><span style="font-style: italic;">italic</span></p>', 'font-style: italic'],
    ['<p><span style="text-decoration: underline;">under</span></p>', 'text-decoration: underline'],
    ['<p><span style="font-weight: 700;">heavy</span></p>', 'font-weight: 700'],
    ['<p><span style="text-decoration-line: line-through;">struck</span></p>', 'text-decoration-line: line-through'],
    ['<p><span style="color: rgb(255, 0, 0);">red</span></p>', 'color: rgb(255, 0, 0)'],
    ['<p><span style="text-align: center;">centred</span></p>', 'text-align: center'],
    ['<p><span style="background-color: yellow;">marked</span></p>', 'background-color: yellow'],
  ];

  for (const [html, expected] of cases) {
    const out = sanitizeLessonHtml(html);
    assert.match(out, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `lost: ${expected} from ${html}`);
  }
});

test('the combined formatting runs the toolbar produces survive together', () => {
  // Bold + italic + underline applied to one selection.
  const html = '<p><span style="font-weight: bold; font-style: italic; text-decoration: underline;">all three</span></p>';
  const out = sanitizeLessonHtml(html);
  assert.match(out, /font-weight: bold/);
  assert.match(out, /font-style: italic/);
  assert.match(out, /text-decoration: underline/);
});

test('semantic tags still survive too', () => {
  const out = sanitizeLessonHtml('<p><b>bold</b> <i>ital</i> <u>und</u> <s>struck</s> <code>code</code></p>');
  for (const tag of ['<b>', '<i>', '<u>', '<s>', '<code>']) assert.ok(out.includes(tag), `lost ${tag}`);
});

test('block wrappers keep their boundaries', () => {
  // Enter inside the canvas can produce a sibling block; unwrapping them merged
  // two paragraphs into one run of text.
  const out = sanitizeLessonHtml('<div>first line</div><div>second line</div>');
  assert.match(out, /<div>first line<\/div>/);
  assert.match(out, /<div>second line<\/div>/);
  // Two blocks, not one merged run: the boundaries are what the editor and the
  // saved document rely on (readFlowFromDom joins blocks with a newline).
  assert.equal((out.match(/<div>/g) || []).length, 2);
});

test('sanitizing twice changes nothing', () => {
  const samples = [
    '<p>plain <span style="font-weight: bold;">bold</span></p>',
    '<h2>Title</h2><ul><li>one</li><li><em>two</em></li></ul>',
    '<p><span style="color: rgb(0, 128, 0); font-size: 18px;">sized</span></p>',
    '<table><tbody><tr><td>cell</td></tr></tbody></table>',
  ];
  for (const sample of samples) {
    const once = sanitizeLessonHtml(sample);
    assert.equal(sanitizeLessonHtml(once), once, `not idempotent: ${sample}`);
  }
});

test('unsafe CSS is still dropped, declaration by declaration', () => {
  assert.equal(sanitizeInlineStyle('position: absolute'), '');
  assert.equal(sanitizeInlineStyle('background: url(javascript:alert(1))'), '');
  assert.equal(sanitizeInlineStyle('font-weight: bold; position: fixed'), 'font-weight: bold');
  assert.equal(sanitizeInlineStyle('color: red; behavior: url(x.htc)'), 'color: red');
  // Values that are not real formatting are refused rather than passed through.
  assert.equal(sanitizeInlineStyle('font-weight: 1000'), '');
  assert.equal(sanitizeInlineStyle('font-style: wobbly'), '');
  assert.equal(sanitizeInlineStyle('text-decoration: underline blink'), '');
});

test('the sanitizer still refuses scripts and event handlers', () => {
  assert.doesNotMatch(sanitizeLessonHtml('<p onclick="steal()">x</p>'), /onclick/);
  assert.doesNotMatch(sanitizeLessonHtml('<script>steal()</script><p>ok</p>'), /steal/);
  assert.doesNotMatch(sanitizeLessonHtml('<img src="javascript:alert(1)">'), /javascript:/);
});

test('clicking outside the canvas keeps bold, in a real mounted editor', () => {
  if (!existsSync(join(frontendDir, 'node_modules', 'happy-dom'))) {
    console.log('skipped: happy-dom is not installed in frontend/node_modules');
    return;
  }

  const entryFile = join(frontendDir, '.format-mount-entry.js');
  const configFile = join(frontendDir, '.format-mount-vite.config.mjs');
  const runnerFile = join(frontendDir, '.format-mount-run.mjs');
  const outDirName = '.format-mount-dist';
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
    "    lib: { entry: resolve(process.cwd(), '.format-mount-entry.js'), formats: ['es'], fileName: 'entry' },",
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
  'sessionStorage', 'FormData', 'File', 'Blob']) {
  if (win[key] !== undefined) globalThis[key] = win[key];
}
Object.defineProperty(globalThis, 'navigator', { value: win.navigator, configurable: true });
globalThis.getComputedStyle = win.getComputedStyle.bind(win);

const { createApp, h, nextTick } = await import('vue');
const { LessonDocumentView } = await import('./OUT_DIR/entry.js');

const root = document.createElement('div');
document.body.appendChild(root);

const emitted = [];
const errors = [];
const app = createApp({
  setup() {
    return () => h(LessonDocumentView, {
      document: { version: 1, flow: '<p>Before after</p>', floats: [] },
      editable: true,
      courseId: 'course-1',
      'onUpdate:document': doc => emitted.push(doc),
      'onUpdate:flow': flow => emitted.push({ flow }),
    });
  },
});
app.config.errorHandler = error => errors.push(error && error.message ? error.message : String(error));

app.mount(root);
await nextTick();
await new Promise(resolve => setTimeout(resolve, 100));

const canvas = root.querySelector('.lesson-document__canvas');
if (!canvas) {
  console.error('MOUNT_NO_CANVAS ' + root.innerHTML.slice(0, 300));
  process.exit(1);
}
const node = canvas.querySelector('.lesson-document__node');
if (!node) {
  console.error('MOUNT_NO_NODE');
  process.exit(1);
}

// What the browser leaves behind after selecting "Before" and clicking Bold,
// with styleWithCSS enabled.
node.innerHTML = '<p><span style="font-weight: bold;">Before</span> after</p>';
canvas.dispatchEvent(new win.Event('input', { bubbles: true }));
await nextTick();

// Then the teacher clicks somewhere outside the content area.
canvas.dispatchEvent(new win.Event('blur', { bubbles: false }));
await nextTick();
await new Promise(resolve => setTimeout(resolve, 50));

const latest = emitted.filter(Boolean).pop() || {};
const html = latest.flow || (latest.document && latest.document.flow) || '';

if (errors.length) {
  console.error('MOUNT_ERRORS ' + JSON.stringify(errors));
  process.exit(1);
}
if (!html) {
  console.error('MOUNT_NO_EMIT ' + JSON.stringify(emitted));
  process.exit(1);
}
if (!/font-weight: bold/.test(html)) {
  console.error('MOUNT_BOLD_LOST ' + JSON.stringify({ html, emitted: emitted.length }));
  process.exit(1);
}
// And the editor still shows it, not a rebuilt plain paragraph.
if (!/font-weight: bold/.test(canvas.innerHTML)) {
  console.error('MOUNT_BOLD_NOT_RENDERED ' + canvas.innerHTML.slice(0, 200));
  process.exit(1);
}

console.log('MOUNT_OK ' + JSON.stringify({ html }));
process.exit(0);
`.replace('OUT_DIR', outDirName));

  try {
    execFileSync('npx', ['vite', 'build', '--config', '.format-mount-vite.config.mjs'], {
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
      assert.fail(`the editor lost formatting on blur.\n${failure.stderr || ''}${failure.stdout || ''}`);
    }

    assert.match(output, /MOUNT_OK /, `unexpected output: ${output}`);
  } finally {
    for (const path of [entryFile, configFile, runnerFile]) {
      if (existsSync(path)) unlinkSync(path);
    }
    rmSync(outDir, { recursive: true, force: true });
  }
});
