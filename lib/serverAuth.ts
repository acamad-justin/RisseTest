// lib/serverAuth.ts
/**
 * Shared Server-Side Supabase Authentication & Role Verification Middleware.
 * Enforces fail-closed token validation, guest mode isolation, role hierarchy,
 * and database/infrastructure error boundaries.
 */

import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient, User } from '@supabase/supabase-js';

export interface AuthContext {
  isAuthenticated: boolean;
  user: User | null;
  role: 'student' | 'teacher' | 'admin' | 'guest';
  supabaseUserClient: SupabaseClient | null;
}

export interface AuthError {
  statusCode: 401 | 403 | 500;
  message: string;
}

export interface ResolveAuthResult {
  auth: AuthContext | null;
  error: AuthError | null;
}

/**
 * Valid allowed application roles.
 */
const VALID_ROLES = new Set(['student', 'teacher', 'admin']);

/**
 * Resolves and validates caller identity from Bearer JWT.
 * 
 * Rules:
 * - Missing Authorization header -> Allowed guest mode (stateless, no persistent DB access).
 * - Whitespace-only or empty supplied header -> Immediate 401 Unauthorized.
 * - Malformed, unsupported scheme, or missing token -> Immediate 401 Unauthorized.
 * - Invalid or expired credentials -> Immediate 401 Unauthorized.
 * - Authenticated account without a valid role in user_roles -> Immediate 403 Forbidden.
 * - Any invalid/unrecognized role in user_roles -> Immediate 403 Forbidden (rejects entire set).
 * - Database query failure on user_roles -> Immediate 500 Internal Server Error (fail-closed).
 * - Missing server-side Supabase configuration -> Immediate 500 Internal Server Error.
 */
export async function resolveBackendAuth(
  reqHeaders: any,
  supabaseUrl?: string,
  supabaseKey?: string,
  clientOverride?: any
): Promise<ResolveAuthResult> {
  const getHeader = (name: string): string | undefined => {
    if (!reqHeaders) return undefined;
    if (typeof reqHeaders.get === 'function') {
      const val = reqHeaders.get(name);
      return val !== null && val !== undefined ? val : undefined;
    }
    const rec = reqHeaders as Record<string, string | undefined>;
    return rec[name] !== undefined ? rec[name] : (rec[name.toLowerCase()] !== undefined ? rec[name.toLowerCase()] : rec[name.toUpperCase()]);
  };

  const authHeader = getHeader('authorization');

  // ── 1. Absent Header: Explicitly Supported Stateless Guest Mode ───────────
  if (authHeader === undefined || authHeader === null) {
    return {
      auth: {
        isAuthenticated: false,
        user: null,
        role: 'guest',
        supabaseUserClient: null,
      },
      error: null,
    };
  }

  const rawHeader = String(authHeader);
  const trimmed = rawHeader.trim();

  // Supplied header is empty or whitespace-only -> 401
  if (!trimmed) {
    return {
      auth: null,
      error: {
        statusCode: 401,
        message: 'Malformed authorization header: Header value cannot be empty or whitespace-only.',
      },
    };
  }

  // ── 2. Scheme Validation: Must be Bearer with Token ───────────────────────
  if (trimmed.toLowerCase() === 'bearer') {
    return {
      auth: null,
      error: {
        statusCode: 401,
        message: 'Malformed authorization header: Missing Bearer token.',
      },
    };
  }

  if (!trimmed.toLowerCase().startsWith('bearer ')) {
    return {
      auth: null,
      error: {
        statusCode: 401,
        message: 'Unsupported authorization scheme. Expected "Bearer <token>".',
      },
    };
  }

  const token = trimmed.slice(7).trim();
  if (!token) {
    return {
      auth: null,
      error: {
        statusCode: 401,
        message: 'Malformed authorization header: Missing Bearer token.',
      },
    };
  }

  const resolvedUrl = supabaseUrl !== undefined ? supabaseUrl : (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '');
  const resolvedKey = supabaseKey !== undefined ? supabaseKey : (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '');

  // Missing server-side configuration is an infrastructure error (HTTP 500)
  if (!clientOverride && (!resolvedUrl || !resolvedKey)) {
    return {
      auth: null,
      error: {
        statusCode: 500,
        message: 'Authentication service unavailable: Missing Supabase server configuration.',
      },
    };
  }

  // ── 3. Create User-Scoped Client Bound to Caller's JWT ────────────────────
  const userClient = clientOverride || createClient(resolvedUrl, resolvedKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  // ── 4. Verify Token with Supabase Auth Server (Fail-Closed) ───────────────
  const { data: userData, error: authError } = await userClient.auth.getUser(token);
  if (authError || !userData?.user) {
    return {
      auth: null,
      error: {
        statusCode: 401,
        message: `Invalid or expired authentication credentials: ${authError?.message || 'User not found'}`,
      },
    };
  }

  const user = userData.user;

  // ── 5. Verify & Resolve Application Role from user_roles ──────────────────
  const { data: roleData, error: roleError } = await userClient
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  if (roleError) {
    // Database query failure must return 500, not 403 or guest fallback
    return {
      auth: null,
      error: {
        statusCode: 500,
        message: `Database error querying user roles: ${roleError.message || 'Lookup failed'}`,
      },
    };
  }

  const rawRoles = (roleData || []).map((r: any) => r.role);

  if (!rawRoles || rawRoles.length === 0) {
    return {
      auth: null,
      error: {
        statusCode: 403,
        message: 'Forbidden: Account does not have an assigned application role.',
      },
    };
  }

  // Reject the entire role assignment set if ANY returned role is invalid
  const hasInvalidRole = rawRoles.some((r: any) => typeof r !== 'string' || !VALID_ROLES.has(r));
  if (hasInvalidRole) {
    return {
      auth: null,
      error: {
        statusCode: 403,
        message: 'Forbidden: Invalid role assignment detected in user roles.',
      },
    };
  }

  // Explicit Role Precedence: admin > teacher > student
  let resolvedRole: 'student' | 'teacher' | 'admin' = 'student';
  if (rawRoles.includes('admin')) {
    resolvedRole = 'admin';
  } else if (rawRoles.includes('teacher')) {
    resolvedRole = 'teacher';
  } else if (rawRoles.includes('student')) {
    resolvedRole = 'student';
  }

  return {
    auth: {
      isAuthenticated: true,
      user,
      role: resolvedRole,
      supabaseUserClient: userClient,
    },
    error: null,
  };
}
