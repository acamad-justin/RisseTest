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
import { Send, Paperclip, ChevronDown, Check, Binoculars } from 'lucide-vue-next'

const props = defineProps({
  userName: { type: String, default: 'Adriel' },
  projects: { type: Array, default: () => [] },
})

const emit = defineEmits(['submit', 'back', 'open-search'])

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
  const text = query.value.trim()
  if (!text && !attachedFile.value) return

  emit('submit', {
    text,
    attachment: attachedFile.value,
    projectId: selectedProjectId.value,
  })

  query.value = ''
  attachedFile.value = null
}

function selectProject(projId) {
  selectedProjectId.value = projId
  projectMenuOpen.value = false
}

// Close project menu on outside click
function onDocClick() {
  projectMenuOpen.value = false
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  nextTick(() => {
    textareaEl.value?.focus()
  })
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
})
</script>

<template>
  <div class="nb-prompt-root">
    <!-- ── Top bar: soundwave on left, search on right ── -->
    <header class="nb-prompt-header">
      <div class="prompt-soundwave" title="Voice / Audio assistant indicator" aria-label="Audio mode">
        <span class="sound-bar sound-bar--1"></span>
        <span class="sound-bar sound-bar--2"></span>
        <span class="sound-bar sound-bar--3"></span>
      </div>

      <div class="prompt-header-actions">
        <button
          type="button"
          class="prompt-icon-btn"
          title="Search concepts and logs"
          aria-label="Search"
          @click="$emit('open-search')"
        >
          <Binoculars :size="18" aria-hidden="true" />
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
              :class="{ 'prompt-btn-send--active': query.trim() || attachedFile }"
              :disabled="!query.trim() && !attachedFile"
              title="Send to Risse AI"
              aria-label="Send query"
              @click="onSubmit"
            >
              <Send :size="16" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </main>
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
  background: #ffffff;
  border-radius: var(--radius-card, 18px);
  border: 1px solid var(--border-card, #eef1f4);
  box-shadow: var(--shadow-subtle);
  overflow: hidden;
  box-sizing: border-box;
}

/* ── Top bar ── */
.nb-prompt-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 32px 0 32px;
  flex-shrink: 0;
}

/* ıll Soundwave indicator matching screenshot */
.prompt-soundwave {
  display: inline-flex;
  align-items: flex-end;
  gap: 3px;
  height: 20px;
  padding: 4px;
  cursor: default;
  user-select: none;
}

.sound-bar {
  width: 3.5px;
  background: #1e1e2f;
  border-radius: 999px;
  transition: height 0.2s ease;
}

.sound-bar--1 { height: 10px; }
.sound-bar--2 { height: 16px; }
.sound-bar--3 { height: 8px; }

.prompt-soundwave:hover .sound-bar--1 { height: 15px; }
.prompt-soundwave:hover .sound-bar--2 { height: 11px; }
.prompt-soundwave:hover .sound-bar--3 { height: 18px; }

.prompt-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: transparent;
  border: none;
  color: #1e1e2f;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
}

.prompt-icon-btn:hover {
  background: #f4f4fa;
  transform: scale(1.05);
}

/* ── Centered Main Area ── */
.nb-prompt-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  margin-top: -30px; /* Optical center balance */
}

.prompt-heading {
  font-size: 26px;
  font-weight: 600;
  color: #1a1a2e;
  letter-spacing: -0.015em;
  margin-bottom: 28px;
  text-align: center;
}

/* ── Glowing Warm Card matching screenshot ── */
.prompt-card {
  width: 100%;
  max-width: 730px;
  background: linear-gradient(180deg, #ffffff 40%, #fff7eb 100%);
  border: 1.5px solid #fed7aa;
  border-radius: 26px;
  box-shadow: 0 4px 22px rgba(254, 215, 170, 0.32), 0 1px 3px rgba(0, 0, 0, 0.03);
  padding: 20px 24px 14px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

.prompt-card:focus-within {
  border-color: #ff9933;
  box-shadow: 0 6px 28px rgba(255, 153, 51, 0.38), 0 2px 5px rgba(0, 0, 0, 0.05);
}

.prompt-textarea {
  width: 100%;
  min-height: 42px;
  max-height: 140px;
  resize: none;
  background: transparent;
  border: none;
  outline: none;
  font-size: 15px;
  font-family: inherit;
  color: #1a1a2e;
  line-height: 1.5;
  scrollbar-width: thin;
}

.prompt-textarea::placeholder {
  color: #71717a;
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

/* Solid orange Log pill */
.pill-log {
  background: #ff7a00;
  color: #ffffff;
  border-radius: 999px;
  padding: 4px 16px;
  font-size: 12px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  user-select: none;
}

/* Outlined orange Project dropdown pill */
.pill-dropdown-wrap {
  position: relative;
}

.pill-project {
  background: transparent;
  border: 1.2px solid #ff7a00;
  color: #ff7a00;
  border-radius: 999px;
  padding: 3.5px 14px;
  font-size: 12px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  max-width: 240px;
}

.pill-project:hover,
.pill-project--selected {
  background: rgba(255, 122, 0, 0.08);
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
  border: 1px solid #fed7aa;
  border-radius: 14px;
  padding: 6px;
  min-width: 200px;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.12);
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
  padding: 7px 12px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #1e1e2f;
  font-size: 12.5px;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;
}

.project-dropdown-item:hover {
  background: #fff6eb;
  color: #ff7a00;
}

.project-dropdown-item--active {
  color: #ff7a00;
  font-weight: 600;
}

.project-dropdown-divider {
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
