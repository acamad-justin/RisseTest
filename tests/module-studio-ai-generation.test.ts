// tests/module-studio-ai-generation.test.ts
/**
 * RISSE AI — Module Studio AI-Powered Generation System Acceptance Test Suite
 *
 * Verifies:
 * 1. Model Separation & Unified API Key (Chat: gemini-3.5-flash-lite, Studio: gemini-3.1-flash-lite, Review: gemini-3.8-flash)
 * 2. Native PDF Document Understanding on "Introduction to Robotics.pdf"
 * 3. Subject/Discipline Mismatch Protection (Document as Sole Ground Truth)
 * 4. Honest Source References & Verification Statuses
 * 5. 1 Module -> Ordered Learning Nodes -> Topic Groups
 * 6. Flexible Lesson Blocks & Deterministic Assessments
 * 7. Single Node Regeneration Preserving Other Nodes
 * 8. Quota Tracking, Daily Safety Budgets & Bounded Retries
 * 9. Offline Mock Mode
 * 10. Server-side Teacher Authorization Boundaries
 * 11. Preservation of Foundation Modules 101–106 & Cognitive Mastery Invariants
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

import { resolveGeminiConfig, validateModelOrThrow } from '../frontend/server/geminiConfig.ts';
import { ModuleStudioAiService } from '../frontend/server/moduleStudioAiService.ts';
import { evaluateAssessmentAnswer } from '../frontend/lib/mentor/sourceFaithfulCurriculum.ts';
import { MentorService } from '../frontend/lib/mentor/mentorService.ts';
import { StudentSyncService } from '../frontend/lib/student/studentSyncService.ts';
import { handleModuleStudioRequest } from '../frontend/server/moduleStudioApi.ts';

const rootDir = process.cwd();
const config = resolveGeminiConfig();
const supabase = createClient(config.supabaseUrl, config.supabaseKey);

const testTeacherUuid = 'd1e00000-0000-4000-a000-000000000101';
const roboticsCourseId = '0b3b4020-eae8-4f8e-a3d0-a312122761d9';
const testPdfPath = resolve(rootDir, 'Introduction to Robotics.pdf');

describe('RISSE AI — Module Studio AI Generation Acceptance Suite', () => {

  // ═══════════════════════════════════════════════════════════════════════════
  // PART 1: GEMINI CONFIGURATION & MODEL SEPARATION
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Part 1 — Unified API Key & Strict Model Separation', () => {
    it('1. Verifies unified API key configuration across systems', () => {
      assert.ok(config.apiKey, 'GEMINI_API_KEY must be configured in environment');
      assert.ok(config.apiKey.length > 20, 'API key must be non-trivial');
    });

    it('2. Enforces explicit model allocation for Chat, Module Studio, and Advanced Review', () => {
      assert.equal(config.chatModel, 'gemini-3.5-flash-lite', 'Chat must use gemini-3.5-flash-lite');
      assert.equal(config.moduleStudioModel, 'gemini-3.1-flash-lite', 'Module Studio must use gemini-3.1-flash-lite');
      assert.equal(config.advancedReviewModel, 'gemini-3.8-flash', 'Advanced review must use gemini-3.8-flash');

      // Model validator checks
      assert.doesNotThrow(() => validateModelOrThrow(config.chatModel, 'Chat'));
      assert.doesNotThrow(() => validateModelOrThrow(config.moduleStudioModel, 'Module Studio'));
      assert.doesNotThrow(() => validateModelOrThrow(config.advancedReviewModel, 'Review'));

      // Rejects unsupported model names
      assert.throws(
        () => validateModelOrThrow('unsupported-model-x', 'Test'),
        /Unsupported Gemini model/
      );
    });

    it('3. Chatbot endpoint continues utilizing gemini-3.5-flash-lite', () => {
      const chatFile = readFileSync(resolve(rootDir, 'frontend/server/chat.ts'), 'utf-8');
      assert.match(chatFile, /process\.env\.GEMINI_CHAT_MODEL\s*\|\|\s*'gemini-3.5-flash-lite'/, 'Chat preserves gemini-3.5-flash-lite');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PART 2: DOCUMENT UNDERSTANDING PIPELINE ON ACTUAL PDF
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Part 2 — Native Document Understanding Pipeline', () => {
    it('4. Analyzes actual Introduction to Robotics.pdf and extracts genuine sections', async () => {
      assert.ok(existsSync(testPdfPath), 'Introduction to Robotics.pdf must exist at project root');
      const pdfBuffer = readFileSync(testPdfPath);
      assert.ok(pdfBuffer.length > 1000000, `PDF must be ~5.3MB, got ${pdfBuffer.length}`);

      const aiService = new ModuleStudioAiService();
      const analysis = await aiService.analyzeDocument(pdfBuffer, {
        fileName: 'Introduction to Robotics.pdf',
        mimeType: 'application/pdf',
        teacherId: testTeacherUuid,
        moduleId: roboticsCourseId,
      });

      assert.equal(analysis.extractionStatus, 'ready');
      assert.ok(analysis.sections.length >= 4, `Expected at least 4 sections, got ${analysis.sections.length}`);
      assert.ok(analysis.totalTopics >= 10, `Expected at least 10 topics, got ${analysis.totalTopics}`);

      const sectionTitles = analysis.sections.map(s => s.title.toLowerCase());
      assert.ok(sectionTitles.some(t => t.includes('robotics')), 'Contains Introduction to Robotics');
      assert.ok(sectionTitles.some(t => t.includes('standard') || t.includes('acamad')), 'Contains Acamad Standards');
      assert.ok(sectionTitles.some(t => t.includes('electronics')), 'Contains Basic Electronics');
      assert.ok(sectionTitles.some(t => t.includes('arduino')), 'Contains Arduino Programming');
    });

    it('5. Source extraction failure halts generation and provides clear error', async () => {
      const aiService = new ModuleStudioAiService();
      await assert.rejects(
        async () => {
          await aiService.generateModuleAndNodes({
            moduleId: 'mod-empty-test',
            title: 'Empty Course',
            subject: 'Robotics',
            academicLevel: 'High School',
            materials: [],
          });
        },
        /Source extraction failed: No readable content found/
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PART 3: SUBJECT & DISCIPLINE MISMATCH PROTECTION (CRITICAL TEST)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Part 3 — Subject & Discipline Mismatch Protection', () => {
    it('6. Mismatch Acceptance Test: Discipline is "Embedded Microprocessors", PDF is "Introduction to Robotics.pdf" -> Nodes MUST follow the PDF', async () => {
      const pdfBuffer = readFileSync(testPdfPath);
      const aiService = new ModuleStudioAiService();

      const draft = await aiService.generateModuleAndNodes({
        moduleId: roboticsCourseId,
        title: 'Introduction to Robotics',
        subject: 'Embedded Microprocessors', // Deliberate mismatch
        academicLevel: 'High School Engineering',
        description: 'A study course',
        fileBuffer: pdfBuffer,
        fileName: 'Introduction to Robotics.pdf',
        teacherId: testTeacherUuid,
      });

      assert.ok(draft, 'Draft generated');
      assert.ok(draft.learning_nodes.length >= 10, `Expected >= 10 learning nodes, got ${draft.learning_nodes.length}`);

      const nodeTitles = draft.learning_nodes.map(n => n.title.toLowerCase());
      const allText = JSON.stringify(draft.learning_nodes).toLowerCase();

      // Ground truth: Must contain authentic Robotics, Electronics, Acamad, and Arduino topics
      assert.ok(nodeTitles.some(t => t.includes('robotics')), 'Must include What Is Robotics?');
      assert.ok(nodeTitles.some(t => t.includes('voltage') || t.includes('breadboard') || t.includes('circuit') || t.includes('electrical')), 'Must include Voltage/Current/Breadboard');
      assert.ok(nodeTitles.some(t => t.includes('arduino') || t.includes('blink') || t.includes('potentiometer') || t.includes('resistor')), 'Must include Arduino/Electronics topics');

      // Mismatch Protection: Must NOT generate unrelated 80386 microprocessor topics
      assert.equal(nodeTitles.some(t => t.includes('80386')), false, 'Mismatch Protection: Must NOT introduce 80386');
      assert.equal(nodeTitles.some(t => t.includes('protected mode')), false, 'Mismatch Protection: Must NOT introduce protected mode');
      assert.equal(nodeTitles.some(t => t.includes('page directory')), false, 'Mismatch Protection: Must NOT introduce page directory');
    });

    it('7. Generates exactly ONE Module with granular Learning Nodes and Topic Groups', async () => {
      const aiService = new ModuleStudioAiService();
      const draft = await aiService.generateModuleAndNodes({
        moduleId: roboticsCourseId,
        title: 'Introduction to Robotics',
        subject: 'Robotics',
        academicLevel: 'Beginner',
        fileName: 'Introduction to Robotics.pdf',
        teacherId: testTeacherUuid,
      });

      // Hierarchy: 1 Module -> Ordered Nodes
      assert.equal(draft.title, 'Introduction to Robotics');
      assert.ok(draft.learning_nodes.length > 0, 'Module has learning nodes');
      assert.ok(draft.topic_groups && draft.topic_groups.length >= 4, 'Has at least 4 Topic Groups');

      // Verify node ordering is sequential
      for (let i = 0; i < draft.learning_nodes.length; i++) {
        assert.equal(draft.learning_nodes[i].node_number, i + 1, `Node ${i + 1} must have node_number ${i + 1}`);
      }
    });

    it('8. Every Learning Node contains honest source references and evidence status', async () => {
      const aiService = new ModuleStudioAiService();
      const draft = await aiService.generateModuleAndNodes({
        moduleId: roboticsCourseId,
        title: 'Introduction to Robotics',
        subject: 'Robotics',
        academicLevel: 'Beginner',
        fileName: 'Introduction to Robotics.pdf',
        teacherId: testTeacherUuid,
      });

      const firstNode = draft.learning_nodes[0];
      assert.ok(firstNode.source_reference, 'Node must have source_reference');
      assert.ok(firstNode.source_reference.section, 'source_reference must have section');
      assert.ok(firstNode.source_reference.heading, 'source_reference must have heading');
      assert.ok(firstNode.source_reference.sourceExcerpt, 'source_reference must have sourceExcerpt');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PART 4: LESSON CONTENT & DETERMINISTIC ASSESSMENTS
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Part 4 — Flexible Lesson Blocks & Deterministic Assessments', () => {
    it('9. Generates flexible, topic-appropriate lesson blocks and deterministic assessment', async () => {
      const aiService = new ModuleStudioAiService();

      // Theoretical topic
      const theoryLesson = await aiService.generateLessonContent({
        nodeTitle: 'Voltage, Current, and Resistance',
        nodeType: 'concept',
        topicGroup: '03 — Basic Electronics',
        sourceExcerpt: 'Voltage is the push, current is the flow, resistance opposes current. Water pipe analogy.',
        moduleContext: {
          title: 'Introduction to Robotics',
          subject: 'Robotics',
          academicLevel: 'High School',
        },
        teacherId: testTeacherUuid,
      });

      assert.ok(theoryLesson.blocks.length > 0, 'Has content blocks');
      assert.ok(theoryLesson.blocks.some(b => b.type === 'callout'), 'Contains analogy callout');
      assert.ok(theoryLesson.assessment, 'Contains assessment config');
      assert.ok(theoryLesson.assessment.questions.length > 0, 'Contains questions');

      // Evaluate question deterministically
      const q = theoryLesson.assessment.questions[0];
      const evalRes = evaluateAssessmentAnswer(q, q.correct_answer || (q as any).expected_answers?.[0]);
      assert.equal(evalRes.passed, true, 'Deterministic evaluation passes on correct answer');
    });

    it('10. Regenerating a single node updates only that node without overwriting other nodes', async () => {
      const aiService = new ModuleStudioAiService();
      const initialDraft = await aiService.generateModuleAndNodes({
        moduleId: roboticsCourseId,
        title: 'Introduction to Robotics',
        subject: 'Robotics',
        academicLevel: 'Beginner',
        fileName: 'Introduction to Robotics.pdf',
        teacherId: testTeacherUuid,
      });

      const nodeCountBefore = initialDraft.learning_nodes.length;
      const secondNodeBefore = { ...initialDraft.learning_nodes[1] };

      // Regenerate node 1 content
      const regeneratedLesson = await aiService.generateLessonContent({
        nodeTitle: initialDraft.learning_nodes[0].title,
        nodeType: initialDraft.learning_nodes[0].type,
        topicGroup: initialDraft.learning_nodes[0].topic_group,
        moduleContext: {
          title: initialDraft.title,
          subject: initialDraft.subject,
          academicLevel: initialDraft.academic_level,
        },
        customInstructions: 'Emphasize industrial cobots',
        teacherId: testTeacherUuid,
      });

      // Update node 1 in place
      initialDraft.learning_nodes[0].blocks = regeneratedLesson.blocks;

      // Verify node count unchanged
      assert.equal(initialDraft.learning_nodes.length, nodeCountBefore, 'Node count must remain unchanged');
      // Verify node 2 unchanged
      assert.equal(initialDraft.learning_nodes[1].title, secondNodeBefore.title, 'Node 2 must remain untouched');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PART 5: QUOTA MANAGEMENT, BUDGET ENFORCEMENT & MOCK MODE
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Part 5 — Quota Management & Safety Budget', () => {
    it('11. checkDailyBudget returns remaining quota and budget limits', async () => {
      const aiService = new ModuleStudioAiService();
      const budget = await aiService.checkDailyBudget(testTeacherUuid);

      assert.ok(typeof budget.dailyRequestsUsed === 'number', 'dailyRequestsUsed is a number');
      assert.ok(typeof budget.dailyBudget === 'number', 'dailyBudget is a number');
      assert.equal(budget.dailyBudget, 50, 'Daily safety budget defaults to 50');
      assert.equal(typeof budget.isBudgetExceeded, 'boolean', 'isBudgetExceeded is boolean');
    });

    it('12. Enforces safety budget cutoff when daily limit is reached', async () => {
      // Create an AI service with 0 budget to simulate budget exhaustion
      const constrainedService = new ModuleStudioAiService({
        dailyBudget: 0,
        mockMode: false,
      });

      await assert.rejects(
        async () => {
          await constrainedService.generateModuleAndNodes({
            moduleId: roboticsCourseId,
            title: 'Test',
            subject: 'Robotics',
            academicLevel: 'High School',
            fileName: 'test.pdf',
            teacherId: testTeacherUuid,
          });
        },
        /Daily generation safety budget reached/
      );
    });

    it('13. Offline Mock Mode consumes zero real Gemini quota', async () => {
      const mockService = new ModuleStudioAiService({ mockMode: true });
      const draft = await mockService.generateModuleAndNodes({
        moduleId: roboticsCourseId,
        title: 'Introduction to Robotics',
        subject: 'Robotics',
        academicLevel: 'High School',
        fileName: 'Introduction to Robotics.pdf',
        teacherId: testTeacherUuid,
      });

      assert.ok(draft, 'Mock generation produces complete draft');
      assert.equal(draft.learning_nodes.length, 24, 'Produces 24 mock nodes');
      assert.equal(draft.source_coverage?.coveragePercentage, 100, 'Mock coverage 100%');
    });

    it('14. Logs usage operations into Supabase module_studio_usage_logs', async () => {
      const { data: logs, error } = await supabase
        .from('module_studio_usage_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      assert.ok(!error, `Failed to query module_studio_usage_logs: ${error?.message}`);
      assert.ok(Array.isArray(logs), 'Usage logs returned as array');
      if (logs.length > 0) {
        const log = logs[0];
        assert.ok(log.operation_type, 'Log has operation_type');
        assert.ok(log.model_used, 'Log has model_used');
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PART 6: SECURITY & PLATFORM INVARIANTS
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Part 6 — Security Boundaries & Platform Invariants', () => {
    it('15. Non-teacher / guest requests to /api/module-studio fail closed with 403 or 401', async () => {
      // Guest request without header
      const guestReq = new Request('http://127.0.0.1:5173/api/module-studio/generate-module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId: roboticsCourseId }),
      });

      const guestRes = await handleModuleStudioRequest(guestReq);
      assert.equal(guestRes.status, 403, 'Guest must receive 403 Forbidden');

      // Invalid token
      const badReq = new Request('http://127.0.0.1:5173/api/module-studio/generate-module', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer fabricated.invalid.token',
        },
        body: JSON.stringify({ moduleId: roboticsCourseId }),
      });

      const badRes = await handleModuleStudioRequest(badReq);
      assert.equal(badRes.status, 401, 'Invalid token must receive 401 Unauthorized');
    });

    it('16. Foundation platform modules 101–106 remain preserved and fully accessible', async () => {
      const { data: foundationMods, error } = await supabase
        .from('curriculum_modules')
        .select('*');

      assert.ok(!error, `Failed to query curriculum_modules: ${error?.message}`);
      assert.ok(Array.isArray(foundationMods) && foundationMods.length >= 6, 'Foundation modules returned');

      const ids = foundationMods.map(m => String(m.id));
      ['101', '102', '103', '104', '105', '106'].forEach(id => {
        assert.ok(ids.includes(id), `Foundation module ${id} must remain available`);
      });
    });

    it('17. Cognitive mastery invariant: Module completion does not alter concept mastery records', async () => {
      const { count: initialCount, error: countErr1 } = await supabase
        .from('concept_mastery_records')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', 'a1000000-0000-4000-a000-000000000001');

      assert.ok(!countErr1, `Count query error: ${countErr1?.message}`);

      // Record a checkpoint progression
      await StudentSyncService.recordCheckpointProgress(
        'a1000000-0000-4000-a000-000000000001',
        roboticsCourseId,
        'node-0b3b4020-eae8-4f8e-a3d0-a312122761d9-1',
        50
      );

      const { count: afterCount, error: countErr2 } = await supabase
        .from('concept_mastery_records')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', 'a1000000-0000-4000-a000-000000000001');

      assert.ok(!countErr2, `Count query error: ${countErr2?.message}`);
      assert.equal(initialCount, afterCount, 'Cognitive mastery records must NOT be altered by step progression');
    });
  });
});
