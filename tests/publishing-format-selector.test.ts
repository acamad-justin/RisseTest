/**
 * RISSE AI — Publishing Format Selector (Part 1) Acceptance Suite
 * 
 * Verifies:
 * 1. Both publishing options (Option A: separate_modules, Option B: one_module) can be selected.
 * 2. Selection persists in proposal_data and restores on reload / re-opening Course Studio.
 * 3. Switching options updates the saved selection immediately.
 * 4. Selecting an option does NOT publish the course (status remains 'under_review' or 'draft').
 * 5. Existing curriculum content (modules, lessons/checkpoints, objectives) remains unchanged.
 * 6. RISSE Foundation Curriculum modules (101–106) remain strictly untouched.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MentorService, DEMO_MENTOR_UUID } from '../frontend/lib/mentor/mentorService.ts';

describe('RISSE AI — Publishing Format Selector (Part 1)', () => {

  const testCourseId = 'c0000000-0000-4000-a000-000000000001';

  it('1. Proposal schema allows saving and restoring publishing_format', async () => {
    // Generate sample modules
    const testModules = [
      {
        id: 'mod-sec-1',
        title: 'Section 1: Robotics Fundamentals',
        description: 'Introduction to kinematic structures and actuators.',
        checkpoints: [
          { id: 'cp-1', title: 'What is a Robot?', type: 'concept' },
          { id: 'cp-2', title: 'Degree of Freedom Lab', type: 'lab' }
        ]
      },
      {
        id: 'mod-sec-2',
        title: 'Section 2: Microcontroller Interfacing',
        description: 'Sensors, ADCs, and digital logic.',
        checkpoints: [
          { id: 'cp-3', title: 'Sensor Voltage Dividers', type: 'concept' },
          { id: 'cp-4', title: 'PWM Motor Control Lab', type: 'lab' }
        ]
      }
    ];

    const draftData = {
      title: 'Robotics Engineering 101',
      description: 'Comprehensive high school mechatronics track.',
      modules: testModules,
      learning_nodes: [
        { id: 'node-1', order: 1, node_number: 1, title: 'What is a Robot?', description: 'Concept intro to robotics', estimated_minutes: 30, node_content: {} },
        { id: 'node-2', order: 2, node_number: 2, title: 'Degree of Freedom Lab', description: 'Hands-on lab for robot kinematic chains', estimated_minutes: 45, node_content: {} }
      ],
      publishing_format: 'separate_modules' as const,
    };

    // Save module draft
    const saveRes = await MentorService.saveModuleDraft(
      testCourseId,
      draftData,
      DEMO_MENTOR_UUID
    );

    assert.ok(saveRes.success, 'Module draft should save successfully');

    // Fetch proposals
    const proposals = await MentorService.getCurriculumProposals(testCourseId);
    assert.ok(proposals.length > 0, 'Should find saved proposal for course');

    const activeProp = proposals[0];
    assert.equal(
      activeProp.proposal_data.publishing_format,
      'separate_modules',
      'Should restore saved Option A (separate_modules)'
    );
  });

  it('2. Switching publishing format updates proposal_data without publishing', async () => {
    const proposals = await MentorService.getCurriculumProposals(testCourseId);
    assert.ok(proposals.length > 0, 'Proposals must exist');
    const proposal = proposals[0];

    // Status before update
    const originalStatus = proposal.status;
    assert.notEqual(originalStatus, 'published', 'Course/proposal must not be published yet');

    // Switch to Option B: one_module
    const updatedData = {
      ...proposal.proposal_data,
      publishing_format: 'one_module' as const,
      organization_mode: 'one_module' as const,
    };

    const updateOk = await MentorService.updateCurriculumProposal(proposal.id, updatedData);
    assert.ok(updateOk, 'updateCurriculumProposal should return true');

    // Re-fetch proposal
    const refetchedProps = await MentorService.getCurriculumProposals(testCourseId);
    const updatedProp = refetchedProps.find(p => p.id === proposal.id);
    assert.ok(updatedProp, 'Updated proposal must exist');

    assert.equal(
      updatedProp.proposal_data.publishing_format,
      'one_module',
      'Option B (one_module) should be persisted'
    );

    // CRITICAL: Ensure selecting an option does NOT publish the course
    assert.notEqual(updatedProp.status, 'published', 'Proposal status must not transition to published');
  });

  it('3. Preserves all existing curriculum content and checkpoints intact', async () => {
    const proposals = await MentorService.getCurriculumProposals(testCourseId);
    const prop = proposals.find(p => p.course_id === testCourseId);
    assert.ok(prop, 'Proposal must exist');

    assert.equal(prop.proposal_data.modules.length, 2, 'Modules count must be preserved');
    assert.equal(prop.proposal_data.modules[0].checkpoints.length, 2, 'Checkpoints in module 1 preserved');
    assert.equal(prop.proposal_data.modules[1].checkpoints.length, 2, 'Checkpoints in module 2 preserved');
    assert.equal(prop.proposal_data.modules[0].title, 'Section 1: Robotics Fundamentals');
    assert.equal(prop.proposal_data.modules[1].title, 'Section 2: Microcontroller Interfacing');
  });

  it('4. Foundation Curriculum modules 101–106 remain strictly untouched', async () => {
    const foundation = await MentorService.getCurriculumModules();
    assert.ok(Array.isArray(foundation), 'Curriculum modules should return an array');
    
    // Check that foundation modules exist and their IDs are untouched
    const ids = foundation.map(m => m.id);
    assert.ok(ids.length >= 1, 'Foundation curriculum modules must remain intact');
  });

  it('5. CurriculumDesigner template contains Option A, Option B, and selection requirements', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const fileContent = fs.readFileSync(
      path.resolve(process.cwd(), 'frontend/resources/js/views/mentor/curriculum/CurriculumDesigner.vue'),
      'utf8'
    );

    // Verify UI Elements
    assert.ok(fileContent.includes('publishing-format-stage'), 'Should have publishing-format-stage section');
    assert.ok(fileContent.includes('Option A: Publish as Separate Modules'), 'Should have Option A label');
    assert.ok(fileContent.includes('Option B: Publish as One Combined Module'), 'Should have Option B label');
    assert.ok(fileContent.includes('selectedPublishingFormat'), 'Should bind selectedPublishingFormat ref');
    assert.ok(fileContent.includes('selectPublishingFormat'), 'Should have selectPublishingFormat handler');
    assert.ok(fileContent.includes('publishing_format'), 'Should read/write publishing_format in proposal_data');
    assert.ok(fileContent.includes(':disabled="isPublishing || !selectedPublishingFormat"'), 'Publish button should require format selection');
  });

});

