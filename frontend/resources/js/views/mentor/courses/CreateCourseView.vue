<!-- frontend/resources/js/views/mentor/courses/CreateCourseView.vue -->
<template>
  <div class="create-course-page">
    <header class="page-header">
      <button 
        type="button" 
        class="btn-back" 
        @click="$emit('navigate', 'courses')"
        title="Back to My Modules"
      >
        ← Back to Modules
      </button>
      <h1 class="page-title">Create New Module</h1>
      <p class="page-subtitle">
        Define module foundations. Once created, upload syllabus and learning documents to allow RISSE AI to generate structured Learning Nodes.
      </p>
    </header>

    <div class="form-container">
      <form @submit.prevent="handleSubmit" class="course-form">
        <!-- Error Banner -->
        <div v-if="localError" class="form-error-banner">
          {{ localError }}
        </div>

        <!-- Section 1: Core Details -->
        <div class="form-section">
          <h2 class="form-section-title">Module Information</h2>

          <!-- Course/Module Title -->
          <div class="form-group">
            <label class="form-label" for="course-title">
              Module Title <span class="required">*</span>
            </label>
            <input 
              id="course-title"
              v-model="form.title"
              type="text" 
              class="form-input" 
              placeholder="e.g. Introduction to Microprocessors" 
              required
            />
          </div>

          <!-- Description -->
          <div class="form-group">
            <label class="form-label" for="course-description">
              Module Description
            </label>
            <textarea 
              id="course-description"
              v-model="form.description"
              rows="3" 
              class="form-textarea" 
              placeholder="Outline the scope, engineering principles, and lab requirements for this course..."
            ></textarea>
          </div>

          <!-- Subject & Academic Level (2 cols) -->
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label" for="course-subject">
                Subject Area <span class="required">*</span>
              </label>
              <select 
                id="course-subject" 
                v-model="form.subject" 
                class="form-select"
                required
              >
                <option value="Robotics & Control Systems">Robotics & Control Systems</option>
                <option value="Embedded Microcontrollers">Embedded Microcontrollers</option>
                <option value="Mechatronics & Actuation">Mechatronics & Actuation</option>
                <option value="Sensors & Perception">Sensors & Perception</option>
                <option value="Applied Computer Science">Applied Computer Science</option>
                <option value="Sumobot Competition Engineering">Sumobot Competition Engineering</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="course-level">
                Academic Level <span class="required">*</span>
              </label>
              <select 
                id="course-level" 
                v-model="form.academicLevel" 
                class="form-select"
                required
              >
                <option value="Grade 9">Grade 9</option>
                <option value="Grade 10">Grade 10</option>
                <option value="Grade 11 (STEM)">Grade 11 (STEM)</option>
                <option value="Grade 12 (STEM)">Grade 12 (STEM)</option>
                <option value="Undergraduate Mechatronics">Undergraduate Mechatronics</option>
                <option value="Vocational Technical Certificate">Vocational Technical Certificate</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Section 1B: Institutional Curriculum / Syllabus Option (Teaching Planner Part 1) -->
        <div class="form-section">
          <h2 class="form-section-title">Institutional Curriculum & Syllabus</h2>
          <p class="form-section-hint">
            Do you have an existing curriculum or syllabus to follow?
          </p>

          <div class="curriculum-option-toggle-grid">
            <label 
              class="option-radio-card"
              :class="{ 'is-selected': curriculumMode === 'upload' }"
              @click="curriculumMode = 'upload'"
            >
              <input 
                type="radio" 
                value="upload" 
                v-model="curriculumMode" 
                class="hidden-radio"
              />
              <div class="radio-indicator">
                <span v-if="curriculumMode === 'upload'" class="radio-dot"></span>
              </div>
              <div class="radio-content">
                <div class="radio-title-row">
                  <span class="radio-title">Option A: Upload Existing Curriculum</span>
                  <span class="badge-recommended">Prescribed Syllabus</span>
                </div>
                <p class="radio-desc">
                  Upload an institutional syllabus, course guide, or official curriculum (PDF, DOCX, PPTX). RISSE AI extracts required competencies and outcomes as the benchmark.
                </p>
              </div>
            </label>

            <label 
              class="option-radio-card"
              :class="{ 'is-selected': curriculumMode === 'custom' }"
              @click="curriculumMode = 'custom'"
            >
              <input 
                type="radio" 
                value="custom" 
                v-model="curriculumMode" 
                class="hidden-radio"
              />
              <div class="radio-indicator">
                <span v-if="curriculumMode === 'custom'" class="radio-dot"></span>
              </div>
              <div class="radio-content">
                <div class="radio-title-row">
                  <span class="radio-title">Option B: Create My Own Course</span>
                </div>
                <p class="radio-desc">
                  Continue without a prescribed curriculum. You can design your learning path manually, upload lab materials later, or have RISSE AI propose a structure from your course description.
                </p>
              </div>
            </label>
          </div>

          <!-- File Upload Dropzone for Option A -->
          <div v-if="curriculumMode === 'upload'" class="curriculum-upload-zone">
            <div 
              class="curriculum-dropzone"
              :class="{ 'has-file': Boolean(curriculumFile) }"
              @click="triggerCurriculumFileInput"
            >
              <input 
                ref="curriculumFileInputRef" 
                type="file" 
                class="hidden-file-input" 
                accept=".pdf,.docx,.doc,.pptx,.ppt,.txt,.md"
                @change="handleCurriculumFileSelect"
              />
              <div v-if="!curriculumFile" class="dropzone-empty-wrap">
                <div class="drop-icon">📄</div>
                <span class="drop-primary-txt">Click to choose or drag & drop curriculum document</span>
                <span class="drop-sub-txt">PDF, DOCX, PPTX, or Markdown (Max 25MB)</span>
              </div>
              <div v-else class="dropzone-selected-wrap" @click.stop>
                <div class="selected-file-info">
                  <span class="file-icon">✓</span>
                  <div>
                    <span class="file-name-text">{{ curriculumFile.name }}</span>
                    <span class="file-size-text">{{ formatBytes(curriculumFile.size) }}</span>
                  </div>
                </div>
                <button 
                  type="button" 
                  class="btn-remove-curr-file" 
                  @click.stop="clearCurriculumFile"
                  title="Remove file"
                >
                  &times;
                </button>
              </div>
            </div>
            <p class="curriculum-disclaimer">
              ℹ Curriculum upload is optional. Missing a curriculum will never block course creation or learning path generation.
            </p>
          </div>
        </div>

        <!-- Section 1C: Course Enrollment Policy (Part 3) -->
        <div class="form-section">
          <h2 class="form-section-title">Course Enrollment Policy</h2>
          <p class="form-section-hint">
            Determine how students join and leave this course.
          </p>

          <div class="curriculum-option-toggle-grid">
            <label 
              class="option-radio-card"
              :class="{ 'is-selected': form.enrollmentType === 'curriculum' }"
              @click="form.enrollmentType = 'curriculum'"
            >
              <input 
                type="radio" 
                value="curriculum" 
                v-model="form.enrollmentType" 
                class="hidden-radio"
              />
              <div class="radio-indicator">
                <span v-if="form.enrollmentType === 'curriculum'" class="radio-dot"></span>
              </div>
              <div class="radio-content">
                <div class="radio-title-row">
                  <span class="radio-title">Curriculum / Teacher-Controlled</span>
                  <span class="badge-recommended">Default</span>
                </div>
                <p class="radio-desc">
                  Students are enrolled via section assignment or direct teacher placement. Unenrollment requires teacher review and approval.
                </p>
              </div>
            </label>

            <label 
              class="option-radio-card"
              :class="{ 'is-selected': form.enrollmentType === 'self_paced' }"
              @click="form.enrollmentType = 'self_paced'"
            >
              <input 
                type="radio" 
                value="self_paced" 
                v-model="form.enrollmentType" 
                class="hidden-radio"
              />
              <div class="radio-indicator">
                <span v-if="form.enrollmentType === 'self_paced'" class="radio-dot"></span>
              </div>
              <div class="radio-content">
                <div class="radio-title-row">
                  <span class="radio-title">Self-Paced / Open Enrollment</span>
                  <span class="badge-open">Open</span>
                </div>
                <p class="radio-desc">
                  Students can freely discover, self-enroll, and unenroll in this course from their student Modules catalog anytime without waiting for approval.
                </p>
              </div>
            </label>
          </div>
        </div>

        <!-- Section 2: Section Assignment -->
        <div class="form-section">
          <h2 class="form-section-title">Class Cohort Assignment</h2>
          <p class="form-section-hint">
            A course can be assigned to multiple sections. Each section retains independent student enrollment and checkpoint tracking.
          </p>

          <div v-if="sections.length === 0" class="no-sections-notice">
            <span>No sections currently assigned to your account. You can create this course now and assign sections later.</span>
          </div>

          <div v-else class="sections-checkbox-grid">
            <label 
              v-for="sec in sections" 
              :key="sec.id" 
              class="checkbox-card"
              :class="{ selected: form.sectionIds.includes(sec.id) }"
            >
              <input 
                type="checkbox" 
                :value="sec.id" 
                v-model="form.sectionIds" 
                class="hidden-checkbox"
              />
              <div class="checkbox-custom">
                <svg v-if="form.sectionIds.includes(sec.id)" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div class="checkbox-text-col">
                <span class="sec-name">{{ sec.name }}</span>
                <span class="sec-code">{{ sec.code }} • {{ sec.grade_level }}</span>
              </div>
            </label>
          </div>
        </div>

        <!-- Section 3: Academic Term (Optional) -->
        <div class="form-section">
          <h2 class="form-section-title">Academic Term & Timeline (Optional)</h2>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label" for="course-semester">Semester / Quarter</label>
              <input 
                id="course-semester" 
                v-model="form.semester" 
                type="text" 
                class="form-input" 
                placeholder="e.g. 1st Semester / Q1" 
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="course-year">Academic Year</label>
              <input 
                id="course-year" 
                v-model="form.schoolYear" 
                type="text" 
                class="form-input" 
                placeholder="e.g. 2026-2027" 
              />
            </div>
          </div>
        </div>

        <!-- Section 4: Learning Outcomes (Optional) -->
        <div class="form-section">
          <h2 class="form-section-title">Target Learning Outcomes (Optional)</h2>
          <p class="form-section-hint">
            Specify key technical competencies students are expected to demonstrate.
          </p>

          <div class="outcomes-input-row">
            <input 
              v-model="newOutcomeText" 
              type="text" 
              class="form-input" 
              placeholder="e.g. Calibrate analog infrared distance sensors using voltage dividers"
              @keydown.enter.prevent="addOutcome"
            />
            <button 
              type="button" 
              class="btn-add-outcome" 
              @click="addOutcome"
            >
              + Add
            </button>
          </div>

          <div v-if="form.learningOutcomes.length > 0" class="outcomes-list">
            <div 
              v-for="(out, idx) in form.learningOutcomes" 
              :key="idx" 
              class="outcome-item"
            >
              <span class="outcome-bullet">✓</span>
              <span class="outcome-text">{{ out }}</span>
              <button 
                type="button" 
                class="btn-remove-outcome" 
                @click="removeOutcome(idx)"
                title="Remove outcome"
              >
                &times;
              </button>
            </div>
          </div>
        </div>

        <!-- Submit Actions -->
        <div class="form-actions-bar">
          <button 
            type="button" 
            class="btn-cancel" 
            @click="$emit('navigate', 'courses')"
          >
            Cancel
          </button>

          <button 
            type="submit" 
            class="btn-submit-course"
            :disabled="isSubmitting"
          >
            <span v-if="isSubmitting">Creating Module...</span>
            <span v-else>Create Module & Continue →</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useMentorStore } from '../../../stores/mentorStore.js';

const mentorStore = useMentorStore();

const props = defineProps({
  sections: {
    type: Array,
    default: () => [],
  },
  mentorId: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['navigate', 'course-created']);

const isSubmitting = ref(false);
const localError = ref(null);
const newOutcomeText = ref('');

const curriculumMode = ref('custom'); // 'upload' | 'custom'
const curriculumFile = ref(null);
const curriculumFileInputRef = ref(null);

function triggerCurriculumFileInput() {
  if (curriculumFileInputRef.value) {
    curriculumFileInputRef.value.click();
  }
}

function handleCurriculumFileSelect(e) {
  const file = e.target.files?.[0];
  if (file) {
    if (file.size > 25 * 1024 * 1024) {
      localError.value = 'Curriculum file exceeds 25MB maximum limit.';
      return;
    }
    curriculumFile.value = file;
    localError.value = null;
  }
}

function clearCurriculumFile() {
  curriculumFile.value = null;
  if (curriculumFileInputRef.value) {
    curriculumFileInputRef.value.value = '';
  }
}

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

const form = reactive({
  title: '',
  description: '',
  subject: 'Robotics & Control Systems',
  academicLevel: 'Grade 10',
  enrollmentType: 'curriculum',
  sectionIds: [],
  semester: '',
  schoolYear: '2026-2027',
  learningOutcomes: [],
});

function addOutcome() {
  if (newOutcomeText.value && newOutcomeText.value.trim()) {
    form.learningOutcomes.push(newOutcomeText.value.trim());
    newOutcomeText.value = '';
  }
}

function removeOutcome(index) {
  form.learningOutcomes.splice(index, 1);
}

async function handleSubmit() {
  if (!form.title.trim()) {
    localError.value = 'Course title is required.';
    return;
  }

  isSubmitting.value = true;
  localError.value = null;

  try {
    const coursePayload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      subject: form.subject,
      academicLevel: form.academicLevel,
      enrollmentType: form.enrollmentType || 'curriculum',
      semester: form.semester.trim() || undefined,
      schoolYear: form.schoolYear.trim() || undefined,
      learningOutcomes: [...form.learningOutcomes],
      mentorId: props.mentorId,
      sectionIds: [...form.sectionIds],
    };

    const res = await mentorStore.createCourse(coursePayload);

    if (res.success && res.course) {
      // If Option A was selected with a curriculum document, upload and index it immediately
      if (curriculumMode.value === 'upload' && curriculumFile.value) {
        try {
          await mentorStore.uploadCourseMaterial({
            courseId: res.course.id,
            title: `Prescribed Syllabus: ${curriculumFile.value.name.replace(/\.[^/.]+$/, '')}`,
            description: 'Prescribed institutional curriculum / syllabus uploaded during course initialization. Serves as benchmark learning outcomes.',
            file: curriculumFile.value,
            uploaderId: props.mentorId,
          });
        } catch (uploadErr) {
          console.warn('[CreateCourse] Curriculum upload note:', uploadErr);
        }
      }

      emit('course-created', res.course);
    } else {
      localError.value = res.error || 'Failed to create course. Please check inputs and retry.';
      isSubmitting.value = false;
    }
  } catch (err) {
    localError.value = err?.message || 'Failed to submit course.';
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
.create-course-page {
  padding: 14px 18px 40px 10px;
  max-width: 820px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 16px;
}

.btn-back {
  background: transparent;
  border: none;
  color: var(--text-muted, #6b7280);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  margin-bottom: 6px;
  display: inline-block;
  transition: color 0.15s ease;
}

.btn-back:hover {
  color: var(--primary-orange, #F18701);
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
  line-height: 1.4;
}

.form-container {
  background: #ffffff;
  border: 1px solid var(--border-card, #eef1f4);
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.form-error-banner {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 8px 12px;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 12px;
}

.form-section {
  padding-bottom: 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
}

.form-section-title {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 4px 0;
}

.form-section-hint {
  font-size: 12px;
  color: #6b7280;
  margin: 0 0 16px 0;
  line-height: 1.4;
}

.form-group {
  margin-bottom: 18px;
}

.form-label {
  display: block;
  font-size: 12.5px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
}

.required {
  color: #ef4444;
}

.form-input, .form-textarea, .form-select {
  width: 100%;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 10px 14px;
  color: #111827;
  font-size: 13px;
  font-family: inherit;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  box-sizing: border-box;
}

.form-input:focus, .form-textarea:focus, .form-select:focus {
  outline: none;
  border-color: var(--primary-orange, #F18701);
  box-shadow: 0 0 0 3px rgba(241, 135, 1, 0.15);
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

@media (max-width: 640px) {
  .form-row-2 {
    grid-template-columns: 1fr;
  }
}

/* Sections Checkbox Grid */
.sections-checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

.checkbox-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.checkbox-card:hover {
  border-color: #fed7aa;
  background: #fff7ed;
}

.checkbox-card.selected {
  background: #fff7ed;
  border-color: var(--primary-orange, #F18701);
}

.hidden-checkbox {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.checkbox-custom {
  width: 18px;
  height: 18px;
  border-radius: 5px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.checkbox-card.selected .checkbox-custom {
  background: var(--primary-orange, #F18701);
  border-color: var(--primary-orange, #F18701);
  color: #fff;
}

.checkbox-text-col {
  display: flex;
  flex-direction: column;
}

.sec-name {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}

.sec-code {
  font-size: 11px;
  color: #6b7280;
}

.no-sections-notice {
  font-size: 12px;
  color: #6b7280;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 12px 16px;
  border-radius: 8px;
}

/* Outcomes */
.outcomes-input-row {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

.btn-add-outcome {
  background: #ffffff;
  border: 1px solid #d1d5db;
  color: #374151;
  border-radius: 10px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.btn-add-outcome:hover {
  background: #fff7ed;
  border-color: var(--primary-orange, #F18701);
  color: var(--primary-orange, #F18701);
}

.outcomes-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.outcome-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.outcome-bullet {
  color: #16a34a;
  font-weight: 700;
}

.outcome-text {
  flex: 1;
  font-size: 12.5px;
  color: #374151;
}

.btn-remove-outcome {
  background: transparent;
  border: none;
  color: #9ca3af;
  font-size: 18px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}

.btn-remove-outcome:hover {
  color: #dc2626;
}

/* Actions Bar */
.form-actions-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 12px;
}

.btn-cancel {
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  color: #374151;
  padding: 9px 20px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-cancel:hover {
  background: #e5e7eb;
  color: #111827;
}

.btn-submit-course {
  background: var(--primary-orange, #F18701);
  color: #ffffff;
  border: none;
  border-radius: 10px;
  padding: 9px 24px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(241, 135, 1, 0.25);
  transition: all 0.15s ease;
}

.btn-submit-course:hover:not(:disabled) {
  background: var(--primary-orange-hover, #ff8c1a);
  transform: translateY(-1px);
}

.btn-submit-course:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Curriculum Options Toggle */
.curriculum-option-toggle-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 14px;
}

@media (max-width: 680px) {
  .curriculum-option-toggle-grid {
    grid-template-columns: 1fr;
  }
}

.option-radio-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.option-radio-card:hover {
  border-color: #cbd5e1;
  background: #f1f5f9;
}

.option-radio-card.is-selected {
  border-color: var(--primary-orange, #F18701);
  background: #fffaf0;
  box-shadow: 0 2px 8px rgba(241, 135, 1, 0.12);
}

.hidden-radio {
  display: none;
}

.radio-indicator {
  width: 18px;
  height: 18px;
  border: 2px solid #cbd5e1;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
  background: #ffffff;
  transition: all 0.2s ease;
}

.option-radio-card.is-selected .radio-indicator {
  border-color: var(--primary-orange, #F18701);
}

.radio-dot {
  width: 9px;
  height: 9px;
  background: var(--primary-orange, #F18701);
  border-radius: 50%;
}

.radio-content {
  flex: 1;
}

.radio-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.radio-title {
  font-size: 13.5px;
  font-weight: 700;
  color: #1e293b;
}

.badge-recommended {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 2px 7px;
  background: #fef3c7;
  color: #b45309;
  border-radius: 999px;
}

.badge-open {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 2px 7px;
  background: #dbeafe;
  color: #1d4ed8;
  border-radius: 999px;
}

.radio-desc {
  font-size: 12px;
  color: #64748b;
  line-height: 1.45;
  margin: 0;
}

.curriculum-upload-zone {
  margin-top: 10px;
  background: #ffffff;
  border-radius: 12px;
  padding: 4px;
}

.curriculum-dropzone {
  border: 2px dashed #cbd5e1;
  border-radius: 10px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  background: #f8fafc;
  transition: all 0.2s ease;
}

.curriculum-dropzone:hover {
  border-color: var(--primary-orange, #F18701);
  background: #fffaf0;
}

.curriculum-dropzone.has-file {
  border-style: solid;
  border-color: #86efac;
  background: #f0fdf4;
}

.dropzone-empty-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.drop-icon {
  font-size: 26px;
}

.drop-primary-txt {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.drop-sub-txt {
  font-size: 11.5px;
  color: #64748b;
}

.dropzone-selected-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
}

.selected-file-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.file-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #22c55e;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
}

.file-name-text {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  display: block;
}

.file-size-text {
  font-size: 11px;
  color: #64748b;
  display: block;
}

.btn-remove-curr-file {
  background: transparent;
  border: none;
  font-size: 20px;
  color: #ef4444;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}

.curriculum-disclaimer {
  font-size: 11px;
  color: #64748b;
  margin: 8px 0 0 4px;
}
</style>

