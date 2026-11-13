<!-- frontend/resources/js/views/mentor/curriculum/LearningPathEditor.vue -->
<!--
  Teacher-facing, READ-ONLY view of a module's learning path (Phase 1).

  - Lists every node in its current order with title, summary, duration, activities and checkpoints.
  - Lets the teacher inspect a node's content inline.
  - Holds the adjacent-node selection that Phase 2's "Combine Nodes" will consume.

  It never mutates `nodes`. Reordering / duplicating / deleting stay in the existing card view.
-->
<template>
  <section class="lpe" aria-label="Learning path">
    <div class="lpe-bar">
      <div class="lpe-bar-text">
        <strong>{{ nodes.length }} node{{ nodes.length === 1 ? '' : 's' }}</strong>
        <span class="lpe-total" v-if="totalMinutes"> · about {{ totalMinutes }} min total</span>
        <span class="lpe-hint"> — tick adjacent nodes to prepare them for combining.</span>
      </div>
      <div class="lpe-bar-actions">
        <span v-if="selectedIndices.length" class="lpe-sel-summary" aria-live="polite">
          {{ selectionLabel }}
        </span>
        <button v-if="selectedIndices.length" type="button" class="lpe-btn" @click="clearSelection">Clear selection</button>
        <button
          type="button" class="lpe-btn lpe-btn-primary" disabled
          :title="canCombine ? 'Combining nodes arrives in the next phase.' : 'Select two or more adjacent nodes.'"
        >Combine Nodes</button>
      </div>
    </div>

    <p v-if="notice" class="lpe-notice" role="status" aria-live="polite">{{ notice }}</p>

    <ol class="lpe-list">
      <li
        v-for="d in rows" :key="d.key" class="lpe-row"
        :class="{ 'is-selected': isSelected(d.index), 'is-open': open.has(d.key) }"
      >
        <div class="lpe-main">
          <label class="lpe-check" :class="{ 'is-blocked': !allowed(d.index) }">
            <input
              type="checkbox" :checked="isSelected(d.index)"
              :aria-label="`Select node ${d.number} for combining`"
              :aria-disabled="!allowed(d.index)"
              @click.prevent="toggle(d.index)"
            />
          </label>

          <span class="lpe-num">{{ String(d.number).padStart(2, '0') }}</span>

          <div class="lpe-info">
            <div class="lpe-title-row">
              <span class="lpe-type" :class="`type-${d.type}`">{{ typeLabel(d.type) }}</span>
              <h4 class="lpe-title">{{ d.title }}</h4>
            </div>
            <p class="lpe-summary">{{ d.summary || 'No summary available.' }}</p>
            <div class="lpe-chips">
              <span v-if="d.topicGroup" class="lpe-chip">{{ d.topicGroup }}</span>
              <span class="lpe-chip">⏱ {{ d.minutes ? `${d.minutes} min` : 'Duration not set' }}</span>
              <span v-if="d.activities.length" class="lpe-chip lpe-chip-activity">{{ d.activities.length }} activit{{ d.activities.length === 1 ? 'y' : 'ies' }}</span>
              <span v-for="cp in d.checkpoints" :key="cp.kind" class="lpe-chip lpe-chip-cp">⚑ {{ cp.label }}</span>
              <span v-if="d.imageCount" class="lpe-chip" title="Image blocks are stored on this node, but the student lesson view does not render images yet.">🖼 {{ d.imageCount }}</span>
              <span class="lpe-chip" :class="d.hasContent ? 'lpe-ok' : 'lpe-warn'">{{ d.hasContent ? 'Content ready' : 'Needs content' }}</span>
            </div>
          </div>

          <div class="lpe-actions">
            <button type="button" class="lpe-btn" :aria-expanded="open.has(d.key)" @click="toggleOpen(d.key)">
              {{ open.has(d.key) ? 'Hide' : 'Inspect' }}
            </button>
            <button type="button" class="lpe-btn" title="Open the student preview at this node" @click="$emit('preview-node', d.index)">👁 Preview</button>
            <button type="button" class="lpe-btn" @click="$emit('edit-node', d.index)">Edit →</button>
          </div>
        </div>

        <div v-if="open.has(d.key)" class="lpe-detail">
          <template v-for="s in detailSections(nodes[d.index])" :key="s.label">
            <h5>{{ s.label }}</h5>
            <ul v-if="Array.isArray(s.value)"><li v-for="(v, i) in s.value" :key="i">{{ v }}</li></ul>
            <p v-else>{{ s.value }}</p>
          </template>
          <p v-if="!detailSections(nodes[d.index]).length" class="lpe-muted">This node has no content yet.</p>
        </div>
      </li>
    </ol>
  </section>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import {
  describeNode, nodeKey, nodeCheckpoints, normalizeContentForDisplay, nodeQuestions, nodeBlocks,
  isContiguous, toggleAdjacentSelection, nodeMinutes, nodeActivities,
} from './modulePreview.js';

const props = defineProps({
  nodes: { type: Array, default: () => [] }, // already in display order
});
const emit = defineEmits(['preview-node', 'edit-node', 'selection-change']);

const rows = computed(() => props.nodes.map((n, i) => describeNode(n, i)));
const totalMinutes = computed(() => props.nodes.reduce((sum, n) => sum + (nodeMinutes(n) || 0), 0));

// ── Selection state ─────────────────────────────────────────────────────────
// Held as node keys (survive reordering); positions are re-derived from the current order.
const selectedKeys = ref([]);
const notice = ref('');

const keyOf = i => nodeKey(props.nodes[i], i);
const selectedIndices = computed(() =>
  selectedKeys.value.map(k => rows.value.findIndex(r => r.key === k)).filter(i => i >= 0).sort((a, b) => a - b)
);
const canCombine = computed(() => selectedIndices.value.length >= 2 && isContiguous(selectedIndices.value));
const isSelected = i => selectedKeys.value.includes(keyOf(i));
const allowed = i => toggleAdjacentSelection(selectedIndices.value, i, props.nodes.length).ok;

const selectionLabel = computed(() => {
  const idx = selectedIndices.value;
  const n = x => String(x + 1).padStart(2, '0');
  if (idx.length === 1) return `Node ${n(idx[0])} selected — pick an adjacent node to combine.`;
  return `${idx.length} adjacent nodes selected (Node ${n(idx[0])}–${n(idx[idx.length - 1])})`;
});

function toggle(i) {
  const res = toggleAdjacentSelection(selectedIndices.value, i, props.nodes.length);
  if (!res.ok) {
    notice.value = res.reason;
    return;
  }
  notice.value = '';
  selectedKeys.value = res.indices.map(keyOf); // ascending = original order
}

function clearSelection() {
  selectedKeys.value = [];
  notice.value = '';
}

// If the node list changes underneath us (reorder, delete, duplicate), keep the selection only while it is still valid.
watch(() => props.nodes.map((n, i) => nodeKey(n, i)).join('|'), () => {
  const idx = selectedIndices.value;
  const lost = idx.length !== selectedKeys.value.length;
  if (selectedKeys.value.length && (lost || !isContiguous(idx))) {
    clearSelection();
    notice.value = 'Node order changed, so the selection was cleared.';
  }
});

// Payload for Phase 2: ids + positions + the nodes themselves, always in original order.
watch(selectedIndices, idx => {
  emit('selection-change', {
    indices: [...idx],
    nodeIds: idx.map(i => props.nodes[i]?.id ?? null),
    keys: idx.map(keyOf),
    nodes: idx.map(i => props.nodes[i]),
    isValid: idx.length >= 2 && isContiguous(idx),
  });
}, { immediate: true });

defineExpose({ clearSelection });

// ── Inspect ─────────────────────────────────────────────────────────────────
const open = ref(new Set());
function toggleOpen(key) {
  const next = new Set(open.value);
  next.has(key) ? next.delete(key) : next.add(key);
  open.value = next;
}

function detailSections(node) {
  const c = normalizeContentForDisplay(node);
  const out = [];
  const add = (label, value) => {
    if (Array.isArray(value) ? value.length : value) out.push({ label, value });
  };
  add('Learning objectives', c.objectives);
  add('Introduction', c.overview);
  add('Lesson', c.guide);
  add('Key concepts', c.concepts.map(k => (k.explanation ? `${k.concept || k.title}: ${k.explanation}` : (k.concept || k.title || String(k)))));
  add('Activities', nodeActivities(node));
  add('Challenges', c.challenges.map(x => (typeof x === 'string' ? x : x?.title || x?.text || '')).filter(Boolean));
  add('Checkpoints', nodeCheckpoints(node).map(cp => `${cp.label}: ${cp.text}${cp.gates ? ' (required to unlock next node)' : ''}`));
  const qs = nodeQuestions(node);
  add('Questions', qs.map(q => q.question || q.prompt || q.text).filter(Boolean));
  const blocks = nodeBlocks(node);
  add('Content blocks', blocks.map(b => `${b.type || 'text'}${b.title ? ` — ${b.title}` : ''}`));
  if (node?.source_reference) add('Source', `${node.source_reference.section || ''} > ${node.source_reference.heading || ''}`);
  return out;
}

const LABELS = { concept: 'Concept', demonstration: 'Demonstration', guided_practice: 'Guided Practice', lab: 'Laboratory', challenge: 'Challenge', assessment: 'Assessment', project: 'Project' };
const typeLabel = t => LABELS[t] || 'Concept';
</script>

<style scoped>
.lpe { margin-bottom: 24px; }
.lpe-bar { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 10px; font-size: 13px; color: #334155; }
.lpe-hint, .lpe-total { color: #64748b; }
.lpe-bar-actions { display: flex; align-items: center; gap: 8px; }
.lpe-sel-summary { font-size: 12px; font-weight: 700; color: #c2410c; }
.lpe-notice { margin: 0 0 10px; padding: 8px 12px; background: #fffbeb; border: 1px solid #fde68a; color: #92400e; border-radius: 8px; font-size: 13px; }
.lpe-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.lpe-row { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; box-shadow: 0 1px 2px rgba(0,0,0,.03); }
.lpe-row.is-selected { border-color: #ff6b00; background: #fffaf5; }
.lpe-main { display: flex; gap: 14px; align-items: flex-start; padding: 14px 18px; }
.lpe-check { display: flex; padding-top: 4px; cursor: pointer; }
.lpe-check.is-blocked { opacity: .35; cursor: not-allowed; }
.lpe-check input { width: 16px; height: 16px; accent-color: #ff6b00; cursor: inherit; }
.lpe-num { font-size: 12px; font-weight: 800; color: #475569; background: #f1f5f9; border-radius: 6px; padding: 4px 8px; margin-top: 1px; }
.lpe-row.is-selected .lpe-num { background: #ff6b00; color: #fff; }
.lpe-info { flex: 1; min-width: 0; }
.lpe-title-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.lpe-title { margin: 0; font-size: 15px; font-weight: 800; color: #0f172a; }
.lpe-type { font-size: 10px; font-weight: 800; text-transform: uppercase; background: #eff6ff; color: #1d4ed8; padding: 2px 6px; border-radius: 4px; }
.lpe-type.type-lab { background: #fff7ed; color: #c2410c; }
.lpe-type.type-challenge { background: #fef2f2; color: #b91c1c; }
.lpe-type.type-assessment { background: #f0fdf4; color: #15803d; }
.lpe-summary { margin: 4px 0 8px; font-size: 13px; color: #475569; }
.lpe-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.lpe-chip { font-size: 11px; font-weight: 600; color: #475569; background: #f1f5f9; padding: 2px 8px; border-radius: 999px; }
.lpe-chip-activity { background: #eef2ff; color: #4338ca; }
.lpe-chip-cp { background: #fff7ed; color: #c2410c; }
.lpe-ok { background: #f0fdf4; color: #15803d; }
.lpe-warn { background: #fffbeb; color: #b45309; }
.lpe-actions { display: flex; gap: 6px; flex-shrink: 0; }
.lpe-btn { background: #fff; border: 1px solid #cbd5e1; color: #334155; font-size: 12px; font-weight: 600; padding: 6px 10px; border-radius: 6px; cursor: pointer; }
.lpe-btn:hover:not(:disabled) { background: #f8fafc; border-color: #94a3b8; }
.lpe-btn:disabled { opacity: .5; cursor: not-allowed; }
.lpe-btn-primary { background: #ff6b00; border-color: #ff6b00; color: #fff; }
.lpe-btn-primary:hover:not(:disabled) { background: #e65c00; }
.lpe-detail { border-top: 1px solid #e2e8f0; padding: 12px 18px 14px 70px; background: #f8fafc; border-radius: 0 0 10px 10px; font-size: 13px; color: #334155; }
.lpe-detail h5 { margin: 10px 0 2px; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; }
.lpe-detail h5:first-child { margin-top: 0; }
.lpe-detail p { margin: 0; white-space: pre-wrap; }
.lpe-detail ul { margin: 0; padding-left: 18px; }
.lpe-muted { color: #64748b; }
@media (max-width: 760px) { .lpe-main { flex-wrap: wrap; } .lpe-actions { width: 100%; } .lpe-detail { padding-left: 18px; } }
</style>