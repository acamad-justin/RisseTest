/**
 * homeData.js — Mock data for the Risse homepage.
 *
 * ⚠  DEMO DATA — not real learner records.
 *
 * Positions (x, y) are in the ConstellationMap SVG coordinate space
 * (viewBox "0 0 900 560"). Adjust here to reposition nodes without
 * touching any component.
 *
 * Connection type:
 *   "solid"       — established relationship, drawn as a solid line
 *   "exploratory" — weaker / emerging link, drawn as a dashed line
 */

// ── Concept nodes ──────────────────────────────────────────────────────────
export const concepts = [
  {
    id: 'outputs',
    label: 'Outputs',
    x: 207,
    y: 135,
    size: 'medium',        // 'small' | 'medium' | 'large' | 'xlarge'
    glowColor: '#c8c0ff',  // lavender-white
    activityState: 'active',
    evolutionStage: 'established',
    mastered: true,
    connections: ['actuation', 'control-loops'],
    description: 'The physical actions a robot takes in response to its control system.',
  },
  {
    id: 'actuation',
    label: 'Actuation',
    x: 395,
    y: 68,
    size: 'medium',
    glowColor: '#d0caff',
    activityState: 'active',
    evolutionStage: 'established',
    mastered: true,
    connections: ['outputs', 'control-loops'],
    description: 'Converting electrical signals into physical motion using motors, servos, and pneumatics.',
  },
  {
    id: 'pid',
    label: 'PID',
    x: 127,
    y: 265,
    size: 'small',
    glowColor: '#e8d8ff',
    activityState: 'sustained',
    evolutionStage: 'developing',
    mastered: false,
    connections: ['control-loops', 'tuning'],
    description: 'A three-term controller (Proportional, Integral, Derivative) that minimises error over time.',
  },
  {
    id: 'control-loops',
    label: 'Control Loops',
    x: 308,
    y: 242,
    size: 'medium',
    glowColor: '#f0e8ff',
    activityState: 'active',
    evolutionStage: 'expanding',
    mastered: true,
    connections: ['outputs', 'actuation', 'pid', 'tuning', 'microcontrollers'],
    description: 'Feedback mechanisms that compare a desired state with actual measurements to drive corrections.',
  },
  {
    id: 'tuning',
    label: 'Tuning',
    x: 234,
    y: 370,
    size: 'small',
    glowColor: '#ffe8d0',
    activityState: 'sustained',
    evolutionStage: 'developing',
    mastered: false,
    connections: ['pid', 'control-loops'],
    description: 'Adjusting controller gains to achieve stable, accurate, and fast system response.',
  },
  {
    id: 'microcontrollers',
    label: 'Microcontrollers',
    x: 594,
    y: 263,
    size: 'large',
    glowColor: '#ffffff',
    activityState: 'active',
    evolutionStage: 'established',
    mastered: true,
    connections: ['control-loops', 'robot-components', 'sensing', 'inputs'],
    description: 'Embedded processors (Arduino, STM32, etc.) that execute control logic and interface with hardware.',
  },
  {
    id: 'inputs',
    label: 'Inputs',
    x: 754,
    y: 263,
    size: 'small',
    glowColor: '#d8e8ff',
    activityState: 'fading',
    evolutionStage: 'emerging',
    mastered: false,
    connections: ['microcontrollers', 'sensing', 'robot-components'],
    description: 'Signals and data received by the robot from sensors, user controls, and external systems.',
  },
  {
    id: 'sensing',
    label: 'Sensing',
    x: 702,
    y: 381,
    size: 'small',
    glowColor: '#d8e8ff',
    activityState: 'fading',
    evolutionStage: 'emerging',
    mastered: false,
    connections: ['microcontrollers', 'inputs', 'robot-components'],
    description: 'How a robot gathers information about its environment through hardware transducers.',
  },
  {
    id: 'robot-components',
    label: 'Robot Components',
    x: 430,
    y: 422,
    size: 'xlarge',
    glowColor: '#ffb0d8',  // pink-white — the visually dominant node
    activityState: 'active',
    evolutionStage: 'expanding',
    mastered: true,
    connections: ['microcontrollers', 'inputs', 'sensing'],
    description: 'The physical hardware assemblies — chassis, wheels, arms — that make up a robot.',
  },
]

// ── Derived helpers ────────────────────────────────────────────────────────
/** id → concept for O(1) lookups */
export const conceptMap = Object.fromEntries(concepts.map(c => [c.id, c]))

/**
 * Explicit edge list with relationship type.
 * "solid"       → solid thin line, soft glow
 * "exploratory" → dashed, dimmer
 *
 * Each undirected pair appears once.
 */
export const connections = [
  // Solid — established relationships
  { from: 'outputs',         to: 'actuation',        type: 'solid' },
  { from: 'outputs',         to: 'control-loops',    type: 'solid' },
  { from: 'pid',             to: 'control-loops',    type: 'solid' },
  { from: 'pid',             to: 'tuning',           type: 'solid' },
  { from: 'tuning',          to: 'control-loops',    type: 'solid' },
  { from: 'control-loops',   to: 'microcontrollers', type: 'solid' },

  // Exploratory — weaker / dashed
  { from: 'robot-components', to: 'microcontrollers', type: 'exploratory' },
  { from: 'robot-components', to: 'inputs',           type: 'exploratory' },
  { from: 'microcontrollers', to: 'sensing',          type: 'exploratory' },
  { from: 'sensing',          to: 'inputs',           type: 'exploratory' },
]

// ── Projects ───────────────────────────────────────────────────────────────
export const projects = [
  {
    id: 'line-following',
    title: 'Line-Following Robot',
    description: 'Exploring how a robot follows a marked path using IR sensors and PID steering.',
    status: 'in-progress',
    conceptIds: ['pid', 'control-loops', 'outputs', 'actuation'],
  },
  {
    id: 'autonomous-navigation',
    title: 'Autonomous Navigation',
    description: 'Mapping an arena and planning a collision-free path without human input.',
    status: 'planned',
    conceptIds: ['sensing', 'microcontrollers', 'inputs', 'control-loops'],
  },
  {
    id: 'stability-study',
    title: 'Robot Stability Study',
    description: 'Investigating how centre-of-mass adjustments improve balance on uneven terrain.',
    status: 'complete',
    conceptIds: ['robot-components', 'pid', 'tuning', 'sensing'],
  },
]

// ── Learner summary (demo values) ─────────────────────────────────────────
export const learnerSummary = {
  displayName:   'Demo Learner',
  projectCount:  projects.length,                          // 3
  masteredCount: concepts.filter(c => c.mastered).length,  // derived from data
}
