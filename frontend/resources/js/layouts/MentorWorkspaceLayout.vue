<!-- frontend/resources/js/layouts/MentorWorkspaceLayout.vue -->
<template>
  <div class="risse-layout mentor-workspace-layout">
    <!-- Dedicated Teacher Studio Sidebar styled identically to Student Sidebar -->
    <MentorSidebar 
      :active-view="currentView" 
      :mentor="currentMentor" 
      :courses-count="mentorStore.courses.length"
      :pending-unenrollment-count="mentorStore.pendingUnenrollmentCount"
      @select-view="handleViewChange" 
      @switch-workspace="$emit('switch-to-student')" 
      @logout="$emit('logout')" 
      @collapse-change="onSidebarCollapseChange"
    />

    <!-- Main Workspace Cockpit Container -->
    <!-- While the lesson editor is open it docks beside the sidebar instead of
         covering it, so the editor gets the real remaining width. -->
    <main
      class="risse-main mentor-main-container"
      :class="{
        'is-lesson-editor-open': isLessonEditorOpen,
        'is-sidebar-collapsed': isSidebarCollapsed,
      }"
      role="main"
    >
      <!-- Top Global Header -->
      <header class="mentor-workspace-header">
        <div class="header-breadcrumbs">
          <span class="crumb-root">TEACHER STUDIO</span>
          <span class="crumb-separator">/</span>
          <span class="crumb-active">{{ viewTitle }}</span>
        </div>

        <div class="header-actions-cluster">
          <!-- Mentor Notifications Dropdown -->
          <div class="notifications-wrapper" ref="notificationsDropdownRef">
            <button 
              type="button" 
              class="btn-header-icon" 
              @click="toggleNotifications"
              title="Notifications"
              id="btn-mentor-notifications"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span v-if="unreadCount > 0" class="notif-badge">{{ unreadCount }}</span>
            </button>

            <!-- Notifications Popover -->
            <div v-if="isNotificationsOpen" class="notifications-popover">
              <header class="notif-popover-header">
                <span class="notif-popover-title">Notifications</span>
                <span v-if="unreadCount > 0" class="notif-unread-tag">{{ unreadCount }} new</span>
              </header>
              <div v-if="notifications.length === 0" class="notif-empty-state">
                <span>No new notifications</span>
              </div>
              <div v-else class="notif-list">
                <div 
                  v-for="notif in notifications" 
                  :key="notif.id" 
                  class="notif-item"
                  :class="{ 'is-unread': !notif.is_read }"
                  @click="handleNotificationClick(notif)"
                >
                  <div class="notif-icon-col">
                    <span v-if="notif.type === 'unenrollment_request'">📝</span>
                    <span v-else-if="notif.type === 'unenrollment_approved'">✓</span>
                    <span v-else-if="notif.type === 'unenrollment_rejected'">✕</span>
                    <span v-else>🔔</span>
                  </div>
                  <div class="notif-content-col">
                    <span class="notif-title">{{ notif.title }}</span>
                    <p class="notif-msg">{{ notif.message }}</p>
                    <span class="notif-time">{{ formatNotifTime(notif.created_at) }}</span>
                  </div>
                  <span v-if="!notif.is_read" class="notif-unread-dot"></span>
                </div>
              </div>
            </div>
          </div>

          <!-- Switch View / Student Preview Pill -->
          <button 
            type="button" 
            class="btn-header-pill" 
            @click="$emit('switch-to-student')"
            title="Preview how enrolled students see checkpoints"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span>Preview Student View</span>
          </button>
        </div>
      </header>

      <!-- Scrollable Main View Stage -->
      <div class="workspace-view-scroll">
        <!-- 1. DASHBOARD -->
        <MentorDashboard 
          v-if="currentView === 'dashboard'" 
          :metrics="mentorStore.dashboardMetrics" 
          :sections="mentorStore.sections"
          :is-loading="mentorStore.isLoadingDashboard"
          :dashboard-error="mentorStore.dashboardError"
          @navigate="handleViewChange"
          @open-student="handleOpenStudentDetail"
          @retry="handleReloadDashboard"
        />

        <!-- 2. MY COURSES -->
        <CourseListView 
          v-else-if="currentView === 'courses'" 
          :courses="mentorStore.courses"
          :all-sections="mentorStore.sections"
          @navigate="handleViewChange"
          @select-materials="handleSelectMaterialsForCourse"
          @select-curriculum="handleSelectCurriculumForCourse"
          @delete-course="handleDeleteCourse"
          @update-course="handleUpdateCourse"
        />

        <!-- 3. CREATE COURSE -->
        <CreateCourseView 
          v-else-if="currentView === 'create-course'" 
          :sections="mentorStore.sections"
          :mentor-id="mentorId"
          @navigate="handleViewChange"
          @course-created="handleCourseCreated"
        />

        <!-- 4. COURSE MATERIALS -->
        <CourseMaterialsView 
          v-else-if="currentView === 'materials'" 
          :courses="mentorStore.courses"
          :active-course-id="mentorStore.activeCourseId"
          :active-course="mentorStore.activeCourse"
          :materials="mentorStore.courseMaterials"
          :is-loading="mentorStore.isLoadingMaterials"
          :is-uploading="mentorStore.isUploading"
          :uploader-id="mentorId"
          @navigate="handleViewChange"
          @select-course="handleCourseSelect"
          @upload-material="handleUploadMaterial"
          @delete-material="handleDeleteMaterial"
        />

        <!-- 5. CURRICULUM DESIGNER -->
        <CurriculumDesigner 
          v-else-if="currentView === 'curriculum-designer'" 
          :courses="mentorStore.courses"
          :active-course-id="mentorStore.activeCourseId"
          :active-course="mentorStore.activeCourse"
          :materials="mentorStore.courseMaterials"
          :proposal="mentorStore.activeProposal"
          :is-generating="mentorStore.isGeneratingProposal"
          :foundation-modules="mentorStore.foundationModules"
          :mentor-id="mentorId"
          :skip-intake="studioEntry === 'edit'"
          @editor-open-change="isLessonEditorOpen = $event"
          @navigate="handleViewChange"
          @select-course="handleCourseSelect"
          @generate-proposal="handleGenerateProposal"
          @save-proposal="handleSaveProposal"
          @approve-proposal="handleApproveProposal"
          @publish-proposal="handlePublishProposal"
        />

        <!-- 6. MY CLASSES / SECTIONS -->
        <ClassesView 
          v-else-if="currentView === 'classes'" 
          :sections="mentorStore.sections"
          :students="mentorStore.students"
          :courses="mentorStore.courses"
          :mentor-id="mentorId"
          @open-student="handleOpenStudentDetail"
          @student-unenrolled="handleStudentUnenrolled"
          @course-unlinked="handleCourseUnlinked"
          @notify="$emit('notify', $event)"
        />

        <!-- 7. STUDENT PROGRESS -->
        <StudentProgressView 
          v-else-if="currentView === 'students'" 
          :students="mentorStore.students"
          :sections="mentorStore.sections"
          @open-student="handleOpenStudentDetail"
        />

        <!-- 8. STAR CHARTS -->
        <StarChartsView 
          v-else-if="currentView === 'star-charts'" 
          :students="mentorStore.students"
          :star-chart="mentorStore.studentStarChart"
          :catalog="mentorStore.AVAILABLE_STARS"
          @select-student="handleSelectStudentForStarChart"
          @open-star-modal="handleOpenStarModal"
        />

        <!-- 8B. UNENROLLMENT REQUESTS -->
        <UnenrollmentRequestsView 
          v-else-if="currentView === 'unenrollment-requests'" 
          :mentor-id="mentorId"
        />

        <!-- 9. MENTOR PROFILE -->
        <MentorProfileView 
          v-else-if="currentView === 'profile'" 
          :mentor="currentMentor"
          :user-role="userRole"
          :sections-count="mentorStore.sections.length"
          :courses-count="mentorStore.courses.length"
          @switch-workspace="$emit('switch-to-student')"
          @logout="$emit('logout')"
        />
      </div>
    </main>

    <!-- Student Detail Modal -->
    <StudentDetailModal 
      :is-open="Boolean(mentorStore.isDetailOpen)"
      :student="mentorStore.selectedStudent"
      :star-chart="mentorStore.studentStarChart"
      :is-loading-stars="mentorStore.isLoadingStarChart"
      :catalog="mentorStore.AVAILABLE_STARS"
      @close="handleCloseStudentDetail"
      @award-star="handleAwardStarFromDetail"
      @revoke-star="handleRevokeStarFromDetail"
    />

    <!-- Star Action Modal (Award or Revoke) -->
    <StarActionModal 
      :is-open="Boolean(mentorStore.isStarModalOpen)"
      :student="mentorStore.starTargetStudent"
      :action-type="mentorStore.starActionType"
      :catalog="mentorStore.AVAILABLE_STARS"
      :initial-star="mentorStore.starForm"
      @close="handleCloseStarModal"
      @submit="handleStarSubmit"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useMentorStore } from '../stores/mentorStore.js';
import { DEMO_MENTOR_UUID } from '../stores/authStore.js';
import MentorSidebar from '../components/mentor/MentorSidebar.vue';
import MentorDashboard from '../views/mentor/MentorDashboard.vue';
import CourseListView from '../views/mentor/courses/CourseListView.vue';
import CreateCourseView from '../views/mentor/courses/CreateCourseView.vue';
import CourseMaterialsView from '../views/mentor/courses/CourseMaterialsView.vue';
import CurriculumDesigner from '../views/mentor/curriculum/CurriculumDesigner.vue';
import ClassesView from '../views/mentor/teaching/ClassesView.vue';
import StudentProgressView from '../views/mentor/teaching/StudentProgressView.vue';
import StarChartsView from '../views/mentor/teaching/StarChartsView.vue';
import UnenrollmentRequestsView from '../views/mentor/teaching/UnenrollmentRequestsView.vue';
import MentorProfileView from '../views/mentor/account/MentorProfileView.vue';
import StudentDetailModal from '../components/mentor/StudentDetailModal.vue';
import StarActionModal from '../components/mentor/StarActionModal.vue';

const props = defineProps({
  currentMentor: {
    type: Object,
    default: () => ({}),
  },
  userRole: {
    type: String,
    default: 'teacher',
  },
  initialView: {
    type: String,
    default: 'dashboard',
  },
});

const emit = defineEmits(['switch-to-student', 'logout', 'notify']);

const mentorStore = useMentorStore();
const currentView = ref(props.initialView || 'dashboard');

// ── Lesson editor ⇄ sidebar interplay ──────────────────────────────────────
// The full-screen lesson editor used to cover the whole application. It now
// docks into the main column so the one real MentorSidebar stays visible and
// usable. These two flags let the layout reserve the right amount of space.
const isLessonEditorOpen = ref(false);
const isSidebarCollapsed = ref(
  localStorage.getItem('risse_mentor_sidebar_collapsed') === 'true'
);

function onSidebarCollapseChange(collapsed) {
  isSidebarCollapsed.value = Boolean(collapsed);
}
// How Module Studio was entered: 'intake' = upload-first screen (new modules), 'edit' = open the selected module directly.
const studioEntry = ref('intake');

// Notifications state
const isNotificationsOpen = ref(false);
const notificationsDropdownRef = ref(null);
const unreadCount = computed(() => mentorStore.unreadNotificationsCount);
const notifications = computed(() => mentorStore.mentorNotifications);

function toggleNotifications() {
  isNotificationsOpen.value = !isNotificationsOpen.value;
}

function handleOutsideClick(e) {
  if (notificationsDropdownRef.value && !notificationsDropdownRef.value.contains(e.target)) {
    isNotificationsOpen.value = false;
  }
}

async function handleNotificationClick(notif) {
  if (!notif.is_read) {
    await mentorStore.markNotificationRead(notif.id);
  }
  if (notif.type === 'unenrollment_request') {
    isNotificationsOpen.value = false;
    currentView.value = 'unenrollment-requests';
  }
}

function formatNotifTime(isoStr) {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (_) {
    return isoStr;
  }
}

const mentorId = computed(() => {
  return props.currentMentor?.id || DEMO_MENTOR_UUID;
});

const viewTitle = computed(() => {
  switch (currentView.value) {
    case 'dashboard': return 'Mentor Dashboard';
    case 'courses': return 'My Courses';
    case 'create-course': return 'Create Course';
    case 'materials': return 'Course Materials';
    case 'curriculum-designer': return 'Course Studio';
    case 'classes': return 'My Classes';
    case 'students': return 'Student Progress';
    case 'star-charts': return 'Star Charts';
    case 'unenrollment-requests': return 'Course Unenrollment Requests';
    case 'profile': return 'Profile / Settings';
    default: return 'Teacher Studio';
  }
});

function handleWindowKeydown(e) {
  if (e.key === 'Escape') {
    mentorStore.resetModals();
  }
}

onMounted(async () => {
  mentorStore.resetModals();
  window.addEventListener('keydown', handleWindowKeydown);
  window.addEventListener('click', handleOutsideClick);
  if (mentorId.value) {
    await mentorStore.loadDashboard(mentorId.value);
    await mentorStore.loadCourses(mentorId.value);
    await mentorStore.loadFoundationModules();
    if (mentorStore.activeCourseId) {
      await mentorStore.loadMaterials(mentorStore.activeCourseId);
      await mentorStore.loadProposals(mentorStore.activeCourseId);
    }
  }
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleWindowKeydown);
  window.removeEventListener('click', handleOutsideClick);
});

// Watch view transitions to guarantee no orphan modals persist
watch(currentView, () => {
  mentorStore.resetModals();
});

// Watch mentor changes
watch(
  mentorId,
  async newId => {
    if (newId) {
      mentorStore.resetModals();
      await mentorStore.loadDashboard(newId);
      await mentorStore.loadCourses(newId);
      await mentorStore.loadFoundationModules();
    }
  }
);

function handleViewChange(viewName) {
  mentorStore.resetModals();
  if (viewName === 'curriculum-designer') studioEntry.value = 'intake';
  currentView.value = viewName;
  if (viewName === 'curriculum-designer' || viewName === 'materials') {
    if (!mentorStore.activeCourseId && mentorStore.courses.length > 0) {
      mentorStore.activeCourseId = mentorStore.courses[0].id;
    }
    if (mentorStore.activeCourseId) {
      mentorStore.loadMaterials(mentorStore.activeCourseId);
      mentorStore.loadProposals(mentorStore.activeCourseId);
    }
  }
}

async function handleReloadDashboard() {
  await mentorStore.loadDashboard(mentorId.value);
}

function handleSelectMaterialsForCourse(course) {
  mentorStore.activeCourseId = course.id;
  mentorStore.loadMaterials(course.id);
  currentView.value = 'materials';
}

function handleSelectCurriculumForCourse(course) {
  studioEntry.value = 'edit'; // open this module's existing content; never the upload/generate screen
  mentorStore.activeCourseId = course.id;
  mentorStore.loadMaterials(course.id);
  mentorStore.loadProposals(course.id);
  currentView.value = 'curriculum-designer';
}

async function handleCourseSelect(courseId) {
  mentorStore.activeCourseId = courseId;
  await mentorStore.loadMaterials(courseId);
  await mentorStore.loadProposals(courseId);
}

async function handleCourseCreated(newCourse) {
  emit('notify', `Module "${newCourse?.title || 'New Module'}" created successfully. Welcome to Module Studio!`);
  await mentorStore.loadCourses(mentorId.value);
  if (newCourse && newCourse.id) {
    mentorStore.activeCourseId = newCourse.id;
    await mentorStore.loadMaterials(newCourse.id);
    await mentorStore.loadProposals(newCourse.id);
  }
  studioEntry.value = 'edit';
  currentView.value = 'curriculum-designer';
}

async function handleStudentUnenrolled() {
  await mentorStore.fetchAssignedStudents(mentorId.value);
  await mentorStore.loadSections(mentorId.value);
}

async function handleCourseUnlinked() {
  await mentorStore.loadCourses(mentorId.value);
  await mentorStore.loadSections(mentorId.value);
}

async function handleDeleteCourse(courseId) {
  const courseToDelete = mentorStore.courses.find(c => c.id === courseId);
  const courseTitle = courseToDelete?.title || 'this course';
  if (typeof window !== 'undefined' && window.confirm) {
    if (!window.confirm(`Are you sure you want to delete "${courseTitle}"? This cannot be undone.`)) {
      return;
    }
  }
  const ok = await mentorStore.deleteCourse(courseId, mentorId.value);
  if (ok) {
    emit('notify', `Course "${courseTitle}" removed.`);
  } else {
    emit('notify', `Failed to delete course "${courseTitle}".`);
  }
}

async function handleUploadMaterial(payload) {
  const res = await mentorStore.uploadCourseMaterial(payload);
  if (res.success) {
    emit('notify', `Uploaded ${res.material?.title || 'document'}.`);
  } else {
    emit('notify', res.error || 'Failed to upload material.');
  }
}

async function handleDeleteMaterial(materialId) {
  const ok = await mentorStore.deleteMaterial(materialId);
  if (ok) {
    emit('notify', 'Material removed.');
  }
}

async function handleGenerateProposal(payload) {
  const targetCourseId = payload?.courseId 
    || mentorStore.activeCourseId 
    || mentorStore.activeCourse?.id 
    || (mentorStore.courses[0]?.id);
  const targetMentorId = payload?.mentorId 
    || mentorId.value 
    || mentorStore.currentMentorId 
    || props.currentMentor?.id 
    || DEMO_MENTOR_UUID;

  if (!targetCourseId) {
    emit('notify', 'Please create or select a course before generating curriculum.');
    return;
  }

  const generateFn = mentorStore.generateCurriculumProposal || mentorStore.generateProposalDraft;
  if (typeof generateFn !== 'function') {
    emit('notify', 'Curriculum proposal generation is temporarily unavailable.');
    return;
  }
  const options = payload?.mode ? { mode: payload.mode } : undefined;
  const res = await generateFn(targetCourseId, targetMentorId, options);
  if (res && res.success) {
    emit('notify', 'AI Curriculum Proposal generated. Ready for teacher review.');
  } else {
    emit('notify', res?.error || res?.message || 'Failed to generate curriculum proposal.');
  }
}

async function handleSaveProposal({ proposalId, proposalData }) {
  const ok = await mentorStore.saveProposalEdits(proposalId, proposalData);
  if (ok) {
    emit('notify', 'Curriculum revisions saved.');
  }
}

async function handleApproveProposal(payload) {
  const proposalId = payload?.proposalId;
  const targetMentorId = payload?.mentorId || mentorId.value;
  const proposalData = payload?.proposalData;
  const ok = await mentorStore.approveProposal(proposalId, targetMentorId, proposalData);
  if (ok) {
    emit('notify', 'Curriculum proposal approved! Ready for publication.');
  } else {
    emit('notify', 'Failed to approve proposal. Please verify modules and checkpoints.');
  }
}

async function handleUpdateCourse({ courseId, updates, sectionIds }) {
  const res = await mentorStore.updateCourse(courseId, updates, sectionIds);
  if (res.success) {
    emit('notify', 'Course details updated successfully.');
  } else {
    emit('notify', res.error || 'Failed to update course.');
  }
}

async function handlePublishProposal(payload) {
  const proposalId = payload?.proposalId;
  const targetMentorId = payload?.mentorId || mentorId.value;
  const proposalData = payload?.proposalData;
  const ok = await mentorStore.publishProposal(proposalId, targetMentorId, proposalData);
  if (ok) {
    emit('notify', 'Curriculum published! Now active for enrolled students.');
  }
}

function handleCloseStudentDetail() {
  mentorStore.closeStudentDetail();
  mentorStore.resetModals();
}

function handleCloseStarModal() {
  mentorStore.closeStarModal();
  mentorStore.resetModals();
}

function handleOpenStudentDetail(student) {
  if (!student || student instanceof Event) return;
  mentorStore.openStudentDetail(student);
}

async function handleSelectStudentForStarChart(student) {
  if (student && (student.student_id || student.id)) {
    await mentorStore.loadStudentStarChart(student.student_id || student.id);
  }
}

function handleOpenStarModal(student, action, star) {
  if (!student || student instanceof Event) return;
  mentorStore.openStarModal(student, action, star);
}

function handleAwardStarFromDetail(student) {
  if (!student || student instanceof Event) return;
  mentorStore.closeStudentDetail();
  mentorStore.openStarModal(student, 'awarded');
}

function handleRevokeStarFromDetail(studentOrPayload, maybeStar) {
  if (!studentOrPayload || studentOrPayload instanceof Event) return;
  mentorStore.closeStudentDetail();

  if (studentOrPayload && maybeStar) {
    mentorStore.openStarModal(studentOrPayload, 'revoked', maybeStar);
  } else if (studentOrPayload?.student) {
    mentorStore.openStarModal(studentOrPayload.student, 'revoked', studentOrPayload.star);
  } else if (studentOrPayload?.student_id || studentOrPayload?.id) {
    mentorStore.openStarModal(studentOrPayload, 'revoked');
  }
}

async function handleStarSubmit(payload = null) {
  if (payload && payload.note) {
    mentorStore.starForm.note = payload.note;
  }
  if (payload && payload.starId) {
    mentorStore.starForm.starId = payload.starId;
  }
  const noteToSend = payload?.note || mentorStore.starForm?.note || 'Laboratory criteria review and milestone verification.';
  try {
    const res = await mentorStore.submitStarAction(
      mentorId.value,
      props.currentMentor?.name || 'Assigned Instructor',
      noteToSend
    );
    if (res.success) {
      emit('notify', 'Star Chart updated with audit entry.');
    } else {
      emit('notify', res.message || 'Failed to update star chart.');
    }
  } finally {
    mentorStore.closeStarModal();
    mentorStore.resetModals();
  }
}
</script>

<style scoped>
.mentor-workspace-layout {
  /* Inherits exact .risse-layout styles from app.css:
     Radial warm gradient, 100vh, flex row with 28px gap */
}

.mentor-main-container {
  /* Inherits .risse-main from app.css. The sidebar animates its own width, so
     this transition only smooths the main column catching up. */
  transition: width 0.28s cubic-bezier(0.2, 0, 0, 1);
}

/* Collapsed sidebar = more room for the workspace; give the editor back the
   padding the expanded sidebar used to justify. */
.mentor-main-container.is-lesson-editor-open.is-sidebar-collapsed {
  padding-left: 0;
}

/*
 * Student module experience (teacher preview).
 *
 * While the module is open the container becomes the module's own surface: no
 * Studio header, no breadcrumb chrome, and the Studio scroller is neutralised so
 * it cannot impose its `max-width: 1400px` on the lesson. The result is the same
 * column a student's `.risse-main` gives the module — the preview is not a
 * narrower or differently-padded version of the student screen.
 */
.mentor-main-container.is-lesson-editor-open {
  z-index: 30;
  padding: 0;
  /* Height is inherited: the layout root already reserves vertical padding, so
     forcing 100vh here would overflow it. */
  height: calc(100vh - 36px);
  min-height: 0;
}

/* The module owns the scroll region; the Studio's scroller must not fight it.
 * `position: relative` is what lets the preview host (position:absolute;
 * inset:0) resolve against THIS scroller instead of escaping up to
 * .risse-main — without it the host fills the whole main column and the
 * Studio content keeps rendering on top, so Preview appears to do nothing. */
.mentor-main-container.is-lesson-editor-open .workspace-view-scroll {
  position: relative;
  overflow: hidden;
  max-width: none;
  padding-right: 0;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

/* The Studio header is not part of the student experience. */
.mentor-main-container.is-lesson-editor-open .mentor-workspace-header {
  display: none;
}

.mentor-workspace-header {
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px 10px 2px;
  flex-shrink: 0;
  z-index: 10;
  border-bottom: 1px solid var(--border-card, #eef1f4);
  margin-bottom: 14px;
}

.header-breadcrumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.crumb-root {
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--text-muted, #64748b);
  font-size: 10.5px;
}

.crumb-separator {
  color: #cbd5e1;
  font-size: 11px;
}

.crumb-active {
  font-family: var(--font-family-display, 'Momo Trust Display', sans-serif);
  font-weight: 700;
  font-size: 16px;
  color: var(--text-heading, #111827);
  letter-spacing: -0.01em;
}

.header-actions-cluster {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-header-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #ffffff;
  border: 1px solid #d1d5db;
  color: #374151;
  padding: 6px 14px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.btn-header-pill:hover {
  background: #fff7ed;
  border-color: var(--primary-orange, #F18701);
  color: var(--primary-orange, #F18701);
}

.btn-header-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--primary-orange, #F18701);
  color: #ffffff;
  border: none;
  padding: 6px 16px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 2px 6px rgba(241, 135, 1, 0.2);
}

.btn-header-primary:hover {
  background: var(--primary-orange-hover, #ff8c1a);
}

/* Notifications Dropdown */
.notifications-wrapper {
  position: relative;
}

.btn-header-icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #ffffff;
  border: 1px solid #d1d5db;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-header-icon:hover {
  border-color: #f18701;
  color: #f18701;
  background: #fff7ed;
}

.notif-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ef4444;
  color: #ffffff;
  font-size: 10px;
  font-weight: 800;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #ffffff;
}

.notifications-popover {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 320px;
  max-height: 400px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12);
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  z-index: 100;
  overflow: hidden;
}

.notif-popover-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  background: #f8fafc;
}

.notif-popover-title {
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
}

.notif-unread-tag {
  font-size: 10.5px;
  font-weight: 700;
  background: #fee2e2;
  color: #ef4444;
  padding: 1px 7px;
  border-radius: 999px;
}

.notif-empty-state {
  padding: 30px 16px;
  text-align: center;
  font-size: 12.5px;
  color: #94a3b8;
}

.notif-list {
  overflow-y: auto;
  max-height: 320px;
}

.notif-item {
  display: flex;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: background 0.15s ease;
  position: relative;
}

.notif-item:hover {
  background: #f8fafc;
}

.notif-item.is-unread {
  background: #fffbf5;
}

.notif-icon-col {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  flex-shrink: 0;
}

.notif-content-col {
  flex: 1;
  min-width: 0;
}

.notif-title {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 2px;
}

.notif-msg {
  font-size: 11.5px;
  color: #475569;
  margin: 0 0 4px 0;
  line-height: 1.35;
}

.notif-time {
  font-size: 10.5px;
  color: #94a3b8;
}

.notif-unread-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #f18701;
  position: absolute;
  top: 14px;
  right: 12px;
}

.workspace-view-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
  max-width: 1400px;
  width: 100%;
}
</style>