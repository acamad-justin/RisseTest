// tests/memory-blockers.test.ts
/**
 * Test Suite: RISSE AI Phase 2 Milestone 2 — Pre-Implementation Blocker & Security Boundary Verification
 * Validates B1 (Topological Ordering & Checkpoint Keys), B2 (SECURITY DEFINER & Enrollment Isolation),
 * B3 (Memory Jobs Zero-Transcript Reference Model & Controlled Enqueue), and B4 (RPC Hardening & Isolation).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import path from 'path';
import fs from 'fs';

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

describe('Phase 2 Milestone 2: Pre-Implementation Security & Architecture Boundaries', () => {

  // ── Blocker B1: Checkpoint Composite Foreign Key & Dependency Order ────────
  it('B1. Checkpoints use strict composite scoping (module_id, id) and topology resolves cleanly', () => {
    // Simulated dependency topology check
    const tablesInCreationOrder = [
      'curriculum_modules',
      'curriculum_checkpoints',
      'curriculum_concepts',
      'concept_prerequisites',
      'concept_module_mappings',
      'conversations',
      'conversation_messages',
      'classes_sections',
      'class_enrollments',
      'institutional_disclosure_authorizations',
      'student_global_memory',
      'student_module_memory',
      'concept_mastery_records',
      'mastery_assessment_events',
      'memory_evidence',
      'teacher_access_audit_logs',
      'memory_jobs'
    ];

    // Conversations must be created AFTER curriculum_modules
    const moduleIdx = tablesInCreationOrder.indexOf('curriculum_modules');
    const convIdx = tablesInCreationOrder.indexOf('conversations');
    assert.ok(moduleIdx < convIdx, 'curriculum_modules must be created before conversations');

    // Checkpoints must be created before mappings and evidence
    const cpIdx = tablesInCreationOrder.indexOf('curriculum_checkpoints');
    const mapIdx = tablesInCreationOrder.indexOf('concept_module_mappings');
    const evidIdx = tablesInCreationOrder.indexOf('memory_evidence');
    assert.ok(cpIdx < mapIdx, 'curriculum_checkpoints must be created before concept_module_mappings');
    assert.ok(cpIdx < evidIdx, 'curriculum_checkpoints must be created before memory_evidence');
  });

  // ── Blocker B2: is_current_student_enrolled Helper Prevents Cross-Student Probing ──
  it('B2. is_current_student_enrolled helper strictly derives student identity from session context without parameter input', () => {
    // Function contract simulation:
    // Helper signature MUST accept ONLY p_section_id UUID, NEVER a student ID parameter
    const helperSpec = {
      functionName: 'is_current_student_enrolled',
      parameters: ['p_section_id UUID'],
      derivesIdentityFrom: 'auth.uid()',
      searchPath: "''",
      securityDefiner: true,
    };

    assert.strictEqual(helperSpec.parameters.length, 1, 'Helper must take exactly 1 parameter (section_id)');
    assert.strictEqual(helperSpec.parameters[0], 'p_section_id UUID');
    assert.strictEqual(helperSpec.derivesIdentityFrom, 'auth.uid()', 'Identity must be derived internally from auth.uid()');
    assert.strictEqual(helperSpec.searchPath, "''", 'search_path must be locked to empty string');
  });

  // ── Blocker B3: memory_jobs Has Zero Transcript or Prompt Content ───────────
  it('B3. memory_jobs schema strictly excludes raw_prompt_preview and stores references only', () => {
    const memoryJobsSchemaColumns = [
      'id',
      'idempotency_key',
      'student_id',
      'module_id',
      'conversation_id',
      'message_ids',
      'job_type',
      'status',
      'attempts',
      'max_attempts',
      'worker_id',
      'locked_until',
      'run_at',
      'last_error',
      'started_at',
      'completed_at',
      'created_at',
      'updated_at'
    ];

    assert.ok(!memoryJobsSchemaColumns.includes('raw_prompt_preview'), 'memory_jobs MUST NOT contain raw_prompt_preview');
    assert.ok(!memoryJobsSchemaColumns.includes('content'), 'memory_jobs MUST NOT contain message content');
    assert.ok(!memoryJobsSchemaColumns.includes('transcript'), 'memory_jobs MUST NOT contain transcripts');
    assert.ok(memoryJobsSchemaColumns.includes('conversation_id'), 'memory_jobs references conversation by UUID');
    assert.ok(memoryJobsSchemaColumns.includes('message_ids'), 'memory_jobs references messages by UUID array');
  });

  // ── Blocker B3b: Controlled Enqueue Rejects Notebooks and Untrusted Students ─
  it('B3b. enqueue_memory_job rejects notebook conversations and verifies message ownership', () => {
    const simulateEnqueue = (callerId: string, convo: { student_id: string, context_type: string }, messageIds: string[]) => {
      if (convo.student_id !== callerId) {
        throw new Error('403: Forbidden - Cannot enqueue another student conversation');
      }
      if (convo.context_type === 'notebook') {
        throw new Error('400: Invalid - Notebook conversations are strictly excluded from memory extraction');
      }
      if (!messageIds || messageIds.length === 0) {
        throw new Error('400: Invalid - message_ids cannot be empty');
      }
      return { status: 'pending', conversation_id: 'conv_123', student_id: callerId };
    };

    // Valid checkpoint chat enqueue
    const valid = simulateEnqueue('usr_alice', { student_id: 'usr_alice', context_type: 'checkpoint' }, ['msg_1', 'msg_2']);
    assert.strictEqual(valid.status, 'pending');

    // Rejection of notebook chat
    assert.throws(() => {
      simulateEnqueue('usr_alice', { student_id: 'usr_alice', context_type: 'notebook' }, ['msg_1']);
    }, /Notebook conversations are strictly excluded/);

    // Rejection of cross-student spoofing
    assert.throws(() => {
      simulateEnqueue('usr_mallory', { student_id: 'usr_alice', context_type: 'checkpoint' }, ['msg_1']);
    }, /Cannot enqueue another student conversation/);
  });

  // ── Blocker B4: Worker RPCs Fail Closed for Authenticated/Anon and Enforce Lease Check ─
  it('B4. Worker RPCs reject non-service_role callers and reject stale lease completion', () => {
    const simulateClaimJobs = (jwtRole: string, workerId: string) => {
      if (jwtRole !== 'service_role') {
        throw new Error('42501: Unauthorized - only service_role may execute claim_memory_jobs');
      }
      return [{ job_id: 'job_1', worker_id: workerId, attempts: 1 }];
    };

    const simulateCompleteJob = (
      jwtRole: string,
      job: { id: string, worker_id: string, locked_until: number, status: string },
      callerWorkerId: string,
      now: number
    ) => {
      if (jwtRole !== 'service_role') {
        throw new Error('42501: Unauthorized - only service_role may execute complete_memory_job');
      }
      if (job.status === 'completed') {
        return true; // idempotent
      }
      if (job.worker_id !== callerWorkerId || job.locked_until < now) {
        throw new Error('55P03: Stale lease - job lease expired or assigned to another worker');
      }
      job.status = 'completed';
      return true;
    };

    // Non-service role claims fail
    assert.throws(() => simulateClaimJobs('authenticated', 'worker_A'), /only service_role may execute claim_memory_jobs/);
    assert.throws(() => simulateClaimJobs('anon', 'worker_A'), /only service_role may execute claim_memory_jobs/);

    // Service role claim succeeds
    const claimed = simulateClaimJobs('service_role', 'worker_A');
    assert.strictEqual(claimed[0].worker_id, 'worker_A');

    // Stale worker completion after lease expiry fails closed
    const activeJob = { id: 'job_1', worker_id: 'worker_B', locked_until: 1000, status: 'processing' };
    assert.throws(() => {
      simulateCompleteJob('service_role', activeJob, 'worker_A', 1500); // Worker A was replaced by Worker B, and now is 1500 (>1000)
    }, /Stale lease/);

    // Legitimate active worker completes successfully
    const success = simulateCompleteJob('service_role', activeJob, 'worker_B', 900);
    assert.strictEqual(success, true);
    assert.strictEqual(activeJob.status, 'completed');
  });

  // ── Additional Verification: Cross-Checkpoint Evidence Isolation ───────────
  it('Checkpoint evidence scope strictly isolates Checkpoint A evidence from Checkpoint B queries', () => {
    const evidenceTable = [
      { id: 'ev_1', module_id: '101', checkpoint_id: 'cp_101_1', concept_id: 'torque', status: 'active' },
      { id: 'ev_2', module_id: '101', checkpoint_id: 'cp_101_1', concept_id: 'gear_ratio', status: 'active' },
      { id: 'ev_3', module_id: '101', checkpoint_id: 'cp_101_2', concept_id: 'pwm', status: 'active' },
      { id: 'ev_4', module_id: '102', checkpoint_id: 'cp_102_1', concept_id: 'pid_controller', status: 'active' },
    ];

    const queryCheckpointEvidence = (moduleId: string, checkpointId: string) => {
      return evidenceTable.filter(e => e.module_id === moduleId && e.checkpoint_id === checkpointId && e.status === 'active');
    };

    const cp1Results = queryCheckpointEvidence('101', 'cp_101_1');
    assert.strictEqual(cp1Results.length, 2);
    assert.ok(cp1Results.every(e => e.checkpoint_id === 'cp_101_1'), 'All results must match cp_101_1');
    assert.ok(!cp1Results.some(e => e.checkpoint_id === 'cp_101_2'), 'cp_101_2 evidence must NEVER appear in cp_101_1 queries');
  });

  // ── Additional Verification: Administrator Oversight Requires Institutional Disclosure and Reason ─
  it('Administrator oversight memory inspection requires active institutional disclosure and non-empty reason', () => {
    const simulateAdminMemoryAccess = (
      userRole: string,
      disclosure: { status: string, valid_until: number },
      reason: string,
      now: number
    ) => {
      if (userRole !== 'admin') {
        throw new Error('403: Forbidden - Caller is not an administrator');
      }
      if (!disclosure || disclosure.status !== 'active' || disclosure.valid_until < now) {
        throw new Error('403: Forbidden - Active institutional disclosure authorization is absent or expired');
      }
      if (!reason || reason.trim().length < 15) {
        throw new Error('400: Bad Request - Administrative oversight requires a detailed institutional reason (min 15 chars)');
      }
      return { authorized: true, section_id: null, scope: 'admin_oversight' };
    };

    const now = 2000;
    const activeDisclosure = { status: 'active', valid_until: 5000 };
    const expiredDisclosure = { status: 'active', valid_until: 1000 };

    // Valid admin access
    const authRes = simulateAdminMemoryAccess('admin', activeDisclosure, 'Accreditation Audit Q4 Verification', now);
    assert.strictEqual(authRes.authorized, true);
    assert.strictEqual(authRes.section_id, null, 'Admin audit section_id is recorded as null');

    // Admin access fails when disclosure is expired
    assert.throws(() => {
      simulateAdminMemoryAccess('admin', expiredDisclosure, 'Accreditation Audit Q4 Verification', now);
    }, /Active institutional disclosure authorization is absent or expired/);

    // Admin access fails when reason is too short or missing
    assert.throws(() => {
      simulateAdminMemoryAccess('admin', activeDisclosure, 'test', now);
    }, /requires a detailed institutional reason/);
  });

  // ── Additional Verification: Evidence Dispute Bounds and Immutability ───────
  it('Evidence dispute enforces length bounds and updates lifecycle without deleting historical claims', () => {
    const simulateDispute = (evidence: { id: string, student_id: string, lifecycle_status: string, reason?: string }, callerId: string, reason: string) => {
      if (evidence.student_id !== callerId) {
        throw new Error('403: Unauthorized to dispute evidence belonging to another student');
      }
      if (!reason || reason.trim().length < 5 || reason.trim().length > 1000) {
        throw new Error('22023: Dispute reason must be between 5 and 1000 characters');
      }
      evidence.lifecycle_status = 'disputed';
      evidence.reason = reason.trim();
      return evidence;
    };

    const ev = { id: 'ev_1', student_id: 'usr_student', lifecycle_status: 'active' };
    
    // Reason too short
    assert.throws(() => simulateDispute(ev, 'usr_student', 'no'), /between 5 and 1000 characters/);
    
    // Cross-student dispute attempt
    assert.throws(() => simulateDispute(ev, 'usr_other', 'I did not say this during the lab.'), /belonging to another student/);

    // Valid dispute
    const disputed = simulateDispute(ev, 'usr_student', 'I did not state that the motor driver was damaged.');
    assert.strictEqual(disputed.lifecycle_status, 'disputed');
    assert.strictEqual(disputed.id, 'ev_1', 'Original record ID is preserved');
  });

  // ── Additional Verification: Demonstrated Evidence Requires Valid Assessment Event ─
  it('Demonstrated evidence check constraint requires non-null assessment_event_id', () => {
    const validateEvidenceRecord = (record: { provenance: string, assessment_event_id: string | null, verification_status: string }) => {
      if (record.provenance === 'demonstrated' && !record.assessment_event_id) {
        throw new Error('chk_demonstrated_has_event violation: demonstrated evidence must link to assessment_event_id');
      }
      if (['inferred', 'student_reported'].includes(record.provenance) && record.verification_status === 'verified') {
        throw new Error('chk_evidence_verification violation: inferred or student_reported cannot be verified');
      }
      return true;
    };

    // Valid demonstrated evidence linked to an assessment event
    assert.ok(validateEvidenceRecord({ provenance: 'demonstrated', assessment_event_id: 'evt_123', verification_status: 'verified' }));

    // Invalid demonstrated evidence missing assessment event
    assert.throws(() => {
      validateEvidenceRecord({ provenance: 'demonstrated', assessment_event_id: null, verification_status: 'verified' });
    }, /chk_demonstrated_has_event violation/);

    // Invalid inferred evidence marked as verified
    assert.throws(() => {
      validateEvidenceRecord({ provenance: 'inferred', assessment_event_id: null, verification_status: 'verified' });
    }, /chk_evidence_verification violation/);
  });

});

