<script setup>
/**
 * RecallMultipleChoice.vue
 *
 * Four selectable answer rows matching RECALL_3 / RECALL_3B.
 *
 * Default state  — white background, neutral gray border and text.
 * Selected state — white background, orange border, orange text.
 *
 * Props:
 *   options        Array<{ id, label, text }> — answer options
 *   selectedOption string|null                — currently selected option id
 *
 * Emits:
 *   update:selectedOption  string — user clicked a different option
 */
defineProps({
  options:        { type: Array,  required: true },
  selectedOption: { type: String, default: null  },
})

defineEmits(['update:selectedOption'])
</script>

<template>
  <div class="rmc" role="radiogroup" aria-label="Answer options">
    <button
      v-for="opt in options"
      :key="opt.id"
      type="button"
      class="rmc__option"
      :class="{ 'rmc__option--selected': selectedOption === opt.id }"
      :aria-pressed="selectedOption === opt.id"
      :aria-label="`Option ${opt.label}: ${opt.text}`"
      @click="$emit('update:selectedOption', opt.id)"
    >
      <span class="rmc__label">{{ opt.label }}</span>
      <span class="rmc__text">{{ opt.text }}</span>
    </button>
  </div>
</template>

<style scoped>
/* ── List ─────────────────────────────────────────────────────────────── */
.rmc {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
  /* Grow to consume remaining card space so options are well-spaced */
  flex: 1;
  min-height: 0;
  justify-content: center;
}

/* ── Individual row ───────────────────────────────────────────────────── */
.rmc__option {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 16px 20px;
  box-sizing: border-box;

  background: #ffffff;
  border: 1.5px solid #dddae8;
  border-radius: 12px;

  text-align: left;
  cursor: pointer;
  transition: border-color 150ms ease, color 150ms ease;
}

.rmc__option:hover:not(.rmc__option--selected) {
  border-color: #b0aac8;
}

.rmc__option:focus-visible {
  outline: 2px solid var(--risse-orange, #FF9000);
  outline-offset: 2px;
}

/* ── Option label (A / B / C / D) ────────────────────────────────────── */
.rmc__label {
  font-size: 14px;
  font-weight: 600;
  color: #b0aac0;
  flex-shrink: 0;
  width: 20px;
  transition: color 150ms ease;
}

/* ── Option text ──────────────────────────────────────────────────────── */
.rmc__text {
  font-size: 15px;
  font-weight: 400;
  color: #8a85a0;
  line-height: 1.45;
  transition: color 150ms ease;
}

/* ── Selected state — orange border + orange text ─────────────────────── */
.rmc__option--selected {
  border-color: var(--risse-orange, #FF9000);
}

.rmc__option--selected .rmc__label,
.rmc__option--selected .rmc__text {
  color: var(--risse-orange, #FF9000);
}

/* ── Responsive ───────────────────────────────────────────────────────── */
@media (max-width: 680px) {
  .rmc { gap: 10px; margin-top: 18px; }
  .rmc__option { padding: 13px 16px; gap: 12px; }
  .rmc__label { font-size: 13px; }
  .rmc__text { font-size: 13.5px; }
}
</style>
