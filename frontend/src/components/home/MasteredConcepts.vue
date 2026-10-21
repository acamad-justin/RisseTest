<script setup>
/**
 * MasteredConcepts.vue
 * Compact mastery summary.
 * Count is derived from the mock data — not hardcoded.
 */
defineProps({
  count: { type: Number, required: true },
})
</script>

<template>
  <section class="mastered" aria-label="Mastered Concepts count (demo data)">
    <div class="mastered__count">{{ count }}</div>
    <div class="mastered__labels">
      <p class="mastered__primary">Mastered</p>
      <p class="mastered__secondary">Concepts</p>
    </div>
  </section>
</template>

<style scoped>
.mastered {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: #fff;
}

.mastered__count {
  font-size: 36px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.03em;
  color: #fff;
}

.mastered__labels {
  display: flex;
  flex-direction: column;
  justify-content: center;
  line-height: 1.2;
}

.mastered__primary,
.mastered__secondary {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.55);
  font-weight: 400;
}
</style>
