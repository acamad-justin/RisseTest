<script setup>
/**
 * LogsSection.vue — "Logs (n)" heading + paginated list of LogRow items.
 *
 * Pagination is driven by the parent (NotebooksView).
 * The parent slices the correct page and passes it as `logs`.
 * This component only renders what it receives and forwards
 * page-change events upward.
 */
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import LogRow from './LogRow.vue'

const props = defineProps({
  logs:       { type: Array,  required: true }, // already-sliced page
  totalLogs:  { type: Number, required: true }, // total across all pages
  page:       { type: Number, required: true }, // 1-based current page
  totalPages: { type: Number, required: true },
  projects:   { type: Array,  default: () => [] },
})

const emit = defineEmits(['open-log', 'rename', 'move', 'delete', 'page-change'])

const pageNumbers = computed(() => {
  const pages = []
  for (let i = 1; i <= props.totalPages; i++) pages.push(i)
  return pages
})
</script>

<template>
  <section class="logs-section" aria-label="Logs">
    <!-- ── Section heading ── -->
    <div class="logs-section__head">
      <span class="logs-section__label">Logs</span>
      <span class="logs-section__count">({{ totalLogs }})</span>
    </div>

    <!-- ── List ── -->
    <div class="logs-section__list" role="list">
      <LogRow
        v-for="log in logs"
        :key="log.id"
        :log="log"
        :projects="projects"
        role="listitem"
        @open="$emit('open-log', $event)"
        @rename="(id, title) => $emit('rename', id, title)"
        @move="(logId, projId) => $emit('move', logId, projId)"
        @delete="$emit('delete', $event)"
      />

      <p v-if="!logs.length" class="logs-section__empty">
        No logs yet. Create one with the + button.
      </p>
    </div>

    <!-- ── Pagination controls ── -->
    <div v-if="totalPages > 1" class="logs-section__pagination" aria-label="Logs pagination">
      <!-- Prev -->
      <button
        class="pager__btn"
        :disabled="page === 1"
        aria-label="Previous page"
        @click="$emit('page-change', page - 1)"
      >
        <ChevronLeft :size="13" aria-hidden="true" />
      </button>

      <!-- Page numbers (show up to 5, collapse the rest with …) -->
      <template v-for="n in pageNumbers" :key="n">
        <!-- Leading ellipsis -->
        <span
          v-if="n === 2 && page > 4 && totalPages > 6"
          class="pager__ellipsis"
        >…</span>

        <!-- Skip pages far from current -->
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

        <!-- Trailing ellipsis -->
        <span
          v-if="n === totalPages - 1 && page < totalPages - 3 && totalPages > 6"
          class="pager__ellipsis"
        >…</span>
      </template>

      <!-- Next -->
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
.logs-section { margin-bottom: 24px; }

/* ── Section head ── */
.logs-section__head {
  display: flex;
  align-items: baseline;
  gap: 5px;
  margin-bottom: 10px;
}

.logs-section__label {
  font-size: 13px;
  font-weight: 700;
  color: var(--risse-orange);
  letter-spacing: 0.01em;
}

.logs-section__count {
  font-size: 12px;
  color: var(--risse-orange);
  font-weight: 500;
}

/* ── List ── */
.logs-section__list { display: flex; flex-direction: column; }

.logs-section__empty {
  font-size: 12px;
  color: #aaaacc;
  padding: 10px 0;
}

/* ── Pagination ── */
.logs-section__pagination {
  display: flex;
  align-items: center;
  gap: 3px;
  margin-top: 10px;
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
