# RISSE AI — Phase 2 Milestone 1: Supabase Authentication Foundation & Security Hardening
## Changelog & Verification Guide

### 1. Overview
This milestone establishes production-grade Supabase Authentication for RISSE AI, migrating completely away from mock `localStorage` credentials while strictly preserving Phase 1 Adaptive Teaching Intelligence, Socratic tutoring, and Competition mode. It incorporates comprehensive security hardening across database privileges, Row-Level Security (RLS), SECURITY DEFINER search paths, fail-closed backend authentication, role set rejection, diagnostic leak prevention, and email verification gating.

---

### 2. Changes Implemented

| File / Resource | Type | Description |
|---|---|---|
| `supabase/migrations/20261102000001_core_profiles_roles.sql` | **Primary Migration** | Defines `profiles`, `user_roles`, `student_preferences`, and `student_global_metrics`. Features hardened `search_path = ''` on all SECURITY DEFINER functions, student role auto-provisioning trigger, column-level UPDATE privileges on profiles, immutable field lock trigger (`id`, `created_at`, direct `email`), and admin-only role mutation RLS. |
| `supabase/migrations/20261102000002_harden_auth_security.sql` | **Corrective Migration** | Idempotent corrective migration applying security hardening rules without dropping existing tables or data. Safe to execute on existing databases where migration 1 was already run. |
| `supabase/migrations/20261102000003_milestone1_final_security_patch.sql` | **Final Security Patch Migration** | Removes invalid `session_user` check, normalizes all TIMESTAMPTZ defaults to `now()`, grants table mutations on `user_roles` to `authenticated` bounded by admin RLS, and sets `search_path = ''`. |
| `frontend/resources/js/lib/supabaseClient.js` | **New File** | Production Supabase client singleton configured with session persistence in `localStorage`, auto token refresh, and environment variable fallbacks. |
| `frontend/resources/js/stores/authStore.js` | **Refactored & Hardened** | Completely replaced mock credentials and plaintext passwords with real `supabase.auth` methods (`signUp`, `signInWithPassword`, `signOut`, `getSession`, `onAuthStateChange`). Dynamically loads user profile, role, preferences, and metrics from Supabase tables. Gated email verification flow (`verificationRequired: true` when `session` is null, preventing false authenticated state). |
| `frontend/resources/js/views/AuthView.vue` | **Updated & Hardened** | Wired login and registration forms to the async Supabase auth methods. Added real-time error messages, loading indicators, 6-character password validation, and email confirmation requirement feedback (prevents false login before confirmation). |
| `lib/serverAuth.ts`<br>`frontend/lib/serverAuth.ts` | **Hardened Module** | Fail-closed server-side JWT verification middleware. Enforces strict Authorization header rules: missing header enters guest mode; whitespace-only header returns 401; Bearer without token returns 401; invalid or expired token returns 401; authenticated user with no role returns 403; unexpected or mixed role values reject entire role set with 403; database error querying user roles returns 500 (fail-closed); missing server-side Supabase configuration returns 500. |
| `api/chat.ts`<br>`frontend/api/chat.ts` | **Updated & Hardened** | Integrated `resolveBackendAuth` into Node serverless and Web handlers. Missing header enters guest mode; malformed or expired token returns HTTP 401; user without role returns HTTP 403; DB error returns HTTP 500. Sets `X-Risse-Auth` and `X-Risse-User-Id` response headers. Removed public diagnostic disclosure (no key previews, no env config leaks, detailed diagnostics restricted to admin role). Catch blocks log server-side while returning client-safe generic errors. |
| `frontend/resources/js/components/CheckpointContentView.vue`<br>`frontend/resources/js/components/conversation/ConversationPanel.vue` | **Updated** | Updated streaming chat fetch calls to dynamically retrieve the session access token via `authStore.getAuthToken()` and attach `Authorization: Bearer <token>` when authenticated. Multi-layered anti-leak regex cleans accidental directive artifacts before rendering. |
| `frontend/vite.config.js` | **Updated** | Configured Vite dev middleware to forward incoming `Authorization` headers to the chat SSR module. |
| `tests/auth-milestone1.test.ts` | **Expanded Test Suite** | 26 automated unit and integration tests covering fail-closed auth, role precedence, mock token rejection, request tampering prevention, SQL privilege enforcement, immutable fields, email verification gating, diagnostic leak prevention, and chat endpoint contracts. |

---

### 3. Ways to Test if the Implementation is a Success

#### Test Method 1: Automated Unit & Integration Tests (Command Line)
Run the automated test suite directly from your terminal:
```bash
npm --prefix frontend test
```
**Expected Success Result:**
- **37 tests pass** across 2 test suites (0 failures):
  - **26/26** Phase 2 Milestone 1 Authentication & Security tests pass.
  - **11/11** Phase 1 Adaptive Teaching Intelligence tests pass.

---

#### Test Method 2: Apply Database Migration (Supabase Dashboard)
1. Open your Supabase Project Dashboard (`https://supabase.com/dashboard/project/zmhncazedwvyuxrzucwv`).
2. Navigate to **SQL Editor** in the left sidebar.
3. Depending on your current database state:
   - **Fresh install:** Paste and run [`supabase/migrations/20261102000001_core_profiles_roles.sql`](file:///d:/Websites/RissePages/supabase/migrations/20261102000001_core_profiles_roles.sql) then [`supabase/migrations/20261102000003_milestone1_final_security_patch.sql`](file:///d:/Websites/RissePages/supabase/migrations/20261102000003_milestone1_final_security_patch.sql).
   - **Existing instance:** Run [`supabase/migrations/20261102000003_milestone1_final_security_patch.sql`](file:///d:/Websites/RissePages/supabase/migrations/20261102000003_milestone1_final_security_patch.sql).
4. **Verify in Table Editor / Schema:**
   - `public.profiles` exists with column-level UPDATE restrictions (email, id, created_at excluded).
   - `public.user_roles` exists with check constraint (`student`, `teacher`, `admin`), mutation grants to `authenticated`, and admin-only RLS policies.
   - `public.student_preferences` and `public.student_global_metrics` exist.
   - Triggers `handle_new_user_registration`, `sync_auth_email_update`, and `protect_immutable_profile_fields` are active with `SET search_path = ''`.
   - All defaults and triggers on TIMESTAMPTZ columns evaluate `now()`.

---

#### Test Method 3: Browser UI Verification (Registration, Login & Email Verification)
1. Start the application launcher:
   ```cmd
   start.bat
   ```
   Or run the Vite dev server:
   ```bash
   cd frontend
   npm run dev
   ```
2. Open `http://localhost:5173` (or `http://127.0.0.1:8000`).
3. Click on the user profile / login icon to open `/auth` (or `/login`).
4. **Test New Registration:**
   - Sign up with a new email and password (minimum 6 characters).
   - **If Supabase Email Confirmation is ON:** Notice that the UI displays `"Account created! Please check your email to verify your account before logging in."` and does NOT log you in automatically.
   - **If Supabase Email Confirmation is OFF:** Notice that you are automatically logged in and redirected.
   - In Supabase Dashboard -> **Authentication -> Users**, confirm the user was created.
   - In Supabase Dashboard -> **Table Editor -> user_roles**, confirm a row was automatically created for this user with `role = 'student'`.
   - In **profiles**, confirm `school` and `grade` default to `NULL` if not specified.
5. **Test Session Persistence:**
   - Refresh the browser (`F5` or `Ctrl+R`).
   - Verify that your authentication state and student name persist.
6. **Test Logout:**
   - Click Logout in the user menu.
   - Verify `authStore.isAuthenticated` becomes `false` and all session tokens in `localStorage` are cleared.

---

#### Test Method 4: API Endpoint Security & Guest Mode (cURL / HTTP)
You can verify the backend fail-closed contract directly:

1. **Guest Mode (No Authorization Header):**
   ```bash
   curl -i -X POST http://127.0.0.1:5173/api/chat ^
     -H "Content-Type: application/json" ^
     -d "{\"messages\":[{\"role\":\"user\",\"content\":\"What is torque?\"}]}"
   ```
   *Expected Response:* HTTP 200 Streaming with header `X-Risse-Auth: guest`.

2. **Whitespace-Only Header (Fail-Closed):**
   ```bash
   curl -i -X POST http://127.0.0.1:5173/api/chat ^
     -H "Content-Type: application/json" ^
     -H "Authorization:    " ^
     -d "{\"messages\":[{\"role\":\"user\",\"content\":\"What is torque?\"}]}"
   ```
   *Expected Response:* HTTP 401 Unauthorized (`Malformed authorization header: Header value cannot be empty or whitespace-only`).

3. **Bearer Without Token (Fail-Closed):**
   ```bash
   curl -i -X POST http://127.0.0.1:5173/api/chat ^
     -H "Content-Type: application/json" ^
     -H "Authorization: Bearer" ^
     -d "{\"messages\":[{\"role\":\"user\",\"content\":\"What is torque?\"}]}"
   ```
   *Expected Response:* HTTP 401 Unauthorized (`Malformed authorization header: Missing Bearer token`).

4. **Invalid Bearer Token (Fail-Closed):**
   ```bash
   curl -i -X POST http://127.0.0.1:5173/api/chat ^
     -H "Content-Type: application/json" ^
     -H "Authorization: Bearer invalid_fake_token_123" ^
     -d "{\"messages\":[{\"role\":\"user\",\"content\":\"What is torque?\"}]}"
   ```
   *Expected Response:* HTTP 401 Unauthorized with JSON error message.

5. **Malformed Authorization Header (Fail-Closed):**
   ```bash
   curl -i -X POST http://127.0.0.1:5173/api/chat ^
     -H "Content-Type: application/json" ^
     -H "Authorization: Basic dXNlcjpwYXNz" ^
     -d "{\"messages\":[{\"role\":\"user\",\"content\":\"What is torque?\"}]}"
   ```
   *Expected Response:* HTTP 401 Unauthorized (`Unsupported authorization scheme. Expected "Bearer <token>"`).

6. **Public Diagnostic Health Check (GET /api/chat):**
   ```bash
   curl -i -X GET http://127.0.0.1:5173/api/chat
   ```
   *Expected Response:* HTTP 200 JSON with status `HEALTHY` and NO leaked environment variables, API key previews, or stack traces.
