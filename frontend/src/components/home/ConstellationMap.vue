<script setup>
/**
 * ConstellationMap.vue
 *
 * SVG viewBox: 900 × 560. Nodes sit at absolute coordinates in this space.
 *
 * Layers (back → front):
 *   1. Dashed exploratory edges
 *   2. Solid edges
 *   3. Star nodes (StarNode.vue)
 *   4. RecallCardPanel — bottom-right corner of the map (HTML overlay)
 *
 * Clicking ✕ on the panel, or clicking the canvas, dismisses it.
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
    return !searchMatchIds.value.has(from) && !searchMatchIds.value.has(to) ? 0.06 : 1
  if (props.highlightedIds.length > 0)
    return !props.highlightedIds.includes(from) && !props.highlightedIds.includes(to) ? 0.06 : 1
  return 1
}

// ── Edges split by type ───────────────────────────────────────────────────
const solidEdges       = computed(() => props.connections.filter(e => e.type === 'solid'))
const exploratoryEdges = computed(() => props.connections.filter(e => e.type === 'exploratory'))

// ── Edge stroke helpers ───────────────────────────────────────────────────
const SOLID_STROKE        = 'rgba(200, 195, 255, 0.55)'
const SOLID_STROKE_ACTIVE = 'rgba(255, 255, 255, 0.80)'
const DASH_STROKE         = 'rgba(180, 175, 230, 0.28)'
const DASH_STROKE_ACTIVE  = 'rgba(255, 255, 255, 0.55)'
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
        <filter id="nodeGlow" x="-120%" y="-120%" width="340%" height="340%"
                color-interpolation-filters="sRGB">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="edgeGlow" x="-20%" y="-200%" width="140%" height="500%"
                color-interpolation-filters="sRGB">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <!-- ══ Layer 1: Exploratory (dashed) edges ══════════════════ -->
      <g>
        <line
          v-for="e in exploratoryEdges"
          :key="`exp-${e.from}--${e.to}`"
          :x1="conceptMap[e.from]?.x" :y1="conceptMap[e.from]?.y"
          :x2="conceptMap[e.to]?.x"   :y2="conceptMap[e.to]?.y"
          :stroke="edgeIsActive(e.from, e.to) ? DASH_STROKE_ACTIVE : DASH_STROKE"
          stroke-width="1.2"
          stroke-dasharray="4 5"
          stroke-linecap="round"
          :opacity="edgeDimOpacity(e.from, e.to)"
        />
      </g>

      <!-- ══ Layer 2: Solid edges ══════════════════════════════════ -->
      <g filter="url(#edgeGlow)">
        <line
          v-for="e in solidEdges"
          :key="`sol-${e.from}--${e.to}`"
          :x1="conceptMap[e.from]?.x" :y1="conceptMap[e.from]?.y"
          :x2="conceptMap[e.to]?.x"   :y2="conceptMap[e.to]?.y"
          :stroke="edgeIsActive(e.from, e.to) ? SOLID_STROKE_ACTIVE : SOLID_STROKE"
          :stroke-width="edgeIsActive(e.from, e.to) ? 1.8 : 1.2"
          stroke-linecap="round"
          :opacity="edgeDimOpacity(e.from, e.to)"
        />
      </g>

      <!-- ══ Layer 3: Star nodes ════════════════════════════════════ -->
      <g filter="url(#nodeGlow)">
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
