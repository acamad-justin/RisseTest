/*
 * Lesson media — mentor-uploaded pictures inside a lesson document.
 *
 * The contract these lock down:
 *   1. Only real images under the size limit are accepted.
 *   2. An image is stored under its course, so the storage policy can decide who
 *      may read it.
 *   3. The document stores a PATH; rendering resolves it to a short-lived signed
 *      URL, cached so a lesson does not re-sign on every paint.
 *   4. A plain URL already in the document is never re-signed.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

const mem = new Map();
globalThis.localStorage = {
  getItem: k => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: k => mem.delete(k),
  clear: () => mem.clear(),
};
globalThis.window = { localStorage: globalThis.localStorage };

const {
  LESSON_MEDIA_BUCKET,
  MAX_LESSON_IMAGE_BYTES,
  buildLessonImagePath,
  clearLessonMediaCache,
  isDirectImageSource,
  resolveLessonMediaUrl,
  uploadLessonImage,
  validateLessonImage,
} = await import('../frontend/lib/mentor/lessonMedia.ts');

const file = (over = {}) => ({ name: 'robot.png', type: 'image/png', size: 2048, ...over });

function fakeClient({ uploadError = null, signedUrl = 'https://signed.example/img', failSigning = false } = {}) {
  const calls = { upload: 0, sign: 0 };
  return {
    calls,
    storage: {
      from(bucket) {
        assert.equal(bucket, LESSON_MEDIA_BUCKET, 'images must go to the lesson-media bucket');
        return {
          async upload() { calls.upload += 1; return { error: uploadError }; },
          async createSignedUrl(path) {
            calls.sign += 1;
            if (failSigning) return { data: null, error: { message: 'denied' } };
            return { data: { signedUrl: `${signedUrl}/${path}` }, error: null };
          },
        };
      },
    },
  };
}

test('only real images of a sane size are accepted', () => {
  assert.equal(validateLessonImage(file()), null);
  assert.match(validateLessonImage(file({ type: 'application/pdf' })), /not supported/i);
  assert.match(validateLessonImage(file({ size: MAX_LESSON_IMAGE_BYTES + 1 })), /8 MB/);
  assert.match(validateLessonImage(file({ size: 0 })), /empty/i);
  assert.match(validateLessonImage(null), /No file/i);
});

test('an image is stored under its course, with the right extension', () => {
  const path = buildLessonImagePath('course-123', file());
  const [scope, name] = path.split('/');
  assert.equal(scope, 'course-123', 'the first path segment is what the policy keys on');
  assert.match(name, /\.png$/);
  assert.equal(buildLessonImagePath('', file({ name: 'a.webp', type: 'image/webp' })).split('/')[0], 'unscoped');
  assert.match(buildLessonImagePath(null, file({ name: 'a.webp', type: 'image/webp' })), /\.webp$/);
  assert.notEqual(buildLessonImagePath('c', file()), buildLessonImagePath('c', file()), 'names must be unique');
});

test('uploading returns the stored path and a usable URL', async () => {
  clearLessonMediaCache();
  const client = fakeClient();
  const result = await uploadLessonImage(file(), { courseId: 'course-9', client });
  assert.equal(result.success, true);
  assert.equal(result.image.path.split('/')[0], 'course-9');
  assert.match(result.image.url, /signed\.example/);
  assert.equal(client.calls.upload, 1);
});

test('a refused upload is reported, never silently swallowed', async () => {
  const client = fakeClient({ uploadError: { message: 'new row violates row-level security policy' } });
  const result = await uploadLessonImage(file(), { courseId: 'course-9', client });
  assert.equal(result.success, false);
  assert.match(result.error, /row-level security/);
});

test('an invalid file never reaches storage', async () => {
  const client = fakeClient();
  const result = await uploadLessonImage(file({ type: 'application/zip' }), { courseId: 'c', client });
  assert.equal(result.success, false);
  assert.equal(client.calls.upload, 0);
});

test('paths are signed once and then cached', async () => {
  clearLessonMediaCache();
  const client = fakeClient();
  const first = await resolveLessonMediaUrl('course-1/a.png', { client });
  const second = await resolveLessonMediaUrl('course-1/a.png', { client });
  assert.match(first, /signed\.example/);
  assert.equal(first, second);
  assert.equal(client.calls.sign, 1, 'a cached link must not be re-signed on every render');
});

test('direct URLs are passed through untouched', async () => {
  const client = fakeClient();
  assert.equal(await resolveLessonMediaUrl('https://cdn.example/x.png', { client }), 'https://cdn.example/x.png');
  assert.equal(await resolveLessonMediaUrl('data:image/png;base64,AAA', { client }), 'data:image/png;base64,AAA');
  assert.equal(await resolveLessonMediaUrl('/assets/x.png', { client }), '/assets/x.png');
  assert.equal(client.calls.sign, 0);
  assert.equal(isDirectImageSource('https://x/y.png'), true);
  assert.equal(isDirectImageSource('course-1/a.png'), false);
});

test('a signing failure degrades to an empty source rather than a broken <img>', async () => {
  clearLessonMediaCache();
  const client = fakeClient({ failSigning: true });
  assert.equal(await resolveLessonMediaUrl('course-1/b.png', { client }), '');
});
