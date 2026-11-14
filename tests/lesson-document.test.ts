/*
 * Shared lesson document — the one representation used by AI generation, Module
 * Studio editing, publishing and the student renderer.
 *
 * The invariants these lock down:
 *   1. Ordinary prose is continuous document text, never one float per paragraph.
 *   2. Overlap is opt-in. The default can never let text render under an element.
 *   3. Bridging legacy blocks loses nothing — ids, sizes and pinned layouts survive.
 *   4. `blocks[]` stays a derived projection of the document, never a rival copy.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LESSON_DOCUMENT_VERSION,
  normalizeLessonDocument,
  documentFromBlocks,
  documentToBlocks,
  lessonDocumentOf,
  hasLessonDocument,
  documentSegments,
  splitFlowHtml,
  addFloat,
  updateFloat,
  removeFloat,
  reorderFloat,
  isOverlay,
  attachLessonDocuments,
  emptyLessonDocument,
} from '../frontend/lib/mentor/lessonDocument.ts';
import { LAYOUT_VERSION } from '../frontend/lib/mentor/lessonBlockLayout.ts';

const textBlock = (id: string, html: string) => ({ id, type: 'text', content: html });

test('continuous prose becomes document flow, not floats', () => {
  const doc = documentFromBlocks([
    textBlock('b1', '<p>First paragraph.</p>'),
    textBlock('b2', '<p>Second paragraph.</p>'),
  ]);
  assert.equal(doc.floats.length, 0, 'paragraphs must not become independent elements');
  assert.match(doc.flow, /First paragraph/);
  assert.match(doc.flow, /Second paragraph/);
});

test('a callout becomes one purposeful element that keeps its identity', () => {
  const blocks = [
    textBlock('b1', '<p>Intro.</p>'),
    { id: 'callout-t04', type: 'callout', title: 'Standard', content: '<p>Precision.</p>' },
    textBlock('b3', '<p>After.</p>'),
  ];
  const doc = documentFromBlocks(blocks);
  assert.equal(doc.floats.length, 1);
  const float = doc.floats[0];
  assert.equal(float.kind, 'callout');
  assert.equal(float.semantic?.blockId, 'callout-t04', 'identity must survive the migration');
  assert.equal(float.overlap, false, 'a callout must never default to overlapping text');
  assert.equal(float.anchor, 1, 'it must stay after the first paragraph');
  assert.equal(doc.flow.match(/<p>/g)?.length, 2);
});

test('overlap is opt-in and cannot be smuggled in', () => {
  const doc = normalizeLessonDocument({
    flow: '<p>Body</p>',
    floats: [{ id: 'f1', kind: 'image', wrap: 'none', overlap: false, src: '/a.png' }],
  });
  assert.equal(doc.floats[0].overlap, false);
  assert.equal(doc.floats[0].wrap, 'square', 'no-wrap without overlap would let text run underneath');
  assert.equal(isOverlay(doc.floats[0]), false);
});

test('an explicitly overlapped element is positioned and layered', () => {
  const doc = normalizeLessonDocument({
    flow: '<p>Body</p>',
    floats: [{ id: 'f1', kind: 'image', wrap: 'square', overlap: true, x: 40, y: 90, z: 3, src: '/a.png' }],
  });
  const float = doc.floats[0];
  assert.equal(isOverlay(float), true);
  assert.equal(float.x, 40);
  assert.equal(float.y, 90);
  assert.equal(float.z, 3);
});

test('ids are preserved, duplicates are repaired, content is sanitized', () => {
  const doc = normalizeLessonDocument({
    flow: '<p>ok</p><script>alert(1)</script>',
    floats: [
      { id: 'same', kind: 'text', html: '<p>A</p>' },
      { id: 'same', kind: 'text', html: '<p>B</p>' },
      { kind: 'text', html: '<p>C</p>' },
    ],
  });
  assert.equal(doc.floats[0].id, 'same');
  assert.notEqual(doc.floats[1].id, 'same', 'a duplicate id would break selection and updates');
  assert.ok(doc.floats[2].id.startsWith('float-'), 'missing ids are generated');
  assert.doesNotMatch(doc.flow, /<script/i);
});

test('a deliberately pinned legacy block keeps its geometry', () => {
  const doc = documentFromBlocks([
    textBlock('b1', '<p>Body</p>'),
    {
      id: 'b2',
      type: 'callout',
      content: '<p>Pinned</p>',
      metadata: { layout: { width: 420, height: 160, x: 12, y: 80, order: 2, v: LAYOUT_VERSION } },
    },
  ]);
  const float = doc.floats[0];
  assert.equal(float.overlap, true, 'an explicit position is real layout and must not be discarded');
  assert.equal(float.x, 12);
  assert.equal(float.y, 80);
  assert.equal(float.width, 420);
});

test('a stale (unversioned) legacy size is not resurrected as a float width', () => {
  const doc = documentFromBlocks([
    textBlock('b1', '<p>Body</p>'),
    { id: 'b2', type: 'callout', content: '<p>C</p>', metadata: { layout: { width: 300 } } },
  ]);
  assert.equal(doc.floats[0].width, undefined);
  assert.equal(doc.floats[0].overlap, false);
});

test('the block projection round-trips the document without losing prose', () => {
  const doc = documentFromBlocks([
    textBlock('b1', '<p>Intro.</p>'),
    { id: 'c1', type: 'callout', title: 'Note', content: '<p>Careful.</p>' },
    { id: 'a1', type: 'activity', content: '<p>Build it.</p>' },
  ]);
  const blocks = documentToBlocks(doc);
  assert.equal(blocks[0].type, 'text');
  assert.match(blocks[0].content, /Intro\./);
  const callout = blocks.find(b => b.type === 'callout');
  assert.ok(callout, 'callouts survive the projection');
  assert.equal(callout.id, 'c1');
  const activity = blocks.find(b => b.type === 'activity');
  assert.ok(activity, 'an activity stays an activity rather than becoming prose');
});

test('the authored document wins over legacy blocks', () => {
  const checkpoint = {
    blocks: [textBlock('b1', '<p>Old copy.</p>')],
    document: { version: LESSON_DOCUMENT_VERSION, flow: '<p>New copy.</p>', floats: [] },
  };
  assert.equal(hasLessonDocument(checkpoint), true);
  assert.match(lessonDocumentOf(checkpoint).flow, /New copy/);
  assert.doesNotMatch(lessonDocumentOf(checkpoint).flow, /Old copy/);
});

test('a lesson with no content has no document', () => {
  assert.equal(lessonDocumentOf({}), null);
  assert.equal(lessonDocumentOf(null), null);
  assert.equal(lessonDocumentOf({ blocks: [] }), null);
});

test('flow is split into top-level nodes and floats interleave by anchor', () => {
  const html = '<p>One</p><ul><li>a</li><li>b</li></ul><p>Two</p>';
  assert.deepEqual(splitFlowHtml(html), ['<p>One</p>', '<ul><li>a</li><li>b</li></ul>', '<p>Two</p>']);

  const doc = normalizeLessonDocument({
    flow: html,
    floats: [
      { id: 'f1', kind: 'image', wrap: 'square', overlap: false, anchor: 1, src: '/a.png' },
      { id: 'f2', kind: 'image', wrap: 'square', overlap: false, anchor: 3, src: '/b.png' },
      { id: 'f3', kind: 'text', wrap: 'square', overlap: true, x: 0, y: 0 },
    ],
  });
  const segments = documentSegments(doc);
  assert.deepEqual(
    segments.map(s => (s.type === 'flow' ? `flow:${s.index}` : `float:${s.float.id}`)),
    ['flow:0', 'float:f1', 'flow:1', 'flow:2', 'float:f2'],
    'overlays are positioned on the canvas, not placed in the text'
  );
});

test('editing helpers cannot corrupt ids or drop content', () => {
  let doc = emptyLessonDocument();
  doc = addFloat(doc, { kind: 'text', html: '<p>New box</p>', anchor: 0 });
  assert.equal(doc.floats.length, 1);
  const id = doc.floats[0].id;

  doc = updateFloat(doc, id, { wrap: 'inline', id: 'hijacked' });
  assert.equal(doc.floats[0].id, id, 'an update can never re-key an element');
  assert.equal(doc.floats[0].wrap, 'inline');

  doc = removeFloat(doc, id);
  assert.equal(doc.floats.length, 0);
});

test('layering reorders z into a dense sequence', () => {
  let doc = normalizeLessonDocument({
    flow: '<p>x</p>',
    floats: [
      { id: 'a', kind: 'text', overlap: true, x: 0, y: 0, z: 1 },
      { id: 'b', kind: 'text', overlap: true, x: 0, y: 0, z: 2 },
      { id: 'c', kind: 'text', overlap: true, x: 0, y: 0, z: 3 },
    ],
  });
  doc = reorderFloat(doc, 'a', 'front');
  assert.deepEqual(doc.floats.map(f => f.id), ['b', 'c', 'a']);
  assert.deepEqual(doc.floats.map(f => f.z), [1, 2, 3]);
  doc = reorderFloat(doc, 'a', 'back');
  assert.deepEqual(doc.floats.map(f => f.id), ['a', 'b', 'c']);
});

test('generation attaches a document to every generated lesson, once', () => {
  const callout = { id: 'c1', type: 'callout', content: '<p>Note</p>' };
  const draft = {
    learning_nodes: [{ id: 'n1', title: 'Node', blocks: [textBlock('b1', '<p>Hi</p>'), callout] }],
    modules: [{ id: 'm1', checkpoints: [{ id: 'n1', title: 'Node', blocks: [textBlock('b1', '<p>Hi</p>'), callout] }] }],
  };
  const out = attachLessonDocuments(draft);
  assert.ok(out.learning_nodes[0].document, 'generated lessons ship as documents');
  assert.equal(out.learning_nodes[0].document.floats.length, 1);
  assert.ok(out.learning_nodes[0].node_content === undefined);

  const before = JSON.stringify(out.learning_nodes[0].document);
  attachLessonDocuments(out);
  assert.equal(JSON.stringify(out.learning_nodes[0].document), before, 'attaching twice must be a no-op');
});

test('a node with no content is left alone rather than given an empty document', () => {
  const draft = { learning_nodes: [{ id: 'n1', title: 'Empty' }] };
  attachLessonDocuments(draft);
  assert.equal(draft.learning_nodes[0].document, undefined);
});

test('an eight-section node_content lesson becomes a document', () => {
  const doc = lessonDocumentOf({
    id: 'n1',
    node_content: {
      introduction: 'Robotics deals with design and construction.',
      core_lesson: '<p>An autonomous machine replaces human effort.</p>',
      key_concepts: [{ concept: 'Autonomy', explanation: 'It performs without a person controlling every move.' }],
      examples: ['A line-following robot.'],
      activities: ['Build a bumper switch.'],
    },
  });
  assert.ok(doc, 'a lesson without blocks must still be a document, or its content cannot be edited');
  assert.match(doc.flow, /Robotics deals/);
  assert.match(doc.flow, /autonomous machine/);
  assert.equal(doc.floats.filter(f => f.kind === 'callout').length, 1);
  assert.equal(doc.floats.filter(f => f.kind === 'example').length, 1);
  assert.equal(doc.floats.filter(f => f.kind === 'activity').length, 1);
  assert.equal(doc.floats.every(f => f.overlap === false), true);
});

test('in-flow offsets survive normalisation and keep the element in the flow', () => {
  const doc = normalizeLessonDocument({
    flow: '<p>One.</p><p>Two.</p>',
    floats: [{
      id: 'f1', kind: 'callout', html: '<p>Box</p>',
      wrap: 'square', side: 'right', overlap: false, anchor: 1,
      offsetX: 36, offsetY: 84, width: 380,
    }],
  });
  const float = doc.floats[0];
  assert.equal(float.offsetX, 36);
  assert.equal(float.offsetY, 84);
  assert.equal(float.overlap, false, 'an offset position must never leave the flow');
  assert.equal(isOverlay(float), false);
});

test('a moved box keeps its width instead of collapsing to a default', () => {
  const doc = normalizeLessonDocument({
    flow: '<p>One.</p>',
    floats: [{ id: 'f1', kind: 'callout', html: '<p>Box</p>', wrap: 'square', overlap: true, x: 40, y: 60, width: 420 }],
  });
  assert.equal(doc.floats[0].width, 420);
  const flowAgain = updateFloat(doc, 'f1', { overlap: false, wrap: 'square' });
  assert.equal(flowAgain.floats[0].width, 420, 'returning to the flow must not lose the size');
});
