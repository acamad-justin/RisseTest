<template>
  <div
    class="lesson-document"
    :class="{ 'lesson-document--editable': editable, 'lesson-document--student': !editable }"
    :style="documentStyle"
  >
    <!--
      Word-style formatting bar for the DOCUMENT itself.

      It used to live only inside a block's inline editor, so editing a
      continuous lesson had no formatting controls at all. It is bound to the
      document's contenteditable and appears whenever editing is on.
    -->
    <div v-if="editable" class="doc-format-bar" role="toolbar" aria-label="Document formatting">
      <div class="doc-format-bar__group">
        <select class="doc-format-bar__select" :value="blockStyle" aria-label="Paragraph style" @change="applyBlockStyle($event.target.value)">
          <option value="p">Normal text</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="blockquote">Quote</option>
        </select>

        <select class="doc-format-bar__select doc-format-bar__select--size" :value="fontSize" aria-label="Font size" @change="applyFontSize($event.target.value)">
          <option value="">Size</option>
          <option value="12px">12 pt</option>
          <option value="14px">14 pt</option>
          <option value="16px">16 pt</option>
          <option value="18px">18 pt</option>
          <option value="22px">22 pt</option>
          <option value="28px">28 pt</option>
        </select>
      </div>

      <span class="doc-format-bar__divider" aria-hidden="true"></span>

      <div class="doc-format-bar__group">
        <button type="button" class="doc-format-bar__btn doc-format-bar__btn--icon" title="Bold (Ctrl+B)" @mousedown.prevent="exec('bold')"><strong>B</strong></button>
        <button type="button" class="doc-format-bar__btn doc-format-bar__btn--icon" title="Italic (Ctrl+I)" @mousedown.prevent="exec('italic')"><em>I</em></button>
        <button type="button" class="doc-format-bar__btn doc-format-bar__btn--icon" title="Underline (Ctrl+U)" @mousedown.prevent="exec('underline')"><u>U</u></button>
      </div>

      <span class="doc-format-bar__divider" aria-hidden="true"></span>

      <div class="doc-format-bar__group">
        <button type="button" class="doc-format-bar__btn" title="Bulleted list" @mousedown.prevent="exec('insertUnorderedList')">• List</button>
        <button type="button" class="doc-format-bar__btn" title="Numbered list" @mousedown.prevent="exec('insertOrderedList')">1. List</button>
      </div>

      <span class="doc-format-bar__divider" aria-hidden="true"></span>

      <div class="doc-format-bar__group">
        <button type="button" class="doc-format-bar__btn doc-format-bar__btn--icon" title="Align left" @mousedown.prevent="exec('justifyLeft')">⯐</button>
        <button type="button" class="doc-format-bar__btn doc-format-bar__btn--icon" title="Align centre" @mousedown.prevent="exec('justifyCenter')">⯑</button>
        <button type="button" class="doc-format-bar__btn doc-format-bar__btn--icon" title="Align right" @mousedown.prevent="exec('justifyRight')">⯒</button>
      </div>

      <span class="doc-format-bar__divider" aria-hidden="true"></span>

      <div class="doc-format-bar__group doc-format-bar__group--swatches" aria-label="Text colour">
        <span class="doc-format-bar__swatch-label">A</span>
        <button
          v-for="colour in TEXT_COLOURS"
          :key="'c-' + colour.value"
          type="button"
          class="doc-format-bar__swatch"
          :style="{ background: colour.value }"
          :title="`Text colour: ${colour.label}`"
          :aria-label="`Text colour: ${colour.label}`"
          @mousedown.prevent="exec('foreColor', colour.value)"
        ></button>
      </div>

      <div class="doc-format-bar__group doc-format-bar__group--swatches" aria-label="Highlight">
        <span class="doc-format-bar__swatch-label">▨</span>
        <button
          v-for="colour in HIGHLIGHT_COLOURS"
          :key="'h-' + colour.value"
          type="button"
          class="doc-format-bar__swatch doc-format-bar__swatch--highlight"
          :style="{ background: colour.value }"
          :title="`Highlight: ${colour.label}`"
          :aria-label="`Highlight: ${colour.label}`"
          @mousedown.prevent="exec('hiliteColor', colour.value)"
        ></button>
      </div>

      <span class="doc-format-bar__divider" aria-hidden="true"></span>

      <div class="doc-format-bar__group">
        <button type="button" class="doc-format-bar__btn" title="Clear formatting" @mousedown.prevent="exec('removeFormat')">Clear</button>
        <button type="button" class="doc-format-bar__btn doc-format-bar__btn--insert" title="Insert a text box" @mousedown.prevent="insertElement('text')">+ Text box</button>
        <button type="button" class="doc-format-bar__btn doc-format-bar__btn--insert" title="Insert a content box" @mousedown.prevent="insertElement('callout')">+ Content box</button>
        <button
          type="button"
          class="doc-format-bar__btn doc-format-bar__btn--insert"
          :disabled="uploading"
          title="Upload a picture and place it in the lesson"
          @mousedown.prevent="pickImage"
        >{{ uploading ? 'Uploading…' : '+ Picture' }}</button>
        <input
          ref="fileInputRef"
          type="file"
          class="doc-format-bar__file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          @change="onFilePicked"
        />
      </div>
    </div>

    <p v-if="editable && uploadError" class="doc-upload-error" role="alert">{{ uploadError }}</p>

    <div
      :key="'canvas-' + canvasRevision"
      ref="canvasRef"
      class="lesson-document__canvas"
      :contenteditable="editable ? 'true' : 'false'"
      :spellcheck="editable ? 'true' : 'false'"
      @input="onCanvasInput"
      @blur="onFlowBlur"
      @focusout="onCanvasFocusout"
      @focus="onFlowFocus"
      @click="onCanvasClick"
      @dragover="onDragOver"
      @drop="onDrop"
    >
      <template v-for="(segment, index) in segments" :key="segment.type === 'float' ? segment.float.id : 'flow-' + segment.index">
        <div v-if="segment.type === 'flow'" class="lesson-document__node" :data-flow-index="segment.index" v-html="segment.html"></div>

        <div
          v-else
          class="lesson-float"
          :class="[floatClasses(segment.float), { 'is-dragging': draggingId === segment.float.id }]"
          :style="floatStyle(segment.float)"
          :data-float-id="segment.float.id"
          contenteditable="false"
          @pointerdown="startFloatDrag($event, segment.float)"
          @click.stop="selectFloat(segment.float, $event)"
        >
          <span v-if="editable" class="lesson-float__handle" aria-hidden="true">⠿</span>
          <button
            v-if="editable"
            type="button"
            class="lesson-float__delete"
            title="Delete this element"
            aria-label="Delete this element"
            @mousedown.stop.prevent
            @click.stop="deleteFloat(segment.float)"
          >×</button>
          <span
            v-if="editable && !segment.float.locked"
            class="lesson-float__resize"
            title="Drag to resize"
            aria-hidden="true"
            @pointerdown.stop.prevent="startFloatResize($event, segment.float)"
          ></span>
          <component :is="renderFloat(segment.float)" />
        </div>
      </template>

      <!-- Explicit overlap only: taken out of the flow and layered on the canvas. -->
      <div
        v-for="float in overlays"
        :key="'overlay-' + float.id"
        class="lesson-float lesson-float--overlay"
        :class="[floatClasses(float), { 'is-dragging': draggingId === float.id }]"
        :style="overlayStyle(float)"
        :data-float-id="float.id"
        contenteditable="false"
        @pointerdown="startFloatDrag($event, float)"
        @click.stop="selectFloat(float, $event)"
      >
        <span v-if="editable" class="lesson-float__handle" aria-hidden="true">⠿</span>
        <button
          v-if="editable"
          type="button"
          class="lesson-float__delete"
          title="Delete this element"
          aria-label="Delete this element"
          @mousedown.stop.prevent
          @click.stop="deleteFloat(float)"
        >×</button>
        <span
          v-if="editable && !float.locked"
          class="lesson-float__resize"
          title="Drag to resize"
          aria-hidden="true"
          @pointerdown.stop.prevent="startFloatResize($event, float)"
        ></span>
        <component :is="renderFloat(float)" />
      </div>

    <!-- Compact contextual controls: only for the element in hand. -->
    <div
      v-if="editable && selected"
      class="float-controls"
      :style="controlsStyle"
      contenteditable="false"
      role="toolbar"
      :aria-label="`Controls for ${selected.kind} element`"
      @mousedown.stop
      @click.stop
    >
      <span class="float-controls__label">{{ kindLabel(selected.kind) }}</span>

      <button type="button" class="float-controls__btn float-controls__btn--danger" title="Delete this element" aria-label="Delete this element" @click="deleteFloat(selected)">Delete</button>

      <span class="float-controls__divider" aria-hidden="true"></span>

      <select
        class="float-controls__select"
        :value="selected.wrap"
        aria-label="Text wrapping"
        @change="applyWrap($event.target.value)"
      >
        <option value="square">Wrap: square</option>
        <option value="top-bottom">Wrap: top &amp; bottom</option>
        <option value="inline">Inline</option>
        <option value="none" :disabled="!selected.overlap">No wrap</option>
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

      <div class="lesson-document__clearfix" aria-hidden="true"></div>
    </div>

  </div>
</template>

<script setup>
import { computed, h, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import {
  addFloat,
  documentSegments,
  isOverlay,
  normalizeLessonDocument,
  reorderFloat,
  removeFloat,
  updateFloat,
} from '../../../../lib/mentor/lessonDocument.ts';
import { sanitizeLessonHtml } from '../../../../lib/mentor/richLessonContent.ts';
import { isDirectImageSource, resolveLessonMediaUrl, uploadLessonImage } from '../../../../lib/mentor/lessonMedia.ts';

const props = defineProps({
  document: { type: Object, default: () => null },
  editable: { type: Boolean, default: false },
  /**
   * Course the lesson belongs to. Lesson images are stored under it so the
   * storage policy can decide who may read them (the mentor who owns the course,
   * and its enrolled students once it is published).
   */
  courseId: { type: String, default: '' },
});

const emit = defineEmits(['update:document', 'update:flow', 'update-float', 'select-float']);

const TEXT_COLOURS = [
  { label: 'Default', value: '#1f2937' },
  { label: 'Amber', value: '#b45309' },
  { label: 'Green', value: '#15803d' },
  { label: 'Blue', value: '#1d4ed8' },
  { label: 'Red', value: '#b91c1c' },
];
const HIGHLIGHT_COLOURS = [
  { label: 'Yellow', value: '#fef08a' },
  { label: 'Green', value: '#bbf7d0' },
  { label: 'Blue', value: '#bfdbfe' },
  { label: 'None', value: 'transparent' },
];

const canvasRef = ref(null);
const selectedId = ref(null);
const draggingId = ref(null);
const flowFocused = ref(false);
const canvasRevision = ref(0);
/** Signed URLs for lesson images, keyed by storage path. */
const imageUrls = ref({});
/** Paths that could not be signed, so the UI can say so instead of spinning. */
const imageFailures = ref({});
const uploading = ref(false);
const uploadError = ref('');
const fileInputRef = ref(null);
/** Where the contextual controls sit, relative to the canvas. */
const controlsPos = ref({ left: 0, top: 0 });

/**
 * LOCAL SNAPSHOT — the reason the caret no longer jumps.
 *
 * The document used to be re-derived from props on every keystroke: we emitted,
 * the parent echoed back, `segments` recomputed, and Vue re-wrote the innerHTML
 * of the paragraph being typed in — which snaps the caret to the start of that
 * node. Rendering three characters could move it anywhere.
 *
 * The snapshot is now replaced only by an external change, never by our own
 * echo, and never while the flow has focus.
 */
const localDoc = ref(normalizeLessonDocument(props.document || {}));
let lastEmittedFlow = '';

const segments = computed(() => documentSegments(localDoc.value));
const overlays = computed(() => localDoc.value.floats.filter(isOverlay));
const selected = computed(() => localDoc.value.floats.find(f => f.id === selectedId.value) || null);

const documentStyle = computed(() => {
  const meta = localDoc.value.meta;
  if (!meta) return {};
  const style = {};
  if (meta.width) style.maxWidth = `${meta.width}px`;
  if (meta.align === 'center') { style.marginLeft = 'auto'; style.marginRight = 'auto'; }
  else if (meta.align === 'right') style.marginLeft = 'auto';
  return style;
});

// ── Formatting ───────────────────────────────────────────────────────────

const blockStyle = ref('p');
const fontSize = ref('');

/** Runs a formatting command against the document's contenteditable. */
function exec(command, value = null) {
  if (!props.editable) return;
  const canvas = canvasRef.value;
  if (!canvas) return;
  /*
   * Format where the caret is. Forcing focus onto the canvas moved it out of a
   * float's body, so Bold/Italic inside a content box applied to nothing (and
   * could format the flow instead).
   */
  const active = document.activeElement;
  if (!active || !canvas.contains(active)) canvas.focus();
  try {
    document.execCommand('styleWithCSS', false, true);
    document.execCommand(command, false, value);
  } catch {
    /* unsupported command — never break the document over it */
  }
  const body = floatBodyOwner(document.activeElement);
  if (body) commitFloatBody(body);
  else commitFlowFromDom();
}

function applyBlockStyle(tag) {
  blockStyle.value = tag;
  exec('formatBlock', `<${tag}>`);
}

/** execCommand only speaks 1–7; map the point sizes we offer onto those steps. */
function applyFontSize(size) {
  fontSize.value = size;
  const map = { '12px': '2', '14px': '3', '16px': '4', '18px': '5', '22px': '6', '28px': '7' };
  if (!size) return exec('removeFormat');
  exec('fontSize', map[size] || '4');
}

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

/** In-flow geometry: containment, never absolute coordinates. */
function floatStyle(float) {
  const width = float.width ? `${float.width}px` : '';
  const style = {};
  const offsetY = float.offsetY ? `${float.offsetY}px` : '';
  const offsetX = float.offsetX ? `${float.offsetX}px` : '';

  if (float.wrap === 'square') {
    style.float = float.side === 'right' ? 'right' : 'left';
    if (width) style.width = width;
    // Full width must be reachable: a 62% cap made wide boxes snap back smaller.
    style.maxWidth = '100%';
    // Offsets are margins, not coordinates: the element stays IN the flow, so
    // the browser still lays the surrounding line boxes around it.
    if (offsetY) style.marginTop = offsetY;
    if (offsetX) {
      if (float.side === 'right') style.marginRight = offsetX;
      else style.marginLeft = offsetX;
    }
  } else if (float.wrap === 'inline') {
    style.display = 'inline-block';
    style.verticalAlign = 'top';
    if (width) style.width = width;
    style.maxWidth = '100%';
    if (offsetY) style.marginTop = offsetY;
  } else {
    style.display = 'block';
    style.clear = 'both';
    style.width = width || '100%';
    style.maxWidth = '100%';
    if (offsetY) style.marginTop = offsetY;
  }
  if (float.height) style.minHeight = `${float.height}px`;
  return style;
}

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

/**
 * The body of a text-ish element, as a typing surface.
 *
 * Floats render through `innerHTML` and their wrapper is `contenteditable="false"`
 * (so dragging cannot select the page). That made a content box a picture of
 * text: its words could be moved and deleted but never edited. A nested editable
 * region fixes that — the browser allows an editable child inside a
 * non-editable parent — and `data-float-body` tells the canvas handlers which
 * element the keystrokes belong to.
 */
function floatBodyProps(float, extraClass = '') {
  return {
    class: ['lesson-float__body', extraClass].filter(Boolean).join(' '),
    contenteditable: props.editable ? 'true' : 'false',
    'data-float-body': float.id,
    spellcheck: props.editable ? 'true' : 'false',
    innerHTML: float.html || '',
  };
}

function renderFloat(float) {
  if (float.kind === 'code') {
    return {
      render: () => h('div', { class: 'lesson-float__body lesson-float__body--code' }, [
        float.caption ? h('h4', { class: 'lesson-float__caption' }, float.caption) : null,
        h('div', floatBodyProps(float, 'lesson-float__code')),
      ]),
    };
  }
  if (float.kind === 'image' || float.kind === 'diagram') {
    return {
      render: () => {
        // Reading the ref here tracks it, so the <img> re-renders once the
        // signed URL resolves without re-rendering the editable flow.
        const src = imageSrcOf(float);
        return h('figure', { class: 'lesson-float__figure' }, [
          src
            ? h('img', { src, alt: float.alt || '', loading: 'lazy' })
            : h('div', { class: 'lesson-float__placeholder' },
                !float.src ? 'No image'
                : imageFailures.value[float.src] ? 'Image unavailable'
                : 'Loading image…'),
          float.caption ? h('figcaption', null, float.caption) : null,
        ]);
      },
    };
  }
  if (float.kind === 'activity' || float.kind === 'assessment') {
    return {
      render: () => h('div', { class: `lesson-float__${float.kind}` }, [
        float.caption ? h('h4', null, float.caption) : null,
        h('div', floatBodyProps(float)),
      ]),
    };
  }
  return {
    render: () => h('div', { class: 'lesson-float__body' }, [
      float.caption ? h('h4', { class: 'lesson-float__caption' }, float.caption) : null,
      h('div', floatBodyProps(float)),
    ]),
  };
}

// ── Flow editing ─────────────────────────────────────────────────────────

/**
 * The document's text, as it currently stands in the DOM.
 *
 * Every element the canvas holds is flow content EXCEPT the floats, which carry
 * their own model. Reading only `.lesson-document__node` used to drop anything the
 * browser inserted beside a node — pressing Enter at the end of a block can
 * produce a sibling block, and its text would vanish on the next save. Blocks
 * are joined with a newline so their boundaries survive as separate paragraphs.
 */
/**
 * Chrome the editor paints INSIDE the canvas. It is positioned against the
 * document, so it has to live in the same element — but it is not lesson text.
 *
 * The contextual control bar was the bad case: its labels and its <select>
 * options ("Content box", "Delete", "Wrap: square", "Overlap", "✓") were being
 * serialised into the flow, so clicking the control bar's done button wrote
 * those words into the lesson.
 */
const CANVAS_CHROME_SELECTOR = [
  '.lesson-float',
  '.float-controls',
  '.lesson-document__clearfix',
  '[data-float-id]',
  '[data-float-body]',
  '[contenteditable="false"]',
  '[role="toolbar"]',
  'script',
  'style',
].join(', ');

function readFlowFromDom() {
  const canvas = canvasRef.value;
  if (!canvas) return '';
  // Read a detached copy: the live canvas is being typed into, and the chrome
  // above is a sibling of the prose rather than part of it.
  const clone = canvas.cloneNode(true);
  clone.querySelectorAll(CANVAS_CHROME_SELECTOR).forEach(el => el.remove());
  return Array.from(clone.children)
    .filter(node => String(node.tagName || '').toUpperCase() !== 'BR')
    .map(node => node.innerHTML.trim())
    .filter(Boolean)
    .join('\n');
}

function emitFlow(html) {
  lastEmittedFlow = html;
  emit('update:flow', html);
  emit('update:document', { ...localDoc.value, flow: html });
}

/** Typing: emit and stop. Never re-render the node under the caret. */
function onFlowInput() {
  if (!props.editable) return;
  const html = sanitizeLessonHtml(readFlowFromDom());
  if (html === lastEmittedFlow) return;
  emitFlow(html);
}

function commitFlowFromDom() {
  if (!props.editable) return;
  const html = sanitizeLessonHtml(readFlowFromDom());
  if (html !== lastEmittedFlow) emitFlow(html);
}

function onFlowFocus() {
  flowFocused.value = true;
}

/**
 * Blur: fold the edited HTML into the snapshot so the model matches the DOM.
 * If the teacher added or removed paragraphs, the node count no longer matches
 * what Vue rendered, so the canvas is rebuilt once from the snapshot — that is
 * what prevents duplicated paragraphs appearing after pressing Enter.
 */
function onFlowBlur() {
  flowFocused.value = false;
  if (!props.editable) return;
  const html = sanitizeLessonHtml(readFlowFromDom());
  const canvas = canvasRef.value;
  const domNodes = canvas ? canvas.querySelectorAll('.lesson-document__node').length : 0;
  const renderedNodes = segments.value.filter(s => s.type === 'flow').length;

  if (html !== localDoc.value.flow) {
    localDoc.value = { ...localDoc.value, flow: html };
    if (domNodes !== renderedNodes) nextTick(() => { canvasRevision.value += 1; });
  }
  commitFlowFromDom();
}

// ── Float body editing (delegated from the canvas) ───────────────────────

/** The editable body a keystroke belongs to, if any. */
function floatBodyOwner(target) {
  const el = target && target.closest ? target.closest('[data-float-body]') : null;
  if (!el) return null;
  const canvas = canvasRef.value;
  return canvas && canvas.contains(el) ? el : null;
}

function readFloatBodyHtml(body) {
  return sanitizeLessonHtml(body.innerHTML);
}

function onFloatBodyInput(body) {
  const id = body.getAttribute('data-float-body');
  if (!id) return;
  const html = readFloatBodyHtml(body);
  // Emitted, never applied locally: writing the model back would re-render the
  // body under the caret, the same trap the flow editor was built to avoid.
  // `lastEmittedFlow` marks the echo that comes back as ours, so the watcher
  // does not replace the snapshot and re-render mid-word.
  lastEmittedFlow = localDoc.value.flow;
  emit('update-float', { id, patch: { html } });
  emit('update:document', {
    ...localDoc.value,
    floats: localDoc.value.floats.map(f => (f.id === id ? { ...f, html } : f)),
  });
}

/** Blur: fold the body's HTML into the snapshot so the model matches the DOM. */
function commitFloatBody(body) {
  const id = body.getAttribute('data-float-body');
  const float = localDoc.value.floats.find(f => f.id === id);
  if (!float) return;
  const html = readFloatBodyHtml(body);
  if (html === (float.html || '')) return;
  localDoc.value = {
    ...localDoc.value,
    floats: localDoc.value.floats.map(f => (f.id === id ? { ...f, html } : f)),
  };
  lastEmittedFlow = localDoc.value.flow;
  emit('update-float', { id, patch: { html } });
  emit('update:document', { ...localDoc.value });
}

function onCanvasInput(event) {
  if (!props.editable) return;
  const body = floatBodyOwner(event?.target);
  if (body) {
    onFloatBodyInput(body);
    return;
  }
  onFlowInput();
}

/** `focusout` bubbles, so one handler covers the flow and every float body. */
function onCanvasFocusout(event) {
  if (!props.editable) return;
  const body = floatBodyOwner(event?.target);
  if (body) {
    commitFloatBody(body);
    return;
  }
  if (event?.target === canvasRef.value) onFlowBlur();
}

function onCanvasClick(event) {
  if (!props.editable) return;
  if (event.target === canvasRef.value) selectedId.value = null;
}

// ── Floats: selection, drag, controls ────────────────────────────────────

function selectFloat(float, event = null) {
  if (!props.editable) return;
  selectedId.value = float.id;
  positionControls(float, event);
  emit('select-float', float);
}

/**
 * Anchors the contextual controls just above the element.
 *
 * They used to be `position: fixed` at the bottom of the viewport. A transformed
 * ancestor (the preview host) turns `fixed` into an absolute box measured from
 * that ancestor, so the bar — and the Delete button inside it — could render
 * hundreds of pixels away, off-screen. Measuring the element and placing the bar
 * inside the document keeps it attached to whatever the teacher selected.
 */
function positionControls(float, event = null) {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const canvasRect = canvas.getBoundingClientRect();
  const el = event?.currentTarget || canvas.querySelector(`[data-float-id="${float.id}"]`);

  if (el) {
    const rect = el.getBoundingClientRect();
    controlsPos.value = {
      left: Math.max(0, Math.round(rect.left - canvasRect.left)),
      top: Math.max(44, Math.round(rect.top - canvasRect.top)),
    };
    return;
  }
  controlsPos.value = { left: Math.max(0, float.x ?? 0), top: Math.max(44, float.y ?? 0) };
}

const controlsStyle = computed(() => ({
  position: 'absolute',
  left: `${controlsPos.value.left}px`,
  top: `${controlsPos.value.top}px`,
  transform: 'translate(0, calc(-100% - 10px))',
}));

/**
 * Chooses how the element sits in the document.
 *
 * The picker used to be disabled whenever the element was overlapping — which is
 * exactly the state dragging produces, so "top & bottom" could never be chosen.
 * Picking a flow wrap now releases the position and returns the element to the
 * text, taking the side and the paragraph it was dropped nearest to.
 */
function applyWrap(wrap) {
  const float = selected.value;
  if (!float) return;

  if (wrap === 'none') {
    patch({ wrap: 'none', overlap: true, x: float.x ?? 0, y: float.y ?? 0, z: float.z ?? 1 });
    return;
  }

  if (!float.overlap) {
    patch({ wrap });
    return;
  }

  const side = nearestSide(float);
  patch({
    wrap,
    overlap: false,
    ...(wrap === 'square' ? { side } : {}),
    anchor: nearestAnchor(float) ?? float.anchor,
  });
}

function nearestSide(float) {
  const canvas = canvasRef.value;
  if (!canvas) return float.side || 'left';
  const width = canvas.getBoundingClientRect().width || 0;
  if (!width) return float.side || 'left';
  return (float.x ?? 0) + (float.width ?? 0) / 2 > width / 2 ? 'right' : 'left';
}

/** The flow paragraph a dropped element sits closest to. */
function nearestAnchor(float) {
  const canvas = canvasRef.value;
  if (!canvas) return null;
  const nodes = Array.from(canvas.querySelectorAll('.lesson-document__node'));
  if (nodes.length === 0) return null;
  const canvasRect = canvas.getBoundingClientRect();
  const y = canvasRect.top + (float.y ?? 0);
  let best = 0;
  let bestDistance = Infinity;
  nodes.forEach((node, index) => {
    const rect = node.getBoundingClientRect();
    const distance = Math.abs(rect.top - y);
    if (distance < bestDistance) { bestDistance = distance; best = index; }
  });
  return best;
}

function deleteFloat(float) {
  if (!float) return;
  if (selectedId.value === float.id) selectedId.value = null;
  applyDoc(removeFloat(localDoc.value, float.id));
  emit('update-float', { id: float.id, removed: true });
}

function applyDoc(next) {
  localDoc.value = next;
  emit('update:document', next);
}

function patch(patchValue) {
  if (!selected.value) return;
  applyDoc(updateFloat(localDoc.value, selected.value.id, patchValue));
  emit('update-float', { id: selected.value.id, patch: patchValue });
}

function toggleOverlap() {
  const float = selected.value;
  if (!float) return;
  const width = float.width || measuredWidth(float) || undefined;

  if (float.overlap) {
    patch({ overlap: false, width, wrap: float.wrap === 'none' ? 'square' : float.wrap });
  } else {
    // Carry the rendered size across, otherwise an overlay falls back to its
    // 320px default and the box appears to shrink when overlap is switched on.
    patch({ overlap: true, width, x: float.x ?? 0, y: float.y ?? 0, z: float.z ?? 1 });
  }
}

function layer(action) {
  if (!selected.value) return;
  applyDoc(reorderFloat(localDoc.value, selected.value.id, action));
}

function removeSelected() {
  deleteFloat(selected.value);
}

/**
 * The URL to render for an image float.
 *
 * A storage path is only usable through a signed link: rendering the raw path
 * would produce a broken <img>. So a path renders nothing until it is signed,
 * while a plain URL is used as-is.
 */
function imageSrcOf(float) {
  const src = float?.src || '';
  if (!src) return '';
  if (isDirectImageSource(src)) return src;
  return imageUrls.value[src] || '';
}

/** Resolves every image the document references, caching signed links. */
async function resolveImages() {
  const sources = new Set(
    localDoc.value.floats
      .filter(f => f.kind === 'image' || f.kind === 'diagram')
      .map(f => f.src)
      .filter(Boolean)
  );
  for (const src of sources) {
    if (imageUrls.value[src] || isDirectImageSource(src)) continue;
    const url = await resolveLessonMediaUrl(src);
    if (url) {
      imageUrls.value = { ...imageUrls.value, [src]: url };
    } else {
      imageFailures.value = { ...imageFailures.value, [src]: true };
    }
  }
}

function pickImage() {
  if (!props.editable || uploading.value) return;
  uploadError.value = '';
  const input = fileInputRef.value;
  if (input) {
    input.value = '';
    input.click();
  }
}

function onFilePicked(event) {
  const file = event?.target?.files?.[0];
  if (file) insertImageFile(file);
}

function onDragOver(event) {
  if (!props.editable) return;
  // Only claim the drop when the teacher is actually dragging an image in.
  const types = Array.from(event?.dataTransfer?.types || []);
  if (types.includes('Files')) event.preventDefault();
}

function onDrop(event) {
  if (!props.editable) return;
  const file = event?.dataTransfer?.files?.[0];
  if (!file) return;
  event.preventDefault();
  insertImageFile(file);
}

/**
 * Uploads a picture and places it in the document.
 *
 * It lands as an ordinary document element — wrapped to the side by default, so
 * the prose flows around it, and then it can be dragged, resized, re-wrapped or
 * deleted like any other box.
 */
async function insertImageFile(file) {
  if (!props.editable) return;
  uploadError.value = '';
  uploading.value = true;
  try {
    const result = await uploadLessonImage(file, { courseId: props.courseId || undefined });
    if (!result.success) {
      uploadError.value = result.error;
      return;
    }

    const { path, url } = result.image;
    if (url) imageUrls.value = { ...imageUrls.value, [path]: url };

    const next = addFloat(localDoc.value, {
      kind: 'image',
      src: path,
      alt: String(file.name || '').replace(/\.[^.]+$/, ''),
      wrap: 'square',
      side: 'left',
      overlap: false,
      width: 360,
      anchor: segments.value.filter(s => s.type === 'flow').length,
    });
    applyDoc(next);
    const added = next.floats[next.floats.length - 1];
    if (added) {
      selectedId.value = added.id;
      positionControls(added);
    }
  } catch {
    uploadError.value = 'The image could not be uploaded.';
  } finally {
    uploading.value = false;
  }
}

function insertElement(kind) {
  const next = addFloat(localDoc.value, {
    kind,
    wrap: 'top-bottom',
    overlap: false,
    html: kind === 'callout' ? '<p>New content box — click and edit this text.</p>' : '<p>New text box</p>',
    width: kind === 'callout' ? 420 : 300,
    anchor: segments.value.filter(s => s.type === 'flow').length,
  });
  applyDoc(next);
  const added = next.floats[next.floats.length - 1];
  if (added) selectedId.value = added.id;
}

/** Measures an element's rendered width, used when a box has no stored width. */
function measuredWidth(float) {
  const canvas = canvasRef.value;
  const el = canvas?.querySelector(`[data-float-id="${float.id}"]`);
  const width = el?.getBoundingClientRect?.().width || 0;
  return width > 0 ? Math.round(width) : 0;
}

/**
 * Turns a free drop point into an in-flow position: the nearest paragraph, the
 * side, and the margins that place the box there. The element never leaves the
 * document, so surrounding text reflows around it.
 */
function flowPlacement(x, y, width) {
  const canvas = canvasRef.value;
  const canvasRect = canvas?.getBoundingClientRect?.();
  const canvasWidth = canvasRect?.width || 0;
  const nodes = canvas ? Array.from(canvas.querySelectorAll('.lesson-document__node')) : [];

  let anchorIndex = nodes.length;
  let offsetY = 0;
  if (nodes.length > 0 && canvasRect) {
    let best = 0;
    let bestDistance = Infinity;
    nodes.forEach((node, index) => {
      const rect = node.getBoundingClientRect();
      const top = rect.top - canvasRect.top;
      const distance = Math.abs(top - y);
      if (distance < bestDistance) { bestDistance = distance; best = index; }
    });
    anchorIndex = best;
    const rect = nodes[best].getBoundingClientRect();
    offsetY = Math.max(0, Math.round(y - (rect.top - canvasRect.top)));
  }

  const side = canvasWidth && x + width / 2 > canvasWidth / 2 ? 'right' : 'left';
  const offsetX = side === 'right'
    ? Math.max(0, Math.round(canvasWidth - (x + width)))
    : Math.max(0, Math.round(x));

  // `top-bottom` cannot give way sideways, so a dragged box becomes a wrapped
  // float — that is what makes the prose move aside instead of being covered.
  return { wrap: 'square', anchor: anchorIndex, side, offsetX, offsetY, overlap: false };
}

/** Drag the corner of an element to resize it. */
function startFloatResize(event, float) {
  if (!props.editable || float.locked) return;
  const el = event.currentTarget?.parentElement;
  if (!el) return;
  event.preventDefault();

  const startRect = el.getBoundingClientRect();
  const startX = event.clientX;
  const startY = event.clientY;
  const startWidth = float.width || Math.round(startRect.width) || 320;
  const startHeight = float.height || Math.round(startRect.height) || 0;
  const canvas = canvasRef.value;
  const measuredCanvas = canvas?.getBoundingClientRect?.().width || 0;
  const canvasWidth = measuredCanvas > 0 ? measuredCanvas : 0;
  let width = startWidth;
  let height = startHeight;
  let moved = false;

  const onMove = moveEvent => {
    const dx = moveEvent.clientX - startX;
    const dy = moveEvent.clientY - startY;
    if (!moved && Math.abs(dx) + Math.abs(dy) < 3) return;
    moved = true;
    const proposed = Math.max(140, startWidth + dx);
    // Only clamp against a canvas we could actually measure.
    width = canvasWidth > 0 ? Math.min(proposed, canvasWidth) : proposed;
    height = Math.max(48, startHeight + dy);
    el.style.width = `${width}px`;
    el.style.maxWidth = '100%';
    el.style.minHeight = `${height}px`;
  };

  const onUp = () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    if (!moved) return;
    const patchValue = { width: Math.round(width), height: Math.round(height) };
    applyDoc(updateFloat(localDoc.value, float.id, patchValue));
    emit('update-float', { id: float.id, patch: patchValue });
  };

  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
}

/**
 * Drag a float to move it.
 *
 * A short press with no movement is still a *click* (selection), so the button
 * never feels like it drags when the teacher only meant to select or edit. Once
 * it moves, the element becomes explicitly positioned — which is the same
 * contract as Word: dragging a text box out of the flow gives it a position,
 * and the contextual bar can hand it back to the flow afterwards.
 */
function startFloatDrag(event, float) {
  if (!props.editable || float.locked) return;
  if (event.button != null && event.button !== 0) return;
  // The element's own text is editable: a press there places a caret.
  if (floatBodyOwner(event.target)) return;
  const canvas = canvasRef.value;
  const el = event.currentTarget;
  if (!canvas || !el) return;

  event.preventDefault();
  selectFloat(float, event);

  const canvasRect = canvas.getBoundingClientRect();
  const startRect = el.getBoundingClientRect();
  const startX = event.clientX;
  const startY = event.clientY;
  let moved = false;

  const onMove = moveEvent => {
    const dx = moveEvent.clientX - startX;
    const dy = moveEvent.clientY - startY;
    if (!moved && Math.abs(dx) + Math.abs(dy) < 4) return;
    moved = true;
    draggingId.value = float.id;
    el.style.transform = `translate(${dx}px, ${dy}px)`;
    el.style.opacity = '0.92';
  };

  const onUp = upEvent => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    el.style.transform = '';
    el.style.opacity = '';
    draggingId.value = null;
    if (!moved) return;

    const dx = upEvent.clientX - startX;
    const dy = upEvent.clientY - startY;
    const canvasWidth = canvasRect.width || startRect.width;
    // Keep the block inside the document: it must never become unreachable.
    const maxX = Math.max(0, canvasWidth - Math.min(startRect.width, canvasWidth));
    const x = Math.min(Math.max(0, Math.round(startRect.left - canvasRect.left + dx)), maxX);
    const y = Math.max(0, Math.round(startRect.top - canvasRect.top + dy));
    // A box that had no explicit width keeps the size it was rendered at.
    const width = float.width || Math.round(startRect.width) || 320;

    if (float.overlap) {
      applyDoc(updateFloat(localDoc.value, float.id, { overlap: true, x, y, width, z: float.z ?? 1 }));
      emit('update-float', { id: float.id, patch: { overlap: true, x, y, width } });
      return;
    }

    /*
     * In flow: express the drop as a position WITHIN the document instead of
     * taking the element out of it.
     *
     * Absolute coordinates are the only way to be "free", but they also stop the
     * text from reflowing — which is exactly the complaint: a moved box landed on
     * top of the prose. A CSS float stays in the flow, so the anchor paragraph,
     * the side and the offsets let the browser lay the surrounding lines around
     * the box: move it anywhere and the text gives way.
     */
    const placement = flowPlacement(x, y, width);
    applyDoc(updateFloat(localDoc.value, float.id, { width, ...placement }));
    emit('update-float', { id: float.id, patch: { width, ...placement } });
  };

  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
}

// ── External updates ─────────────────────────────────────────────────────

watch(
  () => localDoc.value.floats.map(f => f.src || '').join('|'),
  () => { resolveImages(); },
  { immediate: true }
);

watch(
  () => props.document,
  next => {
    if (!next) return;
    // Never re-render underneath the caret, and never treat our own echo as an
    // external change: those two rules are what keep typing stable.
    if (flowFocused.value) return;
    const incoming = normalizeLessonDocument(next);
    if (incoming.flow === lastEmittedFlow && incoming.floats.length === localDoc.value.floats.length) {
      lastEmittedFlow = incoming.flow;
      return;
    }
    lastEmittedFlow = '';
    localDoc.value = incoming;
    if (selectedId.value && !incoming.floats.some(f => f.id === selectedId.value)) selectedId.value = null;
  },
  { deep: true }
);

onBeforeUnmount(() => {
  draggingId.value = null;
});

defineExpose({ selectedId });
</script>

<style scoped>
.lesson-document { width: 100%; padding: 4px 0 8px; }

.lesson-document__canvas {
  position: relative;
  /* Room to drop an element below the final paragraph without it being clipped. */
  padding-bottom: 24px;
  font-size: 16px;
  line-height: 1.75;
  color: #1f2937;
  outline: none;
  overflow-wrap: break-word;
}

.lesson-document__node { margin: 0 0 14px; }
.lesson-document__clearfix { clear: both; }

.lesson-document__canvas :deep(p) { margin: 0 0 14px; }
.lesson-document__canvas :deep(h1) { font-size: 1.6em; font-weight: 700; margin: 22px 0 10px; }
.lesson-document__canvas :deep(h2) { font-size: 1.32em; font-weight: 700; margin: 20px 0 10px; }
.lesson-document__canvas :deep(h3) { font-size: 1.14em; font-weight: 600; margin: 18px 0 8px; }
.lesson-document__canvas :deep(ul),
.lesson-document__canvas :deep(ol) { margin: 0 0 14px; padding-left: 26px; }
.lesson-document__canvas :deep(li) { margin: 4px 0; }
.lesson-document__canvas :deep(a) { color: #b45309; text-decoration: underline; }
.lesson-document__canvas :deep(blockquote) {
  margin: 16px 0; padding-left: 14px; border-left: 3px solid #f3d9b1; color: #4b5563;
}
.lesson-document__canvas :deep(img) { max-width: 100%; height: auto; }

/* ── Word-style formatting bar ──────────────────────────────────────────── */
.doc-format-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin: 0 0 14px;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.97);
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
  position: sticky;
  top: 6px;
  z-index: 40;
}

.doc-format-bar__group { display: flex; align-items: center; gap: 4px; }
.doc-format-bar__group--swatches { gap: 3px; }

.doc-format-bar__select {
  height: 28px;
  border: 1px solid #e5e7eb;
  border-radius: 7px;
  background: #fff;
  font-size: 12px;
  color: #374151;
  padding: 0 6px;
}
.doc-format-bar__select--size { width: 74px; }

.doc-format-bar__btn {
  height: 28px;
  min-width: 28px;
  padding: 0 8px;
  border: 1px solid #e5e7eb;
  border-radius: 7px;
  background: #fff;
  font-size: 12px;
  color: #374151;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.doc-format-bar__btn:hover { background: #fff7ed; border-color: #fdba74; }
.doc-format-bar__btn:focus-visible { outline: 2px solid #f59e0b; outline-offset: 1px; }
.doc-format-bar__btn--icon { font-size: 13px; }
.doc-format-bar__btn--insert { color: #b45309; border-color: #fde68a; background: #fffbeb; }

.doc-format-bar__divider { width: 1px; height: 18px; background: #e5e7eb; }

.doc-format-bar__swatch-label { font-size: 11px; color: #9ca3af; margin-right: 2px; }
.doc-format-bar__swatch {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid rgba(15, 23, 42, 0.15);
  cursor: pointer;
  padding: 0;
}
.doc-format-bar__swatch--highlight { border-style: dashed; }

/* The picker is driven by the "+ Picture" button, never shown directly. */
.doc-format-bar__file { display: none; }

.doc-upload-error {
  margin: -6px 0 12px;
  padding: 8px 12px;
  border: 1px solid #fca5a5;
  border-radius: 8px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 12.5px;
}

.lesson-float__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  border: 1px dashed #d1d5db;
  border-radius: 10px;
  background: #f9fafb;
  color: #9ca3af;
  font-size: 12.5px;
}

/* ── Floats ─────────────────────────────────────────────────────────────── */
.lesson-float { box-sizing: border-box; overflow-wrap: break-word; position: relative; }

.lesson-float__handle {
  position: absolute;
  top: -10px;
  left: -10px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #b45309;
  background: #fff;
  border: 1px solid #fdba74;
  border-radius: 6px;
  cursor: grab;
  z-index: 3;
  opacity: 0;
  transition: opacity 0.15s ease;
}
.lesson-document--editable .lesson-float:hover .lesson-float__handle { opacity: 1; }

/*
 * Delete lives on the element, so removing a text box never depends on finding a
 * toolbar first. Hidden until the element is hovered or selected, and never
 * rendered for students.
 */
.lesson-float__delete {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  line-height: 1;
  color: #b91c1c;
  background: #fff;
  border: 1px solid #fca5a5;
  border-radius: 6px;
  cursor: pointer;
  z-index: 4;
  opacity: 0;
  transition: opacity 0.15s ease, background 0.15s ease;
}
.lesson-document--editable .lesson-float:hover .lesson-float__delete,
.lesson-document--editable .lesson-float.is-selected .lesson-float__delete { opacity: 1; }
.lesson-float__delete:hover { background: #fef2f2; }

/* Resize corner: a box that was moved must never become un-resizable. */
.lesson-float__resize {
  position: absolute;
  right: -6px;
  bottom: -6px;
  width: 14px;
  height: 14px;
  border-radius: 3px;
  border: 1px solid #fdba74;
  background: #fff;
  cursor: nwse-resize;
  z-index: 4;
  opacity: 0;
  transition: opacity 0.15s ease;
}
.lesson-document--editable .lesson-float:hover .lesson-float__resize,
.lesson-document--editable .lesson-float.is-selected .lesson-float__resize { opacity: 1; }

/* Dragging inside a document must not select text or scroll the page. */
.lesson-document--editable .lesson-float,
.lesson-document--editable .lesson-float__handle,
.lesson-document--editable .lesson-float__resize { touch-action: none; }
.lesson-float__delete:focus-visible { opacity: 1; outline: 2px solid #f59e0b; outline-offset: 1px; }

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

.lesson-float__caption { margin: 0 0 6px; font-size: 13px; font-weight: 600; color: #92400e; }

/* Editable body. The wrapper is non-editable so dragging cannot select the
   page, so the text has to advertise itself: caret cursor, visible focus, and a
   prompt when the element is still empty. */
.lesson-document--editable .lesson-float__body[contenteditable="true"] {
  cursor: text;
  min-height: 1.5em;
  outline: none;
}
.lesson-document--editable .lesson-float__body[contenteditable="true"]:focus {
  outline: 2px solid #fdba74;
  outline-offset: 2px;
  border-radius: 6px;
}
.lesson-document--editable .lesson-float__body[contenteditable="true"]:empty::before {
  content: 'Type here…';
  color: #9ca3af;
  font-style: italic;
  pointer-events: none;
}

.lesson-float--code .lesson-float__body {
  background: #0f172a; border-color: #1e293b; color: #e2e8f0;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13.5px; overflow-x: auto;
}
.lesson-float--code .lesson-float__caption { color: #fbbf24; }

.lesson-float__figure { margin: 0; }
.lesson-float__figure img { display: block; width: 100%; height: auto; border-radius: 10px; }
.lesson-float__figure figcaption { margin-top: 6px; font-size: 12.5px; color: #6b7280; }

.lesson-float--overlay { margin: 0; }

.lesson-document--editable .lesson-float {
  cursor: grab;
  outline: 1px dashed transparent;
  outline-offset: 3px;
  transition: box-shadow 0.15s ease, outline-color 0.15s ease;
}
.lesson-document--editable .lesson-float:hover { outline-color: rgba(245, 158, 11, 0.55); }
.lesson-document--editable .lesson-float.is-selected { outline-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15); }
.lesson-document--editable .lesson-float.is-locked { cursor: default; }
.lesson-float.is-dragging { cursor: grabbing; z-index: 55 !important; box-shadow: 0 12px 28px rgba(15, 23, 42, 0.18); }
.lesson-document--editable .lesson-float.is-dragging,
.lesson-document--editable .lesson-float.is-dragging * { user-select: none; }

/* ── Contextual controls ────────────────────────────────────────────────── */
/*
 * Anchored to the element, not to the viewport: position/left/top/transform come
 * from `controlsStyle` so the bar always sits directly above what was selected.
 */
.float-controls {
  z-index: 60;
  max-width: min(100%, 640px);
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

.float-controls__label { font-weight: 600; padding: 0 4px; color: #6b7280; white-space: nowrap; }

.float-controls__select {
  height: 28px; border: 1px solid #e5e7eb; border-radius: 7px; background: #fff;
  font-size: 12px; padding: 0 6px; color: #374151;
}

.float-controls__btn {
  height: 28px; min-width: 28px; padding: 0 8px; border: 1px solid #e5e7eb; border-radius: 7px;
  background: #fff; font-size: 12px; color: #374151; cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}
.float-controls__btn:hover { background: #fff7ed; border-color: #fdba74; }
.float-controls__btn:focus-visible { outline: 2px solid #f59e0b; outline-offset: 1px; }
.float-controls__btn.is-active { background: #fff7ed; border-color: #f59e0b; color: #b45309; }
.float-controls__btn--danger:hover { background: #fef2f2; border-color: #fca5a5; color: #b91c1c; }

.float-controls__divider { width: 1px; height: 18px; background: #e5e7eb; }

@media (max-width: 720px) {
  .doc-format-bar { position: static; }
  .float-controls { flex-wrap: wrap; }
}
</style>
