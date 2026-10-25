<template>
  <div class="checkpoint-page-container" :class="{ 'is-chat-maximized': isChatMaximized }">
    <!-- Left Column: Header (Back, Module Tag, Title, Meta) + Star/Kebab (outside chatbox) + Lesson Lecture -->
    <div class="checkpoint-main-column">
      <header class="checkpoint-header">
        <div class="checkpoint-header-left">
          <button 
            type="button" 
            class="btn-back-nav" 
            @click="$emit('back')" 
            title="Back to Progression Map" 
            aria-label="Back to Progression Map"
            id="btn-back-to-roadmap"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>

          <div class="checkpoint-title-group">
            <span class="sub-category-tag">Module</span>
            <h1 class="checkpoint-title">{{ checkpointTitle }}</h1>
            <div class="checkpoint-meta-badge-row">
              <span class="badge-beginner">Beginner</span>
              <span class="parent-module-text">{{ parentModuleName }}</span>
            </div>
          </div>
        </div>

        <!-- Complete Checkpoint & Star/Kebab buttons -->
        <div class="checkpoint-header-actions">
          <button 
            type="button" 
            class="btn-complete-checkpoint-action" 
            @click="handleCompleteCheckpoint"
            title="Mark this checkpoint complete and advance progression"
            id="btn-complete-checkpoint"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>Complete Checkpoint</span>
          </button>

          <button 
            type="button" 
            class="btn-icon-control" 
            :class="{ 'is-starred': isStarred }"
            @click="toggleStar"
            :title="isStarred ? 'Remove from favorites' : 'Bookmark this path'"
            aria-label="Bookmark"
            id="btn-star-checkpoint"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" :fill="isStarred ? '#ff7a00' : 'none'" :stroke="isStarred ? '#ff7a00' : '#1f2937'" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </button>

          <div class="kebab-menu-wrapper" @click.stop>
            <button 
              type="button" 
              class="btn-icon-control" 
              @click.stop="isKebabOpen = !isKebabOpen"
              title="More options" 
              aria-label="More options"
              id="btn-kebab-checkpoint"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="2"/>
                <circle cx="12" cy="12" r="2"/>
                <circle cx="12" cy="19" r="2"/>
              </svg>
            </button>

            <!-- Kebab Menu Dropdown -->
            <transition name="dropdown-fade">
              <div v-if="isKebabOpen" class="checkpoint-dropdown-menu" @click.stop>
                <button type="button" class="checkpoint-dropdown-item" @click="handleAction('Share')">Share Lesson</button>
              </div>
            </transition>
          </div>
        </div>
      </header>

      <!-- Educational Lesson Text & Core Concepts (Dynamic to active topic) -->
      <section class="lesson-lecture-column">
        <h2 class="concepts-heading">Explore The Core Concepts</h2>

        <!-- Dynamic Concept Blocks -->
        <article 
          v-for="(concept, cIdx) in activeLessonData.concepts" 
          :key="cIdx" 
          class="concept-block"
        >
          <h3 class="concept-title dashed-underline">{{ concept.title }}</h3>
          <p class="concept-text">
            {{ concept.text }}
          </p>
          <p class="concept-example">
            <strong>Example:</strong> {{ concept.example }}
          </p>
          <p class="concept-key-idea">
            <strong>Key idea:</strong> {{ concept.keyIdea }}
          </p>
        </article>
      </section>
    </div>

    <!-- Right: Stretched Risse AI Chatbot Side Box (Top aligned with Module text) -->
    <aside 
      class="chatbot-panel-card" 
      :class="{ 'chatbot-panel-card--maximized': isChatMaximized }"
      aria-label="Risse AI Chat Assistant"
    >
      <div class="chatbot-header-controls">
        <span class="chat-header-spacer"></span>
        <button 
          type="button" 
          class="btn-expand-chat" 
          :title="isChatMaximized ? 'Restore normal view' : 'Maximize AI'" 
          :aria-label="isChatMaximized ? 'Restore normal view' : 'Maximize AI'"
          @click="isChatMaximized = !isChatMaximized"
        >
          <svg v-if="!isChatMaximized" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 3h6v6"/>
            <path d="M9 21H3v-6"/>
            <path d="M21 3l-7 7"/>
            <path d="M3 21l7-7"/>
          </svg>
          <svg v-else width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 14h6v6"/>
            <path d="M20 10h-6V4"/>
            <path d="M14 10l7-7"/>
            <path d="M3 21l7-7"/>
          </svg>
        </button>
      </div>

      <!-- Chat Conversation Messages Flow -->
      <div class="chatbot-messages-scroll" ref="chatMessagesContainer">
        <!-- Dynamic Initial AI Prompt based on current checkpoint -->
        <div class="message-bubble ai-message">
          <p class="ai-greeting">{{ activeLessonData.introGreeting }}</p>
          <p>
            {{ activeLessonData.p1 }}
          </p>
          <p>
            {{ activeLessonData.p2 }}
          </p>
          <p>
            {{ activeLessonData.question }}
          </p>

          <!-- Message Action Toolbar -->
          <div class="message-actions-toolbar">
            <button type="button" class="btn-msg-tool" title="Copy Message" @click="copyPrompt">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
              </svg>
            </button>

            <button type="button" class="btn-msg-tool" title="Bookmark Insight" @click="bookmarkInsight(activeLessonData.question)">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Interactive User & Assistant Messages -->
        <div 
          v-for="(msg, idx) in chatHistory" 
          :key="idx" 
          class="message-bubble" 
          :class="msg.sender === 'user' ? 'user-message' : 'ai-message'"
        >
          <div v-if="msg.sender === 'ai' && msg.isStreaming && !msg.text" class="typing-indicator" aria-label="Risse is thinking">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
          </div>
          <p v-else class="bubble-text" v-html="formatMessageText(msg.text)"></p>

          <!-- Action Toolbar for AI responses -->
          <div v-if="msg.sender === 'ai' && !msg.isStreaming && msg.text" class="message-actions-toolbar">
            <button type="button" class="btn-msg-tool" title="Copy Message" @click="copyText(msg.text)">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
              </svg>
            </button>
            <button type="button" class="btn-msg-tool" title="Bookmark Insight" @click="bookmarkInsight(msg.text)">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Bottom Chat Input Area matching screenshot -->
      <form class="chatbot-input-box" @submit.prevent="sendMessage">
        <textarea 
          ref="chatInputTextarea"
          v-model="userQuery" 
          :disabled="isStreaming"
          placeholder="Ask Risse..." 
          class="chat-text-input chat-text-textarea" 
          id="chat-input-query"
          rows="1"
          @input="autoGrowInput"
          @keydown.enter.exact.prevent="sendMessage"
        ></textarea>

        <div class="chat-input-actions">
          <!-- Attachment Paperclip -->
          <button type="button" class="btn-attach" title="Attach file or schematic" aria-label="Attach file">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
            </svg>
          </button>

          <!-- Send Action Plane -->
          <button 
            type="submit" 
            class="btn-send" 
            :class="{ 'is-disabled': isStreaming || !userQuery.trim() }"
            :disabled="isStreaming || !userQuery.trim()" 
            title="Send query" 
            aria-label="Send query"
          >
            <svg v-if="!isStreaming" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            <span v-else class="send-spinner"></span>
          </button>
        </div>
      </form>
    </aside>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import axios from 'axios';

const props = defineProps({
  checkpointTitle: {
    type: String,
    default: 'Inputs, Output, and Signals',
  },
  parentModuleName: {
    type: String,
    default: 'Robotics Fundamentals',
  },
  moduleData: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(['back', 'notify', 'complete-checkpoint']);

const userQuery = ref('');
const chatInputTextarea = ref(null);
const chatHistory = ref([]);
const isStreaming = ref(false);
const chatMessagesContainer = ref(null);
const isStarred = ref(false);
const isKebabOpen = ref(false);
const isChatMaximized = ref(false);

function autoGrowInput() {
  const el = chatInputTextarea.value;
  if (!el) return;
  el.style.height = 'auto';
  // Up to 4 lines of text on uncollapsed AI (~92px), then scroll
  const maxLines = isChatMaximized.value ? 7 : 4;
  const maxHeight = maxLines * 20 + 12;
  el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
}

watch(isChatMaximized, () => {
  nextTick(() => {
    autoGrowInput();
    scrollToBottom();
  });
});

watch(() => props.checkpointTitle, () => {
  chatHistory.value = [];
  userQuery.value = '';
  if (chatInputTextarea.value) chatInputTextarea.value.style.height = 'auto';
});

// Dynamic lesson data tailored to the specific topic & parent module
const activeLessonData = computed(() => {
  const title = (props.checkpointTitle || '').trim();
  const parent = (props.parentModuleName || '').trim();

  // Knowledge dictionary aligned with competitive robotics curriculum
  const library = {
    // Test Module Checkpoints
    'Orientation & Signal Basics': {
      subtitle: 'Signal Flow & Fast Calibration',
      introGreeting: 'Welcome to your test calibration! ⚡',
      p1: `In this path, we explore rapid signal routing and foundational logic in robotics systems.`,
      p2: `Consider a microcontroller receiving a raw voltage pulse when a calibration button is pressed: how does the system recognize that transition?`,
      question: `What must happen to an analog voltage reading before a microcontroller can evaluate it as a logical condition (HIGH or LOW)?`,
      concepts: [
        {
          title: 'A. Signal Representation',
          text: 'Signals carry electrical or digital states between sensors, microcontrollers, and actuators.',
          example: 'A push-button or micro-switch sends a 3.3V pulse to an input pin when actuated.',
          keyIdea: 'A signal is raw information in transit; processing decides what that signal means.',
        },
        {
          title: 'B. Latency & Sampling',
          text: 'How frequently a system samples an incoming signal dictates how quickly it can react.',
          example: 'If a sensor updates at 10Hz but a robot moves at 1 m/s, it travels 10cm between readings.',
          keyIdea: 'Appropriate sampling rates are necessary to prevent missed events.',
        },
        {
          title: 'C. Closed-Loop Feedback',
          text: 'Feedback allows a robot to verify whether its executed action achieved the intended target.',
          example: 'Reading optical encoder ticks to confirm that a wheel completed a 90-degree pivot.',
          keyIdea: 'Without feedback, actions assume ideal conditions that rarely exist in the arena.',
        },
      ]
    },
    'Rapid Prototyping Trial': {
      subtitle: 'Fast Iteration & Component Interfacing',
      introGreeting: 'Ready for rapid prototyping! 🚀',
      p1: `In this trial, we test fast iteration between sensor feedback and motor actuation.`,
      p2: `Suppose you want your prototype robot to halt within 5 milliseconds of sensing an arena border line.`,
      question: `Between sensor thresholding, code conditional branches, and motor driver braking, where is delay most commonly introduced?`,
      concepts: [
        {
          title: 'A. Rapid Breadboarding & Interfacing',
          text: 'Quickly wiring sensors to test inputs before finalizing soldered harnesses saves critical troubleshooting time.',
          example: 'Verifying optical line sensor contrast against arena mats with an oscilloscope or LED indicator.',
          keyIdea: 'Validate sensor signals independently before writing complex behavior loops.',
        },
        {
          title: 'B. Blocking vs Non-Blocking Logic',
          text: 'Using delays halts the microcontroller, preventing it from reading other emergency sensors.',
          example: 'Replacing delay() with timer interrupts or millis() tracking keeps all sensor loops responsive.',
          keyIdea: 'Never halt the main loop when competitive robots need continuous situational awareness.',
        },
        {
          title: 'C. Electrical Power Isolation',
          text: 'Motors draw high surge currents that can cause microcontrollers to brown-out or reset.',
          example: 'Powering logic and motors from separated regulators or decoupling capacitors.',
          keyIdea: 'Stable logic power prevents erratic rebooting during heavy motor draw.',
        },
      ]
    },
    'Final Calibration & Mastery': {
      subtitle: 'Consistency & Star Chart Graduation',
      introGreeting: 'Final calibration sequence! 🌟',
      p1: `In this final checkpoint, we verify end-to-end repeatability and calibrate full system consistency.`,
      p2: `A competitive robot that works once in testing is a prototype; a robot that performs identical moves 10 times in a row demonstrates true consistency.`,
      question: `What environmental or mechanical variables (such as battery voltage sag or wheel traction) cause a robot to drift over consecutive runs?`,
      concepts: [
        {
          title: 'A. Consistency as the Apex Standard',
          text: 'Consistency represents the ability to reliably repeat successful performance across multiple match rounds.',
          example: 'A sumobot executing the exact same opening charge and edge-stop 10 rounds consecutively.',
          keyIdea: 'Consistency cannot be achieved until proportionality, balance, and precision are satisfied.',
        },
        {
          title: 'B. Battery Discharge & Speed Drift',
          text: 'As battery voltage drops from 12.6V to 11.1V, open-loop motors spin slower for the exact same PWM command.',
          example: 'Using voltage compensation algorithms or closed-loop PID velocity control.',
          keyIdea: 'Compensate for energy depletion in software to preserve maneuver repeatability.',
        },
        {
          title: 'C. Graduation to Autonomous Mastery',
          text: 'Calibrating all sensor baselines and thresholds locks in competition readiness.',
          example: 'Storing line sensor min/max calibrations in EEPROM or flash memory at startup.',
          keyIdea: 'A calibrated system adapts to arena lighting and surface variations effortlessly.',
        },
      ]
    },
    // Robotics Fundamentals
    'Inputs, Output, and Signals': {
      subtitle: 'Signal Flow & System Interaction',
      introGreeting: 'Welcome back! ✨',
      p1: `In this path, we'll explore Inputs, Outputs, and Signals — how a robot receives information, processes it, and responds to the world around it.`,
      p2: `Think about a Sumobot: how does it know an opponent is nearby, and how does it decide when to move?`,
      question: `Let's start there. What do you think a robot needs to receive or detect before it can respond to something in its environment?`,
      concepts: [
        {
          title: 'A. Inputs — Information coming in',
          text: 'Inputs are information a robot receives from its environment or from another system. Sensors often provide these inputs.',
          example: 'Sumobot example: An infrared sensor detects a change in the surface beneath the robot, suggesting that it has reached the arena boundary.',
          keyIdea: 'An input gives the robot information to work with.',
        },
        {
          title: 'B. Signals — Information represented',
          text: 'Signals carry information between components. They can be electrical voltages, digital values, pulses, or other measurable forms.',
          example: 'Sumobot example: The sensor sends an electrical signal that the microcontroller reads as a value indicating the surface detected.',
          keyIdea: 'A signal carries information; it is not necessarily the information-processing decision itself.',
        },
        {
          title: 'C. Outputs — Commands or results going out',
          text: 'Outputs are the results a system sends to other components or systems. A microcontroller may produce output signals to control an actuator.',
          example: 'Sumobot example: The microcontroller sends a command to the motor driver to reverse the motors, allowing the robot to move away from the edge.',
          keyIdea: 'An output communicates the result of the system\'s processing.',
        },
      ]
    },
    'Robotics Basics': {
      subtitle: 'Foundations & System Architecture',
      introGreeting: 'Welcome to Robotics Basics! 🤖',
      p1: `In this path, we explore what truly defines a robot: the integration of sensing, computation, and physical actuation.`,
      p2: `Everyday machines perform repetitive tasks, but robots perceive their environment and adjust actions autonomously.`,
      question: `What is the key difference between a pre-programmed washing machine cycle and an autonomous robot vacuum cleaner?`,
      concepts: [
        {
          title: 'A. The Robotic Sense-Plan-Act Loop',
          text: 'Robots continuously cycle through three phases: sensing the environment, computing a decision, and executing motion.',
          example: 'A mobile robot reads ultrasonic distance (Sense), computes steering angle (Plan), and spins left motor (Act).',
          keyIdea: 'The closed loop allows continuous adaptation to real-time changes.',
        },
        {
          title: 'B. Hardware vs Firmware Roles',
          text: 'Mechanical frames provide rigidity, electrical circuits distribute power and signals, and firmware executes decision logic.',
          example: 'If a chassis flexes excessively, wheel encoders miscalculate travel distance regardless of firmware quality.',
          keyIdea: 'Software cannot compensate for poor mechanical structural integrity.',
        },
        {
          title: 'C. Autonomy Levels',
          text: 'Robotics spans from remote-controlled teleoperation to fully autonomous systems navigating unmapped terrains.',
          example: 'Competitive RC combat robots vs fully autonomous match robots with line and opponent detection.',
          keyIdea: 'Greater autonomy demands higher sensor fidelity and robust error recovery.',
        },
      ]
    },
    'Robot Anatomy': {
      subtitle: 'Structural Mechanics & Component Layout',
      introGreeting: 'Exploring Robot Anatomy! 🦾',
      p1: `In this path, we inspect the mechanical anatomy of competitive robots — structural chassis, drive trains, and component placement.`,
      p2: `Where you mount the battery, motors, and heavy steel plates directly dictates how stable your robot is during collisions.`,
      question: `If you mount a heavy battery high up on the robot rather than low near the wheel axles, how does that affect balance during rapid turns?`,
      concepts: [
        {
          title: 'A. The Structural Chassis',
          text: 'The chassis serves as the backbone of the robot, absorbing collision impacts and maintaining component alignment.',
          example: 'Aluminum or carbon fiber plates machined with mounting patterns for motors and gearboxes.',
          keyIdea: 'A rigid chassis ensures gear meshes stay aligned and sensors remain calibrated.',
        },
        {
          title: 'B. Drive Train Configuration',
          text: 'Differential drive, omnidirectional wheels, and tank treads provide vastly different traction and maneuverability trade-offs.',
          example: 'Differential two-wheel drive with a rear caster enables high speed and tight zero-radius turns in small arenas.',
          keyIdea: 'Select drive geometry based on acceleration, top speed, and pushing power requirements.',
        },
        {
          title: 'C. Weight Distribution & Traction',
          text: 'Traction between rubber tires and the arena floor depends directly on normal force (weight pressing down on the driven wheels).',
          example: 'Placing heavy batteries directly over the drive wheels doubles pushing force against opponents.',
          keyIdea: 'Weight placed over non-driven casters wastes potential wheel traction.',
        },
      ]
    },
    'Microcontrollers': {
      subtitle: 'Processing, Registers & Logic Execution',
      introGreeting: 'Welcome to Microcontroller Architecture! ⚡',
      p1: `In this path, we dive into the microcontroller — the embedded brain that processes sensor inputs and drives hardware outputs.`,
      p2: `Microcontrollers execute instructions in microsecond clock cycles, reading digital I/O pins, ADC converters, and timing interrupts.`,
      question: `When reading an analog sensor like a potentiometer or sharp distance sensor, why does the microcontroller need an ADC (Analog-to-Digital Converter)?`,
      concepts: [
        {
          title: 'A. Analog-to-Digital Conversion (ADC)',
          text: 'Physical sensors produce continuous voltage levels (0V to 5V), whereas microcontrollers compute in discrete binary bits.',
          example: 'A 10-bit ADC maps 0V–5V to integer values between 0 and 1023.',
          keyIdea: 'ADC resolution dictates the smallest sensor change the robot can perceive.',
        },
        {
          title: 'B. Pulse Width Modulation (PWM)',
          text: 'Microcontrollers modulate digital square wave duty cycles to simulate variable power for motor speed and servo angles.',
          example: 'A 50% duty cycle delivers half power to the motor driver without generating massive resistive heat.',
          keyIdea: 'PWM controls average power delivery efficiently by switching rapidly between ON and OFF.',
        },
        {
          title: 'C. Hardware Interrupts vs Polling',
          text: 'Interrupts immediately pause the main loop to handle time-critical events like boundary line detection or collision switches.',
          example: 'An arena edge sensor hooked to an interrupt pin guarantees immediate motor reversal before momentum carries it out.',
          keyIdea: 'Interrupts protect against latency in mission-critical safety events.',
        },
      ]
    },
    'Sensing': {
      subtitle: 'Perception, Noise Filtering & Sensor Fusion',
      introGreeting: 'Exploring Perception & Sensing! 📡',
      p1: `In this path, we explore how robots perceive their surrounding arena using optical, ultrasonic, and inertial sensors.`,
      p2: `Real-world sensor signals are noisy — light reflections flicker, ultrasonic echoes bounce off walls, and motors inject electrical noise.`,
      question: `If an optical line sensor occasionally misreads due to arena glare, what software filtering method could prevent false-positive trigger stops?`,
      concepts: [
        {
          title: 'A. Digital vs Analog Perception',
          text: 'Digital sensors output binary HIGH/LOW states with built-in thresholding, while analog sensors provide raw continuous signal levels.',
          example: 'An analog line sensor lets code detect subtle gray arena gradients, whereas digital switches only trigger at a fixed cutoff.',
          keyIdea: 'Analog data provides gradient nuance; digital signals provide speed and simplicity.',
        },
        {
          title: 'B. Noise Filtering & Debouncing',
          text: 'Averaging rolling buffers or enforcing minimum trigger durations filters out electrical spikes and surface reflections.',
          example: 'Requiring an infrared line sensor to stay LOW for 3 consecutive samples before committing to a motor stop.',
          keyIdea: 'Filters trade a tiny amount of latency for immense reliability against false alarms.',
        },
        {
          title: 'C. Sensor Placement & Blind Spots',
          text: 'Where sensors are positioned determines the robot\'s field of view and reaction distance.',
          example: 'Angling line sensors slightly outward detects arena corners before the wheels slip over.',
          keyIdea: 'Geometric sensor arrangement often solves detection problems faster than complex code.',
        },
      ]
    },
    'Action & Actuation': {
      subtitle: 'Motors, Motor Drivers & Kinematics',
      introGreeting: 'Action & Actuation Sequence! ⚙️',
      p1: `In this path, we investigate actuators, H-bridge motor drivers, and translating algorithmic commands into mechanical torque.`,
      p2: `Microcontroller pins can only source 20mA of current, whereas DC motors require 2A to 20A under stall load.`,
      question: `What would happen if you connected a high-power DC motor directly to a microcontroller pin without a motor driver or MOSFET?`,
      concepts: [
        {
          title: 'A. The Role of the H-Bridge Driver',
          text: 'An H-bridge uses switching transistors to safely control high-current motor direction and speed from low-power microcontroller logic pins.',
          example: 'An L298N or TB6612FNG driver directing 12V motor battery power based on 3.3V logic signals.',
          keyIdea: 'Motor drivers protect the microcontroller logic circuit while directing heavy actuator current.',
        },
        {
          title: 'B. Stall Torque vs Free-Run Speed',
          text: 'DC motors produce their maximum torque at zero RPM (stall), while drawing maximum stall current.',
          example: 'When pushing an opponent sumobot, motors operate near stall and draw peak battery current.',
          keyIdea: 'Size motor drivers and wiring harnesses for worst-case stall currents, not idle free-run currents.',
        },
        {
          title: 'C. Back-EMF & Flyback Protection',
          text: 'When a spinning motor stops or reverses, collapsing magnetic fields induce reverse voltage spikes (Back-EMF).',
          example: 'Flyback diodes inside drivers clamp negative voltage spikes to prevent transistor burnout.',
          keyIdea: 'Inductive motor loads must always have reverse transient protection.',
        },
      ]
    },
  };

  // 1. Exact match
  let matched = library[title];

  // 2. Substring match
  if (!matched) {
    for (const key of Object.keys(library)) {
      if (title.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(title.toLowerCase())) {
        matched = library[key];
        break;
      }
    }
  }

  // 3. Dynamic fallback synthesized from title and parent module
  if (!matched) {
    matched = {
      subtitle: `${parent} • Checkpoint`,
      introGreeting: `Welcome to ${title}! 🚀`,
      p1: `In this path, we explore ${title} — examining how this foundational concept operates within ${parent} and impacts robotic system performance.`,
      p2: `Consider how a competitive robot in the arena must navigate real-world constraints, sensor variance, and timing demands when executing ${title}.`,
      question: `What is the first observation or physical condition you must verify when calibrating ${title} on your robot?`,
      concepts: [
        {
          title: `A. Core Principles of ${title}`,
          text: `${title} provides essential capabilities in ${parent}, establishing predictable behavior and reliable performance.`,
          example: `Applying ${title} during competitive match operations to ensure correct execution.`,
          keyIdea: `Mastering ${title} is key to satisfying higher-order robotic standards.`,
        },
        {
          title: `B. Signal & Mechanical Interaction`,
          text: `How ${title} interfaces with the system's electrical signals, sensor inputs, and actuator mechanisms.`,
          example: `Monitoring latency, voltage stability, or mechanical tolerances during active execution.`,
          keyIdea: `Hardware stability and clear signal paths ensure ${title} functions as designed.`,
        },
        {
          title: `C. Verification & Arena Application`,
          text: `Testing ${title} repeatedly across varied conditions to ensure it meets competitive performance standards.`,
          example: `Executing multiple trial runs to verify stability, accuracy, and reliability before tournament deployment.`,
          keyIdea: `Repeated testing confirms that ${title} operates consistently under competition pressure.`,
        },
      ]
    };
  }

  return matched;
});

function toggleStar() {
  isStarred.value = !isStarred.value;
  emit('notify', isStarred.value ? `Bookmarked "${props.checkpointTitle}"` : `Removed bookmark for "${props.checkpointTitle}"`);
}

async function handleCompleteCheckpoint() {
  const currentStep = props.moduleData?.currentStep || 0;
  const nextStep = currentStep + 1;
  const totalSteps = props.moduleData?.totalSteps || 3;
  const isLast = nextStep >= totalSteps;

  emit('notify', `Marked "${props.checkpointTitle}" as completed!`);

  try {
    const modId = props.moduleData?.id || 999;
    await axios.post('/api/modules/progress', { moduleId: modId, step: nextStep });
  } catch (e) {}

  emit('complete-checkpoint', {
    checkpoint: props.checkpointTitle,
    isLast,
  });

  emit('back');
}

function handleAction(action) {
  isKebabOpen.value = false;
  if (action === 'Share') {
    navigator.clipboard.writeText(window.location.href);
    emit('notify', 'Lesson link copied to clipboard!');
  } else if (action === 'Bookmark') {
    toggleStar();
  } else if (action === 'Complete') {
    handleCompleteCheckpoint();
  }
}

function closeKebab() {
  isKebabOpen.value = false;
}

function scrollToBottom() {
  if (chatMessagesContainer.value) {
    chatMessagesContainer.value.scrollTop = chatMessagesContainer.value.scrollHeight;
  }
}

onMounted(() => {
  window.addEventListener('click', closeKebab);
});

onUnmounted(() => {
  window.removeEventListener('click', closeKebab);
});

async function sendMessage() {
  if (!userQuery.value.trim() || isStreaming.value) return;
  const q = userQuery.value.trim();
  userQuery.value = '';
  if (chatInputTextarea.value) chatInputTextarea.value.style.height = 'auto';

  // 1. Append user's message
  chatHistory.value.push({ sender: 'user', text: q });

  // 2. Prepare conversation messages payload for RAG & context flow with dynamic lesson intro
  const initialGreetingText = `${activeLessonData.value.introGreeting}\n\n${activeLessonData.value.p1}\n\n${activeLessonData.value.p2}\n\n${activeLessonData.value.question}`;

  const formattedMessages = [
    { role: 'assistant', content: initialGreetingText },
    ...chatHistory.value.map(m => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text,
    })),
  ];

  // 3. Append streaming AI message placeholder
  const aiMessageIdx = chatHistory.value.length;
  chatHistory.value.push({
    sender: 'ai',
    text: '',
    isStreaming: true,
  });

  isStreaming.value = true;
  await nextTick();
  scrollToBottom();

  try {
    // 4. Request /api/chat with dynamic checkpoint and module context
    const payload = {
      messages: formattedMessages,
      checkpointTitle: props.checkpointTitle,
      moduleTitle: props.parentModuleName,
    };

    let response;
    const isLocal = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    try {
      response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        let errMsg = `HTTP ${response.status}`;
        try {
          const errJson = await response.json();
          if (errJson) {
            errMsg = errJson.error || errJson.message || JSON.stringify(errJson);
            if (errJson.stage) {
              errMsg = `[Stage: ${errJson.stage}] ${errMsg}`;
            }
          }
        } catch (_) {
          try {
            const rawText = await response.text();
            if (rawText) errMsg = `HTTP ${response.status}: ${rawText.slice(0, 150)}`;
          } catch (__) {}
        }
        throw new Error(errMsg);
      }
    } catch (err) {
      if (isLocal) {
        // Direct Vite dev server fallback (port 5173) for local development only
        response = await fetch('http://localhost:5173/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        throw err;
      }
    }

    if (!response.ok) {
      let finalErrMsg = `Chat API responded with ${response.status}`;
      try {
        const ej = await response.json();
        if (ej && ej.error) finalErrMsg = ej.error;
      } catch (_) {}
      throw new Error(finalErrMsg);
    }

    if (!response.body) {
      throw new Error('Streaming response body not supported');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const textChunk = decoder.decode(value, { stream: true });
      chatHistory.value[aiMessageIdx].text += textChunk;
      scrollToBottom();
    }
  } catch (error) {
    console.error('Chat streaming failed:', error);
    chatHistory.value[aiMessageIdx].text =
      chatHistory.value[aiMessageIdx].text ||
      `⚠️ AI Service Error: ${error?.message || 'Connection error'}\n\n💡 Debug Tip: You can visit /api/chat directly in your browser on this domain to run live backend diagnostics.`;
  } finally {
    chatHistory.value[aiMessageIdx].isStreaming = false;
    isStreaming.value = false;
    await nextTick();
    scrollToBottom();
  }
}

function copyPrompt() {
  const fullIntro = `${activeLessonData.value.introGreeting}\n\n${activeLessonData.value.p1}\n\n${activeLessonData.value.p2}\n\n${activeLessonData.value.question}`;
  navigator.clipboard.writeText(fullIntro);
  emit('notify', 'Copied message to clipboard!');
}

function copyText(text) {
  navigator.clipboard.writeText(text);
  emit('notify', 'Copied message to clipboard!');
}

function bookmarkInsight(text) {
  emit('notify', 'Insight saved to your learning notebook!');
}

function formatMessageText(text) {
  if (!text) return '';
  let safe = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  // Bold **text** -> <strong>text</strong>
  safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Inline code `code` -> <code>code</code>
  safe = safe.replace(/`([^`]+)`/g, '<code class="chat-inline-code">$1</code>');
  return safe;
}
</script>

<style scoped>
/* Full Screen 2-Column Container: Chatbox Stretches to Top */
.checkpoint-page-container {
  display: grid;
  grid-template-columns: 1fr 410px;
  gap: 36px;
  height: 100%;
  width: 100%;
  overflow: hidden;
  box-sizing: border-box;
  transition: grid-template-columns 0.4s cubic-bezier(0.25, 1, 0.5, 1),
              gap 0.4s cubic-bezier(0.25, 1, 0.5, 1);
}

.checkpoint-page-container.is-chat-maximized {
  grid-template-columns: 0fr 1fr;
  gap: 0;
}

.checkpoint-main-column {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  transition: opacity 0.28s ease, transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
}

.checkpoint-page-container.is-chat-maximized .checkpoint-main-column {
  opacity: 0;
  pointer-events: none;
  transform: translateX(-30px);
}

/* Header */
.checkpoint-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  flex-shrink: 0;
  padding-right: 4px;
}

.checkpoint-header-left {
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

.checkpoint-title-group {
  display: flex;
  flex-direction: column;
}

.sub-category-tag {
  font-size: 13px;
  font-weight: 700;
  color: #ff7a00;
  margin-bottom: 2px;
}

.checkpoint-title {
  font-size: 28px;
  font-weight: 800;
  color: #181d24;
  letter-spacing: -0.5px;
  margin: 0 0 6px 0;
  line-height: 1.1;
}

.checkpoint-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 18px;
}

.btn-complete-checkpoint-action {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #ff7a00, #ea580c);
  color: #ffffff;
  border: none;
  border-radius: 9999px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(255, 122, 0, 0.25);
  font-family: inherit;
}

.btn-complete-checkpoint-action:hover {
  background: linear-gradient(135deg, #ff8c1a, #f97316);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 122, 0, 0.35);
}

.kebab-menu-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.checkpoint-dropdown-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04);
  padding: 4px;
  z-index: 100;
  min-width: 140px;
}

.checkpoint-dropdown-item {
  width: 100%;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: background 0.15s ease, color 0.15s ease;
}

.checkpoint-dropdown-item:hover {
  background: #f3f4f6;
  color: #111827;
}

.checkpoint-meta-badge-row {
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

.parent-module-text {
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

/* Left: Educational Text Column */
.lesson-lecture-column {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 12px;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.lesson-lecture-column::-webkit-scrollbar {
  width: 5px;
}

.lesson-lecture-column::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 9999px;
}

.concepts-heading {
  font-size: 14.5px;
  font-weight: 800;
  color: #ff7a00;
  margin: 0 0 16px 0;
}

.concept-block {
  margin-bottom: 22px;
}

.concept-title {
  font-size: 14.5px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
  display: inline-block;
}

.dashed-underline {
  border-bottom: 1.5px dashed #9ca3af;
  padding-bottom: 2px;
}

.concept-text {
  font-size: 13.5px;
  color: #374151;
  line-height: 1.55;
  margin: 0 0 8px 0;
}

.concept-example {
  font-size: 13.5px;
  color: #374151;
  line-height: 1.55;
  margin: 0 0 8px 0;
}

.concept-key-idea {
  font-size: 13.5px;
  color: #374151;
  line-height: 1.55;
  margin: 0 0 8px 0;
}

/* Right: Chatbot Container Card */
.chatbot-panel-card {
  background: #ffffff;
  border: 1px solid #edf0f4;
  border-radius: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px;
  height: 100%;
  min-width: 0;
  overflow: hidden;
  box-sizing: border-box;
  transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
}

.checkpoint-page-container.is-chat-maximized .chatbot-panel-card {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  border-color: #e2e8f0;
}

.chatbot-header-controls {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 8px;
  flex-shrink: 0;
}

.ai-model-tag {
  font-size: 10px;
  font-weight: 700;
  color: #ff7a00;
  background: #fff7ed;
  padding: 2px 8px;
  border-radius: 6px;
  letter-spacing: 0.5px;
}

.btn-expand-chat {
  background: transparent;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.btn-expand-chat:hover {
  color: #111827;
}

/* Chat Messages */
.chatbot-messages-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 6px;
  margin-bottom: 14px;
  scrollbar-width: thin;
  scrollbar-color: #e2e8f0 transparent;
}

.chatbot-messages-scroll::-webkit-scrollbar {
  width: 4px;
}

.chatbot-messages-scroll::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 9999px;
}

.message-bubble {
  font-size: 13px;
  line-height: 1.5;
  border-radius: 16px;
  color: #1f2937;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.ai-message {
  background: #FCFCFC;
  border: 1px solid #EDEDF2;
  border-radius: 14px;
  padding: 12px 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.ai-greeting {
  font-weight: 600;
  margin-bottom: 8px;
}

.ai-message p {
  margin: 0 0 10px 0;
}

.ai-message p:last-child {
  margin-bottom: 0;
}

.bubble-text :deep(strong) {
  font-weight: 700;
  color: #111827;
}

.bubble-text :deep(.chat-inline-code) {
  background: #f1f5f9;
  padding: 1px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.9em;
  color: #0f172a;
}

.user-message {
  align-self: flex-end;
  background: #ff7a00;
  color: #ffffff;
  padding: 10px 14px;
  border-radius: 16px 16px 2px 16px;
  max-width: 85%;
}

.message-actions-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}

.btn-msg-tool {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  padding: 2px;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}

.btn-msg-tool:hover {
  color: #ff7a00;
}

/* Chat Input Area */
.chatbot-input-box {
  background: linear-gradient(180deg, #ffffff 50%, #fef3c7 100%);
  border: 1.5px solid #e2e8f0;
  border-radius: 18px;
  padding: 10px 14px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  box-shadow: 0 4px 12px rgba(254, 240, 138, 0.2);
  flex-shrink: 0;
}

.chat-text-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 13.5px;
  font-family: inherit;
  color: #1f2937;
  outline: none;
}

.chat-text-textarea {
  resize: none;
  min-height: 24px;
  max-height: 92px; /* up to 4 lines of text on uncollapsed AI, then scroll */
  overflow-y: auto;
  line-height: 1.45;
  scrollbar-width: thin;
  padding: 4px 0;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.checkpoint-page-container.is-chat-maximized .chat-text-textarea {
  max-height: 160px;
}

.chat-text-input::placeholder {
  color: #9ca3af;
}

.chat-input-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-attach,
.btn-send {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #4b5563;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s, transform 0.2s;
}

.btn-attach:hover {
  color: #ff7a00;
}

.btn-send:hover {
  color: #ff7a00;
  transform: translateX(1px);
}

.btn-send.is-disabled {
  opacity: 0.45;
  cursor: not-allowed;
  pointer-events: none;
}

.bubble-text {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.typing-indicator {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  background: #f3f4f6;
  border-radius: 12px;
}

.typing-dot {
  width: 6px;
  height: 6px;
  background: #ff7a00;
  border-radius: 50%;
  animation: typingBounce 1.4s infinite ease-in-out both;
}

.typing-dot:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typingBounce {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.send-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #ff7a00;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1024px) {
  .checkpoint-content-grid {
    grid-template-columns: 1fr;
    overflow-y: auto;
  }
  .chatbot-panel-card {
    height: 400px;
  }
}
</style>
