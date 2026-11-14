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
 * space it occupies. Docking next to the checkpoint action is only safe when:
 *
 *   • the gap between the lesson title and the action is genuinely free, so the
 *     toolbar can never sit on the title a student is meant to read;
 *   • the action row is on screen, because a toolbar pinned to a scrolled-away
 *     header would hover over lesson content at a stale position;
 *   • the result stays inside the workspace.
 *
 * Anything else declines to dock, and the caller keeps the toolbar in the
 * right-hand chrome column instead. Pure geometry, so it is testable without a
 * browser.
 */

/** Space between the toolbar and the checkpoint action it docks beside. */
export const PREVIEW_TOOLBAR_GAP = 10;

/** Minimum clear space between the toolbar and the end of the lesson title. */
export const PREVIEW_TOOLBAR_TITLE_CLEARANCE = 16;

export interface RectLike {
  top: number;
  right?: number;
  bottom: number;
  left: number;
  width?: number;
  height?: number;
}

export type PreviewToolbarPlacement =
  | { docked: true; top: number; left: number }
  | { docked: false };

export interface PreviewToolbarGeometry {
  /** Rendered width of the floating cluster. */
  toolbarWidth: number;
  /** The "Complete Checkpoint" action. */
  action: RectLike | null | undefined;
  /** The lesson title block on the left of the header row. */
  title: RectLike | null | undefined;
  /** The scrolling surface the lesson is presented in. */
  host: RectLike | null | undefined;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isUsable(rect: RectLike | null | undefined): rect is RectLike {
  return Boolean(rect)
    && isFiniteNumber(rect!.top)
    && isFiniteNumber(rect!.bottom)
    && isFiniteNumber(rect!.left);
}

const NO_PLACEMENT: PreviewToolbarPlacement = { docked: false };

export function resolvePreviewToolbarPlacement(
  geometry: PreviewToolbarGeometry,
): PreviewToolbarPlacement {
  const { toolbarWidth, action, title, host } = geometry;

  if (!isFiniteNumber(toolbarWidth) || toolbarWidth <= 0) return NO_PLACEMENT;
  if (!isUsable(action) || !isUsable(title) || !isUsable(host)) return NO_PLACEMENT;

  const actionHeight = isFiniteNumber(action.bottom) && isFiniteNumber(action.top)
    ? action.bottom - action.top
    : 0;
  if (actionHeight <= 0) return NO_PLACEMENT;

  // Any part of the action row inside the visible band counts; a row that has
  // scrolled past either edge does not.
  const onScreen = action.bottom > host.top && action.top < host.bottom;
  if (!onScreen) return NO_PLACEMENT;

  const titleRight = isFiniteNumber(title.right)
    ? title.right
    : title.left + (isFiniteNumber(title.width) ? title.width : 0);

  const room = action.left - titleRight;
  if (room < toolbarWidth + PREVIEW_TOOLBAR_TITLE_CLEARANCE) return NO_PLACEMENT;

  const left = Math.round(action.left - toolbarWidth - PREVIEW_TOOLBAR_GAP);
  if (left < 0) return NO_PLACEMENT;

  return {
    docked: true,
    top: Math.round(action.top + actionHeight / 2),
    left,
  };
}
