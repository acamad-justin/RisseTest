<!-- frontend/resources/js/views/mentor/curriculum/CurriculumDesigner.vue -->
<template>
  <div class="curriculum-designer-page">
    <!-- Header -->
    <header class="page-header">
      <div>
        <div class="header-tag-row">
          <span class="badge-studio-ai">COURSE STUDIO</span>
          <span v-if="activeCourse" class="active-course-tag">{{ activeCourse.title }}</span>
          <span v-if="isDirty" class="badge-dirty-pill">● Unsaved edits</span>
        </div>
        <h1 class="page-title">Course Studio — Curriculum Designer & Review</h1>
        <p class="page-subtitle">
          Transform uploaded course materials into an engaging, structured curriculum. Review, personalize checkpoints, preview the student journey, and publish to assigned classes.
        </p>
      </div>

      <!-- Course Selector with Dirty Guard -->
      <div v-if="courses.length > 0" class="course-selector-wrap">
        <label for="select-curr-course" class="selector-label">Target Course:</label>
        <select 
          id="select-curr-course"
          :value="activeCourseId" 
          @change="handleSelectCourseChange($event.target.value)"
          class="course-select-input"
        >
          <option v-for="c in courses" :key="c.id" :value="c.id">
            {{ c.title }}
          </option>
        </select>
      </div>
    </header>

    <!-- Course Studio Header Banner -->
    <div v-if="activeCourse" class="course-studio-banner">
      <div class="banner-top-row">
        <div class="banner-title-block">
          <div class="banner-tag-row">
            <span class="badge-subject">{{ activeCourse.subject }}</span>
            <span class="badge-status" :class="`status-${activeCourse.status}`">
              {{ formatStatus(activeCourse.status) }}
            </span>
            <span v-if="isDirty" class="badge-dirty-pill">
              ● Unsaved changes
            </span>
          </div>
          <h2 class="banner-course-title">{{ activeCourse.title }}</h2>
          <p class="banner-course-desc">{{ activeCourse.description || 'No course overview description provided.' }}</p>
        </div>

        <div class="banner-stats-row">
          <div class="stat-pill">
            <span class="stat-label">Level:</span>
            <span class="stat-val">{{ activeCourse.academic_level }}</span>
          </div>
          <div class="stat-pill">
            <span class="stat-label">Materials:</span>
            <span class="stat-val">{{ materials.length }} attached</span>
          </div>
          <div class="stat-pill">
            <span class="stat-label">Modules:</span>
            <span class="stat-val">{{ totalModulesCount }}</span>
          </div>
          <div class="stat-pill">
            <span class="stat-label">Checkpoints:</span>
            <span class="stat-val">{{ totalCheckpointsCount }}</span>
          </div>
        </div>
      </div>

      <!-- Assigned Sections Row -->
      <div class="banner-sections-row">
        <span class="banner-sec-label">Assigned Sections:</span>
        <div v-if="activeCourse.assigned_sections && activeCourse.assigned_sections.length > 0" class="banner-sec-chips">
          <span 
            v-for="sec in activeCourse.assigned_sections" 
            :key="sec.id" 
            class="sec-chip"
          >
            {{ sec.name }} ({{ sec.code }})
          </span>
        </div>
        <span v-else class="text-muted-inline">None assigned — assign in My Courses or My Classes to grant student access.</span>
      </div>
    </div>

    <!-- 5-Stage Workflow Progression Tracker -->
    <div class="workflow-stepper">
      <div class="step-item" :class="{ completed: hasCourse, active: !hasMaterials }">
        <span class="step-num">1</span>
        <span class="step-label">Course Defined</span>
      </div>
      <div class="step-connector" :class="{ completed: hasMaterials }"></div>

      <div class="step-item" :class="{ completed: hasMaterials, active: hasMaterials && !proposal }">
        <span class="step-num">2</span>
        <span class="step-label">Materials Attached ({{ materials.length }})</span>
      </div>
      <div class="step-connector" :class="{ completed: Boolean(proposal) }"></div>

      <div class="step-item" :class="{ completed: Boolean(proposal), active: isGenerating }">
        <span class="step-num">3</span>
        <span class="step-label">Extraction & AI Proposal</span>
      </div>
      <div class="step-connector" :class="{ completed: isReviewed || isApproved }"></div>

      <div class="step-item" :class="{ completed: isApproved, active: Boolean(proposal) && !isApproved }">
        <span class="step-num">4</span>
        <span class="step-label">Review & Approval</span>
      </div>
      <div class="step-connector" :class="{ completed: isPublished }"></div>

      <div class="step-item" :class="{ completed: isPublished, active: isPublished }">
        <span class="step-num">5</span>
        <span class="step-label">Published Live</span>
      </div>
    </div>

    <!-- Empty Courses Guard -->
    <div v-if="courses.length === 0" class="designer-empty-card">
      <div class="empty-icon-circle">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#64748b" stroke-width="2">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
          <path d="M6 6h10"/>
          <path d="M6 10h10"/>
        </svg>
      </div>
      <h2 class="empty-title">No Course Selected</h2>
      <p class="empty-desc">Create a course to begin the curriculum transformation workflow.</p>
      <button type="button" class="btn-studio-primary" @click="$emit('navigate', 'create-course')">
        Create Course →
      </button>
    </div>

    <!-- Ready to Generate or Review Proposal -->
    <div v-else class="designer-workspace">
      <!-- Top Action Bar -->
      <div class="proposal-action-bar">
        <div class="status-summary">
          <div class="status-bullet" :class="`bullet-${currentStatus}`"></div>
          <div>
            <span class="status-title">Proposal Status: {{ formatStatus(currentStatus) }}</span>
            <span class="status-sub">
              {{ materials.length }} source document{{ materials.length !== 1 ? 's' : '' }} grounded in this proposal
            </span>
          </div>
        </div>

        <div class="proposal-actions-row">
          <!-- Button: Generate Draft -->
          <button 
            type="button" 
            class="btn-studio-secondary" 
            :disabled="isGenerating"
            @click="handleGenerateProposal"
          >
            <span v-if="isGenerating">Extracting & Generating...</span>
            <span v-else>↻ Regenerate Proposal</span>
          </button>

          <!-- Button: Add Teacher Module -->
          <button 
            v-if="proposal"
            type="button" 
            class="btn-studio-secondary"
            @click="addTeacherModule"
            title="Add a custom teacher module"
          >
            + Add Teacher Module
          </button>

          <!-- Button: Preview Student View -->
          <button 
            v-if="proposal"
            type="button" 
            class="btn-studio-secondary"
            @click="openStudentPreview"
            id="btn-preview-student"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            Preview Student Experience
          </button>

          <!-- Button: Save Draft -->
          <button 
            v-if="proposal"
            type="button" 
            class="btn-studio-secondary"
            :disabled="isSaving"
            @click="handleSaveEdits"
            title="Save draft edits to Supabase"
          >
            <span v-if="isSaving">Saving...</span>
            <span v-else-if="isDirty">● Save Draft</span>
            <span v-else>Save Draft</span>
          </button>

          <!-- Button: Approve Proposal -->
          <button 
            v-if="proposal && !isPublished && !isApproved"
            type="button" 
            class="btn-studio-secondary btn-approve-proposal"
            :disabled="isApproving"
            @click="handleApproveProposal"
            id="btn-approve-proposal"
            title="Approve curriculum architecture"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span v-if="isApproving">Approving...</span>
            <span v-else>Approve Proposal</span>
          </button>

          <span v-else-if="proposal && isApproved && !isPublished" class="approved-badge" id="badge-approved">
            ✓ Proposal Approved
          </span>

          <!-- Button: Approve & Publish -->
          <button 
            v-if="proposal && !isPublished"
            type="button" 
            class="btn-publish-curriculum"
            :disabled="isPublishing"
            @click="openPublishModal"
            id="btn-approve-publish"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span v-if="isPublishing">Publishing...</span>
            <span v-else>Publish to Sections</span>
          </button>

          <span v-else-if="isPublished" class="published-badge" id="badge-published">
            ✓ Published & Live
          </span>
        </div>
      </div>

      <!-- No Proposal Generated Yet -->
      <div v-if="!proposal && !isGenerating" class="ready-to-generate-box">
        <div class="ai-spark-art">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="var(--primary-orange, #F18701)" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </div>
        <h2 class="ready-title">Ready to Propose Curriculum Architecture</h2>
        <p class="ready-desc">
          RISSE AI Curriculum Designer analyzes your uploaded course materials ({{ materials.length }} attached) and syllabus learning outcomes to generate an interactive, student-ready curriculum.
        </p>

        <!-- Source Grounding & Course Objectives Showcase -->
        <div class="source-grounding-showcase">
          <div class="showcase-banner">
            <span class="showcase-badge">AI CURRICULUM DESIGNER</span>
            <h3 class="showcase-title">Course Context & Instructional Source Materials</h3>
            <p class="showcase-subtitle">
              Your generated curriculum will be strictly grounded in your course outcomes and uploaded teaching documents:
            </p>
          </div>

          <div v-if="materials.length > 0" class="attached-materials-grid">
            <div 
              v-for="mat in materials" 
              :key="mat.id" 
              class="attached-mat-card"
            >
              <div class="mat-card-icon">📄</div>
              <div class="mat-card-body">
                <h4 class="mat-card-title">{{ mat.title || mat.file_name }}</h4>
                <p class="mat-card-meta">{{ mat.file_name }} • {{ formatFileSize(mat.file_size) }}</p>
                <span class="mat-status-chip" :class="`status-${mat.status}`">Status: {{ mat.status }}</span>
              </div>
            </div>
          </div>
          <div v-else class="no-materials-tip-card">
            <div class="tip-icon">💡</div>
            <div class="tip-content">
              <strong>No materials uploaded yet.</strong>
              <p>You can generate an initial course structure from your course learning outcomes, or upload your syllabus, slides, or lecture notes first for document-grounded curriculum generation.</p>
            </div>
          </div>
        </div>

        <div class="ready-actions-row">
          <button 
            type="button" 
            class="btn-studio-primary btn-large" 
            :disabled="isGenerating"
            @click="handleGenerateProposal" 
            id="btn-generate-curriculum"
          >
            <span v-if="isGenerating" class="btn-spinner-row">
              <span class="spinner-sm"></span>
              Generating Proposed Curriculum...
            </span>
            <span v-else>
              Generate Proposed Curriculum →
            </span>
          </button>
          <button 
            v-if="materials.length === 0" 
            type="button" 
            class="btn-studio-secondary btn-large" 
            @click="$emit('navigate', 'materials')"
          >
            + Upload Teaching Materials First
          </button>
        </div>
      </div>

      <!-- Loading State during generation -->
      <div v-else-if="isGenerating" class="generating-state-box">
        <div class="spinner-pulse"></div>
        <h3 class="generating-title">Extracting Document Grounding & Structuring Modules...</h3>
        <p class="generating-desc">Formulating pedagogical sequence, learning objectives, interactive simulations, and engineering checkpoints.</p>
      </div>

      <!-- Teacher Review & Modification Studio -->
      <div v-else-if="proposal" class="proposal-editor-studio">
        <!-- Proposal Summary Box -->
        <div class="proposal-meta-card">
          <div class="meta-field-group">
            <label class="meta-label">Curriculum Proposal Title</label>
            <input 
              v-model="editableProposal.proposal_data.title" 
              class="input-proposal-title" 
              placeholder="Curriculum Title"
              @input="markDirty"
            />
          </div>
          <div class="meta-field-group">
            <label class="meta-label">Curriculum Architectural Summary</label>
            <textarea 
              v-model="editableProposal.proposal_data.summary" 
              rows="2" 
              class="textarea-proposal-summary"
              placeholder="Curriculum Summary"
              @input="markDirty"
            ></textarea>
          </div>
        </div>

        <!-- Modules Review List -->
        <div class="modules-review-list">
          <div 
            v-for="(mod, modIdx) in editableProposal.proposal_data.modules" 
            :key="mod.id || modIdx" 
            class="module-review-card"
          >
            <!-- Module Header Row -->
            <div class="module-header-row">
              <div class="mod-header-left">
                <span class="module-number-pill">Module {{ modIdx + 1 }}</span>
                <input 
                  v-model="mod.title" 
                  class="input-module-title" 
                  placeholder="Module Title"
                  @input="markDirty"
                />
              </div>

              <!-- Module Actions: Up, Down, Delete -->
              <div class="mod-header-actions">
                <button 
                  type="button" 
                  class="btn-mini-ctrl" 
                  :disabled="modIdx === 0" 
                  @click="moveModuleUp(modIdx)"
                  title="Move module up"
                >
                  ↑
                </button>
                <button 
                  type="button" 
                  class="btn-mini-ctrl" 
                  :disabled="modIdx === editableProposal.proposal_data.modules.length - 1" 
                  @click="moveModuleDown(modIdx)"
                  title="Move module down"
                >
                  ↓
                </button>
                <button 
                  type="button" 
                  class="btn-mini-ctrl btn-mini-delete" 
                  @click="deleteModule(modIdx)"
                  title="Delete module"
                >
                  🗑
                </button>
              </div>
            </div>

            <!-- Provenance & Grounding Tags -->
            <div class="provenance-tags-bar">
              <span class="provenance-label">Provenance:</span>
              <span 
                v-if="mod.provenance_type === 'grounded_in_materials' || (mod.source_materials && mod.source_materials.length > 0)" 
                class="provenance-chip chip-grounded"
              >
                <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Grounded in: {{ (mod.source_materials && mod.source_materials.join(', ')) || 'Uploaded Document' }}
              </span>
              <span 
                v-else-if="mod.provenance_type === 'aligned_with_foundation' || ['101','102','103','104','105','106'].includes(String(mod.id))" 
                class="provenance-chip chip-foundation"
              >
                ★ Aligned with Core Platform Module {{ mod.module_id || mod.id }}
              </span>
              <span v-else class="provenance-chip chip-suggestion">
                ✎ AI Suggestion — Review Recommended
              </span>

              <!-- Badge display -->
              <span class="badge-tag-pill" v-if="mod.badge_name">
                Badge: <strong>{{ mod.badge_name }}</strong>
              </span>
            </div>

            <!-- Description -->
            <textarea 
              v-model="mod.description" 
              rows="2" 
              class="textarea-module-desc"
              placeholder="Module Description"
              @input="markDirty"
            ></textarea>

            <!-- Learning Objectives Section -->
            <div class="objectives-sub-section">
              <div class="sub-head-row">
                <h4 class="sub-section-title">Core Learning Objectives</h4>
                <button 
                  type="button" 
                  class="btn-add-objective" 
                  @click="addObjective(mod)"
                >
                  + Add Objective
                </button>
              </div>

              <div class="objectives-list">
                <div 
                  v-for="(obj, oIdx) in mod.learning_objectives" 
                  :key="oIdx" 
                  class="objective-row"
                >
                  <span class="obj-bullet">▸</span>
                  <input 
                    v-model="mod.learning_objectives[oIdx]" 
                    class="input-objective-text" 
                    @input="markDirty"
                  />
                  <button 
                    type="button" 
                    class="btn-delete-obj" 
                    @click="deleteObjective(mod, oIdx)"
                  >
                    &times;
                  </button>
                </div>
              </div>
            </div>

            <!-- Attached Source Materials Selector -->
            <div v-if="materials.length > 0" class="source-materials-selector-box">
              <span class="sub-label">Associate Source Materials:</span>
              <div class="material-toggle-chips">
                <button
                  v-for="mat in materials"
                  :key="mat.id"
                  type="button"
                  class="mat-toggle-chip"
                  :class="{ 'is-selected': isMaterialAttached(mod, mat.file_name) }"
                  @click="toggleMaterialAttachment(mod, mat.file_name)"
                >
                  <span class="chip-check" v-if="isMaterialAttached(mod, mat.file_name)">✓</span>
                  <span>{{ mat.file_name }}</span>
                </button>
              </div>
            </div>

            <!-- Checkpoints / Micro-Lessons -->
            <div class="checkpoints-sub-section">
              <div class="sub-head-row">
                <h4 class="sub-section-title">Sequential Checkpoints & Challenges ({{ mod.checkpoints?.length || 0 }})</h4>
                <button 
                  type="button" 
                  class="btn-add-checkpoint" 
                  @click="addCheckpoint(mod)"
                >
                  + Add Checkpoint
                </button>
              </div>

              <div class="checkpoints-grid">
                <div 
                  v-for="(cp, cpIdx) in mod.checkpoints" 
                  :key="cp.id || cpIdx" 
                  class="checkpoint-card"
                >
                  <div class="cp-head">
                    <div class="cp-type-select-wrap">
                      <select 
                        v-model="cp.type" 
                        class="cp-type-select" 
                        :class="`type-${cp.type}`"
                        @change="markDirty"
                      >
                        <option value="concept">CONCEPT</option>
                        <option value="lab">LAB</option>
                        <option value="challenge">CHALLENGE</option>
                      </select>
                    </div>

                    <div class="cp-duration-wrap">
                      <input 
                        type="number" 
                        v-model.number="cp.estimated_minutes" 
                        class="input-cp-time" 
                        min="5" 
                        max="240"
                        @input="markDirty" 
                      />
                      <span class="unit-min">mins</span>
                    </div>

                    <!-- Checkpoint Move & Delete Controls -->
                    <div class="cp-controls-row">
                      <button 
                        type="button" 
                        class="btn-tiny-ctrl" 
                        :disabled="cpIdx === 0" 
                        @click="moveCheckpointUp(mod, cpIdx)"
                        title="Move checkpoint up"
                      >
                        ↑
                      </button>
                      <button 
                        type="button" 
                        class="btn-tiny-ctrl" 
                        :disabled="cpIdx === mod.checkpoints.length - 1" 
                        @click="moveCheckpointDown(mod, cpIdx)"
                        title="Move checkpoint down"
                      >
                        ↓
                      </button>
                      <button 
                        type="button" 
                        class="btn-tiny-ctrl btn-tiny-delete" 
                        @click="deleteCheckpoint(mod, cpIdx)"
                        title="Delete checkpoint"
                      >
                        &times;
                      </button>
                    </div>
                  </div>

                  <!-- Checkpoint Title -->
                  <input 
                    v-model="cp.title" 
                    class="input-cp-title" 
                    placeholder="Checkpoint Title"
                    @input="markDirty"
                  />

                  <!-- Checkpoint Description -->
                  <textarea 
                    v-model="cp.description" 
                    rows="2" 
                    class="textarea-cp-desc" 
                    placeholder="Activity instructions"
                    @input="markDirty"
                  ></textarea>

                  <!-- Interactive Activity Field -->
                  <div class="cp-extra-field">
                    <span class="extra-field-label">Interactive Simulation / Activity:</span>
                    <input 
                      v-model="cp.interactive_activity" 
                      class="input-extra-field" 
                      placeholder="e.g. Oscilloscope signal acquisition and breadboard test"
                      @input="markDirty"
                    />
                  </div>

                  <!-- Engineering Challenge Field -->
                  <div class="cp-extra-field">
                    <span class="extra-field-label">Hands-on Engineering Challenge:</span>
                    <input 
                      v-model="cp.engineering_challenge" 
                      class="input-extra-field" 
                      placeholder="e.g. Build, wire, and verify physical hardware criteria"
                      @input="markDirty"
                    />
                  </div>

                  <div class="cp-footer">
                    <span class="cp-index-sub">Step {{ modIdx + 1 }}.{{ cpIdx + 1 }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Add Module Bottom CTA -->
        <div class="add-module-bottom-bar">
          <button 
            type="button" 
            class="btn-studio-secondary btn-add-module-lg" 
            @click="addTeacherModule"
          >
            + Add Another Teacher Module
          </button>
        </div>

        <!-- Sticky Save Bar -->
        <div class="editor-save-bar">
          <div class="save-bar-info">
            <span v-if="isDirty" class="save-status-text text-amber">
              ● Unsaved revisions in studio
            </span>
            <span v-else class="save-status-text">
              {{ isSaving ? 'Saving changes...' : 'Revisions saved to database.' }}
            </span>
          </div>

          <div class="save-bar-actions">
            <button 
              type="button" 
              class="btn-studio-secondary" 
              @click="openStudentPreview"
            >
              Preview Student View
            </button>
            <button 
              type="button" 
              class="btn-studio-primary" 
              :disabled="isSaving"
              @click="handleSaveEdits"
            >
              {{ isSaving ? 'Saving...' : 'Save Draft Revisions' }}
            </button>
            <button 
              v-if="!isPublished"
              type="button" 
              class="btn-publish-curriculum" 
              @click="openPublishModal"
            >
              Approve & Publish Live →
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Student Experience Preview Modal -->
    <div v-if="isPreviewOpen && proposal" class="preview-modal-overlay" @click.self="isPreviewOpen = false">
      <div class="preview-modal-box">
        <div class="preview-modal-head">
          <div class="preview-title-col">
            <span class="student-view-tag">STUDENT EXPERIENCE PREVIEW (READ-ONLY SIMULATION)</span>
            <h3 class="preview-course-title">{{ editableProposal.proposal_data.title }}</h3>
          </div>
          <button type="button" class="btn-close-preview" @click="isPreviewOpen = false">&times;</button>
        </div>

        <div class="preview-modal-body">
          <p class="preview-explanation">
            This simulator displays exactly how enrolled students in your assigned sections will navigate this course. It is strictly read-only and does not mutate student records.
          </p>

          <!-- Module Cards Preview Grid -->
          <div class="sim-modules-catalog">
            <div 
              v-for="(mod, mIdx) in editableProposal.proposal_data.modules" 
              :key="mod.id || mIdx" 
              class="sim-module-card"
              :class="`theme-${mod.level_color || 'yellow'}`"
            >
              <div class="sim-card-top">
                <div class="sim-badge-row">
                  <span class="sim-level-badge">{{ mod.level || 'Beginner' }}</span>
                  <span class="sim-steps-count">{{ mod.checkpoints?.length || 3 }} Learning Steps</span>
                </div>
                <h4 class="sim-card-title">{{ mod.title }}</h4>
                <p class="sim-card-desc">{{ mod.description }}</p>
                <div class="sim-skills-acquired">
                  <strong>Skills:</strong> {{ (mod.learning_objectives || []).join(', ') || 'Robotics & Control' }}
                </div>
              </div>

              <!-- Sequential Checkpoints Flow -->
              <div class="sim-checkpoints-area">
                <h5 class="sim-subhead">Sequential Checkpoints</h5>
                <div class="sim-cp-pills-list">
                  <div 
                    v-for="(cp, cIdx) in mod.checkpoints" 
                    :key="cp.id || cIdx" 
                    class="sim-cp-pill"
                  >
                    <span class="cp-dot" :class="`dot-${cp.type}`"></span>
                    <span class="cp-text">{{ cIdx + 1 }}. {{ cp.title }} ({{ cp.type.toUpperCase() }})</span>
                  </div>
                </div>

                <!-- Simulation & Challenge Spotlight -->
                <div v-if="mod.checkpoints && mod.checkpoints[0]?.interactive_activity" class="sim-spotlight-box">
                  <strong>Sample Interactive Lab:</strong> {{ mod.checkpoints[0].interactive_activity }}
                </div>
                <div v-if="mod.checkpoints && mod.checkpoints[0]?.engineering_challenge" class="sim-spotlight-box spotlight-challenge">
                  <strong>Engineering Challenge:</strong> {{ mod.checkpoints[0].engineering_challenge }}
                </div>
              </div>
            </div>
          </div>

          <!-- AI Tutor Context Prompt Inspector -->
          <div class="ai-tutor-inspector-card">
            <div class="inspector-header" @click="isTutorInspectorOpen = !isTutorInspectorOpen">
              <div class="inspector-title-row">
                <span class="spark-icon">✦</span>
                <strong>AI Tutor Grounding Context Inspector</strong>
              </div>
              <span class="inspector-toggle-btn">{{ isTutorInspectorOpen ? 'Hide ▲' : 'Inspect ▼' }}</span>
            </div>

            <div v-if="isTutorInspectorOpen" class="inspector-content">
              <p class="inspector-desc">
                When students chat with the AI Tutor inside this course, this pedagogical context is provided to keep answers grounded in your course materials and checkpoints:
              </p>
              <pre class="tutor-prompt-preview">{{ generatedTutorContext }}</pre>
            </div>
          </div>
        </div>

        <div class="preview-modal-footer">
          <button type="button" class="btn-studio-secondary" @click="isPreviewOpen = false">
            Close Preview
          </button>
          <button 
            v-if="!isPublished"
            type="button" 
            class="btn-publish-curriculum" 
            @click="handlePublishFromPreview"
          >
            Approve & Publish Live →
          </button>
        </div>
      </div>
    </div>

    <!-- Approve & Publish Confirmation Modal -->
    <div v-if="isPublishModalOpen" class="preview-modal-overlay" @click.self="isPublishModalOpen = false">
      <div class="publish-confirm-dialog" @click.stop>
        <div class="dialog-header">
          <div class="dialog-icon-circle">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#059669" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div>
            <h3 class="dialog-title">Approve & Publish Curriculum</h3>
            <p class="dialog-sub">Verify publication parameters and section access.</p>
          </div>
        </div>

        <div class="dialog-body">
          <div class="publish-summary-card">
            <div class="summary-line">
              <span class="sum-k">Course:</span>
              <strong class="sum-v">{{ activeCourse?.title }}</strong>
            </div>
            <div class="summary-line">
              <span class="sum-k">Total Modules:</span>
              <span class="sum-v">{{ totalModulesCount }} modules</span>
            </div>
            <div class="summary-line">
              <span class="sum-k">Total Checkpoints:</span>
              <span class="sum-v">{{ totalCheckpointsCount }} checkpoints</span>
            </div>
            <div class="summary-line">
              <span class="sum-k">Estimated Learning Time:</span>
              <span class="sum-v">{{ estimatedCourseHours }} hours</span>
            </div>
          </div>

          <div class="publish-sections-notice">
            <h4 class="notice-headline">Sections Receiving Immediate Student Access:</h4>
            <div v-if="activeCourse?.assigned_sections && activeCourse.assigned_sections.length > 0" class="sec-roster-list">
              <div v-for="sec in activeCourse.assigned_sections" :key="sec.id" class="sec-roster-item">
                <span class="roster-name">{{ sec.name }} ({{ sec.code }})</span>
                <span class="roster-count">{{ sec.student_count || 0 }} enrolled students</span>
              </div>
            </div>
            <div v-else class="sec-roster-empty">
              ⚠ No sections currently assigned. The course will be marked published, but students will only see it once you assign sections in My Courses or My Classes.
            </div>
          </div>

          <p class="publish-disclaimer">
            Students in assigned sections will immediately see this course in their student modules catalog. The RISSE Foundation Curriculum (101–106) will remain intact.
          </p>
        </div>

        <div class="dialog-footer">
          <button type="button" class="btn-studio-secondary" @click="isPublishModalOpen = false">
            Cancel
          </button>
          <button 
            type="button" 
            class="btn-studio-primary btn-publish-confirm" 
            @click="executePublish"
          >
            Confirm & Publish Live
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  courses: {
    type: Array,
    default: () => [],
  },
  activeCourseId: {
    type: String,
    default: null,
  },
  activeCourse: {
    type: Object,
    default: null,
  },
  materials: {
    type: Array,
    default: () => [],
  },
  proposal: {
    type: Object,
    default: null,
  },
  isGenerating: {
    type: Boolean,
    default: false,
  },
  foundationModules: {
    type: Array,
    default: () => [],
  },
  mentorId: {
    type: String,
    required: true,
  },
});

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

const emit = defineEmits([
  'navigate',
  'select-course',
  'generate-proposal',
  'save-proposal',
  'approve-proposal',
  'publish-proposal',
]);

const isPreviewOpen = ref(false);
const isPublishModalOpen = ref(false);
const isTutorInspectorOpen = ref(false);
const isSaving = ref(false);
const isApproving = ref(false);
const isPublishing = ref(false);
const isDirty = ref(false);

const isApproved = computed(() => {
  return props.proposal?.status === 'approved' || currentStatus.value === 'approved' || isPublished.value;
});

function markDirty() {
  isDirty.value = true;
}

function handleKeydown(e) {
  if (e.key === 'Escape') {
    if (isPublishModalOpen.value) {
      isPublishModalOpen.value = false;
    } else if (isPreviewOpen.value) {
      isPreviewOpen.value = false;
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
  if (!props.activeCourseId && props.courses && props.courses.length > 0) {
    emit('select-course', props.courses[0].id);
  }
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});

const editableProposal = ref({
  proposal_data: {
    title: '',
    summary: '',
    modules: [],
  },
});

// Watch incoming proposal to keep local clone in sync
watch(
  () => props.proposal,
  newProp => {
    if (newProp && newProp.proposal_data) {
      editableProposal.value = JSON.parse(JSON.stringify(newProp));
      isDirty.value = false;
    } else {
      editableProposal.value = {
        proposal_data: {
          title: props.activeCourse ? `${props.activeCourse.title} — AI Curriculum Architecture` : '',
          summary: '',
          modules: [],
        },
      };
      isDirty.value = false;
    }
  },
  { immediate: true }
);

const hasCourse = computed(() => Boolean(props.activeCourseId));
const hasMaterials = computed(() => props.materials.length > 0);
const currentStatus = computed(() => props.proposal?.status || props.activeCourse?.status || 'draft');
const isPublished = computed(() => currentStatus.value === 'published');
const isReviewed = computed(() => currentStatus.value === 'under_review' || isPublished.value);

const totalModulesCount = computed(() => editableProposal.value?.proposal_data?.modules?.length || 0);

const totalCheckpointsCount = computed(() => {
  const mods = editableProposal.value?.proposal_data?.modules || [];
  return mods.reduce((sum, m) => sum + (m.checkpoints?.length || 0), 0);
});

const estimatedCourseHours = computed(() => {
  const mods = editableProposal.value?.proposal_data?.modules || [];
  let totalMinutes = 0;
  mods.forEach(m => {
    (m.checkpoints || []).forEach(cp => {
      totalMinutes += Number(cp.estimated_minutes) || 30;
    });
  });
  return (totalMinutes / 60).toFixed(1);
});

const generatedTutorContext = computed(() => {
  const course = props.activeCourse;
  const mods = editableProposal.value?.proposal_data?.modules || [];
  let ctx = `[COURSE CONTEXT: ${course?.title || 'Engineering Course'}]\n`;
  ctx += `Level: ${course?.academic_level || 'General'} | Subject: ${course?.subject || 'Engineering'}\n`;
  ctx += `Curriculum Modules (${mods.length}):\n`;
  mods.forEach((m, idx) => {
    ctx += `${idx + 1}. ${m.title} — Objectives: ${(m.learning_objectives || []).join(', ')}\n`;
    (m.checkpoints || []).forEach(cp => {
      ctx += `   - Checkpoint: ${cp.title} (${cp.type}) | Activity: ${cp.interactive_activity || 'Standard lab'}\n`;
    });
  });
  return ctx;
});

function formatStatus(status) {
  if (status === 'published') return 'Published';
  if (status === 'under_review' || status === 'review') return 'Under Review';
  return 'Draft';
}

function formatProposalStatus(status) {
  if (status === 'published') return 'Published to Students';
  if (status === 'under_review') return 'Under Mentor Review';
  return 'Draft Proposal';
}

function handleSelectCourseChange(newCourseId) {
  if (isDirty.value) {
    const ok = window.confirm('You have unsaved edits in this curriculum. Are you sure you want to discard them and switch courses?');
    if (!ok) return;
  }
  isDirty.value = false;
  emit('select-course', newCourseId);
}

function handleGenerateProposal() {
  const targetCourseId = props.activeCourseId 
    || props.activeCourse?.id 
    || (props.courses && props.courses[0]?.id);

  if (!targetCourseId) {
    alert('Please select or create a course before generating curriculum.');
    return;
  }

  if (isDirty.value) {
    const ok = window.confirm('Regenerating will replace manual modifications. Continue?');
    if (!ok) return;
  }

  emit('generate-proposal', {
    courseId: targetCourseId,
    mentorId: props.mentorId,
  });
}

function handleSaveEdits() {
  if (!props.proposal) return;
  isSaving.value = true;
  emit('save-proposal', {
    proposalId: props.proposal.id,
    proposalData: editableProposal.value.proposal_data,
  });
  setTimeout(() => {
    isSaving.value = false;
    isDirty.value = false;
  }, 400);
}

function handleApproveProposal() {
  if (!props.proposal) return;
  isApproving.value = true;
  emit('approve-proposal', {
    proposalId: props.proposal.id,
    mentorId: props.mentorId,
    proposalData: editableProposal.value.proposal_data,
  });
  setTimeout(() => {
    isApproving.value = false;
    isDirty.value = false;
  }, 400);
}

function openStudentPreview() {
  isPreviewOpen.value = true;
}

function openPublishModal() {
  // Validate curriculum before showing publish modal
  const data = editableProposal.value?.proposal_data;
  if (!data || !Array.isArray(data.modules) || data.modules.length === 0) {
    alert('Cannot publish curriculum: at least 1 module is required.');
    return;
  }

  for (let mIdx = 0; mIdx < data.modules.length; mIdx++) {
    const mod = data.modules[mIdx];
    if (!mod.title || !mod.title.trim()) {
      alert(`Module ${mIdx + 1} must have a valid title.`);
      return;
    }
    if (!Array.isArray(mod.checkpoints) || mod.checkpoints.length === 0) {
      alert(`Module "${mod.title}" must have at least 1 checkpoint.`);
      return;
    }
    for (let cIdx = 0; cIdx < mod.checkpoints.length; cIdx++) {
      const cp = mod.checkpoints[cIdx];
      if (!cp.title || !cp.title.trim()) {
        alert(`Checkpoint ${cIdx + 1} in "${mod.title}" must have a title.`);
        return;
      }
      if (!cp.type || !['concept', 'lab', 'challenge'].includes(cp.type)) {
        alert(`Checkpoint "${cp.title}" has an invalid type.`);
        return;
      }
    }
  }

  isPublishModalOpen.value = true;
}

function handlePublishFromPreview() {
  isPreviewOpen.value = false;
  openPublishModal();
}

function executePublish() {
  if (!props.proposal) return;
  isPublishModalOpen.value = false;
  emit('publish-proposal', {
    proposalId: props.proposal.id,
    mentorId: props.mentorId,
    proposalData: editableProposal.value.proposal_data,
  });
  isDirty.value = false;
}

// Module Modification Controls
function addTeacherModule() {
  const modNum = editableProposal.value.proposal_data.modules.length + 1;
  const modId = `mod-custom-teacher-${Date.now()}-${modNum}`;
  const defaultSources = props.materials.length > 0 ? [props.materials[0].file_name] : [];
  const provenance = defaultSources.length > 0 ? 'grounded_in_materials' : 'ai_suggestion';

  editableProposal.value.proposal_data.modules.push({
    id: modId,
    module_id: modId,
    module_number: modNum,
    title: `Module ${modNum}: Custom Teacher Topic`,
    description: 'Teacher-designed laboratory checkpoints and hands-on practical applications.',
    source_materials: defaultSources,
    provenance_type: provenance,
    learning_objectives: ['Practical Application', 'Hardware Verification'],
    badge_name: 'Custom Achiever',
    level: props.activeCourse?.academic_level || 'Intermediate',
    level_color: 'purple',
    checkpoints: [
      {
        id: `cp_${modId}_1`,
        step_number: 1,
        title: 'Foundational Principles',
        type: 'concept',
        description: 'Theoretical background and circuit principles.',
        estimated_minutes: 30,
        interactive_activity: 'Interactive simulator and conceptual review.',
        engineering_challenge: 'Verify circuit equations and safety margins.',
        suggested_resources: ['Reference Notes'],
        source_materials: defaultSources,
        provenance_type: provenance,
      },
      {
        id: `cp_${modId}_2`,
        step_number: 2,
        title: 'Hands-on Lab Verification',
        type: 'lab',
        description: 'Bench experimentation and physical prototyping.',
        estimated_minutes: 45,
        interactive_activity: 'Real-time sensor oscilloscope trace.',
        engineering_challenge: 'Assemble hardware prototype on breadboard.',
        suggested_resources: ['Bench Checklist'],
        source_materials: defaultSources,
        provenance_type: provenance,
      },
    ],
  });
  markDirty();
}

function deleteModule(modIdx) {
  if (confirm(`Remove Module ${modIdx + 1} from this curriculum?`)) {
    editableProposal.value.proposal_data.modules.splice(modIdx, 1);
    markDirty();
  }
}

function moveModuleUp(modIdx) {
  if (modIdx <= 0) return;
  const mods = editableProposal.value.proposal_data.modules;
  const temp = mods[modIdx];
  mods[modIdx] = mods[modIdx - 1];
  mods[modIdx - 1] = temp;
  markDirty();
}

function moveModuleDown(modIdx) {
  const mods = editableProposal.value.proposal_data.modules;
  if (modIdx >= mods.length - 1) return;
  const temp = mods[modIdx];
  mods[modIdx] = mods[modIdx + 1];
  mods[modIdx + 1] = temp;
  markDirty();
}

function addObjective(mod) {
  if (!mod.learning_objectives) mod.learning_objectives = [];
  mod.learning_objectives.push('New demonstrated learning outcome');
  markDirty();
}

function deleteObjective(mod, oIdx) {
  mod.learning_objectives.splice(oIdx, 1);
  markDirty();
}

function isMaterialAttached(mod, fileName) {
  return Array.isArray(mod.source_materials) && mod.source_materials.includes(fileName);
}

function toggleMaterialAttachment(mod, fileName) {
  if (!Array.isArray(mod.source_materials)) mod.source_materials = [];
  const idx = mod.source_materials.indexOf(fileName);
  if (idx >= 0) {
    mod.source_materials.splice(idx, 1);
  } else {
    mod.source_materials.push(fileName);
  }
  if (mod.source_materials.length > 0) {
    mod.provenance_type = 'grounded_in_materials';
  }
  markDirty();
}

// Checkpoint Controls
function addCheckpoint(mod) {
  const nextNum = (mod.checkpoints?.length || 0) + 1;
  const newCp = {
    id: `cp-custom-${Date.now()}-${nextNum}`,
    step_number: nextNum,
    title: `Checkpoint ${nextNum}: Laboratory Verification`,
    type: 'lab',
    description: 'Hands-on hardware troubleshooting and sensor validation.',
    estimated_minutes: 45,
    interactive_activity: 'Real-time oscilloscope signal acquisition.',
    engineering_challenge: 'Wire circuit and verify 0-5V logic transitions.',
    suggested_resources: ['Bench Guide'],
    source_materials: mod.source_materials || [],
    provenance_type: mod.provenance_type || 'ai_suggestion',
  };
  if (!mod.checkpoints) mod.checkpoints = [];
  mod.checkpoints.push(newCp);
  markDirty();
}

function deleteCheckpoint(mod, cpIdx) {
  if (mod.checkpoints.length <= 1) {
    alert('Each module must have at least 1 checkpoint.');
    return;
  }
  mod.checkpoints.splice(cpIdx, 1);
  markDirty();
}

function moveCheckpointUp(mod, cpIdx) {
  if (cpIdx <= 0) return;
  const temp = mod.checkpoints[cpIdx];
  mod.checkpoints[cpIdx] = mod.checkpoints[cpIdx - 1];
  mod.checkpoints[cpIdx - 1] = temp;
  markDirty();
}

function moveCheckpointDown(mod, cpIdx) {
  if (cpIdx >= mod.checkpoints.length - 1) return;
  const temp = mod.checkpoints[cpIdx];
  mod.checkpoints[cpIdx] = mod.checkpoints[cpIdx + 1];
  mod.checkpoints[cpIdx + 1] = temp;
  markDirty();
}
</script>

<style scoped>
.curriculum-designer-page {
  padding: 14px 18px 48px 10px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 14px;
  gap: 16px;
  flex-wrap: wrap;
}

.header-tag-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.badge-studio-ai {
  font-size: 10px;
  font-weight: 800;
  background: rgba(99, 102, 241, 0.15);
  color: #4f46e5;
  border: 1px solid rgba(99, 102, 241, 0.3);
  padding: 1px 7px;
  border-radius: 9999px;
  letter-spacing: 0.06em;
}

.active-course-tag {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--primary-orange, #F18701);
}

.badge-dirty-pill {
  font-size: 10.5px;
  font-weight: 700;
  color: #b45309;
  background: #fef3c7;
  border: 1px solid #fde68a;
  padding: 1px 7px;
  border-radius: 999px;
}

.page-title {
  font-family: var(--font-family-display, inherit);
  font-size: 20px;
  font-weight: 700;
  color: var(--text-heading, #1c222b);
  letter-spacing: -0.01em;
  margin: 0 0 2px 0;
}

.page-subtitle {
  font-size: 12px;
  color: var(--text-muted, #6b7280);
  margin: 0;
  max-width: 700px;
  line-height: 1.4;
}

.course-selector-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #ffffff;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.selector-label { font-size: 11.5px; font-weight: 600; color: #374151; }
.course-select-input {
  background: #ffffff;
  color: #111827;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 5px 10px;
  font-size: 12px;
  outline: none;
}

/* Course Studio Header Banner */
.course-studio-banner {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-left: 4px solid var(--primary-orange, #F18701);
  border-radius: 12px;
  padding: 14px 18px;
  margin-bottom: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.banner-top-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.banner-title-block {
  flex: 1;
}

.banner-tag-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.badge-subject {
  font-size: 10px;
  font-weight: 700;
  color: #2563eb;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  padding: 1px 6px;
  border-radius: 4px;
}

.badge-status {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
}

.status-published {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.status-draft {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
}

.status-review, .status-under_review {
  background: #fef3c7;
  color: #d97706;
  border: 1px solid #fde68a;
}

.banner-course-title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 4px 0;
}

.banner-course-desc {
  font-size: 12px;
  color: #4b5563;
  margin: 0;
  line-height: 1.45;
}

.banner-stats-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.stat-pill {
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 10.5px;
}

.stat-label { color: #64748b; font-weight: 500; }
.stat-val { color: #1e293b; font-weight: 700; }

.banner-sections-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid #f1f5f9;
  flex-wrap: wrap;
}

.banner-sec-label {
  font-size: 11px;
  font-weight: 600;
  color: #475569;
}

.banner-sec-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.sec-chip {
  font-size: 10.5px;
  font-weight: 600;
  color: #334155;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  padding: 1px 6px;
  border-radius: 4px;
}

.text-muted-inline {
  font-size: 11px;
  color: #94a3b8;
  font-style: italic;
}

/* 5-Stage Workflow Stepper */
.workflow-stepper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  border: 1px solid var(--border-card, #eef1f4);
  border-radius: 12px;
  padding: 10px 16px;
  margin-bottom: 16px;
  overflow-x: auto;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.step-item {
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0.55;
  transition: opacity 0.2s ease;
  white-space: nowrap;
}

.step-item.completed, .step-item.active { opacity: 1; }

.step-num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #475569;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-item.completed .step-num {
  background: #10b981;
  color: #ffffff;
}

.step-item.active .step-num {
  background: var(--primary-orange, #F18701);
  color: #ffffff;
}

.step-label { font-size: 11px; font-weight: 600; color: #1e293b; }

.step-connector {
  flex: 1;
  height: 2px;
  background: #e2e8f0;
  margin: 0 10px;
  min-width: 20px;
}

.step-connector.completed { background: #10b981; }

/* Empty Guard */
.designer-empty-card {
  background: #ffffff;
  border: 1px dashed #cbd5e1;
  border-radius: 14px;
  padding: 40px 24px;
  text-align: center;
  max-width: 550px;
  margin: 20px auto;
}

.empty-icon-circle {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
}

.empty-title { font-size: 16px; font-weight: 700; color: #111827; margin: 0 0 6px; }
.empty-desc { font-size: 12px; color: #64748b; margin: 0 0 16px; line-height: 1.45; }

/* Action Bar */
.proposal-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  border: 1px solid var(--border-card, #eef1f4);
  border-radius: 12px;
  padding: 10px 16px;
  margin-bottom: 16px;
  gap: 12px;
  flex-wrap: wrap;
}

.status-summary {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-bullet {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #94a3b8;
}

.bullet-published { background: #10b981; }
.bullet-under_review, .bullet-review { background: #f59e0b; }
.bullet-draft { background: #64748b; }

.status-title { font-size: 12.5px; font-weight: 700; color: #111827; display: block; }
.status-sub { font-size: 11px; color: #64748b; display: block; }

.proposal-actions-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-studio-primary {
  background: var(--primary-orange, #F18701);
  color: #ffffff;
  border: none;
  padding: 7px 14px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-studio-primary:hover {
  background: #d97706;
}

.btn-studio-secondary {
  background: #ffffff;
  border: 1px solid #d1d5db;
  color: #374151;
  padding: 7px 12px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-studio-secondary:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.btn-publish-curriculum {
  background: #059669;
  color: #ffffff;
  border: none;
  padding: 7px 14px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 1px 3px rgba(5, 150, 105, 0.25);
  transition: all 0.15s ease;
}

.btn-publish-curriculum:hover {
  background: #047857;
}

.published-badge {
  font-size: 11.5px;
  font-weight: 700;
  color: #059669;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  padding: 5px 12px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.approved-badge {
  font-size: 11.5px;
  font-weight: 700;
  color: #2563eb;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  padding: 5px 12px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.btn-approve-proposal {
  border-color: #bfdbfe;
  color: #1d4ed8;
}

.btn-approve-proposal:hover {
  background: #eff6ff;
  border-color: #93c5fd;
}

/* Ready to Generate */
.ready-to-generate-box {
  background: #ffffff;
  border: 1px solid var(--border-card, #eef1f4);
  border-radius: 14px;
  padding: 32px 24px;
  text-align: center;
  max-width: 860px;
  margin: 16px auto;
}

.ai-spark-art {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #fff7ed;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px;
}

.ready-title { font-size: 18px; font-weight: 700; color: #111827; margin: 0 0 6px; }
.ready-desc { font-size: 12.5px; color: #4b5563; margin: 0 0 20px; line-height: 1.5; }

/* Source Grounding Showcase */
.source-grounding-showcase {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 18px;
  margin: 0 0 24px 0;
  text-align: left;
}

.showcase-banner {
  margin-bottom: 14px;
}

.showcase-badge {
  display: inline-block;
  font-size: 9.5px;
  font-weight: 800;
  color: #0369a1;
  background: #e0f2fe;
  padding: 2px 8px;
  border-radius: 4px;
  margin-bottom: 6px;
  letter-spacing: 0.04em;
}

.showcase-title {
  font-size: 13.5px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 3px 0;
}

.showcase-subtitle {
  font-size: 11.5px;
  color: #64748b;
  margin: 0;
}

.attached-materials-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

@media (max-width: 768px) {
  .attached-materials-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 520px) {
  .attached-materials-grid {
    grid-template-columns: 1fr;
  }
}

.attached-mat-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.attached-mat-card:hover {
  transform: translateY(-1px);
  border-color: #cbd5e1;
}

.mat-card-icon {
  font-size: 20px;
  line-height: 1;
}

.mat-card-body {
  flex: 1;
  min-width: 0;
}

.mat-card-title {
  font-size: 12.5px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 3px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mat-card-meta {
  font-size: 10.5px;
  color: #64748b;
  margin: 0 0 6px 0;
}

.mat-status-chip {
  display: inline-block;
  font-size: 9.5px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
}

.status-ready {
  background: #dcfce7;
  color: #166534;
}

.status-processing, .status-uploaded {
  background: #fef9c3;
  color: #854d0e;
}

.status-error {
  background: #fee2e2;
  color: #991b1b;
}

.no-materials-tip-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: #eff6ff;
  border: 1px dashed #93c5fd;
  border-radius: 8px;
  padding: 14px 16px;
  font-size: 12px;
  color: #1e40af;
  line-height: 1.5;
}

.tip-icon {
  font-size: 20px;
  line-height: 1;
}

.tip-content strong {
  display: block;
  font-weight: 700;
  margin-bottom: 2px;
  color: #1e3a8a;
}

.tip-content p {
  margin: 0;
  color: #2563eb;
}

.btn-spinner-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.spinner-sm {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.ready-actions-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-large {
  padding: 9px 18px;
  font-size: 13px;
}

/* Generating State */
.generating-state-box {
  background: #ffffff;
  border: 1px solid var(--border-card, #eef1f4);
  border-radius: 14px;
  padding: 48px 24px;
  text-align: center;
  max-width: 600px;
  margin: 20px auto;
}

.spinner-pulse {
  width: 38px;
  height: 38px;
  border: 3px solid #fde68a;
  border-top-color: var(--primary-orange, #F18701);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.generating-title { font-size: 15px; font-weight: 700; color: #111827; margin: 0 0 6px; }
.generating-desc { font-size: 12px; color: #64748b; margin: 0; }

/* Proposal Editor Studio */
.proposal-editor-studio {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.proposal-meta-card {
  background: #ffffff;
  border: 1px solid var(--border-card, #eef1f4);
  border-radius: 12px;
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.meta-field-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-label {
  font-size: 11px;
  font-weight: 700;
  color: #475569;
}

.input-proposal-title {
  font-size: 15px;
  font-weight: 700;
  color: #111827;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 6px 10px;
  outline: none;
}

.input-proposal-title:focus, .textarea-proposal-summary:focus {
  border-color: var(--primary-orange, #F18701);
}

.textarea-proposal-summary {
  font-size: 12px;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 8px 10px;
  resize: vertical;
  outline: none;
  font-family: inherit;
}

/* Modules Review List */
.modules-review-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.module-review-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px 18px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.module-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.mod-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.module-number-pill {
  font-size: 11px;
  font-weight: 700;
  color: #4f46e5;
  background: #eef2ff;
  border: 1px solid #c7d2fe;
  padding: 3px 8px;
  border-radius: 6px;
  white-space: nowrap;
}

.input-module-title {
  flex: 1;
  font-size: 14.5px;
  font-weight: 700;
  color: #111827;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 5px 10px;
  outline: none;
}

.input-module-title:focus {
  border-color: var(--primary-orange, #F18701);
}

.mod-header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-mini-ctrl {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  color: #475569;
  padding: 4px 8px;
  border-radius: 5px;
  font-size: 11px;
  cursor: pointer;
  font-weight: 700;
}

.btn-mini-ctrl:hover:not(:disabled) {
  background: #e2e8f0;
  color: #1e293b;
}

.btn-mini-ctrl:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-mini-delete:hover {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #dc2626;
}

.provenance-tags-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.provenance-label {
  font-size: 10.5px;
  font-weight: 600;
  color: #64748b;
}

.provenance-chip {
  font-size: 10.5px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.chip-grounded {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.chip-foundation {
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
}

.chip-suggestion {
  background: #fffbeb;
  color: #b45309;
  border: 1px solid #fde68a;
}

.badge-tag-pill {
  font-size: 10.5px;
  color: #6366f1;
  background: #eef2ff;
  border: 1px solid #e0e7ff;
  padding: 2px 7px;
  border-radius: 4px;
}

.textarea-module-desc {
  width: 100%;
  font-size: 12px;
  color: #374151;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 8px 10px;
  resize: vertical;
  margin-bottom: 12px;
  font-family: inherit;
  box-sizing: border-box;
}

/* Learning Objectives */
.objectives-sub-section {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 12px;
}

.sub-head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.sub-section-title {
  font-size: 12px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.btn-add-objective {
  background: transparent;
  border: none;
  font-size: 11px;
  font-weight: 600;
  color: var(--primary-orange, #F18701);
  cursor: pointer;
}

.objectives-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.objective-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.obj-bullet { color: #f59e0b; font-size: 12px; }

.input-objective-text {
  flex: 1;
  font-size: 11.5px;
  color: #374151;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  border-radius: 4px;
  padding: 3px 8px;
}

.btn-delete-obj {
  background: transparent;
  border: none;
  font-size: 14px;
  color: #94a3b8;
  cursor: pointer;
  padding: 0 4px;
}

.btn-delete-obj:hover { color: #ef4444; }

/* Attached materials */
.source-materials-selector-box {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.sub-label {
  font-size: 11px;
  font-weight: 600;
  color: #475569;
}

.material-toggle-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.mat-toggle-chip {
  font-size: 10.5px;
  padding: 2px 7px;
  border-radius: 4px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #475569;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.mat-toggle-chip.is-selected {
  background: #eff6ff;
  border-color: #3b82f6;
  color: #1d4ed8;
  font-weight: 600;
}

.chip-check { font-weight: 700; color: #10b981; }

/* Checkpoints Sub Section */
.checkpoints-sub-section {
  border-top: 1px solid #f1f5f9;
  padding-top: 10px;
}

.btn-add-checkpoint {
  background: transparent;
  border: none;
  font-size: 11px;
  font-weight: 600;
  color: var(--primary-orange, #F18701);
  cursor: pointer;
}

.checkpoints-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  margin-top: 8px;
}

.checkpoint-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cp-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.cp-type-select {
  font-size: 9.5px;
  font-weight: 800;
  border-radius: 4px;
  padding: 2px 5px;
  outline: none;
  cursor: pointer;
}

.cp-type-select.type-concept {
  background: #e0f2fe;
  color: #0369a1;
  border: 1px solid #bae6fd;
}

.cp-type-select.type-lab {
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
}

.cp-type-select.type-challenge {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.cp-duration-wrap {
  display: flex;
  align-items: center;
  gap: 2px;
}

.input-cp-time {
  width: 38px;
  font-size: 10.5px;
  font-weight: 700;
  color: #1e293b;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 1px 4px;
  text-align: center;
}

.unit-min { font-size: 10px; color: #64748b; }

.cp-controls-row {
  display: flex;
  align-items: center;
  gap: 2px;
}

.btn-tiny-ctrl {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #475569;
  border-radius: 3px;
  font-size: 9.5px;
  padding: 1px 5px;
  cursor: pointer;
  font-weight: 700;
}

.btn-tiny-delete:hover {
  background: #fee2e2;
  color: #dc2626;
  border-color: #fca5a5;
}

.input-cp-title {
  font-size: 12.5px;
  font-weight: 700;
  color: #111827;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  border-radius: 4px;
  padding: 4px 8px;
  outline: none;
}

.textarea-cp-desc {
  font-size: 11px;
  color: #475569;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  border-radius: 4px;
  padding: 4px 8px;
  resize: vertical;
  font-family: inherit;
}

.cp-extra-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.extra-field-label {
  font-size: 10px;
  font-weight: 600;
  color: #64748b;
}

.input-extra-field {
  font-size: 11px;
  color: #1e293b;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  border-radius: 4px;
  padding: 3px 6px;
}

.cp-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: 2px;
}

.cp-index-sub {
  font-size: 9.5px;
  font-weight: 600;
  color: #94a3b8;
}

.add-module-bottom-bar {
  text-align: center;
  padding: 14px 0;
}

.btn-add-module-lg {
  padding: 8px 18px;
  font-size: 12.5px;
  font-weight: 700;
}

/* Sticky Save Bar */
.editor-save-bar {
  position: sticky;
  bottom: 12px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  z-index: 20;
}

.save-status-text {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
}

.text-amber { color: #d97706; }

.save-bar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Preview Modal */
.preview-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
  backdrop-filter: blur(2px);
}

.preview-modal-box {
  background: #ffffff;
  border-radius: 14px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
}

.preview-modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
}

.student-view-tag {
  font-size: 10px;
  font-weight: 800;
  color: #2563eb;
  letter-spacing: 0.06em;
}

.preview-course-title {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  margin: 2px 0 0 0;
}

.btn-close-preview {
  background: transparent;
  border: none;
  font-size: 22px;
  color: #94a3b8;
  cursor: pointer;
}

.preview-modal-body {
  padding: 16px 20px;
  overflow-y: auto;
}

.preview-explanation {
  font-size: 12px;
  color: #64748b;
  margin: 0 0 16px 0;
}

.sim-modules-catalog {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 18px;
}

.sim-module-card {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 14px 16px;
  background: #ffffff;
}

.sim-module-card.theme-yellow { border-left: 4px solid #f59e0b; }
.sim-module-card.theme-pink { border-left: 4px solid #ec4899; }
.sim-module-card.theme-purple { border-left: 4px solid #8b5cf6; }

.sim-badge-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.sim-level-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
  background: #f1f5f9;
  color: #334155;
}

.sim-steps-count {
  font-size: 10.5px;
  color: #64748b;
}

.sim-card-title {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 4px 0;
}

.sim-card-desc {
  font-size: 11.5px;
  color: #4b5563;
  margin: 0 0 6px 0;
  line-height: 1.4;
}

.sim-skills-acquired {
  font-size: 11px;
  color: #475569;
  margin-bottom: 10px;
}

.sim-checkpoints-area {
  background: #f8fafc;
  border-radius: 8px;
  padding: 10px 12px;
}

.sim-subhead {
  font-size: 11px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 6px 0;
}

.sim-cp-pills-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.sim-cp-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 10.5px;
}

.cp-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.dot-concept { background: #0284c7; }
.dot-lab { background: #059669; }
.dot-challenge { background: #dc2626; }

.sim-spotlight-box {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 11px;
  color: #334155;
  margin-top: 4px;
}

.spotlight-challenge {
  background: #fff1f2;
  border-color: #fecdd3;
  color: #9f1239;
}

/* AI Tutor Inspector */
.ai-tutor-inspector-card {
  border: 1px solid #c7d2fe;
  background: #f5f3ff;
  border-radius: 10px;
  overflow: hidden;
}

.inspector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  cursor: pointer;
  background: #ede9fe;
}

.inspector-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #4338ca;
}

.spark-icon { color: #6366f1; }
.inspector-toggle-btn { font-size: 11px; color: #4338ca; font-weight: 700; }

.inspector-content {
  padding: 12px 14px;
}

.inspector-desc {
  font-size: 11px;
  color: #4b5563;
  margin: 0 0 8px 0;
}

.tutor-prompt-preview {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10.5px;
  background: #ffffff;
  border: 1px solid #ddd6fe;
  border-radius: 6px;
  padding: 10px;
  white-space: pre-wrap;
  margin: 0;
  max-height: 180px;
  overflow-y: auto;
  color: #312e81;
}

.preview-modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

/* Publish Confirm Dialog */
.publish-confirm-dialog {
  background: #ffffff;
  border-radius: 14px;
  width: 100%;
  max-width: 520px;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
}

.dialog-icon-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #ecfdf5;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.dialog-title { font-size: 16px; font-weight: 700; color: #111827; margin: 0; }
.dialog-sub { font-size: 11.5px; color: #64748b; margin: 2px 0 0 0; }

.dialog-body {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.publish-summary-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 14px;
}

.summary-line {
  display: flex;
  justify-content: space-between;
  font-size: 11.5px;
  padding: 3px 0;
}

.sum-k { color: #64748b; }
.sum-v { color: #111827; }

.publish-sections-notice {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 10px 12px;
}

.notice-headline {
  font-size: 11.5px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 6px 0;
}

.sec-roster-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sec-roster-item {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
}

.roster-name { font-weight: 600; color: #334155; }
.roster-count { color: #059669; font-weight: 600; }

.sec-roster-empty {
  font-size: 11px;
  color: #b45309;
  line-height: 1.4;
}

.publish-disclaimer {
  font-size: 11px;
  color: #64748b;
  margin: 0;
  line-height: 1.4;
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid #f1f5f9;
  background: #f8fafc;
}

.btn-publish-confirm {
  background: #059669;
}

.btn-publish-confirm:hover {
  background: #047857;
}
</style>
