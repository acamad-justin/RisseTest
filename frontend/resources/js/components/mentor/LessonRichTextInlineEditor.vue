<template>
  <div
    class="risse-word-inline-editor"
    ref="editorRootRef"
    @click.stop
  >
    <!-- Compact Microsoft Word-Style Formatting Toolbar -->
    <div
      v-if="editor"
      class="word-formatting-toolbar"
      role="toolbar"
      aria-label="Lesson Text Formatting Toolbar"
    >
      <!-- Group 1: Heading / Paragraph Style & Font Size -->
      <div class="toolbar-group">
        <select
          class="toolbar-select toolbar-heading-select"
          :value="currentHeadingValue"
          @change="handleHeadingChange($event.target.value)"
          title="Paragraph / Heading Style"
          aria-label="Heading Style"
        >
          <option value="paragraph">Normal Text</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>

        <select
          class="toolbar-select toolbar-size-select"
          :value="currentFontSizeValue"
          @change="handleFontSizeChange($event.target.value)"
          title="Font Size"
          aria-label="Font Size"
        >
          <option value="">Default</option>
          <option v-for="sz in FONT_SIZES" :key="sz.value" :value="sz.value">
            {{ sz.label }}
          </option>
        </select>
      </div>

      <span class="toolbar-divider" aria-hidden="true"></span>

      <!-- Group 2: Bold, Italic, Underline -->
      <div class="toolbar-group">
        <button
          type="button"
          class="toolbar-btn"
          :class="{ 'is-active': editor.isActive('bold') }"
          @mousedown.prevent="editor.chain().focus().toggleBold().run()"
          title="Bold (Ctrl+B)"
          aria-label="Bold"
        >
          <strong class="toolbar-glyph">B</strong>
        </button>

        <button
          type="button"
          class="toolbar-btn"
          :class="{ 'is-active': editor.isActive('italic') }"
          @mousedown.prevent="editor.chain().focus().toggleItalic().run()"
          title="Italic (Ctrl+I)"
          aria-label="Italic"
        >
          <em class="toolbar-glyph toolbar-glyph--italic">I</em>
        </button>

        <button
          type="button"
          class="toolbar-btn"
          :class="{ 'is-active': editor.isActive('underline') }"
          @mousedown.prevent="editor.chain().focus().toggleUnderline().run()"
          title="Underline (Ctrl+U)"
          aria-label="Underline"
        >
          <span class="toolbar-glyph toolbar-glyph--underline">U</span>
        </button>
      </div>

      <span class="toolbar-divider" aria-hidden="true"></span>

      <!-- Group 3: Text Color & Text Highlight -->
      <div class="toolbar-group">
        <!-- Text Color -->
        <div class="toolbar-popover-anchor">
          <button
            type="button"
            class="toolbar-btn toolbar-color-btn"
            :class="{ 'is-active': openPopover === 'color' }"
            @mousedown.prevent="togglePopover('color')"
            title="Font Color"
            aria-label="Font Color"
          >
            <span class="color-letter-icon">
              <span class="color-letter">A</span>
              <span
                class="color-indicator-bar"
                :style="{ backgroundColor: activeTextColor || '#1e293b' }"
              ></span>
            </span>
            <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="2 4 6 8 10 4" />
            </svg>
          </button>

          <div v-if="openPopover === 'color'" class="toolbar-swatch-popover" @mousedown.prevent>
            <div class="swatch-popover-title">Font Color</div>
            <div class="swatch-grid">
              <button
                v-for="swatch in TEXT_COLORS"
                :key="swatch.value"
                type="button"
                class="swatch-cell"
                :class="{ 'is-selected': activeTextColor === swatch.value }"
                :style="{ backgroundColor: swatch.value }"
                :title="swatch.label"
                @mousedown.prevent="applyTextColor(swatch.value)"
              ></button>
            </div>
            <button
              type="button"
              class="btn-reset-swatch"
              @mousedown.prevent="clearTextColor"
            >
              Automatic (Default)
            </button>
          </div>
        </div>

        <!-- Text Highlight -->
        <div class="toolbar-popover-anchor">
          <button
            type="button"
            class="toolbar-btn toolbar-color-btn"
            :class="{ 'is-active': editor.isActive('highlight') || openPopover === 'highlight' }"
            @mousedown.prevent="togglePopover('highlight')"
            title="Text Highlight Color"
            aria-label="Text Highlight Color"
          >
            <span class="color-letter-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m9 11-6 6v3h9l3-3" />
                <path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />
              </svg>
              <span
                class="color-indicator-bar"
                :style="{ backgroundColor: activeHighlightColor || '#fef08a' }"
              ></span>
            </span>
            <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="2 4 6 8 10 4" />
            </svg>
          </button>

          <div v-if="openPopover === 'highlight'" class="toolbar-swatch-popover" @mousedown.prevent>
            <div class="swatch-popover-title">Highlight Color</div>
            <div class="swatch-grid">
              <button
                v-for="hl in HIGHLIGHT_COLORS"
                :key="hl.value"
                type="button"
                class="swatch-cell swatch-cell--light"
                :class="{ 'is-selected': activeHighlightColor === hl.value }"
                :style="{ backgroundColor: hl.value }"
                :title="hl.label"
                @mousedown.prevent="applyHighlight(hl.value)"
              ></button>
            </div>
            <button
              type="button"
              class="btn-reset-swatch"
              @mousedown.prevent="clearHighlight"
            >
              No Highlight
            </button>
          </div>
        </div>
      </div>

      <span class="toolbar-divider" aria-hidden="true"></span>

      <!-- Group 4: Bulleted & Numbered Lists -->
      <div class="toolbar-group">
        <button
          type="button"
          class="toolbar-btn"
          :class="{ 'is-active': editor.isActive('bulletList') }"
          @mousedown.prevent="editor.chain().focus().toggleBulletList().run()"
          title="Bulleted List"
          aria-label="Bulleted List"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="9" y1="6" x2="20" y2="6" />
            <line x1="9" y1="12" x2="20" y2="12" />
            <line x1="9" y1="18" x2="20" y2="18" />
            <circle cx="4" cy="6" r="1.4" fill="currentColor" />
            <circle cx="4" cy="12" r="1.4" fill="currentColor" />
            <circle cx="4" cy="18" r="1.4" fill="currentColor" />
          </svg>
        </button>

        <button
          type="button"
          class="toolbar-btn"
          :class="{ 'is-active': editor.isActive('orderedList') }"
          @mousedown.prevent="editor.chain().focus().toggleOrderedList().run()"
          title="Numbered List"
          aria-label="Numbered List"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="10" y1="6" x2="21" y2="6" />
            <line x1="10" y1="12" x2="21" y2="12" />
            <line x1="10" y1="18" x2="21" y2="18" />
            <path d="M4 6h1v4" />
            <path d="M4 10h2" />
            <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
          </svg>
        </button>
      </div>

      <span class="toolbar-divider" aria-hidden="true"></span>

      <!-- Group 5: Text Alignment -->
      <div class="toolbar-group">
        <button
          type="button"
          class="toolbar-btn"
          :class="{ 'is-active': editor.isActive({ textAlign: 'left' }) || (!editor.isActive({ textAlign: 'center' }) && !editor.isActive({ textAlign: 'right' }) && !editor.isActive({ textAlign: 'justify' })) }"
          @mousedown.prevent="editor.chain().focus().setTextAlign('left').run()"
          title="Align Left"
          aria-label="Align Left"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="15" y2="12" />
            <line x1="3" y1="18" x2="18" y2="18" />
          </svg>
        </button>

        <button
          type="button"
          class="toolbar-btn"
          :class="{ 'is-active': editor.isActive({ textAlign: 'center' }) }"
          @mousedown.prevent="editor.chain().focus().setTextAlign('center').run()"
          title="Align Center"
          aria-label="Align Center"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="6" y1="12" x2="18" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </svg>
        </button>

        <button
          type="button"
          class="toolbar-btn"
          :class="{ 'is-active': editor.isActive({ textAlign: 'right' }) }"
          @mousedown.prevent="editor.chain().focus().setTextAlign('right').run()"
          title="Align Right"
          aria-label="Align Right"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="9" y1="12" x2="21" y2="12" />
            <line x1="6" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <button
          type="button"
          class="toolbar-btn"
          :class="{ 'is-active': editor.isActive({ textAlign: 'justify' }) }"
          @mousedown.prevent="editor.chain().focus().setTextAlign('justify').run()"
          title="Justify"
          aria-label="Justify"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      <!-- Right Action: Finish Inline Section Focus -->
      <div class="toolbar-right">
        <button
          type="button"
          class="btn-done-inline-edit"
          @mousedown.prevent="$emit('done')"
          title="Finish editing this block"
        >
          ✓ Done
        </button>
      </div>
    </div>

    <!-- Rich-Text WYSIWYG Document Surface -->
    <EditorContent :editor="editor" class="word-editor-surface lesson-rich-html-body" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import { StarterKit } from '@tiptap/starter-kit';
import { TextStyle, Color, FontSize } from '@tiptap/extension-text-style';
import { TextAlign } from '@tiptap/extension-text-align';
import { Highlight } from '@tiptap/extension-highlight';
import { Image } from '@tiptap/extension-image';
import {
  prepareContentForEditor,
  sanitizeLessonHtml,
} from '../../../../lib/mentor/richLessonContent.ts';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  autoFocus: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['update:modelValue', 'done']);

const editorRootRef = ref(null);
const openPopover = ref(null); // 'color' | 'highlight' | null
let lastEmittedHtml = '';

const FONT_SIZES = [
  { label: '12 pt', value: '12px' },
  { label: '14 pt', value: '14px' },
  { label: '16 pt', value: '16px' },
  { label: '18 pt', value: '18px' },
  { label: '20 pt', value: '20px' },
  { label: '24 pt', value: '24px' },
  { label: '28 pt', value: '28px' },
];

const TEXT_COLORS = [
  { label: 'Charcoal (Default)', value: '#1e293b' },
  { label: 'Slate Gray', value: '#475569' },
  { label: 'RISSE Orange', value: '#ea580c' },
  { label: 'Crimson Red', value: '#dc2626' },
  { label: 'Forest Green', value: '#15803d' },
  { label: 'Royal Blue', value: '#2563eb' },
  { label: 'Deep Violet', value: '#7c3aed' },
  { label: 'Warm Amber', value: '#b45309' },
];

const HIGHLIGHT_COLORS = [
  { label: 'Soft Yellow', value: '#fef08a' },
  { label: 'Warm Peach', value: '#fed7aa' },
  { label: 'Mint Green', value: '#bbf7d0' },
  { label: 'Sky Blue', value: '#bae6fd' },
  { label: 'Soft Lavender', value: '#e9d5ff' },
  { label: 'Rose Pink', value: '#fecdd3' },
];

const StaticLessonImage = Image.extend({
  draggable: false,
});

const initialPreparedHtml = prepareContentForEditor(props.modelValue);
lastEmittedHtml = initialPreparedHtml;

const editor = useEditor({
  content: initialPreparedHtml,
  autofocus: props.autoFocus ? 'end' : false,
  extensions: [
    StarterKit.configure({
      dropcursor: false,
      heading: {
        levels: [1, 2, 3],
      },
    }),
    TextStyle,
    Color,
    FontSize,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    Highlight.configure({
      multicolor: true,
    }),
    StaticLessonImage.configure({
      inline: false,
      allowBase64: true,
    }),
  ],
  editorProps: {
    handleDrop: () => true, // Prevent drag-and-drop block/image repositioning
  },
  onUpdate: ({ editor: ed }) => {
    const clean = sanitizeLessonHtml(ed.getHTML());
    lastEmittedHtml = clean;
    emit('update:modelValue', clean);
  },
});

// If legacy Markdown was promoted to HTML upon opening, emit normalized HTML only if user edits,
// while syncing external changes (e.g., switching lessons or reverting) cleanly.
watch(
  () => props.modelValue,
  newVal => {
    if (!editor.value) return;
    const prepared = prepareContentForEditor(newVal);
    if (newVal === lastEmittedHtml || prepared === lastEmittedHtml) return;
    lastEmittedHtml = prepared;
    editor.value.commands.setContent(prepared, false);
  }
);

const currentHeadingValue = computed(() => {
  const ed = editor.value;
  if (!ed) return 'paragraph';
  if (ed.isActive('heading', { level: 1 })) return 'h1';
  if (ed.isActive('heading', { level: 2 })) return 'h2';
  if (ed.isActive('heading', { level: 3 })) return 'h3';
  return 'paragraph';
});

const currentFontSizeValue = computed(() => {
  const ed = editor.value;
  if (!ed) return '';
  return ed.getAttributes('textStyle')?.fontSize || '';
});

const activeTextColor = computed(() => {
  const ed = editor.value;
  if (!ed) return '';
  return ed.getAttributes('textStyle')?.color || '';
});

const activeHighlightColor = computed(() => {
  const ed = editor.value;
  if (!ed) return '';
  return ed.getAttributes('highlight')?.color || '';
});

function handleHeadingChange(value) {
  const ed = editor.value;
  if (!ed) return;
  if (value === 'h1') {
    ed.chain().focus().toggleHeading({ level: 1 }).run();
  } else if (value === 'h2') {
    ed.chain().focus().toggleHeading({ level: 2 }).run();
  } else if (value === 'h3') {
    ed.chain().focus().toggleHeading({ level: 3 }).run();
  } else {
    ed.chain().focus().setParagraph().run();
  }
}

function handleFontSizeChange(size) {
  const ed = editor.value;
  if (!ed) return;
  if (!size) {
    ed.chain().focus().unsetFontSize().run();
  } else {
    ed.chain().focus().setFontSize(size).run();
  }
}

function togglePopover(which) {
  openPopover.value = openPopover.value === which ? null : which;
}

function applyTextColor(color) {
  if (!editor.value) return;
  editor.value.chain().focus().setColor(color).run();
  openPopover.value = null;
}

function clearTextColor() {
  if (!editor.value) return;
  editor.value.chain().focus().unsetColor().run();
  openPopover.value = null;
}

function applyHighlight(color) {
  if (!editor.value) return;
  editor.value.chain().focus().setHighlight({ color }).run();
  openPopover.value = null;
}

function clearHighlight() {
  if (!editor.value) return;
  editor.value.chain().focus().unsetHighlight().run();
  openPopover.value = null;
}

function handleOutsideMouseDown(e) {
  if (!editorRootRef.value) return;
  if (!editorRootRef.value.contains(e.target)) {
    openPopover.value = null;
  }
}

onMounted(() => {
  window.addEventListener('mousedown', handleOutsideMouseDown);
  if (props.autoFocus) {
    nextTick(() => {
      editor.value?.commands.focus('end');
    });
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('mousedown', handleOutsideMouseDown);
});
</script>

<style scoped>
.risse-word-inline-editor {
  border: 1.5px solid #f97316;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 6px 20px rgba(234, 88, 12, 0.1), 0 0 0 3px rgba(249, 115, 22, 0.12);
  overflow: visible;
  transition: box-shadow 0.15s ease;
}

.word-formatting-toolbar {
  position: sticky;
  top: 0;
  z-index: 25;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  border-radius: 9px 9px 0 0;
}

.toolbar-group {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: #cbd5e1;
  margin: 0 3px;
}

.toolbar-select {
  height: 28px;
  padding: 0 6px;
  border: 1px solid #cbd5e1;
  border-radius: 5px;
  background: #ffffff;
  color: #1e293b;
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  outline: none;
}

.toolbar-select:hover,
.toolbar-select:focus {
  border-color: #f97316;
}

.toolbar-heading-select {
  min-width: 108px;
}

.toolbar-size-select {
  min-width: 74px;
}

.toolbar-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-width: 28px;
  height: 28px;
  padding: 0 6px;
  border: 1px solid transparent;
  border-radius: 5px;
  background: transparent;
  color: #334155;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease;
}

.toolbar-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.toolbar-btn.is-active {
  background: #ffedd5;
  border-color: #fdba74;
  color: #c2410c;
}

.toolbar-glyph {
  font-size: 13.5px;
  line-height: 1;
}

.toolbar-glyph--italic {
  font-family: Georgia, 'Times New Roman', serif;
  font-weight: 700;
}

.toolbar-glyph--underline {
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.toolbar-popover-anchor {
  position: relative;
  display: inline-flex;
}

.toolbar-color-btn {
  padding: 0 5px;
  gap: 3px;
}

.color-letter-icon {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;
}

.color-letter {
  font-size: 12px;
  font-weight: 800;
  line-height: 1.05;
}

.color-indicator-bar {
  width: 14px;
  height: 3px;
  border-radius: 1.5px;
  margin-top: 1px;
  border: 1px solid rgba(15, 23, 42, 0.15);
}

.toolbar-swatch-popover {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 60;
  width: 172px;
  padding: 10px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.14);
}

.swatch-popover-title {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin-bottom: 8px;
}

.swatch-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin-bottom: 8px;
}

.swatch-cell {
  width: 28px;
  height: 24px;
  border-radius: 5px;
  border: 1.5px solid rgba(15, 23, 42, 0.15);
  cursor: pointer;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}

.swatch-cell--light {
  border-color: #cbd5e1;
}

.swatch-cell:hover {
  transform: scale(1.08);
}

.swatch-cell.is-selected {
  outline: 2px solid #ea580c;
  outline-offset: 1px;
}

.btn-reset-swatch {
  width: 100%;
  padding: 5px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 5px;
  background: #f8fafc;
  color: #334155;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

.btn-reset-swatch:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.toolbar-right {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
}

.btn-done-inline-edit {
  height: 26px;
  padding: 0 10px;
  border: none;
  border-radius: 5px;
  background: #ea580c;
  color: #ffffff;
  font-size: 11.5px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-done-inline-edit:hover {
  background: #c2410c;
}

/* Editable Surface matching Student CheckpointContentView typography */
.word-editor-surface {
  padding: 12px 14px;
}

.word-editor-surface :deep(.ProseMirror) {
  outline: none;
  min-height: 54px;
  font-size: 13.5px;
  line-height: 1.65;
  color: #334155;
}

.word-editor-surface :deep(.ProseMirror p) {
  margin: 0 0 10px 0;
}

.word-editor-surface :deep(.ProseMirror p:last-child) {
  margin-bottom: 0;
}

.word-editor-surface :deep(.ProseMirror h1) {
  font-size: 19px;
  font-weight: 800;
  color: #0f172a;
  margin: 14px 0 8px 0;
  line-height: 1.3;
}

.word-editor-surface :deep(.ProseMirror h2) {
  font-size: 16.5px;
  font-weight: 700;
  color: #0f172a;
  margin: 12px 0 8px 0;
  line-height: 1.35;
}

.word-editor-surface :deep(.ProseMirror h3) {
  font-size: 14.5px;
  font-weight: 700;
  color: #0f172a;
  margin: 10px 0 6px 0;
  line-height: 1.4;
}

.word-editor-surface :deep(.ProseMirror ul),
.word-editor-surface :deep(.ProseMirror ol) {
  margin: 0 0 12px 0;
  padding-left: 22px;
}

.word-editor-surface :deep(.ProseMirror ul) {
  list-style-type: disc;
}

.word-editor-surface :deep(.ProseMirror ol) {
  list-style-type: decimal;
}

.word-editor-surface :deep(.ProseMirror li) {
  margin-bottom: 4px;
}

.word-editor-surface :deep(.ProseMirror mark) {
  border-radius: 3px;
  padding: 1px 2px;
}

.word-editor-surface :deep(.ProseMirror code) {
  background: #f1f5f9;
  color: #0f172a;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12.5px;
  font-family: monospace;
}

.word-editor-surface :deep(.ProseMirror pre) {
  background: #0f172a;
  color: #f8fafc;
  padding: 12px 14px;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 12.5px;
  margin: 10px 0;
}

.word-editor-surface :deep(.ProseMirror img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  display: block;
  margin: 10px 0;
}
</style>
