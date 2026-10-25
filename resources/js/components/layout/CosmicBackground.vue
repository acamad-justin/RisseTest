<script setup>
/**
 * CosmicBackground.vue
 * Cosmic background powered by BG.png (and fast JPEG preload)
 * layered with procedural deterministic stars.
 */
import { computed } from 'vue'

// ── Deterministic PRNG (mulberry32) ───────────────────────────────────────
function makePrng(seed) {
  let s = seed >>> 0
  return () => {
    s |= 0; s = s + 0x6d2b79f5 | 0
    let t = Math.imul(s ^ s >>> 15, 1 | s)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

// ── Star generation ───────────────────────────────────────────────────────
const stars = computed(() => {
  const rng   = makePrng(0xdeadbeef)
  const count = 480          // clean points of light on top of BG.png
  const result = []

  for (let i = 0; i < count; i++) {
    const x   = rng() * 100          // vw %
    const y   = rng() * 76           // keep stars in upper 76% (sky, above horizon glow)
    const r   = rng() * 0.28 + 0.08  // radius 0.08–0.36
    const base  = y < 40 ? 0.65 : 0.40
    const alpha = base + rng() * 0.35
    const hue   = rng() > 0.82 ? `rgba(220,210,255,${alpha.toFixed(2)})` : `rgba(255,255,255,${alpha.toFixed(2)})`
    result.push({ x: x.toFixed(3), y: y.toFixed(3), r: r.toFixed(3), fill: hue })
  }
  return result
})
</script>

<template>
  <div class="cosmic-bg" aria-hidden="true">
    <!-- Background layer using BG.png & fast fallback -->
    <div class="cosmic-bg__backdrop"></div>

    <!-- Star field overlay on top of BG.png -->
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="cosmic-bg__stars"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <filter id="starGlow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="0.6" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <g filter="url(#starGlow)">
        <circle
          v-for="(s, i) in stars"
          :key="i"
          :cx="`${s.x}%`"
          :cy="`${s.y}%`"
          :r="s.r"
          :fill="s.fill"
        />
      </g>
    </svg>
  </div>
</template>

<style scoped>
.cosmic-bg {
  position: fixed;
  inset: 0;
  z-index: 0;           /* above body, below sidebar (50) and main content (10) */
  pointer-events: none; /* never intercepts clicks */
  overflow: hidden;
  background-color: #0b0d2a;
}

.cosmic-bg__backdrop {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background-image: url('/images/backgrounds/bg-cosmic.jpg'), url('/images/backgrounds/BG.png');
  background-size: cover;
  background-position: center bottom;
  background-repeat: no-repeat;
}

.cosmic-bg__stars {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  pointer-events: none;
}
</style>
