<script setup>
/**
 * RecallPracticeModal.vue
 *
 * Full-screen modal that presents recall questions one at a time.
 * Shows progress, lets the learner reveal the answer, and navigate
 * through all questions for the selected concept.
 *
 * Props:
 *   concept — ConstellationConcept object from constellationData.js (required)
 *
 * Emits:
 *   close — learner exited practice; return to constellation
 */
import { ref, computed } from 'vue'
import { X, Eye, ChevronRight, ChevronLeft } from '@lucide/vue'

const props = defineProps({
  concept: { type: Object, required: true },
})

const emit = defineEmits(['close'])

// ── Practice state ─────────────────────────────────────────────────────────
const currentIndex = ref(0)
const isAnswerVisible = ref(false)

const cards = computed(() => props.concept.recallCards ?? [])
const total = computed(() => cards.value.length)
const currentCard = computed(() => cards.value[currentIndex.value] ?? null)

const isFirst = computed(() => currentIndex.value === 0)
const isLast  = computed(() => currentIndex.value >= total.value - 1)

function revealAnswer() {
  isAnswerVisible.value = true
}

function goNext() {
  if (!isLast.value) {
    currentIndex.value++
    isAnswerVisible.value = false
  }
}

function goPrev() {
  if (!isFirst.value) {
    currentIndex.value--
    isAnswerVisible.value = false
  }
}

// ── Keyboard shortcuts ─────────────────────────────────────────────────────
function onKeydown(e) {
  if (e.key === 'Escape')     { emit('close'); return }
  if (e.key === 'ArrowRight') { goNext();      return }
  if (e.key === 'ArrowLeft')  { goPrev();      return }
  if (e.key === ' ')          { e.preventDefault(); revealAnswer() }
}
</script>

<template>
  <!-- Backdrop -->
  <Teleport to="body">
    <div
      class="rpm-backdrop"
      role="dialog"
      aria-modal="true"
      :aria-label="`Practice recall cards for ${concept.name}`"
      @keydown="onKeydown"
      @click.self="$emit('close')"
    >
      <div class="rpm">
        <!-- ── Header ── -->
        <div class="rpm__header">
          <div class="rpm__header-left">
            <p class="rpm__concept-label">Practising</p>
            <h2 class="rpm__concept-name">{{ concept.name }}</h2>
          </div>

          <div class="rpm__header-right">
            <!-- Progress -->
            <span class="rpm__progress" aria-live="polite">
              {{ currentIndex + 1 }} of {{ total }}
            </span>

            <!-- Close -->
            <button
              class="rpm__close"
              type="button"
              aria-label="Exit practice and return to constellation"
              @click="$emit('close')"
            >
              <X :size="16" aria-hidden="true" />
            </button>
          </div>
        </div>

        <!-- ── Progress bar ── -->
        <div class="rpm__progress-bar" aria-hidden="true">
          <div
            class="rpm__progress-fill"
            :style="{ width: `${((currentIndex + 1) / total) * 100}%` }"
          ></div>
        </div>

        <!-- ── Card area ── -->
        <div class="rpm__card-area">
          <template v-if="currentCard">
            <!-- Question -->
            <div class="rpm__question-box">
              <p class="rpm__question-label">Question</p>
              <p class="rpm__question-text">{{ currentCard.question }}</p>
            </div>

            <!-- Answer — revealed on demand -->
            <Transition name="rpm-reveal">
              <div v-if="isAnswerVisible" class="rpm__answer-box">
                <p class="rpm__answer-label">Answer</p>
                <p class="rpm__answer-text">{{ currentCard.answer }}</p>
              </div>
            </Transition>

            <!-- Reveal prompt -->
            <Transition name="rpm-reveal">
              <button
                v-if="!isAnswerVisible"
                class="rpm__reveal-btn"
                type="button"
                @click="revealAnswer"
              >
                <Eye :size="15" aria-hidden="true" />
                Reveal Answer
              </button>
            </Transition>
          </template>

          <!-- No cards fallback (should not normally happen) -->
          <p v-else class="rpm__no-cards">No recall cards available.</p>
        </div>

        <!-- ── Navigation ── -->
        <div class="rpm__nav">
          <button
            class="rpm__nav-btn"
            type="button"
            :disabled="isFirst"
            aria-label="Previous card"
            @click="goPrev"
          >
            <ChevronLeft :size="18" aria-hidden="true" />
            Previous
          </button>

          <div class="rpm__dots" aria-hidden="true">
            <span
              v-for="(_, i) in cards"
              :key="i"
              class="rpm__dot"
              :class="{ 'rpm__dot--active': i === currentIndex }"
            ></span>
          </div>

          <button
            class="rpm__nav-btn rpm__nav-btn--next"
            type="button"
            :disabled="isLast"
            aria-label="Next card"
            @click="goNext"
          >
            Next
            <ChevronRight :size="18" aria-hidden="true" />
          </button>
        </div>

        <!-- Keyboard hint -->
        <p class="rpm__kbd-hint" aria-hidden="true">
          ← → navigate &nbsp;·&nbsp; Space reveal &nbsp;·&nbsp; Esc exit
        </p>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* ─── Backdrop ─────────────────────────────────────────────────────────── */
.rpm-backdrop {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal, 400);
  background: rgba(8, 5, 25, 0.72);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  box-sizing: border-box;
}

/* ─── Modal card ───────────────────────────────────────────────────────── */
.rpm {
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.45);
  width: 100%;
  max-width: 560px;
  max-height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
}

/* ─── Header ───────────────────────────────────────────────────────────── */
.rpm__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 24px 14px;
  flex-shrink: 0;
}

.rpm__header-left {
  min-width: 0;
}

.rpm__concept-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: rgba(30, 22, 60, 0.45);
  margin: 0 0 2px;
}

.rpm__concept-name {
  font-size: 20px;
  font-weight: 700;
  color: #1a1630;
  margin: 0;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rpm__header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.rpm__progress {
  font-size: 12px;
  font-weight: 600;
  color: rgba(30, 22, 60, 0.45);
  white-space: nowrap;
}

.rpm__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.06);
  color: rgba(30, 22, 60, 0.60);
  cursor: pointer;
  border: none;
  transition: background var(--transition-fast), color var(--transition-fast);
  flex-shrink: 0;
}

.rpm__close:hover,
.rpm__close:focus-visible {
  background: rgba(0, 0, 0, 0.12);
  color: #1a1630;
}

.rpm__close:focus-visible {
  outline: 2px solid var(--risse-orange, #FF9000);
  outline-offset: 2px;
}

/* ─── Progress bar ─────────────────────────────────────────────────────── */
.rpm__progress-bar {
  height: 4px;
  background: rgba(0, 0, 0, 0.07);
  flex-shrink: 0;
}

.rpm__progress-fill {
  height: 100%;
  background: var(--risse-orange, #FF9000);
  border-radius: 0 2px 2px 0;
  transition: width 280ms ease;
}

/* ─── Card area ────────────────────────────────────────────────────────── */
.rpm__card-area {
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  /* independent scroll within the modal */
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.15) transparent;
}

/* Question box */
.rpm__question-box {
  background: #f7f6fb;
  border-radius: 14px;
  padding: 18px 20px;
}

.rpm__question-label,
.rpm__answer-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(30, 22, 60, 0.40);
  margin: 0 0 8px;
}

.rpm__question-text {
  font-size: 15px;
  font-weight: 500;
  color: #1a1630;
  line-height: 1.55;
  margin: 0;
}

/* Answer box */
.rpm__answer-box {
  background: #f0faf4;
  border: 1.5px solid rgba(61, 170, 107, 0.25);
  border-radius: 14px;
  padding: 18px 20px;
}

.rpm__answer-text {
  font-size: 14.5px;
  color: #1a1630;
  line-height: 1.6;
  margin: 0;
}

/* Reveal button */
.rpm__reveal-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 10px 20px;
  border-radius: 999px;
  border: 1.5px solid rgba(255, 144, 0, 0.40);
  background: rgba(255, 144, 0, 0.06);
  color: var(--risse-orange, #FF9000);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  align-self: center;
  transition: background var(--transition-fast), border-color var(--transition-fast);
}

.rpm__reveal-btn:hover {
  background: rgba(255, 144, 0, 0.12);
  border-color: var(--risse-orange, #FF9000);
}

.rpm__reveal-btn:focus-visible {
  outline: 3px solid rgba(255, 144, 0, 0.40);
  outline-offset: 2px;
}

/* No-cards fallback */
.rpm__no-cards {
  font-size: 14px;
  color: rgba(30, 22, 60, 0.45);
  text-align: center;
  margin: auto;
}

/* ─── Navigation ───────────────────────────────────────────────────────── */
.rpm__nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px 18px;
  flex-shrink: 0;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.rpm__nav-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  color: rgba(30, 22, 60, 0.60);
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 8px;
  transition: color var(--transition-fast), background var(--transition-fast);
}

.rpm__nav-btn:hover:not(:disabled) {
  color: #1a1630;
  background: rgba(0, 0, 0, 0.05);
}

.rpm__nav-btn:disabled {
  opacity: 0.30;
  cursor: default;
}

.rpm__nav-btn:focus-visible {
  outline: 2px solid var(--risse-orange, #FF9000);
  outline-offset: 2px;
}

.rpm__nav-btn--next {
  flex-direction: row-reverse;
}

/* Dot indicators */
.rpm__dots {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  justify-content: center;
  max-width: 200px;
}

.rpm__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.15);
  transition: background var(--transition-fast), transform var(--transition-fast);
}

.rpm__dot--active {
  background: var(--risse-orange, #FF9000);
  transform: scale(1.35);
}

/* ─── Keyboard hint ────────────────────────────────────────────────────── */
.rpm__kbd-hint {
  font-size: 10px;
  color: rgba(30, 22, 60, 0.30);
  text-align: center;
  padding: 0 24px 14px;
  margin: 0;
  flex-shrink: 0;
}

/* ─── Reveal animation ─────────────────────────────────────────────────── */
.rpm-reveal-enter-active { transition: opacity 220ms ease, transform 220ms ease; }
.rpm-reveal-leave-active { transition: opacity 150ms ease, transform 150ms ease; }
.rpm-reveal-enter-from  { opacity: 0; transform: translateY(8px); }
.rpm-reveal-leave-to    { opacity: 0; transform: translateY(-4px); }

/* ─── Mobile ───────────────────────────────────────────────────────────── */
@media (max-width: 600px) {
  .rpm {
    max-width: 100%;
    border-radius: 18px;
  }

  .rpm__card-area { padding: 18px 20px; }
  .rpm__header    { padding: 18px 20px 12px; }
  .rpm__nav       { padding: 12px 20px 16px; }

  .rpm__concept-name { font-size: 17px; }

  .rpm__dots { max-width: 140px; }

  .rpm__kbd-hint { display: none; }
}
</style>
