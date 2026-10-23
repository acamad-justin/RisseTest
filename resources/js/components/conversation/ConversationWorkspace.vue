<script setup>
/**
 * ConversationWorkspace.vue
 *
 * The single conversation workspace reused by every conversation route:
 *   /logs/:logId                        — standalone (or directly linked) Log
 *   /projects/:projectId                — project, defaults to most recent Log
 *   /projects/:projectId/logs/:logId    — specific Log inside a Project
 *
 * Structure:
 *   ┌───────────────┬───────────────────────────────────────────┐
 *   │ Nav panel     │ Conversation panel                        │
 *   │ (Project/Log  │  header · scrollable history · composer   │
 *   │  collapsible  │                                           │
 *   │  / mobile     │                                           │
 *   │  drawer)      │                                           │
 *   └───────────────┴───────────────────────────────────────────┘
 *
 * Responsibilities:
 *   - Resolve + validate the route, falling back helpfully for invalid ids.
 *   - Open the most recently updated Log by default when a Project has none open.
 *   - Own nav-panel collapse (desktop/tablet) and drawer (mobile) state.
 *   - Create New Logs with the correct projectId (null = standalone).
 *
 * All data comes from the shared notebooks store — no local copies.
 */
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { Plus, MessageSquare, ArrowLeft } from '@lucide/vue'
import { useNotebooksStore } from '@/stores/notebooksStore.js'
import ConversationNavPanel from './ConversationNavPanel.vue'
import ConversationPanel from './ConversationPanel.vue'

const props = defineProps({
  initialProjectId: { type: String, default: null },
  initialLogId:     { type: String, default: null },
})

const emit = defineEmits(['back'])

const store = useNotebooksStore()

/* ── State resolution ────────────────────────────────────────────────────── */
const currentProjectId = ref(props.initialProjectId)
const currentLogId     = ref(props.initialLogId)

watch(() => props.initialProjectId, (val) => { currentProjectId.value = val })
watch(() => props.initialLogId, (val) => { currentLogId.value = val })

const project = computed(() =>
  currentProjectId.value ? store.getProject(currentProjectId.value) : null,
)
const projectLogs = computed(() =>
  project.value ? store.logsForProject(project.value.id) : [],
)
const log = computed(() => (currentLogId.value ? store.getLog(currentLogId.value) : null))

const projectMissing = computed(() => !!currentProjectId.value && !project.value)
const logMissing = computed(() =>
  !!currentLogId.value &&
  (!log.value || (!!currentProjectId.value && log.value.projectId !== currentProjectId.value)),
)

/** True when a Log is resolved and valid */
const activeLog = computed(() =>
  currentLogId.value && !logMissing.value && !projectMissing.value ? log.value : null,
)

/**
 * Context Project shown in the nav panel: the current Project when present,
 * otherwise the Log's own Project.
 */
const contextProject = computed(() => {
  if (project.value) return project.value
  if (log.value?.projectId) return store.getProject(log.value.projectId)
  return null
})

/* ── Default selection & fallbacks ──────────────────────────────────────── */
watch(
  [currentProjectId, currentLogId, projectMissing, logMissing, () => projectLogs.value.length],
  () => {
    if (projectMissing.value) return

    // Project opened without a Log id → select its most recent Log
    if (currentProjectId.value && !currentLogId.value && projectLogs.value.length > 0) {
      currentLogId.value = projectLogs.value[0].id
      return
    }

    // Invalid / stale nested Log id inside a Project
    if (logMissing.value && currentProjectId.value) {
      if (projectLogs.value.length > 0) {
        currentLogId.value = projectLogs.value[0].id
      } else {
        currentLogId.value = null
      }
    }
  },
  { immediate: true },
)

/* ── Nav panel state: collapsible (desktop/tablet) / drawer (mobile) ────── */
const navCollapsed = ref(false)
const drawerOpen   = ref(false)
const isMobile     = ref(false)
let mediaQuery = null

function onMediaChange(event) {
  isMobile.value = event.matches
  if (!event.matches) drawerOpen.value = false
}

function onKeydown(event) {
  if (event.key === 'Escape' && drawerOpen.value) drawerOpen.value = false
}

onMounted(() => {
  mediaQuery = window.matchMedia('(max-width: 768px)')
  isMobile.value = mediaQuery.matches
  mediaQuery.addEventListener('change', onMediaChange)
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener('change', onMediaChange)
  window.removeEventListener('keydown', onKeydown)
})

function toggleNav() {
  if (isMobile.value) drawerOpen.value = !drawerOpen.value
  else navCollapsed.value = !navCollapsed.value
}

/* ── Navigation actions ─────────────────────────────────────────────────── */
function selectLog(id) {
  const target = store.getLog(id)
  currentProjectId.value = target?.projectId ?? null
  currentLogId.value = id
  if (isMobile.value) drawerOpen.value = false
}

function newLog() {
  const pid = contextProject.value?.id ?? currentProjectId.value ?? null
  const created = store.createLog({ title: 'New Log', projectId: pid })
  currentProjectId.value = pid
  currentLogId.value = created.id
  if (isMobile.value) drawerOpen.value = false
}

function backToNotebooks() {
  drawerOpen.value = false
  emit('back')
}

function onLogDeleted() {
  if (currentProjectId.value) {
    const remaining = store.logsForProject(currentProjectId.value)
    if (remaining.length > 0) {
      currentLogId.value = remaining[0].id
    } else {
      currentLogId.value = null
    }
  } else {
    emit('back')
  }
}
</script>

<template>
  <div class="ws">

    <!-- Mobile drawer scrim -->
    <Transition name="ws-scrim">
      <div
        v-if="isMobile && drawerOpen"
        class="ws__scrim"
        aria-hidden="true"
        @click="drawerOpen = false"
      />
    </Transition>

    <!-- Project / recent Log navigation (collapsible panel → mobile drawer) -->
    <ConversationNavPanel
      :project="contextProject"
      :active-log-id="activeLog ? activeLog.id : null"
      :collapsed="navCollapsed && !isMobile"
      :open="drawerOpen"
      @back="backToNotebooks"
      @new-log="newLog"
      @select-log="selectLog"
      @collapse="navCollapsed = true"
    />

    <!-- Conversation column -->
    <section class="ws__panel">

      <!-- Active conversation -->
      <ConversationPanel
        v-if="activeLog"
        :log="activeLog"
        :project="contextProject"
        @toggle-nav="toggleNav"
        @deleted="onLogDeleted"
      />

      <!-- Project opened with no Logs -->
      <div
        v-else-if="project && !projectMissing && !projectLogs.length"
        class="ws__empty"
      >
        <span class="ws__empty-icon" aria-hidden="true">
          <MessageSquare :size="24" />
        </span>
        <p class="ws__empty-title">No logs in this Project yet</p>
        <p class="ws__empty-sub">
          Start a conversation about “{{ project.title }}” — every Log keeps its
          own history.
        </p>
        <button class="ws__empty-btn" type="button" @click="newLog">
          <Plus :size="14" aria-hidden="true" />
          New Log
        </button>
      </div>

      <!-- Helpful fallback for invalid ids -->
      <div
        v-else-if="projectMissing || (logMissing && !projectId)"
        class="ws__empty"
      >
        <p class="ws__empty-title">
          {{ projectMissing ? 'Project not found.' : 'Conversation not found.' }}
        </p>
        <p class="ws__empty-sub">
          The link may be out of date, or this item was deleted.
        </p>
        <button
          class="ws__empty-btn ws__empty-btn--plain"
          type="button"
          @click="backToNotebooks"
        >
          <ArrowLeft :size="14" aria-hidden="true" />
          Back to Notebooks
        </button>
      </div>

      <!-- Otherwise: route is resolving to its default Log — render nothing -->

    </section>
  </div>
</template>

<style scoped>
/* ── Workspace shell: fills the main viewport area ─────────────────────── */
.ws {
  position: relative;
  flex: 1;
  height: 100%;
  min-height: 0;
  min-width: 0;
  display: flex;
  overflow: hidden;
  background: #ffffff;
  border-radius: var(--radius-card, 18px);
  border: 1px solid var(--border-card, #eef1f4);
  box-shadow: var(--shadow-subtle);
}

/* Conversation column */
.ws__panel {
  position: relative;
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── Empty / fallback states ───────────────────────────────────────────── */
.ws__empty {
  margin: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
  padding: 32px 24px;
  max-width: 440px;
}

.ws__empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 144, 0, 0.09);
  color: var(--risse-orange);
  margin-bottom: 4px;
}

.ws__empty-title {
  font-size: 16px;
  font-weight: 600;
  color: #2a2a4a;
}

.ws__empty-sub {
  font-size: 12.5px;
  color: #9999bb;
  line-height: 1.6;
}

.ws__empty-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 9px 18px;
  font-size: 12.5px;
  font-weight: 600;
  color: #fff;
  background: var(--risse-orange);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background 150ms ease;
}
.ws__empty-btn:hover { background: var(--risse-orange-active); }
.ws__empty-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(255, 144, 0, 0.35);
}

.ws__empty-btn--plain {
  color: #4a4a6a;
  background: #f5f5fb;
  border: 1px solid #e4e4ee;
}
.ws__empty-btn--plain:hover { background: #ececf6; }

/* ── Mobile drawer scrim ───────────────────────────────────────────────── */
.ws__scrim {
  position: absolute;
  inset: 0;
  z-index: 50;
  background: rgba(15, 10, 40, 0.38);
}

.ws-scrim-enter-active,
.ws-scrim-leave-active { transition: opacity 220ms ease; }
.ws-scrim-enter-from,
.ws-scrim-leave-to { opacity: 0; }
</style>
