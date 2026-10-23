<script setup>
/**
 * RecallHeader.vue
 *
 * Top strip of the Recall Practice experience.
 *
 * Left  — "Recall" bold white heading, concept name in orange below it.
 * Right — × close button (white, near the edge).
 *
 * Props:
 *   conceptName  string  — e.g. "Microcontrollers"
 *   phase        string  — 'questions' | 'summary'
 *
 * Emits:
 *   close — user clicked × or pressed Escape
 */
defineProps({
  conceptName: { type: String, required: true },
  phase:       { type: String, default: 'questions' },
})

defineEmits(['close'])
</script>

<template>
  <header class="rh">
    <!-- Left: heading block -->
    <div class="rh__left">
      <h1 class="rh__title">{{ phase === 'summary' ? 'Recall Session' : 'Recall' }}</h1>
      <p class="rh__concept">{{ conceptName }}</p>
    </div>

    <!-- Right: close button -->
    <button
      class="rh__close"
      type="button"
      aria-label="Exit recall session"
      @click="$emit('close')"
    >
      ×
    </button>
  </header>
</template>

<style scoped>
/* ── Shell ────────────────────────────────────────────────────────────── */
.rh {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 32px 36px 0 40px;
  flex-shrink: 0;
}

/* ── Left block ───────────────────────────────────────────────────────── */
.rh__title {
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.025em;
  line-height: 1.1;
  margin: 0;
}

.rh__concept {
  font-size: 13px;
  font-weight: 500;
  color: var(--risse-orange, #FF9000);
  margin: 4px 0 0;
  line-height: 1;
}

/* ── Close button ─────────────────────────────────────────────────────── */
.rh__close {
  font-size: 26px;
  line-height: 1;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.80);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0 4px;
  margin-top: 2px;
  transition: color 150ms ease;
  flex-shrink: 0;
}

.rh__close:hover {
  color: #ffffff;
}

.rh__close:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.5);
  outline-offset: 3px;
  border-radius: 4px;
}

/* ── Responsive ───────────────────────────────────────────────────────── */
@media (max-width: 680px) {
  .rh {
    padding: 20px 20px 0 20px;
  }

  .rh__title { font-size: 22px; }
}
</style>
