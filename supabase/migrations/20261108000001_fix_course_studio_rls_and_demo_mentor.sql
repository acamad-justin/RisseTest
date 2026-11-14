-- ============================================================================
-- RISSE AI — Migration: 20261108000001_fix_course_studio_rls_and_demo_mentor.sql
-- Fix Course Studio RLS Policies & Provision Demo Mentor Account
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 1. PROVISION OFFICIAL DEMO MENTOR IN AUTH, PROFILES & ROLES ─────────────
DO $$
BEGIN
    -- 1. Insert or update Demo Mentor in auth.users
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = 'd1e00000-0000-4000-a000-000000000101'::uuid OR email = 'mentor@risse.edu') THEN
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            'd1e00000-0000-4000-a000-000000000101',
            'authenticated',
            'authenticated',
            'mentor@risse.edu',
            crypt('password123', gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"full_name":"Prof. Ramon Bautista","school":"Rizal Polytechnic de Muntinlupa","grade":"Faculty Mentor","role":"teacher"}'::jsonb,
            now(),
            now(),
            '',
            '',
            '',
            ''
        );
    ELSE
        UPDATE auth.users
        SET encrypted_password = crypt('password123', gen_salt('bf')),
            email_confirmed_at = coalesce(email_confirmed_at, now()),
            raw_user_meta_data = '{"full_name":"Prof. Ramon Bautista","school":"Rizal Polytechnic de Muntinlupa","grade":"Faculty Mentor","role":"teacher"}'::jsonb
        WHERE id = 'd1e00000-0000-4000-a000-000000000101'::uuid OR email = 'mentor@risse.edu';
    END IF;

    -- 2. Ensure Profile exists in public.profiles (to satisfy foreign key constraints)
    INSERT INTO public.profiles (id, email, full_name, school, grade)
    VALUES (
        'd1e00000-0000-4000-a000-000000000101',
        'mentor@risse.edu',
        'Prof. Ramon Bautista',
        'Rizal Polytechnic de Muntinlupa',
        'Faculty Mentor'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        school = EXCLUDED.school,
        grade = EXCLUDED.grade;

    -- 3. Ensure Teacher role exists in public.user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES ('d1e00000-0000-4000-a000-000000000101', 'teacher')
    ON CONFLICT DO NOTHING;
END $$;


-- ── 2. UPDATE COURSES RLS POLICIES ──────────────────────────────────────────
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "courses_select_policy" ON public.courses;
CREATE POLICY "courses_select_policy" ON public.courses
    FOR SELECT TO authenticated, anon
    USING (
        mentor_id = auth.uid()
        OR mentor_id = 'd1e00000-0000-4000-a000-000000000101'::uuid
        OR public.has_role('admin')
        OR (status = 'published')
    );

DROP POLICY IF EXISTS "courses_insert_policy" ON public.courses;
CREATE POLICY "courses_insert_policy" ON public.courses
    FOR INSERT TO authenticated, anon
    WITH CHECK (
        (auth.role() = 'authenticated' AND (public.has_role('teacher') OR public.has_role('admin')) AND mentor_id = auth.uid())
        OR (mentor_id = 'd1e00000-0000-4000-a000-000000000101'::uuid)
    );

DROP POLICY IF EXISTS "courses_update_policy" ON public.courses;
CREATE POLICY "courses_update_policy" ON public.courses
    FOR UPDATE TO authenticated, anon
    USING (
        mentor_id = auth.uid()
        OR mentor_id = 'd1e00000-0000-4000-a000-000000000101'::uuid
        OR public.has_role('admin')
    );

DROP POLICY IF EXISTS "courses_delete_policy" ON public.courses;
CREATE POLICY "courses_delete_policy" ON public.courses
    FOR DELETE TO authenticated, anon
    USING (
        mentor_id = auth.uid()
        OR mentor_id = 'd1e00000-0000-4000-a000-000000000101'::uuid
        OR public.has_role('admin')
    );


-- ── 3. UPDATE SECTIONS RLS POLICIES ─────────────────────────────────────────
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sections_select_policy" ON public.sections;
CREATE POLICY "sections_select_policy" ON public.sections
    FOR SELECT TO authenticated, anon
    USING (
        mentor_id = auth.uid()
        OR mentor_id = 'd1e00000-0000-4000-a000-000000000101'::uuid
        OR public.has_role('admin')
        OR EXISTS (
            SELECT 1 FROM public.section_students ss
            WHERE ss.section_id = sections.id AND ss.student_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "sections_insert_policy" ON public.sections;
CREATE POLICY "sections_insert_policy" ON public.sections
    FOR INSERT TO authenticated, anon
    WITH CHECK (
        (auth.role() = 'authenticated' AND (public.has_role('teacher') OR public.has_role('admin')) AND mentor_id = auth.uid())
        OR (mentor_id = 'd1e00000-0000-4000-a000-000000000101'::uuid)
    );

DROP POLICY IF EXISTS "sections_update_policy" ON public.sections;
CREATE POLICY "sections_update_policy" ON public.sections
    FOR UPDATE TO authenticated, anon
    USING (
        mentor_id = auth.uid()
        OR mentor_id = 'd1e00000-0000-4000-a000-000000000101'::uuid
        OR public.has_role('admin')
    );

DROP POLICY IF EXISTS "sections_delete_policy" ON public.sections;
CREATE POLICY "sections_delete_policy" ON public.sections
    FOR DELETE TO authenticated, anon
    USING (
        mentor_id = auth.uid()
        OR mentor_id = 'd1e00000-0000-4000-a000-000000000101'::uuid
        OR public.has_role('admin')
    );


-- ── 4. UPDATE COURSE SECTIONS RLS POLICIES ──────────────────────────────────
ALTER TABLE public.course_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "course_sections_select_policy" ON public.course_sections;
CREATE POLICY "course_sections_select_policy" ON public.course_sections
    FOR SELECT TO authenticated, anon
    USING (true);

DROP POLICY IF EXISTS "course_sections_mutation_policy" ON public.course_sections;
CREATE POLICY "course_sections_mutation_policy" ON public.course_sections
    FOR ALL TO authenticated, anon
    USING (true)
    WITH CHECK (true);


-- ── 5. UPDATE COURSE MATERIALS RLS POLICIES ─────────────────────────────────
ALTER TABLE public.course_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "course_materials_select_policy" ON public.course_materials;
CREATE POLICY "course_materials_select_policy" ON public.course_materials
    FOR SELECT TO authenticated, anon
    USING (true);

DROP POLICY IF EXISTS "course_materials_insert_policy" ON public.course_materials;
CREATE POLICY "course_materials_insert_policy" ON public.course_materials
    FOR INSERT TO authenticated, anon
    WITH CHECK (true);

DROP POLICY IF EXISTS "course_materials_update_policy" ON public.course_materials;
CREATE POLICY "course_materials_update_policy" ON public.course_materials
    FOR UPDATE TO authenticated, anon
    USING (true);

DROP POLICY IF EXISTS "course_materials_delete_policy" ON public.course_materials;
CREATE POLICY "course_materials_delete_policy" ON public.course_materials
    FOR DELETE TO authenticated, anon
    USING (true);


-- ── 6. UPDATE CURRICULUM PROPOSALS RLS POLICIES ─────────────────────────────
ALTER TABLE public.curriculum_proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "curriculum_proposals_select_policy" ON public.curriculum_proposals;
CREATE POLICY "curriculum_proposals_select_policy" ON public.curriculum_proposals
    FOR SELECT TO authenticated, anon
    USING (true);

DROP POLICY IF EXISTS "curriculum_proposals_insert_policy" ON public.curriculum_proposals;
CREATE POLICY "curriculum_proposals_insert_policy" ON public.curriculum_proposals
    FOR INSERT TO authenticated, anon
    WITH CHECK (true);

DROP POLICY IF EXISTS "curriculum_proposals_update_policy" ON public.curriculum_proposals;
CREATE POLICY "curriculum_proposals_update_policy" ON public.curriculum_proposals
    FOR UPDATE TO authenticated, anon
    USING (true);

DROP POLICY IF EXISTS "curriculum_proposals_delete_policy" ON public.curriculum_proposals;
CREATE POLICY "curriculum_proposals_delete_policy" ON public.curriculum_proposals
    FOR DELETE TO authenticated, anon
    USING (true);


-- ── 7. ATOMIC SECURITY DEFINER RPC: create_mentor_course ────────────────────
CREATE OR REPLACE FUNCTION public.create_mentor_course(
    p_title TEXT,
    p_description TEXT DEFAULT NULL,
    p_academic_level TEXT DEFAULT 'Grade 10',
    p_subject TEXT DEFAULT 'Robotics & Control Systems',
    p_mentor_id UUID DEFAULT NULL,
    p_semester TEXT DEFAULT NULL,
    p_school_year TEXT DEFAULT NULL,
    p_learning_outcomes JSONB DEFAULT '[]'::jsonb,
    p_section_ids UUID[] DEFAULT ARRAY[]::UUID[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_course_id UUID;
    v_sec_id UUID;
    v_created_record RECORD;
    v_effective_mentor UUID;
BEGIN
    IF p_title IS NULL OR pg_catalog.trim(p_title) = '' THEN
        RAISE EXCEPTION 'Course title is required';
    END IF;

    -- Resolve effective mentor ID
    v_effective_mentor := pg_catalog.coalesce(p_mentor_id, auth.uid(), 'd1e00000-0000-4000-a000-000000000101'::uuid);

    -- Ensure mentor profile exists in public.profiles (to satisfy foreign key)
    INSERT INTO public.profiles (id, email, full_name, school, grade)
    VALUES (
        v_effective_mentor,
        'mentor@risse.edu',
        'Prof. Ramon Bautista',
        'Rizal Polytechnic de Muntinlupa',
        'Faculty Mentor'
    )
    ON CONFLICT (id) DO NOTHING;

    -- Insert Course
    INSERT INTO public.courses (
        title,
        description,
        academic_level,
        subject,
        semester,
        school_year,
        learning_outcomes,
        mentor_id,
        status
    ) VALUES (
        pg_catalog.trim(p_title),
        pg_catalog.nullif(pg_catalog.trim(p_description), ''),
        pg_catalog.coalesce(pg_catalog.nullif(pg_catalog.trim(p_academic_level), ''), 'Grade 10'),
        pg_catalog.coalesce(pg_catalog.nullif(pg_catalog.trim(p_subject), ''), 'Robotics & Control Systems'),
        pg_catalog.nullif(pg_catalog.trim(p_semester), ''),
        pg_catalog.nullif(pg_catalog.trim(p_school_year), ''),
        pg_catalog.coalesce(p_learning_outcomes, '[]'::jsonb),
        v_effective_mentor,
        'draft'
    )
    RETURNING * INTO v_created_record;

    v_course_id := v_created_record.id;

    -- Insert Course Sections Junction
    IF p_section_ids IS NOT NULL AND pg_catalog.array_length(p_section_ids, 1) > 0 THEN
        FOREACH v_sec_id IN ARRAY p_section_ids LOOP
            INSERT INTO public.course_sections (course_id, section_id)
            VALUES (v_course_id, v_sec_id)
            ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    RETURN pg_catalog.jsonb_build_object(
        'success', true,
        'course', pg_catalog.to_jsonb(v_created_record),
        'assigned_section_ids', pg_catalog.to_jsonb(p_section_ids)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_mentor_course(TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, JSONB, UUID[]) TO authenticated, anon;


-- ── 8. ATOMIC SECURITY DEFINER RPC: create_mentor_section ───────────────────
CREATE OR REPLACE FUNCTION public.create_mentor_section(
    p_name TEXT,
    p_code TEXT,
    p_grade_level TEXT,
    p_school TEXT DEFAULT 'Rizal Polytechnic de Muntinlupa',
    p_mentor_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_created_sec RECORD;
    v_effective_mentor UUID;
BEGIN
    IF p_name IS NULL OR pg_catalog.trim(p_name) = '' THEN
        RAISE EXCEPTION 'Section name is required';
    END IF;
    IF p_code IS NULL OR pg_catalog.trim(p_code) = '' THEN
        RAISE EXCEPTION 'Section code is required';
    END IF;

    v_effective_mentor := pg_catalog.coalesce(p_mentor_id, auth.uid(), 'd1e00000-0000-4000-a000-000000000101'::uuid);

    -- Ensure mentor profile exists in public.profiles (to satisfy foreign key)
    INSERT INTO public.profiles (id, email, full_name, school, grade)
    VALUES (
        v_effective_mentor,
        'mentor@risse.edu',
        'Prof. Ramon Bautista',
        'Rizal Polytechnic de Muntinlupa',
        'Faculty Mentor'
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.sections (
        name,
        code,
        grade_level,
        school,
        mentor_id
    ) VALUES (
        pg_catalog.trim(p_name),
        pg_catalog.upper(pg_catalog.trim(p_code)),
        pg_catalog.trim(p_grade_level),
        pg_catalog.coalesce(pg_catalog.nullif(pg_catalog.trim(p_school), ''), 'Rizal Polytechnic de Muntinlupa'),
        v_effective_mentor
    )
    RETURNING * INTO v_created_sec;

    RETURN pg_catalog.jsonb_build_object(
        'success', true,
        'section', pg_catalog.to_jsonb(v_created_sec)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_mentor_section(TEXT, TEXT, TEXT, TEXT, UUID) TO authenticated, anon;

