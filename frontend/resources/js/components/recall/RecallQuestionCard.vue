<script setup>
/**
 * RecallQuestionCard.vue
 *
 * The main question card with layered depth effect.
 *
 * Visual structure:
 *   - Two purple/blue-violet rounded surfaces peeking out behind the top edge
 *   - Large white rounded front card containing the question and answer field
 *
 * Props:
 *   question        Object  — current question from recallQuestions.js
 *   response        string  — current short-answer text
 *   selectedOption  string  — currently selected MC option id
 *
 * Emits:
 *   update:response         — short-answer text changed
 *   update:selectedOption   — MC option selected
 */
import RecallShortAnswer   from './RecallShortAnswer.vue'
import RecallMultipleChoice from './RecallMultipleChoice.vue'

defineProps({
  question:       { type: Object, required: true  },
  response:       { type: String, default: ''     },
  selectedOption: { type: String, default: null   },
})

defineEmits(['update:response', 'update:selectedOption'])
</script>

<template>
  <div class="rqc">
    <!-- ── Layered depth surfaces — peeking behind the top of the white card ── -->
    <div class="rqc__layer rqc__layer--back"  aria-hidden="true"></div>
    <div class="rqc__layer rqc__layer--mid"   aria-hidden="true"></div>

    <!-- ── White front card ──────────────────────────────────────────────── -->
    <div class="rqc__card" role="region" :aria-label="`Question: ${question.text}`">

      <!-- Category label -->
      <p class="rqc__category">{{ question.category }}</p>

      <!-- Question text -->
      <h2 class="rqc__question">{{ question.text }}</h2>

      <!-- Answer input — type-dependent -->
      <RecallShortAnswer
        v-if="question.type === 'short-answer'"
        :model-value="response"
        @update:model-value="$emit('update:response', $event)"
      />

      <RecallMultipleChoice
        v-else-if="question.type === 'multiple-choice'"
        :options="question.options"
        :selected-option="selectedOption"
        @update:selected-option="$emit('update:selectedOption', $event)"
      />

    </div>
  </div>
</template>

<style scoped>
/* ── Wrapper — contains the stacked layers ────────────────────────────── */
.rqc {
  position: relative;
  width: 100%;
  /* Responsive: fills available width up to a comfortable max on wide screens */
  max-width: min(860px, 100%);
  /* Margin-top creates visual space for the peek-behind layers */
  margin-top: 28px;
  /* Allow the card to grow and consume available flex height */
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* ── Depth layers — peeking out from behind the top of the white card ── */
.rqc__layer {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 22px;
  pointer-events: none;
}

/* Back layer — deepest, darkest violet, offset furthest */
.rqc__layer--back {
  width: calc(100% - 48px);
  height: 60px;
  top: -22px;
  background: linear-gradient(160deg, #4a3899 0%, #6248c8 100%);
  box-shadow: 0 4px 18px rgba(74, 56, 153, 0.45);
  z-index: 1;
}

/* Mid layer — slightly lighter, less offset */
.rqc__layer--mid {
  width: calc(100% - 24px);
  height: 54px;
  top: -12px;
  background: linear-gradient(160deg, #6352c0 0%, #7b6ed8 100%);
  box-shadow: 0 4px 14px rgba(99, 82, 192, 0.35);
  z-index: 2;
}

/* ── White front card ─────────────────────────────────────────────────── */
.rqc__card {
  position: relative;
  z-index: 3;
  background: #ffffff;
  border-radius: 22px;
  padding: 32px 36px 28px;
  box-sizing: border-box;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.18),
    0 2px 8px  rgba(0, 0, 0, 0.10);
  display: flex;
  flex-direction: column;
  /* Fills the available wrapper height; internal scroll if content exceeds */
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.12) transparent;
}

/* ── Category label ───────────────────────────────────────────────────── */
.rqc__category {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #b0aac0;
  margin: 0 0 14px;
  flex-shrink: 0;
}

/* ── Question text ────────────────────────────────────────────────────── */
.rqc__question {
  font-size: 18px;
  font-weight: 600;
  color: #1a1630;
  line-height: 1.55;
  margin: 0;
  flex-shrink: 0;
}

/* ── Responsive ───────────────────────────────────────────────────────── */
@media (max-width: 1024px) {
  .rqc { max-width: min(720px, 100%); }
}

@media (max-width: 680px) {
  .rqc {
    margin-top: 20px;
    max-width: 100%;
  }

  .rqc__layer--back { width: calc(100% - 28px); height: 44px; top: -16px; }
  .rqc__layer--mid  { width: calc(100% - 14px); height: 40px; top: -9px;  }

  .rqc__card {
    padding: 22px 22px 20px;
  }

  .rqc__question { font-size: 16px; }
}
</style>
