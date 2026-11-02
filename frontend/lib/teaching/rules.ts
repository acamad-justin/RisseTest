// lib/teaching/rules.ts
/**
 * Deterministic Rules Engine for the Teaching Strategy Selector.
 * Implements deterministic classification of intent, student understanding,
 * target concept extraction, and mapping to the five core teaching modes.
 */

import { analyzeTutoringState } from './state.ts';
import type { StateAnalysisResult } from './state.ts';
import type {
  AssistanceLevel,
  ResponseStrategy,
  SelectorContext,
  StudentLevel,
  StudentUnderstanding,
  TeachingDecision,
  TeachingMode,
  TutoringState,
} from './types.ts';

// Regex patterns for intent classification
const HARDWARE_DEBUG_PATTERNS = [
  /\b(motor|servo|stepper)\s*(is\s*not\s*moving|won'?t\s*spin|not\s*spinning|doesn'?t\s*turn|stalled?|not\s*working)\b/i,
  /\b(sensor|ultrasonic|encoder|gyro|imu|limit\s*switch)\s*(reading\s*0|not\s*detecting|giving\s*wrong|values?\s*erratic|fluctuating)\b/i,
  /\b(troubleshoot|debug|fix|hardware\s*issue|wiring\s*problem|circuit\s*not\s*working)\b/i,
  /\b(chassis\s*(wobbling|unbalanced|pulling\s*to\s*one\s*side)|wheels?\s*slipping)\b/i,
  /\b(robot\s*(won'?t\s*turn\s*on|not\s*responding|losing\s*power))\b/i,
];

const CONCEPT_INTRO_PATTERNS = [
  /\bwhat\s+(is|are)\s+(a\s+|an\s+)?([a-z\s]+)\??$/i,
  /\b(explain|define|introduce)\s+([a-z\s]+)\b/i,
  /\bhow\s+does\s+(a\s+|an\s+)?([a-z\s]+)\s+work\??$/i,
  /\b(ano\s*ang|ano\s*ibig\s*sabihin\s*ng)\s+([a-z\s]+)\??$/i,
];

const GREETING_PATTERNS = [
  /^(hi|hello|hey|kamusta|musta|good\s*(morning|afternoon|evening)|yo|sup|ano\s*meron)\b/i,
];

/**
 * Extracts the primary target robotics concept from context or user query.
 */
export function extractTargetConcept(context: SelectorContext): string {
  const query = context.lastUserMessage.trim();

  // Try extracting from "What is [concept]?"
  const introMatch = query.match(/\bwhat\s+(is|are)\s+(a\s+|an\s+)?([a-z\s0-9-]+?)(?:\?|$)/i);
  if (introMatch && introMatch[3] && introMatch[3].trim().length < 35) {
    return introMatch[3].trim().toLowerCase();
  }

  // Try extracting common robotics concepts
  const commonConcepts = [
    'torque',
    'gear ratio',
    'pwm',
    'center of gravity',
    'pid controller',
    'ultrasonic sensor',
    'encoder',
    'microcontroller',
    'h-bridge',
    'motor driver',
    'differential drive',
    'traction',
    'brownout',
    'closed loop',
    'open loop',
    'dc motor',
    'servo motor',
    'voltage divider',
    'pull-up resistor',
  ];

  for (const concept of commonConcepts) {
    if (new RegExp(`\\b${concept}s?\\b`, 'i').test(query)) {
      return concept;
    }
  }

  // Fallback to active checkpoint title or module
  if (context.checkpointTitle && context.checkpointTitle !== 'Project Notebook Log') {
    return context.checkpointTitle;
  }
  if (context.moduleTitle && context.moduleTitle !== 'Robotics & Control Systems Lab') {
    return context.moduleTitle;
  }

  return 'General Robotics & Systems Engineering';
}

/**
 * Evaluates deterministic rules to produce a strongly typed TeachingDecision.
 */
export function evaluateDeterministicRules(
  context: SelectorContext,
  stateAnalysis: StateAnalysisResult
): TeachingDecision {
  const lastMsg = context.lastUserMessage.trim();
  const targetConcept = extractTargetConcept(context);

  // ── 1. Competition Mode: Preserve High-Stakes Pit Workflow ───────────────
  if (context.selectedChatMode === 'competition') {
    const isDebug = HARDWARE_DEBUG_PATTERNS.some(p => p.test(lastMsg));
    return {
      teachingMode: 'ENGINEERING_LAB',
      selectedChatMode: 'competition',
      studentLevel: 'intermediate',
      targetConcept,
      understanding: 'emerging',
      detectedMisconceptions: [],
      assistanceLevel: 5, // Full direct solutions in Competition Mode
      tutoringState: isDebug ? 'DIAGNOSE' : 'REVEAL',
      responseStrategy: isDebug ? 'troubleshoot' : 'give_solution',
      shouldAskSocraticQuestion: false, // Strict: no guessing games in competition pit
      shouldRevealSolution: true,
      requiresSafetyIntervention: false,
      requiresAssessment: false,
      useRetrievedContext: Boolean(context.retrievedContext),
      userSafeReasoningSummary: 'Competition Mode Active: Providing direct, production-ready engineering triage and complete code without Socratic delay.',
      nextSuggestedAction: 'Implement the pit-fix checklist immediately and test hardware on the practice field.',
    };
  }

  // ── 2. Greetings / Opening Conversational Turns ──────────────────────────
  if (GREETING_PATTERNS.some(p => p.test(lastMsg)) && lastMsg.length < 30) {
    return {
      teachingMode: 'DISCOVERY',
      selectedChatMode: 'socratic',
      studentLevel: 'beginner',
      targetConcept,
      understanding: 'uncertain',
      detectedMisconceptions: [],
      assistanceLevel: 1,
      tutoringState: 'QUESTION',
      responseStrategy: 'ask_question',
      shouldAskSocraticQuestion: true,
      shouldRevealSolution: false,
      requiresSafetyIntervention: false,
      requiresAssessment: false,
      useRetrievedContext: false,
      userSafeReasoningSummary: 'Conversational Greeting: Welcoming learner to the robotics lab and pivoting with one engaging workshop inquiry.',
      nextSuggestedAction: 'Invite the student to name the robot subsystem or concept they want to build or test today.',
    };
  }

  // ── 3. Direct Explanation Request (Anti-Withholding Rule) ────────────────
  if (stateAnalysis.isDirectExplanationRequested) {
    return {
      teachingMode: 'FOUNDATION',
      selectedChatMode: 'socratic',
      studentLevel: 'developing',
      targetConcept,
      understanding: 'emerging',
      detectedMisconceptions: [],
      assistanceLevel: 4,
      tutoringState: 'EXPLAIN',
      responseStrategy: 'explain',
      shouldAskSocraticQuestion: true, // End with one check question after explaining
      shouldRevealSolution: true,
      requiresSafetyIntervention: false,
      requiresAssessment: false,
      useRetrievedContext: Boolean(context.retrievedContext),
      userSafeReasoningSummary: 'Direct Explanation Requested: Providing a clear, intuitive conceptual explanation without withholding, followed by one check question.',
      nextSuggestedAction: 'Explain the mechanism or concept clearly using a real-world analogy and metric units.',
    };
  }

  // ── 4. Repeated Unsuccessful Attempts (Anti-Frustration Rule) ─────────────
  if (stateAnalysis.unsuccessfulAttempts >= 2) {
    return {
      teachingMode: 'FOUNDATION',
      selectedChatMode: 'socratic',
      studentLevel: 'developing',
      targetConcept,
      understanding: 'emerging',
      detectedMisconceptions: ['Repeated difficulty grasping prior hint or calculation'],
      assistanceLevel: 3,
      tutoringState: 'EXPLAIN',
      responseStrategy: 'explain',
      shouldAskSocraticQuestion: true,
      shouldRevealSolution: false,
      requiresSafetyIntervention: false,
      requiresAssessment: false,
      useRetrievedContext: Boolean(context.retrievedContext),
      userSafeReasoningSummary: `Anti-Frustration Escalation: Student experienced ${stateAnalysis.unsuccessfulAttempts} consecutive struggles. Shifting from guessing questions to foundational explanation.`,
      nextSuggestedAction: 'Walk through the core physical relationship and present a concrete numerical example with metric SI units.',
    };
  }

  // ── 5. Student Is Stuck (First-time / Light struggle) ─────────────────────
  if (stateAnalysis.isStuck) {
    return {
      teachingMode: 'GUIDED_ASSISTANCE',
      selectedChatMode: 'socratic',
      studentLevel: 'developing',
      targetConcept,
      understanding: 'partial',
      detectedMisconceptions: [],
      assistanceLevel: 2,
      tutoringState: 'HINT',
      responseStrategy: 'give_hint',
      shouldAskSocraticQuestion: true,
      shouldRevealSolution: false,
      requiresSafetyIntervention: false,
      requiresAssessment: false,
      useRetrievedContext: Boolean(context.retrievedContext),
      userSafeReasoningSummary: 'Guided Assistance: Providing a targeted, bite-sized hint and one scaffolding question.',
      nextSuggestedAction: 'Provide an intuitive analogy and ask the student to identify the primary variable.',
    };
  }

  // ── 6. Practical Hardware Debugging / Troubleshooting ─────────────────────
  const isHardwareDebug = HARDWARE_DEBUG_PATTERNS.some(p => p.test(lastMsg));
  if (isHardwareDebug) {
    return {
      teachingMode: 'ENGINEERING_LAB',
      selectedChatMode: 'socratic',
      studentLevel: 'developing',
      targetConcept,
      understanding: 'emerging',
      detectedMisconceptions: [],
      assistanceLevel: 2,
      tutoringState: 'DIAGNOSE',
      responseStrategy: 'troubleshoot',
      shouldAskSocraticQuestion: true,
      shouldRevealSolution: false,
      requiresSafetyIntervention: false,
      requiresAssessment: false,
      useRetrievedContext: Boolean(context.retrievedContext),
      userSafeReasoningSummary: 'Engineering Lab Diagnostic: Guiding student through systematic root-cause isolation (power, signal, mechanics, or code).',
      nextSuggestedAction: 'Ask student to isolate the most accessible test point (e.g. checking voltage with a multimeter or verifying motor driver LED signals).',
    };
  }

  // ── 7. Concept Introduction ("What is torque?", "What is a sensor?") ──────
  const isConceptIntro = CONCEPT_INTRO_PATTERNS.some(p => p.test(lastMsg));
  if (isConceptIntro) {
    return {
      teachingMode: 'FOUNDATION',
      selectedChatMode: 'socratic',
      studentLevel: 'beginner',
      targetConcept,
      understanding: 'emerging',
      detectedMisconceptions: [],
      assistanceLevel: 2,
      tutoringState: 'QUESTION',
      responseStrategy: 'ask_question',
      shouldAskSocraticQuestion: true,
      shouldRevealSolution: false,
      requiresSafetyIntervention: false,
      requiresAssessment: false,
      useRetrievedContext: Boolean(context.retrievedContext),
      userSafeReasoningSummary: 'Foundational Concept Introduction: Connecting the new term to tangible physical mechanics with a relatable real-world analogy.',
      nextSuggestedAction: 'Introduce the core definition simply and ask how they have experienced this force or signal in everyday life.',
    };
  }

  // ── 8. Demonstrated Mastery / Advanced Reasoning ─────────────────────────
  if (stateAnalysis.isMasteryDemonstrated) {
    return {
      teachingMode: 'MASTERY',
      selectedChatMode: 'socratic',
      studentLevel: 'advanced',
      targetConcept,
      understanding: 'strong',
      detectedMisconceptions: [],
      assistanceLevel: 1,
      tutoringState: 'ASSESS',
      responseStrategy: 'assess',
      shouldAskSocraticQuestion: true,
      shouldRevealSolution: false,
      requiresSafetyIntervention: false,
      requiresAssessment: true,
      useRetrievedContext: Boolean(context.retrievedContext),
      userSafeReasoningSummary: 'Mastery Demonstration: Student demonstrated strong analytical understanding. Presenting an applied engineering challenge.',
      nextSuggestedAction: 'Pose a new design trade-off scenario requiring application of the mastered concept.',
    };
  }

  // ── 9. Default Fallback: Discovery & Scaffolding ─────────────────────────
  return {
    teachingMode: 'DISCOVERY',
    selectedChatMode: 'socratic',
    studentLevel: 'developing',
    targetConcept,
    understanding: 'emerging',
    detectedMisconceptions: [],
    assistanceLevel: 1,
    tutoringState: 'QUESTION',
    responseStrategy: 'ask_question',
    shouldAskSocraticQuestion: true,
    shouldRevealSolution: false,
    requiresSafetyIntervention: false,
    requiresAssessment: false,
    useRetrievedContext: Boolean(context.retrievedContext),
    userSafeReasoningSummary: 'Discovery Inquiry: Guiding student through active robotics inquiry with one focused question.',
    nextSuggestedAction: 'Ask a targeted inquiry question to observe the system and formulate a hypothesis.',
  };
}
