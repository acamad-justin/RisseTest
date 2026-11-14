<!-- frontend/resources/js/components/mentor/EditClassModal.vue -->
<template>
  <Teleport to="body" v-if="Boolean(isOpen && section)">
    <div class="modal-overlay" @click.self="closeModal" @keydown.esc="closeModal">
      <div 
        class="modal-content edit-class-modal" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="edit-class-title"
        @click.stop
      >
        <div class="modal-header">
          <div>
            <h3 class="modal-title" id="edit-class-title">Edit Class / Section</h3>
            <p class="modal-subtitle">
              Modify cohort metadata, academic level, and institutional information.
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
            <label class="form-label" for="edit-section-name">
              Class / Section Name <span class="required">*</span>
            </label>
            <input 
              id="edit-section-name" 
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
              <label class="form-label" for="edit-section-code">
                Section Code <span class="required">*</span>
              </label>
              <input 
                id="edit-section-code" 
                v-model="form.code" 
                type="text" 
                class="form-input" 
                placeholder="e.g. SEC-10A" 
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="edit-section-grade">
                Academic Level <span class="required">*</span>
              </label>
              <select 
                id="edit-section-grade" 
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
            <label class="form-label" for="edit-section-school">
              Institution / School
            </label>
            <input 
              id="edit-section-school" 
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
              <span v-else>Save Changes</span>
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
    default: null,
  },
  mentorId: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['close', 'updated']);

const isSubmitting = ref(false);
const errorMessage = ref('');

const form = reactive({
  name: '',
  code: '',
  gradeLevel: 'Grade 10',
  school: '',
});

watch(
  () => [props.isOpen, props.section],
  ([open, sec]) => {
    if (open && sec) {
      form.name = sec.name || '';
      form.code = sec.code || '';
      form.gradeLevel = sec.grade_level || 'Grade 10';
      form.school = sec.school || 'Rizal Polytechnic de Muntinlupa';
      errorMessage.value = '';
      isSubmitting.value = false;
    }
  },
  { immediate: true }
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
  if (!props.section?.id) return;

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
    const res = await mentorStore.updateSection(props.section.id, {
      name: form.name.trim(),
      code: form.code.trim(),
      gradeLevel: form.gradeLevel,
      school: form.school.trim(),
      mentorId: props.mentorId,
    });

    if (res.success && res.section) {
      emit('updated', res.section);
      closeModal();
    } else {
      errorMessage.value = res.error || 'Failed to update section.';
    }
  } catch (err) {
    errorMessage.value = err.message || 'An unexpected error occurred.';
  } finally {
    isSubmitting.value = false;
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

.edit-class-modal {
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
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
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
  transition: all 0.15s ease;
}

.modal-close-btn:hover {
  background: var(--bg-hover, #f1f5f9);
  color: var(--text-heading, #0f172a);
}

.modal-form {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.error-banner {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
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
  font-size: 13px;
  font-weight: 600;
  color: var(--text-label, #334155);
}

.required {
  color: #dc2626;
}

.form-input,
.form-select {
  width: 100%;
  padding: 9px 12px;
  font-size: 13.5px;
  border: 1px solid var(--border-input, #cbd5e1);
  border-radius: var(--radius-md, 8px);
  background: var(--bg-surface, #ffffff);
  color: var(--text-body, #1e293b);
  box-sizing: border-box;
  font-family: inherit;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.modal-actions-row {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
  padding-top: 14px;
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

.btn-cancel:hover {
  background: var(--bg-hover, #f8fafc);
  color: var(--text-heading, #0f172a);
}

.btn-confirm-primary {
  background: #2563eb;
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
  min-width: 110px;
  transition: background-color 0.15s ease;
}

.btn-confirm-primary:hover:not(:disabled) {
  background: #1d4ed8;
}

.btn-confirm-primary:disabled {
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

