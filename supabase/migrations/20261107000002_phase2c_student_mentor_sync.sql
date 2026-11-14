-- supabase/migrations/20261107000002_phase2c_student_mentor_sync.sql
-- ==============================================================================
-- RISSE AI — Phase 2 & 2C: Complete Student–Mentor Database Schema & Synchronization
-- ==============================================================================
-- 1. Safely add missing columns to existing tables (course_id)
-- 2. Create missing tables (courses, course_sections, course_materials, curriculum_proposals)
-- 3. Add foreign keys and indexes safely
-- 4. Create security functions & RPCs (has_role, is_mentor_for_student, mentor_award_or_revoke_star, record_student_checkpoint_progress)
-- 5. Enable Row Level Security (RLS) and configure granular policies
-- 6. Grant authenticated permissions
-- ==============================================================================

-- ── 1. Safely add missing columns to existing tables ──────────────────────────
ALTER TABLE public.student_star_awards 
ADD COLUMN IF NOT EXISTS course_id UUID;

ALTER TABLE public.mentor_module_uploads 
ADD COLUMN IF NOT EXISTS course_id UUID;

-- ── 2. Create Missing Tables If Not Existing ──────────────────────────────────

-- Courses Table (Central Teaching Entity)
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

-- Course Sections Table (Multi-Section Course Assignment)
CREATE TABLE IF NOT EXISTS public.course_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_course_section UNIQUE(course_id, section_id)
);

-- Course Materials Table (Private Supabase Storage Attachments)
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

-- Curriculum Proposals Table (AI Drafts & Teacher Review Studio)
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

-- ── 3. Add Foreign Keys Safely ────────────────────────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'student_star_awards_course_id_fkey'
    ) THEN
        ALTER TABLE public.student_star_awards
        ADD CONSTRAINT student_star_awards_course_id_fkey
        FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'mentor_module_uploads_course_id_fkey'
    ) THEN
        ALTER TABLE public.mentor_module_uploads
        ADD CONSTRAINT mentor_module_uploads_course_id_fkey
        FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ── 4. Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_courses_mentor_id ON public.courses(mentor_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);
CREATE INDEX IF NOT EXISTS idx_course_sections_course ON public.course_sections(course_id);
CREATE INDEX IF NOT EXISTS idx_course_sections_section ON public.course_sections(section_id);
CREATE INDEX IF NOT EXISTS idx_course_materials_course ON public.course_materials(course_id);
CREATE INDEX IF NOT EXISTS idx_course_materials_uploader ON public.course_materials(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_curriculum_proposals_course ON public.curriculum_proposals(course_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_proposals_creator ON public.curriculum_proposals(created_by);
CREATE INDEX IF NOT EXISTS idx_student_star_course ON public.student_star_awards(course_id);

-- ── 5. Helper Functions & RPCs ────────────────────────────────────────────────

-- Check user role
CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = required_role
    );
$$;

-- Check mentor assignment
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

-- Star Award / Revoke RPC with append-only audit trail
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

    v_clean_action := lower(trim(p_action));
    IF v_clean_action NOT IN ('awarded', 'revoked') THEN
        RAISE EXCEPTION 'Invalid action: must be awarded or revoked.' USING ERRCODE = '22023';
    END IF;

    IF p_note IS NULL OR trim(p_note) = '' THEN
        RAISE EXCEPTION 'A descriptive note or reason is required for star chart audit history.' USING ERRCODE = '22023';
    END IF;

    v_is_authorized := public.has_role('admin') OR (
        public.has_role('teacher') AND public.is_mentor_for_student(v_caller_id, p_student_id)
    );

    IF NOT v_is_authorized THEN
        RAISE EXCEPTION 'Access denied: You are not authorized to modify Star Charts for this student.' USING ERRCODE = '42501';
    END IF;

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

-- Atomic Checkpoint Progress RPC (record_student_checkpoint_progress)
-- Invariant: NEVER inserts into concept_mastery_records or creates mastery_assessment_events.
CREATE OR REPLACE FUNCTION public.record_student_checkpoint_progress(
    p_module_id TEXT,
    p_checkpoint_id TEXT,
    p_progress_percent NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_student_id UUID;
    v_clean_progress NUMERIC(5, 2);
    v_status TEXT;
    v_matched_cp_id TEXT;
    v_result JSONB;
BEGIN
    v_student_id := auth.uid();
    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required: Anonymous users cannot record checkpoint progress.';
    END IF;

    IF p_module_id IS NULL OR trim(p_module_id) = '' THEN
        RAISE EXCEPTION 'Module ID is required.';
    END IF;

    v_clean_progress := LEAST(100.00, GREATEST(0.00, COALESCE(p_progress_percent, 0.00)));
    v_status := CASE 
        WHEN v_clean_progress >= 100.00 THEN 'completed'
        WHEN v_clean_progress > 0.00 THEN 'in_progress'
        ELSE 'enrolled'
    END;

    -- Safely match checkpoint if foreign key constraint exists on curriculum_checkpoints
    SELECT id INTO v_matched_cp_id 
    FROM public.curriculum_checkpoints 
    WHERE (id = p_checkpoint_id OR title = p_checkpoint_id) AND module_id = trim(p_module_id)
    LIMIT 1;

    -- Upsert into student_module_memory
    INSERT INTO public.student_module_memory (
        student_id,
        module_id,
        status,
        progress_percent,
        current_checkpoint,
        updated_at
    )
    VALUES (
        v_student_id,
        trim(p_module_id),
        v_status,
        v_clean_progress,
        v_matched_cp_id,
        NOW()
    )
    ON CONFLICT (student_id, module_id)
    DO UPDATE SET
        status = CASE 
            WHEN public.student_module_memory.status = 'completed' AND v_clean_progress < 100.00 
            THEN public.student_module_memory.status 
            ELSE EXCLUDED.status 
        END,
        progress_percent = GREATEST(public.student_module_memory.progress_percent, EXCLUDED.progress_percent),
        current_checkpoint = COALESCE(EXCLUDED.current_checkpoint, public.student_module_memory.current_checkpoint),
        updated_at = NOW();

    v_result := jsonb_build_object(
        'success', true,
        'student_id', v_student_id,
        'module_id', trim(p_module_id),
        'checkpoint_id', p_checkpoint_id,
        'progress_percent', v_clean_progress,
        'status', v_status,
        'recorded_at', NOW()
    );

    RETURN v_result;
END;
$$;

-- ── 6. Row Level Security Policies ───────────────────────────────────────────
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_star_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.star_chart_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_module_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concept_mastery_records ENABLE ROW LEVEL SECURITY;

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

-- Course Materials RLS
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

-- Curriculum Proposals RLS (Students can read published proposals, mentors can mutate drafts)
DROP POLICY IF EXISTS "curriculum_proposals_select_policy" ON public.curriculum_proposals;
CREATE POLICY "curriculum_proposals_select_policy" ON public.curriculum_proposals
    FOR SELECT TO authenticated
    USING (
        created_by = auth.uid()
        OR public.has_role('admin')
        OR (
            status = 'published'
            AND EXISTS (
                SELECT 1 
                FROM public.courses c
                JOIN public.course_sections cs ON c.id = cs.course_id
                JOIN public.section_students ss ON cs.section_id = ss.section_id
                WHERE c.id = curriculum_proposals.course_id
                  AND ss.student_id = auth.uid()
                  AND ss.status = 'active'
                  AND c.status = 'published'
            )
        )
    );

DROP POLICY IF EXISTS "curriculum_proposals_mutation_policy" ON public.curriculum_proposals;
CREATE POLICY "curriculum_proposals_mutation_policy" ON public.curriculum_proposals
    FOR ALL TO authenticated
    USING (created_by = auth.uid() OR public.has_role('admin'))
    WITH CHECK (created_by = auth.uid() AND (public.has_role('teacher') OR public.has_role('admin')));

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

-- Star Chart Audit Events RLS (Append-Only)
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

-- Student Module Memory RLS (Mentors can read for enrolled students, students can modify own)
DROP POLICY IF EXISTS "student_module_memory_select_own" ON public.student_module_memory;
CREATE POLICY "student_module_memory_select_own" ON public.student_module_memory
    FOR SELECT TO authenticated
    USING (
        student_id = auth.uid()
        OR public.has_role('admin')
        OR (
            public.has_role('teacher')
            AND public.is_mentor_for_student(auth.uid(), student_id)
        )
    );

DROP POLICY IF EXISTS "student_module_memory_student_modify" ON public.student_module_memory;
CREATE POLICY "student_module_memory_student_modify" ON public.student_module_memory
    FOR ALL TO authenticated
    USING (student_id = auth.uid() OR public.has_role('admin'))
    WITH CHECK (student_id = auth.uid() OR public.has_role('admin'));

-- Concept Mastery Records RLS (Mentors can read for enrolled students)
DROP POLICY IF EXISTS "concept_mastery_records_select_own" ON public.concept_mastery_records;
CREATE POLICY "concept_mastery_records_select_own" ON public.concept_mastery_records
    FOR SELECT TO authenticated
    USING (
        student_id = auth.uid()
        OR public.has_role('admin')
        OR (
            public.has_role('teacher')
            AND public.is_mentor_for_student(auth.uid(), student_id)
        )
    );

-- ── 7. Grants ────────────────────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.courses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.course_sections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.course_materials TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.curriculum_proposals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.student_star_awards TO authenticated;
GRANT SELECT, INSERT ON TABLE public.star_chart_audit_events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.student_module_memory TO authenticated;

GRANT EXECUTE ON FUNCTION public.has_role(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_mentor_for_student(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mentor_award_or_revoke_star(UUID, TEXT, TEXT, TEXT, VARCHAR, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_student_checkpoint_progress(TEXT, TEXT, NUMERIC) TO authenticated;
