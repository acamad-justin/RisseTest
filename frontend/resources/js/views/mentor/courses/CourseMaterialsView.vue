<!-- frontend/resources/js/views/mentor/courses/CourseMaterialsView.vue -->
<template>
  <div class="course-materials-page">
    <header class="page-header">
      <div>
        <h1 class="page-title">Course Learning Materials</h1>
        <p class="page-subtitle">
          Secure private repository for lab worksheets, schematics, presentations, and syllabus documents.
        </p>
      </div>

      <!-- Course Selector -->
      <div v-if="courses.length > 0" class="course-selector-wrap">
        <label for="select-active-course" class="selector-label">Target Course:</label>
        <select 
          id="select-active-course"
          :value="activeCourseId" 
          @change="$emit('select-course', $event.target.value)"
          class="course-select-input"
        >
          <option v-for="c in courses" :key="c.id" :value="c.id">
            {{ c.title }} ({{ c.subject }})
          </option>
        </select>
      </div>
    </header>

    <!-- Empty Courses Notice -->
    <div v-if="courses.length === 0" class="no-courses-warning">
      <div class="warning-icon-circle">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#c2410c" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <div>
        <h3 class="warning-title">No Courses Created</h3>
        <p class="warning-desc">You must create a course before you can attach and organize learning materials.</p>
      </div>
      <button 
        type="button" 
        class="btn-studio-primary" 
        @click="$emit('navigate', 'create-course')"
      >
        + Create Course
      </button>
    </div>

    <div v-else class="materials-workspace-grid">
      <!-- Left Column: Upload Dropzone & Form -->
      <div class="upload-panel">
        <h2 class="panel-title">Upload Learning Document</h2>
        <p class="panel-desc">
          Files are stored in private Supabase Storage and grounded for curriculum transformation.
        </p>

        <!-- Supported formats badges -->
        <div class="format-badges-row">
          <span class="fmt-badge badge-pdf">PDF</span>
          <span class="fmt-badge badge-pptx">PPTX</span>
          <span class="fmt-badge badge-docx">DOCX</span>
          <span class="fmt-badge badge-txt">TXT</span>
          <span class="fmt-badge badge-md">Markdown</span>
          <span class="fmt-limit">Max 25MB</span>
        </div>

        <form @submit.prevent="handleUpload" class="upload-form">
          <!-- Dropzone -->
          <div 
            class="dropzone-box"
            :class="{ 'is-dragging': isDragging, 'has-file': Boolean(selectedFile) }"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleFileDrop"
            @click="triggerFileInput"
          >
            <input 
              ref="fileInputRef" 
              type="file" 
              class="hidden-file-input" 
              accept=".pdf,.pptx,.ppt,.docx,.doc,.txt,.md,.markdown"
              @change="handleFileSelect"
            />
            <div v-if="!selectedFile" class="dropzone-content">
              <div class="upload-cloud-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <span class="dropzone-main-text">Click to choose file or drag & drop</span>
              <span class="dropzone-sub-text">PDF, PPTX, DOCX, TXT, or MD documents</span>
            </div>

            <div v-else class="selected-file-preview">
              <div class="file-icon-box">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#2563eb" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div class="file-meta-col">
                <span class="selected-file-name">{{ selectedFile.name }}</span>
                <span class="selected-file-size">{{ formatBytes(selectedFile.size) }}</span>
              </div>
              <button 
                type="button" 
                class="btn-clear-file" 
                @click.stop="clearSelectedFile"
                title="Remove selected file"
              >
                &times;
              </button>
            </div>
          </div>

          <!-- Document Title -->
          <div class="form-group">
            <label class="form-label" for="material-title">Document Title <span class="required">*</span></label>
            <input 
              id="material-title"
              v-model="uploadTitle" 
              type="text" 
              class="form-input" 
              placeholder="e.g. Lab 4 — H-Bridge Thermal Ratings & Motor Specs"
              required
            />
          </div>

          <!-- Description -->
          <div class="form-group">
            <label class="form-label" for="material-description">Description / Pedagogical Note</label>
            <textarea 
              id="material-description"
              v-model="uploadDescription" 
              rows="2" 
              class="form-textarea" 
              placeholder="Explain how this document supports lab experiments or student checkpoints..."
            ></textarea>
          </div>

          <!-- Upload Error Banner -->
          <div v-if="localUploadError" class="upload-error-msg">
            {{ localUploadError }}
          </div>

          <button 
            type="submit" 
            class="btn-studio-primary btn-submit-upload" 
            :disabled="!selectedFile || isUploading"
          >
            <span v-if="isUploading">Uploading to Storage...</span>
            <span v-else>Upload to Course Materials</span>
          </button>
        </form>
      </div>

      <!-- Right Column: Materials Repository List -->
      <div class="materials-list-panel">
        <div class="panel-header-row">
          <h2 class="panel-title">Repository Materials ({{ materials.length }})</h2>
          <span v-if="activeCourse" class="course-badge-sub">{{ activeCourse.title }}</span>
        </div>

        <div v-if="isLoading" class="loading-materials">
          <div class="spinner-pulse"></div>
          <span>Retrieving materials from storage...</span>
        </div>

        <div v-else-if="materials.length === 0" class="materials-empty-state">
          <div class="empty-icon-circle">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#64748b" stroke-width="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <h3 class="empty-title">No Materials Uploaded</h3>
          <p class="empty-desc">
            Upload PDF guides, lab worksheets, or lecture slides to enrich this course.
          </p>
        </div>

        <div v-else class="materials-cards-list">
          <div 
            v-for="mat in materials" 
            :key="mat.id" 
            class="material-row-card"
          >
            <div class="mat-left">
              <div class="mat-type-pill" :class="getMimeClass(mat.file_name, mat.mime_type)">
                {{ getExtensionLabel(mat.file_name) }}
              </div>
              <div class="mat-info-col">
                <div class="mat-title-row">
                  <span class="mat-title-text">{{ mat.title }}</span>
                  <span class="mat-status-tag" :class="`status-${mat.status || 'ready'}`">
                    {{ mat.status === 'ready' ? '✓ Studio Ready' : mat.status === 'processing' ? '⟳ Processing...' : mat.status === 'error' ? '✕ Failed' : 'Uploaded' }}
                  </span>
                </div>
                <span class="mat-sub-info">
                  {{ mat.file_name }} • {{ formatBytes(mat.file_size) }} • {{ formatDate(mat.created_at) }}
                </span>
                <p v-if="mat.description" class="mat-desc-preview">{{ mat.description }}</p>
                <p v-if="mat.processing_error" class="mat-error-preview">⚠ {{ mat.processing_error }}</p>
              </div>
            </div>

            <div class="mat-actions">
              <!-- Retry Button if error -->
              <button 
                v-if="mat.status === 'error'"
                type="button" 
                class="btn-mat-action btn-mat-retry" 
                @click="handleRetry(mat)"
                title="Retry content extraction"
              >
                ↻ Retry
              </button>

              <!-- Preview Button -->
              <button 
                type="button" 
                class="btn-mat-action" 
                @click="openPreview(mat)"
                title="Preview document"
              >
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                Preview
              </button>

              <!-- Download Button -->
              <button 
                type="button" 
                class="btn-mat-action" 
                @click="handleDownload(mat)"
                title="Download document"
                :disabled="isGeneratingUrl[mat.id]"
              >
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span v-if="isGeneratingUrl[mat.id]">...</span>
                <span v-else>Download</span>
              </button>

              <!-- Delete Button -->
              <button 
                type="button" 
                class="btn-mat-delete" 
                @click="handleDelete(mat)"
                title="Delete material from course"
              >
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Document Preview Modal -->
    <div v-if="previewDoc" class="preview-modal-overlay" @click="closePreview">
      <div class="preview-modal-card" @click.stop>
        <div class="preview-modal-header">
          <div>
            <h3 class="preview-title">{{ previewDoc.title }}</h3>
            <span class="preview-sub">{{ previewDoc.file_name }} ({{ formatBytes(previewDoc.file_size) }})</span>
          </div>
          <button type="button" class="btn-close-preview" @click="closePreview">&times;</button>
        </div>

        <div class="preview-modal-body">
          <div v-if="previewDoc.description" class="preview-desc-box">
            <strong>Pedagogical Context:</strong>
            <p>{{ previewDoc.description }}</p>
          </div>

          <!-- Document Render Area -->
          <div class="preview-render-area">
            <div class="doc-meta-card">
              <div class="doc-icon-large">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#2563eb" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <h4>{{ previewDoc.file_name }}</h4>
              <p class="doc-mime-label">{{ previewDoc.mime_type || 'application/octet-stream' }}</p>

              <div class="doc-download-cta">
                <a 
                  v-if="downloadUrlMap[previewDoc.id]" 
                  :href="downloadUrlMap[previewDoc.id]" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  class="btn-studio-primary"
                >
                  Download / Open File ↗
                </a>
                <button
                  v-else
                  type="button"
                  class="btn-studio-primary"
                  @click="handleDownload(previewDoc)"
                  :disabled="isGeneratingUrl[previewDoc.id]"
                >
                  <span v-if="isGeneratingUrl[previewDoc.id]">Generating Link...</span>
                  <span v-else>Download / Open Raw File ↗</span>
                </button>
              </div>
            </div>

            <!-- Extracted Content & Pedagogical Outline Preview -->
            <div class="extracted-content-viewer">
              <div class="viewer-head">
                <div class="viewer-title-col">
                  <h4 class="viewer-title">Extracted Document Text & Syllabus Outline</h4>
                  <span class="viewer-sub">Used by RISSE AI to ground curriculum modules and checkpoints</span>
                </div>
                <span class="viewer-status-badge" :class="`badge-${previewDoc.status || 'ready'}`">
                  {{ previewDoc.status === 'ready' ? '✓ Studio Indexed' : previewDoc.status === 'error' ? 'Extraction Failed' : 'Processing' }}
                </span>
              </div>

              <div v-if="previewDoc.extraction_notice" class="viewer-notice-box">
                <span class="notice-icon">ℹ</span>
                <span>{{ previewDoc.extraction_notice }}</span>
              </div>

              <div v-if="previewDoc.extracted_content" class="viewer-text-box">
                <pre class="extracted-pre">{{ previewDoc.extracted_content }}</pre>
              </div>

              <div v-else-if="previewDoc.processing_error" class="viewer-error-box">
                <p class="error-text">Extraction Issue: {{ previewDoc.processing_error }}</p>
                <button type="button" class="btn-studio-secondary" @click="handleRetry(previewDoc)">
                  ↻ Retry Document Extraction
                </button>
              </div>

              <div v-else class="viewer-empty-box">
                <p>No textual outline generated yet. Click retry to re-extract content streams.</p>
                <button type="button" class="btn-studio-secondary" @click="handleRetry(previewDoc)">
                  ↻ Re-Index Document
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useMentorStore } from '../../../stores/mentorStore.js';

const mentorStore = useMentorStore();

const props = defineProps({
  courses: {
    type: Array,
    default: () => [],
  },
  activeCourseId: {
    type: String,
    default: null,
  },
  activeCourse: {
    type: Object,
    default: null,
  },
  materials: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  isUploading: {
    type: Boolean,
    default: false,
  },
  uploaderId: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(['navigate', 'select-course', 'upload-material', 'delete-material']);

const fileInputRef = ref(null);
const selectedFile = ref(null);
const uploadTitle = ref('');
const uploadDescription = ref('');
const isDragging = ref(false);
const localUploadError = ref(null);
const previewDoc = ref(null);

function triggerFileInput() {
  if (fileInputRef.value) {
    fileInputRef.value.click();
  }
}

function handleFileSelect(e) {
  const file = e.target.files?.[0];
  if (file) {
    setFile(file);
  }
}

function handleFileDrop(e) {
  isDragging.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) {
    setFile(file);
  }
}

function setFile(file) {
  localUploadError.value = null;
  const maxBytes = 25 * 1024 * 1024;
  if (file.size > maxBytes) {
    localUploadError.value = `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of 25MB.`;
    return;
  }
  selectedFile.value = file;
  if (!uploadTitle.value) {
    const rawName = file.name.replace(/\.[^/.]+$/, '');
    uploadTitle.value = rawName.replace(/[-_]/g, ' ');
  }
}

function clearSelectedFile() {
  selectedFile.value = null;
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
}

const downloadUrlMap = ref({});
const isGeneratingUrl = ref({});

function handleUpload() {
  if (!props.activeCourseId) {
    localUploadError.value = 'Please select or create an active target course before uploading materials.';
    return;
  }
  if (!selectedFile.value) {
    localUploadError.value = 'Please select a document file to upload.';
    return;
  }
  if (!uploadTitle.value.trim()) {
    localUploadError.value = 'Document title is required.';
    return;
  }

  emit('upload-material', {
    file: selectedFile.value,
    title: uploadTitle.value.trim(),
    description: uploadDescription.value.trim(),
    courseId: props.activeCourseId,
    uploaderId: props.uploaderId,
  });

  clearSelectedFile();
  uploadTitle.value = '';
  uploadDescription.value = '';
  localUploadError.value = null;
}

async function handleDownload(mat) {
  if (!mat) return;
  if (downloadUrlMap.value[mat.id]) {
    window.open(downloadUrlMap.value[mat.id], '_blank');
    return;
  }
  isGeneratingUrl.value[mat.id] = true;
  try {
    const res = await mentorStore.getMaterialDownloadUrl(mat);
    if (res.success && res.url) {
      downloadUrlMap.value[mat.id] = res.url;
      window.open(res.url, '_blank');
    } else {
      localUploadError.value = res.error || 'Failed to retrieve download link.';
    }
  } catch (err) {
    localUploadError.value = err.message || 'Download error.';
  } finally {
    isGeneratingUrl.value[mat.id] = false;
  }
}

async function openPreview(mat) {
  previewDoc.value = mat;
  if (mat && !downloadUrlMap.value[mat.id]) {
    try {
      const res = await mentorStore.getMaterialDownloadUrl(mat);
      if (res.success && res.url) {
        downloadUrlMap.value[mat.id] = res.url;
      }
    } catch (_) {}
  }
}

function handleDelete(mat) {
  if (!mat) return;
  const confirmed = window.confirm(`Are you sure you want to delete "${mat.title || mat.file_name}"? This will permanently remove the file from storage and course materials.`);
  if (confirmed) {
    emit('delete-material', mat.id);
  }
}

function closePreview() {
  previewDoc.value = null;
}

async function handleRetry(mat) {
  if (!mat) return;
  try {
    const res = await mentorStore.retryProcessMaterial(mat.id, props.uploaderId);
    if (res.success && res.material) {
      if (previewDoc.value && previewDoc.value.id === mat.id) {
        previewDoc.value = { ...previewDoc.value, ...res.material };
      }
    } else {
      localUploadError.value = res.error || 'Retry failed.';
    }
  } catch (err) {
    localUploadError.value = err.message || 'Retry failed.';
  }
}

function getExtensionLabel(fileName) {
  if (!fileName) return 'DOC';
  const ext = fileName.split('.').pop().toUpperCase();
  return ext || 'DOC';
}

function getMimeClass(fileName, mimeType) {
  const ext = (fileName || '').split('.').pop().toLowerCase();
  if (ext === 'pdf' || (mimeType && mimeType.includes('pdf'))) return 'mime-pdf';
  if (['pptx', 'ppt'].includes(ext) || (mimeType && mimeType.includes('presentation'))) return 'mime-pptx';
  if (['docx', 'doc'].includes(ext) || (mimeType && mimeType.includes('word'))) return 'mime-docx';
  if (['md', 'markdown'].includes(ext)) return 'mime-md';
  return 'mime-txt';
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
</script>

<style scoped>
.course-materials-page {
  padding: 8px 12px 36px 8px;
  width: 100%;
  box-sizing: border-box;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 14px;
  gap: 14px;
  flex-wrap: wrap;
}

.page-title {
  font-family: var(--font-family-display, inherit);
  font-size: 22px;
  font-weight: 700;
  color: var(--text-heading, #111827);
  letter-spacing: -0.01em;
  margin: 0 0 3px 0;
}

.page-subtitle {
  font-size: 13px;
  color: var(--text-muted, #64748b);
  margin: 0;
  max-width: 600px;
}

.course-selector-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #ffffff;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.selector-label {
  font-size: 11.5px;
  font-weight: 600;
  color: #475569;
}

.course-select-input {
  background: #ffffff;
  color: #111827;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 5px 10px;
  font-size: 12.5px;
  outline: none;
}

.course-select-input:focus {
  border-color: var(--primary-orange, #F18701);
}

.no-courses-warning {
  background: #fff7ed;
  border: 1px dashed #fed7aa;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.warning-icon-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #ffedd5;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.warning-title { font-size: 15px; font-weight: 700; color: #9a3412; margin: 0 0 2px 0; }
.warning-desc { font-size: 12.5px; color: #c2410c; margin: 0; }

/* 2 Columns Grid */
.materials-workspace-grid {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 14px;
}

@media (max-width: 960px) {
  .materials-workspace-grid {
    grid-template-columns: 1fr;
  }
}

.upload-panel, .materials-list-panel {
  background: #ffffff;
  border: 1px solid var(--border-card, #eef1f4);
  border-radius: 12px;
  padding: 16px 18px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.panel-title {
  font-size: 14.5px;
  font-weight: 700;
  color: var(--text-heading, #111827);
  margin: 0 0 3px 0;
}

.panel-desc {
  font-size: 12px;
  color: var(--text-muted, #64748b);
  margin: 0 0 12px 0;
  line-height: 1.35;
}

.format-badges-row {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.fmt-badge {
  font-size: 9.5px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
}

.badge-pdf { background: #fee2e2; color: #b91c1c; }
.badge-pptx { background: #ffedd5; color: #c2410c; }
.badge-docx { background: #dbeafe; color: #1d4ed8; }
.badge-txt { background: #f1f5f9; color: #475569; }
.badge-md { background: #f3e8ff; color: #7e22ce; }
.fmt-limit { font-size: 10.5px; color: #94a3b8; margin-left: auto; }

/* Dropzone */
.dropzone-box {
  border: 1.5px dashed #cbd5e1;
  border-radius: 8px;
  padding: 18px 12px;
  text-align: center;
  cursor: pointer;
  background: #f8fafc;
  transition: all 0.12s ease;
  margin-bottom: 12px;
}

.dropzone-box:hover, .dropzone-box.is-dragging {
  border-color: var(--primary-orange, #F18701);
  background: #fff7ed;
}

.hidden-file-input { display: none; }

.upload-cloud-icon {
  color: var(--primary-orange, #F18701);
  margin-bottom: 4px;
}

.dropzone-main-text {
  display: block;
  font-size: 12.5px;
  font-weight: 600;
  color: #111827;
}

.dropzone-sub-text {
  display: block;
  font-size: 10.5px;
  color: #64748b;
  margin-top: 2px;
}

.selected-file-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: left;
}

.file-icon-box {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.file-meta-col { flex: 1; overflow: hidden; }
.selected-file-name {
  display: block;
  font-size: 12.5px;
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.selected-file-size { font-size: 10.5px; color: #15803d; font-weight: 600; }

.btn-clear-file {
  background: transparent;
  border: none;
  font-size: 16px;
  color: #9ca3af;
  cursor: pointer;
  padding: 2px;
}

.btn-clear-file:hover { color: #dc2626; }

.form-group {
  margin-bottom: 10px;
}

.form-label {
  display: block;
  font-size: 11.5px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 3px;
}

.required { color: #ef4444; }

.form-input, .form-textarea {
  width: 100%;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 7px 10px;
  color: #111827;
  font-size: 12.5px;
  font-family: inherit;
  box-sizing: border-box;
  transition: border-color 0.15s ease;
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: var(--primary-orange, #F18701);
}

.upload-error-msg {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 11.5px;
  margin-bottom: 10px;
}

.btn-submit-upload {
  width: 100%;
  justify-content: center;
}

.btn-studio-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--primary-orange, #F18701);
  color: #ffffff;
  border: none;
  border-radius: 6px;
  padding: 7px 14px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(241, 135, 1, 0.2);
  transition: all 0.15s ease;
}

.btn-studio-primary:hover {
  background: var(--primary-orange-hover, #ff8c1a);
}

.btn-studio-primary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* Right Panel: Repository */
.panel-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.course-badge-sub {
  font-size: 10.5px;
  color: #c2410c;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  padding: 2px 7px;
  border-radius: 4px;
  font-weight: 600;
}

.materials-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 36px 16px;
  text-align: center;
}

.empty-icon-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}

.empty-title { font-size: 14.5px; font-weight: 700; color: #111827; margin: 0 0 3px 0; }
.empty-desc { font-size: 12px; color: #64748b; margin: 0; }

.materials-cards-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.material-row-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: #ffffff;
  border: 1px solid #f1f5f9;
  border-radius: 8px;
  gap: 12px;
  transition: all 0.12s ease;
}

.material-row-card:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.mat-left {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex: 1;
  overflow: hidden;
}

.mat-type-pill {
  font-size: 9.5px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0.05em;
  flex-shrink: 0;
}

.mime-pdf { background: #fee2e2; color: #b91c1c; }
.mime-pptx { background: #ffedd5; color: #c2410c; }
.mime-docx { background: #dbeafe; color: #1d4ed8; }
.mime-md { background: #f3e8ff; color: #7e22ce; }
.mime-txt { background: #f1f5f9; color: #475569; }

.mat-info-col {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.mat-title-text {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mat-sub-info {
  font-size: 10.5px;
  color: #64748b;
}

.mat-desc-preview {
  font-size: 11px;
  color: #64748b;
  margin: 2px 0 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mat-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-mat-action {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #ffffff;
  border: 1px solid #d1d5db;
  color: #374151;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.12s ease;
}

.btn-mat-action:hover {
  background: #f9fafb;
  border-color: #9ca3af;
  color: #111827;
}

.btn-mat-delete {
  background: #ffffff;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 4px 6px;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.12s ease;
}

.btn-mat-delete:hover {
  background: #fef2f2;
}

/* Modal */
.preview-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 20px;
}

.preview-modal-card {
  background: #ffffff;
  border: 1px solid var(--border-card, #eef1f4);
  border-radius: 14px;
  width: 100%;
  max-width: 600px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.preview-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #f1f5f9;
}

.preview-title { font-size: 15px; font-weight: 700; color: #111827; margin: 0; }
.preview-sub { font-size: 11px; color: #64748b; }

.btn-close-preview {
  background: transparent;
  border: none;
  font-size: 20px;
  color: #9ca3af;
  cursor: pointer;
}

.btn-close-preview:hover { color: #111827; }

.preview-modal-body {
  padding: 16px 18px;
  overflow-y: auto;
}

.preview-desc-box {
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 14px;
  font-size: 12px;
  color: #475569;
}

.preview-desc-box strong { color: #111827; }
.preview-desc-box p { margin: 2px 0 0 0; }

.preview-render-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 12px;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  text-align: center;
}

.doc-meta-card h4 { font-size: 14px; font-weight: 700; color: #111827; margin: 8px 0 2px 0; }
.doc-mime-label { font-size: 11px; color: #64748b; margin: 0 0 14px 0; }

.mat-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mat-status-tag {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
}

.status-ready {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.status-processing {
  background: #fef3c7;
  color: #d97706;
  border: 1px solid #fde68a;
}

.status-error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.status-uploaded {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
}

.mat-error-preview {
  font-size: 11px;
  color: #dc2626;
  margin: 3px 0 0 0;
}

.btn-mat-retry {
  background: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
  font-weight: 700;
}

.btn-mat-retry:hover {
  background: #dc2626;
  color: #ffffff;
}

.extracted-content-viewer {
  width: 100%;
  margin-top: 16px;
  border-top: 1px solid #e2e8f0;
  padding-top: 14px;
  text-align: left;
}

.viewer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.viewer-title-col {
  display: flex;
  flex-direction: column;
}

.viewer-title {
  font-size: 12.5px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.viewer-sub {
  font-size: 10.5px;
  color: #64748b;
}

.viewer-status-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
}

.badge-ready {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.badge-error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.viewer-notice-box {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 11px;
  color: #1e40af;
  margin-bottom: 10px;
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

.notice-icon {
  font-weight: 700;
}

.viewer-text-box {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 10px;
  max-height: 240px;
  overflow-y: auto;
}

.extracted-pre {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  color: #334155;
  white-space: pre-wrap;
  margin: 0;
  line-height: 1.45;
}

.viewer-error-box,
.viewer-empty-box {
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 6px;
  padding: 12px;
  text-align: center;
  font-size: 11.5px;
  color: #64748b;
}

.error-text {
  color: #dc2626;
  margin: 0 0 8px 0;
  font-weight: 600;
}
</style>