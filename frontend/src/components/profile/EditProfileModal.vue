<script setup>
/**
 * EditProfileModal.vue
 * Form for editing student name, school, and grade locally.
 */
import { ref, watch } from 'vue'
import { X } from '@lucide/vue'

const props = defineProps({
  student: { type: Object, required: true },
})

const emit = defineEmits(['save', 'close'])

// Local copy — don't mutate the prop directly
const form = ref({ ...props.student })
watch(() => props.student, s => { form.value = { ...s } }, { deep: true })

function save() {
  if (!form.value.name.trim()) return
  emit('save', { ...form.value })
}
</script>

<template>
  <Teleport to="body">
    <Transition name="overlay-fade">
      <div
        class="ep-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Edit Profile"
        @click.self="$emit('close')"
      >
        <div class="ep-modal">
          <div class="ep-modal__head">
            <h2 class="ep-modal__title">Edit Profile</h2>
            <button
              class="ep-modal__close"
              type="button"
              aria-label="Close"
              @click="$emit('close')"
            >
              <X :size="14" aria-hidden="true" />
            </button>
          </div>

          <form class="ep-modal__form" @submit.prevent="save">
            <div class="ep-modal__field">
              <label class="ep-modal__label" for="ep-name">Full Name</label>
              <input
                id="ep-name"
                v-model="form.name"
                class="ep-modal__input"
                type="text"
                placeholder="Your full name"
                required
                autofocus
              />
            </div>

            <div class="ep-modal__field">
              <label class="ep-modal__label" for="ep-school">School</label>
              <input
                id="ep-school"
                v-model="form.school"
                class="ep-modal__input"
                type="text"
                placeholder="School name"
              />
            </div>

            <div class="ep-modal__field">
              <label class="ep-modal__label" for="ep-grade">Grade / Year</label>
              <input
                id="ep-grade"
                v-model="form.grade"
                class="ep-modal__input"
                type="text"
                placeholder="e.g. Grade 10"
              />
            </div>

            <div class="ep-modal__actions">
              <button class="ep-modal__cancel" type="button" @click="$emit('close')">Cancel</button>
              <button class="ep-modal__save" type="submit">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.ep-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  background: rgba(0,0,0,0.28);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.ep-modal {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  width: min(400px, calc(100vw - 32px));
  box-shadow: 0 8px 32px rgba(0,0,0,0.13);
}

.ep-modal__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.ep-modal__title {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a2e;
}

.ep-modal__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 27px;
  height: 27px;
  border-radius: 50%;
  border: none;
  background: #f0f0f8;
  color: #666;
  cursor: pointer;
  transition: background 150ms ease;
}
.ep-modal__close:hover { background: #e4e4f0; }

.ep-modal__form { display: flex; flex-direction: column; gap: 14px; }

.ep-modal__field { display: flex; flex-direction: column; gap: 5px; }

.ep-modal__label {
  font-size: 11.5px;
  font-weight: 600;
  color: #3a3a5a;
}

.ep-modal__input {
  font-size: 13px;
  color: #1a1a2e;
  background: #f8f8fc;
  border: 1.5px solid #e0e0ee;
  border-radius: 8px;
  padding: 9px 12px;
  outline: none;
  transition: border-color 150ms ease;
}
.ep-modal__input:focus { border-color: var(--risse-orange); }

.ep-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 4px;
}

.ep-modal__cancel {
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
.ep-modal__cancel:hover { background: #f4f4f8; }

.ep-modal__save {
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
.ep-modal__save:hover { background: var(--risse-orange-active); }

.overlay-fade-enter-active, .overlay-fade-leave-active { transition: opacity 180ms ease; }
.overlay-fade-enter-from,   .overlay-fade-leave-to     { opacity: 0; }
</style>
