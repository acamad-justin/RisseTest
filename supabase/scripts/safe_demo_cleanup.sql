-- ============================================================================
-- RISSE AI — STANDALONE SAFE DEMO & STALE COURSE DATA CLEANUP SCRIPT
-- ============================================================================
-- Purpose:
--   Safely purges obsolete teacher-created demo courses, outdated section
--   assignments, stale student enrollments, obsolete checkpoint progress,
--   and obsolete demo star awards.
--
-- Safety Guarantees:
--   1. STRICTLY PRESERVES all auth accounts (auth.users) and profiles (public.profiles).
--   2. STRICTLY PRESERVES user_roles (student, teacher, admin) and student_preferences.
--   3. STRICTLY PRESERVES the RISSE Foundation Core Curriculum (curriculum_modules 101-106).
--   4. Uses a single ATOMIC TRANSACTION (BEGIN ... COMMIT). If anything errors, all changes roll back.
--   5. Includes Pre-Cleanup Diagnostic SELECTs and Post-Cleanup Verification SELECTs.
--   6. Does NOT drop any tables, views, triggers, functions, or RLS policies.
-- ============================================================================

-- ── PHASE 1: PRE-CLEANUP DIAGNOSTIC AUDIT ──────────────────────────────────
-- Run this block first to inspect the counts of existing records before deletion:

SELECT 'Pre-Audit: Total Profiles' AS audit_metric, count(*) AS record_count FROM public.profiles
UNION ALL
SELECT 'Pre-Audit: Core Curriculum Modules (Protected)', count(*) FROM public.curriculum_modules WHERE id IN ('101', '102', '103', '104', '105', '106')
UNION ALL
SELECT 'Pre-Audit: Teacher Courses (Target for cleanup)', count(*) FROM public.courses
UNION ALL
SELECT 'Pre-Audit: Course-to-Section Links (Target for cleanup)', count(*) FROM public.course_sections
UNION ALL
SELECT 'Pre-Audit: Curriculum Proposals (Target for cleanup)', count(*) FROM public.curriculum_proposals
UNION ALL
SELECT 'Pre-Audit: Course Materials (Target for cleanup)', count(*) FROM public.course_materials
UNION ALL
SELECT 'Pre-Audit: Section Student Enrollments (Target for cleanup)', count(*) FROM public.section_students
UNION ALL
SELECT 'Pre-Audit: Stale Module Progress (Target for cleanup)', count(*) FROM public.student_module_memory WHERE module_id NOT IN ('101', '102', '103', '104', '105', '106')
UNION ALL
SELECT 'Pre-Audit: Star Awards (Target for cleanup)', count(*) FROM public.student_star_awards;

-- ── PHASE 2: SAFE ATOMIC TRANSACTIONAL PURGE ───────────────────────────────

BEGIN;

-- 1. Remove obsolete star awards and audit events associated with demo data
-- (Preserves cognitive concept mastery snapshots in concept_mastery_records)
DELETE FROM public.star_chart_audit_events
WHERE student_id IN (
    SELECT id FROM public.profiles 
    WHERE email IN ('demo1@acamad.com', 'demo2@acamad.com', 'acamaddemo@acamad.com')
);

DELETE FROM public.student_star_awards
WHERE student_id IN (
    SELECT id FROM public.profiles 
    WHERE email IN ('demo1@acamad.com', 'demo2@acamad.com', 'acamaddemo@acamad.com')
);

-- 2. Remove stale non-core module memory / progress for demo accounts
DELETE FROM public.student_module_memory
WHERE student_id IN (
    SELECT id FROM public.profiles 
    WHERE email IN ('demo1@acamad.com', 'demo2@acamad.com', 'acamaddemo@acamad.com')
)
OR module_id NOT IN ('101', '102', '103', '104', '105', '106');

-- 3. Remove obsolete course materials records
-- (Storage objects in 'course-materials' can be cleaned via Supabase Dashboard Storage if desired)
DELETE FROM public.course_materials;

-- 4. Remove all curriculum proposals (drafts & published proposals generated for teacher courses)
DELETE FROM public.curriculum_proposals;

-- 5. Remove course-to-section junction assignments
DELETE FROM public.course_sections;

-- 6. Remove student cohort enrollments from sections for demo accounts
DELETE FROM public.section_students
WHERE student_id IN (
    SELECT id FROM public.profiles 
    WHERE email IN ('demo1@acamad.com', 'demo2@acamad.com', 'acamaddemo@acamad.com')
);

-- 7. Remove teacher-created courses
-- (Note: Foreign keys with ON DELETE CASCADE will cleanly handle any remaining dependent records)
DELETE FROM public.courses;

-- 8. Clean up obsolete empty sections created by demo mentors (optional; preserves sections with real teachers if any)
DELETE FROM public.sections
WHERE mentor_id IN (
    SELECT id FROM public.profiles 
    WHERE email IN ('mentor@risse.edu', 'adriel@risse.edu')
);

COMMIT;

-- ── PHASE 3: POST-CLEANUP VERIFICATION ──────────────────────────────────────
-- Verify that obsolete records have been safely cleared while auth, profiles, and core curriculum remain 100% intact:

SELECT 'Post-Verification: Profiles Intact' AS verify_metric, count(*) AS record_count FROM public.profiles
UNION ALL
SELECT 'Post-Verification: User Roles Intact', count(*) FROM public.user_roles
UNION ALL
SELECT 'Post-Verification: Foundation Curriculum Intact (Should be 6)', count(*) FROM public.curriculum_modules WHERE id IN ('101', '102', '103', '104', '105', '106')
UNION ALL
SELECT 'Post-Verification: Active Courses (Should be 0)', count(*) FROM public.courses
UNION ALL
SELECT 'Post-Verification: Course Sections (Should be 0)', count(*) FROM public.course_sections
UNION ALL
SELECT 'Post-Verification: Course Materials (Should be 0)', count(*) FROM public.course_materials
UNION ALL
SELECT 'Post-Verification: Curriculum Proposals (Should be 0)', count(*) FROM public.curriculum_proposals
UNION ALL
SELECT 'Post-Verification: Star Awards for Demo Users (Should be 0)', count(*) FROM public.student_star_awards WHERE student_id IN (SELECT id FROM public.profiles WHERE email IN ('demo1@acamad.com', 'demo2@acamad.com'));

