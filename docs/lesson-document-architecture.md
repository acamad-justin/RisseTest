# Shared Document-Based Lesson Architecture

Status: **implemented foundation, phase 1 of 2**
Owner: Risse AI — Module Studio / Student Experience

---

## 1. The shared document data structure

One representation, `LessonDocument`, stored as JSON inside the existing
`proposal_data` payload (`checkpoint.document`, mirrored at
`node_content.document`). **No migration, no new column, no new table.**

```ts
interface LessonDocument {
  version: number;            // LESSON_DOCUMENT_VERSION
  flow: string;               // ONE continuous rich-HTML body
  floats: LessonFloat[];      // independent elements, in document order
  meta?: { width?: number; align?: 'left' | 'center' | 'right' };
}

interface LessonFloat {
  id: string;                 // stable, never re-keyed by an update
  kind: 'text' | 'code' | 'callout' | 'example'
      | 'image' | 'diagram' | 'activity' | 'assessment';
  html?: string;              // rich body for text-ish elements
  src?: string; alt?: string; caption?: string;
  anchor?: number;            // index of the flow node it sits after
  width?: number; height?: number;
  wrap: 'square' | 'top-bottom' | 'inline' | 'none';
  side?: 'left' | 'right';
  overlap: boolean;           // default false — the safe case
  x?: number; y?: number; z?: number;   // meaningful only when overlap
  locked?: boolean;
  semantic?: { blockId?; activityId?; assessmentId? };  // identity preservation
}
```

**The split that matters:** ordinary prose lives in `flow`, as a word processor
stores it. Only deliberately placed things become `floats`. A lesson with zero
floats is completely valid — that is the default generated lesson.

### Why wrapping is CSS containment, not coordinates

`overlap: false` (the default) means the element participates in the document
layout:

| `wrap`       | Render                                       | Result                          |
|--------------|----------------------------------------------|---------------------------------|
| `square`     | `float: left/right; width`                   | text wraps around it            |
| `top-bottom` | `display: block; clear: both`                | text flows above and below      |
| `inline`     | `display: inline-block`                      | sits within the paragraph       |

Text **cannot** be painted underneath an element in any of these modes — the
browser lays the line boxes around it. Absolute positioning is used only for
`overlap: true`, which is opt-in, explicit, and carries a `z` for layering.

---

## 2. How AI generation produces that structure

The generator already decides *what* the lesson contains — explanations,
examples, callouts, activities, assessments — and returns them as blocks.
Asking a model to also emit reliable layout JSON is where these systems usually
fall apart, so generation keeps deciding **content and emphasis** and the
document is derived deterministically:

```
generated blocks ──▶ documentFromBlocks() ──▶ { flow, floats[] }
```

- explanations and prose → `flow` (the readable default)
- callouts / examples / activities → floats placed in the flow, with `anchor`
  preserving where they sat between paragraphs
- code → full-width code surface
- an explicit position the teacher or generator already set → preserved as an
  overlay with the same coordinates

Applied once, at the generation chokepoint
(`MentorService.generateDraftCurriculumProposal` → `attachLessonDocuments`), so
every generation path (source-faithful robotics curriculum and the LLM path)
ships documents. It is idempotent and never invents content.

Teachers can then change anything: rewrite text, change colours, delete, move,
resize, convert to a floating element, change wrapping, allow overlap.

---

## 3. How Module Studio edits it

`LessonDocumentView.vue` is the single renderer/editor used by both the teacher
preview and the student page.

- **Continuous editing.** `flow` is one rich-HTML string inside a
  `contenteditable` canvas; floats are `contenteditable="false"` islands inside
  it. Clicking anywhere in the prose and typing edits the document — paragraphs
  are not selectable "blocks". Caret stability is preserved by never re-rendering
  the flow we ourselves emitted.
- **Contextual controls.** Selecting a float shows one compact bar with: wrapping
  mode, side, overlap toggle, layer forward/backward, lock, delete. Nothing
  permanent, no new sidebar or topbar, and the controls are `position: fixed` so
  they cannot reflow the document.
- **Edits stay buffered.** Document edits emit through the existing
  `update-lesson-content` contract into `previewEditBuffer`, are mirrored onto
  both copies of the lesson (`learning_nodes` and `modules[].checkpoints`) and
  onto the derived `blocks[]` projection. Nothing is published until the teacher
  saves and publishes.

---

## 4. How the student renderer displays it

There is **one** renderer. `CheckpointContentView` renders the same
`LessonDocumentView` for students and for the teacher's preview, with
`editable=false` for students — which removes the `contenteditable` attribute,
the selection affordances and the contextual controls. Students therefore cannot
see editor chrome, and teacher/student layouts cannot drift apart by
construction.

The assessment / mastery card stays where it was: it is a semantic checkpoint
object, not document prose.

---

## 5. How existing lessons remain compatible

- **Read-time bridge.** `lessonDocumentOf(checkpoint)` returns an authored
  document when one exists, otherwise derives one from legacy `blocks[]` /
  `node_content`. Old lessons render through the same path immediately; nothing
  has to be regenerated.
- **Nothing discarded.** The bridge preserves block ids (`semantic.blockId`),
  titles, code, tables, and any explicitly authored size or position.
- **`blocks[]` becomes a projection.** `documentToBlocks()` keeps it populated so
  publishing plans, AI context builders and older screens do not go stale. The
  document is authoritative; `blocks` is derived, never a rival copy.
- **Stale layout metadata is not resurrected.** Sizes written before
  `LAYOUT_VERSION` are ignored (see the layout-parity fix), so a bridged lesson
  does not inherit widths captured against a different canvas.

---

## Phase 2 (next)

- Drag-to-position floats directly on the canvas (currently: wrap/side/overlap
  and layering via the contextual bar; absolute coordinates are supported by the
  model and renderer).
- Insert-menu UI for new text boxes / content boxes / images.
- Rich-text editing *inside* a float (today it renders its HTML; the flow is the
  editable surface).
- Image upload wiring for `image` / `diagram` floats.

---

## Verification

| Check | Result |
|---|---|
| `tests/lesson-document.test.ts` (model, bridge, anchors, layering, generation) | 15/15 |
| `LessonDocumentView` render probe (wrapping, overlays, no chrome for students, identical geometry in both modes) | 14/14 |
| `lesson-rich-text-editor` / `mentor-view` / `module-studio-architecture` / `publish-sync` | 29/4 · 14/2 · 11/9 · 21/21 — unchanged |
| `npm run build` | exit 0 |

### Bonus fix found while doing this

`sanitizeLessonHtml` fed its output through DOMPurify and **silently unwrapped
allowed block tags when a DOM was present** — `<h2>Why it matters</h2>` became a
bare line of text. The deterministic allowlist now runs first and the result
that preserves more structure wins, so headings, lists and tables survive
sanitization in every environment.
