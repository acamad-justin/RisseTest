/*
 * Preview toolbar placement — where the mentor's "Exit Preview / Edit" cluster
 * floats while previewing a lesson.
 *
 * The contract these lock down:
 *   1. The toolbar docks immediately LEFT of the lesson's "Complete Checkpoint"
 *      action, vertically centred on it, so a mentor sees both controls at once.
 *   2. It docks whenever the space is visually free — measured against the
 *      header's INK, not its box. A block-level heading's box can stretch almost
 *      to the action while the text ends far to the left; judging by the box
 *      refuses exactly the header the toolbar is meant for.
 *   3. It never covers the header text, and never docks for a header that has
 *      scrolled out of view or a placement outside the workspace.
 *   4. Declining is always the safe answer: the caller keeps the toolbar in the
 *      right-hand chrome column.
 *   5. The component is wired to that decision, re-measures when the lesson
 *      header appears, and keeps everything out of the lesson's flow.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const {
  PREVIEW_TOOLBAR_GAP,
  PREVIEW_TOOLBAR_TITLE_CLEARANCE,
  resolvePreviewToolbarPlacement,
} = await import('../frontend/lib/mentor/previewToolbarPlacement.ts');

const TOOLBAR = { width: 196, height: 34 };

// The user's actual case: a roomy desktop header. The title's BOX runs to x=888
// (a block heading inside a flex item), but the glyphs end at x=480. The
// checkpoint action starts at x=900.
const roomy = () => ({
  toolbar: { ...TOOLBAR },
  action: { top: 120, bottom: 152, left: 900, right: 1080 },
  title: { top: 96, bottom: 150, left: 120, right: 480 },
  host: { top: 0, bottom: 640, left: 0, right: 1200 },
});

test('the toolbar docks immediately left of the checkpoint action', () => {
  const placement = resolvePreviewToolbarPlacement(roomy());
  assert.equal(placement.docked, true);
  assert.equal(placement.left, 900 - 196 - PREVIEW_TOOLBAR_GAP);
});

test('the toolbar is vertically centred on the checkpoint action', () => {
  const placement = resolvePreviewToolbarPlacement(roomy());
  assert.equal(placement.docked, true);
  const centre = 120 + (152 - 120) / 2;
  assert.equal(placement.top + TOOLBAR.height / 2, centre);
});

test('the same header docks on its ink but not on its box — the reported bug', () => {
  // The mentor's lesson title is a block heading inside a flex item: its BOX ends
  // 12px from the checkpoint action, while the glyphs end at x=480. Judging by the
  // box refused to dock in a header that was visually wide open, so the toolbar
  // sat in the corner instead of beside the button.
  const box = { top: 96, bottom: 150, left: 120, right: 888 };
  const ink = { top: 96, bottom: 150, left: 120, right: 480 };

  assert.equal(resolvePreviewToolbarPlacement({ ...roomy(), title: box }).docked, false);
  assert.equal(resolvePreviewToolbarPlacement({ ...roomy(), title: ink }).docked, true);
});

test('a title whose text reaches the action refuses the dock', () => {
  const longTitle = roomy();
  longTitle.title = { top: 96, bottom: 150, left: 120, right: 820 };
  const placement = resolvePreviewToolbarPlacement(longTitle);
  assert.equal(placement.docked, false);
  assert.equal(placement.reason, 'would-cover-title');
});

test('the clearance margin is respected on both sides of the boundary', () => {
  const dockLeft = 900 - 196 - PREVIEW_TOOLBAR_GAP;

  const justClear = roomy();
  justClear.title = {
    top: 96, bottom: 150, left: 120,
    right: dockLeft - PREVIEW_TOOLBAR_TITLE_CLEARANCE - 1,
  };
  assert.equal(resolvePreviewToolbarPlacement(justClear).docked, true);

  const justTouching = roomy();
  justTouching.title = {
    top: 96, bottom: 150, left: 120,
    right: dockLeft - PREVIEW_TOOLBAR_TITLE_CLEARANCE,
  };
  // Touching the padded edge is still clear; one pixel further is not.
  assert.equal(resolvePreviewToolbarPlacement(justTouching).docked, true);

  const oneInside = roomy();
  oneInside.title = {
    top: 96, bottom: 150, left: 120,
    right: dockLeft - PREVIEW_TOOLBAR_TITLE_CLEARANCE + 1,
  };
  assert.equal(resolvePreviewToolbarPlacement(oneInside).docked, false);
});

test('a header that has scrolled out of view does not keep the toolbar pinned', () => {
  const scrolledPast = roomy();
  scrolledPast.action = { top: -40, bottom: -8, left: 900, right: 1080 };
  assert.equal(resolvePreviewToolbarPlacement(scrolledPast).docked, false);

  const scrolledBelow = roomy();
  scrolledBelow.action = { top: 700, bottom: 732, left: 900, right: 1080 };
  assert.equal(resolvePreviewToolbarPlacement(scrolledBelow).docked, false);
});

test('a partially visible header still docks', () => {
  const partly = roomy();
  partly.host.top = 130; // action straddles the top edge of the viewport band
  assert.equal(resolvePreviewToolbarPlacement(partly).docked, true);
});

test('unmeasured inputs decline rather than guess', () => {
  assert.equal(
    resolvePreviewToolbarPlacement({ ...roomy(), toolbar: { width: 0, height: 34 } }).docked,
    false,
  );
  assert.equal(
    resolvePreviewToolbarPlacement({ ...roomy(), toolbar: { width: 196, height: 0 } }).docked,
    false,
  );
  assert.equal(resolvePreviewToolbarPlacement({ ...roomy(), toolbar: null }).docked, false);
  assert.equal(resolvePreviewToolbarPlacement({ ...roomy(), action: null }).docked, false);
  assert.equal(resolvePreviewToolbarPlacement({ ...roomy(), host: null }).docked, false);

  const noHeight = roomy();
  noHeight.action = { top: 120, bottom: 120, left: 900, right: 1080 };
  assert.equal(resolvePreviewToolbarPlacement(noHeight).docked, false);
});

test('a placement that would leave the workspace declines', () => {
  const offLeft = roomy();
  offLeft.action = { top: 120, bottom: 152, left: 120, right: 300 };
  offLeft.title = { top: 96, bottom: 150, left: 20, right: 40 };
  // 120 - 196 - 10 < 0 → cannot fit, so stay in the chrome column.
  const placement = resolvePreviewToolbarPlacement(offLeft);
  assert.equal(placement.docked, false);
  assert.equal(placement.reason, 'off-workspace');
});

test('a missing title measurement does not block docking', () => {
  const noTitle = roomy();
  noTitle.title = null;
  assert.equal(resolvePreviewToolbarPlacement(noTitle).docked, true);
});

test('the preview host is wired to the placement decision', () => {
  const source = readFileSync(
    new URL('../frontend/resources/js/views/mentor/curriculum/CurriculumDesigner.vue', import.meta.url),
    'utf8',
  );

  // The cluster carries both the fallback and the docked placements, driven by
  // the decision, with fixed-position coordinates supplied inline.
  assert.match(source, /ref="previewToolsRef"/);
  assert.match(source, /previewToolsDocked \? 'float-cluster--beside-checkpoint' : 'float-cluster--top-right'/);
  assert.match(source, /:style="previewToolsStyle"/);
  // The decision is inspectable in the browser: the cluster says why it is where
  // it is, so "why is it still in the corner?" is answerable from DevTools.
  assert.match(source, /:data-placement=/);
  assert.match(source, /\.float-cluster--beside-checkpoint \{/);

  // Anchored to the real student action, and measured from the rendered DOM.
  assert.match(source, /querySelector\('#btn-complete-checkpoint'\)/);
  assert.match(source, /resolvePreviewToolbarPlacement\(/);

  // Measured against the header's INK, not the heading's box. The measurement
  // itself lives in the tested module (see the DOM check below).
  assert.match(source, /headerInkRect,/);
  assert.match(source, /title: headerInkRect\(host\)/);

  // Converges when the lesson header appears: DOM mutations inside the preview
  // host re-measure, alongside the surface's own resize and scroll.
  assert.match(source, /new MutationObserver\(\(\) => schedulePreviewToolMeasure\(\)\)/);
  assert.match(source, /characterData: true/);
  assert.match(source, /new window\.ResizeObserver\(\(\) => schedulePreviewToolMeasure\(\)\)/);
  assert.match(source, /addEventListener\('scroll', schedulePreviewToolMeasure/);
  assert.match(source, /addEventListener\('resize', schedulePreviewToolMeasure\)/);

  // Both observers are torn down with the preview.
  assert.match(source, /previewToolsMutationObserver\.disconnect\(\)/);
  assert.match(source, /previewToolsObserver\.disconnect\(\)/);

  // Attributes are deliberately NOT observed: the toolbar's own class/style
  // updates would otherwise feed a measure loop back into itself.
  assert.doesNotMatch(source, /attributes: true/);

  // No timers: placement is layout-driven, never a settle-after-a-while guess.
  assert.doesNotMatch(source, /setTimeout\([^)]*measurePreviewTools/);
});

test('against real DOM nodes: the header is measured by its ink', async () => {
  let Window;
  try {
    ({ Window } = await import(
      new URL('../frontend/node_modules/happy-dom/lib/index.js', import.meta.url).href
    ));
  } catch {
    console.log('skipped: happy-dom is not installed in frontend/node_modules');
    return;
  }

  const { headerInkRect } = await import('../frontend/lib/mentor/previewToolbarPlacement.ts');

  const win = new Window({ url: 'https://localhost/mentor' });
  const doc = win.document;

  // The real header shape: a flex row, a title block whose box is stretched by a
  // block-level heading, and the checkpoint action on the right.
  doc.body.innerHTML = `
    <div class="student-experience-host">
      <header class="checkpoint-header">
        <div class="checkpoint-header-left">
          <span class="sub-category-tag">Module</span>
          <h1 class="checkpoint-title">What is Robotics?</h1>
        </div>
        <div class="checkpoint-header-actions">
          <button id="btn-complete-checkpoint">Complete Checkpoint</button>
        </div>
      </header>
    </div>`;

  const host = doc.querySelector('.student-experience-host');
  const titleBlock = doc.querySelector('.checkpoint-header-left');
  const action = doc.querySelector('#btn-complete-checkpoint');

  // happy-dom has no layout engine, so geometry is supplied the way a browser
  // would report it: the heading's box stretches to x=888, the glyphs end at 480.
  const BOX = { top: 96, bottom: 150, left: 120, right: 888, width: 768, height: 54 };
  const INK = { top: 96, bottom: 150, left: 120, right: 480, width: 360, height: 54 };
  titleBlock.getBoundingClientRect = () => BOX;

  const original = doc.createRange.bind(doc);
  doc.createRange = () => {
    const range = original();
    range.selectNodeContents = () => {};
    range.getBoundingClientRect = () => INK;
    return range;
  };

  const ink = headerInkRect(host);
  assert.equal(ink.right, 480, 'the ink rect must win over the heading box');

  const placement = resolvePreviewToolbarPlacement({
    toolbar: TOOLBAR,
    action: { top: 120, bottom: 152, left: 900, right: 1080 },
    title: ink,
    host: { top: 0, bottom: 640, left: 0, right: 1200 },
  });
  assert.equal(placement.docked, true);
  assert.equal(placement.left, 900 - TOOLBAR.width - PREVIEW_TOOLBAR_GAP);

  // And the action really is inside the host it is measured from.
  assert.equal(host.querySelector('#btn-complete-checkpoint'), action);
  assert.ok(action);

  // Without a Range (an engine that cannot measure ink) it degrades to the box,
  // which is conservative: it may refuse to dock, but it can never cover text.
  doc.createRange = undefined;
  assert.equal(headerInkRect(host).right, 888);
});
