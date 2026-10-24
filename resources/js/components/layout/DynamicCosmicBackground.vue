<template>
  <div class="dynamic-cosmic-bg" aria-hidden="true" ref="containerRef">
    <!-- ══ Layer 1: Base CSS Atmospheric Nebulae ═══════════════════ -->
    <div class="nebula-base"></div>
    <div class="nebula nebula--violet"></div>
    <div class="nebula nebula--indigo"></div>
    <div class="nebula nebula--magenta"></div>
    <div class="horizon-glow"></div>
    <div class="horizon-warm-bloom"></div>

    <!-- ══ Layer 2: Real-time Canvas Engine (Stars, Twinkling, Meteors, Parallax) ══ -->
    <canvas ref="canvasRef" class="dynamic-canvas"></canvas>

    <!-- ══ Layer 3: Subtle Noise Grain Texture ═════════════════════ -->
    <div class="film-grain"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const containerRef = ref(null)
const canvasRef = ref(null)

let animationFrameId = null
let stars = []
let meteors = []
let motes = []
let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 }
let width = 0
let height = 0
let dpr = 1
let lastMeteorTime = 0

// ── Star generator with 3D depth and individual flicker frequencies ───
function initStars() {
  const count = Math.min(Math.floor((width * height) / 2200), 650)
  stars = []

  for (let i = 0; i < count; i++) {
    const depth = Math.random() * 0.9 + 0.1 // 0.1 (far) to 1.0 (near)
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height * 0.82, // Keep stars primarily above horizon glow
      baseRadius: (depth * 1.4 + 0.4) * (Math.random() * 0.5 + 0.75),
      depth,
      alpha: Math.random() * 0.6 + 0.35,
      twinkleSpeed: Math.random() * 0.03 + 0.01,
      twinklePhase: Math.random() * Math.PI * 2,
      // Subtle color variation: pale ice-blue, pure white, faint lilac, faint gold
      color: Math.random() > 0.8
        ? 'rgba(215, 225, 255,'
        : Math.random() > 0.65
          ? 'rgba(235, 215, 255,'
          : Math.random() > 0.5
            ? 'rgba(255, 240, 220,'
            : 'rgba(255, 255, 255,',
      driftSpeed: (0.04 + depth * 0.08) * (Math.random() * 0.4 + 0.8),
    })
  }
}

// ── Floating warm stardust motes near the horizon ──────────────────────
function initMotes() {
  motes = []
  const count = 45
  for (let i = 0; i < count; i++) {
    motes.push({
      x: Math.random() * width,
      y: height * 0.65 + Math.random() * (height * 0.35),
      radius: Math.random() * 1.6 + 0.6,
      vx: (Math.random() - 0.5) * 0.25,
      vy: -(Math.random() * 0.4 + 0.15),
      alpha: Math.random() * 0.5 + 0.2,
      maxLife: Math.random() * 240 + 160,
      life: Math.random() * 200,
    })
  }
}

// ── Spawn an elegant shooting star / meteor ───────────────────────────
function spawnMeteor() {
  const angle = (Math.PI / 180) * (Math.random() * 20 + 25) // 25° to 45°
  const speed = Math.random() * 9 + 11
  const startX = Math.random() * (width * 0.85);
  const startY = Math.random() * (height * 0.35);

  meteors.push({
    x: startX,
    y: startY,
    dx: Math.cos(angle) * speed,
    dy: Math.sin(angle) * speed,
    length: Math.random() * 90 + 70,
    thickness: Math.random() * 1.5 + 1.0,
    life: 0,
    maxLife: Math.random() * 25 + 35,
    opacity: 0,
  })
}

// ── Render loop ────────────────────────────────────────────────────────
function render(timestamp) {
  if (!canvasRef.value) return
  const ctx = canvasRef.value.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, width, height)

  // 1. Smooth mouse lerp for 3D parallax
  mouse.x += (mouse.targetX - mouse.x) * 0.04
  mouse.y += (mouse.targetY - mouse.y) * 0.04

  const parallaxX = (mouse.x - width / 2)
  const parallaxY = (mouse.y - height / 2)

  // 2. Draw stars with individual twinkle and depth parallax
  for (let i = 0; i < stars.length; i++) {
    const s = stars[i]

    // Slow upward astronomical drift
    s.y -= s.driftSpeed * 0.18
    if (s.y < 0) {
      s.y = height * 0.82
      s.x = Math.random() * width
    }

    // Twinkle phase
    s.twinklePhase += s.twinkleSpeed
    const twinkle = Math.sin(s.twinklePhase) * 0.35 + 0.65
    const currentAlpha = Math.max(0.1, Math.min(1.0, s.alpha * twinkle))

    // Parallax position offset
    const posX = s.x - (parallaxX * 0.025 * s.depth)
    const posY = s.y - (parallaxY * 0.025 * s.depth)

    // Render star dot
    ctx.beginPath()
    ctx.arc(posX, posY, s.baseRadius, 0, Math.PI * 2)
    ctx.fillStyle = `${s.color}${currentAlpha})`
    ctx.fill()

    // Soft glow for bright/closer stars
    if (s.depth > 0.75 && twinkle > 0.8) {
      ctx.beginPath()
      ctx.arc(posX, posY, s.baseRadius * 2.4, 0, Math.PI * 2)
      ctx.fillStyle = `${s.color}${(currentAlpha * 0.18).toFixed(3)})`
      ctx.fill()
    }
  }

  // 3. Draw and update floating warm motes (stardust)
  for (let i = 0; i < motes.length; i++) {
    const m = motes[i]
    m.life++
    m.x += m.vx
    m.y += m.vy

    const progress = m.life / m.maxLife
    const moteAlpha = Math.sin(progress * Math.PI) * m.alpha

    ctx.beginPath()
    ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255, 175, 75, ${moteAlpha.toFixed(3)})`
    ctx.shadowColor = 'rgba(255, 150, 40, 0.6)'
    ctx.shadowBlur = 6
    ctx.fill()
    ctx.shadowBlur = 0

    if (m.life >= m.maxLife || m.y < height * 0.35) {
      // Respawn near the bottom horizon
      m.x = Math.random() * width
      m.y = height * 0.75 + Math.random() * (height * 0.25)
      m.life = 0
    }
  }

  // 4. Occasional shooting stars (meteors)
  if (!lastMeteorTime || timestamp - lastMeteorTime > 4500 + Math.random() * 4000) {
    spawnMeteor()
    lastMeteorTime = timestamp
  }

  for (let i = meteors.length - 1; i >= 0; i--) {
    const met = meteors[i]
    met.life++
    met.x += met.dx
    met.y += met.dy

    const halfLife = met.maxLife / 2
    if (met.life < halfLife) {
      met.opacity = met.life / halfLife
    } else {
      met.opacity = 1 - (met.life - halfLife) / halfLife
    }

    const tailX = met.x - (met.dx / Math.hypot(met.dx, met.dy)) * met.length
    const tailY = met.y - (met.dy / Math.hypot(met.dx, met.dy)) * met.length

    const grad = ctx.createLinearGradient(tailX, tailY, met.x, met.y)
    grad.addColorStop(0, 'rgba(255, 255, 255, 0)')
    grad.addColorStop(0.7, `rgba(255, 225, 180, ${(met.opacity * 0.45).toFixed(3)})`)
    grad.addColorStop(1, `rgba(255, 255, 255, ${(met.opacity * 0.95).toFixed(3)})`)

    ctx.beginPath()
    ctx.moveTo(tailX, tailY)
    ctx.lineTo(met.x, met.y)
    ctx.strokeStyle = grad
    ctx.lineWidth = met.thickness
    ctx.lineCap = 'round'
    ctx.stroke()

    // Bright head tip
    ctx.beginPath()
    ctx.arc(met.x, met.y, met.thickness * 1.2, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255, 255, 255, ${met.opacity.toFixed(3)})`
    ctx.shadowColor = 'rgba(255, 210, 150, 0.8)'
    ctx.shadowBlur = 8
    ctx.fill()
    ctx.shadowBlur = 0

    if (met.life >= met.maxLife) {
      meteors.splice(i, 1)
    }
  }

  animationFrameId = requestAnimationFrame(render)
}

function handleResize() {
  if (!canvasRef.value) return
  dpr = window.devicePixelRatio || 1
  width = window.innerWidth
  height = window.innerHeight

  canvasRef.value.width = width * dpr
  canvasRef.value.height = height * dpr
  canvasRef.value.style.width = `${width}px`
  canvasRef.value.style.height = `${height}px`

  const ctx = canvasRef.value.getContext('2d')
  if (ctx) ctx.scale(dpr, dpr)

  initStars()
  initMotes()
}

function handleMouseMove(e) {
  mouse.targetX = e.clientX
  mouse.targetY = e.clientY
}

onMounted(() => {
  handleResize()
  mouse.x = width / 2
  mouse.y = height / 2
  mouse.targetX = width / 2
  mouse.targetY = height / 2

  window.addEventListener('resize', handleResize)
  window.addEventListener('mousemove', handleMouseMove, { passive: true })
  animationFrameId = requestAnimationFrame(render)
})

onBeforeUnmount(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('mousemove', handleMouseMove)
})
</script>

<style scoped>
.dynamic-cosmic-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
  background-color: #0b0d2a;
}

/* ── Deep space background base ── */
.nebula-base {
  position: absolute;
  inset: 0;
  background: url('/bg-cosmic.jpg') center bottom / cover no-repeat, #0b0d2a;
}

/* ── Ambient animated nebulae clouds ── */
.nebula {
  position: absolute;
  border-radius: 50%;
  filter: blur(85px);
  pointer-events: none;
  opacity: 0.42;
  will-change: transform, opacity;
}

.nebula--violet {
  top: 25%;
  left: 20%;
  width: 58vw;
  height: 52vh;
  background: radial-gradient(circle, #7b3fa0 0%, #5b2080 42%, transparent 75%);
  animation: floatNebula1 24s ease-in-out infinite alternate;
}

.nebula--indigo {
  top: 8%;
  right: 15%;
  width: 48vw;
  height: 44vh;
  background: radial-gradient(circle, #4a2275 0%, #2a1555 50%, transparent 75%);
  animation: floatNebula2 30s ease-in-out infinite alternate;
}

.nebula--magenta {
  top: 38%;
  right: 28%;
  width: 42vw;
  height: 38vh;
  background: radial-gradient(circle, #a82d68 0%, #631244 48%, transparent 75%);
  opacity: 0.28;
  animation: floatNebula3 22s ease-in-out infinite alternate;
}

/* ── Warm sunset horizon glow at the bottom (Risse brand amber) ── */
.horizon-glow {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 48vh;
  background: linear-gradient(
    180deg,
    rgba(61, 26, 0, 0) 0%,
    rgba(122, 46, 0, 0.45) 45%,
    rgba(196, 88, 0, 0.78) 72%,
    rgba(232, 122, 0, 0.88) 88%,
    rgba(245, 160, 32, 0.94) 100%
  );
  pointer-events: none;
}

.horizon-warm-bloom {
  position: absolute;
  bottom: -15vh;
  left: 15%;
  right: 15%;
  height: 45vh;
  background: radial-gradient(
    ellipse at center bottom,
    rgba(255, 150, 20, 0.65) 0%,
    rgba(212, 96, 16, 0.35) 50%,
    transparent 80%
  );
  filter: blur(50px);
  animation: pulseHorizon 16s ease-in-out infinite alternate;
}

/* ── High-performance canvas layer ── */
.dynamic-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  pointer-events: none;
}

/* ── Film grain overlay ── */
.film-grain {
  position: absolute;
  inset: 0;
  opacity: 0.24;
  background-image: radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 0);
  background-size: 28px 28px;
  pointer-events: none;
}

/* ── Keyframe animations ── */
@keyframes floatNebula1 {
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(3vw, 2vh) scale(1.08); }
  100% { transform: translate(-2vw, -2vh) scale(0.95); }
}

@keyframes floatNebula2 {
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-3vw, 3vh) scale(1.1); }
  100% { transform: translate(2vw, -2vh) scale(0.92); }
}

@keyframes floatNebula3 {
  0% { transform: translate(0, 0) scale(1); opacity: 0.22; }
  50% { transform: translate(2vw, -3vh) scale(1.12); opacity: 0.32; }
  100% { transform: translate(-3vw, 2vh) scale(0.9); opacity: 0.24; }
}

@keyframes pulseHorizon {
  0% { opacity: 0.55; transform: scale(0.98); }
  50% { opacity: 0.78; transform: scale(1.04); }
  100% { opacity: 0.55; transform: scale(0.98); }
}
</style>
