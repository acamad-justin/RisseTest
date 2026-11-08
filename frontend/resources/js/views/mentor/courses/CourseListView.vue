<!-- frontend/resources/js/views/mentor/courses/CourseListView.vue -->
<template>
  <div class="course-list-page">
    <header class="page-header">
      <div>
        <h1 class="page-title">My Modules</h1>
        <p class="page-subtitle">
          Central pedagogical tracks. Each module contains ordered Learning Nodes and can be assigned to multiple sections while keeping student progress independent.
        </p>
      </div>

      <button 
        type="button" 
        class="btn-studio-primary" 
        @click="$emit('navigate', 'create-course')"
        id="btn-create-course"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Create Module
      </button>
    </header>

    <!-- Empty State -->
    <div v-if="courses.length === 0" class="courses-empty-container">
      <div class="empty-icon-circle">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#64748b" stroke-width="2">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
          <path d="M6 6h10"/>
          <path d="M6 10h10"/>
        </svg>
      </div>
      <h2 class="empty-headline">No Modules Created Yet</h2>
      <p class="empty-subtext">
        Modules represent subjects and coherent learning units with ordered Learning Nodes. Create your first module to begin uploading materials and drafting topic nodes.
      </p>
      <button 
        type="button" 
        class="btn-studio-primary" 
        @click="$emit('navigate', 'create-course')"
      >
        + Create Your First Module
      </button>
    </div>

    <!-- Courses Grid -->
    <div v-else class="courses-grid">
      <div 
        v-for="course in courses" 
        :key="course.id" 
        class="course-card"
      >
        <div class="course-card-top">
          <div class="course-badges-row">
            <span class="badge-subject">{{ course.subject }}</span>
            <span 
              class="badge-enrollment-type"
              :class="course.enrollment_type === 'self_paced' ? 'enrollment-self-paced' : 'enrollment-curriculum'"
            >
              {{ course.enrollment_type === 'self_paced' ? '⚡ Self-Paced' : '📚 Curriculum' }}
            </span>
            <span class="badge-status" :class="`status-${course.status}`">
              {{ formatStatus(course.status) }}
            </span>
            <span 
              v-if="course.assigned_sections && course.assigned_sections.length > 0" 
              class="badge-assigned"
            >
              Assigned ({{ course.assigned_sections.length }})
            </span>
            <span 
              v-else-if="course.status === 'published' && course.enrollment_type !== 'self_paced'" 
              class="badge-unassigned-warning" 
              title="This published module is not assigned to any class sections, so cohort students cannot see it yet."
            >
              ⚠️ No assigned sections
            </span>
          </div>
          <h2 class="course-card-title">{{ course.title }}</h2>
          <p class="course-card-desc">
            {{ course.description || 'No course description provided.' }}
          </p>
        </div>

        <div class="course-card-middle">
          <div class="meta-row">
            <span class="meta-label">Level:</span>
            <span class="meta-val">{{ course.academic_level }}</span>
          </div>

          <div v-if="course.semester || course.school_year" class="meta-row">
            <span class="meta-label">Term:</span>
            <span class="meta-val">
              {{ [course.semester, course.school_year].filter(Boolean).join(' • ') }}
            </span>
          </div>

          <!-- Assigned Sections -->
          <div class="assigned-sections-row">
            <span class="meta-label">Assigned Sections:</span>
            <div v-if="course.assigned_sections && course.assigned_sections.length > 0" class="section-chips-wrap">
              <span 
                v-for="sec in course.assigned_sections" 
                :key="sec.id" 
                class="section-chip"
              >
                {{ sec.name }} ({{ sec.code }})
              </span>
            </div>
            <span v-else class="meta-val text-warning-hint">⚠️ None assigned (Assign to a section for students to access)</span>
          </div>

          <!-- Counts -->
          <div class="course-counts-bar">
            <div class="count-pill">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <span>{{ course.materials_count || 0 }} Materials</span>
            </div>
            <div class="count-pill">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <span>Curriculum Ready</span>
            </div>
          </div>
        </div>

        <!-- Card Actions -->
        <div class="course-card-actions">
          <button 
            type="button" 
            class="btn-card-action" 
            @click="$emit('select-materials', course)"
            title="Manage uploaded materials"
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Materials
          </button>

          <button 
            type="button" 
            class="btn-card-action btn-course-studio" 
            @click="$emit('select-curriculum', course)"
            title="Open Module Studio: Topic Nodes, Materials & Publishing"
            id="btn-open-studio"
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            Open in Module Studio →
          </button>

          <button 
            type="button" 
            class="btn-card-action btn-course-edit" 
            @click="openEditModal(course)"
            title="Edit course details & section assignments"
            :id="`btn-edit-course-${course.id}`"
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            Edit
          </button>

          <button 
            type="button" 
            class="btn-card-delete" 
            @click.stop="$emit('delete-course', course.id)"
            title="Delete course"
            :id="`btn-delete-course-${course.id}`"
            :aria-label="`Delete course ${course.title}`"
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Course Modal -->
    <div v-if="isEditModalOpen" class="modal-overlay" @click.self="closeEditModal">
      <div class="edit-modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-edit-course-title">
        <header class="modal-header">
          <div>
            <h3 class="modal-title" id="modal-edit-course-title">Edit Course</h3>
            <p class="modal-subtitle">Update course details, pedagogical level, and section assignments.</p>
          </div>
          <button type="button" class="btn-close-modal" @click="closeEditModal" title="Close">✕</button>
        </header>

        <form @submit.prevent="handleSaveEdit" class="modal-form">
          <div class="form-group">
            <label class="form-label" for="edit-title">Course Title *</label>
            <input 
              id="edit-title" 
              type="text" 
              v-model="editForm.title" 
              class="form-input" 
              required
              placeholder="e.g. Introduction to Programmable Logic Controllers"
            />
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label" for="edit-subject">Subject / Discipline *</label>
              <input 
                id="edit-subject" 
                type="text" 
                v-model="editForm.subject" 
                class="form-input" 
                required
                placeholder="e.g. Robotics & Industrial Automation"
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="edit-level">Academic Level *</label>
              <input 
                id="edit-level" 
                type="text" 
                v-model="editForm.academic_level" 
                class="form-input" 
                required
                placeholder="e.g. Grade 11 STEM"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="edit-enrollment-type">Enrollment Policy *</label>
            <select 
              id="edit-enrollment-type" 
              v-model="editForm.enrollment_type" 
              class="form-select"
              required
            >
              <option value="curriculum">Curriculum / Teacher-Controlled (Requires approval to unenroll)</option>
              <option value="self_paced">Self-Paced / Open Enrollment (Student can self-enroll & unenroll freely)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="edit-desc">Course Description</label>
            <textarea 
              id="edit-desc" 
              v-model="editForm.description" 
              class="form-textarea" 
              rows="3"
              placeholder="Provide a brief summary of course topics and scope..."
            ></textarea>
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label" for="edit-year">School Year</label>
              <input 
                id="edit-year" 
                type="text" 
                v-model="editForm.school_year" 
                class="form-input" 
                placeholder="e.g. 2026-2027"
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="edit-semester">Semester / Term</label>
              <input 
                id="edit-semester" 
                type="text" 
                v-model="editForm.semester" 
                class="form-input" 
                placeholder="e.g. 1st Semester"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Assign Classes / Sections</label>
            <p class="form-hint">Enrolled students in selected sections will automatically access published course materials.</p>
            <div class="sections-checkbox-grid">
              <label 
                v-for="sec in allSections" 
                :key="sec.id" 
                class="sec-check-item"
              >
                <input 
                  type="checkbox" 
                  :value="sec.id" 
                  v-model="editForm.sectionIds"
                  class="checkbox-input"
                />
                <span class="sec-check-name">{{ sec.name }}</span>
                <span class="sec-check-code">{{ sec.code }}</span>
              </label>
              <p v-if="allSections.length === 0" class="text-muted no-sections-hint">
                No classes registered yet. You can create classes in the My Classes tab.
              </p>
            </div>
          </div>

          <div v-if="editError" class="edit-error-banner">
            {{ editError }}
          </div>

          <footer class="modal-footer">
            <button type="button" class="btn-cancel" @click="closeEditModal" :disabled="isSavingEdit">
              Cancel
            </button>
            <button type="submit" class="btn-save" :disabled="isSavingEdit" id="btn-save-course-edit">
              <span v-if="isSavingEdit">Saving Changes...</span>
              <span v-else>Save Changes</span>
            </button>
          </footer>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';

const props = defineProps({
  courses: {
    type: Array,
    default: () => [],
  },
  allSections: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits([
  'navigate', 
  'select-materials', 
  'select-curriculum', 
  'delete-course',
  'update-course'
]);

const isEditModalOpen = ref(false);
const isSavingEdit = ref(false);
const editError = ref(null);
const activeEditingCourseId = ref(null);

const editForm = reactive({
  title: '',
  description: '',
  subject: '',
  academic_level: '',
  enrollment_type: 'curriculum',
  school_year: '',
  semester: '',
  sectionIds: [],
});

function openEditModal(course) {
  activeEditingCourseId.value = course.id;
  editForm.title = course.title || '';
  editForm.description = course.description || '';
  editForm.subject = course.subject || '';
  editForm.academic_level = course.academic_level || '';
  editForm.enrollment_type = course.enrollment_type || 'curriculum';
  editForm.school_year = course.school_year || '';
  editForm.semester = course.semester || '';
  editForm.sectionIds = [...(course.assigned_section_ids || (course.assigned_sections || []).map(s => s.id))];
  editError.value = null;
  isEditModalOpen.value = true;
}

function closeEditModal() {
  isEditModalOpen.value = false;
  activeEditingCourseId.value = null;
  editError.value = null;
}

async function handleSaveEdit() {
  if (!editForm.title.trim()) {
    editError.value = 'Course title is required.';
    return;
  }
  if (!editForm.subject.trim()) {
    editError.value = 'Subject is required.';
    return;
  }
  if (!editForm.academic_level.trim()) {
    editError.value = 'Academic level is required.';
    return;
  }

  isSavingEdit.value = true;
  editError.value = null;

  try {
    emit('update-course', {
      courseId: activeEditingCourseId.value,
      updates: {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        subject: editForm.subject.trim(),
        academic_level: editForm.academic_level.trim(),
        enrollment_type: editForm.enrollment_type || 'curriculum',
        school_year: editForm.school_year.trim(),
        semester: editForm.semester.trim(),
      },
      sectionIds: editForm.sectionIds,
    });
    closeEditModal();
  } catch (err) {
    editError.value = err.message || 'Failed to update course.';
  } finally {
    isSavingEdit.value = false;
  }
}

function formatStatus(status) {
  if (status === 'published') return 'Published';
  if (status === 'review') return 'In Review';
  if (status === 'archived') return 'Archived';
  return 'Draft';
}
</script>

<style scoped>
.course-list-page {
  padding: 8px 12px 36px 8px;
  width: 100%;
  box-sizing: border-box;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 14px;
  flex-wrap: wrap;
}

.page-title {
  font-family: var(--font-family-display, inherit);
  font-size: 22px;
  font-weight: 700;
  color: var(--text-heading, #111827);
  letter-spacing: -0.01em;
  margin: 0 0 3px 0;
}

.page-subtitle {
  font-size: 13px;
  color: var(--text-muted, #64748b);
  margin: 0;
  max-width: 700px;
}

.btn-studio-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--primary-orange, #F18701);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 7px 14px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(241, 135, 1, 0.2);
  transition: all 0.15s ease;
}

.btn-studio-primary:hover {
  background: var(--primary-orange-hover, #ff8c1a);
}

/* Empty State */
.courses-empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  background: #ffffff;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.empty-icon-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}

.empty-headline {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 4px 0;
}

.empty-subtext {
  font-size: 12.5px;
  color: #64748b;
  max-width: 480px;
  margin: 0 0 16px 0;
  line-height: 1.45;
}

/* Courses Grid */
.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 14px;
}

.course-card {
  background: #ffffff;
  border: 1px solid var(--border-card, #eef1f4);
  border-radius: 12px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.course-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.course-card-top {
  margin-bottom: 12px;
}

.course-badges-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.badge-subject {
  font-size: 10.5px;
  font-weight: 700;
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
  padding: 2px 7px;
  border-radius: 4px;
}

.badge-enrollment-type {
  font-size: 10.5px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
}

.enrollment-self-paced {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

.enrollment-curriculum {
  background: #f8fafc;
  color: #475569;
  border: 1px solid #cbd5e1;
}

.badge-status {
  font-size: 10.5px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
}

.status-draft { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
.status-published { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
.status-review { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
.status-archived { background: #f3f4f6; color: #6b7280; border: 1px solid #e5e7eb; }

.badge-assigned {
  font-size: 10.5px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}

.badge-unassigned-warning {
  font-size: 10.5px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
  background: #fffbeb;
  color: #b45309;
  border: 1px solid #fde68a;
  cursor: help;
}

.text-warning-hint {
  color: #b45309 !important;
  font-weight: 600;
  font-size: 11px;
}

.course-card-title {
  font-size: 15px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 4px 0;
  line-height: 1.3;
}

.course-card-desc {
  font-size: 12px;
  color: #64748b;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.course-card-middle {
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11.5px;
}

.meta-label {
  color: #64748b;
  font-weight: 500;
}

.meta-val {
  color: #111827;
  font-weight: 600;
}

.assigned-sections-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  font-size: 11.5px;
}

.section-chips-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: flex-end;
}

.section-chip {
  font-size: 10px;
  font-weight: 600;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #334155;
  padding: 1px 6px;
  border-radius: 4px;
}

.course-counts-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  border-top: 1px solid #e2e8f0;
  padding-top: 6px;
  margin-top: 2px;
}

.count-pill {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10.5px;
  color: #475569;
  font-weight: 500;
}

.course-card-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  border-top: 1px solid #f1f5f9;
  padding-top: 10px;
}

.btn-card-action {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  background: #ffffff;
  border: 1px solid #d1d5db;
  color: #374151;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.12s ease;
}

.btn-card-action:hover {
  background: #f9fafb;
  border-color: #9ca3af;
  color: #111827;
}

.btn-highlight {
  background: #fff7ed;
  border-color: #fed7aa;
  color: #c2410c;
}

.btn-highlight:hover {
  background: var(--primary-orange, #F18701);
  border-color: var(--primary-orange, #F18701);
  color: #ffffff;
}

.btn-course-studio {
  background: #fff7ed;
  border-color: #fdba74;
  color: #c2410c;
  font-weight: 700;
}

.btn-course-studio:hover {
  background: var(--primary-orange, #F18701);
  border-color: #ea580c;
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(241, 135, 1, 0.25);
}

.btn-card-delete {
  background: #ffffff;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.12s ease;
}

.btn-card-delete:hover {
  background: #fef2f2;
}

.btn-course-edit {
  color: #3b82f6;
  border-color: #bfdbfe;
  background: #eff6ff;
}

.btn-course-edit:hover {
  background: #3b82f6;
  border-color: #2563eb;
  color: #ffffff;
}

/* Edit Course Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
}

.edit-modal-card {
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 24px;
  border: 1px solid #e2e8f0;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px 0;
}

.modal-subtitle {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

.btn-close-modal {
  background: transparent;
  border: none;
  font-size: 18px;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.12s ease;
}

.btn-close-modal:hover {
  color: #0f172a;
  background: #f1f5f9;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-label {
  font-size: 12.5px;
  font-weight: 600;
  color: #334155;
}

.form-hint {
  font-size: 11.5px;
  color: #64748b;
  margin: 0 0 6px 0;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 9px 12px;
  font-size: 13px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #f8fafc;
  color: #0f172a;
  font-family: inherit;
  transition: border-color 0.12s ease, box-shadow 0.12s ease;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  background: #ffffff;
  border-color: #f18701;
  box-shadow: 0 0 0 3px rgba(241, 135, 1, 0.15);
}

.sections-checkbox-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  max-height: 140px;
  overflow-y: auto;
  padding: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.sec-check-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #ffffff;
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.12s ease;
}

.sec-check-item:hover {
  background: #f1f5f9;
}

.checkbox-input {
  cursor: pointer;
}

.sec-check-name {
  font-weight: 600;
  color: #0f172a;
  flex: 1;
}

.sec-check-code {
  font-size: 11px;
  color: #64748b;
  font-family: monospace;
}

.no-sections-hint {
  font-size: 11.5px;
  grid-column: span 2;
  margin: 4px 0;
}

.edit-error-banner {
  padding: 8px 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  border-radius: 6px;
  font-size: 12px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
}

.btn-cancel {
  padding: 8px 16px;
  font-size: 13px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #475569;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.12s ease;
}

.btn-cancel:hover {
  background: #f1f5f9;
}

.btn-save {
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 600;
  background: #f18701;
  border: 1px solid #ea580c;
  color: #ffffff;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.12s ease;
}

.btn-save:hover:not(:disabled) {
  background: #ea580c;
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>