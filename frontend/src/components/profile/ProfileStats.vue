<script setup>
/**
 * ProfileStats.vue
 * Three orange-number + dark-label stat blocks.
 */
defineProps({
  stats:  { type: Object, required: true },
  isDemo: { type: Boolean, default: true },
})
</script>

<template>
  <div class="pstats" :aria-label="isDemo ? 'Profile statistics (demo data)' : 'Profile statistics'">
    <div class="pstats__item">
      <span class="pstats__num">{{ stats.projects }}</span>
      <span class="pstats__label">Projects</span>
    </div>
    <div class="pstats__item">
      <span class="pstats__num">{{ stats.mastered }}</span>
      <span class="pstats__label">Mastered</span>
    </div>
    <div class="pstats__item">
      <span class="pstats__num">{{ stats.badges }}</span>
      <span class="pstats__label">Badges</span>
    </div>

    <!-- Demo indicator -->
    <span v-if="isDemo" class="pstats__demo" aria-label="Demo data">demo</span>
  </div>
</template>

<style scoped>
.pstats {
  display: flex;
  align-items: flex-start;
  justify-content: space-around;
  gap: 8px;
  position: relative;
  padding-bottom: 2px;
  flex-shrink: 0;
}

.pstats__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.pstats__num {
  font-size: 20px;
  font-weight: 700;
  color: var(--risse-orange);
  line-height: 1;
  letter-spacing: -0.02em;
}

.pstats__label {
  font-size: 11px;
  color: #2a2a4a;
  font-weight: 400;
  text-align: center;
}

.pstats__demo {
  position: absolute;
  bottom: 0;
  right: 0;
  font-size: 9px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgba(0, 0, 0, 0.20);
}
</style>
