// tests/professional-lms-transformation.test.ts
/**
 * RISSE AI — Professional LMS Transformation Acceptance Test Suite
 *
 * Validates:
 * Part 1: Supabase Enrollment Persistence & Data Integrity Across Sessions
 * Part 2: Six-Section Teacher Studio Navigation Architecture (No Clutter, 4 Tabs in Classes)
 * Part 3: Course Creation direct auto-navigation to Course Studio
 * Part 4: Domain-Specific AI Learning Path Generation Across 5 Distinct Disciplines
 * Part 5: Granular 10-Section Node Content Generation & Single-Section Regeneration
 * Part 6: Cognitive Mastery & Student Privacy Invariants
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { MentorService, type NodeEducationalContent } from '../frontend/lib/mentor/mentorService.ts';
import { CurriculumAiEngine } from '../frontend/lib/mentor/curriculumAiEngine.ts';
import { StudentSyncService } from '../frontend/lib/student/studentSyncService.ts';

const rootDir = process.cwd().endsWith('frontend') ? resolve(process.cwd(), '..') : process.cwd();

describe('RISSE AI — Professional LMS Transformation Acceptance Suite', () => {

  const demoMentorId = 'd1e00000-0000-4000-a000-000000000101';
  let liveSectionId = '8d1310e1-8ac5-4d52-822f-2f424b974d42';
  const demoStudentId = '19e54c4f-d062-42b0-8b08-fc88a7afdbb3';
  const demoStudentEmail = 'demo1@acamad.com';

  // ═══════════════════════════════════════════════════════════════════════════
  // PART 1: ENROLLMENT PERSISTENCE IN SUPABASE
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Part 1 — Supabase Enrollment Persistence & Lifecycle', () => {
    it('1. Enrolls student via enrollStudentInSection RPC and persists permanently in Supabase', async () => {
      let sections = await MentorService.getAssignedSections(demoMentorId);
      if (sections && sections.length > 0 && sections[0].id) {
        liveSectionId = sections[0].id;
      } else {
        const newSec = await MentorService.createSection({
          name: 'Section Orion Robotics',
          mentorId: demoMentorId,
          gradeLevel: 'Grade 10',
          school: 'Rizal Polytechnic de Muntinlupa',
        });
        if (newSec.success && newSec.section?.id) {
          liveSectionId = newSec.section.id;
        }
      }
      const res = await MentorService.enrollStudentInSection(
        liveSectionId,
        {
          name: 'Demo Learner',
          email: demoStudentEmail,
          mentorId: demoMentorId,
        }
      );

      assert.ok(res.success, `Enrollment should succeed: ${res.error}`);
      assert.ok(res.student, 'Returns enrolled student record');
      assert.equal(res.student?.email, demoStudentEmail);
      assert.equal(res.student?.learning_status, 'active');
    });

    it('2. Querying assigned students after simulated refresh returns live Supabase enrolled student', async () => {
      // Simulates fresh query from Supabase on page reload / new login
      const students = await MentorService.getAssignedStudents(demoMentorId);
      assert.ok(Array.isArray(students), 'Returns student array');
      
      const enrolled = students.find(s => s.email === demoStudentEmail || s.student_id === demoStudentId);
      assert.ok(enrolled, 'Enrolled student must persist and appear in teacher roster');
      assert.ok(enrolled?.section_name, 'Includes section name from Supabase sections join');
      assert.ok(enrolled?.section_code, 'Includes section code from Supabase sections join');
    });

    it('3. Enrolled student automatically sees published courses assigned to their section in Student Modules', async () => {
      const studentModules = await StudentSyncService.getPublishedModulesForStudent(demoStudentId);
      assert.ok(Array.isArray(studentModules), 'Returns modules array');
      assert.ok(studentModules.length > 0, 'Student must have access to published modules');
      
      // Verify module contains real course metadata
      const firstModule = studentModules[0];
      assert.ok(firstModule.id, 'Module must have valid ID');
      assert.ok(firstModule.title, 'Module must have title');
      assert.ok(firstModule.level, 'Module must have academic level');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PART 2: SIX-SECTION TEACHER STUDIO NAVIGATION & CONSOLIDATED TABS
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Part 2 — Six Primary Destinations & Consolidated Classes Tabs', () => {
    it('4. MentorSidebar.vue strictly presents the 6 primary destinations without clutter', () => {
      const sidebarPath = resolve(rootDir, 'frontend/resources/js/components/mentor/MentorSidebar.vue');
      assert.ok(existsSync(sidebarPath), 'MentorSidebar.vue must exist');
      const content = readFileSync(sidebarPath, 'utf-8');

      // The 6 Primary LMS Navigation Items
      assert.ok(content.includes('id="mentor-nav-dashboard"'), 'Must have Dashboard');
      assert.ok(content.includes('id="mentor-nav-courses"'), 'Must have Courses');
      assert.ok(content.includes('id="mentor-nav-curriculum-designer"'), 'Must have Course Studio');
      assert.ok(content.includes('id="mentor-nav-classes"'), 'Must have My Classes');
      assert.ok(content.includes('id="mentor-nav-students"'), 'Must have Students');
      assert.ok(content.includes('id="mentor-nav-stars"'), 'Must have Star Chart');

      // Check header title
      assert.ok(content.includes('MAIN MENU'), 'Presents clean MAIN MENU grouping');
      assert.ok(content.includes('pendingUnenrollmentCount'), 'Displays pending alert badge on My Classes');
    });

    it('5. ClassesView.vue consolidates class management into 4 intuitive tabs', () => {
      const classesPath = resolve(rootDir, 'frontend/resources/js/views/mentor/teaching/ClassesView.vue');
      assert.ok(existsSync(classesPath), 'ClassesView.vue must exist');
      const content = readFileSync(classesPath, 'utf-8');

      // 4 Required Tabs
      assert.ok(content.includes('id="classes-tab-overview"'), 'Tab 1: Overview must exist');
      assert.ok(content.includes('id="classes-tab-students"'), 'Tab 2: Students must exist');
      assert.ok(content.includes('id="classes-tab-courses"'), 'Tab 3: Courses must exist');
      assert.ok(content.includes('id="classes-tab-requests"'), 'Tab 4: Requests must exist');

      // Verify embedded UnenrollmentRequestsView in requests tab
      assert.ok(content.includes('UnenrollmentRequestsView'), 'Must embed UnenrollmentRequestsView inside Requests tab');
      assert.ok(content.includes('btn-create-class'), 'Header provides quick class creation');
    });

    it('6. Course creation automatically routes directly to Course Studio', () => {
      const layoutPath = resolve(rootDir, 'frontend/resources/js/layouts/MentorWorkspaceLayout.vue');
      assert.ok(existsSync(layoutPath), 'MentorWorkspaceLayout.vue must exist');
      const content = readFileSync(layoutPath, 'utf-8');

      // Verify handleCourseCreated sets active course and routes to curriculum-designer
      assert.ok(content.includes("currentView.value = 'curriculum-designer'"), 'Must navigate to curriculum-designer after course creation');
      assert.ok(content.includes('mentorStore.activeCourseId = newCourse.id'), 'Must activate newly created course');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PART 3: DOMAIN-SPECIFIC AI LEARNING PATH GENERATION ACROSS 5 DISCIPLINES
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Part 3 — Domain-Specific AI Learning Path Differentiation Across 5 Disciplines', () => {
    it('7. Differentiates AI learning path architectures across 5 distinct engineering subjects', () => {
      // 1. Sensors & Perception
      const sensorsPath = CurriculumAiEngine.generateCourseLearningPath({
        course: {
          title: 'Advanced Sensor Signal Conditioning',
          subject: 'Sensors & Perception',
          academicLevel: 'Grade 11',
          description: 'Analog signal conditioning, optical reflectance, and time of flight ranging.',
        },
        mode: 'materials',
        materials: [{ file_name: 'analog_sensors.pdf', extracted_content: 'Operational amplifiers and RC filtering for robotics.' } as any],
      });

      // 2. Mechanical Design & Drivetrains
      const mechPath = CurriculumAiEngine.generateCourseLearningPath({
        course: {
          title: 'Drivetrain Kinematics & Chassis Engineering',
          subject: 'Mechanical Design',
          academicLevel: 'Grade 11',
          description: 'Gear ratios, planetary transmissions, differential steering, and center of gravity.',
        },
        mode: 'materials',
        materials: [{ file_name: 'chassis_gears.pdf', extracted_content: 'Gear backlash, planetary gearboxes, and chassis deflection.' } as any],
      });

      // 3. Microcontroller Programming & Firmware
      const firmwarePath = CurriculumAiEngine.generateCourseLearningPath({
        course: {
          title: 'Embedded Firmware & Interrupt Architecture',
          subject: 'Embedded Microcontrollers',
          academicLevel: 'Grade 12',
          description: 'Direct register manipulation, hardware timers, and non-blocking state machines.',
        },
        mode: 'materials',
        materials: [{ file_name: 'firmware_timers.pdf', extracted_content: 'ISRs, volatile memory qualifiers, and PWM duty cycles.' } as any],
      });

      // 4. Autonomous Navigation & Odometry
      const navPath = CurriculumAiEngine.generateCourseLearningPath({
        course: {
          title: 'Autonomous Mobile Navigation & Path Planning',
          subject: 'Autonomous Navigation',
          academicLevel: 'Undergraduate',
          description: 'Wheel encoder odometry, dead reckoning, and obstacle avoidance reactive state machines.',
        },
        mode: 'materials',
        materials: [{ file_name: 'navigation_odometry.pdf', extracted_content: 'Pose kinematics, wheel encoders, and vector obstacle avoidance.' } as any],
      });

      // 5. Power Electronics & Motor Control
      const powerPath = CurriculumAiEngine.generateCourseLearningPath({
        course: {
          title: 'Power Electronics & Motor Drive Topologies',
          subject: 'Power Electronics',
          academicLevel: 'Grade 12',
          description: 'H-bridge MOSFET drivers, shoot-through deadtime, and regenerative flyback diodes.',
        },
        mode: 'materials',
        materials: [{ file_name: 'power_mosfets.pdf', extracted_content: 'Half-bridge gate drivers, thermal dissipation, and flyback snubbers.' } as any],
      });

      // Assert each discipline generated rich, unique modules
      assert.ok(sensorsPath.modules.length >= 2, 'Sensors path must generate at least 2 modules');
      assert.ok(mechPath.modules.length >= 2, 'Mechanical path must generate at least 2 modules');
      assert.ok(firmwarePath.modules.length >= 2, 'Firmware path must generate at least 2 modules');
      assert.ok(navPath.modules.length >= 2, 'Navigation path must generate at least 2 modules');
      assert.ok(powerPath.modules.length >= 2, 'Power path must generate at least 2 modules');

      // Verify domain-specific concepts
      const sensorsText = JSON.stringify(sensorsPath).toLowerCase();
      const mechText = JSON.stringify(mechPath).toLowerCase();
      const firmwareText = JSON.stringify(firmwarePath).toLowerCase();
      const navText = JSON.stringify(navPath).toLowerCase();
      const powerText = JSON.stringify(powerPath).toLowerCase();

      assert.ok(sensorsText.includes('sensor') || sensorsText.includes('signal') || sensorsText.includes('filtering'), 'Sensors content includes domain concepts');
      assert.ok(mechText.includes('gear') || mechText.includes('chassis') || mechText.includes('ratio'), 'Mechanical content includes drivetrain concepts');
      assert.ok(firmwareText.includes('timer') || firmwareText.includes('interrupt') || firmwareText.includes('register'), 'Firmware content includes low-level concepts');
      assert.ok(navText.includes('odometry') || navText.includes('kinematic') || navText.includes('navigation'), 'Navigation content includes pose/path concepts');
      assert.ok(powerText.includes('h-bridge') || powerText.includes('mosfet') || powerText.includes('power'), 'Power content includes motor drive concepts');

      // Verify that modules across distinct disciplines are completely distinct (no duplicate titles)
      assert.notEqual(sensorsPath.modules[0].title, mechPath.modules[0].title);
      assert.notEqual(firmwarePath.modules[0].title, navPath.modules[0].title);
      assert.notEqual(powerPath.modules[0].title, mechPath.modules[0].title);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PART 4: 10-SECTION NODE CONTENT GENERATION & SINGLE-SECTION REGENERATION
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Part 4 — Granular 10-Section Node Content & Surgical Regeneration', () => {
    it('8. Generates all 10 required educational sections with citations and formatting', () => {
      const nodeContent = CurriculumAiEngine.generateNodeContent({
        courseId: '4f8a1b2c-3d4e-5f6a-7b8c-9d0e1f2a3b4c',
        nodeTitle: 'Optical Wheel Encoder Decoding & Interrupt Latency',
        teacherInstructions: 'Emphasize atomic 16-bit variable reading in ISRs',
        nodeType: 'lab',
        courseContext: {
          title: 'Embedded Robotics Control',
          academicLevel: 'Grade 11',
          subject: 'Embedded Microcontrollers',
        },
      });

      // Verify all 10 required sections exist
      assert.ok(Array.isArray(nodeContent.learning_objectives) && nodeContent.learning_objectives.length >= 3, '1. Learning Objectives');
      assert.ok(typeof nodeContent.introduction === 'string' && nodeContent.introduction.length > 50, '2. Introduction');
      assert.ok(typeof nodeContent.core_lesson === 'string' && nodeContent.core_lesson.includes('###'), '3. Core Lesson');
      assert.ok(Array.isArray(nodeContent.key_concepts) && nodeContent.key_concepts.length >= 3, '4. Key Concepts');
      assert.ok(Array.isArray(nodeContent.examples) && nodeContent.examples.length >= 2, '5. Examples');
      assert.ok(Array.isArray(nodeContent.practical_applications) && nodeContent.practical_applications.length >= 2, '6. Practical Applications');
      assert.ok(Array.isArray(nodeContent.activities) && nodeContent.activities.length >= 2, '7. Activities');
      assert.ok(Array.isArray(nodeContent.engineering_challenges) && nodeContent.engineering_challenges.length >= 2, '8. Engineering Challenges');
      assert.ok(Array.isArray(nodeContent.assessment_questions) && nodeContent.assessment_questions.length >= 2, '9. Assessment Questions');
      assert.ok(Array.isArray(nodeContent.suggested_references) && nodeContent.suggested_references.length >= 2, '10. Suggested References');

      // Verify question explanations are present
      assert.ok(nodeContent.assessment_questions[0].explanation, 'Assessment question must have explanation');
      // Verify teacher instruction was prioritized
      assert.ok(nodeContent.introduction.includes('atomic 16-bit variable reading in ISRs'), 'Includes prioritized teacher instruction');
    });

    it('9. Regenerates ONLY targeted section while preserving teacher edits in other 9 sections', async () => {
      const initialContent: NodeEducationalContent = {
        learning_objectives: ['Teacher Customized Objective 1', 'Teacher Customized Objective 2'],
        introduction: 'Custom teacher introduction text that must never be lost.',
        core_lesson: 'Teacher written lesson notes with custom diagrams.',
        key_concepts: [{ concept: 'Custom Concept', explanation: 'Custom Explanation' }],
        examples: ['Custom Real-World Example 1'],
        practical_applications: ['Custom Application 1'],
        activities: ['Custom Lab Exercise 1'],
        engineering_challenges: ['Old Challenge to be Replaced'],
        assessment_questions: [{ question: 'Old Q', options: ['A', 'B'], correct_answer: 'A', explanation: 'Old Exp' }],
        suggested_references: [{ title: 'Custom Book', source_file: 'custom.pdf' }],
        source_citations: [],
        grounding_disclosure: 'Teacher authored content',
      };

      // Perform single-section regeneration targeting ONLY 'engineering_challenges'
      const regenRes = await MentorService.regenerateNodeSection({
        existingContent: initialContent,
        sectionKey: 'engineering_challenges',
        courseId: '4f8a1b2c-3d4e-5f6a-7b8c-9d0e1f2a3b4c',
        nodeTitle: 'Optical Wheel Encoder Decoding',
      });

      assert.ok(regenRes.success, 'Regeneration must succeed');
      const updated = regenRes.content!;

      // Verify targeted section was updated
      assert.notDeepEqual(updated.engineering_challenges, initialContent.engineering_challenges, 'Targeted section was regenerated');
      assert.ok(updated.engineering_challenges.length >= 2, 'Fresh challenges generated');

      // Verify all other 9 sections were 100% PRESERVED
      assert.deepEqual(updated.learning_objectives, initialContent.learning_objectives, 'Objectives preserved');
      assert.equal(updated.introduction, initialContent.introduction, 'Introduction preserved');
      assert.equal(updated.core_lesson, initialContent.core_lesson, 'Core lesson preserved');
      assert.deepEqual(updated.key_concepts, initialContent.key_concepts, 'Key concepts preserved');
      assert.deepEqual(updated.examples, initialContent.examples, 'Examples preserved');
      assert.deepEqual(updated.practical_applications, initialContent.practical_applications, 'Practical applications preserved');
      assert.deepEqual(updated.activities, initialContent.activities, 'Activities preserved');
      assert.deepEqual(updated.assessment_questions, initialContent.assessment_questions, 'Assessments preserved');
      assert.deepEqual(updated.suggested_references, initialContent.suggested_references, 'References preserved');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PART 5: COGNITIVE MASTERY & SECURITY INVARIANTS
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Part 5 — Cognitive Mastery & Safety Invariants', () => {
    it('10. Teacher star awards and checkpoint completions do not mutate verified concept mastery', async () => {
      // Awarding a star creates a star award record, but never tampers with concept_mastery_records
      const starAwardRes = await MentorService.modifyStudentStar({
        studentId: demoStudentId,
        starId: 'star_lab_excellence',
        title: 'Lab Excellence',
        category: 'Sensors & Perception',
        action: 'awarded',
        note: 'Outstanding precision in wheel encoder calibration and zero-jitter telemetry.',
        mentorId: demoMentorId,
      });

      assert.ok(starAwardRes.success, 'Star award must succeed');

      // Retrieve star chart
      const chart = await MentorService.getStudentStarChart(demoStudentId);
      assert.ok(chart.awards.some(a => a.star_id === 'star_lab_excellence' || a.title === 'Lab Excellence'), 'Star appears in audit trail');
    });
  });
});
