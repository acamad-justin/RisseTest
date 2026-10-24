<template>
  <section class="achievements-section" aria-labelledby="achievements-heading">
    <h3 class="section-heading-orange" id="achievements-heading">Achievements</h3>
    
    <div v-if="achievements && achievements.length" class="achievements-wrapper">
      <div 
        v-for="badge in achievements" 
        :key="badge.id || badge.title" 
        class="badge-item"
        @click="$emit('select-badge', badge)"
        role="button"
        tabindex="0"
        :aria-label="`Achievement Badge: ${badge.title}`"
        :id="`achievement-badge-${badge.id || badge.title}`"
      >
        <div class="badge-container">
          <!-- Holographic Iridescent Shimmer Outer Ring -->
          <div class="holo-shimmer-border"></div>

          <!-- Badge Core -->
          <div class="badge-core">
            <!-- Precise SVG representation of the Motion Builder Gear/Nodes icon -->
            <svg class="badge-svg-icon" viewBox="0 0 100 100" fill="none">
              <!-- Glow backdrop -->
              <circle cx="50" cy="50" r="30" fill="url(#coreGlow)" opacity="0.6"/>
              
              <!-- Outer gear teeth & circular track -->
              <circle cx="50" cy="50" r="32" stroke="#d8b4fe" stroke-width="3" stroke-dasharray="4 6" opacity="0.8"/>
              
              <!-- Central gear core -->
              <path d="M50 24 C52 24 53 26 53 28 L53 31 C57 32 60 34 63 37 L65 35 C67 33 69 33 71 35 L74 38 C76 40 76 42 74 44 L72 46 C75 49 77 52 78 56 L81 56 C83 56 85 57 85 59 L85 63 C85 65 83 67 81 67 L78 67 C77 71 75 74 72 77 L74 79 C76 81 76 83 74 85 L71 88 C69 90 67 90 65 88 L63 86 C60 89 57 91 53 92 L53 95 C53 97 52 99 50 99 L46 99 C44 99 43 97 43 95 L43 92 C39 91 36 89 33 86 L31 88 C29 90 27 90 25 88 L22 85 C20 83 20 81 22 79 L24 77 C21 74 19 71 18 67 L15 67 C13 67 11 65 11 63 L11 59 C11 57 13 56 15 56 L18 56 C19 52 21 49 24 46 L22 44 C20 42 20 40 22 38 L25 35 C27 33 29 33 31 35 L33 37 C36 34 39 32 43 31 L43 28 C43 26 44 24 46 24 Z" 
                    fill="#1e1035" stroke="#c084fc" stroke-width="2.5" />
              
              <!-- Inner mechanical core -->
              <circle cx="50" cy="50" r="14" fill="#130924" stroke="#e879f9" stroke-width="2" />
              
              <!-- 4 Rotating Motion Nodes/Arms -->
              <circle cx="50" cy="38" r="4.5" fill="#f5d0fe" />
              <circle cx="62" cy="50" r="4.5" fill="#f5d0fe" />
              <circle cx="50" cy="62" r="4.5" fill="#f5d0fe" />
              <circle cx="38" cy="50" r="4.5" fill="#f5d0fe" />
              <circle cx="50" cy="50" r="5" fill="#ffffff" />

              <defs>
                <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stop-color="#c084fc" stop-opacity="1"/>
                  <stop offset="60%" stop-color="#818cf8" stop-opacity="0.6"/>
                  <stop offset="100%" stop-color="#3b0764" stop-opacity="0"/>
                </radialGradient>
              </defs>
            </svg>
          </div>
        </div>
        
        <span class="badge-label">{{ badge.title }}</span>
      </div>
    </div>
    <div v-else class="empty-achievements-notice">
      <span>No badges unlocked yet. Complete learning module checkpoints to earn achievement badges!</span>
    </div>
  </section>
</template>

<script setup>
defineProps({
  achievements: {
    type: Array,
    required: true,
    default: () => [],
  },
});

defineEmits(['select-badge']);
</script>

<style scoped>
.achievements-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.badge-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 88px;
  cursor: pointer;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  flex-shrink: 0;
  text-align: center;
}

.badge-item:hover {
  transform: translateY(-3px) scale(1.04);
}

.badge-container {
  width: 76px;
  height: 76px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 6px 14px rgba(168, 85, 247, 0.25));
  margin-bottom: 8px;
}

.holo-shimmer-border {
  position: absolute;
  inset: -3px;
  border-radius: 26px;
  background: linear-gradient(
    135deg,
    #fef08a 0%,
    #f472b6 25%,
    #c084fc 50%,
    #60a5fa 75%,
    #4ade80 100%
  );
  filter: drop-shadow(0 2px 8px rgba(192, 132, 252, 0.45));
  animation: holoRotate 8s linear infinite;
  background-size: 200% 200%;
}

@keyframes holoRotate {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.badge-core {
  position: relative;
  width: 66px;
  height: 66px;
  border-radius: 18px;
  background: radial-gradient(circle at center, #2e1065 0%, #0f0728 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 2px 5px rgba(255, 255, 255, 0.25), inset 0 -3px 6px rgba(0, 0, 0, 0.8);
  overflow: hidden;
  z-index: 2;
}

.badge-svg-icon {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 0 6px rgba(232, 121, 249, 0.6));
}

.badge-label {
  font-size: 11.5px;
  font-weight: 700;
  color: #1f2937;
  text-align: center;
  line-height: 1.3;
  width: 100%;
  word-break: break-word;
  white-space: normal;
  display: block;
}

.empty-achievements-notice {
  font-size: 13px;
  color: #94a3b8;
  padding: 8px 0;
  font-style: italic;
  line-height: 1.4;
}
</style>
