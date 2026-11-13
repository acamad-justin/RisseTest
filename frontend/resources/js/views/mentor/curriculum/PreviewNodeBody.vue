<!-- frontend/resources/js/views/mentor/curriculum/PreviewNodeBody.vue -->
<!--
  Renders ONE learning node with the real student lesson component (CheckpointContentView),
  in read-only preview mode. No fallback renderer: what the teacher sees is what students see.

  - Node data is mapped by toStudentCheckpoint / toStudentModuleData (modulePreview.js) into the
    shape the student roadmap normally supplies.
  - `previewMode` makes CheckpointContentView skip every student-record write (see that file).
-->
<template>
  <div class="pnb-host">
    <CheckpointContentView
      :checkpoint-title="checkpointData.title"
      :parent-module-name="moduleTitle"
      :module-data="moduleData"
      :checkpoint-data="checkpointData"
      :preview-mode="true"
      @back="$emit('back')"
      @notify="$emit('notify', $event)"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import CheckpointContentView from '../../../components/CheckpointContentView.vue';
import { toStudentCheckpoint, toStudentModuleData } from './modulePreview.js';

const props = defineProps({
  nodes: { type: Array, default: () => [] },   // snapshot, in display order
  index: { type: Number, default: 0 },
  moduleTitle: { type: String, default: '' },
  moduleId: { type: [String, Number], default: null },
  description: { type: String, default: '' },
});
defineEmits(['back', 'notify']);

const moduleData = computed(() => toStudentModuleData({
  nodes: props.nodes, index: props.index, moduleTitle: props.moduleTitle, moduleId: props.moduleId, description: props.description,
}));
const checkpointData = computed(() => toStudentCheckpoint(props.nodes[props.index], props.index));
</script>

<style scoped>
/* CheckpointContentView sizes itself to height: 100%, so give it a definite box. */
.pnb-host { position: absolute; inset: 0; }
</style>