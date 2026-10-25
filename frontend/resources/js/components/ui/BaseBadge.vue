<script setup>
/**
 * BaseBadge — small status/label chip.
 */
defineProps({
  variant: { type: String, default: 'default' }, // 'default' | 'primary' | 'success' | 'warning' | 'danger'
  size:    { type: String, default: 'md' },        // 'sm' | 'md'
})
</script>

<template>
  <span :class="['badge', `badge--${variant}`, `badge--${size}`]">
    <slot />
  </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-full);
}

.badge--sm { padding: var(--space-0-5) var(--space-2);   font-size: var(--font-size-xs); }
.badge--md { padding: var(--space-1)   var(--space-2-5); font-size: var(--font-size-sm); }

.badge--default {
  background-color: var(--color-secondary-100);
  color: var(--color-secondary-700);
}
.badge--primary {
  background-color: var(--color-primary-100);
  color: var(--color-primary-700);
}
.badge--success {
  background-color: var(--color-success-50);
  color: var(--color-success-700);
}
.badge--warning {
  background-color: var(--color-warning-50);
  color: var(--color-warning-700);
}
.badge--danger {
  background-color: var(--color-danger-50);
  color: var(--color-danger-700);
}
</style>
