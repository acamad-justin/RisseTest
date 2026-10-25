<template>
  <section class="skills-section" aria-labelledby="skills-heading">
    <h3 class="section-heading-orange" id="skills-heading">Demonstrated Skills</h3>
    
    <div v-if="skills && skills.length" class="skills-container" id="skills-list">
      <span 
        v-for="(skill, index) in skills" 
        :key="index" 
        class="skill-tag"
        :id="`skill-tag-${index}`"
      >
        {{ skill }}
      </span>
    </div>
    <div v-else class="empty-skills-notice">
      <span>No demonstrated skills recorded yet. Complete learning module checkpoints to earn verified skills.</span>
    </div>
  </section>
</template>

<script setup>
defineProps({
  skills: {
    type: Array,
    required: true,
    default: () => [],
  },
});
</script>

<style scoped>
.empty-skills-notice {
  font-size: 13px;
  color: #94a3b8;
  padding: 8px 0;
  font-style: italic;
  line-height: 1.4;
}
</style>
