<script setup>
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const stack = [
  { label: 'Vue 3',       type: 'Frontend',  variant: 'primary' },
  { label: 'Vite',        type: 'Build Tool',variant: 'primary' },
  { label: 'Vue Router',  type: 'Frontend',  variant: 'primary' },
  { label: 'Pinia',       type: 'Frontend',  variant: 'primary' },
  { label: 'Axios',       type: 'HTTP',      variant: 'default' },
  { label: 'Laravel',     type: 'Backend',   variant: 'default' },
  { label: 'MySQL',       type: 'Database',  variant: 'success' },
  { label: 'XAMPP',       type: 'Dev Tools', variant: 'success' },
]
</script>

<template>
  <div class="about-page">
    <div class="container">
      <div class="about-page__header">
        <h1 class="about-page__title">About This Project</h1>
        <p class="about-page__subtitle">
          This page confirms that Vue Router is working correctly.
          Navigation between pages is operational.
        </p>
      </div>

      <div class="about-page__grid">
        <!-- Project Info -->
        <BaseCard shadow="md">
          <template #header>Project Overview</template>

          <p class="about-text">
            RISSE is built on a decoupled architecture: the Vue 3 frontend communicates
            with a Laravel REST API via Axios. The database runs on XAMPP's
            MySQL instance, managed through phpMyAdmin.
          </p>
          <p class="about-text">
            This setup allows frontend and backend development to proceed
            independently on separate dev servers.
          </p>
        </BaseCard>

        <!-- Dev Servers -->
        <BaseCard shadow="md">
          <template #header>Development Servers</template>

          <ul class="server-list">
            <li class="server-list__item">
              <code class="server-list__url">http://localhost:5173</code>
              <span class="server-list__label">Vue / Vite (Frontend)</span>
            </li>
            <li class="server-list__item">
              <code class="server-list__url">http://127.0.0.1:8000</code>
              <span class="server-list__label">Laravel (Backend API)</span>
            </li>
            <li class="server-list__item">
              <code class="server-list__url">http://localhost/phpmyadmin</code>
              <span class="server-list__label">phpMyAdmin (Database)</span>
            </li>
          </ul>
        </BaseCard>

        <!-- Tech Stack -->
        <BaseCard shadow="md">
          <template #header>Technology Stack</template>

          <div class="stack-badges">
            <div
              v-for="item in stack"
              :key="item.label"
              class="stack-badges__item"
            >
              <BaseBadge :variant="item.variant">{{ item.label }}</BaseBadge>
              <span class="stack-badges__type">{{ item.type }}</span>
            </div>
          </div>
        </BaseCard>
      </div>

      <div class="about-page__cta">
        <RouterLink to="/">
          <BaseButton variant="outline">← Back to Home</BaseButton>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.about-page {
  flex: 1;
  min-height: 0;
  overflow-y: auto;   /* page content scrolls inside the shell */
  overflow-x: hidden;
  padding: var(--space-12) 0;
  scrollbar-width: thin;
  scrollbar-color: var(--color-border) transparent;
}

.about-page__header {
  text-align: center;
  margin-bottom: var(--space-10);
}

.about-page__title {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--space-3);
}

.about-page__subtitle {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  max-width: 520px;
  margin-inline: auto;
}

.about-page__grid {
  display: grid;
  gap: var(--space-6);
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .about-page__grid { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1024px) {
  .about-page__grid { grid-template-columns: repeat(3, 1fr); }
}

.about-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
  margin-bottom: var(--space-3);
}

.about-text:last-child { margin-bottom: 0; }

/* Server list */
.server-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.server-list__item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.server-list__url {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  color: var(--color-primary-700);
  background-color: var(--color-primary-50);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-base);
}

.server-list__label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

/* Stack badges */
.stack-badges {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.stack-badges__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.stack-badges__type {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.about-page__cta {
  margin-top: var(--space-10);
  display: flex;
  justify-content: center;
}
</style>
