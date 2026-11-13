// frontend/lib/mentor/lessonBlockLayout.ts
/**
 * RISSE AI — Lesson Block Layout Metadata
 *
 * Phase 1 (resizable containers): teachers can resize individual lesson blocks.
 * The resulting dimensions are *layout metadata*, deliberately kept separate
 * from lesson prose and rich-text formatting so that:
 *
 *   - resizing can never alter or overwrite a block's content;
 *   - a future Phase 2 (drag-and-drop / free positioning) can extend the same
 *     record with x/y/z data without touching content or needing a migration;
 *   - the student experience is unaffected unless the layout is published.
 *
 * Storage: the existing `metadata` bag on a lesson block
 * (`LessonContentBlock.metadata`, already part of `proposal_data`). No new
 * database column or table is required — `proposal_data` is a JSON column and
 * `metadata` is already an open-ended `Record<string, any>`.
 *
 * Shape:
 *   block.metadata.layout = {
 *     width?:  number   // px, null/absent = natural flow width
 *     height?: number   // px, null/absent = natural content height
 *
 *     // ── Phase 2: free positioning ──────────────────────────────────────
 *     x?:      number   // PERCENT of canvas width (0–100), see note below
 *     y?:      number   // px from the canvas top (the document axis)
 *     order?:  number   // stable stacking order for overlapping blocks
 *   }
 *
 * A block is "pinned" only when it has BOTH x and y. Every other block keeps
 * normal document flow, so enabling positioning never rewrites the lesson or
 * reorders content — it only overrides where a block is painted.
 *
 * Why x is a percentage but y is pixels:
 *   - The canvas WIDTH changes when the mentor sidebar collapses or the window
 *     is resized. A percentage x keeps a block in the same relative place, so
 *     the arrangement survives those changes predictably.
 *   - Height is a document axis that grows with content; absolute pixels keep
 *     vertical distances stable and predictable while the page scrolls.
 */

export type BlockDimension = number | null;

export interface LessonBlockLayout {
  width?: BlockDimension;
  height?: BlockDimension;
  /** Percent of canvas width, 0–100. */
  x?: BlockDimension;
  /** Pixels from the canvas top. */
  y?: BlockDimension;
  /** Stacking order; higher paints later. */
  order?: number;
}

/** Just the positioning half of the layout record. */
export interface BlockPosition {
  x: number;
  y: number;
  order?: number;
}

/**
 * Block types that may be resized.
 *
 * Deliberately limited to the types that CheckpointContentView actually renders
 * in the blocks stream. `heading` and `assessment` exist in the
 * LessonContentBlock schema but have no stream renderer, so offering handles
 * for them would be a promise the UI cannot keep.
 */
export const RESIZABLE_BLOCK_TYPES = ['text', 'callout', 'activity'] as const;

/** Horizontal bounds: below this, prose is unreadable. */
export const MIN_BLOCK_WIDTH = 220;
/** Vertical bounds: below this, a block's own controls overlap its text. */
export const MIN_BLOCK_HEIGHT = 80;

/** Grid used by snap-to-grid and alignment guides, in canvas pixels. */
export const LAYOUT_GRID_SIZE = 8;
/** Pointer slop (px) before a drag is treated as a move rather than a click. */
export const DRAG_START_THRESHOLD = 3;
/** Vertical gap the canvas keeps below the lowest pinned block. */
export const CANVAS_BOTTOM_PADDING = 120;
/** Keyboard nudge distances (px), Shift = the larger step. */
export const NUDGE_STEP = 8;
export const NUDGE_STEP_LARGE = 32;

/**
 * Whether a block type supports resizing.
 *
 * Excluded on purpose:
 *  - `code`: a fixed-width code surface; wrapping it narrower than the snippet
 *    forces horizontal scrolling inside a scrolled document.
 *  - `table`: already fluid (100% width) and must fit its columns.
 *  - anything unknown (including `heading`/`assessment`, which are never
 *    rendered in the stream), so future block types are opt-in.
 */
export function isResizableBlockType(type: string | undefined | null): boolean {
  if (!type) return false;
  return (RESIZABLE_BLOCK_TYPES as readonly string[]).includes(type);
}

function toDimension(value: unknown, min: number): BlockDimension {
  const num = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (typeof num !== 'number' || !Number.isFinite(num)) return null;
  // Clamp rather than reject: a stale/odd value should never break the lesson.
  return Math.max(min, Math.round(num));
}

/**
 * Reads layout metadata off a block, clamped to sensible bounds.
 * Returns `{}` when the block has no layout, so callers can treat it as natural.
 */
export function readBlockLayout(block: any): LessonBlockLayout {
  const layout = block?.metadata?.layout;
  if (!layout || typeof layout !== 'object') return {};

  const width = toDimension(layout.width, MIN_BLOCK_WIDTH);
  const height = toDimension(layout.height, MIN_BLOCK_HEIGHT);
  const x = toPercent(layout.x);
  const y = toOffset(layout.y);

  const out: LessonBlockLayout = {};
  if (width != null) out.width = width;
  if (height != null) out.height = height;
  if (x != null) out.x = x;
  if (y != null) out.y = y;
  if (Number.isFinite(layout.order)) out.order = Math.round(layout.order);
  return out;
}

/** Percent position: finite, clamped to the canvas, one decimal of precision. */
function toPercent(value: unknown): number | null {
  const num = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (typeof num !== 'number' || !Number.isFinite(num)) return null;
  return Math.round(Math.min(100, Math.max(0, num)) * 10) / 10;
}

/** Pixel offset on the document axis; negatives are meaningless, so clamp at 0. */
function toOffset(value: unknown): number | null {
  const num = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (typeof num !== 'number' || !Number.isFinite(num)) return null;
  return Math.max(0, Math.round(num));
}

/**
 * True when a block has been explicitly positioned (both axes present).
 * Blocks that fail this keep normal document flow.
 */
export function isBlockPinned(block: any): boolean {
  const layout = block?.metadata?.layout;
  if (!layout || typeof layout !== 'object') return false;
  return toPercent(layout.x) != null && toOffset(layout.y) != null;
}

/** Reads the position of a pinned block, or null when it is still in flow. */
export function readBlockPosition(block: any): BlockPosition | null {
  if (!isBlockPinned(block)) return null;
  const layout = readBlockLayout(block);
  if (layout.x == null || layout.y == null) return null;
  return {
    x: layout.x,
    y: layout.y,
    ...(layout.order != null ? { order: layout.order } : {}),
  };
}

/**
 * Produces the inline style for a resizable block. Width is expressed as a
 * max-width so the block still shrinks on narrow viewports instead of forcing
 * horizontal overflow (the workspace must never scroll sideways).
 */
export function blockLayoutStyle(block: any): Record<string, string> {
  const { width, height } = readBlockLayout(block);
  const style: Record<string, string> = {};
  if (width != null) style.maxWidth = `${width}px`;
  // A minimum, not a fixed box: a resized block grows with its content instead
  // of hiding text behind an internal scrollbar.
  if (height != null) style.minHeight = `${height}px`;
  return style;
}

/**
 * Returns a NEW block with the given dimensions applied to `metadata.layout`.
 * Purely additive: `content`, `title`, and every other field are preserved by
 * reference, so rich-text formatting cannot be affected by a resize.
 *
 * Passing `null` for a dimension removes it (back to natural size).
 */
export function applyBlockLayout<T extends Record<string, any>>(
  block: T,
  dims: LessonBlockLayout
): T {
  const existingMeta = block?.metadata && typeof block.metadata === 'object' ? block.metadata : {};
  const existingLayout = existingMeta.layout && typeof existingMeta.layout === 'object'
    ? { ...existingMeta.layout }
    : {};

  const nextLayout: LessonBlockLayout = { ...existingLayout };

  if (dims.width === null) delete nextLayout.width;
  else if (dims.width != null) nextLayout.width = toDimension(dims.width, MIN_BLOCK_WIDTH) ?? undefined;

  if (dims.height === null) delete nextLayout.height;
  else if (dims.height != null) nextLayout.height = toDimension(dims.height, MIN_BLOCK_HEIGHT) ?? undefined;

  if (nextLayout.width == null && nextLayout.height == null) {
    delete nextLayout.width;
    delete nextLayout.height;
  }

  const nextMeta = { ...existingMeta };
  if (isEmptyLayout(nextLayout)) {
    delete nextMeta.layout;
  } else {
    nextMeta.layout = nextLayout;
  }

  const nextBlock: any = { ...block };
  if (Object.keys(nextMeta).length > 0) nextBlock.metadata = nextMeta;
  else delete nextBlock.metadata;
  return nextBlock;
}

/** True when the block carries any stored size (used for "has custom size"). */
export function hasCustomLayout(block: any): boolean {
  const { width, height } = readBlockLayout(block);
  return width != null || height != null;
}

/**
 * Inline style for a PINNED block: absolute placement on the canvas.
 *
 * `width` is emitted alongside `maxWidth` because an absolutely-positioned box
 * shrink-wraps its content; without an explicit width a pinned block would
 * collapse. `maxWidth` is the responsive cap: it keeps the stored size while a
 * canvas narrower than the block still shrinks it, so a pinned block can never
 * render outside the lesson column.
 */
export function blockPositionStyle(block: any): Record<string, string> {
  const position = readBlockPosition(block);
  if (!position) return {};
  const { width, height } = readBlockLayout(block);

  const style: Record<string, string> = {
    left: `${position.x}%`,
    top: `${position.y}px`,
  };
  if (width != null) {
    // Keep the authored footprint, but cap it to the canvas.
    //
    // `width` is an absolute px value recorded against whatever canvas the block
    // was positioned on. The lesson column is narrower than that canvas as soon
    // as the tutor docks beside it, and an absolute `width` guarded by an equal
    // `max-width` has nothing to shrink against — the block then renders wider
    // than the column, overflows it, and is clipped underneath the tutor. This
    // is the one path that emitted a hard width; `blockLayoutStyle` (in-flow)
    // already caps with `max-width` only, for exactly this reason.
    //
    // The cap is measured against the positioned canvas, so a block that fits
    // keeps its stored size and one that does not shrinks to the column. The
    // block's own offset is subtracted because it is positioned from that
    // offset: capping at a flat 100% would still let a block shifted to the
    // right hang off the edge.
    style.width = `${width}px`;
    style.maxWidth = `calc(100% - ${position.x}%)`;
  }
  // Same reasoning as the in-flow case: min-height keeps the teacher's height
  // without trapping content in an inner scroller.
  if (height != null) style.minHeight = `${height}px`;
  if (position.order != null) style.zIndex = String(1 + position.order);
  return style;
}

/** True when a layout record carries nothing worth persisting. */
export function isEmptyLayout(layout: LessonBlockLayout | null | undefined): boolean {
  if (!layout) return true;
  return (
    layout.width == null &&
    layout.height == null &&
    layout.x == null &&
    layout.y == null &&
    layout.order == null
  );
}

/**
 * Returns a NEW block positioned at (x%, y px).
 *
 * Layout-only, exactly like `applyBlockLayout`: `content`, `title`, `analogy`
 * and every other lesson field are carried through untouched, so moving a block
 * can never rewrite or reflow its prose, lists, images or source references.
 *
 * Pass `null` to release the block back into normal document flow.
 */
export function applyBlockPosition<T extends Record<string, any>>(
  block: T,
  position: BlockPosition | null
): T {
  const existingMeta = block?.metadata && typeof block.metadata === 'object' ? block.metadata : {};
  const existingLayout = existingMeta.layout && typeof existingMeta.layout === 'object'
    ? { ...existingMeta.layout }
    : {};

  const nextLayout: LessonBlockLayout = { ...existingLayout };

  if (position == null) {
    delete nextLayout.x;
    delete nextLayout.y;
    delete nextLayout.order;
  } else {
    const x = toPercent(position.x);
    const y = toOffset(position.y);
    if (x == null || y == null) return { ...block };
    nextLayout.x = x;
    nextLayout.y = y;
    if (position.order != null) nextLayout.order = Math.round(position.order);
  }

  return withLayout(block, existingMeta, nextLayout);
}

/**
 * Applies BOTH size and position in one immutable write. Used when a block is
 * first pinned (it keeps the width it already had) and by Reset Layout.
 */
export function applyBlockSizeAndPosition<T extends Record<string, any>>(
  block: T,
  dims: LessonBlockLayout,
  position: BlockPosition | null
): T {
  const existingMeta = block?.metadata && typeof block.metadata === 'object' ? block.metadata : {};
  const existingLayout = existingMeta.layout && typeof existingMeta.layout === 'object'
    ? { ...existingMeta.layout }
    : {};

  const nextLayout: LessonBlockLayout = { ...existingLayout };

  if (dims.width === null) delete nextLayout.width;
  else if (dims.width != null) nextLayout.width = toDimension(dims.width, MIN_BLOCK_WIDTH) ?? undefined;

  if (dims.height === null) delete nextLayout.height;
  else if (dims.height != null) nextLayout.height = toDimension(dims.height, MIN_BLOCK_HEIGHT) ?? undefined;

  if (position == null) {
    delete nextLayout.x;
    delete nextLayout.y;
    delete nextLayout.order;
  } else {
    const x = toPercent(position.x);
    const y = toOffset(position.y);
    if (x != null && y != null) {
      nextLayout.x = x;
      nextLayout.y = y;
      if (position.order != null) nextLayout.order = Math.round(position.order);
    }
  }

  return withLayout(block, existingMeta, nextLayout);
}

/** Drops every layout hint, returning a block to a plain in-flow document. */
export function clearBlockLayout<T extends Record<string, any>>(block: T): T {
  const existingMeta = block?.metadata && typeof block.metadata === 'object' ? block.metadata : {};
  const nextMeta = { ...existingMeta };
  delete nextMeta.layout;
  const nextBlock: any = { ...block };
  if (Object.keys(nextMeta).length > 0) nextBlock.metadata = nextMeta;
  else delete nextBlock.metadata;
  return nextBlock;
}

/** Shared tail: strip the empty layout bag, keep every other metadata key. */
function withLayout<T extends Record<string, any>>(
  block: T,
  existingMeta: Record<string, any>,
  nextLayout: LessonBlockLayout
): T {
  const nextMeta = { ...existingMeta };
  if (isEmptyLayout(nextLayout)) delete nextMeta.layout;
  else nextMeta.layout = nextLayout;

  const nextBlock: any = { ...block };
  if (Object.keys(nextMeta).length > 0) nextBlock.metadata = nextMeta;
  else delete nextBlock.metadata;
  return nextBlock;
}

/**
 * Snaps a pixel value to the layout grid. Used for snap-to-grid and to keep
 * dragged positions from accumulating sub-pixel drift.
 */
export function snapToGrid(value: number, grid = LAYOUT_GRID_SIZE): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value / grid) * grid;
}

/**
 * Clamps a proposed pixel offset so a block of `size` stays fully inside a
 * canvas of `canvasSize`. Without this a block could be dropped out of bounds
 * and become unreachable.
 */
export function clampOffset(offset: number, size: number, canvasSize: number): number {
  const max = Math.max(0, canvasSize - size);
  if (!Number.isFinite(offset)) return 0;
  return Math.min(Math.max(0, offset), max);
}
