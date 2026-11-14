<template>
  <!--
    The mentor's preview controls.

    Rendered inside the lesson header's action row, immediately before the
    student's "Complete Checkpoint" action, so the two sit on one line and are
    aligned by the row itself — no measured coordinates, no overlay, nothing to
    drift when the title length or the window changes.

    It is a single component used by the preview host in both placements (in the
    lesson header, and in the corner when the module roadmap is showing), so there
    is one definition of these controls, not two copies.

    The ids are part of the Studio's contract (`btn-close-student-experience`,
    `btn-toggle-editing-mode`) and must not change.
  -->
  <div class="preview-toolbar" role="group" aria-label="Mentor preview controls">
    <button
      type="button"
      class="preview-toolbar__btn preview-toolbar__btn--ghost"
      title="Leave preview and return to Module Studio (Esc)"
      id="btn-close-student-experience"
      @click="$emit('exit')"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
      </svg>
      <span class="preview-toolbar__label">Exit Preview</span>
    </button>

    <button
      type="button"
      class="preview-toolbar__btn"
      :class="{ 'is-active': editing }"
      :aria-pressed="editing"
      :title="editing ? 'Stop editing and see the plain student view' : 'Enable editing on this lesson'"
      id="btn-toggle-editing-mode"
      @click="$emit('toggle-edit')"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
      <span class="preview-toolbar__label">{{ editing ? 'Editing On' : 'Edit' }}</span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  /** Whether the lesson is in editing mode (drives the toggle's pressed state). */
  editing: { type: Boolean, default: false },
});

defineEmits(['exit', 'toggle-edit']);
</script>

<style scoped>
/*
 * Sized to sit beside the student's checkpoint action rather than over it: the
 * same 12px type and a 24px control height inside a 30px pill, so the row reads
 * as one line of controls.
 */
.preview-toolbar {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
  white-space: nowrap;
}

.preview-toolbar__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-height: 24px;
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  color: #475569;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.preview-toolbar__btn:hover:not(:disabled) {
  background: #f1f5f9;
  color: #1e293b;
}

.preview-toolbar__btn.is-active {
  background: #fff7ed;
  border-color: #fdba74;
  color: #c2410c;
}

.preview-toolbar__btn.is-active:hover:not(:disabled) {
  background: #ffedd5;
}

/* Narrow workspaces: keep the controls, drop the words. Every control keeps its
   title and accessible name. */
@media (max-width: 1024px) {
  .preview-toolbar__label {
    display: none;
  }

  .preview-toolbar__btn {
    padding: 0 7px;
  }
}
</style>
