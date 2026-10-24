<script setup>
/**
 * ConversationNavPanel.vue
 *
 * Compact Project/Log navigation panel for the conversation workspace,
 * inspired by ChatGPT's history sidebar but adapted to Risse's design.
 *
 * Contents:
 *   - Back-to-Notebooks action + collapse control
 *   - Current Project context (or a standalone-Log indicator)
 *   - New Log action
 *   - Recent Logs list (most recently updated first) with a selected state
 *     and a per-entry menu (rename / move / delete)
 *
 * On mobile the workspace renders this as an off-canvas drawer (`open` prop);
 * on desktop it is a static, collapsible side panel.
 * All mutations go through the shared notebooks store — no local copies.
 */
import { ref, computed } from 'vue'
import { Notebook, Plus, MoreVertical, X } from '@lucide/vue'
import { useNotebooksStore } from '@/stores/notebooksStore.js'
import { useDismissable } from '@/composables/useDismissable.js'

const props = defineProps({
  /** Context Project for this workspace (null = standalone Log context). */
  project:     { type: Object, default: null },
  /** Currently open Log id — drives the selected state. */
  activeLogId: { type: String, default: null },
  /** Desktop collapse state. */
  collapsed:   { type: Boolean, default: false },
  /** Mobile drawer open state. */
  open:        { type: Boolean, default: false },
})

const emit = defineEmits(['back', 'new-log', 'select-log', 'collapse'])

const store = useNotebooksStore()

// ── Recent Logs (derived from the shared collection, newest first) ─────────
const logs = computed(() =>
  props.project
    ? store.logsForProject(props.project.id)
    : store.sortedLogs,
)

// ── Per-entry action menu ──────────────────────────────────────────────────
const menuForId = ref(null)
const menuOpen  = computed(() => menuForId.value !== null)
const moveListOpenForId = ref(null)
useDismissable(menuOpen, () => {
  menuForId.value = null
  moveListOpenForId.value = null
})

function toggleMenu(logId) {
  menuForId.value = menuForId.value === logId ? null : logId
  moveListOpenForId.value = null
}

// ── Inline rename ──────────────────────────────────────────────────────────
const renamingId    = ref(null)
const renameValue   = ref('')
const renameInputEl = ref(null)

function startRename(log) {
  renamingId.value  = log.id
  renameValue.value = log.title
  menuForId.value   = null
  moveListOpenForId.value = null
  requestAnimationFrame(() => {
    // Template refs declared inside v-for collect into an array.
    const el = Array.isArray(renameInputEl.value) ? renameInputEl.value[0] : renameInputEl.value
    el?.focus()
    el?.select()
  })
}

function commitRename() {
  if (renamingId.value && renameValue.value.trim()) {
    store.renameLog(renamingId.value, renameValue.value)
  }
  renamingId.value = null
}

function cancelRename() { renamingId.value = null }

// ── Move / delete ──────────────────────────────────────────────────────────
function moveTo(log, projectId) {
  store.moveLogToProject(log.id, projectId)
  menuForId.value = null
  moveListOpenForId.value = null
}

function removeLog(log) {
  menuForId.value = null
  if (window.confirm(`Delete "${log.title}"?`)) store.deleteLog(log.id)
}

function fmtDate(iso) { return store.fmtDate(iso) }
</script>

<template>
  <aside
    class="navp"
    :class="{ 'navp--collapsed': collapsed, 'navp--open': open }"
    aria-label="Project and recent logs"
  >
    <div class="navp__inner">

      <!-- ── Top: Standalone Logs ─────────────────────────── -->
      <div class="navp__top">
        <button
          class="navp__back"
          type="button"
          aria-label="Back to Standalone Logs overview"
          @click="emit('back')"
        >
          <Notebook :size="14" aria-hidden="true" />
          <span>Standalone Logs</span>
        </button>
      </div>

      <!-- ── Context ───────────────────────────────────────────── -->
      <div class="navp__context">
        <template v-if="project">
          <span class="navp__context-label">Project</span>
          <h2 class="navp__context-title" :title="project.title">{{ project.title }}</h2>
        </template>
        <template v-else>
          <span class="navp__context-label navp__context-label--standalone">Standalone Log</span>
        </template>
      </div>

      <!-- ── New Log ───────────────────────────────────────────── -->
      <button class="navp__new" type="button" @click="emit('new-log')">
        <Plus :size="14" aria-hidden="true" />
        New Log
      </button>

      <!-- ── Recent Logs ───────────────────────────────────────── -->
      <div class="navp__list-wrap">
        <p class="navp__list-label">Recent Logs</p>

        <p v-if="!logs.length" class="navp__list-empty">
          {{ project ? 'No logs in this Project yet.' : 'No logs yet.' }}
        </p>

        <div
          v-for="log in logs"
          :key="log.id"
          class="navp__entry"
          role="listitem"
        >
          <!-- Inline rename -->
          <div v-if="renamingId === log.id" class="navp__rename">
            <input
              ref="renameInputEl"
              v-model="renameValue"
              class="navp__rename-input"
              type="text"
              aria-label="Rename log"
              @keydown.enter.prevent="commitRename"
              @keydown.esc="cancelRename"
              @blur="commitRename"
            />
            <div class="navp__rename-actions">
              <button class="navp__rename-ok" type="button" @click="commitRename">Save</button>
              <button class="navp__rename-cancel" type="button" aria-label="Cancel rename" @click="cancelRename">
                <X :size="12" aria-hidden="true" />
              </button>
            </div>
          </div>

          <!-- Normal entry -->
          <template v-else>
            <button
              class="navp__entry-main"
              :class="{ 'navp__entry-main--active': log.id === activeLogId }"
              type="button"
              :aria-label="`Open log: ${log.title}`"
              :aria-current="log.id === activeLogId ? 'true' : undefined"
              @click="emit('select-log', log.id)"
            >
              <span class="navp__entry-title">{{ log.title }}</span>
              <span class="navp__entry-date">{{ fmtDate(log.updatedAt) }}</span>
            </button>

            <div class="navp__entry-menu-wrap">
              <button
                class="navp__entry-menu-btn"
                type="button"
                :aria-label="`Actions for ${log.title}`"
                :aria-expanded="menuForId === log.id"
                aria-haspopup="menu"
                @click.stop="toggleMenu(log.id)"
              >
                <MoreVertical :size="13" aria-hidden="true" />
              </button>

              <!-- Expanded inline actions (kept in flow: no clipping inside the scrolling list) -->
              <div
                v-if="menuForId === log.id"
                class="navp__entry-actions"
                role="menu"
                @click.stop
              >
                <button class="navp__action" role="menuitem" type="button" @click="startRename(log)">
                  Rename
                </button>
                <button
                  class="navp__action"
                  role="menuitem"
                  type="button"
                  :aria-expanded="moveListOpenForId === log.id"
                  @click="moveListOpenForId = moveListOpenForId === log.id ? null : log.id"
                >
                  Move to Project
                </button>

                <div v-if="moveListOpenForId === log.id" class="navp__move-list">
                  <button
                    v-for="p in store.projects"
                    :key="p.id"
                    class="navp__move-item"
                    :class="{ 'navp__move-item--current': p.id === log.projectId }"
                    type="button"
                    @click="moveTo(log, p.id)"
                  >
                    {{ p.title }}
                  </button>
                  <button
                    v-if="log.projectId"
                    class="navp__move-item"
                    type="button"
                    @click="moveTo(log, null)"
                  >
                    Keep standalone
                  </button>
                </div>

                <button
                  class="navp__action navp__action--danger"
                  role="menuitem"
                  type="button"
                  @click="removeLog(log)"
                >
                  Delete
                </button>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- ── Bottom context note ───────────────────────────────── -->
      <div v-if="!project" class="navp__bottom-note">
        <p class="navp__context-note">
          Not in a Project yet — use <strong>Move</strong> in the header to group it.
        </p>
      </div>

    </div>
  </aside>
</template>

<style scoped>
/* ── Panel shell ───────────────────────────────────────────────────────── */
.navp {
  --navp-w: 260px;
  position: relative;
  flex: 0 0 auto;
  width: var(--navp-w);
  min-width: 0;
  height: 100%;
  overflow: hidden;
  background: #ffffff;
  transition: width 220ms cubic-bezier(0.4, 0, 0.2, 1);
}

.navp--collapsed { width: 0; }

.navp__inner {
  display: flex;
  flex-direction: column;
  width: var(--navp-w);
  height: 100%;
  min-height: 0;
  border-right: 1px solid #f0f0f8;
  box-sizing: border-box;
}

/* ── Top bar ──────────────────────────────────────────────────────────── */
.navp__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 14px 12px 10px;
  flex-shrink: 0;
}

.navp__back {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  font-weight: 600;
  color: #4a4a6a;
  background: transparent;
  border: none;
  border-radius: 8px;
  padding: 6px 8px;
  cursor: pointer;
  transition: background 150ms ease, color 150ms ease;
  min-width: 0;
}

.navp__back:hover,
.navp__back:focus-visible {
  background: #f0f0f8;
  color: #1a1a2e;
  outline: none;
}
.navp__back:focus-visible { box-shadow: 0 0 0 2px rgba(255, 144, 0, 0.35); }

.navp__collapse {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #9999bb;
  cursor: pointer;
  transition: background 150ms ease, color 150ms ease;
}
.navp__collapse:hover,
.navp__collapse:focus-visible {
  background: #f0f0f8;
  color: #4a4a6a;
  outline: none;
}
.navp__collapse:focus-visible { box-shadow: 0 0 0 2px rgba(255, 144, 0, 0.35); }

/* ── Context block ────────────────────────────────────────────────────── */
.navp__context {
  padding: 4px 16px 12px;
  flex-shrink: 0;
  min-width: 0;
}

.navp__context-label {
  display: block;
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--risse-orange);
  margin-bottom: 3px;
}

.navp__context-title {
  font-size: 15px;
  font-weight: 700;
  color: #1a1a2e;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.navp__context-note {
  font-size: 10.5px;
  color: #8888aa;
  line-height: 1.5;
}
.navp__context-note strong { color: #666688; font-weight: 600; }

/* ── New Log ──────────────────────────────────────────────────────────── */
.navp__new {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 0 12px 12px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--risse-orange);
  background: rgba(255, 144, 0, 0.08);
  border: 1px solid rgba(255, 144, 0, 0.22);
  border-radius: 9px;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 150ms ease;
}
.navp__new:hover,
.navp__new:focus-visible {
  background: rgba(255, 144, 0, 0.16);
  outline: none;
}
.navp__new:focus-visible { box-shadow: 0 0 0 2px rgba(255, 144, 0, 0.35); }

/* ── Recent Logs list ─────────────────────────────────────────────────── */
.navp__list-wrap {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 12px 14px;
  scrollbar-width: thin;
  scrollbar-color: #e0e0ee transparent;
}

.navp__list-label {
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #9999bb;
  padding: 0 4px 6px;
}

.navp__list-empty {
  font-size: 11.5px;
  color: #aaaacc;
  padding: 6px 4px;
  line-height: 1.5;
}

.navp__entry {
  position: relative;
  display: flex;
  align-items: stretch;
  flex-wrap: wrap;           /* open actions wrap to their own row below */
  gap: 2px;
  min-width: 0;
  border-radius: 9px;
  transition: background 150ms ease;
}
.navp__entry:hover { background: #f0f0f8; }

.navp__entry-main {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  text-align: left;
  background: transparent;
  border: none;
  border-radius: 9px;
  padding: 8px 10px;
  cursor: pointer;
}

.navp__entry-main--active {
  background: rgba(255, 144, 0, 0.10);
  box-shadow: inset 0 0 0 1px rgba(255, 144, 0, 0.20);
}
.navp__entry-main--active .navp__entry-title {
  color: #c85800;
  font-weight: 600;
}

.navp__entry-title {
  font-size: 12px;
  color: #2a2a4a;
  line-height: 1.35;
  min-width: 0;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow-wrap: anywhere;
}

.navp__entry-date {
  font-size: 9px;
  color: #b0b0cc;
  white-space: nowrap;
  flex-shrink: 0;
  margin-left: auto;
  text-align: right;
}

.navp__bottom-note {
  padding: 12px 14px;
  border-top: 1px solid #f0f0f8;
  background: #fafafc;
  flex-shrink: 0;
}

/* ── Entry menu ───────────────────────────────────────────────────────── */
/* The wrapper is transparent to layout so the ⋯ button stays in the entry
   row while the actions card becomes a full-width row below it. */
.navp__entry-menu-wrap {
  display: contents;
}

.navp__entry-menu-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  align-self: center;
  margin-right: 4px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #aaaacc;
  cursor: pointer;
  opacity: 0;
  transition: background 150ms ease, color 150ms ease, opacity 150ms ease;
}
.navp__entry:hover .navp__entry-menu-btn,
.navp__entry-menu-btn:focus-visible,
.navp__entry-menu-btn[aria-expanded='true'] { opacity: 1; }
.navp__entry-menu-btn:hover,
.navp__entry-menu-btn:focus-visible {
  background: #ebebf5;
  color: #4a4a6a;
  outline: none;
}

/* Actions expand in flow — never clipped by the scrolling Recent Logs list. */
.navp__entry-actions {
  flex: 0 0 100%;
  min-width: 0;
  margin: 2px 2px 7px;
  background: #fff;
  border: 1px solid #e8e8f0;
  border-radius: 10px;
  padding: 4px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
}

.navp__action {
  display: block;
  width: 100%;
  text-align: left;
  font-size: 11.5px;
  color: #2a2a4a;
  background: transparent;
  border: none;
  border-radius: 6px;
  padding: 7px 10px;
  cursor: pointer;
  transition: background 150ms ease;
}
.navp__action:hover,
.navp__action:focus-visible {
  background: #f4f4fc;
  outline: none;
}
.navp__action--danger { color: #c0392b; }
.navp__action--danger:hover,
.navp__action--danger:focus-visible { background: #fff0ee; }

.navp__move-list {
  border-top: 1px solid #f0f0f8;
  margin: 3px 0;
  padding-top: 3px;
  max-height: 172px;
  overflow-y: auto;
  scrollbar-width: thin;
}

.navp__move-item {
  display: block;
  width: 100%;
  text-align: left;
  font-size: 11.5px;
  color: #4a4a6a;
  background: transparent;
  border: none;
  border-radius: 6px;
  padding: 6px 10px 6px 16px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: background 150ms ease;
}
.navp__move-item:hover,
.navp__move-item:focus-visible {
  background: #f4f4fc;
  outline: none;
}
.navp__move-item--current {
  color: var(--risse-orange);
  font-weight: 600;
}

/* ── Inline rename ────────────────────────────────────────────────────── */
.navp__rename {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 8px 9px 10px;
}

.navp__rename-input {
  width: 100%;
  font-size: 12px;
  font-weight: 600;
  color: #1a1a2e;
  background: #fff;
  border: 1px solid #d0cfee;
  border-radius: 6px;
  padding: 5px 8px;
  outline: none;
}
.navp__rename-input:focus { border-color: var(--risse-orange); }

.navp__rename-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.navp__rename-ok {
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  background: var(--risse-orange);
  border: none;
  border-radius: 5px;
  padding: 4px 10px;
  cursor: pointer;
}
.navp__rename-ok:hover { background: var(--risse-orange-active); }

.navp__rename-cancel {
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

/* ── Tablet: narrower panel ───────────────────────────────────────────── */
@media (max-width: 1024px) {
  .navp { --navp-w: 216px; }
}

/* ── Mobile: off-canvas drawer ────────────────────────────────────────── */
@media (max-width: 768px) {
  .navp {
    --navp-w: min(300px, 86vw);
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 60;
    width: var(--navp-w);
    transform: translateX(-100%);
    visibility: hidden;
    box-shadow: 0 12px 32px rgba(15, 10, 40, 0.22);
    transition: transform 240ms cubic-bezier(0.4, 0, 0.2, 1), visibility 240ms;
  }

  .navp--open {
    transform: translateX(0);
    visibility: visible;
  }

  /* Drawer ignores the desktop collapse state */
  .navp--collapsed { width: var(--navp-w); }

  .navp__entry-menu-btn { opacity: 1; }
}
</style>
