-- Migration: 20261108000004_fix_delete_course_rpc_and_cleanup_test_data.sql
-- Description: Create delete_mentor_course RPC with security definer and clean up duplicate courses generated during automated test runs.

-- 1. Create delete_mentor_course RPC
CREATE OR REPLACE FUNCTION public.delete_mentor_course(
    p_course_id uuid,
    p_mentor_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id uuid := auth.uid();
    v_course_mentor_id uuid;
    v_is_authorized boolean := false;
BEGIN
    SELECT mentor_id INTO v_course_mentor_id
    FROM public.courses
    WHERE id = p_course_id;

    IF v_course_mentor_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Course not found');
    END IF;

    -- Authorized if caller is course mentor, caller is demo mentor, or p_mentor_id matches course mentor
    IF v_caller_id IS NOT NULL AND v_caller_id = v_course_mentor_id THEN
        v_is_authorized := true;
    ELSIF v_course_mentor_id = 'd1e00000-0000-4000-a000-000000000101'::uuid THEN
        v_is_authorized := true;
    ELSIF p_mentor_id IS NOT NULL AND (p_mentor_id = v_course_mentor_id OR p_mentor_id = 'd1e00000-0000-4000-a000-000000000101'::uuid) THEN
        v_is_authorized := true;
    ELSIF public.auth_is_admin() THEN
        v_is_authorized := true;
    END IF;

    IF NOT v_is_authorized THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized to delete this course');
    END IF;

    -- Delete child records explicitly
    DELETE FROM public.course_materials WHERE course_id = p_course_id;
    DELETE FROM public.curriculum_proposals WHERE course_id = p_course_id;
    DELETE FROM public.course_sections WHERE course_id = p_course_id;
    DELETE FROM public.course_enrollments WHERE course_id = p_course_id;
    DELETE FROM public.course_unenrollment_requests WHERE course_id = p_course_id;
    DELETE FROM public.notifications WHERE course_id = p_course_id;

    -- Delete course
    DELETE FROM public.courses WHERE id = p_course_id;

    RETURN jsonb_build_object('success', true, 'deleted_id', p_course_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_mentor_course(uuid, uuid) TO anon, authenticated, service_role;

-- 2. Clean up duplicate courses generated during automated test runs
DELETE FROM public.courses 
WHERE mentor_id = 'd1e00000-0000-4000-a000-000000000101'::uuid
  AND id NOT IN (
    '90199c93-f2e6-4a99-b923-4873a11f0216'::uuid,
    'aa8e9f30-87df-45d9-91a1-cf2f5f561479'::uuid,
    '716f376d-ab86-4220-9e58-f2b9c0d539b7'::uuid
  )
  AND title IN (
    'Introduction to Robotics',
    'Custom Robotics Workshop',
    'Autonomous Mobile Navigation 2026',
    'Autonomous Mobile Robotics & PID Tuning',
    'Autonomous Mobile Robotics',
    'Embedded Sensor Integration',
    'PLC & Automation Lab',
    'Updated Advanced Robotics'
  );

