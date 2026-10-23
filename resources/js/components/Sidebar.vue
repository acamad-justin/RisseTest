<template>
  <aside class="risse-sidebar" aria-label="Sidebar Navigation">
    <div class="risse-sidebar-top">
      <div class="risse-logo">Risse</div>
      
      <nav>
        <ul class="risse-nav-list">
          <li class="risse-nav-item">
            <button 
              type="button" 
              class="risse-nav-btn" 
              :class="{ active: activeTab === 'Home' }"
              @click="$emit('update:activeTab', 'Home')"
              id="nav-home"
            >
              <svg class="risse-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <span>Home</span>
            </button>
          </li>

          <li class="risse-nav-item">
            <button 
              type="button" 
              class="risse-nav-btn" 
              :class="{ active: activeTab === 'Notebooks' }"
              @click="$emit('update:activeTab', 'Notebooks')"
              id="nav-notebooks"
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
              <span>Notebooks</span>
            </button>
          </li>

          <li class="risse-nav-item">
            <button 
              type="button" 
              class="risse-nav-btn" 
              :class="{ active: activeTab === 'Modules' }"
              @click="$emit('update:activeTab', 'Modules')"
              id="nav-modules"
            >
              <svg class="risse-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="7" height="7" x="3" y="3" rx="1"/>
                <rect width="7" height="7" x="14" y="3" rx="1"/>
                <rect width="7" height="7" x="14" y="14" rx="1"/>
                <rect width="7" height="7" x="3" y="14" rx="1"/>
              </svg>
              <span>Modules</span>
            </button>
          </li>

          <li class="risse-nav-item">
            <button 
              type="button" 
              class="risse-nav-btn" 
              :class="{ active: activeTab === 'Profile' }"
              @click="$emit('update:activeTab', 'Profile')"
              id="nav-profile"
            >
              <svg class="risse-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="3"/>
                <circle cx="12" cy="10" r="3"/>
                <path d="M7 18v-1a4 4 0 0 1 8 0v1"/>
              </svg>
              <span>Profile</span>
            </button>
          </li>
        </ul>
      </nav>
    </div>

    <div class="risse-sidebar-bottom">
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
  </aside>
</template>

<script setup>
defineProps({
  activeTab: {
    type: String,
    default: 'Modules',
  },
});

defineEmits(['update:activeTab', 'open-settings']);
</script>
