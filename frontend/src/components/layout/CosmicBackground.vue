<script setup>
/**
 * CosmicBackground.vue
 * Full-viewport fixed astronomical background for Risse.
 *
 * Technique: inline SVG with layered radial/linear gradients,
 * a procedural star field (seeded PRNG — deterministic across navigations),
 * and an feTurbulence grain filter for depth.
 * No external images or extra dependencies required.
 */
import { computed } from 'vue'

// ── Deterministic PRNG (mulberry32) ───────────────────────────────────────
// Fixed seed → same stars every render, no flicker on route change.
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
  const count = 820          // points of light
  const result = []

  for (let i = 0; i < count; i++) {
    const x   = rng() * 100          // vw %
    const y   = rng() * 78           // keep stars in upper 78% (sky, not horizon glow)
    const r   = rng() * 0.28 + 0.08  // radius 0.08–0.36
    // Brighter stars near the top, dimmer toward the nebula band
    const base  = y < 40 ? 0.55 : 0.30
    const alpha = base + rng() * 0.35
    // Occasional slightly warmer tint (off-white → cool white)
    const hue   = rng() > 0.85 ? `rgba(220,210,255,${alpha.toFixed(2)})` : `rgba(255,255,255,${alpha.toFixed(2)})`
    result.push({ x: x.toFixed(3), y: y.toFixed(3), r: r.toFixed(3), fill: hue })
  }
  return result
})
</script>

<template>
  <!--
    position:fixed + inset:0 + z-index:-1  →  sits behind everything,
    doesn't scroll, doesn't affect layout, persists across route changes.
  -->
  <div class="cosmic-bg" aria-hidden="true">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="cosmic-bg__svg"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <!-- ── Grain / film-noise filter ──────────────────────────── -->
        <filter id="grain" x="0%" y="0%" width="100%" height="100%" color-interpolation-filters="sRGB">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.72 0.68"
            numOctaves="4"
            seed="8"
            stitchTiles="stitch"
            result="noise"
          />
          <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise" />
          <feBlend in="SourceGraphic" in2="grayNoise" mode="overlay" result="blended" />
          <feComposite in="blended" in2="SourceGraphic" operator="in" />
        </filter>

        <!-- ── Soft star glow ─────────────────────────────────────── -->
        <filter id="starGlow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="0.6" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>

        <!-- ── Deep-space base: indigo-navy top → near-black mid ─── -->
        <linearGradient id="skyBase" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="#0b0d2a" />
          <stop offset="18%"  stop-color="#0e1035" />
          <stop offset="40%"  stop-color="#120e30" />
          <stop offset="62%"  stop-color="#1a0e2e" />
          <stop offset="100%" stop-color="#0f0915" />
        </linearGradient>

        <!-- ── Horizon warm glow: amber/orange sunrise at the bottom ── -->
        <linearGradient id="horizonGlow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="#3d1a00" stop-opacity="0" />
          <stop offset="40%"  stop-color="#7a2e00" stop-opacity="0.55" />
          <stop offset="70%"  stop-color="#c45800" stop-opacity="0.82" />
          <stop offset="88%"  stop-color="#e87a00" stop-opacity="0.90" />
          <stop offset="100%" stop-color="#f5a020" stop-opacity="0.95" />
        </linearGradient>

        <!-- ── Nebula radials — magenta/violet cloud formations ───── -->
        <!-- Large left-centre violet nebula -->
        <radialGradient id="neb1" cx="32%" cy="52%" r="38%" gradientUnits="userSpaceOnUse"
                        fx="32%" fy="52%">
          <stop offset="0%"   stop-color="#7b3fa0" stop-opacity="0.50" />
          <stop offset="45%"  stop-color="#5b2080" stop-opacity="0.28" />
          <stop offset="100%" stop-color="#1a0e30" stop-opacity="0" />
        </radialGradient>

        <!-- Upper-right diffuse indigo cloud -->
        <radialGradient id="neb2" cx="72%" cy="30%" r="32%" gradientUnits="userSpaceOnUse"
                        fx="72%" fy="30%">
          <stop offset="0%"   stop-color="#4a2275" stop-opacity="0.42" />
          <stop offset="55%"  stop-color="#2d1055" stop-opacity="0.18" />
          <stop offset="100%" stop-color="#0b0d2a"  stop-opacity="0" />
        </radialGradient>

        <!-- Centre-right magenta-pink accent nebula -->
        <radialGradient id="neb3" cx="58%" cy="45%" r="28%" gradientUnits="userSpaceOnUse"
                        fx="58%" fy="48%">
          <stop offset="0%"   stop-color="#b0306a" stop-opacity="0.30" />
          <stop offset="50%"  stop-color="#7a1a50" stop-opacity="0.14" />
          <stop offset="100%" stop-color="#2a0a30" stop-opacity="0" />
        </radialGradient>

        <!-- Lower-left deep violet cloud bleeding into horizon -->
        <radialGradient id="neb4" cx="18%" cy="72%" r="34%" gradientUnits="userSpaceOnUse"
                        fx="18%" fy="72%">
          <stop offset="0%"   stop-color="#5c1a7a" stop-opacity="0.45" />
          <stop offset="55%"  stop-color="#3a0f55" stop-opacity="0.22" />
          <stop offset="100%" stop-color="#0f0915" stop-opacity="0" />
        </radialGradient>

        <!-- Small upper-left blue-violet wisp -->
        <radialGradient id="neb5" cx="12%" cy="22%" r="20%" gradientUnits="userSpaceOnUse"
                        fx="12%" fy="22%">
          <stop offset="0%"   stop-color="#2a3a9a" stop-opacity="0.35" />
          <stop offset="60%"  stop-color="#1a2060" stop-opacity="0.12" />
          <stop offset="100%" stop-color="#0b0d2a" stop-opacity="0" />
        </radialGradient>

        <!-- Warm amber bloom bridging horizon and nebula -->
        <radialGradient id="neb6" cx="50%" cy="82%" r="44%" gradientUnits="userSpaceOnUse"
                        fx="50%" fy="88%">
          <stop offset="0%"   stop-color="#d46010" stop-opacity="0.60" />
          <stop offset="40%"  stop-color="#8a3000" stop-opacity="0.35" />
          <stop offset="100%" stop-color="#1a0a00" stop-opacity="0" />
        </radialGradient>
      </defs>

      <!-- ══ Layer 1: deep-space base ════════════════════════════════ -->
      <rect width="1440" height="900" fill="url(#skyBase)" />

      <!-- ══ Layer 2: nebula cloud formations ════════════════════════ -->
      <rect width="1440" height="900" fill="url(#neb5)" />
      <rect width="1440" height="900" fill="url(#neb1)" />
      <rect width="1440" height="900" fill="url(#neb2)" />
      <rect width="1440" height="900" fill="url(#neb3)" />
      <rect width="1440" height="900" fill="url(#neb4)" />

      <!-- ══ Layer 3: horizon warm glow ══════════════════════════════ -->
      <rect width="1440" height="900" fill="url(#horizonGlow)" />
      <rect width="1440" height="900" fill="url(#neb6)" />

      <!-- ══ Layer 4: star field ══════════════════════════════════════ -->
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

      <!-- ══ Layer 5: film grain overlay ════════════════════════════= -->
      <rect width="1440" height="900" fill="transparent" filter="url(#grain)" opacity="0.28" />
    </svg>
  </div>
</template>

<style scoped>
.cosmic-bg {
  position: fixed;
  inset: 0;
  z-index: -1;          /* behind everything, including the sidebar */
  pointer-events: none; /* never intercepts clicks */
  overflow: hidden;
}

.cosmic-bg__svg {
  width: 100%;
  height: 100%;
  display: block;
  /* cover-equivalent: SVG uses preserveAspectRatio="xMidYMid slice" */
}
</style>
