<script setup>
/**
 * RecallProgress.vue
 *
 * Lower strip: progress label on the left, Next/Done button on the right.
 * Sits outside the white card, directly inside the rsv__body.
 *
 * Props:
 *   current     number  — 1-based current question number
 *   total       number  — total questions in session
 *   isLast      boolean — true when on the final question
 *   canAdvance  boolean — true when current answer is complete
 *
 * Emits:
 *   next — user clicked Next or Done
 */
defineProps({
  current:    { type: Number,  required: true },
  total:      { type: Number,  required: true },
  isLast:     { type: Boolean, default: false },
  canAdvance: { type: Boolean, default: false },
})

defineEmits(['next'])
</script>

<template>
  <div class="rp">
    <!-- Progress label -->
    <p class="rp__label" aria-live="polite">
      {{ current }} of {{ total }} Cards
    </p>

    <!-- Next / Done -->
    <button
      class="rp__btn"
      :class="{ 'rp__btn--disabled': !canAdvance }"
      type="button"
      :disabled="!canAdvance"
      :aria-label="isLast ? 'Done — complete this recall session' : 'Next question'"
      @click="$emit('next')"
    >
      {{ isLast ? 'Done' : 'Next' }}
    </button>
  </div>
</template>

<style scoped>
/* ── Row ──────────────────────────────────────────────────────────────── */
.rp {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  /* Matches the card's max-width so the progress row is always aligned with it */
  max-width: min(860px, 100%);
  margin-top: 20px;
  flex-shrink: 0;
}

/* ── Progress label ───────────────────────────────────────────────────── */
.rp__label {
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.55);
  margin: 0;
}

/* ── Next / Done button ───────────────────────────────────────────────── */
.rp__btn {
  padding: 12px 36px;
  border-radius: 999px;
  background: var(--risse-orange, #FF9000);
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.02em;
  border: none;
  cursor: pointer;
  transition: background 150ms ease, transform 120ms ease, opacity 150ms ease;
}

.rp__btn:hover:not(:disabled) {
  background: var(--risse-orange-active, #F36F00);
}

.rp__btn:active:not(:disabled) {
  transform: scale(0.97);
}

.rp__btn:focus-visible {
  outline: 3px solid rgba(255, 144, 0, 0.45);
  outline-offset: 2px;
}

.rp__btn--disabled,
.rp__btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* ── Responsive ───────────────────────────────────────────────────────── */
@media (max-width: 1024px) {
  .rp { max-width: min(720px, 100%); }
}

@media (max-width: 680px) {
  .rp { max-width: 100%; margin-top: 14px; }
  .rp__btn { padding: 11px 28px; font-size: 13.5px; }
}
</style>
