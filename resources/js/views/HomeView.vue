<script setup>
/**
 * HomeView.vue — Risse homepage.
 *
 * Replicates the original "Your Space" layout before merging (Screenshot 3):
 * - "Your Space" title and HomeToolbar search/notifications at the top
 * - Interactive Constellation Map in the center
 * - Right stats column (Project Showcase & Mastered Concepts)
 * - Explore FAB button in bottom-right corner
 * - Full original RecallSessionView practice experience with layered cards,
 *   short-answer, multiple choice, and session evaluation summary.
 */
import { ref, computed } from 'vue'

import HomeToolbar         from '@/components/home/HomeToolbar.vue'
import ConstellationMap    from '@/components/home/ConstellationMap.vue'
import ExploreButton       from '@/components/home/ExploreButton.vue'
import RecallSessionView   from '@/views/RecallSessionView.vue'

import {
  concepts,
  connections,
  projects,
  learnerSummary,
} from '@/mocks/homeData.js'

import { constellationConceptMap } from '@/mocks/constellationData.js'

// ── Search ────────────────────────────────────────────────────────────────
const searchQuery = ref('')

function onSearch(q) {
  searchQuery.value = q
  if (q) activeProjectId.value = null
}

// ── Project highlight ─────────────────────────────────────────────────────
const activeProjectId = ref(null)

const projectHighlightIds = computed(() => {
  if (!activeProjectId.value) return []
  const p = projects.find(p => p.id === activeProjectId.value)
  return p ? p.conceptIds : []
})

// ── Explore (FAB) highlight ───────────────────────────────────────────────
const exploreHighlightIds = ref([])

function onExplore(ids) {
  exploreHighlightIds.value = ids
}

const activeHighlightIds = computed(() => {
  if (exploreHighlightIds.value.length > 0) return exploreHighlightIds.value
  return projectHighlightIds.value
})

// ── Recall Practice Session (Original Full Screen Experience) ─────────────
const constellationRef = ref(null)
const activeRecallSession = ref(null)

function onPractice(id) {
  const concept = constellationConceptMap[id]
  activeRecallSession.value = {
    id,
    name: concept?.name ?? id,
  }
}
</script>

<template>
  <!-- Full original Recall Practice Session Experience -->
  <RecallSessionView
    v-if="activeRecallSession"
    :concept-id="activeRecallSession.id"
    :concept-name="activeRecallSession.name"
    @close="activeRecallSession = null"
  />

  <div v-else class="home">
    <!-- ── Header row ─────────────────────────────────────────────── -->
    <div class="home__header">
      <h1 class="home__title">Your Space</h1>
      <HomeToolbar
        :model-value="searchQuery"
        @update:model-value="onSearch"
      />
    </div>

    <!-- ── Body ──────────────────────────────────────────────────── -->
    <div class="home__body">
      <!-- Constellation — takes all remaining space -->
      <div class="home__map">
        <ConstellationMap
          ref="constellationRef"
          :concepts="concepts"
          :connections="connections"
          :search-query="searchQuery"
          :highlighted-ids="activeHighlightIds"
          @practice="onPractice"
        />
      </div>

      <!-- Right stats panel — matching original reference screenshot -->
      <aside class="home__stats" aria-label="Learning statistics">
        <!-- Project Showcase -->
        <div class="stat">
          <p class="stat__label">Project</p>
          <p class="stat__label">Showcase</p>
          <p class="stat__number">{{ learnerSummary.projectCount }}</p>
        </div>

        <!-- Mastered Concepts -->
        <div class="stat">
          <p class="stat__label">Mastered</p>
          <p class="stat__label">Concepts</p>
          <p class="stat__number">{{ learnerSummary.masteredCount }}</p>
        </div>

        <!-- Demo notice -->
        <p class="home__demo-badge" aria-label="Demo data notice">demo</p>
      </aside>
    </div>

    <!-- Floating action button (FAB) -->
    <ExploreButton
      :concepts="concepts"
      @explore="onExplore"
    />
  </div>
</template>

<style scoped>
/* ─── Root ─────────────────────────────────────────────────────────────── */
.home {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  flex: 1;
  height: 100%;
  min-height: 0;
  overflow: hidden;     /* prevent the page from scrolling; map is the focus */
  box-sizing: border-box;
  padding: 0;
}

/* ─── Header row ───────────────────────────────────────────────────────── */
.home__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 36px 32px 0 40px;
  flex-shrink: 0;
}

.home__title {
  font-size: 30px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.025em;
  line-height: 1;
  white-space: nowrap;
}

/* ─── Body ─────────────────────────────────────────────────────────────── */
.home__body {
  display: flex;
  flex: 1;
  min-height: 0;
  padding: 16px 28px 24px 28px;
  gap: 0;
  align-items: stretch;
}

/* Constellation map — flex 1, all available space */
.home__map {
  flex: 1;
  min-width: 0;
  min-height: 0;
  position: relative;
}

.home__stats {
  flex-shrink: 0;
  width: 100px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-start;
  gap: 28px;
  padding-top: 8px;
}

/* ─── Individual stat block ─────────────────────────────────────────────── */
.stat {
  text-align: right;
}

.stat__label {
  font-size: 11px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.60);
  line-height: 1.3;
}

.stat__number {
  font-size: 30px;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.0;
  letter-spacing: -0.03em;
  margin-top: 2px;
}

/* ─── Demo badge ────────────────────────────────────────────────────────── */
.home__demo-badge {
  font-size: 9px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.20);
  margin-top: auto;
}

/* ─── Responsive ────────────────────────────────────────────────────────── */
@media (max-width: 900px) {
  .home__header {
    padding: 20px 20px 0 20px;
    flex-wrap: wrap;
  }
  .home__title { font-size: 24px; }
  .home__body  { padding: 12px 16px 16px; gap: 12px; }
}

@media (max-width: 680px) {
  .home__body {
    flex-direction: column;
    align-items: stretch;
    overflow-y: auto;
    overflow-x: hidden;
    min-height: 0;
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.25) transparent;
  }
  .home__map {
    flex: 0 0 auto;
    height: 60vw;
    min-height: 300px;
    max-height: 460px;
  }
  .home__stats {
    width: 100%;
    flex-shrink: 0;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    gap: 32px;
    padding-top: 0;
  }
  .stat { text-align: left; }
  .home__demo-badge { margin-top: 0; margin-left: auto; }
}

@media (max-width: 479px) {
  .home__header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .home__map {
    height: 68vw;
    min-height: 260px;
  }
}
</style>
