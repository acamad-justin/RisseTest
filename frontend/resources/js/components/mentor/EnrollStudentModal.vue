<!-- frontend/resources/js/components/mentor/EnrollStudentModal.vue -->
<template>
  <Teleport to="body" v-if="Boolean(isOpen) && section">
    <div class="modal-overlay" @click.self="closeModal" @keydown.esc="closeModal">
      <div 
        class="modal-content enroll-student-modal" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="enroll-modal-title"
        @click.stop
      >
        <div class="modal-header">
          <div>
            <h3 class="modal-title" id="enroll-modal-title">Enroll Student</h3>
            <p class="modal-subtitle">
              Add a student learner to <strong>{{ section.name }}</strong> ({{ section.code }}).
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

        <form @submit.prevent="handleSubmit" class="modal-form">
          <!-- Error Banner -->
          <div v-if="errorMessage" class="error-banner" role="alert">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Student Name -->
          <div class="form-group">
            <label class="form-label" for="student-name">
              Student Full Name <span class="required">*</span>
            </label>
            <input 
              id="student-name" 
              v-model="form.name" 
              type="text" 
              class="form-input" 
              placeholder="e.g. Adriel Justin Dela Cruz" 
              required
            />
          </div>

          <!-- Student Email -->
          <div class="form-group">
            <label class="form-label" for="student-email">
              Student Email <span class="required">*</span>
            </label>
            <input 
              id="student-email" 
              v-model="form.email" 
              type="email" 
              class="form-input" 
              placeholder="e.g. demo1@acamad.com" 
              required
            />
            <span class="form-hint">
              Enter the student's registered RISSE account email to link course access.
            </span>
          </div>

          <!-- Modal Actions -->
          <div class="modal-actions-row">
            <button 
              type="button" 
              class="btn-cancel" 
              @click.stop.prevent="closeModal"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              class="btn-confirm-primary"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting" class="spinner"></span>
              <span v-else>Confirm Enrollment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { reactive, ref, onMounted, onUnmounted, watch } from 'vue';
import { useMentorStore } from '../../stores/mentorStore.js';

const mentorStore = useMentorStore();

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  section: {
    type: Object,
    default: () => null,
  },
});

const emit = defineEmits(['close', 'enrolled']);

const isSubmitting = ref(false);
const errorMessage = ref('');

const form = reactive({
  name: '',
  email: '',
});

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      form.name = '';
      form.email = '';
      errorMessage.value = '';
      isSubmitting.value = false;
    }
  }
);

function closeModal() {
  errorMessage.value = '';
  isSubmitting.value = false;
  emit('close');
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

async function handleSubmit() {
  if (!form.name.trim()) {
    errorMessage.value = 'Student name is required.';
    return;
  }
  if (!form.email.trim() || !form.email.includes('@')) {
    errorMessage.value = 'A valid email address is required.';
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = '';

  try {
    const res = await mentorStore.enrollStudent(props.section.id, {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
    });

    if (res.success && res.student) {
      emit('enrolled', res.student);
      closeModal();
    } else {
      errorMessage.value = res.error || 'Failed to enroll student. Please check input.';
    }
  } catch (err) {
    errorMessage.value = err?.message || 'Failed to enroll student.';
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
  cursor: pointer;
}

.enroll-student-modal {
  cursor: default;
  position: relative;
  z-index: 100000;
  background: #ffffff;
  border: 1px solid var(--border-card, #eef1f4);
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.25);
  border-radius: 14px;
  width: 100%;
  max-width: 460px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: #111827;
  font-family: inherit;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 18px 20px 14px;
  border-bottom: 1px solid #f1f5f9;
}

.modal-title {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 4px 0;
}

.modal-subtitle {
  font-size: 12px;
  color: #64748b;
  margin: 0;
}

.modal-close-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 6px;
  color: #94a3b8;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.modal-close-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.modal-form {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-label {
  font-size: 12px;
  font-weight: 600;
  color: #334155;
}

.form-hint {
  font-size: 11px;
  color: #64748b;
  line-height: 1.4;
}

.required {
  color: #ef4444;
}

.form-input {
  padding: 9px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 13px;
  color: #1e293b;
  background: #ffffff;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.form-input:focus {
  outline: none;
  border-color: #f18701;
  box-shadow: 0 0 0 3px rgba(241, 135, 1, 0.12);
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 12px;
}

.modal-actions-row {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
  padding-top: 14px;
  border-top: 1px solid #f1f5f9;
}

.btn-cancel {
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-cancel:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.btn-confirm-primary {
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 600;
  color: #ffffff;
  background: #f18701;
  border: 1px solid #ea580c;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-confirm-primary:hover:not(:disabled) {
  background: #ea580c;
}

.btn-confirm-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid #ffffff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

