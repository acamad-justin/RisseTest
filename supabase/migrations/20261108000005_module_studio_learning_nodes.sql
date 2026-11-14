-- ═══════════════════════════════════════════════════════════════════════════
-- RISSE AI — MODULE STUDIO & LEARNING NODES TRANSFORMATION
-- Migration: 20261108000005_module_studio_learning_nodes.sql
-- Description:
--   Transforms the course/curriculum schema into a Module -> Learning Nodes
--   hierarchy. Provides clean database views, publication RPCs, and
--   cascade deletion for teacher-managed learning modules.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Create Views for Module terminology abstraction
CREATE OR REPLACE VIEW public.mentor_modules AS
SELECT 
    id,
    mentor_id,
    title,
    description,
    subject,
    academic_level,
    status,
    enrollment_type,
    created_at,
    updated_at
FROM public.courses;

CREATE OR REPLACE VIEW public.module_sections AS
SELECT 
    id,
    course_id AS module_id,
    section_id,
    created_at
FROM public.course_sections;

CREATE OR REPLACE VIEW public.module_materials AS
SELECT 
    id,
    course_id AS module_id,
    title,
    file_name,
    storage_path,
    mime_type,
    file_size_bytes,
    extracted_content,
    processing_status,
    created_at,
    updated_at
FROM public.course_materials;

CREATE OR REPLACE VIEW public.module_drafts AS
SELECT 
    id,
    course_id AS module_id,
    created_by AS mentor_id,
    status,
    proposal_data AS draft_data,
    created_at,
    updated_at
FROM public.curriculum_proposals;

-- 2. Grant access to authenticated users
GRANT SELECT ON public.mentor_modules TO authenticated, service_role, anon;
GRANT SELECT ON public.module_sections TO authenticated, service_role, anon;
GRANT SELECT ON public.module_materials TO authenticated, service_role, anon;
GRANT SELECT ON public.module_drafts TO authenticated, service_role, anon;

-- 3. Stored RPC: publish_module
CREATE OR REPLACE FUNCTION public.publish_module(p_module_id UUID, p_mentor_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_module RECORD;
BEGIN
    SELECT * INTO v_module FROM public.courses WHERE id = p_module_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Module not found');
    END IF;

    IF v_module.mentor_id != p_mentor_id AND p_mentor_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized to publish module');
    END IF;

    -- Update module status to published
    UPDATE public.courses
    SET status = 'published', updated_at = NOW()
    WHERE id = p_module_id;

    -- Update module draft status to published
    UPDATE public.curriculum_proposals
    SET status = 'published', updated_at = NOW()
    WHERE course_id = p_module_id;

    RETURN jsonb_build_object(
        'success', true,
        'module_id', p_module_id,
        'status', 'published'
    );
END;
$$;

-- 4. Stored RPC: delete_module
CREATE OR REPLACE FUNCTION public.delete_module(p_module_id UUID, p_mentor_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_module RECORD;
BEGIN
    SELECT * INTO v_module FROM public.courses WHERE id = p_module_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Module not found');
    END IF;

    IF v_module.mentor_id != p_mentor_id AND p_mentor_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized to delete module');
    END IF;

    -- Delete cascading records
    DELETE FROM public.curriculum_proposals WHERE course_id = p_module_id;
    DELETE FROM public.course_materials WHERE course_id = p_module_id;
    DELETE FROM public.course_sections WHERE course_id = p_module_id;
    DELETE FROM public.course_enrollments WHERE course_id = p_module_id;
    DELETE FROM public.course_unenrollment_requests WHERE course_id = p_module_id;
    DELETE FROM public.courses WHERE id = p_module_id;

    RETURN jsonb_build_object('success', true, 'deleted_id', p_module_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.publish_module(UUID, UUID) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.delete_module(UUID, UUID) TO authenticated, service_role, anon;

