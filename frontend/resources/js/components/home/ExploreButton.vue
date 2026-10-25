<script setup>
/**
 * ExploreButton.vue
 * White circular FAB with orange + icon — matches reference screenshot.
 * Opens a local demo modal for exploring topics.
 */
import { ref } from 'vue'
import { X, Sparkles } from '@lucide/vue'

const props = defineProps({
  concepts: { type: Array, required: true },
  isChatOpen: { type: Boolean, default: false },
})

const emit = defineEmits(['click-mascot'])

function onClick() {
  emit('click-mascot')
}
</script>

<template>
  <!-- FAB — RisseCharacter mascot without background -->
  <button
    class="fab"
    :class="{ 'fab--hidden': isChatOpen }"
    type="button"
    aria-label="Ask Risse"
    title="Ask Risse"
    @click="onClick"
    id="btn-explore-character"
  >
    <img 
      :src="'/images/characters/risse-character.webp'" 
      alt="Ask Risse" 
      class="fab__character"
    />
  </button>
</template>

<style scoped>
/* ── FAB — transparent mascot button ── */
.fab {
  position: fixed;
  bottom: 28px;
  right: 32px;
  z-index: var(--z-overlay);
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: opacity 0.4s ease 0.15s, transform 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.15s;
  transform-origin: center center;
}

.fab:hover,
.fab:focus-visible {
  transform: scale(1.15) translateY(-4px);
  outline: none;
}

.fab.fab--hidden {
  opacity: 0;
  transform: scale(0.8) !important;
  pointer-events: none;
  transition: opacity 0.4s ease 0s, transform 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0s;
}

.fab__character {
  width: 58px;
  height: 58px;
  object-fit: contain;
  filter: drop-shadow(0 4px 14px rgba(0, 0, 0, 0.35));
  transition: filter 200ms ease;
}

.fab:hover .fab__character {
  filter: drop-shadow(0 8px 20px rgba(255, 107, 0, 0.45));
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
