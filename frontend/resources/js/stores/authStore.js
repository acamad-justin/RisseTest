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

export const DEMO_MENTOR_UUID = 'd1e00000-0000-4000-a000-000000000101';
export const DEMO_STUDENT_1_UUID = '19e54c4f-d062-42b0-8b08-fc88a7afdbb3';
export const DEMO_STUDENT_2_UUID = '3e81050f-95b9-4753-978c-5c17e4224b8e';

export function saveActiveUserLocally(user, role) {
  try {
    if (typeof window !== 'undefined' && window.localStorage && user) {
      localStorage.setItem('risse_active_user', JSON.stringify({ user, role }));
    }
  } catch (_) {}
}

export function clearActiveUserLocally() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('risse_active_user');
    }
  } catch (_) {}
}

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
    saveActiveUserLocally(currentUser.value, role);

    // Auto-heal bloated session JWT: If user_metadata contains a heavy base64 data URL,
    // preserve it in localStorage and purge from Supabase user_metadata so the JWT
    // stays small (<2KB) and never triggers Vercel HTTP 494 (Request Header Too Large).
    if (session.user.user_metadata?.avatar && typeof session.user.user_metadata.avatar === 'string' && session.user.user_metadata.avatar.startsWith('data:')) {
      const email = session.user.email || session.user.id;
      try {
        const localKey = `risse_profile_${email.toLowerCase().trim().replace(/[^a-z0-9]/g, '_')}`;
        const existing = JSON.parse(localStorage.getItem(localKey) || '{}');
        if (!existing.user) existing.user = {};
        if (!existing.user.avatar) existing.user.avatar = session.user.user_metadata.avatar;
        localStorage.setItem(localKey, JSON.stringify(existing));
      } catch (_) {}
      supabase.auth.updateUser({ data: { avatar: null } }).catch(() => {});
    }
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
    } else {
      // Restore persisted session from localStorage if present
      try {
        const stored = localStorage.getItem('risse_active_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.user) {
            if (parsed.user.id === 'mentor-ramon-bautista') {
              parsed.user.id = DEMO_MENTOR_UUID;
              saveActiveUserLocally(parsed.user, parsed.role || 'teacher');
            }
            currentUser.value = parsed.user;
            userRole.value = parsed.role || 'student';
            roleCache.set(parsed.user.id, parsed.role || 'student');
          }
        }
      } catch (_) {}
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
  purgeModuleCaches();

  if (!cleanEmail || !cleanPass) {
    return { success: false, message: 'Please provide both email and password.' };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPass,
    });

    if (error) {
      // Demo fallback if accounts are simulated offline
      if (cleanEmail === 'mentor@risse.edu' && cleanPass === 'password123') {
        const mentorUser = {
          id: DEMO_MENTOR_UUID,
          email: 'mentor@risse.edu',
          name: 'PROF. RAMON BAUTISTA',
          school: 'Rizal Polytechnic de Muntinlupa',
          grade: 'Faculty Mentor',
          avatar: null,
          role: 'teacher',
          createdAt: new Date().toISOString(),
        };
        currentUser.value = mentorUser;
        userRole.value = 'teacher';
        roleCache.set(mentorUser.id, 'teacher');
        saveActiveUserLocally(mentorUser, 'teacher');
        return { success: true, user: mentorUser };
      }

      if (cleanEmail === 'demo1@acamad.com' && cleanPass === 'acamaddemo1') {
        const student1 = {
          id: DEMO_STUDENT_1_UUID,
          email: 'demo1@acamad.com',
          name: 'Demo Student 1',
          school: 'Acamad Robotics Institute',
          grade: 'Grade 10 (STEM)',
          avatar: null,
          role: 'student',
          createdAt: new Date().toISOString(),
        };
        currentUser.value = student1;
        userRole.value = 'student';
        roleCache.set(student1.id, 'student');
        saveActiveUserLocally(student1, 'student');
        return { success: true, user: student1 };
      }

      if (cleanEmail === 'demo2@acamad.com' && cleanPass === 'acamaddemo2') {
        const student2 = {
          id: DEMO_STUDENT_2_UUID,
          email: 'demo2@acamad.com',
          name: 'Demo Student 2',
          school: 'Acamad Robotics Institute',
          grade: 'Grade 11 (STEM)',
          avatar: null,
          role: 'student',
          createdAt: new Date().toISOString(),
        };
        currentUser.value = student2;
        userRole.value = 'student';
        roleCache.set(student2.id, 'student');
        saveActiveUserLocally(student2, 'student');
        return { success: true, user: student2 };
      }

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
      // Demo fallback if accounts are simulated offline
      if (cleanEmail === 'mentor@risse.edu' && cleanPass === 'password123') {
        const mentorUser = {
          id: DEMO_MENTOR_UUID,
          email: 'mentor@risse.edu',
          name: 'PROF. RAMON BAUTISTA',
          school: 'Rizal Polytechnic de Muntinlupa',
          grade: 'Faculty Mentor',
          avatar: null,
          role: 'teacher',
          createdAt: new Date().toISOString(),
        };
        currentUser.value = mentorUser;
        userRole.value = 'teacher';
        roleCache.set(mentorUser.id, 'teacher');
        saveActiveUserLocally(mentorUser, 'teacher');
        return { success: true, user: mentorUser };
      }

      if (cleanEmail === 'demo1@acamad.com' && cleanPass === 'acamaddemo1') {
        const student1 = {
          id: DEMO_STUDENT_1_UUID,
          email: 'demo1@acamad.com',
          name: 'Demo Student 1',
          school: 'Acamad Robotics Institute',
          grade: 'Grade 10 (STEM)',
          avatar: null,
          role: 'student',
          createdAt: new Date().toISOString(),
        };
        currentUser.value = student1;
        userRole.value = 'student';
        roleCache.set(student1.id, 'student');
        saveActiveUserLocally(student1, 'student');
        return { success: true, user: student1 };
      }

      if (cleanEmail === 'demo2@acamad.com' && cleanPass === 'acamaddemo2') {
        const student2 = {
          id: DEMO_STUDENT_2_UUID,
          email: 'demo2@acamad.com',
          name: 'Demo Student 2',
          school: 'Acamad Robotics Institute',
          grade: 'Grade 11 (STEM)',
          avatar: null,
          role: 'student',
          createdAt: new Date().toISOString(),
        };
        currentUser.value = student2;
        userRole.value = 'student';
        roleCache.set(student2.id, 'student');
        saveActiveUserLocally(student2, 'student');
        return { success: true, user: student2 };
      }

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
  purgeModuleCaches();
  if (userId === 'usr_mentor' || userId === 'mentor') {
    const res = await login('mentor@risse.edu', 'password123');
    if (res.success && res.user) return res;

    const mentorUser = {
      id: DEMO_MENTOR_UUID,
      email: 'mentor@risse.edu',
      name: 'PROF. RAMON BAUTISTA',
      school: 'Rizal Polytechnic de Muntinlupa',
      grade: 'Faculty / Lead Mentor',
      avatar: null,
      role: 'teacher',
      createdAt: new Date().toISOString(),
    };
    currentUser.value = mentorUser;
    userRole.value = 'teacher';
    roleCache.set(mentorUser.id, 'teacher');
    saveActiveUserLocally(mentorUser, 'teacher');
    return { success: true, user: mentorUser };
  }

  if (userId === 'demo2' || userId === 'usr_demo2' || userId === 'usr_sofia' || userId === 'sofia') {
    return login('demo2@acamad.com', 'acamaddemo2');
  }

  return login('demo1@acamad.com', 'acamaddemo1');
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
    if (updatedData.avatar !== undefined) {
      // Do not store base64 data URLs in Supabase Auth user_metadata to keep JWT header under 2KB
      if (typeof updatedData.avatar === 'string' && updatedData.avatar.startsWith('data:')) {
        updates.avatar = null;
      } else {
        updates.avatar = updatedData.avatar;
      }
    }

    try {
      await supabase.auth.updateUser({
        data: updates,
      });
    } catch (_) {}

    // Update public.profiles if session exists
    try {
      if (currentUser.value?.id) {
        const profileUpdates = {};
        if (updates.full_name) profileUpdates.full_name = updates.full_name;
        if (updates.school !== undefined) profileUpdates.school = updates.school;
        if (updates.grade !== undefined) profileUpdates.grade = updates.grade;
        if (updates.avatar !== undefined) profileUpdates.avatar_url = updates.avatar;
        await supabase.from('profiles').update(profileUpdates).eq('id', currentUser.value.id);
      }
    } catch (_) {}

    // Refresh current user in memory and localStorage
    if (currentUser.value) {
      currentUser.value = {
        ...currentUser.value,
        name: updates.full_name || currentUser.value.name,
        school: updates.school !== undefined ? updates.school : currentUser.value.school,
        grade: updates.grade !== undefined ? updates.grade : currentUser.value.grade,
        avatar: updates.avatar !== undefined ? updates.avatar : currentUser.value.avatar,
      };
      saveActiveUserLocally(currentUser.value, userRole.value);
    }
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Purge Stale LocalStorage Module Catalogs Across Sessions
 */
export function purgeModuleCaches() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('risse_')) {
          if (
            key.includes('explore_modules') ||
            key.includes('enrolled_modules') ||
            key.includes('courses') ||
            key.includes('students') ||
            key.includes('sections') ||
            key.includes('curriculum_proposals') ||
            key.includes('active_module') ||
            key.includes('course_materials') ||
            key.includes('unenrollment')
          ) {
            keysToRemove.push(key);
          }
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    }
  } catch (_) {}

  // Synchronously reset service caches
  try {
    import('../../../lib/student/studentSyncService.ts').then(({ StudentSyncService }) => {
      StudentSyncService?.purgeAllCaches?.();
    }).catch(() => {});
    import('../../../lib/mentor/mentorService.ts').then(({ MentorService }) => {
      MentorService?.resetTestState?.();
    }).catch(() => {});
  } catch (_) {}
}

/**
 * Sign Out
 */
async function logout() {
  try {
    await supabase.auth.signOut();
  } catch (_) {}
  clearActiveUserLocally();
  purgeModuleCaches();
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

    const token = session?.access_token || null;
    // Guard against Vercel HTTP 494 (Request Header Too Large):
    // Standard Vercel limit is 16KB per header. If token exceeds 8KB, omit it and heal user metadata.
    if (token && token.length > 8192) {
      console.warn('[AuthStore] JWT access_token is unusually large (>8KB). Suppressing to prevent HTTP 494.');
      if (session?.user?.user_metadata?.avatar?.startsWith('data:')) {
        supabase.auth.updateUser({ data: { avatar: null } }).catch(() => {});
      }
      return null;
    }

    return token;
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
  purgeModuleCaches,
  getAuthToken,
});

export function useAuthStore() {
  return storeInstance;
}
