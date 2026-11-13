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
 *     // reserved for Phase 2: x?, y?, z? — intentionally not implemented yet.
 *   }
 */

export type BlockDimension = number | null;

export interface LessonBlockLayout {
  width?: BlockDimension;
  height?: BlockDimension;
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

  const out: LessonBlockLayout = {};
  if (width != null) out.width = width;
  if (height != null) out.height = height;
  return out;
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
  if (height != null) style.height = `${height}px`;
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
  if (nextLayout.width == null && nextLayout.height == null) {
    delete nextMeta.layout;
  } else {
    nextMeta.layout = nextLayout;
  }

  const nextBlock: any = { ...block };
  if (Object.keys(nextMeta).length > 0) nextBlock.metadata = nextMeta;
  else delete nextBlock.metadata;
  return nextBlock;
}

/** True when the block carries any stored layout (used for "has custom size"). */
export function hasCustomLayout(block: any): boolean {
  const { width, height } = readBlockLayout(block);
  return width != null || height != null;
}
