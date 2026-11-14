// frontend/lib/mentor/lessonMedia.ts
/**
 * RISSE AI — Lesson Media
 *
 * Images embedded in a lesson document.
 *
 * A lesson image is lesson CONTENT: it belongs to the document, it is published
 * with it, and it must follow the same access rules as the lesson. It therefore
 * lives in the private `lesson-media` bucket (see migration
 * 20261115000001_lesson_media_storage.sql), scoped by course id:
 *
 *   lesson-media/{courseId}/{timestamp}-{random}.{ext}
 *
 * The document stores the storage PATH, not a URL. URLs are resolved at render
 * time into short-lived signed links and cached, so:
 *   • a published lesson keeps working after a link expires,
 *   • a draft image is never readable by a student before the course is
 *     published (the storage policy checks `courses.status = 'published'`),
 *   • nothing about the lesson document depends on a URL that can rot.
 *
 * Plain `http(s):` and `data:` sources are passed through untouched, so a lesson
 * authored elsewhere (or an existing image block) still renders.
 */

import { supabase } from '../../resources/js/lib/supabaseClient.js';

export const LESSON_MEDIA_BUCKET = 'lesson-media';
export const MAX_LESSON_IMAGE_BYTES = 8 * 1024 * 1024;
export const LESSON_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const;

/** Signed link lifetime. Long enough to read a lesson, short enough to matter. */
const SIGNED_URL_TTL_SECONDS = 60 * 60;

export interface UploadedLessonImage {
  /** Storage path stored in the document. */
  path: string;
  /** Immediate, usable URL for the current session. */
  url: string;
}

const urlCache = new Map<string, { url: string; expiresAt: number }>();

/** True when the source is already a usable URL rather than a storage path. */
export function isDirectImageSource(src: string | null | undefined): boolean {
  if (!src) return false;
  return /^(https?:|data:|blob:|\/)/i.test(src.trim());
}

/** Validates a picked file. Returns a human-readable reason, or null when fine. */
export function validateLessonImage(file: any): string | null {
  if (!file) return 'No file selected.';
  const type = String(file.type || '');
  if (!(LESSON_IMAGE_TYPES as readonly string[]).includes(type)) {
    return 'That file type is not supported. Use PNG, JPEG, WebP or GIF.';
  }
  const size = Number(file.size || 0);
  if (size <= 0) return 'That file appears to be empty.';
  if (size > MAX_LESSON_IMAGE_BYTES) return 'Images must be 8 MB or smaller.';
  return null;
}

function extensionFor(file: any): string {
  const type = String(file?.type || '');
  const byType: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  if (byType[type]) return byType[type];
  const name = String(file?.name || '');
  const suffix = name.includes('.') ? name.split('.').pop() : '';
  return suffix ? suffix.toLowerCase().slice(0, 5) : 'png';
}

/** Path for a new image. The first segment is the course the policies key on. */
export function buildLessonImagePath(courseId: string | null | undefined, file: any): string {
  const scope = (courseId && String(courseId).trim()) || 'unscoped';
  const random = Math.random().toString(36).slice(2, 10);
  return `${scope}/${Date.now().toString(36)}-${random}.${extensionFor(file)}`;
}

/**
 * Uploads an image and returns its path plus a usable URL.
 *
 * `client` is injectable so the storage contract can be tested without a network.
 */
export async function uploadLessonImage(
  file: any,
  options: { courseId?: string | null; client?: any } = {}
): Promise<{ success: true; image: UploadedLessonImage } | { success: false; error: string }> {
  const invalid = validateLessonImage(file);
  if (invalid) return { success: false, error: invalid };

  const client = options.client || supabase;
  const path = buildLessonImagePath(options.courseId, file);

  const { error } = await client.storage
    .from(LESSON_MEDIA_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false, cacheControl: '3600' });

  if (error) {
    return { success: false, error: error.message || 'The image could not be uploaded.' };
  }

  const url = await resolveLessonMediaUrl(path, { client });
  return { success: true, image: { path, url } };
}

/**
 * Resolves a stored path into a signed URL, cached until shortly before expiry.
 * Direct URLs are returned unchanged, so this is always safe to call.
 */
export async function resolveLessonMediaUrl(
  src: string | null | undefined,
  options: { client?: any; force?: boolean } = {}
): Promise<string> {
  const value = (src || '').trim();
  if (!value) return '';
  if (isDirectImageSource(value)) return value;

  const cached = urlCache.get(value);
  if (!options.force && cached && cached.expiresAt > Date.now() + 30_000) return cached.url;

  const client = options.client || supabase;
  try {
    const { data, error } = await client.storage
      .from(LESSON_MEDIA_BUCKET)
      .createSignedUrl(value, SIGNED_URL_TTL_SECONDS);
    if (error || !data?.signedUrl) return '';
    urlCache.set(value, {
      url: data.signedUrl,
      expiresAt: Date.now() + SIGNED_URL_TTL_SECONDS * 1000,
    });
    return data.signedUrl;
  } catch {
    return '';
  }
}

/** Clears the signed-URL cache (tests, and after signing out). */
export function clearLessonMediaCache(): void {
  urlCache.clear();
}
