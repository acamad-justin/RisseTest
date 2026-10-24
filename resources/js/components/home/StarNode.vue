<script setup>
/**
 * StarNode.vue
 * Single star rendered inside ConstellationMap's SVG.
 *
 * Visual language matches the reference screenshot:
 *   - white / pale-coloured glowing disc with bright centre
 *   - size varies by concept.size ('small' | 'medium' | 'large' | 'xlarge')
 *   - glow color comes from concept.glowColor
 *   - labels in white below the star
 */
const props = defineProps({
  concept:       { type: Object,  required: true },
  isHovered:     { type: Boolean, default: false },
  isSelected:    { type: Boolean, default: false },
  isDimmed:      { type: Boolean, default: false },
  isHighlighted: { type: Boolean, default: false },
})

defineEmits(['hover', 'unhover', 'select'])

// ── Radius table (SVG units, viewBox is 900×560) ──────────────────────────
const RADIUS = { small: 6, medium: 9, large: 14, xlarge: 18 }

// ── Derived ───────────────────────────────────────────────────────────────
function r(concept) {
  return RADIUS[concept.size] ?? 8
}
</script>

<template>
  <g
    class="star-node"
    :class="{
      'star-node--hovered':     isHovered,
      'star-node--selected':    isSelected,
      'star-node--dimmed':      isDimmed,
      'star-node--highlighted': isHighlighted,
    }"
    :transform="`translate(${concept.x}, ${concept.y})`"
    role="button"
    :tabindex="0"
    :aria-label="`${concept.label}: ${concept.evolutionStage}, ${concept.activityState}`"
    :aria-pressed="isSelected"
    @mouseenter="$emit('hover', concept.id)"
    @mouseleave="$emit('unhover')"
    @click.stop="$emit('select', concept.id)"
    @keydown.enter="$emit('select', concept.id)"
    @keydown.space.prevent="$emit('select', concept.id)"
  >
    <!-- Outermost diffuse halo — always present, brightens on hover -->
    <circle
      :r="r(concept) * 3.2"
      :fill="concept.glowColor"
      :opacity="isDimmed ? 0.03 : (isHovered || isSelected ? 0.18 : 0.08)"
      pointer-events="none"
    />

    <!-- Mid halo — softened glow ring -->
    <circle
      :r="r(concept) * 1.9"
      :fill="concept.glowColor"
      :opacity="isDimmed ? 0.06 : (isHovered || isSelected ? 0.45 : 0.22)"
      pointer-events="none"
    />

    <!-- Hover ring outline -->
    <circle
      v-if="isHovered || isSelected"
      :r="r(concept) * 1.55"
      fill="none"
      :stroke="concept.glowColor"
      stroke-width="0.8"
      opacity="0.55"
      pointer-events="none"
    />

    <!-- Core disc -->
    <circle
      :r="r(concept)"
      :fill="concept.glowColor"
      :opacity="isDimmed ? 0.25 : 0.90"
      pointer-events="none"
    />

    <!-- Bright white centre spark -->
    <circle
      :r="r(concept) * 0.40"
      fill="#ffffff"
      :opacity="isDimmed ? 0.15 : 0.95"
      pointer-events="none"
    />

    <!-- Invisible hit area wider than the visual star -->
    <circle
      :r="r(concept) * 2.2"
      fill="transparent"
      style="cursor: pointer;"
    />

    <!-- Label -->
    <text
      class="star-node__label"
      :y="r(concept) + 15"
      text-anchor="middle"
      :font-size="isHovered || isSelected ? 12.5 : 11.5"
      :font-weight="isHovered || isSelected ? '500' : '400'"
      :opacity="isDimmed ? 0.20 : 1"
    >
      {{ concept.label }}
    </text>
  </g>
</template>

<style scoped>
.star-node {
  cursor: pointer;
  outline: none;
}

/* Soft text with reduced dark outline for clean, crisp readability */
.star-node__label {
  fill: #ffffff;
  font-family: 'Lexend', var(--font-family-sans, sans-serif);
  font-weight: 500;
  letter-spacing: 0.01em;
  pointer-events: none;
  user-select: none;
  paint-order: stroke fill;
  stroke: rgba(6, 4, 18, 0.45);
  stroke-width: 1px;
  stroke-linejoin: round;
}

/* Keyboard focus */
.star-node:focus-visible > circle:first-child {
  outline: 2px solid rgba(255,255,255,0.6);
}
</style>
