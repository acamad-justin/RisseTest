<script setup>
/**
 * Sidebar.vue
 * Fixed left-side navigation sidebar for the Risse app.
 * Supports expand/collapse and active route highlighting via Vue Router.
 */
import { ref } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import {
  House,
  Notebook,
  BookOpen,
  UserRound,
  Settings,
  PanelLeftClose,
  PanelLeft,
} from '@lucide/vue'

// ── Collapse state ──────────────────────────────────────────────
const isCollapsed = ref(false)

// ── Navigation items ────────────────────────────────────────────
const navItems = [
  { label: 'Home',      to: '/',          icon: House     },
  { label: 'Notebooks', to: '/notebooks', icon: Notebook  },
  { label: 'Modules',   to: '/modules',   icon: BookOpen  },
  { label: 'Profile',   to: '/profile',   icon: UserRound },
]

// ── Active route detection ──────────────────────────────────────
const route = useRoute()

function isActive(path) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

// ── Expose collapse state so AppLayout can adjust main padding ──
const emit = defineEmits(['collapse-change'])

function handleToggle() {
  isCollapsed.value = !isCollapsed.value
  emit('collapse-change', isCollapsed.value)
}
</script>

<template>
  <aside
    class="sidebar"
    :class="{ 'sidebar--collapsed': isCollapsed }"
    :aria-label="isCollapsed ? 'Navigation sidebar (collapsed)' : 'Navigation sidebar'"
  >
    <!-- ── Header ── -->
    <div class="sidebar__header">
      <span class="sidebar__logo" aria-label="Risse">Risse</span>

      <button
        class="sidebar__toggle"
        :aria-label="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        :aria-expanded="!isCollapsed"
        @click="handleToggle"
      >
        <PanelLeftClose v-if="!isCollapsed" :size="16" aria-hidden="true" />
        <PanelLeft      v-else              :size="16" aria-hidden="true" />
      </button>
    </div>

    <!-- ── Navigation ── -->
    <nav class="sidebar__nav" aria-label="Main navigation">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="sidebar__nav-item"
        :class="{ 'sidebar__nav-item--active': isActive(item.to) }"
        :aria-current="isActive(item.to) ? 'page' : undefined"
        :aria-label="item.label"
      >
        <span class="sidebar__nav-icon" aria-hidden="true">
          <component :is="item.icon" :size="17" />
        </span>
        <span class="sidebar__nav-label">{{ item.label }}</span>
      </RouterLink>
    </nav>

    <!-- ── Settings ── -->
    <div class="sidebar__footer">
      <button
        class="sidebar__settings-btn"
        aria-label="Settings"
        type="button"
      >
        <Settings :size="17" aria-hidden="true" />
      </button>
    </div>
  </aside>
</template>

<style scoped>
/* ─── Sidebar shell ──────────────────────────────────────────── */
.sidebar {
  position: fixed;
  top: var(--sidebar-margin);
  left: var(--sidebar-margin);
  bottom: var(--sidebar-margin);
  z-index: var(--z-sticky);

  width: var(--sidebar-expanded-width);
  display: flex;
  flex-direction: column;

  background-color: var(--risse-orange);
  border-radius: var(--sidebar-radius);
  box-sizing: border-box;
  overflow: hidden;

  transition: width 260ms cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar--collapsed {
  width: var(--sidebar-collapsed-width);
}

/* ─── Header ────────────────────────────────────────────────── */
.sidebar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 22px;
  height: 90px;
  flex-shrink: 0;
  min-width: 0;
}

.sidebar__logo {
  color: #fff;
  font-size: 19px;
  font-weight: 700;
  letter-spacing: -0.02em;
  white-space: nowrap;
  overflow: hidden;
  opacity: 1;
  transition: opacity 200ms ease, max-width 260ms cubic-bezier(0.4, 0, 0.2, 1);
  max-width: 80px;
}

.sidebar--collapsed .sidebar__logo {
  opacity: 0;
  max-width: 0;
}

.sidebar__toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.85);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background-color 150ms ease, color 150ms ease;
}

.sidebar__toggle:hover,
.sidebar__toggle:focus-visible {
  background-color: var(--risse-orange-hover);
  color: #fff;
  outline: 2px solid rgba(255, 255, 255, 0.5);
  outline-offset: 1px;
}

/* ─── Navigation ─────────────────────────────────────────────── */
.sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 7px;
  flex: 1;
  min-width: 0;
}

.sidebar__nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 38px;
  padding: 0 12px;
  border-radius: 12px;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.88);
  transition: background-color 150ms ease, color 150ms ease;
  white-space: nowrap;
  overflow: hidden;
  min-width: 0;
}

.sidebar__nav-item:hover {
  background-color: var(--risse-orange-hover);
  color: #fff;
}

.sidebar__nav-item:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.6);
  outline-offset: 1px;
}

.sidebar__nav-item--active {
  background-color: var(--risse-orange-active);
  color: #fff;
}

.sidebar__nav-item--active:hover {
  background-color: var(--risse-orange-active);
}

.sidebar__nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 22px;
}

.sidebar__nav-label {
  font-size: 12px;
  font-weight: 400;
  font-family: var(--font-family-sans);
  opacity: 1;
  overflow: hidden;
  transition: opacity 180ms ease, max-width 260ms cubic-bezier(0.4, 0, 0.2, 1);
  max-width: 120px;
}

.sidebar--collapsed .sidebar__nav-label {
  opacity: 0;
  max-width: 0;
}

/* Keep icon centred when collapsed */
.sidebar--collapsed .sidebar__nav-item {
  padding: 0;
  justify-content: center;
  gap: 0;
}

/* ─── Footer / Settings ──────────────────────────────────────── */
.sidebar__footer {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 30px;
  flex-shrink: 0;
}

.sidebar__settings-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: transparent;
  border: none;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.85);
  transition: background-color 150ms ease, color 150ms ease;
}

.sidebar__settings-btn:hover,
.sidebar__settings-btn:focus-visible {
  background-color: var(--risse-orange-hover);
  color: #fff;
  outline: 2px solid rgba(255, 255, 255, 0.5);
  outline-offset: 1px;
}

/* ─── Mobile: hide sidebar for very small screens ────────────── */
@media (max-width: 479px) {
  .sidebar {
    top: auto;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100% !important;
    height: 64px;
    border-radius: var(--sidebar-radius) var(--sidebar-radius) 0 0;
    flex-direction: row;
    align-items: center;
    padding: 0 16px;
  }

  .sidebar__header {
    height: 64px;
    padding: 0;
    flex: 0 0 auto;
  }

  .sidebar__nav {
    flex-direction: row;
    gap: 0;
    padding: 0;
    justify-content: center;
    flex: 1;
  }

  .sidebar__nav-item {
    height: 48px;
    width: 52px;
    padding: 0;
    justify-content: center;
    gap: 0;
    border-radius: 10px;
  }

  .sidebar__nav-label {
    display: none;
  }

  .sidebar__logo {
    display: none;
  }

  .sidebar__toggle {
    display: none;
  }

  .sidebar__footer {
    display: none;
  }
}
</style>
