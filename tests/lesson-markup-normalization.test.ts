/*
 * Generated lesson prose must be FORMATTING, not Markdown syntax.
 *
 * The lesson generator was asked for a "markdown string" per content block. That
 * string went straight into the shared lesson document — sanitized, never
 * converted — so a student opening the first lesson of a published module read:
 *
 *   ### Why it matters Before you build a robot, you need to know what makes
 *   something a robot ... Two things set a robot apart: - **Autonomy:** It can
 *   perform autonomously ...
 *
 * One run-together line, asterisks and hashes included: the newlines were
 * collapsed by HTML and nothing had turned the Markdown into <h3>, <p>, <ul> or
 * <strong>.
 *
 * These lock down:
 *   1. The reported content becomes real blocks and real emphasis.
 *   2. Markdown that is already wrapped in HTML is promoted too, without
 *      disturbing markup around it.
 *   3. <pre>/<code> stay literal — `**` in code is not emphasis.
 *   4. Normalisation is idempotent, so a second pass cannot rewrite a lesson.
 *   5. The lesson document stores blocks, not one text blob.
 *   6. What the student renderer produces has no Markdown characters left.
 *   7. The generator is asked for HTML, so this is a safety net and not the only
 *      defence.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const frontendDir = new URL('../frontend', import.meta.url).pathname;

const { normalizeLessonMarkup, renderLessonRichHtml, prepareContentForEditor } = await import(
  '../frontend/lib/mentor/richLessonContent.ts'
);
const { documentFromBlocks, documentFromNodeContent, normalizeLessonDocument, splitFlowHtml } = await import(
  '../frontend/lib/mentor/lessonDocument.ts'
);

/** The lesson content from the report, verbatim in shape. */
const GENERATED_MARKDOWN = `### Why it matters
Before you build a robot, you need to know what makes something a robot and not just a machine. **Robotics** deals with the design, construction, operation, and use of robots. It also covers the computer systems that control them.

Two things set a robot apart:
- **Autonomy:** It can perform autonomously, without a person controlling every move.
- **Precision & Accuracy:** It can carry out repetitive instructions with precision and accuracy.`;

test('generated Markdown becomes formatting instead of being shown as syntax', () => {
  const html = normalizeLessonMarkup(GENERATED_MARKDOWN);

  assert.match(html, /<h3>Why it matters<\/h3>/, 'the ### heading is not a heading');
  assert.match(html, /<strong>Robotics<\/strong>/, 'the **bold** is not bold');
  assert.match(html, /<strong>Autonomy:<\/strong>/);
  assert.match(html, /<ul><li>/, 'the bullets are not a list');
  assert.ok(html.includes('Two things set a robot apart'));

  // Nothing a student would have to read as punctuation.
  assert.doesNotMatch(html, /\*\*/);
  assert.doesNotMatch(html, /###/);
  assert.doesNotMatch(html, /(^|>)\s*-\s+\*\*/);
});

test('the heading and the paragraph under it stay separate blocks', () => {
  // The reported symptom: "### Why it matters Before you build a robot..." on one
  // line, because the heading marker was never a block boundary.
  const html = normalizeLessonMarkup(GENERATED_MARKDOWN);
  const headingIndex = html.indexOf('<h3>');
  const paragraphAfter = html.indexOf('<p>', headingIndex);
  assert.ok(headingIndex >= 0 && paragraphAfter > headingIndex, 'heading and prose are one run');
  assert.doesNotMatch(html.slice(headingIndex, paragraphAfter), /Before you build a robot/);
});

test('Markdown already wrapped in HTML is promoted, and the HTML survives', () => {
  const stored = [
    '<p>### Why it matters\nBefore you build a robot. **Robotics** deals with robots.</p>',
    '<p><span style="color: rgb(0, 128, 0);">already formatted</span></p>',
  ].join('');

  const html = normalizeLessonMarkup(stored);
  assert.match(html, /<h3>Why it matters<\/h3>/);
  assert.match(html, /<strong>Robotics<\/strong>/);
  // Untouched formatting is still there.
  assert.match(html, /color: rgb\(0, 128, 0\)/);
  assert.match(html, /already formatted/);
});

test('code is literal: asterisks in a code block are not emphasis', () => {
  const html = normalizeLessonMarkup(
    '<p>Declare a grid:</p><pre><code>int **grid = NULL;</code></pre><p>and **that** is bold.</p>'
  );
  assert.match(html, /int \*\*grid = NULL;/);
  assert.doesNotMatch(html, /int <strong>/);
  // Prose next to it is still promoted.
  assert.match(html, /<strong>that<\/strong>/);
});

test('normalising twice changes nothing', () => {
  const once = normalizeLessonMarkup(GENERATED_MARKDOWN);
  assert.equal(normalizeLessonMarkup(once), once);
  // And the mixed case is stable too.
  const mixed = normalizeLessonMarkup('<p>### Head\n**bold** text</p>');
  assert.equal(normalizeLessonMarkup(mixed), mixed);
});

test('the lesson document stores blocks, not one run of text', () => {
  const doc = documentFromBlocks([
    { id: 'b-1', type: 'text', title: '', content: GENERATED_MARKDOWN },
  ]);

  assert.doesNotMatch(doc.flow, /\*\*|###/);

  const nodes = splitFlowHtml(doc.flow);
  assert.deepEqual(
    nodes.map(node => node.slice(0, 4)),
    ['<h3>', '<p>B', '<p>T', '<ul>'],
    `flow was not split into blocks: ${JSON.stringify(nodes)}`
  );
});

test('a stored document is normalised when it is read back', () => {
  // Documents saved before this fix hold the Markdown. They must render right
  // without anyone re-generating the lesson.
  const doc = normalizeLessonDocument({
    version: 1,
    flow: '<p>### Why it matters\n**Robotics** deals with robots.</p>',
    floats: [{ id: 'f1', kind: 'callout', wrap: 'top-bottom', overlap: false, html: '**Boxed** text' }],
  });

  assert.match(doc.flow, /<h3>Why it matters<\/h3>/);
  assert.match(doc.flow, /<strong>Robotics<\/strong>/);
  assert.match(String(doc.floats[0].html), /<strong>Boxed<\/strong>/);
});

test('what the student renderer emits has no Markdown left in it', async () => {
  const html = renderLessonRichHtml(GENERATED_MARKDOWN);
  assert.doesNotMatch(html, /\*\*|###/);

  // Parse the real output the way a browser would, so this is about elements a
  // student sees rather than the shape of a string.
  const happyDomPath = join(frontendDir, 'node_modules', 'happy-dom', 'lib', 'index.js');
  if (!existsSync(happyDomPath)) {
    console.log('skipped DOM parse: happy-dom is not installed in frontend/node_modules');
    return;
  }
  const { Window } = await import(happyDomPath);
  const win = new Window({ url: 'https://localhost/' });
  win.document.body.innerHTML = html;

  const root = win.document.body;
  // Legacy Markdown rendering promotes # to <h2> and ### to <h4> with an .md-h3
  // class; the document path uses <h3>. Both are headings, and neither is "###".
  assert.equal(
    root.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
    1,
    'no heading element rendered'
  );
  assert.ok(root.querySelectorAll('strong').length >= 3, 'bold is not a <strong>');
  assert.equal(root.querySelectorAll('li').length, 2, 'bullets are not list items');
  assert.doesNotMatch(String(root.textContent), /\*\*|###/);
});

test('the eight-section lesson shape is split into blocks too', () => {
  // Lessons without `blocks` are built from node_content, which wraps each
  // section in a single <p>. That is the other way the blob was produced.
  const doc = documentFromNodeContent({ core_lesson: GENERATED_MARKDOWN });
  assert.doesNotMatch(doc.flow, /\*\*|###/);
  const nodes = splitFlowHtml(doc.flow);
  assert.ok(nodes.length >= 4, `section was not split: ${JSON.stringify(nodes)}`);
  assert.ok(nodes.some(node => node.startsWith('<h3>')), 'no heading block');
  assert.ok(nodes.some(node => node.startsWith('<ul>')), 'no list block');
});

test('the editor opens generated content as formatting, not syntax', () => {
  const html = prepareContentForEditor(GENERATED_MARKDOWN);
  assert.match(html, /<h3>/);
  assert.match(html, /<strong>/);
  assert.doesNotMatch(html, /\*\*|###/);
});

test('the generator is told to write HTML, so this is not the only defence', () => {
  const service = readFileSync(join(frontendDir, 'server/moduleStudioAiService.ts'), 'utf8');
  assert.match(service, /Prose is simple HTML, not Markdown/);
  assert.match(service, /Never emit Markdown syntax/);
  assert.match(service, /"content": "HTML string/);
  assert.doesNotMatch(service, /"content": "markdown string"/);
});

test('the student view renders headings and bold, not Markdown syntax', async () => {
  if (!existsSync(join(frontendDir, 'node_modules', 'happy-dom'))) {
    console.log('skipped: happy-dom is not installed in frontend/node_modules');
    return;
  }

  const entryFile = join(frontendDir, '.markup-mount-entry.js');
  const configFile = join(frontendDir, '.markup-mount-vite.config.mjs');
  const runnerFile = join(frontendDir, '.markup-mount-run.mjs');
  const outDirName = '.markup-mount-dist';
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
    "    lib: { entry: resolve(process.cwd(), '.markup-mount-entry.js'), formats: ['es'], fileName: 'entry' },",
    `    outDir: '${outDirName}',`,
    '    cssCodeSplit: false,',
    '    minify: false,',
    "    rollupOptions: { external: ['vue'], preserveEntrySignatures: 'strict' },",
    '  },',
    '});',
    '',
  ].join('\n'));

  // A document exactly as it was stored by the reported generation: one <p>
  // holding the whole Markdown blob.
  writeFileSync(runnerFile, String.raw`
import { Window } from 'happy-dom';

const win = new Window({ url: 'https://localhost/student' });
for (const key of ['window', 'document', 'DOMParser', 'Node', 'HTMLElement', 'Element', 'SVGElement',
  'MouseEvent', 'Event', 'CustomEvent', 'MutationObserver', 'customElements', 'localStorage',
  'sessionStorage', 'FormData', 'File', 'Blob', 'getComputedStyle']) {
  if (win[key] !== undefined) globalThis[key] = win[key];
}
Object.defineProperty(globalThis, 'navigator', { value: win.navigator, configurable: true });

const { createApp, h, nextTick } = await import('vue');
const { LessonDocumentView } = await import('./OUT_DIR/entry.js');

const storedFlow = '<p>### Why it matters\nBefore you build a robot. **Robotics** deals with robots.</p>';
const root = document.createElement('div');
document.body.appendChild(root);

const errors = [];
const app = createApp({
  setup() {
    return () => h(LessonDocumentView, {
      document: { version: 1, flow: storedFlow, floats: [] },
      editable: false,
    });
  },
});
app.config.errorHandler = error => errors.push(error && error.message ? error.message : String(error));
app.mount(root);
await nextTick();
await new Promise(resolve => setTimeout(resolve, 120));

const fail = (code, detail) => { console.error(code + ' ' + JSON.stringify(detail)); process.exit(1); };
if (errors.length) fail('MOUNT_ERRORS', errors);

const body = root.querySelector('.lesson-document__canvas') || root;
const text = String(body.textContent || '');
if (/\*\*/.test(text)) fail('ASTERISKS_IN_STUDENT_VIEW', text);
if (/###/.test(text)) fail('HASHES_IN_STUDENT_VIEW', text);
if (!body.querySelector('h1, h2, h3, h4, h5, h6')) fail('NO_HEADING', body.innerHTML.slice(0, 400));
if (!body.querySelector('strong')) fail('NO_BOLD', body.innerHTML.slice(0, 400));

console.log('MOUNT_OK ' + JSON.stringify({ html: body.innerHTML.slice(0, 200) }));
process.exit(0);
`.replace('OUT_DIR', outDirName));

  try {
    execFileSync('npx', ['vite', 'build', '--config', '.markup-mount-vite.config.mjs'], {
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
      assert.fail(`student rendering of generated content failed.\n${failure.stderr || ''}${failure.stdout || ''}`);
    }

    assert.match(output, /MOUNT_OK /, `unexpected output: ${output}`);
  } finally {
    for (const path of [entryFile, configFile, runnerFile]) {
      if (existsSync(path)) unlinkSync(path);
    }
    rmSync(outDir, { recursive: true, force: true });
  }
});
