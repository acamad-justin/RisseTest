<script setup>
/**
 * ProjectShowcase.vue
 * Compact right-side mock project list.
 * Clicking a project emits 'highlight' with that project's conceptIds
 * so the constellation can dim unrelated nodes.
 */
const props = defineProps({
  projects:          { type: Array,  required: true },
  activeProjectId:   { type: String, default: null },
})

const emit = defineEmits(['highlight', 'clear'])

const STATUS_LABEL = {
  planned:     'Planned',
  'in-progress': 'In Progress',
  complete:    'Complete',
}

const STATUS_CLASS = {
  planned:       'badge--planned',
  'in-progress': 'badge--progress',
  complete:      'badge--complete',
}

function select(project) {
  if (project.id === props.activeProjectId) {
    emit('clear')
  } else {
    emit('highlight', project)
  }
}
</script>

<template>
  <section class="showcase" aria-label="Project Showcase (demo data)">
    <header class="showcase__header">
      <span class="showcase__count">{{ projects.length }}</span>
      <div class="showcase__titles">
        <p class="showcase__label">Project</p>
        <p class="showcase__sublabel">Showcase</p>
      </div>
    </header>

    <ul class="showcase__list">
      <li
        v-for="project in projects"
        :key="project.id"
        class="showcase__item"
        :class="{ 'showcase__item--active': activeProjectId === project.id }"
      >
        <button
          class="showcase__btn"
          type="button"
          :aria-pressed="activeProjectId === project.id"
          :aria-label="`${project.title} — click to highlight related concepts`"
          @click="select(project)"
        >
          <div class="showcase__item-top">
            <span class="showcase__item-title">{{ project.title }}</span>
            <span :class="['showcase__badge', STATUS_CLASS[project.status]]">
              {{ STATUS_LABEL[project.status] }}
            </span>
          </div>
          <p class="showcase__item-desc">{{ project.description }}</p>
          <p class="showcase__item-concepts">
            {{ project.conceptIds.length }} concepts
          </p>
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.showcase {
  color: #fff;
  width: 100%;
}

/* ── Header ── */
.showcase__header {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 14px;
}

.showcase__count {
  font-size: 36px;
  font-weight: 700;
  line-height: 1;
  color: #fff;
  letter-spacing: -0.03em;
}

.showcase__titles {
  display: flex;
  flex-direction: column;
  justify-content: center;
  line-height: 1.2;
}

.showcase__label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.55);
  font-weight: 400;
}

.showcase__sublabel {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.55);
  font-weight: 400;
}

/* ── List ── */
.showcase__list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.showcase__item {
  border-radius: 10px;
  overflow: hidden;
  transition: background 150ms ease;
}

.showcase__item--active .showcase__btn {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.22);
}

/* ── Item button ── */
.showcase__btn {
  width: 100%;
  text-align: left;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 10px 11px;
  cursor: pointer;
  transition: background 150ms ease, border-color 150ms ease;
  color: inherit;
}

.showcase__btn:hover,
.showcase__btn:focus-visible {
  background: rgba(255, 255, 255, 0.10);
  border-color: rgba(255, 255, 255, 0.18);
  outline: 2px solid rgba(255, 255, 255, 0.20);
  outline-offset: 1px;
}

.showcase__item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-bottom: 4px;
}

.showcase__item-title {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.90);
  line-height: 1.3;
}

.showcase__item-desc {
  font-size: 10.5px;
  color: rgba(255, 255, 255, 0.45);
  line-height: 1.45;
  margin-bottom: 5px;
}

.showcase__item-concepts {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.30);
}

/* ── Status badges ── */
.showcase__badge {
  font-size: 9.5px;
  font-weight: 600;
  border-radius: 999px;
  padding: 2px 7px;
  white-space: nowrap;
  flex-shrink: 0;
}

.badge--planned  { background: rgba(148,163,184,0.15); color: rgba(255,255,255,0.55); }
.badge--progress { background: rgba(251,191,36,0.15);  color: #fbbf24; }
.badge--complete { background: rgba(34,197,94,0.15);   color: #4ade80; }
</style>
