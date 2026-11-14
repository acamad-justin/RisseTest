/*
 * Preview toolbar placement — where the mentor's "Exit Preview / Edit" controls sit.
 *
 * After two rounds of measured overlays, the placement is structural: the controls
 * render INSIDE the lesson header's action row, immediately before the student's
 * "Complete Checkpoint" action. The row centres them against that button by
 * layout, so alignment cannot drift with the title length, the window width, or
 * the order in which the lesson's data arrives.
 *
 * The contract these lock down:
 *   1. The lesson header offers a slot on its action line, before the checkpoint
 *      action, and forwards it through ModuleExperience.
 *   2. The preview passes the toolbar into that slot, and uses the same component
 *      in the corner when the module roadmap is showing (no header to sit in).
 *   3. The toolbar keeps the Studio's control ids and emits exit / toggle-edit.
 *   4. Students see nothing new: the slot is empty in the student app.
 *   5. No measurement machinery survives — the alignment is the row's job.
 *   6. At runtime the controls really do render on that line, in order, beside the
 *      checkpoint button.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const frontendDir = new URL('../frontend', import.meta.url).pathname;
const read = path => readFileSync(join(frontendDir, path), 'utf8');

test('the lesson header offers a slot on its action line, before the checkpoint action', () => {
  const source = read('resources/js/components/CheckpointContentView.vue');

  const slotAt = source.indexOf('<slot name="prepend-actions" />');
  assert.ok(slotAt > 0, 'the header must offer a prepend-actions slot');

  const actionsAt = source.indexOf('<div class="checkpoint-header-actions">');
  const checkpointAt = source.indexOf('id="btn-complete-checkpoint"', actionsAt);

  assert.ok(actionsAt > 0, 'the action row must exist');
  assert.ok(slotAt > actionsAt, 'the slot belongs inside the action row');
  assert.ok(slotAt < checkpointAt, 'the slot comes before "Complete Checkpoint"');

  // The row is what aligns the two controls.
  const rowRule = source.slice(source.indexOf('.checkpoint-header-actions {'));
  assert.match(rowRule.slice(0, 200), /align-items: center/);
});

test('ModuleExperience forwards that slot from its owner', () => {
  const source = read('resources/js/components/ModuleExperience.vue');
  assert.match(source, /<template #prepend-actions>/);
  assert.match(source, /<slot name="prepend-actions" \/>/);
});

test('the preview puts the toolbar on the action line, and in the corner only off-lesson', () => {
  const source = read('resources/js/views/mentor/curriculum/CurriculumDesigner.vue');

  assert.match(source, /import PreviewToolbar from '\.\.\/\.\.\/\.\.\/components\/mentor\/PreviewToolbar\.vue';/);
  assert.match(source, /<template #prepend-actions>/);
  assert.match(source, /<PreviewToolbar\s+:editing="editingEnabled"\s+@exit="closeStudentPreview"\s+@toggle-edit="toggleEditingMode"\s+\/>/);

  // The roadmap has no lesson header; the same component is used again there.
  assert.match(source, /v-if="previewView !== 'lesson'"/);
  assert.match(source, /class="preview-toolbar-corner"/);
  assert.match(source, /@view-change="previewView = \$event"/);
  assert.match(source, /\.preview-toolbar-corner \{/);

  // One definition, two positions: exactly two usages, no duplicated markup.
  assert.equal((source.match(/<PreviewToolbar/g) || []).length, 2);
  assert.doesNotMatch(source, /id="btn-close-student-experience"/);
  assert.doesNotMatch(source, /id="btn-toggle-editing-mode"/);
});

test('the toolbar keeps its control ids and its two actions', () => {
  const source = read('resources/js/components/mentor/PreviewToolbar.vue');
  assert.match(source, /id="btn-close-student-experience"/);
  assert.match(source, /id="btn-toggle-editing-mode"/);
  assert.match(source, /defineEmits\(\['exit', 'toggle-edit'\]\)/);
  assert.match(source, /\$emit\('exit'\)/);
  assert.match(source, /\$emit\('toggle-edit'\)/);
  // The pressed state is exposed to assistive tech, not just colour.
  assert.match(source, /:aria-pressed="editing"/);
});

test('nothing is added to the student view', () => {
  // The slot is only filled by the mentor's preview: the student app renders
  // ModuleExperience with no slot content, so the row is unchanged for students.
  const app = read('resources/js/App.vue');
  assert.match(app, /<ModuleExperience/);
  assert.doesNotMatch(app, /#prepend-actions/);
});

test('the measured-overlay machinery is gone', () => {
  const designer = read('resources/js/views/mentor/curriculum/CurriculumDesigner.vue');
  assert.doesNotMatch(designer, /previewToolsDocked/);
  assert.doesNotMatch(designer, /measurePreviewTools/);
  assert.doesNotMatch(designer, /data-placement/);
  assert.doesNotMatch(designer, /previewToolbarPlacement/);
  assert.doesNotMatch(designer, /float-cluster--beside-checkpoint/);
  assert.equal(existsSync(join(frontendDir, 'lib/mentor/previewToolbarPlacement.ts')), false);
});

test('at runtime the controls render on the checkpoint action line, in order', async () => {
  if (!existsSync(join(frontendDir, 'node_modules', 'happy-dom'))) {
    console.log('skipped: happy-dom is not installed in frontend/node_modules');
    return;
  }

  const entryFile = join(frontendDir, '.toolbar-mount-entry.js');
  const configFile = join(frontendDir, '.toolbar-mount-vite.config.mjs');
  const runnerFile = join(frontendDir, '.toolbar-mount-run.mjs');
  const outDirName = '.toolbar-mount-dist';
  const outDir = join(frontendDir, outDirName);

  writeFileSync(entryFile, [
    "export { default as ModuleExperience } from './resources/js/components/ModuleExperience.vue';",
    "export { default as PreviewToolbar } from './resources/js/components/mentor/PreviewToolbar.vue';",
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
    "    lib: { entry: resolve(process.cwd(), '.toolbar-mount-entry.js'), formats: ['es'], fileName: 'entry' },",
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
const { ModuleExperience, PreviewToolbar } = await import('./OUT_DIR/entry.js');

const root = document.createElement('div');
document.body.appendChild(root);

const errors = [];
const app = createApp({
  setup() {
    return () => h(ModuleExperience, {
      moduleData: {
        title: 'Robotics Foundations',
        checkpoints: [{ id: 'c1', title: 'What is Robotics?', hasContent: true }],
        currentStep: 0,
        totalSteps: 1,
      },
      initialView: 'lesson',
      initialCheckpoint: { id: 'c1', title: 'What is Robotics?' },
      readOnly: true,
      editable: false,
      'onView-change': () => {},
    }, {
      'prepend-actions': () => h(PreviewToolbar, { editing: false }),
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

const row = root.querySelector('.checkpoint-header-actions');
if (errors.length) {
  console.error('MOUNT_ERRORS ' + JSON.stringify(errors));
  process.exit(1);
}
if (!row) {
  console.error('MOUNT_NO_HEADER ' + root.innerHTML.slice(0, 400));
  process.exit(1);
}

const ids = Array.from(row.children).map(child => child.id || child.getAttribute('data-testid') || child.className);
const toolbar = row.querySelector('.preview-toolbar');
const checkpoint = row.querySelector('#btn-complete-checkpoint');

if (!toolbar) {
  console.error('MOUNT_NO_TOOLBAR ' + JSON.stringify(ids));
  process.exit(1);
}
if (!checkpoint) {
  console.error('MOUNT_NO_CHECKPOINT ' + JSON.stringify(ids));
  process.exit(1);
}
if (row.firstElementChild !== toolbar) {
  console.error('MOUNT_ORDER ' + JSON.stringify(ids));
  process.exit(1);
}
if (toolbar.parentElement !== checkpoint.parentElement) {
  console.error('MOUNT_NOT_SIBLINGS');
  process.exit(1);
}
// The toolbar precedes the checkpoint action in document order.
if (!(toolbar.compareDocumentPosition(checkpoint) & 4)) {
  console.error('MOUNT_DOCUMENT_ORDER');
  process.exit(1);
}

console.log('MOUNT_OK ' + JSON.stringify({
  children: ids.length,
  exit: Boolean(toolbar.querySelector('#btn-close-student-experience')),
  edit: Boolean(toolbar.querySelector('#btn-toggle-editing-mode')),
}));
process.exit(0);
`.replace('OUT_DIR', outDirName));

  try {
    execFileSync('npx', ['vite', 'build', '--config', '.toolbar-mount-vite.config.mjs'], {
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
      assert.fail(
        'the preview toolbar did not render on the checkpoint action line.\n'
        + `${failure.stderr || ''}${failure.stdout || ''}`,
      );
    }

    assert.match(output, /MOUNT_OK /, `unexpected output: ${output}`);
    const report = JSON.parse(output.slice(output.indexOf('MOUNT_OK ') + 'MOUNT_OK '.length));
    assert.equal(report.exit, true, 'the exit control must be present');
    assert.equal(report.edit, true, 'the edit control must be present');
  } finally {
    for (const path of [entryFile, configFile, runnerFile]) {
      if (existsSync(path)) unlinkSync(path);
    }
    rmSync(outDir, { recursive: true, force: true });
  }
});
