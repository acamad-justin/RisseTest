-- ==============================================================================
-- RISSE AI — Migration: Fix RLS Infinite Recursion & Mutual Dependencies
-- File: supabase/migrations/20261107000003_fix_rls_infinite_recursion.sql
-- ==============================================================================
--
-- Forensic Diagnosis:
-- Mutual recursion previously occurred between courses <-> course_sections and
-- sections <-> section_students because the RLS policy on Table A queried Table B,
-- whose RLS policy in turn queried Table A.
--
-- Solution:
-- Define SECURITY DEFINER lookup functions that execute with table-owner privileges,
-- bypassing recursive RLS checks on inner subqueries while strictly preserving
-- multi-tenant role isolation.
-- ==============================================================================

-- ── 1. SECURITY DEFINER Helper Functions ─────────────────────────────────────

CREATE OR REPLACE FUNCTION public.check_is_section_mentor(p_section_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.sections
        WHERE id = p_section_id AND mentor_id = p_user_id
    );
$$;

CREATE OR REPLACE FUNCTION public.check_is_section_student(p_section_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.section_students
        WHERE section_id = p_section_id AND student_id = p_user_id
    );
$$;

CREATE OR REPLACE FUNCTION public.check_is_course_mentor(p_course_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.courses
        WHERE id = p_course_id AND mentor_id = p_user_id
    );
$$;

CREATE OR REPLACE FUNCTION public.check_is_student_in_course(p_course_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.course_sections cs
        JOIN public.section_students ss ON cs.section_id = ss.section_id
        WHERE cs.course_id = p_course_id AND ss.student_id = p_user_id
    );
$$;

GRANT EXECUTE ON FUNCTION public.check_is_section_mentor(UUID, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.check_is_section_student(UUID, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.check_is_course_mentor(UUID, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.check_is_student_in_course(UUID, UUID) TO authenticated, anon;

-- ── 2. Sections RLS (Non-recursive) ──────────────────────────────────────────

DROP POLICY IF EXISTS "sections_select_policy" ON public.sections;
CREATE POLICY "sections_select_policy" ON public.sections
    FOR SELECT TO authenticated
    USING (
        mentor_id = auth.uid()
        OR public.has_role('admin')
        OR public.check_is_section_student(id, auth.uid())
    );

DROP POLICY IF EXISTS "sections_insert_policy" ON public.sections;
CREATE POLICY "sections_insert_policy" ON public.sections
    FOR INSERT TO authenticated
    WITH CHECK (
        public.has_role('admin')
        OR (public.has_role('teacher') AND mentor_id = auth.uid())
    );

DROP POLICY IF EXISTS "sections_update_policy" ON public.sections;
CREATE POLICY "sections_update_policy" ON public.sections
    FOR UPDATE TO authenticated
    USING (
        public.has_role('admin')
        OR (public.has_role('teacher') AND mentor_id = auth.uid())
    );

DROP POLICY IF EXISTS "sections_delete_policy" ON public.sections;
CREATE POLICY "sections_delete_policy" ON public.sections
    FOR DELETE TO authenticated
    USING (
        public.has_role('admin')
        OR (public.has_role('teacher') AND mentor_id = auth.uid())
    );

-- ── 3. Section Students RLS (Non-recursive) ──────────────────────────────────

DROP POLICY IF EXISTS "section_students_select_policy" ON public.section_students;
CREATE POLICY "section_students_select_policy" ON public.section_students
    FOR SELECT TO authenticated
    USING (
        student_id = auth.uid()
        OR public.has_role('admin')
        OR public.check_is_section_mentor(section_id, auth.uid())
    );

DROP POLICY IF EXISTS "section_students_admin_mutation" ON public.section_students;
CREATE POLICY "section_students_admin_mutation" ON public.section_students
    FOR ALL TO authenticated
    USING (
        public.has_role('admin')
        OR (public.has_role('teacher') AND public.check_is_section_mentor(section_id, auth.uid()))
    )
    WITH CHECK (
        public.has_role('admin')
        OR (public.has_role('teacher') AND public.check_is_section_mentor(section_id, auth.uid()))
    );

-- ── 4. Courses RLS (Non-recursive) ───────────────────────────────────────────

DROP POLICY IF EXISTS "courses_select_policy" ON public.courses;
CREATE POLICY "courses_select_policy" ON public.courses
    FOR SELECT TO authenticated
    USING (
        mentor_id = auth.uid()
        OR public.has_role('admin')
        OR (status = 'published' AND public.check_is_student_in_course(id, auth.uid()))
    );

DROP POLICY IF EXISTS "courses_insert_policy" ON public.courses;
CREATE POLICY "courses_insert_policy" ON public.courses
    FOR INSERT TO authenticated
    WITH CHECK (
        mentor_id = auth.uid()
        AND (public.has_role('teacher') OR public.has_role('admin'))
    );

DROP POLICY IF EXISTS "courses_update_policy" ON public.courses;
CREATE POLICY "courses_update_policy" ON public.courses
    FOR UPDATE TO authenticated
    USING (mentor_id = auth.uid() OR public.has_role('admin'));

DROP POLICY IF EXISTS "courses_delete_policy" ON public.courses;
CREATE POLICY "courses_delete_policy" ON public.courses
    FOR DELETE TO authenticated
    USING (mentor_id = auth.uid() OR public.has_role('admin'));

-- ── 5. Course Sections RLS (Non-recursive) ───────────────────────────────────

DROP POLICY IF EXISTS "course_sections_select_policy" ON public.course_sections;
CREATE POLICY "course_sections_select_policy" ON public.course_sections
    FOR SELECT TO authenticated
    USING (
        public.has_role('admin')
        OR public.check_is_course_mentor(course_id, auth.uid())
        OR public.check_is_section_student(section_id, auth.uid())
    );

DROP POLICY IF EXISTS "course_sections_mutation_policy" ON public.course_sections;
CREATE POLICY "course_sections_mutation_policy" ON public.course_sections
    FOR ALL TO authenticated
    USING (
        public.has_role('admin')
        OR public.check_is_course_mentor(course_id, auth.uid())
    )
    WITH CHECK (
        public.has_role('admin')
        OR public.check_is_course_mentor(course_id, auth.uid())
    );

