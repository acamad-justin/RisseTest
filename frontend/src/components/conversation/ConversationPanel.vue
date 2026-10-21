<script setup>
/**
 * ConversationPanel.vue
 *
 * The conversation side of the workspace: a sticky header, an independently
 * scrollable message history, and a persistent composer — all constrained to
 * the viewport height provided by ConversationWorkspace.
 *
 * ChatGPT-inspired scroll behaviour:
 *   - Opening a Log shows its most recent messages.
 *   - Sending a message scrolls to it.
 *   - Appended messages only follow the view when the user is already near the
 *     bottom; a reader of older messages is never pulled back down, and a
 *     "Jump to latest" control appears instead.
 *
 * Demo mode: messages are stored locally in the notebooks store. No AI reply
 * is fabricated — submission is isolated in `send()` so the real Socratic AI
 * can be wired in later without touching the UI.
 */
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft,
  ArrowDown,
  Send,
  Paperclip,
  PanelLeft,
  Pencil,
  MoveRight,
  MoreVertical,
  Trash2,
} from '@lucide/vue'
import { useNotebooksStore } from '@/stores/notebooksStore.js'
import { useDismissable } from '@/composables/useDismissable.js'

const props = defineProps({
  /** The active Log (with its own messages array). */
  log:     { type: Object, required: true },
  /** Context Project for subtle breadcrumb + back navigation (null = standalone). */
  project: { type: Object, default: null },
})

const emit = defineEmits(['toggle-nav', 'deleted'])

const router = useRouter()
const store  = useNotebooksStore()

/* ── Scroll management ──────────────────────────────────────────────────── */
const listEl     = ref(null)
const nearBottom = ref(true)
const showJump   = ref(false)

const BOTTOM_THRESHOLD = 80   // px from bottom that counts as "at the latest"
const JUMP_THRESHOLD   = 120  // px from bottom before offering "Jump to latest"

function distanceFromBottom() {
  const el = listEl.value
  if (!el) return 0
  return el.scrollHeight - el.scrollTop - el.clientHeight
}

function updateScrollState() {
  const d = distanceFromBottom()
  nearBottom.value = d <= BOTTOM_THRESHOLD
  showJump.value   = d > JUMP_THRESHOLD
}

/** Bound to the message list via @scroll — removed automatically on unmount. */
function onScroll() { updateScrollState() }

function scrollToBottom(behavior = 'auto') {
  const el = listEl.value
  if (!el) return
  el.scrollTo({ top: el.scrollHeight, behavior })
}

function jumpToLatest() {
  scrollToBottom('smooth')
  nearBottom.value = true
  showJump.value   = false
}

/* ── Composer ───────────────────────────────────────────────────────────── */
const input   = ref('')
const inputEl = ref(null)
const MAX_INPUT_PX = 148 // sensible cap; the textarea scrolls beyond it

/** Persistent demo-mode notice shown under the composer. */
const DEMO_NOTICE = 'Demo mode — messages are stored locally; Risse’s AI is not connected yet.'

const sendDisabled = computed(() => input.value.trim().length === 0)

function autoGrow() {
  const el = inputEl.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, MAX_INPUT_PX)}px`
}

function send() {
  const text = input.value.trim()
  if (!text) return
  forceNextScroll.value = true
  store.sendMessage(props.log.id, text) // local-only — no AI request is made
  input.value = ''
  nextTick(() => autoGrow())
}

function onComposerKeydown(event) {
  // Enter submits; Shift+Enter inserts a newline (its default is preserved).
  if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return
  event.preventDefault()
  send()
}

/* ── Attachment (placeholder interaction only — no uploads) ─────────────── */
const fileEl      = ref(null)
const attachNote  = ref('')
let   attachTimer = null

function openFilePicker() { fileEl.value?.click() }

function onFileChosen() {
  const files = fileEl.value?.files
  if (!files || !files.length) return
  attachNote.value = 'Attachment noted — file uploads are unavailable in demo mode.'
  fileEl.value.value = ''
  clearTimeout(attachTimer)
  attachTimer = setTimeout(() => { attachNote.value = '' }, 4500)
}

onBeforeUnmount(() => clearTimeout(attachTimer))

/* ── Header actions ─────────────────────────────────────────────────────── */
// Declared before the watchers: the immediate log watcher resets these refs.
const renaming      = ref(false)
const renameValue   = ref('')
const renameInputEl = ref(null)
const moveOpen      = ref(false)
const optionsOpen   = ref(false)

useDismissable(moveOpen, () => { moveOpen.value = false })
useDismissable(optionsOpen, () => { optionsOpen.value = false })

function startRename() {
  renameValue.value = props.log.title
  renaming.value    = true
  moveOpen.value    = false
  optionsOpen.value = false
  nextTick(() => {
    renameInputEl.value?.focus()
    renameInputEl.value?.select()
  })
}

function commitRename() {
  if (renaming.value && renameValue.value.trim()) {
    store.renameLog(props.log.id, renameValue.value)
  }
  renaming.value = false
}

function cancelRename() { renaming.value = false }

function moveTo(projectId) {
  store.moveLogToProject(props.log.id, projectId)
  moveOpen.value = false
}

function deleteLog() {
  optionsOpen.value = false
  if (!window.confirm(`Delete "${props.log.title}"?`)) return
  store.deleteLog(props.log.id)
  emit('deleted')
}

/* ── Auto-scroll lifecycle ──────────────────────────────────────────────── */
const forceNextScroll = ref(false)

// Opening or switching a Log: reset transient state, then show the newest messages.
watch(
  () => props.log.id,
  async () => {
    input.value           = ''
    nearBottom.value      = true
    showJump.value        = false
    forceNextScroll.value = false
    renaming.value        = false
    moveOpen.value        = false
    optionsOpen.value     = false
    await nextTick()
    if (inputEl.value) inputEl.value.style.height = 'auto'
    scrollToBottom('auto')
  },
  { immediate: true },
)

// A message was appended: follow it only when already near the bottom.
watch(
  () => props.log.messages.length,
  async () => {
    await nextTick()
    if (forceNextScroll.value) {
      forceNextScroll.value = false
      nearBottom.value = true
      showJump.value   = false
      scrollToBottom('smooth')
      return
    }
    updateScrollState()
    if (nearBottom.value) scrollToBottom('smooth')
  },
)

function goBack() {
  if (props.project) router.push(`/projects/${props.project.id}`)
  else router.push('/notebooks')
}

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="convo">

    <!-- ── Header (never scrolls away) ──────────────────────────── -->
    <header class="convo__header">
      <button
        class="convo__action-btn convo__nav-toggle"
        type="button"
        aria-label="Show or hide recent logs"
        @click="emit('toggle-nav')"
      >
        <PanelLeft :size="16" aria-hidden="true" />
      </button>

      <button
        class="convo__action-btn"
        type="button"
        aria-label="Go back"
        @click="goBack"
      >
        <ArrowLeft :size="16" aria-hidden="true" />
      </button>

      <div class="convo__header-titles">
        <span class="convo__log-label">Log</span>
        <span v-if="project" class="convo__project-crumb">/ {{ project.title }}</span>
      </div>

      <!-- Inline rename replaces the title while editing -->
      <input
        v-if="renaming"
        ref="renameInputEl"
        v-model="renameValue"
        class="convo__rename-input"
        type="text"
        aria-label="Rename conversation"
        @keydown.enter.prevent="commitRename"
        @keydown.esc="cancelRename"
        @blur="commitRename"
      />
      <h1 v-else class="convo__title">{{ log.title }}</h1>

      <span class="convo__demo-badge">Demo mode</span>

      <!-- Compact actions — every control has a defined behaviour -->
      <div class="convo__header-actions">
        <button
          class="convo__action-btn"
          type="button"
          aria-label="Rename conversation"
          title="Rename"
          @click="startRename"
        >
          <Pencil :size="14" aria-hidden="true" />
        </button>

        <div class="convo__menu-wrap">
          <button
            class="convo__action-btn"
            :class="{ 'convo__action-btn--active': moveOpen }"
            type="button"
            aria-label="Move conversation to a project"
            aria-haspopup="menu"
            :aria-expanded="moveOpen"
            title="Move to Project"
            @click.stop="moveOpen = !moveOpen"
          >
            <MoveRight :size="14" aria-hidden="true" />
          </button>

          <div v-if="moveOpen" class="convo__dropdown" role="menu" @click.stop>
            <span class="convo__dropdown-label">Move to Project</span>
            <button
              v-for="p in store.projects"
              :key="p.id"
              class="convo__dropdown-item"
              :class="{ 'convo__dropdown-item--current': p.id === log.projectId }"
              role="menuitem"
              type="button"
              @click="moveTo(p.id)"
            >
              {{ p.title }}
            </button>
            <button
              v-if="log.projectId"
              class="convo__dropdown-item"
              role="menuitem"
              type="button"
              @click="moveTo(null)"
            >
              Keep standalone
            </button>
          </div>
        </div>

        <div class="convo__menu-wrap">
          <button
            class="convo__action-btn"
            :class="{ 'convo__action-btn--active': optionsOpen }"
            type="button"
            aria-label="Conversation options"
            aria-haspopup="menu"
            :aria-expanded="optionsOpen"
            title="Options"
            @click.stop="optionsOpen = !optionsOpen"
          >
            <MoreVertical :size="14" aria-hidden="true" />
          </button>

          <div v-if="optionsOpen" class="convo__dropdown" role="menu" @click.stop>
            <span class="convo__dropdown-label">Conversation options</span>
            <button
              class="convo__dropdown-item convo__dropdown-item--danger"
              role="menuitem"
              type="button"
              @click="deleteLog"
            >
              <Trash2 :size="13" aria-hidden="true" />
              Delete Log
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- ── Scrollable history + jump control ────────────────────── -->
    <div class="convo__body">
      <div
        ref="listEl"
        class="convo__messages"
        role="log"
        aria-live="polite"
        aria-label="Conversation messages"
        @scroll="onScroll"
      >
        <!-- Empty state for a new Log -->
        <div v-if="!log.messages.length" class="convo__empty">
          <p class="convo__empty-title">What are you curious about?</p>
          <p class="convo__empty-sub">
            Ask Risse anything about your project — messages stay local until the
            AI is connected.
          </p>
        </div>

        <div
          v-for="msg in log.messages"
          :key="msg.id"
          class="convo__msg"
          :class="msg.role === 'user' ? 'convo__msg--user' : 'convo__msg--risse'"
        >
          <div class="convo__bubble">
            <p class="convo__bubble-text">{{ msg.content }}</p>
            <span v-if="msg.isDemo" class="convo__demo-tag">demo response</span>
          </div>
          <span class="convo__time">{{ fmtTime(msg.createdAt) }}</span>
        </div>
      </div>

      <Transition name="jump-fade">
        <button
          v-if="showJump"
          class="convo__jump"
          type="button"
          @click="jumpToLatest"
        >
          Jump to latest
          <ArrowDown :size="12" aria-hidden="true" />
        </button>
      </Transition>
    </div>

    <!-- ── Persistent composer ──────────────────────────────────── -->
    <footer class="convo__composer">
      <form class="convo__composer-form" @submit.prevent="send">
        <button
          class="convo__attach-btn"
          type="button"
          aria-label="Attach a file (demo placeholder)"
          title="Attach a file"
          @click="openFilePicker"
        >
          <Paperclip :size="15" aria-hidden="true" />
        </button>
        <input
          ref="fileEl"
          class="sr-only"
          type="file"
          tabindex="-1"
          aria-hidden="true"
          @change="onFileChosen"
        />

        <textarea
          ref="inputEl"
          v-model="input"
          class="convo__input"
          rows="1"
          placeholder="Ask Risse"
          aria-label="Your message"
          @input="autoGrow"
          @keydown="onComposerKeydown"
        ></textarea>

        <button
          class="convo__send-btn"
          type="submit"
          :disabled="sendDisabled"
          aria-label="Send message"
        >
          <Send :size="15" aria-hidden="true" />
        </button>
      </form>

      <p
        class="convo__composer-notice"
        :class="{ 'convo__composer-notice--note': attachNote }"
      >
        {{ attachNote || DEMO_NOTICE }}
      </p>
    </footer>

  </div>
</template>

<style scoped>
/* ── Shell: fills the workspace panel, never the page ──────────────────── */
.convo {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  height: 100%;
  background: #ffffff;
  overflow: hidden;
}

/* ── Header (stays above the scrolling history) ────────────────────────── */
.convo__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-bottom: 1px solid #f0f0f8;
  flex-shrink: 0;
  min-width: 0;
}

.convo__header-titles {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
  min-width: 0;
}

.convo__log-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--risse-orange);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.convo__project-crumb {
  font-size: 11px;
  color: #9999bb;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}

.convo__title {
  flex: 1;
  font-size: 15px;
  font-weight: 700;
  color: #1a1a2e;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.convo__rename-input {
  flex: 1;
  min-width: 0;
  font-size: 15px;
  font-weight: 700;
  color: #1a1a2e;
  background: #f5f5fb;
  border: 1px solid #d0cfee;
  border-radius: 8px;
  padding: 4px 10px;
  outline: none;
  transition: border-color 150ms ease, background 150ms ease;
}
.convo__rename-input:focus {
  border-color: var(--risse-orange);
  background: #fff;
}

.convo__demo-badge {
  flex-shrink: 0;
  font-size: 9.5px;
  font-weight: 600;
  color: var(--risse-orange);
  background: rgba(255, 144, 0, 0.09);
  border-radius: 999px;
  padding: 3px 9px;
  letter-spacing: 0.03em;
  white-space: nowrap;
}

/* ── Header actions ────────────────────────────────────────────────────── */
.convo__header-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.convo__action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border-radius: 50%;
  border: 1px solid transparent;
  background: transparent;
  color: #666688;
  cursor: pointer;
  transition: background 150ms ease, color 150ms ease, border-color 150ms ease;
}
.convo__action-btn:hover {
  background: #f5f5fb;
  color: #1a1a2e;
}
.convo__action-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(255, 144, 0, 0.45);
}
.convo__action-btn--active {
  background: rgba(255, 144, 0, 0.10);
  border-color: rgba(255, 144, 0, 0.25);
  color: var(--risse-orange);
}

.convo__menu-wrap { position: relative; }

.convo__dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: var(--z-dropdown);
  background: #fff;
  border: 1px solid #e8e8f0;
  border-radius: 10px;
  padding: 4px;
  min-width: 184px;
  max-height: 264px;
  overflow-y: auto;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  scrollbar-width: thin;
}

.convo__dropdown-label {
  display: block;
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #aaaacc;
  padding: 6px 10px 4px;
}

.convo__dropdown-item {
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: background 150ms ease;
}
.convo__dropdown-item:hover,
.convo__dropdown-item:focus-visible {
  background: #f4f4fc;
  outline: none;
}
.convo__dropdown-item--current {
  color: var(--risse-orange);
  font-weight: 600;
}
.convo__dropdown-item--danger { color: #c0392b; }
.convo__dropdown-item--danger:hover,
.convo__dropdown-item--danger:focus-visible { background: #fff0ee; }

/* ── Body: holds the scroll region + floating jump control ─────────────── */
.convo__body {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* ── Scrollable message history ────────────────────────────────────────── */
.convo__messages {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;         /* long content must never widen the shell */
  padding: 20px 28px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  scrollbar-width: thin;
  scrollbar-color: #e0e0ee transparent;
  overscroll-behavior: contain;
  scroll-behavior: auto;      /* smoothness is requested from JS where needed */
}

/* Empty state — centred in the available space, composer stays visible */
.convo__empty {
  margin: auto;
  text-align: center;
  padding: 24px 16px;
  max-width: 440px;
}
.convo__empty-title {
  font-size: 17px;
  font-weight: 600;
  color: #2a2a4a;
  margin-bottom: 6px;
}
.convo__empty-sub {
  font-size: 12.5px;
  color: #9999bb;
  line-height: 1.6;
}

/* ── Messages ──────────────────────────────────────────────────────────── */
.convo__msg {
  display: flex;
  flex-direction: column;
  gap: 3px;
  max-width: 68%;
  min-width: 0;
}

.convo__msg--user  { align-self: flex-end;  align-items: flex-end; }
.convo__msg--risse { align-self: flex-start; align-items: flex-start; }

.convo__bubble {
  border-radius: 14px;
  padding: 10px 14px;
  font-size: 13px;
  line-height: 1.55;
  min-width: 0;
  max-width: 100%;
}

/* User bubble: soft orange tint, orange text */
.convo__msg--user .convo__bubble {
  background: #fff3e6;
  color: #c85800;
  border-bottom-right-radius: 4px;
}

/* Risse bubble: restrained near-white panel, dark text */
.convo__msg--risse .convo__bubble {
  background: #f5f5fb;
  color: #2a2a4a;
  border-bottom-left-radius: 4px;
}

.convo__bubble-text {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;    /* very long words/messages wrap instead of overflowing */
  word-break: break-word;
}

/* Defensive: future code blocks scroll inside their bubble, never the page */
.convo__bubble pre {
  max-width: 100%;
  overflow-x: auto;
  background: #ececf6;
  border-radius: 8px;
  padding: 8px 10px;
  font-family: var(--font-family-mono);
  font-size: 12px;
}
.convo__bubble code { overflow-wrap: anywhere; }

.convo__demo-tag {
  display: inline-block;
  font-size: 9px;
  color: rgba(200, 88, 0, 0.60);
  margin-top: 4px;
  font-style: italic;
}

.convo__time {
  font-size: 9.5px;
  color: #b0b0cc;
}

/* ── Jump to latest ────────────────────────────────────────────────────── */
.convo__jump {
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  font-weight: 600;
  color: #2a2a4a;
  background: #ffffff;
  border: 1px solid #e4e4ee;
  border-radius: 999px;
  padding: 7px 14px;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(16, 24, 40, 0.14);
  transition: background 150ms ease, box-shadow 150ms ease;
}
.convo__jump:hover,
.convo__jump:focus-visible {
  background: #fafafa;
  outline: none;
}
.convo__jump:focus-visible { box-shadow: 0 0 0 2px rgba(255, 144, 0, 0.45), 0 4px 14px rgba(16, 24, 40, 0.14); }

.jump-fade-enter-active,
.jump-fade-leave-active { transition: opacity 160ms ease, transform 160ms ease; }
.jump-fade-enter-from,
.jump-fade-leave-to { opacity: 0; transform: translateX(-50%) translateY(6px); }

/* ── Composer (persistent — outside the scrolling region) ──────────────── */
.convo__composer {
  flex-shrink: 0;
  border-top: 1px solid #f0f0f8;
  padding: 10px 20px 12px;
  background: #ffffff;
}

.convo__composer-form {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  background: #ffffff;
  border: 1px solid #e4e4ee;
  border-radius: 16px;
  padding: 7px 7px 7px 11px;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04), 0 4px 12px rgba(16, 24, 40, 0.05);
  transition: border-color 150ms ease, box-shadow 150ms ease;
}
.convo__composer-form:focus-within {
  border-color: var(--risse-orange);
  box-shadow: 0 0 0 3px rgba(255, 144, 0, 0.12), 0 4px 12px rgba(16, 24, 40, 0.05);
}

.convo__attach-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  align-self: flex-end;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #9999bb;
  cursor: pointer;
  transition: background 150ms ease, color 150ms ease;
}
.convo__attach-btn:hover,
.convo__attach-btn:focus-visible {
  background: #f5f5fb;
  color: #4a4a6a;
  outline: none;
}
.convo__attach-btn:focus-visible { box-shadow: 0 0 0 2px rgba(255, 144, 0, 0.4); }

.convo__input {
  flex: 1;
  min-width: 0;
  resize: none;
  border: none;
  outline: none;
  background: transparent;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  color: #1a1a2e;
  padding: 6px 2px;
  max-height: 148px;   /* never outgrows the viewport */
  overflow-y: auto;
  scrollbar-width: thin;
}
.convo__input::placeholder { color: #b0b0cc; }

.convo__send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  align-self: flex-end;
  border-radius: 10px;
  border: none;
  background: var(--risse-orange);
  color: #fff;
  cursor: pointer;
  transition: background 150ms ease, opacity 150ms ease;
}
.convo__send-btn:disabled { opacity: 0.38; cursor: not-allowed; }
.convo__send-btn:hover:not(:disabled) { background: var(--risse-orange-active); }
.convo__send-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(255, 144, 0, 0.45);
}

.convo__composer-notice {
  font-size: 9.5px;
  color: #c0c0d8;
  text-align: center;
  margin-top: 7px;
  line-height: 1.4;
}
.convo__composer-notice--note { color: var(--risse-orange); }

/* ── Responsive ────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .convo__header { padding: 10px 12px; gap: 6px; }
  .convo__messages { padding: 16px 14px; }
  .convo__composer { padding: 8px 12px 10px; }
  .convo__msg { max-width: 86%; }
}

@media (max-width: 640px) {
  .convo__project-crumb { display: none; }
}

@media (max-width: 460px) {
  .convo__demo-badge { display: none; }
  .convo__title { font-size: 14px; }
}
</style>
