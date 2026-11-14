/*
 * Module Studio mount smoke test.
 *
 * A single mis-ordered statement in a `<script setup>` takes the entire screen
 * down: `watch(thing, …)` reads its source immediately, so declaring it above
 * `const thing = ref()` throws "Cannot access 'thing' before initialization"
 * during setup and Vue renders nothing at all. That is invisible to a build, to
 * a type check and to every unit test of the helpers — the only symptom is a
 * blank page in the browser.
 *
 * So this mounts the real Module Studio component in a DOM and asserts it
 * produces markup. It is deliberately blunt: if setup throws for any reason at
 * all, the Studio is not usable, and this test should fail.
 *
 * The mount runs in a child process. The Studio's data layer leaves real timers
 * running (auth refresh, store polling), so mounting in-process would keep the
 * test runner alive after the result; the child exits as soon as it has an
 * answer.
 *
 * Run from the frontend directory, like the other suites:
 *   cd frontend && npx tsx ../tests/module-studio-mount.test.ts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const frontendDir = new URL('../frontend', import.meta.url).pathname;
const entryFile = join(frontendDir, '.studio-mount-entry.js');
const configFile = join(frontendDir, '.studio-mount-vite.config.mjs');
const runnerFile = join(frontendDir, '.studio-mount-run.mjs');
const outDirName = '.studio-mount-dist';
const outDir = join(frontendDir, outDirName);

const ENTRY = [
  "export { default as CurriculumDesigner } from './resources/js/views/mentor/curriculum/CurriculumDesigner.vue';",
  '',
].join('\n');

const CONFIG = [
  "import { defineConfig } from 'vite';",
  "import vue from '@vitejs/plugin-vue';",
  "import { resolve } from 'node:path';",
  'export default defineConfig({',
  '  plugins: [vue()],',
  '  logLevel: "silent",',
  '  build: {',
  `    lib: { entry: resolve(process.cwd(), '.studio-mount-entry.js'), formats: ['es'], fileName: 'entry' },`,
  `    outDir: '${outDirName}',`,
  '    cssCodeSplit: false,',
  '    minify: false,',
  "    rollupOptions: { external: ['vue'], preserveEntrySignatures: 'strict' },",
  '  },',
  '});',
  '',
].join('\n');

const RUNNER = String.raw`
import { Window } from 'happy-dom';

const win = new Window({ url: 'https://localhost/mentor' });
for (const key of ['window', 'document', 'DOMParser', 'Node', 'HTMLElement', 'Element', 'SVGElement',
  'MouseEvent', 'Event', 'CustomEvent', 'MutationObserver', 'customElements', 'localStorage',
  'sessionStorage', 'FormData', 'File', 'Blob']) {
  if (win[key] !== undefined) globalThis[key] = win[key];
}
Object.defineProperty(globalThis, 'navigator', { value: win.navigator, configurable: true });
globalThis.getComputedStyle = win.getComputedStyle.bind(win);

// Imported AFTER the globals exist: Vue's DOM runtime binds to the document when
// its module is evaluated, so importing it any earlier gives it a null document.
const { createApp, h, nextTick } = await import('vue');
const { CurriculumDesigner } = await import('./OUT_DIR/entry.js');

const root = document.createElement('div');
document.body.appendChild(root);

const errors = [];
const app = createApp({ setup() { return () => h(CurriculumDesigner, {}); } });
app.config.errorHandler = error => errors.push(error && error.message ? error.message : String(error));
app.config.warnHandler = () => {};

try {
  app.mount(root);
  await nextTick();
  await new Promise(resolve => setTimeout(resolve, 150));
} catch (error) {
  errors.push(error && error.message ? error.message : String(error));
}

const html = root.innerHTML.trim();
if (errors.length) {
  console.error('MOUNT_ERRORS ' + JSON.stringify(errors));
  process.exit(1);
}
if (html.length <= 200) {
  console.error('MOUNT_EMPTY ' + html.length);
  process.exit(1);
}
if (/before initialization/.test(html)) {
  console.error('MOUNT_TDZ');
  process.exit(1);
}
console.log('MOUNT_OK ' + html.length);
process.exit(0);
`.replace('OUT_DIR', outDirName);

test('the Module Studio mounts and renders instead of going blank', () => {
  if (!existsSync(join(frontendDir, 'node_modules', 'happy-dom'))) {
    // Not a product failure — the harness is simply unavailable.
    console.log('skipped: happy-dom is not installed in frontend/node_modules');
    return;
  }

  writeFileSync(entryFile, ENTRY);
  writeFileSync(configFile, CONFIG);
  writeFileSync(runnerFile, RUNNER);

  try {
    execFileSync('npx', ['vite', 'build', '--config', '.studio-mount-vite.config.mjs'], {
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
        `Module Studio failed to mount — the screen would be blank in the browser.\n`
        + `${failure.stderr || ''}${failure.stdout || ''}`,
      );
    }

    assert.match(output, /MOUNT_OK (\d+)/, `expected a rendered surface, got: ${output}`);
    const rendered = Number(output.match(/MOUNT_OK (\d+)/)![1]);
    assert.ok(rendered > 200, `Module Studio rendered only ${rendered} characters`);
  } finally {
    for (const path of [entryFile, configFile, runnerFile]) {
      if (existsSync(path)) unlinkSync(path);
    }
    rmSync(outDir, { recursive: true, force: true });
  }
});
