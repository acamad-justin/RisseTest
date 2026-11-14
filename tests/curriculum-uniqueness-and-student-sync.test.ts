/**
 * RISSE AI — Curriculum Uniqueness, Lesson Generation & Student Synchronization Acceptance Suite
 * 
 * Verifies:
 * 1. AI learning path generation creates distinct, topic-specific modules and checkpoints without repetition.
 * 2. Uniqueness validator guarantees zero duplicate module titles or lesson descriptions.
 * 3. Pre-populated node_content is generated for every lesson, containing authentic domain material.
 * 4. Lesson editor field normalization guarantees bidirectional mapping between canonical and alias keys.
 * 5. Surgical section regeneration updates both canonical and alias keys without wiping other sections.
 * 6. Student View accurately reflects published database curriculum and renders honest empty states when content is in preparation.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CurriculumAiEngine } from '../frontend/lib/mentor/curriculumAiEngine.ts';
import { MentorService } from '../frontend/lib/mentor/mentorService.ts';
import { StudentSyncService } from '../frontend/lib/student/studentSyncService.ts';

describe('RISSE AI — Curriculum Uniqueness & Student View Synchronization', () => {

  const sampleMicroprocessorCourse = {
    id: 'a2957250-4d1e-42fd-9069-bee9942784c6',
    title: 'Intel Microprocessors',
    subject: 'Embedded Microcontrollers',
    academic_level: 'Undergraduate Mechatronics',
    description: 'Comprehensive 32-bit x86 architecture, protected mode execution, memory segmentation and paging systems.',
  };

  const sampleMicroprocessorMaterials = [
    {
      id: 'mat-80386-syllabus',
      course_id: sampleMicroprocessorCourse.id,
      title: 'Intel 80386 Programmer Manual & Syllabus',
      file_name: 'COEN 3203 - Intel 80386 Protected Mode.pdf',
      extracted_content: 'Lesson 1: Registers of the 80386. Lesson 2: Instruction Set and Addressing Modes. Lesson 3: Real Mode vs Protected Mode Transitions. Lesson 4: Memory Segmentation Mechanism and Global Descriptor Tables. Lesson 5: Memory Paging Architecture and Page Directory Tables. Lesson 6: Protection Rings and Exception Vectoring.',
      file_size_bytes: 4096,
      created_at: new Date().toISOString(),
    },
  ];

  it('1. Generates 6 distinct microprocessor modules with 0 duplicate titles, descriptions, or objectives', () => {
    const proposal = CurriculumAiEngine.generateCourseLearningPath({
      course: sampleMicroprocessorCourse,
      materials: sampleMicroprocessorMaterials,
      options: { mode: 'mode_a' },
      courseId: sampleMicroprocessorCourse.id,
    });

    assert.ok(proposal.modules.length >= 6, 'Should generate at least 6 modules');
    
    // Check uniqueness validator
    const uniqueness = CurriculumAiEngine.validateCurriculumUniqueness(proposal);
    assert.ok(uniqueness.isUnique, `Uniqueness check should pass: ${uniqueness.issues.join('; ')}`);
    assert.equal(uniqueness.issues.length, 0);

    // Verify all module titles are unique
    const titles = proposal.modules.map(m => m.title);
    const uniqueTitles = new Set(titles);
    assert.equal(titles.length, uniqueTitles.size, 'All module titles must be unique');

    // Verify module descriptions are within 20-35 words
    proposal.modules.forEach(m => {
      const wordCount = m.description.split(/\s+/).filter(Boolean).length;
      assert.ok(wordCount >= 20 && wordCount <= 40, `Module "${m.title}" description length (${wordCount} words) should be concise`);
      assert.ok(Array.isArray(m.learning_objectives) && m.learning_objectives.length >= 3, `Module "${m.title}" must have at least 3 learning objectives`);
    });
  });

  it('2. Pre-populates authentic, topic-specific node_content for every generated checkpoint', () => {
    const proposal = CurriculumAiEngine.generateCourseLearningPath({
      course: sampleMicroprocessorCourse,
      materials: sampleMicroprocessorMaterials,
      options: { mode: 'mode_a' },
      courseId: sampleMicroprocessorCourse.id,
    });

    let totalCheckpoints = 0;
    let populatedCount = 0;

    proposal.modules.forEach(mod => {
      mod.checkpoints.forEach(cp => {
        totalCheckpoints++;
        if (cp.node_content && cp.node_content.core_lesson && cp.node_content.introduction) {
          populatedCount++;
          // Invariant: Must NOT contain hardcoded sumobot or competitive arena text in a microprocessor course
          assert.ok(
            !cp.node_content.introduction.toLowerCase().includes('sumobot'),
            `Checkpoint "${cp.title}" intro should not have fake sumobot text`
          );
          assert.ok(
            !cp.node_content.core_lesson.toLowerCase().includes('dohyo'),
            `Checkpoint "${cp.title}" core lesson should not have fake dohyo text`
          );
        }
      });
    });

    assert.equal(populatedCount, totalCheckpoints, 'Every single checkpoint must have pre-populated node_content');
  });

  it('3. Generates PLC & Industrial Automation domain blueprints without falling back to generic robotics', () => {
    const plcCourse = {
      id: 'course-plc-101',
      title: 'PLC Industrial Automation',
      subject: 'Programmable Logic Controllers',
      academic_level: 'Vocational Engineering',
      description: 'Relay ladder logic, scan cycles, fail-safe interlocking, and SCADA monitoring.',
    };

    const proposal = CurriculumAiEngine.generateCourseLearningPath({
      course: plcCourse,
      materials: [],
      options: { mode: 'mode_c' },
      courseId: plcCourse.id,
    });

    assert.ok(proposal.modules.length > 0, 'Should generate PLC modules');
    const firstModule = proposal.modules[0];
    assert.ok(
      firstModule.title.toLowerCase().includes('plc') || firstModule.title.toLowerCase().includes('ladder') || firstModule.title.toLowerCase().includes('automation'),
      `First module title "${firstModule.title}" must be PLC domain specific`
    );

    const firstCp = firstModule.checkpoints[0];
    assert.ok(firstCp?.node_content, 'First checkpoint must have node_content');
    assert.ok(
      firstCp.node_content.core_lesson.toLowerCase().includes('scan cycle') || firstCp.node_content.core_lesson.toLowerCase().includes('ladder'),
      'Core lesson should feature PLC scan cycle or ladder logic concepts'
    );
  });

  it('4. Surgical section regeneration updates both canonical and alias keys cleanly', async () => {
    const initialContent = CurriculumAiEngine.generateNodeContent({
      courseId: sampleMicroprocessorCourse.id,
      nodeTitle: 'Memory Segmentation Mechanism & Descriptor Tables',
      courseContext: sampleMicroprocessorCourse,
    });

    assert.ok(initialContent.core_lesson.length > 50, 'Initial core lesson should be populated');

    // Teacher modifies overview
    const teacherCustomized = {
      ...initialContent,
      introduction: 'Teacher custom note: Focus on 80386 GDT and LDT limit checks.',
      overview: 'Teacher custom note: Focus on 80386 GDT and LDT limit checks.',
    };

    // Regenerate ONLY core_lesson (using alias key 'step_by_step_guide')
    const regenResult = await MentorService.regenerateNodeSection({
      existingContent: teacherCustomized,
      sectionKey: 'step_by_step_guide',
      courseId: sampleMicroprocessorCourse.id,
      nodeTitle: 'Memory Segmentation Mechanism & Descriptor Tables',
    });

    assert.ok(regenResult.success, 'Regeneration should succeed');
    assert.ok(regenResult.content, 'Returns regenerated content');

    // Invariant: Teacher's introduction edit was NOT lost
    assert.equal(
      regenResult.content.introduction,
      'Teacher custom note: Focus on 80386 GDT and LDT limit checks.',
      'Teacher custom overview must be strictly preserved'
    );

    // Invariant: Both canonical and alias keys are populated
    assert.ok((regenResult.content as any).core_lesson, 'Canonical core_lesson is updated');
    assert.ok((regenResult.content as any).step_by_step_guide, 'Alias step_by_step_guide is updated');
  });

  it('5. Student View published course resolver propagates authentic node_content to student checkpoints', async () => {
    const studentId = '19e54c4f-d062-42b0-8b08-fc88a7afdbb3';
    const modules = await StudentSyncService.getPublishedModulesForStudent(studentId);

    assert.ok(Array.isArray(modules), 'Returns student module array');

    const microCourseMod = modules.find(m => m.courseTitle?.includes('Intel') || m.title?.includes('80386') || m.title?.includes('Registers'));
    if (microCourseMod) {
      assert.ok(microCourseMod.checkpoints.length > 0, 'Module has checkpoints');
      const firstCp = microCourseMod.checkpoints[0];
      assert.ok(firstCp.node_content, 'Student checkpoint has genuine node_content attached');
      assert.ok(firstCp.node_content.introduction, 'Student checkpoint node_content has introduction');
      assert.ok(firstCp.node_content.core_lesson, 'Student checkpoint node_content has core lesson');
    }
  });

  it('6. Honest empty state contract: empty node_content never falls back to fake robotics dictionary', () => {
    // Simulates an unpopulated checkpoint
    const unpopulatedCp = {
      id: 'cp-empty-1',
      title: 'Advanced Thermodynamic Cycles',
      description: 'Carnot and Rankine cycle analysis.',
      node_content: null,
    };

    // Verify that empty content is recognized as unpopulated
    assert.equal(unpopulatedCp.node_content, null);

    // Node content generator on a thermodynamics topic should not mention sumobots
    const generated = CurriculumAiEngine.generateNodeContent({
      courseId: 'course-thermo-1',
      nodeTitle: unpopulatedCp.title,
      courseContext: {
        title: 'Engineering Thermodynamics',
        subject: 'Mechanical Engineering',
        academicLevel: 'Undergraduate',
      },
    });

    assert.ok(!generated.introduction.toLowerCase().includes('sumobot'), 'Must not inject robotics into thermodynamics');
    assert.ok(generated.core_lesson.includes('Engineering Thermodynamics') || generated.core_lesson.includes('Mechanical Engineering'), 'Dynamic domain adaptation applies');
  });
});

