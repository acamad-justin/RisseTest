<script setup>
/**
 * ProjectsSection.vue — "Projects (n)" heading + paginated card grid.
 *
 * Same pagination pattern as LogsSection: parent slices the page,
 * this component renders it and forwards page-change events.
 */
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import ProjectCard from './ProjectCard.vue'

const props = defineProps({
  projects:          { type: Array,  required: true }, // already-sliced page
  totalProjects:     { type: Number, required: true }, // total across all pages
  logCountByProject: { type: Object, default: () => ({}) },
  selectMode:        { type: Boolean, default: false },
  selectedIds:       { type: Array,  default: () => [] },
  page:              { type: Number, required: true },
  totalPages:        { type: Number, required: true },
})

const emit = defineEmits(['open-project', 'toggle-select', 'page-change'])

const pageNumbers = computed(() => {
  const pages = []
  for (let i = 1; i <= props.totalPages; i++) pages.push(i)
  return pages
})
</script>

<template>
  <section class="projects-section" aria-label="Projects">
    <!-- ── Section heading ── -->
    <div class="projects-section__head">
      <span class="projects-section__label">Projects</span>
      <span class="projects-section__count">({{ totalProjects }})</span>
    </div>

    <!-- ── Grid ── -->
    <div class="projects-section__grid">
      <ProjectCard
        v-for="project in projects"
        :key="project.id"
        :project="project"
        :log-count="logCountByProject[project.id] ?? 0"
        :select-mode="selectMode"
        :selected="selectedIds.includes(project.id)"
        @open="$emit('open-project', $event)"
        @toggle-select="$emit('toggle-select', $event)"
      />

      <p v-if="!projects.length" class="projects-section__empty">
        No projects yet. Create one with the + button.
      </p>
    </div>

    <!-- ── Pagination controls ── -->
    <div v-if="totalPages > 1" class="projects-section__pagination" aria-label="Projects pagination">
      <button
        class="pager__btn"
        :disabled="page === 1"
        aria-label="Previous page"
        @click="$emit('page-change', page - 1)"
      >
        <ChevronLeft :size="13" aria-hidden="true" />
      </button>

      <template v-for="n in pageNumbers" :key="n">
        <span
          v-if="n === 2 && page > 4 && totalPages > 6"
          class="pager__ellipsis"
        >…</span>

        <template v-if="
          n === 1 ||
          n === totalPages ||
          (n >= page - 1 && n <= page + 1) ||
          (page <= 3 && n <= 4) ||
          (page >= totalPages - 2 && n >= totalPages - 3)
        ">
          <button
            class="pager__num"
            :class="{ 'pager__num--active': n === page }"
            :aria-label="`Page ${n}`"
            :aria-current="n === page ? 'page' : undefined"
            @click="$emit('page-change', n)"
          >{{ n }}</button>
        </template>

        <span
          v-if="n === totalPages - 1 && page < totalPages - 3 && totalPages > 6"
          class="pager__ellipsis"
        >…</span>
      </template>

      <button
        class="pager__btn"
        :disabled="page === totalPages"
        aria-label="Next page"
        @click="$emit('page-change', page + 1)"
      >
        <ChevronRight :size="13" aria-hidden="true" />
      </button>
    </div>
  </section>
</template>

<style scoped>
/* ── Section head ── */
.projects-section__head {
  display: flex;
  align-items: baseline;
  gap: 5px;
  margin-bottom: 12px;
}

.projects-section__label {
  font-size: 13px;
  font-weight: 700;
  color: var(--risse-orange);
}

.projects-section__count {
  font-size: 12px;
  color: #A2A2A2;
  font-weight: 500;
}

/* ── Grid ── */
.projects-section__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.projects-section__empty {
  font-size: 12px;
  color: #aaaacc;
  grid-column: 1 / -1;
}

@media (max-width: 860px) {
  .projects-section__grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 540px) {
  .projects-section__grid { grid-template-columns: 1fr; }
}

/* ── Pagination ── */
.projects-section__pagination {
  display: flex;
  align-items: center;
  gap: 3px;
  margin-top: 12px;
}

.pager__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: 1px solid #e4e4f0;
  background: transparent;
  color: #6666aa;
  cursor: pointer;
  transition: background 150ms ease, color 150ms ease;
}

.pager__btn:disabled {
  opacity: 0.30;
  cursor: not-allowed;
}

.pager__btn:not(:disabled):hover {
  background: #f4f4fc;
  color: #1a1a2e;
}

.pager__num {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 26px;
  padding: 0 5px;
  border-radius: 6px;
  border: 1px solid transparent;
  background: transparent;
  font-size: 11.5px;
  color: #6666aa;
  cursor: pointer;
  transition: background 150ms ease, color 150ms ease;
}

.pager__num:hover { background: #f4f4fc; color: #1a1a2e; }

.pager__num--active {
  background: var(--risse-orange);
  color: #fff;
  border-color: var(--risse-orange);
  font-weight: 600;
  cursor: default;
}

.pager__ellipsis {
  font-size: 11.5px;
  color: #aaaacc;
  padding: 0 2px;
  line-height: 26px;
  user-select: none;
}
</style>
