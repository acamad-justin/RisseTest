// tests/teaching-strategy.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  selectTeachingStrategy,
  buildTeachingDirectives,
  validateTeachingDecision,
  validateGeneratedResponse,
  evaluateSafety,
  analyzeTutoringState,
} from '../lib/teaching/index.ts';
import type { SelectorContext } from '../lib/teaching/types.ts';

describe('RISSE Adaptive Teaching Intelligence — Phase 1 Test Suite', () => {

  // ── Test 1: New learner asking about a core concept ──────────────────────────
  it('Test 1 — New learner ("What is torque?") triggers FOUNDATION or DISCOVERY', async () => {
    const context: SelectorContext = {
      messages: [{ role: 'user', content: 'What is torque?' }],
      lastUserMessage: 'What is torque?',
      checkpointTitle: 'Kinematics & Dynamics',
      moduleTitle: 'Robotics Fundamentals',
      selectedChatMode: 'socratic',
    };

    const decision = await selectTeachingStrategy(context);

    assert.ok(
      decision.teachingMode === 'FOUNDATION' || decision.teachingMode === 'DISCOVERY',
      `Expected FOUNDATION or DISCOVERY, got ${decision.teachingMode}`
    );
    assert.strictEqual(decision.studentLevel, 'beginner');
    assert.strictEqual(decision.targetConcept, 'torque');
    assert.strictEqual(decision.shouldAskSocraticQuestion, true);
    assert.strictEqual(decision.requiresSafetyIntervention, false);

    const directives = buildTeachingDirectives(decision);
    assert.ok(directives.includes('TEACHING STRATEGY:'));
    assert.ok(directives.includes('torque'));
  });

  // ── Test 2: Student is stuck on a calculation ──────────────────────────────
  it('Test 2 — Student is stuck ("I don\'t understand how to calculate gear ratio.") triggers GUIDED_ASSISTANCE', async () => {
    const context: SelectorContext = {
      messages: [
        { role: 'assistant', content: 'What is the number of teeth on the driver gear?' },
        { role: 'user', content: "I don't understand how to calculate gear ratio." },
      ],
      lastUserMessage: "I don't understand how to calculate gear ratio.",
      checkpointTitle: 'Gear Trains',
      moduleTitle: 'Mechanical Design',
      selectedChatMode: 'socratic',
    };

    const decision = await selectTeachingStrategy(context);

    assert.strictEqual(decision.teachingMode, 'GUIDED_ASSISTANCE');
    assert.strictEqual(decision.tutoringState, 'HINT');
    assert.strictEqual(decision.assistanceLevel, 2);
    assert.strictEqual(decision.responseStrategy, 'give_hint');
    assert.strictEqual(decision.shouldAskSocraticQuestion, true);
    assert.strictEqual(decision.targetConcept, 'gear ratio');
  });

  // ── Test 3: Repeated failed attempts trigger anti-frustration ───────────────
  it('Test 3 — Repeated failed attempts trigger increased assistance and explanation (Anti-Frustration Rule)', async () => {
    const context: SelectorContext = {
      messages: [
        { role: 'assistant', content: 'What happens to torque when gear diameter increases?' },
        { role: 'user', content: 'It becomes smaller?' },
        { role: 'assistant', content: 'Think about a long lever. Try again.' },
        { role: 'user', content: "I still don't get it, it failed." },
        { role: 'assistant', content: 'How does lever arm affect rotational force?' },
        { role: 'user', content: "I'm lost, I have no idea." },
      ],
      lastUserMessage: "I'm lost, I have no idea.",
      checkpointTitle: 'Torque & Speed Trade-offs',
      moduleTitle: 'Mechanical Design',
      selectedChatMode: 'socratic',
    };

    const decision = await selectTeachingStrategy(context);

    // After 2+ struggles, anti-frustration escalates to EXPLAIN with Level 3+
    assert.strictEqual(decision.teachingMode, 'FOUNDATION');
    assert.strictEqual(decision.tutoringState, 'EXPLAIN');
    assert.ok(decision.assistanceLevel >= 3, `Expected assistance >= 3, got ${decision.assistanceLevel}`);
    assert.strictEqual(decision.responseStrategy, 'explain');

    const directives = buildTeachingDirectives(decision);
    assert.ok(directives.includes('ANTI-FRUSTRATION RULE ACTIVE'));
  });

  // ── Test 4: Direct explanation request (Anti-Withholding Rule) ─────────────
  it('Test 4 — Direct explanation request ("Can you just explain how this works?") is respected without withholding', async () => {
    const context: SelectorContext = {
      messages: [
        { role: 'assistant', content: 'What do you notice about the sensor voltage?' },
        { role: 'user', content: 'Can you just explain how this works?' },
      ],
      lastUserMessage: 'Can you just explain how this works?',
      checkpointTitle: 'Analog vs Digital Sensors',
      moduleTitle: 'Sensors & Signal Flow',
      selectedChatMode: 'socratic',
    };

    const decision = await selectTeachingStrategy(context);

    assert.strictEqual(decision.teachingMode, 'FOUNDATION');
    assert.strictEqual(decision.tutoringState, 'EXPLAIN');
    assert.strictEqual(decision.assistanceLevel, 4);
    assert.strictEqual(decision.responseStrategy, 'explain');
    assert.strictEqual(decision.shouldRevealSolution, true);

    const directives = buildTeachingDirectives(decision);
    assert.ok(directives.includes('Level 4'));
    assert.ok(directives.includes('EXPLAIN'));
  });

  // ── Test 5: Advanced student demonstrating mastery ──────────────────────────
  it('Test 5 — Advanced student demonstrating correct reasoning triggers MASTERY', async () => {
    const context: SelectorContext = {
      messages: [
        { role: 'assistant', content: 'How would you size the motor for this climbing robot?' },
        {
          role: 'user',
          content: 'Since torque = force * distance, and therefore the required stall torque must exceed the robot weight multiplied by wheel radius, we need at least 1.5 Nm.',
        },
      ],
      lastUserMessage: 'Since torque = force * distance, and therefore the required stall torque must exceed the robot weight multiplied by wheel radius, we need at least 1.5 Nm.',
      checkpointTitle: 'Motor Sizing & Calculations',
      moduleTitle: 'Drivetrain Systems',
      selectedChatMode: 'socratic',
    };

    const decision = await selectTeachingStrategy(context);

    assert.strictEqual(decision.teachingMode, 'MASTERY');
    assert.strictEqual(decision.tutoringState, 'ASSESS');
    assert.strictEqual(decision.studentLevel, 'advanced');
    assert.strictEqual(decision.understanding, 'strong');
    assert.strictEqual(decision.requiresAssessment, true);
  });

  // ── Test 6: Hardware debugging inquiry ──────────────────────────────────────
  it('Test 6 — Hardware debugging ("Motor is not moving") triggers ENGINEERING_LAB', async () => {
    const context: SelectorContext = {
      messages: [
        { role: 'user', content: 'My DC motor is not moving when I trigger the switch.' },
      ],
      lastUserMessage: 'My DC motor is not moving when I trigger the switch.',
      checkpointTitle: 'H-Bridge Motor Drivers',
      moduleTitle: 'Actuators & Power Electronics',
      selectedChatMode: 'socratic',
    };

    const decision = await selectTeachingStrategy(context);

    assert.strictEqual(decision.teachingMode, 'ENGINEERING_LAB');
    assert.strictEqual(decision.tutoringState, 'DIAGNOSE');
    assert.strictEqual(decision.responseStrategy, 'troubleshoot');
    assert.strictEqual(decision.shouldAskSocraticQuestion, true);
  });

  // ── Test 7: Electrical and battery safety hazard ───────────────────────────
  it('Test 7 — Electrical and battery hazard triggers critical safety override', async () => {
    const context: SelectorContext = {
      messages: [
        { role: 'user', content: 'Our 3S LiPo battery is puffed, swollen, and feels burning hot to touch!' },
      ],
      lastUserMessage: 'Our 3S LiPo battery is puffed, swollen, and feels burning hot to touch!',
      checkpointTitle: 'Battery Safety & Power Distribution',
      moduleTitle: 'Power Systems',
      selectedChatMode: 'socratic',
    };

    const decision = await selectTeachingStrategy(context);

    assert.strictEqual(decision.requiresSafetyIntervention, true);
    assert.strictEqual(decision.responseStrategy, 'safety_intervention');
    assert.strictEqual(decision.shouldAskSocraticQuestion, false); // No Socratic questioning during safety hazard
    assert.strictEqual(decision.assistanceLevel, 5);
    assert.ok(decision.userSafeReasoningSummary.includes('SAFETY INTERVENTION'));

    const directives = buildTeachingDirectives(decision);
    assert.ok(directives.includes('CRITICAL SAFETY DIRECTIVE (HIGHEST PRIORITY)'));
    assert.ok(directives.includes('DISCONNECT POWER'));
  });

  // ── Test 8: Competition mode preservation ──────────────────────────────────
  it('Test 8 — Competition mode preserves pit triage with direct technical fixes (no Socratic guessing)', async () => {
    const context: SelectorContext = {
      messages: [
        { role: 'user', content: 'Our intake motor is not moving and match starts in 4 minutes!' },
      ],
      lastUserMessage: 'Our intake motor is not moving and match starts in 4 minutes!',
      checkpointTitle: 'Tournament Pit Diagnostics',
      moduleTitle: 'Competition Triage',
      selectedChatMode: 'competition',
    };

    const decision = await selectTeachingStrategy(context);

    assert.strictEqual(decision.selectedChatMode, 'competition');
    assert.strictEqual(decision.assistanceLevel, 5);
    assert.strictEqual(decision.shouldAskSocraticQuestion, false); // Strict: No guessing games in pit
    assert.strictEqual(decision.shouldRevealSolution, true);

    const directives = buildTeachingDirectives(decision);
    assert.ok(directives.includes('COMPETITION MODE DIRECTIVE'));
    assert.ok(directives.includes('Do NOT ask guessing questions'));
  });

  // ── Test 9: RAG curriculum context utilization ─────────────────────────────
  it('Test 9 — Curriculum-grounded inquiry utilizes RAG context and maps target concept', async () => {
    const context: SelectorContext = {
      messages: [
        { role: 'user', content: 'How do ultrasonic sensors calculate distance in mm?' },
      ],
      lastUserMessage: 'How do ultrasonic sensors calculate distance in mm?',
      checkpointTitle: 'Ultrasonic Distance Calculation',
      moduleTitle: 'Sensor Interfacing',
      selectedChatMode: 'socratic',
      retrievedContext: '### Module: Ultrasonic Sensors\nFormula: distance = (duration * speed_of_sound) / 2',
    };

    const decision = await selectTeachingStrategy(context);

    assert.strictEqual(decision.useRetrievedContext, true);
    assert.strictEqual(decision.targetConcept, 'ultrasonic sensor');
    assert.strictEqual(decision.shouldAskSocraticQuestion, true);
  });

  // ── Test 10: Invalid / malformed selector output handles safe fallback ──────
  it('Test 10 — Invalid or malformed decision payload falls back safely', () => {
    const malformedDecision = {
      teachingMode: 'INVALID_UNKNOWN_MODE',
      selectedChatMode: 'unsupported_mode',
      assistanceLevel: 99,
      tutoringState: 'CORRUPTED_STATE',
      shouldAskSocraticQuestion: 'not-a-boolean',
      requiresSafetyIntervention: 'neither',
    };

    const { decision, validation } = validateTeachingDecision(malformedDecision);

    assert.strictEqual(validation.isValid, false);
    assert.strictEqual(validation.fallbackApplied, true);
    assert.ok(validation.issues.length >= 4);

    // Verified safe fallback properties
    assert.strictEqual(decision.teachingMode, 'GUIDED_ASSISTANCE');
    assert.strictEqual(decision.assistanceLevel, 2);
    assert.strictEqual(decision.tutoringState, 'HINT');
    assert.strictEqual(decision.shouldAskSocraticQuestion, true);
    assert.strictEqual(decision.requiresSafetyIntervention, false);
  });

  // ── Bonus Test: Response validation guardrails ──────────────────────────────
  it('Bonus: validateGeneratedResponse checks safety keywords and question limits', () => {
    const safetyDecision = {
      teachingMode: 'ENGINEERING_LAB' as const,
      selectedChatMode: 'socratic' as const,
      studentLevel: 'unknown' as const,
      targetConcept: 'Safety',
      understanding: 'uncertain' as const,
      detectedMisconceptions: [],
      assistanceLevel: 5 as const,
      tutoringState: 'REVEAL' as const,
      responseStrategy: 'safety_intervention' as const,
      shouldAskSocraticQuestion: false,
      shouldRevealSolution: true,
      requiresSafetyIntervention: true,
      requiresAssessment: false,
      useRetrievedContext: false,
      userSafeReasoningSummary: 'Safety hazard',
      nextSuggestedAction: 'Disconnect',
    };

    // Fails because no safety words are present
    const check1 = validateGeneratedResponse('Here is some code for your motor: analogWrite(9, 255);', safetyDecision);
    assert.strictEqual(check1.compliant, false);
    assert.ok(check1.warnings.some(w => w.includes('Safety intervention required')));

    // Passes when safety words are present
    const check2 = validateGeneratedResponse('STOP IMMEDIATELY! Disconnect power from the circuit to prevent fire.', safetyDecision);
    assert.strictEqual(check2.compliant, true);
  });
});

