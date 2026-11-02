-- ============================================================================
-- RISSE AI PHASE 2 — MILESTONE 1 MIGRATION: CORE PROFILES, ROLES & PREFERENCES
-- Migration: 20261102000001_core_profiles_roles.sql
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    school TEXT DEFAULT NULL,
    grade TEXT DEFAULT NULL,
    avatar_url TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. User Roles Table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    CONSTRAINT uq_user_roles UNIQUE (user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);

-- 3. Student Preferences Table (Student Read/Write)
CREATE TABLE IF NOT EXISTS public.student_preferences (
    student_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    preferred_hint_style TEXT NOT NULL DEFAULT 'balanced' 
        CHECK (preferred_hint_style IN ('socratic_only', 'balanced', 'code_examples', 'theory_first')),
    communication_tone TEXT NOT NULL DEFAULT 'encouraging' 
        CHECK (communication_tone IN ('encouraging', 'direct_technical', 'competition_coach')),
    primary_interests TEXT[] DEFAULT '{}',
    learning_goals TEXT[] DEFAULT '{}',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Student Global Metrics Table (System-Maintained, Read-Only for Student)
CREATE TABLE IF NOT EXISTS public.student_global_metrics (
    student_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    general_experience TEXT NOT NULL DEFAULT 'novice' 
        CHECK (general_experience IN ('novice', 'intermediate', 'advanced')),
    overall_strengths TEXT[] DEFAULT '{}',
    growth_areas TEXT[] DEFAULT '{}',
    total_sessions_count INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Helper Function: Role Check (Non-Recursive SECURITY DEFINER with safe search_path)
CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = '' STABLE AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = required_role
    );
$$;

REVOKE ALL ON FUNCTION public.has_role(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(TEXT) TO authenticated;

-- 6. Trigger: Secure Registration Provisioning
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_full_name TEXT;
    v_school TEXT;
    v_grade TEXT;
BEGIN
    v_full_name := pg_catalog.coalesce(pg_catalog.nullif(pg_catalog.trim(NEW.raw_user_meta_data->>'full_name'), ''), 'Robotics Learner');
    v_school := pg_catalog.nullif(pg_catalog.trim(NEW.raw_user_meta_data->>'school'), '');
    v_grade := pg_catalog.nullif(pg_catalog.trim(NEW.raw_user_meta_data->>'grade'), '');

    -- Insert Profile
    INSERT INTO public.profiles (id, email, full_name, school, grade)
    VALUES (NEW.id, NEW.email, v_full_name, v_school, v_grade)
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        updated_at = pg_catalog.now();

    -- Strictly assign student role (Browser role metadata is completely ignored)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'student')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Initialize Preferences
    INSERT INTO public.student_preferences (student_id)
    VALUES (NEW.id)
    ON CONFLICT (student_id) DO NOTHING;

    -- Initialize Metrics
    INSERT INTO public.student_global_metrics (student_id, general_experience)
    VALUES (NEW.id, 'novice')
    ON CONFLICT (student_id) DO NOTHING;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user_registration() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_registration();

-- 7. Trigger: Synchronize Auth Email Changes
CREATE OR REPLACE FUNCTION public.sync_auth_email_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
    IF NEW.email IS DISTINCT FROM OLD.email THEN
        UPDATE public.profiles
        SET email = NEW.email, updated_at = pg_catalog.now()
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_auth_email_update() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_email_updated ON auth.users;
CREATE TRIGGER on_auth_email_updated
    AFTER UPDATE OF email ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.sync_auth_email_update();

-- 8. Trigger: Protect Immutable Profile Fields
CREATE OR REPLACE FUNCTION public.protect_immutable_profile_fields()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
    IF NEW.id IS DISTINCT FROM OLD.id THEN
        RAISE EXCEPTION 'Modifying profile id is strictly prohibited.';
    END IF;
    IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
        RAISE EXCEPTION 'Modifying profile created_at is strictly prohibited.';
    END IF;
    -- Note: Direct client updates to email are prevented by column-level privileges.
    -- Legitimate email updates from auth.users via sync_auth_email_update() succeed safely.
    NEW.updated_at := pg_catalog.now();
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.protect_immutable_profile_fields() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_protect_immutable_profile_fields ON public.profiles;
CREATE TRIGGER trg_protect_immutable_profile_fields
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.protect_immutable_profile_fields();

-- 9. Explicit Table Privileges
REVOKE ALL ON TABLE public.profiles FROM anon, PUBLIC;
REVOKE ALL ON TABLE public.user_roles FROM anon, PUBLIC;
REVOKE ALL ON TABLE public.student_preferences FROM anon, PUBLIC;
REVOKE ALL ON TABLE public.student_global_metrics FROM anon, PUBLIC;

-- Profiles: Authenticated users can SELECT, and UPDATE only permitted columns
REVOKE ALL ON TABLE public.profiles FROM authenticated;
GRANT SELECT ON TABLE public.profiles TO authenticated;
GRANT UPDATE (full_name, school, grade, avatar_url, updated_at) ON TABLE public.profiles TO authenticated;

-- User Roles: Authenticated users can SELECT, and mutate only if authorized by admin RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_roles TO authenticated;

-- Student Preferences: Authenticated users can SELECT and UPDATE
REVOKE ALL ON TABLE public.student_preferences FROM authenticated;
GRANT SELECT, UPDATE ON TABLE public.student_preferences TO authenticated;

-- Student Global Metrics: Authenticated users can only SELECT
REVOKE ALL ON TABLE public.student_global_metrics FROM authenticated;
GRANT SELECT ON TABLE public.student_global_metrics TO authenticated;

-- 10. Row Level Security Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_global_metrics ENABLE ROW LEVEL SECURITY;

-- Profiles: Own read/update
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR public.has_role('admin'));

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = id OR public.has_role('admin'))
    WITH CHECK (auth.uid() = id OR public.has_role('admin'));

-- User Roles: Read own, mutations restricted to admin
DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;
CREATE POLICY "user_roles_select_own" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id OR public.has_role('admin'));

DROP POLICY IF EXISTS "user_roles_admin_mutate" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_insert" ON public.user_roles;
CREATE POLICY "user_roles_admin_insert" ON public.user_roles
    FOR INSERT WITH CHECK (public.has_role('admin'));

DROP POLICY IF EXISTS "user_roles_admin_update" ON public.user_roles;
CREATE POLICY "user_roles_admin_update" ON public.user_roles
    FOR UPDATE USING (public.has_role('admin')) WITH CHECK (public.has_role('admin'));

DROP POLICY IF EXISTS "user_roles_admin_delete" ON public.user_roles;
CREATE POLICY "user_roles_admin_delete" ON public.user_roles
    FOR DELETE USING (public.has_role('admin'));

-- Student Preferences: Student Read/Update
DROP POLICY IF EXISTS "preferences_select_own" ON public.student_preferences;
CREATE POLICY "preferences_select_own" ON public.student_preferences
    FOR SELECT USING (auth.uid() = student_id OR public.has_role('admin'));

DROP POLICY IF EXISTS "preferences_update_own" ON public.student_preferences;
CREATE POLICY "preferences_update_own" ON public.student_preferences
    FOR UPDATE USING (auth.uid() = student_id OR public.has_role('admin'))
    WITH CHECK (auth.uid() = student_id OR public.has_role('admin'));

-- Student Global Metrics: Read only for student
DROP POLICY IF EXISTS "metrics_select_own" ON public.student_global_metrics;
CREATE POLICY "metrics_select_own" ON public.student_global_metrics
    FOR SELECT USING (auth.uid() = student_id OR public.has_role('admin'));
