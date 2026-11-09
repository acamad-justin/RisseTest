// frontend/resources/js/stores/mentorStore.js
/**
 * RISSE AI — Mentor Workspace & Teacher Studio State Store (Vue 3 Composition API).
 *
 * Manages reactive state for:
 * - Active Mentor Workspace Views (Dashboard, Courses, Materials, Curriculum Designer, Classes, Students, Stars, Profile)
 * - Real Database Dashboard Metrics & Rosters (zero fake fallback students)
 * - Course Management (courses, course_sections, create/update/delete)
 * - Course Learning Materials (Supabase Storage upload, preview, download, delete)
 * - Curriculum Transformation Workflow (draft proposal generation, review, edit, publish)
 * - Star Chart Governance (award, revoke, append-only immutable audit trail)
 */

import { ref, computed, reactive } from 'vue';
import { MentorService } from '../../../lib/mentor/mentorService.ts';
import { DEMO_MENTOR_UUID } from './authStore.js';

// ── Navigation & Workspace State ────────────────────────────────────────────
// Views: 'dashboard' | 'courses' | 'create-course' | 'materials' | 'curriculum-designer' | 'classes' | 'students' | 'star-charts' | 'profile'
const activeView = ref('dashboard');

// ── Authenticated Mentor Identity ──────────────────────────────────────────
const currentMentorId = ref(null);
const activeMentorProfile = ref(null);

// ── Reactive Data Collections ───────────────────────────────────────────────
const courses = ref([]);
const activeCourseId = ref(null);

const sections = ref([]);
const activeSectionFilter = ref('all');

const students = ref([]);
const courseMaterials = ref([]);
const curriculumProposals = ref([]);
const activeProposal = ref(null);
const foundationModules = ref([]);

const dashboardMetrics = ref({
  total_enrolled_students: 0,
  total_courses: 0,
  total_sections: 0,
  average_progress: 0,
  recently_active_students: [],
  students_needing_attention: [],
  recent_course_activity: [],
});

// Loading & Error States
const isLoadingDashboard = ref(false);
const dashboardError = ref(null);

const isLoadingCourses = ref(false);
const coursesError = ref(null);

const isLoadingMaterials = ref(false);
const materialsError = ref(null);

const isGeneratingProposal = ref(false);
const proposalError = ref(null);

// Student Detail Drawer / Modal
const selectedStudent = ref(null);
const isDetailOpen = ref(false);
const studentStarChart = ref({ awards: [], auditEvents: [] });
const isLoadingStarChart = ref(false);

// Material Upload Modal / State
const isUploadModalOpen = ref(false);
const isUploading = ref(false);
const uploadError = ref(null);

// Star Award / Revoke Modal State
const isStarModalOpen = ref(false);
const starTargetStudent = ref(null);
const starActionType = ref('awarded');
const starForm = reactive({
  starId: 'motion-builder',
  title: 'Motion Builder',
  category: 'Robotics & Control Systems',
  moduleId: 101,
  note: '',
});

// ── Course Unenrollment Requests & Notifications State ───────────────────────
const pendingUnenrollmentRequests = ref([]);
const unenrollmentHistory = ref([]);
const isLoadingUnenrollment = ref(false);
const unenrollmentError = ref(null);
const mentorNotifications = ref([]);
const isLoadingNotifications = ref(false);

const pendingUnenrollmentCount = computed(() => pendingUnenrollmentRequests.value.length);
const unreadNotificationsCount = computed(() => mentorNotifications.value.filter(n => !n.is_read).length);

// Available Star Catalog for Manual Awarding (Synchronized with curriculum_modules badges)
const AVAILABLE_STARS = [
  { id: 'sensor-scout', title: 'Sensor Scout', category: 'Sensors & Perception', defaultModule: 101, description: 'Mastered noise filtering, ADC thresholds, and voltage dividers.' },
  { id: 'behavior-programmer', title: 'Behavior Programmer', category: 'Programming Robot Behavior', defaultModule: 102, description: 'Designed elegant finite state machines and non-blocking control loops.' },
  { id: 'motion-builder', title: 'Motion Builder', category: 'Robotics Fundamentals', defaultModule: 103, description: 'Exhibited impeccable wiring, thermal isolation, and H-bridge safety.' },
  { id: 'sumo-champion', title: 'Sumo Champion', category: 'Sumobot Competition', defaultModule: 104, description: 'Executed rapid mechanical and firmware troubleshooting under competition pressure.' },
  { id: 'system-architect', title: 'System Architect', category: 'Embedded Microcontrollers', defaultModule: 105, description: 'Mastered timer registers, hardware interrupts, and high-frequency PWM.' },
  { id: 'feedback-master', title: 'Feedback Master', category: 'Robotics & Control Systems', defaultModule: 106, description: 'Demonstrated consistent PID and closed-loop motion tuning in laboratory practice.' },
  // Backward-compatible aliases
  { id: 'signal-navigator', title: 'Signal Navigator', category: 'Sensors & Perception', defaultModule: 101, description: 'Mastered noise filtering, ADC thresholds, and voltage dividers.' },
  { id: 'logic-architect', title: 'Logic Architect', category: 'Programming Robot Behavior', defaultModule: 102, description: 'Designed elegant finite state machines and non-blocking control loops.' },
  { id: 'hardware-artisan', title: 'Hardware Artisan', category: 'Robotics Fundamentals', defaultModule: 103, description: 'Exhibited impeccable wiring, thermal isolation, and H-bridge safety.' },
  { id: 'pit-triage-champion', title: 'Pit Triage Champion', category: 'Sumobot Competition', defaultModule: 104, description: 'Executed rapid mechanical and firmware troubleshooting under competition pressure.' },
  { id: 'firmware-pioneer', title: 'Firmware Pioneer', category: 'Embedded Microcontrollers', defaultModule: 105, description: 'Mastered timer registers, hardware interrupts, and high-frequency PWM.' },
];

// ── Computed Getters ────────────────────────────────────────────────────────

const activeCourse = computed(() => {
  if (!activeCourseId.value) return courses.value[0] || null;
  return courses.value.find(c => c.id === activeCourseId.value) || courses.value[0] || null;
});

const filteredStudents = computed(() => {
  let list = students.value;
  if (activeSectionFilter.value && activeSectionFilter.value !== 'all') {
    list = list.filter(s => s.section_id === activeSectionFilter.value);
  }
  return list;
});

const activeSection = computed(() => {
  if (activeSectionFilter.value === 'all') return null;
  return sections.value.find(s => s.id === activeSectionFilter.value) || null;
});

// ── Actions ─────────────────────────────────────────────────────────────────

/**
 * Initialize / Reload Mentor Dashboard with real database records
 */
async function loadDashboard(mentorId) {
  if (!mentorId) return;
  currentMentorId.value = mentorId;
  activeMentorProfile.value = { id: mentorId };
  resetModals();
  isLoadingDashboard.value = true;
  dashboardError.value = null;

  try {
    const [metricsResult, fetchedSections, fetchedCourses, fetchedStudents, pendingReqs, notifs] = await Promise.all([
      MentorService.getDashboardMetrics(mentorId),
      MentorService.getAssignedSections(mentorId),
      MentorService.getCourses(mentorId),
      MentorService.getAssignedStudents(mentorId),
      MentorService.getPendingUnenrollmentRequests(mentorId),
      MentorService.getMentorNotifications(mentorId),
    ]);

    if (metricsResult.error) {
      dashboardError.value = metricsResult.error;
    } else if (metricsResult.data) {
      dashboardMetrics.value = metricsResult.data;
    }

    sections.value = fetchedSections;
    courses.value = fetchedCourses;
    students.value = fetchedStudents;
    pendingUnenrollmentRequests.value = pendingReqs || [];
    mentorNotifications.value = notifs || [];

    if (!activeCourseId.value && fetchedCourses.length > 0) {
      activeCourseId.value = fetchedCourses[0].id;
    }
    await loadFoundationModules();
  } catch (err) {
    console.error('[MentorStore] Error loading dashboard:', err);
    dashboardError.value = err.message || 'Failed to connect to database. Please check your network and retry.';
  } finally {
    isLoadingDashboard.value = false;
  }
}

/**
 * Load courses owned by mentor
 */
async function loadCourses(mentorId) {
  if (!mentorId) return;
  currentMentorId.value = mentorId;
  if (!activeMentorProfile.value) {
    activeMentorProfile.value = { id: mentorId };
  }
  isLoadingCourses.value = true;
  coursesError.value = null;

  try {
    const list = await MentorService.getCourses(mentorId);
    courses.value = list;
    if (!activeCourseId.value && list.length > 0) {
      activeCourseId.value = list[0].id;
    }
    await loadFoundationModules();
  } catch (err) {
    coursesError.value = err.message || 'Failed to load courses.';
  } finally {
    isLoadingCourses.value = false;
  }
}

/**
 * Create a new section/class cohort
 */
async function createSection(sectionData) {
  const res = await MentorService.createSection(sectionData);
  if (res.success && res.section) {
    sections.value.unshift(res.section);
    dashboardMetrics.value.total_sections = sections.value.length;
    return { success: true, section: res.section };
  }
  return { success: false, error: res.error || 'Failed to create section.' };
}

/**
 * Update an existing section/class cohort
 */
async function updateSection(sectionId, sectionData) {
  const mentorId = sectionData?.mentorId 
    || currentMentorId.value 
    || (typeof activeMentorProfile !== 'undefined' && activeMentorProfile?.value ? activeMentorProfile.value.id : null) 
    || DEMO_MENTOR_UUID;
  const res = await MentorService.updateSection(sectionId, {
    ...sectionData,
    mentorId,
  });
  if (res.success && res.section) {
    const idx = sections.value.findIndex(s => s.id === sectionId);
    if (idx >= 0) {
      sections.value[idx] = { ...sections.value[idx], ...res.section };
    }
    return { success: true, section: res.section };
  }
  return { success: false, error: res.error || 'Failed to update section.' };
}

/**
 * Delete a section/class cohort
 */
async function deleteSection(sectionId, mentorId) {
  const targetMentorId = mentorId 
    || currentMentorId.value 
    || (typeof activeMentorProfile !== 'undefined' && activeMentorProfile?.value ? activeMentorProfile.value.id : null) 
    || DEMO_MENTOR_UUID;
  const res = await MentorService.deleteSection(sectionId, targetMentorId);
  if (res.success) {
    sections.value = sections.value.filter(s => s.id !== sectionId);
    students.value = students.value.filter(st => st.section_id !== sectionId);
    dashboardMetrics.value.total_sections = sections.value.length;
    dashboardMetrics.value.total_enrolled_students = students.value.length;
    return { success: true };
  }
  return { success: false, error: res.error || 'Failed to delete section.' };
}

/**
 * Enroll a student learner into a section
 */
async function enrollStudent(sectionId, studentPayload) {
  const res = await MentorService.enrollStudentInSection(sectionId, studentPayload);
  if (res.success && res.student) {
    students.value.push(res.student);
    const sec = sections.value.find(s => s.id === sectionId);
    if (sec) {
      sec.student_count = (sec.student_count || 0) + 1;
    }
    dashboardMetrics.value.total_enrolled_students = students.value.length;
    return { success: true, student: res.student };
  }
  return { success: false, error: res.error || 'Failed to enroll student.' };
}

/**
 * Create a new course
 */
async function createCourse(courseData) {
  const res = await MentorService.createCourse(courseData);
  if (res.success && res.course) {
    courses.value.unshift(res.course);
    activeCourseId.value = res.course.id;
    dashboardMetrics.value.total_courses = courses.value.length;
    return { success: true, course: res.course };
  }
  return { success: false, error: res.error || 'Failed to create course.' };
}

/**
 * Delete a course
 */
async function deleteCourse(courseId, mentorId) {
  const targetMentorId = mentorId 
    || currentMentorId.value 
    || (typeof activeMentorProfile !== 'undefined' && activeMentorProfile?.value ? activeMentorProfile.value.id : null) 
    || DEMO_MENTOR_UUID;
  const ok = await MentorService.deleteCourse(courseId, targetMentorId);
  if (ok) {
    courses.value = courses.value.filter(c => c.id !== courseId);
    if (activeCourseId.value === courseId) {
      activeCourseId.value = courses.value[0]?.id || null;
    }
    dashboardMetrics.value.total_courses = courses.value.length;
  }
  return ok;
}

/**
 * Load materials for the currently active course
 */
async function loadMaterials(courseId) {
  if (!courseId) return;
  isLoadingMaterials.value = true;
  materialsError.value = null;

  try {
    const list = await MentorService.getCourseMaterials(courseId);
    // Published child modules reference the materials of the course their proposal came from (read-only here).
    const course = courses.value.find(c => c.id === courseId);
    let inherited = [];
    if (course?.source_proposal_id) {
      const refs = await MentorService.getInheritedCourseMaterials(course.source_proposal_id);
      inherited = refs.filter(m => !list.some(o => o.id === m.id)).map(m => ({ ...m, inherited: true }));
    }
    courseMaterials.value = [...list, ...inherited];
  } catch (err) {
    materialsError.value = err.message || 'Failed to load course materials.';
  } finally {
    isLoadingMaterials.value = false;
  }
}

/**
 * Upload material to active course
 */
async function uploadMaterial({
  courseId,
  title,
  description,
  file,
  uploaderId,
} = {}) {
  const targetCourseId = courseId || activeCourseId.value;
  const targetUploaderId = uploaderId 
    || currentMentorId.value 
    || (typeof activeMentorProfile !== 'undefined' && activeMentorProfile?.value ? activeMentorProfile.value.id : null) 
    || DEMO_MENTOR_UUID;

  if (!targetCourseId) {
    uploadError.value = 'A target course must be selected before uploading materials.';
    return { success: false, error: uploadError.value };
  }

  isUploading.value = true;
  uploadError.value = null;

  try {
    const res = await MentorService.uploadCourseMaterial({
      courseId: targetCourseId,
      title,
      description,
      file,
      uploaderId: targetUploaderId,
    });

    if (res.success && res.material) {
      courseMaterials.value.unshift(res.material);
      isUploadModalOpen.value = false;

      // Update material count on the course record
      const c = courses.value.find(c => c.id === targetCourseId);
      if (c) c.materials_count = (c.materials_count || 0) + 1;

      return { success: true, material: res.material };
    }
    uploadError.value = res.error || 'Upload failed.';
    return { success: false, error: uploadError.value };
  } catch (err) {
    uploadError.value = err.message || 'Upload error.';
    return { success: false, error: uploadError.value };
  } finally {
    isUploading.value = false;
  }
}

// Alias for backwards and layout compatibility
const uploadCourseMaterial = uploadMaterial;

async function getMaterialDownloadUrl(material) {
  return await MentorService.getMaterialDownloadUrl(material);
}

/**
 * Retry content extraction for a failed course material
 */
async function retryProcessMaterial(materialId, uploaderId) {
  const targetUploaderId = uploaderId 
    || currentMentorId.value 
    || (typeof activeMentorProfile !== 'undefined' && activeMentorProfile?.value ? activeMentorProfile.value.id : null) 
    || DEMO_MENTOR_UUID;
  const res = await MentorService.retryProcessMaterial(materialId, targetUploaderId);
  if (res.success && res.material) {
    const idx = courseMaterials.value.findIndex(m => m.id === materialId);
    if (idx >= 0) {
      courseMaterials.value[idx] = { ...courseMaterials.value[idx], ...res.material };
    }
    return { success: true, material: res.material };
  }
  return { success: false, error: res.error || 'Retry failed.' };
}

/**
 * Delete material from active course
 */
async function deleteMaterial(materialId, uploaderId) {
  // Shared source materials belong to the parent course; never delete them from a child module.
  const target = courseMaterials.value.find(m => m.id === materialId);
  if (target && (target.inherited || (activeCourseId.value && target.course_id !== activeCourseId.value))) return false;
  const targetUploaderId = uploaderId 
    || currentMentorId.value 
    || (typeof activeMentorProfile !== 'undefined' && activeMentorProfile?.value ? activeMentorProfile.value.id : null) 
    || DEMO_MENTOR_UUID;
  const ok = await MentorService.deleteCourseMaterial(materialId, targetUploaderId);
  if (ok) {
    courseMaterials.value = courseMaterials.value.filter(m => m.id !== materialId);
    if (activeCourse.value && activeCourse.value.materials_count) {
      activeCourse.value.materials_count -= 1;
    }
  }
  return ok;
}

/**
 * Load curriculum proposals for active course
 */
async function loadProposals(courseId) {
  if (!courseId) return;
  try {
    const list = await MentorService.getCurriculumProposals(courseId);
    curriculumProposals.value = list;
    if (list.length > 0) {
      activeProposal.value = list[0];
    } else {
      activeProposal.value = null;
    }
  } catch (_) {}
}

/**
 * Placeholder loader kept for backward compatibility (curriculum modules are not used)
 */
async function loadFoundationModules() {
  foundationModules.value = [];
  return [];
}

/**
 * Generate AI-assisted curriculum proposal draft from uploaded materials
 */
async function generateProposalDraft(courseId, mentorId, options) {
  const targetCourseId = courseId || activeCourseId.value || activeCourse.value?.id || (courses.value[0]?.id);
  const targetMentorId = mentorId 
    || currentMentorId.value 
    || (typeof activeMentorProfile !== 'undefined' && activeMentorProfile?.value ? activeMentorProfile.value.id : null) 
    || DEMO_MENTOR_UUID;

  if (!targetCourseId) {
    proposalError.value = 'Please select or create a course before generating curriculum.';
    return { success: false, error: proposalError.value };
  }

  isGeneratingProposal.value = true;
  proposalError.value = null;

  try {
    const res = await MentorService.generateDraftCurriculumProposal(targetCourseId, targetMentorId, options);
    if (res.success && (res.proposal || res.draft)) {
      const prop = res.proposal || {
        id: res.draft?.id || targetCourseId,
        course_id: targetCourseId,
        proposal_data: {
          title: res.draft?.title,
          summary: res.draft?.description,
          description: res.draft?.description,
          learning_nodes: res.draft?.learning_nodes,
          topic_groups: res.draft?.topic_groups,
          source_coverage: res.draft?.source_coverage,
          modules: [
            {
              id: `mod-${targetCourseId}-1`,
              module_number: 1,
              title: res.draft?.title,
              checkpoints: res.draft?.learning_nodes,
            }
          ],
        },
        status: 'draft',
      };
      curriculumProposals.value.unshift(prop);
      activeProposal.value = prop;
      if (!activeCourseId.value) {
        activeCourseId.value = targetCourseId;
      }
      return { success: true, proposal: prop, draft: res.draft };
    }
    proposalError.value = res.error || 'Failed to generate proposal.';
    return { success: false, error: proposalError.value };
  } catch (err) {
    proposalError.value = err.message || 'Failed to generate proposal.';
    return { success: false, error: proposalError.value };
  } finally {
    isGeneratingProposal.value = false;
  }
}

// Layout and caller compatibility alias
const generateCurriculumProposal = generateProposalDraft;

/**
 * Save edits to active proposal
 */
async function saveProposalEdits(proposalId, proposalData) {
  const ok = await MentorService.updateCurriculumProposal(proposalId, proposalData);
  if (ok && activeProposal.value && activeProposal.value.id === proposalId) {
    activeProposal.value.proposal_data = proposalData;
    if (activeProposal.value.status !== 'published') activeProposal.value.status = 'under_review';
  }
  return ok;
}

/**
 * Approve curriculum proposal (sets status = 'approved')
 */
async function approveProposal(proposalId, mentorId, proposalData) {
  const isOk = await MentorService.approveCurriculumProposal(proposalId, mentorId, proposalData);
  if (isOk) {
    if (activeProposal.value && activeProposal.value.id === proposalId) {
      activeProposal.value.status = 'approved';
      if (proposalData) {
        activeProposal.value.proposal_data = proposalData;
      }
    }
  }
  return isOk;
}

/**
 * Approve and publish curriculum proposal
 */
async function publishProposal(proposalId, mentorId, proposalData) {
  const res = await MentorService.publishCurriculumProposal(proposalId, mentorId, proposalData);
  const isOk = typeof res === 'boolean' ? res : Boolean(res && res.success);
  if (isOk) {
    if (activeProposal.value && activeProposal.value.id === proposalId) {
      activeProposal.value.status = 'published';
      if (proposalData) {
        activeProposal.value.proposal_data = proposalData;
      }
    }
    if (activeCourse.value) {
      activeCourse.value.status = 'published';
    }
    const target = courses.value.find(c => c.id === activeCourseId.value);
    if (target) {
      target.status = 'published';
    }
  }
  return isOk;
}

/**
 * Unpublish or revert curriculum proposal to draft
 */
async function unpublishProposal(proposalId, mentorId) {
  const isOk = await MentorService.unpublishCurriculumProposal(proposalId, mentorId);
  if (isOk) {
    if (activeProposal.value && activeProposal.value.id === proposalId) {
      activeProposal.value.status = 'approved';
    }
    if (activeCourse.value) {
      activeCourse.value.status = 'draft';
    }
    const target = courses.value.find(c => c.id === activeCourseId.value);
    if (target) {
      target.status = 'draft';
    }
  }
  return isOk;
}

/**
 * AI-Generated Node Educational Content
 */
async function generateNodeContent(params) {
  return await MentorService.generateNodeContent(params);
}

/**
 * Granular section-level regeneration without overwriting other teacher edits
 */
async function regenerateNodeSection(params) {
  return await MentorService.regenerateNodeSection(params);
}

/**
 * Update course details & section assignments
 */
async function updateCourse(courseId, updates, sectionIds) {
  const res = await MentorService.updateCourse(courseId, updates, sectionIds);
  if (res.success && res.course) {
    const idx = courses.value.findIndex(c => c.id === courseId);
    if (idx !== -1) {
      courses.value[idx] = res.course;
    }
    return { success: true, course: res.course };
  }
  return { success: false, error: res.error || 'Failed to update course.' };
}

/**
 * Open Student Detail Drawer & Load Live Star Chart
 */
async function openStudentDetail(student) {
  if (!student || typeof student !== 'object' || student instanceof Event) {
    console.warn('[MentorStore] openStudentDetail rejected: invalid student', student);
    return;
  }
  const studentId = student.student_id || student.id;
  if (!studentId) {
    console.warn('[MentorStore] openStudentDetail rejected: student has no id', student);
    return;
  }

  const normalizedStudent = {
    ...student,
    id: studentId,
    student_id: studentId,
    name: student.name || student.full_name || student.email?.split('@')[0] || 'Enrolled Student',
    section_code: student.section_code || student.section_name || 'Assigned Section',
  };

  selectedStudent.value = normalizedStudent;
  isStarModalOpen.value = false; // Strictly close star modal if open so modals never collide
  starTargetStudent.value = null;
  isUploadModalOpen.value = false;
  isDetailOpen.value = true;
  isLoadingStarChart.value = true;

  try {
    const chart = await MentorService.getStudentStarChart(normalizedStudent.student_id);
    studentStarChart.value = chart;
  } catch (err) {
    console.warn('[MentorStore] Error loading student star chart:', err);
    studentStarChart.value = { awards: [], auditEvents: [] };
  } finally {
    isLoadingStarChart.value = false;
  }
}

function closeStudentDetail() {
  isDetailOpen.value = false;
  selectedStudent.value = null;
}

/**
 * Load Star Chart for a specific student without opening any modal dialog
 */
async function loadStudentStarChart(studentId) {
  if (!studentId) return;
  isLoadingStarChart.value = true;
  try {
    const chart = await MentorService.getStudentStarChart(studentId);
    studentStarChart.value = chart;
  } catch (err) {
    console.warn('[MentorStore] Error loading student star chart:', err);
    studentStarChart.value = { awards: [], auditEvents: [] };
  } finally {
    isLoadingStarChart.value = false;
  }
}

/**
 * Hard reset for all modal and drawer states to guarantee clean workspace entry
 */
function resetModals() {
  isDetailOpen.value = false;
  selectedStudent.value = null;
  isStarModalOpen.value = false;
  starTargetStudent.value = null;
  isUploadModalOpen.value = false;
  starForm.note = '';
}

/**
 * Open Star Award / Revoke Modal
 */
function openStarModal(student, action = 'awarded', existingStar = null) {
  if (!student || typeof student !== 'object' || student instanceof Event) {
    console.warn('[MentorStore] openStarModal rejected: invalid student', student);
    return;
  }

  const studentId = student.student_id || student.id;
  if (!studentId) {
    console.warn('[MentorStore] openStarModal rejected: student has no id', student);
    return;
  }

  const normalizedStudent = {
    ...student,
    id: studentId,
    student_id: studentId,
    name: student.name || student.full_name || student.email?.split('@')[0] || 'Enrolled Student',
    section_code: student.section_code || student.section_name || 'Assigned Section',
  };

  starTargetStudent.value = normalizedStudent;
  isDetailOpen.value = false; // Strictly dismiss student detail modal so modals never collide
  selectedStudent.value = null;
  isUploadModalOpen.value = false;
  starActionType.value = action;
  if (existingStar) {
    starForm.starId = existingStar.star_id || existingStar.id || AVAILABLE_STARS[0].id;
    starForm.title = existingStar.title || AVAILABLE_STARS[0].title;
    starForm.category = existingStar.category || AVAILABLE_STARS[0].category;
    starForm.moduleId = existingStar.module_id || existingStar.defaultModule || 101;
  } else {
    const defaultStar = AVAILABLE_STARS[0];
    starForm.starId = defaultStar.id;
    starForm.title = defaultStar.title;
    starForm.category = defaultStar.category;
    starForm.moduleId = defaultStar.defaultModule;
  }
  starForm.note = '';
  isStarModalOpen.value = true;
}

function closeStarModal() {
  isStarModalOpen.value = false;
  starTargetStudent.value = null;
  starForm.note = '';
}

/**
 * Submit Star Award / Revoke Action
 */
async function submitStarAction(mentorId, mentorName, noteOverride = null) {
  if (noteOverride && typeof noteOverride === 'string') {
    starForm.note = noteOverride;
  }
  if (!starTargetStudent.value) return { success: false, message: 'No student selected' };

  const finalNote = (starForm.note || '').trim() || 'Laboratory criteria review and milestone verification.';

  const selectedCatalog = AVAILABLE_STARS.find(s => s.id === starForm.starId);
  const title = selectedCatalog?.title || starForm.title || 'Achievement Star';
  const category = selectedCatalog?.category || starForm.category || 'Robotics & Control Systems';

  try {
    const res = await MentorService.modifyStudentStar({
      studentId: starTargetStudent.value.student_id,
      starId: starForm.starId,
      title,
      category,
      moduleId: Number(starForm.moduleId),
      action: starActionType.value,
      note: finalNote,
      mentorId,
      mentorName,
    });

    if (res.success && starTargetStudent.value?.student_id) {
      try {
        const chart = await MentorService.getStudentStarChart(starTargetStudent.value.student_id);
        studentStarChart.value = chart;
      } catch (_) {}
    }
    return res;
  } finally {
    closeStarModal();
  }
}

/**
 * Fetch pending course unenrollment requests for mentor
 */
async function fetchPendingUnenrollmentRequests(mentorId) {
  const mId = mentorId || currentMentorId.value || DEMO_MENTOR_UUID;
  isLoadingUnenrollment.value = true;
  unenrollmentError.value = null;
  try {
    const list = await MentorService.getPendingUnenrollmentRequests(mId);
    pendingUnenrollmentRequests.value = list;
    return list;
  } catch (err) {
    unenrollmentError.value = err.message || 'Failed to fetch unenrollment requests.';
    return [];
  } finally {
    isLoadingUnenrollment.value = false;
  }
}

/**
 * Fetch historical unenrollment requests
 */
async function fetchUnenrollmentHistory(mentorId) {
  const mId = mentorId || currentMentorId.value || DEMO_MENTOR_UUID;
  try {
    const list = await MentorService.getUnenrollmentRequestsHistory(mId);
    unenrollmentHistory.value = list;
    return list;
  } catch (err) {
    console.warn('[MentorStore] fetchUnenrollmentHistory error:', err);
    return [];
  }
}

/**
 * Approve unenrollment request
 */
async function approveUnenrollmentRequest(requestId, mentorId) {
  const mId = mentorId || currentMentorId.value || DEMO_MENTOR_UUID;
  try {
    const res = await MentorService.approveUnenrollmentRequest(requestId, mId);
    if (res.success) {
      pendingUnenrollmentRequests.value = pendingUnenrollmentRequests.value.filter(r => r.id !== requestId);
      await fetchUnenrollmentHistory(mId);
      // Refresh students roster
      const updatedStudents = await MentorService.getAssignedStudents(mId);
      students.value = updatedStudents;
    }
    return res;
  } catch (err) {
    return { success: false, error: err.message || 'Failed to approve request.' };
  }
}

/**
 * Reject unenrollment request with review notes
 */
async function rejectUnenrollmentRequest(requestId, mentorId, notes) {
  const mId = mentorId || currentMentorId.value || DEMO_MENTOR_UUID;
  try {
    const res = await MentorService.rejectUnenrollmentRequest(requestId, mId, notes);
    if (res.success) {
      pendingUnenrollmentRequests.value = pendingUnenrollmentRequests.value.filter(r => r.id !== requestId);
      await fetchUnenrollmentHistory(mId);
    }
    return res;
  } catch (err) {
    return { success: false, error: err.message || 'Failed to reject request.' };
  }
}

/**
 * Fetch persistent notifications for mentor
 */
async function fetchMentorNotifications(mentorId) {
  const mId = mentorId || currentMentorId.value || DEMO_MENTOR_UUID;
  isLoadingNotifications.value = true;
  try {
    const list = await MentorService.getMentorNotifications(mId);
    mentorNotifications.value = list;
    return list;
  } catch (err) {
    console.warn('[MentorStore] fetchMentorNotifications error:', err);
    return [];
  } finally {
    isLoadingNotifications.value = false;
  }
}

/**
 * Mark notification as read
 */
async function markNotificationRead(notificationId) {
  if (!notificationId) return;
  try {
    await MentorService.markNotificationRead(notificationId);
    const notif = mentorNotifications.value.find(n => n.id === notificationId);
    if (notif) notif.is_read = true;
  } catch (err) {
    console.warn('[MentorStore] markNotificationRead error:', err);
  }
}

/**
 * Module-Centered Learning System Methods & Computed Getters
 */
const modules = computed(() => courses.value);
const activeModule = computed(() => activeCourse.value);
const activeModuleId = activeCourseId;
const moduleMaterials = computed(() => courseMaterials.value);
const activeModuleDraft = computed(() => activeProposal.value);

async function loadModules(mentorId) {
  return loadCourses(mentorId);
}

async function createModule(payload) {
  return createCourse(payload);
}

async function updateModule(id, payload) {
  return updateCourse(id, payload);
}

async function deleteModule(id) {
  return deleteCourse(id);
}

async function generateModuleStructure(moduleId, options = {}) {
  const targetId = moduleId || activeCourseId.value;
  if (!targetId) return { success: false, error: 'Module ID is required' };
  isGeneratingProposal.value = true;
  proposalError.value = null;
  try {
    const res = await MentorService.generateModuleStructure(targetId, currentMentorId.value || DEMO_MENTOR_UUID, options);
    if (res.success && res.draft) {
      activeProposal.value = res.proposal || res.draft;
      await loadProposals(targetId);
    }
    return res;
  } catch (err) {
    proposalError.value = err.message || 'Failed to generate module structure';
    return { success: false, error: proposalError.value };
  } finally {
    isGeneratingProposal.value = false;
  }
}

async function saveModuleDraft(moduleId, draftData) {
  const targetId = moduleId || activeCourseId.value;
  if (!targetId) return { success: false, error: 'Module ID is required' };
  try {
    const res = await MentorService.saveModuleDraft(targetId, draftData, currentMentorId.value || DEMO_MENTOR_UUID);
    if (res.success) {
      activeProposal.value = res.draft;
      await loadProposals(targetId);
    }
    return res;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function reorderLearningNodes(moduleId, orderedNodeIds) {
  const targetId = moduleId || activeCourseId.value;
  if (!targetId) return { success: false, error: 'Module ID is required' };
  try {
    const res = await MentorService.reorderLearningNodes(targetId, orderedNodeIds, currentMentorId.value || DEMO_MENTOR_UUID);
    if (res.success) {
      activeProposal.value = res.draft;
    }
    return res;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function publishModule(moduleId) {
  const targetId = moduleId || activeCourseId.value;
  if (!targetId) return { success: false, error: 'Module ID is required' };
  try {
    const res = await MentorService.publishModule(targetId, currentMentorId.value || DEMO_MENTOR_UUID);
    if (res.success) {
      await loadCourses(currentMentorId.value);
      await loadProposals(targetId);
    }
    return res;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Export Store ─────────────────────────────────────────────────────────────
const mentorStoreSingleton = reactive({
  // Navigation & Identity
  activeView,
  currentMentorId,
  activeMentorProfile,

  // Reactive Data
  courses,
  activeCourseId,
  activeCourse,
  modules,
  activeModuleId,
  activeModule,
  moduleMaterials,
  activeModuleDraft,
  sections,
  activeSectionFilter,
  activeSection,
  students,
  filteredStudents,
  courseMaterials,
  curriculumProposals,
  activeProposal,
  foundationModules,
  dashboardMetrics,
  pendingUnenrollmentRequests,
  unenrollmentHistory,
  pendingUnenrollmentCount,
  mentorNotifications,
  unreadNotificationsCount,

  // Status & Errors
  isLoadingDashboard,
  dashboardError,
  isLoadingCourses,
  coursesError,
  isLoadingMaterials,
  materialsError,
  isGeneratingProposal,
  proposalError,
  isLoadingUnenrollment,
  unenrollmentError,
  isLoadingNotifications,

  // Modals & Drawers
  selectedStudent,
  isDetailOpen,
  studentStarChart,
  isLoadingStarChart,
  isUploadModalOpen,
  isUploading,
  uploadError,
  isStarModalOpen,
  starTargetStudent,
  starActionType,
  starForm,
  AVAILABLE_STARS,

  // Actions
  loadDashboard,
  loadCourses,
  loadModules,
  loadFoundationModules,
  createCourse,
  createModule,
  updateCourse,
  updateModule,
  deleteCourse,
  deleteModule,
  generateModuleStructure,
  saveModuleDraft,
  reorderLearningNodes,
  publishModule,
  createSection,
  updateSection,
  deleteSection,
  enrollStudent,
  loadMaterials,
  uploadMaterial,
  uploadCourseMaterial,
  retryProcessMaterial,
  getMaterialDownloadUrl,
  deleteMaterial,
  loadProposals,
  generateProposalDraft,
  generateCurriculumProposal,
  saveProposalEdits,
  approveProposal,
  publishProposal,
  unpublishProposal,
  generateNodeContent,
  regenerateNodeSection,
  openStudentDetail,
  closeStudentDetail,
  loadStudentStarChart,
  resetModals,
  openStarModal,
  closeStarModal,
  submitStarAction,
  fetchPendingUnenrollmentRequests,
  fetchUnenrollmentHistory,
  approveUnenrollmentRequest,
  rejectUnenrollmentRequest,
  fetchMentorNotifications,
  markNotificationRead,
});

export const useMentorStore = () => mentorStoreSingleton;