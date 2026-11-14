<!-- frontend/resources/js/components/mentor/UploadMaterialModal.vue -->
<template>
  <Teleport to="body" v-if="Boolean(isOpen)">
    <div class="modal-overlay" @click.self="closeModal" @keydown.esc="closeModal">
      <div 
        class="modal-content upload-modal" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="upload-modal-title"
      >
        <div class="modal-header">
          <div>
            <h3 class="modal-title" id="upload-modal-title">Upload Learning Material</h3>
            <p class="modal-subtitle">
              Upload supplemental worksheets, circuit schematics, or laboratory guides for students.
            </p>
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

        <form @submit.prevent="handleSubmit" class="modal-form">
          <!-- Target Module -->
          <div class="form-group">
            <label class="form-label" for="select-target-module">Associated Curriculum Module <span class="required">*</span></label>
            <select id="select-target-module" v-model="selectedModuleId" class="form-select" required>
              <option :value="101">Module 101: Sensors & Perception</option>
              <option :value="102">Module 102: Programming Robot Behavior</option>
              <option :value="103">Module 103: Robotics Fundamentals</option>
              <option :value="104">Module 104: Sumobot Design & Competition</option>
              <option :value="105">Module 105: Embedded Microcontroller Architecture</option>
              <option :value="106">Module 106: Closed-Loop Control & Motion</option>
            </select>
          </div>

          <!-- Document Title -->
          <div class="form-group">
            <label class="form-label" for="input-material-title">Document Title <span class="required">*</span></label>
            <input
              id="input-material-title"
              v-model="title"
              type="text"
              class="form-input"
              placeholder="e.g., L298N Dual H-Bridge Motor Driver Thermal Guidelines"
              required
            />
          </div>

          <!-- Description -->
          <div class="form-group">
            <label class="form-label" for="textarea-material-desc">Description / Pedagogical Context</label>
            <textarea
              id="textarea-material-desc"
              v-model="description"
              rows="2"
              class="form-textarea"
              placeholder="Optional notes for students explaining how this material relates to upcoming checkpoints."
            ></textarea>
          </div>

          <!-- File Picker -->
          <div class="form-group">
            <label class="form-label">Attachment File <span class="required">*</span></label>
            <div 
              class="file-drop-zone"
              :class="{ 'has-file': Boolean(selectedFile) }"
              @click="triggerFileInput"
            >
              <input
                ref="fileInputRef"
                type="file"
                class="hidden-file-input"
                accept=".pdf,.txt,.md,.doc,.docx,application/pdf"
                @change="handleFileSelected"
              />
              <div v-if="!selectedFile" class="drop-zone-placeholder">
                <div class="upload-icon-circle">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="12" y1="18" x2="12" y2="12"></line>
                    <polyline points="9 15 12 12 15 15"></polyline>
                  </svg>
                </div>
                <p class="drop-text">Click to choose or drop document</p>
                <p class="drop-subtext">PDF, DOCX, TXT, or MD up to 15MB</p>
              </div>
              <div v-else class="file-chosen-preview">
                <div class="file-icon-circle">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div class="file-meta">
                  <span class="file-name">{{ selectedFile.name }}</span>
                  <span class="file-size">{{ formatBytes(selectedFile.size) }}</span>
                </div>
                <button 
                  type="button" 
                  class="btn-remove-file" 
                  @click.stop="selectedFile = null"
                  title="Remove file"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Error Banner -->
          <div v-if="errorMessage" class="error-banner">
            {{ errorMessage }}
          </div>

          <!-- Actions -->
          <div class="modal-actions-row">
            <button type="button" class="btn-cancel" @click.stop.prevent="closeModal">Cancel</button>
            <button 
              type="submit" 
              class="btn-upload-submit"
              :disabled="isSubmitting || !title.trim() || !selectedFile"
            >
              <span v-if="isSubmitting">Uploading...</span>
              <span v-else>Upload Material</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  defaultModuleId: {
    type: Number,
    default: 101,
  },
});

const emit = defineEmits(['close', 'submit']);

const fileInputRef = ref(null);
const title = ref('');
const description = ref('');
const selectedModuleId = ref(101);
const selectedFile = ref(null);
const isSubmitting = ref(false);
const errorMessage = ref('');

function closeModal() {
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

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      title.value = '';
      description.value = '';
      selectedModuleId.value = props.defaultModuleId || 101;
      selectedFile.value = null;
      errorMessage.value = '';
      isSubmitting.value = false;
    }
  }
);

function triggerFileInput() {
  fileInputRef.value?.click();
}

function handleFileSelected(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  if (file.size > 15 * 1024 * 1024) {
    errorMessage.value = 'File size exceeds maximum permitted limit of 15MB.';
    selectedFile.value = null;
    return;
  }

  const allowedExts = /\.(pdf|txt|md|doc|docx)$/i;
  if (!allowedExts.test(file.name)) {
    errorMessage.value = 'Unsupported file format. Please upload PDF, TXT, MD, or DOCX files.';
    selectedFile.value = null;
    return;
  }

  errorMessage.value = '';
  selectedFile.value = file;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function handleSubmit() {
  if (!title.value.trim()) {
    errorMessage.value = 'Document title is required.';
    return;
  }
  if (!selectedFile.value) {
    errorMessage.value = 'Please select a file to upload.';
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = '';

  try {
    emit('submit', {
      title: title.value.trim(),
      description: description.value.trim(),
      moduleId: selectedModuleId.value,
      file: selectedFile.value,
    });
  } catch (err) {
    errorMessage.value = err.message || 'Upload failed.';
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 16px;
  pointer-events: auto;
  animation: fadeIn 0.15s ease forwards;
}

.upload-modal {
  background: #ffffff;
  border: 1px solid var(--border-card, #eef1f4);
  box-shadow: 0 16px 36px -8px rgba(0, 0, 0, 0.12);
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

.form-select, .form-input, .form-textarea {
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

.form-select:focus, .form-input:focus, .form-textarea:focus {
  border-color: var(--primary-orange, #F18701);
  box-shadow: 0 0 0 2px rgba(241, 135, 1, 0.12);
}

.file-drop-zone {
  border: 1.5px dashed #cbd5e1;
  border-radius: 10px;
  padding: 16px;
  text-align: center;
  background: #f8fafc;
  cursor: pointer;
  transition: border-color 0.15s, background-color 0.15s;
}

.file-drop-zone:hover {
  border-color: var(--primary-orange, #F18701);
  background: #fffaf0;
}

.file-drop-zone.has-file {
  border-color: #86efac;
  background: #f0fdf4;
}

.hidden-file-input {
  display: none;
}

.drop-zone-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.upload-icon-circle {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #f1f5f9;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2px;
}

.drop-text {
  font-weight: 600;
  color: #111827;
  font-size: 12px;
  margin: 0;
}

.drop-subtext {
  font-size: 10.5px;
  color: #6b7280;
  margin: 0;
}

.file-chosen-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
}

.file-icon-circle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #dcfce7;
  color: #15803d;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.file-meta {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.file-name {
  font-size: 12px;
  font-weight: 600;
  color: #111827;
}

.file-size {
  font-size: 10.5px;
  color: #6b7280;
}

.btn-remove-file {
  background: transparent;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 6px;
}

.btn-remove-file:hover {
  color: #ef4444;
}

.error-banner {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  font-size: 11.5px;
  padding: 6px 10px;
  border-radius: 6px;
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
  padding: 7px 14px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-cancel:hover {
  background: #f9fafb;
  border-color: #9ca3af;
  color: #111827;
}

.btn-upload-submit {
  background: var(--primary-orange, #F18701);
  border: none;
  color: #ffffff;
  padding: 7px 16px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 2px 6px rgba(241, 135, 1, 0.2);
}

.btn-upload-submit:hover:not(:disabled) {
  background: #e07d00;
}

.btn-upload-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
