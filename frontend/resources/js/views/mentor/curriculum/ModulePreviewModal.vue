<!-- frontend/resources/js/views/mentor/curriculum/ModulePreviewModal.vue -->
<!--
  Teacher-facing "Preview as Student".

  Read-only by construction: this component imports no store, no service and no Supabase client,
  and emits only `close`. The lesson itself is the real student component, run with previewMode.
  It works on a deep-cloned snapshot of the nodes taken when it opens, so the editor's data
  cannot be mutated from here.

  The left rail is the teacher's learning-path layout. ModuleRoadmapView (the student constellation
  map) is deliberately NOT used: it writes progress (/api/modules/progress, StudentSyncService),
  awards badges, and locks nodes by progress, none of which a preview should do.
-->
<template>
  <div class="mp-overlay" @click.self="$emit('close')">
    <div class="mp-card" role="dialog" aria-modal="true" aria-labelledby="mp-title">
      <header class="mp-header">
        <div class="mp-header-main">
          <span class="mp-pill">STUDENT PREVIEW</span>
          <h3 id="mp-title" class="mp-title">{{ moduleTitle || 'Untitled module' }}</h3>
          <p class="mp-sub">
            Preview only — nothing here is saved, scored, or visible to students.
            <span v-if="hasUnsavedChanges" class="mp-dirty">Includes your unsaved edits.</span>
          </p>
        </div>
        <div class="mp-header-actions">
          <button type="button" class="mp-btn" @click="railOpen = !railOpen">{{ railOpen ? 'Hide path' : 'Show path' }}</button>
          <button type="button" class="mp-close" aria-label="Close preview" @click="$emit('close')">&times;</button>
        </div>
      </header>

      <div v-if="!nodes.length" class="mp-empty">This module has no learning nodes yet.</div>

      <div v-else class="mp-body">
        <nav v-show="railOpen" class="mp-rail" aria-label="Learning path">
          <div class="mp-progress" aria-hidden="true">
            <div class="mp-progress-bar" :style="{ width: `${((index + 1) / nodes.length) * 100}%` }"></div>
          </div>
          <p class="mp-step">Step {{ index + 1 }} of {{ nodes.length }}</p>
          <ol class="mp-list">
            <li v-for="(d, i) in described" :key="d.key">
              <button type="button" class="mp-item" :class="{ active: i === index }" :aria-current="i === index ? 'step' : undefined" @click="index = i">
                <span class="mp-num">{{ String(d.number).padStart(2, '0') }}</span>
                <span class="mp-item-text">
                  <span class="mp-item-title">{{ d.title }}</span>
                  <span class="mp-item-meta">
                    {{ typeLabel(d.type) }}<template v-if="d.minutes"> · {{ d.minutes }}m</template>
                    <template v-if="d.checkpoints.length"> · ⚑ checkpoint</template>
                  </span>
                </span>
              </button>
            </li>
          </ol>
        </nav>

        <main class="mp-main">
          <PreviewNodeBody
            :key="described[index].key"
            :nodes="nodes"
            :index="index"
            :module-title="moduleTitle"
            :module-id="moduleId"
            :description="description"
            @back="$emit('close')"
            @notify="showNotice"
          />
          <div v-if="notice" class="mp-toast" role="status" aria-live="polite">{{ notice }}</div>
        </main>
      </div>

      <footer class="mp-footer">
        <button type="button" class="mp-btn" :disabled="index <= 0" @click="go(-1)">← Previous node</button>
        <button type="button" class="mp-btn" :disabled="index >= nodes.length - 1" @click="go(1)">Next node →</button>
        <span class="mp-spacer"></span>
        <button type="button" class="mp-btn" @click="$emit('close')">Close Preview</button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import PreviewNodeBody from './PreviewNodeBody.vue';
import { describeNode } from './modulePreview.js';

const props = defineProps({
  nodes: { type: Array, default: () => [] },
  moduleTitle: { type: String, default: '' },
  moduleId: { type: [String, Number], default: null },
  description: { type: String, default: '' },
  startIndex: { type: Number, default: 0 },
  hasUnsavedChanges: { type: Boolean, default: false },
});
defineEmits(['close']);

// Snapshot: the preview never holds a reference to the editor's live objects.
const nodes = JSON.parse(JSON.stringify(props.nodes || []));
const index = ref(Math.min(Math.max(props.startIndex || 0, 0), Math.max(nodes.length - 1, 0)));
const railOpen = ref(true);

const described = computed(() => nodes.map((n, i) => describeNode(n, i)));

const LABELS = { concept: 'Concept', demonstration: 'Demonstration', guided_practice: 'Guided Practice', lab: 'Laboratory', challenge: 'Challenge', assessment: 'Assessment', project: 'Project' };
const typeLabel = t => LABELS[t] || 'Concept';

function go(delta) {
  index.value = Math.min(Math.max(index.value + delta, 0), nodes.length - 1);
}

// The student component reports through `notify`; show it locally instead of the app's toast.
const notice = ref('');
let noticeTimer = null;
function showNotice(msg) {
  notice.value = String(msg || '');
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => { notice.value = ''; }, 3500);
}

function onKey(e) {
  const tag = (e.target?.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
  if (e.key === 'ArrowLeft') go(-1);
  else if (e.key === 'ArrowRight') go(1);
}
onMounted(() => window.addEventListener('keydown', onKey));
onUnmounted(() => { window.removeEventListener('keydown', onKey); clearTimeout(noticeTimer); });
</script>

<style scoped>
.mp-overlay { position: fixed; inset: 0; background: rgba(15,23,42,.6); display: flex; align-items: center; justify-content: center; z-index: 5000; padding: 16px; }
.mp-pill { font-size: 10px; font-weight: 800; background: #eff6ff; color: #1d4ed8; padding: 2px 6px; border-radius: 4px; }
.mp-close { background: none; border: none; font-size: 24px; color: #94a3b8; cursor: pointer; }
.mp-btn { background: #fff; border: 1px solid #cbd5e1; color: #334155; font-size: 13px; font-weight: 600; padding: 8px 14px; border-radius: 6px; cursor: pointer; }
.mp-btn:hover:not(:disabled) { background: #f8fafc; border-color: #94a3b8; color: #0f172a; }
.mp-btn:disabled { opacity: .5; cursor: not-allowed; }
/* Wide on purpose: the student lesson page is a two-column layout (lesson + 410px tutor panel). */
.mp-card { background: #fff; border-radius: 12px; width: 100%; max-width: min(1680px, 98vw); height: 94vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,.2); }
.mp-header { padding: 12px 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.mp-header-actions { display: flex; align-items: center; gap: 8px; }
.mp-title { margin: 4px 0 2px; font-size: 18px; font-weight: 800; }
.mp-sub { margin: 0; font-size: 12px; color: #64748b; }
.mp-dirty { color: #b45309; font-weight: 700; margin-left: 6px; }
.mp-empty { padding: 48px; text-align: center; color: #64748b; flex: 1; }
.mp-body { display: flex; flex: 1; min-height: 0; }
.mp-rail { width: 250px; flex-shrink: 0; border-right: 1px solid #e2e8f0; background: #f8fafc; display: flex; flex-direction: column; min-height: 0; }
.mp-progress { height: 4px; background: #e2e8f0; }
.mp-progress-bar { height: 100%; background: #ff6b00; transition: width .2s ease; }
.mp-step { margin: 10px 16px 6px; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; }
.mp-list { list-style: none; margin: 0; padding: 0 8px 12px; overflow-y: auto; }
.mp-item { width: 100%; display: flex; gap: 10px; align-items: flex-start; text-align: left; padding: 8px 10px; border: 1px solid transparent; background: transparent; border-radius: 8px; cursor: pointer; }
.mp-item:hover { background: #fff; }
.mp-item.active { background: #fff; border-color: #ff6b00; box-shadow: 0 1px 3px rgba(0,0,0,.06); }
.mp-num { font-size: 11px; font-weight: 800; color: #64748b; background: #e2e8f0; border-radius: 4px; padding: 2px 6px; margin-top: 2px; }
.mp-item.active .mp-num { background: #ff6b00; color: #fff; }
.mp-item-text { display: flex; flex-direction: column; min-width: 0; }
.mp-item-title { font-size: 13px; font-weight: 700; color: #0f172a; }
.mp-item-meta { font-size: 11px; color: #64748b; }
/* Positioning context for PreviewNodeBody, which fills this box (the student page needs a definite height). */
.mp-main { position: relative; flex: 1; min-width: 0; min-height: 0; background: #f9fafb; }
.mp-main :deep(.checkpoint-page-container) { padding: 20px 24px; }
.mp-toast { position: absolute; left: 50%; bottom: 16px; transform: translateX(-50%); background: #0f172a; color: #fff; font-size: 13px; padding: 8px 14px; border-radius: 8px; z-index: 5; max-width: 80%; }
.mp-footer { padding: 10px 20px; border-top: 1px solid #e2e8f0; display: flex; gap: 8px; align-items: center; }
.mp-spacer { flex: 1; }
@media (max-width: 760px) { .mp-body { flex-direction: column; } .mp-rail { width: auto; max-height: 160px; border-right: 0; border-bottom: 1px solid #e2e8f0; } }
</style>