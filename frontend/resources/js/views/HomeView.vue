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

const props = defineProps({
  isChatOpen: { type: Boolean, default: false },
  userStats:  { type: Object, default: () => ({ projects: 0, mastered: 0, badges: 0 }) },
  userEmail:  { type: String, default: '' },
  achievements: { type: Array, default: () => [] },
  hasActiveActivity: { type: Boolean, default: false },
})

const isEmptyState = computed(() => {
  const hasMastery = (props.userStats?.mastered || 0) > 0;
  const hasAwards = (props.achievements?.length || 0) > 0;
  const hasActivity = Boolean(props.hasActiveActivity);
  return !hasMastery && !hasAwards && !hasActivity;
});

const displayStats = computed(() => {
  return {
    projectCount: props.userStats?.projects ?? 0,
    masteredCount: props.userStats?.mastered ?? 0,
  };
})

const activeConcepts = computed(() => {
  // For fresh learners with 0 mastered, show all initial concepts unmastered
  if (!props.userStats?.mastered) {
    return concepts.map(c => ({
      ...c,
      mastered: false,
    }));
  }
  return concepts;
})

const emit = defineEmits(['open-module', 'open-mascot-prompt'])

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
      <!-- Empty state when learner has 0 active modules, 0 mastered concepts, and 0 star awards -->
      <div v-if="isEmptyState" class="home__empty-state">
        <div class="empty-star-ring">
          <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10" stroke-dasharray="4 4"/>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
        <h2 class="empty-state-title">Welcome to Your Star Station</h2>
        <p class="empty-state-subtitle">
          You don't have any active enrolled courses or star milestones yet.
          Explore modules from the catalog or wait for your mentor to assign your cohort's courses.
        </p>
        <button 
          type="button" 
          class="btn-empty-explore" 
          @click="$emit('open-module')"
        >
          Explore Learning Modules →
        </button>
      </div>

      <!-- Constellation — takes all remaining space -->
      <div v-else class="home__map">
        <ConstellationMap
          ref="constellationRef"
          :concepts="activeConcepts"
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
          <p class="stat__number">{{ displayStats.projectCount }}</p>
        </div>

        <!-- Mastered Concepts -->
        <div class="stat">
          <p class="stat__label">Mastered</p>
          <p class="stat__label">Concepts</p>
          <p class="stat__number">{{ displayStats.masteredCount }}</p>
        </div>
      </aside>
    </div>

    <!-- Floating action button (FAB) -->
    <ExploreButton
      :concepts="concepts"
      :is-chat-open="isChatOpen"
      @click-mascot="$emit('open-mascot-prompt')"
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
  font-family: var(--font-family-sans, 'Lexend', sans-serif);
}

/* ─── Header row ───────────────────────────────────────────────────────── */
.home__header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 36px 32px 0 40px;
  flex-shrink: 0;
}

.home__title {
  font-family: var(--font-family-display, 'Momo Trust Display', sans-serif);
  font-size: 50px;
  font-weight: 800;
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

.home__empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 24px;
  background: radial-gradient(circle at center, rgba(30, 41, 59, 0.45) 0%, rgba(15, 23, 42, 0) 70%);
  border-radius: var(--radius-xl, 16px);
  margin: 16px;
  box-sizing: border-box;
  z-index: 2;
}

.empty-star-ring {
  color: var(--accent-orange, #f97316);
  opacity: 0.9;
  margin-bottom: 16px;
  animation: pulseSlow 3s ease-in-out infinite;
}

@keyframes pulseSlow {
  0%, 100% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(1.06); opacity: 1; }
}

.empty-state-title {
  font-family: var(--font-family-display, inherit);
  font-size: 20px;
  font-weight: 700;
  color: var(--text-heading, #ffffff);
  margin: 0 0 8px 0;
}

.empty-state-subtitle {
  font-size: 13.5px;
  color: var(--text-secondary, #94a3b8);
  max-width: 440px;
  line-height: 1.5;
  margin: 0 0 20px 0;
}

.btn-empty-explore {
  background: #f97316;
  color: #ffffff;
  border: none;
  font-size: 13.5px;
  font-weight: 600;
  padding: 10px 20px;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.25);
}

.btn-empty-explore:hover {
  background: #ea580c;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(249, 115, 22, 0.35);
}

.home__stats {
  flex-shrink: 0;
  width: 140px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-start;
  gap: 32px;
  padding-top: 50px;
  padding-right: 40px;
}

/* ─── Individual stat block ─────────────────────────────────────────────── */
.stat {
  text-align: right;
}

.stat__label {
  font-family: 'Lexend', var(--font-family-sans, sans-serif);
  font-size: 18.54px;
  font-weight: 400;
  font-style: normal;
  color: #ffffff;
  line-height: 120%;
  letter-spacing: 0%;
  text-align: right;
  vertical-align: middle;
}

.stat__number {
  font-family: 'Lexend', var(--font-family-sans, sans-serif);
  font-size: 40px;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.0;
  letter-spacing: -0.03em;
  margin-top: 10px;
  margin-right: 10px;
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
