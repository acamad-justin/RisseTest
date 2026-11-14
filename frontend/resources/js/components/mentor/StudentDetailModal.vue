<!-- frontend/resources/js/components/mentor/StudentDetailModal.vue -->
<template>
  <Teleport to="body" v-if="Boolean(isOpen) && student && (student.id || student.student_id)">
    <div class="modal-overlay" @click.self="closeModal" @keydown.esc="closeModal">
      <div 
        class="modal-content student-detail-modal" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="modal-student-name"
        @click.stop
      >
        <!-- Modal Header -->
        <div class="modal-header">
          <div class="student-header-meta">
            <div class="student-avatar-badge">
              <img v-if="student.avatar" :src="student.avatar" :alt="student.name" class="avatar-img" />
              <span v-else class="avatar-initial">{{ studentInitial }}</span>
            </div>
            <div>
              <h2 class="student-name-title" id="modal-student-name">{{ student.name || 'Enrolled Student' }}</h2>
              <div class="student-subtitle-tags">
                <span class="tag-pill tag-section">{{ student.section_name || student.section_code || 'Assigned Section' }}</span>
                <span v-if="student.email" class="tag-pill tag-email">{{ student.email }}</span>
                <span class="tag-pill" :class="`status-${student.learning_status || 'active'}`">{{ statusLabel }}</span>
              </div>
            </div>
          </div>
          <button 
            type="button" 
            class="modal-close-btn" 
            @click.stop.prevent="closeModal" 
            aria-label="Close dialog"
            title="Close dialog"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="modal-body-scroll">
          <!-- Section 1: Learning Progress Breakdown -->
          <section class="detail-section">
            <h3 class="section-title">Current Module Progress</h3>
            <div class="progress-card">
              <div class="progress-card-header">
                <div>
                  <span class="module-code-pill">Module {{ student.current_module_id || 101 }}</span>
                  <span class="module-title-text">{{ student.current_module_title || 'Sensors & Perception' }}</span>
                </div>
                <span class="progress-percentage-large">{{ student.module_progress || 0 }}%</span>
              </div>

              <div class="progress-bar-track">
                <div class="progress-bar-fill" :style="{ width: `${student.module_progress || 0}%` }"></div>
              </div>

              <div class="checkpoint-info-row">
                <span class="checkpoint-label">Active Checkpoint:</span>
                <span class="checkpoint-value">{{ student.current_checkpoint || 'Foundation Phase' }}</span>
              </div>

              <div class="metrics-grid">
                <div class="metric-item">
                  <span class="metric-num">{{ student.mastered_concepts_count || 0 }}</span>
                  <span class="metric-desc">Mastered Concepts</span>
                </div>
                <div class="metric-item">
                  <span class="metric-num">{{ starCount }}</span>
                  <span class="metric-desc">Earned Stars</span>
                </div>
                <div class="metric-item">
                  <span class="metric-num">{{ formattedLastActive }}</span>
                  <span class="metric-desc">Last Observed</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Section 2: Star Chart & Manual Awards -->
          <section class="detail-section">
            <div class="star-section-header">
              <div>
                <h3 class="section-title">Star Chart & Achievements</h3>
                <p class="section-subtitle">Earned stars reflecting practical lab demonstrations and milestone achievements.</p>
              </div>
              <button 
                type="button" 
                class="btn-award-star"
                @click="handleAwardStar"
              >
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Award Star
              </button>
            </div>

            <!-- Star Chart Grid -->
            <div v-if="isLoadingStarChart" class="loading-state">
              <span class="spinner"></span> Loading Star Chart records...
            </div>
            <div v-else-if="activeAwards.length === 0" class="empty-stars-box">
              <div class="empty-star-icon">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#d1d5db" stroke-width="1.75">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </div>
              <p class="empty-stars-text">No stars have been earned or awarded yet for this student.</p>
              <p class="empty-stars-hint">Mentors can award stars after evaluating hands-on laboratory milestones.</p>
            </div>
            <div v-else class="stars-grid">
              <div 
                v-for="star in activeAwards" 
                :key="star.id || star.star_id" 
                class="star-card"
              >
                <div class="star-card-top">
                  <div class="star-icon-pill">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  </div>
                  <button 
                    type="button" 
                    class="btn-revoke-star"
                    title="Revoke this star"
                    @click="handleRevokeStar(star)"
                  >
                    Revoke
                  </button>
                </div>
                <h4 class="star-title">{{ star.title }}</h4>
                <span class="star-category">{{ star.category }}</span>
                <div class="star-date-footer">
                  Earned: {{ formatDate(star.created_at) }}
                </div>
              </div>
            </div>
          </section>

          <!-- Section 3: Append-Only Star Chart Audit History -->
          <section class="detail-section">
            <h3 class="section-title">Star Chart Audit Trail</h3>
            <p class="section-subtitle">
              Immutable log of all mentor-issued awards and revocations. 
              <strong class="text-orange">Note:</strong> Manual stars do not alter verified cognitive concept mastery.
            </p>

            <div v-if="auditEvents.length === 0" class="empty-audit-box">
              No audit records present.
            </div>
            <div v-else class="audit-table-wrapper">
              <table class="audit-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>Star ID</th>
                    <th>Reason / Observation Note</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="evt in auditEvents" :key="evt.id">
                    <td class="cell-time">{{ formatDate(evt.created_at) }}</td>
                    <td>
                      <span :class="`badge-action-${evt.action}`">
                        {{ evt.action.toUpperCase() }}
                      </span>
                    </td>
                    <td class="cell-star">{{ evt.star_id }}</td>
                    <td class="cell-note">{{ evt.note }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer-bar">
          <button 
            type="button" 
            class="btn-footer-close" 
            @click.stop.prevent="closeModal"
            id="btn-close-student-detail"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue';
import { useMentorStore } from '../../stores/mentorStore.js';

const mentorStore = useMentorStore();

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  student: {
    type: Object,
    default: () => null,
  },
  starChart: {
    type: Object,
    default: () => ({ awards: [], auditEvents: [] }),
  },
  isLoadingStarChart: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close', 'award-star', 'revoke-star']);

function closeModal() {
  try {
    mentorStore.closeStudentDetail();
    mentorStore.resetModals();
  } catch (err) {
    console.warn('[StudentDetailModal] Failed to reset modals:', err);
  }
  emit('close');
}

function handleAwardStar() {
  if (props.student) {
    const s = { ...props.student };
    closeModal();
    emit('award-star', s);
  }
}

function handleRevokeStar(star) {
  if (props.student && star) {
    const s = { ...props.student };
    closeModal();
    emit('revoke-star', s, star);
  }
}

function handleKeydown(e) {
  if (e.key === 'Escape' && props.isOpen) {
    closeModal();
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});

const studentInitial = computed(() => {
  return props.student?.name?.trim().charAt(0).toUpperCase() || 'S';
});

const statusLabel = computed(() => {
  const map = {
    active: 'Active Learner',
    needs_assistance: 'Needs Assistance',
    struggling: 'Struggling',
    completed: 'Module Complete',
  };
  return map[props.student?.learning_status] || 'Active';
});

const activeAwards = computed(() => {
  return (props.starChart?.awards || []).filter(a => a.status === 'awarded');
});

const starCount = computed(() => activeAwards.value.length);

const auditEvents = computed(() => {
  return props.starChart?.auditEvents || [];
});

const formattedLastActive = computed(() => {
  if (!props.student?.last_activity) return 'Recent';
  try {
    const d = new Date(props.student.last_activity);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (_) {
    return 'Recent';
  }
});

function formatDate(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (_) {
    return iso;
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99990;
  padding: 16px;
  pointer-events: auto;
  cursor: pointer;
  animation: fadeIn 0.15s ease forwards;
}

.student-detail-modal {
  cursor: default;
  position: relative;
  z-index: 99991;
  pointer-events: auto;
  background: #ffffff;
  border: 1px solid var(--border-card, #eef1f4);
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.25);
  border-radius: 14px;
  width: 100%;
  max-width: 660px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: var(--text-heading, #1c222b);
  font-family: var(--font-family);
  animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 18px;
  border-bottom: 1px solid #f1f5f9;
  background: #ffffff;
}

.student-header-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.student-avatar-badge {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #ffedd5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  color: #ea580c;
  overflow: hidden;
  border: 1px solid #fed7aa;
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.student-name-title {
  font-family: var(--font-family-display, inherit);
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 3px 0;
}

.student-subtitle-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-pill {
  font-size: 10.5px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 9999px;
  background: #f1f5f9;
  color: #475569;
}

.tag-section {
  background: #fff7ed;
  color: #ea580c;
  border: 1px solid #fed7aa;
}

.tag-email {
  background: #f8fafc;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.status-active {
  background: #dcfce7;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

.status-needs_assistance {
  background: #fef3c7;
  color: #b45309;
  border: 1px solid #fde68a;
}

.status-struggling {
  background: #ffe4e6;
  color: #e11d48;
  border: 1px solid #fecdd3;
}

.status-completed {
  background: #f3e8ff;
  color: #7e22ce;
  border: 1px solid #e9d5ff;
}

.modal-close-btn {
  background: transparent;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  cursor: pointer;
  line-height: 1;
  transition: all 0.15s ease;
  padding: 0;
}

.modal-close-btn:hover {
  background: #f3f4f6;
  color: #111827;
}

.modal-body-scroll {
  padding: 14px 18px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-section {
  display: flex;
  flex-direction: column;
}

.section-title {
  font-size: 13px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 2px 0;
}

.section-subtitle {
  font-size: 11px;
  color: #6b7280;
  margin: 0 0 10px 0;
  line-height: 1.35;
}

.text-orange {
  color: var(--primary-orange, #F18701);
}

.progress-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px 14px;
}

.progress-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.module-code-pill {
  font-size: 10px;
  font-weight: 700;
  background: #e2e8f0;
  color: #475569;
  padding: 2px 6px;
  border-radius: 4px;
  margin-right: 6px;
}

.module-title-text {
  font-size: 12.5px;
  font-weight: 600;
  color: #1e293b;
}

.progress-percentage-large {
  font-size: 16px;
  font-weight: 800;
  color: var(--primary-orange, #F18701);
}

.progress-bar-track {
  width: 100%;
  height: 6px;
  background: #e2e8f0;
  border-radius: 9999px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-bar-fill {
  height: 100%;
  background: var(--primary-orange, #F18701);
  border-radius: 9999px;
  transition: width 0.3s ease;
}

.checkpoint-info-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  margin-bottom: 10px;
}

.checkpoint-label {
  color: #64748b;
  font-weight: 500;
}

.checkpoint-value {
  color: #0f172a;
  font-weight: 600;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid #e2e8f0;
}

.metric-item {
  display: flex;
  flex-direction: column;
}

.metric-num {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.metric-desc {
  font-size: 10.5px;
  color: #64748b;
}

.star-section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.btn-award-star {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: var(--primary-orange, #F18701);
  color: #ffffff;
  border: none;
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 1px 4px rgba(241, 135, 1, 0.2);
}

.btn-award-star:hover {
  background: #e07d00;
}

.empty-stars-box {
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.empty-star-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 4px;
}

.empty-stars-text {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  margin: 0 0 2px 0;
}

.empty-stars-hint {
  font-size: 11px;
  color: #94a3b8;
  margin: 0;
}

.stars-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
}

.star-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
}

.star-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.star-icon-pill {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #fff7ed;
  color: #ea580c;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-revoke-star {
  background: transparent;
  border: 1px solid #fecaca;
  color: #dc2626;
  font-size: 10.5px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-revoke-star:hover {
  background: #fef2f2;
}

.star-title {
  font-size: 12px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 2px 0;
}

.star-category {
  font-size: 10px;
  color: #64748b;
  margin-bottom: 6px;
}

.star-date-footer {
  font-size: 10px;
  color: #94a3b8;
  margin-top: auto;
}

.empty-audit-box {
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  padding: 12px;
  font-size: 11.5px;
  color: #94a3b8;
  text-align: center;
}

.audit-table-wrapper {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.audit-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11.5px;
}

.audit-table th {
  background: #f8fafc;
  padding: 6px 10px;
  text-align: left;
  font-weight: 600;
  color: #475569;
  border-bottom: 1px solid #e2e8f0;
  font-size: 10.5px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.audit-table td {
  padding: 6px 10px;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
}

.cell-time {
  white-space: nowrap;
  color: #64748b;
  font-size: 10.5px;
}

.badge-action-awarded {
  font-size: 9.5px;
  font-weight: 700;
  background: #dcfce7;
  color: #15803d;
  padding: 2px 5px;
  border-radius: 3px;
}

.badge-action-revoked {
  font-size: 9.5px;
  font-weight: 700;
  background: #fee2e2;
  color: #dc2626;
  padding: 2px 5px;
  border-radius: 3px;
}

.cell-star {
  font-family: monospace;
  font-size: 11px;
  color: #64748b;
}

.cell-note {
  max-width: 220px;
  font-size: 11px;
}

.modal-footer-bar {
  display: flex;
  justify-content: flex-end;
  padding: 10px 18px;
  border-top: 1px solid #f1f5f9;
  background: #f9fafb;
}

.btn-footer-close {
  background: #ffffff;
  border: 1px solid #d1d5db;
  color: #374151;
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-footer-close:hover {
  background: #f3f4f6;
  color: #111827;
}

.loading-state {
  padding: 20px;
  text-align: center;
  color: #64748b;
  font-size: 12px;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleUp {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}
</style>
