<!-- frontend/resources/js/views/mentor/teaching/ClassesView.vue -->
<template>
  <div class="classes-page">
    <header class="page-header">
      <div>
        <h1 class="page-title">My Classes & Sections</h1>
        <p class="page-subtitle">
          Manage enrolled student cohorts, view rosters, and verify cohort progress.
        </p>
      </div>

      <div class="header-actions">
        <button 
          type="button" 
          class="btn-create-class" 
          @click="isCreateClassModalOpen = true"
          title="Create new class or section"
          id="btn-create-class"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>Create Class</span>
        </button>
      </div>
    </header>

    <!-- 4 INTUITIVE TABS (PART 2 REQUIREMENT) -->
    <div class="classes-tab-bar" role="tablist">
      <button 
        type="button" 
        class="tab-btn" 
        :class="{ active: activeClassTab === 'overview' }" 
        @click="activeClassTab = 'overview'"
        id="classes-tab-overview"
      >
        <span>Overview</span>
        <span class="tab-badge-num">{{ sections.length }}</span>
      </button>

      <button 
        type="button" 
        class="tab-btn" 
        :class="{ active: activeClassTab === 'students' }" 
        @click="activeClassTab = 'students'"
        id="classes-tab-students"
      >
        <span>Students</span>
        <span class="tab-badge-num">{{ students.length }}</span>
      </button>

      <button 
        type="button" 
        class="tab-btn" 
        :class="{ active: activeClassTab === 'courses' }" 
        @click="activeClassTab = 'courses'"
        id="classes-tab-courses"
      >
        <span>Modules</span>
        <span class="tab-badge-num">{{ courses.length }}</span>
      </button>

      <button 
        type="button" 
        class="tab-btn" 
        :class="{ active: activeClassTab === 'requests' }" 
        @click="activeClassTab = 'requests'"
        id="classes-tab-requests"
      >
        <span>Requests</span>
      </button>
    </div>

    <!-- TAB 1: OVERVIEW -->
    <div v-if="activeClassTab === 'overview'">
      <!-- Empty State -->
      <div v-if="sections.length === 0" class="classes-empty-state">
        <div class="empty-icon-circle">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#64748b" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          </svg>
        </div>
        <h2 class="empty-title">No Classes Configured Yet</h2>
        <p class="empty-desc">
          There are currently no classes or sections assigned to your mentor account. Create your first class cohort to organize students and track laboratory checkpoints.
        </p>
        <button 
          type="button" 
          class="btn-empty-create" 
          @click="isCreateClassModalOpen = true"
        >
          + Create First Class
        </button>
      </div>

      <!-- Classes List & Student Rosters -->
      <div v-else class="classes-container">
        <div class="sections-accordion-list">
          <div 
            v-for="sec in sections" 
            :key="sec.id" 
            class="section-card"
          >
            <div class="section-card-header" @click="toggleSection(sec.id)">
              <div class="sec-meta-left">
                <span class="sec-code-pill">{{ sec.code }}</span>
                <div>
                  <h2 class="sec-name-text">{{ sec.name }}</h2>
                  <span class="sec-school-sub">{{ sec.school }} • {{ sec.grade_level }}</span>
                </div>
              </div>

              <div class="sec-meta-right">
                <span class="student-count-badge">
                  {{ getStudentsForSection(sec.id).length }} Enrolled
                </span>
                <button 
                  type="button" 
                  class="btn-card-enroll" 
                  @click.stop="openEnrollModal(sec)"
                  title="Enroll student to this section"
                >
                  + Enroll
                </button>
                <button 
                  type="button" 
                  class="btn-card-edit" 
                  @click.stop="openEditModal(sec)"
                  title="Edit class details"
                  aria-label="Edit class details"
                >
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  <span>Edit</span>
                </button>
                <button 
                  type="button" 
                  class="btn-card-delete" 
                  @click.stop="openDeleteModal(sec)"
                  title="Delete class"
                  aria-label="Delete class"
                >
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                  <span>Delete</span>
                </button>
                <span class="toggle-arrow" :class="{ 'is-open': expandedSections.includes(sec.id) }">
                  ▼
                </span>
              </div>
            </div>

            <!-- Enrolled Student Roster Table -->
            <div v-if="expandedSections.includes(sec.id)" class="section-roster-body">
              <div class="roster-toolbar">
                <span class="roster-heading">Enrolled Students ({{ getStudentsForSection(sec.id).length }})</span>
                <button 
                  type="button" 
                  class="btn-enroll-action" 
                  @click="openEnrollModal(sec)"
                >
                  + Enroll Student
                </button>
              </div>

              <div v-if="getStudentsForSection(sec.id).length === 0" class="roster-empty-notice">
                <p class="empty-notice-p">No students enrolled in this section yet.</p>
                <button 
                  type="button" 
                  class="btn-enroll-empty" 
                  @click="openEnrollModal(sec)"
                >
                  + Enroll First Student to {{ sec.code }}
                </button>
              </div>

              <table v-else class="roster-table">
                <thead>
                  <tr>
                    <th>Student Learner</th>
                    <th>Current Module & Checkpoint</th>
                    <th>Progress</th>
                    <th>Mastered Concepts</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr 
                    v-for="student in getStudentsForSection(sec.id)" 
                    :key="student.student_id"
                    class="roster-row"
                  >
                    <td class="student-col">
                      <div class="avatar-sm">
                        <img v-if="student.avatar" :src="student.avatar" :alt="student.name" />
                        <span v-else>{{ (student.name || 'S').charAt(0).toUpperCase() }}</span>
                      </div>
                      <div>
                        <span class="student-name">{{ student.name }}</span>
                        <span class="student-email">{{ student.email }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="module-title-sub">{{ student.current_module_title }}</span>
                      <span class="checkpoint-sub">{{ student.current_checkpoint || 'Foundation Phase' }}</span>
                    </td>
                    <td class="progress-col">
                      <div class="progress-bar-wrap">
                        <div class="mini-bar">
                          <div class="mini-fill" :style="{ width: `${student.module_progress}%` }"></div>
                        </div>
                        <span class="percent-text">{{ student.module_progress }}%</span>
                      </div>
                    </td>
                    <td>
                      <span class="badge-mastered">{{ student.mastered_concepts_count }} Concepts</span>
                    </td>
                    <td>
                      <span class="status-badge" :class="`status-${student.learning_status}`">
                        {{ formatStatus(student.learning_status) }}
                      </span>
                    </td>
                    <td class="action-cell">
                      <button 
                        type="button" 
                        class="btn-view-profile" 
                        @click="$emit('open-student', student)"
                      >
                        View Profile
                      </button>
                      <button 
                        type="button" 
                        class="btn-unenroll-action"
                        @click.stop="handleUnenrollStudent(sec.id, student.student_id || student.id, student.name)"
                        title="Unenroll student from class"
                      >
                        Unenroll
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 2: STUDENTS (ROSTER & DIRECT ENROLLMENT) -->
    <div v-else-if="activeClassTab === 'students'" class="tab-pane-students">
      <div class="students-toolbar">
        <div class="cohort-filter">
          <label for="cohort-select" class="filter-label">Filter Section:</label>
          <select id="cohort-select" v-model="selectedCohortId" class="toolbar-select">
            <option value="all">All Classes ({{ students.length }} students)</option>
            <option v-for="sec in sections" :key="sec.id" :value="sec.id">
              {{ sec.name }} ({{ sec.code }}) - {{ getStudentsForSection(sec.id).length }}
            </option>
          </select>
        </div>

        <button 
          type="button" 
          class="btn-enroll-action" 
          @click="openEnrollModal(selectedSectionObject || sections[0])"
          :disabled="sections.length === 0"
        >
          + Enroll Student
        </button>
      </div>

      <div v-if="displayedStudents.length === 0" class="classes-empty-state">
        <p class="empty-desc">No students found for this class.</p>
        <button 
          v-if="sections.length > 0" 
          type="button" 
          class="btn-empty-create" 
          @click="openEnrollModal(selectedSectionObject || sections[0])"
        >
          + Enroll First Student
        </button>
      </div>

      <div v-else class="table-container">
        <table class="roster-table">
          <thead>
            <tr>
              <th>Learner</th>
              <th>Class</th>
              <th>Current Checkpoint</th>
              <th>Progress</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="st in displayedStudents" :key="st.student_id" class="roster-row">
              <td class="student-col">
                <div class="avatar-sm">
                  <img v-if="st.avatar" :src="st.avatar" :alt="st.name" />
                  <span v-else>{{ (st.name || 'S').charAt(0).toUpperCase() }}</span>
                </div>
                <div>
                  <span class="student-name">{{ st.name }}</span>
                  <span class="student-email">{{ st.email }}</span>
                </div>
              </td>
              <td>
                <span class="sec-code-pill">{{ st.section_code || getSectionCode(st.section_id) }}</span>
              </td>
              <td>{{ st.current_checkpoint || 'Foundation Phase' }}</td>
              <td class="progress-col">
                <div class="progress-bar-wrap">
                  <div class="mini-bar">
                    <div class="mini-fill" :style="{ width: `${st.module_progress || 0}%` }"></div>
                  </div>
                  <span class="percent-text">{{ st.module_progress || 0 }}%</span>
                </div>
              </td>
              <td>
                <span class="status-badge" :class="`status-${st.learning_status || 'active'}`">
                  {{ formatStatus(st.learning_status) }}
                </span>
              </td>
              <td class="action-cell">
                <button type="button" class="btn-view-profile" @click="$emit('open-student', st)">
                  View Profile
                </button>
                <button 
                  type="button" 
                  class="btn-unenroll-action"
                  @click.stop="handleUnenrollStudent(st.section_id, st.student_id || st.id, st.name)"
                  title="Unenroll student from class"
                >
                  Unenroll
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB 3: COURSES (ASSIGNED COURSES PER CLASS) -->
    <div v-else-if="activeClassTab === 'courses'" class="tab-pane-courses">
      <div v-if="sections.length === 0" class="classes-empty-state">
        <p class="empty-desc">Create a class before linking courses.</p>
      </div>
      <div v-else class="class-courses-grid">
        <div v-for="sec in sections" :key="sec.id" class="class-course-card">
          <div class="class-course-header">
            <div>
              <span class="sec-code-pill">{{ sec.code }}</span>
              <h3 class="class-course-title">{{ sec.name }}</h3>
            </div>
            <span class="student-count-badge">{{ getStudentsForSection(sec.id).length }} Students</span>
          </div>

          <div class="class-course-list">
            <h4 class="subhead">Linked Courses:</h4>
            <div v-if="getCoursesForSection(sec.id).length === 0" class="text-muted-notice">
              No courses linked to this section yet.
            </div>
            <div v-else class="linked-chips">
              <span v-for="crs in getCoursesForSection(sec.id)" :key="crs.id" class="course-chip">
                📚 {{ crs.title }}
                <button 
                  type="button" 
                  class="btn-unlink-course" 
                  @click.stop="handleRemoveCourseFromSection(crs.id, sec.id, crs.title, sec.name)"
                  title="Remove module from this section"
                  aria-label="Remove module from section"
                >
                  ×
                </button>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 4: REQUESTS (UNENROLLMENT REQUESTS) -->
    <div v-else-if="activeClassTab === 'requests'" class="tab-pane-requests">
      <UnenrollmentRequestsView :mentor-id="mentorId" />
    </div>

    <!-- Modals -->
    <CreateClassModal 
      :is-open="isCreateClassModalOpen" 
      :mentor-id="mentorId" 
      @close="isCreateClassModalOpen = false" 
      @created="handleSectionCreated" 
    />

    <EditClassModal 
      :is-open="isEditClassModalOpen" 
      :section="selectedSectionForEdit" 
      :mentor-id="mentorId" 
      @close="isEditClassModalOpen = false" 
      @updated="handleSectionUpdated" 
    />

    <DeleteClassModal 
      :is-open="isDeleteClassModalOpen" 
      :section="selectedSectionForDelete" 
      :enrolled-count="selectedSectionForDelete ? getStudentsForSection(selectedSectionForDelete.id).length : 0"
      :assigned-courses-count="selectedSectionForDelete ? getAssignedCoursesForSection(selectedSectionForDelete.id) : 0"
      :mentor-id="mentorId"
      @close="isDeleteClassModalOpen = false" 
      @deleted="handleSectionDeleted" 
    />

    <EnrollStudentModal 
      :is-open="isEnrollModalOpen" 
      :section="activeEnrollSection" 
      @close="isEnrollModalOpen = false" 
      @enrolled="handleStudentEnrolled" 
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import CreateClassModal from '../../../components/mentor/CreateClassModal.vue';
import EditClassModal from '../../../components/mentor/EditClassModal.vue';
import DeleteClassModal from '../../../components/mentor/DeleteClassModal.vue';
import EnrollStudentModal from '../../../components/mentor/EnrollStudentModal.vue';
import UnenrollmentRequestsView from './UnenrollmentRequestsView.vue';
import { MentorService } from '../../../../../lib/mentor/mentorService.ts';

const props = defineProps({
  sections: {
    type: Array,
    default: () => [],
  },
  students: {
    type: Array,
    default: () => [],
  },
  courses: {
    type: Array,
    default: () => [],
  },
  mentorId: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['open-student', 'notify', 'student-unenrolled', 'course-unlinked']);

const activeClassTab = ref('overview');
const selectedCohortId = ref('all');
const expandedSections = ref([]);
const isCreateClassModalOpen = ref(false);
const isEditClassModalOpen = ref(false);
const selectedSectionForEdit = ref(null);
const isDeleteClassModalOpen = ref(false);
const selectedSectionForDelete = ref(null);
const isEnrollModalOpen = ref(false);
const activeEnrollSection = ref(null);

onMounted(() => {
  if (props.sections.length > 0) {
    expandedSections.value = [props.sections[0].id];
  }
});

const selectedSectionObject = computed(() => {
  if (selectedCohortId.value === 'all') return props.sections[0] || null;
  return props.sections.find(s => s.id === selectedCohortId.value) || null;
});

const displayedStudents = computed(() => {
  if (selectedCohortId.value === 'all') return props.students;
  return props.students.filter(s => s.section_id === selectedCohortId.value);
});

function toggleSection(secId) {
  const idx = expandedSections.value.indexOf(secId);
  if (idx >= 0) {
    expandedSections.value.splice(idx, 1);
  } else {
    expandedSections.value.push(secId);
  }
}

function getStudentsForSection(secId) {
  return props.students.filter(s => s.section_id === secId);
}

function getSectionCode(secId) {
  const sec = props.sections.find(s => s.id === secId);
  return sec?.code || 'SEC';
}

function getCoursesForSection(secId) {
  return props.courses.filter(c => {
    if (c.assigned_section_ids?.includes(secId)) return true;
    if (c.assigned_sections && Array.isArray(c.assigned_sections)) {
      return c.assigned_sections.some(s => s.id === secId);
    }
    return false;
  });
}

function getAssignedCoursesForSection(secId) {
  return getCoursesForSection(secId).length;
}

function formatStatus(status) {
  if (status === 'completed') return 'Completed';
  if (status === 'struggling') return 'Struggling';
  if (status === 'needs_assistance') return 'Needs Assistance';
  return 'Active';
}

function openEnrollModal(sec) {
  activeEnrollSection.value = sec || props.sections[0] || null;
  isEnrollModalOpen.value = true;
}

function openEditModal(sec) {
  selectedSectionForEdit.value = sec;
  isEditClassModalOpen.value = true;
}

function handleSectionUpdated(sec) {
  emit('notify', `Class "${sec?.name || 'Class'}" updated successfully.`);
}

function openDeleteModal(sec) {
  selectedSectionForDelete.value = sec;
  isDeleteClassModalOpen.value = true;
}

function handleSectionDeleted(secId) {
  const idx = expandedSections.value.indexOf(secId);
  if (idx >= 0) {
    expandedSections.value.splice(idx, 1);
  }
  emit('notify', 'Class and associated cohort mappings removed.');
}

function handleSectionCreated(sec) {
  if (sec?.id && !expandedSections.value.includes(sec.id)) {
    expandedSections.value.push(sec.id);
  }
  emit('notify', `Class "${sec?.name || 'New Class'}" created.`);
}

function handleStudentEnrolled(st) {
  emit('notify', `Enrolled ${st?.name || 'student'} into section.`);
}

async function handleUnenrollStudent(sectionId, studentId, studentName) {
  if (!confirm(`Are you sure you want to unenroll ${studentName || 'this student'} from this class? This will immediately revoke their access to modules assigned to this class.`)) {
    return;
  }

  try {
    const res = await MentorService.unenrollStudentFromSection(sectionId, studentId, props.mentorId);
    if (res.success) {
      emit('notify', `Student ${studentName || ''} successfully unenrolled.`);
      emit('student-unenrolled', { sectionId, studentId });
    } else {
      emit('notify', `Unenrollment error: ${res.error || 'Failed to unenroll student.'}`);
    }
  } catch (err) {
    emit('notify', 'An unexpected error occurred during unenrollment.');
  }
}

async function handleRemoveCourseFromSection(courseId, sectionId, courseTitle, sectionName) {
  if (!confirm(`Are you sure you want to remove "${courseTitle}" from section "${sectionName}"? Students in this section will no longer have access to this module.`)) {
    return;
  }

  try {
    const res = await MentorService.removeCourseFromSection(courseId, sectionId, props.mentorId);
    if (res.success) {
      emit('notify', `Module "${courseTitle}" removed from ${sectionName}.`);
      emit('course-unlinked', { courseId, sectionId });
    } else {
      emit('notify', `Error unlinking module: ${res.error || 'Failed'}`);
    }
  } catch (err) {
    emit('notify', 'An error occurred unlinking the module.');
  }
}
</script>

<style scoped>
.classes-page {
  padding: 8px 12px 36px 8px;
  width: 100%;
  box-sizing: border-box;
}

.page-header {
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
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
}

.classes-tab-bar {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 8px;
  margin-bottom: 16px;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.tab-btn.active {
  background: #f8fafc;
  color: #ea580c;
  border-color: #e2e8f0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.tab-badge-num {
  padding: 1px 6px;
  background: #e2e8f0;
  border-radius: 10px;
  font-size: 11px;
  color: #475569;
}

.tab-btn.active .tab-badge-num {
  background: #ffedd5;
  color: #c2410c;
}

.students-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  background: #ffffff;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.toolbar-select {
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  font-size: 13px;
}

.class-courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.class-course-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px;
}

.class-course-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.class-course-title {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin: 4px 0 0 0;
}

.subhead {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  margin: 0 0 6px 0;
}

.text-muted-notice {
  font-size: 12px;
  color: #94a3b8;
  font-style: italic;
}

.linked-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.course-chip {
  padding: 3px 8px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  color: #334155;
}

.tab-pane-requests {
  width: 100%;
}

.btn-create-class {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: var(--primary-orange, #f18701);
  color: #ffffff;
  border: 1px solid #ea580c;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-create-class:hover {
  background: #ea580c;
}

.classes-empty-state {
  background: #ffffff;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  padding: 48px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
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

.empty-title { font-size: 16px; font-weight: 700; color: #111827; margin: 0 0 4px 0; }
.empty-desc { font-size: 12.5px; color: #64748b; max-width: 480px; margin: 0 0 16px 0; line-height: 1.45; }

.btn-empty-create {
  padding: 9px 18px;
  background: var(--primary-orange, #f18701);
  color: #ffffff;
  border: 1px solid #ea580c;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-empty-create:hover {
  background: #ea580c;
}

.sections-accordion-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-card {
  background: #ffffff;
  border: 1px solid var(--border-card, #eef1f4);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  transition: border-color 0.15s ease;
}

.section-card:hover {
  border-color: #cbd5e1;
}

.section-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  background: #ffffff;
  transition: background 0.12s ease;
}

.section-card-header:hover {
  background: #f8fafc;
}

.sec-meta-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sec-code-pill {
  font-size: 10.5px;
  font-weight: 700;
  background: #fff7ed;
  color: #c2410c;
  border: 1px solid #fed7aa;
  padding: 2px 7px;
  border-radius: 5px;
}

.sec-name-text {
  font-size: 14.5px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.sec-school-sub {
  font-size: 11px;
  color: #64748b;
}

.sec-meta-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.student-count-badge {
  font-size: 11.5px;
  font-weight: 600;
  color: #334155;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 3px 8px;
  border-radius: 5px;
}

.btn-card-enroll {
  font-size: 11px;
  font-weight: 600;
  color: #c2410c;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  padding: 3px 8px;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.12s ease;
}

.btn-card-enroll:hover {
  background: #ffedd5;
  border-color: #f97316;
}

.btn-card-edit {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-body, #334155);
  background: var(--bg-surface, #ffffff);
  border: 1px solid var(--border-subtle, #cbd5e1);
  padding: 3px 8px;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.12s ease;
}

.btn-card-edit:hover {
  background: var(--bg-hover, #f1f5f9);
  color: #2563eb;
  border-color: #93c5fd;
}

.btn-card-delete {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted, #64748b);
  background: transparent;
  border: 1px solid transparent;
  padding: 3px 8px;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.12s ease;
}

.btn-card-delete:hover {
  background: #fef2f2;
  color: #dc2626;
  border-color: #fecaca;
}

.toggle-arrow {
  color: #9ca3af;
  font-size: 10px;
  transition: transform 0.2s ease;
}

.toggle-arrow.is-open {
  transform: rotate(180deg);
}

.section-roster-body {
  border-top: 1px solid #f1f5f9;
  background: #fafbfc;
  padding: 12px 16px 16px;
}

.roster-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.roster-heading {
  font-size: 12px;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.btn-enroll-action {
  font-size: 11.5px;
  font-weight: 600;
  color: #ea580c;
  background: #ffffff;
  border: 1px solid #fed7aa;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.12s ease;
}

.btn-enroll-action:hover {
  background: #fff7ed;
  border-color: #f97316;
}

.roster-empty-notice {
  padding: 24px;
  text-align: center;
  background: #ffffff;
  border: 1px dashed #e2e8f0;
  border-radius: 8px;
}

.empty-notice-p {
  font-size: 12px;
  color: #64748b;
  margin: 0 0 10px 0;
}

.btn-enroll-inline,
.btn-enroll-empty {
  font-size: 12px;
  font-weight: 600;
  color: #ea580c;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.12s ease;
}

.btn-enroll-empty:hover {
  background: #ffedd5;
}

.roster-table {
  width: 100%;
  border-collapse: collapse;
  background: #ffffff;
  border: 1px solid #eef1f4;
  border-radius: 8px;
  overflow: hidden;
}

.roster-table th {
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  background: #f8fafc;
  padding: 8px 12px;
  border-bottom: 1px solid #e2e8f0;
}

.roster-table td {
  padding: 8px 12px;
  font-size: 12px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.roster-row:hover {
  background: #f8fafc;
}

.student-col {
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatar-sm {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #fed7aa;
  color: #c2410c;
  font-weight: 700;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-sm img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.student-name {
  display: block;
  font-weight: 600;
  color: #111827;
  font-size: 12px;
}

.student-email {
  display: block;
  font-size: 10.5px;
  color: #94a3b8;
}

.module-title-sub {
  display: block;
  font-weight: 600;
  color: #334155;
  font-size: 11.5px;
}

.checkpoint-sub {
  display: block;
  font-size: 10.5px;
  color: #64748b;
}

.progress-col {
  min-width: 110px;
}

.progress-bar-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.mini-bar {
  flex: 1;
  height: 5px;
  background: #f1f5f9;
  border-radius: 999px;
  overflow: hidden;
}

.mini-fill {
  height: 100%;
  background: var(--primary-orange, #F18701);
  border-radius: 999px;
}

.percent-text {
  font-size: 10.5px;
  font-weight: 700;
  color: #111827;
  min-width: 26px;
}

.badge-mastered {
  font-size: 10px;
  font-weight: 600;
  color: #15803d;
  background: #dcfce7;
  border: 1px solid #bbf7d0;
  padding: 1px 6px;
  border-radius: 4px;
}

.status-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 4px;
}

.status-active { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
.status-needs_assistance { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
.status-struggling { background: #ffe4e6; color: #e11d48; border: 1px solid #fecdd3; }
.status-completed { background: #f3e8ff; color: #7e22ce; border: 1px solid #e9d5ff; }

.btn-view-profile {
  background: #ffffff;
  border: 1px solid #d1d5db;
  color: #374151;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.12s ease;
}

.btn-view-profile:hover {
  background: #fff7ed;
  border-color: var(--primary-orange, #F18701);
  color: var(--primary-orange, #F18701);
}

.action-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-unenroll-action {
  font-size: 11px;
  font-weight: 600;
  color: #dc2626;
  background: #ffffff;
  border: 1px solid #fecaca;
  padding: 4px 8px;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-unenroll-action:hover {
  background: #fef2f2;
  border-color: #f87171;
}

.btn-unlink-course {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  margin-left: 6px;
  padding: 0 4px;
  border-radius: 3px;
  line-height: 1;
}

.btn-unlink-course:hover {
  background: #fee2e2;
  color: #dc2626;
}
</style>
