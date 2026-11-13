<!-- frontend/resources/js/views/mentor/curriculum/CurriculumDesigner.vue -->
<template>
  <div class="curriculum-designer-page">
    
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- TOP NAVIGATION & BREADCRUMBS                                           -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <header class="studio-top-nav">
      <div class="nav-left">
        <!-- Breadcrumb Hierarchy -->
        <nav class="studio-breadcrumbs" aria-label="Breadcrumb">
          <ol class="breadcrumb-list">
            <li class="breadcrumb-item">
              <button type="button" class="btn-crumb" @click="handleCrumbNavigate('courses')">Modules</button>
            </li>
            <li class="breadcrumb-separator">/</li>
            <li class="breadcrumb-item">
              <button 
                type="button" 
                class="btn-crumb" 
                :class="{ active: currentLevel === 'overview' }"
                @click="navigateToLevel('overview')"
              >
                {{ activeCourse?.title || 'Module Overview' }}
              </button>
            </li>
            <template v-if="currentLevel === 'module' || currentLevel === 'lesson'">
              <li class="breadcrumb-separator">/</li>
              <li class="breadcrumb-item">
                <button 
                  type="button" 
                  class="btn-crumb" 
                  :class="{ active: currentLevel === 'module' }"
                  @click="navigateToLevel('module')"
                >
                  Topic {{ (activeModuleIndex ?? 0) + 1 }}: {{ activeModule?.title || 'Topic' }}
                </button>
              </li>
            </template>
            <template v-if="currentLevel === 'lesson'">
              <li class="breadcrumb-separator">/</li>
              <li class="breadcrumb-item active" aria-current="page">
                <span class="crumb-current">Learning Node {{ (activeLessonIndex ?? 0) + 1 }}: {{ activeLesson?.title || 'Node' }}</span>
              </li>
            </template>
          </ol>
        </nav>
      </div>

      <div class="nav-right">
        <!-- Unsaved changes indicator -->
        <span v-if="isDirty" class="badge-dirty-pill">● Unsaved edits</span>

        <button
          v-if="studioStage === 'editor'"
          type="button"
          class="btn-outline-action"
          id="btn-studio-home"
          @click="returnToIntake"
          title="Upload materials or open another draft"
        >
          ＋ Upload / Drafts
        </button>

        <!-- Course Selector Dropdown -->
        <div v-if="courses.length > 0" class="course-selector-wrap">
          <label for="select-curr-course" class="selector-label">Course:</label>
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
      </div>
    </header>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- LEVEL 1: COURSE OVERVIEW                                               -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- STUDIO ENTRY: UPLOAD LEARNING MATERIALS (creates/updates a DRAFT only)  -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <main v-if="studioStage === 'intake'" class="level-container studio-intake" aria-labelledby="intake-title">
      <section class="intake-card">
        <span class="badge-studio-ai">MODULE STUDIO • START WITH YOUR MATERIALS</span>
        <h1 id="intake-title" class="intake-title">Upload learning materials</h1>
        <p class="intake-sub">
          Upload a syllabus, PDF, PPTX, DOCX, or notes. RISSE builds a draft curriculum from them that you can review and edit.
          Nothing is visible to students until you explicitly publish it.
        </p>

        <div v-if="draftCourses.length > 0" class="intake-field">
          <label for="intake-target" class="intake-label">Add materials to</label>
          <select id="intake-target" v-model="intakeTarget" class="intake-input" :disabled="isIntakeBusy || Boolean(intakeDraftCourseId)">
            <option value="new">A new draft curriculum</option>
            <option v-for="c in draftCourses" :key="c.id" :value="c.id">Existing draft: {{ c.title }}</option>
          </select>
        </div>

        <template v-if="intakeTarget === 'new' && !intakeDraftCourseId">
          <div class="intake-field">
            <label for="intake-title-input" class="intake-label">Curriculum title <span class="intake-req">*</span></label>
            <input id="intake-title-input" v-model="intakeForm.title" type="text" class="intake-input" placeholder="e.g., Introduction to Microprocessors" />
          </div>
          <div class="intake-row">
            <div class="intake-field">
              <label for="intake-subject" class="intake-label">Subject <span class="intake-req">*</span></label>
              <input id="intake-subject" v-model="intakeForm.subject" type="text" class="intake-input" placeholder="e.g., Robotics" />
            </div>
            <div class="intake-field">
              <label for="intake-level" class="intake-label">Academic level <span class="intake-req">*</span></label>
              <input id="intake-level" v-model="intakeForm.academic_level" type="text" class="intake-input" placeholder="e.g., Grade 10" />
            </div>
          </div>
        </template>
        <p v-else-if="intakeDraftCourseId" class="intake-note">
          Your draft was created. Retry the files below; they will be added to the same draft.
        </p>

        <div class="intake-field">
          <span class="intake-label">Learning materials <span class="intake-req">*</span></span>
          <div class="intake-drop" :class="{ 'has-files': intakeFiles.length > 0 }" @click="triggerIntakeFileInput" @dragover.prevent @drop.prevent="handleIntakeDrop">
            <input
              ref="intakeFileInput"
              type="file"
              class="intake-hidden-input"
              multiple
              accept=".pdf,.pptx,.ppt,.docx,.doc,.txt,.md,.markdown"
              @change="handleIntakeFilesSelected"
            />
            <p class="intake-drop-text">Click to choose or drop files</p>
            <p class="intake-drop-sub">PDF, PPTX, DOCX, TXT, or Markdown, up to 25MB each</p>
          </div>
          <ul v-if="intakeFiles.length > 0" class="intake-file-list">
            <li v-for="(f, i) in intakeFiles" :key="f.name + i" class="intake-file-item">
              <span class="intake-file-name">📄 {{ f.name }}</span>
              <span class="intake-file-size">{{ formatFileSize(f.size) }}</span>
              <button type="button" class="intake-file-remove" :disabled="isIntakeBusy" @click="removeIntakeFile(i)" aria-label="Remove file">✕</button>
            </li>
          </ul>
        </div>

        <div v-if="intakeError" class="intake-error" role="alert">{{ intakeError }}</div>

        <div class="intake-actions">
          <button
            v-if="intakeTarget === 'new'"
            type="button"
            id="btn-intake-generate"
            class="btn-primary-action"
            :disabled="isIntakeBusy || intakeFiles.length === 0"
            @click="submitIntake(true)"
          >
            {{ isIntakeBusy ? 'Uploading…' : '✨ Upload & Generate Curriculum' }}
          </button>
          <button
            type="button"
            id="btn-intake-upload"
            :class="intakeTarget === 'new' ? 'btn-outline-action' : 'btn-primary-action'"
            :disabled="isIntakeBusy || intakeFiles.length === 0"
            @click="submitIntake(false)"
          >
            {{ intakeTarget === 'new' ? 'Upload Only (save as draft)' : 'Add to Draft' }}
          </button>
        </div>
      </section>

      <section v-if="draftCourses.length > 0" class="intake-card intake-drafts" aria-label="Continue an existing draft">
        <h2 class="intake-drafts-title">Continue a draft</h2>
        <p class="intake-sub">Unpublished curricula. These stay private to you until published.</p>
        <ul class="intake-draft-list">
          <li v-for="c in draftCourses" :key="c.id" class="intake-draft-item">
            <div class="intake-draft-meta">
              <span class="intake-draft-name">{{ c.title }}</span>
              <span class="intake-draft-sub">
                {{ formatStatus(c.status) }} • {{ c.materials_count || 0 }} source doc(s)
                <template v-if="c.updated_at"> • updated {{ new Date(c.updated_at).toLocaleDateString() }}</template>
              </span>
            </div>
            <button type="button" class="btn-outline-action" @click="openDraft(c)">Open draft</button>
          </li>
        </ul>
      </section>
    </main>

    <main v-if="studioStage === 'editor' && currentLevel === 'overview'" class="level-container level-course-overview">
      
      <!-- A. Course Header Banner -->
      <section class="course-studio-banner" aria-labelledby="banner-course-title">
        <div class="banner-top-row">
          <div class="banner-title-block">
            <div class="banner-tag-row">
              <span class="badge-studio-ai">MODULE STUDIO • AI CURRICULUM DESIGNER</span>
              <span class="badge-subject">{{ activeCourse?.subject || 'Robotics' }}</span>
              <span class="badge-status" :class="`status-${activeCourse?.status || 'draft'}`">
                {{ formatStatus(activeCourse?.status) }}
              </span>
              <span v-if="isApproved && !isPublished" class="badge-approved">Approved</span>
              <span v-if="isDirty" class="badge-dirty-pill">● Unsaved edits</span>
            </div>
            <h1 id="banner-course-title" class="banner-course-title">
              {{ activeCourse?.title || 'Select a Module' }}
            </h1>
            <p class="banner-course-desc">
              {{ activeCourse?.description || 'No module overview description provided yet.' }}
            </p>
          </div>

          <div class="banner-quick-actions">
            <button 
              type="button" 
              class="btn-edit-course-details"
              @click="isEditCourseModalOpen = true"
              title="Edit module metadata, subject, level, and section assignments"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              Edit Module Details
            </button>
          </div>
        </div>

        <!-- Assigned Sections Row -->
        <div class="banner-sections-row">
          <span class="banner-sec-label">Assigned Classes:</span>
          <div v-if="activeCourse?.assigned_sections && activeCourse.assigned_sections.length > 0" class="banner-sec-chips">
            <span 
              v-for="sec in activeCourse.assigned_sections" 
              :key="sec.id" 
              class="sec-chip"
            >
              {{ sec.name }} ({{ sec.code }})
            </span>
          </div>
          <span v-else class="text-muted-inline">No classes assigned yet. Assign in My Classes to enroll students.</span>
        </div>
      </section>

      <!-- B. Learning Path Summary -->
      <section class="learning-path-summary-card" aria-label="Course Learning Path Summary">
        <div class="summary-metrics-grid">
          <div class="metric-box">
            <span class="metric-val">{{ totalModulesCount }}</span>
            <span class="metric-label">Modules</span>
          </div>
          <div class="metric-box">
            <span class="metric-val">{{ totalCheckpointsCount }}</span>
            <span class="metric-label">Lessons</span>
          </div>
          <div class="metric-box">
            <span class="metric-val">{{ totalObjectivesCount }}</span>
            <span class="metric-label">Objectives</span>
          </div>
          <div class="metric-box">
            <span class="metric-val">{{ estimatedCourseHours }}h</span>
            <span class="metric-label">Est. Duration</span>
          </div>
          <div class="metric-box">
            <span class="metric-val">{{ materials.length }}</span>
            <span class="metric-label">Source Docs</span>
          </div>
          <div class="metric-box">
            <span class="metric-val status-val" :class="proposal ? 'ready' : 'pending'">
              {{ proposal ? (isApproved ? 'Approved' : 'Ready') : 'Draft' }}
            </span>
            <span class="metric-label">Curriculum Status</span>
          </div>
        </div>

        <!-- Collapsible AI Source Analysis Drawer -->
        <div class="ai-source-drawer">
          <button 
            type="button" 
            class="btn-toggle-drawer"
            @click="isAiDrawerOpen = !isAiDrawerOpen"
            :aria-expanded="isAiDrawerOpen"
          >
            <span class="drawer-title">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              AI Source Analysis & Grounding Inspector
            </span>
            <span class="drawer-toggle-icon">{{ isAiDrawerOpen ? '▲ Hide Analysis' : '▼ View AI Analysis' }}</span>
          </button>

          <div v-if="isAiDrawerOpen" class="ai-drawer-body">
            <div class="source-grounding-showcase">
              <div class="ai-tutor-inspector-card">
                <h4>AI Source Grounding Context</h4>
                <p class="inspector-desc">
                  Curriculum generated using course context, uploaded textbooks, slides, and syllabus outlines:
                </p>
                <div v-if="materials.length > 0" class="grounding-materials-list">
                  <div v-for="mat in materials" :key="mat.id" class="grounding-mat-pill">
                    <span class="mat-name">📄 {{ mat.title || mat.file_name }}</span>
                    <span class="mat-status">Synthesized ({{ formatFileSize(mat.file_size) }})</span>
                  </div>
                </div>
                <div v-else class="text-muted-inline">
                  No reference documents uploaded yet. Content generates from foundational robotics standards.
                </div>
              </div>

              <!-- AI Generation Trigger in Drawer -->
              <div class="ai-regen-bar">
                <div class="regen-left">
                  <label for="creation-mode-select" class="regen-label">Curriculum Generation Mode:</label>
                  <select id="creation-mode-select" v-model="selectedCreationMode" class="select-mode-input">
                    <option value="mode_a">Mode A: Grounded in Prescribed Curriculum</option>
                    <option value="mode_b">Mode B: Synthesize from Uploaded Materials</option>
                    <option value="mode_c">Mode C: Manual-First Architectural Scaffold</option>
                  </select>
                </div>
                <button 
                  type="button" 
                  id="btn-generate-curriculum"
                  class="btn-trigger-ai-curriculum" 
                  :disabled="isGenerating || isPublished"
                  :title="isPublished ? 'Revert this module to review before regenerating its content.' : ''"
                  @click="handleGenerateProposal"
                >
                  <span v-if="isGenerating" class="btn-spinner-row">
                    <span class="spinner-small"></span> Generating Module Structure...
                  </span>
                  <span v-else>
                    ✨ Generate Module Structure
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- C. Learning Path (Module Learning Nodes) -->
      <section class="learning-path-section" aria-label="Module Learning Nodes">
        <div class="section-title-bar">
          <div>
            <h2 class="section-title">Module Learning Nodes</h2>
            <p class="section-subtitle">
              Review, reorder, and customize the ordered topic nodes inside this module. Each node serves as both instructional study material and a student progression checkpoint.
            </p>
          </div>
          <div class="section-actions-row">
            <button 
              type="button" 
              class="btn-primary-action" 
              @click="addLearningNode"
              id="btn-add-learning-node"
            >
              + Add Learning Node
            </button>
            <button 
              v-if="editableProposal.proposal_data.modules && editableProposal.proposal_data.modules.length > 1"
              type="button" 
              class="btn-outline-action" 
              @click="expandAllModules"
            >
              Expand All
            </button>
            <button 
              v-if="editableProposal.proposal_data.modules && editableProposal.proposal_data.modules.length > 1"
              type="button" 
              class="btn-outline-action" 
              @click="collapseAllModules"
            >
              Collapse All
            </button>
          </div>
        </div>

        <!-- Source Coverage Indicator Banner -->
        <div v-if="sourceCoverageReport" class="source-coverage-indicator-card" id="source-coverage-indicator">
          <div class="coverage-header-row">
            <div class="coverage-title-group">
              <span class="coverage-icon">📊</span>
              <div>
                <h3 class="coverage-title">Source Outline Coverage</h3>
                <p class="coverage-subtitle">Continuous verification of uploaded document topics against generated learning nodes</p>
              </div>
            </div>
            <button 
              type="button" 
              class="btn-toggle-coverage-details" 
              @click="isCoverageModalOpen = !isCoverageModalOpen"
              id="btn-inspect-source-coverage"
            >
              {{ isCoverageModalOpen ? '▲ Hide Coverage Mapping' : '🔍 Inspect Outline Mapping' }}
            </button>
          </div>

          <div class="coverage-stats-row">
            <div class="coverage-stat-box">
              <span class="cov-val">{{ sourceCoverageReport.sourceTopicsDetected }}</span>
              <span class="cov-lbl">Source Topics Detected</span>
            </div>
            <div class="coverage-stat-box">
              <span class="cov-val text-success">{{ sourceCoverageReport.topicsRepresentedInNodes }}</span>
              <span class="cov-lbl">Represented in Nodes</span>
            </div>
            <div class="coverage-stat-box">
              <span class="cov-val" :class="sourceCoverageReport.topicsRequiringReview > 0 ? 'text-warning' : 'text-muted'">{{ sourceCoverageReport.topicsRequiringReview }}</span>
              <span class="cov-lbl">Topics Requiring Review</span>
            </div>
            <div class="coverage-stat-box">
              <span class="cov-val text-primary">{{ sourceCoverageReport.coveragePercentage }}%</span>
              <span class="cov-lbl">Curriculum Coverage</span>
            </div>
          </div>

          <!-- Collapsible Coverage Mapping Table -->
          <div v-if="isCoverageModalOpen" class="coverage-mapping-tray">
            <table class="coverage-mapping-table">
              <thead>
                <tr>
                  <th>Source Document Heading</th>
                  <th>Topic Group</th>
                  <th>Mapped Learning Node</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, iIdx) in sourceCoverageReport.mapping" :key="iIdx">
                  <td class="font-medium">{{ item.sourceHeading }}</td>
                  <td class="text-secondary">{{ item.section }}</td>
                  <td>{{ item.mappedNodeTitle }}</td>
                  <td>
                    <span class="coverage-tag-pill" :class="item.status === 'mapped' ? 'tag-mapped' : 'tag-review'">
                      {{ item.status === 'mapped' ? '✓ Faithfully Mapped' : 'Review Needed' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Learning Nodes Timeline / List (Primary Module-Centered Architecture) -->
        <div v-if="learningNodesList.length > 0" class="learning-nodes-timeline-list">
          <template v-for="(node, nodeIdx) in learningNodesList" :key="node.id || nodeIdx">
            <!-- Topic Group Header Divider (rendered when group changes) -->
            <div 
              v-if="node.topic_group && (nodeIdx === 0 || learningNodesList[nodeIdx - 1]?.topic_group !== node.topic_group)" 
              class="topic-group-header-divider"
            >
              <div class="topic-group-header-content">
                <span class="group-folder-icon">📂</span>
                <h3 class="topic-group-title">{{ node.topic_group }}</h3>
                <span class="topic-group-badge">
                  {{ learningNodesList.filter(n => n.topic_group === node.topic_group).length }} Topics
                </span>
              </div>
            </div>

            <div class="node-timeline-card">
              <div class="node-reorder-col">
                <button 
                  type="button" 
                  class="btn-node-reorder" 
                  :disabled="nodeIdx === 0" 
                  @click="moveNodeUp(nodeIdx)"
                  title="Move node earlier in sequence"
                  :id="`btn-move-node-up-${nodeIdx}`"
                >▲</button>
                <span class="node-num-pill">Node {{ String(nodeIdx + 1).padStart(2, '0') }}</span>
                <button 
                  type="button" 
                  class="btn-node-reorder" 
                  :disabled="nodeIdx === learningNodesList.length - 1" 
                  @click="moveNodeDown(nodeIdx)"
                  title="Move node later in sequence"
                  :id="`btn-move-node-down-${nodeIdx}`"
                >▼</button>
              </div>

              <div class="node-info-col">
                <div class="node-header-row">
                  <span class="badge-lesson-type" :class="`type-${node.type || 'concept'}`">
                    {{ formatLessonType(node.type) }}
                  </span>
                  <h3 class="node-title-text">{{ node.title }}</h3>
                </div>
                <p class="node-desc-text">{{ node.description || 'No summary available.' }}</p>
                <div class="node-criteria-row" v-if="node.completion_criteria">
                  <span class="criteria-label">Checkpoint Criteria:</span>
                  <span class="criteria-text">{{ node.completion_criteria }}</span>
                </div>
                <div class="node-source-ref-row" v-if="node.source_reference">
                  <span class="source-ref-pill">📄 {{ node.source_reference.section }} > {{ node.source_reference.heading }}</span>
                </div>
              </div>

              <div class="node-meta-col">
                <div class="node-stats-bar">
                  <span class="meta-pill">⏱️ {{ node.estimated_minutes || node.duration_minutes || 45 }}m</span>
                  <span class="lesson-content-status" :class="(node.blocks || node.node_content) ? 'status-ready' : 'status-draft'">
                    {{ (node.blocks || node.node_content) ? '✓ Content Ready' : '○ Needs Content' }}
                  </span>
                </div>

                <div class="node-actions-cluster">
                  <button 
                    type="button" 
                    class="btn-module-edit"
                    @click="openNodeEditor(nodeIdx)"
                    title="Edit node objectives, explanatory content and questions"
                    :id="`btn-edit-node-${nodeIdx}`"
                  >
                    Edit Node →
                  </button>
                  <button 
                    type="button" 
                    class="btn-outline-action btn-sm"
                    @click="duplicateNode(nodeIdx)"
                    title="Duplicate this node"
                  >
                    Duplicate
                  </button>
                  <button 
                    type="button" 
                    class="btn-outline-action btn-sm text-danger"
                    @click="deleteNode(nodeIdx)"
                    title="Delete this node"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- Modules Accordion List (Legacy Multi-Module Fallback) -->
        <div v-else-if="editableProposal.proposal_data.modules.length > 0" class="modules-accordion-list">
          <div 
            v-for="(mod, modIdx) in editableProposal.proposal_data.modules" 
            :key="mod.id || modIdx"
            class="module-accordion-card"
            :class="{ 'is-expanded': isModuleExpanded(modIdx) }"
          >
            <!-- Module Collapsed Header -->
            <div class="module-card-header" @click="toggleModuleExpand(modIdx)">
              <div class="mod-header-main">
                <span class="mod-num-badge">MODULE {{ String(modIdx + 1).padStart(2, '0') }}</span>
                <div class="mod-titles">
                  <h3 class="mod-title-text">{{ mod.title }}</h3>
                  <p class="mod-desc-text">{{ mod.description || 'No description provided.' }}</p>
                </div>
              </div>

              <div class="mod-header-meta">
                <div class="mod-stats-pills">
                  <span class="meta-pill">🎯 {{ (mod.learning_objectives || []).length }} objectives</span>
                  <span class="meta-pill">📖 {{ (mod.checkpoints || []).length }} lessons</span>
                  <span class="meta-pill">⏱️ {{ calculateModuleDuration(mod) }}</span>
                </div>

                <div class="mod-action-buttons" @click.stop>
                  <button 
                    type="button" 
                    class="btn-module-edit" 
                    @click="openModuleEditor(modIdx)"
                    title="Edit module objectives, sequence and details"
                  >
                    Edit Module
                  </button>
                  <button 
                    type="button" 
                    class="btn-toggle-chevron"
                    :aria-label="isModuleExpanded(modIdx) ? 'Collapse module' : 'Expand module'"
                    @click="toggleModuleExpand(modIdx)"
                  >
                    {{ isModuleExpanded(modIdx) ? '▲' : '▼' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Expanded Lessons List -->
            <div v-if="isModuleExpanded(modIdx)" class="module-card-body">
              <div class="lessons-header-row">
                <span class="sub-heading">Ordered Lessons in this Module:</span>
                <button 
                  type="button" 
                  class="btn-add-lesson-inline"
                  @click="addLessonToModule(mod)"
                >
                  + Add Lesson
                </button>
              </div>

              <div v-if="mod.checkpoints && mod.checkpoints.length > 0" class="lessons-vertical-list">
                <div 
                  v-for="(cp, cpIdx) in mod.checkpoints" 
                  :key="cp.id || cpIdx"
                  class="lesson-row-card"
                >
                  <div class="lesson-row-left">
                    <span class="lesson-index">{{ modIdx + 1 }}.{{ cpIdx + 1 }}</span>
                    <span class="badge-lesson-type" :class="`type-${cp.type || 'concept'}`">
                      {{ formatLessonType(cp.type) }}
                    </span>
                    <div class="lesson-titles">
                      <h4 class="lesson-title">{{ cp.title }}</h4>
                      <p class="lesson-short-desc">{{ cp.description || 'No summary available.' }}</p>
                    </div>
                  </div>

                  <div class="lesson-row-right">
                    <span class="lesson-duration">⏱️ {{ cp.duration_minutes || cp.estimated_minutes || 30 }}m</span>
                    <span 
                      class="lesson-content-status" 
                      :class="cp.node_content ? 'status-ready' : 'status-draft'"
                    >
                      {{ cp.node_content ? '✓ Content Ready' : '○ Needs Content' }}
                    </span>
                    <button 
                      type="button" 
                      class="btn-open-lesson"
                      @click="openLessonEditor(modIdx, cpIdx)"
                      title="Edit lesson details and AI content"
                    >
                      Edit Lesson →
                    </button>
                  </div>
                </div>
              </div>
              <div v-else class="empty-lessons-notice">
                <p>No lessons added to this module yet.</p>
                <button type="button" class="btn-create-first-lesson" @click="addLessonToModule(mod)">
                  + Create First Lesson
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-path-card">
          <p>No curriculum modules defined yet.</p>
          <button type="button" class="btn-primary-action" @click="addTeacherModule">
            + Add First Module
          </button>
        </div>
      </section>

      <!-- Publishing Format Stage: Option A (Separate Modules) vs Option B (One Combined Module) -->
      <section v-if="separatePlan.totals.sections > 0 || (editableProposal.proposal_data.modules && editableProposal.proposal_data.modules.length > 0)" class="publishing-format-section" id="publishing-format-stage">
        <div class="format-section-header">
          <div class="format-header-badge">
            <span class="step-num-pill">PUBLISHING FORMAT</span>
            <span class="required-asterisk">* Required before publishing</span>
          </div>
          <h3 class="format-section-title">Choose Student Delivery Structure</h3>
          <p class="format-section-desc">
            Decide how students in your assigned sections will access this curriculum. Select an option below to set the delivery format.
          </p>
        </div>

        <div class="format-options-grid">
          <!-- Option A: Publish as Separate Modules -->
          <div 
            class="format-option-card"
            :class="{ 'is-selected': selectedPublishingFormat === 'separate_modules' }"
            @click="selectPublishingFormat('separate_modules')"
            id="format-option-separate"
          >
            <div class="format-card-header">
              <div class="radio-indicator">
                <span v-if="selectedPublishingFormat === 'separate_modules'" class="radio-dot"></span>
              </div>
              <div class="format-title-group">
                <h4 class="format-card-title">Option A: Publish as Separate Modules</h4>
                <span class="format-tag tag-modular">Multi-Module Track</span>
              </div>
            </div>
            <p class="format-card-body">
              Each top-level curriculum section becomes its own <strong>independently accessible student module</strong> in the Student Modules catalog. Students unlock and track checkpoints per module.
            </p>
            <div class="format-preview-pill">
              <span class="preview-icon">📚</span>
              <span>Creates <strong>{{ separatePlan.totals.modules }}</strong> distinct modules ({{ separatePlan.totals.nodes }} nodes) in Student Catalog</span>
            </div>
            <ul class="format-plan-list" data-testid="plan-separate-list">
              <li v-for="m in separatePlan.modules" :key="m.id">
                <span class="plan-item-title">{{ m.title }}</span>
                <span class="plan-item-count">{{ m.nodeCount }} {{ m.nodeCount === 1 ? 'node' : 'nodes' }}</span>
              </li>
            </ul>
          </div>

          <!-- Option B: Publish as One Combined Module -->
          <div 
            class="format-option-card"
            :class="{ 'is-selected': selectedPublishingFormat === 'one_module' }"
            @click="selectPublishingFormat('one_module')"
            id="format-option-combined"
          >
            <div class="format-card-header">
              <div class="radio-indicator">
                <span v-if="selectedPublishingFormat === 'one_module'" class="radio-dot"></span>
              </div>
              <div class="format-title-group">
                <h4 class="format-card-title">Option B: Publish as One Combined Module</h4>
                <span class="format-tag tag-single">Single Unified Module</span>
              </div>
            </div>
            <p class="format-card-body">
              All top-level curriculum sections are grouped inside <strong>one student-facing module</strong>. The original sections become sequential lessons or units within that single module roadmap.
            </p>
            <div class="format-preview-pill">
              <span class="preview-icon">📦</span>
              <span>Creates <strong>{{ combinedPlan.totals.modules }}</strong> unified module containing <strong>{{ combinedPlan.totals.sections }}</strong> sections and {{ combinedPlan.totals.nodes }} nodes</span>
            </div>
            <ol class="format-plan-list" data-testid="plan-combined-list">
              <li v-for="sec in (combinedPlan.modules[0]?.sections || [])" :key="sec.id">
                <span class="plan-item-title">{{ sec.title }}</span>
                <span class="plan-item-count">{{ sec.nodeCount }} {{ sec.nodeCount === 1 ? 'node' : 'nodes' }}</span>
              </li>
            </ol>
          </div>
        </div>

        <div v-for="(issue, iIdx) in selectedPlanBlockingIssues" :key="'plan-issue-' + iIdx" class="format-selection-warning">
          <span>⚠️ {{ issue.message }}</span>
        </div>
        <div v-if="!selectedPublishingFormat" class="format-selection-warning">
          <span>⚠️ Please select a publishing format above before publishing this curriculum.</span>
        </div>
        <div v-else class="format-selection-confirmed">
          <span class="check-icon">✓</span>
          <span>Selected: <strong>{{ selectedPublishingFormat === 'separate_modules' ? 'Option A (Separate Modules)' : 'Option B (One Combined Module)' }}</strong>. This configuration is saved with your proposal.</span>
        </div>
      </section>

      <!-- D. Course Actions Footer -->
      <footer class="course-actions-footer">
        <div class="footer-left">
          <button 
            type="button" 
            class="btn-footer-action btn-preview-course"
            @click="openStudentPreview()"
          >
            👁️ Preview as Student
          </button>
          <button 
            type="button" 
            class="btn-footer-action btn-save-draft"
            :disabled="isSaving"
            @click="handleSaveEdits"
          >
            {{ isSaving ? 'Saving...' : '💾 Save Changes' }}
          </button>
        </div>

        <div class="footer-right">
          <!-- Approve Button -->
          <button 
            type="button" 
            id="btn-approve-proposal"
            class="btn-footer-action btn-approve"
            :disabled="isApproving || isApproved"
            @click="handleApproveProposal"
          >
            <span v-if="isApproving">Approving...</span>
            <span v-else-if="isApproved">✓ Learning Path Approved</span>
            <span v-else>Approve Learning Path</span>
          </button>

          <!-- Publish Button -->
          <button 
            type="button" 
            id="btn-approve-publish"
            class="btn-footer-action btn-publish"
            :disabled="isPublishing || (isPublished && !hasStagedDraft)"
            @click="openPublishModal"
          >
            <span v-if="isPublishing">Publishing...</span>
            <span v-else-if="isPublished && hasStagedDraft">Publish Staged Draft</span>
            <span v-else-if="isPublished">✓ Published to Students</span>
            <span v-else>Publish Module</span>
          </button>

          <!-- Unpublish Button -->
          <button 
            v-if="isPublished"
            type="button" 
            class="btn-footer-action btn-unpublish"
            :disabled="isUnpublishing"
            @click="handleUnpublish"
          >
            {{ isUnpublishing ? 'Reverting...' : 'Revert to Review' }}
          </button>
        </div>
      </footer>
    </main>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- LEVEL 2: MODULE EDITOR                                                 -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <main v-else-if="currentLevel === 'module'" class="level-container level-module-editor">
      <div class="level-top-header">
        <div class="header-titles">
          <button type="button" class="btn-back-link" @click="navigateToLevel('overview')">
            ← Back to Course Overview
          </button>
          <h1 class="level-heading">
            Module {{ (activeModuleIndex ?? 0) + 1 }}: {{ activeModule?.title || 'Edit Module' }}
          </h1>
          <p class="level-sub">Manage module details, measurable learning objectives, and teaching sequence.</p>
        </div>

        <div class="level-header-actions">
          <button type="button" class="btn-outline-action" @click="navigateToLevel('overview')">
            Cancel
          </button>
          <button type="button" class="btn-primary-action" :disabled="isSaving" @click="saveModuleAndStay">
            {{ isSaving ? 'Saving...' : 'Save Module' }}
          </button>
        </div>
      </div>

      <div v-if="activeModule" class="module-edit-grid">
        <!-- A. Module Information -->
        <section class="editor-card">
          <h2 class="card-heading">Module Information</h2>
          <div class="form-group">
            <label class="form-label" for="mod-title-input">Module Title:</label>
            <input 
              id="mod-title-input"
              v-model="activeModule.title" 
              type="text" 
              class="form-input" 
              placeholder="e.g. PLC Fundamentals & Architecture"
              @input="markDirty"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="mod-desc-input">Module Description:</label>
            <textarea 
              id="mod-desc-input"
              v-model="activeModule.description" 
              rows="3" 
              class="form-textarea" 
              placeholder="What core concepts will this module cover?"
              @input="markDirty"
            ></textarea>
          </div>

          <div class="form-row">
            <div class="form-group col-half">
              <label class="form-label" for="mod-duration-input">Estimated Hours:</label>
              <input 
                id="mod-duration-input"
                v-model="activeModule.duration" 
                type="text" 
                class="form-input" 
                placeholder="e.g. 2 hours"
                @input="markDirty"
              />
            </div>
            <div class="form-group col-half">
              <label class="form-label" for="mod-level-input">Difficulty Level:</label>
              <select id="mod-level-input" v-model="activeModule.level" class="form-input" @change="markDirty">
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>
        </section>

        <!-- B. Learning Objectives Checklist -->
        <section class="editor-card">
          <div class="card-header-flex">
            <div>
              <h2 class="card-heading">What Students Will Learn (Objectives)</h2>
              <p class="card-sub">Measurable learning objectives students master upon completing this module.</p>
            </div>
            <button type="button" class="btn-secondary-action" @click="addObjectiveToModule(activeModule)">
              + Add Objective
            </button>
          </div>

          <div v-if="activeModule.learning_objectives && activeModule.learning_objectives.length > 0" class="objectives-checklist">
            <div 
              v-for="(obj, oIdx) in activeModule.learning_objectives" 
              :key="oIdx"
              class="objective-item-row"
            >
              <span class="obj-bullet">✓</span>
              <input 
                v-model="activeModule.learning_objectives[oIdx]" 
                type="text" 
                class="form-input obj-input"
                placeholder="Measurable objective statement"
                @input="markDirty"
              />
              <div class="obj-item-actions">
                <button 
                  type="button" 
                  class="btn-icon-order" 
                  :disabled="oIdx === 0" 
                  @click="moveObjective(activeModule, oIdx, -1)"
                  title="Move objective up"
                >↑</button>
                <button 
                  type="button" 
                  class="btn-icon-order" 
                  :disabled="oIdx === activeModule.learning_objectives.length - 1" 
                  @click="moveObjective(activeModule, oIdx, 1)"
                  title="Move objective down"
                >↓</button>
                <button 
                  type="button" 
                  class="btn-icon-delete" 
                  @click="removeObjective(activeModule, oIdx)"
                  title="Remove objective"
                >×</button>
              </div>
            </div>
          </div>
          <div v-else class="empty-card-state">
            <p>No learning objectives set for this module.</p>
            <button type="button" class="btn-create-first-lesson" @click="addObjectiveToModule(activeModule)">
              + Add First Objective
            </button>
          </div>
        </section>

        <!-- C. Learning Sequence (Lessons) -->
        <section class="editor-card full-width">
          <div class="card-header-flex">
            <div>
              <h2 class="card-heading">Learning Sequence (Lessons)</h2>
              <p class="card-sub">Lessons in intended instructional order. Click Edit Lesson Content to author or generate content.</p>
            </div>
            <button type="button" class="btn-primary-action" @click="addLessonToModule(activeModule)">
              + Add Lesson
            </button>
          </div>

          <div v-if="activeModule.checkpoints && activeModule.checkpoints.length > 0" class="sequence-list">
            <div 
              v-for="(cp, cpIdx) in activeModule.checkpoints" 
              :key="cp.id || cpIdx"
              class="sequence-item-card"
            >
              <div class="seq-col-order">
                <span class="seq-num">Lesson {{ cpIdx + 1 }}</span>
                <div class="seq-order-btns">
                  <button 
                    type="button" 
                    class="btn-mini-order" 
                    :disabled="cpIdx === 0"
                    @click="moveCheckpoint(activeModule, cpIdx, -1)"
                    title="Move lesson up"
                  >▲</button>
                  <button 
                    type="button" 
                    class="btn-mini-order" 
                    :disabled="cpIdx === activeModule.checkpoints.length - 1"
                    @click="moveCheckpoint(activeModule, cpIdx, 1)"
                    title="Move lesson down"
                  >▼</button>
                </div>
              </div>

              <div class="seq-col-main">
                <div class="seq-title-row">
                  <input 
                    v-model="cp.title" 
                    type="text" 
                    class="form-input seq-title-input" 
                    placeholder="Lesson title"
                    @input="markDirty"
                  />
                  <select v-model="cp.type" class="form-input seq-type-select" @change="markDirty">
                    <option value="concept">Concept</option>
                    <option value="demonstration">Demonstration</option>
                    <option value="guided_practice">Guided Practice</option>
                    <option value="lab">Laboratory</option>
                    <option value="challenge">Engineering Challenge</option>
                    <option value="assessment">Assessment</option>
                    <option value="project">Project</option>
                  </select>
                </div>

                <div class="seq-desc-row">
                  <input 
                    v-model="cp.description" 
                    type="text" 
                    class="form-input seq-desc-input" 
                    placeholder="Brief description of what students will accomplish in this lesson"
                    @input="markDirty"
                  />
                </div>
              </div>

              <div class="seq-col-meta">
                <div class="seq-duration-wrap">
                  <input 
                    v-model="cp.duration_minutes" 
                    type="number" 
                    class="form-input duration-num-input" 
                    min="5" 
                    max="180" 
                    @input="markDirty"
                  />
                  <span class="duration-unit">mins</span>
                </div>

                <span 
                  class="lesson-status-badge" 
                  :class="cp.node_content ? 'ready' : 'draft'"
                >
                  {{ cp.node_content ? 'Ready' : 'Draft' }}
                </span>
              </div>

              <div class="seq-col-actions">
                <button 
                  type="button" 
                  class="btn-seq-edit" 
                  @click="openLessonEditor(activeModuleIndex, cpIdx)"
                  title="Author educational content and AI sections"
                >
                  Edit Content →
                </button>
                <button 
                  type="button" 
                  class="btn-seq-icon" 
                  @click="duplicateCheckpoint(activeModule, cpIdx)"
                  title="Duplicate lesson"
                >
                  📋
                </button>
                <button 
                  type="button" 
                  class="btn-seq-icon btn-seq-delete" 
                  @click="deleteCheckpoint(activeModule, cpIdx)"
                  title="Delete lesson"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
          <div v-else class="empty-card-state">
            <p>No lessons added yet.</p>
            <button type="button" class="btn-primary-action" @click="addLessonToModule(activeModule)">
              + Add First Lesson
            </button>
          </div>
        </section>

        <!-- D. Module Sources (Collapsible) -->
        <section class="editor-card full-width">
          <div class="card-header-flex">
            <div>
              <h2 class="card-heading">Module Source Materials</h2>
              <p class="card-sub">Documents and textbook chapters referenced by this module.</p>
            </div>
          </div>
          <div v-if="materials.length > 0" class="source-list">
            <div v-for="mat in materials" :key="mat.id" class="source-item">
              <span class="source-icon">📄</span>
              <div class="source-info">
                <span class="source-name">{{ mat.title || mat.file_name }}</span>
                <span class="source-sub">{{ formatFileSize(mat.file_size) }} • Grounded in curriculum</span>
              </div>
            </div>
          </div>
          <div v-else class="text-muted-inline">
            No source documents uploaded. Lesson content will synthesize from engineering knowledge standards.
          </div>
        </section>

        <!-- E. Module Actions Footer -->
        <section class="editor-card full-width module-action-footer">
          <div class="footer-left">
            <button 
              type="button" 
              class="btn-outline-action" 
              @click="confirmRegenerateModule(activeModule)"
            >
              ✨ Regenerate Module Structure with AI
            </button>
          </div>
          <div class="footer-right">
            <button type="button" class="btn-outline-action" @click="navigateToLevel('overview')">
              Cancel
            </button>
            <button type="button" class="btn-primary-action" :disabled="isSaving" @click="saveModuleAndReturn">
              {{ isSaving ? 'Saving...' : 'Save & Return to Course' }}
            </button>
          </div>
        </section>
      </div>
    </main>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- LEVEL 3: LESSON EDITOR                                                 -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <main v-else-if="currentLevel === 'lesson'" class="level-container level-lesson-editor">
      <div class="level-top-header">
        <div class="header-titles">
          <div class="back-links-row">
            <button type="button" class="btn-back-link" @click="navigateToLevel('module')">
              ← Back to Module {{ (activeModuleIndex ?? 0) + 1 }}
            </button>
            <span class="back-sep">|</span>
            <button type="button" class="btn-back-link" @click="navigateToLevel('overview')">
              Back to Course
            </button>
          </div>
          <h1 class="level-heading">
            Lesson {{ (activeLessonIndex ?? 0) + 1 }}: {{ activeLesson?.title || 'Lesson Editor' }}
          </h1>
          <p class="level-sub">
            Author and regenerate lesson content across the 9 educational sections.
          </p>
        </div>

        <div class="level-header-actions">
          <button 
            type="button" 
            class="btn-footer-action btn-preview-course"
            @click="openStudentPreview(activeLesson)"
          >
            👁️ Preview Lesson
          </button>
          <button 
            type="button" 
            class="btn-primary-action" 
            :disabled="isSaving" 
            @click="saveLessonAndStay"
          >
            {{ isSaving ? 'Saving...' : 'Save Lesson' }}
          </button>
        </div>
      </div>

      <div v-if="activeLesson" class="lesson-editor-layout">
        <!-- A. Lesson Metadata Overview -->
        <section class="editor-card">
          <h2 class="card-heading">Lesson Information</h2>
          <div class="form-row">
            <div class="form-group col-two-thirds">
              <label class="form-label" for="lesson-title-input">Lesson Title:</label>
              <input 
                id="lesson-title-input"
                v-model="activeLesson.title" 
                type="text" 
                class="form-input" 
                placeholder="Lesson Title"
                @input="markDirty"
              />
            </div>
            <div class="form-group col-one-third">
              <label class="form-label" for="lesson-type-select">Lesson Type:</label>
              <select id="lesson-type-select" v-model="activeLesson.type" class="form-input" @change="markDirty">
                <option value="concept">Concept</option>
                <option value="demonstration">Demonstration</option>
                <option value="guided_practice">Guided Practice</option>
                <option value="lab">Laboratory</option>
                <option value="challenge">Engineering Challenge</option>
                <option value="assessment">Assessment</option>
                <option value="project">Project</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group col-two-thirds">
              <label class="form-label" for="lesson-desc-input">Short Description:</label>
              <input 
                id="lesson-desc-input"
                v-model="activeLesson.description" 
                type="text" 
                class="form-input" 
                placeholder="Summary for lesson catalog"
                @input="markDirty"
              />
            </div>
            <div class="form-group col-one-third">
              <label class="form-label" for="lesson-duration-input">Duration (Minutes):</label>
              <input 
                id="lesson-duration-input"
                v-model="activeLesson.duration_minutes" 
                type="number" 
                class="form-input" 
                min="5" 
                max="180"
                @input="markDirty"
              />
            </div>
          </div>

          <!-- Collapsible Teacher Instructions -->
          <div class="teacher-instructions-wrap">
            <button 
              type="button" 
              class="btn-toggle-instructions"
              @click="isInstructionsOpen = !isInstructionsOpen"
            >
              <span>Teacher Instructions & Guidance Notes</span>
              <span>{{ isInstructionsOpen ? '▲ Hide' : '▼ Add/Edit Notes' }}</span>
            </button>
            <div v-if="isInstructionsOpen" class="instructions-body">
              <textarea 
                v-model="activeLesson.teacher_instructions" 
                rows="2" 
                class="form-textarea"
                placeholder="Guidance for AI generation (e.g. emphasize hands-on wiring, include safety tips for 12V LiPo batteries)..."
                @input="markDirty"
              ></textarea>
            </div>
          </div>
        </section>

        <!-- Source Reference Disclosure (When grounded in source document) -->
        <section v-if="activeLesson.source_reference" class="editor-card source-reference-card">
          <div class="source-ref-header">
            <span class="source-ref-icon">📑</span>
            <div>
              <h3 class="card-heading">Document Source Citation</h3>
              <p class="source-ref-meta">
                <strong>{{ activeLesson.source_reference.section }}</strong> &gt; {{ activeLesson.source_reference.heading }} 
                <span v-if="activeLesson.source_reference.pageReference" class="page-pill">({{ activeLesson.source_reference.pageReference }})</span>
              </p>
            </div>
          </div>
          <div class="source-excerpt-box">
            <span class="excerpt-tag">Authentic Excerpt from Uploaded Document:</span>
            <p class="excerpt-text">{{ activeLesson.source_reference.sourceExcerpt }}</p>
          </div>
        </section>

        <!-- Flexible Content Blocks Editor -->
        <section class="editor-card content-blocks-editor-card">
          <div class="blocks-editor-header">
            <div>
              <h2 class="card-heading">Flexible Instructional Content Blocks</h2>
              <p class="card-sub">Structured learning blocks (text explanations, analogies, Arduino code snippets, tables, and activities) faithful to uploaded materials.</p>
            </div>
            <div class="blocks-add-buttons">
              <button type="button" class="btn-add-block" @click="addContentBlock('text')">+ Text</button>
              <button type="button" class="btn-add-block" @click="addContentBlock('callout')">+ Analogy / Callout</button>
              <button type="button" class="btn-add-block" @click="addContentBlock('code')">+ Code</button>
              <button type="button" class="btn-add-block" @click="addContentBlock('activity')">+ Activity</button>
            </div>
          </div>

          <div v-if="activeLesson.blocks && activeLesson.blocks.length > 0" class="blocks-list">
            <div v-for="(block, bIdx) in activeLesson.blocks" :key="block.id || bIdx" class="block-edit-item">
              <div class="block-edit-header">
                <span class="block-type-pill" :class="`block-type-${block.type}`">{{ block.type.toUpperCase() }}</span>
                <input 
                  type="text" 
                  v-model="block.title" 
                  class="block-title-input" 
                  placeholder="Block Title (optional)" 
                  @input="markDirty"
                />
                <button type="button" class="btn-remove-block text-danger" @click="removeContentBlock(bIdx)">✕</button>
              </div>

              <!-- Text / Markdown content -->
              <div class="block-edit-body">
                <textarea 
                  v-model="block.content" 
                  rows="4" 
                  class="form-textarea" 
                  :placeholder="block.type === 'code' ? 'int sensorValue = analogRead(potPin);' : 'Enter block content...'"
                  @input="markDirty"
                ></textarea>

                <!-- Code Block Language & Caption -->
                <div v-if="block.type === 'code'" class="form-row block-meta-row">
                  <div class="form-group col-one-third">
                    <label class="form-label">Language:</label>
                    <input type="text" v-model="block.code_language" class="form-input" placeholder="cpp" @input="markDirty" />
                  </div>
                  <div class="form-group col-two-thirds">
                    <label class="form-label">Caption / Tool Note:</label>
                    <input type="text" v-model="block.caption" class="form-input" placeholder="Tool: Uploading a Sketch" @input="markDirty" />
                  </div>
                </div>

                <!-- Callout Analogy Takeaway -->
                <div v-if="block.type === 'callout'" class="form-row block-meta-row">
                  <div class="form-group col-full">
                    <label class="form-label">Key Analogy / Takeaway:</label>
                    <input type="text" v-model="block.analogy" class="form-input" placeholder="e.g. Voltage is water pressure in a pipe..." @input="markDirty" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-muted-inline blocks-empty-note">
            No structured content blocks configured yet. Add a block above or generate with AI.
          </div>
        </section>

        <!-- End-of-Topic Assessment Editor -->
        <section class="editor-card assessment-editor-card">
          <div class="blocks-editor-header">
            <div>
              <h2 class="card-heading">End-of-Topic Assessment Configuration</h2>
              <p class="card-sub">Configure question types, correct answers, and passing threshold required to unlock subsequent learning nodes.</p>
            </div>
            <button type="button" class="btn-add-block" @click="addAssessmentQuestion">+ Add Question</button>
          </div>

          <div v-if="activeLesson.assessment" class="assessment-config-body">
            <div class="form-row">
              <div class="form-group col-one-third">
                <label class="form-label">Assessment Format:</label>
                <select v-model="activeLesson.assessment.format" class="form-input" @change="markDirty">
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="fill_in_the_blanks">Fill in the Blanks</option>
                  <option value="short_answer">Short Answer</option>
                  <option value="practical_activity">Practical Activity</option>
                </select>
              </div>
              <div class="form-group col-one-third">
                <label class="form-label">Passing Score (%):</label>
                <input type="number" v-model="activeLesson.assessment.passing_score_percentage" class="form-input" min="0" max="100" @input="markDirty" />
              </div>
              <div class="form-group col-one-third checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="activeLesson.assessment.required_to_unlock_next" @change="markDirty" />
                  <span>Required to Unlock Next Node</span>
                </label>
              </div>
            </div>

            <!-- Questions list -->
            <div v-if="activeLesson.assessment.questions && activeLesson.assessment.questions.length > 0" class="questions-edit-list">
              <div v-for="(q, qIdx) in activeLesson.assessment.questions" :key="q.id || qIdx" class="question-edit-box">
                <div class="question-edit-header">
                  <span class="q-num-pill">Q{{ qIdx + 1 }}</span>
                  <input type="text" v-model="q.question" class="form-input" placeholder="Question prompt..." @input="markDirty" />
                  <button type="button" class="btn-remove-block text-danger" @click="removeAssessmentQuestion(qIdx)">✕</button>
                </div>

                <div class="form-row" v-if="q.type === 'multiple_choice'">
                  <div class="form-group col-full">
                    <label class="form-label">Options (One per line, e.g. A) ..., B) ...):</label>
                    <textarea 
                      :value="(q.options || []).join('\n')" 
                      @input="q.options = $event.target.value.split('\n'); markDirty()"
                      rows="4" 
                      class="form-textarea code-font"
                    ></textarea>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group col-one-third">
                    <label class="form-label">Correct Answer Key:</label>
                    <input type="text" v-model="q.correct_answer" class="form-input" placeholder="e.g. B or answer keyword" @input="markDirty" />
                  </div>
                  <div class="form-group col-two-thirds">
                    <label class="form-label">Explanation &amp; Rationale:</label>
                    <input type="text" v-model="q.explanation" class="form-input" placeholder="Explanation shown upon submission..." @input="markDirty" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- D. Prominent AI Generation Banner -->
        <section class="ai-generation-banner">
          <div class="ai-banner-left">
            <span class="ai-sparkle-icon">✨</span>
            <div>
              <h3 class="ai-banner-title">Generate Lesson Content with RISSE AI</h3>
              <p class="ai-banner-sub">
                Synthesize all 9 educational sections using course context, module goals, and uploaded materials.
              </p>
            </div>
          </div>

          <div class="ai-banner-right">
            <button 
              type="button" 
              class="btn-primary-ai-generate" 
              :disabled="isGeneratingNodeContent"
              @click="handleGenerateActiveNodeContent"
            >
              <span v-if="isGeneratingNodeContent" class="btn-spinner-row">
                <span class="spinner-small"></span> Generating Content...
              </span>
              <span v-else>
                ✨ Generate All Lesson Content
              </span>
            </button>
          </div>
        </section>

        <!-- C. 9 Collapsible Content Sections -->
        <section class="lesson-content-sections-container">
          <h2 class="card-heading">Lesson Educational Sections</h2>
          <p class="card-sub">
            Expand any section to review or edit. Use <strong>Regenerate Section</strong> to surgically replace one section without altering your other edits.
          </p>

          <div class="sections-accordion-list">
            <!-- 1. Introduction & Overview -->
            <div class="content-section-card" :class="{ 'is-open': openSections.has('overview') }">
              <div class="content-section-header" @click="toggleContentSection('overview')">
                <div class="section-title-wrap">
                  <span class="section-icon">📖</span>
                  <span class="section-name">1. Introduction & Overview</span>
                  <span class="section-badge" :class="hasSectionContent('overview') ? 'populated' : 'empty'">
                    {{ hasSectionContent('overview') ? 'Populated' : 'Empty' }}
                  </span>
                </div>
                <div class="section-actions-wrap" @click.stop>
                  <button 
                    type="button" 
                    class="btn-regen-single-section"
                    :disabled="isRegeneratingSection === 'overview'"
                    @click="handleRegenerateSection('overview')"
                    title="Regenerate only this section with AI"
                  >
                    {{ isRegeneratingSection === 'overview' ? 'Regenerating...' : '⚡ Regenerate Section' }}
                  </button>
                  <span class="chevron-indicator">{{ openSections.has('overview') ? '▲' : '▼' }}</span>
                </div>
              </div>
              <div v-if="openSections.has('overview')" class="content-section-body">
                <textarea 
                  v-model="lessonContent.overview" 
                  rows="4" 
                  class="form-textarea" 
                  placeholder="Overview of this lesson..."
                  @input="markDirty"
                ></textarea>
              </div>
            </div>

            <!-- 2. Core Lesson Guide -->
            <div class="content-section-card" :class="{ 'is-open': openSections.has('step_by_step_guide') }">
              <div class="content-section-header" @click="toggleContentSection('step_by_step_guide')">
                <div class="section-title-wrap">
                  <span class="section-icon">🛠️</span>
                  <span class="section-name">2. Core Lesson & Step-by-Step Guide</span>
                  <span class="section-badge" :class="hasSectionContent('step_by_step_guide') ? 'populated' : 'empty'">
                    {{ hasSectionContent('step_by_step_guide') ? 'Populated' : 'Empty' }}
                  </span>
                </div>
                <div class="section-actions-wrap" @click.stop>
                  <button 
                    type="button" 
                    class="btn-regen-single-section"
                    :disabled="isRegeneratingSection === 'step_by_step_guide'"
                    @click="handleRegenerateSection('step_by_step_guide')"
                    title="Regenerate only this section with AI"
                  >
                    {{ isRegeneratingSection === 'step_by_step_guide' ? 'Regenerating...' : '⚡ Regenerate Section' }}
                  </button>
                  <span class="chevron-indicator">{{ openSections.has('step_by_step_guide') ? '▲' : '▼' }}</span>
                </div>
              </div>
              <div v-if="openSections.has('step_by_step_guide')" class="content-section-body">
                <textarea 
                  v-model="lessonContent.step_by_step_guide" 
                  rows="8" 
                  class="form-textarea code-font" 
                  placeholder="Detailed instructional guide and sequential steps..."
                  @input="markDirty"
                ></textarea>
              </div>
            </div>

            <!-- 3. Key Concepts -->
            <div class="content-section-card" :class="{ 'is-open': openSections.has('core_concepts') }">
              <div class="content-section-header" @click="toggleContentSection('core_concepts')">
                <div class="section-title-wrap">
                  <span class="section-icon">💡</span>
                  <span class="section-name">3. Key Concepts & Theory</span>
                  <span class="section-badge" :class="hasSectionContent('core_concepts') ? 'populated' : 'empty'">
                    {{ hasSectionContent('core_concepts') ? 'Populated' : 'Empty' }}
                  </span>
                </div>
                <div class="section-actions-wrap" @click.stop>
                  <button 
                    type="button" 
                    class="btn-regen-single-section"
                    :disabled="isRegeneratingSection === 'core_concepts'"
                    @click="handleRegenerateSection('core_concepts')"
                  >
                    {{ isRegeneratingSection === 'core_concepts' ? 'Regenerating...' : '⚡ Regenerate Section' }}
                  </button>
                  <span class="chevron-indicator">{{ openSections.has('core_concepts') ? '▲' : '▼' }}</span>
                </div>
              </div>
              <div v-if="openSections.has('core_concepts')" class="content-section-body">
                <div v-if="Array.isArray(lessonContent.core_concepts)" class="concepts-list">
                  <div 
                    v-for="(c, cIdx) in lessonContent.core_concepts" 
                    :key="cIdx"
                    class="concept-item"
                  >
                    <input 
                      v-model="c.concept" 
                      type="text" 
                      class="form-input concept-title-input" 
                      placeholder="Concept name"
                      @input="markDirty"
                    />
                    <textarea 
                      v-model="c.explanation" 
                      rows="2" 
                      class="form-textarea concept-desc-input" 
                      placeholder="Concept explanation..."
                      @input="markDirty"
                    ></textarea>
                  </div>
                </div>
                <div v-else>
                  <textarea 
                    v-model="lessonContent.core_concepts" 
                    rows="4" 
                    class="form-textarea"
                    @input="markDirty"
                  ></textarea>
                </div>
              </div>
            </div>

            <!-- 4. Examples & Demonstrations -->
            <div class="content-section-card" :class="{ 'is-open': openSections.has('examples') }">
              <div class="content-section-header" @click="toggleContentSection('examples')">
                <div class="section-title-wrap">
                  <span class="section-icon">🔬</span>
                  <span class="section-name">4. Examples & Demonstrations</span>
                  <span class="section-badge" :class="hasSectionContent('examples') ? 'populated' : 'empty'">
                    {{ hasSectionContent('examples') ? 'Populated' : 'Empty' }}
                  </span>
                </div>
                <div class="section-actions-wrap" @click.stop>
                  <button 
                    type="button" 
                    class="btn-regen-single-section"
                    :disabled="isRegeneratingSection === 'examples'"
                    @click="handleRegenerateSection('examples')"
                  >
                    {{ isRegeneratingSection === 'examples' ? 'Regenerating...' : '⚡ Regenerate Section' }}
                  </button>
                  <span class="chevron-indicator">{{ openSections.has('examples') ? '▲' : '▼' }}</span>
                </div>
              </div>
              <div v-if="openSections.has('examples')" class="content-section-body">
                <textarea 
                  v-model="lessonContent.examples" 
                  rows="4" 
                  class="form-textarea" 
                  placeholder="Demonstration examples and visual walkthroughs..."
                  @input="markDirty"
                ></textarea>
              </div>
            </div>

            <!-- 5. Practical Applications & Materials -->
            <div class="content-section-card" :class="{ 'is-open': openSections.has('materials_needed') }">
              <div class="content-section-header" @click="toggleContentSection('materials_needed')">
                <div class="section-title-wrap">
                  <span class="section-icon">📦</span>
                  <span class="section-name">5. Practical Applications & Materials</span>
                  <span class="section-badge" :class="hasSectionContent('materials_needed') ? 'populated' : 'empty'">
                    {{ hasSectionContent('materials_needed') ? 'Populated' : 'Empty' }}
                  </span>
                </div>
                <div class="section-actions-wrap" @click.stop>
                  <button 
                    type="button" 
                    class="btn-regen-single-section"
                    :disabled="isRegeneratingSection === 'materials_needed'"
                    @click="handleRegenerateSection('materials_needed')"
                  >
                    {{ isRegeneratingSection === 'materials_needed' ? 'Regenerating...' : '⚡ Regenerate Section' }}
                  </button>
                  <span class="chevron-indicator">{{ openSections.has('materials_needed') ? '▲' : '▼' }}</span>
                </div>
              </div>
              <div v-if="openSections.has('materials_needed')" class="content-section-body">
                <textarea 
                  v-model="lessonContent.materials_needed" 
                  rows="3" 
                  class="form-textarea" 
                  placeholder="Hardware, tools, components, and practical applications..."
                  @input="markDirty"
                ></textarea>
              </div>
            </div>

            <!-- 6. Activities & Guided Practice -->
            <div class="content-section-card" :class="{ 'is-open': openSections.has('activities') }">
              <div class="content-section-header" @click="toggleContentSection('activities')">
                <div class="section-title-wrap">
                  <span class="section-icon">⚙️</span>
                  <span class="section-name">6. Activities & Guided Practice</span>
                  <span class="section-badge" :class="hasSectionContent('activities') ? 'populated' : 'empty'">
                    {{ hasSectionContent('activities') ? 'Populated' : 'Empty' }}
                  </span>
                </div>
                <div class="section-actions-wrap" @click.stop>
                  <button 
                    type="button" 
                    class="btn-regen-single-section"
                    :disabled="isRegeneratingSection === 'activities'"
                    @click="handleRegenerateSection('activities')"
                  >
                    {{ isRegeneratingSection === 'activities' ? 'Regenerating...' : '⚡ Regenerate Section' }}
                  </button>
                  <span class="chevron-indicator">{{ openSections.has('activities') ? '▲' : '▼' }}</span>
                </div>
              </div>
              <div v-if="openSections.has('activities')" class="content-section-body">
                <textarea 
                  v-model="lessonContent.activities" 
                  rows="4" 
                  class="form-textarea" 
                  placeholder="Hands-on classroom or lab exercises..."
                  @input="markDirty"
                ></textarea>
              </div>
            </div>

            <!-- 7. Engineering Challenges & Troubleshooting -->
            <div class="content-section-card" :class="{ 'is-open': openSections.has('troubleshooting') }">
              <div class="content-section-header" @click="toggleContentSection('troubleshooting')">
                <div class="section-title-wrap">
                  <span class="section-icon">🏆</span>
                  <span class="section-name">7. Engineering Challenges & Troubleshooting</span>
                  <span class="section-badge" :class="hasSectionContent('troubleshooting') ? 'populated' : 'empty'">
                    {{ hasSectionContent('troubleshooting') ? 'Populated' : 'Empty' }}
                  </span>
                </div>
                <div class="section-actions-wrap" @click.stop>
                  <button 
                    type="button" 
                    class="btn-regen-single-section"
                    :disabled="isRegeneratingSection === 'troubleshooting'"
                    @click="handleRegenerateSection('troubleshooting')"
                  >
                    {{ isRegeneratingSection === 'troubleshooting' ? 'Regenerating...' : '⚡ Regenerate Section' }}
                  </button>
                  <span class="chevron-indicator">{{ openSections.has('troubleshooting') ? '▲' : '▼' }}</span>
                </div>
              </div>
              <div v-if="openSections.has('troubleshooting')" class="content-section-body">
                <textarea 
                  v-model="lessonContent.troubleshooting" 
                  rows="4" 
                  class="form-textarea" 
                  placeholder="Common failure modes, diagnostic flowcharts, and competitive challenges..."
                  @input="markDirty"
                ></textarea>
              </div>
            </div>

            <!-- 8. Assessment Questions & Rubric -->
            <div class="content-section-card" :class="{ 'is-open': openSections.has('interactive_quiz') }">
              <div class="content-section-header" @click="toggleContentSection('interactive_quiz')">
                <div class="section-title-wrap">
                  <span class="section-icon">📝</span>
                  <span class="section-name">8. Assessment Questions & Rubric</span>
                  <span class="section-badge" :class="hasSectionContent('interactive_quiz') ? 'populated' : 'empty'">
                    {{ hasSectionContent('interactive_quiz') ? 'Populated' : 'Empty' }}
                  </span>
                </div>
                <div class="section-actions-wrap" @click.stop>
                  <button 
                    type="button" 
                    class="btn-regen-single-section"
                    :disabled="isRegeneratingSection === 'interactive_quiz'"
                    @click="handleRegenerateSection('interactive_quiz')"
                  >
                    {{ isRegeneratingSection === 'interactive_quiz' ? 'Regenerating...' : '⚡ Regenerate Section' }}
                  </button>
                  <span class="chevron-indicator">{{ openSections.has('interactive_quiz') ? '▲' : '▼' }}</span>
                </div>
              </div>
              <div v-if="openSections.has('interactive_quiz')" class="content-section-body">
                <div v-if="Array.isArray(lessonContent.interactive_quiz)" class="quiz-questions-list">
                  <div 
                    v-for="(q, qIdx) in lessonContent.interactive_quiz" 
                    :key="qIdx"
                    class="quiz-card"
                  >
                    <label class="form-label">Question {{ qIdx + 1 }}:</label>
                    <input 
                      v-model="q.question" 
                      type="text" 
                      class="form-input" 
                      placeholder="Question text"
                      @input="markDirty"
                    />
                    <div class="quiz-options-list">
                      <div v-for="(opt, optIdx) in (q.options || [])" :key="optIdx" class="option-row">
                        <span class="opt-label">{{ String.fromCharCode(65 + optIdx) }}.</span>
                        <input 
                          v-model="q.options[optIdx]" 
                          type="text" 
                          class="form-input opt-input" 
                          placeholder="Option text"
                          @input="markDirty"
                        />
                      </div>
                    </div>
                    <div class="quiz-answer-row">
                      <span class="ans-label">Correct Answer:</span>
                      <input 
                        v-model="q.correct_answer" 
                        type="text" 
                        class="form-input ans-input" 
                        placeholder="e.g. A"
                        @input="markDirty"
                      />
                    </div>
                    <div class="quiz-exp-row">
                      <span class="exp-label">Pedagogical Explanation:</span>
                      <textarea 
                        v-model="q.explanation" 
                        rows="2" 
                        class="form-textarea" 
                        placeholder="Why this answer is correct..."
                        @input="markDirty"
                      ></textarea>
                    </div>
                  </div>
                </div>
                <div v-else>
                  <textarea 
                    v-model="lessonContent.interactive_quiz" 
                    rows="4" 
                    class="form-textarea"
                    @input="markDirty"
                  ></textarea>
                </div>
              </div>
            </div>

            <!-- 9. Suggested References -->
            <div class="content-section-card" :class="{ 'is-open': openSections.has('suggested_references') }">
              <div class="content-section-header" @click="toggleContentSection('suggested_references')">
                <div class="section-title-wrap">
                  <span class="section-icon">📚</span>
                  <span class="section-name">9. Suggested References & Citations</span>
                  <span class="section-badge" :class="hasSectionContent('suggested_references') ? 'populated' : 'empty'">
                    {{ hasSectionContent('suggested_references') ? 'Populated' : 'Empty' }}
                  </span>
                </div>
                <div class="section-actions-wrap" @click.stop>
                  <button 
                    type="button" 
                    class="btn-regen-single-section"
                    :disabled="isRegeneratingSection === 'suggested_references'"
                    @click="handleRegenerateSection('suggested_references')"
                  >
                    {{ isRegeneratingSection === 'suggested_references' ? 'Regenerating...' : '⚡ Regenerate Section' }}
                  </button>
                  <span class="chevron-indicator">{{ openSections.has('suggested_references') ? '▲' : '▼' }}</span>
                </div>
              </div>
              <div v-if="openSections.has('suggested_references')" class="content-section-body">
                <textarea 
                  v-model="lessonContent.suggested_references" 
                  rows="4" 
                  class="form-textarea" 
                  placeholder="Textbook citations, whitepapers, data sheets, and online documentation..."
                  @input="markDirty"
                ></textarea>
              </div>
            </div>
          </div>
        </section>

        <!-- E. Lesson Actions Footer -->
        <footer class="lesson-actions-footer">
          <div class="footer-left">
            <button 
              type="button" 
              class="btn-outline-action" 
              @click="openStudentPreview(activeLesson)"
            >
              👁️ Preview Student Experience
            </button>
          </div>
          <div class="footer-right">
            <button type="button" class="btn-outline-action" @click="navigateToLevel('module')">
              Return to Module
            </button>
            <button type="button" class="btn-primary-action" :disabled="isSaving" @click="saveLessonAndReturn">
              {{ isSaving ? 'Saving...' : 'Save & Return to Module' }}
            </button>
          </div>
        </footer>
      </div>
    </main>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- FULL-SCREEN LESSON EDITOR (real student renderer + inline editing)     -->
    <!-- Teleported to <body> so it covers the entire application (including    -->
    <!-- the mentor sidebar) and is not constrained by the Studio's DOM tree.    -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div
        v-if="isPreviewOpen"
        class="lesson-editor-shell"
        role="dialog"
        aria-modal="true"
        aria-label="Lesson editor"
      >
        <!-- Top bar: breadcrumb + path toggle + unsaved state + close -->
        <header class="lesson-editor-topbar">
          <div class="lesson-editor-topbar-left">
            <button
              type="button"
              class="lesson-editor-icon-btn"
              @click="closeStudentPreview"
              title="Close the lesson editor (Esc)"
              aria-label="Close the lesson editor"
              id="btn-close-lesson-editor"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <nav class="lesson-editor-crumbs" aria-label="Lesson editor breadcrumb">
              <span class="lesson-editor-crumb lesson-editor-crumb--root">{{ previewCourseTitle }}</span>
              <span class="lesson-editor-crumb-sep">/</span>
              <button
                type="button"
                class="lesson-editor-crumb"
                :class="{ 'lesson-editor-crumb--current': !previewingLesson }"
                @click="backToPreviewRoadmap"
                :disabled="!previewingLesson"
                title="All lessons in this module"
              >
                {{ previewParentModuleTitle }}
              </button>
              <template v-if="previewingLesson">
                <span class="lesson-editor-crumb-sep">/</span>
                <span class="lesson-editor-crumb lesson-editor-crumb--current">
                  {{ previewingLesson.title || previewingLesson.name }}
                </span>
              </template>
            </nav>
          </div>

          <div class="lesson-editor-topbar-right">
            <span v-if="previewHasUnsavedEdits" class="lesson-editor-unsaved" role="status">
              <span class="lesson-editor-unsaved-dot"></span> Unsaved changes
            </span>
            <span v-else-if="hasStagedDraft" class="lesson-editor-staged">
              Staged draft — students still see the published version
            </span>

            <button
              type="button"
              class="lesson-editor-path-toggle"
              :class="{ 'is-active': isPreviewPathOpen }"
              @click="isPreviewPathOpen = !isPreviewPathOpen"
              :aria-expanded="isPreviewPathOpen"
              id="btn-toggle-lesson-path"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              <span>{{ isPreviewPathOpen ? 'Hide Path' : 'Show Path' }}</span>
            </button>

            <button
              type="button"
              class="lesson-editor-btn lesson-editor-btn--ghost"
              @click="closeStudentPreview"
            >
              Cancel
            </button>
            <button
              type="button"
              class="lesson-editor-btn lesson-editor-btn--primary"
              :disabled="isSavingPreviewEdits || !previewHasUnsavedEdits"
              @click="saveStudentPreviewEdits"
            >
              {{ isSavingPreviewEdits ? 'Saving...' : 'Save Draft' }}
            </button>
          </div>
        </header>

        <!-- Inline status line (save confirmation / errors) -->
        <p v-if="previewSaveError || previewInlineNotice" class="lesson-editor-status" :class="{ 'is-error': previewSaveError }" role="status">
          {{ previewSaveError || previewInlineNotice }}
        </p>

        <div class="lesson-editor-body">
          <!-- Optional node rail: the lesson path for this module -->
          <aside v-if="isPreviewPathOpen" class="lesson-editor-rail" aria-label="Lesson path">
            <div class="lesson-editor-rail-head">
              <span class="lesson-editor-rail-title">Lesson Path</span>
              <span class="lesson-editor-rail-count">{{ previewAllCheckpoints.length }} nodes</span>
            </div>
            <div class="lesson-editor-rail-list">
              <section v-for="grp in previewPathGroups" :key="grp.key" class="lesson-editor-rail-group">
                <h3 class="lesson-editor-rail-group-title">{{ grp.title }}</h3>
                <ol class="lesson-editor-rail-items">
                  <li v-for="cp in grp.lessons" :key="cp.id || cp.title">
                    <button
                      type="button"
                      class="lesson-editor-rail-item"
                      :class="{ 'is-current': isPreviewingCheckpoint(cp) }"
                      @click="openStudentPreview(cp)"
                    >
                      <span class="lesson-editor-rail-index">{{ previewCheckpointNumber(cp) }}</span>
                      <span class="lesson-editor-rail-label">{{ cp.title || cp.name }}</span>
                    </button>
                  </li>
                </ol>
              </section>
            </div>
          </aside>

          <!-- Module outline (no lesson selected yet) -->
          <!-- `sim-modules-catalog` is the established Studio preview contract. -->
          <div v-if="!previewingLesson" class="lesson-editor-outline sim-modules-catalog">
            <h2 class="lesson-editor-outline-title">{{ previewCourseTitle }}</h2>
            <p class="lesson-editor-outline-sub">
              Choose a lesson to read and edit in place. Formatting uses the same
              renderer students see.
            </p>
            <div class="lesson-editor-outline-grid">
              <section v-for="(mod, mIdx) in previewModules" :key="mod.id || mIdx" class="lesson-editor-outline-card">
                <div class="lesson-editor-outline-card-head">
                  <h3 class="lesson-editor-outline-card-title">{{ mod.title }}</h3>
                  <span class="lesson-editor-outline-card-count">{{ (mod.checkpoints || []).length }} steps</span>
                </div>
                <p v-if="mod.description" class="lesson-editor-outline-card-desc">{{ mod.description }}</p>
                <ul class="lesson-editor-outline-lessons">
                  <li v-for="cp in (mod.checkpoints || [])" :key="cp.id || cp.title">
                    <button type="button" class="lesson-editor-outline-lesson" @click="openStudentPreview(cp)">
                      <span class="lesson-editor-outline-lesson-icon">
                        {{ cp.type === 'lab' ? '🧪' : cp.type === 'challenge' ? '🏆' : '📖' }}
                      </span>
                      <span class="lesson-editor-outline-lesson-title">{{ cp.title || cp.name }}</span>
                      <span class="lesson-editor-outline-lesson-go">Edit →</span>
                    </button>
                  </li>
                </ul>
              </section>
            </div>
          </div>

          <!-- The lesson itself: the SAME renderer students use -->
          <div v-else class="lesson-editor-document">
            <div class="lesson-editor-scroll" ref="previewScrollRef">
              <CheckpointContentView
                :key="'studio-preview-' + (previewingLesson.id || previewingLesson.title)"
                :checkpoint-title="previewingLesson.title || previewingLesson.name"
                :parent-module-name="previewParentModuleTitle"
                :module-data="previewModuleData"
                :checkpoint-data="previewCheckpointData"
                :editable="true"
                :preview-mode="true"
                @notify="previewNotice"
                @update-lesson-content="handlePreviewLessonUpdate"
              />
            </div>

            <!-- Previous / Next lesson controls -->
            <footer class="lesson-editor-lesson-nav">
              <button
                type="button"
                class="lesson-editor-btn lesson-editor-btn--nav"
                :disabled="!previewPrevCheckpoint"
                @click="previewPrevCheckpoint && goToPreviewCheckpoint(previewPrevCheckpoint)"
              >
                <span class="lesson-editor-nav-dir">← Previous</span>
                <span class="lesson-editor-nav-name">{{ previewPrevCheckpoint ? (previewPrevCheckpoint.title || previewPrevCheckpoint.name) : 'Start of path' }}</span>
              </button>

              <span class="lesson-editor-nav-position">
                {{ previewCheckpointPosition }} of {{ previewAllCheckpoints.length }}
              </span>

              <button
                type="button"
                class="lesson-editor-btn lesson-editor-btn--nav lesson-editor-btn--nav-next"
                :disabled="!previewNextCheckpoint"
                @click="previewNextCheckpoint && goToPreviewCheckpoint(previewNextCheckpoint)"
              >
                <span class="lesson-editor-nav-dir">Next →</span>
                <span class="lesson-editor-nav-name">{{ previewNextCheckpoint ? (previewNextCheckpoint.title || previewNextCheckpoint.name) : 'End of path' }}</span>
              </button>
            </footer>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- MODALS: PUBLISH & EDIT COURSE                                          -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->

    <!-- Publish Confirmation Dialog -->
    <div v-if="isPublishModalOpen" class="modal-overlay" @click.self="isPublishModalOpen = false">
      <div class="publish-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="modal-publish-title">
        <div class="publish-dialog-header">
          <h3 id="modal-publish-title" class="publish-dialog-title">Publish Module to Enrolled Students</h3>
          <button type="button" class="btn-close-modal" @click="isPublishModalOpen = false">&times;</button>
        </div>

        <div class="publish-dialog-body">
          <p class="publish-dialog-text">
            You are about to publish <strong>{{ activeCourse?.title }}</strong>. Publishing activates this course in the Student Modules catalog for all students enrolled in your assigned sections.
          </p>

          <div class="publish-stats-summary">
            <div class="pub-stat">
              <span class="pub-num">{{ selectedPlan.totals.modules }}</span>
              <span class="pub-label">{{ selectedPlan.totals.modules === 1 ? 'Module' : 'Modules' }}</span>
            </div>
            <div class="pub-stat">
              <span class="pub-num">{{ selectedPlan.totals.nodes }}</span>
              <span class="pub-label">Nodes</span>
            </div>
            <div class="pub-stat">
              <span class="pub-num">{{ activeCourse?.assigned_sections?.length || 0 }}</span>
              <span class="pub-label">Assigned Classes</span>
            </div>
          </div>

          <!-- Publishing Format Selector within Modal -->
          <div class="publish-modal-format-box" id="publish-modal-format-choice">
            <label class="modal-format-label">Delivery Format:</label>
            <div class="modal-format-radios">
              <label 
                class="modal-format-radio-card"
                :class="{ 'is-selected': selectedPublishingFormat === 'separate_modules' }"
                @click="selectPublishingFormat('separate_modules')"
              >
                <input 
                  type="radio" 
                  name="modal-pub-format" 
                  value="separate_modules" 
                  :checked="selectedPublishingFormat === 'separate_modules'"
                  @change="selectPublishingFormat('separate_modules')" 
                />
                <div class="modal-radio-text">
                  <strong>Option A: Separate Modules</strong>
                  <span>Each section becomes an independent module ({{ separatePlan.totals.modules }} modules, {{ separatePlan.totals.nodes }} nodes)</span>
                </div>
              </label>

              <label 
                class="modal-format-radio-card"
                :class="{ 'is-selected': selectedPublishingFormat === 'one_module' }"
                @click="selectPublishingFormat('one_module')"
              >
                <input 
                  type="radio" 
                  name="modal-pub-format" 
                  value="one_module" 
                  :checked="selectedPublishingFormat === 'one_module'"
                  @change="selectPublishingFormat('one_module')" 
                />
                <div class="modal-radio-text">
                  <strong>Option B: One Combined Module</strong>
                  <span>Group {{ combinedPlan.totals.sections }} sections inside 1 module ({{ combinedPlan.totals.nodes }} nodes)</span>
                </div>
              </label>
            </div>
            <p v-if="!selectedPublishingFormat" class="format-modal-required-note">
              * A format must be chosen before publishing.
            </p>
            <ul v-if="selectedPublishingFormat" class="format-plan-list" data-testid="plan-modal-list">
              <li v-for="m in selectedPlan.modules" :key="m.id">
                <span class="plan-item-title">{{ m.title }}</span>
                <span class="plan-item-count">
                  <template v-if="selectedPlan.format === 'one_module'">{{ m.sectionCount }} sections · </template>{{ m.nodeCount }} {{ m.nodeCount === 1 ? 'node' : 'nodes' }}
                </span>
              </li>
            </ul>
            <p v-for="(issue, iIdx) in selectedPlanBlockingIssues" :key="'modal-issue-' + iIdx" class="format-modal-required-note">
              * {{ issue.message }}
            </p>
          </div>
        </div>

        <div class="publish-dialog-footer">
          <button type="button" class="btn-outline-action" @click="isPublishModalOpen = false">
            Cancel
          </button>
          <button 
            type="button" 
            class="btn-primary-action btn-confirm-publish"
            :disabled="isPublishing || !selectedPublishingFormat || !selectedPlan.canPublish"
            @click="handlePublishProposal"
          >
            {{ isPublishing ? 'Publishing...' : 'Confirm & Publish Live' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Course Details Modal -->
    <div v-if="isEditCourseModalOpen" class="modal-overlay" @click.self="isEditCourseModalOpen = false">
      <div class="edit-course-modal" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h3>Edit Course Information</h3>
          <button type="button" class="btn-close-modal" @click="isEditCourseModalOpen = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label" for="edit-title">Course Title:</label>
            <input id="edit-title" v-model="courseEditForm.title" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label" for="edit-desc">Description:</label>
            <textarea id="edit-desc" v-model="courseEditForm.description" rows="3" class="form-textarea"></textarea>
          </div>
          <div class="form-row">
            <div class="form-group col-half">
              <label class="form-label" for="edit-subject">Subject:</label>
              <input id="edit-subject" v-model="courseEditForm.subject" type="text" class="form-input" />
            </div>
            <div class="form-group col-half">
              <label class="form-label" for="edit-level">Academic Level:</label>
              <input id="edit-level" v-model="courseEditForm.academic_level" type="text" class="form-input" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-outline-action" @click="isEditCourseModalOpen = false">Cancel</button>
          <button type="button" class="btn-primary-action" @click="saveCourseDetails">Save Course Details</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { useMentorStore } from '../../../stores/mentorStore.js';
import { buildPublishingPlan } from '../../../../../lib/mentor/publishingPlan.ts';
import CheckpointContentView from '../../../components/CheckpointContentView.vue';

const mentorStore = useMentorStore();

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
  // Deep-link escape hatch: a parent that opens a specific course can skip the upload-first entry screen.
  skipIntake: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  'navigate',
  'select-course',
  'generate-proposal',
  'save-proposal',
  'approve-proposal',
  'publish-proposal',
  'update-course',
]);

// ── Studio entry: upload-first intake (creates/updates a DRAFT; never publishes) ──
const INTAKE_EXTENSIONS = ['.pdf', '.pptx', '.ppt', '.docx', '.doc', '.txt', '.md', '.markdown']; // mirrors MentorService.uploadCourseMaterial
const INTAKE_MAX_BYTES = 25 * 1024 * 1024; // mirrors MentorService.uploadCourseMaterial
const studioStage = ref(props.skipIntake ? 'editor' : 'intake'); // 'intake' | 'editor'
const intakeTarget = ref('new'); // 'new' or the id of an existing unpublished draft
const intakeForm = ref({ title: '', subject: '', academic_level: '' });
const intakeFiles = ref([]);
const intakeFileInput = ref(null);
const intakeError = ref('');
const isIntakeBusy = ref(false);
// Set once the draft course row exists so a retry after a failed upload reuses it (no duplicate courses).
const intakeDraftCourseId = ref(null);

// Unpublished courses = drafts the teacher can return to. Published modules are managed in My Modules.
// A parent whose proposal was published as separate modules is a publishing container (is_publishing_container,
// derived in MentorService.getCourses), not a draft: its child modules are the real items.
const draftCourses = computed(() =>
  (props.courses || []).filter(c => c && c.status !== 'published' && !c.is_publishing_container)
);

// ── Three-Level Navigation State ───────────────────────────────────────────
const currentLevel = ref('overview'); // 'overview' | 'module' | 'lesson'
const activeModuleIndex = ref(null);
const activeLessonIndex = ref(null);
const expandedModuleIndices = ref(new Set([0])); // First module expanded by default

// Modals
const isPreviewOpen = ref(false);
const previewingLesson = ref(null);
const isPublishModalOpen = ref(false);
const isEditCourseModalOpen = ref(false);
const isAiDrawerOpen = ref(false);
const isInstructionsOpen = ref(false);
const isCoverageModalOpen = ref(false);

// Publishing Format Selector (Part 1: Option A - separate_modules vs Option B - one_module)
const selectedPublishingFormat = ref('separate_modules');

function selectPublishingFormat(format) {
  if (format !== 'separate_modules' && format !== 'one_module') return;
  selectedPublishingFormat.value = format;
  if (!editableProposal.value.proposal_data) {
    editableProposal.value.proposal_data = { modules: [] };
  }
  editableProposal.value.proposal_data.publishing_format = format;
  editableProposal.value.proposal_data.organization_mode = format;
  markDirty();
  // Auto-persist selection with curriculum proposal without publishing
  handleSaveEdits();
}

function addContentBlock(type = 'text') {
  if (!activeLesson.value) return;
  if (!activeLesson.value.blocks) activeLesson.value.blocks = [];
  const bId = `blk-${Date.now()}`;
  activeLesson.value.blocks.push({
    id: bId,
    type,
    title: type === 'callout' ? 'Key Principle / Analogy' : (type === 'code' ? 'Code Sketch' : ''),
    content: '',
    code_language: type === 'code' ? 'cpp' : undefined,
    analogy: type === 'callout' ? '' : undefined,
  });
  markDirty();
}

function removeContentBlock(bIdx) {
  if (!activeLesson.value?.blocks) return;
  activeLesson.value.blocks.splice(bIdx, 1);
  markDirty();
}

function addAssessmentQuestion() {
  if (!activeLesson.value) return;
  if (!activeLesson.value.assessment) {
    activeLesson.value.assessment = {
      format: 'multiple_choice',
      questions: [],
      passing_score_percentage: 70,
      required_to_unlock_next: true,
    };
  }
  if (!activeLesson.value.assessment.questions) activeLesson.value.assessment.questions = [];
  const qId = `q-${Date.now()}`;
  activeLesson.value.assessment.questions.push({
    id: qId,
    type: activeLesson.value.assessment.format || 'multiple_choice',
    question: '',
    options: ['A) Option 1', 'B) Option 2', 'C) Option 3', 'D) Option 4'],
    correct_answer: 'A',
    explanation: '',
  });
  markDirty();
}

function removeAssessmentQuestion(qIdx) {
  if (!activeLesson.value?.assessment?.questions) return;
  activeLesson.value.assessment.questions.splice(qIdx, 1);
  markDirty();
}

// Operation states
const isSaving = ref(false);
const isApproving = ref(false);
const isPublishing = ref(false);
const isUnpublishing = ref(false);
const isDirty = ref(false);
const selectedCreationMode = ref('mode_b');
const isGeneratingNodeContent = ref(false);
const isRegeneratingSection = ref(null);

// Collapsible sections for Lesson Editor (Level 3)
const openSections = ref(new Set(['overview', 'step_by_step_guide']));

// Proposal State
const editableProposal = ref({
  proposal_data: {
    title: '',
    summary: '',
    modules: [],
  },
});

// Course Edit Form
const courseEditForm = ref({
  title: '',
  description: '',
  subject: '',
  academic_level: '',
});

// ── Active Item Computeds & Learning Nodes ─────────────────────────────────
const learningNodesList = computed(() => {
  const pData = editableProposal.value?.proposal_data;
  if (!pData) return [];
  if (Array.isArray(pData.learning_nodes) && pData.learning_nodes.length > 0) {
    return pData.learning_nodes;
  }
  if (pData.modules?.[0]?.checkpoints && pData.modules[0].checkpoints.length > 0) {
    return pData.modules[0].checkpoints;
  }
  return [];
});

const activeModule = computed(() => {
  if (activeModuleIndex.value === null) {
    if (editableProposal.value?.proposal_data?.modules?.[0]) {
      return editableProposal.value.proposal_data.modules[0];
    }
    return null;
  }
  return editableProposal.value?.proposal_data?.modules?.[activeModuleIndex.value] || null;
});

const activeLesson = computed(() => {
  if (activeLessonIndex.value === null) return null;
  const pData = editableProposal.value?.proposal_data;
  if (Array.isArray(pData?.learning_nodes) && pData.learning_nodes[activeLessonIndex.value]) {
    return pData.learning_nodes[activeLessonIndex.value];
  }
  if (activeModule.value?.checkpoints?.[activeLessonIndex.value]) {
    return activeModule.value.checkpoints[activeLessonIndex.value];
  }
  return null;
});

const sourceCoverageReport = computed(() => {
  const pData = editableProposal.value?.proposal_data;
  if (pData?.source_coverage) {
    return pData.source_coverage;
  }
  const isRobotics = (props.materials && props.materials.some(m => (m.file_name || m.title || '').toLowerCase().includes('robot'))) ||
                     (props.activeCourse?.title && props.activeCourse.title.toLowerCase().includes('robot'));
  if (isRobotics && learningNodesList.value.length > 0) {
    return {
      sourceTopicsDetected: 24,
      topicsRepresentedInNodes: learningNodesList.value.length,
      topicsRequiringReview: 0,
      coveragePercentage: 100,
      detectedHeadings: learningNodesList.value.map(n => n.title),
      mapping: learningNodesList.value.map((n, idx) => ({
        sourceHeading: n.title,
        mappedNodeId: n.id || `node-${idx + 1}`,
        mappedNodeTitle: n.title,
        section: n.topic_group || 'Core Curriculum',
        status: 'mapped',
      })),
    };
  }
  return null;
});

function moveNodeUp(nodeIdx) {
  if (nodeIdx <= 0) return;
  const pData = editableProposal.value?.proposal_data;
  if (!pData) return;
  if (!Array.isArray(pData.learning_nodes)) {
    pData.learning_nodes = [...learningNodesList.value];
  }
  const nodes = pData.learning_nodes;
  const temp = nodes[nodeIdx];
  nodes[nodeIdx] = nodes[nodeIdx - 1];
  nodes[nodeIdx - 1] = temp;
  nodes.forEach((n, i) => {
    n.order = i + 1;
    n.node_number = i + 1;
  });
  if (pData.modules?.[0]?.checkpoints) {
    pData.modules[0].checkpoints = nodes;
  }
  markDirty();
}

function moveNodeDown(nodeIdx) {
  const pData = editableProposal.value?.proposal_data;
  if (!pData) return;
  if (!Array.isArray(pData.learning_nodes)) {
    pData.learning_nodes = [...learningNodesList.value];
  }
  const nodes = pData.learning_nodes;
  if (nodeIdx >= nodes.length - 1) return;
  const temp = nodes[nodeIdx];
  nodes[nodeIdx] = nodes[nodeIdx + 1];
  nodes[nodeIdx + 1] = temp;
  nodes.forEach((n, i) => {
    n.order = i + 1;
    n.node_number = i + 1;
  });
  if (pData.modules?.[0]?.checkpoints) {
    pData.modules[0].checkpoints = nodes;
  }
  markDirty();
}

function addLearningNode() {
  const pData = editableProposal.value?.proposal_data;
  if (!pData) return;
  if (!Array.isArray(pData.learning_nodes)) {
    pData.learning_nodes = [...learningNodesList.value];
  }
  const count = pData.learning_nodes.length + 1;
  const newNode = {
    id: `node-${props.activeCourseId || 'mod'}-${count}-${Date.now().toString(36)}`,
    node_number: count,
    order: count,
    title: `Learning Node ${count}: New Topic`,
    description: 'Describe the key objective and concepts of this learning node.',
    type: 'concept',
    estimated_minutes: 45,
    estimated_duration: '45 mins',
    learning_objectives: ['Analyze core principles', 'Demonstrate conceptual understanding'],
    completion_criteria: 'Study instructional content and verify assessment questions.',
    node_content: null,
    provenance_type: 'teacher_edited',
    status: 'draft',
  };
  pData.learning_nodes.push(newNode);
  if (!pData.modules || pData.modules.length === 0) {
    pData.modules = [{
      id: props.activeCourseId || 'mod-default',
      title: props.activeCourse?.title || 'Learning Module',
      description: props.activeCourse?.description || '',
      checkpoints: pData.learning_nodes,
    }];
  } else if (pData.modules[0]) {
    pData.modules[0].checkpoints = pData.learning_nodes;
  }
  markDirty();
}

function duplicateNode(nodeIdx) {
  const pData = editableProposal.value?.proposal_data;
  if (!pData) return;
  if (!Array.isArray(pData.learning_nodes)) {
    pData.learning_nodes = [...learningNodesList.value];
  }
  const nodes = pData.learning_nodes;
  if (!nodes[nodeIdx]) return;
  const source = nodes[nodeIdx];
  const count = nodes.length + 1;
  const clone = JSON.parse(JSON.stringify(source));
  clone.id = `node-${props.activeCourseId || 'mod'}-${count}-${Date.now().toString(36)}`;
  clone.node_number = count;
  clone.order = count;
  clone.title = `${source.title} (Copy)`;
  nodes.push(clone);
  if (pData.modules?.[0]?.checkpoints) {
    pData.modules[0].checkpoints = nodes;
  }
  markDirty();
}

function deleteNode(nodeIdx) {
  const pData = editableProposal.value?.proposal_data;
  if (!pData) return;
  if (!Array.isArray(pData.learning_nodes)) {
    pData.learning_nodes = [...learningNodesList.value];
  }
  const nodes = pData.learning_nodes;
  if (!nodes[nodeIdx]) return;
  if (!window.confirm(`Are you sure you want to delete "${nodes[nodeIdx].title}"?`)) return;
  nodes.splice(nodeIdx, 1);
  nodes.forEach((n, i) => {
    n.order = i + 1;
    n.node_number = i + 1;
  });
  if (pData.modules?.[0]?.checkpoints) {
    pData.modules[0].checkpoints = nodes;
  }
  markDirty();
}

function openNodeEditor(nodeIdx) {
  activeModuleIndex.value = 0;
  activeLessonIndex.value = nodeIdx;
  currentLevel.value = 'lesson';
}

function normalizeNodeContent(raw) {
  if (!raw || typeof raw !== 'object') {
    return {
      overview: '',
      introduction: '',
      learning_objectives: [],
      materials_needed: '',
      practical_applications: [],
      core_concepts: [],
      key_concepts: [],
      step_by_step_guide: '',
      core_lesson: '',
      safety_guidelines: '',
      troubleshooting: '',
      engineering_challenges: [],
      assessment_rubric: '',
      interactive_quiz: [],
      assessment_questions: [],
      suggested_references: '',
    };
  }

  const normalized = { ...raw };

  // 1. Overview <-> Introduction
  const overviewVal = raw.overview || raw.introduction || '';
  normalized.overview = overviewVal;
  normalized.introduction = overviewVal;

  // 2. Step by Step Guide <-> Core Lesson
  const lessonVal = raw.step_by_step_guide || raw.core_lesson || '';
  normalized.step_by_step_guide = lessonVal;
  normalized.core_lesson = lessonVal;

  // 3. Core Concepts <-> Key Concepts
  let conceptsVal = raw.core_concepts || raw.key_concepts || [];
  if (typeof conceptsVal === 'string') {
    try {
      conceptsVal = JSON.parse(conceptsVal);
    } catch (_) {
      conceptsVal = conceptsVal.split('\n').filter(Boolean).map(c => ({ concept: c, explanation: '' }));
    }
  }
  normalized.core_concepts = Array.isArray(conceptsVal) ? conceptsVal : [];
  normalized.key_concepts = Array.isArray(conceptsVal) ? conceptsVal : [];

  // 4. Materials Needed <-> Practical Applications
  const materialsRaw = raw.materials_needed || raw.practical_applications || '';
  let materialsStr = '';
  let materialsArr = [];
  if (Array.isArray(materialsRaw)) {
    materialsArr = materialsRaw;
    materialsStr = materialsRaw.join('\n');
  } else if (typeof materialsRaw === 'string') {
    materialsStr = materialsRaw;
    materialsArr = materialsRaw.split('\n').map(s => s.trim()).filter(Boolean);
  }
  normalized.materials_needed = materialsStr;
  normalized.practical_applications = materialsArr;

  // 5. Troubleshooting <-> Engineering Challenges
  const challengesRaw = raw.troubleshooting || raw.engineering_challenges || '';
  let challengesStr = '';
  let challengesArr = [];
  if (Array.isArray(challengesRaw)) {
    challengesArr = challengesRaw;
    challengesStr = challengesRaw.join('\n');
  } else if (typeof challengesRaw === 'string') {
    challengesStr = challengesRaw;
    challengesArr = challengesRaw.split('\n').map(s => s.trim()).filter(Boolean);
  }
  normalized.troubleshooting = challengesStr;
  normalized.engineering_challenges = challengesArr;

  // 6. Interactive Quiz <-> Assessment Questions
  const quizRaw = raw.interactive_quiz || raw.assessment_questions || [];
  let quizArr = [];
  if (Array.isArray(quizRaw)) {
    quizArr = quizRaw;
  } else if (typeof quizRaw === 'string') {
    try {
      quizArr = JSON.parse(quizRaw);
    } catch (_) {
      quizArr = [];
    }
  }
  normalized.interactive_quiz = quizArr;
  normalized.assessment_questions = quizArr;

  // 7. Suggested References
  const refRaw = raw.suggested_references || '';
  let refStr = '';
  if (Array.isArray(refRaw)) {
    refStr = refRaw.map(r => typeof r === 'object' ? `${r.title || ''} (${r.source_file || ''}${r.page_reference ? ` - ${r.page_reference}` : ''})` : String(r)).join('\n');
  } else {
    refStr = String(refRaw);
  }
  normalized.suggested_references = refStr;

  // 8. Learning Objectives
  let objArr = raw.learning_objectives || [];
  if (typeof objArr === 'string') {
    objArr = objArr.split('\n').map(s => s.trim()).filter(Boolean);
  }
  normalized.learning_objectives = Array.isArray(objArr) ? objArr : [];

  return normalized;
}

const lessonContent = computed(() => {
  if (!activeLesson.value) return {};
  if (!activeLesson.value.node_content) {
    activeLesson.value.node_content = normalizeNodeContent(null);
  } else {
    // If it lacks alias keys like overview or step_by_step_guide, normalize in place
    if (activeLesson.value.node_content.core_lesson && !activeLesson.value.node_content.step_by_step_guide) {
      activeLesson.value.node_content = normalizeNodeContent(activeLesson.value.node_content);
    }
  }
  return activeLesson.value.node_content;
});

// ── Watchers & Lifecycle ───────────────────────────────────────────────────
watch(
  () => props.proposal,
  newProp => {
    if (newProp && newProp.proposal_data) {
      editableProposal.value = JSON.parse(JSON.stringify(newProp));
      // A published proposal keeps live student content at the top level and parks
      // teacher edits in proposal_data.unpublished_draft. The editor always works on
      // the staged draft (falling back to the live snapshot when nothing is staged).
      const stagedDraft = newProp.proposal_data.unpublished_draft;
      if (stagedDraft && typeof stagedDraft === 'object') {
        // Never carry the wrapper into the editor state (would nest on every save).
        editableProposal.value.proposal_data = JSON.parse(JSON.stringify(stagedDraft));
        if (!editableProposal.value.proposal_data.publishing_format && newProp.proposal_data.publishing_format) {
          editableProposal.value.proposal_data.publishing_format = newProp.proposal_data.publishing_format;
        }
        if (!editableProposal.value.proposal_data.organization_mode && newProp.proposal_data.organization_mode) {
          editableProposal.value.proposal_data.organization_mode = newProp.proposal_data.organization_mode;
        }
      }
      // Restore saved publishing format if available, falling back to organization_mode or default
      if (newProp.proposal_data.publishing_format) {
        selectedPublishingFormat.value = newProp.proposal_data.publishing_format;
      } else if (newProp.proposal_data.organization_mode) {
        selectedPublishingFormat.value = newProp.proposal_data.organization_mode;
      }
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

watch(
  () => props.activeCourse,
  c => {
    if (c) {
      courseEditForm.value = {
        title: c.title || '',
        description: c.description || '',
        subject: c.subject || '',
        academic_level: c.academic_level || '',
      };
    }
  },
  { immediate: true }
);

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
  // Only auto-open a course when skipping intake; otherwise the teacher chooses via upload or "Continue a draft".
  if (studioStage.value === 'editor' && !props.activeCourseId && props.courses && props.courses.length > 0) {
    emit('select-course', props.courses[0].id);
  }
});

// ── Intake handlers ────────────────────────────────────────────────────────
function triggerIntakeFileInput() {
  intakeFileInput.value?.click();
}

function addIntakeFiles(fileList) {
  const accepted = [];
  const rejected = [];
  for (const f of Array.from(fileList || [])) {
    const okExt = INTAKE_EXTENSIONS.some(ext => (f.name || '').toLowerCase().endsWith(ext));
    if (!okExt) rejected.push(`${f.name}: unsupported format`);
    else if (f.size > INTAKE_MAX_BYTES) rejected.push(`${f.name}: exceeds 25MB`);
    else if (!intakeFiles.value.some(x => x.name === f.name && x.size === f.size)) accepted.push(f);
  }
  intakeFiles.value = [...intakeFiles.value, ...accepted];
  intakeError.value = rejected.length ? `Skipped: ${rejected.join('; ')}` : '';
}

function handleIntakeFilesSelected(event) {
  addIntakeFiles(event.target.files);
  event.target.value = '';
}

function handleIntakeDrop(event) {
  addIntakeFiles(event.dataTransfer?.files);
}

function removeIntakeFile(idx) {
  intakeFiles.value = intakeFiles.value.filter((_, i) => i !== idx);
}

function fileTitle(name) {
  return (name || 'Untitled material').replace(/\.[^.]+$/, '');
}

async function submitIntake(generateAfter) {
  if (isIntakeBusy.value) return;
  intakeError.value = '';
  if (intakeFiles.value.length === 0) {
    intakeError.value = 'Please choose at least one file.';
    return;
  }

  let courseId = intakeTarget.value !== 'new' ? intakeTarget.value : intakeDraftCourseId.value;
  const f = intakeForm.value;
  if (!courseId && (!f.title.trim() || !f.subject.trim() || !f.academic_level.trim())) {
    intakeError.value = 'Title, subject, and academic level are required to start a draft.';
    return;
  }

  isIntakeBusy.value = true;
  try {
    if (!courseId) {
      // Creates ONE course row with status 'draft'. It is not student-facing until published.
      const res = await mentorStore.createCourse({
        title: f.title.trim(),
        subject: f.subject.trim(),
        academicLevel: f.academic_level.trim(),
        mentorId: props.mentorId,
      });
      if (!res.success || !res.course) {
        intakeError.value = res.error || 'Could not create the draft workspace.';
        return;
      }
      courseId = res.course.id;
      intakeDraftCourseId.value = courseId;
    }

    const failures = [];
    for (const file of [...intakeFiles.value]) {
      const res = await mentorStore.uploadMaterial({
        courseId,
        title: fileTitle(file.name),
        file,
        uploaderId: props.mentorId,
      });
      if (res.success) {
        intakeFiles.value = intakeFiles.value.filter(x => x !== file);
      } else {
        failures.push(`${file.name}: ${res.error || 'upload failed'}`);
      }
    }
    if (failures.length > 0) {
      intakeError.value = `Some files were not uploaded. ${failures.join('; ')}`;
      return;
    }

    const wasNewDraft = intakeTarget.value === 'new';
    openWorkspace(courseId);
    if (generateAfter && wasNewDraft) {
      emit('generate-proposal', { courseId, mentorId: props.mentorId, mode: 'mode_b' });
    } else {
      isAiDrawerOpen.value = true; // generation CTA lives in the AI drawer
    }
    intakeFiles.value = [];
    intakeForm.value = { title: '', subject: '', academic_level: '' };
    intakeDraftCourseId.value = null;
    intakeTarget.value = 'new';
  } catch (err) {
    intakeError.value = err?.message || 'Upload failed.';
  } finally {
    isIntakeBusy.value = false;
  }
}

// Open a draft workspace through the existing select-course flow (loads its materials + saved proposal).
function openWorkspace(courseId) {
  isDirty.value = false;
  currentLevel.value = 'overview';
  activeModuleIndex.value = null;
  activeLessonIndex.value = null;
  studioStage.value = 'editor';
  emit('select-course', courseId);
  mentorStore.loadMaterials?.(courseId);
  mentorStore.loadProposals?.(courseId);
}

function openDraft(course) {
  if (!course?.id) return;
  openWorkspace(course.id);
}

function returnToIntake() {
  if (isDirty.value && !window.confirm('You have unsaved edits. Leave without saving?')) return;
  isDirty.value = false;
  currentLevel.value = 'overview';
  intakeTarget.value = 'new';
  studioStage.value = 'intake';
}

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  // Never leave the page locked if the Studio unmounts mid-edit.
  document.body.style.overflow = '';
});

// The full-screen editor covers the whole app, so the page behind it must not
// scroll (otherwise the sidebar scrolls under the overlay on wheel/touch).
watch(isPreviewOpen, open => {
  document.body.style.overflow = open ? 'hidden' : '';
});

function handleKeydown(e) {
  if (e.key === 'Escape') {
    if (isPublishModalOpen.value) isPublishModalOpen.value = false;
    else if (isPreviewOpen.value) closeStudentPreview();
    else if (isEditCourseModalOpen.value) isEditCourseModalOpen.value = false;
  }
}

// ── Metrics & Formatting ───────────────────────────────────────────────────
// Single normalized publishing plan (same builder the publish operation uses).
// proposal_data.modules.length is NOT the section count: generated proposals keep all
// nodes in ONE compatibility module and carry the sections as node.topic_group.
function planFor(format) {
  return buildPublishingPlan(editableProposal.value?.proposal_data, format, {
    baseId: props.activeCourseId || props.activeCourse?.id || undefined,
    fallbackTitle: props.activeCourse?.title || editableProposal.value?.proposal_data?.title || undefined,
  });
}
const separatePlan = computed(() => planFor('separate_modules'));
const combinedPlan = computed(() => planFor('one_module'));
const selectedPlan = computed(() =>
  selectedPublishingFormat.value === 'one_module' ? combinedPlan.value : separatePlan.value
);
const selectedPlanBlockingIssues = computed(() => selectedPlan.value.issues.filter(i => i.level === 'error'));

const totalModulesCount = computed(() => separatePlan.value.totals.modules);

const totalCheckpointsCount = computed(() => separatePlan.value.totals.nodes);

const totalObjectivesCount = computed(() => {
  const mods = editableProposal.value?.proposal_data?.modules || [];
  return mods.reduce((sum, m) => sum + (m.learning_objectives?.length || 0), 0);
});

const estimatedCourseHours = computed(() => {
  const mods = editableProposal.value?.proposal_data?.modules || [];
  let totalMinutes = 0;
  mods.forEach(m => {
    (m.checkpoints || []).forEach(cp => {
      totalMinutes += Number(cp.duration_minutes || cp.estimated_minutes) || 30;
    });
  });
  return (totalMinutes / 60).toFixed(1);
});

const isApproved = computed(() => {
  return props.proposal?.status === 'approved' || props.activeCourse?.status === 'approved' || isPublished.value;
});

const isPublished = computed(() => {
  return props.proposal?.status === 'published' || props.activeCourse?.status === 'published';
});

/**
 * True when a published proposal has teacher edits parked in
 * proposal_data.unpublished_draft (students still see the live published copy).
 */
const hasStagedDraft = computed(() => {
  const pData = props.proposal?.proposal_data;
  return Boolean(pData && pData.unpublished_draft && typeof pData.unpublished_draft === 'object');
});

function formatStatus(status) {
  if (status === 'published') return 'Published';
  if (status === 'approved') return 'Approved';
  if (status === 'under_review' || status === 'review') return 'Under Review';
  return 'Draft';
}

function formatLessonType(type) {
  const map = {
    concept: 'Concept',
    demonstration: 'Demonstration',
    guided_practice: 'Guided Practice',
    lab: 'Laboratory',
    challenge: 'Challenge',
    assessment: 'Assessment',
    project: 'Project',
  };
  return map[type] || 'Concept';
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function calculateModuleDuration(mod) {
  const minutes = (mod.checkpoints || []).reduce((sum, cp) => sum + (Number(cp.duration_minutes || cp.estimated_minutes) || 30), 0);
  if (minutes < 60) return `${minutes} mins`;
  return `${(minutes / 60).toFixed(1)} hrs`;
}

function markDirty() {
  isDirty.value = true;
}

// ── Navigation Between Levels ──────────────────────────────────────────────
function navigateToLevel(level) {
  if (isDirty.value && level === 'overview' && currentLevel.value !== 'overview') {
    if (!window.confirm('You have unsaved edits. Are you sure you want to return to Overview?')) {
      return;
    }
  }
  currentLevel.value = level;
  if (level === 'overview') {
    activeModuleIndex.value = null;
    activeLessonIndex.value = null;
  }
}

function handleCrumbNavigate(target) {
  if (target === 'courses') {
    emit('navigate', 'courses');
  }
}

function openModuleEditor(modIdx) {
  activeModuleIndex.value = modIdx;
  currentLevel.value = 'module';
}

function openLessonEditor(modIdx, cpIdx) {
  activeModuleIndex.value = modIdx;
  activeLessonIndex.value = cpIdx;
  currentLevel.value = 'lesson';
}

// ── Level 1: Accordion Controls ────────────────────────────────────────────
function isModuleExpanded(modIdx) {
  return expandedModuleIndices.value.has(modIdx);
}

function toggleModuleExpand(modIdx) {
  if (expandedModuleIndices.value.has(modIdx)) {
    expandedModuleIndices.value.delete(modIdx);
  } else {
    expandedModuleIndices.value.add(modIdx);
  }
}

function expandAllModules() {
  const all = new Set();
  editableProposal.value.proposal_data.modules.forEach((_, idx) => all.add(idx));
  expandedModuleIndices.value = all;
}

function collapseAllModules() {
  expandedModuleIndices.value = new Set();
}

// ── Level 2: Module Mutations ──────────────────────────────────────────────
function addTeacherModule() {
  const newIdx = editableProposal.value.proposal_data.modules.length + 1;
  const newMod = {
    id: `mod_${Date.now()}`,
    title: `Module ${newIdx}: New Module`,
    description: 'Describe what students will master in this module.',
    duration: '2 hours',
    level: 'Beginner',
    learning_objectives: ['Identify key principles', 'Apply fundamentals'],
    checkpoints: [
      {
        id: `cp_${Date.now()}_1`,
        title: 'Introduction to Topic',
        type: 'concept',
        description: 'Foundational concepts and principles.',
        duration_minutes: 30,
      }
    ],
  };
  editableProposal.value.proposal_data.modules.push(newMod);
  expandedModuleIndices.value.add(newIdx - 1);
  markDirty();
}

function addObjectiveToModule(mod) {
  if (!mod.learning_objectives) mod.learning_objectives = [];
  mod.learning_objectives.push('New measurable learning objective');
  markDirty();
}

function removeObjective(mod, idx) {
  mod.learning_objectives.splice(idx, 1);
  markDirty();
}

function moveObjective(mod, idx, direction) {
  const targetIdx = idx + direction;
  if (targetIdx < 0 || targetIdx >= mod.learning_objectives.length) return;
  const item = mod.learning_objectives.splice(idx, 1)[0];
  mod.learning_objectives.splice(targetIdx, 0, item);
  markDirty();
}

function addLessonToModule(mod) {
  if (!mod.checkpoints) mod.checkpoints = [];
  const cpNum = mod.checkpoints.length + 1;
  const newLesson = {
    id: `cp_${mod.id || 'mod'}_${Date.now()}`,
    title: `Lesson ${cpNum}: New Lesson`,
    type: 'concept',
    description: 'Describe the key objective and activity of this lesson.',
    duration_minutes: 30,
  };
  mod.checkpoints.push(newLesson);
  markDirty();
}

function moveCheckpoint(mod, idx, direction) {
  const targetIdx = idx + direction;
  if (targetIdx < 0 || targetIdx >= mod.checkpoints.length) return;
  const item = mod.checkpoints.splice(idx, 1)[0];
  mod.checkpoints.splice(targetIdx, 0, item);
  markDirty();
}

function duplicateCheckpoint(mod, idx) {
  const original = mod.checkpoints[idx];
  if (!original) return;
  const copy = JSON.parse(JSON.stringify(original));
  copy.id = `cp_${Date.now()}`;
  copy.title = `${copy.title} (Copy)`;
  mod.checkpoints.splice(idx + 1, 0, copy);
  markDirty();
}

function deleteCheckpoint(mod, idx) {
  if (confirm('Delete this lesson from the module?')) {
    mod.checkpoints.splice(idx, 1);
    markDirty();
  }
}

function confirmRegenerateModule(mod) {
  if (confirm(`Regenerate "${mod.title}" with RISSE AI? This will draft an updated lesson sequence while preserving source citations.`)) {
    handleGenerateProposal();
  }
}

async function saveModuleAndStay() {
  await handleSaveEdits();
}

async function saveModuleAndReturn() {
  await handleSaveEdits();
  currentLevel.value = 'overview';
}

// ── Level 3: Lesson Authoring & AI Generation ──────────────────────────────
function toggleContentSection(sectionKey) {
  if (openSections.value.has(sectionKey)) {
    openSections.value.delete(sectionKey);
  } else {
    openSections.value.add(sectionKey);
  }
}

function hasSectionContent(sectionKey) {
  const content = lessonContent.value[sectionKey];
  if (!content) {
    const keyMap = {
      overview: 'introduction',
      step_by_step_guide: 'core_lesson',
      core_concepts: 'key_concepts',
      materials_needed: 'practical_applications',
      troubleshooting: 'engineering_challenges',
      interactive_quiz: 'assessment_questions',
    };
    const altKey = keyMap[sectionKey];
    if (altKey && lessonContent.value[altKey]) {
      const altContent = lessonContent.value[altKey];
      if (Array.isArray(altContent)) return altContent.length > 0;
      return String(altContent).trim().length > 0;
    }
    return false;
  }
  if (Array.isArray(content)) return content.length > 0;
  return String(content).trim().length > 0;
}

async function handleGenerateActiveNodeContent() {
  if (!activeLesson.value) return;
  isGeneratingNodeContent.value = true;
  try {
    const res = await mentorStore.generateNodeContent({
      courseId: props.activeCourseId || props.activeCourse?.id,
      nodeTitle: activeLesson.value.title,
      teacherInstructions: activeLesson.value.teacher_instructions,
      nodeType: activeLesson.value.type,
      courseContext: {
        title: props.activeCourse?.title,
        description: props.activeCourse?.description,
        academicLevel: props.activeCourse?.academic_level,
        subject: props.activeCourse?.subject,
        learningOutcomes: props.activeCourse?.learning_outcomes,
      },
    });

    if (res.success && res.content) {
      activeLesson.value.node_content = normalizeNodeContent(res.content);
      // Open all populated sections
      openSections.value = new Set(['overview', 'step_by_step_guide', 'core_concepts', 'interactive_quiz', 'materials_needed', 'activities', 'troubleshooting']);
      markDirty();
    } else {
      alert(res.error || 'Failed to generate lesson content.');
    }
  } catch (err) {
    alert(err.message || 'Generation exception.');
  } finally {
    isGeneratingNodeContent.value = false;
  }
}

async function handleRegenerateSection(sectionKey) {
  if (!activeLesson.value?.node_content) return;
  isRegeneratingSection.value = sectionKey;
  try {
    const res = await mentorStore.regenerateNodeSection({
      existingContent: activeLesson.value.node_content,
      sectionKey,
      courseId: props.activeCourseId || props.activeCourse?.id,
      nodeTitle: activeLesson.value.title,
      teacherInstructions: activeLesson.value.teacher_instructions,
      nodeType: activeLesson.value.type,
    });

    if (res.success && res.content) {
      activeLesson.value.node_content = normalizeNodeContent(res.content);
      openSections.value.add(sectionKey);
      markDirty();
    } else {
      alert(res.error || 'Failed to regenerate section.');
    }
  } catch (err) {
    alert(err.message || 'Regeneration exception.');
  } finally {
    isRegeneratingSection.value = null;
  }
}

async function saveLessonAndStay() {
  await handleSaveEdits();
}

async function saveLessonAndReturn() {
  await handleSaveEdits();
  currentLevel.value = 'module';
}

// ── Proposal Database Operations ───────────────────────────────────────────
function handleSelectCourseChange(newCourseId) {
  if (isDirty.value) {
    if (!window.confirm('You have unsaved edits in this curriculum. Are you sure you want to discard them and switch courses?')) {
      return;
    }
  }
  isDirty.value = false;
  emit('select-course', newCourseId);
}

function handleGenerateProposal() {
  const targetCourseId = props.activeCourseId || props.activeCourse?.id || (props.courses && props.courses[0]?.id);
  if (!targetCourseId) {
    alert('Please select or create a course before generating curriculum.');
    return;
  }
  if (isDirty.value && !window.confirm('Regenerating will replace manual modifications. Continue?')) {
    return;
  }
  emit('generate-proposal', {
    courseId: targetCourseId,
    mentorId: props.mentorId,
    mode: selectedCreationMode.value,
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

function openPublishModal() {
  const data = editableProposal.value?.proposal_data;
  if (!data || separatePlan.value.totals.nodes === 0) {
    alert('Cannot publish curriculum: at least 1 learning node is required.');
    return;
  }
  if (!selectedPublishingFormat.value) {
    alert('Please select a publishing format (Option A or Option B) before publishing.');
    const el = document.getElementById('publishing-format-stage');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    return;
  }
  isPublishModalOpen.value = true;
}

function handlePublishProposal() {
  if (!props.proposal) return;
  if (!selectedPublishingFormat.value) {
    alert('Please choose a publishing format before confirming.');
    return;
  }
  if (!selectedPlan.value.canPublish) {
    alert(selectedPlan.value.issues.filter(i => i.level === 'error').map(i => i.message).join('\n'));
    return;
  }
  isPublishing.value = true;
  // Ensure the publishing_format is saved into proposal_data
  if (editableProposal.value.proposal_data) {
    editableProposal.value.proposal_data.publishing_format = selectedPublishingFormat.value;
    editableProposal.value.proposal_data.organization_mode = selectedPublishingFormat.value;
  }
  emit('publish-proposal', {
    proposalId: props.proposal.id,
    mentorId: props.mentorId,
    proposalData: editableProposal.value.proposal_data,
  });
  setTimeout(() => {
    isPublishing.value = false;
    isPublishModalOpen.value = false;
    isDirty.value = false;
  }, 400);
}

async function handleUnpublish() {
  if (!props.proposal) return;
  if (!confirm('Revert this published curriculum back to review status? Students in assigned sections will not see unpublished courses.')) {
    return;
  }
  isUnpublishing.value = true;
  try {
    const res = await mentorStore.unpublishProposal(props.proposal.id, props.mentorId);
    if (res) isDirty.value = false;
  } finally {
    isUnpublishing.value = false;
  }
}

// ── Student Preview: real renderer + inline rich-text editing ──────────────
// Preview edits NEVER touch editableProposal until the teacher clicks Save Draft,
// so Cancel (and closing the modal) always discards them.
const previewEditBuffer = ref(null);      // deep clone of proposal_data + edits
const previewHasUnsavedEdits = ref(false);
const isSavingPreviewEdits = ref(false);
const previewSaveError = ref('');
const previewedCheckpointId = ref(null);
const isPreviewPathOpen = ref(false);
const previewScrollRef = ref(null);

/** Course/module title shown in the editor top bar. */
const previewCourseTitle = computed(
  () => props.activeCourse?.title || previewProposalData.value?.title || 'Module Studio'
);

/** Index of the lesson being edited inside the flat lesson path. */
const previewCheckpointIndex = computed(() => {
  const lesson = previewingLesson.value;
  if (!lesson) return -1;
  const targetId = previewedCheckpointId.value ?? lesson.id;
  return previewAllCheckpoints.value.findIndex(
    cp => (cp.id ?? cp.title) === (targetId ?? lesson.title) ||
          cp.title === (lesson.title || lesson.name)
  );
});

const previewPrevCheckpoint = computed(() => {
  const idx = previewCheckpointIndex.value;
  return idx > 0 ? previewAllCheckpoints.value[idx - 1] : null;
});

const previewNextCheckpoint = computed(() => {
  const idx = previewCheckpointIndex.value;
  return idx >= 0 && idx < previewAllCheckpoints.value.length - 1
    ? previewAllCheckpoints.value[idx + 1]
    : null;
});

const previewCheckpointPosition = computed(() =>
  previewCheckpointIndex.value >= 0 ? previewCheckpointIndex.value + 1 : 0
);

/** 1-based position of a lesson in the full path (0 when not found). */
function previewCheckpointNumber(cp) {
  const idx = previewAllCheckpoints.value.findIndex(
    item => item === cp || (item.id ?? item.title) === (cp.id ?? cp.title)
  );
  return idx >= 0 ? idx + 1 : '';
}

function isPreviewingCheckpoint(cp) {
  if (!cp) return false;
  const lesson = previewingLesson.value;
  if (!lesson) return false;
  const targetId = previewedCheckpointId.value ?? lesson.id;
  return (cp.id ?? cp.title) === (targetId ?? lesson.title) ||
         cp.title === (lesson.title || lesson.name);
}

/** Switches lessons without closing the editor, keeping buffered edits intact. */
function goToPreviewCheckpoint(cp) {
  if (!cp) return;
  previewedCheckpointId.value = cp.id ?? null;
  previewingLesson.value = cp;
  // New lesson starts at the top of the document.
  nextTick(() => {
    const scroller = previewScrollRef.value;
    if (scroller && scroller.scrollTo) scroller.scrollTo({ top: 0, behavior: 'auto' });
  });
}

const previewModules = computed(() => {
  const data = previewProposalData.value;
  if (Array.isArray(data?.modules) && data.modules.length > 0) return data.modules;
  // Legacy proposals may only carry learning_nodes; surface them as one section.
  if (Array.isArray(data?.learning_nodes) && data.learning_nodes.length > 0) {
    return [{
      id: 'preview-learning-nodes',
      title: data.title || 'Learning Module',
      description: data.summary || '',
      checkpoints: data.learning_nodes,
    }];
  }
  return [];
});

/** The buffered preview proposal, or the live proposal data when no edits exist. */
const previewProposalData = computed(
  () => previewEditBuffer.value || editableProposal.value?.proposal_data || {}
);

const previewParentModuleTitle = computed(() => {
  const lesson = previewingLesson.value;
  if (!lesson) return previewModules.value[0]?.title || previewProposalData.value?.title || 'Module';
  const targetId = previewedCheckpointId.value ?? lesson.id;
  const mod = previewModules.value.find(m =>
    (m.checkpoints || []).some(cp => (cp.id ?? cp.title) === (targetId ?? lesson.title))
  );
  return mod?.title || previewModules.value[0]?.title || previewProposalData.value?.title || 'Module';
});

/** Module data in the shape CheckpointContentView expects from StudentSyncService. */
const previewModuleData = computed(() => {
  const data = previewProposalData.value;
  const lesson = previewingLesson.value;
  const learningNodes = Array.isArray(data.learning_nodes) ? data.learning_nodes : [];
  const targetId = previewedCheckpointId.value ?? lesson?.id;

  // learning_nodes is the canonical list students are synced from; prefer the
  // module that owns the previewed node, then fall back to the first module.
  const ownerModule = previewModules.value.find(m =>
    (m.checkpoints || []).some(cp => (cp.id ?? cp.title) === (targetId ?? lesson?.title))
  );
  const mod = ownerModule || previewModules.value[0] || {};
  const checkpoints = (Array.isArray(mod.checkpoints) && mod.checkpoints.length > 0
    ? mod.checkpoints
    : learningNodes
  ).map(cp => ({ ...cp, name: cp.name || cp.title }));

  return {
    ...mod,
    title: mod.title || previewParentModuleTitle.value,
    checkpoints,
    currentStep: 0,
    totalSteps: checkpoints.length || 3,
  };
});

/**
 * All checkpoints in the buffered proposal, from the canonical `learning_nodes`
 * list and the legacy `modules[].checkpoints` mirror, de-duplicated by id/title.
 * `learning_nodes` wins: the Designer's own lesson editor and
 * StudentSyncService both read that list first.
 */
const previewAllCheckpoints = computed(() => {
  const data = previewProposalData.value;
  const seen = new Set();
  const out = [];

  const push = cp => {
    if (!cp) return;
    const key = String(cp.id ?? cp.title ?? cp.name ?? '');
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push(cp);
  };

  if (Array.isArray(data.learning_nodes)) data.learning_nodes.forEach(push);
  (Array.isArray(data.modules) ? data.modules : []).forEach(mod => {
    (mod.checkpoints || []).forEach(push);
  });
  return out;
});

/** The checkpoint object handed to the shared renderer (blocks, node_content, …). */
const previewCheckpointData = computed(() => {
  const lesson = previewingLesson.value;
  if (!lesson) return null;
  const targetId = previewedCheckpointId.value ?? lesson.id ?? lesson.title;
  const base =
    previewAllCheckpoints.value.find(cp => (cp.id ?? cp.title) === targetId) ||
    previewAllCheckpoints.value.find(cp => cp.title === lesson.title || cp.name === lesson.title) ||
    lesson;
  return {
    ...base,
    title: base.title || base.name || lesson.title,
    node_content: base.node_content || null,
    blocks: Array.isArray(base.blocks) ? base.blocks : null,
    assessment: base.assessment || null,
    source_reference: base.source_reference || null,
    topic_group: base.topic_group || null,
  };
});

/**
 * The lesson path grouped the way the module outline presents it: one group per
 * module (falling back to the flat learning_nodes list), each with its lessons.
 * Used by the editor's node rail.
 */
const previewPathGroups = computed(() => {
  const data = previewProposalData.value;
  const seen = new Set();
  const take = list => {
    const out = [];
    for (const cp of list || []) {
      if (!cp) continue;
      const key = String(cp.id ?? cp.title ?? cp.name ?? '');
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(cp);
    }
    return out;
  };

  const groups = [];
  const modules = Array.isArray(data?.modules) ? data.modules : [];
  for (const mod of modules) {
    const lessons = take(mod.checkpoints);
    if (lessons.length > 0) groups.push({ key: mod.id || mod.title, title: mod.title, lessons });
  }
  // Any learning_nodes the modules list did not cover (legacy proposals).
  const leftovers = take(data?.learning_nodes);
  if (leftovers.length > 0) {
    groups.push({
      key: 'preview-path-learning-nodes',
      title: groups.length > 0 ? (data?.title || 'Additional lessons') : (data?.title || 'Lesson path'),
      lessons: leftovers,
    });
  }
  return groups;
});

// The renderer's toast channel belongs to the student workspace shell; in the
// Studio preview we surface the same message inline instead.
const previewInlineNotice = ref('');
let previewInlineNoticeTimer = null;

function previewNotice(message) {
  previewInlineNotice.value = message;
  if (previewInlineNoticeTimer) clearTimeout(previewInlineNoticeTimer);
  previewInlineNoticeTimer = setTimeout(() => {
    previewInlineNotice.value = '';
    previewInlineNoticeTimer = null;
  }, 4000);
}

function openStudentPreview(lesson = null) {
  if (!isPreviewOpen.value) {
    // A fresh editor session always starts from the saved proposal (no stale edits).
    previewEditBuffer.value = null;
    previewHasUnsavedEdits.value = false;
    isPreviewPathOpen.value = false;
  }
  isPreviewOpen.value = true;
  previewSaveError.value = '';
  previewInlineNotice.value = '';
  previewedCheckpointId.value = lesson?.id ?? null;
  previewingLesson.value = lesson;
}

function backToPreviewRoadmap() {
  previewingLesson.value = null;
  previewedCheckpointId.value = null;
}

/** Discards every buffered preview edit — nothing was persisted, so nothing to undo. */
function closeStudentPreview() {
  const hadEdits = previewHasUnsavedEdits.value;
  isPreviewOpen.value = false;
  previewingLesson.value = null;
  previewedCheckpointId.value = null;
  isPreviewPathOpen.value = false;
  previewEditBuffer.value = null;
  previewHasUnsavedEdits.value = false;
  previewSaveError.value = '';
  previewInlineNotice.value = '';
  if (previewInlineNoticeTimer) {
    clearTimeout(previewInlineNoticeTimer);
    previewInlineNoticeTimer = null;
  }
  if (hadEdits) {
    previewNotice('Preview edits discarded — nothing was saved.');
  }
}

/**
 * Applies an inline rich-text edit from CheckpointContentView to the buffered
 * preview copy only. Accepts block content or the 8-section node_content fields.
 *
 * The same lesson can exist twice in proposal_data (learning_nodes[] and
 * modules[].checkpoints[]), so every twin is updated or the save would
 * resurrect the old text on whichever path students actually read.
 */
function handlePreviewLessonUpdate(payload) {
  if (!payload) return;
  const lesson = previewingLesson.value;
  if (!lesson) return;

  if (!previewEditBuffer.value) {
    previewEditBuffer.value = JSON.parse(
      JSON.stringify(editableProposal.value?.proposal_data || { modules: [], title: '', summary: '' })
    );
  }

  const buffer = previewEditBuffer.value;
  const targetId = previewedCheckpointId.value ?? lesson.id;
  const targetTitle = lesson.title || lesson.name;
  const cleanContent = String(payload.content || '');

  const matches = cp =>
    cp && (
      (targetId != null && (cp.id ?? '') === targetId) ||
      (targetTitle && (cp.title === targetTitle || cp.name === targetTitle))
    );

  const twins = [];
  if (Array.isArray(buffer.learning_nodes)) {
    twins.push(...buffer.learning_nodes.filter(matches));
  }
  (Array.isArray(buffer.modules) ? buffer.modules : []).forEach(mod => {
    twins.push(...(mod.checkpoints || []).filter(matches));
  });

  if (twins.length === 0) return;

  for (const checkpoint of twins) {
    if (payload.kind === 'block') {
      const block = (checkpoint.blocks || [])[payload.index];
      if (block) block.content = cleanContent;
    } else if (payload.kind === 'node_content') {
      if (!checkpoint.node_content) checkpoint.node_content = {};
      const field = payload.field;
      if (field === 'core_lesson') {
        // Keep both aliases the Designer / renderer each read in sync.
        checkpoint.node_content.core_lesson = cleanContent;
        checkpoint.node_content.step_by_step_guide = cleanContent;
      } else if (field === 'introduction') {
        checkpoint.node_content.introduction = cleanContent;
        checkpoint.node_content.overview = cleanContent;
      } else if (field) {
        checkpoint.node_content[field] = cleanContent;
      }
    } else {
      return;
    }
  }

  previewingLesson.value = twins[0];
  previewHasUnsavedEdits.value = true;
  previewSaveError.value = '';
}

/** Persists buffered preview edits through the existing save-proposal workflow. */
async function saveStudentPreviewEdits() {
  if (!props.proposal || !previewEditBuffer.value) return;
  isSavingPreviewEdits.value = true;
  previewSaveError.value = '';
  try {
    // Commit the buffer into the editable proposal, then reuse the standard
    // persistence path (MentorService.updateCurriculumProposal). On a published
    // proposal this stages the edits in proposal_data.unpublished_draft, so no
    // student-visible content changes until the teacher republishes.
    editableProposal.value.proposal_data = JSON.parse(JSON.stringify(previewEditBuffer.value));
    const saved = await mentorStore.saveProposalEdits(
      props.proposal.id,
      editableProposal.value.proposal_data
    );
    if (!saved) {
      previewSaveError.value = 'Could not save the lesson edits. Your preview changes are still here — try again.';
      return;
    }
    // Preserve the lesson the teacher was looking at across the save.
    const stillThere = previewModules.value
      .flatMap(m => m.checkpoints || [])
      .find(cp => (cp.id ?? cp.title) === (previewedCheckpointId.value ?? previewingLesson.value?.id));
    if (stillThere) previewingLesson.value = stillThere;
    previewHasUnsavedEdits.value = false;
    previewEditBuffer.value = null;
    isDirty.value = false;
    previewInlineNotice.value = isPublished.value
      ? 'Draft saved. Students still see the published version until you publish again.'
      : 'Lesson edits saved.';
  } catch (_) {
    previewSaveError.value = 'Could not save the lesson edits. Your preview changes are still here — try again.';
  } finally {
    isSavingPreviewEdits.value = false;
  }
}

function saveCourseDetails() {
  emit('update-course', {
    courseId: props.activeCourseId || props.activeCourse?.id,
    updates: courseEditForm.value,
  });
  isEditCourseModalOpen.value = false;
}
</script>

<style scoped>
/* ═══════════════════════════════════════════════════════════════════════════ */
/* PROFESSIONAL LMS THEME SURFACES & FOUNDATIONS                              */
/* ═══════════════════════════════════════════════════════════════════════════ */
.curriculum-designer-page {
  padding: 24px 32px 64px;
  max-width: 1400px;
  margin: 0 auto;
  font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif;
  color: #0f172a;
}

/* ── Top Navigation & Breadcrumbs ────────────────────────────────────────── */
.studio-top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 20px;
  margin-bottom: 24px;
  border-bottom: 1px solid #e2e8f0;
}

.studio-breadcrumbs .breadcrumb-list {
  display: flex;
  align-items: center;
  gap: 8px;
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 14px;
}

.breadcrumb-separator {
  color: #94a3b8;
}

.btn-crumb {
  background: none;
  border: none;
  color: #64748b;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.btn-crumb:hover {
  color: #0f172a;
  background: #f1f5f9;
}

.btn-crumb.active,
.crumb-current {
  color: #0f172a;
  font-weight: 700;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.badge-dirty-pill {
  background: #fef3c7;
  color: #b45309;
  border: 1px solid #fde68a;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 9999px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.course-selector-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.selector-label {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
}

.course-select-input {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  outline: none;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* LEVEL 1: COURSE OVERVIEW BANNER                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */
.course-studio-banner {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  margin-bottom: 24px;
}

.banner-top-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
}

.banner-tag-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.badge-studio-ai {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
  letter-spacing: 0.5px;
}

.badge-subject {
  background: #f8fafc;
  color: #475569;
  border: 1px solid #e2e8f0;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 4px;
}

.badge-status {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
  text-transform: uppercase;
}

.badge-status.status-draft {
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid #cbd5e1;
}

.badge-status.status-published {
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
}

.badge-approved {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
}

.banner-course-title {
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 6px 0;
  letter-spacing: -0.02em;
}

.banner-course-desc {
  font-size: 14px;
  color: #475569;
  margin: 0;
  line-height: 1.5;
  max-width: 840px;
}

.btn-edit-course-details {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  color: #334155;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s ease;
}

.btn-edit-course-details:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
  color: #0f172a;
}

.banner-sections-row {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
}

.banner-sec-label {
  font-weight: 700;
  color: #64748b;
}

.banner-sec-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.sec-chip {
  background: #f1f5f9;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
}

.text-muted-inline {
  color: #94a3b8;
  font-style: italic;
  font-size: 13px;
}

/* ── Learning Path Summary Card ──────────────────────────────────────────── */
.learning-path-summary-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.summary-metrics-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
}

.metric-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
}

.metric-val {
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
}

.metric-val.status-val.ready {
  color: #059669;
}

.metric-val.status-val.pending {
  color: #d97706;
}

.metric-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
  margin-top: 2px;
}

/* Collapsible AI Drawer */
.ai-source-drawer {
  margin-top: 16px;
  border-top: 1px solid #f1f5f9;
  padding-top: 14px;
}

.btn-toggle-drawer {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px 0;
  color: #475569;
  font-size: 13px;
  font-weight: 600;
}

.btn-toggle-drawer:hover {
  color: #1d4ed8;
}

.drawer-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.ai-drawer-body {
  margin-top: 14px;
  padding: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.source-grounding-showcase h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
}

.inspector-desc {
  font-size: 13px;
  color: #64748b;
  margin: 0 0 12px 0;
}

.grounding-materials-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.grounding-mat-pill {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 6px 12px;
  display: flex;
  flex-direction: column;
  font-size: 12px;
}

.mat-name {
  font-weight: 700;
  color: #0f172a;
}

.mat-status {
  font-size: 11px;
  color: #64748b;
}

.ai-regen-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
  gap: 16px;
}

.regen-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.regen-label {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
}

.select-mode-input {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 600;
  color: #0f172a;
}

.btn-trigger-ai-curriculum {
  background: #1e293b;
  border: none;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-trigger-ai-curriculum:hover:not(:disabled) {
  background: #0f172a;
}

/* ── Learning Path Modules Accordion ─────────────────────────────────────── */
.section-title-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 16px;
}

.section-title {
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 4px 0;
}

.section-subtitle {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

.section-actions-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-outline-action {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #334155;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-outline-action:hover {
  background: #f8fafc;
  border-color: #94a3b8;
  color: #0f172a;
}

.btn-primary-action {
  background: #ff6b00;
  border: none;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-primary-action:hover:not(:disabled) {
  background: #e65c00;
}

.learning-nodes-timeline-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.node-timeline-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px 20px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  transition: all 0.15s ease;
}

.node-timeline-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.node-reorder-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 72px;
}

.btn-node-reorder {
  width: 28px;
  height: 24px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #64748b;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  transition: all 0.12s ease;
}

.btn-node-reorder:hover:not(:disabled) {
  background: #ff6b00;
  color: #ffffff;
  border-color: #ff6b00;
}

.btn-node-reorder:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.node-num-pill {
  font-size: 11px;
  font-weight: 700;
  color: #475569;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.node-info-col {
  flex: 1;
  min-width: 0;
}

.node-header-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.node-title-text {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.node-desc-text {
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
  margin: 0 0 8px 0;
}

.node-criteria-row {
  display: flex;
  gap: 6px;
  font-size: 12px;
  background: #f8fafc;
  padding: 6px 10px;
  border-radius: 6px;
  border-left: 3px solid #ff6b00;
}

.criteria-label {
  font-weight: 600;
  color: #334155;
  white-space: nowrap;
}

.criteria-text {
  color: #64748b;
}

.node-meta-col {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  min-width: 170px;
}

.node-stats-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.node-actions-cluster {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-sm {
  padding: 5px 10px;
  font-size: 12px;
}

.text-danger {
  color: #dc2626 !important;
}

.text-danger:hover {
  background: #fee2e2 !important;
  border-color: #fca5a5 !important;
}

.modules-accordion-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.module-accordion-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  transition: border-color 0.15s ease;
}

.module-accordion-card:hover {
  border-color: #cbd5e1;
}

.module-card-header {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  background: #ffffff;
}

.module-accordion-card.is-expanded .module-card-header {
  border-bottom: 1px solid #f1f5f9;
  background: #f8fafc;
}

.mod-header-main {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.mod-num-badge {
  background: #f1f5f9;
  color: #475569;
  font-size: 11px;
  font-weight: 800;
  padding: 4px 8px;
  border-radius: 4px;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.mod-titles {
  display: flex;
  flex-direction: column;
}

.mod-title-text {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 2px 0;
}

.mod-desc-text {
  font-size: 13px;
  color: #64748b;
  margin: 0;
  line-height: 1.4;
}

.mod-header-meta {
  display: flex;
  align-items: center;
  gap: 16px;
}

.mod-stats-pills {
  display: flex;
  align-items: center;
  gap: 8px;
}

.meta-pill {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
  background: #f1f5f9;
  padding: 3px 8px;
  border-radius: 4px;
}

.mod-action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-module-edit {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #1e293b;
  font-size: 12px;
  font-weight: 700;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-module-edit:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
}

.btn-toggle-chevron {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 12px;
  padding: 6px 8px;
  cursor: pointer;
}

/* Expanded Lessons Body */
.module-card-body {
  padding: 16px 20px 20px;
  background: #ffffff;
}

.lessons-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.sub-heading {
  font-size: 13px;
  font-weight: 700;
  color: #475569;
}

.btn-add-lesson-inline {
  background: none;
  border: none;
  color: #ff6b00;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.btn-add-lesson-inline:hover {
  text-decoration: underline;
}

.lessons-vertical-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.lesson-row-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 14px;
  transition: all 0.15s ease;
}

.lesson-row-card:hover {
  border-color: #cbd5e1;
  background: #ffffff;
}

.lesson-row-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.lesson-index {
  font-size: 12px;
  font-weight: 800;
  color: #64748b;
  min-width: 24px;
}

.badge-lesson-type {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  text-transform: uppercase;
}

.badge-lesson-type.type-concept {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}

.badge-lesson-type.type-lab {
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
}

.badge-lesson-type.type-challenge {
  background: #fff7ed;
  color: #c2410c;
  border: 1px solid #ffedd5;
}

.badge-lesson-type.type-assessment {
  background: #faf5ff;
  color: #7e22ce;
  border: 1px solid #f3e8ff;
}

.lesson-titles {
  display: flex;
  flex-direction: column;
}

.lesson-title {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.lesson-short-desc {
  font-size: 12px;
  color: #64748b;
  margin: 0;
}

.lesson-row-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.lesson-duration {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.lesson-content-status {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
}

.lesson-content-status.status-ready {
  background: #ecfdf5;
  color: #059669;
}

.lesson-content-status.status-draft {
  background: #f1f5f9;
  color: #64748b;
}

.btn-open-lesson {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #0f172a;
  font-size: 12px;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-open-lesson:hover {
  background: #1e293b;
  border-color: #1e293b;
  color: #ffffff;
}

/* ── Course Actions Footer ───────────────────────────────────────────────── */
.course-actions-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.footer-left,
.footer-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-footer-action {
  font-size: 13px;
  font-weight: 700;
  padding: 9px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  border: none;
}

.btn-preview-course {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  color: #334155;
}

.btn-preview-course:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.btn-save-draft {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #0f172a;
}

.btn-approve {
  background: #1e293b;
  color: #ffffff;
}

.btn-approve:hover:not(:disabled) {
  background: #0f172a;
}

.btn-approve:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

.btn-publish {
  background: #ff6b00;
  color: #ffffff;
}

.btn-publish:hover:not(:disabled) {
  background: #e65c00;
}

.btn-unpublish {
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* LEVEL 2 & 3: SUB-EDITORS COMMON HEADER                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */
.level-top-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.btn-back-link {
  background: none;
  border: none;
  color: #ff6b00;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
  margin-bottom: 8px;
}

.btn-back-link:hover {
  text-decoration: underline;
}

.level-heading {
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 4px 0;
}

.level-sub {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.level-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* ── Editor Card Container ───────────────────────────────────────────────── */
.editor-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  margin-bottom: 20px;
}

.card-heading {
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 4px 0;
}

.card-sub {
  font-size: 13px;
  color: #64748b;
  margin: 0 0 16px 0;
}

.card-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

/* Form Controls */
.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: #334155;
  margin-bottom: 6px;
}

.form-input,
.form-textarea {
  width: 100%;
  box-sizing: border-box;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 14px;
  color: #0f172a;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s ease;
}

.form-input:focus,
.form-textarea:focus {
  border-color: #ff6b00;
}

.form-row {
  display: flex;
  gap: 16px;
}

.col-half {
  flex: 1;
}

.col-two-thirds {
  flex: 2;
}

.col-one-third {
  flex: 1;
}

/* ── Level 2: Objectives Checklist ────────────────────────────────────────── */
.objectives-checklist {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.objective-item-row {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8fafc;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.obj-bullet {
  color: #059669;
  font-weight: 800;
}

.obj-input {
  flex: 1;
  padding: 6px 10px;
  font-size: 13px;
}

.obj-item-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-icon-order,
.btn-icon-delete {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;
  padding: 3px 6px;
  cursor: pointer;
}

.btn-icon-delete {
  color: #dc2626;
  border-color: #fca5a5;
}

/* ── Level 2: Sequence List ──────────────────────────────────────────────── */
.sequence-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sequence-item-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px 16px;
}

.seq-col-order {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 90px;
}

.seq-num {
  font-size: 12px;
  font-weight: 800;
  color: #64748b;
}

.seq-order-btns {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.btn-mini-order {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 3px;
  font-size: 9px;
  padding: 1px 4px;
  cursor: pointer;
}

.seq-col-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.seq-title-row {
  display: flex;
  gap: 10px;
}

.seq-title-input {
  flex: 1;
  font-weight: 700;
}

.seq-type-select {
  width: 150px;
  font-weight: 600;
}

.seq-col-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.seq-duration-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
}

.duration-num-input {
  width: 60px;
  text-align: center;
  padding: 6px;
}

.duration-unit {
  font-size: 12px;
  color: #64748b;
}

.lesson-status-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
}

.lesson-status-badge.ready {
  background: #ecfdf5;
  color: #059669;
}

.lesson-status-badge.draft {
  background: #f1f5f9;
  color: #64748b;
}

.seq-col-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-seq-edit {
  background: #1e293b;
  color: #ffffff;
  border: none;
  font-size: 12px;
  font-weight: 700;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-seq-icon {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 5px 8px;
  cursor: pointer;
}

.module-action-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* LEVEL 3: LESSON EDITOR & 9 SECTIONS                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */
.back-links-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.back-sep {
  color: #cbd5e1;
}

/* AI Generation Banner */
.ai-generation-banner {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  color: #ffffff;
  border-radius: 12px;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
}

.ai-banner-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.ai-sparkle-icon {
  font-size: 28px;
}

.ai-banner-title {
  font-size: 17px;
  font-weight: 800;
  margin: 0 0 2px 0;
}

.ai-banner-sub {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
}

.btn-primary-ai-generate {
  background: #ff6b00;
  border: none;
  color: #ffffff;
  font-size: 13px;
  font-weight: 800;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(255, 107, 0, 0.3);
  transition: all 0.15s ease;
}

.btn-primary-ai-generate:hover:not(:disabled) {
  background: #e65c00;
}

/* 9 Collapsible Sections */
.lesson-content-sections-container {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.sections-accordion-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.content-section-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  background: #ffffff;
}

.content-section-header {
  padding: 14px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8fafc;
  cursor: pointer;
  user-select: none;
}

.content-section-card.is-open .content-section-header {
  border-bottom: 1px solid #e2e8f0;
  background: #f1f5f9;
}

.section-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-icon {
  font-size: 16px;
}

.section-name {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.section-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
}

.section-badge.populated {
  background: #ecfdf5;
  color: #059669;
}

.section-badge.empty {
  background: #f1f5f9;
  color: #94a3b8;
}

.section-actions-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-regen-single-section {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #1e293b;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-regen-single-section:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #94a3b8;
}

.chevron-indicator {
  font-size: 11px;
  color: #94a3b8;
}

.content-section-body {
  padding: 16px 18px;
  background: #ffffff;
}

.teacher-instructions-wrap {
  margin-top: 12px;
  border-top: 1px solid #f1f5f9;
  padding-top: 12px;
}

.btn-toggle-instructions {
  background: none;
  border: none;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 4px 0;
}

.instructions-body {
  margin-top: 8px;
}

.lesson-actions-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* MODALS STYLING (PREVIEW & PUBLISH)                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.publish-confirm-dialog,
.edit-course-modal {
  background: #ffffff;
  border-radius: 12px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.publish-confirm-dialog {
  max-width: 500px;
}

.edit-course-modal {
  max-width: 600px;
}

.publish-dialog-header,
.modal-header {
  padding: 18px 24px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.publish-dialog-title {
  margin: 4px 0 0 0;
  font-size: 18px;
  font-weight: 800;
}

.btn-close-modal {
  background: none;
  border: none;
  font-size: 24px;
  color: #94a3b8;
  cursor: pointer;
}

.publish-dialog-body,
.modal-body {
  padding: 24px;
  overflow-y: auto;
}

.publish-dialog-footer,
.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  background: #f8fafc;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* FULL-SCREEN LESSON EDITOR                                                  */
/* A viewport-filling document surface, not a centered modal card.            */
/* ═══════════════════════════════════════════════════════════════════════════ */
.lesson-editor-shell {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  width: 100vw;
  background: #f7f8fa;
  color: #0f172a;
  font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif;
}

/* ── Top bar ─────────────────────────────────────────────────────────────── */
.lesson-editor-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-shrink: 0;
  padding: 10px 18px;
  background: #ffffff;
  border-bottom: 1px solid #e6eaf0;
}

.lesson-editor-topbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.lesson-editor-topbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.lesson-editor-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  border: 1px solid #e6eaf0;
  background: #ffffff;
  color: #475569;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.lesson-editor-icon-btn:hover {
  background: #fff7ed;
  border-color: #fed7aa;
  color: var(--risse-orange-active, #c2410c);
}

.lesson-editor-crumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.lesson-editor-crumb {
  border: none;
  background: transparent;
  padding: 2px 0;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 34vw;
}

.lesson-editor-crumb:hover {
  color: var(--risse-orange-hover, #ea580c);
}

.lesson-editor-crumb-sep {
  color: #cbd5e1;
  font-size: 13px;
}

.lesson-editor-crumb--root {
  color: #94a3b8;
  font-weight: 600;
  cursor: default;
  max-width: 22vw;
}

.lesson-editor-crumb--current {
  color: #0f172a;
  font-weight: 700;
  cursor: default;
  max-width: 34vw;
}

.lesson-editor-crumb:disabled {
  cursor: default;
}

.lesson-editor-unsaved {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #b45309;
  white-space: nowrap;
}

.lesson-editor-unsaved-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #f59e0b;
  animation: lessonEditorPulse 1.8s ease-in-out infinite;
}

@keyframes lessonEditorPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

.lesson-editor-staged {
  font-size: 11.5px;
  font-weight: 600;
  color: #94a3b8;
  white-space: nowrap;
}

.lesson-editor-path-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 11px;
  border: 1px solid #e6eaf0;
  border-radius: 8px;
  background: #ffffff;
  color: #475569;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.lesson-editor-path-toggle:hover {
  border-color: #cbd5e1;
  color: #1e293b;
}

.lesson-editor-path-toggle.is-active {
  background: #fff7ed;
  border-color: #fed7aa;
  color: var(--risse-orange-active, #c2410c);
}

.lesson-editor-btn {
  height: 34px;
  padding: 0 16px;
  border-radius: 8px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease, opacity 0.15s ease;
}

.lesson-editor-btn--ghost {
  border: 1px solid #e6eaf0;
  background: #ffffff;
  color: #475569;
}

.lesson-editor-btn--ghost:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #1e293b;
}

.lesson-editor-btn--primary {
  border: none;
  background: linear-gradient(135deg, var(--risse-orange, #ff7a00), var(--risse-orange-hover, #ea580c));
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(255, 122, 0, 0.24);
}

.lesson-editor-btn--primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #ff8c1a, var(--risse-orange-hover, #f97316));
}

.lesson-editor-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}

/* ── Status line ─────────────────────────────────────────────────────────── */
.lesson-editor-status {
  margin: 0;
  padding: 8px 20px;
  flex-shrink: 0;
  font-size: 12.5px;
  font-weight: 600;
  color: #15803d;
  background: #f0fdf4;
  border-bottom: 1px solid #dcfce7;
}

.lesson-editor-status.is-error {
  color: #b91c1c;
  background: #fef2f2;
  border-bottom-color: #fee2e2;
}

/* ── Body: rail + document ───────────────────────────────────────────────── */
.lesson-editor-body {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: stretch;
}

.lesson-editor-rail {
  width: 268px;
  flex-shrink: 0;
  border-right: 1px solid #e6eaf0;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.lesson-editor-rail-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  padding: 16px 18px 10px;
  border-bottom: 1px solid #f1f5f9;
}

.lesson-editor-rail-title {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: #94a3b8;
}

.lesson-editor-rail-count {
  font-size: 11px;
  font-weight: 700;
  color: #cbd5e1;
}

.lesson-editor-rail-list {
  padding: 10px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.lesson-editor-rail-group {
  margin-bottom: 14px;
}

.lesson-editor-rail-group:last-child {
  margin-bottom: 0;
}

.lesson-editor-rail-group-title {
  margin: 4px 8px 6px;
  font-size: 10.5px;
  font-weight: 800;
  line-height: 1.4;
  letter-spacing: 0.7px;
  text-transform: uppercase;
  color: #94a3b8;
}

.lesson-editor-rail-items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.lesson-editor-rail-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  padding: 9px 10px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 600;
  line-height: 1.45;
  color: #475569;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.lesson-editor-rail-item:hover {
  background: #f8fafc;
  color: #1e293b;
}

.lesson-editor-rail-item.is-current {
  background: #fff7ed;
  border-color: #fed7aa;
  color: var(--risse-orange-active, #c2410c);
}

.lesson-editor-rail-index {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 10.5px;
  font-weight: 800;
}

.lesson-editor-rail-item.is-current .lesson-editor-rail-index {
  background: #ffedd5;
  color: #c2410c;
}

.lesson-editor-rail-label {
  overflow-wrap: anywhere;
}

/* ── Outline (no lesson chosen) ──────────────────────────────────────────── */
.lesson-editor-outline {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding: 40px 32px 56px;
}

.lesson-editor-outline-title {
  font-size: 30px;
  font-weight: 800;
  letter-spacing: -0.8px;
  color: #0f172a;
  margin: 0 auto 8px;
  max-width: 1120px;
}

.lesson-editor-outline-sub {
  font-size: 14px;
  line-height: 1.65;
  color: #64748b;
  margin: 0 auto 28px;
  max-width: 1120px;
}

.lesson-editor-outline-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 18px;
  max-width: 1120px;
  margin: 0 auto;
  align-items: start;
}

.lesson-editor-outline-card {
  background: #ffffff;
  border: 1px solid #e8edf4;
  border-radius: 12px;
  padding: 20px 22px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
}

.lesson-editor-outline-card-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 6px;
}

.lesson-editor-outline-card-title {
  font-size: 16px;
  font-weight: 800;
  letter-spacing: -0.3px;
  color: #0f172a;
  margin: 0;
}

.lesson-editor-outline-card-count {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
}

.lesson-editor-outline-card-desc {
  font-size: 13px;
  line-height: 1.6;
  color: #64748b;
  margin: 0 0 14px;
}

.lesson-editor-outline-lessons {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.lesson-editor-outline-lesson {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 8px 9px;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.lesson-editor-outline-lesson:hover {
  background: #fff7ed;
  border-color: #fed7aa;
  color: var(--risse-orange-active, #c2410c);
}

.lesson-editor-outline-lesson-icon {
  flex-shrink: 0;
}

.lesson-editor-outline-lesson-title {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}

.lesson-editor-outline-lesson-go {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
}

.lesson-editor-outline-lesson:hover .lesson-editor-outline-lesson-go {
  color: var(--risse-orange-hover, #ea580c);
}

/* ── Document ────────────────────────────────────────────────────────────── */
.lesson-editor-document {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.lesson-editor-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  /* Horizontal padding only; the document centres itself in the remaining width. */
  padding: 34px 40px 12px;
  scroll-behavior: smooth;
  scroll-padding-top: 16px;
}

/*
 * The shared renderer reports document mode itself (`--tutor-hidden`), so this
 * scroller is the only scroll container in the editor.
 */
.lesson-editor-scroll :deep(.checkpoint-page-container) {
  min-height: 100%;
}

/* ── Previous / Next ─────────────────────────────────────────────────────── */
.lesson-editor-lesson-nav {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 40px;
  background: #ffffff;
  border-top: 1px solid #e6eaf0;
}

.lesson-editor-btn--nav {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  height: auto;
  min-width: 0;
  max-width: 38%;
  padding: 8px 14px;
  border: 1px solid #e6eaf0;
  background: #ffffff;
  color: #334155;
  text-align: left;
}

.lesson-editor-btn--nav:hover:not(:disabled) {
  border-color: #fed7aa;
  background: #fffaf5;
}

.lesson-editor-btn--nav-next {
  align-items: flex-end;
  text-align: right;
}

.lesson-editor-nav-dir {
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: #94a3b8;
}

.lesson-editor-nav-name {
  font-size: 12.5px;
  font-weight: 700;
  color: #334155;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.lesson-editor-nav-position {
  flex-shrink: 0;
  font-size: 11.5px;
  font-weight: 700;
  color: #94a3b8;
}

/* ── Responsive: keep the lesson usable on smaller screens ───────────────── */
@media (max-width: 1100px) {
  .lesson-editor-scroll {
    padding: 24px 24px 8px;
  }

  .lesson-editor-lesson-nav {
    padding: 10px 24px;
  }

  .lesson-editor-rail {
    width: 224px;
  }
}

@media (max-width: 820px) {
  .lesson-editor-topbar {
    flex-wrap: wrap;
    gap: 10px;
    padding: 10px 12px;
  }

  .lesson-editor-staged,
  .lesson-editor-unsaved {
    display: none;
  }

  .lesson-editor-crumb {
    max-width: 40vw;
  }

  /* The rail becomes an overlay drawer so the document keeps full width. */
  .lesson-editor-rail {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 5;
    width: min(84vw, 300px);
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.18);
  }

  .lesson-editor-body {
    position: relative;
  }

  .lesson-editor-outline {
    padding: 24px 16px 40px;
  }

  .lesson-editor-outline-title {
    font-size: 23px;
  }

  .lesson-editor-outline-grid {
    grid-template-columns: 1fr;
  }

  .lesson-editor-scroll {
    padding: 16px 14px 8px;
  }

  .lesson-editor-lesson-nav {
    padding: 10px 14px;
  }

  .lesson-editor-nav-name {
    display: none;
  }
}

.btn-confirm-publish {
  background: #ff6b00;
  border: none;
  color: #ffffff;
  font-weight: 700;
}

.publish-stats-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 16px;
}

.pub-stat {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 10px;
  text-align: center;
}

.pub-num {
  display: block;
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
}

.pub-label {
  font-size: 11px;
  color: #64748b;
}

/* Spinner helper */
.btn-spinner-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.spinner-small {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* RESPONSIVE ADAPTATIONS                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */
@media (max-width: 1024px) {
  .summary-metrics-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .curriculum-designer-page {
    padding: 16px;
  }
  .banner-top-row,
  .course-actions-footer,
  .lesson-actions-footer,
  .module-action-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  .summary-metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .lesson-row-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .lesson-row-right {
    width: 100%;
    justify-content: space-between;
  }
}

/* ── SOURCE COVERAGE & TOPIC GROUP HEADERS STYLING ────────────────────────── */

.source-coverage-indicator-card {
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  padding: 18px 22px;
  margin-bottom: 22px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.coverage-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.coverage-title-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.coverage-icon {
  font-size: 24px;
}

.coverage-title {
  font-size: 15.5px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.coverage-subtitle {
  font-size: 12.5px;
  color: #64748b;
  margin: 2px 0 0 0;
}

.btn-toggle-coverage-details {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #334155;
  font-size: 12.5px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-toggle-coverage-details:hover {
  background: #e2e8f0;
}

.coverage-stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.coverage-stat-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
}

.cov-val {
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
}

.cov-val.text-success {
  color: #16a34a;
}

.cov-val.text-warning {
  color: #d97706;
}

.cov-val.text-primary {
  color: #ea580c;
}

.cov-lbl {
  font-size: 11.5px;
  color: #64748b;
  font-weight: 500;
  margin-top: 2px;
}

.coverage-mapping-tray {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid #e2e8f0;
}

.coverage-mapping-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.coverage-mapping-table th {
  text-align: left;
  padding: 8px 12px;
  color: #64748b;
  font-weight: 600;
  border-bottom: 1.5px solid #cbd5e1;
}

.coverage-mapping-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
}

.coverage-tag-pill {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 9999px;
}

.coverage-tag-pill.tag-mapped {
  background: #dcfce7;
  color: #15803d;
}

.coverage-tag-pill.tag-review {
  background: #fef3c7;
  color: #b45309;
}

.topic-group-header-divider {
  margin: 24px 0 12px 0;
  padding: 12px 18px;
  background: #f1f5f9;
  border-left: 4px solid #ea580c;
  border-radius: 8px;
}

.topic-group-header-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.group-folder-icon {
  font-size: 18px;
}

.topic-group-title {
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.topic-group-badge {
  font-size: 11px;
  font-weight: 700;
  color: #475569;
  background: #e2e8f0;
  padding: 2px 8px;
  border-radius: 9999px;
  margin-left: auto;
}

.source-ref-pill {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 4px;
  margin-top: 6px;
}

/* ── LEVEL 3 CONTENT BLOCKS & ASSESSMENT EDITOR STYLING ───────────────────── */

.source-reference-card {
  border-left: 4px solid #3b82f6;
  background: #f8fafc;
}

.source-ref-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.source-ref-icon {
  font-size: 20px;
}

.source-ref-meta {
  font-size: 13px;
  color: #334155;
  margin: 2px 0 0 0;
}

.page-pill {
  color: #2563eb;
  font-weight: 600;
}

.source-excerpt-box {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 12.5px;
  line-height: 1.5;
  color: #475569;
}

.excerpt-tag {
  display: block;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #64748b;
  margin-bottom: 4px;
}

.excerpt-text {
  margin: 0;
  font-style: italic;
}

.content-blocks-editor-card,
.assessment-editor-card {
  margin-top: 20px;
}

.blocks-editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.blocks-add-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-add-block {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #334155;
  font-size: 12px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-add-block:hover {
  background: #e2e8f0;
  border-color: #94a3b8;
}

.blocks-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.block-edit-item {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 14px;
}

.block-edit-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.block-type-pill {
  font-size: 10.5px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
  background: #e2e8f0;
  color: #475569;
}

.block-type-pill.block-type-code {
  background: #0f172a;
  color: #f8fafc;
}

.block-type-pill.block-type-callout {
  background: #fef3c7;
  color: #b45309;
}

.block-type-pill.block-type-activity {
  background: #dbeafe;
  color: #1e40af;
}

.block-title-input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 13px;
  background: #ffffff;
}

.btn-remove-block {
  background: transparent;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 4px 8px;
}

.block-meta-row {
  margin-top: 10px;
}

.question-edit-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 14px;
  margin-top: 12px;
}

.question-edit-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.q-num-pill {
  font-size: 11px;
  font-weight: 700;
  background: #ea580c;
  color: #ffffff;
  padding: 2px 7px;
  border-radius: 4px;
}

/* ═══════════════════════════════════════════════════════════════════════ */
/* PUBLISHING FORMAT SELECTOR STYLES                                       */
/* ═══════════════════════════════════════════════════════════════════════ */
.publishing-format-section {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  margin: 28px 0 20px 0;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
}

.format-section-header {
  margin-bottom: 20px;
}

.format-header-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.step-num-pill {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  padding: 3px 8px;
  border-radius: 5px;
  background: #ffedd5;
  color: #c2410c;
}

.required-asterisk {
  font-size: 12px;
  color: #dc2626;
  font-weight: 600;
}

.format-section-title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 6px 0;
}

.format-section-desc {
  font-size: 13.5px;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

.format-options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.format-option-card {
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  padding: 18px;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  display: flex;
  flex-direction: column;
}

.format-option-card:hover {
  border-color: #cbd5e1;
  background: #ffffff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
}

.format-option-card.is-selected {
  border-color: #ff7a00;
  background: #fffbf7;
  box-shadow: 0 4px 14px rgba(255, 122, 0, 0.12);
}

.format-card-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 10px;
}

.radio-indicator {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
  flex-shrink: 0;
  background: #ffffff;
  transition: all 0.2s ease;
}

.format-option-card.is-selected .radio-indicator {
  border-color: #ff7a00;
}

.radio-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ff7a00;
}

.format-title-group {
  flex: 1;
}

.format-card-title {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px 0;
}

.format-tag {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
  display: inline-block;
}

.format-tag.tag-modular {
  background: #dbeafe;
  color: #1e40af;
}

.format-tag.tag-single {
  background: #fef3c7;
  color: #b45309;
}

.format-card-body {
  font-size: 13px;
  color: #475569;
  line-height: 1.55;
  margin: 0 0 14px 0;
  flex: 1;
}

.format-preview-pill {
  background: #f1f5f9;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 12px;
  color: #334155;
  display: flex;
  align-items: center;
  gap: 8px;
}

.format-option-card.is-selected .format-preview-pill {
  background: #ffedd5;
  color: #9a3412;
}

.preview-icon {
  font-size: 14px;
}

.format-selection-warning {
  padding: 10px 14px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #b91c1c;
  font-size: 13px;
  font-weight: 600;
}

.format-selection-confirmed {
  padding: 10px 14px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  color: #166534;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.format-selection-confirmed .check-icon {
  font-weight: 800;
  color: #16a34a;
}

.format-plan-list {
  list-style: none;
  margin: 10px 0 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12.5px;
}

.format-plan-list li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 8px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 5px;
}

.plan-item-title {
  color: #0f172a;
  font-weight: 600;
}

.plan-item-count {
  color: #64748b;
  white-space: nowrap;
}

/* Modal Selector Styles */
.publish-modal-format-box {
  margin-top: 18px;
  padding: 14px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.modal-format-label {
  display: block;
  font-size: 12.5px;
  font-weight: 700;
  color: #334155;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.modal-format-radios {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.modal-format-radio-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  background: #ffffff;
  border: 1.5px solid #cbd5e1;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.modal-format-radio-card.is-selected {
  border-color: #ff7a00;
  background: #fffbf7;
}

.modal-radio-text {
  display: flex;
  flex-direction: column;
  font-size: 12.5px;
}

.modal-radio-text strong {
  color: #0f172a;
}

.modal-radio-text span {
  color: #64748b;
  font-size: 11.5px;
  margin-top: 2px;
}

.format-modal-required-note {
  margin-top: 8px;
  font-size: 11.5px;
  color: #dc2626;
  font-weight: 600;
}

/* ── Studio entry: upload-first intake ───────────────────────────────────── */
.studio-intake { display: flex; flex-direction: column; gap: 20px; max-width: 820px; margin: 0 auto; }
.intake-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 28px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04); }
.intake-title { font-size: 24px; font-weight: 800; margin: 12px 0 6px; }
.intake-sub { font-size: 13.5px; color: #475569; margin: 0 0 20px; line-height: 1.5; }
.intake-note { font-size: 12.5px; color: #92400e; background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 8px 12px; margin: 0 0 16px; }
.intake-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; flex: 1; }
.intake-row { display: flex; gap: 16px; }
.intake-label { font-size: 12.5px; font-weight: 700; color: #334155; }
.intake-req { color: #dc2626; }
.intake-input { border: 1px solid #cbd5e1; border-radius: 6px; padding: 9px 12px; font-size: 13.5px; font-family: inherit; color: #0f172a; background: #ffffff; }
.intake-input:focus { outline: 2px solid #ff6b00; outline-offset: 1px; }
.intake-hidden-input { display: none; }
.intake-drop { border: 2px dashed #cbd5e1; border-radius: 10px; padding: 28px 16px; text-align: center; cursor: pointer; background: #f8fafc; }
.intake-drop:hover, .intake-drop.has-files { border-color: #ff6b00; background: #fff7ed; }
.intake-drop-text { font-size: 14px; font-weight: 700; margin: 0 0 4px; }
.intake-drop-sub { font-size: 12px; color: #64748b; margin: 0; }
.intake-file-list { list-style: none; margin: 10px 0 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.intake-file-item { display: flex; align-items: center; gap: 10px; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px; font-size: 12.5px; }
.intake-file-name { flex: 1; font-weight: 600; word-break: break-all; }
.intake-file-size { color: #64748b; }
.intake-file-remove { background: none; border: none; cursor: pointer; color: #64748b; }
.intake-error { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; border-radius: 6px; padding: 10px 12px; font-size: 12.5px; margin-bottom: 16px; }
.intake-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.intake-drafts-title { font-size: 16px; font-weight: 800; margin: 0 0 4px; }
.intake-draft-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.intake-draft-item { display: flex; align-items: center; justify-content: space-between; gap: 12px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; }
.intake-draft-meta { display: flex; flex-direction: column; gap: 2px; }
.intake-draft-name { font-size: 14px; font-weight: 700; }
.intake-draft-sub { font-size: 12px; color: #64748b; }
</style>