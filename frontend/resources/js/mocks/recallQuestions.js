/**
 * recallQuestions.js
 *
 * ⚠  DEMO DATA — mock questions and options only.
 *    Not real learner records or AI-evaluated responses.
 *
 * Each question:
 *   id          — stable string ID
 *   conceptId   — matches concept id in homeData / constellationData
 *   category    — label shown above the question text
 *   type        — 'short-answer' | 'multiple-choice'
 *   text        — question text shown to the learner
 *   options     — array of { id, label, text } for multiple-choice only
 *   mockAnswer  — reference explanation (not shown during practice)
 */

export const MICROCONTROLLERS_SESSION = [
  // ── Question 1 ── Short Answer ──────────────────────────────────────────
  {
    id: 'mc-q01',
    conceptId: 'microcontrollers',
    category: 'Conceptual Understanding',
    type: 'short-answer',
    text: 'Why might a robot need both a microcontroller and a motor driver instead of connecting its motors directly to the microcontroller?',
    options: [],
    mockAnswer:
      'The microcontroller executes logic and sends low-power control signals; the motor driver provides the high-current electrical interface needed to actually drive the motors safely.',
  },

  // ── Question 2 ── Multiple Choice ───────────────────────────────────────
  {
    id: 'mc-q02',
    conceptId: 'microcontrollers',
    category: 'Conceptual Understanding',
    type: 'multiple-choice',
    text: 'A distance sensor detects an obstacle in front of a robot. Which option best describes the microcontroller\'s role?',
    options: [
      { id: 'a', label: 'A', text: 'It physically pushes the obstacle away.' },
      { id: 'b', label: 'B', text: 'It processes the sensor information and executes the programmed response.' },
      { id: 'c', label: 'C', text: 'It generates the sensor reading without needing a sensor.' },
      { id: 'd', label: 'D', text: 'It automatically knows which action is best without instructions.' },
    ],
    mockAnswer: 'b',
  },

  // ── Question 3 ── Short Answer ──────────────────────────────────────────
  {
    id: 'mc-q03',
    conceptId: 'microcontrollers',
    category: 'Component Knowledge',
    type: 'short-answer',
    text: 'What is the difference between GPIO pins and ADC pins on a microcontroller, and when would you use each?',
    options: [],
    mockAnswer:
      'GPIO pins handle digital HIGH/LOW signals for buttons, LEDs, and digital sensors. ADC pins convert an analogue voltage into a numeric value, needed for sensors like potentiometers or light-dependent resistors.',
  },

  // ── Question 4 ── Multiple Choice ───────────────────────────────────────
  {
    id: 'mc-q04',
    conceptId: 'microcontrollers',
    category: 'Component Knowledge',
    type: 'multiple-choice',
    text: 'What is the purpose of a bootloader on a microcontroller?',
    options: [
      { id: 'a', label: 'A', text: 'It stores sensor calibration data permanently.' },
      { id: 'b', label: 'B', text: 'It controls the speed of the main program loop.' },
      { id: 'c', label: 'C', text: 'It allows new firmware to be uploaded over USB or UART without a dedicated programmer.' },
      { id: 'd', label: 'D', text: 'It automatically optimises the program code at runtime.' },
    ],
    mockAnswer: 'c',
  },

  // ── Question 5 ── Short Answer ──────────────────────────────────────────
  {
    id: 'mc-q05',
    conceptId: 'microcontrollers',
    category: 'Communication Protocols',
    type: 'short-answer',
    text: 'Describe how I²C and SPI differ as communication protocols. Give one scenario where each would be preferred.',
    options: [],
    mockAnswer:
      'I²C uses two wires (SDA, SCL) with addressable devices — good for connecting multiple low-speed sensors. SPI uses four wires with higher throughput but needs a chip-select line per device — better for displays or fast DACs.',
  },

  // ── Question 6 ── Multiple Choice ───────────────────────────────────────
  {
    id: 'mc-q06',
    conceptId: 'microcontrollers',
    category: 'Control Systems',
    type: 'multiple-choice',
    text: 'Why is interrupt-driven programming preferable to polling in a real-time robotics application?',
    options: [
      { id: 'a', label: 'A', text: 'It uses less flash memory than polling loops.' },
      { id: 'b', label: 'B', text: 'It allows the CPU to respond to events immediately, reducing latency compared to repeatedly checking a condition.' },
      { id: 'c', label: 'C', text: 'It eliminates the need for analogue-to-digital conversion.' },
      { id: 'd', label: 'D', text: 'It automatically handles motor driver fault conditions.' },
    ],
    mockAnswer: 'b',
  },

  // ── Question 7 ── Short Answer ──────────────────────────────────────────
  {
    id: 'mc-q07',
    conceptId: 'microcontrollers',
    category: 'Signal Processing',
    type: 'short-answer',
    text: 'Explain what PWM output is and describe how a servo motor uses it to achieve a specific angular position.',
    options: [],
    mockAnswer:
      'PWM (Pulse-Width Modulation) varies the duty cycle of a digital signal to represent an analogue level. A servo motor reads the pulse width — typically 1–2 ms within a 20 ms period — and moves to the corresponding angle.',
  },

  // ── Question 8 ── Multiple Choice ───────────────────────────────────────
  {
    id: 'mc-q08',
    conceptId: 'microcontrollers',
    category: 'Component Knowledge',
    type: 'multiple-choice',
    text: 'What does SRAM store on a microcontroller, and why is it limited in small devices?',
    options: [
      { id: 'a', label: 'A', text: 'It stores the compiled firmware and is limited by manufacturing cost of flash cells.' },
      { id: 'b', label: 'B', text: 'It stores runtime variables, the stack, and heap, and is limited because SRAM cells consume more silicon area than flash.' },
      { id: 'c', label: 'C', text: 'It stores the clock configuration and is limited to prevent accidental writes.' },
      { id: 'd', label: 'D', text: 'It stores wireless communication buffers and is limited by antenna design.' },
    ],
    mockAnswer: 'b',
  },

  // ── Question 9 ── Short Answer ──────────────────────────────────────────
  {
    id: 'mc-q09',
    conceptId: 'microcontrollers',
    category: 'Control Systems',
    type: 'short-answer',
    text: 'A robot\'s wheel encoder produces 500 pulses per revolution. The robot is moving but the encoder count stops updating. List two possible causes and one way to diagnose each.',
    options: [],
    mockAnswer:
      'Possible causes: (1) The encoder wiring has come loose — check continuity with a multimeter. (2) The interrupt handler is blocked by a long main-loop task — use an oscilloscope or logic analyser to verify pulses arrive at the pin.',
  },

  // ── Question 10 ── Multiple Choice ─────────────────────────────────────
  {
    id: 'mc-q10',
    conceptId: 'microcontrollers',
    category: 'Conceptual Understanding',
    type: 'multiple-choice',
    text: 'Which statement best describes the relationship between a microcontroller\'s clock speed and a PID control loop?',
    options: [
      { id: 'a', label: 'A', text: 'Higher clock speed makes the PID gains automatically larger.' },
      { id: 'b', label: 'B', text: 'Clock speed has no effect on control loop performance.' },
      { id: 'c', label: 'C', text: 'A faster clock allows the control loop to execute at a higher frequency, enabling faster correction of errors.' },
      { id: 'd', label: 'D', text: 'The clock speed determines the voltage supplied to the motors.' },
    ],
    mockAnswer: 'c',
  },
]
