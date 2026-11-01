-- ============================================================================
-- RISSE AI PHASE 2 — MILESTONE 1 CORRECTIVE MIGRATION: SECURITY HARDENING
-- Migration: 20261102000002_harden_auth_security.sql
-- Applies fail-closed table privileges, column-level update locks, hardened
-- search paths on SECURITY DEFINER functions, and administrative RLS separation.
-- Safe to execute idempotently on existing databases without dropping student data.
-- ============================================================================

-- 1. Search Path Hardening on SECURITY DEFINER Functions
CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = '' STABLE AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = required_role
    );
$$;

REVOKE ALL ON FUNCTION public.has_role(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(TEXT) TO authenticated;

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

-- 2. Immutable Profile Field Protection Trigger
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

-- 3. Explicit Table Privileges
REVOKE ALL ON TABLE public.profiles FROM anon, PUBLIC;
REVOKE ALL ON TABLE public.user_roles FROM anon, PUBLIC;
REVOKE ALL ON TABLE public.student_preferences FROM anon, PUBLIC;
REVOKE ALL ON TABLE public.student_global_metrics FROM anon, PUBLIC;

-- Profiles: Authenticated users can SELECT, and UPDATE only permitted student fields
REVOKE ALL ON TABLE public.profiles FROM authenticated;
GRANT SELECT ON TABLE public.profiles TO authenticated;
GRANT UPDATE (full_name, school, grade, avatar_url, updated_at) ON TABLE public.profiles TO authenticated;

-- User Roles: Authenticated users can SELECT, and mutate only if authorized by admin RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_roles TO authenticated;

-- Student Preferences: Authenticated users can SELECT and UPDATE
REVOKE ALL ON TABLE public.student_preferences FROM authenticated;
GRANT SELECT, UPDATE ON TABLE public.student_preferences TO authenticated;

-- Student Global Metrics: Authenticated users can SELECT only
REVOKE ALL ON TABLE public.student_global_metrics FROM authenticated;
GRANT SELECT ON TABLE public.student_global_metrics TO authenticated;

-- 4. Hardened Row Level Security (RLS) Policies

-- Profiles RLS: Own Read / Permitted Update
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR public.has_role('admin'));

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = id OR public.has_role('admin'))
    WITH CHECK (auth.uid() = id OR public.has_role('admin'));

-- User Roles RLS: Read own, mutations strictly partitioned into distinct administrative operations
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

-- Student Preferences RLS: Read & Update own preferences only
DROP POLICY IF EXISTS "preferences_select_own" ON public.student_preferences;
CREATE POLICY "preferences_select_own" ON public.student_preferences
    FOR SELECT USING (auth.uid() = student_id OR public.has_role('admin'));

DROP POLICY IF EXISTS "preferences_update_own" ON public.student_preferences;
CREATE POLICY "preferences_update_own" ON public.student_preferences
    FOR UPDATE USING (auth.uid() = student_id OR public.has_role('admin'))
    WITH CHECK (auth.uid() = student_id OR public.has_role('admin'));

-- Student Global Metrics RLS: Read only for student
DROP POLICY IF EXISTS "metrics_select_own" ON public.student_global_metrics;
CREATE POLICY "metrics_select_own" ON public.student_global_metrics
    FOR SELECT USING (auth.uid() = student_id OR public.has_role('admin'));
