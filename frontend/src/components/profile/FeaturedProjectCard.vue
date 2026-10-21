<script setup>
/**
 * FeaturedProjectCard.vue
 * Right-column project card: image area, three-dot menu, title, tags.
 */
import { ref } from 'vue'
import { MoreVertical, X, Pencil, Star } from '@lucide/vue'

const props = defineProps({
  project: { type: Object, required: true },
})

const emit = defineEmits(['remove', 'edit', 'open'])

// ── Three-dot menu ────────────────────────────────────────────────────────
const menuOpen = ref(false)

function toggleMenu(e) {
  e.stopPropagation()
  menuOpen.value = !menuOpen.value
}
function closeMenu() { menuOpen.value = false }

function onEdit()   { closeMenu(); emit('edit',   props.project.id) }
function onRemove() { closeMenu(); emit('remove', props.project.id) }
</script>

<template>
  <div
    class="fp-card"
    role="article"
    :aria-label="project.title"
    @click="$emit('open', project.id)"
  >
    <!-- Image / placeholder -->
    <div class="fp-card__image">
      <img
        v-if="project.image"
        :src="project.image"
        :alt="project.title"
        class="fp-card__img"
      />
      <!-- Gray placeholder when no image -->
      <div v-else class="fp-card__placeholder" aria-hidden="true" />

      <!-- Three-dot menu -->
      <div class="fp-card__menu-wrap" @click.stop>
        <button
          class="fp-card__menu-btn"
          type="button"
          :aria-label="`Actions for ${project.title}`"
          @click="toggleMenu"
        >
          <MoreVertical :size="15" aria-hidden="true" />
        </button>

        <Transition name="menu-pop">
          <div v-if="menuOpen" class="fp-card__dropdown" role="menu">
            <button class="fp-card__menu-item" role="menuitem" @click="onEdit">
              <Pencil :size="13" aria-hidden="true" /> Edit Featured Project
            </button>
            <button class="fp-card__menu-item fp-card__menu-item--remove" role="menuitem" @click="onRemove">
              <Star :size="13" aria-hidden="true" /> Remove from Featured
            </button>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Card body -->
    <div class="fp-card__body">
      <p class="fp-card__title">{{ project.title }}</p>
      <p class="fp-card__tags">
        <span v-for="tag in project.tags" :key="tag">#{{ tag }} </span>
      </p>
    </div>
  </div>
</template>

<style scoped>
.fp-card {
  background: #fff;
  border: 1px solid #e4e4ef;
  border-radius: 15px;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 150ms ease;
  flex-shrink: 0;   /* cards don't compress — column scrolls instead */
}

.fp-card:hover { box-shadow: 0 3px 12px rgba(0,0,0,0.07); }

/* ── Image area ── */
.fp-card__image {
  position: relative;
  height: 140px;
  background: #e8e8f0;
  overflow: hidden;
}

.fp-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.fp-card__placeholder {
  width: 100%;
  height: 100%;
  background: #e4e4ec;
}

/* ── Three-dot menu ── */
.fp-card__menu-wrap {
  position: absolute;
  top: 10px;
  right: 10px;
}

.fp-card__menu-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(255,255,255,0.85);
  color: #4a4a6a;
  cursor: pointer;
  backdrop-filter: blur(4px);
  transition: background 150ms ease;
}

.fp-card__menu-btn:hover { background: #fff; }

.fp-card__dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  z-index: var(--z-dropdown);
  background: #fff;
  border: 1px solid #e8e8f0;
  border-radius: 10px;
  padding: 4px;
  min-width: 180px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.10);
}

.fp-card__menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  text-align: left;
  font-size: 12px;
  color: #2a2a4a;
  background: transparent;
  border: none;
  border-radius: 6px;
  padding: 7px 11px;
  cursor: pointer;
  transition: background 150ms ease;
}

.fp-card__menu-item:hover { background: #f4f4fc; }
.fp-card__menu-item--remove { color: #888; }

/* ── Card body ── */
.fp-card__body {
  padding: 10px 12px 10px;
}

.fp-card__title {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a2e;
  margin-bottom: 4px;
  line-height: 1.3;
}

.fp-card__tags {
  font-size: 10.5px;
  color: #9999bb;
  line-height: 1.5;
  word-break: break-word;
}

/* Dropdown transition */
.menu-pop-enter-active, .menu-pop-leave-active { transition: opacity 140ms ease, transform 140ms ease; }
.menu-pop-enter-from,   .menu-pop-leave-to     { opacity: 0; transform: translateY(-4px); }
</style>
