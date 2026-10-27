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
  width: 1453px;
  max-width: 100%;
  margin-top: 28px;
  flex: 1;
  min-height: 623px;
  display: flex;
  flex-direction: column;
  padding-top: 90px;
  padding-bottom: 20px
}

/* ── Depth layers — peeking out from behind the top of the white card ── */
.rqc__layer {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 40px;
  pointer-events: none;
}

/* Back layer — deepest, darkest violet, offset furthest */
.rqc__layer--back {
  width: calc(100% - 48px);
  height: 500px;
  top: 20px;
  background: linear-gradient(160deg, #4a3899 0%, #6248c8 100%);
  box-shadow: 0px 0px 12.6px 4px #FFFFFF4D;
  z-index: 1;
}

/* Mid layer — slightly lighter, less offset */
.rqc__layer--mid {
  width: calc(100% - 24px);
  height: 500px;
  top: 50px;
  background: linear-gradient(160deg, #6352c0 0%, #7b6ed8 100%);
  box-shadow: 0px 0px 12.6px 4px #FFFFFF4D;
  z-index: 2;
}

/* ── White front card ─────────────────────────────────────────────────── */
.rqc__card {
  position: relative;
  z-index: 3;
  background: #ffffff;
  border-radius: 40px;
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
  font-family: 'Lexend', sans-serif;
  font-size: 13.37px;
  font-weight: 400;
  font-style: normal;
  line-height: 1.2;
  letter-spacing: 0;
  vertical-align: middle;
  color: #b0aac0;
  margin: 0 0 14px;
  flex-shrink: 0;
}

/* ── Question text ────────────────────────────────────────────────────── */
.rqc__question {
  font-family: 'Lexend', sans-serif;
  font-size: 35px;
  font-weight: 400;
  font-style: normal;
  line-height: 1.2;
  letter-spacing: 0;
  vertical-align: middle;
  color: #1a1630;
  margin: 0;
  flex-shrink: 0;
}

/* ── Responsive ───────────────────────────────────────────────────────── */
@media (max-width: 1024px) {
  .rqc { width: 100%; }
}

@media (max-width: 680px) {
  .rqc {
    margin-top: 20px;
    width: 100%;
    min-height: 400px;
  }

  .rqc__layer--back { width: calc(100% - 28px); height: 44px; top: -16px; }
  .rqc__layer--mid  { width: calc(100% - 14px); height: 40px; top: -9px;  }

  .rqc__card {
    padding: 22px 22px 20px;
    border-radius: 28px;
  }

  .rqc__question { font-size: 24px; }
}
</style>
