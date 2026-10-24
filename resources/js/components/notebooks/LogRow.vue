<script setup>
/**
 * LogRow.vue — one row in the Logs list.
 * Shows title, preview, date, and a three-dot context menu.
 */
import { ref } from 'vue'
import { MoreVertical, Pencil, MoveRight, Trash2, X } from '@lucide/vue'

const props = defineProps({
  log:      { type: Object, required: true },
  projects: { type: Array,  default: () => [] },
  menuOpen: { type: Boolean, default: false },
})

const emit = defineEmits(['open', 'rename', 'move', 'delete', 'toggle-menu', 'close-menu'])

// ── Date helper ───────────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

// ── Three-dot menu ────────────────────────────────────────────────────────
const showRename     = ref(false)
const showMoveSelect = ref(false)
const renameValue    = ref('')

function openMenu(e) {
  e.stopPropagation()
  showRename.value     = false
  showMoveSelect.value = false
  emit('toggle-menu')
}

function closeMenu() {
  showRename.value     = false
  showMoveSelect.value = false
  emit('close-menu')
}

function startRename() {
  renameValue.value = props.log.title
  showRename.value  = true
  emit('close-menu')
}

function submitRename() {
  if (renameValue.value.trim()) emit('rename', props.log.id, renameValue.value)
  showRename.value = false
}

function startMove() {
  showMoveSelect.value = true
  emit('close-menu')
}

function moveToProject(projectId) {
  emit('move', props.log.id, projectId)
  showMoveSelect.value = false
}

function confirmDelete() {
  if (window.confirm(`Delete "${props.log.title}"?`)) emit('delete', props.log.id)
  emit('close-menu')
}
</script>

<template>
  <div class="log-row" @click="$emit('open', log.id)">
    <!-- Inline rename input -->
    <div v-if="showRename" class="log-row__rename" @click.stop>
      <input
        v-model="renameValue"
        class="log-row__rename-input"
        type="text"
        aria-label="Rename log"
        autofocus
        @keydown.enter="submitRename"
        @keydown.esc="showRename = false"
      />
      <button class="log-row__rename-ok" type="button" @click="submitRename">OK</button>
      <button class="log-row__rename-cancel" type="button" @click="showRename = false">
        <X :size="12" aria-hidden="true" />
      </button>
    </div>

    <!-- Normal row content -->
    <template v-else>
      <div class="log-row__body">
        <p class="log-row__title">{{ log.title }}</p>
        <p class="log-row__preview">{{ log.preview }}</p>
      </div>

      <div class="log-row__meta">
        <span class="log-row__date">{{ fmtDate(log.updatedAt) }}</span>

        <!-- Three-dot menu trigger -->
        <div class="log-row__menu-wrap" @click.stop>
          <button
            class="log-row__menu-btn"
            type="button"
            :aria-label="`Actions for ${log.title}`"
            aria-haspopup="menu"
            @click="menuOpen ? closeMenu() : openMenu($event)"
          >
            <MoreVertical :size="15" aria-hidden="true" />
          </button>

          <!-- Dropdown -->
          <div v-if="menuOpen" class="log-row__dropdown" role="menu">
            <button class="log-row__menu-item" role="menuitem" @click="startRename">
              <Pencil :size="13" aria-hidden="true" /> Rename
            </button>
            <button class="log-row__menu-item" role="menuitem" @click="startMove">
              <MoveRight :size="13" aria-hidden="true" /> Move to Project
            </button>
            <button class="log-row__menu-item log-row__menu-item--danger" role="menuitem" @click="confirmDelete">
              <Trash2 :size="13" aria-hidden="true" /> Delete
            </button>
          </div>

          <!-- Move to project submenu -->
          <div v-if="showMoveSelect" class="log-row__dropdown" role="menu">
            <p class="log-row__move-label">Move to…</p>
            <button
              class="log-row__menu-item"
              role="menuitem"
              @click="moveToProject(null)"
            >
              No project (standalone)
            </button>
            <button
              v-for="p in projects"
              :key="p.id"
              class="log-row__menu-item"
              :class="{ 'log-row__menu-item--active': p.id === log.projectId }"
              role="menuitem"
              @click="moveToProject(p.id)"
            >
              {{ p.title }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.log-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f5;
  transition: background 150ms ease;
  border-radius: 6px;
  padding-inline: 4px;
}

.log-row:hover { background: #f8f8fc; }
.log-row:last-child { border-bottom: none; }

/* ── Body ── */
.log-row__body {
  flex: 1;
  min-width: 0;
}

.log-row__title {
  font-size: 12px;
  font-weight: 600;
  color: #1a1a2e;
  line-height: 1.3;
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.log-row__preview {
  font-size: 9px;
  color: #8888aa;
  line-height: 1.45;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Meta ── */
.log-row__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.log-row__date {
  font-size: 9px;
  color: #9999bb;
  white-space: nowrap;
}

/* ── Three-dot menu ── */
.log-row__menu-wrap {
  position: relative;
}

.log-row__menu-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #aaaacc;
  cursor: pointer;
  transition: background 150ms ease, color 150ms ease;
}

.log-row__menu-btn:hover,
.log-row__menu-btn:focus-visible {
  background: #ebebf5;
  color: #4a4a6a;
}

.log-row__dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  z-index: var(--z-dropdown);
  background: #fff;
  border: 1px solid #e8e8f0;
  border-radius: 10px;
  padding: 4px;
  min-width: 160px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.10);
}

.log-row__move-label {
  font-size: 10px;
  color: #aaaacc;
  padding: 4px 10px 2px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.log-row__menu-item {
  display: flex;
  align-items: center;
  gap: 7px;
  width: 100%;
  text-align: left;
  font-size: 12px;
  color: #2a2a4a;
  background: transparent;
  border: none;
  border-radius: 6px;
  padding: 7px 10px;
  cursor: pointer;
  transition: background 150ms ease;
}

.log-row__menu-item:hover,
.log-row__menu-item:focus-visible {
  background: #f4f4fc;
}

.log-row__menu-item--danger { color: #c0392b; }
.log-row__menu-item--danger:hover { background: #fff0ee; }

.log-row__menu-item--active {
  color: var(--risse-orange);
  font-weight: 600;
}

/* ── Inline rename ── */
.log-row__rename {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  padding: 6px 0;
}

.log-row__rename-input {
  flex: 1;
  font-size: 12px;
  font-weight: 600;
  color: #1a1a2e;
  background: #f5f5fb;
  border: 1px solid #d0cfee;
  border-radius: 6px;
  padding: 4px 8px;
  outline: none;
}

.log-row__rename-input:focus { border-color: var(--risse-orange); }

.log-row__rename-ok {
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  background: var(--risse-orange);
  border: none;
  border-radius: 5px;
  padding: 4px 9px;
  cursor: pointer;
}

.log-row__rename-cancel {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: none;
  background: #ebebf5;
  color: #666;
  cursor: pointer;
}
</style>
