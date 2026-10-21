<script setup>
/**
 * HomeView.vue — Risse homepage.
 *
 * Star selection is handled entirely inside ConstellationMap, which now owns
 * both the ConceptDetails popover (near the star) and the RecallCardPanel
 * (bottom-right corner). HomeView only needs to handle the Practice modal.
 *
 * The sidebar and CosmicBackground are in AppLayout — not touched here.
 * Mock data only. Replace imports with API calls when backend is ready.
 */
import { ref, computed } from 'vue'

import HomeToolbar         from '@/components/home/HomeToolbar.vue'
import ConstellationMap    from '@/components/home/ConstellationMap.vue'
import ExploreButton       from '@/components/home/ExploreButton.vue'

import {
  concepts,
  connections,
  projects,
  learnerSummary,
} from '@/mocks/homeData.js'

import { constellationConceptMap } from '@/mocks/constellationData.js'
import { useRouter } from 'vue-router'

// ── Router ────────────────────────────────────────────────────────────────
const router = useRouter()

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

// ── Recall Practice — navigate to the full recall session view ────────────
const constellationRef = ref(null)

function onPractice(id) {
  const concept = constellationConceptMap[id]
  router.push({
    name: 'recall',
    query: {
      conceptId:   id,
      conceptName: concept?.name ?? id,
    },
  })
}
</script>

<template>
  <!-- Full-height page; no background (cosmic bg is in AppLayout) -->
  <div class="home">

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

      <!-- Right stats panel — no cards, plain text on the background -->
      <aside class="home__stats" aria-label="Learning statistics (demo data)">
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

    <!-- Floating action button (position: fixed inside component) -->
    <ExploreButton
      :concepts="concepts"
      @explore="onExplore"
    />

  </div>
</template>

<style scoped>
/* ─── Root ─────────────────────────────────────────────────────────────── */
.home {
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

/* ─── Recall panel transition ───────────────────────────────────────────── */
/* (panel transitions are now handled inside ConstellationMap) */
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

/* ─── Recall panel transition ───────────────────────────────────────────── */
.recall-panel-enter-active { transition: opacity 200ms ease, transform 200ms ease; }
.recall-panel-leave-active { transition: opacity 160ms ease, transform 160ms ease; }
.recall-panel-enter-from  {
  opacity: 0;
  transform: translateY(calc(-50% + 10px)) scale(0.95);
}
.recall-panel-leave-to    {
  opacity: 0;
  transform: translateY(calc(-50% - 6px)) scale(0.96);
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
  /* Stack the map above the stats; the body itself becomes the scroll
     region so the shell never grows beyond the viewport. */
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
