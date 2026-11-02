// frontend/resources/js/stores/authStore.js
/**
 * RISSE AI — Authentication & Session Store (Supabase Auth).
 * Manages reactive user sessions, login, registration, and logout via Supabase Auth.
 * Replaces legacy plaintext localStorage simulation with secure JWT sessions.
 */

import { ref, computed, reactive } from 'vue';
import { supabase } from '../lib/supabaseClient.js';

// Reactive State
const currentUser = ref(null);
const currentSession = ref(null);
const userRole = ref('student');
const isAuthLoading = ref(true);
const authError = ref(null);

/**
 * Maps Supabase User to RISSE Application Profile
 */
function mapSupabaseUserToProfile(sbUser, role = 'student') {
  if (!sbUser) return null;
  const meta = sbUser.user_metadata || {};
  const email = sbUser.email || '';
  const fallbackName = email.split('@')[0].toUpperCase().replace(/[._-]/g, ' ');

  return {
    id: sbUser.id,
    email: email.toLowerCase().trim(),
    name: (meta.full_name || fallbackName || 'STUDENT LEARNER').toUpperCase(),
    school: meta.school || null,
    grade: meta.grade || null,
    avatar: meta.avatar || null,
    role: role,
    createdAt: sbUser.created_at || new Date().toISOString(),
  };
}

const roleCache = new Map();

/**
 * Resolves user role from user_roles table
 */
async function fetchUserRole(userId) {
  if (!userId) return 'student';
  if (roleCache.has(userId)) return roleCache.get(userId);

  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (error || !data || data.length === 0) {
      roleCache.set(userId, 'student');
      return 'student'; // Default fallback
    }
    const roles = data.map(r => r.role);
    let resolved = 'student';
    if (roles.includes('admin')) resolved = 'admin';
    else if (roles.includes('teacher')) resolved = 'teacher';
    roleCache.set(userId, resolved);
    return resolved;
  } catch (_) {
    roleCache.set(userId, 'student');
    return 'student';
  }
}

/**
 * Synchronizes reactive state with current Supabase session
 */
async function syncSession(session) {
  currentSession.value = session;
  if (session?.user) {
    const role = await fetchUserRole(session.user.id);
    userRole.value = role;
    currentUser.value = mapSupabaseUserToProfile(session.user, role);
  } else {
    currentUser.value = null;
    userRole.value = 'student';
  }
}

// ── Initialize Auth State on Store Load ─────────────────────────────────────
(async function initAuth() {
  try {
    isAuthLoading.value = true;
    const { data: { session }, error } = await supabase.auth.getSession();
    if (!error && session) {
      await syncSession(session);
    }
  } catch (e) {
    console.warn('[AuthStore] Session initialization error:', e);
  } finally {
    isAuthLoading.value = false;
  }

  // Subscribe to Auth State Changes (sign in, sign out, token refresh)
  supabase.auth.onAuthStateChange(async (event, session) => {
    await syncSession(session);
    if (event === 'SIGNED_OUT') {
      // Clean up any remaining legacy localStorage credentials
      try {
        localStorage.removeItem('risse_active_user_id');
        localStorage.removeItem('risse_registered_accounts');
      } catch (_) {}
    }
  });
})();

// Computed Getters
const isAuthenticated = computed(() => currentUser.value !== null);
const currentUserEmail = computed(() => currentUser.value?.email || '');

export function sanitizeEmail(email) {
  if (!email || typeof email !== 'string') return '';
  return email.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
}

/**
 * Authenticate with Email and Password
 */
async function login(email, password) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();
  authError.value = null;

  if (!cleanEmail || !cleanPass) {
    return { success: false, message: 'Please provide both email and password.' };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPass,
    });

    if (error) {
      authError.value = error.message;
      return { success: false, message: error.message };
    }

    if (data?.session) {
      await syncSession(data.session);
      return { success: true, user: currentUser.value, session: data.session };
    }

    return { success: false, message: 'Authentication returned no session.' };
  } catch (err) {
    authError.value = err?.message || 'Login failed.';
    return { success: false, message: authError.value };
  }
}

/**
 * Create a New Student Learner Account
 * Browser role metadata is never sent; role is provisioned as 'student' on server.
 */
async function register({ name, email, password, school = null, grade = null, avatar = null }) {
  const cleanName = (name || '').trim();
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();
  authError.value = null;

  if (!cleanName) {
    return { success: false, message: 'Please enter your full name.' };
  }
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, message: 'Please enter a valid email address.' };
  }
  if (!cleanPass || cleanPass.length < 6) {
    return { success: false, message: 'Password must be at least 6 characters long.' };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: cleanPass,
      options: {
        data: {
          full_name: cleanName.toUpperCase(),
          school: school ? school.trim() : null,
          grade: grade ? grade.trim() : null,
          avatar: avatar || null,
        },
      },
    });

    if (error) {
      authError.value = error.message;
      return { success: false, message: error.message };
    }

    if (data?.session) {
      await syncSession(data.session);
      return { success: true, user: currentUser.value, session: data.session, verificationRequired: false };
    }

    // Email confirmation required or user created without active session
    if (data?.user) {
      return {
        success: true,
        verificationRequired: true,
        user: mapSupabaseUserToProfile(data.user, 'student'),
        session: null,
        message: 'Account created! Please check your email to verify your account before logging in.',
      };
    }

    return { success: false, message: 'Registration returned no user.' };
  } catch (err) {
    authError.value = err?.message || 'Registration failed.';
    return { success: false, message: authError.value };
  }
}

/**
 * Fast Demo Login Helper (Attempts standard demo credentials)
 */
async function quickLogin(userId) {
  const demoEmail = userId === 'usr_sofia' || userId === 'sofia' ? 'sofia@risse.edu' : 'adriel@risse.edu';
  return login(demoEmail, 'password123');
}

/**
 * Update Profile Information
 */
async function updateProfile(updatedData) {
  if (!currentUser.value) return false;
  try {
    const updates = {};
    if (updatedData.name) updates.full_name = updatedData.name.toUpperCase();
    if (updatedData.school !== undefined) updates.school = updatedData.school;
    if (updatedData.grade !== undefined) updates.grade = updatedData.grade;
    if (updatedData.avatar !== undefined) updates.avatar = updatedData.avatar;

    const { error } = await supabase.auth.updateUser({
      data: updates,
    });

    if (error) return false;

    // Refresh current user
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      currentUser.value = mapSupabaseUserToProfile(user, userRole.value);
    }
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Sign Out
 */
async function logout() {
  try {
    await supabase.auth.signOut();
  } catch (_) {}
  roleCache.clear();
  currentUser.value = null;
  currentSession.value = null;
  userRole.value = 'student';
}

/**
 * Returns Fresh Access Token for Authorized API Calls
 */
async function getAuthToken() {
  try {
    let { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    // Check if token is expired or expiring in the next 60 seconds
    const nowSec = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at || 0;
    if (expiresAt && expiresAt <= nowSec + 60) {
      try {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (!refreshError && refreshData?.session?.access_token) {
          session = refreshData.session;
          await syncSession(session);
        } else {
          console.warn('[AuthStore] Session expired and cannot be refreshed; operating in guest mode:', refreshError?.message);
          return null;
        }
      } catch (refErr) {
        console.warn('[AuthStore] Token refresh exception:', refErr);
        return null;
      }
    }

    return session?.access_token || null;
  } catch (_) {
    return null;
  }
}

// Reactive Singleton Store Instance
const storeInstance = reactive({
  currentUser,
  currentSession,
  userRole,
  isAuthLoading,
  authError,
  isAuthenticated,
  currentUserEmail,
  sanitizeEmail,
  login,
  quickLogin,
  register,
  updateProfile,
  logout,
  getAuthToken,
});

export function useAuthStore() {
  return storeInstance;
}
