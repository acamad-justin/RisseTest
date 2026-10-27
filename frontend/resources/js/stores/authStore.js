import { ref, computed, reactive, watch } from 'vue';

const STORAGE_ACCOUNTS_KEY = 'risse_registered_accounts';
const STORAGE_ACTIVE_USER_ID_KEY = 'risse_active_user_id';

const DEFAULT_ACCOUNTS = [
  {
    id: 'usr_adriel',
    name: 'ADRIEL JUSTIN DELA CRUZ',
    email: 'adriel@risse.edu',
    password: 'password123',
    school: 'Rizal Polytechnic de Muntinlupa',
    grade: 'Grade 10',
    avatar: null,
    createdAt: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'usr_sofia',
    name: 'SOFIA RAMIREZ',
    email: 'sofia@risse.edu',
    password: 'password123',
    school: 'Philippine Science High School',
    grade: 'Grade 11',
    avatar: null,
    createdAt: '2026-02-10T09:30:00.000Z',
  },
];

function getStoredAccounts() {
  try {
    const raw = localStorage.getItem(STORAGE_ACCOUNTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading accounts from localStorage', e);
  }
  // Initialize with defaults if empty
  try {
    localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
  } catch (e) {}
  return [...DEFAULT_ACCOUNTS];
}

function getStoredActiveUserId() {
  try {
    return localStorage.getItem(STORAGE_ACTIVE_USER_ID_KEY);
  } catch (e) {
    return null;
  }
}

// Global reactive state
const accounts = ref(getStoredAccounts());
const activeUserId = ref(getStoredActiveUserId());

// Active user object derived from accounts
const currentUser = computed(() => {
  if (!activeUserId.value) return null;
  return accounts.value.find(u => u.id === activeUserId.value) || null;
});

export function sanitizeEmail(email) {
  if (!email || typeof email !== 'string') return '';
  return email.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
}

const currentUserEmail = computed(() => {
  return currentUser.value?.email?.toLowerCase().trim() || '';
});

const isAuthenticated = computed(() => currentUser.value !== null);

function persistAccounts() {
  try {
    localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts.value));
  } catch (e) {}
}

function setActiveUserId(id) {
  activeUserId.value = id;
  try {
    if (id) {
      localStorage.setItem(STORAGE_ACTIVE_USER_ID_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_ACTIVE_USER_ID_KEY);
    }
  } catch (e) {}
}

/**
 * Login with email and password
 */
function login(email, password) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();

  if (!cleanEmail || !cleanPass) {
    return { success: false, message: 'Please provide both email and password.' };
  }

  const user = accounts.value.find(u => u.email.toLowerCase() === cleanEmail);
  if (!user) {
    return { success: false, message: 'No account found with this email address.' };
  }

  if (user.password !== cleanPass) {
    return { success: false, message: 'Incorrect password. Please verify and try again.' };
  }

  setActiveUserId(user.id);
  return { success: true, user };
}

/**
 * Fast 1-click Demo Login
 */
function quickLogin(userId) {
  const user = accounts.value.find(u => u.id === userId);
  if (user) {
    setActiveUserId(user.id);
    return { success: true, user };
  }
  return { success: false, message: 'Demo account not found.' };
}

/**
 * Create a new learner account
 */
function register({ name, email, password, school, grade, avatar = null }) {
  const cleanName = (name || '').trim();
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();
  const cleanSchool = (school || '').trim() || 'Robotics Academy';
  const cleanGrade = (grade || '').trim() || 'Grade 10';

  if (!cleanName) {
    return { success: false, message: 'Please enter your full name.' };
  }
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, message: 'Please enter a valid email address.' };
  }
  if (!cleanPass || cleanPass.length < 4) {
    return { success: false, message: 'Password must be at least 4 characters long.' };
  }

  const existing = accounts.value.find(u => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    return { success: false, message: 'An account with this email already exists. Please sign in.' };
  }

  const newId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const newUser = {
    id: newId,
    name: cleanName.toUpperCase(),
    email: cleanEmail,
    password: cleanPass,
    school: cleanSchool,
    grade: cleanGrade,
    avatar: avatar || null,
    createdAt: new Date().toISOString(),
  };

  accounts.value.push(newUser);
  persistAccounts();
  setActiveUserId(newUser.id);

  return { success: true, user: newUser };
}

/**
 * Update the profile information for the active account
 */
function updateProfile(updatedData) {
  if (!currentUser.value) return false;

  const idx = accounts.value.findIndex(u => u.id === currentUser.value.id);
  if (idx !== -1) {
    const updated = {
      ...accounts.value[idx],
      ...updatedData,
    };
    if (updatedData.name) {
      updated.name = updatedData.name.toUpperCase();
    }
    accounts.value[idx] = updated;
    persistAccounts();
    return true;
  }
  return false;
}

/**
 * Sign out the current user
 */
function logout() {
  setActiveUserId(null);
}

const storeInstance = reactive({
  accounts,
  activeUserId,
  currentUser,
  currentUserEmail,
  sanitizeEmail,
  isAuthenticated,
  login,
  quickLogin,
  register,
  updateProfile,
  logout,
});

export function useAuthStore() {
  return storeInstance;
}
