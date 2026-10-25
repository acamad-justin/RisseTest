<script setup>
/**
 * StarNode.vue
 * Multi-layer glowing star node matching the exact constellation reference aesthetic.
 * Rendered using 100% native SVG elements for guaranteed stability, zero white-screen crashes,
 * exact vertex alignment, and hardware-accelerated breathing animation.
 *
 * Anatomy:
 *   - Layer 1 (Outer Atmospheric Bloom): Soft, diffuse colored atmospheric halo
 *   - Layer 2 (Mid Colored Corona): Vibrant tinted corona ring
 *   - Layer 3 (Bright Star Core): High-intensity star core with center white spark
 *
 * 4 Variants:
 *   1. Warm Gold / Yellow (PID, Control Loops, Tuning)
 *   2. Vibrant Magenta / Pink (Actuation, Robot Components)
 *   3. Soft Periwinkle / Lavender-Blue (Outputs, Microcontrollers)
 *   4. Flat / Locked (Inputs, Sensing) - Crisp solid white circle, NO colored blur halo, NO breathing animation.
 */
import { computed } from 'vue'

const props = defineProps({
  concept:       { type: Object,  required: true },
  isHovered:     { type: Boolean, default: false },
  isSelected:    { type: Boolean, default: false },
  isDimmed:      { type: Boolean, default: false },
  isHighlighted: { type: Boolean, default: false },
})

defineEmits(['hover', 'unhover', 'select'])

// Major hub nodes
const isHub = computed(() => props.concept.id === 'microcontrollers' || props.concept.id === 'robot-components')

// Determine node variant by concept ID
const variantType = computed(() => {
  const id = props.concept.id
  if (id === 'pid' || id === 'control-loops' || id === 'tuning') {
    return 'gold'
  }
  if (id === 'actuation' || id === 'robot-components') {
    return 'magenta'
  }
  if (id === 'outputs' || id === 'microcontrollers') {
    return 'periwinkle'
  }
  if (id === 'inputs' || id === 'sensing') {
    return 'flat'
  }
  return 'gold'
})

const isGlowing = computed(() => variantType.value !== 'flat')

// Staggered organic breathing delays per glowing node
const breatheDelay = computed(() => {
  const delays = {
    'pid': '0s',
    'control-loops': '0.7s',
    'tuning': '1.4s',
    'actuation': '2.1s',
    'robot-components': '1.0s',
    'outputs': '2.8s',
    'microcontrollers': '1.8s',
  }
  return delays[props.concept.id] ?? '0s'
})

// Variant configuration matching exact visual specifications
const variantConfig = computed(() => {
  const id = props.concept.id
  switch (variantType.value) {
    case 'gold':
      return {
        coreRadius: 6.5,
        coreBg: '#FFFDF0',
        coronaRadius: 13,
        coronaColor: '#FEF08A',
        coronaFilter: 'coronaBlurGold',
        coronaBlur: 2.5,
        bloomRadius: 26,
        bloomColor: 'rgba(250, 204, 21, 0.55)',
        bloomFilter: 'bloomBlurGold',
        bloomBlur: 8,
      }
    case 'magenta':
      return {
        coreRadius: id === 'robot-components' ? 14 : 7,
        coreBg: '#FFF5FF',
        coronaRadius: id === 'robot-components' ? 24 : 14,
        coronaColor: '#F472B6',
        coronaFilter: 'coronaBlurMagenta',
        coronaBlur: id === 'robot-components' ? 5 : 3.5,
        bloomRadius: id === 'robot-components' ? 44 : 27,
        bloomColor: 'rgba(232, 121, 249, 0.65)',
        bloomFilter: 'bloomBlurMagenta',
        bloomBlur: id === 'robot-components' ? 14 : 10,
      }
    case 'periwinkle':
      return {
        coreRadius: id === 'microcontrollers' ? 14 : 7.5,
        coreBg: '#FFFFFF',
        coronaRadius: id === 'microcontrollers' ? 24 : 14,
        coronaColor: '#C7D2FE',
        coronaFilter: 'coronaBlurPeriwinkle',
        coronaBlur: id === 'microcontrollers' ? 5 : 3.5,
        bloomRadius: id === 'microcontrollers' ? 44 : 27,
        bloomColor: 'rgba(165, 180, 252, 0.65)',
        bloomFilter: 'bloomBlurPeriwinkle',
        bloomBlur: id === 'microcontrollers' ? 14 : 10,
      }
    case 'flat':
    default:
      return {
        coreRadius: 7.5,
        coreBg: '#FFFFFF',
        coronaRadius: 0,
        coronaColor: '',
        coronaFilter: '',
        coronaBlur: 0,
        bloomRadius: 0,
        bloomColor: '',
        bloomFilter: '',
        bloomBlur: 0,
      }
  }
})
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
    :aria-label="`${concept.label}: ${concept.evolutionStage || ''}`"
    :aria-pressed="isSelected"
    @mouseenter="$emit('hover', concept.id)"
    @mouseleave="$emit('unhover')"
    @click.stop="$emit('select', concept.id)"
    @keydown.enter="$emit('select', concept.id)"
    @keydown.space.prevent="$emit('select', concept.id)"
  >
    <!-- Organic Breathing Star Body (scales smoothly around geometric center 0, 0) -->
    <g
      class="star-node__body"
      :class="{
        'star-breathe': isGlowing,
        'scale-hover': isHovered || isSelected,
      }"
      :style="isGlowing ? { animationDelay: breatheDelay } : {}"
    >
      <!-- Glowing Node Anatomy (Layers 1, 2, 3) -->
      <template v-if="isGlowing">
        <!-- Layer 1: Outer Atmospheric Bloom -->
        <circle
          :r="variantConfig.bloomRadius"
          :fill="variantConfig.bloomColor"
          :opacity="isDimmed ? 0.08 : (isHovered || isSelected ? 0.75 : 0.60)"
          :filter="`url(#${variantConfig.bloomFilter})`"
          :style="{ filter: `blur(${variantConfig.bloomBlur}px)` }"
          pointer-events="none"
        />

        <!-- Layer 2: Mid Colored Corona -->
        <circle
          :r="variantConfig.coronaRadius"
          :fill="variantConfig.coronaColor"
          :opacity="isDimmed ? 0.12 : (isHovered || isSelected ? 0.95 : 0.90)"
          :filter="`url(#${variantConfig.coronaFilter})`"
          :style="{ filter: `blur(${variantConfig.coronaBlur}px)` }"
          pointer-events="none"
        />

        <!-- Layer 2.5: Colored Core Ring (Tight Corona Halo) -->
        <circle
          :r="variantConfig.coreRadius * 1.5"
          :fill="variantConfig.coronaColor"
          :opacity="isDimmed ? 0.25 : (isHovered || isSelected ? 0.95 : 0.85)"
          :style="{ filter: 'blur(1.5px)' }"
          pointer-events="none"
        />

        <!-- Layer 3: Bright Star Core -->
        <circle
          :r="variantConfig.coreRadius"
          :fill="variantConfig.coreBg"
          :opacity="isDimmed ? 0.35 : 1"
          pointer-events="none"
        />

        <!-- Center Bright Spark -->
        <circle
          :r="variantConfig.coreRadius * 0.45"
          fill="#ffffff"
          :opacity="isDimmed ? 0.45 : 1"
          pointer-events="none"
        />
      </template>

      <!-- Flat / Locked Variant (Inputs, Sensing) - Crisp solid white circle, NO colored blur halo, NO breathing -->
      <template v-else>
        <circle
          r="8"
          fill="none"
          stroke="rgba(255, 255, 255, 0.4)"
          stroke-width="1.2"
          pointer-events="none"
        />
        <circle
          r="7"
          fill="#ffffff"
          :opacity="isDimmed ? 0.30 : 1"
          pointer-events="none"
        />
      </template>
    </g>

    <!-- Invisible hit circle to guarantee effortless mouse / touch clicks in SVG -->
    <circle
      :r="isHub ? 32 : 22"
      fill="transparent"
      style="cursor: pointer;"
    />

    <!-- Node Label below star -->
    <text
      class="star-node__label"
      :y="isHub ? 34 : 26"
      text-anchor="middle"
      :font-size="isHovered || isSelected ? 12.5 : 11.5"
      :font-weight="isHovered || isSelected ? '600' : '500'"
      :opacity="isDimmed ? 0.20 : 1"
    >
      {{ concept.label }}
    </text>
  </g>
</template>

<style scoped>
@keyframes starBreathe {
  0%, 100% {
    transform: scale(1);
    opacity: 0.85;
    filter: brightness(0.95);
  }
  50% {
    transform: scale(1.18);
    opacity: 1;
    filter: brightness(1.25);
  }
}

.star-breathe {
  animation: starBreathe 3.6s ease-in-out infinite;
  transform-origin: 0px 0px;
  will-change: transform, opacity, filter;
}

.star-node {
  cursor: pointer;
  outline: none;
}

.scale-hover {
  transform: scale(1.18);
  transition: transform 200ms ease;
}

.star-node--dimmed {
  opacity: 0.22;
}

.star-node__label {
  fill: #ffffff;
  font-family: 'Lexend', var(--font-family-sans, sans-serif);
  letter-spacing: 0.01em;
  pointer-events: none;
  user-select: none;
  paint-order: stroke fill;
  stroke: rgba(6, 4, 18, 0.55);
  stroke-width: 2px;
  stroke-linejoin: round;
}

.star-node:focus-visible circle:last-of-type {
  outline: 2px solid rgba(255, 255, 255, 0.7);
  outline-offset: 4px;
}
</style>
