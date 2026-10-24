<script setup>
/**
 * DynamicHomeView.vue — Dynamic Interactive Space & Constellation Star Chart.
 *
 * Accessible via URL: /dynamic-home or /home-dynamic
 *
 * Features:
 *   - Real-time 60fps canvas starfield with twinkling, 3D depth, and upward drift
 *   - Mouse-tracking parallax movement that responds to cursor interaction
 *   - Periodic atmospheric shooting star / meteor streaks
 *   - Ambient floating nebula clouds and warm sunset horizon bloom
 *   - Central interactive Constellation Map with glowing star nodes
 *   - Original top toolbar, floating stats, and explore FAB
 *   - Integrated Recall Session Practice experience
 */
import { ref, computed } from 'vue'

import HomeToolbar             from '@/components/home/HomeToolbar.vue'
import ConstellationMap        from '@/components/home/ConstellationMap.vue'
import ExploreButton           from '@/components/home/ExploreButton.vue'
import DynamicCosmicBackground from '@/components/layout/DynamicCosmicBackground.vue'
import RecallSessionView       from '@/views/RecallSessionView.vue'

import {
  concepts,
  connections,
  projects,
  learnerSummary,
} from '@/mocks/homeData.js'

import { constellationConceptMap } from '@/mocks/constellationData.js'
import { Sparkles } from '@lucide/vue'

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

// ── Recall Practice Session ───────────────────────────────────────────────
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

  <div v-else class="dynamic-home">
    <!-- Real-time Dynamic Cosmic Canvas Background -->
    <DynamicCosmicBackground />

    <!-- ── Header row ─────────────────────────────────────────────── -->
    <header class="dynamic-home__header">
      <div class="dynamic-home__title-group">
        <h1 class="dynamic-home__title">Your Space</h1>
        <div class="dynamic-home__engine-badge">
          <Sparkles :size="12" class="sparkle-icon" />
          <span>Dynamic Star Chart</span>
        </div>
      </div>

      <HomeToolbar
        :model-value="searchQuery"
        @update:model-value="onSearch"
      />
    </header>

    <!-- ── Body ──────────────────────────────────────────────────── -->
    <main class="dynamic-home__body">
      <!-- Constellation — takes all remaining space -->
      <div class="dynamic-home__map">
        <ConstellationMap
          ref="constellationRef"
          :concepts="concepts"
          :connections="connections"
          :search-query="searchQuery"
          :highlighted-ids="activeHighlightIds"
          @practice="onPractice"
        />
      </div>

      <!-- Right stats panel — matching reference aesthetic -->
      <aside class="dynamic-home__stats" aria-label="Learning statistics">
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

        <!-- Dynamic mode badge -->
        <p class="dynamic-home__badge-label" aria-label="Dynamic space indicator">Dynamic Engine</p>
      </aside>
    </main>

    <!-- Floating action button (FAB) -->
    <ExploreButton
      :concepts="concepts"
      @explore="onExplore"
    />
  </div>
</template>

<style scoped>
/* ─── Root ─────────────────────────────────────────────────────────────── */
.dynamic-home {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  flex: 1;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  box-sizing: border-box;
  padding: 0;
}

/* ─── Header row ───────────────────────────────────────────────────────── */
.dynamic-home__header {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 36px 32px 0 40px;
  flex-shrink: 0;
}

.dynamic-home__title-group {
  display: flex;
  align-items: center;
  gap: 14px;
}

.dynamic-home__title {
  font-size: 30px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.025em;
  line-height: 1;
  white-space: nowrap;
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.4);
}

.dynamic-home__engine-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 122, 0, 0.16);
  border: 1px solid rgba(255, 122, 0, 0.32);
  color: #ff9020;
  padding: 3px 10px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  backdrop-filter: blur(8px);
}

.sparkle-icon {
  animation: pulseSparkle 2.4s ease-in-out infinite;
}

@keyframes pulseSparkle {
  0%, 100% { opacity: 0.7; transform: scale(0.95); }
  50% { opacity: 1; transform: scale(1.15); }
}

/* ─── Body ─────────────────────────────────────────────────────────────── */
.dynamic-home__body {
  position: relative;
  z-index: 2;
  display: flex;
  flex: 1;
  min-height: 0;
  padding: 16px 28px 24px 28px;
  gap: 0;
  align-items: stretch;
}

/* Constellation map ── */
.dynamic-home__map {
  flex: 1;
  min-width: 0;
  min-height: 0;
  position: relative;
}

.dynamic-home__stats {
  flex-shrink: 0;
  width: 140px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-start;
  gap: 32px;
  padding-top: 12px;
  padding-right: 8px;
}

/* ─── Stat block ───────────────────────────────────────────────────────── */
.stat {
  text-align: right;
}

.stat__label {
  font-family: 'Lexend', var(--font-family-sans, sans-serif);
  font-size: 14.5px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.72);
  line-height: 1.35;
  letter-spacing: -0.01em;
}

.stat__number {
  font-family: 'Lexend', var(--font-family-sans, sans-serif);
  font-size: 40px;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.0;
  letter-spacing: -0.03em;
  margin-top: 4px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
}

/* ─── Responsive ────────────────────────────────────────────────────────── */
@media (max-width: 900px) {
  .dynamic-home__header {
    padding: 20px 20px 0 20px;
    flex-wrap: wrap;
  }
  .dynamic-home__title { font-size: 24px; }
  .dynamic-home__body  { padding: 12px 16px 16px; gap: 12px; }
}

@media (max-width: 680px) {
  .dynamic-home__body {
    flex-direction: column;
    align-items: stretch;
    overflow-y: auto;
    overflow-x: hidden;
    min-height: 0;
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.25) transparent;
  }
  .dynamic-home__map {
    flex: 0 0 auto;
    height: 60vw;
    min-height: 300px;
    max-height: 460px;
  }
  .dynamic-home__stats {
    width: 100%;
    flex-shrink: 0;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    gap: 32px;
    padding-top: 0;
  }
  .stat { text-align: left; }
  .dynamic-home__badge-label { margin-top: 0; margin-left: auto; }
}

@media (max-width: 479px) {
  .dynamic-home__header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .dynamic-home__map {
    height: 68vw;
    min-height: 260px;
  }
}
</style>
