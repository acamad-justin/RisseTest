<script setup>
const year = new Date().getFullYear()
</script>

<template>
  <footer class="footer" role="contentinfo">
    <div class="container footer__inner">
      <p class="footer__copy">
        &copy; {{ year }} RISSE. All rights reserved.
      </p>
      <p class="footer__tagline">
        Built with Vue 3 + Laravel
      </p>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  margin-top: auto;
  background-color: var(--color-surface);
  border-top: 1px solid var(--color-border);
  padding: var(--space-6) 0;
}

.footer__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.footer__copy,
.footer__tagline {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
</style>
