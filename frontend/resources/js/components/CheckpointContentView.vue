<template>
  <div
    class="checkpoint-page-container"
    :class="{
      'is-chat-maximized': isChatMaximized,
      'checkpoint-page-container--tutor-hidden': previewMode,
      'is-resizing': Boolean(activeResize),
      'is-moving': Boolean(activeDrag),
    }"
  >
    <!-- Left Column: Header (Back, Module Tag, Title, Meta) + Star/Kebab (outside chatbox) + Lesson Lecture -->
    <div class="checkpoint-main-column">
      <header class="checkpoint-header">
        <div class="checkpoint-header-left">
          <button 
            v-if="!previewMode"
            type="button" 
            class="btn-back-nav" 
            @click="$emit('back')" 
            title="Back to Progression Map" 
            aria-label="Back to Progression Map"
            id="btn-back-to-roadmap"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>

          <div class="checkpoint-title-group">
            <span class="sub-category-tag">Module</span>
            <h1 class="checkpoint-title">{{ checkpointTitle }}</h1>
            <div class="checkpoint-meta-badge-row">
              <span class="badge-beginner">Beginner</span>
              <span class="parent-module-text">{{ parentModuleName }}</span>
            </div>
          </div>
        </div>

        <!-- Complete Checkpoint & Star/Kebab buttons -->
        <div class="checkpoint-header-actions">
          <span v-if="previewMode" class="preview-mode-pill" id="preview-mode-indicator">
            👁️ Teacher Preview — edits are not visible to students until you save
          </span>

          <button 
            v-if="!previewMode"
            type="button" 
            class="btn-complete-checkpoint-action" 
            @click="handleCompleteCheckpoint"
            title="Mark this checkpoint complete and advance progression"
            id="btn-complete-checkpoint"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>Complete Checkpoint</span>
          </button>

          <button 
            v-if="!previewMode"
            type="button" 
            class="btn-icon-control" 
            :class="{ 'is-starred': isStarred }"
            @click="toggleStar"
            :title="isStarred ? 'Remove from favorites' : 'Bookmark this path'"
            aria-label="Bookmark"
            id="btn-star-checkpoint"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" :fill="isStarred ? '#ff7a00' : 'none'" :stroke="isStarred ? '#ff7a00' : '#1f2937'" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </button>

          <div v-if="!previewMode" class="kebab-menu-wrapper" @click.stop>
            <button 
              type="button" 
              class="btn-icon-control" 
              @click.stop="isKebabOpen = !isKebabOpen"
              title="More options" 
              aria-label="More options"
              id="btn-kebab-checkpoint"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="2"/>
                <circle cx="12" cy="12" r="2"/>
                <circle cx="12" cy="19" r="2"/>
              </svg>
            </button>

            <!-- Kebab Menu Dropdown -->
            <transition name="dropdown-fade">
              <div v-if="isKebabOpen" class="checkpoint-dropdown-menu" @click.stop>
                <button type="button" class="checkpoint-dropdown-item" @click="handleAction('Share')">Share Lesson</button>
              </div>
            </transition>
          </div>
        </div>
      </header>

      <!-- When content is in preparation, display honest empty state -->
      <div v-if="!activeLessonData.hasContent" class="lesson-empty-state-card" id="lesson-empty-state-card">
        <div class="empty-state-icon">📚</div>
        <h2 class="empty-state-title">Lesson Content In Preparation</h2>
        <p class="empty-state-message">
          Lesson content is not available yet. Please check back later.
        </p>
        <button type="button" class="btn-return-roadmap" @click="$emit('back')">
          ← Return to Progression Map
        </button>
      </div>

      <!-- Educational Lesson Text & Core Concepts (When content is populated) -->
      <section v-else class="lesson-lecture-column">
        <!-- Structured Content Blocks Stream (When blocks exist) -->
        <div
          v-if="activeLessonData.blocks && activeLessonData.blocks.length > 0"
          ref="canvasRef"
          class="lesson-blocks-stream"
          :class="{
            'is-layout-canvas': layoutModeActive || hasAnyPinnedBlock(),
            'is-layout-mode': layoutModeActive,
            'is-dragging-block': Boolean(activeDrag),
          }"
          :style="canvasStyle"
        >
          <!-- Alignment guides, shown only while a block is being dragged -->
          <div v-if="activeDrag" class="layout-guides" aria-hidden="true">
            <span v-if="dragGuides.includes('center')" class="layout-guide layout-guide--center"></span>
            <span v-if="dragGuides.includes('left')" class="layout-guide layout-guide--left"></span>
            <span v-if="dragGuides.includes('right')" class="layout-guide layout-guide--right"></span>
          </div>

          <template v-for="(block, bIdx) in activeLessonData.blocks" :key="block.id || bIdx">
            <!-- Text Block -->
            <div
              v-if="block.type === 'text'"
              class="lesson-section-box block-text-box"
              :class="{
                'is-inline-editable': isEditable,
                'is-block-resizable': isBlockResizable(block),
                'is-block-selected': isBlockSelected(bIdx),
                'has-custom-size': blockHasCustomLayout(block),
                'is-block-pinned': blockIsPinned(block),
                'is-block-dragging': activeDrag && activeDrag.index === bIdx,
                'is-layout-mode': layoutModeActive && isBlockResizable(block),
              }"
              :style="blockCanvasStyle(block)"
              :data-lesson-block="isBlockResizable(block) ? bIdx : null"
              :data-lesson-block-index="isBlockResizable(block) ? bIdx : null"
              :tabindex="canMoveBlock(block) ? 0 : null"
              @click="selectBlock(bIdx, $event)"
              @keydown="onBlockKeydown($event, bIdx)"
            >
              <h3 v-if="block.title" class="block-title">{{ block.title }}</h3>

              <!-- Inline WYSIWYG editor (Mentor Module Studio preview only) -->
              <LessonRichTextInlineEditor
                v-if="activeEditTarget && activeEditTarget.kind === 'block' && activeEditTarget.index === bIdx"
                :model-value="block.content"
                @update:model-value="onInlineEditUpdate($event, 'block', bIdx)"
                @done="finishInlineEdit"
              />

              <template v-else>
                <button
                  v-if="isEditable"
                  type="button"
                  class="btn-inline-edit-hint"
                  @click.stop="startInlineEdit('block', bIdx)"
                  :title="'Click to edit this lesson text'"
                >
                  ✎ Edit text
                </button>
                <div
                  class="markdown-body block-markdown"
                  :class="{ 'inline-editable-surface': isEditable }"
                  v-html="renderLessonContent(block.content)"
                  @click="isEditable && startInlineEdit('block', bIdx)"
                ></div>
              </template>

              <!-- Phase 2: explicit drag handle (Layout Mode only) -->
              <button
                v-if="canMoveBlock(block)"
                type="button"
                class="block-drag-handle"
                title="Drag to move this block (arrow keys also move it)"
                aria-label="Move this block"
                @pointerdown.stop.prevent="startBlockDrag($event, bIdx)"
                @click.stop
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <circle cx="9" cy="6" r="1.7" /><circle cx="15" cy="6" r="1.7" />
                  <circle cx="9" cy="12" r="1.7" /><circle cx="15" cy="12" r="1.7" />
                  <circle cx="9" cy="18" r="1.7" /><circle cx="15" cy="18" r="1.7" />
                </svg>
              </button>
              <button
                v-if="canMoveBlock(block) && blockIsPinned(block)"
                type="button"
                class="block-unpin-btn"
                title="Return this block to normal document flow"
                @click.stop="unpinBlock(bIdx)"
              >
                Unpin
              </button>

              <!-- Phase 1 resize handles (dimensions only; no content change) -->
              <span
                v-if="isBlockResizable(block)"
                class="block-resize-handle block-resize-handle--e"
                role="separator"
                aria-label="Resize block width"
                title="Drag to resize width"
                @mousedown.stop.prevent="startBlockResize($event, bIdx, 'e')"
              ></span>
              <span
                v-if="isBlockResizable(block)"
                class="block-resize-handle block-resize-handle--s"
                role="separator"
                aria-label="Resize block height"
                title="Drag to resize height"
                @mousedown.stop.prevent="startBlockResize($event, bIdx, 's')"
              ></span>
              <span
                v-if="isBlockResizable(block)"
                class="block-resize-handle block-resize-handle--se"
                role="separator"
                aria-label="Resize block width and height"
                title="Drag to resize"
                @mousedown.stop.prevent="startBlockResize($event, bIdx, 'se')"
              ></span>
              <button
                v-if="isBlockResizable(block) && blockHasCustomLayout(block)"
                type="button"
                class="block-reset-size"
                title="Reset to natural size"
                @click.stop="resetBlockLayout(bIdx)"
              >
                Reset size
              </button>
            </div>

            <!-- Callout / Analogy Block -->
            <div
              v-else-if="block.type === 'callout'"
              class="lesson-section-box block-callout-card"
              :class="{
                'is-analogy': block.analogy,
                'is-inline-editable': isEditable,
                'is-block-resizable': isBlockResizable(block),
                'is-block-selected': isBlockSelected(bIdx),
                'has-custom-size': blockHasCustomLayout(block),
                'is-block-pinned': blockIsPinned(block),
                'is-block-dragging': activeDrag && activeDrag.index === bIdx,
                'is-layout-mode': layoutModeActive && isBlockResizable(block),
              }"
              :style="blockCanvasStyle(block)"
              :data-lesson-block="isBlockResizable(block) ? bIdx : null"
              :data-lesson-block-index="isBlockResizable(block) ? bIdx : null"
              :tabindex="canMoveBlock(block) ? 0 : null"
              @click="selectBlock(bIdx, $event)"
              @keydown="onBlockKeydown($event, bIdx)"
            >
              <div class="callout-header">
                <span class="callout-icon">💡</span>
                <h3 class="callout-title">{{ block.title || 'Key Principle / Analogy' }}</h3>
              </div>

              <LessonRichTextInlineEditor
                v-if="activeEditTarget && activeEditTarget.kind === 'block' && activeEditTarget.index === bIdx"
                :model-value="block.content"
                @update:model-value="onInlineEditUpdate($event, 'block', bIdx)"
                @done="finishInlineEdit"
              />

              <template v-else>
                <button
                  v-if="isEditable"
                  type="button"
                  class="btn-inline-edit-hint"
                  @click.stop="startInlineEdit('block', bIdx)"
                  title="Click to edit this callout text"
                >
                  ✎ Edit text
                </button>
                <div
                  class="callout-content"
                  :class="{ 'inline-editable-surface': isEditable }"
                  v-html="renderLessonContent(block.content)"
                  @click="isEditable && startInlineEdit('block', bIdx)"
                ></div>
              </template>

              <div v-if="block.analogy" class="analogy-takeaway-box">
                <span class="takeaway-label">Key Takeaway:</span>
                <span class="takeaway-text">{{ block.analogy }}</span>
              </div>

              <!-- Phase 2: explicit drag handle (Layout Mode only) -->
              <button
                v-if="canMoveBlock(block)"
                type="button"
                class="block-drag-handle"
                title="Drag to move this block (arrow keys also move it)"
                aria-label="Move this block"
                @pointerdown.stop.prevent="startBlockDrag($event, bIdx)"
                @click.stop
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <circle cx="9" cy="6" r="1.7" /><circle cx="15" cy="6" r="1.7" />
                  <circle cx="9" cy="12" r="1.7" /><circle cx="15" cy="12" r="1.7" />
                  <circle cx="9" cy="18" r="1.7" /><circle cx="15" cy="18" r="1.7" />
                </svg>
              </button>
              <button
                v-if="canMoveBlock(block) && blockIsPinned(block)"
                type="button"
                class="block-unpin-btn"
                title="Return this block to normal document flow"
                @click.stop="unpinBlock(bIdx)"
              >
                Unpin
              </button>

              <!-- Phase 1 resize handles (dimensions only; no content change) -->
              <span
                v-if="isBlockResizable(block)"
                class="block-resize-handle block-resize-handle--e"
                role="separator"
                aria-label="Resize block width"
                title="Drag to resize width"
                @mousedown.stop.prevent="startBlockResize($event, bIdx, 'e')"
              ></span>
              <span
                v-if="isBlockResizable(block)"
                class="block-resize-handle block-resize-handle--s"
                role="separator"
                aria-label="Resize block height"
                title="Drag to resize height"
                @mousedown.stop.prevent="startBlockResize($event, bIdx, 's')"
              ></span>
              <span
                v-if="isBlockResizable(block)"
                class="block-resize-handle block-resize-handle--se"
                role="separator"
                aria-label="Resize block width and height"
                title="Drag to resize"
                @mousedown.stop.prevent="startBlockResize($event, bIdx, 'se')"
              ></span>
              <button
                v-if="isBlockResizable(block) && blockHasCustomLayout(block)"
                type="button"
                class="block-reset-size"
                title="Reset to natural size"
                @click.stop="resetBlockLayout(bIdx)"
              >
                Reset size
              </button>
            </div>

            <!-- Code Block with Copy Action -->
            <div v-else-if="block.type === 'code'" class="lesson-section-box block-code-card">
              <div class="code-header-bar">
                <div class="code-tag-group">
                  <span class="code-lang-badge">{{ block.code_language || 'cpp' }}</span>
                  <span v-if="block.title" class="code-title-text">{{ block.title }}</span>
                </div>
                <button type="button" class="btn-copy-code" @click="copyCode(block.content, bIdx)">
                  <span v-if="codeCopiedIndex === bIdx">✓ Copied</span>
                  <span v-else>📋 Copy Code</span>
                </button>
              </div>
              <pre class="code-pre-block"><code>{{ block.content }}</code></pre>
              <p v-if="block.caption" class="code-caption-text">{{ block.caption }}</p>
            </div>

            <!-- Table Block -->
            <div v-else-if="block.type === 'table'" class="lesson-section-box block-table-card">
              <h3 v-if="block.title" class="table-title">{{ block.title }}</h3>
              <div class="markdown-body block-markdown-table" v-html="renderLessonContent(block.content)"></div>
            </div>

            <!-- Activity Block -->
            <div
              v-else-if="block.type === 'activity'"
              class="lesson-section-box block-activity-card"
              :class="{
                'is-inline-editable': isEditable,
                'is-block-resizable': isBlockResizable(block),
                'is-block-selected': isBlockSelected(bIdx),
                'has-custom-size': blockHasCustomLayout(block),
                'is-block-pinned': blockIsPinned(block),
                'is-block-dragging': activeDrag && activeDrag.index === bIdx,
                'is-layout-mode': layoutModeActive && isBlockResizable(block),
              }"
              :style="blockCanvasStyle(block)"
              :data-lesson-block="isBlockResizable(block) ? bIdx : null"
              :data-lesson-block-index="isBlockResizable(block) ? bIdx : null"
              :tabindex="canMoveBlock(block) ? 0 : null"
              @click="selectBlock(bIdx, $event)"
              @keydown="onBlockKeydown($event, bIdx)"
            >
              <div class="activity-header">
                <span class="activity-icon">🛠️</span>
                <h3 class="activity-title">{{ block.title || 'Hands-on Activity' }}</h3>
              </div>

              <LessonRichTextInlineEditor
                v-if="activeEditTarget && activeEditTarget.kind === 'block' && activeEditTarget.index === bIdx"
                :model-value="block.content"
                @update:model-value="onInlineEditUpdate($event, 'block', bIdx)"
                @done="finishInlineEdit"
              />

              <template v-else>
                <button
                  v-if="isEditable"
                  type="button"
                  class="btn-inline-edit-hint"
                  @click.stop="startInlineEdit('block', bIdx)"
                  title="Click to edit this activity text"
                >
                  ✎ Edit text
                </button>
                <div
                  class="activity-content"
                  :class="{ 'inline-editable-surface': isEditable }"
                  v-html="renderLessonContent(block.content)"
                  @click="isEditable && startInlineEdit('block', bIdx)"
                ></div>
              </template>

              <!-- Phase 2: explicit drag handle (Layout Mode only) -->
              <button
                v-if="canMoveBlock(block)"
                type="button"
                class="block-drag-handle"
                title="Drag to move this block (arrow keys also move it)"
                aria-label="Move this block"
                @pointerdown.stop.prevent="startBlockDrag($event, bIdx)"
                @click.stop
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <circle cx="9" cy="6" r="1.7" /><circle cx="15" cy="6" r="1.7" />
                  <circle cx="9" cy="12" r="1.7" /><circle cx="15" cy="12" r="1.7" />
                  <circle cx="9" cy="18" r="1.7" /><circle cx="15" cy="18" r="1.7" />
                </svg>
              </button>
              <button
                v-if="canMoveBlock(block) && blockIsPinned(block)"
                type="button"
                class="block-unpin-btn"
                title="Return this block to normal document flow"
                @click.stop="unpinBlock(bIdx)"
              >
                Unpin
              </button>

              <!-- Phase 1 resize handles (dimensions only; no content change) -->
              <span
                v-if="isBlockResizable(block)"
                class="block-resize-handle block-resize-handle--e"
                role="separator"
                aria-label="Resize block width"
                title="Drag to resize width"
                @mousedown.stop.prevent="startBlockResize($event, bIdx, 'e')"
              ></span>
              <span
                v-if="isBlockResizable(block)"
                class="block-resize-handle block-resize-handle--s"
                role="separator"
                aria-label="Resize block height"
                title="Drag to resize height"
                @mousedown.stop.prevent="startBlockResize($event, bIdx, 's')"
              ></span>
              <span
                v-if="isBlockResizable(block)"
                class="block-resize-handle block-resize-handle--se"
                role="separator"
                aria-label="Resize block width and height"
                title="Drag to resize"
                @mousedown.stop.prevent="startBlockResize($event, bIdx, 'se')"
              ></span>
              <button
                v-if="isBlockResizable(block) && blockHasCustomLayout(block)"
                type="button"
                class="block-reset-size"
                title="Reset to natural size"
                @click.stop="resetBlockLayout(bIdx)"
              >
                Reset size
              </button>
            </div>
          </template>
        </div>

        <!-- Fallback Standard 8-Section Layout (When blocks are not present) -->
        <template v-else>
          <!-- 1. Introduction & Overview -->
          <div v-if="activeLessonData.introduction" class="lesson-section-box lesson-intro-card" :class="{ 'is-inline-editable': isEditable }">
            <h2 class="section-title">Overview & Introduction</h2>

            <LessonRichTextInlineEditor
              v-if="isEditingTarget('node_content', 'introduction')"
              :model-value="nodeContentField('introduction')"
              @update:model-value="onInlineEditUpdate($event, 'node_content', null, 'introduction')"
              @done="finishInlineEdit"
            />

            <template v-else>
              <button
                v-if="isEditable"
                type="button"
                class="btn-inline-edit-hint"
                @click.stop="startInlineEdit('node_content', null, 'introduction')"
                title="Click to edit the lesson overview"
              >
                ✎ Edit text
              </button>
              <div
                class="intro-text"
                :class="{ 'inline-editable-surface': isEditable }"
                v-html="renderLessonContent(activeLessonData.introduction)"
                @click="isEditable && startInlineEdit('node_content', null, 'introduction')"
              ></div>
            </template>
          </div>

          <!-- 2. Core Lesson Guide (Rendered Rich HTML or Legacy Markdown) -->
          <div v-if="activeLessonData.coreLesson" class="lesson-section-box lesson-guide-card" :class="{ 'is-inline-editable': isEditable }">
            <h2 class="section-title">Instructional Guide</h2>

            <LessonRichTextInlineEditor
              v-if="isEditingTarget('node_content', 'core_lesson')"
              :model-value="nodeContentField('core_lesson')"
              @update:model-value="onInlineEditUpdate($event, 'node_content', null, 'core_lesson')"
              @done="finishInlineEdit"
            />

            <template v-else>
              <button
                v-if="isEditable"
                type="button"
                class="btn-inline-edit-hint"
                @click.stop="startInlineEdit('node_content', null, 'core_lesson')"
                title="Click to edit the instructional guide"
              >
                ✎ Edit text
              </button>
              <div
                class="markdown-body lesson-markdown-content"
                :class="{ 'inline-editable-surface': isEditable }"
                v-html="renderLessonContent(activeLessonData.coreLesson)"
                @click="isEditable && startInlineEdit('node_content', null, 'core_lesson')"
              ></div>
            </template>
          </div>

          <!-- 3. Core Concepts -->
          <div v-if="activeLessonData.concepts && activeLessonData.concepts.length > 0" class="lesson-section-box concepts-section">
            <h2 class="concepts-heading">Explore The Core Concepts</h2>
            <article 
              v-for="(concept, cIdx) in activeLessonData.concepts" 
              :key="cIdx" 
              class="concept-block"
            >
              <h3 class="concept-title dashed-underline">{{ concept.title }}</h3>
              <p v-if="concept.text" class="concept-text">{{ concept.text }}</p>
              <p v-if="concept.example" class="concept-example">
                <strong>Example:</strong> {{ concept.example }}
              </p>
              <p v-if="concept.keyIdea" class="concept-key-idea">
                <strong>Key idea:</strong> {{ concept.keyIdea }}
              </p>
            </article>
          </div>

          <!-- 4. Practical Demonstrations & Examples -->
          <div v-if="activeLessonData.examples && activeLessonData.examples.length > 0" class="lesson-section-box examples-section">
            <h2 class="section-title">Demonstrations & Real-World Examples</h2>
            <ul class="examples-list">
              <li v-for="(ex, exIdx) in activeLessonData.examples" :key="exIdx">
                {{ ex }}
              </li>
            </ul>
          </div>

          <!-- 5. Guided Activities -->
          <div v-if="activeLessonData.activities && activeLessonData.activities.length > 0" class="lesson-section-box activities-section">
            <h2 class="section-title">Guided Practice & Laboratory Activities</h2>
            <div v-for="(act, actIdx) in activeLessonData.activities" :key="actIdx" class="activity-card">
              <span class="activity-num">Activity {{ actIdx + 1 }}:</span>
              <p class="activity-text">{{ act }}</p>
            </div>
          </div>

          <!-- 6. Engineering Challenges & Troubleshooting -->
          <div v-if="activeLessonData.challenges && activeLessonData.challenges.length > 0" class="lesson-section-box challenges-section">
            <h2 class="section-title">Engineering Challenges & Diagnostics</h2>
            <div v-for="(ch, chIdx) in activeLessonData.challenges" :key="chIdx" class="challenge-card">
              <span class="challenge-badge">Challenge {{ chIdx + 1 }}</span>
              <p class="challenge-text">{{ ch }}</p>
            </div>
          </div>

          <!-- 7. Assessment Questions & Interactive Quiz -->
          <div v-if="activeLessonData.quiz && activeLessonData.quiz.length > 0" class="lesson-section-box assessment-section">
            <h2 class="section-title">Formative Assessment Questions</h2>
            <div v-for="(q, qIdx) in activeLessonData.quiz" :key="qIdx" class="quiz-question-box">
              <h4 class="question-title">Question {{ qIdx + 1 }}: {{ q.question }}</h4>
              <div class="question-options">
                <div v-for="(opt, oIdx) in (q.options || [])" :key="oIdx" class="opt-item">
                  <span class="opt-prefix">{{ String.fromCharCode(65 + oIdx) }}.</span>
                  <span class="opt-content">{{ opt }}</span>
                </div>
              </div>
              <div v-if="q.explanation" class="question-explanation">
                <strong>Answer & Rationale:</strong> {{ q.correct_answer ? `(${q.correct_answer}) ` : '' }}{{ q.explanation }}
              </div>
            </div>
          </div>
        </template>

        <!-- Interactive End-of-Topic Assessment (When configured) -->
        <div v-if="activeLessonData.assessment && activeLessonData.assessment.questions && activeLessonData.assessment.questions.length > 0" class="lesson-section-box interactive-assessment-section" id="topic-assessment-section">
          <div class="assessment-section-header">
            <span class="assessment-icon">🎯</span>
            <div>
              <h2 class="section-title">End-of-Topic Assessment & Mastery Check</h2>
              <p class="section-subtitle">Answer the checkpoint question correctly to complete this topic and unlock sequential progression.</p>
            </div>
          </div>

          <div v-for="(q, qIdx) in activeLessonData.assessment.questions" :key="q.id || qIdx" class="assessment-question-card">
            <h4 class="question-header">Question {{ qIdx + 1 }}: {{ q.question }}</h4>

            <!-- Multiple Choice Options -->
            <div v-if="q.type === 'multiple_choice' && q.options" class="mcq-options-grid">
              <button 
                v-for="(opt, optIdx) in q.options" 
                :key="optIdx"
                type="button" 
                class="mcq-option-btn" 
                :class="{ 
                  'is-selected': selectedAssessmentAnswer[q.id] === opt.slice(0, 1),
                  'is-correct': isAssessmentSubmitted && assessmentResults[q.id]?.passed && selectedAssessmentAnswer[q.id] === opt.slice(0, 1),
                  'is-incorrect': isAssessmentSubmitted && !assessmentResults[q.id]?.passed && selectedAssessmentAnswer[q.id] === opt.slice(0, 1)
                }"
                @click="handleSelectOption(q.id, opt.slice(0, 1))"
              >
                <span class="opt-key">{{ opt.slice(0, 2) }}</span>
                <span class="opt-label">{{ opt.slice(3) }}</span>
              </button>
            </div>

            <!-- Fill in the blanks -->
            <div v-else-if="q.type === 'fill_in_the_blanks'" class="fib-input-wrap">
              <input 
                type="text" 
                v-model="selectedAssessmentAnswer[q.id]" 
                class="assessment-text-input" 
                placeholder="Type your answer here..."
              />
            </div>

            <!-- Short answer -->
            <div v-else-if="q.type === 'short_answer'" class="sa-input-wrap">
              <textarea 
                rows="3" 
                v-model="selectedAssessmentAnswer[q.id]" 
                class="assessment-textarea" 
                placeholder="Explain in your own words..."
              ></textarea>
            </div>

            <!-- Evaluation Feedback Result -->
            <div v-if="isAssessmentSubmitted && assessmentResults[q.id]" class="assessment-feedback-alert" :class="assessmentResults[q.id].passed ? 'alert-success' : 'alert-danger'">
              <div class="feedback-badge-row">
                <span class="feedback-status-pill">{{ assessmentResults[q.id].passed ? '✓ Passed (Score: 100%)' : '✗ Needs Revision' }}</span>
              </div>
              <p class="feedback-text">{{ assessmentResults[q.id].feedback }}</p>
            </div>
          </div>

          <div class="assessment-actions-bar">
            <button 
              type="button" 
              class="btn-submit-assessment" 
              @click="submitAssessment"
              id="btn-submit-topic-assessment"
            >
              {{ isAssessmentPassed ? '✓ Assessment Satisfied' : 'Submit Answers & Verify Mastery' }}
            </button>
          </div>
        </div>

        <!-- 8. Grounding Disclosure & References -->
        <footer v-if="activeLessonData.groundingDisclosure || activeLessonData.references" class="lesson-footer-citations">
          <p v-if="activeLessonData.groundingDisclosure" class="grounding-text">
            <strong>Source Citation:</strong> {{ activeLessonData.groundingDisclosure }}
          </p>
        </footer>
      </section>
    </div>

    <!-- Right: Stretched Risse AI Chatbot Side Box (Top aligned with Module text) -->
    <!-- Teacher Preview removes the tutor entirely so the lesson owns the width. -->
    <aside
      v-if="!previewMode"
      class="chatbot-panel-card" 
      :class="{ 'chatbot-panel-card--maximized': isChatMaximized }"
      aria-label="Risse AI Chat Assistant"
    >
      <div class="chatbot-header-controls">
        <div class="ai-mode-toggle-group" role="group" aria-label="AI Mode Switcher">
          <button 
            type="button" 
            class="ai-mode-pill-btn" 
            :class="{ 'is-active': aiMode === 'socratic' }"
            @click="setAiMode('socratic')"
            title="Socratic Teaching Mode: Guided inquiry, hints, and conceptual understanding"
            id="btn-mode-socratic"
          >
            <span class="ai-mode-icon">🎓</span>
            <span class="ai-mode-text">Socratic</span>
          </button>
          <button 
            type="button" 
            class="ai-mode-pill-btn is-competition" 
            :class="{ 'is-active': aiMode === 'competition' }"
            @click="setAiMode('competition')"
            title="Competition Mode: Direct tournament tactics, fast pit debugging & instant solutions"
            id="btn-mode-competition"
          >
            <span class="ai-mode-icon">⚡</span>
            <span class="ai-mode-text">Competition</span>
          </button>
        </div>
        <button 
          type="button" 
          class="btn-expand-chat" 
          :title="isChatMaximized ? 'Restore normal view' : 'Maximize AI'" 
          :aria-label="isChatMaximized ? 'Restore normal view' : 'Maximize AI'"
          @click="isChatMaximized = !isChatMaximized"
        >
          <svg v-if="!isChatMaximized" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 3h6v6"/>
            <path d="M9 21H3v-6"/>
            <path d="M21 3l-7 7"/>
            <path d="M3 21l7-7"/>
          </svg>
          <svg v-else width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 14h6v6"/>
            <path d="M20 10h-6V4"/>
            <path d="M14 10l7-7"/>
            <path d="M3 21l7-7"/>
          </svg>
        </button>
      </div>

      <!-- Chat Conversation Messages Flow -->
      <div class="chatbot-messages-scroll" ref="chatMessagesContainer">
        <!-- Dynamic Initial AI Tutor Greeting based on current topic (Separated from lesson text) -->
        <div class="message-bubble ai-message initial-tutor-greeting">
          <p class="ai-greeting">{{ initialTutorGreeting }}</p>

          <!-- Message Action Toolbar -->
          <div class="message-actions-toolbar">
            <button type="button" class="btn-msg-tool" title="Copy Greeting" @click="copyPrompt">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Interactive User & Assistant Messages -->
        <div 
          v-for="(msg, idx) in chatHistory" 
          :key="idx" 
          class="message-bubble" 
          :class="msg.sender === 'user' ? 'user-message' : 'ai-message'"
        >
          <div v-if="msg.sender === 'ai' && msg.isStreaming && !msg.text" class="typing-indicator" aria-label="Risse is thinking">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
          </div>
          <p v-else class="bubble-text" v-html="formatMessageText(msg.text)"></p>

          <!-- Action Toolbar for AI responses -->
          <div v-if="msg.sender === 'ai' && !msg.isStreaming && msg.text" class="message-actions-toolbar">
            <button type="button" class="btn-msg-tool" title="Copy Message" @click="copyText(msg.text)">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
              </svg>
            </button>
            <button type="button" class="btn-msg-tool" title="Bookmark Insight" @click="bookmarkInsight(msg.text)">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Bottom Chat Input Area matching screenshot -->
      <form class="chatbot-input-box" @submit.prevent="sendMessage">
        <textarea 
          ref="chatInputTextarea"
          v-model="userQuery" 
          :disabled="isStreaming"
          :placeholder="previewMode ? 'AI Tutor is disabled in Teacher Preview' : 'Ask Risse...'" 
          class="chat-text-input chat-text-textarea" 
          id="chat-input-query"
          rows="1"
          @input="autoGrowInput"
          @keydown.enter.exact.prevent="sendMessage"
        ></textarea>

        <div class="chat-input-actions">
          <!-- Attachment Paperclip -->
          <button type="button" class="btn-attach" title="Attach file or schematic" aria-label="Attach file">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
            </svg>
          </button>

          <!-- Send Action Plane -->
          <button 
            type="submit" 
            class="btn-send" 
            :class="{ 'is-disabled': isStreaming || !userQuery.trim() }"
            :disabled="isStreaming || !userQuery.trim()" 
            title="Send query" 
            aria-label="Send query"
          >
            <svg v-if="!isStreaming" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            <span v-else class="send-spinner"></span>
          </button>
        </div>
      </form>
    </aside>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted, onBeforeUnmount } from 'vue';
import axios from 'axios';
import { useAuthStore } from '../stores/authStore.js';
import { StudentSyncService } from '../../../lib/student/studentSyncService.ts';
import { ROBOTICS_AUTHENTIC_TOPICS, evaluateAssessmentAnswer } from '../../../lib/mentor/sourceFaithfulCurriculum.ts';
import { renderLessonRichHtml, sanitizeLessonHtml } from '../../../lib/mentor/richLessonContent.ts';
import {
  isResizableBlockType,
  readBlockLayout,
  blockLayoutStyle,
  applyBlockLayout,
  readBlockPosition,
  isBlockPinned,
  blockPositionStyle,
  snapToGrid,
  clampOffset,
  MIN_BLOCK_WIDTH,
  MIN_BLOCK_HEIGHT,
  DRAG_START_THRESHOLD,
  CANVAS_BOTTOM_PADDING,
  NUDGE_STEP,
  NUDGE_STEP_LARGE,
} from '../../../lib/mentor/lessonBlockLayout.ts';
import LessonRichTextInlineEditor from './mentor/LessonRichTextInlineEditor.vue';

const authStore = useAuthStore();

const props = defineProps({
  checkpointTitle: {
    type: String,
    default: 'Inputs, Output, and Signals',
  },
  parentModuleName: {
    type: String,
    default: 'Robotics Fundamentals',
  },
  moduleData: {
    type: Object,
    default: () => ({}),
  },
  checkpointData: {
    type: Object,
    default: () => null,
  },
  /**
   * Mentor Module Studio inline editing. When true, lesson prose becomes
   * click-to-edit with the Word-style compact formatting toolbar.
   * Student workspaces never set this prop.
   */
  editable: {
    type: Boolean,
    default: false,
  },
  /**
   * Teacher preview mode. Suppresses student progress, mastery, checkpoint
   * completion, star and enrollment side effects while editing in preview.
   */
  previewMode: {
    type: Boolean,
    default: false,
  },
  /**
   * Phase 2: Layout Mode. When true the teacher can drag blocks by their
   * handles and sees boundaries/selection chrome. Students never receive it.
   */
  layoutMode: {
    type: Boolean,
    default: false,
  },
  /** Phase 2: snap dragged positions to the layout grid. */
  snapToGrid: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  'back',
  'notify',
  'complete-checkpoint',
  'update-lesson-content',
  // Phase 1: resizable lesson containers (dimensions only, never content).
  'update-block-layout',
]);

const userQuery = ref('');
const chatInputTextarea = ref(null);
const chatHistory = ref([]);
const isStreaming = ref(false);
const chatMessagesContainer = ref(null);
const isStarred = ref(false);
const isChatMaximized = ref(false);
const isKebabOpen = ref(false);

// Interactive End-of-Topic Assessment state
const selectedAssessmentAnswer = ref({});
const assessmentResults = ref({});
const isAssessmentSubmitted = ref(false);
const isAssessmentPassed = ref(false);
const codeCopiedIndex = ref(null);

// ── Mentor inline rich-text editing (Module Studio Student Preview only) ──
const isEditable = computed(() => Boolean(props.editable));
const activeEditTarget = ref(null); // { kind: 'block' | 'node_content', index: number|null, field?: string }

function isEditingTarget(kind, field, index = null) {
  const target = activeEditTarget.value;
  if (!target) return false;
  if (target.kind !== kind) return false;
  if (kind === 'block') return target.index === index;
  return target.field === field;
}

// ── Phase 1: resizable lesson containers ───────────────────────────────────
// Layout (size) is handled here; content stays with the rich-text editor. A
// resize emits dimensions only, so it can never touch prose or formatting.

/** Index of the currently selected block (or null). Preview/edit mode only. */
const selectedBlockIndex = ref(null);
/** The exact array the template renders, so index lookups always resolve. */
const currentBlocks = computed(() => activeLessonData.value?.blocks || []);
/** Live drag state: { index, edge, startX, startY, startW, startH }. */
const activeResize = ref(null);

const canResizeBlocks = computed(() => Boolean(props.editable && props.previewMode));

function isBlockSelected(index) {
  return selectedBlockIndex.value === index;
}

function isBlockResizable(block) {
  return canResizeBlocks.value && isResizableBlockType(block?.type);
}

/** Inline style for a resizable block; empty when it has no stored layout. */
function blockResizeStyle(block) {
  if (!canResizeBlocks.value || !isResizableBlockType(block?.type)) return {};
  return blockLayoutStyle(block);
}

function blockHasCustomLayout(block) {
  const { width, height } = readBlockLayout(block);
  return width != null || height != null;
}

function selectBlock(index, event) {
  if (!canResizeBlocks.value) return;
  if (event?.target?.closest?.('.btn-inline-edit-hint')) return;
  selectedBlockIndex.value = index;
}

/**
 * Starts a resize gesture. `edge` is 'e' (width), 's' (height) or 'se' (both).
 * The workspace is the measuring context, so a block can never be dragged wider
 * than the space actually available to it.
 */
function startBlockResize(event, index, edge) {
  if (!canResizeBlocks.value) return;
  if (event.button != null && event.button !== 0) return;
  const el = event.currentTarget?.closest?.('[data-lesson-block]');
  if (!el) return;

  event.preventDefault();
  event.stopPropagation();

  const block = currentBlocks.value[index];
  const rect = el.getBoundingClientRect();
  activeResize.value = {
    index,
    block,
    edge,
    startX: event.clientX,
    startY: event.clientY,
    startW: rect.width,
    startH: rect.height,
  };
  selectedBlockIndex.value = index;

  window.addEventListener('mousemove', onBlockResizeMove);
  window.addEventListener('mouseup', endBlockResize);
}

function onBlockResizeMove(event) {
  const drag = activeResize.value;
  if (!drag) return;

  const el = document.querySelector(`[data-lesson-block-index="${drag.index}"]`);
  const container = el?.closest('.lesson-blocks-stream');
  const available = container ? container.getBoundingClientRect().width : Infinity;

  const wantsWidth = drag.edge === 'e' || drag.edge === 'se';
  const wantsHeight = drag.edge === 's' || drag.edge === 'se';

  const next = {};
  if (wantsWidth) {
    const proposed = drag.startW + (event.clientX - drag.startX);
    // A pinned block also has to fit between its own left edge and the canvas
    // edge, otherwise widening it would push it out of the workspace.
    let room = available;
    const pinned = readBlockPosition(drag.block);
    if (pinned && el) {
      const canvasRect = el.closest('.lesson-blocks-stream')?.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      if (canvasRect) room = available - (elRect.left - canvasRect.left);
    }
    // Never exceed the workspace: the document must not scroll sideways.
    next.width = Math.max(MIN_BLOCK_WIDTH, Math.min(proposed, Math.max(MIN_BLOCK_WIDTH, room)));
  }
  if (wantsHeight) {
    const proposed = drag.startH + (event.clientY - drag.startY);
    next.height = Math.max(MIN_BLOCK_HEIGHT, proposed);
  }

  drag.pending = next;
  // Apply live for immediate feedback (no persistence happens here).
  if (el) {
    if (next.width != null) {
      el.style.maxWidth = `${Math.round(next.width)}px`;
      // A pinned (absolutely positioned) block has an explicit `width`, so
      // maxWidth alone would not visibly resize it.
      if (readBlockPosition(drag.block)) el.style.width = `${Math.round(next.width)}px`;
    }
    if (next.height != null) el.style.height = `${Math.round(next.height)}px`;
  }
}

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onBlockResizeMove);
  window.removeEventListener('mouseup', endBlockResize);
});

function endBlockResize() {
  const drag = activeResize.value;
  window.removeEventListener('mousemove', onBlockResizeMove);
  window.removeEventListener('mouseup', endBlockResize);
  activeResize.value = null;
  if (!drag?.pending) return;

  const block = currentBlocks.value[drag.index];
  if (!isResizableBlockType(block?.type)) return;

  // Dimensions not touched by this gesture keep whatever the block already had,
  // and any position is carried through untouched by applyBlockLayout.
  const current = readBlockLayout(block);
  const dims = {
    width: drag.pending.width != null ? Math.round(drag.pending.width) : current.width,
    height: drag.pending.height != null ? Math.round(drag.pending.height) : current.height,
  };

  const nextBlock = applyBlockLayout(block, dims);

  // Re-align the live drag styles with what was actually committed, so the DOM
  // and the stored metadata can never disagree if Vue has nothing to patch.
  const el = document.querySelector(`[data-lesson-block-index="${drag.index}"]`);
  if (el) {
    const finalStyle = readBlockPosition(nextBlock)
      ? blockPositionStyle(nextBlock)
      : blockLayoutStyle(nextBlock);
    el.style.maxWidth = finalStyle.maxWidth || '';
    el.style.height = finalStyle.height || '';
    if (finalStyle.width) el.style.width = finalStyle.width;
  }

  // Size only — position and content are untouched.
  emitBlockLayout(drag.index, readBlockLayout(nextBlock));
}

// ── Phase 2: Layout Mode & free positioning ────────────────────────────────
// Position is layout metadata only. Dragging writes `metadata.layout.{x,y}`
// and never touches content, so prose, lists, images and source references are
// structurally incapable of being rewritten by a move.

/** Layout Mode gate. Owned by the editor, mirrored here for rendering. */
const layoutModeActive = computed(() => canResizeBlocks.value && Boolean(props.layoutMode));
const snapToGridEnabled = computed(() => Boolean(props.snapToGrid));

/** The block currently being dragged: pointer bookkeeping + live offsets. */
const activeDrag = ref(null);
/** Alignment guides shown while dragging: 'left' | 'center' | 'right' | 'top'. */
const dragGuides = ref([]);

const canvasRef = ref(null);

/** The canvas element that pinned blocks are positioned against. */
function canvasEl() {
  return canvasRef.value || null;
}

function canMoveBlock(block) {
  return layoutModeActive.value && isResizableBlockType(block?.type);
}

/** Style for a block: positioning when pinned, sizing otherwise. */
function blockCanvasStyle(block) {
  if (!canResizeBlocks.value) return {};
  if (!isResizableBlockType(block?.type)) return {};
  const position = readBlockPosition(block);
  if (position) return blockPositionStyle(block);
  return blockLayoutStyle(block);
}

function blockIsPinned(block) {
  return canResizeBlocks.value && isResizableBlockType(block?.type) && isBlockPinned(block);
}

/**
 * Starts a move. Deliberately bound to an explicit drag handle, never to the
 * block body, so selecting text can not start a drag.
 */
function startBlockDrag(event, index) {
  if (!canMoveBlock(currentBlocks.value[index])) return;
  if (event.button != null && event.button !== 0) return;

  event.preventDefault();
  event.stopPropagation();

  const blockEl = event.currentTarget?.closest?.('[data-lesson-block]');
  const canvas = canvasEl();
  if (!blockEl || !canvas) return;

  const blockRect = blockEl.getBoundingClientRect();
  const canvasRect = canvas.getBoundingClientRect();
  const block = currentBlocks.value[index];
  const position = readBlockPosition(block);

  selectedBlockIndex.value = index;
  document.body.classList.add('risse-is-dragging');

  activeDrag.value = {
    index,
    block,
    // Where the block sits now, in canvas pixels.
    originLeft: blockRect.left - canvasRect.left,
    originTop: blockRect.top - canvasRect.top,
    // Pointer offset inside the block, so it does not jump on grab.
    grabX: event.clientX - blockRect.left,
    grabY: event.clientY - blockRect.top,
    startClientX: event.clientX,
    startClientY: event.clientY,
    width: blockRect.width,
    height: blockRect.height,
    canvasWidth: canvasRect.width,
    canvasHeight: canvasRect.height,
    wasPinned: Boolean(position),
    moved: false,
  };

  // Dragging an in-flow block pins it immediately at its current spot, so the
  // pointer and the block stay aligned from the first pixel of movement.
  if (!position) {
    const x = (activeDrag.value.originLeft / canvasRect.width) * 100;
    const y = activeDrag.value.originTop;
    emitBlockLayout(index, {
      ...readBlockLayout(block),
      x: Math.round(x * 10) / 10,
      y: Math.round(y),
      ...(readBlockLayout(block).width == null ? { width: Math.round(blockRect.width) } : {}),
    });
  }

  window.addEventListener('pointermove', onBlockDragMove);
  window.addEventListener('pointerup', endBlockDrag);
  window.addEventListener('pointercancel', endBlockDrag);
}

function onBlockDragMove(event) {
  const drag = activeDrag.value;
  if (!drag) return;

  const dx = event.clientX - drag.startClientX;
  const dy = event.clientY - drag.startClientY;

  if (!drag.moved && Math.hypot(dx, dy) < DRAG_START_THRESHOLD) return;
  drag.moved = true;

  let left = drag.originLeft + dx;
  let top = drag.originTop + dy;

  // ── canvas bounds: the block can never leave the visible workspace ──
  left = clampOffset(left, drag.width, drag.canvasWidth);
  top = Math.max(0, top);

  // ── alignment guides against the canvas edges and centre ──
  const guides = [];
  const centre = drag.canvasWidth / 2;
  const blockCentre = left + drag.width / 2;
  if (Math.abs(blockCentre - centre) < 6) {
    left = centre - drag.width / 2;
    guides.push('center');
  }
  if (left < 6) {
    left = 0;
    guides.push('left');
  }
  if (Math.abs(left + drag.width - drag.canvasWidth) < 6) {
    left = drag.canvasWidth - drag.width;
    guides.push('right');
  }

  if (snapToGridEnabled.value) {
    left = clampOffset(snapToGrid(left), drag.width, drag.canvasWidth);
    top = snapToGrid(top);
  }

  dragGuides.value = guides;
  drag.pendingLeft = left;
  drag.pendingTop = top;

  // Paint the block at the dragged position immediately (no persistence here).
  const el = document.querySelector(`[data-lesson-block-index="${drag.index}"]`);
  if (el) {
    el.style.left = `${Math.round(left)}px`;
    el.style.top = `${Math.round(top)}px`;
  }
}

function endBlockDrag(event) {
  const drag = activeDrag.value;
  window.removeEventListener('pointermove', onBlockDragMove);
  window.removeEventListener('pointerup', endBlockDrag);
  window.removeEventListener('pointercancel', endBlockDrag);
  document.body.classList.remove('risse-is-dragging');
  dragGuides.value = [];
  activeDrag.value = null;

  if (!drag) return;

  // A click on the handle without movement is a selection, not a move.
  if (!drag.moved) return;

  const left = drag.pendingLeft ?? drag.originLeft;
  const top = drag.pendingTop ?? drag.originTop;

  const block = currentBlocks.value[drag.index];
  const existing = readBlockLayout(block);

  // x is stored as a percentage of canvas width so the arrangement survives
  // sidebar collapse and window resizes; y stays in document pixels.
  emitBlockLayout(drag.index, {
    ...existing,
    x: drag.canvasWidth > 0 ? Math.round((left / drag.canvasWidth) * 1000) / 10 : 0,
    y: Math.max(0, Math.round(top)),
    ...(existing.width == null ? { width: Math.round(drag.width) } : {}),
  });
  // No cleanup needed: :style re-renders from the committed metadata. Clearing
  // the inline left/top here first would flash the block back to its old spot.
  if (event?.preventDefault) event.preventDefault();
}

/** Releases a block back into normal document flow. */
function unpinBlock(index) {
  const block = currentBlocks.value[index];
  if (!canMoveBlock(block)) return;
  // Keep the block's size, drop only its x/y (applyBlockLayout leaves position
  // alone, so pass the size fields through explicitly).
  const { width, height } = readBlockLayout(block);
  emitBlockLayout(index, { width, height });
}

/** Single place where a layout payload is emitted, always dimensions+position. */
function emitBlockLayout(index, layout) {
  emit('update-block-layout', {
    kind: 'block',
    index,
    checkpointId: props.checkpointData?.id ?? null,
    layout,
  });
}

/** Keyboard movement: arrows move, Shift+arrows move further, Escape cancels. */
function onBlockKeydown(event, index) {
  if (!canMoveBlock(currentBlocks.value[index])) return;
  if (!isBlockSelected(index)) return;

  const block = currentBlocks.value[index];
  const position = readBlockPosition(block);
  const canvas = canvasEl();
  if (!canvas) return;

  if (event.key === 'Escape') {
    selectedBlockIndex.value = null;
    return;
  }

  if (event.key === 'Backspace' || event.key === 'Delete') {
    if (position) {
      event.preventDefault();
      unpinBlock(index);
    }
    return;
  }

  const step = event.shiftKey ? NUDGE_STEP_LARGE : NUDGE_STEP;
  const deltas = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
  const delta = deltas[event.key];
  if (!delta) return;

  event.preventDefault();

  const canvasRect = canvas.getBoundingClientRect();
  if (!position) {
    // First nudge also pins the block where it currently sits.
    const el = document.querySelector(`[data-lesson-block-index="${index}"]`);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const left = rect.left - canvasRect.left;
    const top = rect.top - canvasRect.top;
    emitBlockLayout(index, {
      ...readBlockLayout(block),
      x: Math.round((left / canvasRect.width) * 1000) / 10,
      y: Math.round(top),
      ...(readBlockLayout(block).width == null ? { width: Math.round(rect.width) } : {}),
    });
    return;
  }

  const px = (position.x / 100) * canvasRect.width;
  const width = blockWidthOf(index) ?? readBlockLayout(block).width ?? MIN_BLOCK_WIDTH;
  const nextLeft = clampOffset(px + delta[0], width, canvasRect.width);
  const nextTop = Math.max(0, position.y + delta[1]);

  emitBlockLayout(index, {
    ...readBlockLayout(block),
    x: Math.round((nextLeft / canvasRect.width) * 1000) / 10,
    y: Math.round(nextTop),
  });
}

/** Measured width of a rendered block, used to bound keyboard nudges. */
function blockWidthOf(index) {
  const el = document.querySelector(`[data-lesson-block-index="${index}"]`);
  return el ? el.getBoundingClientRect().width : null;
}

/**
 * Canvas height: the furthest pinned block bottom plus breathing room, so a
 * block dropped low is never clipped and the page simply grows.
 *
 * Measured into a ref rather than computed, because the answer depends on the
 * rendered height of each pinned block (which a computed property cannot track).
 */
const canvasMinHeight = ref(0);

function recomputeCanvasHeight() {
  const canvas = canvasEl();
  if (!canvas || !canResizeBlocks.value) {
    canvasMinHeight.value = 0;
    return;
  }

  const canvasRect = canvas.getBoundingClientRect();
  let lowest = 0;

  currentBlocks.value.forEach(block => {
    if (!isBlockPinned(block)) return;
    const el = canvas.querySelector(`[data-lesson-block-index="${currentBlocks.value.indexOf(block)}"]`);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // Position relative to the canvas, not the viewport.
    lowest = Math.max(lowest, rect.bottom - canvasRect.top);
  });

  canvasMinHeight.value = lowest > 0 ? Math.round(lowest + CANVAS_BOTTOM_PADDING) : 0;
}

const canvasStyle = computed(() => {
  if (!canResizeBlocks.value || canvasMinHeight.value <= 0) return {};
  // A minimum only: in-flow siblings keep contributing their own height, so
  // nothing is ever cropped and the canvas simply grows downward.
  return { minHeight: `${canvasMinHeight.value}px` };
});

// Re-measure when the arrangement changes. Registered in onMounted rather than
// at the top level: a watcher getter is evaluated immediately, and `currentBlocks`
// reads `activeLessonData`, which is declared further down this file. Touching it
// during setup threw a ReferenceError and left the whole lesson blank.
onMounted(() => {
  nextTick(recomputeCanvasHeight);
  window.addEventListener('resize', recomputeCanvasHeight);
  watch(
    () => currentBlocks.value.map(b => JSON.stringify(b?.metadata?.layout || null)).join('|'),
    () => nextTick(recomputeCanvasHeight)
  );
  watch(() => activeDrag.value, () => nextTick(recomputeCanvasHeight));
});
onBeforeUnmount(() => {
  window.removeEventListener('resize', recomputeCanvasHeight);
});

function hasAnyPinnedBlock() {
  return canResizeBlocks.value && currentBlocks.value.some(b => isBlockPinned(b) && isResizableBlockType(b.type));
}

/** Clears a custom size, returning the block to natural flow dimensions. */
function resetBlockLayout(index) {
  const block = currentBlocks.value[index];
  if (!block || !isResizableBlockType(block.type)) return;
  // Clearing the size must not move the block: any pinned position survives.
  const cleared = applyBlockLayout(block, { width: null, height: null });
  emitBlockLayout(index, readBlockLayout(cleared));
}

function startInlineEdit(kind, index = null, field = null) {
  if (!isEditable.value) return;
  // Layout Mode is for arranging, not typing: a click on a block selects it
  // instead of opening the rich-text editor, so dragging and editing never
  // compete for the same gesture. Turning Layout Mode off restores editing.
  if (layoutModeActive.value) {
    if (index != null) selectedBlockIndex.value = index;
    return;
  }
  activeEditTarget.value = { kind, index, field };
}

function finishInlineEdit() {
  activeEditTarget.value = null;
}

/**
 * Resolves the resolved lesson text backing an inline-editable 8-section
 * section (node_content may live on a sibling checkpoint record).
 */
function nodeContentField(field) {
  const data = activeLessonData.value;
  if (field === 'core_lesson') return data.coreLesson || '';
  if (field === 'introduction') return data.introduction || '';
  return '';
}

/**
 * Emits buffered (never directly persisted) lesson content updates to the
 * Module Studio preview. The parent stores them in its preview draft only.
 */
function onInlineEditUpdate(html, kind, index = null, field = null) {
  const cleanHtml = sanitizeLessonHtml(html || '');
  emit('update-lesson-content', {
    kind,
    index,
    field,
    checkpointId: props.checkpointData?.id ?? null,
    content: cleanHtml,
    format: 'html',
  });
}

/**
 * Renders lesson prose safely: rich HTML from the Word-style editor, or legacy
 * Markdown promoted to the same semantic markup so styling stays identical.
 */
function renderLessonContent(text) {
  return renderLessonRichHtml(text);
}

function copyCode(code, idx) {
  if (navigator?.clipboard) {
    navigator.clipboard.writeText(code);
    codeCopiedIndex.value = idx;
    setTimeout(() => {
      codeCopiedIndex.value = null;
    }, 2000);
  }
}

function handleSelectOption(qId, optionPrefix) {
  selectedAssessmentAnswer.value[qId] = optionPrefix;
}

function submitAssessment() {
  const assessment = activeLessonData.value.assessment;
  if (!assessment || !assessment.questions || assessment.questions.length === 0) return;

  let allPassed = true;
  const results = {};

  for (const q of assessment.questions) {
    const studentAns = selectedAssessmentAnswer.value[q.id] || '';
    const evalRes = evaluateAssessmentAnswer(q, studentAns);
    results[q.id] = evalRes;
    if (!evalRes.passed) {
      allPassed = false;
    }
  }

  assessmentResults.value = results;
  isAssessmentSubmitted.value = true;
  isAssessmentPassed.value = allPassed;

  if (props.previewMode) {
    // Local feedback only: preview never records mastery or checkpoint completion.
    emit('notify', allPassed ? 'Preview result: answers correct (nothing was recorded).' : 'Preview result: review the feedback above (nothing was recorded).');
    return;
  }

  if (allPassed) {
    emit('notify', 'Assessment passed! You have satisfied the completion requirement for this topic.');
  } else {
    emit('notify', 'Review feedback and try again to satisfy the topic requirement.');
  }
}

function getActiveEmail() {
  try {
    const activeId = localStorage.getItem('risse_active_user_id');
    if (activeId) {
      const rawAccounts = localStorage.getItem('risse_registered_accounts');
      if (rawAccounts) {
        const accounts = JSON.parse(rawAccounts);
        const user = accounts.find(a => a.id === activeId);
        if (user && user.email) return user.email.toLowerCase().trim();
      }
    }
  } catch (e) {}
  return '';
}

function getStoredAiMode() {
  try {
    const email = getActiveEmail();
    const key = email ? `risse_email_${email.replace(/[^a-z0-9]/g, '_')}_ai_mode` : 'risse_ai_mode';
    return localStorage.getItem(key) || 'socratic';
  } catch (_) {
    return 'socratic';
  }
}

const aiMode = ref(getStoredAiMode());

function setAiMode(mode) {
  aiMode.value = mode;
  try {
    const email = getActiveEmail();
    const key = email ? `risse_email_${email.replace(/[^a-z0-9]/g, '_')}_ai_mode` : 'risse_ai_mode';
    localStorage.setItem(key, mode);
  } catch (_) {}
  emit('notify', mode === 'competition' ? '⚡ Competition Mode Activated — Rapid pit tactics & tournament answers!' : '🎓 Socratic Mode Activated — Guided inquiry & conceptual learning.');
}

function autoGrowInput() {
  const el = chatInputTextarea.value;
  if (!el) return;
  el.style.height = 'auto';
  // Up to 4 lines of text on uncollapsed AI (~92px), then scroll
  const maxLines = isChatMaximized.value ? 7 : 4;
  const maxHeight = maxLines * 20 + 12;
  el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
}

watch(isChatMaximized, () => {
  nextTick(() => {
    autoGrowInput();
    scrollToBottom();
  });
});

watch(() => props.checkpointTitle, () => {
  chatHistory.value = [];
  userQuery.value = '';
  if (chatInputTextarea.value) chatInputTextarea.value.style.height = 'auto';
});

// Dynamic lesson data tailored to the specific topic & parent module
const activeLessonData = computed(() => {
  const title = (props.checkpointTitle || '').trim();
  const parent = (props.parentModuleName || '').trim();

  // 1. Check if checkpoint has authentic node_content
  let nc = props.checkpointData?.node_content;
  let found = null;
  if (!nc && props.moduleData?.checkpoints) {
    found = props.moduleData.checkpoints.find(c => 
      (c.name || c.title) === title || String(c.id) === String(props.checkpointData?.id)
    );
    if (found?.node_content) {
      nc = found.node_content;
    }
  } else if (props.moduleData?.checkpoints) {
    // Resolve the sibling checkpoint record so block/assessment fallbacks stay in scope.
    found = props.moduleData.checkpoints.find(c =>
      (c.name || c.title) === title || String(c.id) === String(props.checkpointData?.id)
    ) || null;
  }

  // 2. Test Module Checkpoints (explicitly supported for rapid testing and invariant verification)
  const isTestModule = props.moduleData?.id === 999 || 
    (props.moduleData?.title && props.moduleData.title.includes('Test Module')) ||
    title === 'Orientation & Signal Basics' ||
    title === 'Rapid Prototyping Trial' ||
    title === 'Final Calibration & Mastery';

  if (isTestModule) {
    const testLibrary = {
      'Orientation & Signal Basics': {
        subtitle: 'Signal Flow & Fast Calibration',
        introGreeting: 'Welcome to your test calibration! ⚡',
        p1: 'In this path, we explore rapid signal routing and foundational logic in robotics systems.',
        p2: 'Consider a microcontroller receiving a raw voltage pulse when a calibration button is pressed: how does the system recognize that transition?',
        question: 'What must happen to an analog voltage reading before a microcontroller can evaluate it as a logical condition (HIGH or LOW)?',
        concepts: [
          {
            title: 'A. Signal Representation',
            text: 'Electronic sensors convey physical events through variations in electrical potential.',
            example: 'A photoresistor circuit where brightness changes resistance, generating varying analog voltage.',
            keyIdea: 'Voltage is the language sensors use to communicate physical state.',
          },
          {
            title: 'B. Latency & Sampling',
            text: 'How frequently a system samples an incoming signal dictates how quickly it can react.',
            example: 'If a sensor updates at 10Hz but a robot moves at 1 m/s, it travels 10cm between readings.',
            keyIdea: 'Appropriate sampling rates are necessary to prevent missed events.',
          },
          {
            title: 'C. Closed-Loop Feedback',
            text: 'Feedback allows a robot to verify whether its executed action achieved the intended target.',
            example: 'Reading optical encoder ticks to confirm that a wheel completed a 90-degree pivot.',
            keyIdea: 'Without feedback, actions assume ideal conditions that rarely exist in the arena.',
          },
        ],
      },
      'Rapid Prototyping Trial': {
        subtitle: 'Fast Iteration & Feedback Calibration',
        introGreeting: 'Ready for rapid prototyping! 🚀',
        p1: 'In this trial, we test fast iteration between sensor feedback and motor actuation.',
        p2: 'Suppose you want your prototype robot to halt within 5 milliseconds of sensing an arena border line.',
        question: 'Between sensor thresholding, code conditional branches, and motor driver braking, where is delay most commonly introduced?',
        concepts: [
          {
            title: 'A. Dynamic Braking vs Coasting',
            text: 'Cutting motor power lets momentum carry the robot forward, while shorting motor leads produces dynamic counter-torque.',
            example: 'H-bridge motor drivers shorting both low-side MOSFETs to stop immediately.',
            keyIdea: 'Active braking stops inertial drift orders of magnitude faster than coasting.',
          },
          {
            title: 'B. Threshold Hysteresis',
            text: 'Applying dual thresholds prevents rapid toggling when analog sensor readings hover right near a trigger line.',
            example: 'A Schmitt trigger circuit or software band that requires high transition above 3.0V and low transition below 1.5V.',
            keyIdea: 'Hysteresis prevents erratic jitter on borderline readings.',
          },
        ],
      },
      'Final Calibration & Mastery': {
        subtitle: 'System Integration & Badge Verification',
        introGreeting: 'Final calibration milestone! 🏆',
        p1: 'Review your complete sensor-to-action feedback loop and verify end-to-end timing guarantees.',
        p2: 'Mastering this checkpoint completes the test module constellation.',
        question: 'How do you verify that your complete firmware control loop satisfies hard real-time timing deadlines?',
        concepts: [
          {
            title: 'A. Deterministic Loop Timing',
            text: 'Ensuring every cycle of the primary control loop completes within a fixed, measured interval.',
            example: 'Using a hardware timer interrupt to trigger sensor sampling at exactly 100 Hz.',
            keyIdea: 'Deterministic execution prevents accumulated phase lag in control loops.',
          },
        ],
      },
    };

    if (testLibrary[title]) {
      return {
        hasContent: true,
        isTest: true,
        ...testLibrary[title],
      };
    }
  }

  // 3. Check for authentic blocks and source-faithful curriculum
  let blocks = props.checkpointData?.blocks || found?.blocks;
  let assessment = props.checkpointData?.assessment || found?.assessment;
  let sourceRef = props.checkpointData?.source_reference || found?.source_reference;
  let topicGroup = props.checkpointData?.topic_group || found?.topic_group;

  // The shipped Acamad topics are a SEED for lessons that have no authored
  // content yet. They must never shadow a lesson the teacher has edited: when
  // the node carries its own prose, that prose is the source of truth.
  //
  // Regression this guards: a node with `node_content.core_lesson` but no
  // `blocks` array used to be replaced wholesale by the seed blocks, so every
  // title/paragraph/list formatting the teacher saved disappeared from the
  // preview and student view.
  const hasAuthoredProse = Boolean(
    (nc?.core_lesson || '').trim() ||
    (nc?.step_by_step_guide || '').trim() ||
    (nc?.introduction || '').trim() ||
    (nc?.overview || '').trim()
  );

  if ((!blocks || blocks.length === 0) && !hasAuthoredProse) {
    const authMatch = ROBOTICS_AUTHENTIC_TOPICS.find(t => {
      const matchT = t.title.toLowerCase();
      const currT = title.toLowerCase();
      return matchT === currT || currT.includes(matchT) || matchT.includes(currT);
    });
    if (authMatch) {
      blocks = authMatch.blocks;
      assessment = authMatch.assessment;
      sourceRef = authMatch.sourceReference;
      topicGroup = authMatch.groupTitle;
    }
  }

  if (blocks && blocks.length > 0) {
    const introBlock = blocks.find(b => b.type === 'text');
    return {
      hasContent: true,
      isTest: false,
      subtitle: `${parent} • ${topicGroup || 'Learning Node'}`,
      introGreeting: `Welcome to ${title}! 🎓`,
      p1: introBlock?.content || nc?.introduction || `In this checkpoint, we study ${title} within ${parent}.`,
      p2: 'Read the source-faithful lesson material, examine circuit blueprints and code, and complete the end-of-topic assessment below.',
      question: `What question do you have about ${title}?`,
      introduction: nc?.introduction || introBlock?.content || '',
      coreLesson: nc?.core_lesson || '',
      blocks,
      assessment,
      sourceReference: sourceRef,
      topicGroup,
      sourceExcerpt: sourceRef?.sourceExcerpt || '',
      concepts: [],
      examples: [],
      activities: [],
      challenges: [],
      quiz: [],
      groundingDisclosure: sourceRef ? `Grounded in ${sourceRef.section} > ${sourceRef.heading}` : '',
    };
  }

  // 4. If genuine node_content exists
  if (nc) {
    const rawConcepts = nc.key_concepts || nc.core_concepts || [];
    let formattedConcepts = [];
    if (Array.isArray(rawConcepts)) {
      formattedConcepts = rawConcepts.map((c, i) => {
        if (typeof c === 'string') {
          return {
            title: `${String.fromCharCode(65 + (i % 26))}. Key Concept`,
            text: c,
            example: '',
            keyIdea: c,
          };
        }
        return {
          title: c.title || `${String.fromCharCode(65 + (i % 26))}. ${c.concept || 'Concept'}`,
          text: c.explanation || c.text || '',
          example: c.example || '',
          keyIdea: c.keyIdea || c.key_idea || c.concept || '',
        };
      });
    }

    const examples = Array.isArray(nc.examples) ? nc.examples : (nc.examples ? [String(nc.examples)] : []);
    const activities = Array.isArray(nc.activities) ? nc.activities : (nc.activities ? [String(nc.activities)] : []);
    const challenges = Array.isArray(nc.engineering_challenges) ? nc.engineering_challenges : (nc.troubleshooting ? [String(nc.troubleshooting)] : []);
    const quiz = Array.isArray(nc.assessment_questions) ? nc.assessment_questions : (Array.isArray(nc.interactive_quiz) ? nc.interactive_quiz : []);
    const intro = nc.introduction || nc.overview || '';
    const coreLesson = nc.core_lesson || nc.step_by_step_guide || '';

    return {
      hasContent: Boolean(intro || coreLesson || formattedConcepts.length > 0),
      isTest: false,
      subtitle: `${parent} • Checkpoint`,
      introGreeting: `Welcome to ${title}! 🎓`,
      p1: intro || `In this checkpoint, we study ${title} within ${parent}.`,
      p2: 'Explore the instructional guide, key concepts, and practical challenges below. Use the AI Assistant to investigate questions or debug implementation scenarios.',
      question: `What question do you have about ${title}?`,
      introduction: intro,
      coreLesson,
      concepts: formattedConcepts,
      examples,
      activities,
      challenges,
      quiz,
      references: nc.suggested_references,
      groundingDisclosure: nc.grounding_disclosure,
    };
  }

  // 4. Content is NOT available yet (Honest empty state, no mock robotics fallback!)
  return {
    hasContent: false,
    isTest: false,
    subtitle: `${parent} • Checkpoint`,
    introGreeting: 'Hello! 💬',
    p1: `Lesson content for "${title}" is currently in preparation by your instructor.`,
    p2: `You can ask general questions about ${parent} or return to the module roadmap.`,
    question: `Would you like to ask a question about ${parent}?`,
    concepts: [],
  };
});

// Dynamic natural topic-based AI Tutor greeting (Separated from the full lesson text)
const initialTutorGreeting = computed(() => {
  const title = (props.checkpointTitle || '').trim() || 'this topic';
  const type = props.checkpointData?.type || 'concept';
  if (type === 'lab' || type === 'laboratory') {
    return `Hi! Ready for the hands-on lab on "${title}"? Ask me anything about the setup, code, or wiring!`;
  } else if (type === 'challenge') {
    return `Hi! We're tackling "${title}". Which part of the challenge would you like to brainstorm or test?`;
  } else if (type === 'assessment') {
    return `Hi! Reviewing "${title}"? Let me know which concepts you'd like to check before the assessment!`;
  }
  return `Hi! We're exploring "${title}". What would you like to understand better?`;
});

// Collects structured background lesson context for the AI Tutor (passed to system prompt, never as a fake chat message)
function getLessonContextText() {
  const data = activeLessonData.value;
  if (!data) return '';
  const sections = [];
  if (data.introduction) {
    sections.push(`OVERVIEW:\n${data.introduction}`);
  }
  if (data.blocks && data.blocks.length > 0) {
    sections.push('LESSON BLOCKS:');
    data.blocks.forEach((b, idx) => {
      sections.push(`[${(b.type || 'text').toUpperCase()}] ${b.title || `Block ${idx + 1}`}:\n${b.content || ''}`);
      if (b.analogy) sections.push(`Key Takeaway / Analogy: ${b.analogy}`);
    });
  } else if (data.coreLesson) {
    sections.push(`INSTRUCTIONAL GUIDE:\n${data.coreLesson}`);
  }
  if (data.concepts && data.concepts.length > 0) {
    sections.push('CORE CONCEPTS:');
    data.concepts.forEach(c => {
      sections.push(`- ${c.title}: ${c.text || ''}${c.example ? ` (Example: ${c.example})` : ''}${c.keyIdea ? ` (Key Idea: ${c.keyIdea})` : ''}`);
    });
  }
  if (data.examples && data.examples.length > 0) {
    sections.push(`EXAMPLES:\n${data.examples.map(e => `- ${e}`).join('\n')}`);
  }
  if (data.activities && data.activities.length > 0) {
    sections.push(`ACTIVITIES:\n${data.activities.map(a => typeof a === 'string' ? `- ${a}` : `- ${a.title || 'Activity'}: ${a.instructions || ''}`).join('\n')}`);
  }
  return sections.join('\n\n');
}

function toggleStar() {
  isStarred.value = !isStarred.value;
  emit('notify', isStarred.value ? `Bookmarked "${props.checkpointTitle}"` : `Removed bookmark for "${props.checkpointTitle}"`);
}

async function handleCompleteCheckpoint() {
  // Mentor preview must never touch student progress, mastery, checkpoint or star records.
  if (props.previewMode) {
    emit('notify', 'Preview mode — checkpoint completion is disabled for teachers.');
    return;
  }

  if (activeLessonData.value.assessment?.required_to_unlock_next && !isAssessmentPassed.value) {
    emit('notify', 'Please complete and pass the end-of-topic assessment before advancing to the next node.');
    return;
  }

  const currentStep = props.moduleData?.currentStep || 0;
  const nextStep = currentStep + 1;
  const totalSteps = props.moduleData?.totalSteps || 3;
  const isLast = nextStep >= totalSteps;
  const progressPercent = Math.min(100, Math.round((nextStep / totalSteps) * 100));

  emit('notify', `Marked "${props.checkpointTitle}" as completed!`);

  try {
    const modId = props.moduleData?.id || 999;
    await axios.post('/api/modules/progress', { moduleId: modId, step: nextStep });
  } catch (e) {}

  try {
    const studentId = authStore?.currentUser?.id;
    const modId = props.moduleData?.id || 999;
    if (studentId) {
      await StudentSyncService.recordCheckpointProgress(
        studentId,
        modId,
        props.checkpointTitle || 'Checkpoint',
        progressPercent
      );
    }
  } catch (_) {}

  emit('complete-checkpoint', {
    checkpoint: props.checkpointTitle,
    isLast,
  });

  emit('back');
}

function handleAction(action) {
  isKebabOpen.value = false;
  if (action === 'Share') {
    navigator.clipboard.writeText(window.location.href);
    emit('notify', 'Lesson link copied to clipboard!');
  } else if (action === 'Bookmark') {
    toggleStar();
  } else if (action === 'Complete') {
    handleCompleteCheckpoint();
  }
}

function closeKebab() {
  isKebabOpen.value = false;
}

function scrollToBottom() {
  if (chatMessagesContainer.value) {
    chatMessagesContainer.value.scrollTop = chatMessagesContainer.value.scrollHeight;
  }
}

onMounted(() => {
  window.addEventListener('click', closeKebab);
});

onUnmounted(() => {
  window.removeEventListener('click', closeKebab);
});

async function sendMessage() {
  if (props.previewMode) {
    // Preview keeps the tutor panel for layout parity but never sends lesson
    // context to the model on behalf of the teacher's account.
    emit('notify', 'AI Tutor is available in the student workspace — not in Teacher Preview.');
    return;
  }
  if (!userQuery.value.trim() || isStreaming.value) return;
  const q = userQuery.value.trim();
  userQuery.value = '';
  if (chatInputTextarea.value) chatInputTextarea.value.style.height = 'auto';

  // 1. Append user's message
  chatHistory.value.push({ sender: 'user', text: q });

  // 2. Prepare conversation messages payload with the short initial greeting (NOT duplicating the lesson text)
  const formattedMessages = [
    { role: 'assistant', content: initialTutorGreeting.value },
    ...chatHistory.value.map(m => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text,
    })),
  ];

  // 3. Append streaming AI message placeholder
  const aiMessageIdx = chatHistory.value.length;
  chatHistory.value.push({
    sender: 'ai',
    text: '',
    isStreaming: true,
  });

  isStreaming.value = true;
  await nextTick();
  scrollToBottom();

  try {
    // 4. Request /api/chat with dynamic checkpoint, module context, and background lesson context
    const payload = {
      messages: formattedMessages,
      checkpointTitle: props.checkpointTitle,
      moduleTitle: props.parentModuleName,
      moduleId: props.moduleData?.id ? String(props.moduleData.id) : undefined,
      checkpointDescription: props.checkpointData?.description || '',
      mode: aiMode.value === 'competition' ? 'competition' : 'socratic',
      sourceExcerpt: activeLessonData.value.sourceExcerpt || activeLessonData.value.sourceReference?.sourceExcerpt,
      topicGroup: activeLessonData.value.topicGroup,
      lessonContext: getLessonContextText(),
    };

    let response;
    const authToken = await authStore.getAuthToken?.();
    const chatHeaders = {
      'Content-Type': 'application/json',
      ...(authToken && authToken.length < 8192 ? { Authorization: `Bearer ${authToken}` } : {}),
    };

    try {
      response = await fetch('/api/chat', {
        method: 'POST',
        headers: chatHeaders,
        credentials: 'omit',
        body: JSON.stringify(payload),
      });
    } catch (fetchErr) {
      const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      if (isLocal && window.location.port !== '5173') {
        console.warn('[Checkpoint] Primary /api/chat unreachable, falling back to local port 5173...');
        response = await fetch('http://127.0.0.1:5173/api/chat', {
          method: 'POST',
          headers: chatHeaders,
          credentials: 'omit',
          body: JSON.stringify(payload),
        });
      } else {
        throw fetchErr;
      }
    }

    if (!response.ok) {
      let finalErrMsg = `Chat API responded with ${response.status}`;
      try {
        const ej = await response.json();
        if (ej && ej.error) finalErrMsg = ej.error;
      } catch (_) {}
      throw new Error(finalErrMsg);
    }

    if (!response.body) {
      throw new Error('Streaming response body not supported');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const textChunk = decoder.decode(value, { stream: true });
      chatHistory.value[aiMessageIdx].text += textChunk;
      scrollToBottom();
    }

    // Inspect if response body returned a JSON error payload
    const fullText = (chatHistory.value[aiMessageIdx].text || '').trim();
    if (fullText.startsWith('{') && fullText.includes('"error"')) {
      try {
        const parsed = JSON.parse(fullText);
        if (parsed.error) {
          chatHistory.value[aiMessageIdx].text = `⚠️ AI Service Error: ${parsed.error}\n\n💡 Debug Tip: You can visit /api/chat directly in your browser on this domain to run live backend diagnostics.`;
        }
      } catch (_) {}
    }
  } catch (error) {
    console.error('Chat streaming failed:', error);
    chatHistory.value[aiMessageIdx].text =
      chatHistory.value[aiMessageIdx].text ||
      `⚠️ AI Service Error: ${error?.message || 'Connection error'}\n\n💡 Debug Tip: You can visit /api/chat directly in your browser on this domain to run live backend diagnostics.`;
  } finally {
    if (!chatHistory.value[aiMessageIdx].text || !chatHistory.value[aiMessageIdx].text.trim()) {
      chatHistory.value[aiMessageIdx].text =
        `⚠️ AI Service Error: The AI service returned an empty response. Please verify that the local dev server is running and try again.\n\n💡 Debug Tip: You can visit /api/chat directly in your browser on this domain to run live backend diagnostics.`;
    }
    chatHistory.value[aiMessageIdx].isStreaming = false;
    isStreaming.value = false;
    await nextTick();
    scrollToBottom();
  }
}

function copyPrompt() {
  navigator.clipboard.writeText(initialTutorGreeting.value);
  emit('notify', 'Copied greeting to clipboard!');
}

function copyText(text) {
  navigator.clipboard.writeText(text);
  emit('notify', 'Copied message to clipboard!');
}

function bookmarkInsight(text) {
  emit('notify', 'Insight saved to your learning notebook!');
}

function formatMessageText(text) {
  if (!text) return '';
  // Strip any accidental leading internal directive header leak from display
  const cleanText = text
    .replace(/^\s*={10,}\s*\n\s*(?:CRITICAL SAFETY DIRECTIVE|ADAPTIVE TEACHING INTELLIGENCE|INTERNAL SYSTEM DIRECTIVE)[^\n]*\n[\s\S]*?\n\s*={10,}\s*\n*/i, '')
    .replace(/^\s*<internal_[^>]+>[\s\S]*?<\/internal_[^>]+>\s*\n*/i, '')
    .replace(/^\s*\[INTERNAL[^\n\]]*\][\s\S]*?\[END INTERNAL[^\n\]]*\]\s*\n*/i, '')
    .trimStart();

  let safe = cleanText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  // Bold **text** -> <strong>text</strong>
  safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Inline code `code` -> <code>code</code>
  safe = safe.replace(/`([^`]+)`/g, '<code class="chat-inline-code">$1</code>');
  return safe;
}
</script>

<style scoped>
/* Full Screen 2-Column Container: Chatbox Stretches to Top */
.checkpoint-page-container {
  display: grid;
  grid-template-columns: 1fr 410px;
  gap: 36px;
  height: 100%;
  width: 100%;
  overflow: hidden;
  box-sizing: border-box;
  transition: grid-template-columns 0.4s cubic-bezier(0.25, 1, 0.5, 1),
              gap 0.4s cubic-bezier(0.25, 1, 0.5, 1);
}

.checkpoint-page-container.is-chat-maximized {
  grid-template-columns: 0fr 1fr;
  gap: 0;
}

/*
 * Teacher Preview (previewMode) removes the AI tutor completely — not hidden,
 * not collapsed to an empty column — so the lesson owns the full width.
 */
.checkpoint-page-container--tutor-hidden {
  grid-template-columns: minmax(0, 1fr);
  gap: 0;
  /* Document mode: the host (full-screen editor) owns scrolling. */
  height: auto;
  min-height: 100%;
  overflow: visible;
}

.checkpoint-page-container--tutor-hidden .checkpoint-main-column {
  max-width: 1040px;
  width: 100%;
  height: auto;
  margin: 0 auto;
  padding: 0;
  overflow: visible;
  box-sizing: border-box;
}

.checkpoint-page-container--tutor-hidden .lesson-lecture-column {
  overflow: visible;
  padding-right: 0;
}

/* ── Teacher Editor Document Typography ───────────────────────────────────
 * The full-screen editor is a reading/writing surface, not a dashboard card.
 * Within preview mode we raise the type scale and calm the chrome so long
 * lessons stay readable, while leaving every student-workspace rule untouched.
 */
.checkpoint-page-container--tutor-hidden .checkpoint-header {
  margin-bottom: 20px;
  padding-bottom: 18px;
  border-bottom: 1px solid #eef2f7;
}

.checkpoint-page-container--tutor-hidden .checkpoint-title {
  font-size: 34px;
  line-height: 1.15;
  letter-spacing: -0.9px;
  max-width: 26ch;
  overflow-wrap: anywhere;
}

.checkpoint-page-container--tutor-hidden .sub-category-tag {
  font-size: 11px;
  letter-spacing: 1.4px;
  text-transform: uppercase;
}

.checkpoint-page-container--tutor-hidden .parent-module-text {
  font-size: 13px;
}

/*
 * A lesson documents itself: the "Instructional Guide" / "Overview" wrapper
 * cards carry no border or shadow in the editor, so the page never becomes a
 * stack of nested cards. Optional containers (callouts, activities, tables,
 * code, assessment) keep a single restrained surface each.
 */
.checkpoint-page-container--tutor-hidden .lesson-section-box {
  padding: 0;
  margin-bottom: 32px;
  background: transparent;
  border: none;
  border-radius: 0;
  box-shadow: none;
}

.checkpoint-page-container--tutor-hidden .lesson-intro-card,
.checkpoint-page-container--tutor-hidden .lesson-guide-card {
  padding-bottom: 4px;
}

.checkpoint-page-container--tutor-hidden .block-text-box {
  padding: 0;
  border: none;
  box-shadow: none;
  background: transparent;
  margin-bottom: 26px;
}

.checkpoint-page-container--tutor-hidden .block-title {
  font-size: 23px;
  line-height: 1.3;
  letter-spacing: -0.4px;
  margin: 0 0 14px 0;
  overflow-wrap: anywhere;
}

.checkpoint-page-container--tutor-hidden .section-title {
  font-size: 13px;
  letter-spacing: 1.1px;
  text-transform: uppercase;
  color: var(--risse-orange-hover, #ea580c);
  margin: 0 0 16px 0;
}

/* Body copy: comfortable measure and line height for sustained editing. */
.checkpoint-page-container--tutor-hidden .markdown-body,
.checkpoint-page-container--tutor-hidden .lesson-markdown-content,
.checkpoint-page-container--tutor-hidden .intro-text,
.checkpoint-page-container--tutor-hidden .callout-content,
.checkpoint-page-container--tutor-hidden .activity-content {
  font-size: 16.5px;
  line-height: 1.8;
  color: #334155;
  max-width: 100%;
  overflow-wrap: break-word;
  word-break: normal;
}

.checkpoint-page-container--tutor-hidden .intro-text :deep(p) {
  margin: 0 0 14px 0;
}

.checkpoint-page-container--tutor-hidden .markdown-body :deep(h1),
.checkpoint-page-container--tutor-hidden .callout-content :deep(h1),
.checkpoint-page-container--tutor-hidden .activity-content :deep(h1) {
  font-size: 25px;
  line-height: 1.3;
  letter-spacing: -0.5px;
  margin: 30px 0 12px 0;
}

.checkpoint-page-container--tutor-hidden .markdown-body :deep(h2),
.checkpoint-page-container--tutor-hidden .callout-content :deep(h2),
.checkpoint-page-container--tutor-hidden .activity-content :deep(h2) {
  font-size: 21px;
  line-height: 1.35;
  letter-spacing: -0.35px;
  margin: 28px 0 10px 0;
}

.checkpoint-page-container--tutor-hidden .markdown-body :deep(h3),
.checkpoint-page-container--tutor-hidden .callout-content :deep(h3),
.checkpoint-page-container--tutor-hidden .activity-content :deep(h3) {
  font-size: 17.5px;
  line-height: 1.4;
  margin: 24px 0 8px 0;
}

.checkpoint-page-container--tutor-hidden .markdown-body :deep(> :first-child),
.checkpoint-page-container--tutor-hidden .callout-content :deep(> :first-child),
.checkpoint-page-container--tutor-hidden .activity-content :deep(> :first-child) {
  margin-top: 0;
}

.checkpoint-page-container--tutor-hidden .markdown-body :deep(p),
.checkpoint-page-container--tutor-hidden .callout-content :deep(p),
.checkpoint-page-container--tutor-hidden .activity-content :deep(p) {
  margin: 0 0 16px 0;
}

.checkpoint-page-container--tutor-hidden .markdown-body :deep(strong),
.checkpoint-page-container--tutor-hidden .callout-content :deep(strong),
.checkpoint-page-container--tutor-hidden .activity-content :deep(strong) {
  color: #0f172a;
  font-weight: 700;
}

.checkpoint-page-container--tutor-hidden .markdown-body :deep(em),
.checkpoint-page-container--tutor-hidden .callout-content :deep(em),
.checkpoint-page-container--tutor-hidden .activity-content :deep(em) {
  color: #1e293b;
}

/* Lists: readable indentation and breathing room between items. */
.checkpoint-page-container--tutor-hidden .markdown-body :deep(ul),
.checkpoint-page-container--tutor-hidden .markdown-body :deep(ol),
.checkpoint-page-container--tutor-hidden .callout-content :deep(ul),
.checkpoint-page-container--tutor-hidden .callout-content :deep(ol),
.checkpoint-page-container--tutor-hidden .activity-content :deep(ul),
.checkpoint-page-container--tutor-hidden .activity-content :deep(ol) {
  margin: 0 0 18px 0;
  padding-left: 28px;
}

.checkpoint-page-container--tutor-hidden .markdown-body :deep(li),
.checkpoint-page-container--tutor-hidden .callout-content :deep(li),
.checkpoint-page-container--tutor-hidden .activity-content :deep(li) {
  margin-bottom: 9px;
  line-height: 1.72;
  padding-left: 2px;
}

.checkpoint-page-container--tutor-hidden .markdown-body :deep(li::marker),
.checkpoint-page-container--tutor-hidden .activity-content :deep(li::marker) {
  color: #ea580c;
  font-weight: 700;
}

/*
 * Tiptap stores list items as <li><p>…</p></li>. The paragraph rules above add
 * 16px under every paragraph, which inside a list item doubles the gap between
 * items AND drops the wrapped second line below the marker instead of aligning
 * it with the item text. Let the <li> own item spacing instead.
 */
.checkpoint-page-container--tutor-hidden .markdown-body :deep(li > p),
.checkpoint-page-container--tutor-hidden .callout-content :deep(li > p),
.checkpoint-page-container--tutor-hidden .activity-content :deep(li > p) {
  margin: 0;
  max-width: 100%;
}

.checkpoint-page-container--tutor-hidden .markdown-body :deep(li > p + p),
.checkpoint-page-container--tutor-hidden .callout-content :deep(li > p + p),
.checkpoint-page-container--tutor-hidden .activity-content :deep(li > p + p) {
  margin-top: 10px;
}

/* Intentional blank lines: keep a visible line instead of collapsing to 0px. */
.checkpoint-page-container--tutor-hidden .markdown-body :deep(p:empty),
.checkpoint-page-container--tutor-hidden .markdown-body :deep(p:has(> br:only-child)),
.checkpoint-page-container--tutor-hidden .callout-content :deep(p:empty),
.checkpoint-page-container--tutor-hidden .activity-content :deep(p:empty) {
  min-height: 1.8em;
  margin: 0 0 16px 0;
}

/* Ordered lists keep their numbers readable at the larger text scale. */
.checkpoint-page-container--tutor-hidden .markdown-body :deep(ol),
.checkpoint-page-container--tutor-hidden .callout-content :deep(ol),
.checkpoint-page-container--tutor-hidden .activity-content :deep(ol) {
  list-style-position: outside;
}

.checkpoint-page-container--tutor-hidden .markdown-body :deep(ol > li),
.checkpoint-page-container--tutor-hidden .callout-content :deep(ol > li) {
  padding-left: 4px;
}

/* Nested lists step in and stay visually distinct from their parent. */
.checkpoint-page-container--tutor-hidden .markdown-body :deep(li > ul),
.checkpoint-page-container--tutor-hidden .markdown-body :deep(li > ol) {
  padding-left: 24px;
}

/* Alignment / size / colour / highlight applied in the editor must survive. */
.checkpoint-page-container--tutor-hidden .markdown-body :deep([style*="text-align"]),
.checkpoint-page-container--tutor-hidden .callout-content :deep([style*="text-align"]),
.checkpoint-page-container--tutor-hidden .activity-content :deep([style*="text-align"]) {
  max-width: 100%;
}

.checkpoint-page-container--tutor-hidden .markdown-body :deep(li > ul),
.checkpoint-page-container--tutor-hidden .markdown-body :deep(li > ol) {
  margin-top: 8px;
  margin-bottom: 4px;
}

/* Callouts: one accent container instead of card-inside-card. */
.checkpoint-page-container--tutor-hidden .block-callout-card {
  padding: 22px 26px;
  border-radius: 10px;
  background: #fff9f0;
  border-left: 4px solid #f97316;
}

.checkpoint-page-container--tutor-hidden .block-callout-card.is-analogy {
  background: #fffbeb;
  border-left-color: #f59e0b;
}

.checkpoint-page-container--tutor-hidden .callout-title {
  font-size: 17px;
  letter-spacing: -0.2px;
}

.checkpoint-page-container--tutor-hidden .callout-icon {
  font-size: 19px;
}

.checkpoint-page-container--tutor-hidden .analogy-takeaway-box {
  margin-top: 16px;
  padding: 14px 18px;
  font-size: 15px;
  line-height: 1.65;
  border-radius: 8px;
}

/* Activities + assessment: roomy cards with a clear heading, no deep nesting. */
.checkpoint-page-container--tutor-hidden .block-activity-card {
  padding: 22px 26px;
  background: #f7fbfa;
  border-color: #d6ece6;
}

.checkpoint-page-container--tutor-hidden .activity-title {
  font-size: 17.5px;
  letter-spacing: -0.2px;
}

.checkpoint-page-container--tutor-hidden .block-table-card,
.checkpoint-page-container--tutor-hidden .block-code-card {
  padding: 0;
  overflow: hidden;
  border-radius: 12px;
}

.checkpoint-page-container--tutor-hidden .block-code-card .block-title,
.checkpoint-page-container--tutor-hidden .block-table-card .table-title {
  font-size: 16px;
  padding: 16px 20px 0;
}

.checkpoint-page-container--tutor-hidden .block-markdown-table {
  padding: 16px 20px 20px;
}

.checkpoint-page-container--tutor-hidden .interactive-assessment-section {
  padding: 26px 28px;
  border: 1px solid #f0e2d3;
  border-radius: 12px;
  background: #fffdfa;
  margin-top: 32px;
  margin-bottom: 0;
}

.checkpoint-page-container--tutor-hidden .assessment-question-card {
  padding: 20px 0 22px;
  margin-bottom: 4px;
  border-radius: 0;
  border: none;
  border-top: 1px solid #f1eee9;
  background: transparent;
}

.checkpoint-page-container--tutor-hidden .assessment-question-card:first-of-type {
  border-top: none;
  padding-top: 6px;
}

.checkpoint-page-container--tutor-hidden .question-header {
  font-size: 16px;
  line-height: 1.5;
  margin-bottom: 14px;
}

.checkpoint-page-container--tutor-hidden .section-subtitle {
  font-size: 13.5px;
  line-height: 1.6;
}

/* Images and embedded media fill the measure without overflowing. */
.checkpoint-page-container--tutor-hidden .markdown-body :deep(img),
.checkpoint-page-container--tutor-hidden .callout-content :deep(img),
.checkpoint-page-container--tutor-hidden .activity-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 10px;
  margin: 18px 0;
}

.checkpoint-page-container--tutor-hidden .markdown-body :deep(table),
.checkpoint-page-container--tutor-hidden .activity-content :deep(table) {
  font-size: 14px;
  margin: 14px 0;
}

.checkpoint-page-container--tutor-hidden .markdown-body :deep(th),
.checkpoint-page-container--tutor-hidden .markdown-body :deep(td),
.checkpoint-page-container--tutor-hidden .activity-content :deep(th),
.checkpoint-page-container--tutor-hidden .activity-content :deep(td) {
  padding: 10px 14px;
}

/* Editing affordances stay legible but never compete with the lesson text. */
.checkpoint-page-container--tutor-hidden .btn-inline-edit-hint {
  margin-bottom: 8px;
  font-size: 11px;
}

.checkpoint-page-container--tutor-hidden .lesson-footer-citations {
  margin-top: 8px;
  padding-bottom: 32px;
}

/* Containers that ARE meaningful (callout, activity, table, code, quiz) get
 * one calm surface each rather than a card-inside-card stack. */
.checkpoint-page-container--tutor-hidden .block-callout-card,
.checkpoint-page-container--tutor-hidden .block-activity-card,
.checkpoint-page-container--tutor-hidden .block-code-card,
.checkpoint-page-container--tutor-hidden .block-table-card,
.checkpoint-page-container--tutor-hidden .interactive-assessment-section,
.checkpoint-page-container--tutor-hidden .concept-block,
.checkpoint-page-container--tutor-hidden .activity-card,
.checkpoint-page-container--tutor-hidden .challenge-card,
.checkpoint-page-container--tutor-hidden .quiz-question-box,
.checkpoint-page-container--tutor-hidden .assessment-question-card {
  margin-bottom: 18px;
}

/* Legacy 8-section sections: the same rhythm as block-rendered lessons. */
.checkpoint-page-container--tutor-hidden .concepts-section,
.checkpoint-page-container--tutor-hidden .examples-section,
.checkpoint-page-container--tutor-hidden .activities-section,
.checkpoint-page-container--tutor-hidden .challenges-section,
.checkpoint-page-container--tutor-hidden .assessment-section {
  padding: 0;
}

.checkpoint-page-container--tutor-hidden .concept-block {
  padding: 18px 20px;
  border-radius: 9px;
}

.checkpoint-page-container--tutor-hidden .concept-title {
  font-size: 17.5px;
  letter-spacing: -0.2px;
}

.checkpoint-page-container--tutor-hidden .concept-text,
.checkpoint-page-container--tutor-hidden .concept-example,
.checkpoint-page-container--tutor-hidden .concept-key-idea,
.checkpoint-page-container--tutor-hidden .activity-text,
.checkpoint-page-container--tutor-hidden .challenge-text {
  font-size: 16px;
  line-height: 1.75;
}

.checkpoint-page-container--tutor-hidden .examples-list {
  font-size: 16px;
  line-height: 1.75;
  padding-left: 26px;
}

.checkpoint-page-container--tutor-hidden .examples-list li {
  margin-bottom: 9px;
}

.checkpoint-page-container--tutor-hidden .activity-card,
.checkpoint-page-container--tutor-hidden .challenge-card {
  padding: 16px 18px;
  margin-bottom: 12px;
  border-radius: 9px;
}

.checkpoint-page-container--tutor-hidden .quiz-question-box {
  padding: 20px 22px;
  border-radius: 10px;
}

.checkpoint-page-container--tutor-hidden .question-title {
  font-size: 16.5px;
  line-height: 1.5;
}

.checkpoint-page-container--tutor-hidden .opt-item {
  font-size: 15.5px;
  line-height: 1.7;
}

.checkpoint-page-container--tutor-hidden .question-explanation {
  font-size: 15px;
  line-height: 1.7;
  padding: 12px 16px;
  border-radius: 8px;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* PHASE 1 — RESIZABLE LESSON CONTAINERS                                      */
/* Dimensions are layout only: text wraps and reflows, nothing is scaled.      */
/* ═══════════════════════════════════════════════════════════════════════════ */
.checkpoint-page-container--tutor-hidden .is-block-resizable {
  position: relative;
  box-sizing: border-box;
  /* Never wider than the workspace: the document must not scroll sideways. */
  max-width: 100%;
  transition: box-shadow 0.15s ease, outline-color 0.15s ease;
}

/* A resized block with a fixed height scrolls its own content if needed. */
.checkpoint-page-container--tutor-hidden .is-block-resizable.has-custom-size {
  overflow: auto;
}

/*
 * Preview mode normally strips every block's surface (it is a reading document).
 * A container the teacher has sized must remain visible AS a container, so the
 * resize is legible and the text does not appear to float. Padding is small and
 * symmetric so turning it on cannot reflow the prose in a surprising way.
 */
.checkpoint-page-container--tutor-hidden .is-block-resizable.has-custom-size,
.checkpoint-page-container--tutor-hidden .is-block-resizable.is-block-selected {
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fcfdff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
}

/* Selected: a clear, RISSE-orange boundary that reads as "this box is active". */
.checkpoint-page-container--tutor-hidden .is-block-selected {
  outline: 2px solid rgba(255, 122, 0, 0.55);
  outline-offset: 4px;
  border-radius: 12px;
}

/* Handles: hidden until hover/selection so the document stays clean. */
.checkpoint-page-container--tutor-hidden .block-resize-handle {
  position: absolute;
  z-index: 6;
  display: none;
  border-radius: 3px;
  background: #ff7a00;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18);
}

.checkpoint-page-container--tutor-hidden .is-block-resizable:hover > .block-resize-handle,
.checkpoint-page-container--tutor-hidden .is-block-selected > .block-resize-handle {
  display: block;
}

/* Right edge — horizontal resize */
.checkpoint-page-container--tutor-hidden .block-resize-handle--e {
  top: 50%;
  right: -7px;
  transform: translateY(-50%);
  width: 6px;
  height: 46px;
  cursor: ew-resize;
}

/* Bottom edge — vertical resize */
.checkpoint-page-container--tutor-hidden .block-resize-handle--s {
  left: 50%;
  bottom: -7px;
  transform: translateX(-50%);
  height: 6px;
  width: 46px;
  cursor: ns-resize;
}

/* Bottom-right corner — both axes */
.checkpoint-page-container--tutor-hidden .block-resize-handle--se {
  right: -7px;
  bottom: -7px;
  width: 12px;
  height: 12px;
  cursor: nwse-resize;
  border: 2px solid #ffffff;
}

.checkpoint-page-container--tutor-hidden .block-reset-size {
  position: absolute;
  top: -12px;
  right: 10px;
  z-index: 7;
  display: none;
  padding: 2px 8px;
  border: 1px solid #fed7aa;
  border-radius: 9999px;
  background: #fff7ed;
  color: #c2410c;
  font-family: inherit;
  font-size: 10.5px;
  font-weight: 700;
  cursor: pointer;
}

.checkpoint-page-container--tutor-hidden .is-block-selected .block-reset-size {
  display: block;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* PHASE 2 — LAYOUT MODE & FREE POSITIONING                                   */
/* Positioning only ever writes metadata.layout; prose is never rewritten.     */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* The canvas is the coordinate space pinned blocks are placed against. */
.checkpoint-page-container--tutor-hidden .lesson-blocks-stream.is-layout-canvas {
  position: relative;
}

/* A pinned block leaves the flow and is placed on the canvas. */
.checkpoint-page-container--tutor-hidden .is-block-pinned {
  position: absolute;
  margin-bottom: 0;
  z-index: 1;
}

.checkpoint-page-container--tutor-hidden .is-block-pinned.is-block-selected {
  z-index: 5;
}

/* While dragging, lift the block and stop the browser selecting text. */
.checkpoint-page-container--tutor-hidden .is-block-dragging {
  z-index: 9 !important;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.18);
  cursor: grabbing;
}

/* Layout Mode: show a boundary on every movable block. */
.checkpoint-page-container--tutor-hidden .is-layout-mode {
  outline: 1px dashed #cbd5e1;
  outline-offset: 3px;
  border-radius: 12px;
}

.checkpoint-page-container--tutor-hidden .is-layout-mode:hover {
  outline-color: #94a3b8;
}

.checkpoint-page-container--tutor-hidden .is-layout-mode.is-block-selected {
  outline: 2px solid rgba(255, 122, 0, 0.55);
  outline-offset: 4px;
}

/* ── Drag handle ─────────────────────────────────────────────────────────── */
.checkpoint-page-container--tutor-hidden .block-drag-handle {
  position: absolute;
  top: -11px;
  left: -11px;
  z-index: 8;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 1px solid #ffd7a8;
  border-radius: 6px;
  background: #fff7ed;
  color: #c2410c;
  cursor: grab;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.12);
  touch-action: none;
}

.checkpoint-page-container--tutor-hidden .block-drag-handle:hover {
  background: #ffedd5;
  border-color: #fdba74;
}

.checkpoint-page-container--tutor-hidden .block-drag-handle:active {
  cursor: grabbing;
}

.checkpoint-page-container--tutor-hidden .is-block-dragging .block-drag-handle {
  cursor: grabbing;
}

/* ── Unpin control ───────────────────────────────────────────────────────── */
.checkpoint-page-container--tutor-hidden .block-unpin-btn {
  position: absolute;
  top: -12px;
  right: 10px;
  z-index: 8;
  display: none;
  padding: 2px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 9999px;
  background: #ffffff;
  color: #64748b;
  font-family: inherit;
  font-size: 10.5px;
  font-weight: 700;
  cursor: pointer;
}

.checkpoint-page-container--tutor-hidden .is-block-selected .block-unpin-btn {
  display: block;
}

/* "Reset size" and "Unpin" both live top-right; stack them when both apply. */
.checkpoint-page-container--tutor-hidden .is-block-selected .block-reset-size {
  right: 58px;
}

/* ── Alignment guides ────────────────────────────────────────────────────── */
.checkpoint-page-container--tutor-hidden .layout-guides {
  position: absolute;
  inset: 0;
  z-index: 7;
  pointer-events: none;
}

.checkpoint-page-container--tutor-hidden .layout-guide {
  position: absolute;
  background: rgba(255, 122, 0, 0.55);
}

.checkpoint-page-container--tutor-hidden .layout-guide--center {
  top: 0;
  bottom: 0;
  left: 50%;
  width: 1px;
}

.checkpoint-page-container--tutor-hidden .layout-guide--left {
  top: 0;
  bottom: 0;
  left: 0;
  width: 1px;
}

.checkpoint-page-container--tutor-hidden .layout-guide--right {
  top: 0;
  bottom: 0;
  right: 0;
  width: 1px;
}

/* A block being dragged must not fight the pointer with text selection. */
.checkpoint-page-container--tutor-hidden.is-resizing,
.checkpoint-page-container--tutor-hidden.is-resizing * {
  cursor: inherit;
  user-select: none;
}

.checkpoint-page-container--tutor-hidden.is-moving,
.checkpoint-page-container--tutor-hidden.is-moving * {
  user-select: none;
}

/* While a block is being moved the pointer must not turn into a text caret.
   NOTE: this must live in a :global() block — <body> is outside this
   component's template scope, so a scoped rule would never match it. */
:global(body.risse-is-dragging) {
  cursor: grabbing;
  user-select: none;
}

:global(body.risse-is-dragging *) {
  cursor: grabbing !important;
}

/* The empty state's "return" belongs to the roadmap; in the editor it means
 * "back to the module outline", which is exactly what the back arrow emits. */
.checkpoint-page-container--tutor-hidden .lesson-empty-state-card {
  padding: 40px 32px;
  border-radius: 12px;
  border-color: #e8edf4;
}

.checkpoint-page-container--tutor-hidden .empty-state-title {
  font-size: 21px;
  letter-spacing: -0.3px;
}

.checkpoint-page-container--tutor-hidden .empty-state-message {
  font-size: 15px;
  line-height: 1.7;
  max-width: 60ch;
}

.checkpoint-page-container--tutor-hidden .btn-return-roadmap {
  font-size: 13px;
}

/* Keep the editor usable on narrower viewports. */
@media (max-width: 900px) {
  .checkpoint-page-container--tutor-hidden .checkpoint-title {
    font-size: 26px;
  }

  .checkpoint-page-container--tutor-hidden .block-callout-card,
  .checkpoint-page-container--tutor-hidden .block-activity-card,
  .checkpoint-page-container--tutor-hidden .interactive-assessment-section {
    padding: 20px 20px;
  }

  .checkpoint-page-container--tutor-hidden .lesson-blocks-stream {
    gap: 14px;
  }

  .checkpoint-page-container--tutor-hidden .markdown-body,
  .checkpoint-page-container--tutor-hidden .lesson-markdown-content,
  .checkpoint-page-container--tutor-hidden .intro-text,
  .checkpoint-page-container--tutor-hidden .callout-content,
  .checkpoint-page-container--tutor-hidden .activity-content {
    font-size: 15px;
    line-height: 1.72;
  }
}

.checkpoint-main-column {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  transition: opacity 0.28s ease, transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
}

.checkpoint-page-container.is-chat-maximized .checkpoint-main-column {
  opacity: 0;
  pointer-events: none;
  transform: translateX(-30px);
}

/* Header */
.checkpoint-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  flex-shrink: 0;
  padding-right: 4px;
}

.checkpoint-header-left {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.btn-back-nav {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 18px;
  transition: color 0.2s, transform 0.2s;
}

.btn-back-nav:hover {
  color: #ff7a00;
  transform: translateX(-3px);
}

.checkpoint-title-group {
  display: flex;
  flex-direction: column;
}

.sub-category-tag {
  font-size: 13px;
  font-weight: 700;
  color: #ff7a00;
  margin-bottom: 2px;
}

.checkpoint-title {
  font-size: 28px;
  font-weight: 800;
  color: #181d24;
  letter-spacing: -0.5px;
  margin: 0 0 6px 0;
  line-height: 1.1;
}

.checkpoint-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 18px;
}

.btn-complete-checkpoint-action {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #ff7a00, #ea580c);
  color: #ffffff;
  border: none;
  border-radius: 9999px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(255, 122, 0, 0.25);
  font-family: inherit;
}

.btn-complete-checkpoint-action:hover {
  background: linear-gradient(135deg, #ff8c1a, #f97316);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 122, 0, 0.35);
}

.kebab-menu-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.checkpoint-dropdown-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04);
  padding: 4px;
  z-index: 100;
  min-width: 140px;
}

.checkpoint-dropdown-item {
  width: 100%;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: background 0.15s ease, color 0.15s ease;
}

.checkpoint-dropdown-item:hover {
  background: #f3f4f6;
  color: #111827;
}

.checkpoint-meta-badge-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.badge-beginner {
  background: #f59e0b;
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 9px;
  border-radius: 9999px;
}

.parent-module-text {
  font-size: 12.5px;
  color: #6b7280;
  font-weight: 500;
}

.btn-icon-control {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #1f2937;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s, transform 0.2s;
  border-radius: 6px;
}

.btn-icon-control:hover {
  color: #ff7a00;
  transform: scale(1.1);
}

.btn-icon-control.is-starred {
  color: #ff7a00;
}

/* Left: Educational Text Column */
.lesson-lecture-column {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 12px;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.lesson-lecture-column::-webkit-scrollbar {
  width: 5px;
}

.lesson-lecture-column::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 9999px;
}

.concepts-heading {
  font-size: 14.5px;
  font-weight: 800;
  color: #ff7a00;
  margin: 0 0 16px 0;
}

.concept-block {
  margin-bottom: 22px;
}

.concept-title {
  font-size: 14.5px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
  display: inline-block;
}

.dashed-underline {
  border-bottom: 1.5px dashed #9ca3af;
  padding-bottom: 2px;
}

.concept-text {
  font-size: 13.5px;
  color: #374151;
  line-height: 1.55;
  margin: 0 0 8px 0;
}

.concept-example {
  font-size: 13.5px;
  color: #374151;
  line-height: 1.55;
  margin: 0 0 8px 0;
}

.concept-key-idea {
  font-size: 13.5px;
  color: #374151;
  line-height: 1.55;
  margin: 0 0 8px 0;
}

/* Right: Chatbot Container Card */
.chatbot-panel-card {
  background: #ffffff;
  border: 1px solid #edf0f4;
  border-radius: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px;
  height: 100%;
  min-width: 0;
  overflow: hidden;
  box-sizing: border-box;
  transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
}

.checkpoint-page-container.is-chat-maximized .chatbot-panel-card {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  border-color: #e2e8f0;
}

.chatbot-header-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  flex-shrink: 0;
  gap: 8px;
}

.ai-mode-toggle-group {
  display: inline-flex;
  align-items: center;
  background: #f1f5f9;
  border-radius: 9999px;
  padding: 3px;
  gap: 2px;
  border: 1px solid #e2e8f0;
}

.ai-mode-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 9999px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  font-family: inherit;
  line-height: 1;
}

.ai-mode-pill-btn:hover {
  color: #1e293b;
}

.ai-mode-pill-btn.is-active {
  background: #ffffff;
  color: #ea580c;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.ai-mode-pill-btn.is-competition.is-active {
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.35);
}

.ai-mode-icon {
  font-size: 12px;
}

.ai-model-tag {
  font-size: 10px;
  font-weight: 700;
  color: #ff7a00;
  background: #fff7ed;
  padding: 2px 8px;
  border-radius: 6px;
  letter-spacing: 0.5px;
}

.btn-expand-chat {
  background: transparent;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.btn-expand-chat:hover {
  color: #111827;
}

/* Chat Messages */
.chatbot-messages-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 6px;
  margin-bottom: 14px;
  scrollbar-width: thin;
  scrollbar-color: #e2e8f0 transparent;
}

.chatbot-messages-scroll::-webkit-scrollbar {
  width: 4px;
}

.chatbot-messages-scroll::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 9999px;
}

.message-bubble {
  font-size: 13px;
  line-height: 1.5;
  border-radius: 16px;
  color: #1f2937;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.ai-message {
  background: #FCFCFC;
  border: 1px solid #EDEDF2;
  border-radius: 14px;
  padding: 12px 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.ai-greeting {
  font-weight: 600;
  margin-bottom: 8px;
}

.ai-message p {
  margin: 0 0 10px 0;
}

.ai-message p:last-child {
  margin-bottom: 0;
}

.bubble-text :deep(strong) {
  font-weight: 700;
  color: #111827;
}

.bubble-text :deep(.chat-inline-code) {
  background: #f1f5f9;
  padding: 1px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.9em;
  color: #0f172a;
}

.user-message {
  align-self: flex-end;
  background: #ff7a00;
  color: #ffffff;
  padding: 10px 14px;
  border-radius: 16px 16px 2px 16px;
  max-width: 85%;
}

.message-actions-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}

.btn-msg-tool {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  padding: 2px;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}

.btn-msg-tool:hover {
  color: #ff7a00;
}

/* Chat Input Area */
.chatbot-input-box {
  background: linear-gradient(180deg, #ffffff 50%, #fef3c7 100%);
  border: 1.5px solid #e2e8f0;
  border-radius: 18px;
  padding: 10px 14px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  box-shadow: 0 4px 12px rgba(254, 240, 138, 0.2);
  flex-shrink: 0;
}

.chat-text-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 13.5px;
  font-family: inherit;
  color: #1f2937;
  outline: none;
}

.chat-text-textarea {
  resize: none;
  min-height: 24px;
  max-height: 92px; /* up to 4 lines of text on uncollapsed AI, then scroll */
  overflow-y: auto;
  line-height: 1.45;
  scrollbar-width: thin;
  padding: 4px 0;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.checkpoint-page-container.is-chat-maximized .chat-text-textarea {
  max-height: 160px;
}

.chat-text-input::placeholder {
  color: #9ca3af;
}

.chat-input-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-attach,
.btn-send {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #4b5563;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s, transform 0.2s;
}

.btn-attach:hover {
  color: #ff7a00;
}

.btn-send:hover {
  color: #ff7a00;
  transform: translateX(1px);
}

.btn-send.is-disabled {
  opacity: 0.45;
  cursor: not-allowed;
  pointer-events: none;
}

.bubble-text {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.typing-indicator {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  background: #f3f4f6;
  border-radius: 12px;
}

.typing-dot {
  width: 6px;
  height: 6px;
  background: #ff7a00;
  border-radius: 50%;
  animation: typingBounce 1.4s infinite ease-in-out both;
}

.typing-dot:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typingBounce {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.send-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #ff7a00;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1024px) {
  .checkpoint-content-grid {
    grid-template-columns: 1fr;
    overflow-y: auto;
  }
  .chatbot-panel-card {
    height: 400px;
  }
}

/* ── Clean Section Styles for Generated Educational Content ──────────────── */
.lesson-empty-state-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 48px 24px;
  background: #f8fafc;
  border: 1.5px dashed #cbd5e1;
  border-radius: 12px;
  margin: 24px 0;
}

.empty-state-icon {
  font-size: 36px;
  margin-bottom: 12px;
}

.empty-state-title {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.empty-state-message {
  font-size: 14px;
  color: #64748b;
  max-width: 440px;
  line-height: 1.5;
  margin: 0 0 20px 0;
}

.btn-return-roadmap {
  background: #ff7a00;
  color: #ffffff;
  border: none;
  padding: 10px 20px;
  font-size: 13.5px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
}

.btn-return-roadmap:hover {
  background: #ea580c;
  transform: translateY(-1px);
}

.lesson-section-box {
  margin-bottom: 24px;
  padding: 18px 20px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}

.section-title {
  font-size: 15px;
  font-weight: 800;
  color: #ff7a00;
  margin: 0 0 12px 0;
  letter-spacing: -0.2px;
}

.intro-text {
  font-size: 14px;
  line-height: 1.6;
  color: #334155;
  margin: 0;
}

.intro-text :deep(p) {
  margin: 0 0 8px 0;
}

.intro-text :deep(p:last-child) {
  margin-bottom: 0;
}

.lesson-markdown-content {
  font-size: 13.5px;
  line-height: 1.65;
  color: #334155;
}

/* ── Mentor Inline Rich-Text Editing (Module Studio preview only) ─────────── */
.preview-mode-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  margin-right: 4px;
  border-radius: 9999px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  color: #9a3412;
  font-size: 11.5px;
  font-weight: 700;
  white-space: nowrap;
}

.lesson-section-box.is-inline-editable {
  position: relative;
}

.btn-inline-edit-hint {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 6px;
  padding: 2px 8px;
  border: 1px dashed #fdba74;
  border-radius: 9999px;
  background: #fff7ed;
  color: #c2410c;
  font-size: 10.5px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  opacity: 0.85;
  transition: background 0.15s ease, opacity 0.15s ease;
}

.btn-inline-edit-hint:hover {
  opacity: 1;
  background: #ffedd5;
}

.inline-editable-surface {
  cursor: text;
  border-radius: 8px;
  transition: box-shadow 0.15s ease, background 0.15s ease;
}

.inline-editable-surface:hover {
  background: #fffbf5;
  box-shadow: 0 0 0 1px #fed7aa;
}

/* Rich HTML emitted by the Word-style editor must match Markdown typography. */
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.callout-content :deep(h1),
.callout-content :deep(h2),
.callout-content :deep(h3),
.activity-content :deep(h1),
.activity-content :deep(h2),
.activity-content :deep(h3) {
  font-weight: 700;
  color: #0f172a;
  margin: 16px 0 8px 0;
  line-height: 1.35;
}

.markdown-body :deep(h1),
.callout-content :deep(h1),
.activity-content :deep(h1) { font-size: 16px; }
.markdown-body :deep(h2),
.callout-content :deep(h2),
.activity-content :deep(h2) { font-size: 15px; }
.markdown-body :deep(h3),
.callout-content :deep(h3),
.activity-content :deep(h3) { font-size: 14px; }

.markdown-body :deep(p),
.callout-content :deep(p),
.activity-content :deep(p) {
  margin: 0 0 10px 0;
  line-height: 1.65;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol),
.callout-content :deep(ul),
.callout-content :deep(ol),
.activity-content :deep(ul),
.activity-content :deep(ol) {
  margin: 0 0 12px 0;
  padding-left: 20px;
}

.markdown-body :deep(ul),
.callout-content :deep(ul),
.activity-content :deep(ul) { list-style-type: disc; }

.markdown-body :deep(ol),
.callout-content :deep(ol),
.activity-content :deep(ol) { list-style-type: decimal; }

.markdown-body :deep(li),
.callout-content :deep(li),
.activity-content :deep(li) {
  margin-bottom: 4px;
  line-height: 1.6;
}

.markdown-body :deep(mark),
.callout-content :deep(mark),
.activity-content :deep(mark) {
  border-radius: 3px;
  padding: 1px 2px;
}

.markdown-body :deep(img),
.callout-content :deep(img),
.activity-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  display: block;
  margin: 10px 0;
}

.markdown-body :deep(table),
.callout-content :deep(table),
.activity-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 10px 0;
  font-size: 12.5px;
}

.markdown-body :deep(th),
.markdown-body :deep(td),
.callout-content :deep(th),
.callout-content :deep(td),
.activity-content :deep(th),
.activity-content :deep(td) {
  border: 1px solid #e2e8f0;
  padding: 7px 10px;
  text-align: left;
  vertical-align: top;
}

.markdown-body :deep(th),
.callout-content :deep(th),
.activity-content :deep(th) {
  background: #f8fafc;
  font-weight: 700;
  color: #0f172a;
}

.lesson-markdown-content :deep(.md-h1),
.lesson-markdown-content :deep(.md-h2),
.lesson-markdown-content :deep(.md-h3) {
  font-weight: 700;
  color: #0f172a;
  margin: 16px 0 8px 0;
}

.lesson-markdown-content :deep(.md-h1) { font-size: 16px; }
.lesson-markdown-content :deep(.md-h2) { font-size: 15px; }
.lesson-markdown-content :deep(.md-h3) { font-size: 14px; }

.lesson-markdown-content :deep(.md-p) {
  margin: 0 0 10px 0;
}

.lesson-markdown-content :deep(.md-ul),
.lesson-markdown-content :deep(.md-ol) {
  margin: 0 0 12px 0;
  padding-left: 20px;
}

.lesson-markdown-content :deep(.md-ul) { list-style-type: disc; }
.lesson-markdown-content :deep(.md-ol) { list-style-type: decimal; }

.lesson-markdown-content :deep(.md-li) {
  margin-bottom: 4px;
}

.lesson-markdown-content :deep(.md-inline-code) {
  background: #f1f5f9;
  color: #0f172a;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12.5px;
  font-family: monospace;
}

.lesson-markdown-content :deep(.md-code-block) {
  background: #0f172a;
  color: #f8fafc;
  padding: 12px 14px;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 12.5px;
  margin: 10px 0;
}

.examples-list {
  margin: 0;
  padding-left: 18px;
  font-size: 13.5px;
  line-height: 1.6;
  color: #334155;
}

.examples-list li {
  margin-bottom: 6px;
}

.activity-card {
  background: #f8fafc;
  border-left: 3px solid #ff7a00;
  padding: 10px 14px;
  border-radius: 0 6px 6px 0;
  margin-bottom: 10px;
}

.activity-num {
  font-size: 12px;
  font-weight: 700;
  color: #ff7a00;
  text-transform: uppercase;
  display: block;
  margin-bottom: 4px;
}

.activity-text {
  font-size: 13.5px;
  line-height: 1.5;
  color: #1e293b;
  margin: 0;
}

.challenge-card {
  background: #fff7ed;
  border: 1px solid #ffedd5;
  padding: 12px 14px;
  border-radius: 8px;
  margin-bottom: 10px;
}

.challenge-badge {
  font-size: 11.5px;
  font-weight: 700;
  background: #ff7a00;
  color: #ffffff;
  padding: 2px 8px;
  border-radius: 9999px;
  display: inline-block;
  margin-bottom: 6px;
}

.challenge-text {
  font-size: 13.5px;
  color: #7c2d12;
  margin: 0;
  line-height: 1.5;
}

.quiz-question-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 14px 16px;
  border-radius: 8px;
  margin-bottom: 14px;
}

.question-title {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 10px 0;
}

.question-options {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}

.opt-item {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 13px;
  color: #334155;
  padding: 4px 8px;
  border-radius: 4px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
}

.opt-prefix {
  font-weight: 700;
  color: #64748b;
  min-width: 18px;
}

.question-explanation {
  font-size: 12.5px;
  color: #15803d;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  padding: 8px 12px;
  border-radius: 6px;
  line-height: 1.45;
}

.lesson-footer-citations {
  margin-top: 24px;
  padding-top: 14px;
  border-top: 1px solid #e2e8f0;
  font-size: 12px;
  color: #64748b;
}

.grounding-text {
  margin: 0;
}

/* ── SOURCE-FAITHFUL LESSON BLOCKS & INTERACTIVE ASSESSMENT STYLING ───────── */

.lesson-blocks-stream {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.block-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 10px 0;
}

.block-text-box {
  line-height: 1.65;
  color: #334155;
}

.block-callout-card {
  background: #f8fafc;
  border-left: 4px solid #f97316;
  border-radius: 8px;
  padding: 16px 20px;
}

.block-callout-card.is-analogy {
  background: #fffbeb;
  border-left-color: #f59e0b;
}

.callout-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.callout-title {
  font-size: 15px;
  font-weight: 700;
  color: #92400e;
  margin: 0;
}

.analogy-takeaway-box {
  margin-top: 12px;
  padding: 10px 14px;
  background: #fef3c7;
  border-radius: 6px;
  font-size: 13.5px;
  color: #78350f;
  line-height: 1.5;
}

.takeaway-label {
  font-weight: 700;
  margin-right: 6px;
}

.block-code-card {
  background: #0f172a;
  border-radius: 10px;
  overflow: hidden;
  color: #f8fafc;
  padding: 0;
}

.code-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #1e293b;
  border-bottom: 1px solid #334155;
}

.code-lang-badge {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  background: #334155;
  color: #f1f5f9;
  padding: 2px 8px;
  border-radius: 4px;
}

.code-title-text {
  font-size: 12.5px;
  color: #94a3b8;
  margin-left: 10px;
}

.btn-copy-code {
  background: #334155;
  color: #f8fafc;
  border: none;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-copy-code:hover {
  background: #475569;
}

.code-pre-block {
  margin: 0;
  padding: 16px;
  overflow-x: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13.5px;
  line-height: 1.55;
  color: #e2e8f0;
}

.code-caption-text {
  padding: 8px 16px 12px 16px;
  margin: 0;
  font-size: 12px;
  color: #94a3b8;
  font-style: italic;
  border-top: 1px solid #1e293b;
}

.interactive-assessment-section {
  background: #ffffff;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  margin-top: 24px;
}

.assessment-section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 1px solid #f1f5f9;
}

.assessment-icon {
  font-size: 28px;
}

.assessment-question-card {
  margin-bottom: 20px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.question-header {
  font-size: 14.5px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 14px 0;
  line-height: 1.45;
}

.mcq-options-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mcq-option-btn {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 14px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  border-radius: 6px;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.45;
  color: #334155;
}

.mcq-option-btn:hover {
  border-color: #f97316;
  background: #fff7ed;
}

.mcq-option-btn.is-selected {
  border-color: #ea580c;
  background: #ffedd5;
  font-weight: 600;
  color: #9a3412;
}

.mcq-option-btn.is-correct {
  border-color: #16a34a;
  background: #f0fdf4;
  color: #15803d;
}

.mcq-option-btn.is-incorrect {
  border-color: #dc2626;
  background: #fef2f2;
  color: #b91c1c;
}

.opt-key {
  font-weight: 700;
  min-width: 24px;
}

.assessment-feedback-alert {
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.45;
}

.assessment-feedback-alert.alert-success {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #065f46;
}

.assessment-feedback-alert.alert-danger {
  background: #fff1f2;
  border: 1px solid #fecdd3;
  color: #9f1239;
}

.feedback-status-pill {
  font-weight: 700;
  display: inline-block;
  margin-bottom: 4px;
}

.feedback-text {
  margin: 0;
}

.btn-submit-assessment {
  width: 100%;
  padding: 12px 20px;
  background: linear-gradient(135deg, #f97316, #ea580c);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(234, 88, 12, 0.25);
  transition: all 0.15s ease;
}

.btn-submit-assessment:hover {
  background: linear-gradient(135deg, #fb923c, #f97316);
  transform: translateY(-1px);
}
</style>
