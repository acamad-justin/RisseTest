-- ============================================================================
-- MIGRATION: 20261107000004_course_materials_storage.sql
-- PURPOSE: Supabase Storage Bucket & Row Level Security for Course Materials
-- ============================================================================

-- 1. Create Private Storage Bucket for Course Materials
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'course-materials',
    'course-materials',
    false,
    26214400, -- 25MB
    ARRAY[
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain',
        'text/markdown',
        'text/x-markdown'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 26214400,
    allowed_mime_types = ARRAY[
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain',
        'text/markdown',
        'text/x-markdown'
    ];

-- 2. Storage RLS Policies on storage.objects

-- Allow authorized mentors, admins, and actively enrolled students of published courses to read/download materials
DROP POLICY IF EXISTS "course_materials_storage_select" ON storage.objects;
CREATE POLICY "course_materials_storage_select" ON storage.objects
FOR SELECT TO authenticated
USING (
    bucket_id = 'course-materials'
    AND (
        -- Admin override
        public.has_role('admin')
        -- Object uploader
        OR owner = auth.uid()
        -- Mentor who owns the course
        OR EXISTS (
            SELECT 1 FROM public.course_materials cm
            JOIN public.courses c ON c.id = cm.course_id
            WHERE cm.storage_path = storage.objects.name
              AND (c.mentor_id = auth.uid() OR cm.uploaded_by = auth.uid())
        )
        -- Actively enrolled student in an assigned section of a published course
        OR EXISTS (
            SELECT 1 FROM public.course_materials cm
            JOIN public.courses c ON c.id = cm.course_id
            JOIN public.course_sections cs ON cs.course_id = c.id
            JOIN public.section_students ss ON ss.section_id = cs.section_id
            WHERE cm.storage_path = storage.objects.name
              AND c.status = 'published'
              AND ss.student_id = auth.uid()
              AND ss.status = 'active'
        )
    )
);

-- Allow authenticated teachers and admins to upload course materials
DROP POLICY IF EXISTS "course_materials_storage_insert" ON storage.objects;
CREATE POLICY "course_materials_storage_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'course-materials'
    AND (public.has_role('teacher') OR public.has_role('admin'))
    AND (owner = auth.uid() OR auth.uid() IS NOT NULL)
);

-- Allow owner or admin to update objects
DROP POLICY IF EXISTS "course_materials_storage_update" ON storage.objects;
CREATE POLICY "course_materials_storage_update" ON storage.objects
FOR UPDATE TO authenticated
USING (
    bucket_id = 'course-materials'
    AND (owner = auth.uid() OR public.has_role('admin'))
);

-- Allow owner or admin to delete objects
DROP POLICY IF EXISTS "course_materials_storage_delete" ON storage.objects;
CREATE POLICY "course_materials_storage_delete" ON storage.objects
FOR DELETE TO authenticated
USING (
    bucket_id = 'course-materials'
    AND (owner = auth.uid() OR public.has_role('admin'))
);

