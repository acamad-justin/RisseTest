<script setup>
/**
 * ConstellationMap.vue
 *
 * Constellation graph representing the learner's knowledge space.
 * Unified SVG coordinate canvas ensuring 100% vertex alignment across all viewport ratios.
 *
 * Layers (back → front):
 *   1. Inactive Dashed Lines
 *   2. Active Solid Lines (Dual-stroke glow effect)
 *   3. Multi-layer Glowing Star Nodes (StarNode.vue with breathing animation)
 *   4. RecallCardPanel (HTML overlay at bottom-right)
 */
import { ref, computed } from 'vue'
import StarNode            from './StarNode.vue'
import RecallCardPanel     from './RecallCardPanel.vue'
import { conceptMap }      from '@/mocks/homeData.js'
import { constellationConceptMap } from '@/mocks/constellationData.js'

const props = defineProps({
  concepts:       { type: Array,  required: true },
  connections:    { type: Array,  required: true },
  searchQuery:    { type: String, default: '' },
  highlightedIds: { type: Array,  default: () => [] },
})

const emit = defineEmits(['practice'])

// ── Interaction state ──────────────────────────────────────────────────────
const hoveredId  = ref(null)
const selectedId = ref(null)

function onHover(id)   { hoveredId.value  = id   }
function onUnhover()   { hoveredId.value  = null }

function onSelect(id) {
  selectedId.value = selectedId.value === id ? null : id
}

function dismiss() {
  selectedId.value = null
  hoveredId.value  = null
}

function onCanvasClick() {
  if (selectedId.value || hoveredId.value) dismiss()
}

// ── Recall panel data ──────────────────────────────────────────────────────
const selectedRecallConcept = computed(() =>
  selectedId.value ? (constellationConceptMap[selectedId.value] ?? null) : null
)

// ── Practice — bubble up to HomeView ──────────────────────────────────────
function onPractice(id) {
  emit('practice', id)
}

// ── Expose for parent (HomeView) to clear state if needed ─────────────────
function clearSelection() {
  selectedId.value = null
  hoveredId.value  = null
}

defineExpose({ clearSelection })

// ── Search ────────────────────────────────────────────────────────────────
const searchActive   = computed(() => props.searchQuery.trim().length > 0)
const searchMatchIds = computed(() => {
  if (!searchActive.value) return new Set()
  const q = props.searchQuery.toLowerCase()
  return new Set(props.concepts.filter(c => c.label.toLowerCase().includes(q)).map(c => c.id))
})
const hasSearchMatch = computed(() => searchMatchIds.value.size > 0)

// ── Visual state per node ─────────────────────────────────────────────────
function isDimmed(id) {
  if (searchActive.value)              return !searchMatchIds.value.has(id)
  if (props.highlightedIds.length > 0) return !props.highlightedIds.includes(id)
  return false
}
function isHighlighted(id) {
  if (searchActive.value)              return searchMatchIds.value.has(id)
  if (props.highlightedIds.length > 0) return props.highlightedIds.includes(id)
  return false
}

// ── Visual state per edge ─────────────────────────────────────────────────
const focusId = computed(() => hoveredId.value || selectedId.value)

function edgeIsActive(from, to) {
  return !!focusId.value && (from === focusId.value || to === focusId.value)
}

function edgeDimOpacity(from, to) {
  if (searchActive.value)
    return !searchMatchIds.value.has(from) && !searchMatchIds.value.has(to) ? 0.08 : 1
  if (props.highlightedIds.length > 0)
    return !props.highlightedIds.includes(from) && !props.highlightedIds.includes(to) ? 0.08 : 1
  return 1
}

// ── Edges split by type ───────────────────────────────────────────────────
const solidEdges       = computed(() => props.connections.filter(e => e.type === 'solid'))
const exploratoryEdges = computed(() => props.connections.filter(e => e.type === 'exploratory'))
</script>

<template>
  <div class="cmap" @click.self="onCanvasClick">
    <svg
      class="cmap__svg"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 900 560"
      preserveAspectRatio="xMidYMid meet"
      aria-label="Interactive knowledge constellation"
      role="img"
      @click.self="onCanvasClick"
    >
      <defs>
        <!-- Wide glow filter for active solid lines underlay -->
        <filter id="solidGlow" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <!-- Subtle blur filter for inactive dashed lines -->
        <filter id="dashedGlow" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">
          <feGaussianBlur stdDeviation="0.5" />
        </filter>

        <!-- Star Glow Filters for atmospheric bloom and corona -->
        <filter id="bloomBlurGold" x="-100%" y="-100%" width="300%" height="300%" color-interpolation-filters="sRGB">
          <feGaussianBlur stdDeviation="8" />
        </filter>
        <filter id="coronaBlurGold" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>

        <filter id="bloomBlurMagenta" x="-100%" y="-100%" width="300%" height="300%" color-interpolation-filters="sRGB">
          <feGaussianBlur stdDeviation="10" />
        </filter>
        <filter id="coronaBlurMagenta" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>

        <filter id="bloomBlurPeriwinkle" x="-100%" y="-100%" width="300%" height="300%" color-interpolation-filters="sRGB">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <filter id="coronaBlurPeriwinkle" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      <!-- ══ Layer 1: Inactive Dashed Lines ════════════════════════ -->
      <!-- connecting Robot Components -> Inputs, Inputs -> Sensing, and Microcontrollers -> Sensing -->
      <g class="dashed-lines">
        <line
          v-for="e in exploratoryEdges"
          :key="`dash-${e.from}--${e.to}`"
          :x1="conceptMap[e.from]?.x" :y1="conceptMap[e.from]?.y"
          :x2="conceptMap[e.to]?.x"   :y2="conceptMap[e.to]?.y"
          stroke="rgba(255, 255, 255, 0.3)"
          stroke-width="2"
          stroke-dasharray="8 8"
          stroke-linecap="round"
          filter="url(#dashedGlow)"
          style="filter: blur(0.5px);"
          :opacity="edgeDimOpacity(e.from, e.to)"
        />
      </g>

      <!-- ══ Layer 2: Active Solid Lines (Dual Stroke) ═════════════ -->
      <!-- connecting Actuation -> Outputs -> Control Loops -> Microcontrollers, and PID - Control Loops - Tuning triangle -->
      <g class="solid-lines">
        <!-- 1. Wide blurred glow underlay line -->
        <line
          v-for="e in solidEdges"
          :key="`sol-glow-${e.from}--${e.to}`"
          :x1="conceptMap[e.from]?.x" :y1="conceptMap[e.from]?.y"
          :x2="conceptMap[e.to]?.x"   :y2="conceptMap[e.to]?.y"
          stroke="rgba(255, 255, 255, 0.25)"
          stroke-width="6"
          stroke-linecap="round"
          filter="url(#solidGlow)"
          style="filter: blur(3px);"
          :opacity="edgeDimOpacity(e.from, e.to)"
        />
        <!-- 2. Sharper inner core line -->
        <line
          v-for="e in solidEdges"
          :key="`sol-core-${e.from}--${e.to}`"
          :x1="conceptMap[e.from]?.x" :y1="conceptMap[e.from]?.y"
          :x2="conceptMap[e.to]?.x"   :y2="conceptMap[e.to]?.y"
          stroke="rgba(255, 255, 255, 0.55)"
          stroke-width="2"
          stroke-linecap="round"
          :opacity="edgeDimOpacity(e.from, e.to)"
        />
      </g>

      <!-- ══ Layer 3: Multi-layer Glowing Star Nodes ═══════════════ -->
      <g class="star-nodes">
        <StarNode
          v-for="concept in concepts"
          :key="concept.id"
          :concept="concept"
          :is-hovered="hoveredId === concept.id"
          :is-selected="selectedId === concept.id"
          :is-dimmed="isDimmed(concept.id)"
          :is-highlighted="isHighlighted(concept.id)"
          @hover="onHover"
          @unhover="onUnhover"
          @select="onSelect"
        />
      </g>
    </svg>

    <!-- ══ Recall Card Panel — bottom-right corner ═══════════════════ -->
    <Transition name="pop">
      <div
        v-if="selectedRecallConcept"
        class="cmap__recall-panel"
      >
        <RecallCardPanel
          :concept="selectedRecallConcept"
          @close="dismiss"
          @practice="onPractice"
        />
      </div>
    </Transition>

    <!-- ══ No search results ══════════════════════════════════════════ -->
    <Transition name="fade">
      <p v-if="searchActive && !hasSearchMatch" class="cmap__empty">
        No concepts match "{{ searchQuery }}"
      </p>
    </Transition>
  </div>
</template>

<style scoped>
.cmap {
  position: relative;
  width: 100%;
  height: 100%;
}

.cmap__svg {
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;
}

/* ── Recall Card Panel — bottom-right corner ── */
.cmap__recall-panel {
  position: absolute;
  bottom: 16px;
  right: 16px;
  z-index: calc(var(--z-dropdown, 100) + 5);
  pointer-events: auto;
}

/* ── Empty search state ── */
.cmap__empty {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: rgba(255, 255, 255, 0.45);
  font-size: 13px;
  pointer-events: none;
  text-align: center;
  background: rgba(0, 0, 0, 0.28);
  border-radius: 8px;
  padding: 8px 16px;
}

/* ── Transitions ── */
.pop-enter-active, .pop-leave-active   { transition: opacity 180ms ease, transform 180ms ease; }
.pop-enter-from,   .pop-leave-to       { opacity: 0; transform: scale(0.93) translateY(4px); }

.fade-enter-active, .fade-leave-active { transition: opacity 200ms ease; }
.fade-enter-from,   .fade-leave-to     { opacity: 0; }
</style>
