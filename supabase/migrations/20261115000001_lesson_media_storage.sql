-- ============================================================================
-- MIGRATION: 20261115000001_lesson_media_storage.sql
-- PURPOSE: Private storage for images embedded in lesson documents.
--
-- Lesson images are lesson CONTENT, so they follow the same rule as the lesson
-- itself: a mentor can write them, and only people who may read that course can
-- read them. The bucket is therefore private and object paths are scoped by
-- course id (`{course_id}/{timestamp}-{random}.{ext}`), which is what the
-- policies below key on.
--
-- Nothing here touches existing tables, RLS on lesson content, or the
-- course-materials bucket.
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'lesson-media',
    'lesson-media',
    false,
    8388608, -- 8MB per image
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 8388608,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

-- ── Read ────────────────────────────────────────────────────────────────────
-- Owner, admin, the mentor who owns the course in the first path segment, or an
-- actively enrolled student of that course once it is published. Drafts stay
-- invisible to students because the course is not published yet.
DROP POLICY IF EXISTS "lesson_media_select" ON storage.objects;
CREATE POLICY "lesson_media_select" ON storage.objects
FOR SELECT TO authenticated
USING (
    bucket_id = 'lesson-media'
    AND (
        public.has_role('admin')
        OR owner = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.courses c
            WHERE c.id::text = split_part(storage.objects.name, '/', 1)
              AND c.mentor_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.courses c
            JOIN public.course_sections cs ON cs.course_id = c.id
            JOIN public.section_students ss ON ss.section_id = cs.section_id
            WHERE c.id::text = split_part(storage.objects.name, '/', 1)
              AND c.status = 'published'
              AND ss.student_id = auth.uid()
              AND ss.status = 'active'
        )
    )
);

-- ── Write ───────────────────────────────────────────────────────────────────
-- Teachers/admins only, and only into the course they own.
DROP POLICY IF EXISTS "lesson_media_insert" ON storage.objects;
CREATE POLICY "lesson_media_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'lesson-media'
    AND (public.has_role('teacher') OR public.has_role('admin'))
    AND owner = auth.uid()
    AND (
        public.has_role('admin')
        OR EXISTS (
            SELECT 1 FROM public.courses c
            WHERE c.id::text = split_part(storage.objects.name, '/', 1)
              AND c.mentor_id = auth.uid()
        )
    )
);

DROP POLICY IF EXISTS "lesson_media_update" ON storage.objects;
CREATE POLICY "lesson_media_update" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'lesson-media' AND (owner = auth.uid() OR public.has_role('admin')));

DROP POLICY IF EXISTS "lesson_media_delete" ON storage.objects;
CREATE POLICY "lesson_media_delete" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'lesson-media' AND (owner = auth.uid() OR public.has_role('admin')));
