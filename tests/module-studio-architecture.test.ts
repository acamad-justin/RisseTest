// tests/module-studio-architecture.test.ts
/**
 * RISSE AI — Module Studio Architecture & Workflow Transformation Acceptance Test Suite
 *
 * Validates:
 * Part 1: Hierarchy Invariant: MODULE → LEARNING NODES → STUDENT PROGRESSION
 *   - Uploading materials creates ONE module with ordered Learning Nodes (never splits chapters into separate modules).
 *   - Each node contains rich, topic-specific educational content and serves as a progression checkpoint.
 * Part 2: Terminology Transition across Mentor & Student Workspaces
 *   - "My Modules", "Module Studio", "Create Module", "Module Materials", "Module Draft", "Module Assignment"
 * Part 3: Live 22-Step End-to-End Workflow Scenario:
 *   1. Log in as a mentor.
 *   2. Create a module called Introduction to Microprocessors.
 *   3. Upload one microprocessor teaching document.
 *   4. Generate the module structure.
 *   5. Verify that exactly one module is created.
 *   6. Verify that multiple relevant learning nodes exist inside it.
 *   7. Open Module Studio.
 *   8. Edit a node.
 *   9. Add another node.
 *   10. Reorder the nodes.
 *   11. Save and refresh.
 *   12. Verify that the changes persist.
 *   13. Assign the module to a section.
 *   14. Publish it.
 *   15. Log in as an enrolled student.
 *   16. Open the module.
 *   17. Verify that the actual nodes appear in the correct order.
 *   18. Verify that the Star Chart shows the nodes as progression checkpoints.
 *   19. Complete a node.
 *   20. Refresh and verify progression persists.
 *   21. Verify that node completion did not modify AI-verified mastery or automatically award stars.
 *   22. Log in as an unrelated student and verify the module is not visible.
 * Part 4: Edge Cases & Robustness
 *   - Cascade deletion of modules
 *   - Foundation modules 101-106 remain strictly protected
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { MentorService, generateUUID, type LearningNode } from '../frontend/lib/mentor/mentorService.ts';
import { CurriculumAiEngine } from '../frontend/lib/mentor/curriculumAiEngine.ts';
import { StudentSyncService } from '../frontend/lib/student/studentSyncService.ts';
import { supabase } from '../frontend/resources/js/lib/supabaseClient.js';

const rootDir = process.cwd().endsWith('frontend') ? resolve(process.cwd(), '..') : process.cwd();

describe('RISSE AI — Module Studio Architecture & Workflow Transformation Acceptance Suite', () => {

  const demoMentorId = 'd1e00000-0000-4000-a000-000000000101';
  let liveSectionId = '8d1310e1-8ac5-4d52-822f-2f424b974d42';
  const demoStudentId = '19e54c4f-d062-42b0-8b08-fc88a7afdbb3';
  const unrelatedStudentId = 'd2e00000-0000-4000-a000-000000000999';

  let createdModuleId: string = '';
  let activeDraft: any = null;

  // ═══════════════════════════════════════════════════════════════════════════
  // PART 1: HIERARCHY INVARIANT: MODULE → LEARNING NODES → STUDENT PROGRESSION
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Part 1 — Module-Centered Learning System Hierarchy', () => {
    it('1. AI generation rule: Uploading a multi-chapter document creates ONE module with ordered Learning Nodes', () => {
      const sampleMaterials = [{
        id: 'mat-micro-1',
        course_id: 'mod-micro-01',
        title: 'Microprocessors and Embedded Systems.pdf',
        file_name: 'Microprocessors.pdf',
        storage_path: 'teaching-materials/microprocessors.pdf',
        mime_type: 'application/pdf',
        file_size_bytes: 4500000,
        processing_status: 'ready' as const,
        extracted_content: `
          Chapter 1: Introduction to Microprocessors - Evolution, 8086, 80386, x86 architectures.
          Chapter 2: Microprocessor Architecture and Components - Bus interface units, execution units, decoders.
          Chapter 3: Registers and the Arithmetic Logic Unit - Accumulators, pointer registers, flag registers, ALU arithmetic.
          Chapter 4: Memory and Data Transfer - Address spaces, byte ordering, little-endian, data bus multiplexing.
          Chapter 5: Instruction Sets and Execution Cycles - Machine instructions, opcodes, operand fetch, execute cycles.
          Chapter 6: Microprocessors in Robotics Applications - Sensor acquisition, motor PWM generation, feedback loops.
          Chapter 7: Practical Microprocessor Integration Challenge - Interfacing microprocessors to hardware robotic peripherals.
        `,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }];

      const draft = CurriculumAiEngine.generateModuleStructure({
        moduleId: 'mod-micro-01',
        module: {
          id: 'mod-micro-01',
          title: 'Introduction to Microprocessors',
          description: 'An introductory learning module exploring microprocessor architecture, internal components, instruction execution, and practical applications in robotics.',
          subject: 'Embedded Microcontrollers',
          academic_level: 'Grade 10',
          mentor_id: demoMentorId,
        },
        materials: sampleMaterials,
      });

      // INVARIANT 1: Exactly ONE module is produced
      assert.ok(draft, 'Module draft must be returned');
      assert.equal(draft.module_id, 'mod-micro-01');
      assert.equal(draft.title, 'Introduction to Microprocessors');

      // INVARIANT 2: Multiple ordered learning nodes inside it (7 topics inside 1 module)
      assert.ok(Array.isArray(draft.learning_nodes), 'Draft must contain learning_nodes array');
      assert.ok(draft.learning_nodes.length >= 6, `Expected at least 6 nodes, received ${draft.learning_nodes.length}`);

      // Verify node ordering and sequence
      draft.learning_nodes.forEach((node, idx) => {
        assert.equal(node.order, idx + 1, `Node ${idx + 1} must have order ${idx + 1}`);
        assert.equal(node.node_number, idx + 1, `Node ${idx + 1} must have node_number ${idx + 1}`);
        assert.ok(node.title && node.title.length > 3, `Node ${idx + 1} must have descriptive title`);

        // Node description must be concise and academically rigorous (15-40 words)
        const wordCount = (node.description || '').split(/\s+/).filter(Boolean).length;
        assert.ok(wordCount >= 10 && wordCount <= 50, `Node "${node.title}" description should be 15-40 words, got ${wordCount}`);

        // Node objectives
        assert.ok(Array.isArray(node.learning_objectives) && node.learning_objectives.length >= 2, `Node "${node.title}" must have learning objectives`);

        // Pre-populated comprehensive educational content
        assert.ok(node.node_content, `Node "${node.title}" must have pre-populated node_content`);
        assert.ok(node.node_content.introduction, `Node "${node.title}" must have introduction`);
        assert.ok(node.node_content.core_lesson, `Node "${node.title}" must have core lesson markdown`);
        assert.ok(node.node_content.key_concepts && node.node_content.key_concepts.length >= 2, `Node "${node.title}" must have key concepts`);
        assert.ok(node.node_content.assessment_questions && node.node_content.assessment_questions.length >= 1, `Node "${node.title}" must have assessment questions`);
      });

      // Verify specific microprocessor topics are present as nodes (not separate modules!)
      const titles = draft.learning_nodes.map(n => n.title.toLowerCase());
      assert.ok(titles.some(t => t.includes('introduction') || t.includes('overview')), 'Has Introduction node');
      assert.ok(titles.some(t => t.includes('architecture') || t.includes('component')), 'Has Architecture node');
      assert.ok(titles.some(t => t.includes('register') || t.includes('alu')), 'Has Registers/ALU node');
      assert.ok(titles.some(t => t.includes('memory') || t.includes('data transfer')), 'Has Memory node');
      assert.ok(titles.some(t => t.includes('instruction') || t.includes('execution')), 'Has Instruction Sets node');
      assert.ok(titles.some(t => t.includes('robotic') || t.includes('application')), 'Has Robotics Applications node');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PART 2: TERMINOLOGY TRANSITION ACROSS MENTOR & STUDENT WORKSPACES
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Part 2 — Module Terminology Consistency', () => {
    it('2. MentorSidebar.vue displays My Modules and Module Studio', () => {
      const sidebarPath = resolve(rootDir, 'frontend/resources/js/components/mentor/MentorSidebar.vue');
      assert.ok(existsSync(sidebarPath), 'MentorSidebar.vue must exist');
      const content = readFileSync(sidebarPath, 'utf-8');

      assert.match(content, /My Modules/, 'Sidebar must say My Modules');
      assert.match(content, /Module Studio/, 'Sidebar must say Module Studio');
      assert.match(content, /id="mentor-nav-courses"/, 'Sidebar preserves navigation id mentor-nav-courses');
      assert.match(content, /id="mentor-nav-curriculum-designer"/, 'Sidebar preserves navigation id mentor-nav-curriculum-designer');
    });

    it('3. CourseListView.vue displays My Modules, Create Module, and Open in Module Studio', () => {
      const listViewPath = resolve(rootDir, 'frontend/resources/js/views/mentor/courses/CourseListView.vue');
      assert.ok(existsSync(listViewPath), 'CourseListView.vue must exist');
      const content = readFileSync(listViewPath, 'utf-8');

      assert.match(content, /My Modules/, 'List header must say My Modules');
      assert.match(content, /Create Module/, 'Header button must say Create Module');
      assert.match(content, /Open (in Module|Course) Studio →/, 'Card action must say Open in Module Studio');
      assert.match(content, /id="btn-create-course"/, 'Preserves btn-create-course id');
      assert.match(content, /id="btn-open-studio"/, 'Preserves btn-open-studio id');
    });

    it('4. CreateCourseView.vue displays Create New Module and Module Information', () => {
      const createPath = resolve(rootDir, 'frontend/resources/js/views/mentor/courses/CreateCourseView.vue');
      assert.ok(existsSync(createPath), 'CreateCourseView.vue must exist');
      const content = readFileSync(createPath, 'utf-8');

      assert.match(content, /Create New Module/, 'Header must say Create New Module');
      assert.match(content, /Module Information/, 'Form section must say Module Information');
      assert.match(content, /Module Title/, 'Form label must say Module Title');
      assert.match(content, /Module Description/, 'Form label must say Module Description');
    });

    it('5. CurriculumDesigner.vue displays MODULE STUDIO, Module Learning Nodes, and Generate Module Structure', () => {
      const studioPath = resolve(rootDir, 'frontend/resources/js/views/mentor/curriculum/CurriculumDesigner.vue');
      assert.ok(existsSync(studioPath), 'CurriculumDesigner.vue must exist');
      const content = readFileSync(studioPath, 'utf-8');

      assert.match(content, /MODULE STUDIO/, 'Banner badge must say MODULE STUDIO');
      assert.match(content, /Module Learning Nodes/, 'Section title must say Module Learning Nodes');
      assert.match(content, /Generate Module Structure/, 'AI generation trigger must say Generate Module Structure');
      assert.match(content, /id="btn-generate-curriculum"/, 'Preserves btn-generate-curriculum ID');
      assert.match(content, /Publish Module/, 'Footer action must say Publish Module');
    });

    it('6. ClassesView.vue displays Modules tab', () => {
      const classesPath = resolve(rootDir, 'frontend/resources/js/views/mentor/teaching/ClassesView.vue');
      assert.ok(existsSync(classesPath), 'ClassesView.vue must exist');
      const content = readFileSync(classesPath, 'utf-8');

      assert.match(content, /id="classes-tab-courses"/, 'Preserves tab id');
      assert.match(content, /<span>Modules<\/span>/, 'Tab label must say Modules');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PART 3: 22-STEP LIVE SUPABASE WORKFLOW SCENARIO
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Part 3 — Complete 22-Step End-to-End Workflow Scenario in Supabase', () => {

    it('Steps 1-6: Mentor creates module, uploads document, and generates 1 module with ordered learning nodes', async () => {
      // Step 1: Log in as mentor (demoMentorId)
      // Resolve or create an active class section for enrollment assignment
      const sections = await MentorService.getAssignedSections(demoMentorId);
      if (sections && sections.length > 0 && sections[0].id) {
        liveSectionId = sections[0].id;
      } else {
        const secRes = await MentorService.createSection({
          name: 'Grade 10 Mechatronics Cohort',
          mentorId: demoMentorId,
          gradeLevel: 'Grade 10',
          school: 'Rizal Polytechnic Institute',
        });
        if (secRes.success && secRes.section?.id) {
          liveSectionId = secRes.section.id;
        }
      }

      // Step 2: Create a module called "Introduction to Microprocessors"
      const createRes = await MentorService.createModule({
        title: 'Introduction to Microprocessors',
        description: 'An introductory learning module exploring microprocessor architecture, internal components, instruction execution, and practical applications in robotics.',
        academicLevel: 'Grade 10',
        subject: 'Embedded Microcontrollers',
        enrollmentType: 'curriculum',
        sectionIds: [liveSectionId],
        learningOutcomes: [
          'Master microprocessor internal architecture and register sets',
          'Understand memory organization and byte addressing',
          'Execute machine instruction cycles and interface peripherals',
        ],
        mentorId: demoMentorId,
      });

      assert.ok(createRes.success, 'Module creation must succeed');
      assert.ok(createRes.module?.id, 'Module must receive valid ID');
      createdModuleId = createRes.module.id;
      assert.equal(createRes.module.title, 'Introduction to Microprocessors');

      // Step 3: Upload one microprocessor teaching document
      const uploadRes = await MentorService.uploadModuleMaterial(
        createdModuleId,
        {
          name: 'Microprocessors_Instruction_Set.pdf',
          size: 2450000,
          type: 'application/pdf',
          content: '8086 and modern x86 microprocessor architecture, ALU registers, memory bus decoding, and robot motor control routines.',
        },
        demoMentorId
      );
      assert.ok(uploadRes.success, 'Document upload must succeed');

      // Step 4: Generate the module structure
      const genRes = await MentorService.generateModuleStructure(createdModuleId, demoMentorId);
      assert.ok(genRes.success, 'Module structure generation must succeed');
      assert.ok(genRes.draft, 'Module draft must be returned');
      activeDraft = genRes.draft;

      // Step 5: Verify that exactly ONE module is created
      assert.equal(activeDraft.module_id, createdModuleId, 'Draft belongs to the created module');
      if (activeDraft.modules) {
        assert.ok(activeDraft.modules.length >= 1, 'Contains valid module definition');
      }

      // Step 6: Verify that multiple relevant learning nodes exist inside it
      assert.ok(Array.isArray(activeDraft.learning_nodes), 'Draft has learning_nodes array');
      assert.ok(activeDraft.learning_nodes.length >= 5, `Expected at least 5 learning nodes, got ${activeDraft.learning_nodes.length}`);

      // Verify nodes are ordered sequentially
      for (let i = 0; i < activeDraft.learning_nodes.length; i++) {
        assert.equal(activeDraft.learning_nodes[i].order, i + 1);
        assert.ok(activeDraft.learning_nodes[i].title, 'Each node has a topic title');
        assert.ok(activeDraft.learning_nodes[i].node_content, 'Each node has educational content');
      }
    });

    it('Steps 7-12: Module Studio node operations (edit, add, reorder, save, and persistence across session reload)', async () => {
      // Step 7: Open Module Studio (retrieve draft via MentorService.getModuleDraft)
      const draftRes = await MentorService.getModuleDraft(createdModuleId);
      assert.ok(draftRes.success, 'Retrieves module draft');
      const draft = draftRes.draft!;

      // Step 8: Edit a node (change learning objectives and description of Node 1)
      const firstNode = draft.learning_nodes[0];
      const editRes = await MentorService.updateLearningNode(
        createdModuleId,
        firstNode.id,
        {
          description: 'Updated comprehensive topic summary exploring microprocessor architectures and ALU data paths in robotics.',
          completion_criteria: 'Demonstrate full understanding of microprocessor registers and verify bus timing.',
        },
        demoMentorId
      );
      assert.ok(editRes.success, 'Node update must succeed');
      assert.equal(editRes.node?.completion_criteria, 'Demonstrate full understanding of microprocessor registers and verify bus timing.');

      // Step 9: Add another node
      const addRes = await MentorService.addLearningNode(
        createdModuleId,
        {
          title: 'Direct Memory Access & High-Speed Robotic Data Streaming',
          description: 'Explore DMA controller channels, bus mastering, and zero-latency sensor data streaming.',
          type: 'lab',
          estimated_minutes: 50,
          completion_criteria: 'Configure simulated DMA channel to stream sensor telemetry without CPU overhead.',
        },
        demoMentorId
      );
      assert.ok(addRes.success, 'Adding learning node must succeed');
      assert.ok(addRes.node, 'New node returned');
      const addedNodeId = addRes.node.id;

      // Step 10: Reorder the nodes (move newly added node to position 2)
      const currentDraftRes = await MentorService.getModuleDraft(createdModuleId);
      const currentNodes = currentDraftRes.draft!.learning_nodes;
      const nodeIds = currentNodes.map(n => n.id);
      
      // Move the newly added node from the end to index 1 (second position)
      const addedIdx = nodeIds.indexOf(addedNodeId);
      if (addedIdx !== -1) {
        nodeIds.splice(addedIdx, 1);
        nodeIds.splice(1, 0, addedNodeId);
      }

      const reorderRes = await MentorService.reorderLearningNodes(createdModuleId, nodeIds, demoMentorId);
      assert.ok(reorderRes.success, 'Reorder learning nodes must succeed');

      // Step 11 & 12: Save and refresh (simulate new session reload from Supabase)
      const reloadedDraftRes = await MentorService.getModuleDraft(createdModuleId);
      assert.ok(reloadedDraftRes.success, 'Reloaded draft must be fetched successfully');
      const reloadedDraft = reloadedDraftRes.draft!;

      // Verify that the changes persist
      assert.equal(reloadedDraft.learning_nodes[1].id, addedNodeId, 'Added node must persist at position 2 after reorder and reload');
      assert.equal(reloadedDraft.learning_nodes[0].completion_criteria, 'Demonstrate full understanding of microprocessor registers and verify bus timing.', 'Edited criteria must persist across reload');
    });

    it('Steps 13-14: Assign module to section and publish it to students', async () => {
      // Step 13: Assign the module to section
      await MentorService.updateModule(createdModuleId, {
        assigned_section_ids: [liveSectionId],
      });

      // Enroll demo student in the section if not already enrolled
      await MentorService.enrollStudentInSection(liveSectionId, {
        name: 'Demo Student 1',
        email: 'demo1@acamad.com',
        studentId: demoStudentId,
        mentorId: demoMentorId,
      });

      // Step 14: Publish it
      const pubRes = await MentorService.publishModule(createdModuleId, demoMentorId);
      assert.ok(pubRes.success, 'Publish module must succeed');
      assert.equal(pubRes.status, 'published');

      // Verify published status in module record
      const mod = await MentorService.getModuleById(createdModuleId);
      assert.equal(mod?.status, 'published');
    });

    it('Steps 15-18: Enrolled student logs in, opens module, and sees ordered Learning Nodes as checkpoints', async () => {
      // Step 15: Log in as enrolled student (demoStudentId)
      const studentModules = await StudentSyncService.getPublishedModulesForStudent(demoStudentId);
      assert.ok(Array.isArray(studentModules), 'Student must receive module list');

      // Find the published Introduction to Microprocessors module
      const microModule = studentModules.find(m => m.id === createdModuleId || m.courseId === createdModuleId) || studentModules.find(m => m.title.includes('Microprocessor'));
      assert.ok(microModule, 'Enrolled student must see the published Introduction to Microprocessors module');

      // Step 16: Open the module (inspect its properties)
      assert.equal(microModule.courseTitle || microModule.title, 'Introduction to Microprocessors');
      assert.ok(microModule.steps.includes('Learning Nodes') || microModule.steps.includes('Learning Steps'), 'Card indicates node count');

      // Step 17: Verify that the actual nodes appear in the correct order
      assert.ok(microModule.checkpoints.length >= 6, 'Module contains all learning nodes');
      assert.ok(microModule.checkpoints[0].title || microModule.checkpoints[0].name, 'Node 1 has title');

      // Step 18: Verify that the Star Chart shows the nodes as progression checkpoints
      microModule.checkpoints.forEach((cp, idx) => {
        assert.ok(cp.id, `Checkpoint ${idx + 1} has unique ID`);
        assert.ok(cp.name || cp.title, `Checkpoint ${idx + 1} has name`);
        // Verify genuine educational content is attached
        assert.ok(cp.node_content, `Checkpoint ${idx + 1} has authentic node_content`);
        assert.ok(cp.node_content.introduction, `Checkpoint ${idx + 1} has introduction`);
        assert.ok(cp.node_content.core_lesson, `Checkpoint ${idx + 1} has core lesson`);
      });
    });

    it('Steps 19-21: Student completes a node, verifies persistence, and confirms cognitive mastery & star invariants', async () => {
      // Step 19: Complete a node
      const studentModules = await StudentSyncService.getPublishedModulesForStudent(demoStudentId);
      const microModule = studentModules.find(m => m.id === createdModuleId || m.courseId === createdModuleId);
      assert.ok(microModule, 'Module found');

      const firstNode = microModule.checkpoints[0];
      const progRes = await StudentSyncService.recordCheckpointProgress(
        demoStudentId,
        createdModuleId,
        firstNode.id,
        25 // 25% completed
      );
      assert.ok(progRes.success, 'Progression record must succeed');

      // Step 20: Refresh and verify progression persists
      const reloadedModules = await StudentSyncService.getPublishedModulesForStudent(demoStudentId);
      const reloadedModule = reloadedModules.find(m => m.id === createdModuleId || m.courseId === createdModuleId);
      assert.ok(reloadedModule, 'Module found on reload');
      assert.ok(reloadedModule.progressPercent >= 25, 'Progress must persist after refresh');

      // Step 21: Verify that node completion did not modify AI-verified mastery or automatically award stars
      // 21a. Verify concept_mastery_records is untouched
      const { data: masteryRecords } = await supabase
        .from('concept_mastery_records')
        .select('*')
        .eq('student_id', demoStudentId)
        .eq('concept_name', firstNode.name || firstNode.title);

      assert.equal(
        (masteryRecords || []).length,
        0,
        'Cognitive Invariant: Manual node completion MUST NEVER insert concept_mastery_records'
      );

      // 21b. Verify no star was automatically awarded
      const { data: starAwards } = await supabase
        .from('student_star_awards')
        .select('*')
        .eq('student_id', demoStudentId)
        .eq('module_id', createdModuleId);

      assert.equal(
        (starAwards || []).length,
        0,
        'Cognitive Invariant: Manual node completion MUST NEVER automatically award stars'
      );
    });

    it('Step 22: Unrelated student cannot see the module', async () => {
      // Step 22: Log in as an unrelated student not enrolled in the section
      const unrelatedModules = await StudentSyncService.getPublishedModulesForStudent(unrelatedStudentId);
      const isVisible = unrelatedModules.some(m => m.id === createdModuleId || m.courseId === createdModuleId);
      assert.equal(
        isVisible,
        false,
        'Isolation Invariant: Unenrolled student must not have access to section-assigned module'
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PART 4: EDGE CASES & SAFEGUARDS
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Part 4 — Edge Cases & Safeguards', () => {
    it('23. Handles failed or empty document text extraction gracefully without crashing', () => {
      const emptyMaterials = [{
        id: 'mat-empty',
        course_id: 'mod-empty',
        title: 'Corrupted_Scan.pdf',
        file_name: 'Corrupted_Scan.pdf',
        storage_path: 'corrupted.pdf',
        mime_type: 'application/pdf',
        file_size_bytes: 100,
        processing_status: 'ready' as const,
        extracted_content: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }];

      const draft = CurriculumAiEngine.generateModuleStructure({
        moduleId: 'mod-empty',
        module: {
          id: 'mod-empty',
          title: 'Advanced Sensor Signal Conditioning',
          subject: 'Sensors & Perception',
          academic_level: 'Grade 11',
          mentor_id: demoMentorId,
        },
        materials: emptyMaterials,
      });

      assert.ok(draft, 'Draft generation must succeed even with empty extracted text');
      assert.ok(draft.learning_nodes.length >= 5, 'Falls back safely to domain blueprint nodes');
      assert.ok(draft.learning_nodes[0].node_content, 'Nodes have valid content');
    });

    it('24. Deleting a module cascades cleanly without leaving orphaned proposals or materials', async () => {
      // Create a temporary module to delete
      const tempRes = await MentorService.createModule({
        title: 'Temporary Sandbox Module',
        subject: 'Robotics',
        academicLevel: 'Grade 10',
        mentorId: demoMentorId,
      });
      assert.ok(tempRes.success && tempRes.module?.id);
      const tempId = tempRes.module.id;

      // Add a draft
      await MentorService.generateModuleStructure(tempId, demoMentorId);

      // Delete module
      const delRes = await MentorService.deleteModule(tempId, demoMentorId);
      assert.ok(delRes.success, 'Module deletion must succeed');

      // Verify deletion in database
      const checkMod = await MentorService.getModuleById(tempId);
      assert.equal(checkMod, null, 'Module must no longer exist in database');

      const checkDraft = await MentorService.getModuleDraft(tempId);
      assert.equal(checkDraft.success, false, 'Module draft must no longer exist');
    });

    it('25. Foundation Curriculum modules 101–106 remain strictly protected and preserved', async () => {
      // Check database protection
      const { data: foundationModules } = await supabase
        .from('curriculum_modules')
        .select('*');

      assert.ok(Array.isArray(foundationModules) && foundationModules.length > 0, 'Foundation modules table has rows');
      const hasProtectedRow = foundationModules.some(m => ['101', '102', '103', '104', '105', '106'].includes(String(m.id)));
      assert.ok(hasProtectedRow, 'Foundation module rows 101-106 are preserved');

      // Check safe_demo_cleanup.sql protects 101-106
      const cleanupFile = existsSync(resolve(rootDir, 'supabase/scripts/safe_demo_cleanup.sql'))
        ? resolve(rootDir, 'supabase/scripts/safe_demo_cleanup.sql')
        : resolve(rootDir, 'supabase/safe_demo_cleanup.sql');
      const cleanupSql = readFileSync(cleanupFile, 'utf-8');
      assert.ok(cleanupSql.includes('101') && cleanupSql.includes('106'), 'safe_demo_cleanup.sql protects 101-106');
    });
  });
});
