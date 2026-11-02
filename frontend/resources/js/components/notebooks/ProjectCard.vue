<script setup>
import { ref } from 'vue'
import { Star, MoreVertical } from '@lucide/vue'

/**
 * ProjectCard.vue — a single project card in the grid.
 */
const props = defineProps({
  project:   { type: Object, required: true },
  logCount:  { type: Number, default: 0 },
  selected:  { type: Boolean, default: false },
  selectMode:{ type: Boolean, default: false },
})

const emit = defineEmits(['open', 'toggle-select', 'toggle-favorite', 'rename', 'delete'])

// ── local UI state ─────────────────────────────────────────────────────────
const menuOpen = ref(false)

function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

function handleCardClick() {
  if (props.selectMode) {
    emit('toggle-select', props.project.id)
  } else {
    emit('open', props.project.id)
  }
}

function toggleFavorite(e) {
  e.stopPropagation()
  emit('toggle-favorite', props.project.id)
}

function toggleMenu(e) {
  e.stopPropagation()
  menuOpen.value = !menuOpen.value
}

function onRename(e) {
  e.stopPropagation()
  menuOpen.value = false
  emit('rename', props.project.id)
}

function onDelete(e) {
  e.stopPropagation()
  menuOpen.value = false
  emit('delete', props.project.id)
}

function closeMenu() {
  menuOpen.value = false
}
</script>

<template>
  <div
    class="project-card"
    :class="{
      'project-card--selected': selected,
      'project-card--selectable': selectMode,
    }"
    role="button"
    tabindex="0"
    :aria-label="`Open project ${project.title}`"
    :aria-pressed="selectMode ? selected : undefined"
    @click="handleCardClick"
    @keydown.enter="handleCardClick"
    @mouseleave="closeMenu"
  >
    <!-- Selection checkbox (select mode) -->
    <span v-if="selectMode" class="project-card__checkbox" aria-hidden="true">
      <span v-if="selected" class="project-card__check">✓</span>
    </span>

    <!-- ── Top row: title + hover actions ── -->
    <div class="project-card__top">
      <p class="project-card__title">{{ project.title }}</p>

      <!-- Actions: only visible on hover -->
      <div class="project-card__actions" @click.stop>
        <!-- Favorite / star -->
        <button
          class="project-card__icon-btn"
          :class="{ 'project-card__icon-btn--active': project.favorite }"
          :aria-label="project.favorite ? 'Unfavorite' : 'Favorite'"
          @click="toggleFavorite"
        >
          <Star
            :size="20"
            :fill="project.favorite ? 'currentColor' : 'none'"
            aria-hidden="true"
          />
        </button>

        <!-- 3-dot menu -->
        <div class="project-card__menu-wrap">
          <button
            class="project-card__icon-btn"
            :aria-label="menuOpen ? 'Close menu' : 'More options'"
            :aria-expanded="menuOpen"
            @click="toggleMenu"
          >
            <MoreVertical :size="20" aria-hidden="true" />
          </button>

          <transition name="menu-fade">
            <ul v-if="menuOpen" class="project-card__dropdown" role="menu">
              <li role="menuitem">
                <button class="project-card__dropdown-item" @click="onRename">
                  Rename
                </button>
              </li>
              <li role="menuitem">
                <button class="project-card__dropdown-item project-card__dropdown-item--danger" @click="onDelete">
                  Delete
                </button>
              </li>
            </ul>
          </transition>
        </div>
      </div>
    </div>

    <!-- ── Footer: date + log count ── -->
    <div class="project-card__footer">
      <span class="project-card__date">{{ fmtDate(project.createdAt) }}</span>
      <span class="project-card__logs">{{ logCount }} Log{{ logCount === 1 ? '' : 's' }}</span>
    </div>
  </div>
</template>

<style scoped>
.project-card {
  position: relative;
  background: #ffffff;
  border: 1px solid #A2A2A2;
  border-radius: 25px;
  padding: 30px 30px 15px 30px;
  width: 100%;
  height: 162px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s ease, border-width 0.2s ease;
}

.project-card:hover {
  border-color: var(--risse-orange);
  border-width: 2px;
}

/* Show actions only on hover */
.project-card__actions {
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s ease;
  flex-shrink: 0;
}

.project-card:hover .project-card__actions {
  opacity: 1;
}

.project-card--selected {
  border-color: var(--risse-orange);
  border-width: 2px;
}

/* ── Checkbox ── */
.project-card__checkbox {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1.5px solid #c8c8e0;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.project-card--selected .project-card__checkbox {
  background: var(--risse-orange);
  border-color: var(--risse-orange);
}

.project-card__check {
  font-size: 10px;
  color: #fff;
  font-weight: 700;
  line-height: 1;
}

/* ── Top row ── */
.project-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

/* ── Content ── */
.project-card__title {
  font-family: Lexend;
  font-size: 25px;
  font-weight: 400;
  line-height: 120%;
  letter-spacing: 0%;
  vertical-align: middle;
  color: #1a1a2e;
  margin: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── Icon buttons ── */
.project-card__icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #1a1a2e;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  padding: 0;
}

.project-card__icon-btn:hover {
  background: #f4f4f4;
}

.project-card__icon-btn--active {
  color: var(--risse-orange);
}

/* ── Dropdown menu ── */
.project-card__menu-wrap {
  position: relative;
}

.project-card__dropdown {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  min-width: 130px;
  background: #ffffff;
  border: 1px solid #e4e4f0;
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.10);
  list-style: none;
  margin: 0;
  padding: 4px 0;
  z-index: 100;
}

.project-card__dropdown-item {
  width: 100%;
  text-align: left;
  padding: 8px 14px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-family: 'Lexend', sans-serif;
  font-size: 13px;
  font-weight: 400;
  color: #1a1a2e;
  transition: background 0.12s ease;
}

.project-card__dropdown-item:hover {
  background: #f4f4f4;
}

.project-card__dropdown-item--danger {
  color: #e03e3e;
}

.project-card__dropdown-item--danger:hover {
  background: #fff0f0;
}

/* ── Menu transition ── */
.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}
.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ── Footer ── */
.project-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.project-card__date,
.project-card__logs {
  font-family: 'Lexend', sans-serif;
  font-weight: 400;
  font-style: normal;
  font-size: 18.54px;
  line-height: 120%;
  letter-spacing: 0%;
  vertical-align: middle;
  color: #9999bb;
}
</style>
