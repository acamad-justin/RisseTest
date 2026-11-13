// frontend/lib/mentor/lessonDocument.ts
/**
 * RISSE AI — Shared Lesson Document
 *
 * ONE representation used by AI generation, Module Studio editing, publishing
 * and the student renderer.
 *
 * Why this exists
 * ---------------
 * Lessons were stored as a flat array of typed "boxes" (`LessonContentBlock[]`):
 * every paragraph, callout and activity was an independent card stacked in a
 * column. That made ordinary prose impossible to edit as prose and forced the
 * teacher to think in containers.
 *
 * The document splits the two things that were being conflated:
 *
 *   flow     — ONE continuous rich-text body. Paragraphs, headings, lists,
 *              alignment, colours, highlights and links live here, exactly as a
 *              word processor stores them. Editing it is editing a document.
 *
 *   floats[] — independent elements (text box, content box, image, diagram,
 *              callout, activity, assessment) with an id, a geometry, a wrapping
 *              mode and a layering position. These are the things a teacher
 *              deliberately places.
 *
 * Ordinary prose is NOT modelled as floats. A lesson with no floats at all is a
 * completely valid document.
 *
 * Wrapping
 * --------
 * `overlap: false` is the default and the safe case: the element participates in
 * the document's layout, so text physically cannot be painted underneath it.
 *
 *   square     — CSS float left/right; text wraps around it (newspaper style)
 *   top-bottom — block on its own line, following text clears it
 *   inline     — flows within the paragraph like an inline image
 *
 * `overlap: true` is opt-in and the only mode that uses absolute coordinates
 * (x/y). Layering then matters, so it also carries `z`.
 *
 * Storage
 * -------
 * `LessonDocument` is JSON inside the existing `proposal_data` proposal payload
 * (`checkpoint.document`, mirrored on `node_content.document`). No migration, no
 * new column. Legacy `blocks[]` are kept alongside as a DERIVED projection
 * (`documentToBlocks`) so older consumers keep working, but the document is the
 * source of truth whenever it exists.
 */

import { sanitizeLessonHtml } from './richLessonContent.ts';
import { LAYOUT_VERSION, isCurrentLayoutRecord, isResizableBlockType } from './lessonBlockLayout.ts';

export const LESSON_DOCUMENT_VERSION = 1;

/** How a float participates in the surrounding document's layout. */
export type FloatWrap = 'square' | 'top-bottom' | 'inline' | 'none';

/** The kinds of element a teacher can place independently. */
export type FloatKind =
  | 'text'
  | 'code'
  | 'callout'
  | 'example'
  | 'image'
  | 'diagram'
  | 'activity'
  | 'assessment';

export interface LessonFloat {
  id: string;
  kind: FloatKind;
  /** Rich HTML body for text-ish elements (text, callout, example, activity). */
  html?: string;
  /** Image/diagram source. */
  src?: string;
  alt?: string;
  caption?: string;
  /** Canvas pixels. Only meaningful when `overlap` is true. */
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  wrap: FloatWrap;
  /** Which side a `square` float sits on. */
  side?: 'left' | 'right';
  /**
   * Where in the flow the element sits: the index of the top-level flow node it
   * is anchored to (0 = before the first paragraph). Absent = end of document.
   * This is what makes an image land mid-lesson instead of after everything.
   */
  anchor?: number;
  /** Opt-in layering. False = part of the flow, so text can never run under it. */
  overlap: boolean;
  z?: number;
  locked?: boolean;
  /**
   * Identity of the lesson object this element represents, when it stands in for
   * structured content. Keeps an activity an activity rather than decorative
   * prose, and lets the renderer reuse the existing interactive components.
   */
  semantic?: {
    blockId?: string;
    activityId?: string;
    assessmentId?: string;
  };
}

export interface LessonDocument {
  version: number;
  /** The continuous document body, as sanitized rich HTML. */
  flow: string;
  floats: LessonFloat[];
  meta?: {
    /** Authored document width in px, for centered page-like layouts. */
    width?: number;
    /** Text direction / alignment of the document as a whole. */
    align?: 'left' | 'center' | 'right';
  };
}

const FLOAT_KINDS: FloatKind[] = ['text', 'code', 'callout', 'example', 'image', 'diagram', 'activity', 'assessment'];
const WRAP_MODES: FloatWrap[] = ['square', 'top-bottom', 'inline', 'none'];

let floatSeq = 0;
/** Stable, collision-resistant id for a new float. */
export function newFloatId(kind: FloatKind = 'text'): string {
  floatSeq += 1;
  const rand = Math.random().toString(36).slice(2, 8);
  return `float-${kind}-${Date.now().toString(36)}-${rand}${floatSeq}`;
}

export function emptyLessonDocument(): LessonDocument {
  return { version: LESSON_DOCUMENT_VERSION, flow: '', floats: [] };
}

// ── Normalisation ──────────────────────────────────────────────────────────

function toFiniteNumber(value: unknown): number | null {
  const num = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (typeof num !== 'number' || !Number.isFinite(num)) return null;
  return Math.round(num);
}

/**
 * Repairs a stored document into a guaranteed-valid one.
 *
 * Never throws and never drops content: unknown fields are discarded, but text
 * is retained, ids are preserved (or generated only when genuinely missing) and
 * the DEFAULT IS ALWAYS NO OVERLAP — a float that claims to be in the flow but
 * carries `wrap: 'none'` is coerced to `square`, because that combination is
 * exactly what would let text render underneath it.
 */
export function normalizeLessonDocument(input: any): LessonDocument {
  const doc = input && typeof input === 'object' ? input : {};
  const floats = Array.isArray(doc.floats) ? doc.floats : [];
  const seen = new Set<string>();

  const normalized: LessonFloat[] = [];
  for (const raw of floats) {
    if (!raw || typeof raw !== 'object') continue;
    const kind: FloatKind = FLOAT_KINDS.includes(raw.kind) ? raw.kind : 'text';
    let id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : newFloatId(kind);
    if (seen.has(id)) id = newFloatId(kind);
    seen.add(id);

    const overlap = raw.overlap === true;
    let wrap: FloatWrap = WRAP_MODES.includes(raw.wrap) ? raw.wrap : 'square';
    if (!overlap && wrap === 'none') wrap = 'square';

    const float: LessonFloat = {
      id,
      kind,
      wrap,
      overlap,
      side: raw.side === 'right' ? 'right' : raw.side === 'left' ? 'left' : undefined,
    };
    if (typeof raw.html === 'string' && raw.html.trim()) float.html = sanitizeLessonHtml(raw.html);
    if (typeof raw.src === 'string' && raw.src.trim()) float.src = raw.src.trim();
    if (typeof raw.alt === 'string') float.alt = raw.alt;
    if (typeof raw.caption === 'string' && raw.caption.trim()) float.caption = raw.caption.trim();
    if (typeof raw.locked === 'boolean') float.locked = raw.locked;
    const anchor = toFiniteNumber(raw.anchor);
    if (anchor != null && anchor >= 0) float.anchor = anchor;
    if (raw.semantic && typeof raw.semantic === 'object') {
      float.semantic = {
        ...(raw.semantic.blockId ? { blockId: String(raw.semantic.blockId) } : {}),
        ...(raw.semantic.activityId ? { activityId: String(raw.semantic.activityId) } : {}),
        ...(raw.semantic.assessmentId ? { assessmentId: String(raw.semantic.assessmentId) } : {}),
      };
    }

    const width = toFiniteNumber(raw.width);
    const height = toFiniteNumber(raw.height);
    if (width != null && width > 0) float.width = width;
    if (height != null && height > 0) float.height = height;
    if (overlap) {
      const x = toFiniteNumber(raw.x);
      const y = toFiniteNumber(raw.y);
      float.x = x != null ? Math.max(0, x) : 0;
      float.y = y != null ? Math.max(0, y) : 0;
      const z = toFiniteNumber(raw.z);
      float.z = z != null ? z : 1;
    } else {
      const z = toFiniteNumber(raw.z);
      if (z != null) float.z = z;
    }

    normalized.push(float);
  }

  const meta = doc.meta && typeof doc.meta === 'object' ? doc.meta : null;
  const out: LessonDocument = {
    version: LESSON_DOCUMENT_VERSION,
    flow: typeof doc.flow === 'string' ? sanitizeLessonHtml(doc.flow) : '',
    floats: normalized,
  };
  if (meta) {
    const width = toFiniteNumber(meta.width);
    const align = meta.align === 'center' || meta.align === 'right' ? meta.align : meta.align === 'left' ? 'left' : undefined;
    if (width != null || align) out.meta = { ...(width != null ? { width } : {}), ...(align ? { align } : {}) };
  }
  return out;
}

// ── Legacy bridge ──────────────────────────────────────────────────────────

function blockHtml(block: any): string {
  const raw = typeof block?.content === 'string' ? block.content : '';
  return sanitizeLessonHtml(raw);
}

/**
 * Derives a document from the legacy `LessonContentBlock[]` representation.
 *
 * Lossless in the direction that matters: nothing is dropped.
 *  - `text` / `heading` blocks are concatenated into the continuous flow, in
 *    order, so prose becomes prose again.
 *  - callouts, examples, code, tables, activities and assessments become floats
 *    that preserve the original block id (`semantic.blockId`) and their
 *    interactive identity.
 *  - a block that already had an explicit layout (a size, or a position under a
 *    current layout record) keeps it: sizes become `width`/`height`, and a
 *    deliberately pinned block becomes an overlay with the same coordinates.
 *    Nothing is silently discarded.
 */
export function documentFromBlocks(blocks: any[]): LessonDocument {
  const list = Array.isArray(blocks) ? blocks : [];
  const flowParts: string[] = [];
  const floats: LessonFloat[] = [];

  for (const block of list) {
    if (!block || typeof block !== 'object') continue;
    const html = blockHtml(block);

    if (block.type === 'text' || block.type === 'heading') {
      if (block.title && block.type === 'heading') flowParts.push(`<h2>${sanitizeLessonHtml(String(block.title))}</h2>`);
      if (html.trim()) flowParts.push(block.type === 'heading' ? `<h2>${html}</h2>` : html);
      continue;
    }

    // The block sat after this many flow nodes; keep it there.
    const anchor = flowParts.length;

    const kind: FloatKind =
      block.type === 'code' ? 'code'
      : block.type === 'callout' ? 'callout'
      : block.type === 'activity' ? 'activity'
      : block.type === 'assessment' ? 'assessment'
      : 'text';

    const float: LessonFloat = {
      id: typeof block.id === 'string' && block.id ? block.id : newFloatId(kind),
      kind,
      wrap: 'top-bottom',
      overlap: false,
      html,
      anchor,
      semantic: { blockId: block.id },
    };
    if (block.title) float.caption = String(block.title);
    if (block.type === 'code') float.wrap = 'top-bottom';

    const layout = block?.metadata?.layout;
    if (isCurrentLayoutRecord(layout)) {
      const width = toFiniteNumber(layout.width);
      const height = toFiniteNumber(layout.height);
      if (width != null) float.width = width;
      if (height != null) float.height = height;
      const x = toFiniteNumber(layout.x);
      const y = toFiniteNumber(layout.y);
      if (x != null && y != null) {
        // A deliberately pinned block keeps its position as an explicit overlay.
        float.overlap = true;
        float.x = Math.max(0, x);
        float.y = Math.max(0, y);
        float.z = toFiniteNumber(layout.order) != null ? Math.max(1, toFiniteNumber(layout.order) as number) : 1;
      }
    }

    floats.push(float);
  }

  return normalizeLessonDocument({ version: LESSON_DOCUMENT_VERSION, flow: flowParts.join('\n'), floats });
}

/**
 * Projects a document back onto the legacy block array.
 *
 * `blocks[]` is kept as a DERIVED view: publishing plans, AI context builders
 * and older screens still read it, and they must not go stale. The document
 * remains authoritative — this is a projection, never a second source of truth.
 */
export function documentToBlocks(doc: LessonDocument): any[] {
  const d = normalizeLessonDocument(doc);
  const blocks: any[] = [];

  if (d.flow.trim()) {
    blocks.push({ id: 'document-flow', type: 'text', content: d.flow, metadata: { derived_from: 'document.flow' } });
  }

  for (const float of d.floats) {
    const type =
      float.kind === 'code' ? 'code'
      : float.kind === 'callout' ? 'callout'
      : float.kind === 'activity' ? 'activity'
      : float.kind === 'assessment' ? 'assessment'
      : 'text';
    const block: any = {
      id: float.semantic?.blockId || float.id,
      type,
      content: float.html || '',
    };
    if (float.caption) block.title = float.caption;

    if (isResizableBlockType(type) && (float.width != null || float.height != null || float.overlap)) {
      const layout: any = { v: LAYOUT_VERSION };
      if (float.width != null) layout.width = float.width;
      if (float.height != null) layout.height = float.height;
      if (float.overlap && float.x != null && float.y != null) {
        layout.x = float.x;
        layout.y = float.y;
        layout.order = float.z ?? 1;
      }
      block.metadata = { ...(block.metadata || {}), layout };
    }
    blocks.push(block);
  }

  return blocks;
}

/** True when a checkpoint carries an authored document. */
export function hasLessonDocument(checkpoint: any): boolean {
  const doc = checkpoint?.document || checkpoint?.node_content?.document;
  return Boolean(doc && typeof doc === 'object' && (typeof doc.flow === 'string' || Array.isArray(doc.floats)));
}

/**
 * Resolves the document a checkpoint should render, or null when the lesson has
 * none. A checkpoint with legacy blocks is bridged on the fly, so the student
 * renderer has exactly one code path.
 */
export function lessonDocumentOf(checkpoint: any): LessonDocument | null {
  if (!checkpoint || typeof checkpoint !== 'object') return null;
  const authored = checkpoint.document || checkpoint?.node_content?.document;
  if (authored && typeof authored === 'object') return normalizeLessonDocument(authored);
  const blocks = checkpoint.blocks || checkpoint?.node_content?.blocks;
  if (Array.isArray(blocks) && blocks.length > 0) return documentFromBlocks(blocks);
  return null;
}

// ── Float editing ──────────────────────────────────────────────────────────

export function addFloat(doc: LessonDocument, float: Partial<LessonFloat> & { kind: FloatKind }): LessonDocument {
  const d = normalizeLessonDocument(doc);
  const next = normalizeLessonDocument({
    ...d,
    floats: [...d.floats, { id: newFloatId(float.kind), wrap: 'top-bottom', overlap: false, ...float }],
  });
  return next;
}

export function updateFloat(doc: LessonDocument, id: string, patch: Partial<LessonFloat>): LessonDocument {
  const d = normalizeLessonDocument(doc);
  return normalizeLessonDocument({
    ...d,
    floats: d.floats.map(f => (f.id === id ? { ...f, ...patch, id: f.id } : f)),
  });
}

export function removeFloat(doc: LessonDocument, id: string): LessonDocument {
  const d = normalizeLessonDocument(doc);
  return normalizeLessonDocument({ ...d, floats: d.floats.filter(f => f.id !== id) });
}

/** Layering operations. Only meaningful for explicitly overlapped floats. */
export type LayerAction = 'forward' | 'backward' | 'front' | 'back';

export function reorderFloat(doc: LessonDocument, id: string, action: LayerAction): LessonDocument {
  const d = normalizeLessonDocument(doc);
  const sorted = [...d.floats].sort((a, b) => (a.z ?? 1) - (b.z ?? 1));
  const index = sorted.findIndex(f => f.id === id);
  if (index === -1) return d;

  if (action === 'front') sorted.push(sorted.splice(index, 1)[0]);
  else if (action === 'back') sorted.unshift(sorted.splice(index, 1)[0]);
  else if (action === 'forward' && index < sorted.length - 1) {
    [sorted[index], sorted[index + 1]] = [sorted[index + 1], sorted[index]];
  } else if (action === 'backward' && index > 0) {
    [sorted[index], sorted[index - 1]] = [sorted[index - 1], sorted[index]];
  }

  // Normalise z to a dense 1..n sequence so ordering stays predictable.
  return normalizeLessonDocument({ ...d, floats: sorted.map((f, i) => ({ ...f, z: i + 1 })) });
}

/**
 * Whether a float is allowed to be painted over document text.
 * The renderer relies on this: only explicitly overlapped elements are taken
 * out of the flow and given absolute coordinates.
 */
export function isOverlay(float: LessonFloat): boolean {
  return float?.overlap === true && Number.isFinite(float.x) && Number.isFinite(float.y);
}

export function countFloats(doc: LessonDocument | null): number {
  return doc?.floats?.length || 0;
}


// ── Flow segmentation ──────────────────────────────────────────────────────

/**
 * Splits sanitized flow HTML into its top-level nodes.
 *
 * Floats are anchored to these nodes so an illustration can sit between two
 * paragraphs instead of after the whole lesson. Uses the DOM when available
 * (browser, happy-dom) and falls back to a tag-depth scanner in Node/SSR.
 */
export function splitFlowHtml(html: string): string[] {
  const source = String(html || '').trim();
  if (!source) return [];

  const Doc = (globalThis as any).DOMParser;
  if (typeof Doc === 'function') {
    try {
      const parsed = new Doc().parseFromString(`<div id="risse-flow-root">${source}</div>`, 'text/html');
      const root = parsed.getElementById?.('risse-flow-root') || parsed.querySelector?.('#risse-flow-root');
      if (root) {
        const nodes = Array.from(root.childNodes as any[]);
        const out: string[] = [];
        for (const node of nodes) {
          if (node.nodeType === 3) {
            const text = String(node.textContent || '').trim();
            if (text) out.push(`<p>${text}</p>`);
            continue;
          }
          if (node.nodeType === 1) {
            const outer = (node as any).outerHTML;
            if (outer && outer.trim()) out.push(outer.trim());
          }
        }
        return out;
      }
    } catch {
      /* fall through to the scanner */
    }
  }

  // Depth scanner: keeps void tags and nested markup intact.
  const out: string[] = [];
  const VOID = new Set(['br', 'hr', 'img', 'input', 'meta', 'link']);
  const tagRe = /<\/?([a-zA-Z][a-zA-Z0-9-]*)([^>]*)>/g;
  let depth = 0;
  let start = -1;
  let match: RegExpExecArray | null;
  while ((match = tagRe.exec(source))) {
    const tag = match[1].toLowerCase();
    const closing = match[0].startsWith('</');
    const selfClosing = match[0].endsWith('/>') || VOID.has(tag);
    if (!closing && depth === 0) start = match.index;
    if (selfClosing) {
      if (depth === 0 && start >= 0) {
        out.push(source.slice(start, tagRe.lastIndex).trim());
        start = -1;
      }
      continue;
    }
    depth += closing ? -1 : 1;
    if (depth === 0 && start >= 0) {
      out.push(source.slice(start, tagRe.lastIndex).trim());
      start = -1;
    }
  }
  if (start >= 0) {
    const tail = source.slice(start).trim();
    if (tail) out.push(tail);
  }
  return out.filter(Boolean);
}

/**
 * Interleaves the flow and its non-overlaying floats into one ordered sequence
 * the renderer can walk. Overlay floats are excluded: they are positioned
 * against the canvas, not placed in the text.
 */
export type DocumentSegment =
  | { type: 'flow'; index: number; html: string }
  | { type: 'float'; float: LessonFloat };

export function documentSegments(doc: LessonDocument): DocumentSegment[] {
  const d = normalizeLessonDocument(doc);
  const nodes = splitFlowHtml(d.flow);
  const inlineFloats = d.floats.filter(f => !isOverlay(f));

  const byAnchor = new Map<number, LessonFloat[]>();
  for (const float of inlineFloats) {
    const anchor = float.anchor != null ? Math.min(float.anchor, nodes.length) : nodes.length;
    if (!byAnchor.has(anchor)) byAnchor.set(anchor, []);
    (byAnchor.get(anchor) as LessonFloat[]).push(float);
  }

  const segments: DocumentSegment[] = [];
  for (let i = 0; i < nodes.length; i += 1) {
    for (const float of byAnchor.get(i) || []) segments.push({ type: 'float', float });
    segments.push({ type: 'flow', index: i, html: nodes[i] });
  }
  for (const float of byAnchor.get(nodes.length) || []) segments.push({ type: 'float', float });
  return segments;
}

// ── Generation integration ─────────────────────────────────────────────────

/**
 * Gives every generated lesson a document.
 *
 * The generator already decides what the lesson *is* — explanations, examples,
 * callouts, activities, assessments — and returns them as blocks. This turns
 * that decision into the shared representation without asking the model to also
 * emit layout JSON (which it does badly and inconsistently):
 *
 *   • explanations and prose  → continuous flow (the readable default)
 *   • callouts / examples     → content boxes placed in the flow
 *   • code                    → full-width code surface
 *   • pinned/backdrop layout  → preserved as an explicit overlay
 *
 * So an AI-authored lesson is a flowing document with a few purposeful
 * elements, never one box per paragraph, and every part of it is editable.
 */
export function attachLessonDocuments(draft: any): any {
  if (!draft || typeof draft !== 'object') return draft;

  const apply = (checkpoint: any) => {
    if (!checkpoint || typeof checkpoint !== 'object') return;
    if (hasLessonDocument(checkpoint)) return;

    const blocks = checkpoint.blocks || checkpoint?.node_content?.blocks;
    if (!Array.isArray(blocks) || blocks.length === 0) return;

    const document = documentFromBlocks(blocks);
    if (!document.flow.trim() && document.floats.length === 0) return;

    checkpoint.document = document;
    if (checkpoint.node_content && typeof checkpoint.node_content === 'object') {
      checkpoint.node_content.document = document;
    }
  };

  if (Array.isArray(draft.learning_nodes)) draft.learning_nodes.forEach(apply);
  if (Array.isArray(draft.modules)) {
    for (const mod of draft.modules) {
      if (Array.isArray(mod?.checkpoints)) mod.checkpoints.forEach(apply);
      if (Array.isArray(mod?.learning_nodes)) mod.learning_nodes.forEach(apply);
    }
  }
  if (Array.isArray(draft.checkpoints)) draft.checkpoints.forEach(apply);
  return draft;
}
