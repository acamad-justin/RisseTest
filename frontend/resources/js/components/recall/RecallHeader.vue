<script setup>
/**
 * RecallHeader.vue
 *
 * Top strip of the Recall Practice experience.
 *
 * Questions phase:
 *   Left  — "Recall" bold white heading, concept name in orange below it.
 *   Right — × close button.
 *
 * Summary phase:
 *   Left  — "Recall Session" heading, "ConceptName • N Cards Completed" in orange.
 *   Right — stats (Answered Well + Need More Practice) with progress bar + × close.
 *
 * Props:
 *   conceptName      string  — e.g. "Microcontrollers"
 *   phase            string  — 'questions' | 'summary'
 *   total            number  — total cards (summary only)
 *   understoodCount  number  — cards answered well (summary only)
 *   practiceCount    number  — cards needing practice (summary only)
 *
 * Emits:
 *   close — user clicked ×
 */
import { computed } from 'vue'

const props = defineProps({
  conceptName:     { type: String, required: true },
  phase:           { type: String, default: 'questions' },
  total:           { type: Number, default: 0 },
  understoodCount: { type: Number, default: 0 },
  practiceCount:   { type: Number, default: 0 },
})

defineEmits(['close'])

const scorePercent = computed(() =>
  props.total > 0 ? Math.round((props.understoodCount / props.total) * 100) : 0
)
</script>

<template>
  <header class="rh" :class="{ 'rh--summary': phase === 'summary' }">
    <!-- Left: heading block -->
    <div class="rh__left">
      <h1 class="rh__title">{{ phase === 'summary' ? 'Recall Session' : 'Recall' }}</h1>
      <p class="rh__concept">
        <template v-if="phase === 'summary'">
          {{ conceptName }} &bull; {{ total }} Cards Completed
        </template>
        <template v-else>
          {{ conceptName }}
        </template>
      </p>
    </div>

    <!-- Summary stats (only in summary phase) -->
    <div v-if="phase === 'summary'" class="rh__stats">
      <div class="rh__stats-row">
        <div class="rh__stat">
          <span class="rh__stat-score">{{ understoodCount }}/{{ total }}</span>
          <span class="rh__stat-label">Answered Well</span>
        </div>
        <div class="rh__stat">
          <span class="rh__stat-score rh__stat-score--practice">{{ practiceCount }}</span>
          <span class="rh__stat-label rh__stat-label--practice">Need More Practice</span>
        </div>
      </div>
      <div class="rh__bar-wrap" aria-hidden="true">
        <div class="rh__bar-fill" :style="{ width: scorePercent + '%' }"></div>
      </div>
    </div>

    <!-- Close button -->
    <button
      class="rh__close"
      type="button"
      aria-label="Exit recall session"
      @click="$emit('close')"
    >
      ×
    </button>
  </header>
</template>

<style scoped>
/* ── Shell ────────────────────────────────────────────────────────────── */
.rh {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 36px 24px 40px;
  flex-shrink: 0;
  gap: 32px;
}

/* ── Left block ───────────────────────────────────────────────────────── */
.rh__left {
  flex-shrink: 0;
}

.rh__title {
  font-family: 'Momo Trust Display', sans-serif;
  font-size: 50px;
  font-weight: 400;
  font-style: normal;
  line-height: 1;
  letter-spacing: 0;
  color: #ffffff;
  vertical-align: middle;
  margin: 0;
}

.rh--summary .rh__title {
  font-family: 'Momo Trust Display', sans-serif;
  font-size: 50px;
  font-weight: 400;
  font-style: normal;
  line-height: 1;
  letter-spacing: 0;
  vertical-align: middle;
}

.rh__concept {
  font-family: 'Lexend', sans-serif;
  font-size: 20px;
  font-weight: 700;
  font-style: normal;
  line-height: 1.2;
  letter-spacing: 0;
  vertical-align: middle;
  color: var(--risse-orange, #FF9000);
  margin: 4px 0 0;
}

.rh--summary .rh__concept {
  font-family: 'Lexend', sans-serif;
  font-size: 20px;
  font-weight: 700;
  font-style: normal;
  line-height: 1.2;
  letter-spacing: 0;
  vertical-align: middle;
}

/* ── Stats (summary only) ─────────────────────────────────────────────── */
.rh__stats {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  justify-content: flex-end;
  align-items: flex-end;
}

.rh__stats-row {
  display: flex;
  align-items: flex-start;
  gap: 28px;
  padding-right: 180px;
}

.rh__stat {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.rh__stat-score {
  font-family: 'Lexend', sans-serif;
  font-size: 30px;
  font-weight: 700;
  font-style: normal;
  line-height: 1.2;
  letter-spacing: 0;
  vertical-align: middle;
  color: #ffffff;
}

.rh__stat-score--practice {
  color: #e04f8a;
}

.rh__stat-label {
  font-family: 'Lexend', sans-serif;
  font-size: 18.54px;
  font-weight: 400;
  font-style: normal;
  line-height: 1.2;
  letter-spacing: 0;
  vertical-align: middle;
  text-transform: capitalize;
  color: rgba(255, 255, 255, 0.65);
}

.rh__stat-label--practice {
  color: #e04f8a;
}

/* Progress bar — spans full width of the stats block */
.rh__bar-wrap {
  width: 50%;
  height: 5px;
  background: #e04f8a;
  border-radius: 999px;
  overflow: hidden;
}

.rh__bar-fill {
  height: 100%;
  background: #ffffff;
  border-radius: 999px;
  transition: width 500ms ease;
}

/* ── Close button ─────────────────────────────────────────────────────── */
.rh__close {
  font-size: 26px;
  line-height: 1;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.80);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0 4px;
  flex-shrink: 0;
  transition: color 150ms ease;
}

.rh__close:hover {
  color: #ffffff;
}

.rh__close:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.5);
  outline-offset: 3px;
  border-radius: 4px;
}

/* ── Responsive ───────────────────────────────────────────────────────── */
@media (max-width: 680px) {
  .rh {
    padding: 20px 20px 0 20px;
    gap: 16px;
  }

  .rh--summary {
    margin: 10px 12px 0;
    padding: 16px 18px;
    flex-wrap: wrap;
  }

  .rh__title { font-size: 36px; }
  .rh--summary .rh__title { font-size: 26px; }

  .rh__stats {
    gap: 8px;
    width: 100%;
    align-items: flex-start;
  }

  .rh__stats-row { gap: 16px; flex-wrap: wrap; }

  .rh__bar-wrap { width: 100%; }
}
</style>
