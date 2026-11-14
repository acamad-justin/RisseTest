<template>
  <div class="auth-page-root">
    <!-- Main Framed Showcase Container -->
    <div class="auth-showcase-card">
      
      <!-- ========================================================
           LEFT PANEL: The Risse Lab Showcase & Brand Hero
           ======================================================== -->
      <aside class="showcase-left-panel">
        <div class="panel-circuit-pattern"></div>
        <div class="panel-glow-orb orb-top"></div>
        <div class="panel-glow-orb orb-bottom"></div>

        <div class="showcase-content">
          <!-- Official Risse Logo -->
          <div class="showcase-logo-wrap">
            <img 
              :src="'/images/logos/risse_white.png'" 
              alt="Risse" 
              class="showcase-logo-img" 
              @error="logoFailed = true"
              v-if="!logoFailed"
            />
            <div v-else class="showcase-logo-fallback">
              <span class="fallback-dot">✦</span>
              <span class="fallback-text">RISSE</span>
            </div>
            <span class="showcase-tag-pill">Robotics & AI Mentorship</span>
          </div>

          <!-- Mascot Hero with floating animation -->
          <div class="mascot-stage">
            <div class="mascot-halo"></div>
            <img 
              :src="'/images/characters/risse-character.webp'" 
              alt="Risse Mascot" 
              class="mascot-img"
              @error="onMascotError"
              ref="mascotRef"
            />
            
            <!-- Socratic Mascot Speech Bubble -->
            <div class="mascot-speech-bubble">
              <span class="speech-sparkle">✨</span>
              <p class="speech-text">
                "Welcome to the lab! Sign in to keep your <strong>checkpoints</strong>, 
                <strong>AI chats</strong>, and earn <strong>mastery badges</strong>!"
              </p>
            </div>
          </div>

          <!-- 3 Value Pillars (Progress, AI Chats, Badges) -->
          <div class="pillars-list">
            <div class="pillar-card">
              <div class="pillar-icon-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="18" height="18">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div class="pillar-text">
                <span class="pillar-title">Save Learning Progress</span>
                <span class="pillar-desc">Constellations, roadmaps & step completions</span>
              </div>
            </div>

            <div class="pillar-card">
              <div class="pillar-icon-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="18" height="18">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div class="pillar-text">
                <span class="pillar-title">Retain AI Chat History</span>
                <span class="pillar-desc">Socratic lab notebooks and hardware notes</span>
              </div>
            </div>

            <div class="pillar-card">
              <div class="pillar-icon-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="18" height="18">
                  <circle cx="12" cy="8" r="6"/>
                  <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
                </svg>
              </div>
              <div class="pillar-text">
                <span class="pillar-title">Unlock Verified Badges</span>
                <span class="pillar-desc">Showcase earned robotics achievements</span>
              </div>
            </div>
          </div>

          <div class="panel-footer-note">
            <span>Risse Socratic Lab • Rizal Polytechnic de Muntinlupa</span>
          </div>
        </div>
      </aside>

      <!-- ========================================================
           RIGHT PANEL: Clean Risse-Themed Authentication Form
           ======================================================== -->
      <main class="showcase-right-panel" role="main">
        <div class="form-container">
          
          <!-- Header Area -->
          <div class="auth-header">
            <div class="auth-header-badge">
              <span class="live-dot"></span>
              <span>Learner Station Gate</span>
            </div>
            <h1 class="auth-title">
              {{ activeMode === 'login' ? 'Welcome to Risse' : 'Create Learner Account' }}
            </h1>
            <p class="auth-subtitle">
              {{ activeMode === 'login' 
                ? 'Sign in to access your modules, logs, and badge showcase.' 
                : 'Join the lab to start building robotics projects with AI mentorship.' 
              }}
            </p>
          </div>

          <!-- Clean Pill Tab Switcher -->
          <div class="auth-pill-tabs" role="tablist">
            <button 
              type="button" 
              role="tab"
              class="pill-tab-btn" 
              :class="{ active: activeMode === 'login' }"
              :aria-selected="activeMode === 'login'"
              @click="switchMode('login')"
              id="tab-sign-in"
            >
              Sign In
            </button>
            <button 
              type="button" 
              role="tab"
              class="pill-tab-btn" 
              :class="{ active: activeMode === 'register' }"
              :aria-selected="activeMode === 'register'"
              @click="switchMode('register')"
              id="tab-create-account"
            >
              Create Account
            </button>
          </div>

          <!-- Alert Notices -->
          <div v-if="errorMessage" class="theme-alert alert-error" role="alert">
            <svg class="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{{ errorMessage }}</span>
          </div>

          <div v-if="successMessage" class="theme-alert alert-success" role="status">
            <svg class="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span>{{ successMessage }}</span>
          </div>

          <!-- ================= TAB 1: SIGN IN ================= -->
          <form 
            v-if="activeMode === 'login'" 
            class="theme-form" 
            @submit.prevent="handleLoginSubmit"
            id="form-login"
          >
            <div class="form-group">
              <label for="login-email" class="form-label">Email Address</label>
              <div class="input-wrapper">
                <svg class="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <input 
                  id="login-email"
                  v-model="loginForm.email"
                  type="email" 
                  class="theme-input" 
                  placeholder="adriel@risse.edu"
                  required
                  autocomplete="email"
                />
              </div>
            </div>

            <div class="form-group">
              <div class="label-row">
                <label for="login-password" class="form-label">Password</label>
                <div class="demo-fill-links">
                  <button 
                    type="button" 
                    class="demo-fill-link"
                    @click="fillDemo('demo1')"
                  >
                    Demo 1
                  </button>
                  <span class="demo-sep">•</span>
                  <button 
                    type="button" 
                    class="demo-fill-link"
                    @click="fillDemo('demo2')"
                  >
                    Demo 2
                  </button>
                  <span class="demo-sep">•</span>
                  <button 
                    type="button" 
                    class="demo-fill-link fill-mentor-link"
                    @click="fillDemo('mentor')"
                  >
                    Demo Mentor
                  </button>
                </div>
              </div>
              <div class="input-wrapper">
                <svg class="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input 
                  id="login-password"
                  v-model="loginForm.password"
                  :type="showPassword ? 'text' : 'password'" 
                  class="theme-input has-toggle" 
                  placeholder="••••••••"
                  required
                  autocomplete="current-password"
                />
                <button 
                  type="button" 
                  class="toggle-eye-btn" 
                  @click="showPassword = !showPassword"
                  :title="showPassword ? 'Hide password' : 'Show password'"
                  aria-label="Toggle password visibility"
                >
                  <svg v-if="showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
              </div>
            </div>

            <div class="form-row-between">
              <label class="theme-checkbox-label">
                <input type="checkbox" v-model="loginForm.remember" class="theme-checkbox" />
                <span>Stay signed in on this station</span>
              </label>
              <span class="cred-hint">Default: <code>password123</code></span>
            </div>

            <!-- Primary Orange Sign In Button -->
            <button 
              type="submit" 
              class="btn-risse-primary" 
              :disabled="isSubmitting"
              id="btn-login-submit"
            >
              <span v-if="!isSubmitting">Enter Robotics Lab</span>
              <span v-else class="loading-wrap">
                <span class="btn-spinner"></span>
                <span>Connecting...</span>
              </span>
              <svg class="btn-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>

            <!-- Quick 1-Click Demo Accounts Bar -->
            <div class="demo-section">
              <div class="demo-section-header">
                <span class="demo-label">1-Click Demo Accounts:</span>
              </div>
              <div class="demo-cards-grid">
                <button 
                  type="button" 
                  class="demo-card-btn"
                  @click="handleQuickLogin('demo1')"
                  id="btn-demo-1"
                  title="Sign in as Demo Student 1 (demo1@acamad.com)"
                >
                  <div class="demo-avatar">1</div>
                  <div class="demo-meta">
                    <span class="demo-name">Demo Student 1</span>
                    <span class="demo-school">demo1@acamad.com</span>
                  </div>
                  <span class="demo-go">→</span>
                </button>

                <button 
                  type="button" 
                  class="demo-card-btn"
                  @click="handleQuickLogin('demo2')"
                  id="btn-demo-2"
                  title="Sign in as Demo Student 2 (demo2@acamad.com)"
                >
                  <div class="demo-avatar avatar-pink">2</div>
                  <div class="demo-meta">
                    <span class="demo-name">Demo Student 2</span>
                    <span class="demo-school">demo2@acamad.com</span>
                  </div>
                  <span class="demo-go">→</span>
                </button>

                <button 
                  type="button" 
                  class="demo-card-btn demo-card-mentor"
                  @click="handleQuickLogin('usr_mentor')"
                  id="btn-demo-mentor"
                  title="Sign in as Certified Mentor (Prof. Ramon Bautista)"
                >
                  <div class="demo-avatar avatar-orange">R</div>
                  <div class="demo-meta">
                    <span class="demo-name">Prof. Bautista</span>
                    <span class="demo-school">Mentor View 🌟</span>
                  </div>
                  <span class="demo-go">→</span>
                </button>
              </div>
            </div>
          </form>

          <!-- ================= TAB 2: CREATE ACCOUNT ================= -->
          <form 
            v-else 
            class="theme-form" 
            @submit.prevent="handleRegisterSubmit"
            id="form-register"
          >
            <div class="form-group">
              <label for="reg-name" class="form-label">Full Name</label>
              <div class="input-wrapper">
                <svg class="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <input 
                  id="reg-name"
                  v-model="regForm.name"
                  type="text" 
                  class="theme-input" 
                  placeholder="e.g. MARIA CLARA SANTOS"
                  required
                  autocomplete="name"
                />
              </div>
            </div>

            <div class="form-group">
              <label for="reg-email" class="form-label">Email Address</label>
              <div class="input-wrapper">
                <svg class="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <input 
                  id="reg-email"
                  v-model="regForm.email"
                  type="email" 
                  class="theme-input" 
                  placeholder="maria@student.edu"
                  required
                  autocomplete="email"
                />
              </div>
            </div>

            <div class="grid-two-col">
              <div class="form-group">
                <label for="reg-school" class="form-label">School / Institution</label>
                <div class="input-wrapper">
                  <svg class="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                  </svg>
                  <input 
                    id="reg-school"
                    v-model="regForm.school"
                    type="text" 
                    class="theme-input" 
                    placeholder="Rizal Polytechnic"
                    required
                  />
                </div>
              </div>

              <div class="form-group">
                <label for="reg-grade" class="form-label">Grade Level</label>
                <div class="input-wrapper">
                  <svg class="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  <select id="reg-grade" v-model="regForm.grade" class="theme-input theme-select" required>
                    <option value="Grade 7">Grade 7</option>
                    <option value="Grade 8">Grade 8</option>
                    <option value="Grade 9">Grade 9</option>
                    <option value="Grade 10">Grade 10</option>
                    <option value="Grade 11">Grade 11</option>
                    <option value="Grade 12">Grade 12</option>
                    <option value="College Undergraduate">College</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="grid-two-col">
              <div class="form-group">
                <label for="reg-password" class="form-label">Password</label>
                <div class="input-wrapper">
                  <svg class="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input 
                    id="reg-password"
                    v-model="regForm.password"
                    type="password" 
                    class="theme-input" 
                    placeholder="Min. 4 chars"
                    required
                    minlength="4"
                    autocomplete="new-password"
                  />
                </div>
              </div>

              <div class="form-group">
                <label for="reg-confirm" class="form-label">Confirm Password</label>
                <div class="input-wrapper">
                  <svg class="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  <input 
                    id="reg-confirm"
                    v-model="regForm.confirmPassword"
                    type="password" 
                    class="theme-input" 
                    placeholder="Repeat password"
                    required
                    minlength="4"
                    autocomplete="new-password"
                  />
                </div>
              </div>
            </div>

            <!-- Primary Orange Register Button -->
            <button 
              type="submit" 
              class="btn-risse-primary" 
              :disabled="isSubmitting"
              id="btn-register-submit"
            >
              <span v-if="!isSubmitting">Create Account & Enter Lab</span>
              <span v-else class="loading-wrap">
                <span class="btn-spinner"></span>
                <span>Creating Account...</span>
              </span>
              <svg class="btn-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          </form>

        </div>
      </main>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useAuthStore } from '../stores/authStore.js';

const emit = defineEmits(['authenticated']);

const authStore = useAuthStore();

const activeMode = ref('login'); // 'login' | 'register'
const isSubmitting = ref(false);
const showPassword = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const logoFailed = ref(false);
const mascotRef = ref(null);

function onMascotError() {
  if (mascotRef.value) {
    mascotRef.value.src = '/images/characters/risse-character.png';
  }
}

const loginForm = reactive({
  email: '',
  password: '',
  remember: true,
});

const regForm = reactive({
  name: '',
  email: '',
  school: 'Rizal Polytechnic de Muntinlupa',
  grade: 'Grade 10',
  password: '',
  confirmPassword: '',
  avatar: null,
});

function switchMode(mode) {
  activeMode.value = mode;
  errorMessage.value = '';
  successMessage.value = '';
}

function fillDemo(who) {
  if (who === 'mentor') {
    loginForm.email = 'mentor@risse.edu';
    loginForm.password = 'password123';
  } else if (who === 'demo2' || who === 'sofia') {
    loginForm.email = 'demo2@acamad.com';
    loginForm.password = 'acamaddemo2';
  } else {
    loginForm.email = 'demo1@acamad.com';
    loginForm.password = 'acamaddemo1';
  }
}

async function handleLoginSubmit() {
  errorMessage.value = '';
  successMessage.value = '';
  isSubmitting.value = true;

  try {
    const res = await authStore.login(loginForm.email, loginForm.password);
    isSubmitting.value = false;

    if (res.success && res.user) {
      successMessage.value = `Welcome back, ${res.user.name}!`;
      setTimeout(() => {
        emit('authenticated', res.user);
      }, 350);
    } else {
      errorMessage.value = res.message || 'Login failed. Please verify credentials.';
    }
  } catch (err) {
    isSubmitting.value = false;
    errorMessage.value = err?.message || 'Login failed. Please try again.';
  }
}

async function handleQuickLogin(userId) {
  errorMessage.value = '';
  successMessage.value = '';
  isSubmitting.value = true;

  try {
    const res = await authStore.quickLogin(userId);
    isSubmitting.value = false;
    if (res.success && res.user) {
      successMessage.value = `Station unlocked for ${res.user.name}...`;
      setTimeout(() => {
        emit('authenticated', res.user);
      }, 250);
    } else {
      errorMessage.value = res.message || 'Demo credentials not yet registered with Supabase.';
    }
  } catch (err) {
    isSubmitting.value = false;
    errorMessage.value = err?.message || 'Demo login failed.';
  }
}

async function handleRegisterSubmit() {
  errorMessage.value = '';
  successMessage.value = '';

  if (regForm.password !== regForm.confirmPassword) {
    errorMessage.value = 'Passwords do not match. Please re-enter.';
    return;
  }

  if (regForm.password.length < 6) {
    errorMessage.value = 'Password must be at least 6 characters.';
    return;
  }

  isSubmitting.value = true;

  try {
    const res = await authStore.register({
      name: regForm.name,
      email: regForm.email,
      school: regForm.school,
      grade: regForm.grade,
      password: regForm.password,
      avatar: regForm.avatar,
    });

    isSubmitting.value = false;

    if (res.success && res.verificationRequired) {
      successMessage.value = res.message || 'Account created! Please check your email to verify your account before logging in.';
      setTimeout(() => {
        switchMode('login');
      }, 3000);
      return;
    }

    if (res.success && res.user && res.session) {
      try {
        const safe = res.user.email.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
        localStorage.removeItem(`risse_email_${safe}_profile_data`);
        localStorage.removeItem(`risse_email_${safe}_enrolled_modules`);
        localStorage.removeItem('risse_profile_data');
      } catch (_) {}
      successMessage.value = `Account created! Welcome to Risse, ${res.user.name}.`;
      setTimeout(() => {
        emit('authenticated', res.user);
      }, 400);
    } else {
      errorMessage.value = res.message || 'Account creation failed.';
    }
  } catch (err) {
    isSubmitting.value = false;
    errorMessage.value = err?.message || 'Registration failed.';
  }
}
</script>

<style scoped>
/* ── Root Page Canvas matching Risse Theme ── */
.auth-page-root {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background: radial-gradient(circle at 85% 15%, rgba(254, 215, 170, 0.45) 0%, rgba(254, 240, 138, 0.25) 30%, #f6f7f9 70%);
  background-color: #f6f7f9;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
  font-family: var(--font-family, 'Lexend', sans-serif);
  overflow-y: auto;
}

/* ── Two-Panel Showcase Card ── */
.auth-showcase-card {
  width: 100%;
  max-width: 1020px;
  min-height: 600px;
  background: #ffffff;
  border: 1px solid #eef1f4;
  border-radius: 28px;
  box-shadow: 
    0 20px 50px -10px rgba(0, 0, 0, 0.08),
    0 4px 16px -2px rgba(241, 135, 1, 0.06);
  display: grid;
  grid-template-columns: 440px 1fr;
  overflow: hidden;
  position: relative;
}

/* ========================================================
   LEFT PANEL STYLES: Risse Orange Hero & Mascot Showcase
   ======================================================== */
.showcase-left-panel {
  position: relative;
  background: linear-gradient(155deg, #F18701 0%, #F35B04 100%);
  padding: 36px 32px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  color: #ffffff;
}

.panel-circuit-pattern {
  position: absolute;
  inset: 0;
  background-image: 
    radial-gradient(circle at 20px 20px, rgba(255, 255, 255, 0.15) 2px, transparent 0),
    linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 32px 32px;
  opacity: 0.65;
  pointer-events: none;
}

.panel-glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  pointer-events: none;
}

.orb-top {
  width: 280px;
  height: 280px;
  background: rgba(255, 255, 255, 0.22);
  top: -80px;
  left: -60px;
}

.orb-bottom {
  width: 240px;
  height: 240px;
  background: rgba(255, 122, 0, 0.5);
  bottom: -60px;
  right: -40px;
}

.showcase-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: space-between;
  gap: 20px;
}

/* ── Logo Wrap ── */
.showcase-logo-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.showcase-logo-img {
  height: 42px;
  width: auto;
  max-width: 170px;
  object-fit: contain;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.15));
}

.showcase-logo-fallback {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-family-display, 'Momo Trust Display', sans-serif);
  font-size: 30px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: 2px;
}

.fallback-dot {
  color: #fed7aa;
}

.showcase-tag-pill {
  display: inline-block;
  padding: 3px 10px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: 0.3px;
}

/* ── Mascot & Speech Bubble ── */
.mascot-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  margin: 6px 0 10px 0;
}

.mascot-halo {
  position: absolute;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.35) 0%, transparent 70%);
  top: 10px;
  filter: blur(14px);
  z-index: 1;
}

.mascot-img {
  width: 130px;
  height: auto;
  position: relative;
  z-index: 2;
  filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.2));
  animation: mascotHover 4s ease-in-out infinite alternate;
}

@keyframes mascotHover {
  0% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-8px) rotate(-1.5deg); }
  100% { transform: translateY(0px) rotate(0deg); }
}

.mascot-speech-bubble {
  position: relative;
  z-index: 3;
  margin-top: 10px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 10px 14px;
  color: #1e293b;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: flex-start;
  gap: 8px;
  max-width: 330px;
}

.mascot-speech-bubble::before {
  content: '';
  position: absolute;
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 7px solid transparent;
  border-right: 7px solid transparent;
  border-bottom: 7px solid rgba(255, 255, 255, 0.95);
}

.speech-sparkle {
  font-size: 16px;
  flex-shrink: 0;
}

.speech-text {
  font-size: 12px;
  line-height: 1.4;
  color: #334155;
  margin: 0;
}

.speech-text strong {
  color: #ea580c;
}

/* ── 3 Value Pillars ── */
.pillars-list {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.pillar-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 14px;
  padding: 9px 12px;
  backdrop-filter: blur(8px);
  transition: transform 0.2s ease, background 0.2s ease;
}

.pillar-card:hover {
  background: rgba(255, 255, 255, 0.22);
  transform: translateX(4px);
}

.pillar-icon-box {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: #ffffff;
  color: #F18701;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.pillar-text {
  display: flex;
  flex-direction: column;
}

.pillar-title {
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.25;
}

.pillar-desc {
  font-size: 10.5px;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.25;
}

.panel-footer-note {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.75);
  text-align: center;
  padding-top: 4px;
}

/* ========================================================
   RIGHT PANEL STYLES: Crisp Risse Clean White Form
   ======================================================== */
.showcase-right-panel {
  padding: 38px 42px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: #ffffff;
}

.form-container {
  width: 100%;
  max-width: 440px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* ── Header Area ── */
.auth-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.auth-header-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  background: #fff7ed;
  border: 1px solid #ffedd5;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
  color: #ea580c;
  width: fit-content;
}

.live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ea580c;
}

.auth-title {
  font-family: var(--font-family-display, 'Momo Trust Display', sans-serif);
  font-size: 24px;
  font-weight: 800;
  color: #1c222b;
  margin: 0;
  line-height: 1.2;
}

.auth-subtitle {
  font-size: 13px;
  color: #64748b;
  margin: 0;
  line-height: 1.45;
}

/* ── Pill Tabs Switcher ── */
.auth-pill-tabs {
  display: flex;
  background: #f1f5f9;
  padding: 4px;
  border-radius: 14px;
  gap: 4px;
}

.pill-tab-btn {
  flex: 1;
  padding: 9px 16px;
  background: transparent;
  border: none;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  text-align: center;
}

.pill-tab-btn:hover {
  color: #1e293b;
}

.pill-tab-btn.active {
  background: #F18701;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(241, 135, 1, 0.28);
}

/* ── Alerts ── */
.theme-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 12.5px;
  line-height: 1.4;
}

.alert-icon {
  width: 17px;
  height: 17px;
  flex-shrink: 0;
}

.alert-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
}

.alert-success {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #16a34a;
}

/* ── Forms ── */
.theme-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.grid-two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-label {
  font-size: 12px;
  font-weight: 600;
  color: #334155;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.demo-fill-link {
  background: none;
  border: none;
  color: #F18701;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.demo-fill-link:hover {
  color: #F35B04;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.field-icon {
  position: absolute;
  left: 13px;
  width: 17px;
  height: 17px;
  color: #94a3b8;
  pointer-events: none;
  transition: color 0.2s ease;
}

.theme-input {
  width: 100%;
  height: 42px;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  padding: 0 12px 0 40px;
  color: #1e293b;
  font-size: 13.5px;
  font-family: inherit;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.theme-input:focus {
  outline: none;
  background: #ffffff;
  border-color: #F18701;
  box-shadow: 0 0 0 3px rgba(241, 135, 1, 0.15);
}

.theme-input:focus + .field-icon,
.input-wrapper:focus-within .field-icon {
  color: #F18701;
}

.theme-input.has-toggle {
  padding-right: 40px;
}

.theme-select {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 14px;
  cursor: pointer;
}

.toggle-eye-btn {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.toggle-eye-btn:hover {
  color: #475569;
}

.form-row-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11.5px;
  color: #64748b;
}

.theme-checkbox-label {
  display: flex;
  align-items: center;
  gap: 7px;
  cursor: pointer;
}

.theme-checkbox {
  accent-color: #F18701;
  cursor: pointer;
}

.cred-hint code {
  background: #f1f5f9;
  padding: 2px 5px;
  border-radius: 4px;
  color: #ea580c;
  font-weight: 600;
}

/* ── Primary Orange Button ── */
.btn-risse-primary {
  width: 100%;
  height: 46px;
  background: linear-gradient(135deg, #F18701 0%, #F35B04 100%);
  border: none;
  border-radius: 12px;
  color: #ffffff;
  font-size: 14.5px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 6px 18px -2px rgba(241, 135, 1, 0.4);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  margin-top: 4px;
}

.btn-risse-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px -2px rgba(241, 135, 1, 0.55);
  background: linear-gradient(135deg, #ff8c1a 0%, #F18701 100%);
}

.btn-risse-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-risse-primary:disabled {
  opacity: 0.75;
  cursor: not-allowed;
}

.btn-chevron {
  width: 17px;
  height: 17px;
  transition: transform 0.2s ease;
}

.btn-risse-primary:hover .btn-chevron {
  transform: translateX(3px);
}

.loading-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-spinner {
  width: 15px;
  height: 15px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── 1-Click Demo Accounts ── */
.demo-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
  padding-top: 14px;
  border-top: 1px dashed #e2e8f0;
}

.demo-label {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.demo-cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.demo-fill-links {
  display: flex;
  align-items: center;
  gap: 6px;
}

.demo-sep {
  font-size: 10px;
  color: #94a3b8;
}

.fill-mentor-link {
  color: #ea580c !important;
  font-weight: 700;
}

.demo-avatar.avatar-orange {
  background: linear-gradient(135deg, #f18701, #7c3aed);
}

.demo-card-mentor {
  border-color: #fed7aa;
  background: #fffaf5;
}

.demo-card-mentor:hover {
  border-color: #f18701;
  background: #fff7ed;
}

.demo-card-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.demo-card-btn:hover {
  background: #fff7ed;
  border-color: #F18701;
  transform: translateY(-1.5px);
  box-shadow: 0 4px 10px rgba(241, 135, 1, 0.12);
}

.demo-avatar {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: #F18701;
  color: #ffffff;
  font-weight: 700;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.demo-avatar.avatar-pink {
  background: #ec4899;
}

.demo-meta {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.demo-name {
  font-size: 11.5px;
  font-weight: 700;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.demo-school {
  font-size: 10px;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.demo-go {
  color: #94a3b8;
  font-size: 13px;
  transition: transform 0.2s;
}

.demo-card-btn:hover .demo-go {
  color: #F18701;
  transform: translateX(2px);
}

/* ── Responsive Adaptations ── */
@media (max-width: 860px) {
  .auth-showcase-card {
    grid-template-columns: 1fr;
    max-width: 480px;
  }
  .showcase-left-panel {
    display: none;
  }
  .showcase-right-panel {
    padding: 30px 24px;
  }
}
</style>
