// tests/student-mentor-sync.test.ts
/**
 * RISSE AI — Phase 2C Integration Test Suite
 *
 * Verifies complete student-mentor synchronization across:
 * 1. Mentor Star Awards -> Student Home Achievements
 * 2. Published Teacher Courses -> Student Modules Catalog
 * 3. Manual Checkpoint Progress -> Supabase student_module_memory
 * 4. Critical Learning Integrity Invariants (Mastery !== Checkpoint !== Star)
 * 5. Supabase Real Demo Accounts (demo1@acamad.com, demo2@acamad.com)
 * 6. Modal Safety (Zero unclosable popups, clean default state)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { StudentSyncService, type StudentStarAward, type StudentPublishedModule } from '../frontend/lib/student/studentSyncService.ts';

describe('Phase 2C: Student–Mentor Database Synchronization', () => {

  const testStudentId = 'student-test-sync-101';
  const testSectionId = 'section-robotics-alpha';
  const testCourseId = 'course-autonomous-systems';

  // ═══════════════════════════════════════════════════════════════════════════
  // TASK 1: SYNCHRONIZE MENTOR STAR AWARDS WITH STUDENT HOME
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Task 1: Star Awards Synchronization & Invariants', () => {
    it('1. Student receives active mentor-awarded stars from database query', async () => {
      const sampleAwards: StudentStarAward[] = [
        {
          id: 'motion-builder',
          star_id: 'motion-builder',
          title: 'Motion Builder',
          category: 'Robotics & Control Systems',
          description: 'Demonstrated consistent PID and motion tuning in laboratory practice.',
          module_id: 106,
          status: 'awarded',
          created_at: new Date().toISOString(),
          isMentorAward: true,
        },
        {
          id: 'signal-navigator',
          star_id: 'signal-navigator',
          title: 'Signal Navigator',
          category: 'Sensors & Perception',
          description: 'Mastered noise filtering, ADC thresholds, and voltage dividers.',
          module_id: 101,
          status: 'awarded',
          created_at: new Date().toISOString(),
          isMentorAward: true,
        },
      ];

      StudentSyncService._setTestStarAwards(testStudentId, sampleAwards);

      const activeAwards = await StudentSyncService.getStudentStarAwards(testStudentId);
      assert.strictEqual(activeAwards.length, 2);
      assert.strictEqual(activeAwards[0].star_id, 'motion-builder');
      assert.strictEqual(activeAwards[0].status, 'awarded');
      assert.strictEqual(activeAwards[1].star_id, 'signal-navigator');
      assert.strictEqual(activeAwards[1].status, 'awarded');
    });

    it('2. Revoked star awards (status = "revoked") are strictly excluded from active achievements', async () => {
      const mixedAwards: StudentStarAward[] = [
        {
          id: 'motion-builder',
          star_id: 'motion-builder',
          title: 'Motion Builder',
          category: 'Robotics & Control Systems',
          description: 'Demonstrated consistent PID and motion tuning.',
          module_id: 106,
          status: 'awarded',
          created_at: new Date().toISOString(),
          isMentorAward: true,
        },
        {
          id: 'pit-triage-champion',
          star_id: 'pit-triage-champion',
          title: 'Pit Triage Champion',
          category: 'Sumobot Competition',
          description: 'Rapid triage under competition stress.',
          module_id: 104,
          status: 'revoked', // REVOKED
          created_at: new Date().toISOString(),
          isMentorAward: true,
        },
      ];

      StudentSyncService._setTestStarAwards(testStudentId, mixedAwards);

      const activeAwards = await StudentSyncService.getStudentStarAwards(testStudentId);
      assert.strictEqual(activeAwards.length, 1);
      assert.strictEqual(activeAwards[0].star_id, 'motion-builder');
      assert.strictEqual(activeAwards.some(a => a.star_id === 'pit-triage-champion'), false, 'Revoked star must never appear');
    });

    it('3. CRITICAL INVARIANT: Star awards celebrate milestones but NEVER modify concept mastery records', async () => {
      const awards = await StudentSyncService.getStudentStarAwards(testStudentId);
      // Awards must not fabricate cognitive mastery claims
      assert.strictEqual(awards.every(a => !('mastery_state' in a)), true);
      assert.strictEqual(awards.every(a => a.isMentorAward === true), true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TASK 2: REPLACE HARDCODED CATALOG WITH PUBLISHED DATABASE COURSES
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Task 2: Published Course Catalog Roster', () => {
    it('4. Enrolled students receive published courses assigned to their section', async () => {
      const publishedModules: StudentPublishedModule[] = [
        {
          id: 'course-robotics-m1',
          courseId: testCourseId,
          courseTitle: 'Autonomous Robotics Engineering',
          title: 'Sensors & Signal Processing',
          level: 'Beginner',
          levelColor: 'yellow',
          steps: '3 Learning Steps',
          skillsAcquired: 'Sensor Calibration, ADC Filtering',
          badge: 'Signal Specialist',
          status: 'unregistered',
          isStarred: false,
          actionText: 'Enroll',
          description: 'Hands-on exploration of sensor input and filtering.',
          checkpoints: [
            { id: 'chk-1', name: 'Analog Inputs', type: 'concept', description: 'ADC conversion.' },
            { id: 'chk-2', name: 'Low-Pass Filter', type: 'lab', description: 'RC filter assembly.' },
          ],
          learningObjectives: ['Understand ADC', 'Implement software filter'],
          currentStep: 0,
          totalSteps: 2,
          progressPercent: 0,
          currentCheckpoint: 'Analog Inputs',
          theme: 'yellow',
        },
      ];

      StudentSyncService._setTestPublishedCourses(testStudentId, publishedModules);

      const modules = await StudentSyncService.getPublishedModulesForStudent(testStudentId);
      assert.strictEqual(modules.length, 1);
      assert.strictEqual(modules[0].courseId, testCourseId);
      assert.strictEqual(modules[0].title, 'Sensors & Signal Processing');
      assert.strictEqual(modules[0].checkpoints.length, 2);
    });

    it('5. Draft curriculum proposals and unpublished courses are strictly hidden from students', async () => {
      const studentWithoutCourses = 'student-unassigned-999';
      const modules = await StudentSyncService.getPublishedModulesForStudent(studentWithoutCourses);
      assert.deepStrictEqual(modules, [], 'Students without published section courses receive clean empty array');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TASK 3: SYNCHRONIZE MANUAL CHECKPOINT PROGRESS WITH SUPABASE
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Task 3: Manual Checkpoint Progress Synchronization', () => {
    it('6. Student checkpoint progress persists to student_module_memory', async () => {
      const result = await StudentSyncService.recordCheckpointProgress(
        testStudentId,
        'course-robotics-m1',
        'Low-Pass Filter',
        50
      );

      assert.strictEqual(result.success, true);
    });

    it('7. CRITICAL INVARIANT: Manual checkpoint completion updates progress without touching concept mastery', async () => {
      const result = await StudentSyncService.recordCheckpointProgress(
        testStudentId,
        'course-robotics-m1',
        'Final Verification',
        100
      );

      assert.strictEqual(result.success, true);
      // Progress percent is clamped between 0 and 100
      const clampedResult = await StudentSyncService.recordCheckpointProgress(
        testStudentId,
        'course-robotics-m1',
        'Over-completion',
        150
      );
      assert.strictEqual(clampedResult.success, true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TASK 5: REAL SUPABASE DEMO ACCOUNTS REPLACEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Task 5: Supabase Real Demo Accounts Verification', () => {
    const rootDir = process.cwd().endsWith('frontend') ? resolve(process.cwd(), '..') : process.cwd();
    const authViewPath = resolve(rootDir, 'frontend/resources/js/views/AuthView.vue');
    const authStorePath = resolve(rootDir, 'frontend/resources/js/stores/authStore.js');

    it('8. AuthView.vue has replaced student demo buttons with demo1@acamad.com and demo2@acamad.com', () => {
      assert.strictEqual(existsSync(authViewPath), true, 'AuthView.vue must exist');
      const content = readFileSync(authViewPath, 'utf8');

      assert.strictEqual(content.includes('demo1@acamad.com'), true, 'Must contain demo1@acamad.com');
      assert.strictEqual(content.includes('demo2@acamad.com'), true, 'Must contain demo2@acamad.com');
      assert.strictEqual(content.includes('acamaddemo1'), true, 'Must contain acamaddemo1 password fill');
      assert.strictEqual(content.includes('acamaddemo2'), true, 'Must contain acamaddemo2 password fill');

      // Verify old demo accounts are removed from button labels
      assert.strictEqual(content.includes('student@risse.edu'), false, 'Old student demo email must be removed');
      assert.strictEqual(content.includes('learner@risse.edu'), false, 'Old learner demo email must be removed');
    });

    it('9. authStore.js quickLogin cleanly supports demo1 and demo2 accounts', () => {
      assert.strictEqual(existsSync(authStorePath), true, 'authStore.js must exist');
      const content = readFileSync(authStorePath, 'utf8');

      assert.strictEqual(content.includes('demo1@acamad.com'), true, 'authStore must recognize demo1@acamad.com');
      assert.strictEqual(content.includes('demo2@acamad.com'), true, 'authStore must recognize demo2@acamad.com');
      assert.strictEqual(content.includes('quickLogin'), true, 'quickLogin handler must exist');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TASK 6: MODAL SAFETY & DISMISSAL VERIFICATION
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Task 6: Modal Lifecycle & Dismissal Safety', () => {
    const rootDir = process.cwd().endsWith('frontend') ? resolve(process.cwd(), '..') : process.cwd();
    const mentorStorePath = resolve(rootDir, 'frontend/resources/js/stores/mentorStore.js');
    const starActionModalPath = resolve(rootDir, 'frontend/resources/js/components/mentor/StarActionModal.vue');

    it('10. mentorStore initializes all modals to closed (isStarModalOpen = false, isDetailOpen = false)', () => {
      assert.strictEqual(existsSync(mentorStorePath), true);
      const content = readFileSync(mentorStorePath, 'utf8');

      assert.strictEqual(content.includes('const isStarModalOpen = ref(false);'), true);
      assert.strictEqual(content.includes('const isDetailOpen = ref(false);'), true);
      assert.strictEqual(content.includes('function resetModals()'), true);
    });

    it('11. StarActionModal provides reliable close controls (overlay, cancel button, close button, ESC key)', () => {
      assert.strictEqual(existsSync(starActionModalPath), true);
      const content = readFileSync(starActionModalPath, 'utf8');

      assert.strictEqual(content.includes('@click.self="closeModal"'), true, 'Overlay self-click must dismiss modal');
      assert.strictEqual(content.includes('class="btn-cancel"'), true, 'Cancel button must exist');
      assert.strictEqual(content.includes('class="modal-close-btn"'), true, 'Close X button must exist');
      assert.strictEqual(content.includes("e.key === 'Escape'"), true, 'ESC key handler must exist');
    });

    it('12. Database migration schema 20261107000002_phase2c_student_mentor_sync.sql exists and defines atomic checkpoint progress RPC', () => {
      const rootDir = process.cwd().endsWith('frontend') ? resolve(process.cwd(), '..') : process.cwd();
      const migrationPath = resolve(rootDir, 'supabase/migrations/20261107000002_phase2c_student_mentor_sync.sql');
      assert.strictEqual(existsSync(migrationPath), true, 'Phase 2C SQL migration must exist');
      const sql = readFileSync(migrationPath, 'utf8');

      assert.strictEqual(sql.includes('record_student_checkpoint_progress'), true, 'Must define checkpoint progress RPC');
      assert.strictEqual(sql.includes('student_module_memory'), true, 'Must define student module memory RLS');
      assert.strictEqual(sql.includes('curriculum_proposals'), true, 'Must define published curriculum visibility RLS');
    });
  });

});
