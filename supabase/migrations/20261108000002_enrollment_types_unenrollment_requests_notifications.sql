-- Migration: 20261108000002_enrollment_types_unenrollment_requests_notifications.sql
-- Description: Adds course enrollment types (curriculum, self_paced), direct course_enrollments,
-- course_unenrollment_requests for teacher-controlled curriculum unenrollment, and persistent notifications.

-- 1. Add enrollment_type to courses
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS enrollment_type text NOT NULL DEFAULT 'curriculum' 
CHECK (enrollment_type IN ('self_paced', 'curriculum'));

-- 2. Create course_enrollments (Direct student-course enrollments, self-paced)
CREATE TABLE IF NOT EXISTS public.course_enrollments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    enrollment_type text NOT NULL DEFAULT 'self_paced' CHECK (enrollment_type IN ('self_paced', 'teacher_assigned')),
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unrolled', 'completed', 'dropped')),
    enrolled_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (course_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_course_enrollments_student ON public.course_enrollments(student_id, status);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course ON public.course_enrollments(course_id, status);

-- 3. Create course_unenrollment_requests (For curriculum approval workflow)
CREATE TABLE IF NOT EXISTS public.course_unenrollment_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    section_id uuid REFERENCES public.sections(id) ON DELETE SET NULL,
    mentor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reason text,
    review_notes text,
    requested_at timestamptz NOT NULL DEFAULT now(),
    reviewed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_unenroll_requests_mentor ON public.course_unenrollment_requests(mentor_id, status);
CREATE INDEX IF NOT EXISTS idx_unenroll_requests_student ON public.course_unenrollment_requests(student_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_unenrollment 
ON public.course_unenrollment_requests(course_id, student_id) 
WHERE status = 'pending';

-- 4. Create notifications (Persistent notifications for students & mentors)
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    type text NOT NULL CHECK (type IN ('unenrollment_request', 'unenrollment_approved', 'unenrollment_rejected', 'course_enrollment', 'general')),
    title text NOT NULL,
    message text NOT NULL,
    course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
    section_id uuid REFERENCES public.sections(id) ON DELETE SET NULL,
    reference_id uuid,
    is_read boolean NOT NULL DEFAULT false,
    read_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id, is_read, created_at DESC);

-- 5. Row-Level Security (RLS) & Permissions
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_unenrollment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_enrollments TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_unenrollment_requests TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated, anon;

-- course_enrollments policies
CREATE POLICY "course_enrollments_select_policy" ON public.course_enrollments
    FOR SELECT TO authenticated, anon
    USING (
        student_id = auth.uid() 
        OR student_id = '19e54c4f-d062-42b0-8b08-fc88a7afdbb3'::uuid
        OR student_id = '3e81050f-95b9-4753-978c-5c17e4224b8e'::uuid
        OR EXISTS (
            SELECT 1 FROM public.courses c 
            WHERE c.id = course_id 
              AND (c.mentor_id = auth.uid() OR c.mentor_id = 'd1e00000-0000-4000-a000-000000000101'::uuid)
        )
        OR has_role('admin')
    );

CREATE POLICY "course_enrollments_insert_policy" ON public.course_enrollments
    FOR INSERT TO authenticated, anon
    WITH CHECK (
        (student_id = auth.uid() AND enrollment_type = 'self_paced')
        OR student_id = '19e54c4f-d062-42b0-8b08-fc88a7afdbb3'::uuid
        OR student_id = '3e81050f-95b9-4753-978c-5c17e4224b8e'::uuid
        OR EXISTS (
            SELECT 1 FROM public.courses c 
            WHERE c.id = course_id 
              AND (c.mentor_id = auth.uid() OR c.mentor_id = 'd1e00000-0000-4000-a000-000000000101'::uuid)
        )
        OR has_role('admin')
    );

CREATE POLICY "course_enrollments_update_policy" ON public.course_enrollments
    FOR UPDATE TO authenticated, anon
    USING (
        student_id = auth.uid() 
        OR student_id = '19e54c4f-d062-42b0-8b08-fc88a7afdbb3'::uuid
        OR student_id = '3e81050f-95b9-4753-978c-5c17e4224b8e'::uuid
        OR EXISTS (
            SELECT 1 FROM public.courses c 
            WHERE c.id = course_id 
              AND (c.mentor_id = auth.uid() OR c.mentor_id = 'd1e00000-0000-4000-a000-000000000101'::uuid)
        )
        OR has_role('admin')
    );

CREATE POLICY "course_enrollments_delete_policy" ON public.course_enrollments
    FOR DELETE TO authenticated, anon
    USING (
        student_id = auth.uid() 
        OR student_id = '19e54c4f-d062-42b0-8b08-fc88a7afdbb3'::uuid
        OR student_id = '3e81050f-95b9-4753-978c-5c17e4224b8e'::uuid
        OR EXISTS (
            SELECT 1 FROM public.courses c 
            WHERE c.id = course_id 
              AND (c.mentor_id = auth.uid() OR c.mentor_id = 'd1e00000-0000-4000-a000-000000000101'::uuid)
        )
        OR has_role('admin')
    );

-- course_unenrollment_requests policies
CREATE POLICY "unenroll_requests_select_policy" ON public.course_unenrollment_requests
    FOR SELECT TO authenticated, anon
    USING (
        student_id = auth.uid()
        OR student_id = '19e54c4f-d062-42b0-8b08-fc88a7afdbb3'::uuid
        OR student_id = '3e81050f-95b9-4753-978c-5c17e4224b8e'::uuid
        OR mentor_id = auth.uid()
        OR mentor_id = 'd1e00000-0000-4000-a000-000000000101'::uuid
        OR has_role('admin')
    );

CREATE POLICY "unenroll_requests_insert_policy" ON public.course_unenrollment_requests
    FOR INSERT TO authenticated, anon
    WITH CHECK (
        (student_id = auth.uid() AND status = 'pending')
        OR student_id = '19e54c4f-d062-42b0-8b08-fc88a7afdbb3'::uuid
        OR student_id = '3e81050f-95b9-4753-978c-5c17e4224b8e'::uuid
        OR has_role('admin')
    );

CREATE POLICY "unenroll_requests_update_policy" ON public.course_unenrollment_requests
    FOR UPDATE TO authenticated, anon
    USING (
        mentor_id = auth.uid()
        OR mentor_id = 'd1e00000-0000-4000-a000-000000000101'::uuid
        OR has_role('admin')
    );

-- notifications policies
CREATE POLICY "notifications_select_policy" ON public.notifications
    FOR SELECT TO authenticated, anon
    USING (
        recipient_id = auth.uid()
        OR recipient_id = '19e54c4f-d062-42b0-8b08-fc88a7afdbb3'::uuid
        OR recipient_id = '3e81050f-95b9-4753-978c-5c17e4224b8e'::uuid
        OR recipient_id = 'd1e00000-0000-4000-a000-000000000101'::uuid
        OR has_role('admin')
    );

CREATE POLICY "notifications_insert_policy" ON public.notifications
    FOR INSERT TO authenticated, anon
    WITH CHECK (true);

CREATE POLICY "notifications_update_policy" ON public.notifications
    FOR UPDATE TO authenticated, anon
    USING (
        recipient_id = auth.uid()
        OR recipient_id = '19e54c4f-d062-42b0-8b08-fc88a7afdbb3'::uuid
        OR recipient_id = '3e81050f-95b9-4753-978c-5c17e4224b8e'::uuid
        OR recipient_id = 'd1e00000-0000-4000-a000-000000000101'::uuid
        OR has_role('admin')
    );

-- 6. Atomic Security Definer RPC for reviewing unenrollment requests
CREATE OR REPLACE FUNCTION public.review_unenrollment_request(
    p_request_id uuid,
    p_action text,
    p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_req record;
    v_student_name text;
    v_course_title text;
BEGIN
    IF p_action NOT IN ('approved', 'rejected') THEN
        RAISE EXCEPTION 'Invalid action: must be approved or rejected';
    END IF;

    SELECT r.*, c.title as course_title, p.full_name as student_name
    INTO v_req
    FROM public.course_unenrollment_requests r
    JOIN public.courses c ON c.id = r.course_id
    JOIN public.profiles p ON p.id = r.student_id
    WHERE r.id = p_request_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Unenrollment request not found';
    END IF;

    IF v_req.status != 'pending' THEN
        RAISE EXCEPTION 'Request has already been processed with status %', v_req.status;
    END IF;

    -- Update request status
    UPDATE public.course_unenrollment_requests
    SET status = p_action,
        review_notes = p_notes,
        reviewed_at = now(),
        updated_at = now()
    WHERE id = p_request_id;

    IF p_action = 'approved' THEN
        -- If section-based, deactivate enrollment in section_students
        IF v_req.section_id IS NOT NULL THEN
            UPDATE public.section_students
            SET status = 'dropped'
            WHERE section_id = v_req.section_id AND student_id = v_req.student_id;
        END IF;

        -- Also deactivate direct course enrollment if any
        UPDATE public.course_enrollments
        SET status = 'dropped', updated_at = now()
        WHERE course_id = v_req.course_id AND student_id = v_req.student_id;

        -- Create notification for student
        INSERT INTO public.notifications (
            recipient_id,
            actor_id,
            type,
            title,
            message,
            course_id,
            section_id,
            reference_id
        ) VALUES (
            v_req.student_id,
            v_req.mentor_id,
            'unenrollment_approved',
            'Unenrollment Approved',
            'Your request to unenroll from "' || v_req.course_title || '" was approved by your instructor.',
            v_req.course_id,
            v_req.section_id,
            p_request_id
        );
    ELSE
        -- Rejection: create notification for student
        INSERT INTO public.notifications (
            recipient_id,
            actor_id,
            type,
            title,
            message,
            course_id,
            section_id,
            reference_id
        ) VALUES (
            v_req.student_id,
            v_req.mentor_id,
            'unenrollment_rejected',
            'Unenrollment Request Declined',
            'Your request to unenroll from "' || v_req.course_title || '" was declined' || 
            CASE WHEN p_notes IS NOT NULL AND length(trim(p_notes)) > 0 THEN ': ' || trim(p_notes) ELSE '.' END,
            v_req.course_id,
            v_req.section_id,
            p_request_id
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'request_id', p_request_id,
        'status', p_action
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.review_unenrollment_request(uuid, text, text) TO authenticated, anon;

