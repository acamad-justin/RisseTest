/*
 * A gesture must never outlive itself — otherwise the whole editor stops responding.
 *
 * Reported: "I placed 2 pictures, then suddenly I can't click on any buttons… I
 * can't click check to remove the editing overlay for the picture, and I can't
 * click the colour buttons either."
 *
 * The cause is a pointer stream that ends without `pointerup`. A lesson picture
 * is an <img> inside an editable document, so pressing and moving it handed the
 * gesture to the browser's own image drag. That fires `pointercancel` — and only
 * `pointerup` was being listened for. So:
 *
 *   • the window `pointermove` listener stayed attached for the rest of the
 *     session, and kept transforming the picture on every mouse move;
 *   • the picture stayed at `opacity: 0.92` with `is-dragging` (z-index 55), so
 *     it sat in front of the controls and the formatting bar;
 *   • every mousedown landed on a moving element, so no click ever completed.
 *
 * Nothing on the screen responded until the page was reloaded.
 *
 * These lock down:
 *   1. Pictures are not draggable objects — the browser never takes the gesture.
 *   2. A cancelled gesture resets the element, drops the class and detaches the
 *      listeners, so later mouse movement does nothing.
 *   3. A real release still commits the move (the fix must not disable dragging).
 *   4. A second gesture starting mid-gesture leaves nothing behind.
 *   5. Unmounting mid-drag cleans up.
 *   6. The editor still works after a cancel: the control bar's ✓ closes it.
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
const checkpointSource = readFileSync(
  join(frontendDir, 'resources/js/components/CheckpointContentView.vue'),
  'utf8'
);

test('the editor treats every way a pointer stream can end as an end', () => {
  // Both gestures: release, cancel, and losing the window.
  assert.ok(
    (viewSource.match(/addEventListener\('pointercancel', onUp\)/g) || []).length >= 2,
    'drag and resize must both handle pointercancel'
  );
  assert.ok(
    (viewSource.match(/addEventListener\('blur', onUp\)/g) || []).length >= 2,
    'drag and resize must both handle the window losing focus'
  );
  // Only one gesture at a time, and never one left behind on unmount.
  assert.match(viewSource, /function finishActiveGesture\(\)/);
  assert.match(viewSource, /onBeforeUnmount\(\(\) => \{\s*finishActiveGesture\(\);/);
});

test('pictures cannot start the browser\u2019s own drag', () => {
  assert.match(viewSource, /draggable: 'false'/);
  assert.match(viewSource, /@dragstart\.prevent/);
  assert.match(viewSource, /-webkit-user-drag: none/);
});

test('the legacy block gestures end on focus loss and on unmount too', () => {
  assert.match(checkpointSource, /window\.addEventListener\('blur', endBlockDrag\)/);
  assert.match(checkpointSource, /window\.addEventListener\('blur', endBlockResize\)/);
  const unmountStart = checkpointSource.lastIndexOf(
    'onBeforeUnmount(() => {',
    checkpointSource.indexOf("window.removeEventListener('resize', recomputeCanvasHeight)")
  );
  const unmount = checkpointSource.slice(unmountStart, unmountStart + 1200);
  assert.match(unmount, /document\.body\.classList\.remove\('risse-is-dragging'\)/);
  assert.match(unmount, /removeEventListener\('pointermove', onBlockDragMove\)/);
});

test('a cancelled drag leaves nothing running, and the editor still responds', async () => {
  if (!existsSync(join(frontendDir, 'node_modules', 'happy-dom'))) {
    console.log('skipped: happy-dom is not installed in frontend/node_modules');
    return;
  }

  const entryFile = join(frontendDir, '.gesture-mount-entry.js');
  const configFile = join(frontendDir, '.gesture-mount-vite.config.mjs');
  const runnerFile = join(frontendDir, '.gesture-mount-run.mjs');
  const outDirName = '.gesture-mount-dist';
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
    "    lib: { entry: resolve(process.cwd(), '.gesture-mount-entry.js'), formats: ['es'], fileName: 'entry' },",
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

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8AAAwAB/AL+2wAAAABJRU5ErkJggg==';
const doc = {
  version: 1,
  flow: '<p>Intro paragraph</p>',
  floats: [
    { id: 'img1', kind: 'image', src: PNG, alt: 'one', wrap: 'square', side: 'left', overlap: false, width: 360, anchor: 1 },
    { id: 'img2', kind: 'image', src: PNG, alt: 'two', wrap: 'square', side: 'right', overlap: false, width: 360, anchor: 1 },
  ],
};

const root = document.createElement('div');
document.body.appendChild(root);
const emitted = [];
const errors = [];
const app = createApp({
  setup() {
    return () => h(LessonDocumentView, {
      document: doc,
      editable: true,
      courseId: 'course-1',
      'onUpdate:document': d => emitted.push(d),
      'onUpdate-float': f => emitted.push({ float: f }),
    });
  },
});
app.config.errorHandler = e => errors.push(e && e.message ? e.message : String(e));
app.mount(root);
await nextTick();
await new Promise(r => setTimeout(r, 120));

const fail = (code, detail) => { console.error(code + ' ' + JSON.stringify(detail)); process.exit(1); };
if (errors.length) fail('MOUNT_ERRORS', errors);

const canvas = root.querySelector('.lesson-document__canvas');
if (!canvas) fail('MOUNT_NO_CANVAS', root.innerHTML.slice(0, 300));
const floatEl = canvas.querySelector('[data-float-id="img1"]');
if (!floatEl) fail('MOUNT_NO_IMAGE', canvas.innerHTML.slice(0, 400));

const ev = (type, x, y) => {
  const e = new win.MouseEvent(type, { bubbles: true });
  Object.assign(e, { button: 0, clientX: x, clientY: y, pointerId: 1 });
  return e;
};

// 1. A picture is not a draggable object.
const img = floatEl.querySelector('img');
if (!img) fail('NO_IMG', floatEl.innerHTML.slice(0, 200));
if (img.getAttribute('draggable') !== 'false') fail('IMG_DRAGGABLE', img.getAttribute('draggable'));

// 2. Press, move, then let the browser cancel the stream (what a native image
//    drag does), and keep moving the mouse afterwards.
floatEl.dispatchEvent(ev('pointerdown', 100, 100));
window.dispatchEvent(ev('pointermove', 200, 140));
window.dispatchEvent(ev('pointercancel', 200, 140));
await nextTick();
window.dispatchEvent(ev('pointermove', 500, 400));
await nextTick();
await new Promise(r => setTimeout(r, 60));

if (floatEl.style.transform) fail('CANCEL_LEFT_TRANSFORM', floatEl.style.transform);
if (floatEl.style.opacity) fail('CANCEL_LEFT_OPACITY', floatEl.style.opacity);
if (floatEl.className.includes('is-dragging')) fail('CANCEL_LEFT_DRAGGING_CLASS', floatEl.className);
if (emitted.some(entry => entry && entry.float)) fail('CANCEL_COMMITTED_A_MOVE', emitted);

// 3. The editor still responds: selecting shows the bar, and ✓ closes it.
floatEl.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
await nextTick();
await new Promise(r => setTimeout(r, 60));
const controls = canvas.querySelector('.float-controls');
if (!controls) fail('BAR_DID_NOT_OPEN_AFTER_CANCEL', canvas.innerHTML.slice(0, 300));
const done = Array.from(controls.querySelectorAll('button'))
  .find(button => (button.getAttribute('title') || '') === 'Done');
if (!done) fail('NO_DONE_BUTTON', controls.innerHTML.slice(0, 300));
done.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
await nextTick();
await new Promise(r => setTimeout(r, 60));
if (canvas.querySelector('.float-controls')) fail('DONE_BUTTON_DEAD_AFTER_CANCEL', 'bar still open');

// 4. A real release must still commit: drag the second picture and let go.
const float2 = canvas.querySelector('[data-float-id="img2"]');
float2.dispatchEvent(ev('pointerdown', 300, 300));
window.dispatchEvent(ev('pointermove', 340, 330));
window.dispatchEvent(ev('pointerup', 340, 330));
await nextTick();
await new Promise(r => setTimeout(r, 60));
if (float2.style.transform) fail('RELEASE_LEFT_TRANSFORM', float2.style.transform);
if (float2.className.includes('is-dragging')) fail('RELEASE_LEFT_DRAGGING_CLASS', float2.className);
const committed = emitted.filter(entry => entry && entry.float && entry.float.id === 'img2');
if (!committed.length) fail('REAL_DRAG_NOT_COMMITTED', emitted.length);

// 5. A drag interrupted by the window losing focus ends there.
float2.dispatchEvent(ev('pointerdown', 300, 300));
window.dispatchEvent(ev('pointermove', 380, 360));
window.dispatchEvent(new win.Event('blur'));
await nextTick();
window.dispatchEvent(ev('pointermove', 900, 900));
await nextTick();
if (float2.style.transform) fail('BLUR_LEFT_TRANSFORM', float2.style.transform);
if (float2.className.includes('is-dragging')) fail('BLUR_LEFT_DRAGGING_CLASS', float2.className);

console.log('MOUNT_OK ' + JSON.stringify({ committed: committed.length, errors }));
process.exit(0);
`.replace('OUT_DIR', outDirName));

  try {
    execFileSync('npx', ['vite', 'build', '--config', '.gesture-mount-vite.config.mjs'], {
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
      assert.fail(`drag gestures left the editor stuck.\n${failure.stderr || ''}${failure.stdout || ''}`);
    }

    assert.match(output, /MOUNT_OK /, `unexpected output: ${output}`);
  } finally {
    for (const path of [entryFile, configFile, runnerFile]) {
      if (existsSync(path)) unlinkSync(path);
    }
    rmSync(outDir, { recursive: true, force: true });
  }
});
