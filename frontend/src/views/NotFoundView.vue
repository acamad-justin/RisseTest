<script setup>
import BaseButton from '@/components/ui/BaseButton.vue'
import { FileQuestion } from '@lucide/vue'
</script>

<template>
  <div class="not-found">
    <div class="not-found__content">
      <FileQuestion class="not-found__icon" :size="72" aria-hidden="true" />

      <h1 class="not-found__code">404</h1>
      <h2 class="not-found__title">Page Not Found</h2>

      <p class="not-found__message">
        The page you're looking for doesn't exist or has been moved.
      </p>

      <RouterLink to="/">
        <BaseButton variant="primary" size="lg">Go Home</BaseButton>
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--space-12);
}

.not-found__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-4);
  max-width: 440px;
}

.not-found__icon {
  color: var(--color-secondary-300);
}

.not-found__code {
  font-size: var(--font-size-5xl);
  font-weight: var(--font-weight-extrabold);
  color: var(--color-primary-600);
  line-height: 1;
}

.not-found__title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
}

.not-found__message {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
}
</style>
