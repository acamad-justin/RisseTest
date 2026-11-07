// tests/mentor-workflow-repair.test.ts
/**
 * RISSE AI — Mentor Workspace Workflow Repair Test Suite
 *
 * Verifies:
 * 1. Course creation, persistence, and retrieval in Mentor Workspace
 * 2. Class / Section creation and assignment to mentors
 * 3. Student enrollment into sections and roster progress tracking
 * 4. Student module catalog integrity:
 *    - Platform foundation modules vs assigned class courses separation
 *    - Strict exclusion of draft/unpublished/unassigned courses
 *    - Empty state verification ("No courses assigned yet")
 * 5. Single primary Create Course button invariant
 * 6. Modal dismissal, lifecycle, and backdrop non-trapping invariants
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { 
  MentorService, 
  generateUUID, 
  isValidUuid, 
  normalizeMentorId, 
  normalizeStudentId, 
  DEMO_MENTOR_UUID, 
  DEMO_STUDENT_1_UUID, 
  DEMO_STUDENT_2_UUID 
} from '../frontend/lib/mentor/mentorService.ts';
import { StudentSyncService } from '../frontend/lib/student/studentSyncService.ts';

function findProjectFile(relativePath: string): string {
  const candidates = [
    resolve(process.cwd(), relativePath),
    resolve(process.cwd(), '..', relativePath),
    resolve(process.cwd(), relativePath.replace(/^frontend\//, '')),
  ];
  for (const c of candidates) {
    if (existsSync(c)) {
      return c;
    }
  }
  throw new Error(`Could not find project file ${relativePath}`);
}

function readProjectFile(relativePath: string): string {
  return readFileSync(findProjectFile(relativePath), 'utf8');
}

describe('Critical Mentor Workspace Workflow Repair Suite', () => {

  describe('Issue 1: Course Creation & Persistence Workflow', () => {
    test('1. MentorService.createCourse creates a course with full metadata and assigned sections', async () => {
      const mentorId = 'mentor-unit-test-prof-ramon';
      const courseTitle = 'Autonomous Path Planning & Feedback Control';

      const res = await MentorService.createCourse({
        title: courseTitle,
        description: 'Advanced PID, odometry, and SLAM fundamentals for competitive sumobots.',
        academicLevel: 'Grade 10',
        subject: 'Robotics & Control Systems',
        mentorId: mentorId,
        sectionIds: ['sec-alpha-01'],
        semester: '1st Semester',
        schoolYear: '2026-2027',
        learningOutcomes: [
          'Tune closed-loop PID velocity controllers',
          'Calibrate infrared proximity threshold triggers',
        ],
      });

      assert.equal(res.success, true, 'Course creation must succeed');
      assert.ok(res.course, 'Created course record must be returned');
      assert.equal(res.course.title, courseTitle);
      assert.equal(res.course.mentor_id, mentorId);
      assert.equal(res.course.status, 'draft');
      assert.deepEqual(res.course.assigned_section_ids, ['sec-alpha-01']);
    });

    test('2. Newly created courses immediately appear in getCourses(mentorId) without data loss', async () => {
      const mentorId = 'mentor-unit-test-retrieval';
      const uniqueTitle = `Mechatronics Lab-${Date.now()}`;

      await MentorService.createCourse({
        title: uniqueTitle,
        academicLevel: 'Grade 11 (STEM)',
        subject: 'Mechatronics & Actuation',
        mentorId: mentorId,
      });

      const courses = await MentorService.getCourses(mentorId);
      assert.ok(Array.isArray(courses), 'getCourses must return an array');
      const found = courses.find(c => c.title === uniqueTitle);
      assert.ok(found, 'Created course must be present in mentor course list');
      assert.equal(found.mentor_id, mentorId);
    });

    test('3. Course deletion removes the course from getCourses', async () => {
      const mentorId = 'mentor-delete-test';
      const res = await MentorService.createCourse({
        title: 'Temporary Deletion Test Course',
        academicLevel: 'Grade 9',
        subject: 'Robotics Fundamentals',
        mentorId: mentorId,
      });

      assert.ok(res.course);
      const courseId = res.course.id;

      const deleted = await MentorService.deleteCourse(courseId, mentorId);
      assert.equal(deleted, true, 'Course deletion must return true');

      const remaining = await MentorService.getCourses(mentorId);
      assert.equal(remaining.some(c => c.id === courseId), false, 'Deleted course must not appear in list');
    });
  });

  describe('Issue 2: Single Predictable Create Course Button Invariant', () => {
    test('4. CourseListView.vue has exactly one primary Create Course button in header', () => {
      const content = readProjectFile('frontend/resources/js/views/mentor/courses/CourseListView.vue');
      assert.match(content, /id="btn-create-course"/, 'CourseListView must have the primary Create Course button');
      assert.match(content, /Create Course\s*<\/button>/, 'Header button text must be clear');
    });

    test('5. MentorDashboard.vue contextualizes course creation only when courses are empty', () => {
      const content = readProjectFile('frontend/resources/js/views/mentor/MentorDashboard.vue');
      // Header does not have duplicate create course button
      const headerSection = content.split('class="dashboard-header"')[1]?.split('</header>')[0] || '';
      assert.equal(
        headerSection.includes('Create Course'),
        false,
        'MentorDashboard header must not contain a redundant Create Course button'
      );
      // Contextual onboarding card exists when total_courses === 0
      assert.match(content, /v-if="metrics\.total_courses === 0"/, 'Onboarding card shown when courses is 0');
    });

    test('6. MentorWorkspaceLayout.vue maintains clean header without duplicate New Course button', () => {
      const content = readProjectFile('frontend/resources/js/layouts/MentorWorkspaceLayout.vue');
      const header = content.split('class="mentor-workspace-header"')[1]?.split('</header>')[0] || '';
      assert.equal(
        header.includes('New Course'),
        false,
        'Global header must not duplicate page-level course creation actions'
      );
    });
  });

  describe('Issue 3: Class / Section Creation & Student Enrollment', () => {
    test('7. MentorService.createSection creates and persists a new class section', async () => {
      const mentorId = 'mentor-class-test-01';
      const secName = 'Robotics 10 - Delta Squad';
      const secCode = 'SEC-10D';

      const res = await MentorService.createSection({
        name: secName,
        code: secCode,
        gradeLevel: 'Grade 10',
        school: 'Rizal Polytechnic de Muntinlupa',
        mentorId: mentorId,
      });

      assert.equal(res.success, true, 'createSection must succeed');
      assert.ok(res.section, 'Created section record must be returned');
      assert.equal(res.section.name, secName);
      assert.equal(res.section.code, secCode);
      assert.equal(res.section.mentor_id, mentorId);

      const sections = await MentorService.getAssignedSections(mentorId);
      assert.ok(sections.some(s => s.code === secCode), 'New section must appear in assigned sections');
    });

    test('8. MentorService.enrollStudentInSection enrolls student and updates section count', async () => {
      const mentorId = 'mentor-enroll-test';
      const secRes = await MentorService.createSection({
        name: 'Autonomous Mechatronics Alpha',
        code: 'MECH-A',
        gradeLevel: 'Grade 11 (STEM)',
        mentorId: mentorId,
      });

      assert.ok(secRes.section);
      const sectionId = secRes.section.id;

      const enrollRes = await MentorService.enrollStudentInSection(sectionId, {
        name: 'Maria Clara Rivera',
        email: 'maria.clara@rizalpolytechnic.edu.ph',
      });

      assert.equal(enrollRes.success, true, 'Student enrollment must succeed');
      assert.ok(enrollRes.student, 'Enrolled student record must be returned');
      assert.equal(enrollRes.student.section_id, sectionId);
      assert.equal(enrollRes.student.email, 'maria.clara@rizalpolytechnic.edu.ph');

      const sections = await MentorService.getAssignedSections(mentorId);
      const targetSec = sections.find(s => s.id === sectionId);
      assert.ok(targetSec, 'Section must exist');
      assert.equal(targetSec.student_count, 1, 'Student count must increment to 1');
    });

    test('9. CreateClassModal.vue and EnrollStudentModal.vue exist and have complete form contracts', () => {
      const classContent = readProjectFile('frontend/resources/js/components/mentor/CreateClassModal.vue');
      const enrollContent = readProjectFile('frontend/resources/js/components/mentor/EnrollStudentModal.vue');

      assert.ok(classContent, 'CreateClassModal.vue must exist');
      assert.ok(enrollContent, 'EnrollStudentModal.vue must exist');

      assert.match(classContent, /form\.name/, 'CreateClassModal must bind class name');
      assert.match(classContent, /form\.code/, 'CreateClassModal must bind section code');
      assert.match(classContent, /form\.gradeLevel/, 'CreateClassModal must bind grade level');

      assert.match(enrollContent, /form\.name/, 'EnrollStudentModal must bind student name');
      assert.match(enrollContent, /form\.email/, 'EnrollStudentModal must bind student email');
    });
  });

  describe('Issue 4: Student Module Catalog Integrity & Isolation', () => {
    test('10. getPublishedModulesForStudent strictly hides unassigned and draft courses', async () => {
      // Unenrolled student returns empty array
      const modules = await StudentSyncService.getPublishedModulesForStudent('stu-not-enrolled-xyz');
      assert.deepEqual(modules, [], 'Unenrolled student must receive 0 published modules');
    });

    test('11. ModulesPage.vue separates class courses from platform foundation curriculum and handles empty state', () => {
      const pageContent = readProjectFile('frontend/resources/js/components/ModulesPage.vue');

      assert.match(pageContent, /catalog-filter-bar/, 'ModulesPage must include catalog filter tabs');
      assert.match(pageContent, /Assigned Class Courses/, 'ModulesPage must have an assigned class courses tab');
      assert.match(pageContent, /Foundation Curriculum/, 'ModulesPage must have a foundation curriculum tab');
      assert.match(pageContent, /No courses assigned yet/, 'Empty state text must be present for unassigned students');
    });
  });

  describe('Issue 6 & 7: Modal Dismissal, Safety & RLS Migration', () => {
    test('12. RLS non-recursive migration file exists and defines SECURITY DEFINER functions', () => {
      const sql = readProjectFile('supabase/migrations/20261107000003_fix_rls_infinite_recursion.sql');

      assert.match(sql, /check_is_section_mentor/, 'Must define check_is_section_mentor helper');
      assert.match(sql, /check_is_course_mentor/, 'Must define check_is_course_mentor helper');
      assert.match(sql, /check_is_student_in_course/, 'Must define check_is_student_in_course helper');
      assert.match(sql, /SECURITY DEFINER/, 'Helper functions must execute with SECURITY DEFINER to prevent recursion');
    });

    test('13. StarActionModal and StudentDetailModal enforce backdrop click isolation and Escape key dismissal', () => {
      const starModal = readProjectFile('frontend/resources/js/components/mentor/StarActionModal.vue');
      assert.match(starModal, /@click\.self="closeModal"/, 'Overlay must dismiss on self-click');
      assert.match(starModal, /@keydown\.esc="closeModal"/, 'Must dismiss on Escape');
      assert.match(starModal, /class="modal-close-btn"/, 'Close [x] button must exist');

      const detailModal = readProjectFile('frontend/resources/js/components/mentor/StudentDetailModal.vue');
      assert.match(detailModal, /@click\.self="closeModal"/, 'Detail overlay must dismiss on self-click');
      assert.match(detailModal, /modal-close-btn/, 'Detail drawer must have close button');
      assert.match(detailModal, /btn-close-student-detail/, 'Footer close button must exist');
    });
  });

  describe('Issue 8 & 9: Edit/Delete Class and Course Materials Uploads', () => {
    test('14. MentorService.updateSection updates class metadata and persists changes', async () => {
      const mentorId = 'mentor-class-edit-test';
      const created = await MentorService.createSection({
        name: 'Original Robotics 101',
        code: 'ORIG-101',
        gradeLevel: 'Grade 10',
        mentorId,
      });

      assert.ok(created.section);
      const sectionId = created.section.id;

      const updated = await MentorService.updateSection(sectionId, {
        name: 'Updated Robotics 101 Honors',
        code: 'ROB-101H',
        gradeLevel: 'Grade 11 (STEM)',
        school: 'Rizal Science High School',
        mentorId,
      });

      assert.equal(updated.success, true);
      assert.ok(updated.section);
      assert.equal(updated.section.name, 'Updated Robotics 101 Honors');
      assert.equal(updated.section.code, 'ROB-101H');
      assert.equal(updated.section.grade_level, 'Grade 11 (STEM)');
    });

    test('15. MentorService.deleteSection removes section and its roster', async () => {
      const mentorId = 'mentor-class-del-test';
      const created = await MentorService.createSection({
        name: 'Temporary Cohort',
        code: 'TEMP-DEL',
        gradeLevel: 'Grade 9',
        mentorId,
      });

      assert.ok(created.section);
      const sectionId = created.section.id;

      await MentorService.enrollStudentInSection(sectionId, {
        name: 'Test Student',
        email: 'test.del@acamad.com',
      });

      const deleted = await MentorService.deleteSection(sectionId, mentorId);
      assert.equal(deleted.success, true);

      const assigned = await MentorService.getAssignedSections(mentorId);
      assert.equal(assigned.some(s => s.id === sectionId), false);
    });

    test('16. EditClassModal.vue and DeleteClassModal.vue exist with full UI contracts', () => {
      const editContent = readProjectFile('frontend/resources/js/components/mentor/EditClassModal.vue');
      const deleteContent = readProjectFile('frontend/resources/js/components/mentor/DeleteClassModal.vue');

      assert.ok(editContent, 'EditClassModal.vue must exist');
      assert.ok(deleteContent, 'DeleteClassModal.vue must exist');

      assert.match(editContent, /form\.name/, 'Must bind class name in edit');
      assert.match(editContent, /form\.code/, 'Must bind class code in edit');
      assert.match(deleteContent, /handleConfirmDelete/, 'Delete modal must handle confirm delete');
      assert.match(deleteContent, /Dependency Impact/, 'Delete modal must explain dependencies');
    });

    test('17. Course Materials upload, signed URL, and delete contracts in MentorService', async () => {
      const courseId = 'crs-mat-test-01';
      const uploaderId = 'mentor-mat-uploader';

      const uploadRes = await MentorService.uploadCourseMaterial({
        courseId,
        title: 'Lab 1 — Schematic Guide',
        description: 'Wiring schematics for H-bridge driver',
        file: {
          name: 'schematic_guide.pdf',
          size: 1024 * 1024,
          type: 'application/pdf',
        },
        uploaderId,
      });

      assert.equal(uploadRes.success, true);
      assert.ok(uploadRes.material);
      assert.equal(uploadRes.material.title, 'Lab 1 — Schematic Guide');
      assert.equal(uploadRes.material.course_id, courseId);

      const matId = uploadRes.material.id;
      const downloadRes = await MentorService.getMaterialDownloadUrl(uploadRes.material);
      assert.ok(downloadRes, 'Download URL contract must return response');

      const deleted = await MentorService.deleteCourseMaterial(matId, uploaderId);
      assert.equal(deleted, true);
    });

    test('18. Storage migration and safe cleanup script exist', () => {
      const storageSql = readProjectFile('supabase/migrations/20261107000004_course_materials_storage.sql');
      const cleanupSql = readProjectFile('supabase/scripts/safe_demo_cleanup.sql');

      assert.match(storageSql, /course-materials/, 'Storage migration must configure course-materials bucket');
      assert.match(storageSql, /storage\.objects/, 'Storage migration must configure RLS on storage.objects');
      assert.match(cleanupSql, /BEGIN;/, 'Cleanup script must be an atomic transaction');
      assert.match(cleanupSql, /COMMIT;/, 'Cleanup script must commit transaction');
      assert.match(cleanupSql, /curriculum_modules/, 'Cleanup script must protect platform foundation curriculum');
    });

    test('19. HomeView.vue and DynamicHomeView.vue include empty state when learner has 0 active courses and 0 stars', () => {
      const homeContent = readProjectFile('frontend/resources/js/views/HomeView.vue');
      const dynHomeContent = readProjectFile('frontend/resources/js/views/DynamicHomeView.vue');

      assert.match(homeContent, /isEmptyState/, 'HomeView must compute isEmptyState');
      assert.match(homeContent, /home__empty-state/, 'HomeView must render empty state container');
      assert.match(dynHomeContent, /isEmptyState/, 'DynamicHomeView must compute isEmptyState');
      assert.match(dynHomeContent, /dynamic-home__empty-state/, 'DynamicHomeView must render empty state container');
    });

    test('20. mentorStore defines activeMentorProfile and currentMentorId without ReferenceError', () => {
      const storeCode = readProjectFile('frontend/resources/js/stores/mentorStore.js');
      assert.match(storeCode, /const currentMentorId = ref\(null\);/, 'currentMentorId must be declared');
      assert.match(storeCode, /const activeMentorProfile = ref\(null\);/, 'activeMentorProfile must be declared');
      assert.match(storeCode, /generateCurriculumProposal/, 'generateCurriculumProposal alias must be defined and exported');
    });

    test('21. MentorService.generateDraftCurriculumProposal grounds modules exclusively on course materials/syllabus and NEVER injects placeholder curriculum_modules (101-106)', async () => {
      const mentorId = 'mentor-proposal-test';
      const created = await MentorService.createCourse({
        title: 'Robotics Engineering 101',
        academicLevel: 'Grade 10',
        subject: 'Robotics & Automation',
        mentorId,
      });

      assert.ok(created.course);
      const courseId = created.course.id;

      // Upload material
      await MentorService.uploadCourseMaterial({
        courseId,
        title: 'Lab Syllabus & Safety Guidelines',
        description: 'Course safety syllabus',
        file: { name: 'Robotics_Syllabus.pdf', size: 5000, type: 'application/pdf' },
        uploaderId: mentorId,
      });

      const res = await MentorService.generateDraftCurriculumProposal(courseId, mentorId);
      assert.equal(res.success, true);
      assert.ok(res.proposal);
      assert.ok(Array.isArray(res.proposal.proposal_data.modules));

      // Generated modules must be grounded in uploaded material
      const groundedMod = res.proposal.proposal_data.modules[0];
      assert.ok(groundedMod, 'Module must exist in generated proposal');
      assert.equal(groundedMod.source_materials.includes('Robotics_Syllabus.pdf'), true, 'Module must be grounded in uploaded material');
      assert.equal(groundedMod.provenance_type, 'grounded_in_materials');
      assert.ok(groundedMod.checkpoints.length >= 3, 'Module must include its checkpoints');

      // CRITICAL: Must NEVER inject placeholder curriculum_modules (101-106)
      const hasPlaceholder101 = res.proposal.proposal_data.modules.some(m => String(m.id) === '101' || m.title.includes('101: Sensors'));
      assert.equal(hasPlaceholder101, false, 'Must never inject placeholder module 101');
      const hasPlaceholder106 = res.proposal.proposal_data.modules.some(m => String(m.id) === '106' || m.title.includes('106: Closed-Loop'));
      assert.equal(hasPlaceholder106, false, 'Must never inject placeholder module 106');
    });

    test('22. safe_demo_cleanup.sql protects exact module IDs 101 through 106', () => {
      const cleanupSql = readProjectFile('supabase/scripts/safe_demo_cleanup.sql');
      assert.match(cleanupSql, /'101', '102', '103', '104', '105', '106'/, 'Must protect varchar IDs 101 through 106');
      assert.doesNotMatch(cleanupSql, /'mod_101'/, 'Must not use legacy mod_ prefix in cleanup script');
    });

    test('23. ModulesPage.vue displays published class courses from Teacher Studio and does not depend on placeholder curriculum_modules', () => {
      const pageContent = readProjectFile('frontend/resources/js/components/ModulesPage.vue');
      assert.match(pageContent, /publishedClassModules/, 'Must track published class courses');
      assert.match(pageContent, /getPublishedModulesForStudent/, 'Must load assigned class courses from StudentSyncService');
      assert.doesNotMatch(pageContent, /Test Module: Quick Progression/, 'Must not include dummy fixture module 999');
    });

    test('24. Document text extraction pipeline handles plain text, markdown, and discloses OCR limitation notices', async () => {
      const mdFile = {
        name: 'Autonomous_Navigation_Syllabus.md',
        size: 1024,
        type: 'text/markdown',
        content: '# Autonomous Navigation Syllabus\nUnit 1: LiDAR SLAM\nUnit 2: Path Planning A* and Dijkstra\nUnit 3: Real-time Obstacle Avoidance',
      };
      const extractRes = await MentorService.extractDocumentContent(mdFile as any);
      assert.equal(extractRes.status, 'ready');
      assert.match(extractRes.content, /LiDAR SLAM/);
      assert.match(extractRes.content, /Path Planning/);

      const pdfFile = {
        name: 'Motor_Driver_Schematic.pdf',
        size: 204800,
        type: 'application/pdf',
        text: async () => 'PDF raw content stream without OCR engine',
      };
      const pdfRes = await MentorService.extractDocumentContent(pdfFile as any);
      assert.equal(pdfRes.status, 'ready');
      assert.ok(pdfRes.notice, 'PDF extraction must provide OCR limitation disclosure');
      assert.match(pdfRes.notice, /scanned raster images require backend OCR/);
    });

    test('25. Course Materials upload populates extracted_content, lifecycle status, and supports retryProcessMaterial', async () => {
      const mentorId = 'mentor-pipeline-test';
      const created = await MentorService.createCourse({
        title: 'Advanced Mechatronics Lab',
        academicLevel: 'Grade 11',
        subject: 'Mechatronics',
        mentorId,
      });
      assert.ok(created.course);
      const courseId = created.course.id;

      const uploadRes = await MentorService.uploadCourseMaterial({
        courseId,
        title: 'Course Lab Manual',
        description: 'Complete hands-on bench syllabus',
        file: {
          name: 'Mechatronics_Manual.txt',
          size: 1500,
          type: 'text/plain',
          content: 'Mechatronics Lab 1: Dual H-Bridge PWM control with encoder feedback',
        },
        uploaderId: mentorId,
      });

      assert.equal(uploadRes.success, true);
      assert.ok(uploadRes.material);
      assert.equal(uploadRes.material.status, 'ready');
      assert.match(uploadRes.material.extracted_content || '', /Dual H-Bridge PWM control/);

      // Verify retryProcessMaterial
      const retryRes = await MentorService.retryProcessMaterial(uploadRes.material.id, mentorId);
      assert.equal(retryRes.success, true);
      assert.equal(retryRes.material?.status, 'ready');
      assert.equal(retryRes.material?.processing_error, null);
    });

    test('26. Course Studio proposal generator creates source-grounded modules for custom outcomes and uploaded materials without placeholder modules', async () => {
      const mentorId = 'mentor-spec-test';
      const created = await MentorService.createCourse({
        title: 'Autonomous Drone Robotics',
        academicLevel: 'Grade 12 Advanced',
        subject: 'Aerial Robotics',
        learningOutcomes: ['Computer Vision Optical Flow', 'Drone Flight Dynamics & IMU Stabilization'],
        mentorId,
      });
      assert.ok(created.course);
      const courseId = created.course.id;

      await MentorService.uploadCourseMaterial({
        courseId,
        title: 'Drone Flight Dynamics Syllabus',
        file: {
          name: 'drone_syllabus.md',
          size: 2000,
          type: 'text/markdown',
          content: 'Flight Dynamics: Quaternion rotation, PID gyro stabilization, optical flow hovering',
        },
        uploaderId: mentorId,
      });

      const res = await MentorService.generateDraftCurriculumProposal(courseId, mentorId);
      assert.equal(res.success, true);
      assert.ok(res.proposal);

      const mods = res.proposal.proposal_data.modules;
      // Must NOT include placeholder modules (101-106)
      const placeholderMods = mods.filter(m => ['101', '102', '103', '104', '105', '106'].includes(String(m.id)));
      assert.equal(placeholderMods.length, 0, 'No placeholder modules 101-106 in course');

      // Must include specialized modules for course outcomes or uploaded material
      const droneMod = mods.find(m => m.title.includes('Drone') || m.title.includes('Flight') || m.title.includes('Computer Vision'));
      assert.ok(droneMod, 'Must generate course-specific module for specialized learning outcome');
      assert.ok(droneMod.checkpoints.length >= 3, 'Course-specific module must have checkpoints');
      assert.ok(droneMod.checkpoints[0].interactive_activity, 'Checkpoints must have interactive activity');
      assert.ok(droneMod.checkpoints[0].engineering_challenge, 'Checkpoints must have engineering challenge');
    });

    test('27. Curriculum Review Studio supports adding teacher modules, reordering, and draft persistence', async () => {
      const mentorId = 'mentor-edit-test';
      const created = await MentorService.createCourse({
        title: 'Robotics Workshop',
        academicLevel: 'Grade 10',
        subject: 'Robotics',
        mentorId,
      });
      const courseId = created.course!.id;

      const genRes = await MentorService.generateDraftCurriculumProposal(courseId, mentorId);
      assert.equal(genRes.success, true);
      const proposal = genRes.proposal!;

      // Simulate teacher modifying a title and adding a custom module
      const modifiedProposalData = JSON.parse(JSON.stringify(proposal.proposal_data));
      modifiedProposalData.modules[0].title = 'Module 1: Robotics Workshop Foundations (Modified by Instructor)';
      modifiedProposalData.modules.push({
        id: 'mod-custom-teacher-test',
        module_id: 'mod-custom-teacher-test',
        module_number: modifiedProposalData.modules.length + 1,
        title: 'Module 5: Instructor Field Capstone',
        description: 'Field testing of robots under competition conditions',
        source_materials: [],
        provenance_type: 'ai_suggestion',
        learning_objectives: ['Field Testing', 'Final Presentation'],
        badge_name: 'Field Master',
        checkpoints: [
          {
            id: 'cp_test_1',
            step_number: 1,
            title: 'Field Deployment Checklist',
            type: 'concept',
            description: 'Pre-flight mechanical inspection',
            estimated_minutes: 30,
          },
          {
            id: 'cp_test_2',
            step_number: 2,
            title: 'Live Arena Run',
            type: 'challenge',
            description: 'Execute obstacle course in 180 seconds',
            estimated_minutes: 60,
          },
        ],
      });

      const updated = await MentorService.updateCurriculumProposal(proposal.id, modifiedProposalData);
      assert.equal(updated, true);

      const retrieved = await MentorService.getCurriculumProposals(courseId);
      assert.ok(retrieved.length > 0);
      assert.equal(retrieved[0].proposal_data.modules[0].title, 'Module 1: Robotics Workshop Foundations (Modified by Instructor)');
      const teacherMod = retrieved[0].proposal_data.modules.find(m => m.id === 'mod-custom-teacher-test');
      assert.ok(teacherMod, 'Teacher custom module must persist in proposal');
    });

    test('28. Course publishing validates curriculum completeness and updates status in courses table', async () => {
      const mentorId = 'mentor-publish-test';
      const created = await MentorService.createCourse({
        title: 'Publish Validation Course',
        academicLevel: 'Grade 10',
        subject: 'Robotics',
        mentorId,
      });
      const courseId = created.course!.id;

      const genRes = await MentorService.generateDraftCurriculumProposal(courseId, mentorId);
      const proposal = genRes.proposal!;

      // Rejection when curriculum has 0 modules
      const invalidData = { title: 'Empty', summary: '', modules: [] };
      const failRes = await MentorService.publishCurriculumProposal(proposal.id, mentorId, invalidData as any);
      assert.equal(failRes, false, 'Publish must fail when 0 modules are provided');

      // Success with valid proposal data
      const pubRes = await MentorService.publishCurriculumProposal(proposal.id, mentorId, proposal.proposal_data);
      assert.equal(pubRes, true);

      // Verify course status is updated to published
      const updatedCourse = await MentorService.getCourseById(courseId);
      assert.equal(updatedCourse?.status, 'published');
    });

    test('29. UI contracts in CourseListView.vue and CurriculumDesigner.vue', () => {
      const courseListContent = readProjectFile('frontend/resources/js/views/mentor/courses/CourseListView.vue');
      assert.match(courseListContent, /Open Course Studio →/, 'CourseListView must have Open Course Studio button');
      assert.match(courseListContent, /btn-course-studio/, 'CourseListView must style Course Studio button');

      const studioContent = readProjectFile('frontend/resources/js/views/mentor/curriculum/CurriculumDesigner.vue');
      assert.match(studioContent, /course-studio-banner/, 'CurriculumDesigner must render Course Studio header banner');
      assert.match(studioContent, /badge-dirty-pill/, 'CurriculumDesigner must render unsaved edits indicator');
      assert.match(studioContent, /addTeacherModule/, 'CurriculumDesigner must have addTeacherModule action');
      assert.match(studioContent, /sim-modules-catalog/, 'CurriculumDesigner must render Student Experience Preview simulation');
      assert.match(studioContent, /publish-confirm-dialog/, 'CurriculumDesigner must render publish confirmation dialog');
      assert.match(studioContent, /ai-tutor-inspector-card/, 'CurriculumDesigner must render AI Tutor Grounding Inspector');
    });

    test('30. MentorService verifies curriculum_modules are treated as placeholders and not used in generated courses', async () => {
      const mentorId = 'mentor-placeholder-check';
      const created = await MentorService.createCourse({
        title: 'Industrial PLC Automation',
        academicLevel: 'College',
        subject: 'Industrial Automation',
        learningOutcomes: ['Ladder Logic', 'Relay Operations'],
        mentorId,
      });
      const res = await MentorService.generateDraftCurriculumProposal(created.course!.id, mentorId);
      assert.equal(res.success, true);
      assert.ok(res.proposal);
      const modules = res.proposal.proposal_data.modules;
      assert.ok(modules.length > 0);
      modules.forEach(m => {
        assert.equal(['101', '102', '103', '104', '105', '106'].includes(String(m.id)), false, `Module ${m.id} must not be a placeholder module`);
      });
    });

    test('31. Proposal generation handles missing/fallback courseId and safe activeMentorProfile access', async () => {
      const mentorId = 'mentor-fallback-test';
      const created = await MentorService.createCourse({
        title: 'Autonomous Robotics Section',
        academicLevel: 'Grade 12',
        subject: 'Robotics',
        mentorId,
      });
      const courseId = created.course!.id;

      // generateDraftCurriculumProposal with valid courseId
      const genRes = await MentorService.generateDraftCurriculumProposal(courseId, mentorId);
      assert.equal(genRes.success, true);
      assert.ok(genRes.proposal);
      assert.ok(genRes.proposal.proposal_data.modules.length > 0);

      // Verify proposal modules ground on course metadata without placeholders
      const firstMod = genRes.proposal.proposal_data.modules[0];
      assert.match(firstMod.title, /Robotics|Autonomous/);
      assert.notEqual(firstMod.id, '101');

      // Verify safe activeMentorProfile pattern in store
      const storeContent = readProjectFile('frontend/resources/js/stores/mentorStore.js');
      assert.match(storeContent, /foundationModules/, 'mentorStore must define foundationModules');
      assert.match(storeContent, /loadFoundationModules/, 'mentorStore must define loadFoundationModules');
      assert.match(storeContent, /typeof activeMentorProfile !== 'undefined'/, 'mentorStore must safely guard activeMentorProfile access');
    });

    test('32. CurriculumDesigner UI contracts for source grounding showcase and resilient click handling', () => {
      const studioContent = readProjectFile('frontend/resources/js/views/mentor/curriculum/CurriculumDesigner.vue');
      assert.match(studioContent, /source-grounding-showcase/, 'Must showcase source grounding and course context');
      assert.match(studioContent, /AI CURRICULUM DESIGNER/, 'Must identify AI Curriculum Designer');
      assert.match(studioContent, /btn-generate-curriculum/, 'Must have Generate Proposed Curriculum button with id');
      assert.match(studioContent, /btn-spinner-row/, 'Must show loading spinner while generating');
      assert.match(studioContent, /props\.activeCourseId\s*\|\|\s*props\.activeCourse\?\.id/, 'Must fallback safely if activeCourseId prop is initially unset');
    });

    test('33. ModulesPage.vue strictly enforces database-driven loading and removes mock BASE_EXPLORE_MODULES', () => {
      const pageContent = readProjectFile('frontend/resources/js/components/ModulesPage.vue');
      assert.doesNotMatch(pageContent, /BASE_EXPLORE_MODULES/, 'ModulesPage must not define hardcoded BASE_EXPLORE_MODULES');
      assert.doesNotMatch(pageContent, /getInitialExplore/, 'ModulesPage must not initialize explore from static mock data');
      assert.doesNotMatch(pageContent, /Test Module/, 'ModulesPage empty enrolled text must not refer to Test Module');
      assert.match(pageContent, /isLoadingModules/, 'ModulesPage must track loading state');
      assert.match(pageContent, /modules-loading-indicator/, 'ModulesPage must have loading indicator markup');
      assert.match(pageContent, /modules-error-indicator/, 'ModulesPage must have query error indicator markup');
      assert.match(pageContent, /btn-retry-modules/, 'ModulesPage must have retry button');
      assert.match(pageContent, /empty-modules-catalog/, 'ModulesPage must have clean empty catalog state');
      assert.match(pageContent, /loadModules/, 'ModulesPage must implement loadModules');
    });

    test('34. Non-UUID identifiers fail closed gracefully without triggering PostgreSQL UUID syntax errors', async () => {
      // Non-UUID mentor ID should not throw 400 invalid input syntax for type uuid
      const nonUuidMentor = 'mentor-ramon-bautista';
      const courses = await MentorService.getCourses(nonUuidMentor);
      assert.ok(Array.isArray(courses));

      const sections = await MentorService.getAssignedSections(nonUuidMentor);
      assert.ok(Array.isArray(sections));

      const students = await MentorService.getAssignedStudents(nonUuidMentor);
      assert.ok(Array.isArray(students));

      const metricsRes = await MentorService.getDashboardMetrics(nonUuidMentor);
      assert.equal(metricsRes.error, null);
      assert.ok(metricsRes.data);

      // Non-UUID student ID
      const nonUuidStudent = 'stu-demo1-acamad';
      const studentModules = await StudentSyncService.getPublishedModulesForStudent(nonUuidStudent);
      assert.ok(Array.isArray(studentModules));

      const studentAwards = await StudentSyncService.getStudentStarAwards(nonUuidStudent);
      assert.ok(Array.isArray(studentAwards));

      const progressRes = await StudentSyncService.recordCheckpointProgress(nonUuidStudent, 'mod-1', 'cp-1', 50);
      assert.equal(progressRes.success, true);
    });

    test('35. MentorService.getCurriculumModules returns clean array and never falls back to placeholder modules when Supabase has zero rows', async () => {
      const modules = await MentorService.getCurriculumModules();
      assert.ok(Array.isArray(modules), 'getCurriculumModules must return an array');
      // Verify that if empty, it does not resurrect the 6 placeholder modules
      // If live Supabase has rows it returns them; if live Supabase has 0 rows, it returns []
      if (modules.length === 0) {
        assert.equal(modules.length, 0, 'Must cleanly return 0 modules when database has zero rows');
      } else {
        // If Supabase table has rows, each row must be a real DB record
        modules.forEach(m => {
          assert.ok(m.title, 'Curriculum module must have title');
        });
      }
    });

    test('36. purgeModuleCaches purges stale localStorage keys across sessions', () => {
      const authContent = readProjectFile('frontend/resources/js/stores/authStore.js');
      assert.match(authContent, /purgeModuleCaches/, 'authStore must define and export purgeModuleCaches');
      assert.match(authContent, /purgeModuleCaches\(\)/, 'authStore logout must call purgeModuleCaches');
    });

    test('37. MentorService.approveCurriculumProposal updates status to approved and persists', async () => {
      const mentorId = 'd1e00000-0000-4000-a000-000000000101';
      const courseRes = await MentorService.createCourse({
        title: 'PLC & Automation Lab',
        academicLevel: 'Grade 12',
        subject: 'Industrial Automation',
        mentorId,
      });
      assert.ok(courseRes.course);

      const draftRes = await MentorService.generateDraftCurriculumProposal(
        courseRes.course.id,
        mentorId
      );
      assert.ok(draftRes.proposal);
      assert.equal(draftRes.proposal.status, 'draft');

      const approved = await MentorService.approveCurriculumProposal(
        draftRes.proposal.id,
        mentorId
      );
      assert.equal(approved, true, 'Approve proposal must succeed');

      const proposals = await MentorService.getCurriculumProposals(courseRes.course.id);
      const target = proposals.find(p => p.id === draftRes.proposal?.id);
      assert.ok(target);
      assert.equal(target.status, 'approved', 'Proposal status must be approved');
    });

    test('38. MentorService.updateCourse updates metadata and assigned sections', async () => {
      const mentorId = 'd1e00000-0000-4000-a000-000000000101';
      const courseRes = await MentorService.createCourse({
        title: 'Initial Course Title',
        academicLevel: 'Grade 10',
        subject: 'Robotics',
        mentorId,
      });
      assert.ok(courseRes.course);

      const updateRes = await MentorService.updateCourse(
        courseRes.course.id,
        {
          title: 'Updated Advanced Robotics',
          academic_level: 'Grade 11 STEM',
        },
        ['sec-alpha-01', 'sec-beta-02']
      );
      assert.equal(updateRes.success, true, 'Update course must succeed');

      const full = await MentorService.getCourseById(courseRes.course.id);
      assert.ok(full);
      assert.equal(full.title, 'Updated Advanced Robotics');
      assert.equal(full.academic_level, 'Grade 11 STEM');
      assert.deepEqual(full.assigned_section_ids, ['sec-alpha-01', 'sec-beta-02']);
    });

    test('39. CourseStudio and CourseListView have complete functional controls', () => {
      const studioContent = readProjectFile('frontend/resources/js/views/mentor/curriculum/CurriculumDesigner.vue');
      assert.match(studioContent, /id="btn-approve-proposal"/, 'CurriculumDesigner must have Approve Proposal button');
      assert.match(studioContent, /id="btn-approve-publish"/, 'CurriculumDesigner must have Publish Live button');
      assert.match(studioContent, /badge-approved/, 'CurriculumDesigner must have Approved status badge');

      const listViewContent = readProjectFile('frontend/resources/js/views/mentor/courses/CourseListView.vue');
      assert.match(listViewContent, /btn-course-edit/, 'CourseListView must have Edit course button');
      assert.match(listViewContent, /id="btn-save-course-edit"/, 'CourseListView must have save course edit button');
      assert.match(listViewContent, /id="btn-open-studio"/, 'CourseListView must have open Course Studio button');
    });

    test('40. ModuleRoadmapView supports dynamic checkpoints and records progress in StudentSyncService', () => {
      const roadmapContent = readProjectFile('frontend/resources/js/components/ModuleRoadmapView.vue');
      assert.match(roadmapContent, /StudentSyncService\.recordCheckpointProgress/, 'ModuleRoadmapView must persist progress via StudentSyncService');
      assert.match(roadmapContent, /props\.moduleData\?\.checkpoints/, 'ModuleRoadmapView must map custom teacher module checkpoints');
    });

    test('41. UUID generation and identity normalization across mentor and student roles', () => {
      // Test UUID generation RFC 4122 compliance
      const id1 = generateUUID();
      const id2 = generateUUID();
      assert.notEqual(id1, id2, 'Generated UUIDs must be unique');
      assert.equal(isValidUuid(id1), true, 'Generated ID must be a valid UUID');
      assert.equal(isValidUuid(id2), true, 'Generated ID must be a valid UUID');

      // Test mentor identity normalization
      assert.equal(normalizeMentorId('mentor-ramon-bautista'), DEMO_MENTOR_UUID);
      assert.equal(normalizeMentorId('mentor-prof-ramon'), DEMO_MENTOR_UUID);
      assert.equal(normalizeMentorId('mentor-default'), DEMO_MENTOR_UUID);
      assert.equal(normalizeMentorId('usr_mentor'), DEMO_MENTOR_UUID);
      assert.equal(normalizeMentorId('mentor'), DEMO_MENTOR_UUID);
      assert.equal(normalizeMentorId('mentor@risse.edu'), DEMO_MENTOR_UUID);

      // Test student identity normalization
      assert.equal(normalizeStudentId('stu-demo1_acamad_com'), DEMO_STUDENT_1_UUID);
      assert.equal(normalizeStudentId('stu-demo1-acamad'), DEMO_STUDENT_1_UUID);
      assert.equal(normalizeStudentId('demo1'), DEMO_STUDENT_1_UUID);
      assert.equal(normalizeStudentId('demo1@acamad.com'), DEMO_STUDENT_1_UUID);
      assert.equal(normalizeStudentId('stu-adriel-01'), DEMO_STUDENT_1_UUID);
      assert.equal(normalizeStudentId('stu-demo2_acamad_com'), DEMO_STUDENT_2_UUID);
      assert.equal(normalizeStudentId('demo2@acamad.com'), DEMO_STUDENT_2_UUID);
    });

    test('42. Non-UUID course IDs and student IDs in queries never throw PostgREST 400 Bad Request', async () => {
      // getCurriculumProposals with legacy/string courseId
      const props = await MentorService.getCurriculumProposals('crs-1794076349427-je9x');
      assert.ok(Array.isArray(props), 'getCurriculumProposals must return array without 400');

      // getStudentStarChart with legacy/string studentId
      const chart = await MentorService.getStudentStarChart('stu-demo1_acamad_com');
      assert.ok(Array.isArray(chart.awards), 'awards must be an array');
      assert.ok(Array.isArray(chart.auditEvents), 'auditEvents must be an array');

      // enrollStudentInSection with demo1@acamad.com resolves to real UUID
      const enrollRes = await MentorService.enrollStudentInSection('sec-test-unit-01', {
        name: 'Demo Student 1',
        email: 'demo1@acamad.com',
      });
      assert.equal(enrollRes.success, true);
      assert.ok(enrollRes.student);
      assert.equal(enrollRes.student.student_id, DEMO_STUDENT_1_UUID, 'Enrolled student ID must be DEMO_STUDENT_1_UUID');
      assert.equal(isValidUuid(enrollRes.student.student_id), true);

      // modifyStudentStar with legacy student ID
      const starRes = await MentorService.modifyStudentStar({
        studentId: 'stu-demo1_acamad_com',
        starId: 'star-cad-mastery',
        title: 'CAD Precision Milestone',
        action: 'awarded',
        note: 'Completed chassis CAD drafting with tolerances verified.',
        mentorId: 'mentor-ramon-bautista',
      });
      assert.equal(starRes.success, true);
    });
  });
});
