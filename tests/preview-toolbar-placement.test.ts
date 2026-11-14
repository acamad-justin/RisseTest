/*
 * Preview toolbar placement — where the mentor's "Exit Preview / Edit" cluster
 * floats while previewing a lesson.
 *
 * The contract these lock down:
 *   1. The toolbar docks immediately LEFT of the lesson's "Complete Checkpoint"
 *      action, vertically centred on it, so a mentor sees both controls at once.
 *   2. It only docks when that space is genuinely free — an overlay may never
 *      cover the lesson title.
 *   3. It only docks while the action row is on screen — a toolbar pinned to a
 *      scrolled-away header would hover over lesson content at a stale position.
 *   4. Otherwise it declines to dock, and the component keeps the toolbar in the
 *      right-hand chrome column. Declining is always the safe answer.
 *   5. The component is wired to that decision, and the docked placement is a
 *      position only: the cluster stays out of the lesson's flow.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const {
  PREVIEW_TOOLBAR_GAP,
  PREVIEW_TOOLBAR_TITLE_CLEARANCE,
  resolvePreviewToolbarPlacement,
} = await import('../frontend/lib/mentor/previewToolbarPlacement.ts');

// A roomy desktop header: title ends at x=480, the checkpoint action starts at
// x=900, and the lesson column is 640 tall.
const roomy = () => ({
  toolbarWidth: 196,
  action: { top: 120, bottom: 152, left: 900, right: 1080 },
  title: { top: 96, bottom: 150, left: 120, right: 480 },
  host: { top: 0, bottom: 640, left: 0, right: 1200 },
});

test('the toolbar docks immediately left of the checkpoint action', () => {
  const placement = resolvePreviewToolbarPlacement(roomy());
  assert.equal(placement.docked, true);
  assert.equal(placement.left, 900 - 196 - PREVIEW_TOOLBAR_GAP);
  // Vertically centred on the action, not on the title.
  assert.equal(placement.top, 120 + (152 - 120) / 2);
});

test('a clear gap is kept, so the two clusters never touch', () => {
  const placement = resolvePreviewToolbarPlacement(roomy());
  assert.equal(placement.left + 196 + PREVIEW_TOOLBAR_GAP, 900);
});

test('a long lesson title refuses the dock instead of being covered', () => {
  const tight = roomy();
  tight.title.right = 760; // title runs up to 760, action at 900
  const placement = resolvePreviewToolbarPlacement(tight);
  assert.equal(placement.docked, false);
});

test('the clearance threshold is inclusive of the safety margin', () => {
  const exact = roomy();
  exact.title.right = 900 - (196 + PREVIEW_TOOLBAR_TITLE_CLEARANCE); // exactly enough
  assert.equal(resolvePreviewToolbarPlacement(exact).docked, true);

  const oneShort = roomy();
  oneShort.title.right = exact.title.right + 1;
  assert.equal(resolvePreviewToolbarPlacement(oneShort).docked, false);
});

test('a header scrolled out of view does not keep the toolbar pinned', () => {
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

test('an unmeasured toolbar or missing anchors decline to dock', () => {
  const unmeasured = roomy();
  unmeasured.toolbarWidth = 0;
  assert.equal(resolvePreviewToolbarPlacement(unmeasured).docked, false);

  assert.equal(resolvePreviewToolbarPlacement({ ...roomy(), action: null }).docked, false);
  assert.equal(resolvePreviewToolbarPlacement({ ...roomy(), title: undefined }).docked, false);
  assert.equal(resolvePreviewToolbarPlacement({ ...roomy(), host: null }).docked, false);

  const noHeight = roomy();
  noHeight.action = { top: 120, bottom: 120, left: 900, right: 1080 };
  assert.equal(resolvePreviewToolbarPlacement(noHeight).docked, false);
});

test('a placement that would leave the workspace declines to dock', () => {
  const offLeft = roomy();
  offLeft.action = { top: 120, bottom: 152, left: 120, right: 300 };
  offLeft.title = { top: 96, bottom: 150, left: 20, right: 40 };
  // 120 - 196 - 10 < 0 → cannot fit, so stay in the chrome column.
  assert.equal(resolvePreviewToolbarPlacement(offLeft).docked, false);
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
  assert.match(source, /\.float-cluster--beside-checkpoint \{/);

  // Anchored to the real student action, and measured from the rendered DOM.
  assert.match(source, /querySelector\('#btn-complete-checkpoint'\)/);
  assert.match(source, /querySelector\('\.checkpoint-header-left'\)/);
  assert.match(source, /resolvePreviewToolbarPlacement\(/);

  // Tracking follows the layout rather than a timer: scroll, resize and the
  // surface's own size changes all re-measure, and it is torn down on close.
  assert.match(source, /previewHostRef\.value\.addEventListener\('scroll', schedulePreviewToolMeasure/);
  assert.match(source, /window\.addEventListener\('resize', schedulePreviewToolMeasure\)/);
  assert.match(source, /new window\.ResizeObserver\(\(\) => schedulePreviewToolMeasure\(\)\)/);
  assert.match(source, /stopPreviewToolTracking\(\);\n  window\.removeEventListener\('keydown', handleKeydown\)/);

  // No timers: placement is layout-driven, never a settle-after-a-while guess.
  assert.doesNotMatch(source, /setTimeout\([^)]*measurePreviewTools/);
});
