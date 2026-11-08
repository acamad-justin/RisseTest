<!-- frontend/resources/js/components/mentor/MentorSidebar.vue -->
<template>
  <aside 
    class="risse-sidebar mentor-sidebar" 
    :class="{ 'is-collapsed': isCollapsed }"
    aria-label="Teacher Studio Navigation"
  >
    <div class="risse-sidebar-top">
      <!-- Header with Risse Logo and Collapse Toggle -->
      <div class="risse-sidebar-header">
        <div v-if="!isCollapsed" class="risse-logo">
          <img :src="'/images/logos/risse_white.png'" alt="Risse" class="risse-logo-img" />
        </div>
        <div v-else class="risse-logo risse-logo--collapsed">
          <img :src="'/images/logos/logo_white_sm.png'" alt="Risse" class="risse-logo-icon" />
        </div>

        <button 
          type="button" 
          class="risse-collapse-btn" 
          :title="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
          :aria-label="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
          @click="toggleCollapse"
          id="btn-collapse-mentor-sidebar"
        >
          <svg v-if="isCollapsed" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
      </div>

      <!-- Navigation Menus organized into the 6 Primary Destinations: WORKSPACE / COURSE MANAGEMENT / TEACHING / ACCOUNT -->
      <nav class="mentor-nav-container">
        <!-- 6 PRIMARY LMS DESTINATIONS: WORKSPACE, COURSE MANAGEMENT, TEACHING -->
        <div class="mentor-nav-group">
          <span v-if="!isCollapsed" class="mentor-group-heading">MAIN MENU</span>
          <span class="sr-only">WORKSPACE COURSE MANAGEMENT TEACHING</span>
          <ul class="risse-nav-list">
            <!-- 1. DASHBOARD -->
            <li class="risse-nav-item">
              <button 
                type="button" 
                class="risse-nav-btn"
                :class="{ active: activeView === 'dashboard' }"
                @click="$emit('select-view', 'dashboard')"
                id="mentor-nav-dashboard"
                :title="isCollapsed ? 'Dashboard' : undefined"
              >
                <svg class="risse-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="7" height="9" x="3" y="3" rx="1"/>
                  <rect width="7" height="5" x="14" y="3" rx="1"/>
                  <rect width="7" height="9" x="14" y="12" rx="1"/>
                  <rect width="7" height="5" x="3" y="16" rx="1"/>
                </svg>
                <span v-if="!isCollapsed">Dashboard</span>
              </button>
            </li>

            <!-- 2. MY MODULES -->
            <li class="risse-nav-item">
              <button 
                type="button" 
                class="risse-nav-btn"
                :class="{ active: activeView === 'courses' || activeView === 'create-course' || activeView === 'materials' }"
                @click="$emit('select-view', 'courses')"
                id="mentor-nav-courses"
                :title="isCollapsed ? 'My Modules' : undefined"
              >
                <svg class="risse-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
                  <path d="M6 6h10"/>
                  <path d="M6 10h10"/>
                </svg>
                <span v-if="!isCollapsed">My Modules</span>
                <span v-if="!isCollapsed && coursesCount > 0" class="mentor-nav-counter">{{ coursesCount }}</span>
              </button>
            </li>

            <!-- 3. MODULE STUDIO -->
            <li class="risse-nav-item">
              <button 
                type="button" 
                class="risse-nav-btn"
                :class="{ active: activeView === 'curriculum-designer' }"
                @click="$emit('select-view', 'curriculum-designer')"
                id="mentor-nav-curriculum-designer"
                :title="isCollapsed ? 'Module Studio' : undefined"
              >
                <svg class="risse-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>
                </svg>
                <span v-if="!isCollapsed">Module Studio</span>
              </button>
            </li>

            <!-- 4. MY CLASSES -->
            <li class="risse-nav-item">
              <button 
                type="button" 
                class="risse-nav-btn"
                :class="{ active: activeView === 'classes' || activeView === 'unenrollment-requests' }"
                @click="$emit('select-view', 'classes')"
                id="mentor-nav-classes"
                :title="isCollapsed ? 'My Classes' : undefined"
              >
                <svg class="risse-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <span v-if="!isCollapsed">My Classes</span>
                <span v-if="!isCollapsed && pendingUnenrollmentCount > 0" class="mentor-nav-counter counter-alert" title="Pending unenrollment requests in My Classes">
                  {{ pendingUnenrollmentCount }}
                </span>
              </button>
            </li>

            <!-- 5. STUDENTS -->
            <li class="risse-nav-item">
              <button 
                type="button" 
                class="risse-nav-btn"
                :class="{ active: activeView === 'students' }"
                @click="$emit('select-view', 'students')"
                id="mentor-nav-students"
                :title="isCollapsed ? 'Students' : undefined"
              >
                <svg class="risse-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
                <span v-if="!isCollapsed">Students</span>
              </button>
            </li>

            <!-- 6. STAR CHART -->
            <li class="risse-nav-item">
              <button 
                type="button" 
                class="risse-nav-btn"
                :class="{ active: activeView === 'star-charts' }"
                @click="$emit('select-view', 'star-charts')"
                id="mentor-nav-stars"
                :title="isCollapsed ? 'Star Chart' : undefined"
              >
                <svg class="risse-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                <span v-if="!isCollapsed">Star Chart</span>
              </button>
            </li>
          </ul>

          <!-- Subnav Compatibility Hooks (Accessible Navigation Targets) -->
          <div class="sr-only" aria-hidden="true" style="position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); border: 0;">
            <button id="mentor-nav-create-course" type="button" @click="$emit('select-view', 'create-course')">Create Course</button>
            <button id="mentor-nav-materials" type="button" @click="$emit('select-view', 'materials')">Course Materials</button>
            <button id="mentor-nav-unenrollment-requests" type="button" @click="$emit('select-view', 'unenrollment-requests')">
              Unenrollment Requests <span v-if="pendingUnenrollmentCount > 0">({{ pendingUnenrollmentCount }})</span>
            </button>
          </div>
        </div>

        <!-- GROUP 4: ACCOUNT & WORKSPACE SWITCH -->
        <div class="mentor-nav-group">
          <span v-if="!isCollapsed" class="mentor-group-heading">ACCOUNT</span>
          <ul class="risse-nav-list">
            <li class="risse-nav-item">
              <button 
                type="button" 
                class="risse-nav-btn"
                :class="{ active: activeView === 'profile' }"
                @click="$emit('select-view', 'profile')"
                id="mentor-nav-profile"
                :title="isCollapsed ? 'Profile / Settings' : undefined"
              >
                <svg class="risse-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span v-if="!isCollapsed">Profile / Settings</span>
              </button>
            </li>

            <!-- Switch to Student View Button -->
            <li class="risse-nav-item">
              <button 
                type="button" 
                class="risse-nav-btn btn-switch-workspace"
                @click="$emit('switch-workspace')"
                id="mentor-nav-switch-student"
                :title="isCollapsed ? 'Student Workspace' : undefined"
              >
                <svg class="risse-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                <span v-if="!isCollapsed">Student View</span>
              </button>
            </li>
          </ul>
        </div>
      </nav>
    </div>

    <!-- Bottom Station Account Section (Identical styling to Student Sidebar) -->
    <div class="risse-sidebar-bottom">
      <div v-if="!isCollapsed" class="risse-sidebar-account">
        <div class="account-avatar-pill">
          <img v-if="mentor?.avatar" :src="mentor.avatar" :alt="mentor.name" class="account-avatar-img" />
          <span v-else class="account-avatar-letter">{{ mentorInitial }}</span>
        </div>
        <div class="account-info-col">
          <span class="account-name-text" :title="mentor?.name">{{ mentorShortName }}</span>
          <span class="account-status-tag">{{ mentorRoleLabel }}</span>
        </div>
        <button 
          type="button" 
          class="account-logout-btn" 
          @click="$emit('logout')" 
          title="Sign out of Teacher Studio"
          aria-label="Sign out"
          id="btn-mentor-logout"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>

      <div v-else class="risse-sidebar-account-collapsed">
        <button 
          type="button" 
          class="collapsed-user-avatar-btn" 
          :title="`${mentorName} — Sign Out`"
          @click="$emit('logout')"
          id="btn-mentor-logout-collapsed"
        >
          <img v-if="mentor?.avatar" :src="mentor.avatar" :alt="mentor.name" class="account-avatar-img" />
          <span v-else class="account-avatar-letter">{{ mentorInitial }}</span>
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  activeView: {
    type: String,
    default: 'dashboard',
  },
  mentor: {
    type: Object,
    default: () => ({}),
  },
  coursesCount: {
    type: Number,
    default: 0,
  },
  pendingUnenrollmentCount: {
    type: Number,
    default: 0,
  },
});

defineEmits(['select-view', 'switch-workspace', 'logout']);

const isCollapsed = ref(localStorage.getItem('risse_mentor_sidebar_collapsed') === 'true');

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value;
  localStorage.setItem('risse_mentor_sidebar_collapsed', String(isCollapsed.value));
}

const mentorName = computed(() => props.mentor?.name || 'Instructor');
const mentorInitial = computed(() => {
  const name = props.mentor?.name || 'Instructor';
  return name.trim().charAt(0).toUpperCase() || 'M';
});

const mentorShortName = computed(() => {
  const full = props.mentor?.name || 'Instructor';
  const parts = full.trim().split(/\s+/);
  if (parts.length > 1) {
    return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
  }
  return parts[0] || 'Instructor';
});

const mentorRoleLabel = computed(() => {
  if (props.mentor?.role === 'admin') return 'Administrator';
  return 'Certified Mentor';
});
</script>

<style scoped>
.mentor-sidebar {
  /* Inherits exact sizing, color, radius, and shadow from .risse-sidebar in app.css */
  user-select: none;
}

.risse-sidebar-top {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
}

.risse-sidebar-top::-webkit-scrollbar {
  display: none;
}

.risse-sidebar-header {
  margin-bottom: 16px;
}

.mentor-nav-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 0;
}

.mentor-nav-group {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.mentor-group-heading {
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.72);
  padding: 0 14px;
  margin-bottom: 2px;
  text-transform: uppercase;
}

.mentor-nav-counter {
  margin-left: auto;
  font-size: 10.5px;
  font-weight: 700;
  background: rgba(0, 0, 0, 0.2);
  color: #ffffff;
  padding: 1px 6px;
  border-radius: 9999px;
  line-height: 1.2;
}

.mentor-nav-counter.counter-alert {
  background: #ef4444;
  color: #ffffff;
  font-weight: 800;
  box-shadow: 0 1px 4px rgba(239, 68, 68, 0.4);
}

.btn-switch-workspace {
  background: rgba(0, 0, 0, 0.12);
  border-top-left-radius: 14px;
  border-bottom-left-radius: 14px;
  margin-top: 4px;
}

.btn-switch-workspace:hover {
  background: rgba(0, 0, 0, 0.22);
}

.risse-sidebar-bottom {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 14px 10px 10px;
  flex-shrink: 0;
}

.risse-sidebar.is-collapsed .risse-sidebar-bottom {
  align-items: center;
  padding: 10px 0;
}

.risse-sidebar-account {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(0, 0, 0, 0.16);
  padding: 7px 10px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.account-avatar-pill {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: #ffffff;
  color: #ea580c;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
  flex-shrink: 0;
  overflow: hidden;
}

.account-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.account-info-col {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.account-name-text {
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.account-status-tag {
  font-size: 9.5px;
  color: #fed7aa;
  font-weight: 500;
}

.account-logout-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  padding: 5px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.account-logout-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}

.risse-sidebar-account-collapsed {
  display: flex;
  align-items: center;
  justify-content: center;
}

.collapsed-user-avatar-btn {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.collapsed-user-avatar-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.05);
}
</style>
