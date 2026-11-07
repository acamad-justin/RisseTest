<!-- frontend/resources/js/components/mentor/StarActionModal.vue -->
<template>
  <Teleport to="body" v-if="Boolean(isOpen) && student && (student.id || student.student_id)">
    <div class="modal-overlay" @click.self="closeModal" @keydown.esc="closeModal">
      <div 
        class="modal-content star-action-modal" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="star-modal-title"
        @click.stop
      >
        <div class="modal-header">
          <div>
            <h3 class="modal-title" id="star-modal-title">
              {{ actionType === 'awarded' ? 'Award Star Achievement' : 'Revoke Star Achievement' }}
            </h3>
            <p class="modal-subtitle">
              Student: <strong class="student-highlight">{{ studentDisplayName }}</strong> ({{ studentSectionName }})
            </p>
          </div>
          <button 
            type="button" 
            class="modal-close-btn" 
            @click.stop.prevent="closeModal" 
            aria-label="Close dialog"
            title="Close dialog (Esc)"
            id="btn-close-star-action-modal"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="modal-form">
          <!-- Star Selection (if awarding) -->
          <div v-if="actionType === 'awarded'" class="form-group">
            <label class="form-label" for="select-star-type">Select Star Achievement</label>
            <select 
              id="select-star-type" 
              v-model="selectedStarId" 
              class="form-select"
            >
              <option v-for="star in catalog" :key="star.id" :value="star.id">
                {{ star.title }} — {{ star.category }} (Module {{ star.defaultModule }})
              </option>
            </select>
          </div>

          <!-- Star Title & Details Display -->
          <div class="star-preview-box">
            <div class="star-preview-icon">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
            <div class="star-preview-text">
              <h4 class="star-preview-title">{{ currentTitle }}</h4>
              <p class="star-preview-desc">{{ currentCategory }} • Module {{ currentModuleId }}</p>
            </div>
          </div>

          <!-- Mandatory Audit Note / Reason -->
          <div class="form-group">
            <label class="form-label" for="star-action-reason">
              Reason / Laboratory Observation Note <span class="required">*</span>
            </label>
            <textarea
              id="star-action-reason"
              v-model="reasonNote"
              rows="3"
              class="form-textarea"
              :class="{ 'has-error': Boolean(errorMessage) }"
              :placeholder="actionType === 'awarded' 
                ? 'e.g., Demonstrated smooth closed-loop velocity control and PID tuning during Lab 6 test bench verification.'
                : 'e.g., Star was awarded in error or student submitted incomplete verification data.'"
            ></textarea>
            <span class="form-hint">
              Every mentor action is permanently logged to the Star Chart audit trail for pedagogical transparency.
            </span>
          </div>

          <!-- Invariant Notice Banner -->
          <div class="invariant-notice-banner">
            <span class="notice-icon">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </span>
            <div class="notice-text">
              <strong>System Invariant:</strong> Manually awarded stars celebrate milestones but 
              <em>never</em> bypass or fabricate verified cognitive concept mastery records.
            </div>
          </div>

          <!-- Error Message Banner -->
          <div v-if="errorMessage" class="error-banner" role="alert">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" class="error-icon">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Modal Actions Row -->
          <div class="modal-actions-row">
            <button 
              type="button" 
              class="btn-cancel" 
              @click.stop.prevent="closeModal"
              id="btn-cancel-star-action-modal"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              :class="actionType === 'awarded' ? 'btn-confirm-award' : 'btn-confirm-revoke'"
              :disabled="isSubmitting"
              id="btn-confirm-star-action-modal"
            >
              <span v-if="isSubmitting" class="spinner"></span>
              <span v-else>
                {{ actionType === 'awarded' ? 'Confirm & Award Star' : 'Confirm Revocation' }}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
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
  actionType: {
    type: String,
    default: 'awarded', // 'awarded' | 'revoked'
  },
  catalog: {
    type: Array,
    default: () => [],
  },
  initialStar: {
    type: Object,
    default: () => null,
  },
});

const emit = defineEmits(['close', 'submit']);

const studentDisplayName = computed(() => {
  if (!props.student) return 'Enrolled Student';
  const name = props.student.name || props.student.full_name || '';
  if (name.trim()) return name.trim();
  if (props.student.email) return props.student.email.split('@')[0];
  return 'Enrolled Student';
});

const studentSectionName = computed(() => {
  if (!props.student) return 'Assigned Section';
  return props.student.section_name || props.student.section_code || 'Assigned Section';
});

function closeModal() {
  try {
    mentorStore.closeStarModal();
    mentorStore.resetModals();
  } catch (err) {
    console.warn('[StarActionModal] Failed to reset modals:', err);
  }
  emit('close');
}

function handleKeydown(e) {
  if (e.key === 'Escape') {
    closeModal();
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});

const selectedStarId = ref('');
const reasonNote = ref('');
const isSubmitting = ref(false);
const errorMessage = ref('');

// Initialize values on open or prop change
watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      // Pre-fill a valid default note so mentors can immediately test without getting blocked
      reasonNote.value = props.actionType === 'awarded'
        ? 'Demonstrated proficient technical competency during laboratory practice.'
        : 'Laboratory observation review and criteria reassessment.';
      errorMessage.value = '';
      if (props.initialStar) {
        selectedStarId.value = props.initialStar.star_id || props.initialStar.id;
      } else if (props.catalog.length > 0) {
        selectedStarId.value = props.catalog[0].id;
      }
    }
  },
  { immediate: true }
);

const currentCatalogItem = computed(() => {
  return props.catalog.find(s => s.id === selectedStarId.value) || null;
});

const currentTitle = computed(() => {
  if (props.initialStar?.title) return props.initialStar.title;
  return currentCatalogItem.value?.title || 'Achievement Star';
});

const currentCategory = computed(() => {
  if (props.initialStar?.category) return props.initialStar.category;
  return currentCatalogItem.value?.category || 'Robotics & Control Systems';
});

const currentModuleId = computed(() => {
  if (props.initialStar?.module_id) return props.initialStar.module_id;
  return currentCatalogItem.value?.defaultModule || 101;
});

async function handleSubmit() {
  if (!reasonNote.value.trim()) {
    errorMessage.value = 'Please provide an observation note or reason before confirming.';
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = '';

  try {
    mentorStore.starForm.note = reasonNote.value.trim();
    emit('submit', {
      studentId: props.student.student_id || props.student.id,
      starId: selectedStarId.value,
      title: currentTitle.value,
      category: currentCategory.value,
      moduleId: currentModuleId.value,
      action: props.actionType,
      note: reasonNote.value.trim(),
    });
  } catch (err) {
    errorMessage.value = err?.message || 'Failed to submit star action.';
  } finally {
    isSubmitting.value = false;
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
  z-index: 99999;
  padding: 16px;
  pointer-events: auto;
  cursor: pointer;
  animation: fadeIn 0.15s ease forwards;
}

.star-action-modal {
  cursor: default;
  position: relative;
  z-index: 100000;
  pointer-events: auto;
  background: #ffffff;
  border: 1px solid var(--border-card, #eef1f4);
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.25);
  border-radius: 14px;
  width: 100%;
  max-width: 480px;
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
  align-items: flex-start;
  padding: 14px 18px 12px;
  border-bottom: 1px solid #f1f5f9;
  background: #ffffff;
}

.modal-title {
  font-family: var(--font-family-display, inherit);
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 2px 0;
}

.modal-subtitle {
  font-size: 12px;
  color: var(--text-muted, #6b7280);
  margin: 0;
}

.student-highlight {
  color: var(--primary-orange, #F18701);
  font-weight: 700;
}

.modal-close-btn {
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4b5563;
  cursor: pointer;
  line-height: 1;
  transition: all 0.15s ease;
  padding: 0;
  flex-shrink: 0;
}

.modal-close-btn:hover {
  background: #e5e7eb;
  color: #111827;
  border-color: #d1d5db;
}

.modal-form {
  padding: 14px 18px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-label {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
}

.required {
  color: #ef4444;
}

.form-select, .form-textarea {
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 7px 10px;
  color: #111827;
  font-size: 12.5px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
  width: 100%;
}

.form-textarea.has-error {
  border-color: #ef4444;
  background: #fffafa;
}

.form-select:focus, .form-textarea:focus {
  border-color: var(--primary-orange, #F18701);
  box-shadow: 0 0 0 2px rgba(241, 135, 1, 0.12);
}

.form-hint {
  font-size: 10.5px;
  color: #9ca3af;
  line-height: 1.35;
}

.star-preview-box {
  background: #fffaf0;
  border: 1px solid #fed7aa;
  border-radius: 10px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.star-preview-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #ffedd5;
  color: #ea580c;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.star-preview-text {
  flex: 1;
}

.star-preview-title {
  font-size: 13.5px;
  font-weight: 700;
  color: #9a3412;
  margin: 0;
}

.star-preview-desc {
  font-size: 11px;
  color: #c2410c;
  margin: 1px 0 0 0;
}

.invariant-notice-banner {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  padding: 8px 12px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 11px;
  color: #1e40af;
  line-height: 1.4;
}

.notice-icon {
  display: inline-flex;
  margin-top: 1px;
  flex-shrink: 0;
  color: #2563eb;
}

.error-banner {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  font-size: 11.5px;
  padding: 8px 12px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.error-icon {
  flex-shrink: 0;
}

.modal-actions-row {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 2px;
}

.btn-cancel {
  background: #ffffff;
  border: 1px solid #d1d5db;
  color: #374151;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-cancel:hover {
  background: #f9fafb;
  border-color: #9ca3af;
  color: #111827;
}

.btn-confirm-award {
  background: var(--primary-orange, #F18701);
  border: none;
  color: #ffffff;
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 2px 6px rgba(241, 135, 1, 0.2);
}

.btn-confirm-award:hover:not(:disabled) {
  background: #e07d00;
}

.btn-confirm-award:disabled, .btn-confirm-revoke:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-confirm-revoke {
  background: #dc2626;
  border: none;
  color: #ffffff;
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 2px 6px rgba(220, 38, 38, 0.2);
}

.btn-confirm-revoke:hover:not(:disabled) {
  background: #b91c1c;
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
