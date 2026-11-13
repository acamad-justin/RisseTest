<template>
  <div
    class="lesson-document"
    :class="{
      'lesson-document--editable': editable,
      'lesson-document--student': !editable,
    }"
    :style="documentStyle"
  >
    <div
      ref="canvasRef"
      class="lesson-document__canvas"
      :contenteditable="editable && !selectedId ? 'true' : 'false'"
      :spellcheck="editable ? 'true' : 'false'"
      @input="onFlowInput"
      @blur="onFlowBlur"
      @click="onCanvasClick"
    >
      <template v-for="(segment, index) in segments" :key="segment.type === 'float' ? segment.float.id : 'flow-' + segment.index">
        <!-- Continuous document text: rendered as document prose, never as a card. -->
        <div
          v-if="segment.type === 'flow'"
          class="lesson-document__node"
          :data-flow-index="segment.index"
          v-html="segment.html"
        ></div>

        <!-- Independent element, participating in the document's layout. -->
        <div
          v-else
          class="lesson-float"
          :class="floatClasses(segment.float)"
          :style="floatStyle(segment.float)"
          :data-float-id="segment.float.id"
          :contenteditable="'false'"
          @click.stop="selectFloat(segment.float, $event)"
        >
          <component :is="renderFloat(segment.float)" />
        </div>
      </template>

      <!-- Explicit overlap only: taken out of the flow and layered on the canvas. -->
      <div
        v-for="float in overlays"
        :key="'overlay-' + float.id"
        class="lesson-float lesson-float--overlay"
        :class="[floatClasses(float), { 'is-selected': float.id === selectedId }]"
        :style="overlayStyle(float)"
        :data-float-id="float.id"
        :contenteditable="'false'"
        @click.stop="selectFloat(float, $event)"
      >
        <component :is="renderFloat(float)" />
      </div>

      <div class="lesson-document__clearfix" aria-hidden="true"></div>
    </div>

    <!-- Compact contextual controls: only for the element in hand. -->
    <div
      v-if="editable && selected"
      class="float-controls"
      role="toolbar"
      :aria-label="`Controls for ${selected.kind} element`"
      @mousedown.stop.prevent
      @click.stop
    >
      <span class="float-controls__label">{{ kindLabel(selected.kind) }}</span>

      <select
        class="float-controls__select"
        :value="selected.wrap"
        aria-label="Text wrapping"
        :disabled="selected.overlap"
        @change="patch({ wrap: $event.target.value })"
      >
        <option value="square">Wrap: square</option>
        <option value="top-bottom">Wrap: top &amp; bottom</option>
        <option value="inline">Inline</option>
        <option value="none">No wrap</option>
      </select>

      <button
        v-if="selected.wrap === 'square' && !selected.overlap"
        type="button"
        class="float-controls__btn"
        :aria-label="`Float ${selected.side === 'right' ? 'left' : 'right'}`"
        @click="patch({ side: selected.side === 'right' ? 'left' : 'right' })"
      >{{ selected.side === 'right' ? '⇤' : '⇥' }}</button>

      <span class="float-controls__divider" aria-hidden="true"></span>

      <button
        type="button"
        class="float-controls__btn"
        :class="{ 'is-active': selected.overlap }"
        :aria-pressed="selected.overlap"
        title="Allow this element to overlap text"
        @click="toggleOverlap"
      >Overlap</button>

      <template v-if="selected.overlap">
        <button type="button" class="float-controls__btn" title="Bring forward" @click="layer('forward')">↑</button>
        <button type="button" class="float-controls__btn" title="Send backward" @click="layer('backward')">↓</button>
      </template>

      <span class="float-controls__divider" aria-hidden="true"></span>

      <button
        type="button"
        class="float-controls__btn"
        :class="{ 'is-active': selected.locked }"
        :aria-pressed="selected.locked"
        title="Lock position and size"
        @click="patch({ locked: !selected.locked })"
      >{{ selected.locked ? '🔒' : '🔓' }}</button>
      <button type="button" class="float-controls__btn float-controls__btn--danger" title="Delete element" @click="removeSelected">🗑</button>
      <button type="button" class="float-controls__btn" title="Done" @click="selectedId = null">✓</button>
    </div>
  </div>
</template>

<script setup>
import { computed, h, nextTick, ref, watch } from 'vue';
import {
  documentSegments,
  isOverlay,
  normalizeLessonDocument,
  reorderFloat,
  removeFloat,
  updateFloat,
} from '../../../../lib/mentor/lessonDocument.ts';
import { sanitizeLessonHtml } from '../../../../lib/mentor/richLessonContent.ts';

const props = defineProps({
  /** The shared lesson document (already normalized, or normalizable). */
  document: {
    type: Object,
    default: () => null,
  },
  /** Teacher editing session. Students never set this. */
  editable: { type: Boolean, default: false },
});

const emit = defineEmits(['update:document', 'update:flow', 'update-float', 'select-float']);

const canvasRef = ref(null);
const selectedId = ref(null);
/** Last HTML we emitted, so our own update cannot re-render and steal the caret. */
let lastEmittedFlow = '';

const doc = computed(() => normalizeLessonDocument(props.document || {}));
const segments = computed(() => documentSegments(doc.value));
const overlays = computed(() => doc.value.floats.filter(isOverlay));
const selected = computed(() => doc.value.floats.find(f => f.id === selectedId.value) || null);

const documentStyle = computed(() => {
  const meta = doc.value.meta;
  if (!meta) return {};
  const style = {};
  if (meta.width) style.maxWidth = `${meta.width}px`;
  if (meta.align === 'center') style.marginLeft = 'auto', style.marginRight = 'auto';
  else if (meta.align === 'right') style.marginLeft = 'auto';
  return style;
});

// ── Rendering ────────────────────────────────────────────────────────────

function kindLabel(kind) {
  return { text: 'Text box', code: 'Code', callout: 'Content box', example: 'Example', image: 'Image', diagram: 'Diagram', activity: 'Activity', assessment: 'Assessment' }[kind] || 'Element';
}

function floatClasses(float) {
  return [
    `lesson-float--${float.kind}`,
    `lesson-float--wrap-${float.wrap}`,
    float.side ? `lesson-float--side-${float.side}` : '',
    float.overlap ? 'lesson-float--has-overlap' : '',
    float.id === selectedId.value ? 'is-selected' : '',
    float.locked ? 'is-locked' : '',
  ];
}

/**
 * Geometry for an element inside the flow. Wrapping is expressed with CSS
 * containment (float / block / inline), NOT absolute positioning — that is what
 * guarantees text is laid out around the element instead of underneath it.
 */
function floatStyle(float) {
  const width = float.width ? `${float.width}px` : '';
  const style = {};
  if (float.wrap === 'square') {
    style.float = float.side === 'right' ? 'right' : 'left';
    if (width) style.width = width;
    style.maxWidth = '62%';
  } else if (float.wrap === 'inline') {
    style.display = 'inline-block';
    style.verticalAlign = 'top';
    if (width) style.width = width;
    style.maxWidth = '100%';
  } else {
    style.display = 'block';
    style.clear = 'both';
    style.width = width || '100%';
    style.maxWidth = '100%';
  }
  if (float.height) style.minHeight = `${float.height}px`;
  if (float.z != null && !float.overlap) style.zIndex = String(float.z);
  return style;
}

/** Only explicitly overlapped elements are positioned absolutely. */
function overlayStyle(float) {
  return {
    position: 'absolute',
    left: `${float.x ?? 0}px`,
    top: `${float.y ?? 0}px`,
    width: float.width ? `${float.width}px` : '320px',
    maxWidth: '100%',
    minHeight: float.height ? `${float.height}px` : undefined,
    zIndex: String(float.z ?? 1),
  };
}

/** Builds the element body for a float, reusing existing components via slots. */
function renderFloat(float) {
  if (float.kind === 'code') {
    return {
      render: () =>
        h('div', { class: 'lesson-float__body lesson-float__body--code' }, [
          float.caption ? h('h4', { class: 'lesson-float__caption' }, float.caption) : null,
          h('div', { innerHTML: float.html || '' }),
        ]),
    };
  }
  if (float.kind === 'image' || float.kind === 'diagram') {
    return {
      render: () =>
        h('figure', { class: 'lesson-float__figure' }, [
          float.src ? h('img', { src: float.src, alt: float.alt || '', loading: 'lazy' }) : null,
          float.caption ? h('figcaption', null, float.caption) : null,
        ]),
    };
  }
  // Activities and assessments keep their interactive identity: the host decides
  // how they render, so an assessment never degrades into decorative prose.
  if (float.kind === 'activity' || float.kind === 'assessment') {
    return {
      render: () =>
        h('div', { class: `lesson-float__${float.kind}` }, [
          float.caption ? h('h4', null, float.caption) : null,
          h('div', { innerHTML: float.html || '' }),
        ]),
    };
  }
  return {
    render: () =>
      h('div', { class: 'lesson-float__body' }, [
        float.caption ? h('h4', { class: 'lesson-float__caption' }, float.caption) : null,
        h('div', { innerHTML: float.html || '' }),
      ]),
  };
}

// ── Editing ──────────────────────────────────────────────────────────────

function emitDocument(next) {
  emit('update:document', next);
}

function selectFloat(float) {
  if (!props.editable) return;
  selectedId.value = float.id;
  emit('select-float', float);
}

/** Rebuilds flow HTML from the live DOM, skipping the element islands. */
function readFlowFromDom() {
  const canvas = canvasRef.value;
  if (!canvas) return '';
  return Array.from(canvas.children)
    .filter(node => node.classList?.contains('lesson-document__node'))
    .map(node => node.innerHTML.trim())
    .filter(Boolean)
    .join('\n');
}

function onFlowInput() {
  if (!props.editable) return;
  const html = sanitizeLessonHtml(readFlowFromDom());
  if (html === doc.value.flow) return;
  lastEmittedFlow = html;
  // Emit without re-rendering: the caret stays exactly where the teacher left it.
  emit('update:flow', html);
  emitDocument({ ...doc.value, flow: html });
}

function onFlowBlur() {
  if (!props.editable) return;
  onFlowInput();
}

function onCanvasClick(event) {
  if (!props.editable) return;
  if (event.target === canvasRef.value) selectedId.value = null;
}

function patch(patchValue) {
  if (!selected.value) return;
  const next = updateFloat(doc.value, selected.value.id, patchValue);
  emit('update-float', { id: selected.value.id, patch: patchValue });
  emitDocument(next);
}

function toggleOverlap() {
  const float = selected.value;
  if (!float) return;
  if (float.overlap) {
    // Returning to the flow must restore a real wrapping mode.
    patch({ overlap: false, wrap: float.wrap === 'none' ? 'square' : float.wrap });
  } else {
    patch({ overlap: true, x: float.x ?? 0, y: float.y ?? 0, z: float.z ?? 1 });
  }
}

function layer(action) {
  if (!selected.value) return;
  emitDocument(reorderFloat(doc.value, selected.value.id, action));
}

function removeSelected() {
  if (!selected.value) return;
  const id = selected.value.id;
  selectedId.value = null;
  emitDocument(removeFloat(doc.value, id));
}

// ── External updates ─────────────────────────────────────────────────────

/**
 * Re-render only when the document really changed underneath us. Flow edits we
 * emitted ourselves are ignored, which is what keeps the caret stable while
 * typing in a continuous document.
 */
watch(
  () => props.document,
  async next => {
    const incoming = normalizeLessonDocument(next || {}).flow;
    if (incoming === lastEmittedFlow) return;
    lastEmittedFlow = '';
    await nextTick();
    if (selectedId.value && !doc.value.floats.some(f => f.id === selectedId.value)) {
      selectedId.value = null;
    }
  },
  { deep: true }
);

defineExpose({ selectedId });
</script>

<style scoped>
/*
 * The document itself. Deliberately plain: no card, no border, no per-paragraph
 * chrome. This is the same markup students read, so the teacher's page and the
 * student's page cannot drift apart.
 */
.lesson-document {
  width: 100%;
  padding: 4px 0 8px;
}

.lesson-document__canvas {
  position: relative;
  font-size: 16px;
  line-height: 1.75;
  color: #1f2937;
  outline: none;
  overflow-wrap: break-word;
}

.lesson-document--editable .lesson-document__canvas:focus-within {
  outline: none;
}

.lesson-document__node {
  margin: 0 0 14px;
}

.lesson-document__clearfix {
  clear: both;
}

/* Prose typography: document flow, not cards. */
.lesson-document__canvas :deep(p) { margin: 0 0 14px; }
.lesson-document__canvas :deep(h1) { font-size: 1.6em; font-weight: 700; margin: 22px 0 10px; }
.lesson-document__canvas :deep(h2) { font-size: 1.32em; font-weight: 700; margin: 20px 0 10px; }
.lesson-document__canvas :deep(h3) { font-size: 1.14em; font-weight: 600; margin: 18px 0 8px; }
.lesson-document__canvas :deep(ul),
.lesson-document__canvas :deep(ol) { margin: 0 0 14px; padding-left: 26px; }
.lesson-document__canvas :deep(li) { margin: 4px 0; }
.lesson-document__canvas :deep(a) { color: #b45309; text-decoration: underline; }
.lesson-document__canvas :deep(blockquote) {
  margin: 16px 0;
  padding-left: 14px;
  border-left: 3px solid #f3d9b1;
  color: #4b5563;
}
.lesson-document__canvas :deep(img) { max-width: 100%; height: auto; }

/* ── Floats ─────────────────────────────────────────────────────────────── */
.lesson-float {
  box-sizing: border-box;
  overflow-wrap: break-word;
}

.lesson-float--wrap-square { margin: 4px 18px 14px 0; }
.lesson-float--wrap-square.lesson-float--side-right { margin: 4px 0 14px 18px; }
.lesson-float--wrap-top-bottom { margin: 16px 0; width: 100%; }
.lesson-float--wrap-inline { margin: 0 12px 10px 0; }

.lesson-float--text .lesson-float__body,
.lesson-float--callout .lesson-float__body,
.lesson-float--example .lesson-float__body {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 14px 16px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.lesson-float--callout .lesson-float__body {
  background: #fffbeb;
  border-color: #fde68a;
  border-left: 3px solid #f59e0b;
}

.lesson-float__caption {
  margin: 0 0 6px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: #92400e;
  text-transform: none;
}

.lesson-float--code .lesson-float__body {
  background: #0f172a;
  border-color: #1e293b;
  color: #e2e8f0;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13.5px;
  overflow-x: auto;
}
.lesson-float--code .lesson-float__caption { color: #fbbf24; }

.lesson-float__figure { margin: 0; }
.lesson-float__figure img { display: block; width: 100%; height: auto; border-radius: 10px; }
.lesson-float__figure figcaption {
  margin-top: 6px;
  font-size: 12.5px;
  color: #6b7280;
}

/* Overlap is opt-in and always visibly a deliberate layer. */
.lesson-float--overlay { margin: 0; }

.lesson-document--editable .lesson-float {
  cursor: grab;
  transition: box-shadow 0.15s ease, outline-color 0.15s ease;
  outline: 1px dashed transparent;
  outline-offset: 3px;
}
.lesson-document--editable .lesson-float:hover { outline-color: rgba(245, 158, 11, 0.55); }
.lesson-document--editable .lesson-float.is-selected { outline-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15); }
.lesson-document--editable .lesson-float.is-locked { cursor: default; }

/* ── Contextual controls (only the selected element) ────────────────────── */
.float-controls {
  position: fixed;
  left: 50%;
  bottom: 96px;
  transform: translateX(-50%);
  z-index: 60;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.97);
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.16);
  backdrop-filter: blur(8px);
  font-size: 12px;
  color: #374151;
}

.float-controls__label {
  font-weight: 600;
  padding: 0 4px;
  color: #6b7280;
  white-space: nowrap;
}

.float-controls__select {
  height: 28px;
  border: 1px solid #e5e7eb;
  border-radius: 7px;
  background: #fff;
  font-size: 12px;
  padding: 0 6px;
  color: #374151;
}

.float-controls__btn {
  height: 28px;
  min-width: 28px;
  padding: 0 8px;
  border: 1px solid #e5e7eb;
  border-radius: 7px;
  background: #fff;
  font-size: 12px;
  color: #374151;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.float-controls__btn:hover { background: #fff7ed; border-color: #fdba74; }
.float-controls__btn:focus-visible { outline: 2px solid #f59e0b; outline-offset: 1px; }
.float-controls__btn.is-active { background: #fff7ed; border-color: #f59e0b; color: #b45309; }
.float-controls__btn--danger:hover { background: #fef2f2; border-color: #fca5a5; color: #b91c1c; }

.float-controls__divider {
  width: 1px;
  height: 18px;
  background: #e5e7eb;
}

@media (max-width: 720px) {
  .float-controls {
    left: 8px;
    right: 8px;
    bottom: 88px;
    transform: none;
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
