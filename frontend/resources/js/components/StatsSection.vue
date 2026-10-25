<template>
  <div class="stats-row" id="stats-section" aria-label="User Statistics">
    <div class="stat-item" id="stat-projects">
      <span class="stat-value">{{ stats.projects }}</span>
      <span class="stat-label">Projects</span>
    </div>

    <div class="stat-item" id="stat-mastered">
      <span class="stat-value">{{ stats.mastered }}</span>
      <span class="stat-label">Mastered</span>
    </div>

    <div class="stat-item" id="stat-badges">
      <span class="stat-value">{{ stats.badges }}</span>
      <span class="stat-label">Badges</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  stats: {
    type: Object,
    required: true,
    default: () => ({
      projects: 5,
      mastered: 7,
      badges: 1,
    }),
  },
});
</script>
