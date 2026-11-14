<!-- frontend/resources/js/components/ModuleExperience.vue -->
<!--
  THE STUDENT MODULE EXPERIENCE.

  One component renders the module journey for BOTH audiences:

    • Students      → ModuleRoadmapView → CheckpointContentView(lesson)
    • Teacher Preview → the same two components, plus editing affordances

  There is deliberately no second renderer, no preview-only layout and no
  editor wrapper. The teacher gets the identical tree a student gets; the only
  differences are the props passed down:

    readOnly   → suppresses every student-owned write (progress, mastery,
                 stars, badges, checkpoint completion, bookmarks)
    editable   → turns on inline editing / resizing / Layout Mode in the lesson

  Because `readOnly` is expressed as props rather than a separate code path,
  the teacher literally cannot diverge from the student presentation.
-->
<template>
  <div class="module-experience">
    <!-- Module roadmap: the real student progression screen. -->
    <ModuleRoadmapView
      v-if="viewState === 'roadmap'"
      :module-data="moduleData"
      :read-only="readOnly"
      @back="$emit('back')"
      @select-checkpoint="handleSelectCheckpoint"
      @award-badge="handleAwardBadge"
      @notify="forwardNotify"
      @update-module="handleUpdateModule"
    />

    <!-- Lesson / checkpoint: the real student renderer, optionally editable. -->
    <CheckpointContentView
      v-else
      :checkpoint-title="checkpointTitle"
      :parent-module-name="moduleData?.title"
      :module-data="moduleData"
      :checkpoint-data="checkpointData"
      :course-id="resolvedCourseId"
      :editable="editable"
      :preview-mode="editable"
      :read-only="readOnly"
      :layout-mode="layoutMode"
      :snap-to-grid="snapToGrid"
      @back="viewState = 'roadmap'"
      @notify="forwardNotify"
      @complete-checkpoint="handleCheckpointCompleted"
      @update-lesson-content="$emit('update-lesson-content', $event)"
      @update-block-layout="$emit('update-block-layout', $event)"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import ModuleRoadmapView from './ModuleRoadmapView.vue';
import CheckpointContentView from './CheckpointContentView.vue';

const props = defineProps({
  /** Course the module belongs to; lesson images are stored under it. */
  courseId: { type: String, default: '' },

  /** Module being experienced (student shape: checkpoints, currentStep, …). */
  moduleData: { type: Object, default: () => ({}) },

  /** Which screen to show first. */
  initialView: { type: String, default: 'roadmap' },

  /** Checkpoint to open directly (teacher preview jumps into a lesson). */
  initialCheckpoint: { type: Object, default: null },

  /**
   * Suppresses every student-owned side effect. Teacher preview sets this;
   * the student workspace never does.
   */
  readOnly: { type: Boolean, default: false },

  /** Inline editing + resize + Layout Mode. Teacher preview only. */
  editable: { type: Boolean, default: false },
  layoutMode: { type: Boolean, default: false },
  snapToGrid: { type: Boolean, default: false },

  /** Whether the lesson may be opened from the roadmap at all. */
  allowLockedNavigation: { type: Boolean, default: false },
});

const emit = defineEmits([
  'notify',
  'back',
  'complete-checkpoint',
  'update-module',
  'award-badge',
  'select-checkpoint',
  'update-lesson-content',
  'update-block-layout',
]);

/** Course id for lesson media, from the prop or from the module itself. */
const resolvedCourseId = computed(() =>
  String(props.courseId || props.moduleData?.course_id || props.moduleData?.courseId || '')
);

const viewState = ref(props.initialView === 'lesson' ? 'lesson' : 'roadmap');
const activeCheckpoint = ref(props.initialCheckpoint);

/**
 * Follow the owner's requested view.
 *
 * The student app drives `initialView` from its own state (`roadmap` ↔
 * `checkpoint`), and the teacher's preview bumps the checkpoint when jumping
 * between lessons. Watching both keeps ONE navigation model: the experience
 * never holds a private copy of the route that can drift from its owner.
 */
watch(
  () => props.initialView,
  view => {
    if (view === 'lesson' && !activeCheckpoint.value) return; // nothing to open yet
    viewState.value = view === 'lesson' ? 'lesson' : 'roadmap';
  }
);

watch(
  () => props.initialCheckpoint,
  cp => {
    if (!cp) return;
    activeCheckpoint.value = cp;
    viewState.value = 'lesson';
  }
);

const checkpointTitle = computed(
  () =>
    activeCheckpoint.value?.title ||
    activeCheckpoint.value?.name ||
    'Checkpoint'
);

/**
 * The checkpoint handed to the renderer.
 *
 * `activeCheckpoint` records WHICH lesson is open; the data is always re-read
 * from the owner's `moduleData` so the renderer follows the live draft. Keeping
 * a snapshot here meant the renderer kept showing the copy captured at
 * navigation time, so an accepted resize or drag was immediately overwritten by
 * that stale object on the next render.
 */
const checkpointData = computed(() => {
  const active = activeCheckpoint.value;
  if (!active) return null;

  const live =
    (props.moduleData?.checkpoints || []).find(cp =>
      active.id != null ? cp.id === active.id : (cp.title || cp.name) === (active.title || active.name)
    ) || active;

  return {
    ...live,
    title: live.title || live.name || 'Checkpoint',
  };
});

function handleSelectCheckpoint(cp) {
  activeCheckpoint.value = cp;
  viewState.value = 'lesson';
  emit('select-checkpoint', cp);
}

/**
 * Proxy the renderer's completion event. In read-only mode the renderer already
 * refuses to emit it, but guard here too so no caller can persist progress on a
 * teacher's behalf.
 */
function handleCheckpointCompleted(payload) {
  if (props.readOnly) return;
  emit('complete-checkpoint', payload);
}

/**
 * Roadmap progress changes. Read-only mode forwards nothing, so the module's
 * currentStep/progress can never be written while previewing.
 */
function handleUpdateModule(payload) {
  if (props.readOnly) return;
  emit('update-module', payload);
}

function handleAwardBadge(payload, skills) {
  if (props.readOnly) return;
  emit('award-badge', payload, skills);
}

function forwardNotify(message) {
  emit('notify', message);
}
</script>

<style scoped>
.module-experience {
  /* Transparent: the experience IS the student layout. No wrapper styling, no
     background, no padding — anything here would shift the student module. */
  display: contents;
}
</style>
