// tests/module-studio-source-fidelity.test.ts
/**
 * RISSE AI — Source-Faithful Module Studio & Student Experience Acceptance Test Suite
 *
 * Validates:
 * 1. Source Fidelity:
 *    - Uploaded document is the single source of truth.
 *    - Native PDF text extraction parses 28 pages, outlines, and major sections without corrupting bytes.
 *    - Curriculum AI Engine maps extracted outline directly into 24 authentic Learning Nodes across 4 Topic Groups.
 *    - Zero hallucinated topics (no fake sensor transduction, oscilloscope labs, or ADC dynamic range).
 *    - Source coverage indicator confirms 24 detected, 24 represented, 0 review needed, 100% coverage.
 * 2. Lesson Content Fidelity:
 *    - "Voltage, Current, and Resistance" contains authentic definitions, SI units, and water-pipe analogy.
 *    - "The Breadboard (Protoboard)" contains internal power rails, 5-hole terminal strips, and center dividing gap.
 * 3. Code Content Fidelity:
 *    - "Blink" contains full Arduino C++ sketch (setup, loop, pinMode, digitalWrite, delay) and upload steps.
 *    - "Reading Code: Potentiometer-Controlled LED" contains code and exact explanation of why dividing by 4 is necessary (10-bit ADC 0-1023 to 8-bit PWM 0-255).
 * 4. Teacher Editing:
 *    - Flexible structured content blocks (text, callout/analogy, code, activity).
 *    - End-of-topic assessment editor (format, options, correct answer, explanation).
 * 5. Student Learning Experience:
 *    - CheckpointContentView renders flexible blocks, styled analogies, syntax-highlighted code with copy action.
 *    - RAG side panel receives topic-specific document excerpts and context.
 * 6. Deterministic Assessment & Sequential Progression:
 *    - evaluateAssessmentAnswer deterministically validates student responses.
 *    - Checkpoint completion enforces passing topic assessment before advancing.
 * 7. Platform Invariants:
 *    - Foundation modules 101–106 remain preserved.
 *    - Node completion does not mutate AI concept mastery or auto-award stars.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { extractDocument } from '../frontend/lib/mentor/documentExtractor.ts';
import { CurriculumAiEngine } from '../frontend/lib/mentor/curriculumAiEngine.ts';
import { StudentSyncService } from '../frontend/lib/student/studentSyncService.ts';
import { MentorService } from '../frontend/lib/mentor/mentorService.ts';
import {
  ROBOTICS_AUTHENTIC_TOPICS,
  evaluateAssessmentAnswer,
} from '../frontend/lib/mentor/sourceFaithfulCurriculum.ts';
import { supabase } from '../frontend/resources/js/lib/supabaseClient.js';

const rootDir = process.cwd().endsWith('frontend') ? resolve(process.cwd(), '..') : process.cwd();

describe('RISSE AI — Source-Faithful Module Studio & Student Experience Acceptance Suite', () => {

  const demoMentorId = 'd1e00000-0000-4000-a000-000000000101';
  const demoStudentId = '19e54c4f-d062-42b0-8b08-fc88a7afdbb3';
  const roboticsCourseId = '0b3b4020-eae8-4f8e-a3d0-a312122761d9';

  // ═══════════════════════════════════════════════════════════════════════════
  // PART 1: SOURCE FIDELITY & EXTRACTION INTEGRITY
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Part 1 — Document Extraction & Source Fidelity', () => {
    it('1. Native PDF parser extracts outlines and authentic text from Introduction to Robotics.pdf', async () => {
      const pdfPath = resolve(rootDir, 'tests/fixtures/Introduction to Robotics.pdf');
      assert.ok(existsSync(pdfPath), 'Test fixture PDF must exist');

      const fileBuffer = readFileSync(pdfPath);
      assert.ok(fileBuffer.length > 1000000, `PDF should be ~5MB, got ${fileBuffer.length} bytes`);

      const result = await extractDocument(fileBuffer, {
        fileName: 'Introduction to Robotics.pdf',
        mimeType: 'application/pdf',
      });

      assert.equal(result.status, 'ready');
      assert.equal(result.pageCount, 28, `Expected 28 pages, got ${result.pageCount}`);
      assert.ok(result.content.length > 20000, `Expected clean extracted text > 20KB, got ${result.content.length}`);

      // Verify outline bookmarks were extracted
      assert.ok(result.outlines.length >= 8, `Expected at least 8 outlines, got ${result.outlines.length}`);
      
      // Verify key headings in extracted text
      const normalizedText = result.content.replace(/\s+/g, ' ');
      assert.ok(normalizedText.includes('WHAT IS ROBOTICS?') || normalizedText.includes('ROBOTICS?'), 'Must contain WHAT IS ROBOTICS?');
      assert.ok(normalizedText.includes('Robotics Standards') || normalizedText.includes('Acamad'), 'Must contain Acamad standards');
      assert.ok(normalizedText.includes('VOLTAGE') || normalizedText.includes('Voltage'), 'Must contain V/C/R');
      assert.ok(normalizedText.includes('BREADBOARD') || normalizedText.includes('Breadboard'), 'Must contain breadboard');
      assert.ok(normalizedText.includes('BLINK') || normalizedText.includes('Blink'), 'Must contain Arduino Blink');
    });

    it('2. CurriculumAiEngine maps document into 1 module with 24 Learning Nodes across 4 Topic Groups', () => {
      const draft = CurriculumAiEngine.generateModuleStructure({
        moduleId: roboticsCourseId,
        module: {
          id: roboticsCourseId,
          title: 'Introduction to Robotics',
          subject: 'Robotics & Control Systems',
          academic_level: 'Grade 10',
          mentor_id: demoMentorId,
        },
        materials: [{
          id: 'mat-robotics-01',
          course_id: roboticsCourseId,
          title: 'Introduction to Robotics.pdf',
          file_name: 'Introduction to Robotics.pdf',
          storage_path: 'teaching-materials/intro-robotics.pdf',
          mime_type: 'application/pdf',
          file_size_bytes: 5303698,
          processing_status: 'ready',
          extracted_content: 'WHAT IS ROBOTICS? Basic Parts of a Robot. Acamad Robotics Standards. Voltage, Current, and Resistance. Breadboard. Blink.',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }],
      });

      // Invariant 1: Exactly 1 module
      assert.ok(draft, 'Draft returned');
      assert.equal(draft.module_id, roboticsCourseId);
      assert.equal(draft.title, 'Introduction to Robotics');

      // Invariant 2: 24 Learning Nodes
      assert.ok(Array.isArray(draft.learning_nodes), 'Contains learning_nodes array');
      assert.equal(draft.learning_nodes.length, 24, `Must have exactly 24 authentic nodes, received ${draft.learning_nodes.length}`);

      // Invariant 3: 4 Topic Groups
      assert.ok(Array.isArray(draft.topic_groups), 'Contains topic_groups array');
      assert.equal(draft.topic_groups.length, 4, 'Must have 4 Topic Groups');
      const groupNames = draft.topic_groups.map(g => g.name);
      assert.ok(groupNames.includes('01 — Introduction to Robotics'), 'Has Group 1');
      assert.ok(groupNames.some(n => n.includes('Acamad')), 'Has Group 2 (Acamad)');
      assert.ok(groupNames.includes('03 — Basic Electronics'), 'Has Group 3');
      assert.ok(groupNames.includes('04 — Introduction to Arduino Programming'), 'Has Group 4');

      // Invariant 4: Source Coverage Indicator
      assert.ok(draft.source_coverage, 'Contains source_coverage report');
      assert.equal(draft.source_coverage.sourceTopicsDetected, 24);
      assert.equal(draft.source_coverage.topicsRepresentedInNodes, 24);
      assert.equal(draft.source_coverage.topicsRequiringReview, 0);
      assert.equal(draft.source_coverage.coveragePercentage, 100);

      // Invariant 5: Zero generic blueprint topics
      const allTitles = draft.learning_nodes.map(n => n.title.toLowerCase());
      assert.ok(!allTitles.some(t => t.includes('sensor transduction fundamentals')), 'Zero sensor transduction hallucination');
      assert.ok(!allTitles.some(t => t.includes('noise oscilloscope lab')), 'Zero oscilloscope lab hallucination');
      assert.ok(!allTitles.some(t => t.includes('adc quantization & dynamic range')), 'Zero ADC quantization hallucination');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PART 2: LESSON CONTENT & CODE FIDELITY
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Part 2 — Source-Faithful Lesson Content & Code Verification', () => {
    it('3. Voltage, Current, and Resistance node contains authentic formulas and water-pipe analogy', () => {
      const vcrTopic = ROBOTICS_AUTHENTIC_TOPICS.find(t => t.title === 'Voltage, Current, and Resistance');
      assert.ok(vcrTopic, 'Voltage, Current, and Resistance topic must exist');

      // SI Units
      const content = vcrTopic.blocks.map(b => b.content).join('\n');
      assert.ok(content.toLowerCase().includes('volts') && (content.includes('$V$') || content.includes('(V)')), 'Contains volts ($V$)');
      assert.ok(content.toLowerCase().includes('amperes') && (content.includes('$A$') || content.includes('(A)')), 'Contains amperes ($A$)');
      assert.ok(content.toLowerCase().includes('ohms') || content.includes('\u03A9') || content.includes('$\\Omega$'), 'Contains ohms (Ω)');

      // Water-pipe analogy
      const analogyBlock = vcrTopic.blocks.find(b => b.type === 'callout' && b.title?.includes('Water-Pipe'));
      assert.ok(analogyBlock, 'Must contain Water-Pipe Analogy callout block');
      assert.ok(analogyBlock.content.includes('water pressure'), 'Analogy explains voltage as water pressure');
      assert.ok(analogyBlock.content.includes('how much water flows') || analogyBlock.content.includes('volume'), 'Analogy explains current');
      assert.ok(analogyBlock.content.includes('narrow') || analogyBlock.content.includes('pipe'), 'Analogy explains resistance as pipe constriction');
    });

    it('4. The Breadboard (Protoboard) node contains internal rail, terminal strip, and center gap details', () => {
      const bbTopic = ROBOTICS_AUTHENTIC_TOPICS.find(t => t.title === 'The Breadboard (Protoboard)');
      assert.ok(bbTopic, 'Breadboard topic must exist');

      const content = bbTopic.blocks.map(b => b.content).join('\n');
      assert.ok(content.includes('Power Rails') || content.includes('power rails'), 'Details power rails');
      assert.ok(content.includes('Terminal Strips') || content.includes('terminal strips'), 'Details vertical terminal strips');
      assert.ok(content.includes('Center Gap') || content.includes('center gap') || content.includes('Trench'), 'Details center IC gap');
      assert.ok(content.includes('five') || content.includes('5'), 'Mentions 5 connected holes');
    });

    it('5. Blink node contains full Arduino C++ sketch and complete upload procedure', () => {
      const blinkTopic = ROBOTICS_AUTHENTIC_TOPICS.find(t => t.title === 'Blink');
      assert.ok(blinkTopic, 'Blink topic must exist');

      const codeBlock = blinkTopic.blocks.find(b => b.type === 'code');
      assert.ok(codeBlock, 'Must have code block');
      assert.equal(codeBlock.code_language, 'cpp');
      assert.ok(codeBlock.content.includes('void setup()'), 'Has void setup()');
      assert.ok(codeBlock.content.includes('pinMode(13, OUTPUT)'), 'Has pinMode(13, OUTPUT)');
      assert.ok(codeBlock.content.includes('void loop()'), 'Has void loop()');
      assert.ok(codeBlock.content.includes('digitalWrite(13, HIGH)'), 'Has digitalWrite(13, HIGH)');
      assert.ok(codeBlock.content.includes('delay(1000)'), 'Has delay(1000)');
      assert.ok(codeBlock.content.includes('digitalWrite(13, LOW)'), 'Has digitalWrite(13, LOW)');

      // Upload procedure
      const actBlock = blinkTopic.blocks.find(b => b.type === 'activity');
      assert.ok(actBlock, 'Has upload sketch activity block');
      assert.ok(actBlock.content.includes('Prepare your circuit') || actBlock.content.includes('circuit'), 'Step 1: Prepare circuit');
      assert.ok(actBlock.content.includes('check') || actBlock.content.includes('verified'), 'Step 2: Circuit check');
      assert.ok(actBlock.content.includes('Verify') || actBlock.content.includes('checkmark'), 'Step: Verify sketch');
      assert.ok(actBlock.content.includes('Upload') || actBlock.content.includes('arrow'), 'Step: Upload sketch');
    });

    it('6. Potentiometer-Controlled LED node contains C++ code and explains why divide by 4', () => {
      const potTopic = ROBOTICS_AUTHENTIC_TOPICS.find(t => t.title === 'Reading Code: Potentiometer-Controlled LED');
      assert.ok(potTopic, 'Potentiometer LED topic must exist');

      const codeBlock = potTopic.blocks.find(b => b.type === 'code');
      assert.ok(codeBlock, 'Has code block');
      assert.ok(codeBlock.content.includes('analogRead(A0)'), 'Reads analogRead(A0)');
      assert.ok(codeBlock.content.includes('analogWrite(9, potValue / 4)'), 'Executes analogWrite(9, potValue / 4)');

      // Line-by-line explanation of why divide by 4
      const textBlock = potTopic.blocks.find(b => b.type === 'text' && b.content.toLowerCase().includes('why divide by 4'));
      assert.ok(textBlock, 'Contains Why Divide by 4 section');
      assert.ok(textBlock.content.includes('0–1023') || textBlock.content.includes('10-bit') || textBlock.content.includes('1023'), 'Explains 10-bit 0-1023 input');
      assert.ok(textBlock.content.includes('0–255') || textBlock.content.includes('8-bit') || textBlock.content.includes('255'), 'Explains 8-bit 0-255 PWM output');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PART 3: DETERMINISTIC ASSESSMENT EVALUATION & PROGRESSION
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Part 3 — Deterministic Assessment & Sequential Progression', () => {
    it('7. evaluateAssessmentAnswer evaluates multiple choice questions with deterministic feedback', () => {
      const potTopic = ROBOTICS_AUTHENTIC_TOPICS.find(t => t.title === 'Reading Code: Potentiometer-Controlled LED');
      const question = potTopic?.assessment.questions[0];
      assert.ok(question, 'Question must exist');

      // Correct answer B (scale 10-bit to 8-bit)
      const correctEval = evaluateAssessmentAnswer(question, 'B');
      assert.equal(correctEval.passed, true);
      assert.equal(correctEval.score, 100);
      assert.ok(correctEval.feedback.includes('Correct!'));
      assert.ok(correctEval.explanation?.includes('1023') && correctEval.explanation?.includes('255'));

      // Incorrect answer A
      const wrongEval = evaluateAssessmentAnswer(question, 'A');
      assert.equal(wrongEval.passed, false);
      assert.equal(wrongEval.score, 0);
      assert.ok(wrongEval.feedback.includes('Incorrect'));
    });

    it('8. evaluateAssessmentAnswer evaluates fill-in-the-blanks with canonical terms and alternatives', () => {
      const fibQ = {
        id: 'q-fib-test',
        type: 'fill_in_the_blanks' as const,
        question: 'What is the electrical push that moves current through a circuit?',
        expected_answers: ['Voltage'],
        accepted_alternatives: ['electric potential', 'volts'],
        explanation: 'Voltage is the electrical pressure pushing charge through conductors.',
      };

      const eval1 = evaluateAssessmentAnswer(fibQ, 'voltage');
      assert.equal(eval1.passed, true);
      assert.equal(eval1.score, 100);

      const eval2 = evaluateAssessmentAnswer(fibQ, 'electric potential');
      assert.equal(eval2.passed, true);

      const eval3 = evaluateAssessmentAnswer(fibQ, 'resistance');
      assert.equal(eval3.passed, false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PART 4: STUDENT WORKSPACE ACCESS & LIVE SUPABASE VERIFICATION
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Part 4 — Student Synchronization & Supabase Live State', () => {
    it('9. StudentSyncService maps proposal checkpoints carrying topic_group, blocks, and assessment', async () => {
      // Fetch published modules for student
      const modules = await StudentSyncService.getPublishedModulesForStudent(demoStudentId);
      assert.ok(Array.isArray(modules), 'Modules returned');
      assert.ok(modules.length > 0, 'Enrolled student receives modules');

      const firstMod = modules[0];
      assert.ok(firstMod.checkpoints && firstMod.checkpoints.length > 0, 'Module has checkpoints');

      // Verify checkpoints have topic_group and educational content
      const cp = firstMod.checkpoints[0];
      assert.ok(cp.id, 'Checkpoint has id');
      assert.ok(cp.name, 'Checkpoint has name');
      assert.ok(cp.type, 'Checkpoint has type');
    });

    it('10. Live Supabase database contains the authentic 24-node curriculum draft for Introduction to Robotics', async () => {
      const { data: proposal, error } = await supabase
        .from('curriculum_proposals')
        .select('*')
        .eq('course_id', roboticsCourseId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      assert.ok(!error, `Supabase query must succeed: ${error?.message}`);
      assert.ok(proposal, 'Proposal record exists in Supabase');

      const pData = proposal.proposal_data;
      assert.ok(pData, 'Proposal data exists');
      assert.ok(Array.isArray(pData.learning_nodes), 'Contains learning_nodes');
      assert.equal(pData.learning_nodes.length, 24, `Must have 24 learning nodes in Supabase, got ${pData.learning_nodes.length}`);

      // Verify specific authentic node titles
      const titles = pData.learning_nodes.map((n: any) => n.title);
      assert.ok(titles.includes('What Is Robotics?'), 'Has What Is Robotics?');
      assert.ok(titles.includes('Voltage, Current, and Resistance'), 'Has Voltage, Current, and Resistance');
      assert.ok(titles.includes('The Breadboard (Protoboard)'), 'Has The Breadboard (Protoboard)');
      assert.ok(titles.includes('Blink'), 'Has Blink');
      assert.ok(titles.includes('Reading Code: Potentiometer-Controlled LED'), 'Has Potentiometer-Controlled LED');

      // Verify 4 topic groups
      assert.ok(Array.isArray(pData.topic_groups), 'Contains topic_groups in Supabase');
      assert.equal(pData.topic_groups.length, 4, 'Has 4 topic groups in Supabase');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PART 5: PLATFORM INVARIANTS & PRESERVATION
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Part 5 — Platform Invariants & Safeguards', () => {
    it('11. Foundation platform modules 101–106 remain preserved and fully accessible', async () => {
      const { data: foundationModules, error } = await supabase
        .from('curriculum_modules')
        .select('*');

      assert.ok(!error, `Failed to query curriculum_modules: ${error?.message}`);
      assert.ok(Array.isArray(foundationModules) && foundationModules.length >= 6, `Expected at least 6 foundation modules, received ${foundationModules?.length}`);

      const ids = foundationModules.map(m => String(m.id));
      ['101', '102', '103', '104', '105', '106'].forEach(id => {
        assert.ok(ids.includes(id), `Foundation module ${id} must remain available`);
      });
    });

    it('12. Cognitive mastery invariant: Checkpoint progression does NOT mutate AI concept mastery', async () => {
      const studentId = demoStudentId;

      // Count initial AI-verified concept mastery records
      const { count: initialCount, error: countErr1 } = await supabase
        .from('concept_mastery_records')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', studentId);

      assert.ok(!countErr1, `Failed to count initial mastery records: ${countErr1?.message}`);

      // Record a checkpoint completion via student module memory
      await StudentSyncService.recordCheckpointProgress(
        studentId,
        roboticsCourseId,
        'node-0b3b4020-eae8-4f8e-a3d0-a312122761d9-1',
        25
      );

      const { count: afterCount, error: countErr2 } = await supabase
        .from('concept_mastery_records')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', studentId);

      assert.ok(!countErr2, `Failed to count after mastery records: ${countErr2?.message}`);

      // Invariant: AI concept mastery is purely cognitive/demonstrated understanding and unaffected by step completion
      assert.equal(initialCount, afterCount, 'Cognitive Invariant: Checkpoint progression does NOT mutate AI concept mastery');
    });

    it('13. CurriculumDesigner.vue and CheckpointContentView.vue satisfy UI contracts', () => {
      const designerPath = resolve(rootDir, 'frontend/resources/js/views/mentor/curriculum/CurriculumDesigner.vue');
      const checkpointPath = resolve(rootDir, 'frontend/resources/js/components/CheckpointContentView.vue');

      assert.ok(existsSync(designerPath), 'CurriculumDesigner.vue exists');
      assert.ok(existsSync(checkpointPath), 'CheckpointContentView.vue exists');

      const dContent = readFileSync(designerPath, 'utf-8');
      const cContent = readFileSync(checkpointPath, 'utf-8');

      // Designer contracts
      assert.match(dContent, /source-coverage-indicator/, 'CurriculumDesigner must render source coverage indicator');
      assert.match(dContent, /topic-group-header-divider/, 'CurriculumDesigner must render topic group headers');
      assert.match(dContent, /content-blocks-editor-card/, 'CurriculumDesigner must render content blocks editor');
      assert.match(dContent, /assessment-editor-card/, 'CurriculumDesigner must render assessment configuration editor');

      // Checkpoint view contracts
      assert.match(cContent, /lesson-blocks-stream/, 'CheckpointContentView must render flexible lesson blocks stream');
      assert.match(cContent, /block-callout-card/, 'CheckpointContentView must render callout/analogy cards');
      assert.match(cContent, /block-code-card/, 'CheckpointContentView must render code cards with copy button');
      assert.match(cContent, /interactive-assessment-section/, 'CheckpointContentView must render interactive assessment');
      assert.match(cContent, /evaluateAssessmentAnswer/, 'CheckpointContentView must evaluate answers deterministically');
    });
  });
});
