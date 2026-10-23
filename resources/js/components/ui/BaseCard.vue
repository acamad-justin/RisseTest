<script setup>
/**
 * BaseCard — container card with optional header/footer slots.
 */
defineProps({
  padding: { type: String, default: 'md' }, // 'sm' | 'md' | 'lg' | 'none'
  shadow:  { type: String, default: 'base' }, // 'sm' | 'base' | 'md' | 'lg' | 'none'
})
</script>

<template>
  <div :class="['card', `card--padding-${padding}`, `card--shadow-${shadow}`]">
    <div v-if="$slots.header" class="card__header">
      <slot name="header" />
    </div>

    <div class="card__body">
      <slot />
    </div>

    <div v-if="$slots.footer" class="card__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped>
.card {
  background-color: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

/* Padding variants */
.card--padding-none .card__body { padding: 0; }
.card--padding-sm   .card__body { padding: var(--space-4); }
.card--padding-md   .card__body { padding: var(--space-6); }
.card--padding-lg   .card__body { padding: var(--space-8); }

/* Shadow variants */
.card--shadow-none { box-shadow: none; }
.card--shadow-sm   { box-shadow: var(--shadow-sm); }
.card--shadow-base { box-shadow: var(--shadow-base); }
.card--shadow-md   { box-shadow: var(--shadow-md); }
.card--shadow-lg   { box-shadow: var(--shadow-lg); }

/* Header & Footer */
.card__header {
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-border-subtle);
  font-weight: var(--font-weight-semibold);
}

.card__footer {
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border-subtle);
  background-color: var(--color-surface);
}
</style>
