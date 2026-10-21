<script setup>
/**
 * FeaturedProjects.vue
 * "Featured Projects" heading + vertically stacked project cards.
 */
import FeaturedProjectCard from './FeaturedProjectCard.vue'

defineProps({
  projects: { type: Array, required: true },
})

const emit = defineEmits(['remove', 'edit', 'open'])
</script>

<template>
  <section class="fp" aria-label="Featured Projects">
    <p class="fp__heading">Featured Projects</p>

    <div class="fp__list">
      <FeaturedProjectCard
        v-for="project in projects"
        :key="project.id"
        :project="project"
        @remove="$emit('remove', $event)"
        @edit="$emit('edit', $event)"
        @open="$emit('open', $event)"
      />

      <p v-if="!projects.length" class="fp__empty">
        No featured projects. Add projects from your Notebooks.
      </p>
    </div>
  </section>
</template>

<style scoped>
.fp__heading {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--risse-orange);
  margin-bottom: 10px;
  letter-spacing: 0.01em;
  flex-shrink: 0;
}

.fp__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.fp__empty {
  font-size: 12px;
  color: #aaaacc;
}
</style>
