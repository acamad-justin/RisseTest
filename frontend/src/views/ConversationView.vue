<script setup>
/**
 * ConversationView.vue
 *
 * Route shell for /logs/:logId. Renders the shared ConversationWorkspace,
 * which resolves the Log (and its Project context) from the URL — the same
 * component used by the project routes, so nothing is duplicated.
 */
import ConversationWorkspace from '@/components/conversation/ConversationWorkspace.vue'
</script>

<template>
  <ConversationWorkspace />
</template>
