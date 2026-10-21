<script setup>
/**
 * NotebooksView.vue — Notebooks overview.
 *
 * Navigation is now URL-driven:
 *   Clicking a Log  → router.push('/logs/:logId')
 *   Clicking a Proj → router.push('/projects/:projectId')
 *
 * Pagination:
 *   Logs    — 4 per page
 *   Projects — 6 per page (2 rows × 3 cols)
 */
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'

import NotebooksHeader    from '@/components/notebooks/NotebooksHeader.vue'
import LogsSection        from '@/components/notebooks/LogsSection.vue'
import ProjectsSection    from '@/components/notebooks/ProjectsSection.vue'
import CreateProjectModal from '@/components/notebooks/CreateProjectModal.vue'
import NotebookActionMenu from '@/components/notebooks/NotebookActionMenu.vue'

import { useNotebooksStore } from '@/stores/notebooksStore.js'
import { Search } from '@lucide/vue'

const store  = useNotebooksStore()
const router = useRouter()

// ── Page sizes ────────────────────────────────────────────────────────────
const LOGS_PER_PAGE = 4
const PROJ_PER_PAGE = 6

// ── Search ────────────────────────────────────────────────────────────────
const searchVisible = ref(false)
const searchQuery   = ref('')

function onToggleSearch(visible) {
  searchVisible.value = visible
  if (!visible) searchQuery.value = ''
}

// ── Sort ──────────────────────────────────────────────────────────────────
const sortAsc = ref(false)
function onToggleSort() { sortAsc.value = !sortAsc.value }

// ── Filtered + sorted lists ───────────────────────────────────────────────
const allFilteredLogs = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  const base = q
    ? store.sortedLogs.filter(l =>
        l.title.toLowerCase().includes(q) || l.preview.toLowerCase().includes(q))
    : store.sortedLogs
  return sortAsc.value ? [...base].reverse() : base
})

const allFilteredProjects = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  const base = q
    ? store.projects.filter(p => p.title.toLowerCase().includes(q))
    : store.projects
  return sortAsc.value
    ? [...base].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    : base
})

// ── Log pagination ────────────────────────────────────────────────────────
const logPage = ref(1)
const logTotalPages = computed(() =>
  Math.max(1, Math.ceil(allFilteredLogs.value.length / LOGS_PER_PAGE))
)
const pagedLogs = computed(() => {
  const start = (logPage.value - 1) * LOGS_PER_PAGE
  return allFilteredLogs.value.slice(start, start + LOGS_PER_PAGE)
})
function onLogPageChange(n) {
  logPage.value = Math.min(Math.max(1, n), logTotalPages.value)
}

// ── Project pagination ────────────────────────────────────────────────────
const projPage = ref(1)
const projTotalPages = computed(() =>
  Math.max(1, Math.ceil(allFilteredProjects.value.length / PROJ_PER_PAGE))
)
const pagedProjects = computed(() => {
  const start = (projPage.value - 1) * PROJ_PER_PAGE
  return allFilteredProjects.value.slice(start, start + PROJ_PER_PAGE)
})
function onProjPageChange(n) {
  projPage.value = Math.min(Math.max(1, n), projTotalPages.value)
}

watch(allFilteredLogs,     () => { logPage.value  = 1 })
watch(allFilteredProjects, () => { projPage.value = 1 })

// ── Select mode ───────────────────────────────────────────────────────────
const selectMode  = ref(false)
const selectedIds = ref([])

function onToggleSelect() { selectMode.value = true }
function onCancelSelect() { selectMode.value = false; selectedIds.value = [] }
function onCardSelect(id) {
  const i = selectedIds.value.indexOf(id)
  if (i === -1) selectedIds.value.push(id)
  else selectedIds.value.splice(i, 1)
}

// ── + Action menu ─────────────────────────────────────────────────────────
const actionMenuVisible = ref(false)
const actionMenuStyle   = ref({})

function onOpenActionMenu(event) {
  // Stop the opening click from bubbling to the page-level click-away
  // handler below — otherwise it would immediately close the menu again.
  event.stopPropagation()
  const rect = event.currentTarget.getBoundingClientRect()
  actionMenuStyle.value = {
    top:   `${rect.bottom + 6}px`,
    right: `${window.innerWidth - rect.right}px`,
  }
  actionMenuVisible.value = !actionMenuVisible.value
}

function closeActionMenu() { actionMenuVisible.value = false }

// ── Create Project ────────────────────────────────────────────────────────
const createProjectVisible = ref(false)

function onNewProject() {
  closeActionMenu()
  createProjectVisible.value = true
}

function onCreateProject(data) {
  const project = store.createProject(data)
  createProjectVisible.value = false
  projPage.value = projTotalPages.value
  router.push(`/projects/${project.id}`)
}

// ── Create Log ────────────────────────────────────────────────────────────
function onNewLog() {
  closeActionMenu()
  const log = store.createLog({ title: 'New Log' })
  router.push(`/logs/${log.id}`)
}

// ── Navigate ──────────────────────────────────────────────────────────────
function onOpenLog(id)     { router.push(`/logs/${id}`) }
function onOpenProject(id) { router.push(`/projects/${id}`) }

// ── Log actions (data only — no navigation) ───────────────────────────────
function onRename(id, title) { store.renameLog(id, title) }
function onMove(logId, projId) { store.moveLogToProject(logId, projId) }
function onDelete(id) { store.deleteLog(id) }
</script>

<template>
  <div class="nb-page" @click="closeActionMenu">

    <!-- ── Header ── -->
    <NotebooksHeader
      :select-mode="selectMode"
      @toggle-search="onToggleSearch"
      @toggle-sort="onToggleSort"
      @toggle-select="onToggleSelect"
      @cancel-select="onCancelSelect"
      @open-action-menu="onOpenActionMenu"
    />

    <!-- ── Search bar ── -->
    <Transition name="search-slide">
      <div v-if="searchVisible" class="nb-page__search-bar">
        <Search :size="14" class="nb-page__search-icon" aria-hidden="true" />
        <input
          v-model="searchQuery"
          class="nb-page__search-input"
          type="search"
          placeholder="Search logs and projects…"
          aria-label="Search notebooks"
          autofocus
        />
      </div>
    </Transition>

    <!-- ── Content ── -->
    <div class="nb-page__content">
      <LogsSection
        :logs="pagedLogs"
        :total-logs="allFilteredLogs.length"
        :page="logPage"
        :total-pages="logTotalPages"
        :projects="store.projects"
        @open-log="onOpenLog"
        @rename="onRename"
        @move="onMove"
        @delete="onDelete"
        @page-change="onLogPageChange"
      />

      <ProjectsSection
        :projects="pagedProjects"
        :total-projects="allFilteredProjects.length"
        :log-count-by-project="store.logCountByProject"
        :select-mode="selectMode"
        :selected-ids="selectedIds"
        :page="projPage"
        :total-pages="projTotalPages"
        @open-project="onOpenProject"
        @toggle-select="onCardSelect"
        @page-change="onProjPageChange"
      />
    </div>

    <!-- ── Action menu dropdown ── -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="actionMenuVisible"
          :style="actionMenuStyle"
          style="position:fixed; z-index:500;"
          @click.stop
        >
          <NotebookActionMenu
            @new-project="onNewProject"
            @new-log="onNewLog"
            @close="closeActionMenu"
          />
        </div>
      </Transition>
    </Teleport>

    <!-- ── Create Project modal ── -->
    <Teleport to="body">
      <CreateProjectModal
        v-if="createProjectVisible"
        @create="onCreateProject"
        @close="createProjectVisible = false"
      />
    </Teleport>

  </div>
</template>

<style scoped>
/* ─── Page root ─────────────────────────────────────────────────────────── */
.nb-page {
  flex: 1;
  height: 100%;
  min-height: 0;
  background: #ffffff;    /* covers the cosmic background — light UI */
  display: flex;
  flex-direction: column;
  overflow: hidden;       /* only .nb-page__content scrolls */
}

/* ─── Search bar ────────────────────────────────────────────────────────── */
.nb-page__search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 40px 16px;
  background: #f5f5fb;
  border: 1.5px solid #e0e0ee;
  border-radius: 999px;
  padding: 0 16px;
  height: 36px;
  transition: border-color 150ms ease;
}

.nb-page__search-bar:focus-within {
  border-color: var(--risse-orange);
}

.nb-page__search-icon { color: #9999bb; flex-shrink: 0; }

.nb-page__search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 12.5px;
  color: #1a1a2e;
}

.nb-page__search-input::placeholder { color: #aaaacc; }
.nb-page__search-input::-webkit-search-cancel-button { display: none; }

/* ─── Content ───────────────────────────────────────────────────────────── */
.nb-page__content {
  flex: 1;
  min-height: 0;          /* required: lets this region shrink and scroll */
  padding: 0 40px 40px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: #e0e0ee transparent;
}

/* ─── Transitions ───────────────────────────────────────────────────────── */
.search-slide-enter-active, .search-slide-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}
.search-slide-enter-from, .search-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.fade-enter-active, .fade-leave-active { transition: opacity 160ms ease; }
.fade-enter-from,   .fade-leave-to     { opacity: 0; }

/* ─── Responsive ────────────────────────────────────────────────────────── */
@media (max-width: 680px) {
  .nb-page__content   { padding: 0 16px 32px; }
  .nb-page__search-bar{ margin: 0 16px 14px; }
}
</style>
