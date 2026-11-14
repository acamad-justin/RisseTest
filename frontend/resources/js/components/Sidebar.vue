<template>
  <aside 
    class="risse-sidebar" 
    :class="{ 'is-collapsed': isCollapsed }"
    aria-label="Sidebar Navigation"
  >
    <div class="risse-sidebar-top">
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
          id="btn-collapse-sidebar"
        >
          <ChevronRight v-if="isCollapsed" :size="16" />
          <ChevronLeft v-else :size="16" />
        </button>
      </div>
      
      <nav>
        <ul class="risse-nav-list">
          <li class="risse-nav-item">
            <button 
              type="button" 
              class="risse-nav-btn" 
              :class="{ active: activeTab === 'Home' }"
              @click="$emit('update:activeTab', 'Home')"
              id="nav-home"
              :title="isCollapsed ? 'Home' : undefined"
            >
              <svg 
                class="risse-nav-icon" 
                viewBox="0 0 24 24" 
                :fill="activeTab === 'Home' ? 'currentColor' : 'none'" 
                stroke="currentColor" 
                stroke-width="2" 
                stroke-linecap="round" 
                stroke-linejoin="round"
              >
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline v-if="activeTab !== 'Home'" points="9 22 9 12 15 12 15 22"/>
              </svg>
              <span v-if="!isCollapsed">Home</span>
            </button>
          </li>

          <li class="risse-nav-item">
            <button 
              type="button" 
              class="risse-nav-btn" 
              :class="{ active: activeTab === 'Notebooks' }"
              @click="$emit('update:activeTab', 'Notebooks')"
              id="nav-notebooks"
              :title="isCollapsed ? 'Notebooks' : undefined"
            >
              <svg class="risse-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="16" height="20" x="4" y="2" rx="2"/>
                <line x1="8" x2="16" y1="6" y2="6"/>
                <line x1="8" x2="16" y1="10" y2="10"/>
                <line x1="8" x2="12" y1="14" y2="14"/>
                <line x1="2" x2="6" y1="4" y2="4"/>
                <line x1="2" x2="6" y1="8" y2="8"/>
                <line x1="2" x2="6" y1="12" y2="12"/>
                <line x1="2" x2="6" y1="16" y2="16"/>
                <line x1="2" x2="6" y1="20" y2="20"/>
              </svg>
              <span v-if="!isCollapsed">Notebooks</span>
            </button>
          </li>

          <li class="risse-nav-item">
            <button 
              type="button" 
              class="risse-nav-btn" 
              :class="{ active: activeTab === 'Modules' }"
              @click="$emit('update:activeTab', 'Modules')"
              id="nav-modules"
              :title="isCollapsed ? 'Modules' : undefined"
            >
              <svg class="risse-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="7" height="7" x="3" y="3" rx="1"/>
                <rect width="7" height="7" x="14" y="3" rx="1"/>
                <rect width="7" height="7" x="14" y="14" rx="1"/>
                <rect width="7" height="7" x="3" y="14" rx="1"/>
              </svg>
              <span v-if="!isCollapsed">Modules</span>
            </button>
          </li>

          <li class="risse-nav-item">
            <button 
              type="button" 
              class="risse-nav-btn" 
              :class="{ active: activeTab === 'Profile' }"
              @click="$emit('update:activeTab', 'Profile')"
              id="nav-profile"
              :title="isCollapsed ? 'Profile' : undefined"
            >
              <svg class="risse-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="3"/>
                <circle cx="12" cy="10" r="3"/>
                <path d="M7 18v-1a4 4 0 0 1 8 0v1"/>
              </svg>
              <span v-if="!isCollapsed">Profile</span>
            </button>
          </li>

          <!-- Switch to Teacher Studio Button (Teachers & Admins Previewing Student Workspace) -->
          <li v-if="isMentorOrAdmin" class="risse-nav-item">
            <button 
              type="button" 
              class="risse-nav-btn btn-switch-to-studio" 
              @click="$emit('switch-to-mentor')"
              id="nav-switch-to-studio"
              :title="isCollapsed ? 'Teacher Studio' : undefined"
            >
              <svg class="risse-nav-icon text-orange" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              <span v-if="!isCollapsed">Teacher Studio</span>
            </button>
          </li>
        </ul>
      </nav>
    </div>

    <!-- Bottom Station Account & Settings Section -->
    <div class="risse-sidebar-bottom">
      <!-- Expanded Station Account Card -->
      <div v-if="!isCollapsed" class="risse-sidebar-account">
        <div class="account-avatar-pill">
          <img v-if="user?.avatar" :src="user.avatar" :alt="user?.name" class="account-avatar-img" />
          <span v-else class="account-avatar-letter">{{ userInitial }}</span>
        </div>
        <div class="account-info-col">
          <span class="account-name-text" :title="user?.name">{{ userShortName }}</span>
          <span class="account-status-tag">Connected</span>
        </div>
        <button 
          type="button" 
          class="account-logout-btn" 
          title="Sign Out of Station" 
          @click="$emit('logout')"
          id="btn-sidebar-logout"
          aria-label="Sign Out"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="16" height="16">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>

      <!-- Collapsed Station Account Avatar Button -->
      <div v-else class="risse-sidebar-account-collapsed">
        <button 
          type="button" 
          class="collapsed-user-avatar-btn" 
          :title="`${user?.name || 'Student'} (Click to Sign Out)`"
          @click="$emit('logout')"
          id="btn-sidebar-logout-collapsed"
          aria-label="Sign Out"
        >
          <img v-if="user?.avatar" :src="user.avatar" :alt="user?.name" class="account-avatar-img" />
          <span v-else class="account-avatar-letter">{{ userInitial }}</span>
        </button>
      </div>

      <div class="sidebar-bottom-actions">
        <button 
          type="button" 
          class="risse-settings-btn" 
          title="Settings" 
          @click="$emit('open-settings')"
          id="btn-settings"
          aria-label="Settings"
        >
          <svg class="risse-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';

const props = defineProps({
  activeTab: {
    type: String,
    default: 'Modules',
  },
  user: {
    type: Object,
    default: () => null,
  },
  userRole: {
    type: String,
    default: 'student',
  },
});

defineEmits(['update:activeTab', 'open-settings', 'switch-to-mentor', 'logout']);

const isMentorOrAdmin = computed(() => {
  return props.userRole === 'teacher' || props.userRole === 'admin' || props.user?.role === 'teacher' || props.user?.role === 'admin';
});

const isCollapsed = ref(localStorage.getItem('risse_sidebar_collapsed') === 'true');

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value;
  localStorage.setItem('risse_sidebar_collapsed', String(isCollapsed.value));
}

const userInitial = computed(() => {
  const name = props.user?.name || 'Student';
  return name.trim().charAt(0).toUpperCase() || 'S';
});

const userShortName = computed(() => {
  const full = props.user?.name || 'Student';
  const parts = full.trim().split(/\s+/);
  if (parts.length > 1) {
    return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
  }
  return parts[0] || 'Student';
});
</script>

<style scoped>
.risse-sidebar-bottom {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 14px 10px 10px;
}

.risse-sidebar.is-collapsed .risse-sidebar-bottom {
  align-items: center;
  padding: 0 0 10px 0;
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
  margin-bottom: 4px;
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

.sidebar-bottom-actions {
  display: flex;
  justify-content: flex-end;
}

.risse-sidebar.is-collapsed .sidebar-bottom-actions {
  justify-content: center;
}
</style>
