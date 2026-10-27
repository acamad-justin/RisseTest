<script setup>
/**
 * RecallSummary.vue
 *
 * RECALL_4 — Session summary screen.
 *
 * Layout:
 *   - Large white card: "What you understood" + "What to strengthen"
 *   - Practice Again button at the bottom-right (overlaid on the backdrop)
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
</script>

<template>
  <div class="rs">

    <!-- ── Main summary card ────────────────────────────────────────────── -->
    <div class="rs__card">

      <!-- What you understood -->
      <section class="rs__section" aria-labelledby="rs-understood">
        <h3 class="rs__section-title rs__section-title--understood" id="rs-understood">
          What you understood
        </h3>
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

      <!-- Spacer between sections -->
      <div class="rs__gap" aria-hidden="true"></div>

      <!-- What to strengthen -->
      <section class="rs__section" aria-labelledby="rs-strengthen">
        <h3 class="rs__section-title rs__section-title--practice" id="rs-strengthen">
          What to strengthen
        </h3>
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

    <!-- ── Practice Again button (bottom-right, outside card) ─────────── -->
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
  padding: 24px 40px 32px;
  gap: 0;
  overflow: hidden;
  box-sizing: border-box;
}

/* ── Summary card ─────────────────────────────────────────────────────── */
.rs__card {
  width: 1453px;
  max-width: 100%;
  height: 758px;
  background: #ffffff;
  border-radius: 40px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.18), 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 32px 40px 28px;
  box-sizing: border-box;
  flex-shrink: 0;
}

/* ── Section titles ───────────────────────────────────────────────────── */
.rs__section {
  padding: 0;
}

.rs__section-title {
  font-family: 'Lexend', sans-serif;
  font-size: 20px;
  font-weight: 700;
  font-style: normal;
  line-height: 1.2;
  letter-spacing: 0;
  vertical-align: middle;
  text-transform: none;
  margin: 0 0 16px;
}

.rs__section-title--understood, 
.rs__section-title--practice {
  color: #7678ED;
}

/* ── Gap between sections ─────────────────────────────────────────────── */
.rs__gap {
  height: 28px;
}

/* ── Entry list ───────────────────────────────────────────────────────── */
.rs__entries {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  max-height: 220px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.12) transparent;
}

.rs__entry {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: 14px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.rs__entry:last-child {
  border-bottom: none;
}

.rs__entry-body {
  flex: 1;
  min-width: 0;
}

.rs__entry-title {
  font-family: 'Lexend', sans-serif;
  font-size: 18px;
  font-weight: 500;
  line-height: 1.3;
  margin: 0 0 4px;
}

.rs__entry-title--understood {
  color: #1a1630;
}

.rs__entry-title--practice {
  color: #e04f8a;
}

.rs__entry-desc {
  font-family: 'Lexend', sans-serif;
  font-size: 12.5px;
  font-weight: 400;
  color: #8a84a0;
  line-height: 1.5;
  margin: 0;
  max-width: 680px;
}

.rs__entry-ref {
  font-family: 'Lexend', sans-serif;
  font-size: 12px;
  font-weight: 400;
  color: #b0aac0;
  white-space: nowrap;
  flex-shrink: 0;
  margin-top: 4px;
}

/* ── Actions row ──────────────────────────────────────────────────────── */
.rs__actions {
  width: 1453px;
  max-width: 100%;
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
  flex-shrink: 0;
}

.rs__practice-btn {
  padding: 12px 32px;
  border-radius: 999px;
  background: #7678ED;
  color: #ffffff;
  font-family: 'Lexend', sans-serif;
  font-size: 14px;
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

/* ── Responsive ───────────────────────────────────────────────────────── */@media (max-width: 680px) {
  .rs { padding: 12px 16px 20px; }

  .rs__card {
    padding: 24px 20px 20px;
    border-radius: 18px;
  }

  .rs__entry-title { font-size: 15px; }
  .rs__entry-ref   { font-size: 11px; }
  .rs__gap         { height: 20px; }
}
</style>
