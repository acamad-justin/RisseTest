<template>
  <div class="roadmap-view-wrapper">
    <!-- Header with Back Button, Title, Badge, and Action Controls -->
    <header class="roadmap-header">
      <div class="roadmap-header-left">
        <button 
          type="button" 
          class="btn-back-nav" 
          @click="$emit('back')" 
          title="Back to Modules" 
          aria-label="Back to Modules"
          id="btn-back-to-modules"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        <div class="roadmap-title-group">
          <span class="sub-category-tag">Module</span>
          <h1 class="roadmap-title">{{ moduleData.title }}</h1>
          <div class="roadmap-meta-badge-row">
            <span class="badge-beginner" :class="`badge-${moduleData.levelColor || 'yellow'}`">
              {{ moduleData.level || 'Beginner' }}
            </span>
            <span class="current-path-text">
              Status: <strong>{{ progressPercent }}% Completed</strong> ({{ currentStep }} of {{ checkpoints.length }} Steps)
            </span>
          </div>
        </div>
      </div>

      <div class="roadmap-header-right">
        <button 
          type="button" 
          class="btn-icon-control" 
          :class="{ 'is-starred': isStarred }"
          @click="toggleStar"
          :title="isStarred ? 'Remove from favorites' : 'Bookmark'" 
          aria-label="Bookmark"
          id="btn-star-roadmap"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" :fill="isStarred ? '#ff7a00' : 'none'" :stroke="isStarred ? '#ff7a00' : '#1f2937'" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      </div>
    </header>

    <!-- Fast-Track Interactive Testing Controls Banner -->
    <div class="test-controls-banner" id="test-controls-banner">
      <div class="test-banner-info">
        <div class="test-banner-pill">
          <span class="pulse-dot"></span>
          <span>Star Chart Constellation Progression</span>
        </div>
        <div class="test-progress-bar-wrapper">
          <div class="test-progress-bar-fill" :style="{ width: `${progressPercent}%` }"></div>
        </div>
        <span class="test-progress-text">{{ currentStep }} / {{ checkpoints.length }} Nodes Illuminated</span>
      </div>

      <div class="test-banner-actions">
        <!-- Complete Step Button -->
        <button 
          v-if="currentStep < checkpoints.length"
          type="button" 
          class="btn-fast-track" 
          @click="advanceStep"
          id="btn-advance-step"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          <span>Complete Step {{ currentStep + 1 }}: "{{ checkpoints[currentStep]?.name }}"</span>
        </button>

        <!-- View Unlocked Badge Button -->
        <button 
          v-else
          type="button" 
          class="btn-view-badge" 
          @click="triggerBadgeCelebration"
          id="btn-view-achievement-badge"
        >
          <span class="badge-trophy-icon">🏆</span>
          <span>View Unlocked Badge</span>
        </button>

        <!-- Reset Button -->
        <button 
          type="button" 
          class="btn-reset-progression" 
          @click="resetProgress"
          title="Reset progress to 0% to test again"
          id="btn-reset-progress"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
          </svg>
          <span>Reset to 0%</span>
        </button>
      </div>
    </div>

    <!-- Main Content: Constellation Star Chart Stage & Learning Objectives -->
    <div class="roadmap-body-grid">
      <!-- Constellation Stage -->
      <div class="constellation-stage" ref="stageContainer">
        <!-- Connecting Lines SVG Layer (1000x1000 Normalized ViewBox) -->
        <svg class="lines-layer" viewBox="0 0 1000 1000" preserveAspectRatio="none">
          <defs>
            <filter id="glow-line" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <!-- Dynamic Connecting Lines between nodes -->
          <template v-for="(line, idx) in constellationLines" :key="`line-${idx}`">
            <!-- Line completed and illuminated -->
            <line 
              v-if="line.isCompleted"
              :x1="line.x1" 
              :y1="line.y1" 
              :x2="line.x2" 
              :y2="line.y2" 
              stroke="#f43f5e" 
              stroke-width="5" 
              stroke-linecap="round" 
              filter="url(#glow-line)"
              opacity="0.95" 
              class="line-animated-completed"
            />
            <!-- Line in progress (from completed/active to next target) -->
            <line 
              v-else-if="line.isActive"
              :x1="line.x1" 
              :y1="line.y1" 
              :x2="line.x2" 
              :y2="line.y2" 
              stroke="#fda4af" 
              stroke-width="3.5" 
              stroke-dasharray="8,6" 
              stroke-linecap="round" 
              opacity="0.85" 
            />
            <!-- Line locked -->
            <line 
              v-else
              :x1="line.x1" 
              :y1="line.y1" 
              :x2="line.x2" 
              :y2="line.y2" 
              stroke="#cbd5e1" 
              stroke-width="3" 
              stroke-dasharray="6,5" 
              stroke-linecap="round" 
              opacity="0.65" 
            />
          </template>
        </svg>

        <!-- HTML/CSS Bokeh Glowing Orbs (Dynamic based on currentStep) -->
        <div class="nodes-overlay">
          <div 
            v-for="(cp, idx) in checkpoints" 
            :key="cp.id"
            class="bokeh-node-wrapper"
            :class="{
              'node-completed': idx < currentStep,
              'active-node': idx === currentStep,
              'node-locked': idx > currentStep
            }"
            :style="{ left: `${cp.x / 10}%`, top: `${cp.y / 10}%` }"
            @click="handleNodeClick(cp, idx)"
            role="button"
            tabindex="0"
            :title="getNodeTooltip(cp, idx)"
            :id="`node-checkpoint-${cp.id}`"
          >
            <!-- 1. COMPLETED NODE STATE (idx < currentStep) -->
            <template v-if="idx < currentStep">
              <div class="bokeh-halo halo-pink halo-completed"></div>
              <div class="bokeh-core core-pink core-completed">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div class="label-aside" :class="`label-${cp.labelPos || 'right'}`">
                <span class="step-num-pill completed-pill">Step {{ idx + 1 }} ✓</span>
                <span class="label-title">{{ cp.name }}</span>
              </div>
            </template>

            <!-- 2. CURRENT ACTIVE TARGET STATE (idx === currentStep) -->
            <template v-else-if="idx === currentStep">
              <div class="bokeh-halo halo-pink halo-large halo-pulsing"></div>
              <div class="pulse-dashed-orbit"></div>
              <div class="bokeh-core core-pink core-pulse">
                <div class="active-dot-inner"></div>
              </div>
              <div class="label-aside highlight-label" :class="`label-${cp.labelPos || 'top'}`">
                <span class="step-num-pill active-pill">Step {{ idx + 1 }} • Current Target</span>
                <span class="label-title">{{ cp.name }}</span>
              </div>
            </template>

            <!-- 3. LOCKED FUTURE STATE (idx > currentStep) -->
            <template v-else>
              <div class="bokeh-halo halo-gray"></div>
              <div class="bokeh-core core-gray">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <div class="label-aside label-locked" :class="`label-${cp.labelPos || 'bottom'}`">
                <span class="step-num-pill locked-pill">Step {{ idx + 1 }} 🔒</span>
                <span class="label-title">{{ cp.name }}</span>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Right: Learning Objectives Panel -->
      <aside class="objectives-panel">
        <h3 class="objectives-title">Learning Objectives</h3>
        <ul class="objectives-list">
          <li v-for="(obj, i) in objectives" :key="i">
            {{ obj }}
          </li>
        </ul>

        <!-- Achievement Badge Preview Card -->
        <div class="badge-preview-card" @click="handleBadgeCardClick">
          <div class="badge-preview-icon">
            <span v-if="currentStep >= checkpoints.length">🏆</span>
            <span v-else>⚡</span>
          </div>
          <div class="badge-preview-info">
            <span class="badge-preview-tag">{{ currentStep >= checkpoints.length ? 'Unlocked!' : 'Target Reward' }}</span>
            <h4 class="badge-preview-title">{{ moduleData.badge || 'Speed Learner' }}</h4>
            <p class="badge-preview-sub">{{ currentStep >= checkpoints.length ? 'Click to inspect badge modal' : 'Complete 100% to unlock' }}</p>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import axios from 'axios';

const props = defineProps({
  moduleData: {
    type: Object,
    default: () => ({
      id: 999,
      title: 'Test Module: Quick Progression',
      level: 'Beginner',
      currentStep: 0,
      totalSteps: 3,
      progressPercent: 0,
      currentPath: 'Not Started',
      badge: 'Speed Learner',
    }),
  },
});

const emit = defineEmits(['back', 'select-checkpoint', 'award-badge', 'notify', 'update-module']);

const isStarred = ref(false);
const currentStep = ref(props.moduleData.currentStep || 0);

watch(() => props.moduleData.currentStep, (val) => {
  if (val !== undefined) {
    currentStep.value = val;
  }
});

// Checkpoint configurations
const isTestModule = computed(() => {
  return props.moduleData.id === 999 || (props.moduleData.title && props.moduleData.title.includes('Test Module'));
});

const checkpoints = computed(() => {
  if (isTestModule.value) {
    return [
      { id: 1, name: 'Orientation & Signal Basics', x: 240, y: 720, labelPos: 'right', desc: 'Signal flow and foundational logic' },
      { id: 2, name: 'Rapid Prototyping Trial', x: 520, y: 440, labelPos: 'top', desc: 'Deploy quick sensor and actuator loops' },
      { id: 3, name: 'Final Calibration & Mastery', x: 800, y: 180, labelPos: 'left', desc: 'Verify full cycle and unlock Speed Learner achievement' },
    ];
  }

  // Default checkpoints for other modules
  return [
    { id: 1, name: 'Robotics Basics', x: 740, y: 840, labelPos: 'right', desc: 'Introduction to foundational mechanical concepts' },
    { id: 2, name: 'Robot Anatomy', x: 480, y: 720, labelPos: 'left', desc: 'Structural components and motor links' },
    { id: 3, name: 'Inputs, Output, and Signals', x: 680, y: 500, labelPos: 'top', desc: 'Digital logic and signal routing' },
    { id: 4, name: 'Microcontrollers', x: 220, y: 400, labelPos: 'bottom', desc: 'Processing sensor inputs and registers' },
    { id: 5, name: 'Sensing', x: 460, y: 160, labelPos: 'bottom', desc: 'Perception of surrounding environment' },
    { id: 6, name: 'Action & Actuation', x: 720, y: 120, labelPos: 'bottom', desc: 'Closed-loop motion and motors' },
  ];
});

// Constellation lines connecting consecutive checkpoints
const constellationLines = computed(() => {
  const cps = checkpoints.value;
  const lines = [];
  for (let i = 0; i < cps.length - 1; i++) {
    const from = cps[i];
    const to = cps[i + 1];
    const isCompleted = i < currentStep.value && (i + 1) <= currentStep.value;
    const isActive = i <= currentStep.value;
    lines.push({
      x1: from.x,
      y1: from.y,
      x2: to.x,
      y2: to.y,
      isCompleted,
      isActive,
    });
  }
  return lines;
});

const progressPercent = computed(() => {
  if (checkpoints.value.length === 0) return 0;
  return Math.round((currentStep.value / checkpoints.value.length) * 100);
});

const objectives = computed(() => {
  if (isTestModule.value) {
    return [
      'Observe dynamic star chart illumination as nodes transition from locked to illuminated.',
      'Test instant checkpoint progression starting strictly from 0%.',
      'Deploy rapid sensor signals and calibration feedback loops.',
      'Achieve 100% mastery to unlock the Speed Learner achievement badge.',
    ];
  }
  return [
    'Identify the main components of a robot and explain their functions.',
    'Describe how microcontrollers process information.',
    'Distinguish inputs, outputs, and signals in a robotic system.',
    'Explain how sensors and actuators enable robots to sense and act.',
    'Trace the basic flow of information from sensing to action.',
  ];
});

function toggleStar() {
  isStarred.value = !isStarred.value;
  emit('notify', isStarred.value ? 'Module bookmarked!' : 'Bookmark removed');
}

function getNodeTooltip(cp, idx) {
  if (idx < currentStep.value) return `${cp.name} (Completed ✓)`;
  if (idx === currentStep.value) return `${cp.name} (Active Target - Click to open lesson)`;
  return `${cp.name} (Locked 🔒 - Complete previous step first)`;
}

function handleNodeClick(cp, idx) {
  if (idx <= currentStep.value) {
    emit('select-checkpoint', cp.name);
  } else {
    emit('notify', `Checkpoint "${cp.name}" is locked. Complete Step ${currentStep.value + 1} first!`);
  }
}

// Fast-Track Advance Step Handler
async function advanceStep() {
  if (currentStep.value >= checkpoints.value.length) return;

  const nextStep = currentStep.value + 1;
  currentStep.value = nextStep;

  const currentPath = checkpoints.value[Math.min(nextStep, checkpoints.value.length - 1)].name;
  const isFinished = nextStep >= checkpoints.value.length;

  emit('update-module', {
    currentStep: nextStep,
    progressPercent: progressPercent.value,
    currentPath: currentPath,
  });

  emit('notify', `Step ${nextStep} completed! Constellation illuminated.`);

  // Persist to backend
  try {
    await axios.post('/api/modules/progress', {
      moduleId: props.moduleData.id,
      step: nextStep,
    });
  } catch (e) {
    console.log('Saved step locally');
  }

  // If completed 100%, award badge
  if (isFinished) {
    triggerBadgeCelebration();
  }
}

// Reset Progress Handler
async function resetProgress() {
  currentStep.value = 0;
  emit('update-module', {
    currentStep: 0,
    progressPercent: 0,
    currentPath: 'Not Started',
  });
  emit('notify', 'Progress reset to 0% for testing.');

  try {
    await axios.post('/api/modules/progress', {
      moduleId: props.moduleData.id,
      step: 0,
    });
  } catch (e) {
    console.log('Reset locally');
  }
}

// Trigger Badge Modal Celebration
function triggerBadgeCelebration() {
  const badgeTitle = props.moduleData.badge && props.moduleData.badge !== 'No Badge' 
    ? props.moduleData.badge 
    : 'Speed Learner';

  const badge = {
    id: props.moduleData.id || Date.now(),
    title: badgeTitle,
    category: props.moduleData.title || 'Robotics & Control Systems',
    description: `Mastered all learning checkpoints in "${props.moduleData.title}" with 100% star chart constellation calibration.`,
    badgeImage: null,
    rarity: 'Legendary',
    unlockedAt: 'Just Now',
  };

  let skills = [];
  if (props.moduleData.skillsAcquired) {
    skills = props.moduleData.skillsAcquired.split(',').map(s => s.trim()).filter(Boolean);
  }
  if (!skills.length) {
    skills = ['Rapid Prototyping', 'Checkpoint Progression', 'Star Chart Navigation'];
  }

  emit('award-badge', { badge, skills });
}

function handleBadgeCardClick() {
  if (currentStep.value >= checkpoints.value.length) {
    triggerBadgeCelebration();
  } else {
    const badgeName = props.moduleData.badge || 'Speed Learner';
    emit('notify', `Complete all ${checkpoints.value.length} checkpoints (100%) to unlock the "${badgeName}" achievement badge!`);
  }
}
</script>

<style scoped>
.roadmap-view-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
  box-sizing: border-box;
}

/* Header */
.roadmap-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 6px;
  flex-shrink: 0;
}

.roadmap-header-left {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.btn-back-nav {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 18px;
  transition: color 0.2s, transform 0.2s;
}

.btn-back-nav:hover {
  color: #ff7a00;
  transform: translateX(-3px);
}

.roadmap-title-group {
  display: flex;
  flex-direction: column;
}

.sub-category-tag {
  font-size: 13px;
  font-weight: 700;
  color: #ff7a00;
  margin-bottom: 2px;
}

.roadmap-title {
  font-size: 26px;
  font-weight: 800;
  color: #181d24;
  letter-spacing: -0.5px;
  margin: 0 0 5px 0;
  line-height: 1.1;
}

.roadmap-header-right {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
}

.roadmap-meta-badge-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.badge-beginner {
  background: #f59e0b;
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 9px;
  border-radius: 9999px;
}

.badge-yellow { background: #f59e0b; }
.badge-pink { background: #ec4899; }
.badge-purple { background: #8b5cf6; }

.current-path-text {
  font-size: 12.5px;
  color: #6b7280;
  font-weight: 500;
}

.btn-icon-control {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #1f2937;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s, transform 0.2s;
  border-radius: 6px;
}

.btn-icon-control:hover {
  color: #ff7a00;
  transform: scale(1.1);
}

.btn-icon-control.is-starred {
  color: #ff7a00;
}

/* Fast-Track Testing Banner */
.test-controls-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(254, 243, 199, 0.6));
  border: 1.5px solid rgba(245, 158, 11, 0.4);
  border-radius: 14px;
  padding: 10px 18px;
  margin-bottom: 12px;
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.08);
  flex-shrink: 0;
  gap: 16px;
}

.test-banner-info {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
  min-width: 0;
}

.test-banner-pill {
  display: flex;
  align-items: center;
  gap: 7px;
  background: rgba(255, 122, 0, 0.12);
  color: #c2410c;
  padding: 4px 11px;
  border-radius: 9999px;
  font-size: 11.5px;
  font-weight: 700;
  white-space: nowrap;
}

.pulse-dot {
  width: 7px;
  height: 7px;
  background: #ff7a00;
  border-radius: 50%;
  box-shadow: 0 0 6px #ff7a00;
  animation: pulse-dot 1.5s infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(1.3); }
}

.test-progress-bar-wrapper {
  flex: 1;
  max-width: 220px;
  height: 8px;
  background: #e2e8f0;
  border-radius: 9999px;
  overflow: hidden;
}

.test-progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff7a00, #f43f5e);
  border-radius: 9999px;
  transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.test-progress-text {
  font-size: 12px;
  font-weight: 700;
  color: #374151;
  white-space: nowrap;
}

.test-banner-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.btn-fast-track {
  display: flex;
  align-items: center;
  gap: 7px;
  background: linear-gradient(135deg, #ff7a00, #ea580c);
  color: #ffffff;
  border: none;
  border-radius: 9999px;
  padding: 7px 16px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(234, 88, 12, 0.3);
  transition: transform 0.15s, box-shadow 0.2s, background 0.2s;
}

.btn-fast-track:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(234, 88, 12, 0.4);
  background: linear-gradient(135deg, #ff8c1a, #f97316);
}

.btn-view-badge {
  display: flex;
  align-items: center;
  gap: 7px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: #ffffff;
  border: none;
  border-radius: 9999px;
  padding: 7px 16px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  transition: transform 0.15s, box-shadow 0.2s;
  animation: pulse-badge-btn 2s infinite ease-in-out;
}

@keyframes pulse-badge-btn {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.04); }
}

.badge-trophy-icon {
  font-size: 14px;
}

.btn-reset-progression {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #ffffff;
  border: 1px solid #d1d5db;
  color: #4b5563;
  border-radius: 9999px;
  padding: 6px 13px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-reset-progression:hover {
  background: #f9fafb;
  border-color: #9ca3af;
  color: #111827;
}

/* Main Body Layout */
.roadmap-body-grid {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 40px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  width: 100%;
  max-width: 1360px;
  margin: 0 auto 0 10px;
}

/* Constellation Stage */
.constellation-stage {
  position: relative;
  flex: 1;
  width: 100%;
  max-width: 920px;
  height: 480px;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Lines SVG Layer */
.lines-layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.line-animated-completed {
  stroke-dasharray: 2000;
  stroke-dashoffset: 0;
  animation: drawLine 0.8s ease-out forwards;
}

@keyframes drawLine {
  from { stroke-dashoffset: 2000; }
  to { stroke-dashoffset: 0; }
}

/* Nodes Overlay Container */
.nodes-overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

/* Bokeh Node */
.bokeh-node-wrapper {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  user-select: none;
}

.bokeh-node-wrapper:hover {
  transform: translate(-50%, -50%) scale(1.15);
}

/* Bokeh Halos */
.bokeh-halo {
  position: absolute;
  width: 66px;
  height: 66px;
  border-radius: 50%;
  filter: blur(12px);
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.halo-pink {
  background: radial-gradient(circle, rgba(254, 205, 211, 0.95) 0%, rgba(244, 63, 94, 0.65) 45%, rgba(225, 29, 72, 0.15) 75%, transparent 100%);
}

.halo-completed {
  filter: blur(14px);
  background: radial-gradient(circle, rgba(254, 205, 211, 1) 0%, rgba(244, 63, 94, 0.75) 45%, rgba(225, 29, 72, 0.25) 75%, transparent 100%);
}

.halo-large {
  width: 82px;
  height: 82px;
  filter: blur(15px);
}

.halo-pulsing {
  animation: haloPulse 2.5s infinite ease-in-out;
}

@keyframes haloPulse {
  0%, 100% { transform: scale(1); opacity: 0.85; }
  50% { transform: scale(1.2); opacity: 1; }
}

.halo-gray {
  background: radial-gradient(circle, rgba(203, 213, 225, 0.75) 0%, rgba(148, 163, 184, 0.4) 45%, rgba(100, 116, 139, 0.1) 75%, transparent 100%);
}

/* Bokeh Core Orbs */
.bokeh-core {
  position: relative;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: box-shadow 0.25s ease, transform 0.2s ease;
}

.core-pink {
  background: radial-gradient(circle at 35% 35%, #ffffff 0%, #fecdd3 25%, #f43f5e 65%, #e11d48 90%, #be123c 100%);
  box-shadow: 0 0 14px rgba(244, 63, 94, 0.65), 0 0 22px rgba(254, 205, 211, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.85);
}

.core-completed {
  box-shadow: 0 0 18px rgba(244, 63, 94, 0.85), inset 0 1px 2px #ffffff;
}

.core-pulse {
  animation: corePulse 1.8s infinite ease-in-out;
}

@keyframes corePulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.active-dot-inner {
  width: 8px;
  height: 8px;
  background: #ffffff;
  border-radius: 50%;
  box-shadow: 0 0 8px #ffffff;
}

.core-gray {
  background: radial-gradient(circle at 35% 35%, #ffffff 0%, #cbd5e1 35%, #94a3b8 68%, #64748b 95%);
  box-shadow: 0 0 10px rgba(148, 163, 184, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.85);
  opacity: 0.88;
}

.pulse-dashed-orbit {
  position: absolute;
  width: 48px;
  height: 48px;
  border: 2px dashed rgba(244, 63, 94, 0.85);
  border-radius: 50%;
  z-index: 1;
  animation: orbitRotate 6s linear infinite;
  box-shadow: 0 0 12px rgba(244, 63, 94, 0.35);
}

@keyframes orbitRotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Labels */
.label-aside {
  position: absolute;
  white-space: nowrap;
  display: flex;
  flex-direction: column;
  pointer-events: none;
  gap: 2px;
}

.step-num-pill {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 9999px;
  width: fit-content;
  letter-spacing: 0.2px;
}

.completed-pill {
  background: rgba(16, 185, 129, 0.15);
  color: #059669;
}

.active-pill {
  background: rgba(244, 63, 94, 0.15);
  color: #e11d48;
}

.locked-pill {
  background: rgba(148, 163, 184, 0.2);
  color: #64748b;
}

.label-title {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  letter-spacing: -0.1px;
}

.highlight-label .label-title {
  font-weight: 800;
  color: #0f172a;
}

.label-locked .label-title {
  color: #94a3b8;
  font-weight: 500;
}

.label-right {
  left: calc(100% + 18px);
  top: 50%;
  transform: translateY(-50%);
}

.label-left {
  right: calc(100% + 18px);
  top: 50%;
  transform: translateY(-50%);
  align-items: flex-end;
}

.label-top {
  bottom: calc(100% + 16px);
  left: 50%;
  transform: translateX(-50%);
  align-items: center;
}

.label-bottom {
  top: calc(100% + 16px);
  left: 50%;
  transform: translateX(-50%);
  align-items: center;
}

.node-locked {
  cursor: not-allowed;
}

/* Learning Objectives Panel */
.objectives-panel {
  display: flex;
  flex-direction: column;
  padding: 10px 0;
  width: 290px;
  max-width: 290px;
  flex-shrink: 0;
  margin: 0;
  align-self: center;
  gap: 16px;
}

.objectives-title {
  font-size: 14.5px;
  font-weight: 800;
  color: #ff7a00;
  margin: 0;
}

.objectives-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 11px;
}

.objectives-list li {
  position: relative;
  padding-left: 18px;
  font-size: 12.5px;
  color: #374151;
  line-height: 1.5;
  font-weight: 500;
}

.objectives-list li::before {
  content: "•";
  position: absolute;
  left: 2px;
  top: -1px;
  font-size: 17px;
  color: #ff7a00;
}

/* Badge Preview Card */
.badge-preview-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 12px 14px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
}

.badge-preview-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.06);
  border-color: #ff7a00;
}

.badge-preview-icon {
  font-size: 26px;
  width: 44px;
  height: 44px;
  background: rgba(255, 122, 0, 0.1);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.badge-preview-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.badge-preview-tag {
  font-size: 10px;
  font-weight: 700;
  color: #ea580c;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.badge-preview-title {
  margin: 0;
  font-size: 13.5px;
  font-weight: 700;
  color: #1f2937;
}

.badge-preview-sub {
  margin: 0;
  font-size: 11.5px;
  color: #6b7280;
}

@media (max-width: 1024px) {
  .roadmap-body-grid {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
    overflow-y: auto;
  }
}
</style>
