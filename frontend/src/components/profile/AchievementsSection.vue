<script setup>
/**
 * AchievementsSection.vue
 * "Achievements" section label + badge grid.
 * Badge artwork is an inline SVG emblem when no image asset exists.
 */
import { ref } from 'vue'
import { X } from '@lucide/vue'

defineProps({
  achievements: { type: Array, required: true },
})

// ── Badge detail modal ────────────────────────────────────────────────────
const activeAchievement = ref(null)
function openBadge(a) { activeAchievement.value = a }
function closeModal()  { activeAchievement.value = null }
</script>

<template>
  <section class="achievements" aria-label="Achievements">
    <p class="achievements__heading">Achievements</p>

    <div class="achievements__grid">
      <div
        v-for="a in achievements"
        :key="a.id"
        class="achievements__item"
        role="button"
        tabindex="0"
        :aria-label="`View achievement: ${a.name}`"
        @click="openBadge(a)"
        @keydown.enter="openBadge(a)"
        @keydown.space.prevent="openBadge(a)"
      >
        <!-- Badge artwork -->
        <div class="achievements__badge">
          <img
            v-if="a.image"
            :src="a.image"
            :alt="a.name"
            class="achievements__badge-img"
          />
          <!-- Inline SVG emblem when no image is supplied -->
          <svg
            v-else
            viewBox="0 0 80 80"
            xmlns="http://www.w3.org/2000/svg"
            class="achievements__badge-svg"
            aria-hidden="true"
          >
            <defs>
              <radialGradient id="badgeBg" cx="50%" cy="45%" r="55%">
                <stop offset="0%"   stop-color="#9b59b6"/>
                <stop offset="100%" stop-color="#1a0533"/>
              </radialGradient>
              <linearGradient id="shimmer" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%"   stop-color="#f5c842" stop-opacity="0.55"/>
                <stop offset="100%" stop-color="#e04090" stop-opacity="0.55"/>
              </linearGradient>
            </defs>
            <!-- Rounded-square shield shape -->
            <rect x="6" y="6" width="68" height="68" rx="18" fill="url(#badgeBg)"/>
            <rect x="6" y="6" width="68" height="68" rx="18" fill="url(#shimmer)"/>
            <!-- Globe-like icon -->
            <circle cx="40" cy="37" r="17" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="2.2"/>
            <ellipse cx="40" cy="37" rx="9" ry="17" fill="none" stroke="rgba(255,255,255,0.70)" stroke-width="1.6"/>
            <line x1="23" y1="37" x2="57" y2="37" stroke="rgba(255,255,255,0.70)" stroke-width="1.6"/>
            <line x1="25" y1="28" x2="55" y2="28" stroke="rgba(255,255,255,0.45)" stroke-width="1.2"/>
            <line x1="25" y1="46" x2="55" y2="46" stroke="rgba(255,255,255,0.45)" stroke-width="1.2"/>
            <!-- Stars -->
            <circle cx="40" cy="60" r="2.4" fill="#ffd700"/>
            <circle cx="33" cy="57" r="1.6" fill="#ffd700" opacity="0.75"/>
            <circle cx="47" cy="57" r="1.6" fill="#ffd700" opacity="0.75"/>
          </svg>
        </div>

        <!-- Badge name -->
        <p class="achievements__name">{{ a.name }}</p>
      </div>
    </div>
  </section>

  <!-- Badge detail modal -->
  <Teleport to="body">
    <Transition name="overlay-fade">
      <div
        v-if="activeAchievement"
        class="badge-modal-overlay"
        role="dialog"
        aria-modal="true"
        :aria-label="activeAchievement.name"
        @click.self="closeModal"
      >
        <div class="badge-modal">
          <button
            class="badge-modal__close"
            type="button"
            aria-label="Close"
            @click="closeModal"
          >
            <X :size="14" aria-hidden="true"/>
          </button>

          <div class="badge-modal__badge">
            <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="width:72px;height:72px">
              <defs>
                <radialGradient id="bm-bg" cx="50%" cy="45%" r="55%">
                  <stop offset="0%"   stop-color="#9b59b6"/>
                  <stop offset="100%" stop-color="#1a0533"/>
                </radialGradient>
                <linearGradient id="bm-sh" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%"   stop-color="#f5c842" stop-opacity="0.55"/>
                  <stop offset="100%" stop-color="#e04090" stop-opacity="0.55"/>
                </linearGradient>
              </defs>
              <rect x="6" y="6" width="68" height="68" rx="18" fill="url(#bm-bg)"/>
              <rect x="6" y="6" width="68" height="68" rx="18" fill="url(#bm-sh)"/>
              <circle cx="40" cy="37" r="17" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="2.2"/>
              <ellipse cx="40" cy="37" rx="9" ry="17" fill="none" stroke="rgba(255,255,255,0.70)" stroke-width="1.6"/>
              <line x1="23" y1="37" x2="57" y2="37" stroke="rgba(255,255,255,0.70)" stroke-width="1.6"/>
              <line x1="25" y1="28" x2="55" y2="28" stroke="rgba(255,255,255,0.45)" stroke-width="1.2"/>
              <line x1="25" y1="46" x2="55" y2="46" stroke="rgba(255,255,255,0.45)" stroke-width="1.2"/>
              <circle cx="40" cy="60" r="2.4" fill="#ffd700"/>
              <circle cx="33" cy="57" r="1.6" fill="#ffd700" opacity="0.75"/>
              <circle cx="47" cy="57" r="1.6" fill="#ffd700" opacity="0.75"/>
            </svg>
          </div>

          <h3 class="badge-modal__title">{{ activeAchievement.name }}</h3>
          <p class="badge-modal__desc">{{ activeAchievement.description }}</p>
          <p class="badge-modal__demo">Demo achievement — not a real learner record.</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.achievements { margin-top: 14px; flex-shrink: 0; }

.achievements__heading {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--risse-orange);
  margin-bottom: 10px;
}

.achievements__grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

/* ── Badge item ── */
.achievements__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  cursor: pointer;
  outline: none;
  border-radius: 12px;
  padding: 6px;
  transition: background 150ms ease;
}

.achievements__item:hover,
.achievements__item:focus-visible {
  background: #f5f5fb;
  outline: 2px solid #d8d8f0;
  outline-offset: 1px;
}

.achievements__badge {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.achievements__badge-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.achievements__badge-svg {
  width: 64px;
  height: 64px;
}

.achievements__name {
  font-size: 11px;
  color: #2a2a4a;
  text-align: center;
  font-weight: 500;
}

/* ── Badge modal ── */
.badge-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  background: rgba(0,0,0,0.30);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.badge-modal {
  background: #fff;
  border-radius: 18px;
  padding: 28px 24px 22px;
  width: min(340px, calc(100vw - 32px));
  box-shadow: 0 8px 32px rgba(0,0,0,0.14);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  position: relative;
}

.badge-modal__close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: none;
  background: #f0f0f8;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 150ms ease;
}
.badge-modal__close:hover { background: #e4e4f0; }

.badge-modal__badge { margin-bottom: 4px; }

.badge-modal__title {
  font-size: 17px;
  font-weight: 700;
  color: #1a1a2e;
  text-align: center;
}

.badge-modal__desc {
  font-size: 13px;
  color: #5a5a7a;
  text-align: center;
  line-height: 1.55;
}

.badge-modal__demo {
  font-size: 10px;
  color: rgba(0,0,0,0.28);
  text-align: center;
  margin-top: 4px;
}

/* Transition */
.overlay-fade-enter-active, .overlay-fade-leave-active { transition: opacity 180ms ease; }
.overlay-fade-enter-from,   .overlay-fade-leave-to     { opacity: 0; }
</style>
