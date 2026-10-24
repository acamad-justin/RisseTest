<script setup>
/**
 * HomeToolbar.vue
 * Top-right utility bar — search (icon on right), bell, profile.
 * Matches the reference screenshot: pill input with muted indigo/purple tint,
 * search icon on the right side, two small icon-only buttons.
 */
import { Binoculars, Bell, UserRound } from 'lucide-vue-next'

const props = defineProps({
  modelValue: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'search'])

function onInput(e)  { emit('update:modelValue', e.target.value) }
function clear()     { emit('update:modelValue', '') }
function onSearch()  { emit('search', props.modelValue) }
</script>

<template>
  <div class="toolbar">
    <!-- Search pill — matching image reference: solid purple pill, no internal border/outline -->
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
        @keydown.enter="onSearch"
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
      <button
        class="toolbar__search-btn"
        type="button"
        aria-label="Search"
        @click.stop="onSearch"
      >
        <Binoculars class="toolbar__search-icon" :size="17" aria-hidden="true" />
      </button>
    </label>

    <!-- Notification -->
    <button
      class="toolbar__icon-btn"
      type="button"
      aria-label="Notifications"
    >
      <Bell :size="20" aria-hidden="true" />
    </button>

    <!-- Profile -->
    <button
      class="toolbar__icon-btn"
      type="button"
      aria-label="Profile"
    >
      <UserRound :size="20" aria-hidden="true" />
    </button>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  margin-right: 28px;
}

/* ── Search pill (image reference: solid purple, no border/outline) ── */
.toolbar__search {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #5044b8;   /* solid vibrant purple matching reference */
  border: none;
  outline: none;
  border-radius: 999px;
  padding: 0 16px;
  height: 38px;
  width: 300px;
  cursor: text;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.16);
  transition: background 150ms ease, box-shadow 150ms ease;
}

.toolbar__search:focus-within {
  background: #5c4ec8;
  border: none;
  outline: none;
  box-shadow: 0 4px 14px rgba(80, 68, 184, 0.35);
}

.toolbar__input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #ffffff;
  font-size: 12px;
  font-family: inherit;
  font-weight: 400;
  min-width: 0;
}

.toolbar__input::placeholder {
  color: rgba(255, 255, 255, 0.72);
}

.toolbar__input::-webkit-search-cancel-button { display: none; }

.toolbar__clear {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.65);
  font-size: 11px;
  cursor: pointer;
  padding: 2px;
  line-height: 1;
  flex-shrink: 0;
  transition: color 120ms ease;
}
.toolbar__clear:hover { color: #fff; }

.toolbar__search-btn {
  background: none;
  border: none;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #ffffff;
  border-radius: 50%;
  transition: transform 120ms ease, opacity 120ms ease;
  flex-shrink: 0;
}
.toolbar__search-btn:hover {
  transform: scale(1.15);
  opacity: 0.9;
}

.toolbar__search-icon {
  color: #ffffff;
  flex-shrink: 0;
}

/* ── Icon buttons (no circular border, increased size to 40px) ── */
.toolbar__icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.90);
  cursor: pointer;
  transition: background 150ms ease, color 150ms ease, transform 150ms ease;
  flex-shrink: 0;
}

.toolbar__icon-btn:hover {
  background: rgba(255, 255, 255, 0.14);
  color: #ffffff;
  transform: scale(1.06);
}

.toolbar__icon-btn:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.35);
  outline-offset: 1px;
}
</style>
