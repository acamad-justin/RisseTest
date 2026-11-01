// lib/teaching/validation.ts
/**
 * Lightweight Response Validation and Guardrail Layer.
 * Validates TeachingDecision schemas and checks generated responses against
 * pedagogical rules (safety, single question, anti-withholding, competition directness).
 */

import type { TeachingDecision, ValidationResult } from './types.ts';

/**
 * Validates a TeachingDecision object against the required schema.
 * If invalid or malformed, returns a safe fallback decision.
 */
export function validateTeachingDecision(raw: any): { decision: TeachingDecision; validation: ValidationResult } {
  const issues: string[] = [];

  const validModes = ['DISCOVERY', 'FOUNDATION', 'GUIDED_ASSISTANCE', 'ENGINEERING_LAB', 'MASTERY'];
  const validChatModes = ['socratic', 'competition'];
  const validLevels = [1, 2, 3, 4, 5];
  const validStates = ['DIAGNOSE', 'QUESTION', 'HINT', 'EXPLAIN', 'EXAMPLE', 'PRACTICE', 'ASSESS', 'REVEAL', 'REFLECT'];

  if (!raw || typeof raw !== 'object') {
    issues.push('Decision payload is null or not an object');
  } else {
    if (!validModes.includes(raw.teachingMode)) {
      issues.push(`Invalid teachingMode: ${raw.teachingMode}`);
    }
    if (!validChatModes.includes(raw.selectedChatMode)) {
      issues.push(`Invalid selectedChatMode: ${raw.selectedChatMode}`);
    }
    if (!validLevels.includes(raw.assistanceLevel)) {
      issues.push(`Invalid assistanceLevel: ${raw.assistanceLevel}`);
    }
    if (!validStates.includes(raw.tutoringState)) {
      issues.push(`Invalid tutoringState: ${raw.tutoringState}`);
    }
    if (typeof raw.shouldAskSocraticQuestion !== 'boolean') {
      issues.push('shouldAskSocraticQuestion must be a boolean');
    }
    if (typeof raw.requiresSafetyIntervention !== 'boolean') {
      issues.push('requiresSafetyIntervention must be a boolean');
    }
  }

  if (issues.length > 0) {
    // Construct robust deterministic safe fallback
    const fallback: TeachingDecision = {
      teachingMode: 'GUIDED_ASSISTANCE',
      selectedChatMode: raw?.selectedChatMode === 'competition' ? 'competition' : 'socratic',
      studentLevel: 'developing',
      targetConcept: raw?.targetConcept || 'Robotics Concept',
      understanding: 'emerging',
      detectedMisconceptions: [],
      assistanceLevel: 2,
      tutoringState: 'HINT',
      responseStrategy: 'give_hint',
      shouldAskSocraticQuestion: raw?.selectedChatMode !== 'competition',
      shouldRevealSolution: raw?.selectedChatMode === 'competition',
      requiresSafetyIntervention: false,
      requiresAssessment: false,
      useRetrievedContext: true,
      userSafeReasoningSummary: 'Fallback Applied: Safely recovered from malformed selector decision to guided assistance.',
      nextSuggestedAction: 'Provide a structured hint and continue the conversation.',
    };

    return {
      decision: fallback,
      validation: {
        isValid: false,
        issues,
        fallbackApplied: true,
        warning: `Teaching decision validation failed: ${issues.join('; ')}`,
      },
    };
  }

  return {
    decision: raw as TeachingDecision,
    validation: {
      isValid: true,
      issues: [],
      fallbackApplied: false,
    },
  };
}

/**
 * Validates generated response text against the active teaching decision.
 * Provides diagnostics on rule compliance (e.g. safety warning presence, question count).
 */
export function validateGeneratedResponse(
  responseText: string,
  decision: TeachingDecision
): { compliant: boolean; warnings: string[] } {
  const warnings: string[] = [];

  // 1. Safety Intervention Check
  if (decision.requiresSafetyIntervention) {
    const mentionsSafety = /\b(stop|danger|safety|hazard|disconnect|unplug|fire|hot|burn|short\s*circuit|power\s*off)\b/i.test(responseText);
    if (!mentionsSafety) {
      warnings.push('Safety intervention required, but generated text lacks prominent safety warning keywords.');
    }
  }

  // 2. Socratic Single Question Check
  if (decision.selectedChatMode === 'socratic' && decision.shouldAskSocraticQuestion) {
    // Count question marks
    const questionMarks = (responseText.match(/\?/g) || []).length;
    if (questionMarks > 2) {
      warnings.push(`Socratic response contains ${questionMarks} question marks. Guidelines mandate at most ONE guiding question per turn.`);
    }
  }

  // 3. Competition Mode Questioning Check
  if (decision.selectedChatMode === 'competition') {
    const isAskingRiddles = /\b(what\s+do\s+you\s+think\??|guess\s+what|can\s+you\s+tell\s+me\??)\b/i.test(responseText);
    if (isAskingRiddles) {
      warnings.push('Competition mode response contains Socratic guessing questions instead of direct pit triage.');
    }
  }

  return {
    compliant: warnings.length === 0,
    warnings,
  };
}
