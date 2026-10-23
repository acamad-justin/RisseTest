<script setup>
/**
 * RecallShortAnswer.vue
 *
 * Multiline textarea for short-answer recall questions.
 * Matches the bordered textarea shown in RECALL_2 / RECALL_2B.
 *
 * Props:
 *   modelValue  string — current answer text
 *
 * Emits:
 *   update:modelValue — text changed
 */
defineProps({
  modelValue: { type: String, default: '' },
})

defineEmits(['update:modelValue'])
</script>

<template>
  <div class="rsa">
    <textarea
      class="rsa__field"
      :value="modelValue"
      placeholder="Explain in your own words..."
      aria-label="Your answer"
      @input="$emit('update:modelValue', $event.target.value)"
    ></textarea>
  </div>
</template>

<style scoped>
/* ── Wrapper ──────────────────────────────────────────────────────────── */
.rsa {
  width: 100%;
  margin-top: 24px;
  /* Grow to consume remaining card space so the textarea has room */
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* ── Textarea ─────────────────────────────────────────────────────────── */
.rsa__field {
  width: 100%;
  /* Fills available vertical space in the flex wrapper */
  flex: 1;
  min-height: 160px;
  /* No hard max-height — the card controls overflow */
  resize: none;
  padding: 16px 18px;
  box-sizing: border-box;

  border: 1.5px solid #d4d0e0;
  border-radius: 12px;
  background: #ffffff;

  font-family: var(--font-family-sans, system-ui, sans-serif);
  font-size: 15px;
  font-weight: 400;
  line-height: 1.6;
  color: #1a1630;

  outline: none;
  transition: border-color 150ms ease;

  /* Internal scroll only as fallback — the flex parent handles height */
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.15) transparent;
}

.rsa__field::placeholder {
  color: #b0aac0;
  font-weight: 400;
}

.rsa__field:focus {
  border-color: #9d8fd4;
}

.rsa__field:focus-visible {
  outline: none;
  border-color: var(--risse-orange, #FF9000);
}

@media (max-width: 680px) {
  .rsa { margin-top: 18px; }
  .rsa__field { min-height: 130px; font-size: 14px; }
}
</style>
