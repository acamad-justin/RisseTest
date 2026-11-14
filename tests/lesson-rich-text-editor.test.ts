/**
 * RISSE AI — Module Studio Rich-Text Lesson Editing
 *
 * Covers:
 *  1. HTML sanitization / CSS allowlisting (both browser-DOM and Node paths)
 *  2. Legacy Markdown → semantic HTML promotion (teachers never type Markdown)
 *  3. Rich HTML rendering parity between student and preview surfaces
 *  4. Published-proposal protection (unpublished_draft staging, no live overwrite)
 *  5. Republish promotion + student cache purge
 *  6. StudentSyncService field parity on the legacy pData.modules path
 *  7. Module Studio UI contracts (shared renderer, editable/previewMode, Cancel/Save)
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  sanitizeLessonHtml,
  sanitizeInlineStyle,
  isRichHtmlContent,
  markdownToRichHtml,
  prepareContentForEditor,
  renderLessonRichHtml,
  stripRichHtmlToPlainText,
} from '../frontend/lib/mentor/richLessonContent.ts';
import { MentorService } from '../frontend/lib/mentor/mentorService.ts';
import { StudentSyncService } from '../frontend/lib/student/studentSyncService.ts';
import { supabase } from '../frontend/resources/js/lib/supabaseClient.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const read = (p: string) => readFileSync(resolve(rootDir, p), 'utf8');

const DEMO_MENTOR_UUID = 'd1e00000-0000-4000-a000-000000000101';

// ═══════════════════════════════════════════════════════════════════════════
// 1. SANITIZATION
// ═══════════════════════════════════════════════════════════════════════════
describe('1. Rich lesson HTML sanitization', () => {
  test('1a. Removes script/iframe payloads and inline event handlers', () => {
    const dirty =
      '<p onclick="alert(1)">Safe</p><script>alert(2)</script>' +
      '<iframe src="https://evil.test"></iframe><img src="https://ok.test/a.png" onerror="alert(3)">';
    const clean = sanitizeLessonHtml(dirty);

    assert.ok(!/script/i.test(clean), 'script tags must be stripped with their content');
    assert.ok(!/iframe/i.test(clean), 'iframes must be stripped');
    assert.ok(!/onclick/i.test(clean), 'inline event handlers must be stripped');
    assert.ok(!/onerror/i.test(clean), 'img event handlers must be stripped');
    assert.match(clean, /<p>Safe<\/p>/, 'plain paragraphs survive');
    assert.match(clean, /src="https:\/\/ok\.test\/a\.png"/, 'safe image sources survive');
  });

  test('1b. Styles are restricted to color, background-color, font-size and text-align', () => {
    const clean = sanitizeLessonHtml(
      '<p style="color: #ea580c; font-size: 18px; text-align: center; position: fixed; background-image: url(javascript:alert(1))">Styled</p>'
    );
    assert.match(clean, /color: #ea580c/);
    assert.match(clean, /font-size: 18px/);
    assert.match(clean, /text-align: center/);
    assert.ok(!/position/i.test(clean), 'position must be dropped');
    assert.ok(!/url\(/i.test(clean), 'url() must be dropped');
  });

  test('1c. Highlight markup emitted by Tiptap multicolor Highlight is preserved', () => {
    const clean = sanitizeLessonHtml(
      '<p><mark data-color="#fef08a" style="background-color: #fef08a; color: inherit">Key idea</mark></p>'
    );
    assert.match(clean, /<mark/);
    assert.match(clean, /background-color: #fef08a/);
    assert.match(clean, /data-color="#fef08a"/);
  });

  test('1d. Unsafe link/image protocols are rejected', () => {
    assert.equal(isRichHtmlContent('<p>x</p>'), true);
    assert.equal(isRichHtmlContent('## Markdown heading'), false);

    const clean = sanitizeLessonHtml(
      '<a href="javascript:alert(1)">bad</a><img src="javascript:alert(1)"><a href="https://ok.test">good</a>'
    );
    assert.ok(!/javascript:/i.test(clean), 'javascript: URLs must never survive');
    assert.match(clean, /href="https:\/\/ok\.test"/);
    assert.match(clean, /rel="noopener noreferrer"/);
  });

  test('1e. sanitizeInlineStyle keeps valid declarations and drops the rest', () => {
    const style = sanitizeInlineStyle(
      'color: #ea580c; font-size: 18px; text-align: justify; display: none; background: url(x)'
    );
    assert.equal(style, 'color: #ea580c; font-size: 18px; text-align: justify');
  });

  test('1f. sanitization is idempotent (re-saving an edit cannot drift the markup)', () => {
    const samples = [
      '<h2 style="text-align: center">Flow</h2><p><u>U</u> <strong>B</strong></p>',
      '<p><img src="/img/a.png" alt="Diagram"></p>',
      '<p>a<br/>b</p><hr/>',
      '<ul><li>one</li></ul><p><mark data-color="#fef08a" style="background-color: #fef08a">hi</mark></p>',
      '<table><thead><tr><th colspan="2">A</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>',
    ];
    for (const sample of samples) {
      const once = sanitizeLessonHtml(sample);
      assert.equal(sanitizeLessonHtml(once), once, `sanitizer drifted for ${sample}`);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. MARKDOWN → RICH HTML BRIDGE
// ═══════════════════════════════════════════════════════════════════════════
describe('2. Legacy Markdown promotion', () => {
  test('2a. Editor receives semantic HTML, never raw Markdown syntax', () => {
    const editorHtml = prepareContentForEditor(
      '## Signal Flow\n\nA **sensor** converts *physical state* into voltage.\n\n- Sampling\n- Filtering\n\n1. Read\n2. Compare'
    );
    assert.ok(!editorHtml.includes('##'), 'heading hashes must not reach the editor');
    assert.ok(!editorHtml.includes('**'), 'bold asterisks must not reach the editor');
    assert.match(editorHtml, /<h2>Signal Flow<\/h2>/);
    assert.match(editorHtml, /<strong>sensor<\/strong>/);
    assert.match(editorHtml, /<em>physical state<\/em>/);
    assert.match(editorHtml, /<ul><li>Sampling<\/li><li>Filtering<\/li><\/ul>/);
    assert.match(editorHtml, /<ol><li>Read<\/li><li>Compare<\/li><\/ol>/);
  });

  test('2b. Student rendering keeps legacy styling classes identical to before', () => {
    const studentHtml = renderLessonRichHtml('## Signal Flow\n\nText **bold**');
    assert.match(studentHtml, /class="md-h2"/, 'student headings keep md-h2 styling');
    assert.match(studentHtml, /class="md-p"/, 'student paragraphs keep md-p styling');
    assert.match(studentHtml, /<strong>bold<\/strong>/);
  });

  test('2c. Rich HTML passes through untouched (sanitized) while Markdown is promoted', () => {
    const stored = '<h2 style="text-align: center">Flow</h2><p><u>Underlined</u> text</p>';
    const rendered = renderLessonRichHtml(stored);
    assert.match(rendered, /<h2 style="text-align: center">Flow<\/h2>/);
    assert.match(rendered, /<u>Underlined<\/u>/);
    assert.equal(renderLessonRichHtml(''), '');
    assert.equal(renderLessonRichHtml(null), '');
  });

  test('2d. Markdown block structures survive (fenced code, tables, quotes)', () => {
    const html = markdownToRichHtml(
      '```cpp\nint x = 1;\n```\n\n| Pin | Mode |\n| --- | --- |\n| 9 | PWM |\n\n> Safety first'
    );
    assert.match(html, /<pre><code>int x = 1;<\/code><\/pre>/);
    assert.match(html, /<table><thead><tr><th>Pin<\/th><th>Mode<\/th><\/tr><\/thead>/);
    assert.match(html, /<td>9<\/td><td>PWM<\/td>/);
    assert.match(html, /<blockquote>/);
  });

  test('2e. stripRichHtmlToPlainText feeds clean text to the AI tutor', () => {
    assert.equal(
      stripRichHtmlToPlainText('<p>Hello <strong>world</strong></p><ul><li>One</li></ul>'),
      'Hello world\nOne'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. PUBLISHED CONTENT PROTECTION
// ═══════════════════════════════════════════════════════════════════════════
describe('3. Published student content is never silently overwritten', () => {
  const liveNodeContent = {
    core_lesson: '<p>Published safety briefing.</p>',
    introduction: '<p>Published introduction.</p>',
  };

  function buildLiveProposalData() {
    return {
      title: 'Live Curriculum',
      summary: 'Live summary',
      publishing_format: 'one_module',
      organization_mode: 'one_module',
      modules: [
        {
          id: 'mod-live-1',
          title: 'Live Module',
          description: 'Live module description',
          checkpoints: [
            {
              id: 'cp-live-1',
              title: 'Live Lesson',
              type: 'concept',
              node_content: JSON.parse(JSON.stringify(liveNodeContent)),
            },
          ],
        },
      ],
    };
  }

  /** Creates a proposal and reflects it back as an already-published row. */
  async function createPublishedProposal(title: string) {
    const courseRes = await MentorService.createCourse({
      title,
      subject: 'Robotics',
      academicLevel: 'Grade 10',
      mentorId: DEMO_MENTOR_UUID,
    });
    assert.equal(courseRes.success, true);
    const courseId = courseRes.course!.id;

    const genRes = await MentorService.generateDraftCurriculumProposal(courseId, DEMO_MENTOR_UUID);
    const proposal = genRes.proposal!;
    const publishedData = buildLiveProposalData();

    // Reflect the published shape onto the stored proposal (offline-safe).
    const stored = (await MentorService.getCurriculumProposals(courseId)).find(p => p.id === proposal.id)!;
    stored.proposal_data = publishedData;
    stored.status = 'published';
    return { courseId, proposalId: proposal.id, publishedData: JSON.parse(JSON.stringify(publishedData)) };
  }

  test('3a. stageEditsForPublishedProposal keeps every live key and parks edits in unpublished_draft', () => {
    const stage = (MentorService as any).stageEditsForPublishedProposal;
    assert.equal(typeof stage, 'function', 'staging helper must exist');

    const live = buildLiveProposalData();
    const incoming = {
      ...JSON.parse(JSON.stringify(live)),
      modules: [
        {
          id: 'mod-live-1',
          title: 'Live Module',
          checkpoints: [
            { id: 'cp-live-1', title: 'Live Lesson', node_content: { core_lesson: '<p>Edited</p>' } },
          ],
        },
      ],
      unpublished_draft: { polluted: true },
    };

    const staged = stage(live, incoming);

    // Live student-facing keys are byte-identical.
    assert.deepEqual(staged.modules, live.modules);
    assert.equal(staged.publishing_format, 'one_module');
    // Edits are parked, and no nested wrapper leaks into the staged draft.
    assert.equal(staged.unpublished_draft.modules[0].checkpoints[0].node_content.core_lesson, '<p>Edited</p>');
    assert.equal(staged.unpublished_draft.unpublished_draft, undefined);
  });

  test('3b. updateCurriculumProposal never mutates live content on a published proposal', async () => {
    const { courseId, proposalId, publishedData } = await createPublishedProposal('Rich Text Protection Course');

    const editedData = JSON.parse(JSON.stringify(publishedData));
    editedData.modules[0].checkpoints[0].node_content.core_lesson = '<p>Edited but unpublished.</p>';

    const ok = await MentorService.updateCurriculumProposal(proposalId, editedData);
    assert.equal(ok, true);

    const afterSave = (await MentorService.getCurriculumProposals(courseId)).find(p => p.id === proposalId)!;
    assert.equal(afterSave.status, 'published', 'editing a published proposal must never demote it');

    // The live (student-facing) content must be unchanged.
    assert.deepEqual(
      afterSave.proposal_data.modules[0].checkpoints[0].node_content,
      liveNodeContent,
      'live published lesson content MUST NOT change when saving a draft'
    );
    assert.ok(afterSave.proposal_data.unpublished_draft, 'edits must be staged in unpublished_draft');
    assert.equal(
      afterSave.proposal_data.unpublished_draft.modules[0].checkpoints[0].node_content.core_lesson,
      '<p>Edited but unpublished.</p>',
      'the staged draft holds the teacher edit'
    );
  });

  test('3c. republishing promotes the staged draft and removes the wrapper', async () => {
    const { courseId, proposalId, publishedData } = await createPublishedProposal('Republish Promotion Course');

    const editedData = JSON.parse(JSON.stringify(publishedData));
    editedData.modules[0].checkpoints[0].node_content.core_lesson = '<p>Promoted lesson.</p>';
    editedData.modules[0].checkpoints[0].blocks = [
      { id: 'blk-1', type: 'callout', title: 'Tip', content: '<p>Rich <strong>text</strong></p>' },
    ];
    assert.equal(await MentorService.updateCurriculumProposal(proposalId, editedData), true);

    const stagedRow = (await MentorService.getCurriculumProposals(courseId)).find(p => p.id === proposalId)!;
    assert.ok(stagedRow.proposal_data.unpublished_draft);

    // Republish using exactly what the Designer holds (the published snapshot wrapper).
    const republished = await MentorService.publishCurriculumProposal(
      proposalId,
      DEMO_MENTOR_UUID,
      stagedRow.proposal_data
    );
    assert.equal(republished, true, 'staged draft must be republishable');

    const afterPublish = (await MentorService.getCurriculumProposals(courseId)).find(p => p.id === proposalId)!;
    assert.equal(
      afterPublish.proposal_data.unpublished_draft,
      undefined,
      'publishing promotes the draft and removes the staging wrapper'
    );
    assert.equal(
      afterPublish.proposal_data.modules[0].checkpoints[0].node_content.core_lesson,
      '<p>Promoted lesson.</p>',
      'promoted content becomes the new live student content'
    );
    assert.ok(
      Array.isArray(afterPublish.proposal_data.modules[0].checkpoints[0].blocks),
      'rich blocks survive the promotion'
    );
  });

  test('3d. unwrapStagedDraft returns the draft, or the data itself when nothing is staged', () => {
    const wrapped = { title: 'Live', unpublished_draft: { title: 'Draft' } };
    assert.deepEqual(MentorService.unwrapStagedDraft(wrapped), { title: 'Draft' });
    const plain = { title: 'Live' };
    assert.deepEqual(MentorService.unwrapStagedDraft(plain), plain);
  });

  test('3e. an unpublished proposal still saves in place (unchanged behaviour)', async () => {
    const courseRes = await MentorService.createCourse({
      title: 'Draft Save Unchanged Course',
      subject: 'Robotics',
      academicLevel: 'Grade 10',
      mentorId: DEMO_MENTOR_UUID,
    });
    const courseId = courseRes.course!.id;
    const genRes = await MentorService.generateDraftCurriculumProposal(courseId, DEMO_MENTOR_UUID);
    const proposalId = genRes.proposal!.id;

    const draftData = { ...buildLiveProposalData(), title: 'Teacher Edited Draft' };
    delete (draftData as any).publishing_format;
    assert.equal(await MentorService.updateCurriculumProposal(proposalId, draftData), true);

    const after = (await MentorService.getCurriculumProposals(courseId)).find(p => p.id === proposalId)!;
    assert.equal(after.proposal_data.title, 'Teacher Edited Draft', 'draft edits save directly');
    assert.equal(after.proposal_data.unpublished_draft, undefined, 'no staging needed for unpublished rows');
    assert.equal(after.status, 'under_review');
  });

  test('3f. saveModuleDraft preserves blocks, assessment, source_reference and topic_group', async () => {
    const courseRes = await MentorService.createCourse({
      title: 'Structured Content Parity Course',
      subject: 'Robotics',
      academicLevel: 'Grade 10',
      mentorId: DEMO_MENTOR_UUID,
    });
    const courseId = courseRes.course!.id;

    const node = {
      id: 'node-structured',
      title: 'Structured Node',
      node_content: { core_lesson: '<p>Guide</p>' },
      blocks: [{ id: 'blk-1', type: 'callout', title: 'Tip', content: '<p>Rich <strong>text</strong></p>' }],
      assessment: { format: 'multiple_choice', questions: [{ id: 'q1', question: 'Q?', correct_answer: 'A' }] },
      source_reference: { section: 'Chapter 1', heading: 'Signals' },
      topic_group: 'Sensing',
    };

    const saved = await MentorService.saveModuleDraft(
      courseId,
      { title: 'Structured Module', learning_nodes: [node] },
      DEMO_MENTOR_UUID
    );
    assert.equal(saved.success, true);

    // The synthesized legacy wrapper must carry the structured fields forward.
    const draft = saved.draft as any;
    const wrapperCp = (draft.modules?.[0]?.checkpoints || []).find((c: any) => c.id === 'node-structured');
    assert.ok(wrapperCp, 'legacy modules[0].checkpoints wrapper must include the node');
    assert.deepEqual(wrapperCp.blocks, node.blocks);
    assert.deepEqual(wrapperCp.assessment, node.assessment);
    assert.deepEqual(wrapperCp.source_reference, node.source_reference);
    assert.equal(wrapperCp.topic_group, 'Sensing');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. STUDENT SYNC PARITY
// ═══════════════════════════════════════════════════════════════════════════
describe('4. Students receive the same structured fields on both sync paths', () => {
  test('4a. legacy pData.modules branch forwards blocks/assessment/source_reference/topic_group', () => {
    const source = read('frontend/lib/student/studentSyncService.ts');
    const modulesBranch = source.slice(source.indexOf('} else if (pData.modules) {'));
    const slice = modulesBranch.slice(0, 3000);
    assert.match(slice, /blocks: Array\.isArray\(cp\.blocks\) \? cp\.blocks : null/);
    assert.match(slice, /assessment: cp\.assessment \|\| null/);
    assert.match(slice, /source_reference: cp\.source_reference \|\| null/);
    assert.match(slice, /topic_group: cp\.topic_group \|\| null/);
  });

  test('4b. learning_nodes branch keeps the same five fields', () => {
    const source = read('frontend/lib/student/studentSyncService.ts');
    assert.match(source, /node_content: node\.node_content \|\| null/);
    assert.match(source, /topic_group: node\.topic_group \|\| null/);
    assert.match(source, /blocks: Array\.isArray\(node\.blocks\) \? node\.blocks : null/);
    assert.match(source, /assessment: node\.assessment \|\| null/);
    assert.match(source, /source_reference: node\.source_reference \|\| null/);
  });

  test('4c. StudentSyncService exposes cache purging used after publishing', () => {
    assert.equal(typeof (StudentSyncService as any).purgeAllCaches, 'function');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. UI CONTRACTS
// ═══════════════════════════════════════════════════════════════════════════
describe('5. Module Studio UI contracts', () => {
  const designer = read('frontend/resources/js/views/mentor/curriculum/CurriculumDesigner.vue');
  const renderer = read('frontend/resources/js/components/CheckpointContentView.vue');
  const editorPath = 'frontend/resources/js/components/mentor/LessonRichTextInlineEditor.vue';

  test('5a. the preview embeds the shared student renderer with editing enabled', () => {
    assert.ok(existsSync(resolve(rootDir, editorPath)), 'inline editor component must exist');
    assert.match(
      designer,
      /<CheckpointContentView[\s\S]{0,600}:editable="true"[\s\S]{0,200}:preview-mode="true"/,
      'preview must embed CheckpointContentView with editable + preview-mode'
    );
  });

  test('5b. inline edits are buffered and only Save Draft persists them', () => {
    assert.match(renderer, /emit\('update-lesson-content'/, 'renderer must emit buffered edits');
    assert.match(designer, /@update-lesson-content="handlePreviewLessonUpdate"/);
    assert.match(designer, /previewEditBuffer/, 'preview edits must be buffered separately');
    assert.match(designer, /function closeStudentPreview\(\)/, 'preview must expose an explicit discard path');
    assert.match(designer, /mentorStore\.saveProposalEdits\(/, 'Save Draft must reuse the mentor save path');
    assert.match(designer, /previewHasUnsavedEdits/, 'Save Draft must be gated on unsaved edits');
  });

  test('5c. the toolbar exposes every required Word-style control', () => {
    const editor = read(editorPath);
    assert.match(editor, /toggleBold\(\)/, 'Bold');
    assert.match(editor, /toggleItalic\(\)/, 'Italic');
    assert.match(editor, /toggleUnderline\(\)/, 'Underline');
    assert.match(editor, /toggleHeading\(\{ level: 1 \}\)/, 'Heading styles');
    assert.match(editor, /toggleBulletList\(\)/, 'Bulleted list');
    assert.match(editor, /toggleOrderedList\(\)/, 'Numbered list');
    assert.match(editor, /setTextAlign\('left'\)/, 'Text alignment (left)');
    assert.match(editor, /setTextAlign\('justify'\)/, 'Text alignment (justify)');
    assert.match(editor, /setFontSize\(/, 'Font size');
    assert.match(editor, /setColor\(/, 'Text color');
    assert.match(editor, /setHighlight\(\{ color \}\)/, 'Text highlighting');
    assert.match(editor, /dropcursor: false/, 'no drag-and-drop cursor');
    assert.match(editor, /handleDrop: \(\) => true/, 'drops are rejected (no block repositioning)');
    assert.match(editor, /draggable: false/, 'images are not draggable / resizable');
  });

  test('5d. student rendering keeps its existing lesson structure classes', () => {
    assert.match(renderer, /lesson-blocks-stream/);
    assert.match(renderer, /block-callout-card/);
    assert.match(renderer, /block-code-card/);
    assert.match(renderer, /block-activity-card/);
    assert.match(renderer, /block-table-card/);
    assert.match(renderer, /interactive-assessment-section/);
    assert.match(renderer, /evaluateAssessmentAnswer/);
  });

  test('5e. preview mode blocks student progress / mastery / checkpoint writes', () => {
    assert.match(renderer, /previewMode: \{[\s\S]{0,120}type: Boolean/);
    assert.match(
      renderer,
      /if \(props\.previewMode\) \{\s*\n\s*emit\('notify', 'Preview mode — checkpoint completion is disabled/,
      'handleCompleteCheckpoint must short-circuit in preview mode'
    );
    assert.match(renderer, /v-if="!previewMode"[\s\S]{0,400}btn-complete-checkpoint/, 'no completion button in preview');
    assert.match(renderer, /v-if="!previewMode"[\s\S]{0,400}btn-star-checkpoint/, 'no star button in preview');
    const completeFn = renderer.slice(renderer.indexOf('async function handleCompleteCheckpoint()'));
    const previewGuardIndex = completeFn.indexOf('props.previewMode');
    const progressApiIndex = completeFn.indexOf("axios.post('/api/modules/progress'");
    assert.ok(previewGuardIndex !== -1 && previewGuardIndex < progressApiIndex, 'guard precedes every progress write');
    assert.match(
      renderer,
      /async function sendMessage\(\) \{\s*\n\s*if \(props\.previewMode\)/,
      'AI tutor requests are disabled in preview mode'
    );
  });

  test('5f. existing Module Studio contracts are intact', () => {
    assert.match(designer, /MODULE STUDIO/);
    assert.match(designer, /Module Learning Nodes/);
    assert.match(designer, /Generate Module Structure/);
    assert.match(designer, /id="btn-generate-curriculum"/);
    assert.match(designer, /Publish Module/);
    assert.match(designer, /publishing-format-stage/);
    assert.match(designer, /Option A: Separate Modules/);
    assert.match(designer, /Option B: One Combined Module/);
    assert.match(designer, /selectedPublishingFormat/);
    assert.match(designer, /selectPublishingFormat/);
    assert.match(designer, /source-coverage-indicator/);
    assert.match(designer, /topic-group-header-divider/);
    assert.match(designer, /content-blocks-editor-card/);
    assert.match(designer, /assessment-editor-card/);
    assert.match(designer, /:disabled="isPublishing \|\| !selectedPublishingFormat \|\| !selectedPlan\.canPublish"/);
    assert.match(designer, /id="btn-approve-proposal"/);
    assert.match(designer, /Open (Course|in Module) Studio →|openStudentPreview/);
  });

  test('5g. republishing is unlocked only through an explicit staged draft', () => {
    assert.match(designer, /const hasStagedDraft = computed/, 'staged draft indicator must exist');
    assert.match(designer, /:disabled="isPublishing \|\| \(isPublished && !hasStagedDraft\)"/);
    assert.match(designer, /unpublished_draft/, 'Designer must hydrate from the staged draft');
  });

  test('5h. no student-facing surface is given the editable flag', () => {
    const app = read('frontend/resources/js/App.vue');
    assert.ok(!/editable/.test(app), 'App.vue (student workspace) must never enable inline editing');
    assert.ok(!/preview-mode/.test(app), 'App.vue must never enable preview mode');
  });
});
