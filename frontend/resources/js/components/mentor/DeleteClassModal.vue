<!-- frontend/resources/js/components/mentor/DeleteClassModal.vue -->
<template>
  <Teleport to="body" v-if="Boolean(isOpen && section)">
    <div class="modal-overlay" @click.self="closeModal" @keydown.esc="closeModal">
      <div 
        class="modal-content delete-class-modal" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="delete-class-title"
        @click.stop
      >
        <div class="modal-header">
          <div class="modal-icon-danger">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#dc2626" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div>
            <h3 class="modal-title" id="delete-class-title">Delete Class / Section</h3>
            <p class="modal-subtitle">
              Verify dependency impact before removing this class cohort.
            </p>
          </div>
          <button 
            type="button" 
            class="modal-close-btn" 
            @click.stop.prevent="closeModal" 
            aria-label="Close dialog"
            title="Close dialog (Esc)"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <!-- Class Badge -->
          <div class="target-class-banner">
            <span class="target-class-code">{{ section.code }}</span>
            <span class="target-class-name">{{ section.name }}</span>
            <span class="target-class-school">{{ section.school }} • {{ section.grade_level }}</span>
          </div>

          <!-- Dependency Audit Notice -->
          <div v-if="enrolledCount > 0 || assignedCoursesCount > 0" class="dependency-alert">
            <div class="alert-heading">
              <strong>Dependency Impact:</strong>
            </div>
            <p class="alert-desc">
              This class currently has <strong>{{ enrolledCount }} enrolled student{{ enrolledCount === 1 ? '' : 's' }}</strong> 
              and <strong>{{ assignedCoursesCount }} assigned course{{ assignedCoursesCount === 1 ? '' : 's' }}</strong>.
            </p>
            <ul class="alert-list">
              <li>Students will be safely unenrolled from this section cohort.</li>
              <li>Courses will no longer be assigned to this section.</li>
              <li><strong>Student accounts, profiles, verified concept mastery, and star milestones remain completely safe</strong> in Supabase.</li>
            </ul>
          </div>

          <div v-else class="safe-delete-notice">
            <p>
              This class cohort has <strong>0 enrolled students</strong> and <strong>0 assigned courses</strong>. 
              Deleting this record will cleanly remove it from your mentor dashboard.
            </p>
          </div>

          <!-- Error Banner -->
          <div v-if="errorMessage" class="error-banner" role="alert">
            {{ errorMessage }}
          </div>
        </div>

        <div class="modal-actions-row">
          <button 
            type="button" 
            class="btn-cancel" 
            @click.stop.prevent="closeModal"
            :disabled="isDeleting"
          >
            Cancel
          </button>
          <button 
            type="button" 
            class="btn-delete-danger"
            :disabled="isDeleting"
            @click="handleConfirmDelete"
          >
            <span v-if="isDeleting" class="spinner"></span>
            <span v-else>Confirm & Delete Class</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useMentorStore } from '../../stores/mentorStore.js';

const mentorStore = useMentorStore();

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  section: {
    type: Object,
    default: null,
  },
  enrolledCount: {
    type: Number,
    default: 0,
  },
  assignedCoursesCount: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(['close', 'deleted']);

const isDeleting = ref(false);
const errorMessage = ref('');

function closeModal() {
  errorMessage.value = '';
  isDeleting.value = false;
  emit('close');
}

function handleKeydown(e) {
  if (e.key === 'Escape' && props.isOpen && !isDeleting.value) {
    closeModal();
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});

async function handleConfirmDelete() {
  if (!props.section?.id) return;

  isDeleting.value = true;
  errorMessage.value = '';

  try {
    const res = await mentorStore.deleteSection(props.section.id, props.mentorId);
    if (res.success) {
      emit('deleted', props.section.id);
      closeModal();
    } else {
      errorMessage.value = res.error || 'Failed to delete section.';
    }
  } catch (err) {
    errorMessage.value = err.message || 'An unexpected error occurred during deletion.';
  } finally {
    isDeleting.value = false;
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 15, 30, 0.72);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
  box-sizing: border-box;
}

.delete-class-modal {
  background: var(--surface-card, #ffffff);
  border: 1px solid var(--border-subtle, #e2e8f0);
  border-radius: var(--radius-xl, 16px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.22);
  width: 100%;
  max-width: 480px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: modalEnter 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  box-sizing: border-box;
}

@keyframes modalEnter {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  padding: 20px 20px 14px 20px;
  border-bottom: 1px solid var(--border-subtle, #e2e8f0);
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.modal-icon-danger {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #fef2f2;
  border: 1px solid #fee2e2;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.modal-title {
  font-family: var(--font-family-display, inherit);
  font-size: 17px;
  font-weight: 700;
  color: var(--text-heading, #0f172a);
  margin: 0 0 4px 0;
  letter-spacing: -0.01em;
}

.modal-subtitle {
  font-size: 13px;
  color: var(--text-secondary, #64748b);
  margin: 0;
  line-height: 1.4;
}

.modal-close-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-muted, #94a3b8);
  padding: 4px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  transition: all 0.15s ease;
}

.modal-close-btn:hover {
  background: var(--bg-hover, #f1f5f9);
  color: var(--text-heading, #0f172a);
}

.modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.target-class-banner {
  background: var(--bg-surface-subtle, #f8fafc);
  border: 1px solid var(--border-subtle, #e2e8f0);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.target-class-code {
  font-size: 11px;
  font-weight: 700;
  color: #2563eb;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.target-class-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-heading, #0f172a);
}

.target-class-school {
  font-size: 12px;
  color: var(--text-muted, #64748b);
}

.dependency-alert {
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;
  padding: 12px 14px;
  font-size: 13px;
  color: #92400e;
}

.alert-heading {
  margin-bottom: 4px;
  color: #b45309;
}

.alert-desc {
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.alert-list {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12.5px;
}

.safe-delete-notice {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px 14px;
  font-size: 13px;
  color: var(--text-body, #334155);
  line-height: 1.5;
}

.error-banner {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
}

.modal-actions-row {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  padding: 14px 20px 20px 20px;
  border-top: 1px solid var(--border-subtle, #f1f5f9);
}

.btn-cancel {
  background: var(--bg-surface, #ffffff);
  border: 1px solid var(--border-subtle, #cbd5e1);
  color: var(--text-body, #475569);
  padding: 8px 16px;
  border-radius: var(--radius-md, 8px);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-cancel:hover:not(:disabled) {
  background: var(--bg-hover, #f8fafc);
  color: var(--text-heading, #0f172a);
}

.btn-delete-danger {
  background: #dc2626;
  border: none;
  color: #ffffff;
  padding: 8px 18px;
  border-radius: var(--radius-md, 8px);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 140px;
  transition: background-color 0.15s ease;
}

.btn-delete-danger:hover:not(:disabled) {
  background: #b91c1c;
}

.btn-delete-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

