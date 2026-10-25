<script setup>
/**
 * RecallSessionView.vue
 *
 * Top-level view for the Recall Practice experience.
 * Sits inside AppLayout (inherits Sidebar + CosmicBackground).
 *
 * Manages:
 *   - Active question index
 *   - Learner short-answer responses  { [questionId]: string }
 *   - Learner MC selections           { [questionId]: optionId }
 *   - Session phase: 'questions' | 'summary'
 *   - Evaluation results (derived on transition to summary)
 *
 * Props supplied via route query:
 *   conceptId  — e.g. 'microcontrollers' (defaults to 'microcontrollers')
 *   conceptName — display name (defaults to 'Microcontrollers')
 */
import { ref, computed, watch } from 'vue'

import RecallHeader       from '@/components/recall/RecallHeader.vue'
import RecallQuestionCard from '@/components/recall/RecallQuestionCard.vue'
import RecallProgress     from '@/components/recall/RecallProgress.vue'
import RecallSummary      from '@/components/recall/RecallSummary.vue'

import { MICROCONTROLLERS_SESSION } from '@/mocks/recallQuestions.js'
import { evaluateSession }          from '@/mocks/recallEvaluations.js'

const props = defineProps({
  conceptId:   { type: String, default: null },
  conceptName: { type: String, default: null },
})

const emit = defineEmits(['close'])

const conceptId   = computed(() => props.conceptId || 'microcontrollers')
const conceptName = computed(() => props.conceptName || 'Microcontrollers')

// ── Question data ─────────────────────────────────────────────────────────
// For now only one session exists; a future version would select by conceptId.
const questions = MICROCONTROLLERS_SESSION

// ── Session state ─────────────────────────────────────────────────────────
const phase         = ref('questions')  // 'questions' | 'summary'
const currentIndex  = ref(0)
const responses     = ref({})           // { [questionId]: string }
const selections    = ref({})           // { [questionId]: optionId }
const evalResults   = ref(null)         // set on transition to summary

// ── Derived ───────────────────────────────────────────────────────────────
const currentQuestion = computed(() => questions[currentIndex.value] ?? null)
const totalQuestions  = computed(() => questions.length)
const isLastQuestion  = computed(() => currentIndex.value >= totalQuestions.value - 1)

const currentAnswer = computed(() => {
  const q = currentQuestion.value
  if (!q) return ''
  if (q.type === 'short-answer') return responses.value[q.id] ?? ''
  return selections.value[q.id] ?? ''
})

const isCurrentAnswerComplete = computed(() => {
  const q = currentQuestion.value
  if (!q) return false
  if (q.type === 'short-answer') return (responses.value[q.id] ?? '').trim().length > 0
  return !!(selections.value[q.id])
})

// ── Answer handlers ───────────────────────────────────────────────────────
function onShortAnswerUpdate(text) {
  if (!currentQuestion.value) return
  responses.value = { ...responses.value, [currentQuestion.value.id]: text }
}

function onOptionSelect(optionId) {
  if (!currentQuestion.value) return
  selections.value = { ...selections.value, [currentQuestion.value.id]: optionId }
}

// ── Navigation ────────────────────────────────────────────────────────────
let navigating = false  // debounce double-click

function onNext() {
  if (navigating || !isCurrentAnswerComplete.value) return
  navigating = true
  setTimeout(() => { navigating = false }, 300)

  if (isLastQuestion.value) {
    // Transition to summary
    evalResults.value = evaluateSession(questions, responses.value, selections.value)
    phase.value = 'summary'
  } else {
    currentIndex.value++
  }
}

// ── Practice Again ────────────────────────────────────────────────────────
function onPracticeAgain() {
  responses.value   = {}
  selections.value  = {}
  evalResults.value = null
  currentIndex.value = 0
  phase.value = 'questions'
}

// ── Close / exit ──────────────────────────────────────────────────────────
function onClose() {
  emit('close')
}
</script>

<template>
  <div class="rsv">

    <!-- ── Header (Recall + concept name + close button) ── -->
    <RecallHeader
      :concept-name="conceptName"
      :phase="phase"
      @close="onClose"
    />

    <!-- ── Question phase ── -->
    <template v-if="phase === 'questions'">
      <div class="rsv__body">

        <!-- Layered question card (centred in the content area) -->
        <RecallQuestionCard
          :question="currentQuestion"
          :response="responses[currentQuestion?.id] ?? ''"
          :selected-option="selections[currentQuestion?.id] ?? null"
          @update:response="onShortAnswerUpdate"
          @update:selected-option="onOptionSelect"
        />

        <!-- Progress label (lower-left) + Next/Done button (lower-right) -->
        <RecallProgress
          :current="currentIndex + 1"
          :total="totalQuestions"
          :is-last="isLastQuestion"
          :can-advance="isCurrentAnswerComplete"
          @next="onNext"
        />

      </div>
    </template>

    <!-- ── Summary phase ── -->
    <template v-else-if="phase === 'summary'">
      <RecallSummary
        :concept-name="conceptName"
        :total="totalQuestions"
        :eval-results="evalResults"
        @practice-again="onPracticeAgain"
        @close="onClose"
      />
    </template>

  </div>
</template>

<style scoped>
/* ─── Root — fills the AppLayout main area ───────────────────────────────── */
.rsv {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  box-sizing: border-box;
}

/* ─── Body — holds the centred card + progress row ──────────────────────── */
.rsv__body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  /* Don't center vertically — let the card fill from top to progress bar */
  justify-content: flex-start;
  padding: 24px 40px 28px;
  gap: 0;
  position: relative;
}

@media (max-width: 1024px) {
  .rsv__body {
    padding: 20px 32px 24px;
  }
}

@media (max-width: 680px) {
  .rsv__body {
    padding: 12px 16px 16px;
  }
}
</style>
