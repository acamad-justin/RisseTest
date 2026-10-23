<script setup>
/**
 * CreateProjectModal.vue — modal form for creating a new Project.
 */
import { ref } from 'vue'
import { X } from '@lucide/vue'

const emit = defineEmits(['create', 'close'])

const name        = ref('')
const description = ref('')
const nameError   = ref('')

function submit() {
  nameError.value = ''
  if (!name.value.trim()) {
    nameError.value = 'Project name is required.'
    return
  }
  emit('create', { title: name.value.trim(), description: description.value.trim() })
  name.value        = ''
  description.value = ''
}

function close() {
  name.value        = ''
  description.value = ''
  nameError.value   = ''
  emit('close')
}
</script>

<template>
  <Transition name="overlay">
    <div class="modal-overlay" role="dialog" aria-modal="true" aria-label="New Project" @click.self="close">
      <div class="modal">
        <div class="modal__head">
          <h2 class="modal__title">New Project</h2>
          <button class="modal__close" type="button" aria-label="Close" @click="close">
            <X :size="15" aria-hidden="true" />
          </button>
        </div>

        <form class="modal__form" @submit.prevent="submit">
          <div class="modal__field">
            <label class="modal__label" for="proj-name">Project name <span class="modal__required">*</span></label>
            <input
              id="proj-name"
              v-model="name"
              class="modal__input"
              :class="{ 'modal__input--error': nameError }"
              type="text"
              placeholder="e.g. Sumobot v2"
              autofocus
              @input="nameError = ''"
            />
            <p v-if="nameError" class="modal__error">{{ nameError }}</p>
          </div>

          <div class="modal__field">
            <label class="modal__label" for="proj-desc">Description <span class="modal__optional">(optional)</span></label>
            <textarea
              id="proj-desc"
              v-model="description"
              class="modal__input modal__textarea"
              placeholder="What is this project about?"
              rows="3"
            />
          </div>

          <div class="modal__actions">
            <button class="modal__cancel" type="button" @click="close">Cancel</button>
            <button class="modal__submit" type="submit">Create Project</button>
          </div>
        </form>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* ── Overlay ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  background: rgba(0, 0, 0, 0.30);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── Panel ── */
.modal {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  width: min(420px, calc(100vw - 32px));
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.14);
}

.modal__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.modal__title {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a2e;
}

.modal__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: #f0f0f8;
  color: #666;
  cursor: pointer;
  transition: background 150ms ease;
}
.modal__close:hover { background: #e4e4f0; }

/* ── Form ── */
.modal__form { display: flex; flex-direction: column; gap: 14px; }

.modal__field { display: flex; flex-direction: column; gap: 5px; }

.modal__label {
  font-size: 11.5px;
  font-weight: 600;
  color: #3a3a5a;
}

.modal__required { color: var(--risse-orange); }
.modal__optional { color: #aaa; font-weight: 400; }

.modal__input {
  font-size: 13px;
  color: #1a1a2e;
  background: #f8f8fc;
  border: 1.5px solid #e0e0ee;
  border-radius: 8px;
  padding: 9px 12px;
  outline: none;
  transition: border-color 150ms ease;
  resize: vertical;
}
.modal__input:focus         { border-color: var(--risse-orange); }
.modal__input--error        { border-color: #e74c3c; }

.modal__textarea { min-height: 72px; }

.modal__error {
  font-size: 11px;
  color: #e74c3c;
}

/* ── Actions ── */
.modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 4px;
}

.modal__cancel {
  font-size: 13px;
  font-weight: 500;
  color: #666;
  background: transparent;
  border: 1.5px solid #ddd;
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background 150ms ease;
}
.modal__cancel:hover { background: #f4f4f8; }

.modal__submit {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  background: var(--risse-orange);
  border: none;
  border-radius: 8px;
  padding: 8px 18px;
  cursor: pointer;
  transition: background 150ms ease;
}
.modal__submit:hover { background: var(--risse-orange-active); }

/* Transition */
.overlay-enter-active, .overlay-leave-active { transition: opacity 180ms ease; }
.overlay-enter-from,   .overlay-leave-to     { opacity: 0; }
</style>
