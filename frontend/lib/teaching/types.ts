// lib/teaching/types.ts
/**
 * Core TypeScript definitions for the RISSE Teaching Strategy Selector (TSS).
 * Implements strongly typed data models for teaching strategies, tutoring states,
 * assistance levels, safety evaluation, and structured teaching decisions.
 */

export const TEACHING_MODES = [
  'DISCOVERY',
  'FOUNDATION',
  'GUIDED_ASSISTANCE',
  'ENGINEERING_LAB',
  'MASTERY',
] as const;

export type TeachingMode = typeof TEACHING_MODES[number];

export const ASSISTANCE_LEVELS = [1, 2, 3, 4, 5] as const;
export type AssistanceLevel = typeof ASSISTANCE_LEVELS[number];

export const TUTORING_STATES = [
  'DIAGNOSE',
  'QUESTION',
  'HINT',
  'EXPLAIN',
  'EXAMPLE',
  'PRACTICE',
  'ASSESS',
  'REVEAL',
  'REFLECT',
] as const;

export type TutoringState = typeof TUTORING_STATES[number];

export type StudentLevel =
  | 'beginner'
  | 'developing'
  | 'intermediate'
  | 'advanced'
  | 'unknown';

export type StudentUnderstanding =
  | 'not_demonstrated'
  | 'emerging'
  | 'partial'
  | 'strong'
  | 'uncertain';

export type ResponseStrategy =
  | 'ask_question'
  | 'give_hint'
  | 'explain'
  | 'show_example'
  | 'guide_step'
  | 'give_solution'
  | 'assess'
  | 'troubleshoot'
  | 'safety_intervention';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  id?: string;
}

export interface LearnerMemoryContext {
  studentId?: string;
  generalExperience?: 'novice' | 'intermediate' | 'advanced';
  learningPreferences?: {
    hintStyle?: string;
    tone?: string;
    handsOnFirst?: boolean;
    stepByStep?: boolean;
    [key: string]: any;
  };
  masteredConcepts?: string[];
  activeMisconceptions?: string[];
  currentCheckpoint?: string;
  progressPercent?: number;
}

export interface SelectorContext {
  messages: ChatMessage[];
  lastUserMessage: string;
  checkpointTitle?: string;
  moduleTitle?: string;
  selectedChatMode: 'socratic' | 'competition';
  retrievedContext?: string;
  learnerMemory?: LearnerMemoryContext;
}

export interface SafetyEvaluationResult {
  isSafe: boolean;
  hazardType?: 'electrical' | 'battery' | 'thermal' | 'mechanical' | 'chemical' | 'general';
  immediateGuidance?: string;
  requiresStop: boolean;
  reasoning: string;
}

export interface TeachingDecision {
  teachingMode: TeachingMode;
  selectedChatMode: 'socratic' | 'competition';
  studentLevel: StudentLevel;
  targetConcept: string;
  understanding: StudentUnderstanding;
  detectedMisconceptions: string[];
  assistanceLevel: AssistanceLevel;
  tutoringState: TutoringState;
  responseStrategy: ResponseStrategy;
  shouldAskSocraticQuestion: boolean;
  shouldRevealSolution: boolean;
  requiresSafetyIntervention: boolean;
  requiresAssessment: boolean;
  useRetrievedContext: boolean;
  userSafeReasoningSummary: string;
  nextSuggestedAction: string;
  learnerProfileSummary?: string;
}

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
  fallbackApplied: boolean;
  warning?: string;
}
