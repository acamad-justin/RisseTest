<script setup>
/**
 * ProjectCard.vue — a single project card in the grid.
 */
defineProps({
  project:   { type: Object, required: true },
  logCount:  { type: Number, default: 0 },
  selected:  { type: Boolean, default: false },
  selectMode:{ type: Boolean, default: false },
})

const emit = defineEmits(['open', 'toggle-select'])

function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}
</script>

<template>
  <div
    class="project-card"
    :class="{
      'project-card--selected': selected,
      'project-card--selectable': selectMode,
    }"
    role="button"
    tabindex="0"
    :aria-label="`Open project ${project.title}`"
    :aria-pressed="selectMode ? selected : undefined"
    @click="selectMode ? $emit('toggle-select', project.id) : $emit('open', project.id)"
    @keydown.enter="selectMode ? $emit('toggle-select', project.id) : $emit('open', project.id)"
  >
    <!-- Selection checkbox (select mode) -->
    <span v-if="selectMode" class="project-card__checkbox" aria-hidden="true">
      <span v-if="selected" class="project-card__check">✓</span>
    </span>

    <p class="project-card__title">{{ project.title }}</p>

    <div class="project-card__footer">
      <span class="project-card__date">{{ fmtDate(project.createdAt) }}</span>
      <span class="project-card__logs">{{ logCount }} Log{{ logCount === 1 ? '' : 's' }}</span>
    </div>
  </div>
</template>

<style scoped>
.project-card {
  position: relative;
  background: #ffffff;
  border: 1px solid #e4e4ef;
  border-radius: 12px;
  padding: 14px 14px 11px;
  min-height: 72px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  transition: border-color 150ms ease, box-shadow 150ms ease;
  outline: none;
}

.project-card:hover,
.project-card:focus-visible {
  border-color: #c8c8e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.project-card:focus-visible {
  outline: 2px solid var(--risse-orange);
  outline-offset: 1px;
}

.project-card--selected {
  border-color: var(--risse-orange);
  box-shadow: 0 0 0 2px rgba(255, 144, 0, 0.20);
}

/* ── Checkbox ── */
.project-card__checkbox {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1.5px solid #c8c8e0;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.project-card--selected .project-card__checkbox {
  background: var(--risse-orange);
  border-color: var(--risse-orange);
}

.project-card__check {
  font-size: 10px;
  color: #fff;
  font-weight: 700;
  line-height: 1;
}

/* ── Content ── */
.project-card__title {
  font-size: 12px;
  font-weight: 600;
  color: #1a1a2e;
  line-height: 1.3;
  margin-bottom: 8px;
}

.project-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.project-card__date,
.project-card__logs {
  font-size: 9px;
  color: #9999bb;
}
</style>
