<!-- frontend/resources/js/views/mentor/teaching/UnenrollmentRequestsView.vue -->
<template>
  <div class="unenrollment-page">
    <header class="page-header">
      <div>
        <h1 class="page-title">Course Unenrollment Requests</h1>
        <p class="page-subtitle">
          Review, approve, or decline student unenrollment requests for curriculum-based courses.
        </p>
      </div>

      <!-- Tab Switcher -->
      <div class="view-tabs">
        <button 
          type="button" 
          class="tab-btn" 
          :class="{ active: activeTab === 'pending' }"
          @click="activeTab = 'pending'"
        >
          <span>Pending</span>
          <span v-if="pendingRequests.length > 0" class="tab-badge">
            {{ pendingRequests.length }}
          </span>
        </button>
        <button 
          type="button" 
          class="tab-btn" 
          :class="{ active: activeTab === 'history' }"
          @click="switchToHistory"
        >
          <span>Request History</span>
          <span v-if="historyList.length > 0" class="tab-badge-history">
            {{ historyList.length }}
          </span>
        </button>
      </div>
    </header>

    <!-- Feedback Banner -->
    <div v-if="actionSuccessMessage" class="feedback-banner success-banner">
      <span>✓ {{ actionSuccessMessage }}</span>
      <button type="button" class="btn-close-msg" @click="actionSuccessMessage = ''">&times;</button>
    </div>
    <div v-if="actionErrorMessage" class="feedback-banner error-banner">
      <span>⚠ {{ actionErrorMessage }}</span>
      <button type="button" class="btn-close-msg" @click="actionErrorMessage = ''">&times;</button>
    </div>

    <!-- PENDING TAB -->
    <div v-if="activeTab === 'pending'" class="tab-content">
      <!-- Loading -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading unenrollment requests...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="pendingRequests.length === 0" class="empty-state">
        <div class="empty-icon-circle">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#10b981" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <h2 class="empty-title">All Caught Up!</h2>
        <p class="empty-desc">
          There are currently no pending course unenrollment requests from students in your sections.
        </p>
      </div>

      <!-- Requests Grid -->
      <div v-else class="requests-grid">
        <div 
          v-for="req in pendingRequests" 
          :key="req.id" 
          class="request-card"
        >
          <div class="card-header">
            <div class="student-info">
              <div class="student-avatar-circle">
                {{ getInitials(req.student_name || 'Student') }}
              </div>
              <div>
                <h2 class="student-name">{{ req.student_name || 'Enrolled Student' }}</h2>
                <span class="student-email">{{ req.student_email || 'No email provided' }}</span>
              </div>
            </div>
            <span class="badge-pending">Pending Review</span>
          </div>

          <div class="card-details">
            <div class="detail-row">
              <span class="detail-label">Course:</span>
              <span class="detail-val course-val">{{ req.course_title }}</span>
            </div>
            <div v-if="req.section_name" class="detail-row">
              <span class="detail-label">Section:</span>
              <span class="detail-val">{{ req.section_name }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Requested:</span>
              <span class="detail-val">{{ formatDate(req.requested_at) }}</span>
            </div>

            <div v-if="req.reason" class="reason-box">
              <span class="reason-label">Student Reason:</span>
              <p class="reason-text">"{{ req.reason }}"</p>
            </div>
          </div>

          <div class="card-actions">
            <button 
              type="button" 
              class="btn-approve" 
              :disabled="processingId === req.id"
              @click="handleApprove(req)"
            >
              <span v-if="processingId === req.id">Approving...</span>
              <span v-else>Approve Unenrollment</span>
            </button>
            <button 
              type="button" 
              class="btn-reject" 
              :disabled="processingId === req.id"
              @click="openRejectModal(req)"
            >
              Decline
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- HISTORY TAB -->
    <div v-if="activeTab === 'history'" class="tab-content">
      <div v-if="isLoadingHistory" class="loading-state">
        <div class="spinner"></div>
        <p>Loading history records...</p>
      </div>

      <div v-else-if="historyList.length === 0" class="empty-state">
        <div class="empty-icon-circle">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#64748b" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <h2 class="empty-title">No History Available</h2>
        <p class="empty-desc">Past processed unenrollment requests will appear here.</p>
      </div>

      <div v-else class="history-table-container">
        <table class="history-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Course</th>
              <th>Section</th>
              <th>Status</th>
              <th>Reviewed</th>
              <th>Review Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in historyList" :key="item.id">
              <td class="student-cell">
                <span class="history-name">{{ item.student_name || 'Student' }}</span>
                <span class="history-email">{{ item.student_email }}</span>
              </td>
              <td class="course-cell">{{ item.course_title }}</td>
              <td>{{ item.section_name || '—' }}</td>
              <td>
                <span 
                  class="badge-decision" 
                  :class="item.status === 'approved' ? 'decision-approved' : 'decision-rejected'"
                >
                  {{ item.status === 'approved' ? '✓ Approved' : '✕ Declined' }}
                </span>
              </td>
              <td class="date-cell">{{ formatDate(item.reviewed_at || item.updated_at) }}</td>
              <td class="notes-cell">
                <span v-if="item.review_notes" class="notes-text">{{ item.review_notes }}</span>
                <span v-else class="text-muted">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- REJECT / DECLINE MODAL -->
    <div v-if="isRejectModalOpen" class="modal-backdrop" @click="closeRejectModal">
      <div class="modal-card" @click.stop>
        <header class="modal-header">
          <h2 class="modal-title">Decline Unenrollment Request</h2>
          <button type="button" class="btn-close-modal" @click="closeRejectModal">&times;</button>
        </header>

        <div class="modal-body">
          <p class="modal-desc">
            You are declining <strong>{{ activeRejectReq?.student_name }}</strong>'s request to unenroll from
            <strong>{{ activeRejectReq?.course_title }}</strong>. The student will remain actively enrolled.
          </p>

          <div class="form-group">
            <label class="form-label" for="reject-notes">
              Explanation / Instructions to Student (Optional)
            </label>
            <textarea 
              id="reject-notes"
              v-model="rejectNotes" 
              class="form-textarea" 
              rows="3" 
              placeholder="e.g. Please complete the upcoming midterm lab assignment before dropping, or schedule office hours with me."
            ></textarea>
          </div>
        </div>

        <footer class="modal-footer">
          <button type="button" class="btn-cancel" @click="closeRejectModal" :disabled="isSubmittingReject">
            Cancel
          </button>
          <button 
            type="button" 
            class="btn-confirm-reject" 
            :disabled="isSubmittingReject"
            @click="confirmReject"
          >
            <span v-if="isSubmittingReject">Processing...</span>
            <span v-else>Confirm Decline</span>
          </button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useMentorStore } from '../../../stores/mentorStore.js';

const props = defineProps({
  mentorId: {
    type: String,
    required: true,
  },
});

const mentorStore = useMentorStore();

const activeTab = ref('pending');
const isLoading = ref(false);
const isLoadingHistory = ref(false);
const processingId = ref(null);
const actionSuccessMessage = ref('');
const actionErrorMessage = ref('');

const pendingRequests = computed(() => mentorStore.pendingUnenrollmentRequests || []);
const historyList = computed(() => mentorStore.unenrollmentHistory || []);

// Reject modal state
const isRejectModalOpen = ref(false);
const activeRejectReq = ref(null);
const rejectNotes = ref('');
const isSubmittingReject = ref(false);

onMounted(async () => {
  await loadPending();
});

async function loadPending() {
  isLoading.value = true;
  try {
    await mentorStore.fetchPendingUnenrollmentRequests(props.mentorId);
  } finally {
    isLoading.value = false;
  }
}

async function switchToHistory() {
  activeTab.value = 'history';
  if (historyList.value.length === 0) {
    isLoadingHistory.value = true;
    try {
      await mentorStore.fetchUnenrollmentHistory(props.mentorId);
    } finally {
      isLoadingHistory.value = false;
    }
  }
}

async function handleApprove(req) {
  processingId.value = req.id;
  actionSuccessMessage.value = '';
  actionErrorMessage.value = '';
  try {
    const res = await mentorStore.approveUnenrollmentRequest(req.id, props.mentorId);
    if (res.success) {
      actionSuccessMessage.value = `Unenrollment request for ${req.student_name || 'student'} approved. Enrollment dropped.`;
    } else {
      actionErrorMessage.value = res.error || 'Failed to approve request.';
    }
  } catch (err) {
    actionErrorMessage.value = err.message || 'Error processing approval.';
  } finally {
    processingId.value = null;
  }
}

function openRejectModal(req) {
  activeRejectReq.value = req;
  rejectNotes.value = '';
  isRejectModalOpen.value = true;
}

function closeRejectModal() {
  isRejectModalOpen.value = false;
  activeRejectReq.value = null;
  rejectNotes.value = '';
}

async function confirmReject() {
  if (!activeRejectReq.value) return;
  isSubmittingReject.value = true;
  actionSuccessMessage.value = '';
  actionErrorMessage.value = '';

  try {
    const res = await mentorStore.rejectUnenrollmentRequest(
      activeRejectReq.value.id,
      props.mentorId,
      rejectNotes.value.trim()
    );
    if (res.success) {
      actionSuccessMessage.value = `Unenrollment request for ${activeRejectReq.value.student_name || 'student'} declined. Student remains enrolled.`;
      closeRejectModal();
    } else {
      actionErrorMessage.value = res.error || 'Failed to decline request.';
    }
  } catch (err) {
    actionErrorMessage.value = err.message || 'Error processing request.';
  } finally {
    isSubmittingReject.value = false;
  }
}

function getInitials(name) {
  if (!name) return 'ST';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(isoStr) {
  if (!isoStr) return '—';
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (_) {
    return isoStr;
  }
}
</script>

<style scoped>
.unenrollment-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;
}

.page-title {
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
  margin: 0 0 6px 0;
}

.page-subtitle {
  font-size: 13.5px;
  color: #64748b;
  margin: 0;
}

/* Tabs */
.view-tabs {
  display: flex;
  gap: 6px;
  background: #f1f5f9;
  padding: 4px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 16px;
  background: transparent;
  border: none;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab-btn.active {
  background: #ffffff;
  color: #0f172a;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.tab-badge {
  background: #ef4444;
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 999px;
}

.tab-badge-history {
  background: #94a3b8;
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 999px;
}

/* Feedback Banners */
.feedback-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 600;
  margin-bottom: 20px;
}

.success-banner {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.error-banner {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.btn-close-msg {
  background: none;
  border: none;
  font-size: 18px;
  line-height: 1;
  color: inherit;
  cursor: pointer;
}

/* States */
.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  text-align: center;
}

.empty-icon-circle {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.empty-title {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 6px 0;
}

.empty-desc {
  font-size: 13px;
  color: #64748b;
  max-width: 420px;
  margin: 0;
}

/* Requests Grid */
.requests-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 16px;
}

.request-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.request-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.student-avatar-circle {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #f18701;
  color: #ffffff;
  font-weight: 700;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.student-name {
  font-size: 14.5px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 2px 0;
}

.student-email {
  font-size: 12px;
  color: #64748b;
}

.badge-pending {
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 3px 8px;
  background: #fffbeb;
  color: #b45309;
  border: 1px solid #fde68a;
  border-radius: 999px;
}

.card-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.detail-row {
  display: flex;
  font-size: 12.5px;
  line-height: 1.4;
}

.detail-label {
  width: 80px;
  color: #64748b;
  font-weight: 600;
  flex-shrink: 0;
}

.detail-val {
  color: #1e293b;
  font-weight: 500;
}

.course-val {
  font-weight: 700;
  color: #0f172a;
}

.reason-box {
  margin-top: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 12px;
}

.reason-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 4px;
}

.reason-text {
  font-size: 12.5px;
  color: #334155;
  font-style: italic;
  margin: 0;
  line-height: 1.4;
}

.card-actions {
  display: flex;
  gap: 10px;
}

.btn-approve {
  flex: 1;
  padding: 9px 12px;
  background: #10b981;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-approve:hover:not(:disabled) {
  background: #059669;
}

.btn-reject {
  padding: 9px 16px;
  background: #ffffff;
  color: #ef4444;
  border: 1px solid #fecaca;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-reject:hover:not(:disabled) {
  background: #fef2f2;
  border-color: #ef4444;
}

/* History Table */
.history-table-container {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow-x: auto;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  text-align: left;
}

.history-table th {
  background: #f8fafc;
  padding: 12px 16px;
  font-weight: 700;
  font-size: 11.5px;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid #e2e8f0;
}

.history-table td {
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
  color: #1e293b;
}

.history-table tr:last-child td {
  border-bottom: none;
}

.student-cell {
  display: flex;
  flex-direction: column;
}

.history-name {
  font-weight: 600;
  color: #0f172a;
}

.history-email {
  font-size: 11.5px;
  color: #64748b;
}

.course-cell {
  font-weight: 600;
}

.badge-decision {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 999px;
}

.decision-approved {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.decision-rejected {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.date-cell {
  font-size: 12px;
  color: #64748b;
  white-space: nowrap;
}

.notes-text {
  font-size: 12px;
  color: #475569;
}

.text-muted {
  color: #94a3b8;
}

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
}

.modal-card {
  background: #ffffff;
  border-radius: 12px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.btn-close-modal {
  background: none;
  border: none;
  font-size: 20px;
  color: #64748b;
  cursor: pointer;
}

.modal-body {
  padding: 20px;
}

.modal-desc {
  font-size: 13.5px;
  color: #334155;
  line-height: 1.5;
  margin: 0 0 16px 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 12.5px;
  font-weight: 600;
  color: #1e293b;
}

.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-family: inherit;
  font-size: 13px;
  outline: none;
  resize: vertical;
  box-sizing: border-box;
}

.form-textarea:focus {
  border-color: #f18701;
  box-shadow: 0 0 0 2px rgba(241, 135, 1, 0.15);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.btn-cancel {
  padding: 8px 16px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
}

.btn-confirm-reject {
  padding: 8px 16px;
  background: #ef4444;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #ffffff;
  cursor: pointer;
}

.btn-confirm-reject:hover:not(:disabled) {
  background: #dc2626;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #f1f5f9;
  border-top-color: #f18701;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

