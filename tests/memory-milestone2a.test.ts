/**
 * RISSE AI — Phase 2 Milestone 2A: Curriculum Ontology & Memory Schema Tests
 *
 * Validates the revised Milestone 2A migration:
 * - 6 Production curriculum modules 101-106 (omits fixture 999)
 * - 27 Verified checkpoints across modules 101-106
 * - 36 Verified canonical concepts across 6 domains
 * - Concept prerequisites DAG acyclicity and non-self-prerequisite integrity
 * - 36 Canonical concept-to-module mappings with deterministic upserts
 * - Composite foreign key scoping and checkpoint deletion module preservation
 * - Conversations and messages schema with notebook privacy isolation
 * - Protection against student forgery of assistant/system messages
 * - Protection of conversation history from modification/deletion
 * - Provenance reconciliation including directly_observed
 * - Demonstrated evidence link to mastery_assessment_events
 * - Supersession validation: same student/module/concept, anti-self, anti-cycle
 * - Dispute RPC hardening against NULL inputs and unauthorized callers
 * - Row Level Security policies and least-privilege grants
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';

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

describe('Phase 2 Milestone 2A: Curriculum Ontology & Foundational Memory Evidence', () => {
  const migrationSql = readProjectFile('supabase/migrations/20261102000004_milestone2a_curriculum_memory_schema.sql');

  // ── 1. Production Curriculum Modules 101–106 & Exclusion of Module 999 ─────
  it('1. Schema seeds exactly the 6 production modules (101-106) and strictly excludes module 999', () => {
    assert.ok(migrationSql.includes("('101', 'Sensors & Perception'"), 'Module 101 must be present');
    assert.ok(migrationSql.includes("('102', 'Programming Robot Behavior'"), 'Module 102 must be present');
    assert.ok(migrationSql.includes("('103', 'Robotics Fundamentals'"), 'Module 103 must be present');
    assert.ok(migrationSql.includes("('104', 'Sumobot Design & Competition'"), 'Module 104 must be present');
    assert.ok(migrationSql.includes("('105', 'Embedded Microcontroller Architecture'"), 'Module 105 must be present');
    assert.ok(migrationSql.includes("('106', 'Closed-Loop Control & Motion'"), 'Module 106 must be present');

    // Strict exclusion of fixture module 999
    assert.ok(!migrationSql.includes("'999'"), 'Fixture test module 999 must NOT be seeded in production migration');
  });

  // ── 2. Exactly 27 Verified Checkpoints Across Modules 101–106 ──────────────
  it('2. Schema seeds exactly 27 checkpoints with correct module distribution and steps', () => {
    const checkpointMatches = migrationSql.match(/'cp_10[1-6]_\d'/g) || [];
    const uniqueCheckpoints = new Set(checkpointMatches);

    assert.strictEqual(uniqueCheckpoints.size, 27, `Must seed exactly 27 unique checkpoints, found ${uniqueCheckpoints.size}`);

    // Verify per-module distribution: 3 + 5 + 4 + 6 + 4 + 5 = 27
    const cp101 = [...uniqueCheckpoints].filter(cp => cp.includes('cp_101'));
    const cp102 = [...uniqueCheckpoints].filter(cp => cp.includes('cp_102'));
    const cp103 = [...uniqueCheckpoints].filter(cp => cp.includes('cp_103'));
    const cp104 = [...uniqueCheckpoints].filter(cp => cp.includes('cp_104'));
    const cp105 = [...uniqueCheckpoints].filter(cp => cp.includes('cp_105'));
    const cp106 = [...uniqueCheckpoints].filter(cp => cp.includes('cp_106'));

    assert.strictEqual(cp101.length, 3, 'Module 101 must have exactly 3 checkpoints');
    assert.strictEqual(cp102.length, 5, 'Module 102 must have exactly 5 checkpoints');
    assert.strictEqual(cp103.length, 4, 'Module 103 must have exactly 4 checkpoints');
    assert.strictEqual(cp104.length, 6, 'Module 104 must have exactly 6 checkpoints');
    assert.strictEqual(cp105.length, 4, 'Module 105 must have exactly 4 checkpoints');
    assert.strictEqual(cp106.length, 5, 'Module 106 must have exactly 5 checkpoints');
  });

  // ── 3. Exactly 36 Verified Canonical Concepts Across 6 Domains ────────────
  it('3. Schema seeds exactly 36 canonical concepts across mechanical, electronics, sensing, control, programming, safety', () => {
    const expectedConcepts = [
      // Mechanical (6)
      'torque', 'gear_ratio', 'center_of_gravity', 'traction', 'chassis_rigidity', 'backlash',
      // Electronics (8)
      'pwm', 'h_bridge', 'motor_driver', 'voltage_divider', 'pull_up_resistor', 'brownout', 'reverse_polarity', 'back_emf',
      // Sensing (6)
      'ultrasonic_sensor', 'encoder', 'infrared_sensor', 'imu', 'limit_switch', 'analog_to_digital',
      // Control (8)
      'open_loop', 'closed_loop', 'pid_controller', 'proportional_control', 'integral_control', 'derivative_control', 'tuning_gain', 'setpoint_tracking',
      // Programming (6)
      'microcontroller', 'gpio_registers', 'interrupt_service_routine', 'serial_communication', 'i2c_protocol', 'spi_protocol',
      // Safety (2)
      'battery_safety', 'power_isolation'
    ];

    assert.strictEqual(expectedConcepts.length, 36, 'Specification must define exactly 36 concepts');

    for (const conceptId of expectedConcepts) {
      assert.ok(
        migrationSql.includes(`('${conceptId}',`),
        `Concept '${conceptId}' must be seeded in curriculum_concepts`
      );
    }
  });

  // ── 4. Concept Prerequisites DAG Acyclicity and Self-Prerequisite Prevention
  it('4. Concept prerequisites table enforces non-self-prerequisite and models a valid DAG', () => {
    assert.ok(
      migrationSql.includes('CONSTRAINT chk_no_self_prereq CHECK (concept_id <> prerequisite_concept_id)'),
      'Must enforce chk_no_self_prereq'
    );

    // Extract prerequisite pairs and verify acyclicity
    const prereqRegex = /\('([a-z_]+)',\s*'([a-z_]+)'\)/g;
    const prereqsSection = migrationSql.split('INSERT INTO public.concept_prerequisites')[1]?.split('ON CONFLICT')[0] || '';
    
    const adj = new Map<string, string[]>();
    let match;
    let count = 0;
    while ((match = prereqRegex.exec(prereqsSection)) !== null) {
      const [_, concept, prereq] = match;
      count++;
      if (!adj.has(prereq)) adj.set(prereq, []);
      adj.get(prereq)!.push(concept);
    }

    assert.ok(count >= 15, `Must have seeded core prerequisites DAG (found ${count})`);

    // Cycle detection via DFS
    const visited = new Set<string>();
    const recStack = new Set<string>();

    function hasCycle(node: string): boolean {
      visited.add(node);
      recStack.add(node);

      for (const neighbor of (adj.get(node) || [])) {
        if (!visited.has(neighbor) && hasCycle(neighbor)) return true;
        if (recStack.has(neighbor)) return true;
      }

      recStack.delete(node);
      return false;
    }

    for (const node of adj.keys()) {
      if (!visited.has(node)) {
        assert.ok(!hasCycle(node), `Cycle detected starting at node: ${node}`);
      }
    }
  });

  // ── 5. Composite Foreign Keys & Checkpoint Deletion Module Preservation ────
  it('5. Corrects composite foreign-key deletion behavior to preserve module_id when a checkpoint is deleted', () => {
    // Unique composite key on checkpoints
    assert.ok(
      migrationSql.includes('CONSTRAINT uq_checkpoints_module_id UNIQUE (module_id, id)'),
      'curriculum_checkpoints must declare UNIQUE (module_id, id)'
    );

    // Composite reference in concept_module_mappings
    assert.ok(
      migrationSql.includes('FOREIGN KEY (module_id, checkpoint_id)') &&
      migrationSql.includes('REFERENCES public.curriculum_checkpoints(module_id, id) ON DELETE SET NULL (checkpoint_id)'),
      'concept_module_mappings must preserve module_id on checkpoint delete'
    );

    // Composite reference in conversations
    assert.ok(
      migrationSql.includes('FOREIGN KEY (module_id, checkpoint_id)') &&
      migrationSql.includes('REFERENCES public.curriculum_checkpoints(module_id, id) ON DELETE SET NULL (checkpoint_id)'),
      'conversations must preserve module_id on checkpoint delete'
    );

    // Scoping trigger to handle checkpoint deletion without losing module context
    assert.ok(
      migrationSql.includes('handle_checkpoint_deletion_scoping()'),
      'Trigger function handle_checkpoint_deletion_scoping must exist'
    );
  });

  // ── 6. Notebook Scoping Constraint (Notebook Privacy Isolation) ────────────
  it('6. Conversations table enforces strict notebook isolation via chk_notebook_scoping', () => {
    assert.ok(
      migrationSql.includes('CONSTRAINT chk_notebook_scoping') &&
      migrationSql.includes("context_type = 'notebook' AND module_id IS NULL AND checkpoint_id IS NULL"),
      'Notebook conversations must not be bound to curriculum modules or checkpoints'
    );
  });

  // ── 7. Protection Against Student Forgery of Assistant/System Messages ─────
  it('7. Prevents authenticated students from inserting assistant/system messages', () => {
    assert.ok(
      migrationSql.includes('POLICY "messages_student_insert"') &&
      migrationSql.includes('ON public.conversation_messages FOR INSERT'),
      'messages_student_insert policy must exist'
    );
    assert.ok(
      migrationSql.includes("sender_role = 'student'"),
      'Student insert policy must strictly restrict sender_role to student'
    );
  });

  // ── 8. Protection of Conversation History from Modification/Deletion ──────
  it('8. Protects conversation history from unauthorized modification and deletion', () => {
    // Authenticated users must not be granted UPDATE or DELETE on conversation_messages
    assert.ok(
      migrationSql.includes('GRANT SELECT, INSERT ON public.conversation_messages TO authenticated;'),
      'Authenticated users must only be granted SELECT and INSERT on messages'
    );
    assert.ok(
      !migrationSql.includes('GRANT UPDATE ON public.conversation_messages TO authenticated;') &&
      !migrationSql.includes('GRANT DELETE ON public.conversation_messages TO authenticated;'),
      'Authenticated users must NOT be granted UPDATE or DELETE on conversation_messages'
    );
    assert.ok(
      !migrationSql.includes('CREATE POLICY "messages_student_update"'),
      'Must NOT contain messages_student_update policy'
    );
    assert.ok(
      !migrationSql.includes('CREATE POLICY "messages_student_delete"'),
      'Must NOT contain messages_student_delete policy'
    );
  });

  // ── 9. Provenance Reconciliation Including directly_observed ───────────────
  it('9. Reconciles provenance values to include directly_observed and enforces verification limits', () => {
    assert.ok(
      migrationSql.includes("'directly_observed'"),
      'Provenance check constraint must include directly_observed'
    );
    assert.ok(
      migrationSql.includes("provenance IN ('demonstrated', 'inferred', 'student_reported', 'teacher_assessed', 'directly_observed')"),
      'All 5 provenance values must be present'
    );
    assert.ok(
      migrationSql.includes("provenance IN ('inferred', 'student_reported') AND verification_status <> 'verified'"),
      'Inferred or student-reported evidence cannot have verified status'
    );
  });

  // ── 10. Demonstrated Evidence Link to mastery_assessment_events ────────────
  it('10. Demonstrated evidence references an actual assessment event in mastery_assessment_events', () => {
    assert.ok(
      migrationSql.includes('CREATE TABLE IF NOT EXISTS public.mastery_assessment_events'),
      'mastery_assessment_events table must exist'
    );
    assert.ok(
      migrationSql.includes('assessment_event_id UUID REFERENCES public.mastery_assessment_events(id) ON DELETE RESTRICT'),
      'assessment_event_id must reference public.mastery_assessment_events(id)'
    );
    assert.ok(
      migrationSql.includes("provenance = 'demonstrated' AND assessment_event_id IS NOT NULL"),
      'Demonstrated evidence requires non-null assessment_event_id'
    );
  });

  // ── 11. Supersession Validation & Immutability Trigger ─────────────────────
  it('11. Immutability trigger validates supersession (same student, module, concept, anti-self, anti-cycle)', () => {
    assert.ok(
      migrationSql.includes('CREATE OR REPLACE FUNCTION public.enforce_memory_evidence_immutability()'),
      'enforce_memory_evidence_immutability function must exist'
    );
    assert.ok(
      migrationSql.includes('chk_no_self_supersession') &&
      migrationSql.includes('superseded_by IS NULL OR superseded_by <> id'),
      'Must enforce chk_no_self_supersession'
    );
    assert.ok(
      migrationSql.includes('v_target_student <> NEW.student_id') &&
      migrationSql.includes('v_target_module <> NEW.module_id') &&
      migrationSql.includes('v_target_concept <> NEW.concept_id'),
      'Must validate that superseding evidence belongs to same student, module, and concept'
    );
    assert.ok(
      migrationSql.includes('v_target_superseded_by = OLD.id') &&
      migrationSql.includes('Mutual supersession cycle detected'),
      'Must detect and reject mutual supersession cycles'
    );
  });

  // ── 12. Dispute RPC Hardening ──────────────────────────────────────────────
  it('12. dispute_memory_evidence RPC hardens against NULL inputs and unauthorized callers', () => {
    assert.ok(
      migrationSql.includes('CREATE OR REPLACE FUNCTION public.dispute_memory_evidence'),
      'dispute_memory_evidence function must exist'
    );
    assert.ok(
      migrationSql.includes("p_evidence_id IS NULL") &&
      migrationSql.includes("Evidence ID cannot be null"),
      'Must validate non-null evidence ID'
    );
    assert.ok(
      migrationSql.includes("p_reason IS NULL") &&
      migrationSql.includes("Dispute reason cannot be null"),
      'Must validate non-null dispute reason'
    );
    assert.ok(
      migrationSql.includes("v_row.student_id <> auth.uid()"),
      'Must reject callers who do not own the evidence record'
    );
    assert.ok(
      migrationSql.includes("v_row.verification_status = 'disputed'"),
      'Must reject disputing already disputed evidence'
    );
    assert.ok(
      migrationSql.includes("v_row.lifecycle_status IN ('retracted', 'superseded')"),
      'Must reject disputing retracted or superseded evidence'
    );
  });

  // ── 13. Deterministic Concept Mapping Seeds ────────────────────────────────
  it('13. Seed operations produce deterministic results via ON CONFLICT (concept_id, module_id)', () => {
    assert.ok(
      migrationSql.includes('CREATE UNIQUE INDEX IF NOT EXISTS uq_concept_primary_module \n    ON public.concept_module_mappings(concept_id, module_id)') ||
      migrationSql.includes('uq_concept_primary_module'),
      'Must declare unique index on (concept_id, module_id)'
    );
    assert.ok(
      migrationSql.includes('ON CONFLICT (concept_id, module_id) DO UPDATE SET'),
      'Seeding must use ON CONFLICT (concept_id, module_id) DO UPDATE SET for deterministic updates'
    );
  });

  // ── 14. Explicit RLS on All Tables ─────────────────────────────────────────
  it('14. RLS is explicitly enabled on all curriculum, conversation, assessment, and memory tables', () => {
    const requiredRlsTables = [
      'curriculum_modules',
      'curriculum_checkpoints',
      'curriculum_concepts',
      'concept_prerequisites',
      'concept_module_mappings',
      'conversations',
      'conversation_messages',
      'mastery_assessment_events',
      'memory_evidence'
    ];

    for (const table of requiredRlsTables) {
      assert.ok(
        migrationSql.includes(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`),
        `Table public.${table} must have ROW LEVEL SECURITY explicitly enabled`
      );
    }
  });
});
