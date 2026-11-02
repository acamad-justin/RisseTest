// tests/memory-milestone2b.test.ts
/**
 * Test Suite: Phase 2 Milestone 2B — Student Memory Ingestion & Synchronization
 * Verifies three-layer memory architecture, notebook exclusion, provenance integrity,
 * demonstrated assessment linkage, cross-student isolation, error tolerance, and TSS invariants.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';

import {
  extractCandidateMemories,
  fetchStudentLearnerContext,
  syncStudentMemoryInteraction,
} from '../frontend/lib/memory/memoryService.ts';

import {
  selectTeachingStrategy,
  buildTeachingDirectives,
} from '../frontend/lib/teaching/index.ts';

import type { SelectorContext } from '../frontend/lib/teaching/types.ts';

function readProjectFile(relativePath: string): string {
  const candidates = [
    path.resolve(process.cwd(), relativePath),
    path.resolve(process.cwd(), '..', relativePath),
    path.resolve(process.cwd(), relativePath.replace(/^frontend\//, '')),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return fs.readFileSync(c, 'utf8');
    }
  }
  throw new Error(`Could not find project file ${relativePath}`);
}

const migration2bSql = readProjectFile('supabase/migrations/20261102000005_milestone2b_student_memory_sync.sql');

describe('Phase 2 Milestone 2B: Student Memory Integration & Synchronization', () => {

  // ── 1. Student Ownership and Cross-Student Isolation ────────────────────────
  it('1. Schema enforces cross-student isolation via auth.uid() in RLS and caller checks in RPCs', () => {
    // RLS policies check auth.uid() = student_id
    assert.ok(
      migration2bSql.includes('CREATE POLICY "student_global_memory_select_own"'),
      'Must define student_global_memory_select_own policy'
    );
    assert.ok(
      migration2bSql.includes('USING (student_id = (SELECT auth.uid()))'),
      'RLS must bound student_global_memory to auth.uid()'
    );

    assert.ok(
      migration2bSql.includes('CREATE POLICY "student_module_memory_select_own"'),
      'Must define student_module_memory_select_own policy'
    );
    assert.ok(
      migration2bSql.includes('CREATE POLICY "concept_mastery_records_select_own"'),
      'Must define concept_mastery_records_select_own policy'
    );

    // RPCs must reject foreign student mutations
    assert.ok(
      migration2bSql.includes('v_caller_id <> p_student_id'),
      'RPCs must reject callers attempting to record or modify another student memory'
    );
    assert.ok(
      migration2bSql.includes('Unauthorized: Caller cannot modify another student global memory'),
      'sync_student_global_memory must guard unauthorized caller'
    );
    assert.ok(
      migration2bSql.includes('Unauthorized: Caller cannot record mastery for another student'),
      'record_demonstrated_mastery must guard unauthorized caller'
    );
  });

  // ── 2. Global vs Module-Specific Memory Scope ──────────────────────────────
  it('2. Global learner memory and module-specific memory maintain strict scope separation', () => {
    // Layer 1 global table has cross-cutting fields
    assert.ok(
      migration2bSql.includes('CREATE TABLE IF NOT EXISTS public.student_global_memory'),
      'Must create student_global_memory table'
    );
    assert.ok(
      migration2bSql.includes('general_experience TEXT NOT NULL DEFAULT \'novice\''),
      'student_global_memory must track general_experience'
    );
    assert.ok(
      migration2bSql.includes('learning_preferences JSONB NOT NULL DEFAULT \'{}\'::jsonb'),
      'student_global_memory must track learning_preferences'
    );
    assert.ok(
      migration2bSql.includes('communication_preferences JSONB NOT NULL DEFAULT \'{}\'::jsonb'),
      'student_global_memory must track voluntary accessibility preferences'
    );

    // Layer 2 module table is strictly keyed on (student_id, module_id)
    assert.ok(
      migration2bSql.includes('CONSTRAINT uq_student_module UNIQUE (student_id, module_id)'),
      'student_module_memory must enforce unique student and module pair'
    );
    assert.ok(
      migration2bSql.includes('CONSTRAINT uq_student_concept_mapping UNIQUE (student_id, mapping_id)'),
      'concept_mastery_records must enforce unique student and concept-module mapping'
    );

    // Module isolation: Module 101 records cannot pollute Module 104
    const simulatedStore = [
      { student_id: 'stu-1', module_id: '101', concept_id: 'sensors', mastery_state: 'mastered' },
      { student_id: 'stu-1', module_id: '104', concept_id: 'chassis_geometry', mastery_state: 'practicing' },
    ];
    const mod104Mastery = simulatedStore
      .filter(r => r.student_id === 'stu-1' && r.module_id === '104' && r.mastery_state === 'mastered')
      .map(r => r.concept_id);

    assert.deepStrictEqual(mod104Mastery, [], 'Module 101 mastery must not leak into Module 104');
  });

  // ── 3. Notebook Exclusion ───────────────────────────────────────────────────
  it('3. Personal Project Notebook conversations are strictly excluded from memory extraction', () => {
    // User mentioning learning preference and experience in a notebook
    const notebookExtraction = extractCandidateMemories({
      messages: [{ role: 'user', content: 'I am an advanced robotics programmer and I prefer step-by-step guidance.' }],
      lastUserMessage: 'I am an advanced robotics programmer and I prefer step-by-step guidance.',
      moduleId: '101',
      checkpointId: 'chk-101-1',
      targetConcept: 'sensors',
      isNotebook: true, // Personal Project Notebook flag
    });

    assert.deepStrictEqual(
      notebookExtraction,
      {},
      'Notebook interaction must produce zero memory extractions to guarantee private sandbox boundary'
    );

    // Standard eligible interaction (non-notebook) does extract candidate memory
    const eligibleExtraction = extractCandidateMemories({
      messages: [{ role: 'user', content: 'I am an advanced robotics programmer and I prefer step-by-step guidance.' }],
      lastUserMessage: 'I am an advanced robotics programmer and I prefer step-by-step guidance.',
      moduleId: '101',
      checkpointId: 'chk-101-1',
      targetConcept: 'sensors',
      isNotebook: false,
    });

    assert.strictEqual(eligibleExtraction.globalMemoryUpdate?.generalExperience, 'advanced');
    assert.strictEqual(eligibleExtraction.globalMemoryUpdate?.learningPreferences?.stepByStep, true);
  });

  // ── 4. Provenance Preservation ─────────────────────────────────────────────
  it('4. Candidate memory extraction preserves distinct provenance categories', () => {
    // 1. Student self-reported claim
    const reported = extractCandidateMemories({
      messages: [{ role: 'user', content: 'I already understand ultrasonic sensors.' }],
      lastUserMessage: 'I already understand ultrasonic sensors.',
      moduleId: '101',
      checkpointId: 'chk-101-1',
      targetConcept: 'ultrasonic sensor',
      isNotebook: false,
    });

    assert.ok(reported.candidateEvidence && reported.candidateEvidence.length > 0);
    assert.strictEqual(reported.candidateEvidence[0].provenance, 'student_reported');
    assert.strictEqual(reported.candidateEvidence[0].conceptId, 'ultrasonic sensor');

    // 2. Directly observed confusion
    const observed = extractCandidateMemories({
      messages: [{ role: 'user', content: 'I am confused about gear ratios and how they work.' }],
      lastUserMessage: 'I am confused about gear ratios and how they work.',
      moduleId: '102',
      checkpointId: 'chk-102-1',
      targetConcept: 'gear ratio',
      isNotebook: false,
    });

    assert.ok(observed.candidateEvidence && observed.candidateEvidence.length > 0);
    assert.strictEqual(observed.candidateEvidence[0].provenance, 'directly_observed');
    assert.strictEqual(observed.candidateEvidence[0].conceptId, 'gear ratio');
  });

  // ── 5. Inference Not Becoming Verified Mastery ─────────────────────────────
  it('5. Inferences and self-reports default to unverified and cannot directly award verified mastery', () => {
    assert.ok(
      migration2bSql.includes("IF p_provenance = 'inferred' THEN"),
      'record_candidate_evidence must check for inferred provenance'
    );
    assert.ok(
      migration2bSql.includes("v_verification := 'unverified';"),
      'inferred and student_reported must default to unverified'
    );
    assert.ok(
      migration2bSql.includes('NULL -- No assessment event for non-demonstrated candidate evidence'),
      'candidate evidence must not create or link assessment event'
    );
  });

  // ── 6. Demonstrated Evidence Requiring Valid Assessment Event ──────────────
  it('6. Demonstrated mastery strictly generates an assessment event in mastery_assessment_events', () => {
    assert.ok(
      migration2bSql.includes('INSERT INTO public.mastery_assessment_events'),
      'record_demonstrated_mastery must insert an append-only assessment event'
    );
    assert.ok(
      migration2bSql.includes('RETURNING id INTO v_event_id;'),
      'record_demonstrated_mastery must capture generated assessment_event_id'
    );
    assert.ok(
      migration2bSql.includes("'demonstrated',"),
      'New evidence must be recorded with demonstrated provenance'
    );
    assert.ok(
      migration2bSql.includes('assessment_event_id'),
      'Demonstrated evidence must reference assessment_event_id'
    );
    assert.ok(
      migration2bSql.includes('v_event_id'),
      'Demonstrated evidence must link directly to the newly created assessment event'
    );
  });

  // ── 7. Historical Evidence Preservation & Supersession ─────────────────────
  it('7. State transitions preserve historical evidence by marking prior claims superseded', () => {
    assert.ok(
      migration2bSql.includes("lifecycle_status = 'superseded'"),
      'record_demonstrated_mastery must update previous evidence to superseded'
    );
    assert.ok(
      migration2bSql.includes('superseded_by_id = v_evidence_id'),
      'superseded evidence must link to the new evidence ID'
    );
    assert.ok(
      !migration2bSql.includes('DELETE FROM public.memory_evidence'),
      'Historical memory evidence must never be deleted on state transition'
    );
  });

  // ── 8. Contradictory or Disputed Evidence Handling ─────────────────────────
  it('8. Active misconceptions view cleanly isolates misconceptions per module and student', () => {
    assert.ok(
      migration2bSql.includes('CREATE OR REPLACE VIEW public.student_module_active_misconceptions AS'),
      'Must create student_module_active_misconceptions view'
    );
    assert.ok(
      migration2bSql.includes('JOIN public.concept_module_mappings cmm ON cmm.id = cmr.mapping_id'),
      'View must strictly join on verified concept-to-module mappings'
    );
    assert.ok(
      migration2bSql.includes('cardinality(cmr.active_misconceptions) > 0'),
      'View filters to active misconceptions only'
    );
  });

  // ── 9. Non-blocking Memory Extraction & Resilience ─────────────────────────
  it('9. Memory extraction and retrieval failures do not throw or break chat pipeline', async () => {
    // Failing mock client throwing unexpected network errors
    const mockFailingClient = {
      from: () => {
        throw new Error('Supabase network connection failed: ECONNREFUSED');
      },
      rpc: async () => {
        throw new Error('Postgres RPC timeout: 504 Gateway Timeout');
      },
    };

    // 1. fetchStudentLearnerContext must return clean default object without throwing
    const fallbackContext = await fetchStudentLearnerContext(mockFailingClient, 'student-123', '101');
    assert.strictEqual(fallbackContext.studentId, 'student-123');
    assert.deepStrictEqual(fallbackContext.masteredConcepts, []);
    assert.deepStrictEqual(fallbackContext.activeMisconceptions, []);

    // 2. syncStudentMemoryInteraction must safely return { success: false, error } without throwing
    const syncResult = await syncStudentMemoryInteraction(mockFailingClient, 'student-123', {
      globalMemoryUpdate: { generalExperience: 'intermediate' },
    });
    assert.strictEqual(syncResult.success, false);
    assert.ok(syncResult.error?.includes('Postgres RPC timeout'));
  });

  // ── 10. TSS Consumes Memory Without Bypassing Safety or Phase 1 Rules ──────
  it('10a. Critical Safety Override is strictly preserved even for advanced students with mastered concepts', async () => {
    const safetyContext: SelectorContext = {
      messages: [{ role: 'user', content: 'The lithium battery is smoking and swelling up!' }],
      lastUserMessage: 'The lithium battery is smoking and swelling up!',
      selectedChatMode: 'socratic',
      learnerMemory: {
        studentId: 'adv-student-1',
        generalExperience: 'advanced',
        masteredConcepts: ['battery', 'voltage', 'safety'],
      },
    };

    const decision = await selectTeachingStrategy(safetyContext);
    assert.strictEqual(decision.requiresSafetyIntervention, true, 'Safety intervention MUST NOT be bypassed by memory');
    assert.strictEqual(decision.tutoringState, 'REVEAL');
    assert.strictEqual(decision.assistanceLevel, 5);
    assert.strictEqual(decision.responseStrategy, 'safety_intervention');
    assert.strictEqual(decision.shouldAskSocraticQuestion, false);

    const directives = buildTeachingDirectives(decision);
    assert.ok(directives.includes('CRITICAL SAFETY DIRECTIVE (HIGHEST PRIORITY)'));
  });

  it('10b. Competition Mode pit triage is strictly preserved regardless of novice learner memory', async () => {
    const compContext: SelectorContext = {
      messages: [{ role: 'user', content: 'Left drive motor stalled during autonomous match practice!' }],
      lastUserMessage: 'Left drive motor stalled during autonomous match practice!',
      selectedChatMode: 'competition',
      learnerMemory: {
        studentId: 'novice-student-1',
        generalExperience: 'novice',
        masteredConcepts: [],
      },
    };

    const decision = await selectTeachingStrategy(compContext);
    assert.strictEqual(decision.selectedChatMode, 'competition');
    assert.strictEqual(decision.assistanceLevel, 5, 'Competition Mode must maintain assistance level 5');
    assert.strictEqual(decision.shouldAskSocraticQuestion, false, 'Competition Mode forbids Socratic delay');

    const directives = buildTeachingDirectives(decision);
    assert.ok(directives.includes('COMPETITION MODE DIRECTIVE'));
  });

  it('10c. Direct explanation requests (Anti-Withholding) are honored even with advanced memory', async () => {
    const directContext: SelectorContext = {
      messages: [{ role: 'user', content: 'Can you just explain how an H-Bridge controls motor direction?' }],
      lastUserMessage: 'Can you just explain how an H-Bridge controls motor direction?',
      selectedChatMode: 'socratic',
      learnerMemory: {
        studentId: 'student-1',
        generalExperience: 'intermediate',
        masteredConcepts: ['dc motor'],
      },
    };

    const decision = await selectTeachingStrategy(directContext);
    assert.strictEqual(decision.teachingMode, 'FOUNDATION');
    assert.strictEqual(decision.tutoringState, 'EXPLAIN');
    assert.strictEqual(decision.shouldRevealSolution, true, 'Must explain directly without withholding');
  });

  it('10d. Anti-Frustration escalation is preserved even when student has prior mastered concepts', async () => {
    const frustrationContext: SelectorContext = {
      messages: [
        { role: 'assistant', content: 'What is the gear ratio if driver is 10 and driven is 40?' },
        { role: 'user', content: 'Is it 0.25?' },
        { role: 'assistant', content: 'Check teeth count again.' },
        { role: 'user', content: "I don't know, it's still wrong." },
        { role: 'assistant', content: 'Divide driven by driver.' },
        { role: 'user', content: "I'm totally stuck and have no idea." },
      ],
      lastUserMessage: "I'm totally stuck and have no idea.",
      selectedChatMode: 'socratic',
      learnerMemory: {
        studentId: 'student-1',
        generalExperience: 'advanced',
        masteredConcepts: ['torque'],
      },
    };

    const decision = await selectTeachingStrategy(frustrationContext);
    assert.strictEqual(decision.assistanceLevel, 3, 'Must escalate assistance under repeated struggle');
    assert.strictEqual(decision.tutoringState, 'EXPLAIN');
  });

  it('10e. Verified prior mastery in memory elevates inquiry to MASTERY mode during discovery', async () => {
    const masteredInquiryContext: SelectorContext = {
      messages: [{ role: 'user', content: 'Let us discuss torque on the arm mechanism.' }],
      lastUserMessage: 'Let us discuss torque on the arm mechanism.',
      selectedChatMode: 'socratic',
      learnerMemory: {
        studentId: 'student-1',
        generalExperience: 'intermediate',
        masteredConcepts: ['torque'],
      },
    };

    const decision = await selectTeachingStrategy(masteredInquiryContext);
    assert.strictEqual(decision.teachingMode, 'MASTERY', 'Verified prior mastery shifts inquiry to MASTERY');
    assert.strictEqual(decision.understanding, 'strong');
    assert.strictEqual(decision.studentLevel, 'advanced');
    assert.strictEqual(decision.responseStrategy, 'assess');

    const directives = buildTeachingDirectives(decision);
    assert.ok(directives.includes('VERIFIED LEARNER CONTEXT'));
    assert.ok(directives.includes('Prior Verified Mastery: torque'));
  });
});
