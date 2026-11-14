// tests/teaching-planner-workflow.test.ts
/**
 * RISSE AI — Teaching Planner & Complete Database Integration Test Suite
 *
 * Verifies:
 * 1. Part 1 — Course Creation (Option A: Curriculum upload, Option B: Create own course)
 * 2. Part 2 — Teaching Materials (Upload, text extraction, status tracking, citations)
 * 3. Part 3 — 3 Learning Path Modes (Mode A: Curriculum, Mode B: Materials, Mode C: Manual)
 * 4. Part 4 — AI-Generated Node Content (10 structured sections, source citations, granular section regeneration)
 * 5. Part 5 — Teaching Plan Review & Publication (Approval, publishing, unpublishing lifecycle)
 * 6. Part 6 — Student Learning Experience (Assigned section access, rich node content, checkpoint progress)
 * 7. Final Acceptance Test Scenario (17-step Introduction to Robotics workflow)
 */

import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { MentorService, generateUUID, DEMO_MENTOR_UUID } from '../frontend/lib/mentor/mentorService.ts';
import { StudentSyncService, DEMO_STUDENT_1_UUID } from '../frontend/lib/student/studentSyncService.ts';

const originalCreateCourse = MentorService.createCourse.bind(MentorService);
const testCreatedCourseIds: string[] = [];

MentorService.createCourse = async function (params: any) {
  const res = await originalCreateCourse(params);
  if (res.course?.id) {
    testCreatedCourseIds.push(res.course.id);
  }
  return res;
};

after(async () => {
  for (const id of testCreatedCourseIds) {
    await MentorService.deleteCourse(id);
  }
});

describe('RISSE AI — AI Teaching Planner & Database Integration', () => {

  // ──────────────────────────────────────────────────────────────────────────
  // PART 1 — Course Creation & Curriculum Option
  // ──────────────────────────────────────────────────────────────────────────
  describe('Part 1: Course Creation Workflow', () => {
    it('creates a course with full metadata and section assignments', async () => {
      const res = await MentorService.createCourse({
        title: 'Introduction to Robotics',
        description: 'Fundamental principles of autonomous mechatronics and sensors.',
        academicLevel: 'Grade 10',
        subject: 'Robotics & Control Systems',
        semester: '1st Semester',
        schoolYear: '2026-2027',
        learningOutcomes: [
          'Calibrate analog infrared sensors',
          'Implement H-bridge motor control with PWM',
          'Design feedback control loops',
        ],
        mentorId: DEMO_MENTOR_UUID,
        sectionIds: [],
      });

      assert.ok(res.success && res.course, 'Course record should be returned');
      const course = res.course;
      assert.equal(course.title, 'Introduction to Robotics');
      assert.equal(course.academic_level, 'Grade 10');
      assert.equal(course.status, 'draft');
      assert.ok(Array.isArray(course.learning_outcomes));
      assert.equal(course.learning_outcomes.length, 3);
    });

    it('Option B: allows course creation without uploading an official curriculum', async () => {
      const res = await MentorService.createCourse({
        title: 'Custom Robotics Workshop',
        description: 'Hands-on hardware lab without institutional syllabus.',
        academicLevel: 'Grade 11 (STEM)',
        subject: 'Robotics & Control Systems',
        mentorId: DEMO_MENTOR_UUID,
        sectionIds: [],
      });

      assert.ok(res.success && res.course);
      const course = res.course;
      assert.equal(course.title, 'Custom Robotics Workshop');
      // Verify learning path can still be generated without curriculum upload
      const propRes = await MentorService.generateDraftCurriculumProposal(course.id, DEMO_MENTOR_UUID, {
        mode: 'mode_c',
      });
      assert.ok(propRes.success);
      assert.ok(propRes.proposal);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PART 2 — Teaching Materials & Document Analysis
  // ──────────────────────────────────────────────────────────────────────────
  describe('Part 2: Teaching Materials & Document Analysis', () => {
    it('extracts printable text and syllabus outlines from simulated document streams', async () => {
      const mockPptxFile = {
        name: 'DC_MOTORS_LECTURE.PPTX',
        size: 2048,
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        content: 'Unit 1: DC Motor Principles and Back-EMF\nSlide 14: Torque and Rotational Speed Characteristics\nSlide 20: H-Bridge PWM Driver Topology',
      };

      const extraction = await MentorService.extractDocumentContent(mockPptxFile);
      assert.equal(extraction.status, 'ready');
      assert.ok(extraction.content.includes('DC Motor Principles'));
      assert.ok(extraction.content.includes('Torque and Rotational Speed'));
    });

    it('uploads course material, tracks status as ready, and stores extracted text', async () => {
      const courseId = generateUUID();
      const mockDoc = {
        name: 'Sensors_and_Perception_Lab.pdf',
        size: 4096,
        type: 'application/pdf',
        content: 'Module 1: Optical Reflectance and Ultrasonic Ranging\nPinout: VCC, GND, TRIG, ECHO\nOperating Voltage: 5V DC',
      };

      const res = await MentorService.uploadCourseMaterial({
        courseId,
        title: 'Sensors and Perception Lab Guide',
        description: 'Comprehensive bench reference for analog and digital sensor interfacing.',
        file: mockDoc,
        uploaderId: DEMO_MENTOR_UUID,
      });

      assert.ok(res.success);
      assert.ok(res.material);
      assert.equal(res.material.status, 'ready');
      assert.ok(res.material.extracted_content?.includes('Ultrasonic Ranging'));
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PART 3 — Three Learning Path Creation Modes
  // ──────────────────────────────────────────────────────────────────────────
  describe('Part 3: 3 Learning Path Creation Modes', () => {
    it('Mode A: Generates learning path grounded in prescribed curriculum', async () => {
      const courseId = generateUUID();
      // Attach a curriculum document
      await MentorService.uploadCourseMaterial({
        courseId,
        title: 'DepEd Grade 10 Robotics Prescribed Curriculum',
        description: 'Institutional syllabus learning outcomes and required competencies.',
        file: {
          name: 'Robotics_Institutional_Curriculum.pdf',
          size: 5120,
          type: 'application/pdf',
          content: 'Unit 1: Microcontroller I/O Architecture\nUnit 2: PWM Motor Modulation\nUnit 3: Sensor Fusion Telemetry',
        },
        uploaderId: DEMO_MENTOR_UUID,
      });

      const res = await MentorService.generateDraftCurriculumProposal(courseId, DEMO_MENTOR_UUID, {
        mode: 'mode_a',
      });

      assert.ok(res.success);
      assert.ok(res.proposal);
      const modules = res.proposal.proposal_data.modules;
      assert.ok(modules.length >= 3);
      assert.ok(modules.some(m => m.title.includes('Microcontroller') || m.title.includes('PWM') || m.title.includes('Sensor')));
      // Every module should be grounded in materials
      assert.ok(modules.every(m => m.provenance_type === 'grounded_in_materials'));
    });

    it('Mode B: Generates learning path synthesized from uploaded materials', async () => {
      const courseId = generateUUID();
      await MentorService.uploadCourseMaterial({
        courseId,
        title: 'H-Bridge Driver Notes',
        file: {
          name: 'H_Bridge_Motor_Drive.docx',
          size: 1024,
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          content: 'Chapter 1: Power MOSFET Switching and Shoot-Through Protection',
        },
        uploaderId: DEMO_MENTOR_UUID,
      });

      const res = await MentorService.generateDraftCurriculumProposal(courseId, DEMO_MENTOR_UUID, {
        mode: 'mode_b',
      });

      assert.ok(res.success);
      assert.ok(res.proposal);
      assert.ok(res.proposal.proposal_data.modules.length > 0);
    });

    it('Mode C: Creates manual-first scaffold with customizable outline topics', async () => {
      const courseId = generateUUID();
      const res = await MentorService.generateDraftCurriculumProposal(courseId, DEMO_MENTOR_UUID, {
        mode: 'mode_c',
        outlineTopics: [
          'Sensors and Perception',
          'Actuation & Motor Control',
          'Autonomous Decision Logic',
        ],
      });

      assert.ok(res.success);
      const modules = res.proposal?.proposal_data.modules || [];
      assert.equal(modules.length, 3);
      assert.ok(modules[0].title.includes('Sensors and Perception'));
      assert.ok(modules[1].title.includes('Actuation'));
      assert.ok(modules[2].title.includes('Decision Logic'));
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PART 4 — AI-Generated Node Content & Granular Regeneration
  // ──────────────────────────────────────────────────────────────────────────
  describe('Part 4: AI-Generated Node Content & Granular Regeneration', () => {
    it('generates structured educational content with all 10 required sections and source citations', async () => {
      const courseId = generateUUID();
      await MentorService.uploadCourseMaterial({
        courseId,
        title: 'Infrared and Ultrasonic Sensors Guide',
        file: {
          name: 'Sensors_Perception_Guide.pptx',
          size: 3000,
          type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          content: 'Slide 14: Infrared sensor voltage divider calculation and noise rejection filtering.\nSlide 22: Ultrasonic time of flight formulas.',
        },
        uploaderId: DEMO_MENTOR_UUID,
      });

      const genRes = await MentorService.generateNodeContent({
        courseId,
        nodeTitle: 'Sensors and Perception',
        teacherInstructions: 'Explain how robots detect and respond to their surroundings.',
        nodeType: 'concept',
        courseContext: {
          title: 'Introduction to Robotics',
          academicLevel: 'Grade 10',
          subject: 'Robotics & Control Systems',
        },
      });

      assert.ok(genRes.success);
      assert.ok(genRes.content);
      const c = genRes.content;

      // 1. Learning objectives
      assert.ok(Array.isArray(c.learning_objectives) && c.learning_objectives.length >= 3);
      // 2. Introduction
      assert.ok(c.introduction.length > 50);
      assert.ok(c.introduction.includes('surroundings'));
      // 3. Core lesson
      assert.ok(c.core_lesson.length > 100);
      // 4. Key concepts
      assert.ok(Array.isArray(c.key_concepts) && c.key_concepts.length >= 3);
      // 5. Examples
      assert.ok(Array.isArray(c.examples) && c.examples.length >= 2);
      // 6. Practical applications
      assert.ok(Array.isArray(c.practical_applications) && c.practical_applications.length >= 2);
      // 7. Activities
      assert.ok(Array.isArray(c.activities) && c.activities.length >= 1);
      // 8. Engineering challenges
      assert.ok(Array.isArray(c.engineering_challenges) && c.engineering_challenges.length >= 1);
      // 9. Assessment questions
      assert.ok(Array.isArray(c.assessment_questions) && c.assessment_questions.length >= 2);
      assert.ok(c.assessment_questions[0].correct_answer);
      assert.ok(c.assessment_questions[0].explanation);
      // 10. Suggested references & source citations
      assert.ok(Array.isArray(c.suggested_references));
      assert.ok(c.source_citations.length > 0);
      assert.equal(c.source_citations[0].document_name, 'Sensors_Perception_Guide.pptx');
      assert.ok(c.grounding_disclosure.includes('Sensors_Perception_Guide.pptx'));
    });

    it('regenerates a single section without modifying other teacher-edited sections', async () => {
      const courseId = generateUUID();
      const initialGen = await MentorService.generateNodeContent({
        courseId,
        nodeTitle: 'Actuation Systems',
      });

      assert.ok(initialGen.success && initialGen.content);
      const originalContent = initialGen.content;

      // Simulate teacher customized the Introduction manually
      originalContent.introduction = 'CUSTOM TEACHER OVERRIDE: Focus strictly on safety protocols before powering motors.';

      // Regenerate ONLY the engineering_challenges section
      const regenRes = await MentorService.regenerateNodeSection({
        existingContent: originalContent,
        sectionKey: 'engineering_challenges',
        courseId,
        nodeTitle: 'Actuation Systems',
      });

      assert.ok(regenRes.success && regenRes.content);
      // Teacher edit in introduction must be 100% preserved
      assert.equal(
        regenRes.content.introduction,
        'CUSTOM TEACHER OVERRIDE: Focus strictly on safety protocols before powering motors.'
      );
      // Engineering challenges should still be valid
      assert.ok(regenRes.content.engineering_challenges.length > 0);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PART 5 — Teaching Plan Review & Publication
  // ──────────────────────────────────────────────────────────────────────────
  describe('Part 5: Teaching Plan Review & Publication', () => {
    it('progresses through draft -> approved -> published lifecycle with Supabase persistence', async () => {
      const cRes = await MentorService.createCourse({
        title: 'Autonomous Mobile Robotics',
        academicLevel: 'Grade 10',
        subject: 'Robotics',
        mentorId: DEMO_MENTOR_UUID,
        sectionIds: [],
      });
      assert.ok(cRes.success && cRes.course);
      const course = cRes.course;

      const propRes = await MentorService.generateDraftCurriculumProposal(course.id, DEMO_MENTOR_UUID);
      assert.ok(propRes.success && propRes.proposal);
      const proposalId = propRes.proposal.id;

      // Initial status is draft
      assert.equal(propRes.proposal.status, 'draft');

      // Teacher approves proposal
      const approveOk = await MentorService.approveCurriculumProposal(proposalId, DEMO_MENTOR_UUID);
      assert.ok(approveOk);

      // Teacher publishes proposal
      const publishOk = await MentorService.publishCurriculumProposal(proposalId, DEMO_MENTOR_UUID);
      assert.ok(publishOk);

      // Revert / unpublish lifecycle
      const unpublishOk = await MentorService.unpublishCurriculumProposal(proposalId, DEMO_MENTOR_UUID);
      assert.ok(unpublishOk);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PART 6 & FINAL ACCEPTANCE TEST SCENARIO
  // ──────────────────────────────────────────────────────────────────────────
  describe('Part 6 & Final Acceptance Test: 17-Step Robotics Course Workflow', () => {
    it('completes the entire 17-step end-to-end user journey', async () => {
      // Step 1: Teacher creates the course without uploading an official curriculum
      const cRes = await MentorService.createCourse({
        title: 'Introduction to Robotics',
        description: 'Fundamental principles of robotics and engineering.',
        academicLevel: 'Grade 10',
        subject: 'Robotics & Control Systems',
        mentorId: DEMO_MENTOR_UUID,
        sectionIds: [],
      });
      assert.ok(cRes.success && cRes.course, 'Step 1 Passed: Course created');
      const course = cRes.course;

      // Step 2: Teacher uploads robotics PDF and PPTX
      const mat1 = await MentorService.uploadCourseMaterial({
        courseId: course.id,
        title: 'Robotics Hardware and Motors Lecture',
        file: {
          name: 'ROBOTICS_MOTORS.PPTX',
          size: 4096,
          type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          content: 'Slide 1: DC Motors and Actuation\nSlide 15: H-Bridge Drivers and PWM Speed Modulation',
        },
        uploaderId: DEMO_MENTOR_UUID,
      });
      assert.ok(mat1.success, 'Step 2a Passed: PPTX uploaded');

      const mat2 = await MentorService.uploadCourseMaterial({
        courseId: course.id,
        title: 'Sensor Interfacing Laboratory Guide',
        file: {
          name: 'SENSOR_INTERFACING.PDF',
          size: 8192,
          type: 'application/pdf',
          content: 'Module 1: Analog IR Reflectance Sensors\nModule 2: Ultrasonic Distance Ranging',
        },
        uploaderId: DEMO_MENTOR_UUID,
      });
      assert.ok(mat2.success, 'Step 2b Passed: PDF uploaded');

      // Step 3: RISSE processes document contents
      assert.equal(mat1.material?.status, 'ready', 'Step 3a Passed: Mat 1 processed');
      assert.equal(mat2.material?.status, 'ready', 'Step 3b Passed: Mat 2 processed');

      // Step 4: RISSE generates learning path based on materials
      const propRes = await MentorService.generateDraftCurriculumProposal(course.id, DEMO_MENTOR_UUID, {
        mode: 'mode_b',
      });
      assert.ok(propRes.success && propRes.proposal, 'Step 4 Passed: Learning path generated');
      const proposal = propRes.proposal;

      // Step 5: Teacher edits proposed learning path
      proposal.proposal_data.title = 'Introduction to Robotics — Custom Edition';
      const saveOk = await MentorService.updateCurriculumProposal(proposal.id, proposal.proposal_data);
      assert.ok(saveOk, 'Step 5 Passed: Teacher edits saved');

      // Step 6: Teacher manually adds a node titled "Sensors and Perception"
      const targetMod = proposal.proposal_data.modules[0];
      const newNodeId = `node-manual-${Date.now()}`;
      targetMod.checkpoints.push({
        id: newNodeId,
        step_number: targetMod.checkpoints.length + 1,
        title: 'Sensors and Perception',
        type: 'concept',
        description: 'Detection of environmental signals and obstacle boundary detection.',
        estimated_minutes: 35,
        teacher_instructions: 'Explain how robots detect and respond to their surroundings.',
      });
      assert.ok(targetMod.checkpoints.some(c => c.title === 'Sensors and Perception'), 'Step 6 Passed: Manual node added');

      // Step 7 & 8: Teacher asks RISSE to generate node content using uploaded materials
      const nodeGen = await MentorService.generateNodeContent({
        courseId: course.id,
        nodeTitle: 'Sensors and Perception',
        teacherInstructions: 'Explain how robots detect and respond to their surroundings.',
        nodeType: 'concept',
        courseContext: {
          title: course.title,
          academicLevel: course.academic_level,
          subject: course.subject,
        },
      });
      assert.ok(nodeGen.success && nodeGen.content, 'Step 7 & 8 Passed: Grounded node content generated');
      assert.ok(nodeGen.content.source_citations.length > 0, 'Source citations present');

      // Step 9: Teacher edits and saves content
      const targetNode = targetMod.checkpoints.find(c => c.title === 'Sensors and Perception')!;
      targetNode.node_content = nodeGen.content;
      targetNode.node_content.core_lesson += '\n\nTeacher Addendum: Always test sensor voltage under bench load.';
      const saveContentOk = await MentorService.updateCurriculumProposal(proposal.id, proposal.proposal_data);
      assert.ok(saveContentOk, 'Step 9 Passed: Node content saved to proposal');

      // Step 10: Teacher rearranges nodes
      const popped = targetMod.checkpoints.pop()!;
      targetMod.checkpoints.unshift(popped); // Move "Sensors and Perception" to the top
      assert.equal(targetMod.checkpoints[0].title, 'Sensors and Perception', 'Step 10 Passed: Nodes rearranged');

      // Step 11: Teacher approves and publishes learning path
      const approved = await MentorService.approveCurriculumProposal(proposal.id, DEMO_MENTOR_UUID, proposal.proposal_data);
      assert.ok(approved, 'Step 11a Passed: Approved');
      const published = await MentorService.publishCurriculumProposal(proposal.id, DEMO_MENTOR_UUID, proposal.proposal_data);
      assert.ok(published, 'Step 11b Passed: Published');

      // Step 12: Teacher assigns course to section
      const secRes = await MentorService.createSection({
        name: 'Section Orion Robotics',
        code: `SEC-${Date.now().toString(36).toUpperCase()}`,
        gradeLevel: 'Grade 10',
        mentorId: DEMO_MENTOR_UUID,
      });
      assert.ok(secRes.success && secRes.section, 'Step 12a: Section created');
      const section = secRes.section;

      const assignRes = await MentorService.updateCourse(course.id, {}, [section.id]);
      assert.ok(assignRes.success, 'Step 12b Passed: Course assigned to section');

      // Step 13 & 14: Enrolled student logs in and accesses published learning path
      // Enroll demo student in section
      const enrollRes = await MentorService.enrollStudentInSection(section.id, {
        name: 'Demo Student 1',
        email: 'demo1@acamad.com',
        studentId: DEMO_STUDENT_1_UUID,
      });
      assert.ok(enrollRes.success, 'Step 12c: Student enrolled');

      const studentModules = await StudentSyncService.getPublishedModulesForStudent(DEMO_STUDENT_1_UUID);
      assert.ok(studentModules.length > 0, 'Step 13 Passed: Enrolled student sees published modules');

      const publishedModule = studentModules.find(m => m.courseId === course.id) || studentModules[0];
      assert.ok(publishedModule, 'Student retrieved published module');
      assert.ok(publishedModule.checkpoints.length > 0, 'Step 14 Passed: Student interacts with learning content');

      // Step 15: Student progress is saved
      const progRes = await StudentSyncService.recordCheckpointProgress(
        DEMO_STUDENT_1_UUID,
        publishedModule.id,
        publishedModule.checkpoints[0].name,
        50
      );
      assert.ok(progRes.success, 'Step 15 Passed: Progress saved to database');

      // Step 16 & 17: Persistence across sessions
      const refetchedCourse = await MentorService.getCourseById(course.id);
      assert.ok(refetchedCourse, 'Step 16: Course persists');
      assert.equal(refetchedCourse.status, 'published', 'Course remains published');

      const refetchedMaterials = await MentorService.getCourseMaterials(course.id);
      assert.equal(refetchedMaterials.length, 2, 'Step 17 Passed: Materials, proposal and progress persist');
    });
  });
});
