<script setup>
/**
 * NotebookActionMenu.vue — dropdown with "New Project" and "New Log".
 * Positioned relative to the + button via an anchor ref.
 */
import { FolderPlus, MessageSquare } from '@lucide/vue'

defineEmits(['new-project', 'new-log', 'close'])
</script>

<template>
  <div
    class="action-menu"
    role="menu"
    aria-label="Create new item"
    @click.stop
  >
    <button class="action-menu__item" role="menuitem" @click="$emit('new-project')">
      <FolderPlus :size="14" aria-hidden="true" />
      New Project
    </button>
    <button class="action-menu__item" role="menuitem" @click="$emit('new-log')">
      <MessageSquare :size="14" aria-hidden="true" />
      New Log
    </button>
  </div>
</template>

<style scoped>
.action-menu {
  background: #fff;
  border: 1px solid #e4e4f0;
  border-radius: 10px;
  padding: 4px;
  min-width: 152px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.10);
  z-index: var(--z-dropdown);
}

.action-menu__item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  text-align: left;
  font-size: 12.5px;
  font-weight: 500;
  color: #2a2a4a;
  background: transparent;
  border: none;
  border-radius: 7px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 150ms ease;
}

.action-menu__item:hover,
.action-menu__item:focus-visible {
  background: #f4f4fc;
  outline: none;
}
</style>
