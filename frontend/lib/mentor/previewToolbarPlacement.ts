/**
 * Where the mentor's preview toolbar should float.
 *
 * In the mentor's preview of a lesson, the two controls used most — "Exit
 * Preview" and "Edit" — belong beside the lesson's own "Complete Checkpoint"
 * action: that row is where a mentor's attention already is, so both are at hand
 * the moment the preview opens.
 *
 * The toolbar is an overlay, so this is a placement decision only — it never
 * changes the lesson's layout. But an overlay still has to be honest about the
 * space it occupies, so docking is refused when:
 *
 *   • the toolbar would cover any of the lesson header's text;
 *   • the checkpoint action row is not on screen (a toolbar pinned to a
 *     scrolled-away header would hover over lesson content at a stale
 *     position);
 *   • the result would fall outside the workspace.
 *
 * Refusal is always the safe answer: the caller keeps the toolbar in the
 * right-hand chrome column instead.
 *
 * `title` is the header's INK extent, not its box. That distinction matters: the
 * lesson title is a block-level heading inside a flex item, so its box stretches
 * almost to the checkpoint action even when the text is short, while the glyphs
 * end far to the left. Measuring the box refuses to dock in a header that has a
 * wide empty gap — which is exactly the space the toolbar is meant to occupy.
 *
 * Pure geometry, so it is testable without a browser.
 */

/** Space between the toolbar and the checkpoint action it docks beside. */
export const PREVIEW_TOOLBAR_GAP = 10;

/** Breathing room kept between the toolbar and the header text. */
export const PREVIEW_TOOLBAR_TITLE_CLEARANCE = 12;

export interface RectLike {
  top: number;
  bottom: number;
  left: number;
  right?: number;
  width?: number;
  height?: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface PreviewToolbarGeometry {
  /** Rendered size of the floating cluster. */
  toolbar: Size | null | undefined;
  /** The "Complete Checkpoint" action. */
  action: RectLike | null | undefined;
  /** Ink extent of the lesson header's text. */
  title: RectLike | null | undefined;
  /** The scrolling surface the lesson is presented in. */
  host: RectLike | null | undefined;
}

export type PreviewToolbarRefusal =
  | 'not-measured'
  | 'off-screen'
  | 'would-cover-title'
  | 'off-workspace';

export type PreviewToolbarPlacement =
  | { docked: true; top: number; left: number }
  | { docked: false; reason: PreviewToolbarRefusal };

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function rightOf(rect: RectLike): number {
  if (isFiniteNumber(rect.right)) return rect.right;
  if (isFiniteNumber(rect.width)) return rect.left + rect.width;
  return rect.left;
}

function isUsable(rect: RectLike | null | undefined): rect is RectLike {
  return Boolean(rect)
    && isFiniteNumber(rect!.top)
    && isFiniteNumber(rect!.bottom)
    && isFiniteNumber(rect!.left);
}

const refuse = (reason: PreviewToolbarRefusal): PreviewToolbarPlacement => ({ docked: false, reason });

export function resolvePreviewToolbarPlacement(
  geometry: PreviewToolbarGeometry,
): PreviewToolbarPlacement {
  const { toolbar, action, title, host } = geometry;

  const width = toolbar?.width;
  const height = toolbar?.height;
  if (!isFiniteNumber(width) || width <= 0) return refuse('not-measured');
  if (!isFiniteNumber(height) || height <= 0) return refuse('not-measured');
  if (!isUsable(action) || !isUsable(host)) return refuse('not-measured');

  const actionHeight = action.bottom - action.top;
  if (actionHeight <= 0) return refuse('not-measured');

  // Any part of the action row inside the visible band counts; a row that has
  // scrolled past either edge does not.
  const onScreen = action.bottom > host.top && action.top < host.bottom;
  if (!onScreen) return refuse('off-screen');

  const left = Math.round(action.left - width - PREVIEW_TOOLBAR_GAP);
  const top = Math.round(action.top + actionHeight / 2 - height / 2);
  if (left < 0) return refuse('off-workspace');

  const candidate = { left, right: left + width, top, bottom: top + height };

  if (isUsable(title)) {
    const padded = {
      left: title.left - PREVIEW_TOOLBAR_TITLE_CLEARANCE,
      right: rightOf(title) + PREVIEW_TOOLBAR_TITLE_CLEARANCE,
      top: title.top - PREVIEW_TOOLBAR_TITLE_CLEARANCE,
      bottom: title.bottom + PREVIEW_TOOLBAR_TITLE_CLEARANCE,
    };
    const overlaps = candidate.left < padded.right
      && candidate.right > padded.left
      && candidate.top < padded.bottom
      && candidate.bottom > padded.top;
    if (overlaps) return refuse('would-cover-title');
  }

  return { docked: true, top, left };
}

/**
 * Ink extent of the lesson header inside a preview surface.
 *
 * Returns the union of the header text's boxes via a Range, falling back to the
 * element's own box where Range measurement is unavailable (older engines, or a
 * DOM without layout). The caller only uses this to decide whether the toolbar
 * would cover something a reader needs.
 */
export interface MeasurableElement {
  querySelector(selector: string): MeasurableElement | null;
  getBoundingClientRect(): RectLike;
  ownerDocument?: unknown;
}

export function headerInkRect(host: MeasurableElement | null | undefined): RectLike | null {
  if (!host || typeof host.querySelector !== 'function') return null;
  const titleBlock = host.querySelector('.checkpoint-header-left');
  if (!titleBlock) return null;

  // Measure with the node's OWN document: the surface may be rendered into a
  // different document than the global one (tests, popups, print views).
  const doc = (titleBlock.ownerDocument
    ?? (globalThis as { document?: unknown }).document) as
    | { createRange?: () => { selectNodeContents(node: unknown): void; getBoundingClientRect(): RectLike } }
    | undefined;

  if (doc && typeof doc.createRange === 'function') {
    try {
      const range = doc.createRange();
      range.selectNodeContents(titleBlock);
      const rect = range.getBoundingClientRect();
      if (rect && ((rect as { width?: number }).width || 0) > 0) return rect;
      const height = rect ? rect.bottom - rect.top : 0;
      if (rect && height > 0) return rect;
    } catch {
      // Fall through to the element box.
    }
  }

  return titleBlock.getBoundingClientRect();
}
