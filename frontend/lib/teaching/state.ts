// lib/teaching/state.ts
/**
 * Progressive Assistance Engine & Lightweight Tutoring State Manager.
 * Analyzes conversation turns to reconstruct student struggle patterns,
 * consecutive attempts, assistance escalation, and anti-frustration transitions.
 */

import type { AssistanceLevel, ChatMessage, TutoringState } from './types.ts';

export interface StateAnalysisResult {
  tutoringState: TutoringState;
  assistanceLevel: AssistanceLevel;
  unsuccessfulAttempts: number;
  isStuck: boolean;
  isDirectExplanationRequested: boolean;
  isMasteryDemonstrated: boolean;
  explanationReason: string;
}

const STUCK_PATTERNS = [
  /\b(i'?m|i\s*am)\s*(stuck|lost|confused)\b/i,
  /\b(i\s*don'?t|i\s*do\s*not)\s*(understand|get\s*it|know|have\s*any\s*idea)\b/i,
  /\b(di\s*(ko|natin)\s*(gets?|maintindihan|alam))\b/i,
  /\b(nalilito\s*(ako)?|gulo\s*ng\s*isip)\b/i,
  /\b(no\s*idea|clueless|can'?t\s*figure\s*this\s*out|cannot\s*figure\s*this\s*out)\b/i,
  /\b(idk|dunno)\b/i,
];

const DIRECT_EXPLANATION_PATTERNS = [
  /\b(can\s*you\s*(just)?\s*explain(\s*how\s*this\s*works)?)\b/i,
  /\b(just\s*(explain|tell\s*me|give\s*me\s*the\s*answer|walk\s*me\s*through))\b/i,
  /\b(please\s*explain(\s*it)?)\b/i,
  /\b(paki-?\s*explain|ipaliwanag\s*mo\s*nga)\b/i,
  /\b(what\s*does\s*this\s*actually\s*mean)\b/i,
];

const MASTERY_PATTERNS = [
  /\b(so\s*that\s*means|because|therefore|since\s*the\s*formula)\b/i,
  /\b(torque\s*=\s*force\s*[*x]\s*distance|gear\s*ratio\s*=\s*\d+[:/]\d+)\b/i,
  /\b(i\s*understand\s*now|now\s*i\s*get\s*it|that\s*makes\s*sense)\b/i,
  /\b(sensors?.*(microcontrollers?|processors?|computation).*actuators?)\b/i,
  /\b(integrat(ing|es?).*sensors?.*actuators?)\b/i,
  /\b(perception.*(computation|processing).*actuation)\b/i,
  /\b(closed[- ]loop\s*control|pid|encoder\s*feedback)\b/i,
];

/**
 * Analyzes the recent conversation history and student message to derive
 * the tutoring state, assistance level, and anti-frustration guardrails.
 */
export function analyzeTutoringState(
  messages: ChatMessage[],
  lastUserMessage: string
): StateAnalysisResult {
  const cleanLast = lastUserMessage.trim();

  // 1. Check for explicit request for direct explanation
  const isDirectExplanationRequested = DIRECT_EXPLANATION_PATTERNS.some(p => p.test(cleanLast));

  // 2. Count consecutive struggle or negative signals in user turns
  let unsuccessfulAttempts = 0;
  let isStuck = STUCK_PATTERNS.some(p => p.test(cleanLast));

  // Walk backwards through user messages to count consecutive struggles
  const userMessages = messages.filter(m => m.role === 'user');
  for (let i = userMessages.length - 1; i >= 0; i--) {
    const text = userMessages[i].content;
    const isStruggleMsg = STUCK_PATTERNS.some(p => p.test(text)) ||
      /\b(wrong|incorrect|not\s*working|failed|still\s*error|still\s*don'?t)\b/i.test(text);

    if (isStruggleMsg) {
      unsuccessfulAttempts++;
    } else {
      // Break once a confident or different intent message is reached
      if (i < userMessages.length - 1) break;
    }
  }

  // 3. Check for demonstrated mastery / correct reasoning
  const isMasteryDemonstrated = MASTERY_PATTERNS.some(p => p.test(cleanLast)) &&
    cleanLast.length > 25 &&
    !isStuck;

  // 4. Determine Tutoring State & Assistance Level with Anti-Frustration Rules
  let tutoringState: TutoringState = 'QUESTION';
  let assistanceLevel: AssistanceLevel = 1;
  let explanationReason = '';

  if (isDirectExplanationRequested) {
    // ANTI-WITHHOLDING RULE: Direct explanation requests must be honored
    tutoringState = 'EXPLAIN';
    assistanceLevel = 4;
    explanationReason = 'Student explicitly requested a direct conceptual explanation. Avoid withholding.';
  } else if (unsuccessfulAttempts >= 2 || (isStuck && unsuccessfulAttempts >= 1)) {
    // ANTI-FRUSTRATION RULE: 2 or more failed attempts -> Escalate to explanation/example
    tutoringState = 'EXPLAIN';
    assistanceLevel = 3;
    explanationReason = `Student has ${unsuccessfulAttempts} unsuccessful attempts. Transitioning from Socratic questioning to moderate conceptual explanation to prevent frustration.`;
  } else if (isStuck) {
    // First time stuck -> Light hint
    tutoringState = 'HINT';
    assistanceLevel = 2;
    explanationReason = 'Student indicated difficulty. Providing a lightweight conceptual hint or real-world analogy.';
  } else if (isMasteryDemonstrated) {
    // Mastery shown -> Advance to practice or challenge assessment
    tutoringState = 'ASSESS';
    assistanceLevel = 1;
    explanationReason = 'Student demonstrated solid understanding of principles. Advancing to higher-order application check.';
  } else {
    // Standard progression: Guided inquiry
    tutoringState = 'QUESTION';
    assistanceLevel = 1;
    explanationReason = 'Normal learning progression: Guiding student through active inquiry with a single focused question.';
  }

  return {
    tutoringState,
    assistanceLevel,
    unsuccessfulAttempts,
    isStuck,
    isDirectExplanationRequested,
    isMasteryDemonstrated,
    explanationReason,
  };
}
