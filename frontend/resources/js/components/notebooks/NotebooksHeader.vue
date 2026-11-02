<script setup>
/**
 * NotebooksHeader.vue
 * Title row with search, sort, select, and + controls.
 */
import { ref, computed } from 'vue'
import { Search, ArrowUpDown, Plus, X } from '@lucide/vue'

defineProps({
  selectMode: { type: Boolean, default: false },
})

const emit = defineEmits([
  'toggle-search',
  'toggle-sort',
  'toggle-select',
  'cancel-select',
  'open-action-menu',
  'open-prompt',
])

const searchVisible = ref(false)

function toggleSearch() {
  searchVisible.value = !searchVisible.value
  emit('toggle-search', searchVisible.value)
}
</script>

<template>
  <header class="nb-header">
    <h1 class="nb-header__title">Notebook</h1>

    <div class="nb-header__controls">
      <!-- Search icon -->
      <button
        class="nb-header__icon-btn"
        type="button"
        :aria-label="searchVisible ? 'Close search' : 'Open search'"
        @click="toggleSearch"
      >
        <X    v-if="searchVisible" :size="20" aria-hidden="true" />
        <Search v-else             :size="20" aria-hidden="true" />
      </button>

      <!-- Sort icon -->
      <button
        class="nb-header__icon-btn"
        type="button"
        aria-label="Sort"
        @click="$emit('toggle-sort')"
      >
        <ArrowUpDown :size="20" aria-hidden="true" />
      </button>

      <!-- Select button -->
      <button
        v-if="!selectMode"
        class="nb-header__select-btn"
        type="button"
        @click="$emit('toggle-select')"
      >
        Select
      </button>
      <button
        v-else
        class="nb-header__select-btn nb-header__select-btn--active"
        type="button"
        @click="$emit('cancel-select')"
      >
        Cancel
      </button>

      <!-- Orange plus button -->
      <button
        class="nb-header__plus-btn"
        type="button"
        aria-label="New item"
        @click="$emit('open-action-menu', $event)"
      >
        <Plus :size="24" aria-hidden="true" />
      </button>
    </div>
  </header>
</template>

<style scoped>
.nb-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 36px 32px 20px 40px;
  flex-shrink: 0;
}

.nb-header__title {
  font-family: "Momo Trust Display";
  font-weight: 400;
  font-style: Regular;
  font-size: 50px;
  line-height: 100%;
  letter-spacing: 0%;
  vertical-align: middle;
  color: #1a1a2e;
}

.nb-header__controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Icon-only buttons */
.nb-header__icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 27px;
  height: 23px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #000000;
  cursor: pointer;
  transition: background 150ms ease, color 150ms ease;
  top: 5px;
  right: 15px;
  transform: rotate(0deg);
  position: relative;
}

.nb-header__icon-btn:hover,
.nb-header__icon-btn:focus-visible {
  background: #f0eff8;
  color: #1a1a2e;
  outline: 2px solid #d0cff0;
  outline-offset: 1px;
}

/* Select / Cancel text button */
.nb-header__select-btn {
  font-family: Lexend;
  font-weight: 400;
  font-style: Regular;
  font-size: 20px;
  line-height: 120%;
  letter-spacing: 0%;
  vertical-align: middle;
  color: #272727;
  background: transparent;
  border: 1px solid #a7a6a6;
  border-radius: 10px;
  padding: 5px 13px;
  cursor: pointer;
  transition: background 150ms ease, color 150ms ease;
  margin-top: 5px;
}

.nb-header__select-btn:hover,
.nb-header__select-btn:focus-visible {
  background: #f0eff8;
  outline: 2px solid #d0cff0;
  outline-offset: 1px;
}

.nb-header__select-btn--active {
  color: var(--risse-orange);
  border-color: var(--risse-orange);
}

/* Orange plus */
.nb-header__plus-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 35px;
  height: 35px;
  border-radius: 10px;
  border: 1px solid var(--risse-orange);
  opacity: 1;
  background: var(--risse-orange);
  color: #fff;
  cursor: pointer;
  transition: background 150ms ease, transform 150ms ease;
  flex-shrink: 0;
  transform: rotate(0deg);
  margin-top: 5px;
  margin-left: 10px;
}

.nb-header__plus-btn:hover,
.nb-header__plus-btn:focus-visible {
  background: var(--risse-orange-active);
  transform: scale(1.08);
  outline: 2px solid rgba(255, 144, 0, 0.35);
  outline-offset: 2px;
}
</style>
