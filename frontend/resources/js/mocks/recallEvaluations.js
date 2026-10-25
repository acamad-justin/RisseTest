/**
 * recallEvaluations.js
 *
 * ⚠  DEMO DATA — deterministic mock evaluation results.
 *    These are NOT AI-generated or semantically analysed responses.
 *    A future evaluation service can replace this module without
 *    requiring any UI changes.
 *
 * evaluateSession(questions, responses, selectedOptions)
 *   → { results: QuestionResult[], understoodCount, practiceCount }
 *
 * For the Microcontrollers demo session the mock produces 8 understood
 * and 2 needing more practice (questions mc-q01 and mc-q05).
 */

/**
 * Question IDs that are configured to need more practice in the demo.
 * All other answered questions are marked as understood.
 */
const NEEDS_PRACTICE_IDS = new Set(['mc-q01', 'mc-q05'])

/**
 * Per-question summary labels used in the session summary screen.
 * Keys must match question IDs in recallQuestions.js.
 */
export const QUESTION_SUMMARIES = {
  'mc-q01': {
    title: 'Microcontroller vs motor driver',
    explanation: 'The distinction between logic-level control and power delivery is worth revisiting.',
    cardRef: 'Card 1 · Short Answer',
  },
  'mc-q02': {
    title: 'The role of a microcontroller',
    explanation: 'Good understanding of how the MCU processes sensor input and drives outputs.',
    cardRef: 'Card 2 · Multiple Choice',
  },
  'mc-q03': {
    title: 'GPIO vs ADC pins',
    explanation: 'Correctly distinguished digital and analogue interfaces.',
    cardRef: 'Card 3 · Short Answer',
  },
  'mc-q04': {
    title: 'Bootloader function',
    explanation: 'Understood the bootloader\'s role in firmware upload.',
    cardRef: 'Card 4 · Multiple Choice',
  },
  'mc-q05': {
    title: 'I²C vs SPI — connecting sensing to action',
    explanation: 'The specific trade-offs between the two protocols deserve more attention.',
    cardRef: 'Card 5 · Short Answer',
  },
  'mc-q06': {
    title: 'Interrupt-driven programming',
    explanation: 'Correctly identified lower latency as the key advantage.',
    cardRef: 'Card 6 · Multiple Choice',
  },
  'mc-q07': {
    title: 'How programmed logic guides actions',
    explanation: 'Good explanation of PWM and servo angular positioning.',
    cardRef: 'Card 7 · Short Answer',
  },
  'mc-q08': {
    title: 'SRAM — inputs, instructions, and outputs',
    explanation: 'Solid understanding of runtime memory use.',
    cardRef: 'Card 8 · Multiple Choice',
  },
  'mc-q09': {
    title: 'Connecting sensor input to a programmed response',
    explanation: 'Demonstrated solid diagnostic reasoning for encoder issues.',
    cardRef: 'Card 9 · Short Answer',
  },
  'mc-q10': {
    title: 'Clock speed and PID loops',
    explanation: 'Understood how execution frequency affects control loop responsiveness.',
    cardRef: 'Card 10 · Multiple Choice',
  },
}

/**
 * Evaluate a completed session and return per-question results plus totals.
 *
 * @param {Array}  questions       — question objects from recallQuestions.js
 * @param {Object} responses       — { [questionId]: string } for short-answer
 * @param {Object} selectedOptions — { [questionId]: string } for multiple-choice
 * @returns {{ results: Array, understoodCount: number, practiceCount: number }}
 */
export function evaluateSession(questions, responses, selectedOptions) {
  const results = questions.map(q => {
    const hasAnswer =
      q.type === 'short-answer'
        ? !!(responses[q.id] ?? '').trim()
        : !!(selectedOptions[q.id])

    // A question with no answer at all is always marked as needing practice.
    const needsPractice = !hasAnswer || NEEDS_PRACTICE_IDS.has(q.id)

    return {
      questionId: q.id,
      understood: !needsPractice,
      summary: QUESTION_SUMMARIES[q.id] ?? {
        title: q.category,
        explanation: '',
        cardRef: '',
      },
    }
  })

  const understoodCount = results.filter(r => r.understood).length
  const practiceCount   = results.filter(r => !r.understood).length

  return { results, understoodCount, practiceCount }
}
