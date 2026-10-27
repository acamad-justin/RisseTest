<script setup>
/**
 * RecallCardPanel.vue
 *
 * Floating panel that appears on the left side of the constellation when a
 * star is selected. Shows the concept's recall-card status and a Practice button.
 *
 * Props:
 *   concept — ConstellationConcept object from constellationData.js (required)
 *
 * Emits:
 *   close   — user dismissed the panel
 *   practice — user clicked Practice; parent opens the practice modal
 */
import { computed } from 'vue'
import { X } from '@lucide/vue'

const props = defineProps({
  concept: { type: Object, required: true },
})

const emit = defineEmits(['close', 'practice'])

// ── Derived state ──────────────────────────────────────────────────────────
const hasDueCards = computed(
  () => props.concept.status === 'due' && props.concept.recallCardsDue > 0
)

const statusText = computed(() => {
  if (props.concept.status === 'noCards') return null
  if (props.concept.status === 'allCaughtUp') return "You're all caught up"
  const n = props.concept.recallCardsDue
  return `${n} Recall Card${n === 1 ? '' : 's'} Due`
})
</script>

<template>
  <div
    class="rcp"
    role="dialog"
    :aria-label="`Recall cards for ${concept.name}`"
    @click.stop
  >
    <!-- Close button -->
    <button
      class="rcp__close"
      type="button"
      aria-label="Close recall card panel"
      @click="$emit('close')"
    >
      <X :size="13" aria-hidden="true" />
    </button>

    <!-- ── Stacked-card illustration ── -->
    <div class="rcp__illustration" aria-hidden="true">
      <!-- Back card -->
      <div class="rcp__card rcp__card--back"></div>
      <!-- Mid card -->
      <div class="rcp__card rcp__card--mid"></div>
      <!-- Front card -->
      <div class="rcp__card rcp__card--front">
        <div class="rcp__card-lines">
          <span class="rcp__card-line rcp__card-line--long"></span>
          <span class="rcp__card-line rcp__card-line--short"></span>
        </div>
      </div>
    </div>

    <!-- ── Content ── -->
    <div class="rcp__body">
      <!-- Concept title -->
      <h3 class="rcp__title">{{ concept.name }}</h3>

      <!-- Status -->
      <template v-if="concept.status === 'noCards'">
        <p class="rcp__status rcp__status--empty">
          Recall cards are not available for this concept yet.
        </p>
      </template>
      <template v-else-if="concept.status === 'allCaughtUp'">
        <p class="rcp__status rcp__status--caught-up">
          {{ statusText }}
        </p>
      </template>
      <template v-else>
        <p class="rcp__status rcp__status--due">{{ statusText }}</p>
      </template>

      <!-- Practice button — only when there are cards to practise -->
      <button
        v-if="hasDueCards"
        class="rcp__practice-btn"
        type="button"
        @click="$emit('practice', concept.id)"
      >
        Practice
      </button>
    </div>
  </div>
</template>

<style scoped>
/* ─── Panel shell ──────────────────────────────────────────────────────── */
.rcp {
  background: #ffffff;
  border-radius: 20px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.28),
    0 2px 8px  rgba(0, 0, 0, 0.14);
  padding: 16px 18px 18px;
  width: 248px;
  box-sizing: border-box;
  position: relative;
  user-select: none;
  /* prevent constellation clicks bleeding through */
  pointer-events: auto;
}

/* ─── Close button ─────────────────────────────────────────────────────── */
.rcp__close {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.06);
  color: rgba(30, 30, 30, 0.55);
  cursor: pointer;
  flex-shrink: 0;
  transition: background var(--transition-fast), color var(--transition-fast);
  border: none;
  padding: 0;
}

.rcp__close:hover,
.rcp__close:focus-visible {
  background: rgba(0, 0, 0, 0.12);
  color: rgba(30, 30, 30, 0.90);
}

.rcp__close:focus-visible {
  outline: 2px solid var(--risse-orange);
  outline-offset: 2px;
}

/* ─── Stacked-card illustration ────────────────────────────────────────── */
/*
 * Three cards stacked with a vertical offset — no rotation.
 * Back card (indigo) peeks at the very top, mid card (periwinkle) sits just
 * below it, and the large front card (light gray) dominates the foreground.
 */
.rcp__illustration {
  position: relative;
  /* tall enough to show the full front card + peeking backs */
  height: 130px;
  margin-bottom: 14px;
}

.rcp__card {
  position: absolute;
  border-radius: 14px;
  left: 50%;
  transform: translateX(-50%);
}

/* Back card — dark indigo, narrow strip peeking at very top */
.rcp__card--back {
  width: 86%;
  height: 120px;
  background: #3D348B;
  top: 0;
  z-index: 1;
}

/* Mid card — periwinkle/blue-purple, peeks a bit more */
.rcp__card--mid {
  width: 92%;
  height: 120px;
  background: #7678ED;
  top: 8px;
  z-index: 2;
}

/* Front card — light gray, fills most of the space */
.rcp__card--front {
  width: 100%;
  height: 118px;
  background: #A2A2A2;
  top: 16px;
  z-index: 3;
  display: flex;
  align-items: flex-end;
  padding: 0 16px 14px;
  box-sizing: border-box;
}

/* ─── Body ─────────────────────────────────────────────────────────────── */
.rcp__body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rcp__title {
  font-size: 15px;
  font-weight: 700;
  color: #1a1630;
  line-height: 1.25;
  margin: 0;
}

/* Status variants */
.rcp__status {
  font-size: 12.5px;
  line-height: 1.4;
  margin: 0;
}

.rcp__status--due {
  color: var(--risse-orange, #FF9000);
  font-weight: 600;
}

.rcp__status--caught-up {
  color: #3daa6b;
  font-weight: 500;
}

.rcp__status--empty {
  color: #8a84a0;
  font-weight: 400;
}

/* ─── Practice button ──────────────────────────────────────────────────── */
.rcp__practice-btn {
  margin-top: 8px;
  width: 100%;
  padding: 9px 0;
  border-radius: 999px;
  background: var(--risse-orange, #FF9000);
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.02em;
  cursor: pointer;
  border: none;
  transition:
    background var(--transition-fast),
    transform  var(--transition-fast);
}

.rcp__practice-btn:hover {
  background: var(--risse-orange-active, #F36F00);
}

.rcp__practice-btn:active {
  transform: scale(0.97);
}

.rcp__practice-btn:focus-visible {
  outline: 3px solid rgba(255, 144, 0, 0.45);
  outline-offset: 2px;
}
</style>
