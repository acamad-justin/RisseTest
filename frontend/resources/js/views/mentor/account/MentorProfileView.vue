<!-- frontend/resources/js/views/mentor/account/MentorProfileView.vue -->
<template>
  <div class="mentor-profile-page">
    <header class="page-header">
      <div>
        <h1 class="page-title">Mentor Profile & Station Credentials</h1>
        <p class="page-subtitle">
          Identity, institutional verification, and workspace administration privileges.
        </p>
      </div>

      <button 
        type="button" 
        class="btn-profile-signout" 
        @click="$emit('logout')"
        title="Sign out of Teacher Studio"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        Sign Out
      </button>
    </header>

    <div class="profile-cards-grid">
      <!-- Card 1: Identity & Credentials -->
      <div class="profile-card">
        <div class="card-top-row">
          <div class="avatar-large">
            <img v-if="mentor?.avatar" :src="mentor.avatar" :alt="mentor.name" />
            <span v-else>{{ mentorInitial }}</span>
          </div>

          <div class="identity-text-col">
            <span class="role-badge" :class="`badge-${mentorRole}`">
              {{ mentorRole === 'admin' ? 'ADMINISTRATOR' : 'VERIFIED INSTRUCTOR' }}
            </span>
            <h2 class="profile-name">{{ mentor?.name || 'Prof. Ramon Bautista' }}</h2>
            <span class="profile-email">{{ mentor?.email || 'mentor@rizalpolytechnic.edu.ph' }}</span>
          </div>
        </div>

        <div class="profile-divider"></div>

        <div class="meta-list">
          <div class="meta-item">
            <span class="meta-key">Institution / School:</span>
            <span class="meta-value">{{ mentor?.school || 'Rizal Polytechnic de Muntinlupa' }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-key">Department:</span>
            <span class="meta-value">Mechatronics & Robotics Engineering</span>
          </div>
          <div class="meta-item">
            <span class="meta-key">Active Classes:</span>
            <span class="meta-value">{{ sectionsCount }} Sections</span>
          </div>
          <div class="meta-item">
            <span class="meta-key">Active Courses:</span>
            <span class="meta-value">{{ coursesCount }} Courses</span>
          </div>
        </div>
      </div>

      <!-- Card 2: Workspace Mode & Permissions -->
      <div class="profile-card">
        <h3 class="card-heading">Workspace Environment</h3>
        <p class="card-desc">
          You are currently in the <strong>Teacher Studio</strong>. You can preview how students experience your courses and checkpoints at any time.
        </p>

        <div class="switch-workspace-box">
          <div>
            <strong class="switch-title">Preview Student Workspace</strong>
            <p class="switch-sub">Explore the student constellation, conversation notebooks, and modules as an enrolled learner.</p>
          </div>
          <button 
            type="button" 
            class="btn-studio-primary" 
            @click="$emit('switch-workspace')"
          >
            Launch Student View →
          </button>
        </div>

        <div class="profile-divider"></div>

        <h3 class="card-heading">Security & Governance Invariants</h3>
        <ul class="invariants-list">
          <li>
            <span class="inv-bullet">✓</span>
            <span><strong>Private Learning Materials:</strong> Uploaded curriculum PDFs and lab files are protected with Supabase Storage RLS.</span>
          </li>
          <li>
            <span class="inv-bullet">✓</span>
            <span><strong>Star Chart Integrity:</strong> Manual mentor stars are permanently logged with audit notes and cannot fabricate verified concept mastery.</span>
          </li>
          <li>
            <span class="inv-bullet">✓</span>
            <span><strong>Curriculum Approval Gate:</strong> AI generated proposals require explicit mentor review and approval before publishing to students.</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  mentor: {
    type: Object,
    default: () => ({}),
  },
  userRole: {
    type: String,
    default: 'teacher',
  },
  sectionsCount: {
    type: Number,
    default: 0,
  },
  coursesCount: {
    type: Number,
    default: 0,
  },
});

defineEmits(['switch-workspace', 'logout']);

const mentorInitial = computed(() => {
  return (props.mentor?.name || 'P').charAt(0).toUpperCase();
});

const mentorRole = computed(() => {
  return props.userRole || 'teacher';
});
</script>

<style scoped>
.mentor-profile-page {
  padding: 16px 20px 48px 12px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 20px;
}

.page-title {
  font-family: var(--font-family-display, 'Momo Trust Display', sans-serif);
  font-size: 26px;
  font-weight: 800;
  color: #111827;
  letter-spacing: -0.02em;
  margin: 0 0 6px 0;
}

.page-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.btn-profile-signout {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #ffffff;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-profile-signout:hover {
  background: #fef2f2;
  border-color: #f87171;
}

.profile-cards-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

@media (max-width: 900px) {
  .profile-cards-grid {
    grid-template-columns: 1fr;
  }
}

.profile-card {
  background: #ffffff !important;
  border: 1px solid var(--border-card, #eef1f4) !important;
  border-radius: var(--radius-card, 18px) !important;
  box-shadow: var(--shadow-subtle, 0 2px 8px rgba(0, 0, 0, 0.04)) !important;
  padding: 28px !important;
  margin: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  display: block !important;
}

.card-top-row {
  display: flex;
  align-items: center;
  gap: 18px;
}

.avatar-large {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #ffedd5;
  color: #ea580c;
  font-size: 24px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #fed7aa;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.identity-text-col {
  display: flex;
  flex-direction: column;
}

.role-badge {
  align-self: flex-start;
  font-size: 10px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 4px;
  letter-spacing: 0.05em;
  margin-bottom: 6px;
}

.badge-teacher { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
.badge-admin { background: #fdf4ff; color: #a855f7; border: 1px solid #f0abfc; }

.profile-name {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 4px 0;
}

.profile-email {
  font-size: 13px;
  color: #6b7280;
}

.profile-divider {
  height: 1px;
  background: #f1f5f9;
  margin: 20px 0;
}

.meta-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.meta-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  padding: 6px 0;
  border-bottom: 1px solid #f8fafc;
}

.meta-key { color: #6b7280; font-weight: 500; }
.meta-value { color: #111827; font-weight: 600; }

.card-heading {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px 0;
}

.card-desc {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 18px 0;
  line-height: 1.45;
}

.switch-workspace-box {
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 12px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.switch-title {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: #9a3412;
}

.switch-sub {
  font-size: 12px;
  color: #7c2d12;
  margin: 4px 0 0 0;
  line-height: 1.4;
}

.btn-studio-primary {
  align-self: flex-start;
  background: var(--primary-orange, #F18701);
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(241, 135, 1, 0.2);
  transition: background 0.15s ease;
}

.btn-studio-primary:hover {
  background: #ea580c;
}

.invariants-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.invariants-list li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 13px;
  color: #374151;
  line-height: 1.4;
}

.inv-bullet {
  color: #059669;
  font-weight: 800;
}
</style>

