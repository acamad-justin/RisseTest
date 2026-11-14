/*
 * Lesson block layout — teacher and student must resolve the same geometry.
 *
 * The bug these lock down: block sizes/positions were applied only inside the
 * teacher's editing session (`editable && previewMode`). Editing a lesson
 * therefore re-laid-out the page while students read it at full width, so the
 * teacher could not see what students saw.
 *
 * Layout records are now versioned instead of migrated: anything written before
 * LAYOUT_VERSION is ignored (natural width), and any deliberate resize/move
 * stamps the record and applies to BOTH views.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LAYOUT_VERSION,
  isCurrentLayoutRecord,
  readBlockLayout,
  isBlockPinned,
  readBlockPosition,
  blockLayoutStyle,
  blockPositionStyle,
  hasCustomLayout,
  applyBlockLayout,
  applyBlockPosition,
  clearBlockLayout,
} from '../frontend/lib/mentor/lessonBlockLayout.ts';

const block = (layout: any) => ({ id: 'b1', type: 'text', content: '<p>Prose</p>', metadata: { layout } });

test('legacy sizes are ignored rather than shrunk into the lesson', () => {
  const legacy = block({ width: 820, height: 300 });
  assert.equal(isCurrentLayoutRecord(legacy.metadata.layout), false);
  assert.deepEqual(readBlockLayout(legacy), {});
  assert.deepEqual(blockLayoutStyle(legacy), {}, 'legacy width must not render');
  assert.equal(hasCustomLayout(legacy), false);
});

test('legacy positions are not pinned', () => {
  const legacy = block({ x: 10, y: 40, order: 1 });
  assert.equal(isBlockPinned(legacy), false);
  assert.equal(readBlockPosition(legacy), null);
  assert.deepEqual(blockPositionStyle(legacy), {});
});

test('a stamped size renders identically regardless of who is reading', () => {
  const current = block({ width: 820, height: 300, v: LAYOUT_VERSION });
  assert.equal(isCurrentLayoutRecord(current.metadata.layout), true);
  assert.deepEqual(blockLayoutStyle(current), { maxWidth: '820px', minHeight: '300px' });
  assert.equal(hasCustomLayout(current), true);
});

test('a stamped pin renders regardless of who is reading', () => {
  const current = block({ width: 600, x: 10, y: 40, order: 2, v: LAYOUT_VERSION });
  assert.equal(isBlockPinned(current), true);
  assert.deepEqual(readBlockPosition(current), { x: 10, y: 40, order: 2 });
  const style = blockPositionStyle(current);
  assert.equal(style.left, '10%');
  assert.equal(style.top, '40px');
  assert.equal(style.zIndex, '3');
});

test('resizing a legacy block replaces the stale size and stamps the record', () => {
  const legacy = block({ width: 820 });
  const resized = applyBlockLayout(legacy, { width: 700 });
  assert.equal(resized.metadata.layout.v, LAYOUT_VERSION);
  assert.equal(resized.metadata.layout.width, 700, 'stale width must not survive');
  assert.deepEqual(blockLayoutStyle(resized), { maxWidth: '700px' });
});

test('moving a legacy block stamps the record without touching prose', () => {
  const legacy = block({ width: 820 });
  const moved = applyBlockPosition(legacy, { x: 5, y: 10 });
  assert.equal(moved.metadata.layout.v, LAYOUT_VERSION);
  assert.equal(moved.metadata.layout.x, 5);
  assert.equal(moved.metadata.layout.y, 10);
  assert.equal(moved.content, legacy.content, 'layout writes must never rewrite content');
});

test('clearing a layout returns the block to full width in both views', () => {
  const current = block({ width: 820, v: LAYOUT_VERSION });
  const cleared = clearBlockLayout(current);
  assert.deepEqual(readBlockLayout(cleared), {});
  assert.deepEqual(blockLayoutStyle(cleared), {});
});

test('an unrecognised future version is ignored rather than guessed at', () => {
  const future = block({ width: 820, v: LAYOUT_VERSION + 1 });
  assert.deepEqual(blockLayoutStyle(future), {});
});
