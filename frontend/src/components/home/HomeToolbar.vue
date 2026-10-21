<script setup>
/**
 * HomeToolbar.vue
 * Top-right utility bar — search (icon on right), bell, profile.
 * Matches the reference screenshot: pill input with muted indigo/purple tint,
 * search icon on the right side, two small icon-only buttons.
 */
import { Search, Bell, UserRound } from '@lucide/vue'

defineProps({
  modelValue: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

function onInput(e) { emit('update:modelValue', e.target.value) }
function clear()    { emit('update:modelValue', '') }
</script>

<template>
  <div class="toolbar">
    <!-- Search pill — icon sits on the right as per screenshot -->
    <label class="toolbar__search" for="concept-search" aria-label="Search">
      <input
        id="concept-search"
        class="toolbar__input"
        type="search"
        :value="modelValue"
        placeholder="Search concepts, topics, and projects..."
        aria-label="Search concepts"
        autocomplete="off"
        @input="onInput"
      />
      <!-- Clear button when text is present -->
      <button
        v-if="modelValue"
        class="toolbar__clear"
        type="button"
        aria-label="Clear search"
        tabindex="-1"
        @click="clear"
      >✕</button>
      <Search class="toolbar__search-icon" :size="14" aria-hidden="true" />
    </label>

    <!-- Notification -->
    <button
      class="toolbar__icon-btn"
      type="button"
      aria-label="Notifications"
    >
      <Bell :size="16" aria-hidden="true" />
    </button>

    <!-- Profile -->
    <button
      class="toolbar__icon-btn"
      type="button"
      aria-label="Profile"
    >
      <UserRound :size="16" aria-hidden="true" />
    </button>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* ── Search pill ── */
.toolbar__search {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(60, 45, 110, 0.65);   /* muted indigo-purple */
  border: 1px solid rgba(160, 140, 220, 0.22);
  border-radius: 999px;
  padding: 0 12px;
  height: 32px;
  width: 248px;
  cursor: text;
  transition: background 150ms ease, border-color 150ms ease;
}

.toolbar__search:focus-within {
  background: rgba(70, 55, 130, 0.80);
  border-color: rgba(180, 160, 240, 0.45);
  outline: 2px solid rgba(180, 160, 240, 0.30);
  outline-offset: 1px;
}

.toolbar__input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: rgba(255, 255, 255, 0.88);
  font-size: 11.5px;
  min-width: 0;
}

.toolbar__input::placeholder {
  color: rgba(200, 185, 255, 0.42);
}

.toolbar__input::-webkit-search-cancel-button { display: none; }

.toolbar__clear {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.45);
  font-size: 10px;
  cursor: pointer;
  padding: 2px;
  line-height: 1;
  flex-shrink: 0;
  transition: color 120ms ease;
}
.toolbar__clear:hover { color: #fff; }

.toolbar__search-icon {
  color: rgba(200, 185, 255, 0.55);
  flex-shrink: 0;
}

/* ── Icon buttons ── */
.toolbar__icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: transparent;
  color: rgba(255, 255, 255, 0.80);
  cursor: pointer;
  transition: background 150ms ease, color 150ms ease;
  flex-shrink: 0;
}

.toolbar__icon-btn:hover,
.toolbar__icon-btn:focus-visible {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  outline: 2px solid rgba(255, 255, 255, 0.25);
  outline-offset: 1px;
}
</style>
