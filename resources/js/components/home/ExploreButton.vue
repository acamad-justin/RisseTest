<script setup>
/**
 * ExploreButton.vue
 * White circular FAB with orange + icon — matches reference screenshot.
 * Opens a local demo modal for exploring topics.
 */
import { ref } from 'vue'
import { Plus, X, Sparkles } from '@lucide/vue'

const props = defineProps({
  concepts: { type: Array, required: true },
})

const emit = defineEmits(['explore'])

const isOpen     = ref(false)
const query      = ref('')
const submitted  = ref(false)
const matchCount = ref(0)

function open()  { isOpen.value = true; submitted.value = false; query.value = '' }
function close() { isOpen.value = false; emit('explore', []) }

function onSubmit() {
  const q = query.value.trim()
  if (!q) return
  const matches = props.concepts.filter(c =>
    c.label.toLowerCase().includes(q.toLowerCase()) ||
    c.description.toLowerCase().includes(q.toLowerCase())
  )
  matchCount.value = matches.length
  submitted.value  = true
  emit('explore', matches.map(c => c.id))
}

function reset() {
  query.value     = ''
  submitted.value = false
  emit('explore', [])
}
</script>

<template>
  <!-- FAB — white circle, orange plus -->
  <button
    class="fab"
    type="button"
    aria-label="Start exploration"
    aria-haspopup="dialog"
    @click="open"
  >
    <Plus :size="20" aria-hidden="true" />
  </button>

  <!-- Exploration modal -->
  <Transition name="overlay-fade">
    <div
      v-if="isOpen"
      class="overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Start an exploration"
      @click.self="close"
    >
      <div class="modal">
        <div class="modal__head">
          <Sparkles :size="15" class="modal__spark" aria-hidden="true" />
          <h2 class="modal__title">What are you curious about?</h2>
          <button class="modal__close" type="button" aria-label="Close" @click="close">
            <X :size="14" aria-hidden="true" />
          </button>
        </div>

        <p class="modal__notice">
          Demo only — matched locally against mock concept data.
        </p>

        <form class="modal__form" @submit.prevent="onSubmit">
          <input
            v-model="query"
            class="modal__input"
            type="text"
            placeholder="e.g. PID tuning, microcontrollers…"
            aria-label="Exploration topic"
            autofocus
            :disabled="submitted"
          />
          <button
            v-if="!submitted"
            class="modal__submit"
            type="submit"
            :disabled="!query.trim()"
          >
            Explore
          </button>
        </form>

        <Transition name="result-fade">
          <div v-if="submitted" class="modal__result">
            <p v-if="matchCount > 0" class="modal__result--match">
              ✦ {{ matchCount }} concept{{ matchCount === 1 ? '' : 's' }} highlighted on the map.
            </p>
            <p v-else class="modal__result--none">
              No concepts matched "{{ query }}".
            </p>
            <button class="modal__retry" type="button" @click="reset">
              Try another topic
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* ── FAB — white circle, orange icon ── */
.fab {
  position: fixed;
  bottom: 28px;
  right: 32px;
  z-index: var(--z-overlay);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #ffffff;
  color: var(--risse-orange);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.25);
  transition: transform 150ms ease, box-shadow 150ms ease, background 150ms ease;
}

.fab:hover,
.fab:focus-visible {
  transform: scale(1.10);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
  outline: 2px solid rgba(255, 255, 255, 0.50);
  outline-offset: 2px;
}

/* ── Overlay ── */
.overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  background: rgba(0, 0, 0, 0.50);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── Modal panel ── */
.modal {
  background: rgba(10, 6, 28, 0.94);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 20px;
  padding: 22px 24px;
  width: min(420px, calc(100vw - 32px));
  color: #fff;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.65);
}

.modal__head {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 10px;
}

.modal__spark { color: var(--risse-orange); flex-shrink: 0; }

.modal__title {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
}

.modal__close {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(255,255,255,0.07);
  border: none;
  color: rgba(255,255,255,0.55);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 150ms ease, color 150ms ease;
}
.modal__close:hover,
.modal__close:focus-visible {
  background: rgba(255,255,255,0.16);
  color: #fff;
}

.modal__notice {
  font-size: 10.5px;
  color: rgba(255,255,255,0.32);
  background: rgba(255,255,255,0.04);
  border-radius: 6px;
  padding: 5px 10px;
  margin-bottom: 16px;
  line-height: 1.5;
}

.modal__form {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.modal__input {
  flex: 1;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.13);
  border-radius: 10px;
  padding: 9px 13px;
  color: #fff;
  font-size: 13.5px;
  outline: none;
  transition: border-color 150ms ease;
}
.modal__input::placeholder { color: rgba(255,255,255,0.32); }
.modal__input:focus         { border-color: var(--risse-orange); }
.modal__input:disabled      { opacity: 0.45; cursor: not-allowed; }

.modal__submit {
  background: var(--risse-orange);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 9px 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 150ms ease, opacity 150ms ease;
}
.modal__submit:hover:not(:disabled) { background: var(--risse-orange-active); }
.modal__submit:disabled             { opacity: 0.38; cursor: not-allowed; }

.modal__result {
  padding-top: 10px;
  border-top: 1px solid rgba(255,255,255,0.07);
}
.modal__result--match { font-size: 12.5px; color: #4ade80; margin-bottom: 10px; }
.modal__result--none  { font-size: 12.5px; color: rgba(255,255,255,0.45); margin-bottom: 10px; }

.modal__retry {
  font-size: 11.5px;
  color: rgba(255,255,255,0.45);
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 6px;
  padding: 5px 12px;
  cursor: pointer;
  transition: background 150ms ease, color 150ms ease;
}
.modal__retry:hover { background: rgba(255,255,255,0.11); color: #fff; }

/* Transitions */
.overlay-fade-enter-active, .overlay-fade-leave-active { transition: opacity 200ms ease; }
.overlay-fade-enter-from,   .overlay-fade-leave-to     { opacity: 0; }

.result-fade-enter-active, .result-fade-leave-active { transition: opacity 180ms ease; }
.result-fade-enter-from,   .result-fade-leave-to     { opacity: 0; }
</style>
