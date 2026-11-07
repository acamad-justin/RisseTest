<!-- frontend/resources/js/components/mentor/CreateClassModal.vue -->
<template>
  <Teleport to="body" v-if="Boolean(isOpen)">
    <div class="modal-overlay" @click.self="closeModal" @keydown.esc="closeModal">
      <div 
        class="modal-content create-class-modal" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="create-class-title"
        @click.stop
      >
        <div class="modal-header">
          <div>
            <h3 class="modal-title" id="create-class-title">Create Class / Section</h3>
            <p class="modal-subtitle">
              Add a new student cohort for course assignments and laboratory tracking.
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

          <!-- Section Name -->
          <div class="form-group">
            <label class="form-label" for="section-name">
              Class / Section Name <span class="required">*</span>
            </label>
            <input 
              id="section-name" 
              v-model="form.name" 
              type="text" 
              class="form-input" 
              placeholder="e.g. Section 10-A (Robotics Alpha)" 
              required
            />
          </div>

          <!-- Code & Academic Level -->
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label" for="section-code">
                Section Code <span class="required">*</span>
              </label>
              <input 
                id="section-code" 
                v-model="form.code" 
                type="text" 
                class="form-input" 
                placeholder="e.g. SEC-10A" 
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="section-grade">
                Academic Level <span class="required">*</span>
              </label>
              <select 
                id="section-grade" 
                v-model="form.gradeLevel" 
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

          <!-- School Name -->
          <div class="form-group">
            <label class="form-label" for="section-school">
              Institution / School
            </label>
            <input 
              id="section-school" 
              v-model="form.school" 
              type="text" 
              class="form-input" 
              placeholder="e.g. Rizal Polytechnic de Muntinlupa" 
            />
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
              <span v-else>Create Class</span>
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
  mentorId: {
    type: String,
    required: true,
  },
  defaultSchool: {
    type: String,
    default: 'Rizal Polytechnic de Muntinlupa',
  },
});

const emit = defineEmits(['close', 'created']);

const isSubmitting = ref(false);
const errorMessage = ref('');

const form = reactive({
  name: '',
  code: '',
  gradeLevel: 'Grade 10',
  school: props.defaultSchool,
});

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      form.name = '';
      form.code = '';
      form.gradeLevel = 'Grade 10';
      form.school = props.defaultSchool || 'Rizal Polytechnic de Muntinlupa';
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
    errorMessage.value = 'Class / Section name is required.';
    return;
  }
  if (!form.code.trim()) {
    errorMessage.value = 'Section code is required.';
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = '';

  try {
    const res = await mentorStore.createSection({
      name: form.name.trim(),
      code: form.code.trim(),
      gradeLevel: form.gradeLevel,
      school: form.school.trim(),
      mentorId: props.mentorId,
    });

    if (res.success && res.section) {
      emit('created', res.section);
      closeModal();
    } else {
      errorMessage.value = res.error || 'Failed to create section. Please try again.';
    }
  } catch (err) {
    errorMessage.value = err?.message || 'Failed to create section.';
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

.create-class-modal {
  cursor: default;
  position: relative;
  z-index: 100000;
  background: #ffffff;
  border: 1px solid var(--border-card, #eef1f4);
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.25);
  border-radius: 14px;
  width: 100%;
  max-width: 480px;
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

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-label {
  font-size: 12px;
  font-weight: 600;
  color: #334155;
}

.required {
  color: #ef4444;
}

.form-input,
.form-select {
  padding: 9px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 13px;
  color: #1e293b;
  background: #ffffff;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.form-input:focus,
.form-select:focus {
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

