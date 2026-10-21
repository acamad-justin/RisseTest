<script setup>
/**
 * RecallSummary.vue
 *
 * RECALL_4 — Session summary screen.
 *
 * Layout:
 *   - Right-aligned performance indicator (score + progress bar)
 *   - Large white card: "What you understood" + "What to strengthen"
 *   - Practice Again button at the bottom-right
 *
 * Props:
 *   conceptName  string — concept display name
 *   total        number — total questions answered
 *   evalResults  object — { results, understoodCount, practiceCount }
 *
 * Emits:
 *   practice-again — restart the session
 *   close          — exit recall
 */
import { computed } from 'vue'

const props = defineProps({
  conceptName:  { type: String, required: true },
  total:        { type: Number, required: true },
  evalResults:  { type: Object, required: true },
})

defineEmits(['practice-again', 'close'])

const understood = computed(() =>
  props.evalResults.results.filter(r => r.understood)
)
const needsPractice = computed(() =>
  props.evalResults.results.filter(r => !r.understood)
)

const scorePercent = computed(() =>
  Math.round((props.evalResults.understoodCount / props.total) * 100)
)
</script>

<template>
  <div class="rs">

    <!-- ── Performance strip (right-aligned) ─────────────────────────── -->
    <div class="rs__perf">
      <div class="rs__perf-left">
        <span class="rs__score">{{ evalResults.understoodCount }}/{{ total }}</span>
        <span class="rs__score-label">Answered Well</span>
      </div>
      <div class="rs__perf-right">
        <span class="rs__practice-count">{{ evalResults.practiceCount }}</span>
        <span class="rs__practice-label">Need More Practice</span>
      </div>
      <div class="rs__bar-wrap">
        <div
          class="rs__bar-fill"
          :style="{ width: scorePercent + '%' }"
        ></div>
      </div>
    </div>

    <!-- ── Main summary card ──────────────────────────────────────────── -->
    <div class="rs__card">

      <!-- What you understood -->
      <section class="rs__section" aria-labelledby="rs-understood">
        <h3 class="rs__section-title" id="rs-understood">What you understood</h3>
        <ul class="rs__entries" aria-label="Concepts understood">
          <li
            v-for="r in understood"
            :key="r.questionId"
            class="rs__entry"
          >
            <div class="rs__entry-body">
              <p class="rs__entry-title rs__entry-title--understood">{{ r.summary.title }}</p>
              <p class="rs__entry-desc">{{ r.summary.explanation }}</p>
            </div>
            <span class="rs__entry-ref">{{ r.summary.cardRef }}</span>
          </li>
        </ul>
      </section>

      <!-- Divider -->
      <div class="rs__divider" aria-hidden="true"></div>

      <!-- What to strengthen -->
      <section class="rs__section" aria-labelledby="rs-strengthen">
        <h3 class="rs__section-title" id="rs-strengthen">What to strengthen</h3>
        <ul class="rs__entries" aria-label="Areas needing more practice">
          <li
            v-for="r in needsPractice"
            :key="r.questionId"
            class="rs__entry"
          >
            <div class="rs__entry-body">
              <p class="rs__entry-title rs__entry-title--practice">{{ r.summary.title }}</p>
              <p class="rs__entry-desc">{{ r.summary.explanation }}</p>
            </div>
            <span class="rs__entry-ref">{{ r.summary.cardRef }}</span>
          </li>
        </ul>
      </section>

    </div>

    <!-- ── Practice Again button ──────────────────────────────────────── -->
    <div class="rs__actions">
      <button
        class="rs__practice-btn"
        type="button"
        @click="$emit('practice-again')"
      >
        Practice Again
      </button>
    </div>

  </div>
</template>

<style scoped>
/* ── Root ─────────────────────────────────────────────────────────────── */
.rs {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 36px 28px;
  gap: 0;
  overflow: hidden;
  box-sizing: border-box;
}

/* ── Performance strip ────────────────────────────────────────────────── */
.rs__perf {
  width: 100%;
  max-width: 700px;
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 16px;
  flex-shrink: 0;
  justify-content: flex-end;
}

.rs__perf-left {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.rs__score {
  font-size: 26px;
  font-weight: 700;
  color: #ffffff;
  line-height: 1;
}

.rs__score-label {
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.65);
}

.rs__perf-right {
  display: flex;
  align-items: baseline;
  gap: 5px;
}

.rs__practice-count {
  font-size: 22px;
  font-weight: 700;
  color: #e04f8a;
  line-height: 1;
}

.rs__practice-label {
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.55);
}

.rs__bar-wrap {
  flex: 1;
  max-width: 160px;
  height: 5px;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  overflow: hidden;
}

.rs__bar-fill {
  height: 100%;
  background: #ffffff;
  border-radius: 999px;
  transition: width 500ms ease;
}

/* ── Summary card ─────────────────────────────────────────────────────── */
.rs__card {
  width: 100%;
  max-width: 700px;
  background: #ffffff;
  border-radius: 22px;
  box-shadow: 0 8px 36px rgba(0, 0, 0, 0.20), 0 2px 8px rgba(0, 0, 0, 0.10);
  padding: 0;
  box-sizing: border-box;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.12) transparent;
}

/* ── Sections ─────────────────────────────────────────────────────────── */
.rs__section {
  padding: 20px 26px 4px;
}

.rs__section-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #b0aac0;
  margin: 0 0 12px;
}

/* ── Divider ──────────────────────────────────────────────────────────── */
.rs__divider {
  height: 1px;
  background: #eeeaf5;
  margin: 6px 26px;
}

/* ── Entry list ───────────────────────────────────────────────────────── */
.rs__entries {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.rs__entry {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.rs__entry:last-child {
  border-bottom: none;
}

.rs__entry-body {
  flex: 1;
  min-width: 0;
}

.rs__entry-title {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  margin: 0 0 3px;
}

.rs__entry-title--understood {
  color: #1a1630;
}

.rs__entry-title--practice {
  color: #e04f8a;
}

.rs__entry-desc {
  font-size: 11.5px;
  color: #8a84a0;
  line-height: 1.45;
  margin: 0;
}

.rs__entry-ref {
  font-size: 10px;
  font-weight: 500;
  color: #c0bcd0;
  white-space: nowrap;
  flex-shrink: 0;
  margin-top: 2px;
}

/* ── Actions row ──────────────────────────────────────────────────────── */
.rs__actions {
  width: 100%;
  max-width: 700px;
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  flex-shrink: 0;
}

.rs__practice-btn {
  padding: 11px 28px;
  border-radius: 999px;
  background: var(--risse-orange, #FF9000);
  color: #ffffff;
  font-size: 13.5px;
  font-weight: 700;
  letter-spacing: 0.02em;
  border: none;
  cursor: pointer;
  transition: background 150ms ease, transform 120ms ease;
}

.rs__practice-btn:hover {
  background: var(--risse-orange-active, #F36F00);
}

.rs__practice-btn:active {
  transform: scale(0.97);
}

.rs__practice-btn:focus-visible {
  outline: 3px solid rgba(255, 144, 0, 0.40);
  outline-offset: 2px;
}

/* ── Responsive ───────────────────────────────────────────────────────── */
@media (max-width: 680px) {
  .rs {
    padding: 14px 16px 20px;
  }

  .rs__perf {
    gap: 12px;
    flex-wrap: wrap;
    justify-content: flex-start;
  }

  .rs__bar-wrap { max-width: 100px; }

  .rs__section { padding: 16px 18px 4px; }
  .rs__divider { margin: 4px 18px; }
}
</style>
