<script setup>
/**
 * BaseButton — reusable button component.
 *
 * Props:
 *   variant  — 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
 *   size     — 'sm' | 'md' | 'lg'
 *   disabled — boolean
 *   loading  — boolean (shows spinner, disables interaction)
 *   type     — native button type attribute
 */

import { computed } from 'vue'
import { Loader2 } from '@lucide/vue'

const props = defineProps({
  variant:  { type: String, default: 'primary' },
  size:     { type: String, default: 'md' },
  disabled: { type: Boolean, default: false },
  loading:  { type: Boolean, default: false },
  type:     { type: String, default: 'button' },
})

const isDisabled = computed(() => props.disabled || props.loading)
</script>

<template>
  <button
    :type="type"
    :disabled="isDisabled"
    :class="['btn', `btn--${variant}`, `btn--${size}`, { 'btn--loading': loading }]"
    :aria-busy="loading"
    :aria-disabled="isDisabled"
  >
    <Loader2 v-if="loading" class="btn__spinner" :size="16" aria-hidden="true" />
    <slot />
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-md);
  transition:
    background-color var(--transition-fast),
    border-color var(--transition-fast),
    color var(--transition-fast),
    box-shadow var(--transition-fast),
    opacity var(--transition-fast);
  cursor: pointer;
  white-space: nowrap;
  border: 1.5px solid transparent;
}

.btn:disabled,
.btn--loading {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

/* --- Sizes --- */
.btn--sm  { padding: var(--space-1-5) var(--space-3); font-size: var(--font-size-sm); }
.btn--md  { padding: var(--space-2) var(--space-4);   font-size: var(--font-size-base); }
.btn--lg  { padding: var(--space-3) var(--space-6);   font-size: var(--font-size-lg); }

/* --- Variants --- */
.btn--primary {
  background-color: var(--color-primary-600);
  color: var(--color-text-inverse);
  border-color: var(--color-primary-600);
}
.btn--primary:hover:not(:disabled) {
  background-color: var(--color-primary-700);
  border-color: var(--color-primary-700);
}

.btn--secondary {
  background-color: var(--color-secondary-100);
  color: var(--color-secondary-700);
  border-color: var(--color-secondary-200);
}
.btn--secondary:hover:not(:disabled) {
  background-color: var(--color-secondary-200);
}

.btn--outline {
  background-color: transparent;
  color: var(--color-primary-600);
  border-color: var(--color-primary-600);
}
.btn--outline:hover:not(:disabled) {
  background-color: var(--color-primary-50);
}

.btn--ghost {
  background-color: transparent;
  color: var(--color-text-secondary);
}
.btn--ghost:hover:not(:disabled) {
  background-color: var(--color-secondary-100);
  color: var(--color-text-primary);
}

.btn--danger {
  background-color: var(--color-danger-500);
  color: var(--color-text-inverse);
  border-color: var(--color-danger-500);
}
.btn--danger:hover:not(:disabled) {
  background-color: var(--color-danger-700);
  border-color: var(--color-danger-700);
}

/* Spinner animation */
.btn__spinner {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
</style>
