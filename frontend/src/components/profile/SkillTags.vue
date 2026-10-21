<script setup>
/**
 * SkillTags.vue
 * "Demonstrated Skills" section label + wrapping pill tags.
 */
defineProps({
  skills: { type: Array, required: true },
})
</script>

<template>
  <section class="skills" aria-label="Demonstrated Skills">
    <p class="skills__heading">Demonstrated Skills</p>
    <div class="skills__tags" role="list">
      <span
        v-for="skill in skills"
        :key="skill"
        class="skills__tag"
        role="listitem"
      >{{ skill }}</span>
    </div>
  </section>
</template>

<style scoped>
.skills {
  margin-top: 14px;
  flex-shrink: 0;
}

.skills__heading {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--risse-orange);
  letter-spacing: 0.01em;
  margin-bottom: 8px;
}

.skills__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.skills__tag {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 10px;
  background: #f0f0f5;
  border: 1px solid #e0e0ea;
  border-radius: 999px;
  font-size: 11px;
  color: #2a2a4a;
  white-space: nowrap;
  user-select: none;
}
</style>
