-- ==============================================================================
-- Migration: 20261102000005_milestone2b_student_memory_sync.sql
-- Description: Phase 2 Milestone 2B: Student Memory Architecture
--              Layer 1: Global Learner Memory (student_global_memory)
--              Layer 2: Module-Specific Memory (student_module_memory, concept_mastery_records)
--              Layer 3: Demonstrated & Candidate Evidence Synchronization
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. LAYER 1: GLOBAL LEARNER MEMORY
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.student_global_memory (
    student_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    general_experience TEXT NOT NULL DEFAULT 'novice' CHECK (general_experience IN ('novice', 'intermediate', 'advanced')),
    long_term_goals TEXT[] NOT NULL DEFAULT '{}',
    learning_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
    general_strengths TEXT[] NOT NULL DEFAULT '{}',
    growth_areas TEXT[] NOT NULL DEFAULT '{}',
    communication_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
    cognitive_summary TEXT,
    last_consolidated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.student_global_memory IS 'Layer 1: Cross-cutting durable learner profile (preferences, experience, accessibility needs).';

-- ------------------------------------------------------------------------------
-- 2. LAYER 2: MODULE-SPECIFIC LEARNER MEMORY
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.student_module_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    module_id TEXT NOT NULL REFERENCES public.curriculum_modules(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'in_progress', 'completed', 'paused')),
    progress_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (progress_percent >= 0.00 AND progress_percent <= 100.00),
    current_checkpoint TEXT,
    module_goals TEXT[] NOT NULL DEFAULT '{}',
    learning_difficulties TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_student_module UNIQUE (student_id, module_id),
    CONSTRAINT fk_student_module_checkpoint FOREIGN KEY (module_id, current_checkpoint)
        REFERENCES public.curriculum_checkpoints(module_id, id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_student_module_memory_lookup
    ON public.student_module_memory (student_id, module_id);

COMMENT ON TABLE public.student_module_memory IS 'Layer 2: Module-scoped student context, enforcing strict cross-module isolation.';

-- ------------------------------------------------------------------------------
-- 3. LAYER 2: CONCEPT MASTERY SNAPSHOTS
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.concept_mastery_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mapping_id UUID NOT NULL REFERENCES public.concept_module_mappings(id) ON DELETE RESTRICT,
    mastery_state TEXT NOT NULL DEFAULT 'unassessed' CHECK (mastery_state IN ('unassessed', 'introduced', 'practicing', 'mastered')),
    understanding_level NUMERIC(3, 2) NOT NULL DEFAULT 0.00 CHECK (understanding_level >= 0.00 AND understanding_level <= 1.00),
    active_misconceptions TEXT[] NOT NULL DEFAULT '{}',
    notes TEXT,
    first_observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_assessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_student_concept_mapping UNIQUE (student_id, mapping_id)
);

CREATE INDEX IF NOT EXISTS idx_concept_mastery_student_mapping
    ON public.concept_mastery_records (student_id, mapping_id);

COMMENT ON TABLE public.concept_mastery_records IS 'Layer 2: Current concept mastery state scoped strictly to verified curriculum mappings.';

-- Link mastery_assessment_events to concept_mastery_records if column not present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'mastery_assessment_events' 
          AND column_name = 'mastery_record_id'
    ) THEN
        ALTER TABLE public.mastery_assessment_events 
        ADD COLUMN mastery_record_id UUID REFERENCES public.concept_mastery_records(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 4. ACTIVE MISCONCEPTIONS VIEW (SINGLE SOURCE OF TRUTH)
-- ------------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.student_module_active_misconceptions AS
SELECT
    cmr.student_id,
    cmm.module_id,
    cmm.concept_id,
    cmr.active_misconceptions,
    cmr.last_assessed_at
FROM public.concept_mastery_records cmr
JOIN public.concept_module_mappings cmm ON cmm.id = cmr.mapping_id
WHERE cardinality(cmr.active_misconceptions) > 0;

-- ------------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

ALTER TABLE public.student_global_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_module_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concept_mastery_records ENABLE ROW LEVEL SECURITY;

-- student_global_memory policies
DROP POLICY IF EXISTS "student_global_memory_select_own" ON public.student_global_memory;
CREATE POLICY "student_global_memory_select_own"
    ON public.student_global_memory
    FOR SELECT
    TO authenticated
    USING (student_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "student_global_memory_service_all" ON public.student_global_memory;
CREATE POLICY "student_global_memory_service_all"
    ON public.student_global_memory
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- student_module_memory policies
DROP POLICY IF EXISTS "student_module_memory_select_own" ON public.student_module_memory;
CREATE POLICY "student_module_memory_select_own"
    ON public.student_module_memory
    FOR SELECT
    TO authenticated
    USING (student_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "student_module_memory_service_all" ON public.student_module_memory;
CREATE POLICY "student_module_memory_service_all"
    ON public.student_module_memory
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- concept_mastery_records policies
DROP POLICY IF EXISTS "concept_mastery_records_select_own" ON public.concept_mastery_records;
CREATE POLICY "concept_mastery_records_select_own"
    ON public.concept_mastery_records
    FOR SELECT
    TO authenticated
    USING (student_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "concept_mastery_records_service_all" ON public.concept_mastery_records;
CREATE POLICY "concept_mastery_records_service_all"
    ON public.concept_mastery_records
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 6. SECURITY DEFINER SYNCHRONIZATION RPCS
-- ------------------------------------------------------------------------------

-- Synchronize student global memory safely
CREATE OR REPLACE FUNCTION public.sync_student_global_memory(
    p_student_id UUID,
    p_learning_preferences JSONB DEFAULT NULL,
    p_general_experience TEXT DEFAULT NULL,
    p_long_term_goals TEXT[] DEFAULT NULL,
    p_general_strengths TEXT[] DEFAULT NULL,
    p_growth_areas TEXT[] DEFAULT NULL,
    p_communication_preferences JSONB DEFAULT NULL
)
RETURNS public.student_global_memory
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_caller_id UUID;
    v_result public.student_global_memory;
BEGIN
    v_caller_id := (SELECT auth.uid());
    IF v_caller_id IS NOT NULL AND v_caller_id <> p_student_id THEN
        RAISE EXCEPTION 'Unauthorized: Caller cannot modify another student global memory.';
    END IF;

    IF p_general_experience IS NOT NULL AND p_general_experience NOT IN ('novice', 'intermediate', 'advanced') THEN
        RAISE EXCEPTION 'Invalid general_experience value: %', p_general_experience;
    END IF;

    INSERT INTO public.student_global_memory (
        student_id,
        general_experience,
        long_term_goals,
        learning_preferences,
        general_strengths,
        growth_areas,
        communication_preferences,
        last_consolidated_at,
        updated_at
    )
    VALUES (
        p_student_id,
        COALESCE(p_general_experience, 'novice'),
        COALESCE(p_long_term_goals, '{}'),
        COALESCE(p_learning_preferences, '{}'::jsonb),
        COALESCE(p_general_strengths, '{}'),
        COALESCE(p_growth_areas, '{}'),
        COALESCE(p_communication_preferences, '{}'::jsonb),
        now(),
        now()
    )
    ON CONFLICT (student_id) DO UPDATE SET
        general_experience = COALESCE(p_general_experience, public.student_global_memory.general_experience),
        long_term_goals = CASE WHEN p_long_term_goals IS NOT NULL THEN p_long_term_goals ELSE public.student_global_memory.long_term_goals END,
        learning_preferences = CASE WHEN p_learning_preferences IS NOT NULL THEN public.student_global_memory.learning_preferences || p_learning_preferences ELSE public.student_global_memory.learning_preferences END,
        general_strengths = CASE WHEN p_general_strengths IS NOT NULL THEN p_general_strengths ELSE public.student_global_memory.general_strengths END,
        growth_areas = CASE WHEN p_growth_areas IS NOT NULL THEN p_growth_areas ELSE public.student_global_memory.growth_areas END,
        communication_preferences = CASE WHEN p_communication_preferences IS NOT NULL THEN public.student_global_memory.communication_preferences || p_communication_preferences ELSE public.student_global_memory.communication_preferences END,
        last_consolidated_at = now(),
        updated_at = now()
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$;

-- Record demonstrated mastery with append-only assessment event and evidence supersession
CREATE OR REPLACE FUNCTION public.record_demonstrated_mastery(
    p_student_id UUID,
    p_module_id TEXT,
    p_concept_id TEXT,
    p_checkpoint_id TEXT,
    p_new_state TEXT,
    p_understanding_level NUMERIC,
    p_rationale TEXT,
    p_assessment_type TEXT DEFAULT 'checkpoint_assessment'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_caller_id UUID;
    v_mapping_id UUID;
    v_event_id UUID;
    v_evidence_id UUID;
    v_mastery_record_id UUID;
    v_prev_state TEXT := 'unassessed';
    v_prev_score NUMERIC := 0.00;
BEGIN
    v_caller_id := (SELECT auth.uid());
    IF v_caller_id IS NOT NULL AND v_caller_id <> p_student_id THEN
        RAISE EXCEPTION 'Unauthorized: Caller cannot record mastery for another student.';
    END IF;

    IF p_new_state NOT IN ('unassessed', 'introduced', 'practicing', 'mastered') THEN
        RAISE EXCEPTION 'Invalid mastery_state value: %', p_new_state;
    END IF;

    IF p_understanding_level < 0.00 OR p_understanding_level > 1.00 THEN
        RAISE EXCEPTION 'Understanding level must be between 0.00 and 1.00';
    END IF;

    -- 1. Resolve mapping
    SELECT id INTO v_mapping_id
    FROM public.concept_module_mappings
    WHERE concept_id = p_concept_id AND module_id = p_module_id
    LIMIT 1;

    IF v_mapping_id IS NULL THEN
        RAISE EXCEPTION 'Concept % is not mapped to Module %', p_concept_id, p_module_id;
    END IF;

    -- 2. Lookup existing mastery state
    SELECT id, mastery_state, understanding_level INTO v_mastery_record_id, v_prev_state, v_prev_score
    FROM public.concept_mastery_records
    WHERE student_id = p_student_id AND mapping_id = v_mapping_id;

    -- 3. Insert append-only assessment event
    INSERT INTO public.mastery_assessment_events (
        student_id,
        module_id,
        checkpoint_id,
        concept_id,
        assessment_type,
        previous_state,
        new_state,
        previous_score,
        new_score,
        rationale,
        assessed_at
    )
    VALUES (
        p_student_id,
        p_module_id,
        p_checkpoint_id,
        p_concept_id,
        COALESCE(p_assessment_type, 'checkpoint_assessment'),
        v_prev_state,
        p_new_state,
        v_prev_score,
        p_understanding_level,
        p_rationale,
        now()
    )
    RETURNING id INTO v_event_id;

    -- 4. Upsert concept mastery record
    INSERT INTO public.concept_mastery_records (
        student_id,
        mapping_id,
        mastery_state,
        understanding_level,
        last_assessed_at,
        updated_at
    )
    VALUES (
        p_student_id,
        v_mapping_id,
        p_new_state,
        p_understanding_level,
        now(),
        now()
    )
    ON CONFLICT (student_id, mapping_id) DO UPDATE SET
        mastery_state = EXCLUDED.mastery_state,
        understanding_level = EXCLUDED.understanding_level,
        last_assessed_at = EXCLUDED.last_assessed_at,
        updated_at = EXCLUDED.updated_at
    RETURNING id INTO v_mastery_record_id;

    -- Link event to mastery record
    UPDATE public.mastery_assessment_events
    SET mastery_record_id = v_mastery_record_id
    WHERE id = v_event_id;

    -- 5. Insert new demonstrated evidence linking to real assessment event
    INSERT INTO public.memory_evidence (
        student_id,
        module_id,
        checkpoint_id,
        concept_id,
        provenance,
        verification_status,
        lifecycle_status,
        claim,
        assessment_event_id
    )
    VALUES (
        p_student_id,
        p_module_id,
        p_checkpoint_id,
        p_concept_id,
        'demonstrated',
        'verified',
        'active',
        COALESCE(p_rationale, 'Demonstrated mastery via assessment event'),
        v_event_id
    )
    RETURNING id INTO v_evidence_id;

    -- 6. Supersede prior active evidence for this student, module, and concept
    UPDATE public.memory_evidence
    SET
        lifecycle_status = 'superseded',
        superseded_by_id = v_evidence_id
    WHERE student_id = p_student_id
      AND module_id = p_module_id
      AND concept_id = p_concept_id
      AND id <> v_evidence_id
      AND lifecycle_status = 'active';

    -- 7. Ensure student_module_memory row exists
    INSERT INTO public.student_module_memory (
        student_id,
        module_id,
        status,
        current_checkpoint,
        updated_at
    )
    VALUES (
        p_student_id,
        p_module_id,
        'in_progress',
        p_checkpoint_id,
        now()
    )
    ON CONFLICT (student_id, module_id) DO UPDATE SET
        current_checkpoint = COALESCE(EXCLUDED.current_checkpoint, public.student_module_memory.current_checkpoint),
        updated_at = now();

    RETURN jsonb_build_object(
        'assessment_event_id', v_event_id,
        'mastery_record_id', v_mastery_record_id,
        'evidence_id', v_evidence_id,
        'status', 'recorded'
    );
END;
$$;

-- Record candidate evidence with provenance rules (inferences never verified automatically)
CREATE OR REPLACE FUNCTION public.record_candidate_evidence(
    p_student_id UUID,
    p_module_id TEXT,
    p_concept_id TEXT,
    p_checkpoint_id TEXT,
    p_provenance TEXT,
    p_claim TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_caller_id UUID;
    v_evidence_id UUID;
    v_verification TEXT;
BEGIN
    v_caller_id := (SELECT auth.uid());
    IF v_caller_id IS NOT NULL AND v_caller_id <> p_student_id THEN
        RAISE EXCEPTION 'Unauthorized: Caller cannot record evidence for another student.';
    END IF;

    IF p_provenance NOT IN ('student_reported', 'directly_observed', 'inferred', 'teacher_assessed') THEN
        RAISE EXCEPTION 'Invalid candidate provenance: %. Use record_demonstrated_mastery for demonstrated claims.', p_provenance;
    END IF;

    -- Inferences and self-reports must NEVER silently become verified mastery
    IF p_provenance = 'inferred' THEN
        v_verification := 'unverified';
    ELSIF p_provenance = 'student_reported' THEN
        v_verification := 'unverified';
    ELSIF p_provenance = 'directly_observed' THEN
        v_verification := 'tentative';
    ELSE
        v_verification := 'unverified';
    END IF;

    INSERT INTO public.memory_evidence (
        student_id,
        module_id,
        checkpoint_id,
        concept_id,
        provenance,
        verification_status,
        lifecycle_status,
        claim,
        assessment_event_id
    )
    VALUES (
        p_student_id,
        p_module_id,
        p_checkpoint_id,
        p_concept_id,
        p_provenance,
        v_verification,
        'active',
        p_claim,
        NULL -- No assessment event for non-demonstrated candidate evidence
    )
    RETURNING id INTO v_evidence_id;

    RETURN v_evidence_id;
END;
$$;

-- Aggregate student module context for teaching selector
CREATE OR REPLACE FUNCTION public.get_student_module_context(
    p_student_id UUID,
    p_module_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_caller_id UUID;
    v_result JSONB;
BEGIN
    v_caller_id := (SELECT auth.uid());
    IF v_caller_id IS NOT NULL AND v_caller_id <> p_student_id THEN
        RAISE EXCEPTION 'Unauthorized: Caller cannot read another student module context.';
    END IF;

    SELECT jsonb_build_object(
        'student_id', p_student_id,
        'module_id', p_module_id,
        'module_memory', (
            SELECT jsonb_build_object(
                'status', smm.status,
                'progress_percent', smm.progress_percent,
                'current_checkpoint', smm.current_checkpoint,
                'module_goals', smm.module_goals,
                'learning_difficulties', smm.learning_difficulties
            )
            FROM public.student_module_memory smm
            WHERE smm.student_id = p_student_id AND smm.module_id = p_module_id
        ),
        'mastered_concepts', (
            SELECT COALESCE(jsonb_agg(cmm.concept_id), '[]'::jsonb)
            FROM public.concept_mastery_records cmr
            JOIN public.concept_module_mappings cmm ON cmm.id = cmr.mapping_id
            WHERE cmr.student_id = p_student_id 
              AND cmm.module_id = p_module_id 
              AND cmr.mastery_state = 'mastered'
        ),
        'active_misconceptions', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'concept_id', cmm.concept_id,
                'misconceptions', cmr.active_misconceptions
            )), '[]'::jsonb)
            FROM public.concept_mastery_records cmr
            JOIN public.concept_module_mappings cmm ON cmm.id = cmr.mapping_id
            WHERE cmr.student_id = p_student_id 
              AND cmm.module_id = p_module_id 
              AND cardinality(cmr.active_misconceptions) > 0
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$;
