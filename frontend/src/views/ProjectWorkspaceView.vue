<script setup>
/**
 * ProjectWorkspaceView.vue
 *
 * Route shell for:
 *   /projects/:projectId               — opens the most recently updated Log
 *   /projects/:projectId/logs/:logId   — opens a specific Log in the Project
 *
 * Both render the shared ConversationWorkspace (identical to /logs/:logId),
 * which owns route validation, default-Log selection, the collapsible
 * Project/Log navigation panel, and the conversation panel itself.
 */
import ConversationWorkspace from '@/components/conversation/ConversationWorkspace.vue'
</script>

<template>
  <ConversationWorkspace />
</template>
