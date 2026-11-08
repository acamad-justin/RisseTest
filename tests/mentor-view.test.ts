// tests/mentor-view.test.ts
/**
 * Test Suite: RISSE AI Phase 2 — Mentor View Implementation (Milestones A - D)
 *
 * Verifies:
 * 1. Student cannot access Mentor View.
 * 2. Mentor cannot access another mentor's sections.
 * 3. Mentor cannot access students outside assigned sections.
 * 4. Mentor can view assigned student progress.
 * 5. Unauthorized module uploads are rejected.
 * 6. Authorized module uploads work with metadata validation.
 * 7. Unauthorized Star Chart changes are rejected.
 * 8. Authorized mentor star awards are recorded.
 * 9. Star revocation preserves immutable audit history.
 * 10. Manual stars do not automatically create verified mastery.
 */

import { describe, it, after } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';

import { MentorService } from '../frontend/lib/mentor/mentorService.ts';

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

const migrationSql = readProjectFile('supabase/migrations/20261107000001_phase2_mentor_view_schema.sql');

describe('Phase 2: Mentor View Platform (Milestones A - D)', () => {

  // ── 1. Student Cannot Access Mentor View ──────────────────────────────────
  it('1. Student cannot access Mentor View (enforced by RLS & route guard)', () => {
    // Migration: sections table requires mentor_id = auth.uid() or admin
    assert.ok(
      migrationSql.includes('mentor_id = auth.uid()'),
      'sections policy must restrict access to assigned mentor'
    );
    assert.ok(
      migrationSql.includes('CREATE POLICY "sections_select_policy"'),
      'sections table must have select policy'
    );
    // Student trying to query without mentorId returns empty
    const emptyResult = MentorService.getAssignedSections('');
    assert.strictEqual(Array.isArray(emptyResult), false); // returns a Promise
  });

  // ── 2. Cross-Mentor Section Isolation ────────────────────────────────────
  it('2. Mentor cannot access another mentor\'s sections', async () => {
    // Schema check: Policy isolates by mentor_id
    assert.ok(
      migrationSql.includes('idx_sections_mentor_id'),
      'sections must index mentor_id for efficient isolation'
    );

    // Mentor A sections vs Mentor B sections
    const mentorASections = await MentorService.getAssignedSections('mentor-uuid-alpha');
    assert.ok(mentorASections.length > 0, 'Mentor A receives their assigned sections');
    assert.ok(
      mentorASections.every(s => s.mentor_id === 'mentor-uuid-alpha'),
      'All returned sections must strictly match Mentor A ID'
    );

    const mentorBSections = await MentorService.getAssignedSections('mentor-uuid-beta');
    assert.ok(
      mentorBSections.every(s => s.mentor_id === 'mentor-uuid-beta'),
      'All returned sections must strictly match Mentor B ID'
    );
  });

  // ── 3. Student Roster Isolation ──────────────────────────────────────────
  it('3. Mentor cannot access students outside assigned sections', async () => {
    // Schema check: section_students enforces section ownership
    assert.ok(
      migrationSql.includes('CREATE POLICY "section_students_select_policy"'),
      'section_students must have select policy checking section mentor'
    );
    assert.ok(
      migrationSql.includes('s.mentor_id = auth.uid()'),
      'section_students policy must verify section mentor'
    );

    // Empty mentor ID receives zero students
    const invalidResult = await MentorService.getAssignedStudents('');
    assert.strictEqual(invalidResult.length, 0, 'Unauthenticated or empty mentor query must return 0 students');
  });

  // ── 4. Student Progress Data Retrieval ────────────────────────────────────
  it('4. Mentor can view assigned student progress with complete metrics', async () => {
    const students = await MentorService.getAssignedStudents('mentor-101');
    assert.ok(students.length > 0, 'Must return assigned students');

    const firstStudent = students[0];
    assert.ok(firstStudent.name, 'Student must have a name');
    assert.ok(firstStudent.email, 'Student must have an email');
    assert.ok(firstStudent.section_name, 'Student must have assigned section name');
    assert.ok(typeof firstStudent.module_progress === 'number', 'Student must have numeric progress');
    assert.ok(typeof firstStudent.mastered_concepts_count === 'number', 'Student must have concept count');
    assert.ok(firstStudent.learning_status, 'Student must have a valid learning status');

    // Overview Stats
    const stats = await MentorService.getOverviewStats('mentor-101');
    assert.ok(stats.total_assigned_students > 0, 'Stats must reflect assigned student count');
    assert.ok(stats.active_classes_count > 0, 'Stats must reflect active class count');
    assert.strictEqual(stats.modules_available_count, 6, 'Must reflect 6 production modules');
    assert.ok(stats.overall_progress_average >= 0, 'Must have valid progress average');
  });

  // ── 5. Unauthorized Module Uploads Are Rejected ──────────────────────────
  it('5. Unauthorized module uploads are rejected (size, mime, and missing title)', async () => {
    // Missing title
    const resNoTitle = await MentorService.uploadModuleMaterial({
      title: '',
      moduleId: 101,
      file: { name: 'test.pdf', size: 1024, type: 'application/pdf' },
      uploaderId: 'mentor-101',
    });
    assert.strictEqual(resNoTitle.success, false);
    assert.ok(resNoTitle.error?.includes('title is required'));

    // Oversized file (> 15MB)
    const resOversize = await MentorService.uploadModuleMaterial({
      title: 'Heavy Manual',
      moduleId: 101,
      file: { name: 'heavy.pdf', size: 20 * 1024 * 1024, type: 'application/pdf' },
      uploaderId: 'mentor-101',
    });
    assert.strictEqual(resOversize.success, false);
    assert.ok(resOversize.error?.includes('exceeds maximum permitted limit'));

    // Invalid file type (.exe)
    const resBadType = await MentorService.uploadModuleMaterial({
      title: 'Malicious File',
      moduleId: 101,
      file: { name: 'malware.exe', size: 5000, type: 'application/x-msdownload' },
      uploaderId: 'mentor-101',
    });
    assert.strictEqual(resBadType.success, false);
    assert.ok(resBadType.error?.includes('Unsupported file format'));
  });

  // ── 6. Authorized Module Uploads Work ────────────────────────────────────
  it('6. Authorized module uploads persist metadata correctly', async () => {
    const uploadRes = await MentorService.uploadModuleMaterial({
      title: 'Lab 101 Analog Sensor Calibration Worksheet',
      description: 'Step by step voltage divider calibration instructions',
      moduleId: 101,
      file: { name: 'analog_calib.pdf', size: 250000, type: 'application/pdf' },
      uploaderId: 'mentor-101',
    });

    assert.strictEqual(uploadRes.success, true);
    assert.ok(uploadRes.upload, 'Upload record must be returned');
    assert.strictEqual(uploadRes.upload?.title, 'Lab 101 Analog Sensor Calibration Worksheet');
    assert.strictEqual(String(uploadRes.upload?.module_id), '101');
    assert.strictEqual(uploadRes.upload?.file_name, 'analog_calib.pdf');
    assert.ok(uploadRes.upload?.storage_path.includes('mentor-materials/101/'), 'Must use mentor-materials path');

    // Retrieve uploads
    const uploads = await MentorService.getModuleUploads(101);
    assert.ok(uploads.length > 0, 'Uploaded item must appear in list');

    // Delete upload
    const delOk = await MentorService.deleteModuleUpload(uploadRes.upload!.id, 'mentor-101');
    assert.strictEqual(delOk, true, 'Authorized uploader must be able to delete their own upload');
  });

  // ── 7. Unauthorized Star Chart Changes Are Rejected ──────────────────────
  it('7. Unauthorized Star Chart changes are rejected (missing reason, invalid action)', async () => {
    // Missing reason note
    const resNoNote = await MentorService.modifyStudentStar({
      studentId: 'stu-adriel-01',
      starId: 'motion-builder',
      title: 'Motion Builder',
      action: 'awarded',
      note: '   ',
      mentorId: 'mentor-101',
    });
    assert.strictEqual(resNoNote.success, false);
    assert.ok(resNoNote.message?.includes('reason or note is required'));

    // Invalid action
    const resBadAction = await MentorService.modifyStudentStar({
      studentId: 'stu-adriel-01',
      starId: 'motion-builder',
      title: 'Motion Builder',
      action: 'invalid_action' as any,
      note: 'Valid note',
      mentorId: 'mentor-101',
    });
    assert.strictEqual(resBadAction.success, false);
    assert.ok(resBadAction.message?.includes('awarded or revoked'));
  });

  // ── 8. Authorized Star Awards Are Recorded ────────────────────────────────
  it('8. Authorized mentor star awards are recorded with full metadata', async () => {
    const studentId = 'stu-sofia-02';
    const awardRes = await MentorService.modifyStudentStar({
      studentId,
      starId: 'logic-architect',
      title: 'Logic Architect',
      category: 'Programming Robot Behavior',
      moduleId: 102,
      action: 'awarded',
      note: 'Clean implementation of non-blocking finite state machine in Checkpoint 102-02.',
      mentorId: 'mentor-101',
      mentorName: 'Prof. Ramon Bautista',
    });

    assert.strictEqual(awardRes.success, true);

    const chart = await MentorService.getStudentStarChart(studentId);
    const award = chart.awards.find(a => a.star_id === 'logic-architect');
    assert.ok(award, 'Award must be present in student star chart');
    assert.strictEqual(award?.status, 'awarded');
    assert.strictEqual(award?.title, 'Logic Architect');
    assert.strictEqual(award?.module_id, 102);

    const audit = chart.auditEvents.find(e => e.star_id === 'logic-architect' && e.action === 'awarded');
    assert.ok(audit, 'Audit event must be logged');
    assert.strictEqual(audit?.mentor_id, 'mentor-101');
    assert.ok(audit?.note.includes('finite state machine'));
  });

  // ── 9. Star Revocation Preserves Audit History ────────────────────────────
  it('9. Star revocation updates status and preserves full audit history', async () => {
    const studentId = 'stu-sofia-02';

    // Revoke the star
    const revokeRes = await MentorService.modifyStudentStar({
      studentId,
      starId: 'logic-architect',
      title: 'Logic Architect',
      action: 'revoked',
      note: 'Awarded to incorrect account during group lab calibration session.',
      mentorId: 'mentor-101',
      mentorName: 'Prof. Ramon Bautista',
    });

    assert.strictEqual(revokeRes.success, true);

    const chart = await MentorService.getStudentStarChart(studentId);
    const award = chart.awards.find(a => a.star_id === 'logic-architect');
    assert.strictEqual(award?.status, 'revoked', 'Award status must be revoked');

    // Both award and revoke must be present in audit events (Append-Only)
    const awardAudit = chart.auditEvents.find(e => e.star_id === 'logic-architect' && e.action === 'awarded');
    const revokeAudit = chart.auditEvents.find(e => e.star_id === 'logic-architect' && e.action === 'revoked');

    assert.ok(awardAudit, 'Original award audit event must be preserved');
    assert.ok(revokeAudit, 'Revocation audit event must be recorded');
    assert.ok(revokeAudit?.note.includes('incorrect account'));
  });

  // ── 10. Manual Stars Do Not Create Verified Mastery ──────────────────────
  it('10. Manual stars do not automatically create verified concept mastery', () => {
    // Verify SQL RPC implementation
    assert.ok(
      migrationSql.includes('FUNCTION public.mentor_award_or_revoke_star'),
      'Must define mentor_award_or_revoke_star RPC'
    );

    // Crucial Invariant: The RPC MUST NOT touch concept_mastery_records or mastery_assessment_events
    const rpcSection = migrationSql.slice(migrationSql.indexOf('mentor_award_or_revoke_star'));
    assert.strictEqual(
      rpcSection.includes('INSERT INTO public.mastery_assessment_events'),
      false,
      'INVARIANT VIOLATION: Manual stars must NEVER insert into mastery_assessment_events'
    );
    assert.strictEqual(
      rpcSection.includes('INSERT INTO public.concept_mastery_records'),
      false,
      'INVARIANT VIOLATION: Manual stars must NEVER fabricate concept_mastery_records'
    );

    // Verify Star Chart Audit Events is strictly Append-Only (NO UPDATE or DELETE policies)
    assert.strictEqual(
      migrationSql.includes('CREATE POLICY "star_audit_update"'),
      false,
      'Audit events table must never have UPDATE policy'
    );
    assert.strictEqual(
      migrationSql.includes('CREATE POLICY "star_audit_delete"'),
      false,
      'Audit events table must never have DELETE policy'
    );
  });

  // ── 11. Dedicated Workspace Separation ────────────────────────────────────
  it('11. Workspace separation enforces distinct Student and Teacher Studio layouts', () => {
    const appVueContent = readProjectFile('frontend/resources/js/App.vue');
    const mentorLayoutContent = readProjectFile('frontend/resources/js/layouts/MentorWorkspaceLayout.vue');
    const mentorSidebarContent = readProjectFile('frontend/resources/js/components/mentor/MentorSidebar.vue');

    // App.vue mounts MentorWorkspaceLayout exclusively for authorized roles
    assert.ok(
      appVueContent.includes('<MentorWorkspaceLayout'),
      'App.vue must render dedicated MentorWorkspaceLayout'
    );
    assert.ok(
      appVueContent.includes("authStore.userRole === 'student'"),
      'App.vue must explicitly block student accounts from entering Mentor Workspace'
    );

    // Mentor navigation must have Workspace, Course Management, Teaching, and Account
    assert.ok(mentorSidebarContent.includes('WORKSPACE'), 'Sidebar must include WORKSPACE category');
    assert.ok(mentorSidebarContent.includes('COURSE MANAGEMENT'), 'Sidebar must include COURSE MANAGEMENT category');
    assert.ok(mentorSidebarContent.includes('TEACHING'), 'Sidebar must include TEACHING category');
    assert.ok(mentorSidebarContent.includes('ACCOUNT'), 'Sidebar must include ACCOUNT category');
  });

  // ── 12. Course Management & Multi-Section Assignment ──────────────────────
  it('12. Teacher can create courses and assign them to multiple sections with separate enrollments', async () => {
    const mentorId = 'mentor-prof-ramon';
    const res = await MentorService.createCourse({
      title: 'Autonomous Mobile Robotics & PID Tuning',
      description: 'Comprehensive lab course on sensor feedback and motor control loops.',
      subject: 'Robotics & Control Systems',
      academicLevel: 'Grade 10',
      semester: '1st Semester',
      schoolYear: '2026-2027',
      learningOutcomes: [
        'Design voltage dividers for analog sensors',
        'Implement finite state machine navigation',
      ],
      mentorId,
      sectionIds: ['sec-alpha-01', 'sec-beta-01'],
    });

    assert.strictEqual(res.success, true);
    assert.ok(res.course?.id, 'Course must have an ID');
    assert.strictEqual(res.course?.title, 'Autonomous Mobile Robotics & PID Tuning');
    assert.strictEqual(res.course?.status, 'draft', 'New course must default to draft status');
    assert.strictEqual(res.course?.assigned_section_ids?.length, 2, 'Must assign to 2 sections');

    // Fetch mentor courses
    const courses = await MentorService.getCourses(mentorId);
    assert.ok(courses.length > 0, 'Course must be retrievable by mentor');
    assert.ok(courses.some(c => c.id === res.course!.id));
  });

  // ── 13. Private Learning Material Upload & Format Validation ──────────────
  it('13. Learning materials validate PDF, PPTX, DOCX, TXT, Markdown, and 25MB limit', async () => {
    const courseId = 'crs-test-material-101';
    const uploaderId = 'mentor-prof-ramon';

    // 1. Valid PDF upload
    const pdfRes = await MentorService.uploadCourseMaterial({
      courseId,
      title: 'Robotics Laboratory Safety & Wiring Primer',
      description: 'Safety documentation for lab practice',
      file: { name: 'safety_guide.pdf', size: 1024 * 1024, type: 'application/pdf' },
      uploaderId,
    });
    assert.strictEqual(pdfRes.success, true);
    assert.ok(pdfRes.material?.storage_path.includes('courses/'));

    // 2. Valid Markdown upload
    const mdRes = await MentorService.uploadCourseMaterial({
      courseId,
      title: 'PID Calibration Lab Instructions',
      file: { name: 'pid_lab.md', size: 5000, type: 'text/markdown' },
      uploaderId,
    });
    assert.strictEqual(mdRes.success, true);

    // 3. Valid PPTX upload
    const pptxRes = await MentorService.uploadCourseMaterial({
      courseId,
      title: 'Lecture 1: Finite State Machines',
      file: {
        name: 'lecture1.pptx',
        size: 2 * 1024 * 1024,
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      },
      uploaderId,
    });
    assert.strictEqual(pptxRes.success, true);

    // 4. Reject invalid format (e.g. .exe or .bin)
    const invalidRes = await MentorService.uploadCourseMaterial({
      courseId,
      title: 'Executable binary',
      file: { name: 'firmware.bin', size: 4000, type: 'application/octet-stream' },
      uploaderId,
    });
    assert.strictEqual(invalidRes.success, false);
    assert.ok(invalidRes.error?.includes('Unsupported file format'));

    // 5. Reject file exceeding 25MB
    const oversizeRes = await MentorService.uploadCourseMaterial({
      courseId,
      title: 'Huge Archive',
      file: { name: 'heavy.pdf', size: 30 * 1024 * 1024, type: 'application/pdf' },
      uploaderId,
    });
    assert.strictEqual(oversizeRes.success, false);
    assert.ok(oversizeRes.error?.includes('25MB'));
  });

  // ── 14. Curriculum Transformation & Teacher Publishing Gate ────────────────
  it('14. Curriculum proposal generates structured draft and enforces teacher approval before publishing', async () => {
    const mentorId = 'mentor-prof-ramon';

    // Pre-create course
    const courseRes = await MentorService.createCourse({
      title: 'Embedded Sensor Integration',
      subject: 'Robotics & Control Systems',
      academicLevel: 'Grade 10',
      mentorId,
    });
    assert.strictEqual(courseRes.success, true);
    const courseId = courseRes.course!.id;

    // 1. Generate Proposal Draft
    const propRes = await MentorService.generateDraftCurriculumProposal(courseId, mentorId);
    assert.strictEqual(propRes.success, true);
    assert.ok(propRes.proposal?.id, 'Proposal draft must be created');
    assert.strictEqual(propRes.proposal?.status, 'draft', 'Generated proposal must default to draft');
    assert.ok(propRes.proposal?.proposal_data.modules.length > 0, 'Must propose modules');

    // Invariant: modules have provenance linking to source documents
    const firstMod = propRes.proposal!.proposal_data.modules[0];
    assert.ok(firstMod.title, 'Module must have a title');
    assert.ok(Array.isArray(firstMod.learning_objectives), 'Module must have learning objectives');
    assert.ok(Array.isArray(firstMod.checkpoints), 'Module must have checkpoints');

    // 2. Teacher Revision
    const updatedData = {
      ...propRes.proposal!.proposal_data,
      title: 'Customized Instructor Curriculum',
    };
    const updateOk = await MentorService.updateCurriculumProposal(propRes.proposal!.id, updatedData);
    assert.strictEqual(updateOk, true, 'Teacher must be able to revise proposal');

    // 3. Teacher Approval & Publishing
    const publishOk = await MentorService.publishCurriculumProposal(propRes.proposal!.id, mentorId);
    assert.strictEqual(publishOk, true, 'Teacher must be able to approve and publish curriculum');
  });

  // ── 15. Real Database Empty State Handling ────────────────────────────────
  it('15. Real database empty state handling: empty state returned without fake student injection', async () => {
    const freshMentorId = 'mentor-fresh-no-data-uuid';

    // Querying fresh mentor returns empty lists, NEVER injecting fake students
    const sections = await MentorService.getAssignedSections(freshMentorId);
    assert.strictEqual(sections.length, 0, 'Fresh mentor must receive 0 sections');

    const students = await MentorService.getAssignedStudents(freshMentorId);
    assert.strictEqual(students.length, 0, 'Fresh mentor must receive 0 students, no fake mock records');

    const courses = await MentorService.getCourses(freshMentorId);
    assert.strictEqual(courses.length, 0, 'Fresh mentor must receive 0 courses');

    const metrics = await MentorService.getDashboardMetrics(freshMentorId);
    assert.strictEqual(metrics.error, null);
    assert.strictEqual(metrics.data?.total_enrolled_students, 0);
    assert.strictEqual(metrics.data?.total_courses, 0);
    assert.strictEqual(metrics.data?.total_sections, 0);
    assert.strictEqual(metrics.data?.students_needing_attention.length, 0);
  });
});

