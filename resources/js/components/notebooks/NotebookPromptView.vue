<script setup>
/**
 * NotebookPromptView.vue
 *
 * Dedicated "Where will curiosity take you, [Name]?" prompt view.
 * Appears when:
 *   - The Risse mascot is clicked on the Home page
 *   - The "+" button is clicked on the Standalone Logs / Notebooks page
 *
 * Connecting directly to the conversation workspace upon user submission.
 */
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { Send, Paperclip, ChevronDown, Check, ChevronLeft, MoreVertical } from 'lucide-vue-next'

const props = defineProps({
  userName:     { type: String, default: 'Adriel' },
  projects:     { type: Array, default: () => [] },
  canClose:     { type: Boolean, default: false },
  isSubmitting: { type: Boolean, default: false },
})

const emit = defineEmits(['submit', 'back', 'open-search', 'open-menu', 'close'])

const query = ref('')
const textareaEl = ref(null)
const selectedProjectId = ref(null)
const projectMenuOpen = ref(false)

// ── Selected project display name ──────────────────────────────────────────
const selectedProjectTitle = computed(() => {
  if (!selectedProjectId.value) return 'Project'
  const p = props.projects.find(proj => proj.id === selectedProjectId.value)
  return p ? `Project: ${p.title}` : 'Project'
})

// ── File Attachment ────────────────────────────────────────────────────────
const fileInputEl  = ref(null)
const attachedFile = ref(null)

function openFilePicker() {
  fileInputEl.value?.click()
}

function onFileChosen(event) {
  const file = event.target?.files?.[0]
  if (!file) return

  const sizeKb = file.size / 1024
  const formattedSize = sizeKb < 1024
    ? `${sizeKb.toFixed(1)} KB`
    : `${(sizeKb / 1024).toFixed(1)} MB`

  const item = {
    name: file.name,
    size: formattedSize,
    type: file.type || 'file',
    content: '',
  }

  const isTextual = file.type.startsWith('text/') ||
    file.name.match(/\.(txt|md|js|ts|py|c|cpp|h|hpp|json|csv|html|css|vue|xml|yaml|yml|ino)$/i)

  if (isTextual) {
    const reader = new FileReader()
    reader.onload = (e) => {
      item.content = e.target?.result || ''
      attachedFile.value = item
    }
    reader.readAsText(file)
  } else {
    attachedFile.value = item
  }
}

function removeAttachment() {
  attachedFile.value = null
  if (fileInputEl.value) fileInputEl.value.value = ''
}

// ── Auto-grow textarea ─────────────────────────────────────────────────────
function autoGrow() {
  const el = textareaEl.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 140)}px`
}

function onKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault()
    onSubmit()
  }
}

// ── Submit ─────────────────────────────────────────────────────────────────
function onSubmit() {
  if (props.isSubmitting) return
  const text = query.value.trim()
  if (!text && !attachedFile.value) return

  emit('submit', {
    text,
    attachment: attachedFile.value,
    projectId: selectedProjectId.value,
  })
}

function selectProject(projId) {
  selectedProjectId.value = projId
  projectMenuOpen.value = false
}

// Close project menu on outside click & escape handler
function onDocClick() {
  projectMenuOpen.value = false
}

function handleClose(e) {
  e?.stopPropagation?.()
  if (!props.isSubmitting) {
    emit('back')
    emit('close')
  }
}

function onGlobalKeydown(e) {
  if (e.key === 'Escape' && props.canClose && !props.isSubmitting) {
    handleClose(e)
  }
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onGlobalKeydown)
  nextTick(() => {
    textareaEl.value?.focus()
  })
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onGlobalKeydown)
})
</script>

<template>
  <div class="nb-prompt-root">
    <div class="nb-prompt-content">
      <!-- ── Top bar: Back chevron on left, three-dots menu icon on right ── -->
      <header class="nb-prompt-header">
        <button
          type="button"
          class="prompt-icon-btn prompt-icon-btn--back"
          title="Back"
          aria-label="Back"
          @click.stop="handleClose"
          id="btn-prompt-back"
        >
          <ChevronLeft :size="24" aria-hidden="true" />
        </button>

        <div class="prompt-header-actions">
          <button
            type="button"
            class="prompt-icon-btn prompt-icon-btn--menu"
            title="More options"
            aria-label="More options"
            @click.stop="$emit('open-menu')"
            id="btn-prompt-menu"
          >
            <MoreVertical :size="20" aria-hidden="true" />
          </button>
        </div>
      </header>

      <!-- ── Centered Prompt Box & Greeting ── -->
      <main class="nb-prompt-main">
        <h1 class="prompt-heading">
          Where will curiosity take you, {{ userName }}?
        </h1>

      <div class="prompt-card">
        <!-- Text input area -->
        <textarea
          ref="textareaEl"
          v-model="query"
          rows="1"
          placeholder="Ask Risse"
          class="prompt-textarea"
          aria-label="Ask Risse"
          @input="autoGrow"
          @keydown="onKeydown"
        ></textarea>

        <!-- Attachment preview chip -->
        <div v-if="attachedFile" class="prompt-chip">
          <Paperclip :size="13" class="prompt-chip__icon" />
          <span class="prompt-chip__name">{{ attachedFile.name }}</span>
          <span class="prompt-chip__size">({{ attachedFile.size }})</span>
          <button type="button" class="prompt-chip__remove" aria-label="Remove attachment" @click="removeAttachment">
            ✕
          </button>
        </div>

        <!-- Bottom Controls Row -->
        <div class="prompt-bottom-row">
          <!-- Left: Log & Project Pills -->
          <div class="prompt-pills-group">
            <span class="pill-log" aria-current="true">Log</span>

            <div class="pill-dropdown-wrap" @click.stop>
              <button
                type="button"
                class="pill-project"
                :class="{ 'pill-project--selected': selectedProjectId }"
                aria-haspopup="menu"
                :aria-expanded="projectMenuOpen"
                @click="projectMenuOpen = !projectMenuOpen"
              >
                <span>{{ selectedProjectTitle }}</span>
                <ChevronDown :size="12" aria-hidden="true" />
              </button>

              <!-- Project Dropdown -->
              <div v-if="projectMenuOpen" class="project-dropdown" role="menu">
                <button
                  type="button"
                  class="project-dropdown-item"
                  :class="{ 'project-dropdown-item--active': selectedProjectId === null }"
                  @click="selectProject(null)"
                >
                  <span>Standalone (No Project)</span>
                  <Check v-if="selectedProjectId === null" :size="13" />
                </button>

                <div v-if="projects.length" class="project-dropdown-divider"></div>

                <button
                  v-for="p in projects"
                  :key="p.id"
                  type="button"
                  class="project-dropdown-item"
                  :class="{ 'project-dropdown-item--active': selectedProjectId === p.id }"
                  @click="selectProject(p.id)"
                >
                  <span class="project-name">{{ p.title }}</span>
                  <Check v-if="selectedProjectId === p.id" :size="13" />
                </button>
              </div>
            </div>
          </div>

          <!-- Right: Attach & Send -->
          <div class="prompt-actions-group">
            <!-- Hidden file input -->
            <input
              ref="fileInputEl"
              type="file"
              class="sr-only"
              style="display: none;"
              accept=".txt,.md,.js,.ts,.py,.c,.cpp,.h,.hpp,.json,.csv,.html,.css,.vue,.xml,.yaml,.yml,.ino,.pdf,image/*"
              tabindex="-1"
              aria-hidden="true"
              @change="onFileChosen"
            />

            <button
              type="button"
              class="prompt-btn-icon"
              title="Attach code or schematic"
              aria-label="Attach file"
              @click="openFilePicker"
            >
              <Paperclip :size="17" aria-hidden="true" />
            </button>

            <button
              type="button"
              class="prompt-btn-send"
              :class="{
                'prompt-btn-send--active': query.trim() || attachedFile,
                'prompt-btn-send--loading': isSubmitting,
              }"
              :disabled="(!query.trim() && !attachedFile) || isSubmitting"
              title="Send to Risse AI"
              aria-label="Send query"
              @click="onSubmit"
            >
              <span v-if="isSubmitting" class="prompt-spinner"></span>
              <Send v-else :size="16" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </main>
    </div>
  </div>
</template>

<style scoped>
.nb-prompt-root {
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
  height: 100%;
  min-height: 0;
  background: transparent;
  border-radius: 0;
  overflow: hidden;
  box-sizing: border-box;
}

.nb-prompt-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
  height: 100%;
  min-height: 0;
}

/* ── Top bar: h-16 px-8 flex items-center justify-between shrink-0 ── */
.nb-prompt-header {
  height: 64px; /* h-16 = 4rem = 64px */
  padding: 0 32px; /* px-8 = 2rem = 32px */
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  position: relative;
  z-index: 30;
  box-sizing: border-box;
}

.prompt-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
  z-index: 35;
}

.prompt-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: transparent;
  border: none;
  color: #525252;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease;
}

.prompt-icon-btn:hover {
  background: #f4f4f5;
  color: #171717;
  transform: scale(1.04);
}

/* ── Center Chat Area: flex-1 flex flex-col items-center justify-center px-6 with -mt-12 and pb-16 ── */
.nb-prompt-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 24px; /* px-6 */
  margin-top: -48px; /* -mt-12 for optical vertical centering above dead-center */
  padding-bottom: 64px; /* pb-16 */
  box-sizing: border-box;
  width: 100%;
}

/* Centered heading: "Where will curiosity take you, Adriel?" text-2xl font-medium text-neutral-800 */
.prompt-heading {
  font-family: var(--font-family-sans, 'Lexend', sans-serif);
  font-size: 1.5rem; /* text-2xl = 24px */
  font-weight: 500;   /* font-medium */
  color: #262626;     /* text-neutral-800 */
  letter-spacing: -0.015em;
  margin-bottom: 24px;
  text-align: center;
}

/* Centered Chat Input Card: w-full max-w-3xl, softer border-neutral-200/80, bg-gradient-to-b from-white via-white to-orange-50/60 */
.prompt-card {
  width: 100%;
  max-width: 48rem; /* max-w-3xl = 768px */
  background: linear-gradient(180deg, #ffffff 0%, #ffffff 50%, rgba(255, 247, 237, 0.6) 100%);
  border: 1px solid rgba(229, 229, 229, 0.8); /* border border-neutral-200/80 */
  border-radius: 16px;       /* rounded-2xl */
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05); /* shadow-sm */
  padding: 18px 20px 14px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  box-sizing: border-box;
}

.prompt-card:focus-within {
  border-color: #ff9933;
  box-shadow: 0 4px 16px rgba(255, 153, 51, 0.14), 0 1px 3px 0 rgba(0, 0, 0, 0.05);
}

.prompt-textarea {
  width: 100%;
  min-height: 44px;
  max-height: 140px;
  resize: none;
  background: transparent;
  border: none;
  outline: none;
  font-size: 15px;
  font-family: var(--font-family-sans, 'Lexend', sans-serif);
  color: #171717;
  line-height: 1.5;
  scrollbar-width: thin;
}

.prompt-textarea::placeholder {
  color: #737373;
  font-weight: 400;
}

/* ── Attachment chip ── */
.prompt-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #ffffff;
  border: 1px solid #fed7aa;
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 12px;
  color: #334155;
  width: fit-content;
}

.prompt-chip__icon { color: #ff7a00; }
.prompt-chip__name { font-weight: 600; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.prompt-chip__size { color: #94a3b8; font-size: 11px; }

.prompt-chip__remove {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 11px;
  padding: 0 2px;
}
.prompt-chip__remove:hover { color: #c0392b; }

/* ── Bottom controls row ── */
.prompt-bottom-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
}

.prompt-pills-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Solid orange pill button "Log" */
.pill-log {
  background: #ff7a00;
  color: #ffffff;
  border-radius: 9999px;
  padding: 4.5px 16px;
  font-size: 12px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  user-select: none;
}

/* Outlined pill dropdown "Project v" on the left */
.pill-dropdown-wrap {
  position: relative;
}

.pill-project {
  background: #ffffff;
  border: 1px solid #e5e5e5;
  color: #525252;
  border-radius: 9999px;
  padding: 4px 14px;
  font-size: 12px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  max-width: 240px;
}

.pill-project:hover,
.pill-project--selected {
  background: #fafafa;
  border-color: #d4d4d4;
  color: #171717;
}

.pill-project span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Dropdown list */
.project-dropdown {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  background: #ffffff;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  padding: 6px;
  min-width: 200px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  z-index: 50;
  max-height: 220px;
  overflow-y: auto;
  scrollbar-width: thin;
}

.project-dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 13px;
  color: #334155;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s ease;
}

.project-dropdown-item:hover {
  background: #fff7eb;
  color: #ff7a00;
}

.project-dropdown-item--active {
  background: #fff7eb;
  color: #ff7a00;
  font-weight: 600;
}

.project-dropdown-divider {
  height: 1px;
  background: #f1f5f9;
  height: 1px;
  background: #f1f5f9;
  margin: 4px 0;
}

/* Right side actions */
.prompt-actions-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.prompt-btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #27272a;
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease;
}

.prompt-btn-icon:hover {
  color: #ff7a00;
  background: rgba(255, 122, 0, 0.08);
}

.prompt-btn-send {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #27272a;
  cursor: pointer;
  transition: color 0.15s ease, transform 0.15s ease;
}

.prompt-btn-send--active {
  color: #ff7a00;
}

.prompt-btn-send--loading {
  cursor: wait;
}

.prompt-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 122, 0, 0.25);
  border-top-color: #ff7a00;
  border-radius: 50%;
  animation: promptSpin 0.6s linear infinite;
  display: inline-block;
}

@keyframes promptSpin {
  to { transform: rotate(360deg); }
}

.prompt-icon-btn--close {
  color: #64748b;
}

.prompt-icon-btn--close:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.prompt-btn-send:hover:not(:disabled) {
  color: #ea580c;
  transform: translateX(1px);
}

.prompt-btn-send:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* ── Mobile responsiveness ── */
@media (max-width: 680px) {
  .prompt-heading { font-size: 21px; margin-bottom: 20px; }
  .prompt-card { padding: 16px 16px 12px; }
  .nb-prompt-header { padding: 16px 20px 0 20px; }
  .prompt-bottom-row { flex-wrap: wrap; gap: 10px; }
}
</style>
