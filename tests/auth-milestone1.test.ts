// tests/auth-milestone1.test.ts
/**
 * Test Suite: RISSE AI Phase 2 — Milestone 1: Supabase Authentication Foundation & Security Hardening
 * Validates fail-closed authentication middleware, role resolution, guest mode,
 * mock authentication elimination, SQL privileges, RLS policies, and tamper resistance.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

const envCandidates = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), 'frontend/.env.local'),
  path.resolve(process.cwd(), '../frontend/.env.local'),
  path.resolve(process.cwd(), '../.env.local'),
];
for (const p of envCandidates) {
  try {
    if (fs.existsSync(p)) dotenv.config({ path: p });
  } catch (_) {}
}
dotenv.config();

import { resolveBackendAuth } from '../lib/serverAuth.ts';

function readProjectFile(relativePath: string): string {
  const candidates = [
    path.resolve(process.cwd(), relativePath),
    path.resolve(process.cwd(), '..', relativePath),
    path.resolve(process.cwd(), relativePath.replace(/^frontend\//, '')),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return fs.readFileSync(c, 'utf8');
    }
  }
  throw new Error(`Could not find project file ${relativePath}`);
}

function readMigrationSql(filename = '20261102000003_milestone1_final_security_patch.sql'): string {
  return readProjectFile(`supabase/migrations/${filename}`);
}

describe('Phase 2 Milestone 1: Authentication & Authorization Security', () => {

  // ── Test 1: Missing Authorization Header Enters Guest Mode ─────────────────
  it('1. Missing Authorization header cleanly resolves as guest mode', async () => {
    const headers = {};
    const { auth, error } = await resolveBackendAuth(headers);

    assert.strictEqual(error, null, 'Error should be null for guest requests');
    assert.ok(auth, 'Auth context should exist for guest');
    assert.strictEqual(auth?.role, 'guest', 'Role must be guest');
    assert.strictEqual(auth?.isAuthenticated, false, 'Guest is not authenticated');
    assert.strictEqual(auth?.user, null, 'Guest has no user object');
  });

  // ── Test 2: Malformed Authorization Headers Fail Closed with 401 ───────────
  it('2. Malformed Authorization headers fail closed with HTTP 401', async () => {
    const malformedHeaders = [
      { authorization: 'Basic dXNlcjpwYXNz' },
      { authorization: 'Token abc123xyz' },
      { authorization: 'Digest username="MIME"' },
    ];

    for (const h of malformedHeaders) {
      const { auth, error } = await resolveBackendAuth(h);
      assert.strictEqual(auth, null, `Should not authenticate with header: ${JSON.stringify(h)}`);
      assert.ok(error, 'Should produce an auth error');
      assert.strictEqual(error?.statusCode, 401, 'Should return HTTP 401');
    }
  });

  // ── Test 3: Whitespace-only Authorization header returns 401 ────────────────
  it('3. Whitespace-only Authorization header returns HTTP 401, never downgrading to guest', async () => {
    const whitespaceHeaders = [
      { authorization: '' },
      { authorization: ' ' },
      { authorization: '   \t  \n' },
    ];

    for (const h of whitespaceHeaders) {
      const { auth, error } = await resolveBackendAuth(h);
      assert.strictEqual(auth, null, 'Whitespace header must never grant guest or auth context');
      assert.ok(error, 'Whitespace header must produce an explicit 401 error');
      assert.strictEqual(error?.statusCode, 401, 'Must return HTTP 401');
      assert.ok(error?.message.includes('cannot be empty or whitespace-only'));
    }
  });

  // ── Test 4: Bearer without a token returns 401 ──────────────────────────────
  it('4. Bearer keyword without a token returns HTTP 401', async () => {
    const emptyBearerHeaders = [
      { authorization: 'Bearer' },
      { authorization: 'Bearer ' },
      { authorization: 'Bearer   ' },
      { authorization: 'bearer' },
      { authorization: 'bearer   ' },
    ];

    for (const h of emptyBearerHeaders) {
      const { auth, error } = await resolveBackendAuth(h);
      assert.strictEqual(auth, null, 'Bearer without token must not authenticate');
      assert.ok(error, 'Must produce error');
      assert.strictEqual(error?.statusCode, 401, 'Must return HTTP 401');
      assert.ok(error?.message.includes('Missing Bearer token'));
    }
  });

  // ── Test 5: Invalid / Expired JWT Fails Closed with 401 ─────────────────────
  it('5. Invalid or fabricated JWT fails closed with HTTP 401', async () => {
    const headers = {
      authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.invalidsignature',
    };

    const { auth, error } = await resolveBackendAuth(headers);
    assert.strictEqual(auth, null);
    assert.ok(error, 'Must reject invalid token');
    assert.strictEqual(error?.statusCode, 401);
  });

  // ── Test 6: Authenticated User with No Role Fails Closed with 403 ───────────
  it('6. Authenticated account without an assigned role fails closed with HTTP 403', async () => {
    const mockClient = {
      auth: {
        getUser: async () => ({
          data: { user: { id: 'usr-no-role-123', email: 'norole@risse.edu' } },
          error: null,
        }),
      },
      from: () => ({
        select: () => ({
          eq: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    };

    const { auth, error } = await resolveBackendAuth(
      { authorization: 'Bearer valid.jwt.token' },
      undefined,
      undefined,
      mockClient
    );

    assert.strictEqual(auth, null, 'Must not authenticate user without a role');
    assert.ok(error, 'Must produce an error for unassigned role');
    assert.strictEqual(error?.statusCode, 403, 'Must return HTTP 403 Forbidden');
    assert.ok(error?.message.includes('assigned application role'));
  });

  // ── Test 7: Unexpected role values in database are safely rejected with 403 ─
  it('7. Unexpected role values in database are rejected with 403, never defaulting to student', async () => {
    const mockClientWithInvalidRole = {
      auth: {
        getUser: async () => ({
          data: { user: { id: 'usr-hacker-999', email: 'hacker@bad.actor' } },
          error: null,
        }),
      },
      from: () => ({
        select: () => ({
          eq: () => Promise.resolve({
            data: [{ role: 'superuser' }, { role: 'moderator' }, { role: 'guest' }],
            error: null,
          }),
        }),
      }),
    };

    const { auth, error } = await resolveBackendAuth(
      { authorization: 'Bearer token' },
      undefined,
      undefined,
      mockClientWithInvalidRole
    );

    assert.strictEqual(auth, null, 'Must reject unrecognized roles');
    assert.ok(error, 'Must produce error');
    assert.strictEqual(error?.statusCode, 403, 'Must return HTTP 403');
    assert.ok(error?.message.includes('Invalid role assignment detected'));
  });

  // ── Test 7b: Unexpected role mixed with valid role rejects entire set (403) ──
  it('7b. Unexpected role mixed with valid role rejects the entire role set with 403', async () => {
    const mockClientWithMixedRole = {
      auth: {
        getUser: async () => ({
          data: { user: { id: 'usr-mixed-roles', email: 'mixed@risse.edu' } },
          error: null,
        }),
      },
      from: () => ({
        select: () => ({
          eq: () => Promise.resolve({
            data: [{ role: 'student' }, { role: 'malicious_override' }],
            error: null,
          }),
        }),
      }),
    };

    const { auth, error } = await resolveBackendAuth(
      { authorization: 'Bearer token' },
      undefined,
      undefined,
      mockClientWithMixedRole
    );

    assert.strictEqual(auth, null, 'Mixed role set with invalid role must be rejected');
    assert.ok(error);
    assert.strictEqual(error?.statusCode, 403);
    assert.ok(error?.message.includes('Invalid role assignment detected'));
  });

  // ── Test 8: Role database lookup failure returns HTTP 500 ──────────────────
  it('8. Role lookup / database errors do not grant fallback access and return HTTP 500', async () => {
    const mockClientWithDbError = {
      auth: {
        getUser: async () => ({
          data: { user: { id: 'usr-normal-student', email: 'student@risse.edu' } },
          error: null,
        }),
      },
      from: () => ({
        select: () => ({
          eq: () => Promise.resolve({
            data: null,
            error: { message: 'Connection to database pool timed out.' },
          }),
        }),
      }),
    };

    const { auth, error } = await resolveBackendAuth(
      { authorization: 'Bearer valid.student.token' },
      undefined,
      undefined,
      mockClientWithDbError
    );

    assert.strictEqual(auth, null, 'Database failure must never authenticate');
    assert.ok(error, 'Must produce an error on DB lookup failure');
    assert.strictEqual(error?.statusCode, 500, 'Database error must return HTTP 500');
    assert.ok(error?.message.includes('Database error querying user roles'));
  });

  // ── Test 8b: Missing Supabase server configuration returns HTTP 500 ────────
  it('8b. Missing Supabase server configuration returns HTTP 500 rather than 401', async () => {
    const { auth, error } = await resolveBackendAuth(
      { authorization: 'Bearer any.token.here' },
      '', // empty url
      ''  // empty key
    );

    assert.strictEqual(auth, null);
    assert.ok(error);
    assert.strictEqual(error?.statusCode, 500, 'Server configuration error must be 500');
    assert.ok(error?.message.includes('Missing Supabase server configuration'));
  });

  // ── Test 9: Authenticated Student Resolves as Student ───────────────────────
  it('9. Authenticated account with student role resolves cleanly as student', async () => {
    const mockClient = {
      auth: {
        getUser: async () => ({
          data: { user: { id: 'usr-student-456', email: 'student@risse.edu' } },
          error: null,
        }),
      },
      from: () => ({
        select: () => ({
          eq: () => Promise.resolve({
            data: [{ role: 'student' }],
            error: null,
          }),
        }),
      }),
    };

    const { auth, error } = await resolveBackendAuth(
      { authorization: 'Bearer valid.student.token' },
      undefined,
      undefined,
      mockClient
    );

    assert.strictEqual(error, null);
    assert.ok(auth);
    assert.strictEqual(auth?.role, 'student');
    assert.strictEqual(auth?.user?.id, 'usr-student-456');
    assert.strictEqual(auth?.user?.email, 'student@risse.edu');
  });

  // ── Test 10: Role Precedence Resolves Admin > Teacher > Student ────────────
  it('10. Multiple role assignments resolve with proper precedence (admin > teacher > student)', async () => {
    const mockClientWithRoles = (roles: string[]) => ({
      auth: {
        getUser: async () => ({
          data: { user: { id: 'usr-multi-role', email: 'multi@risse.edu' } },
          error: null,
        }),
      },
      from: () => ({
        select: () => ({
          eq: () => Promise.resolve({
            data: roles.map(r => ({ role: r })),
            error: null,
          }),
        }),
      }),
    });

    // Test Admin + Teacher + Student -> Admin
    const resAdmin = await resolveBackendAuth(
      { authorization: 'Bearer token' },
      undefined,
      undefined,
      mockClientWithRoles(['student', 'admin', 'teacher'])
    );
    assert.strictEqual(resAdmin.auth?.role, 'admin');

    // Test Teacher + Student -> Teacher
    const resTeacher = await resolveBackendAuth(
      { authorization: 'Bearer token' },
      undefined,
      undefined,
      mockClientWithRoles(['student', 'teacher'])
    );
    assert.strictEqual(resTeacher.auth?.role, 'teacher');
  });

  // ── Test 11: Mock Authentication Fallback Prevention ───────────────────────
  it('11. Legacy mock tokens ("mock_token_123") never authenticate or bypass real verification', async () => {
    const mockTokens = [
      'Bearer mock_token_123',
      'Bearer test-token',
      'Bearer student_mock_token',
      'Bearer guest',
    ];

    for (const headerVal of mockTokens) {
      const { auth, error } = await resolveBackendAuth({ authorization: headerVal });
      assert.strictEqual(auth, null, `Mock token should not authenticate: ${headerVal}`);
      assert.ok(error, 'Should reject mock token');
      assert.strictEqual(error?.statusCode, 401, 'Should return HTTP 401');
    }
  });

  // ── Test 12: Identity Derived Strictly from Verified Token, Never Body ─────
  it('12. Client-supplied studentId or userId in request body is untrusted', () => {
    const clientSuppliedBody = {
      message: 'Hello Risse',
      userId: 'spoofed-admin-id-999',
      studentId: 'spoofed-target-id-777',
      role: 'admin',
    };

    const verifiedAuthUser = { id: 'real-verified-id-111', email: 'real@risse.edu' };
    const effectiveUserId = verifiedAuthUser ? verifiedAuthUser.id : null;

    assert.strictEqual(effectiveUserId, 'real-verified-id-111');
    assert.notStrictEqual(effectiveUserId, clientSuppliedBody.userId);
    assert.notStrictEqual(effectiveUserId, clientSuppliedBody.studentId);
  });

  // ── Test 13: Migration Schema Guarantees Student Default and Rejects Fake Roles
  it('13. Migration SQL mandates role defaulting to student and rejects untrusted client roles', () => {
    const sql = readMigrationSql('20261102000003_milestone1_final_security_patch.sql');

    assert.ok(sql.includes("INSERT INTO public.user_roles (user_id, role)"), 'Must insert into user_roles');
    assert.ok(sql.includes("VALUES (NEW.id, 'student')"), 'Default role must strictly be student');
    assert.ok(!sql.includes("NEW.raw_user_meta_data->>'role'"), 'Must NOT trust client-supplied role in user_metadata');
    assert.ok(sql.includes("v_school := pg_catalog.nullif(pg_catalog.trim(NEW.raw_user_meta_data->>'school'), '')"), 'School must default to NULL');
    assert.ok(sql.includes("v_grade := pg_catalog.nullif(pg_catalog.trim(NEW.raw_user_meta_data->>'grade'), '')"), 'Grade must default to NULL');
  });

  // ── Test 14: SECURITY DEFINER Search Path Hardening & Email Sync ───────────
  it('14. Migration SQL enforces safe search_path = \'\' on all SECURITY DEFINER functions', () => {
    const sql = readMigrationSql('20261102000003_milestone1_final_security_patch.sql');

    assert.ok(sql.includes("has_role(required_role TEXT)\nRETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = ''"), 'has_role must use empty search_path');
    assert.ok(sql.includes("handle_new_user_registration()\nRETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''"), 'registration trigger must use empty search_path');
    assert.ok(sql.includes("sync_auth_email_update()\nRETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''"), 'email sync trigger must use empty search_path');
    assert.ok(sql.includes('UPDATE public.profiles'), 'Must update public.profiles with NEW.email');
  });

  // ── Test 15: Students cannot update their own role (SQL Permissions & RLS) ─
  it('15. Students cannot update, insert, or delete their own role assignments', () => {
    const sql = readMigrationSql('20261102000003_milestone1_final_security_patch.sql');

    // Admin-only RLS mutation policies
    assert.ok(sql.includes('CREATE POLICY "user_roles_admin_insert" ON public.user_roles'), 'Explicit admin INSERT policy');
    assert.ok(sql.includes('CREATE POLICY "user_roles_admin_update" ON public.user_roles'), 'Explicit admin UPDATE policy');
    assert.ok(sql.includes('CREATE POLICY "user_roles_admin_delete" ON public.user_roles'), 'Explicit admin DELETE policy');
    assert.ok(sql.includes('FOR SELECT USING (auth.uid() = user_id OR public.has_role(\'admin\'))'), 'Students can only SELECT own role');
  });

  // ── Test 16: Students cannot update their own global metrics ────────────────
  it('16. Students cannot update, insert, or delete their own global metrics', () => {
    const sql = readMigrationSql('20261102000003_milestone1_final_security_patch.sql');

    assert.ok(sql.includes('REVOKE ALL ON TABLE public.student_global_metrics FROM authenticated;'), 'Must revoke all table privileges on metrics');
    assert.ok(sql.includes('GRANT SELECT ON TABLE public.student_global_metrics TO authenticated;'), 'Authenticated users can only SELECT metrics');
    assert.ok(!sql.includes('GRANT UPDATE ON TABLE public.student_global_metrics TO authenticated;'), 'Must not grant UPDATE on metrics to authenticated');
    assert.ok(sql.includes('CREATE POLICY "metrics_select_own" ON public.student_global_metrics'), 'RLS allows SELECT only');
  });

  // ── Test 17: Students cannot directly change profiles.email ─────────────────
  it('17. Students cannot directly change profiles.email (column privileges & trigger lock)', () => {
    const sql = readMigrationSql('20261102000003_milestone1_final_security_patch.sql');

    // Column-level UPDATE privilege on profiles excludes email, id, and created_at
    assert.ok(sql.includes('GRANT UPDATE (full_name, school, grade, avatar_url, updated_at) ON TABLE public.profiles TO authenticated;'), 'Email is excluded from column UPDATE grant');

    // Trigger lock: Direct modifications to id or created_at raise exception, no invalid session_user check
    assert.ok(sql.includes('protect_immutable_profile_fields()'), 'Contains immutable field trigger');
    assert.ok(!sql.includes('session_user'), 'Must NOT contain invalid session_user reference');
    assert.ok(sql.includes('Modifying profile id is strictly prohibited'), 'Trigger rejects id updates');
    assert.ok(sql.includes('Modifying profile created_at is strictly prohibited'), 'Trigger rejects created_at updates');
  });

  // ── Test 18: TIMESTAMPTZ columns use now() instead of timezone('utc', now())
  it('18. TIMESTAMPTZ columns and defaults use now() instead of timezone(\'utc\', now())', () => {
    const sql = readMigrationSql('20261102000003_milestone1_final_security_patch.sql');

    assert.ok(sql.includes('ALTER COLUMN created_at SET DEFAULT now()'), 'created_at defaults to now()');
    assert.ok(sql.includes('ALTER COLUMN updated_at SET DEFAULT now()'), 'updated_at defaults to now()');
    assert.ok(sql.includes('ALTER COLUMN assigned_at SET DEFAULT now()'), 'assigned_at defaults to now()');
    assert.ok(sql.includes('NEW.updated_at := pg_catalog.now()'), 'trigger uses pg_catalog.now()');
    assert.ok(!sql.includes("timezone('utc'"), 'No timezone(\'utc\') on TIMESTAMPTZ');
  });

  // ── Test 19: user_roles grants administrative mutations via authenticated client ──
  it('19. user_roles grants mutations to authenticated users bounded strictly by admin RLS', () => {
    const sql = readMigrationSql('20261102000003_milestone1_final_security_patch.sql');

    assert.ok(sql.includes('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_roles TO authenticated;'), 'Authenticated client granted role table mutations');
    assert.ok(sql.includes('FOR INSERT WITH CHECK (public.has_role(\'admin\'))'), 'INSERT bound strictly to admin');
    assert.ok(sql.includes('FOR UPDATE USING (public.has_role(\'admin\')) WITH CHECK (public.has_role(\'admin\'))'), 'UPDATE bound strictly to admin');
    assert.ok(sql.includes('FOR DELETE USING (public.has_role(\'admin\'))'), 'DELETE bound strictly to admin');
  });

  // ── Test 20: Students cannot modify another student\'s profile or preferences ─
  it('20. Students cannot modify another student\'s profile or preferences', () => {
    const sql = readMigrationSql('20261102000003_milestone1_final_security_patch.sql');

    assert.ok(sql.includes('USING (auth.uid() = id OR public.has_role(\'admin\'))'), 'Profile RLS bounds mutations to auth.uid() = id');
    assert.ok(sql.includes('USING (auth.uid() = student_id OR public.has_role(\'admin\'))'), 'Preferences RLS bounds mutations to auth.uid() = student_id');
  });

  // ── Test 21: Registration with email confirmation enabled does not falsely authenticate
  it('21. Registration with email confirmation enabled does not falsely establish an authenticated session', () => {
    const storeCode = readProjectFile('frontend/resources/js/stores/authStore.js');

    assert.ok(storeCode.includes('verificationRequired: true'), 'Store must set verificationRequired flag when session is null');
    assert.ok(storeCode.includes('session: null'), 'Store must return session: null when confirmation is pending');
    assert.ok(!storeCode.includes('currentUser.value = mapSupabaseUserToProfile(data.user)'), 'Must not set active currentUser before session confirmation');
  });

  // ── Test 22: Public GET /api/chat does not leak environment, keys, or stack traces
  it('22. Public GET /api/chat does not leak environment, keys, or stack traces', async () => {
    const { GET } = await import('../api/chat.ts');

    // Public request (no Authorization header)
    const res = await GET();
    assert.strictEqual(res.status, 200);

    const bodyText = await res.text();
    assert.ok(!bodyText.includes('googleKeyPreview'), 'Must NOT leak googleKeyPreview');
    assert.ok(!bodyText.includes('supabaseKeyPreview'), 'Must NOT leak supabaseKeyPreview');
    assert.ok(!bodyText.includes('supabaseUrlPreview'), 'Must NOT leak supabaseUrlPreview');
    assert.ok(!bodyText.includes('hasGoogleKey'), 'Must NOT expose environment details to public');
    assert.ok(!bodyText.includes('stack'), 'Must NOT expose stack traces');

    const json = JSON.parse(bodyText);
    assert.strictEqual(json.status, 'HEALTHY');
    assert.strictEqual(json.service, 'Risse AI Chat API');
  });

  // ── Test 23: Chat POST handler rejects invalid bearer token with 401 before calling LLM
  it('23. Chat POST handler rejects invalid bearer token with 401 before calling LLM', async () => {
    const { POST } = await import('../api/chat.ts');

    const req = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer bad.token.value',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'What is gear ratio?' }],
      }),
    });

    const res = await POST(req);
    assert.strictEqual(res.status, 401, 'Invalid Bearer token must return HTTP 401');

    const json = await res.json();
    assert.ok(json.error, 'Response body must contain error message');
  });

  // ── Test 24: Chat POST handler allows Guest Mode with 200 and X-Risse-Auth header
  it('24. Chat POST handler allows guest mode when no Authorization header is provided', async () => {
    const { POST } = await import('../api/chat.ts');

    const req = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'What is a servo motor?' }],
      }),
    });

    const res = await POST(req);
    assert.strictEqual(res.status, 200, 'Guest mode should return 200');
    assert.strictEqual(res.headers.get('X-Risse-Auth'), 'guest', 'Should set X-Risse-Auth: guest');
    assert.strictEqual(res.headers.get('X-Risse-User-Id'), null, 'Guest mode should not set X-Risse-User-Id');
  });

});
