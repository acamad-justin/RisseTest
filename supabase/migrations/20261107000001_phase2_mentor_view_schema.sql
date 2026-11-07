-- ============================================================================
-- RISSE AI PHASE 2 — MENTOR WORKSPACE & TEACHER STUDIO SCHEMA
-- Migration: 20261107000001_phase2_mentor_view_schema.sql
-- 
-- Covers:
-- 1. Section & Student Rosters (sections, section_students)
-- 2. Course Management (courses, course_sections)
-- 3. Private Learning Materials (course_materials, mentor_module_uploads)
-- 4. Curriculum Transformation & Review Studio (curriculum_proposals)
-- 5. Star Chart Governance & Audit Trail (student_star_awards, star_chart_audit_events)
-- 6. Fail-Closed Row Level Security (RLS) & Atomic Verification Gates
-- ============================================================================

-- ── 1. Sections / Classes Table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    grade_level TEXT NOT NULL DEFAULT 'Grade 10',
    school TEXT NOT NULL DEFAULT 'Rizal Polytechnic de Muntinlupa',
    mentor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sections_mentor_id ON public.sections(mentor_id);
CREATE INDEX IF NOT EXISTS idx_sections_code ON public.sections(code);

-- ── 2. Section Enrollments (Student Roster) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.section_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'transferred')),
    CONSTRAINT uq_section_student UNIQUE(section_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_section_students_section ON public.section_students(section_id);
CREATE INDEX IF NOT EXISTS idx_section_students_student ON public.section_students(student_id);

-- ── 3. Courses Table (Central Teaching Entity) ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    academic_level TEXT NOT NULL DEFAULT 'Grade 10',
    subject TEXT NOT NULL DEFAULT 'Robotics & Control Systems',
    semester TEXT,
    school_year TEXT,
    learning_outcomes TEXT[] NOT NULL DEFAULT '{}',
    mentor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_courses_mentor_id ON public.courses(mentor_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);

-- ── 4. Course Sections (Multi-Section Course Assignment) ────────────────────
CREATE TABLE IF NOT EXISTS public.course_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_course_section UNIQUE(course_id, section_id)
);

CREATE INDEX IF NOT EXISTS idx_course_sections_course ON public.course_sections(course_id);
CREATE INDEX IF NOT EXISTS idx_course_sections_section ON public.course_sections(section_id);

-- ── 5. Course Materials (Private Supabase Storage Attachments) ──────────────
CREATE TABLE IF NOT EXISTS public.course_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    storage_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size BIGINT NOT NULL CHECK (file_size > 0),
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('uploaded', 'processing', 'ready', 'error')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_course_materials_course ON public.course_materials(course_id);
CREATE INDEX IF NOT EXISTS idx_course_materials_uploader ON public.course_materials(uploaded_by);

-- ── 6. Curriculum Proposals (AI Drafts & Teacher Review Studio) ─────────────
CREATE TABLE IF NOT EXISTS public.curriculum_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    version INT NOT NULL DEFAULT 1,
    proposal_data JSONB NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'under_review', 'approved', 'published')),
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_curriculum_proposals_course ON public.curriculum_proposals(course_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_proposals_creator ON public.curriculum_proposals(created_by);

-- ── 7. Mentor Module Uploads (Legacy Curriculum Module Materials) ───────────
CREATE TABLE IF NOT EXISTS public.mentor_module_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    storage_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size BIGINT NOT NULL CHECK (file_size > 0),
    module_id VARCHAR(32) REFERENCES public.curriculum_modules(id) ON DELETE SET NULL,
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mentor_uploads_module ON public.mentor_module_uploads(module_id);
CREATE INDEX IF NOT EXISTS idx_mentor_uploads_uploader ON public.mentor_module_uploads(uploaded_by);

-- ── 8. Student Star Awards (Star Chart State) ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.student_star_awards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    star_id TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Robotics & Control Systems',
    module_id VARCHAR(32) REFERENCES public.curriculum_modules(id) ON DELETE SET NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    awarded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'awarded' CHECK (status IN ('awarded', 'revoked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_student_star UNIQUE(student_id, star_id)
);

CREATE INDEX IF NOT EXISTS idx_student_star_student ON public.student_star_awards(student_id);
CREATE INDEX IF NOT EXISTS idx_student_star_module ON public.student_star_awards(module_id);
CREATE INDEX IF NOT EXISTS idx_student_star_course ON public.student_star_awards(course_id);

-- ── 9. Star Chart Audit Events (Strict Append-Only) ─────────────────────────
CREATE TABLE IF NOT EXISTS public.star_chart_audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    star_id TEXT NOT NULL,
    mentor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('awarded', 'revoked')),
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_star_audit_student ON public.star_chart_audit_events(student_id);
CREATE INDEX IF NOT EXISTS idx_star_audit_mentor ON public.star_chart_audit_events(mentor_id);
CREATE INDEX IF NOT EXISTS idx_star_audit_created ON public.star_chart_audit_events(created_at);

-- ── 10. Security Functions ──────────────────────────────────────────────────

-- Check if a mentor is authorized for a specific student via assigned section
CREATE OR REPLACE FUNCTION public.is_mentor_for_student(p_mentor_id UUID, p_student_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.section_students ss
        JOIN public.sections s ON s.id = ss.section_id
        WHERE s.mentor_id = p_mentor_id
          AND ss.student_id = p_student_id
          AND ss.status = 'active'
    );
$$;

-- Atomic Star Award / Revoke RPC with mandatory audit event logging
CREATE OR REPLACE FUNCTION public.mentor_award_or_revoke_star(
    p_student_id UUID,
    p_star_id TEXT,
    p_title TEXT,
    p_category TEXT,
    p_module_id VARCHAR(32),
    p_action TEXT,
    p_note TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_caller_id UUID;
    v_is_authorized BOOLEAN;
    v_clean_action TEXT;
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
    END IF;

    -- Validate action
    v_clean_action := lower(trim(p_action));
    IF v_clean_action NOT IN ('awarded', 'revoked') THEN
        RAISE EXCEPTION 'Invalid action: must be awarded or revoked.' USING ERRCODE = '22023';
    END IF;

    IF p_note IS NULL OR trim(p_note) = '' THEN
        RAISE EXCEPTION 'A descriptive note or reason is required for star chart audit history.' USING ERRCODE = '22023';
    END IF;

    -- Verify authorization: Caller must be admin OR the assigned mentor for this student
    v_is_authorized := public.has_role('admin') OR (
        public.has_role('teacher') AND public.is_mentor_for_student(v_caller_id, p_student_id)
    );

    IF NOT v_is_authorized THEN
        RAISE EXCEPTION 'Access denied: You are not authorized to modify Star Charts for this student.' USING ERRCODE = '42501';
    END IF;

    -- Update or Insert into student_star_awards
    IF v_clean_action = 'awarded' THEN
        INSERT INTO public.student_star_awards (
            student_id,
            star_id,
            title,
            category,
            module_id,
            awarded_by,
            status,
            updated_at
        ) VALUES (
            p_student_id,
            p_star_id,
            coalesce(nullif(trim(p_title), ''), 'Achievement Star'),
            coalesce(nullif(trim(p_category), ''), 'Robotics & Control Systems'),
            p_module_id,
            v_caller_id,
            'awarded',
            pg_catalog.now()
        )
        ON CONFLICT (student_id, star_id) DO UPDATE SET
            status = 'awarded',
            title = EXCLUDED.title,
            category = EXCLUDED.category,
            module_id = coalesce(EXCLUDED.module_id, public.student_star_awards.module_id),
            awarded_by = v_caller_id,
            updated_at = pg_catalog.now();
    ELSE
        -- Revoked
        UPDATE public.student_star_awards
        SET status = 'revoked',
            updated_at = pg_catalog.now()
        WHERE student_id = p_student_id
          AND star_id = p_star_id;

        IF NOT FOUND THEN
            INSERT INTO public.student_star_awards (
                student_id,
                star_id,
                title,
                category,
                module_id,
                awarded_by,
                status,
                updated_at
            ) VALUES (
                p_student_id,
                p_star_id,
                coalesce(nullif(trim(p_title), ''), 'Achievement Star'),
                coalesce(nullif(trim(p_category), ''), 'Robotics & Control Systems'),
                p_module_id,
                v_caller_id,
                'revoked',
                pg_catalog.now()
            );
        END IF;
    END IF;

    -- Append mandatory audit event
    -- INVARIANT: Never silently modify student achievements; maintain full audit history.
    -- INVARIANT: Manual stars DO NOT alter concept_mastery_records or mastery_assessment_events.
    INSERT INTO public.star_chart_audit_events (
        student_id,
        star_id,
        mentor_id,
        action,
        note,
        created_at
    ) VALUES (
        p_student_id,
        p_star_id,
        v_caller_id,
        v_clean_action,
        trim(p_note),
        pg_catalog.now()
    );

    RETURN jsonb_build_object(
        'success', true,
        'student_id', p_student_id,
        'star_id', p_star_id,
        'action', v_clean_action,
        'mentor_id', v_caller_id
    );
END;
$$;

-- ── 11. Row Level Security Policies ─────────────────────────────────────────

ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_module_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_star_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.star_chart_audit_events ENABLE ROW LEVEL SECURITY;

-- Sections RLS
DROP POLICY IF EXISTS "sections_select_policy" ON public.sections;
CREATE POLICY "sections_select_policy" ON public.sections
    FOR SELECT TO authenticated
    USING (
        mentor_id = auth.uid()
        OR public.has_role('admin')
        OR EXISTS (
            SELECT 1 FROM public.section_students ss
            WHERE ss.section_id = sections.id AND ss.student_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "sections_insert_policy" ON public.sections;
CREATE POLICY "sections_insert_policy" ON public.sections
    FOR INSERT TO authenticated
    WITH CHECK (public.has_role('admin') OR (public.has_role('teacher') AND mentor_id = auth.uid()));

DROP POLICY IF EXISTS "sections_update_policy" ON public.sections;
CREATE POLICY "sections_update_policy" ON public.sections
    FOR UPDATE TO authenticated
    USING (public.has_role('admin') OR (public.has_role('teacher') AND mentor_id = auth.uid()));

DROP POLICY IF EXISTS "sections_delete_policy" ON public.sections;
CREATE POLICY "sections_delete_policy" ON public.sections
    FOR DELETE TO authenticated
    USING (public.has_role('admin') OR (public.has_role('teacher') AND mentor_id = auth.uid()));

-- Section Students RLS
DROP POLICY IF EXISTS "section_students_select_policy" ON public.section_students;
CREATE POLICY "section_students_select_policy" ON public.section_students
    FOR SELECT TO authenticated
    USING (
        student_id = auth.uid()
        OR public.has_role('admin')
        OR EXISTS (
            SELECT 1 FROM public.sections s
            WHERE s.id = section_students.section_id AND s.mentor_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "section_students_admin_mutation" ON public.section_students;
CREATE POLICY "section_students_admin_mutation" ON public.section_students
    FOR ALL TO authenticated
    USING (public.has_role('admin') OR (public.has_role('teacher') AND EXISTS (
        SELECT 1 FROM public.sections s WHERE s.id = section_students.section_id AND s.mentor_id = auth.uid()
    )))
    WITH CHECK (public.has_role('admin') OR (public.has_role('teacher') AND EXISTS (
        SELECT 1 FROM public.sections s WHERE s.id = section_students.section_id AND s.mentor_id = auth.uid()
    )));

-- Courses RLS
DROP POLICY IF EXISTS "courses_select_policy" ON public.courses;
CREATE POLICY "courses_select_policy" ON public.courses
    FOR SELECT TO authenticated
    USING (
        mentor_id = auth.uid()
        OR public.has_role('admin')
        OR (status = 'published' AND EXISTS (
            SELECT 1 FROM public.course_sections cs
            JOIN public.section_students ss ON cs.section_id = ss.section_id
            WHERE cs.course_id = courses.id AND ss.student_id = auth.uid()
        ))
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

-- Course Sections RLS
DROP POLICY IF EXISTS "course_sections_select_policy" ON public.course_sections;
CREATE POLICY "course_sections_select_policy" ON public.course_sections
    FOR SELECT TO authenticated
    USING (
        public.has_role('admin')
        OR EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_sections.course_id AND c.mentor_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.section_students ss WHERE ss.section_id = course_sections.section_id AND ss.student_id = auth.uid())
    );

DROP POLICY IF EXISTS "course_sections_mutation_policy" ON public.course_sections;
CREATE POLICY "course_sections_mutation_policy" ON public.course_sections
    FOR ALL TO authenticated
    USING (
        public.has_role('admin')
        OR EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_sections.course_id AND c.mentor_id = auth.uid())
    )
    WITH CHECK (
        public.has_role('admin')
        OR EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_sections.course_id AND c.mentor_id = auth.uid())
    );

-- Course Materials RLS (Private Storage Attachments)
DROP POLICY IF EXISTS "course_materials_select_policy" ON public.course_materials;
CREATE POLICY "course_materials_select_policy" ON public.course_materials
    FOR SELECT TO authenticated
    USING (
        uploaded_by = auth.uid()
        OR public.has_role('admin')
        OR EXISTS (
            SELECT 1 FROM public.courses c
            JOIN public.course_sections cs ON c.id = cs.course_id
            JOIN public.section_students ss ON cs.section_id = ss.section_id
            WHERE c.id = course_materials.course_id
              AND ss.student_id = auth.uid()
              AND c.status = 'published'
        )
    );

DROP POLICY IF EXISTS "course_materials_insert_policy" ON public.course_materials;
CREATE POLICY "course_materials_insert_policy" ON public.course_materials
    FOR INSERT TO authenticated
    WITH CHECK (
        uploaded_by = auth.uid()
        AND (public.has_role('teacher') OR public.has_role('admin'))
    );

DROP POLICY IF EXISTS "course_materials_modify_policy" ON public.course_materials;
CREATE POLICY "course_materials_modify_policy" ON public.course_materials
    FOR UPDATE TO authenticated
    USING (uploaded_by = auth.uid() OR public.has_role('admin'));

DROP POLICY IF EXISTS "course_materials_delete_policy" ON public.course_materials;
CREATE POLICY "course_materials_delete_policy" ON public.course_materials
    FOR DELETE TO authenticated
    USING (uploaded_by = auth.uid() OR public.has_role('admin'));

-- Curriculum Proposals RLS (Drafts are strictly hidden from students)
DROP POLICY IF EXISTS "curriculum_proposals_select_policy" ON public.curriculum_proposals;
CREATE POLICY "curriculum_proposals_select_policy" ON public.curriculum_proposals
    FOR SELECT TO authenticated
    USING (created_by = auth.uid() OR public.has_role('admin'));

DROP POLICY IF EXISTS "curriculum_proposals_mutation_policy" ON public.curriculum_proposals;
CREATE POLICY "curriculum_proposals_mutation_policy" ON public.curriculum_proposals
    FOR ALL TO authenticated
    USING (created_by = auth.uid() OR public.has_role('admin'))
    WITH CHECK (created_by = auth.uid() AND (public.has_role('teacher') OR public.has_role('admin')));

-- Mentor Module Uploads RLS
DROP POLICY IF EXISTS "mentor_uploads_select_policy" ON public.mentor_module_uploads;
CREATE POLICY "mentor_uploads_select_policy" ON public.mentor_module_uploads
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "mentor_uploads_insert_policy" ON public.mentor_module_uploads;
CREATE POLICY "mentor_uploads_insert_policy" ON public.mentor_module_uploads
    FOR INSERT TO authenticated
    WITH CHECK ((public.has_role('teacher') OR public.has_role('admin')) AND uploaded_by = auth.uid());

DROP POLICY IF EXISTS "mentor_uploads_modify_policy" ON public.mentor_module_uploads;
CREATE POLICY "mentor_uploads_modify_policy" ON public.mentor_module_uploads
    FOR UPDATE TO authenticated
    USING (uploaded_by = auth.uid() OR public.has_role('admin'));

DROP POLICY IF EXISTS "mentor_uploads_delete_policy" ON public.mentor_module_uploads;
CREATE POLICY "mentor_uploads_delete_policy" ON public.mentor_module_uploads
    FOR DELETE TO authenticated
    USING (uploaded_by = auth.uid() OR public.has_role('admin'));

-- Student Star Awards RLS
DROP POLICY IF EXISTS "student_stars_select_policy" ON public.student_star_awards;
CREATE POLICY "student_stars_select_policy" ON public.student_star_awards
    FOR SELECT TO authenticated
    USING (
        student_id = auth.uid()
        OR public.has_role('admin')
        OR (public.has_role('teacher') AND public.is_mentor_for_student(auth.uid(), student_id))
    );

DROP POLICY IF EXISTS "student_stars_mutation_policy" ON public.student_star_awards;
CREATE POLICY "student_stars_mutation_policy" ON public.student_star_awards
    FOR ALL TO authenticated
    USING (
        public.has_role('admin')
        OR (public.has_role('teacher') AND public.is_mentor_for_student(auth.uid(), student_id))
    )
    WITH CHECK (
        public.has_role('admin')
        OR (public.has_role('teacher') AND public.is_mentor_for_student(auth.uid(), student_id))
    );

-- Star Chart Audit Events RLS (Strict Append-Only)
DROP POLICY IF EXISTS "star_audit_select_policy" ON public.star_chart_audit_events;
CREATE POLICY "star_audit_select_policy" ON public.star_chart_audit_events
    FOR SELECT TO authenticated
    USING (
        public.has_role('admin')
        OR (public.has_role('teacher') AND public.is_mentor_for_student(auth.uid(), student_id))
    );

DROP POLICY IF EXISTS "star_audit_insert_policy" ON public.star_chart_audit_events;
CREATE POLICY "star_audit_insert_policy" ON public.star_chart_audit_events
    FOR INSERT TO authenticated
    WITH CHECK (
        (public.has_role('teacher') OR public.has_role('admin'))
        AND mentor_id = auth.uid()
        AND (public.has_role('admin') OR public.is_mentor_for_student(auth.uid(), student_id))
    );

-- ── 12. Table Grants ────────────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.sections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.section_students TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.courses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.course_sections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.course_materials TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.curriculum_proposals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.mentor_module_uploads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.student_star_awards TO authenticated;
GRANT SELECT, INSERT ON TABLE public.star_chart_audit_events TO authenticated;

GRANT EXECUTE ON FUNCTION public.is_mentor_for_student(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mentor_award_or_revoke_star(UUID, TEXT, TEXT, TEXT, VARCHAR, TEXT, TEXT) TO authenticated;
