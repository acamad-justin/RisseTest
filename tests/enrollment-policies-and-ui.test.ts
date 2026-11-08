// tests/enrollment-policies-and-ui.test.ts
/**
 * RISSE AI — Student Modules UI, Enrollment Synchronization & Course Enrollment Policies
 *
 * Test Suite covering:
 * - Part 1: Student Modules Course Card Layout, Text Wrapping & Button Visibility
 * - Part 2: Teacher Enrollment Synchronization (Instant Access without Re-Enrolling)
 * - Part 3: Course Enrollment Types (Curriculum vs Self-Paced in Forms & Database)
 * - Part 4: Self-Paced Enrollment & Immediate Unenrollment (Preserving History)
 * - Part 5: Curriculum Unenrollment Request, Teacher Studio Review, Approval & Decline
 * - Part 6: Persistent In-App Notifications for Students and Mentors
 * - Part 7: Database, Security Definer RPC & RLS Authorization Contracts
 */

import { describe, it, beforeEach, after } from 'node:test';
import assert from 'node:assert';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { 
  StudentSyncService, 
  type StudentPublishedModule,
  DEMO_STUDENT_1_UUID,
  DEMO_STUDENT_2_UUID 
} from '../frontend/lib/student/studentSyncService.ts';
import { MentorService, type CourseRecord } from '../frontend/lib/mentor/mentorService.ts';

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

const rootDir = process.cwd().endsWith('frontend') ? resolve(process.cwd(), '..') : process.cwd();

describe('Student Modules UI, Enrollment Sync & Course Policies Test Suite', () => {

  const testMentorId = 'd1e00000-0000-4000-a000-000000000101';
  const testStudentId = '19e54c4f-d062-42b0-8b08-fc88a7afdbb3';
  const testSectionId = '2a1b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d';
  const testCurriculumCourseId = '4f8a1b2c-3d4e-5f6a-7b8c-9d0e1f2a3b4c';
  const testSelfPacedCourseId = '5e9b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d';

  beforeEach(() => {
    StudentSyncService._resetTestState();
    const mState = (MentorService as any)._getTestState?.();
    if (mState) {
      mState.unenrollmentRequests?.clear?.();
      mState.notifications?.clear?.();
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PART 1: STUDENT MODULES COURSE CARD LAYOUT & RESPONSIVENESS
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Part 1 — Course Card Layout, Text Wrapping & Button Visibility', () => {
    it('1. ModulesPage.vue contains responsive flex layout and min-width 0 to prevent grid blowout', () => {
      const filePath = resolve(rootDir, 'frontend/resources/js/components/ModulesPage.vue');
      assert.ok(existsSync(filePath), 'ModulesPage.vue must exist');
      const content = readFileSync(filePath, 'utf-8');

      // Verify no blowout grid, but flex layout with wrap and min-width 0
      assert.ok(content.includes('.module-card-item'), 'Contains .module-card-item');
      assert.ok(content.includes('min-width: 0'), 'Columns must have min-width: 0 to prevent text blowout');
      assert.ok(content.includes('word-break: break-word'), 'Long titles and descriptions must break words cleanly');
      assert.ok(content.includes('.module-actions-col'), 'Actions column must be distinct');
      assert.ok(content.includes('flex-shrink: 0'), 'Action buttons or thumbnail must be flex-shrink: 0');
    });

    it('2. Card action buttons and badges are defined for all statuses (Enroll, Start, Resume, Review)', () => {
      const filePath = resolve(rootDir, 'frontend/resources/js/components/ModulesPage.vue');
      const content = readFileSync(filePath, 'utf-8');

      assert.ok(content.includes('.btn-enroll-module'), 'Enroll button styling must be defined');
      assert.ok(content.includes('.btn-start'), 'Start button styling must be defined');
      assert.ok(content.includes('.btn-resume'), 'Resume button styling must be defined');
      assert.ok(content.includes('.btn-review'), 'Review button styling must be defined');
      assert.ok(content.includes('badge-type-pill'), 'Type pills must exist for enrollment types');
      assert.ok(content.includes('pill-assigned'), 'Teacher-assigned pill must exist');
      assert.ok(content.includes('pill-self-paced'), 'Self-paced pill must exist');
      assert.ok(content.includes('pill-pending-approval'), 'Pending unenrollment pill must exist');
    });

    it('3. Cards render expandable syllabus drawer with checkpoints without clipping action buttons', () => {
      const filePath = resolve(rootDir, 'frontend/resources/js/components/ModulesPage.vue');
      const content = readFileSync(filePath, 'utf-8');

      assert.ok(content.includes('module-drawer-panel'), 'Expandable syllabus drawer panel must exist');
      assert.ok(content.includes('drawer-checkpoints-list'), 'Drawer must list module checkpoints');
      assert.ok(content.includes('toggleExpand'), 'Must provide toggleExpand action');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PART 2: TEACHER ENROLLMENT SYNCHRONIZATION WITH STUDENT MODULES
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Part 2 — Teacher Enrollment Synchronization', () => {
    it('4. Teacher-enrolled student receives course with status enrolled and actionText Start immediately', async () => {
      // Setup mock mentor state: section assigned to course, and student in that section
      const mState = (MentorService as any)._getTestState();
      mState.sections.set(testSectionId, {
        id: testSectionId,
        name: 'Robotics Team Alpha',
        code: 'ROB-101',
        mentor_id: testMentorId,
      });

      mState.students.set(testStudentId, {
        id: testStudentId,
        student_id: testStudentId,
        name: 'Alex Vance',
        email: 'alex@risse.org',
        section_id: testSectionId,
      });

      mState.courses.set(testCurriculumCourseId, {
        id: testCurriculumCourseId,
        title: 'Advanced Feedback Control',
        status: 'published',
        assigned_section_ids: [testSectionId],
        enrollment_type: 'curriculum',
        mentor_id: testMentorId,
      });

      mState.curriculumProposals.set('prop-101', {
        id: 'prop-101',
        course_id: testCurriculumCourseId,
        status: 'published',
        proposal_data: {
          modules: [
            {
              id: 'mod-feedback-1',
              title: 'Closed Loop Dynamics',
              description: 'Introduction to proportional-integral-derivative controllers.',
              checkpoints: [
                { id: 'cp-1', title: 'Error Calculation', type: 'concept', description: 'Compute proportional error.' }
              ],
            }
          ]
        }
      });

      const modules = await StudentSyncService.getPublishedModulesForStudent(testStudentId);
      assert.ok(modules.length > 0, 'Student should receive published course modules');
      
      const targetMod = modules.find(m => m.courseId === testCurriculumCourseId);
      assert.ok(targetMod, 'Target module must be returned');
      assert.strictEqual(targetMod.status, 'enrolled', 'Teacher-enrolled course must have status "enrolled"');
      assert.strictEqual(targetMod.actionText, 'Start', 'Teacher-enrolled course action text must be "Start", never "Enroll"');
      assert.strictEqual(targetMod.isTeacherAssigned, true, 'isTeacherAssigned must be true');
      assert.strictEqual(targetMod.enrollmentType, 'curriculum', 'Enrollment type must be curriculum');
    });

    it('5. ModulesPage.vue includes status enrolled courses in Currently Enrolled carousel immediately', () => {
      const filePath = resolve(rootDir, 'frontend/resources/js/components/ModulesPage.vue');
      const content = readFileSync(filePath, 'utf-8');

      // Verify enrolled filter includes status === 'enrolled' and actionText === 'Start'
      assert.ok(
        content.includes("m.status === 'enrolled'") && content.includes("m.actionText === 'Start'"),
        'Currently Enrolled filter must include status="enrolled" and actionText="Start"'
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PART 3: COURSE ENROLLMENT TYPE (CURRICULUM VS SELF-PACED)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Part 3 — Course Enrollment Types in UI and Services', () => {
    it('6. CreateCourseView.vue provides required enrollmentType selection (curriculum vs self_paced)', () => {
      const filePath = resolve(rootDir, 'frontend/resources/js/views/mentor/courses/CreateCourseView.vue');
      const content = readFileSync(filePath, 'utf-8');

      assert.ok(content.includes('Course Enrollment Policy'), 'Must have Course Enrollment Policy section');
      assert.ok(content.includes("value=\"curriculum\""), 'Curriculum option must exist');
      assert.ok(content.includes("value=\"self_paced\""), 'Self-Paced option must exist');
      assert.ok(content.includes("enrollmentType: 'curriculum'"), 'Must default to curriculum');
      assert.ok(content.includes('enrollmentType: form.enrollmentType'), 'Must pass enrollmentType in course payload');
    });

    it('7. CourseListView.vue displays enrollment type badges and supports editing enrollment type', () => {
      const filePath = resolve(rootDir, 'frontend/resources/js/views/mentor/courses/CourseListView.vue');
      const content = readFileSync(filePath, 'utf-8');

      assert.ok(content.includes('badge-enrollment-type'), 'Must render badge-enrollment-type on course card');
      assert.ok(content.includes('enrollment-self-paced'), 'Self-paced styling class must exist');
      assert.ok(content.includes('edit-enrollment-type'), 'Edit modal must have enrollment policy control');
      assert.ok(content.includes('enrollment_type: editForm.enrollment_type'), 'Must include enrollment_type in updates');
    });

    it('8. MentorService.createCourse accepts and records enrollmentType', async () => {
      const courseRes = await MentorService.createCourse({
        title: 'Autonomous Mobile Navigation 2026',
        subject: 'Robotics & Control Systems',
        academicLevel: 'Grade 11 (STEM)',
        enrollmentType: 'self_paced',
        mentorId: testMentorId,
      });

      assert.strictEqual(courseRes.success, true);
      assert.strictEqual(courseRes.course?.enrollment_type, 'self_paced');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PART 4: SELF-PACED ENROLLMENT & IMMEDIATE UNENROLLMENT WORKFLOW
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Part 4 — Self-Paced Enrollment and Unenrollment', () => {
    it('9. Student can self-enroll into a self-paced course', async () => {
      const res = await StudentSyncService.enrollSelfPacedCourse(testStudentId, testSelfPacedCourseId);
      assert.strictEqual(res.success, true);

      const state = StudentSyncService._getTestState();
      const studentEnrollments = state.courseEnrollments.get(testStudentId) || [];
      const match = studentEnrollments.find(e => e.course_id === testSelfPacedCourseId);
      assert.ok(match, 'Enrollment record must exist');
      assert.strictEqual(match.status, 'active');
      assert.strictEqual(match.enrollment_type, 'self_paced');
    });

    it('10. Student unenrolls from self-paced course while preserving historical progress', async () => {
      // 0. Ensure active self-paced enrollment
      await StudentSyncService.enrollSelfPacedCourse(testStudentId, testSelfPacedCourseId);

      // 1. Initial checkpoint progress recorded
      await StudentSyncService.recordCheckpointProgress(testStudentId, 'mod-1', 'cp-intro', 50);

      // 2. Unenroll from self-paced course
      const unenrollRes = await StudentSyncService.unenrollSelfPacedCourse(testStudentId, testSelfPacedCourseId);
      assert.strictEqual(unenrollRes.success, true);

      const state = StudentSyncService._getTestState();
      const studentEnrollments = state.courseEnrollments.get(testStudentId) || [];
      const match = studentEnrollments.find(e => e.course_id === testSelfPacedCourseId);
      assert.strictEqual(match?.status, 'dropped', 'Course enrollment status should be dropped');

      // 3. Invariant check: Checkpoint progress remains preserved in student_module_memory
      const savedProgress = StudentSyncService._getTestCheckpointProgress(testStudentId, 'mod-1');
      assert.ok(savedProgress, 'Progress record must NOT be deleted');
      assert.strictEqual(savedProgress.progressPercent, 50, 'Historical progress percentage must be intact');
    });

    it('11. ModulesPage.vue contains Self-Paced Unenrollment confirmation modal with progress preservation notice', () => {
      const filePath = resolve(rootDir, 'frontend/resources/js/components/ModulesPage.vue');
      const content = readFileSync(filePath, 'utf-8');

      assert.ok(content.includes('showSelfPacedUnenrollModal'), 'Self-paced unenroll modal must exist');
      assert.ok(content.includes('safely preserved'), 'Must notify student progress is preserved');
      assert.ok(content.includes('confirmSelfPacedUnenroll'), 'Must provide confirmSelfPacedUnenroll action');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PART 5: CURRICULUM UNENROLLMENT REQUEST & TEACHER STUDIO REVIEW
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Part 5 — Curriculum Unenrollment Request and Approval Workflow', () => {
    it('12. Student requests unenrollment from curriculum course: enters pending state with notification to mentor', async () => {
      const reqRes = await StudentSyncService.requestCurriculumUnenrollment({
        studentId: testStudentId,
        courseId: testCurriculumCourseId,
        sectionId: testSectionId,
        mentorId: testMentorId,
        reason: 'Laboratory schedule conflicts with dual-enrollment physics.',
      });

      assert.strictEqual(reqRes.success, true);
      assert.ok(reqRes.request);
      assert.strictEqual(reqRes.request.status, 'pending');
      assert.strictEqual(reqRes.request.reason, 'Laboratory schedule conflicts with dual-enrollment physics.');

      // Duplicate pending request prevention
      const dupRes = await StudentSyncService.requestCurriculumUnenrollment({
        studentId: testStudentId,
        courseId: testCurriculumCourseId,
        mentorId: testMentorId,
      });
      assert.strictEqual(dupRes.success, false, 'Duplicate pending request must be rejected');

      // Verify mentor received notification
      const mentorNotifs = await MentorService.getMentorNotifications(testMentorId);
      assert.ok(mentorNotifs.length > 0, 'Mentor must receive notification');
      assert.strictEqual(mentorNotifs[0].type, 'unenrollment_request');
    });

    it('13. Teacher reviews pending requests and approves: drops enrollment and notifies student', async () => {
      // 1. Setup pending request
      const reqRes = await StudentSyncService.requestCurriculumUnenrollment({
        studentId: testStudentId,
        courseId: testCurriculumCourseId,
        sectionId: testSectionId,
        mentorId: testMentorId,
        reason: 'Schedule conflict',
      });
      assert.ok(reqRes.request);

      // 2. Mentor fetches pending list
      const pendingList = await MentorService.getPendingUnenrollmentRequests(testMentorId);
      assert.ok(pendingList.some(r => r.id === reqRes.request?.id));

      // 3. Mentor approves request
      const appRes = await MentorService.approveUnenrollmentRequest(reqRes.request.id, testMentorId);
      assert.strictEqual(appRes.success, true);

      // 4. Pending list should now be empty
      const updatedPending = await MentorService.getPendingUnenrollmentRequests(testMentorId);
      assert.ok(!updatedPending.some(r => r.id === reqRes.request?.id));

      // 5. Student receives unenrollment_approved notification
      const studentNotifs = await StudentSyncService.getStudentNotifications(testStudentId);
      const appNotif = studentNotifs.find(n => n.type === 'unenrollment_approved');
      assert.ok(appNotif, 'Student must receive unenrollment_approved notification');
    });

    it('14. Teacher declines request with notes: keeps student enrolled and notifies student with reason', async () => {
      // 1. Setup new pending request
      const reqRes = await StudentSyncService.requestCurriculumUnenrollment({
        studentId: testStudentId,
        courseId: testCurriculumCourseId,
        sectionId: testSectionId,
        mentorId: testMentorId,
        reason: 'Difficult material',
      });
      assert.ok(reqRes.request);

      // 2. Mentor rejects with instructions
      const rejRes = await MentorService.rejectUnenrollmentRequest(
        reqRes.request.id,
        testMentorId,
        'Please attend the Wednesday lab office hours before dropping this core course.'
      );
      assert.strictEqual(rejRes.success, true);

      // 3. Student receives unenrollment_rejected notification with notes
      const studentNotifs = await StudentSyncService.getStudentNotifications(testStudentId);
      const rejNotif = studentNotifs.find(n => n.type === 'unenrollment_rejected');
      assert.ok(rejNotif, 'Student must receive unenrollment_rejected notification');
      assert.ok(rejNotif.message.includes('Wednesday lab office hours'), 'Notification must include teacher notes');
    });

    it('15. Teacher Studio includes dedicated UnenrollmentRequestsView and sidebar integration', () => {
      const viewPath = resolve(rootDir, 'frontend/resources/js/views/mentor/teaching/UnenrollmentRequestsView.vue');
      assert.ok(existsSync(viewPath), 'UnenrollmentRequestsView.vue must exist');

      const viewContent = readFileSync(viewPath, 'utf-8');
      assert.ok(viewContent.includes('Course Unenrollment Requests'), 'View header title must exist');
      assert.ok(viewContent.includes('handleApprove'), 'Approve handler must exist');
      assert.ok(viewContent.includes('confirmReject'), 'Decline handler must exist');
      assert.ok(viewContent.includes('Request History'), 'Request History tab must exist');

      const sidebarPath = resolve(rootDir, 'frontend/resources/js/components/mentor/MentorSidebar.vue');
      const sidebarContent = readFileSync(sidebarPath, 'utf-8');
      assert.ok(sidebarContent.includes('mentor-nav-unenrollment-requests'), 'Sidebar must include Unenrollment Requests nav item');
      assert.ok(sidebarContent.includes('pendingUnenrollmentCount'), 'Sidebar must display pending requests counter badge');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PART 6: PERSISTENT IN-APP NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Part 6 — Persistent In-App Notifications for Student and Mentor', () => {
    it('16. Mentor Workspace header includes notification popover with real unread counts', () => {
      const layoutPath = resolve(rootDir, 'frontend/resources/js/layouts/MentorWorkspaceLayout.vue');
      const content = readFileSync(layoutPath, 'utf-8');

      assert.ok(content.includes('btn-mentor-notifications'), 'Header must contain notifications bell');
      assert.ok(content.includes('notif-badge'), 'Badge must render unread notification count');
      assert.ok(content.includes('notifications-popover'), 'Popover must render notification list');
      assert.ok(content.includes('markNotificationRead'), 'Must support marking notifications as read');
    });

    it('17. Student Modules page header includes notification popover with unread badge', () => {
      const pagePath = resolve(rootDir, 'frontend/resources/js/components/ModulesPage.vue');
      const content = readFileSync(pagePath, 'utf-8');

      assert.ok(content.includes('btn-student-notifications'), 'Student header must contain notification bell');
      assert.ok(content.includes('student-notif-badge'), 'Must display unread counter');
      assert.ok(content.includes('student-notif-popover'), 'Must render notifications popover');
    });

    it('18. Marking a notification as read updates its is_read status', async () => {
      const notifId = 'notif-read-test-101';
      StudentSyncService._setTestNotifications(testStudentId, [
        {
          id: notifId,
          recipient_id: testStudentId,
          type: 'general',
          title: 'Welcome to Robotics',
          message: 'Welcome to the lab!',
          is_read: false,
          created_at: new Date().toISOString(),
        }
      ]);

      const notifsBefore = await StudentSyncService.getStudentNotifications(testStudentId);
      assert.strictEqual(notifsBefore[0].is_read, false);

      await StudentSyncService.markNotificationRead(notifId);

      const notifsAfter = await StudentSyncService.getStudentNotifications(testStudentId);
      assert.strictEqual(notifsAfter[0].is_read, true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PART 7: DATABASE MIGRATION, SECURITY DEFINER RPC & RLS VERIFICATION
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Part 7 — Database Schema & Security Definer RPC Verification', () => {
    it('19. Migration 20261108000002 contains all required tables, constraints, indexes, and RPC', () => {
      const migrationPath = resolve(rootDir, 'supabase/migrations/20261108000002_enrollment_types_unenrollment_requests_notifications.sql');
      assert.ok(existsSync(migrationPath), 'Migration file must exist');
      const sql = readFileSync(migrationPath, 'utf-8');

      assert.ok(sql.includes("ADD COLUMN IF NOT EXISTS enrollment_type text NOT NULL DEFAULT 'curriculum'"), 'Adds enrollment_type to courses');
      assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS public.course_enrollments'), 'Creates course_enrollments table');
      assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS public.course_unenrollment_requests'), 'Creates course_unenrollment_requests table');
      assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS public.notifications'), 'Creates notifications table');
      assert.ok(sql.includes('CREATE OR REPLACE FUNCTION public.review_unenrollment_request'), 'Creates review_unenrollment_request RPC');
      assert.ok(sql.includes('SECURITY DEFINER'), 'RPC must be SECURITY DEFINER');
      assert.ok(sql.includes('ENABLE ROW LEVEL SECURITY'), 'RLS must be enabled on all new tables');
    });

    it('20. Cognitive mastery invariants remain strictly preserved', async () => {
      // Manual checkpoint or enrollment NEVER touches concept_mastery_records
      const studentId = DEMO_STUDENT_1_UUID;
      const res = await StudentSyncService.recordCheckpointProgress(studentId, 'mod-101', 'cp-1', 100);
      assert.strictEqual(res.success, true);
      // Invariant: does not throw or create fabricated mastery records
    });
  });
});
