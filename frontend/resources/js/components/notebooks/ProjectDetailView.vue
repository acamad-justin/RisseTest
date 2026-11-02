<script setup>
/**
 * ProjectDetailView.vue
 *
 * Shown when a user clicks a project card. Layout:
 *   - Left:  "Ask Risse" prompt textarea  +  Logs list
 *   - Right: Two fixed section buttons — "Design Notes" and "Tests & Results"
 */
import { ref, computed } from 'vue'
import {
  ChevronLeft,
  Star,
  MoreVertical,
  Paperclip,
  Send,
  X,
  Pencil,
  Trash2,
} from '@lucide/vue'
import { useNotebooksStore } from '@/stores/notebooksStore.js'

// ── Props & emits ──────────────────────────────────────────────────────────
const props = defineProps({
  projectId: { type: String, required: true },
})

const emit = defineEmits(['back', 'open-log', 'open-prompt'])

// ── Store ──────────────────────────────────────────────────────────────────
const store = useNotebooksStore()

const project = computed(() => store.getProject(props.projectId))
const logs    = computed(() => store.logsForProject(props.projectId))

// ── Prompt area ────────────────────────────────────────────────────────────
const promptText = ref('')

function handlePromptSubmit() {
  const text = promptText.value.trim()
  if (!text) return
  emit('open-prompt', { text, projectId: props.projectId })
  promptText.value = ''
}

function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handlePromptSubmit()
  }
}

// ── Header 3-dot menu ──────────────────────────────────────────────────────
const headerMenuOpen  = ref(false)
const renamingProject = ref(false)
const renameValue     = ref('')

function openRenameProject() {
  headerMenuOpen.value  = false
  renameValue.value     = project.value?.title ?? ''
  renamingProject.value = true
}

function submitRenameProject() {
  if (renameValue.value.trim()) store.renameProject(props.projectId, renameValue.value)
  renamingProject.value = false
}

function handleDeleteProject() {
  headerMenuOpen.value = false
  if (window.confirm(`Delete project "${project.value?.title}"? All logs will be detached.`)) {
    store.deleteProject(props.projectId)
    emit('back')
  }
}

// ── Date helper ────────────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}
</script>

<template>
  <div v-if="project" class="pdv" @click="headerMenuOpen = false">

    <!-- ══ Header ═══════════════════════════════════════════════════════════ -->
    <header class="pdv__header">
      <div class="pdv__header-left">
        <button class="pdv__back-btn" aria-label="Back to notebooks" @click="$emit('back')">
          <ChevronLeft :size="22" aria-hidden="true" />
        </button>

        <div class="pdv__title-group">
          <span class="pdv__label">Project</span>

          <!-- Inline rename -->
          <div v-if="renamingProject" class="pdv__rename-wrap" @click.stop>
            <input
              v-model="renameValue"
              class="pdv__rename-input"
              type="text"
              aria-label="Rename project"
              autofocus
              @keydown.enter="submitRenameProject"
              @keydown.esc="renamingProject = false"
            />
            <button class="pdv__rename-ok" @click="submitRenameProject">OK</button>
            <button class="pdv__rename-cancel" @click="renamingProject = false">
              <X :size="14" />
            </button>
          </div>
          <h1 v-else class="pdv__title">{{ project.title }}</h1>
        </div>
      </div>

      <!-- Right actions -->
      <div class="pdv__header-right" @click.stop>
        <!-- Favorite -->
        <button
          class="pdv__icon-btn"
          :class="{ 'pdv__icon-btn--active': project.favorite }"
          :aria-label="project.favorite ? 'Unfavorite project' : 'Favorite project'"
          @click="store.toggleFavorite(projectId)"
        >
          <Star :size="20" :fill="project.favorite ? 'currentColor' : 'none'" aria-hidden="true" />
        </button>

        <!-- 3-dot menu -->
        <div class="pdv__menu-wrap">
          <button
            class="pdv__icon-btn"
            aria-label="More project options"
            :aria-expanded="headerMenuOpen"
            @click.stop="headerMenuOpen = !headerMenuOpen"
          >
            <MoreVertical :size="20" aria-hidden="true" />
          </button>

          <transition name="menu-fade">
            <ul v-if="headerMenuOpen" class="pdv__dropdown" role="menu">
              <li role="menuitem">
                <button class="pdv__dropdown-item" @click="openRenameProject">
                  <Pencil :size="13" aria-hidden="true" /> Rename
                </button>
              </li>
              <li role="menuitem">
                <button class="pdv__dropdown-item pdv__dropdown-item--danger" @click="handleDeleteProject">
                  <Trash2 :size="13" aria-hidden="true" /> Delete project
                </button>
              </li>
            </ul>
          </transition>
        </div>
      </div>
    </header>

    <!-- ══ Body ══════════════════════════════════════════════════════════════ -->
    <div class="pdv__body">

      <!-- ── Left column ──────────────────────────────────────────────────── -->
      <div class="pdv__main">

        <!-- Ask Risse prompt box -->
        <div class="pdv__prompt-box">
          <textarea
            v-model="promptText"
            class="pdv__prompt-input"
            placeholder="Ask Risse"
            rows="3"
            aria-label="Ask Risse a question"
            @keydown="handleKeydown"
          />
          <div class="pdv__prompt-actions">
            <button class="pdv__prompt-icon" aria-label="Attach file" disabled>
              <Paperclip :size="18" aria-hidden="true" />
            </button>
            <button
              class="pdv__prompt-send"
              :disabled="!promptText.trim()"
              aria-label="Submit question"
              @click="handlePromptSubmit"
            >
              <Send :size="18" aria-hidden="true" />
            </button>
          </div>
        </div>

        <!-- Logs list -->
        <div class="pdv__logs-head">
          <span class="pdv__logs-label">Logs</span>
          <span class="pdv__logs-count">({{ logs.length }})</span>
        </div>

        <div class="pdv__logs-list">
          <div
            v-for="log in logs"
            :key="log.id"
            class="pdv__log-row"
            role="button"
            tabindex="0"
            :aria-label="`Open log: ${log.title}`"
            @click="$emit('open-log', log.id)"
            @keydown.enter="$emit('open-log', log.id)"
          >
            <div class="pdv__log-body">
              <p class="pdv__log-title">{{ log.title }}</p>
              <p class="pdv__log-preview">{{ log.preview }}</p>
            </div>
            <span class="pdv__log-date">{{ fmtDate(log.updatedAt) }}</span>
          </div>

          <p v-if="!logs.length" class="pdv__logs-empty">
            No logs yet — ask Risse something above to create the first one.
          </p>
        </div>
      </div>

      <!-- ── Right sidebar: fixed section buttons ──────────────────────────── -->
      <aside class="pdv__sidebar">
        <button class="pdv__section-btn" aria-label="Open Design Notes">
          <p class="pdv__section-btn__title">Design Notes</p>
          <p class="pdv__section-btn__subtitle">Plans and Decisions</p>
        </button>

        <button class="pdv__section-btn" aria-label="Open Tests & Results">
          <p class="pdv__section-btn__title">Tests &amp; Results</p>
          <p class="pdv__section-btn__subtitle">Experiments and Findings</p>
        </button>
      </aside>
    </div>
  </div>

  <!-- Project not found fallback -->
  <div v-else class="pdv pdv--missing">
    <button class="pdv__back-btn" @click="$emit('back')">
      <ChevronLeft :size="22" /> Back
    </button>
    <p>Project not found.</p>
  </div>
</template>

<style scoped>
/* ═══════════════════════════════════════════════════════════════════════════
   Root
══════════════════════════════════════════════════════════════════════════ */
.pdv {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.pdv--missing {
  padding: 40px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: #9999bb;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Header
══════════════════════════════════════════════════════════════════════════ */
.pdv__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 40px 16px;
  flex-shrink: 0;
}

.pdv__header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pdv__back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #1a1a2e;
  cursor: pointer;
  transition: background 0.15s;
}

.pdv__back-btn:hover { background: #f0f0f8; }

.pdv__title-group {
  display: flex;
  flex-direction: column;
}

.pdv__label {
  font-family: 'Lexend', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: var(--risse-orange);
  letter-spacing: 0.02em;
  line-height: 1;
  margin-bottom: 2px;
}

.pdv__title {
  font-family: 'Lexend', sans-serif;
  font-size: 32px;
  font-weight: 700;
  color: #1a1a2e;
  line-height: 1.1;
  margin: 0;
}

/* Inline rename */
.pdv__rename-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pdv__rename-input {
  font-family: 'Lexend', sans-serif;
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
  border: none;
  border-bottom: 2px solid var(--risse-orange);
  outline: none;
  background: transparent;
  width: 300px;
}

.pdv__rename-ok,
.pdv__rename-cancel {
  border: none;
  cursor: pointer;
  border-radius: 6px;
  padding: 4px 8px;
  font-family: 'Lexend', sans-serif;
  font-size: 12px;
}

.pdv__rename-ok     { background: var(--risse-orange); color: #fff; }
.pdv__rename-cancel { background: #f0f0f8; color: #6666aa; }

/* ── Header right icons ── */
.pdv__header-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pdv__icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #1a1a2e;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.pdv__icon-btn:hover        { background: #f0f0f8; }
.pdv__icon-btn--active      { color: var(--risse-orange); }

/* Dropdown */
.pdv__menu-wrap { position: relative; }

.pdv__dropdown {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  min-width: 160px;
  background: #fff;
  border: 1px solid #e4e4f0;
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.10);
  list-style: none;
  margin: 0;
  padding: 4px 0;
  z-index: 200;
}

.pdv__dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  text-align: left;
  padding: 9px 14px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-family: 'Lexend', sans-serif;
  font-size: 13px;
  font-weight: 400;
  color: #1a1a2e;
  transition: background 0.12s;
}

.pdv__dropdown-item:hover                 { background: #f4f4f4; }
.pdv__dropdown-item--danger               { color: #e03e3e; }
.pdv__dropdown-item--danger:hover         { background: #fff0f0; }

/* Dropdown fade */
.menu-fade-enter-active, .menu-fade-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}
.menu-fade-enter-from, .menu-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ═══════════════════════════════════════════════════════════════════════════
   Body
══════════════════════════════════════════════════════════════════════════ */
.pdv__body {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 24px;
  padding: 0 40px 24px;
  overflow: hidden;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Left column
══════════════════════════════════════════════════════════════════════════ */
.pdv__main {
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
  min-height: 0;
}

/* ── Prompt box ── */
.pdv__prompt-box {
  border: 2px solid var(--risse-orange);
  border-radius: 20px;
  background: linear-gradient(160deg, #fffdf7 0%, #fff8ee 100%);
  padding: 18px 18px 12px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.pdv__prompt-input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  resize: none;
  font-family: 'Lexend', sans-serif;
  font-size: 15px;
  font-weight: 400;
  color: #1a1a2e;
  line-height: 1.5;
}

.pdv__prompt-input::placeholder { color: #c8c8d8; }

.pdv__prompt-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}

.pdv__prompt-icon,
.pdv__prompt-send {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.pdv__prompt-icon {
  background: transparent;
  color: #9999bb;
}
.pdv__prompt-icon:hover:not(:disabled) { background: #f0f0f8; color: #1a1a2e; }
.pdv__prompt-icon:disabled { opacity: 0.4; cursor: default; }

.pdv__prompt-send {
  background: transparent;
  color: #9999bb;
}
.pdv__prompt-send:not(:disabled)       { color: var(--risse-orange); }
.pdv__prompt-send:not(:disabled):hover { background: #fff3e0; }
.pdv__prompt-send:disabled             { opacity: 0.35; cursor: default; }

/* ── Logs ── */
.pdv__logs-head {
  display: flex;
  align-items: baseline;
  gap: 5px;
  flex-shrink: 0;
}

.pdv__logs-label {
  font-family: 'Lexend', sans-serif;
  font-weight: 700;
  font-size: 14px;
  color: var(--risse-orange);
}

.pdv__logs-count {
  font-family: 'Lexend', sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #a2a2a2;
}

.pdv__logs-list {
  display: flex;
  flex-direction: column;
}

.pdv__log-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 4px;
  border-bottom: 1px solid #f0f0f8;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.12s;
  outline: none;
}

.pdv__log-row:hover { background: #fafafa; }

.pdv__log-body { flex: 1; min-width: 0; }

.pdv__log-title {
  font-family: 'Lexend', sans-serif;
  font-size: 17px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pdv__log-preview {
  font-family: 'Lexend', sans-serif;
  font-size: 12.5px;
  font-weight: 400;
  color: #9999bb;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pdv__log-date {
  font-family: 'Lexend', sans-serif;
  font-size: 13px;
  font-weight: 400;
  color: #a2a2a2;
  white-space: nowrap;
  flex-shrink: 0;
  padding-top: 2px;
}

.pdv__logs-empty {
  font-family: 'Lexend', sans-serif;
  font-size: 13px;
  color: #c0c0d8;
  padding: 16px 0;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Right sidebar — fixed section buttons
══════════════════════════════════════════════════════════════════════════ */
.pdv__sidebar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 4px;
}

.pdv__section-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  padding: 20px 22px;
  background: #fff;
  border: 1px solid #e4e4f0;
  border-radius: 18px;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.pdv__section-btn:hover {
  border-color: #c8c8d8;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.07);
}

.pdv__section-btn__title {
  font-family: 'Lexend', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 4px;
}

.pdv__section-btn__subtitle {
  font-family: 'Lexend', sans-serif;
  font-size: 13px;
  font-weight: 400;
  color: #9999bb;
  margin: 0;
}
</style>
