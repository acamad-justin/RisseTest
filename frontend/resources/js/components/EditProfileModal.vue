<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="edit-profile-title">
      <div class="modal-header">
        <h3 class="modal-title" id="edit-profile-title">Edit Profile</h3>
        <button type="button" class="modal-close-btn" @click="$emit('close')" aria-label="Close modal">&times;</button>
      </div>

      <form @submit.prevent="handleSubmit" class="edit-profile-form">
        <!-- ── Profile Picture Upload Section ── -->
        <div class="form-group avatar-uploader-group">
          <label class="form-label">Profile Picture</label>
          <div class="avatar-uploader-row">
            <!-- Visual Avatar Box with Drag & Drop -->
            <div 
              class="avatar-drop-zone"
              :class="{ 'is-dragging': isDragging }"
              @click="triggerFileInput"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="handleDrop"
              title="Click or drag to change profile photo"
              role="button"
              tabindex="0"
              aria-label="Upload profile picture"
            >
              <img 
                v-if="formData.avatar" 
                :src="formData.avatar" 
                alt="Profile picture preview" 
                class="avatar-img-preview" 
              />
              <div v-else class="avatar-empty-placeholder">
                <span class="avatar-placeholder-letter">{{ userInitial }}</span>
              </div>
              <div class="avatar-camera-badge" title="Change photo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="16" height="16">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
            </div>

            <!-- Upload Controls & Actions -->
            <div class="avatar-actions-col">
              <input 
                ref="fileInputRef" 
                type="file" 
                accept="image/*" 
                class="hidden-file-input" 
                @change="handleFileChange" 
                id="profile-photo-file-input"
              />

              <div class="avatar-button-group">
                <button 
                  type="button" 
                  class="btn-action-upload" 
                  @click="triggerFileInput"
                  id="btn-upload-photo"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <span>Upload Photo</span>
                </button>

                <button 
                  v-if="formData.avatar" 
                  type="button" 
                  class="btn-action-remove" 
                  @click="removeAvatar"
                  id="btn-remove-photo"
                  title="Remove profile picture"
                >
                  Remove
                </button>
              </div>

              <span class="avatar-format-hint">JPG, PNG, WebP or GIF (Auto-optimized)</span>

              <button 
                type="button" 
                class="btn-toggle-url-link" 
                @click="showUrlInput = !showUrlInput"
              >
                {{ showUrlInput ? '− Hide Image URL' : '+ Or paste Image URL' }}
              </button>
            </div>
          </div>

          <!-- Optional URL Input Dropdown -->
          <div v-if="showUrlInput" class="avatar-url-drawer">
            <input 
              id="edit-avatar-url" 
              v-model="formData.avatar" 
              type="url" 
              placeholder="https://example.com/avatar.jpg" 
              class="form-input" 
            />
          </div>

          <p v-if="uploadError" class="avatar-upload-error">{{ uploadError }}</p>
        </div>

        <!-- ── Student Information Fields ── -->
        <div class="form-group">
          <label class="form-label" for="edit-name">Full Name</label>
          <input 
            id="edit-name" 
            v-model="formData.name" 
            type="text" 
            class="form-input" 
            required 
            autocomplete="name"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="edit-school">School / Institution</label>
          <input 
            id="edit-school" 
            v-model="formData.school" 
            type="text" 
            class="form-input" 
            required 
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="edit-grade">Grade Level</label>
          <input 
            id="edit-grade" 
            v-model="formData.grade" 
            type="text" 
            class="form-input" 
            required 
          />
        </div>

        <div class="modal-actions">
          <button type="button" class="btn-secondary" @click="$emit('close')">Cancel</button>
          <button type="submit" class="btn-primary" id="btn-save-profile">Save Changes</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';

const props = defineProps({
  user: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['close', 'save']);

const fileInputRef = ref(null);
const isDragging = ref(false);
const showUrlInput = ref(false);
const uploadError = ref('');

const formData = reactive({
  name: props.user.name,
  school: props.user.school,
  grade: props.user.grade,
  avatar: props.user.avatar || '',
});

const userInitial = computed(() => {
  const name = formData.name || props.user.name || 'S';
  return name.trim().charAt(0).toUpperCase() || 'S';
});

function triggerFileInput() {
  uploadError.value = '';
  if (fileInputRef.value) {
    fileInputRef.value.click();
  }
}

function handleFileChange(event) {
  const file = event.target.files?.[0];
  if (file) {
    processImageFile(file);
  }
}

function handleDrop(event) {
  isDragging.value = false;
  const file = event.dataTransfer?.files?.[0];
  if (file) {
    processImageFile(file);
  }
}

function processImageFile(file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    uploadError.value = 'Please upload a valid image file (PNG, JPG, WebP, GIF).';
    return;
  }
  uploadError.value = '';

  const reader = new FileReader();
  reader.onload = (e) => {
    const rawDataUrl = e.target.result;
    
    // Resize & compress image through canvas to keep payload small & fast
    const img = new Image();
    img.onload = () => {
      const maxDim = 400;
      const width = img.width;
      const height = img.height;
      const size = Math.min(width, height);

      const canvas = document.createElement('canvas');
      const targetSize = Math.min(size, maxDim);
      canvas.width = targetSize;
      canvas.height = targetSize;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Center crop to a perfect square avatar
        const sx = (width - size) / 2;
        const sy = (height - size) / 2;
        ctx.drawImage(img, sx, sy, size, size, 0, 0, targetSize, targetSize);
        formData.avatar = canvas.toDataURL('image/jpeg', 0.88);
      } else {
        formData.avatar = rawDataUrl;
      }
    };
    img.onerror = () => {
      formData.avatar = rawDataUrl;
    };
    img.src = rawDataUrl;
  };
  reader.onerror = () => {
    uploadError.value = 'Unable to read the chosen file. Please try again.';
  };
  reader.readAsDataURL(file);
}

function removeAvatar() {
  formData.avatar = '';
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
}

function handleSubmit() {
  emit('save', { ...formData });
}
</script>

<style scoped>
.edit-profile-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── Avatar Upload Section ── */
.avatar-uploader-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.avatar-uploader-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar-drop-zone {
  width: 74px;
  height: 74px;
  border-radius: 16px;
  background-color: #f1f5f9;
  border: 2px dashed #cbd5e1;
  position: relative;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.avatar-drop-zone:hover {
  border-color: #F18701;
  background-color: #fff7ed;
  transform: scale(1.02);
}

.avatar-drop-zone.is-dragging {
  border-color: #F18701;
  background-color: #ffedd5;
  border-style: solid;
}

.avatar-img-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
}

.avatar-empty-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e2e8f0;
}

.avatar-placeholder-letter {
  font-size: 26px;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
}

.avatar-camera-badge {
  position: absolute;
  bottom: 3px;
  right: 3px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #F18701;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease;
}

.avatar-drop-zone:hover .avatar-camera-badge {
  transform: scale(1.1);
  background: #F35B04;
}

.avatar-actions-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hidden-file-input {
  display: none;
}

.avatar-button-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-action-upload {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  color: #ea580c;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-action-upload:hover {
  background: #ffedd5;
  border-color: #f97316;
  color: #c2410c;
  transform: translateY(-1px);
}

.btn-action-remove {
  padding: 7px 12px;
  background: transparent;
  border: 1px solid #e2e8f0;
  color: #64748b;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-action-remove:hover {
  background: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
}

.avatar-format-hint {
  font-size: 11px;
  color: #94a3b8;
}

.btn-toggle-url-link {
  background: none;
  border: none;
  color: #F18701;
  font-size: 11.5px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  text-align: left;
  text-decoration: underline;
  text-underline-offset: 2px;
  width: fit-content;
}

.btn-toggle-url-link:hover {
  color: #F35B04;
}

.avatar-url-drawer {
  margin-top: 4px;
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.avatar-upload-error {
  font-size: 12px;
  color: #dc2626;
  margin: 0;
}
</style>
