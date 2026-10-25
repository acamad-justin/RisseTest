/**
 * constellationData.js — Recall-card mock data for each constellation concept.
 *
 * ⚠  DEMO DATA — placeholder questions and answers only.
 *     Do not present these as verified learner records.
 *
 * Each concept object has:
 *   id            — matches the concept id in homeData.js
 *   name          — display name
 *   recallCardsDue — number of cards currently due (mock)
 *   status        — 'due' | 'allCaughtUp' | 'noCards'
 *   recallCards   — array of { id, question, answer }
 */

export const constellationConcepts = [
  {
    id: 'outputs',
    name: 'Outputs',
    recallCardsDue: 3,
    status: 'due',
    recallCards: [
      {
        id: 'outputs-01',
        question: 'What is the purpose of an output in a robotic control system?',
        answer:
          'Outputs are the physical actions a robot takes in response to its control logic — for example, spinning a motor or activating an LED.',
      },
      {
        id: 'outputs-02',
        question: 'Name two common output devices used in robotics.',
        answer:
          'DC motors and servo motors are two of the most common output devices; pneumatic actuators and solenoids are also widely used.',
      },
      {
        id: 'outputs-03',
        question: 'How does a PWM signal control an output device?',
        answer:
          'Pulse-Width Modulation varies the duty cycle (on-time fraction) of a digital signal to approximate an analogue voltage level, controlling the power delivered to the output device.',
      },
    ],
  },
  {
    id: 'actuation',
    name: 'Actuation',
    recallCardsDue: 5,
    status: 'due',
    recallCards: [
      {
        id: 'actuation-01',
        question: 'What is actuation in the context of robotics?',
        answer:
          'Actuation is the process of converting an electrical or pneumatic signal into physical motion using motors, servos, or pneumatic cylinders.',
      },
      {
        id: 'actuation-02',
        question: 'What is the difference between a DC motor and a servo motor?',
        answer:
          'A DC motor provides continuous rotation with speed proportional to voltage; a servo motor includes a feedback mechanism that allows precise position control within a limited range.',
      },
      {
        id: 'actuation-03',
        question: 'Why is torque an important consideration when choosing an actuator?',
        answer:
          'Torque determines how much rotational force the actuator can exert. Choosing insufficient torque leads to stalling or slow movement under load.',
      },
      {
        id: 'actuation-04',
        question: 'What role does a motor driver (H-bridge) play in actuation?',
        answer:
          'A motor driver amplifies the low-power control signal from a microcontroller to the high-current levels required to drive the motor, and enables bidirectional rotation.',
      },
      {
        id: 'actuation-05',
        question: 'What is back-EMF and why does it matter?',
        answer:
          'Back-EMF is the voltage a motor generates while spinning; it can damage control electronics if not suppressed with flyback diodes.',
      },
    ],
  },
  {
    id: 'pid',
    name: 'PID',
    recallCardsDue: 4,
    status: 'due',
    recallCards: [
      {
        id: 'pid-01',
        question: 'What does the proportional term (P) respond to?',
        answer:
          'The proportional term responds to the current error — the difference between the desired setpoint and the measured value.',
      },
      {
        id: 'pid-02',
        question: 'What problem does the integral term (I) address?',
        answer:
          'The integral term eliminates steady-state error by accumulating the error over time and adding a correction proportional to that accumulated total.',
      },
      {
        id: 'pid-03',
        question: 'What does the derivative term (D) react to?',
        answer:
          'The derivative term reacts to the rate of change of the error, damping oscillations and improving system stability.',
      },
      {
        id: 'pid-04',
        question: 'What is integral windup and how can it be prevented?',
        answer:
          'Integral windup occurs when the integrator accumulates a large value while the actuator is saturated. It is prevented by clamping the integral term or using anti-windup techniques.',
      },
    ],
  },
  {
    id: 'control-loops',
    name: 'Control Loops',
    recallCardsDue: 0,
    status: 'allCaughtUp',
    recallCards: [
      {
        id: 'cl-01',
        question: 'What is the key difference between open-loop and closed-loop control?',
        answer:
          'An open-loop system sends commands without checking the outcome; a closed-loop system measures the actual output and uses feedback to adjust future commands.',
      },
      {
        id: 'cl-02',
        question: 'Name the four stages of a feedback control loop.',
        answer:
          'Sense (measure the output), Compare (calculate error vs setpoint), Decide (compute correction), Act (drive the actuator).',
      },
    ],
  },
  {
    id: 'tuning',
    name: 'Tuning',
    recallCardsDue: 2,
    status: 'due',
    recallCards: [
      {
        id: 'tuning-01',
        question: 'What is the Ziegler–Nichols method used for?',
        answer:
          'It is a heuristic method for setting PID gains: the system is driven to the edge of oscillation to find the ultimate gain and period, then recommended gains are derived from those values.',
      },
      {
        id: 'tuning-02',
        question: 'How does increasing the proportional gain affect system response?',
        answer:
          'Increasing P makes the response faster and more aggressive but can introduce overshoot and oscillation if set too high.',
      },
    ],
  },
  {
    id: 'microcontrollers',
    name: 'Microcontrollers',
    recallCardsDue: 10,
    status: 'due',
    recallCards: [
      {
        id: 'mc-01',
        question: 'What role does a microcontroller play in a robot?',
        answer:
          'A microcontroller is the "brain" — it reads sensor inputs, executes control logic, and drives output devices based on its programmed instructions.',
      },
      {
        id: 'mc-02',
        question: 'What is the difference between GPIO and ADC pins on a microcontroller?',
        answer:
          'GPIO pins are digital (HIGH or LOW); ADC pins convert an analogue voltage into a digital number so the microcontroller can process continuous sensor values.',
      },
      {
        id: 'mc-03',
        question: 'What is interrupt-driven programming and why is it useful in robotics?',
        answer:
          'Interrupts let the CPU pause its current task to handle urgent events (e.g., an encoder tick) immediately, reducing latency compared to polling.',
      },
      {
        id: 'mc-04',
        question: 'What is the purpose of a bootloader on a microcontroller?',
        answer:
          'A bootloader is a small program that runs on reset and allows new firmware to be uploaded over USB or UART without a dedicated programmer.',
      },
      {
        id: 'mc-05',
        question: 'How does I²C differ from SPI as a communication protocol?',
        answer:
          'I²C uses two wires (SDA, SCL) and supports multiple devices on one bus via addressing; SPI uses four wires and is faster but requires a separate chip-select line per device.',
      },
      {
        id: 'mc-06',
        question: 'What is the significance of the clock speed of a microcontroller?',
        answer:
          'Clock speed determines how many instructions the processor executes per second, affecting the responsiveness of time-critical control loops.',
      },
      {
        id: 'mc-07',
        question: 'What is PWM output and which component commonly receives it?',
        answer:
          'PWM (Pulse-Width Modulation) is a digital signal with a variable duty cycle used to control motors, servos, and LED brightness.',
      },
      {
        id: 'mc-08',
        question: 'What is the Arduino IDE and what language does it use?',
        answer:
          'The Arduino IDE is a simplified development environment for microcontroller programming; it uses a C/C++ dialect with setup() and loop() entry points.',
      },
      {
        id: 'mc-09',
        question: 'What is flash memory used for on a microcontroller?',
        answer:
          'Flash memory stores the program (firmware) and any constant data permanently, retaining content when power is removed.',
      },
      {
        id: 'mc-10',
        question: 'Why is SRAM limited on most small microcontrollers?',
        answer:
          'SRAM is expensive in silicon area; small MCUs typically have only a few kilobytes, requiring careful management of variables and stack depth.',
      },
    ],
  },
  {
    id: 'inputs',
    name: 'Inputs',
    recallCardsDue: 0,
    status: 'noCards',
    recallCards: [],
  },
  {
    id: 'sensing',
    name: 'Sensing',
    recallCardsDue: 6,
    status: 'due',
    recallCards: [
      {
        id: 'sensing-01',
        question: 'What is the difference between active and passive sensors?',
        answer:
          'Active sensors emit energy (e.g., ultrasonic pulses, IR light) and detect its return; passive sensors only detect energy from the environment without emitting anything.',
      },
      {
        id: 'sensing-02',
        question: 'How does an ultrasonic distance sensor measure range?',
        answer:
          'It emits a sound pulse and measures the time-of-flight for the echo to return; distance = (time × speed of sound) / 2.',
      },
      {
        id: 'sensing-03',
        question: 'What is sensor fusion and why is it valuable?',
        answer:
          'Sensor fusion combines data from multiple sensors (e.g., accelerometer + gyroscope) to produce a more accurate and reliable estimate than any single sensor alone.',
      },
      {
        id: 'sensing-04',
        question: 'What does an encoder measure and how does it work?',
        answer:
          'An encoder measures rotation; a quadrature encoder uses two offset sensors and a slotted disc to count pulses and determine both position and direction.',
      },
      {
        id: 'sensing-05',
        question: 'What is a common cause of noise in sensor readings?',
        answer:
          'Electrical interference, vibration, temperature variation, and quantisation error in the ADC are common sources of sensor noise.',
      },
      {
        id: 'sensing-06',
        question: 'How does a low-pass filter smooth sensor data?',
        answer:
          'A low-pass filter attenuates high-frequency fluctuations (noise) while allowing slow, meaningful changes to pass through, typically implemented as an exponential moving average in software.',
      },
    ],
  },
  {
    id: 'robot-components',
    name: 'Robot Components',
    recallCardsDue: 7,
    status: 'due',
    recallCards: [
      {
        id: 'rc-01',
        question: 'What is the chassis of a robot?',
        answer:
          'The chassis is the structural frame that supports and connects all other components, determining the robot\'s shape, weight distribution, and mechanical constraints.',
      },
      {
        id: 'rc-02',
        question: 'What are degrees of freedom (DoF) in a robotic arm?',
        answer:
          'Each DoF is an independent axis of movement; more DoF means greater range and flexibility of motion but also increased control complexity.',
      },
      {
        id: 'rc-03',
        question: 'What is the purpose of a power distribution board (PDB)?',
        answer:
          'A PDB routes power from the battery to all robot subsystems, often includes fuses or current sensors, and may provide regulated voltage rails.',
      },
      {
        id: 'rc-04',
        question: 'Why is weight distribution important in robot design?',
        answer:
          'An unbalanced robot can tip over, reduce traction on drive wheels, or cause inaccurate readings from orientation sensors; distributing weight evenly improves stability.',
      },
      {
        id: 'rc-05',
        question: 'What is the role of the drivetrain in a mobile robot?',
        answer:
          'The drivetrain converts motor output into controlled locomotion — translating, turning, and maintaining speed — and determines the robot\'s maneuverability.',
      },
      {
        id: 'rc-06',
        question: 'What is an end-effector?',
        answer:
          'An end-effector is the tool or gripper at the tip of a robotic arm that directly interacts with the environment, such as a claw, suction cup, or welding torch.',
      },
      {
        id: 'rc-07',
        question: 'Why are cables and connectors considered critical robot components?',
        answer:
          'Unreliable connections are a leading cause of robot failures; proper strain relief, secure connectors, and cable management prevent intermittent faults during operation.',
      },
    ],
  },
]

/** id → concept for O(1) lookups */
export const constellationConceptMap = Object.fromEntries(
  constellationConcepts.map(c => [c.id, c])
)
