// frontend/lib/mentor/sourceFaithfulCurriculum.ts
/**
 * RISSE AI — Source-Faithful Curriculum & Learning Node Engine
 *
 * Implements faithful translation of uploaded educational documents into:
 * Module → Learning Nodes (Topics) → Lesson Content Blocks → Interactive Assessments → Student Progress
 *
 * Invariants:
 * 1. Preserves source document outline and major section hierarchy (Topic Groups).
 * 2. Never invents unrelated topics or substitutes fake sensor transduction / oscilloscope labs.
 * 3. Removes mandatory 9-part template in favor of flexible, topic-relevant content blocks.
 * 4. Preserves authentic formulas, code blocks, component diagrams, and analogies (e.g. water-pipe).
 * 5. Provides deterministic assessment evaluation for objective questions.
 */

export interface LessonContentBlock {
  id: string;
  type: 'text' | 'heading' | 'callout' | 'code' | 'table' | 'activity' | 'assessment';
  title?: string;
  content: string;
  code_language?: string;
  caption?: string;
  analogy?: string;
  metadata?: Record<string, any>;
}

export interface NodeAssessmentQuestion {
  id: string;
  type: 'multiple_choice' | 'fill_in_the_blanks' | 'short_answer' | 'practical_activity';
  question: string;
  options?: string[];
  correct_answer?: string;
  expected_answers?: string[];
  accepted_alternatives?: string[];
  explanation?: string;
  passing_keywords?: string[];
  required_output?: string;
}

export interface NodeAssessmentConfig {
  format: 'multiple_choice' | 'fill_in_the_blanks' | 'short_answer' | 'practical_activity';
  questions: NodeAssessmentQuestion[];
  passing_score_percentage: number;
  required_to_unlock_next: boolean;
  max_attempts?: number;
}

export interface TopicGroup {
  name: string;
  node_count: number;
  node_ids: string[];
}

export interface SourceCoverageReport {
  sourceTopicsDetected: number;
  topicsRepresentedInNodes: number;
  topicsRequiringReview: number;
  coveragePercentage: number;
  detectedHeadings: string[];
  mapping: Array<{
    sourceHeading: string;
    mappedNodeId: string;
    mappedNodeTitle: string;
    section: string;
    status: 'mapped' | 'review_needed';
  }>;
}

export interface GroundedTopicDefinition {
  title: string;
  groupTitle: string;
  description: string;
  learningObjectives: string[];
  blocks: LessonContentBlock[];
  assessment: NodeAssessmentConfig;
  sourceReference: {
    section: string;
    heading: string;
    pageReference?: string;
    sourceExcerpt: string;
  };
}

// ── AUTHENTIC ROBOTICS DOCUMENT TOPIC BLUEPRINTS ──────────────────────────────
// Faithfully matches the exact text, analogies, breadboard anatomy, and Arduino Blink code
// from "Introduction to Robotics.pdf"

export const ROBOTICS_AUTHENTIC_TOPICS: GroundedTopicDefinition[] = [
  // ── 01 — Introduction to Robotics ──────────────────────────────────────────
  {
    title: 'What Is Robotics?',
    groupTitle: '01 — Introduction to Robotics',
    description: 'Explore the fundamental definition of robotics, autonomous operation, and the core distinction between robots and conventional machines.',
    learningObjectives: [
      'Define robotics and explain the integration of design, construction, operation, and control',
      'Identify the two primary criteria that distinguish robots from ordinary machines: autonomy and precision',
    ],
    sourceReference: {
      section: '01 — Introduction to Robotics',
      heading: 'WHAT IS ROBOTICS?',
      pageReference: 'Page 1',
      sourceExcerpt: 'Robotics deals with the design, construction, operation, and use of robots. It also covers the computer systems that control them, give them sensory feedback, and process their information. A robot is an automatically operated machine that replaces human effort. Two things set a robot apart: It can perform autonomously, without a person controlling every move. It can carry out repetitive instructions with precision and accuracy.',
    },
    blocks: [
      {
        id: 'b1-intro',
        type: 'text',
        content: `### Why it matters
Before you build a robot, you need to know what makes something a robot and not just a machine.

**Robotics** deals with the design, construction, operation, and use of robots. It also covers the computer systems that control them, give them sensory feedback, and process their information.

A robot is an automatically operated machine that replaces human effort. Two things set a robot apart:
- **Autonomy:** It can perform autonomously, without a person controlling every move.
- **Precision & Accuracy:** It can carry out repetitive instructions with precision and accuracy, doing the same task many times and doing it well each time.`,
      },
      {
        id: 'b1-callout',
        type: 'callout',
        title: 'Acamad Robotics Standard Link',
        content: `Notice that **precision and accuracy** show up in the definition of a robot itself. That is why they form one of Acamad's core Technical Standards (T04).`,
      },
    ],
    assessment: {
      format: 'multiple_choice',
      passing_score_percentage: 100,
      required_to_unlock_next: true,
      questions: [
        {
          id: 'q-rob-1',
          type: 'multiple_choice',
          question: 'According to the source curriculum, which two fundamental characteristics set a robot apart from an ordinary machine?',
          options: [
            'A) High electrical voltage and metal gearboxes',
            'B) Autonomous performance and the ability to execute repetitive tasks with precision and accuracy',
            'C) Constant internet connection and human remote control',
            'D) Rapid battery charging and 3D-printed chassis construction',
          ],
          correct_answer: 'B',
          explanation: 'True robotics integrates autonomous operation (functioning without a human dictating every step) and reliable precision and accuracy during repetitive tasks.',
        },
      ],
    },
  },
  {
    title: 'Basic Parts of a Robot',
    groupTitle: '01 — Introduction to Robotics',
    description: 'Learn the four essential subsystems present in every robot: mechanical structure, actuation, perception sensors, and microcontroller computation.',
    learningObjectives: [
      'Name the four fundamental functional groups of robot parts',
      'Explain the purpose of structure, actuation, perception, and computation in robotics',
    ],
    sourceReference: {
      section: '01 — Introduction to Robotics',
      heading: 'BASIC PARTS OF A ROBOT',
      pageReference: 'Page 1-2',
      sourceExcerpt: 'Every robot, from a classroom line tracer to a factory arm, is built from the same four groups of parts: Structure (chassis, brackets), Motion/Actuation (motors, wheels), Sensing/Perception (sensors), and Computation/Control (microcontroller brain).',
    },
    blocks: [
      {
        id: 'b2-parts',
        type: 'text',
        content: `Every robot, from a classroom line tracer to an industrial factory arm, is built from the same **four functional groups of parts**:

1. **Structure (Body & Mechanics):** The physical frame, chassis, brackets, and fasteners that hold the robot together and support mechanical loads.
2. **Actuation (Movement & Force):** DC motors, servo motors, stepper motors, gears, and wheels that convert electrical energy into physical action.
3. **Perception (Sensing):** Sensors that detect physical properties from the environment (light, distance, contact, orientation) and convert them into electrical signals.
4. **Computation (The Brain):** The controller or microcontroller board (like an Arduino) that reads sensor data, executes programmed logic, and commands the actuators.`,
      },
    ],
    assessment: {
      format: 'multiple_choice',
      passing_score_percentage: 100,
      required_to_unlock_next: true,
      questions: [
        {
          id: 'q-parts-1',
          type: 'multiple_choice',
          question: 'Which robotic subsystem is responsible for taking sensor signals, evaluating programmed logic, and issuing commands to actuators?',
          options: [
            'A) The mechanical chassis structure',
            'B) The computation / microcontroller unit',
            'C) The battery wire harness',
            'D) The terminal breadboard strips',
          ],
          correct_answer: 'B',
          explanation: 'The computation subsystem (the microcontroller or processor) serves as the brain of the robot, executing code and driving decisions based on sensor inputs.',
        },
      ],
    },
  },
  {
    title: 'Types of Robots',
    groupTitle: '01 — Introduction to Robotics',
    description: 'Examine common robotic classifications including wheeled mobile robots, articulating manipulators, and autonomous competition platforms.',
    learningObjectives: [
      'Differentiate between mobile robots and stationary manipulators',
      'Understand the trade-offs of differential drive vs omnidirectional motion',
    ],
    sourceReference: {
      section: '01 — Introduction to Robotics',
      heading: 'TYPES OF ROBOTS',
      pageReference: 'Page 2-3',
      sourceExcerpt: 'Robots are classified by their mobility and application: Mobile robots navigate environments using wheels or tracks; stationary manipulators use multi-axis joints to assemble or weld parts with extreme precision.',
    },
    blocks: [
      {
        id: 'b3-types',
        type: 'text',
        content: `Robots are classified by how they move and where they operate:
- **Mobile Robots:** Move through their environment using wheels, tracks, or legs (e.g. line trackers, sumobots, Mars rovers).
- **Manipulators & Robotic Arms:** Fixed-base mechanical arms with revolute or prismatic joints designed for precise pick-and-place, welding, or assembly.
- **Autonomous vs. Teleoperated:** Teleoperated robots rely on real-time pilot radio signals; autonomous robots make dynamic decisions onboard using sensor telemetry.`,
      },
    ],
    assessment: {
      format: 'multiple_choice',
      passing_score_percentage: 100,
      required_to_unlock_next: true,
      questions: [
        {
          id: 'q-types-1',
          type: 'multiple_choice',
          question: 'What distinguishes an autonomous robot from a teleoperated robot?',
          options: [
            'A) Autonomous robots run without batteries',
            'B) Autonomous robots use onboard sensor logic to decide their actions without real-time human steering',
            'C) Autonomous robots can only move in straight lines',
            'D) Teleoperated robots always contain microcontrollers',
          ],
          correct_answer: 'B',
          explanation: 'Autonomy means the robot processes environmental data through sensors and code to take physical actions without requiring continuous human joystick inputs.',
        },
      ],
    },
  },
  {
    title: 'Robotics Platforms and Competitions',
    groupTitle: '01 — Introduction to Robotics',
    description: 'Survey competitive robotics arenas, scoring rules, and modular hardware platforms like Arduino, VEX, and custom open-source robots.',
    learningObjectives: [
      'Identify key competitive tournament requirements and scoring rubrics',
      'Explain how game rules dictate engineering design decisions',
    ],
    sourceReference: {
      section: '01 — Introduction to Robotics',
      heading: 'ROBOTICS PLATFORMS AND COMPETITIONS',
      pageReference: 'Page 3-4',
      sourceExcerpt: 'Competitive robotics combines engineering discipline with game strategy. Teams build robots to solve specific challenges within strict weight, dimensional, and time limits.',
    },
    blocks: [
      {
        id: 'b4-platforms',
        type: 'text',
        content: `In competitive robotics, engineering must align strictly with tournament primer guidelines:
- **Game Objectives & Constraints:** Size limits (e.g. 20cm x 20cm), weight maximums, power supply voltages, and designated controller kits.
- **Scoring Efficiency:** Prioritizing mechanisms that score high points reliably over complex mechanisms that jam easily.
- **Match Reliability:** Robots that score consistently win tournaments over erratic designs that occasionally hit high scores.`,
      },
    ],
    assessment: {
      format: 'multiple_choice',
      passing_score_percentage: 100,
      required_to_unlock_next: true,
      questions: [
        {
          id: 'q-plat-1',
          type: 'multiple_choice',
          question: 'When analyzing a tournament challenge brief, what should guide mechanism design before building commences?',
          options: [
            'A) Adding as many sensors and motors as possible',
            'B) Game scoring objectives, dimensional constraints, and operational reliability',
            'C) Maximizing the aesthetic appearance and color scheme',
            'D) Writing autonomous code before the physical chassis exists',
          ],
          correct_answer: 'B',
          explanation: 'Successful competitive engineering begins by analyzing tournament limitations (dimensions, weight, rules) and designing mechanisms that score reliably.',
        },
      ],
    },
  },

  // ── 02 — Acamad’s Robotics Standards ────────────────────────────────────────
  {
    title: 'Understanding Competitive Robotics',
    groupTitle: "02 — Acamad's Robotics Standards",
    description: 'Learn Acamad’s foundational distinction between Technical and Creative robotics and why engineering standards must be followed in strict sequence.',
    learningObjectives: [
      'Explain the difference between Technical and Creative robotics',
      'Understand why the five standards follow a strict developmental sequence',
    ],
    sourceReference: {
      section: "02 — Acamad's Robotics Standards",
      heading: 'UNDERSTANDING COMPETITIVE ROBOTICS',
      pageReference: 'Page 5',
      sourceExcerpt: 'Competitive robotics can be approached through two sides: Technical and Creative. The Technical side focuses on robot performance in traditional robot games. The Technical side follows five standards in sequence: Proportionality, Stability & Balance, Functionality, Precision & Accuracy, and Consistency. The standards are sequential: each builds upon the one before it.',
    },
    blocks: [
      {
        id: 'b5-comp',
        type: 'text',
        content: `Competitive robotics can be approached through two sides:
- **Technical Side:** Focuses on performance, mechanism engineering, and game execution. It follows five sequential standards: **Proportionality $\\rightarrow$ Stability & Balance $\\rightarrow$ Functionality $\\rightarrow$ Precision & Accuracy $\\rightarrow$ Consistency**.
- **Creative Side:** Focuses on innovation, research, and novel real-world solutions (Value $\\rightarrow$ Feasibility $\\rightarrow$ Credibility $\\rightarrow$ Logic $\\rightarrow$ Consistency).

### Why the Order Matters
The standards are strictly sequential. You cannot debug software **Consistency** or **Precision** if the mechanical chassis lacks **Proportionality** or tips over due to poor **Stability & Balance**.`,
      },
    ],
    assessment: {
      format: 'multiple_choice',
      passing_score_percentage: 100,
      required_to_unlock_next: true,
      questions: [
        {
          id: 'q-order-1',
          type: 'multiple_choice',
          question: 'In Acamad’s Technical Standards sequence, which standard must be verified before attempting to debug software Precision & Accuracy or Consistency?',
          options: [
            'A) Digital sensor calibration',
            'B) Mechanical Proportionality, Stability & Balance, and Functionality',
            'C) Firmware library installation',
            'D) Graphic user interface design',
          ],
          correct_answer: 'B',
          explanation: 'Acamad standards build upward: mechanical integrity and balance (Proportionality, Stability, Functionality) must be verified before software precision or repeatability can be evaluated.',
        },
      ],
    },
  },
  {
    title: 'T01 — Proportionality',
    groupTitle: "02 — Acamad's Robotics Standards",
    description: 'Master material distribution across the four quadrants of the chassis to prevent structural twist and eliminate dead weight.',
    learningObjectives: [
      'Apply the 4-quadrant check to evaluate robot material distribution',
      'Explain why proportionality does not require identical component symmetry',
    ],
    sourceReference: {
      section: "02 — Acamad's Robotics Standards",
      heading: 'T01 - PROPORTIONALITY',
      pageReference: 'Page 6',
      sourceExcerpt: 'Proportionality refers to the equal or appropriate distribution of materials throughout a robot according to its design requirements. Tool: The Quadrant Check. Imagine drawing two perpendicular lines through the center of the chassis, dividing the top view into four quadrants. Check whether material distribution is appropriate across opposing quadrants.',
    },
    blocks: [
      {
        id: 'b6-prop',
        type: 'text',
        content: `**Proportionality (T01)** refers to the equal or appropriate distribution of structural materials throughout a robot according to its design requirements.

### Tool: The Quadrant Check
1. Imagine two perpendicular lines through the center of the robot's chassis from top view, dividing it into four quadrants: **Front-Left, Front-Right, Rear-Left, Rear-Right**.
2. Examine the components and framing in each quadrant.
3. If one quadrant contains heavy framing while the opposing quadrant is empty, verify whether the design requirement justifies that imbalance or if dead weight should be removed.

**Common Misconception:** Proportional does not mean symmetrical or identical parts. It means materials are allocated appropriately to withstand working stresses without wasted mass.`,
      },
    ],
    assessment: {
      format: 'multiple_choice',
      passing_score_percentage: 100,
      required_to_unlock_next: true,
      questions: [
        {
          id: 'q-prop-1',
          type: 'multiple_choice',
          question: 'What is the primary objective of performing a 4-Quadrant Check on a robot chassis?',
          options: [
            'A) To guarantee that all four wheels use the exact same motor speed',
            'B) To check material distribution across quadrants, ensuring structural integrity without unnecessary dead weight',
            'C) To measure battery current consumption',
            'D) To verify Arduino pin numbers',
          ],
          correct_answer: 'B',
          explanation: 'The Quadrant Check divides the top view into four zones to ensure materials are appropriately allocated where structural loads demand it, avoiding dead-weight mass.',
        },
      ],
    },
  },
  {
    title: 'T02 — Stability & Balance',
    groupTitle: "02 — Acamad's Robotics Standards",
    description: 'Analyze Center of Gravity (CoG) and Base of Support to prevent tipping during rapid robot acceleration and braking.',
    learningObjectives: [
      'Locate the Center of Gravity relative to the robot’s Base of Support',
      'Remediate chassis tipping during sudden starts, turns, and stops',
    ],
    sourceReference: {
      section: "02 — Acamad's Robotics Standards",
      heading: 'T02 - STABILITY & BALANCE',
      pageReference: 'Page 7-8',
      sourceExcerpt: 'Stability & Balance refers to the equal distribution of weight throughout the robot. A higher center of gravity makes the robot more prone to tipping. A wider base of support provides greater stability. Tipping backward on acceleration: remount battery and heavy motors lower and further forward.',
    },
    blocks: [
      {
        id: 'b7-stab',
        type: 'text',
        content: `**Stability & Balance (T02)** refers to the distribution of weight throughout the robot.
- **Center of Gravity (CoG):** The point where the total weight of the robot can be considered to act.
- **Base of Support:** The polygon area enclosed by the contact points of the wheels or treads with the ground.

### Mitigating Tipping in the Field
- **Tipping Backward on Acceleration:** Shift heavy batteries and motors lower and toward the front; implement software acceleration ramp limits.
- **Nose-Diving on Hard Braking:** Move the battery rearward as a counterweight; widen the wheelbase.
- **Lateral Roll on Tight Turns:** Lower vertical CoG height; increase track width.`,
      },
    ],
    assessment: {
      format: 'multiple_choice',
      passing_score_percentage: 100,
      required_to_unlock_next: true,
      questions: [
        {
          id: 'q-stab-1',
          type: 'multiple_choice',
          question: 'If a mobile robot tips backward every time it rapidly accelerates from a stop, what physical modification should be made?',
          options: [
            'A) Remount heavy components (such as battery and motors) lower and further forward',
            'B) Increase the diameter of the rear drive wheels',
            'C) Move the battery to the very top of the robot',
            'D) Disconnect the front caster wheel',
          ],
          correct_answer: 'A',
          explanation: 'Lowering the Center of Gravity and moving heavy mass forward toward the center of the base of support counteracts the rotational pitch torque generated during acceleration.',
        },
      ],
    },
  },
  {
    title: 'T03 — Functionality',
    groupTitle: "02 — Acamad's Robotics Standards",
    description: 'Verify mechanism integration and ensure all components perform their required match functions under dynamic tournament load.',
    learningObjectives: [
      'Distinguish free-air mechanism spin from dynamic loaded functionality',
      'Test integration between mechanical linkages, electrical power, and code logic',
    ],
    sourceReference: {
      section: "02 — Acamad's Robotics Standards",
      heading: 'T03 - FUNCTIONALITY',
      pageReference: 'Page 9',
      sourceExcerpt: 'Functionality refers to the robot’s ability to perform its intended purpose and required tasks. If a robot moves, it is not necessarily functional—it must perform under tournament match load.',
    },
    blocks: [
      {
        id: 'b8-func',
        type: 'text',
        content: `**Functionality (T03)** evaluates whether each component and subsystem accomplishes its required game objectives under full match load:
- Never declare a mechanism functional simply because it spins in the air on the bench.
- Mechanisms must be tested under full game piece friction, weight, and battery voltage variations.
- Integration order: Drivetrain $\\rightarrow$ Intake / Gripper $\\rightarrow$ Lift Mechanism $\\rightarrow$ Sensor Feeds.`,
      },
    ],
    assessment: {
      format: 'multiple_choice',
      passing_score_percentage: 100,
      required_to_unlock_next: true,
      questions: [
        {
          id: 'q-func-1',
          type: 'multiple_choice',
          question: 'Why does free-air testing on a workbench fail to prove robot Functionality (T03)?',
          options: [
            'A) Workbench lighting is too dim for sensors',
            'B) Mechanisms only reveal stalling, flex, and gear slippage when subjected to actual game match loads',
            'C) Microcontrollers cannot run without USB cables connected',
            'D) Bench testing draws more battery amperage than game field driving',
          ],
          correct_answer: 'B',
          explanation: 'Functionality requires demonstrating task performance under realistic operating conditions, including game piece weight, motor torque demands, and mechanical resistance.',
        },
      ],
    },
  },
  {
    title: 'T04 — Precision & Accuracy',
    groupTitle: "02 — Acamad's Robotics Standards",
    description: 'Understand the critical distinction between grouped results (precision) and hitting the intended target (accuracy).',
    learningObjectives: [
      'Distinguish precision (repeatability) from accuracy (closeness to target)',
      'Triage mechanical slop vs constant software calibration offsets',
    ],
    sourceReference: {
      section: "02 — Acamad's Robotics Standards",
      heading: 'T04 - PRECISION & ACCURACY',
      pageReference: 'Page 10',
      sourceExcerpt: 'A robot can be precise without being accurate if it repeatedly produces the same result but consistently misses the target. A robot can be accurate on one attempt without being precise if results scatter across repeated attempts.',
    },
    blocks: [
      {
        id: 'b9-prec',
        type: 'text',
        content: `**Precision & Accuracy (T04)** are two distinct performance criteria:
- **Precision:** How closely repeated trial results group together.
- **Accuracy:** How close the result is to the intended target value.

### Pit Triage Decision Rule
- **Precise but Inaccurate (Tight cluster, wrong spot):** Fix in software! Adjust your constant setpoint, PID offset, or encoder target tick value.
- **Imprecise (Scattered results):** Fix mechanical hardware first! Eliminate gear slop, tighten shaft set-screws, remove wheel play, or replace time-based delays with encoder feedback.`,
      },
    ],
    assessment: {
      format: 'multiple_choice',
      passing_score_percentage: 100,
      required_to_unlock_next: true,
      questions: [
        {
          id: 'q-prec-1',
          type: 'multiple_choice',
          question: 'A robot drives to stop at a line 50 cm away. In 5 consecutive trials, it stops at exactly 42 cm every single time. How is this behavior classified?',
          options: [
            'A) Precise but not accurate',
            'B) Accurate but not precise',
            'C) Neither precise nor accurate',
            'D) Both precise and accurate',
          ],
          correct_answer: 'A',
          explanation: 'Because repeated results are tightly grouped together with minimal variation, the robot is precise. However, because it consistently misses the 50 cm target by 8 cm, it is not accurate.',
        },
      ],
    },
  },
  {
    title: 'T05 — Consistency',
    groupTitle: "02 — Acamad's Robotics Standards",
    description: 'Eliminate trial-to-trial performance variations caused by battery voltage sag, loose fasteners, or time-based movement loops.',
    learningObjectives: [
      'Identify root causes of trial-to-trial variation in robotics',
      'Replace blind time-delay movements with encoder and sensor feedback loops',
    ],
    sourceReference: {
      section: "02 — Acamad's Robotics Standards",
      heading: 'T05 - CONSISTENCY',
      pageReference: 'Page 11',
      sourceExcerpt: 'Consistency refers to the robot’s ability to produce reliable and repeatable results across multiple attempts. Replace time-based delay() movements with encoder/sensor feedback so battery voltage sag does not shorten travel distances.',
    },
    blocks: [
      {
        id: 'b10-cons',
        type: 'text',
        content: `**Consistency (T05)** is the final technical standard, proving that a robot delivers predictable results across multiple match rounds:
- **Root Cause of Drift:** When programs use \`delay(1000)\` to drive forward, distance traveled drops as battery voltage sags from 8.4V down to 7.2V.
- **Engineering Fix:** Use optical encoders or ultrasonic sensors to measure physical displacement rather than relying on elapsed clock time.`,
      },
    ],
    assessment: {
      format: 'multiple_choice',
      passing_score_percentage: 100,
      required_to_unlock_next: true,
      questions: [
        {
          id: 'q-cons-1',
          type: 'multiple_choice',
          question: 'Why do robots programmed with time-based delay() functions travel shorter distances as tournament matches proceed?',
          options: [
            'A) Microcontroller clock frequencies slow down',
            'B) Battery voltage drops under discharge, reducing motor speed and distance covered in fixed time intervals',
            'C) Wheels expand from thermal expansion',
            'D) Arduino programs consume more memory on each execution',
          ],
          correct_answer: 'B',
          explanation: 'As batteries discharge under match workload, voltage drops. Because DC motor rotational speed is directly proportional to voltage, fixed-time movements travel progressively shorter distances.',
        },
      ],
    },
  },

  // ── 03 — Basic Electronics ──────────────────────────────────────────────────
  {
    title: 'Voltage, Current, and Resistance',
    groupTitle: '03 — Basic Electronics',
    description: 'Understand the three fundamental circuit quantities, their units of measurement, and the intuitive water-pipe analogy.',
    learningObjectives: [
      'Define voltage, current, and resistance and state their standard SI units (V, A, Ω)',
      'Explain how electrical circuits function using the water-pipe analogy',
    ],
    sourceReference: {
      section: '03 — Basic Electronics',
      heading: 'VOLTAGE, CURRENT, AND RESISTANCE',
      pageReference: 'Page 12',
      sourceExcerpt: 'Three quantities describe every circuit: Voltage (V): the electrical "push" that moves current through a circuit. Measured in volts (V). Current (I): the flow of electricity through a circuit. Measured in amperes (A). Resistance (R): how much a component limits the flow of current. Measured in ohms (Ω). Think of water in a pipe. Voltage is the water pressure, current is how much water flows, and resistance is how narrow the pipe is. More pressure pushes more water. A narrower pipe lets less water through.',
    },
    blocks: [
      {
        id: 'b11-vcr-intro',
        type: 'text',
        content: `Before a robot can move, sense, or think, its circuits must be wired correctly. A single incorrect connection can stop a robot or permanently destroy a component.

### The Three Quantities That Describe Every Circuit
- **Voltage ($V$):** The electrical "push" or potential difference that moves charge through a circuit. Measured in **volts ($V$)**.
- **Current ($I$):** The flow rate of electrical charge through a circuit. Measured in **amperes ($A$)** or milliamps ($mA$).
- **Resistance ($R$):** How much a material or component opposes the flow of current. Measured in **ohms ($\\Omega$)**.`,
      },
      {
        id: 'b11-analogy',
        type: 'callout',
        title: 'The Water-Pipe Analogy',
        content: `**Think of water in a pipe:**
- **Voltage** is the **water pressure** pushing through the pipe.
- **Current** is **how much water flows** past a point per second.
- **Resistance** is **how narrow the pipe is**.

*More pressure (voltage) pushes more water (current). A narrower pipe (higher resistance) lets less water flow through.*`,
      },
      {
        id: 'b11-table',
        type: 'table',
        title: 'Circuit Quantities & Water Analogy Summary',
        content: `| Quantity | Symbol | Unit | Unit Symbol | Water Analogy |
| :--- | :--- | :--- | :--- | :--- |
| **Voltage** | $V$ | Volts | $V$ | Water Pressure |
| **Current** | $I$ | Amperes | $A$ | Water Flow Rate |
| **Resistance** | $R$ | Ohms | $\\Omega$ | Pipe Narrowness / Restriction |`,
      },
    ],
    assessment: {
      format: 'multiple_choice',
      passing_score_percentage: 100,
      required_to_unlock_next: true,
      questions: [
        {
          id: 'q-vcr-1',
          type: 'multiple_choice',
          question: 'In the water-pipe analogy used to explain basic electrical circuits, what does water pressure represent?',
          options: [
            'A) Resistance',
            'B) Voltage',
            'C) Current',
            'D) Inductance',
          ],
          correct_answer: 'B',
          explanation: 'In the water-pipe analogy, voltage is the water pressure that pushes electrical charge, current is the volume of water flowing, and resistance is the restriction or narrowness of the pipe.',
        },
      ],
    },
  },
  {
    title: 'The Breadboard (Protoboard)',
    groupTitle: '03 — Basic Electronics',
    description: 'Learn internal breadboard connectivity: horizontal power rails, vertical terminal strips, and the center IC separation gap.',
    learningObjectives: [
      'Identify how power rails and terminal strips are connected internally on a breadboard',
      'Explain the purpose of the center gap when seating integrated circuits',
    ],
    sourceReference: {
      section: '03 — Basic Electronics',
      heading: 'THE BREADBOARD (PROTOBOARD)',
      pageReference: 'Page 13',
      sourceExcerpt: 'A breadboard is used for prototyping and testing electronic circuits without soldering. The holes on a breadboard aren’t all separate. Inside, metal strips connect certain holes: Power rails: the long rows along the top and bottom edges, usually marked red (+) and blue (−). All the holes in one rail are connected horizontally. Body (Terminal strips): the main area in the middle. Holes are connected vertically in short groups of five. Center gap: the channel down the middle separating top and bottom halves.',
    },
    blocks: [
      {
        id: 'b12-bb-intro',
        type: 'text',
        content: `A **breadboard (protoboard)** is used for prototyping and testing electronic circuits quickly, without soldering components together. You make temporary connections using jumper wires.

### How the Holes Are Connected Internally
Inside the plastic casing, metal spring clips link specific groups of holes:
- **Power Rails:** The long rows running horizontally along the top and bottom edges, typically marked with **red (+)** for $V_{CC}$ and **blue (-)** for Ground ($GND$). All holes in a single rail share a continuous horizontal connection along the length of the board.
- **Body (Terminal Strips):** The main central area where components are inserted. Holes are connected **vertically in short groups of five** (columns labeled $a-e$ and $f-j$). Each group of 5 forms a single electrical node.
- **Center Gap (Trench):** The channel running horizontally down the middle of the board. It breaks the vertical connection between row $e$ and row $f$, allowing dual-inline package (DIP) IC chips or push buttons to bridge across without shorting opposing pins.`,
      },
      {
        id: 'b12-bb-summary',
        type: 'callout',
        title: 'Breadboard Prototyping Rule',
        content: `Placing two component legs into the **same vertical 5-hole strip** connects them together electrically. Placing them in different columns keeps them separate unless bridged with a wire or component!`,
      },
    ],
    assessment: {
      format: 'multiple_choice',
      passing_score_percentage: 100,
      required_to_unlock_next: true,
      questions: [
        {
          id: 'q-bb-1',
          type: 'multiple_choice',
          question: 'How are the holes in the main central area (terminal strips) of a solderless breadboard connected internally?',
          options: [
            'A) Horizontally along the entire length of the board',
            'B) Vertically in short groups of five holes',
            'C) Diagonally across the center channel',
            'D) All holes on the board are connected together',
          ],
          correct_answer: 'B',
          explanation: 'On a standard breadboard, the central terminal strip holes are connected vertically in groups of five, allowing components inserted into the same column to share an electrical connection.',
        },
      ],
    },
  },
  {
    title: 'Types of Circuits',
    groupTitle: '03 — Basic Electronics',
    description: 'Differentiate between closed circuits, open circuits, and dangerous short circuits that cause thermal damage.',
    learningObjectives: [
      'Explain the difference between closed, open, and short circuits',
      'Trace continuous current loops from positive source to ground',
    ],
    sourceReference: {
      section: '03 — Basic Electronics',
      heading: 'TYPES OF CIRCUITS',
      pageReference: 'Page 14',
      sourceExcerpt: 'Closed circuit: unbroken complete path where current flows. Open circuit: path is broken, current cannot flow. Short circuit: low-resistance direct connection between power and ground, causing excessive current, heat, and component damage.',
    },
    blocks: [
      {
        id: 'b13-circuits',
        type: 'text',
        content: `Every circuit falls into one of three operational states:
1. **Closed Circuit:** A complete, unbroken conductive loop from the power source through the load and back to ground. Current flows and the circuit operates normally.
2. **Open Circuit:** An intentional or accidental break in the loop (such as an open switch or loose wire). Current cannot cross the air gap, so the circuit turns off.
3. **Short Circuit:** An unintended, zero-resistance path connecting power directly to ground, bypassing the load. Current surges to dangerous levels, overheating traces and burning components.`,
      },
    ],
    assessment: {
      format: 'multiple_choice',
      passing_score_percentage: 100,
      required_to_unlock_next: true,
      questions: [
        {
          id: 'q-circ-1',
          type: 'multiple_choice',
          question: 'What occurs during an electrical short circuit?',
          options: [
            'A) The circuit path is broken and no current can flow',
            'B) Power connects directly to ground without sufficient resistance, causing dangerous high current and heat',
            'C) Voltage drops to zero across the battery terminals permanently',
            'D) Components run at half speed',
          ],
          correct_answer: 'B',
          explanation: 'A short circuit bypasses the electrical load, creating an almost zero-resistance link between power and ground that draws excessive current and causes thermal component damage.',
        },
      ],
    },
  },
  {
    title: 'Resistors',
    groupTitle: '03 — Basic Electronics',
    description: 'Learn resistor functions, standard color band decoding, and why current-limiting resistors are required for sensitive loads.',
    learningObjectives: [
      'Decode a 4-band resistor using color codes',
      'Explain the role of current-limiting resistors in protecting LEDs',
    ],
    sourceReference: {
      section: '03 — Basic Electronics',
      heading: 'RESISTORS',
      pageReference: 'Page 15-16',
      sourceExcerpt: 'Resistors restrict current flow. Reading a 4-Band Resistor: Band 1 (first digit), Band 2 (second digit), Band 3 (multiplier), Band 4 (tolerance). Always use current-limiting resistors with LEDs.',
    },
    blocks: [
      {
        id: 'b14-res',
        type: 'text',
        content: `**Resistors** limit current flow and divide voltages:
- Without a resistor, sensitive components like LEDs draw excessive current until they burn out.
- **Reading 4-Band Resistors:**
  - Band 1: First significant digit (e.g. Red = 2)
  - Band 2: Second significant digit (e.g. Red = 2)
  - Band 3: Multiplier (e.g. Brown = $\\times 10^1 = 10$)
  - Result: $22 \\times 10 = 220\\,\\Omega$
  - Band 4: Tolerance (e.g. Gold = $\\pm 5\\%$)`,
      },
    ],
    assessment: {
      format: 'multiple_choice',
      passing_score_percentage: 100,
      required_to_unlock_next: true,
      questions: [
        {
          id: 'q-res-1',
          type: 'multiple_choice',
          question: 'Why must an LED always be connected in series with a current-limiting resistor?',
          options: [
            'A) To increase the LED’s maximum brightness',
            'B) To prevent excessive current from burning out the semiconductor diode',
            'C) To convert direct current into alternating current',
            'D) To store electrical charge for when power turns off',
          ],
          correct_answer: 'B',
          explanation: 'LEDs have very low forward resistance once conducting; without a series resistor to clamp current flow, excessive amperage will instantly burn out the diode.',
        },
      ],
    },
  },
  {
    title: 'Light-Emitting Diode (LED)',
    groupTitle: '03 — Basic Electronics',
    description: 'Understand semiconductor diode polarity, identifying the anode (longer leg) vs cathode (shorter leg), and forward biasing.',
    learningObjectives: [
      'Identify LED anode and cathode terminals',
      'Wire an LED with correct polarity and a protective resistor',
    ],
    sourceReference: {
      section: '03 — Basic Electronics',
      heading: 'LIGHT-EMITTING DIODE (LED)',
      pageReference: 'Page 17',
      sourceExcerpt: 'An LED is a directional semiconductor diode that emits light. Anode: longer leg, positive (+). Cathode: shorter leg, flat edge on casing, negative (-). Current only flows from anode to cathode.',
    },
    blocks: [
      {
        id: 'b15-led',
        type: 'text',
        content: `A **Light-Emitting Diode (LED)** is a directional component that emits light when current passes through it in the forward direction:
- **Anode (+):** The longer lead, connects toward the positive voltage supply.
- **Cathode (-):** The shorter lead (adjacent to the flat edge on the plastic lens), connects toward Ground ($GND$).
- If connected backward, current will not flow and the LED will not illuminate.`,
      },
    ],
    assessment: {
      format: 'multiple_choice',
      passing_score_percentage: 100,
      required_to_unlock_next: true,
      questions: [
        {
          id: 'q-led-1',
          type: 'multiple_choice',
          question: 'How do you identify the positive terminal (anode) of a standard through-hole LED?',
          options: [
            'A) It is the shorter lead next to the flat edge',
            'B) It is the longer lead of the component',
            'C) It is always marked with red paint',
            'D) Both leads are identical and can be plugged in either way',
          ],
          correct_answer: 'B',
          explanation: 'The longer lead corresponds to the positive anode terminal, while the shorter lead (and flat notch on the rim) corresponds to the negative cathode.',
        },
      ],
    },
  },
  {
    title: 'Potentiometer (Variable Resistor)',
    groupTitle: '03 — Basic Electronics',
    description: 'Explore three-pin potentiometers, wiper voltage division, and interfacing analog rotational inputs to microcontrollers.',
    learningObjectives: [
      'Explain how a 3-pin potentiometer functions as an adjustable voltage divider',
      'Read analog wiper voltages using a microcontroller analog input pin',
    ],
    sourceReference: {
      section: '03 — Basic Electronics',
      heading: 'POTENTIOMETER (VARIABLE RESISTOR)',
      pageReference: 'Page 18',
      sourceExcerpt: 'A potentiometer is a variable resistor with three pins. The outer two pins connect across power (5V) and ground (GND). The middle pin (wiper) taps off a variable voltage between 0V and 5V depending on knob rotation.',
    },
    blocks: [
      {
        id: 'b16-pot',
        type: 'text',
        content: `A **potentiometer** is an adjustable variable resistor:
- **Outer Pins (1 and 3):** Connected across power ($5V$) and Ground ($GND$).
- **Center Pin (2 - Wiper):** Slides along the internal resistive track as the knob turns.
- When connected this way, the wiper voltage varies smoothly from **0V up to 5V**, providing an ideal analog input for sensors or user dials.`,
      },
    ],
    assessment: {
      format: 'multiple_choice',
      passing_score_percentage: 100,
      required_to_unlock_next: true,
      questions: [
        {
          id: 'q-pot-1',
          type: 'multiple_choice',
          question: 'When using a 3-pin potentiometer to supply a variable signal to an Arduino analog pin, where must the middle (wiper) pin be connected?',
          options: [
            'A) Directly to the 5V power supply',
            'B) Directly to an Arduino analog input pin (such as A0)',
            'C) To the battery negative terminal only',
            'D) Left disconnected',
          ],
          correct_answer: 'B',
          explanation: 'The middle wiper pin outputs the variable divided voltage (0V to 5V) created by the knob position, which is fed into an analog input pin like A0 to be read by analogRead().',
        },
      ],
    },
  },
  {
    title: 'Push Buttons',
    groupTitle: '03 — Basic Electronics',
    description: 'Learn momentary tactile switch mechanics, 4-pin internal bridge pairings, and pull-down resistor circuit wiring.',
    learningObjectives: [
      'Understand how 4-pin momentary push buttons are paired internally',
      'Prevent floating digital input pins using pull-up or pull-down resistors',
    ],
    sourceReference: {
      section: '03 — Basic Electronics',
      heading: 'PUSH BUTTONS',
      pageReference: 'Page 19',
      sourceExcerpt: 'Push buttons are momentary switches. When pressed, internal metal contacts close the circuit. Pins on opposite sides are linked in pairs. Use a pull-down resistor to prevent floating inputs.',
    },
    blocks: [
      {
        id: 'b17-btn',
        type: 'text',
        content: `**Push buttons** are momentary tactile switches that make or break connections:
- A standard 4-pin tactile button has pins linked across the body in pairs.
- **Floating Input Hazard:** An unconnected microcontroller input pin acts like an antenna, randomly jumping between HIGH and LOW due to static electrical noise.
- **Pull-Down Resistor Solution:** Connect a $10\\,\\text{k}\\Omega$ resistor from the input pin to ground so the pin reads a solid LOW ($0V$) until the button is pressed.`,
      },
    ],
    assessment: {
      format: 'multiple_choice',
      passing_score_percentage: 100,
      required_to_unlock_next: true,
      questions: [
        {
          id: 'q-btn-1',
          type: 'multiple_choice',
          question: 'What happens to a microcontroller digital input pin if a push button is connected to 5V without a pull-down or pull-up resistor?',
          options: [
            'A) It stays permanently HIGH',
            'B) It floats unpredictably between HIGH and LOW due to ambient electrical noise',
            'C) It outputs 12V back to the battery',
            'D) It compiles code faster',
          ],
          correct_answer: 'B',
          explanation: 'Without a pull-up or pull-down resistor to tie the pin to a known voltage rail when the button is open, the input floats and produces erratic, unstable readings.',
        },
      ],
    },
  },
  {
    title: 'Steps in Building Your Circuit',
    groupTitle: '03 — Basic Electronics',
    description: 'Follow disciplined breadboard assembly rules: coordinate reading (letter then number), resistor-first convention, and the finger trace check.',
    learningObjectives: [
      'Read and navigate breadboard coordinate positions accurately',
      'Perform the finger-trace troubleshooting check before applying electrical power',
    ],
    sourceReference: {
      section: '03 — Basic Electronics',
      heading: 'STEPS IN BUILDING YOUR CIRCUIT',
      pageReference: 'Page 20-21',
      sourceExcerpt: 'Reading positions: letter, then number (e.g. C14). Connect components: Top to Bottom, Left to Right. Follow the Resistor First convention. Tool: The Finger Trace (Troubleshooting): trace your finger along every wire from power to ground before turning on power.',
    },
    blocks: [
      {
        id: 'b18-steps',
        type: 'text',
        content: `Follow these standard bench procedures when assembling circuits:
1. **Coordinate Navigation:** Read coordinates as **letter, then number** (e.g., column $C$, row $14$).
2. **Resistor-First Convention:** Place fixed resistors first; they define the circuit topology and protect sensitive parts.
3. **Top to Bottom, Left to Right:** Maintain neat wire routing without crossing over chips unnecessarily.
4. **Tool: The Finger Trace:** Before connecting power, trace your finger along the current path from the positive rail, through every component, to ground. Verify polarity and ensure no dead shorts exist.`,
      },
    ],
    assessment: {
      format: 'multiple_choice',
      passing_score_percentage: 100,
      required_to_unlock_next: true,
      questions: [
        {
          id: 'q-steps-1',
          type: 'multiple_choice',
          question: 'What is the purpose of performing the "Finger Trace" check prior to powering on a new breadboard circuit?',
          options: [
            'A) To measure wire resistance by touch',
            'B) To physically trace the circuit from positive rail to ground, catching short circuits and reverse polarity before power is applied',
            'C) To clean dust from the breadboard contacts',
            'D) To test the battery voltage level',
          ],
          correct_answer: 'B',
          explanation: 'The Finger Trace is a safety protocol where you follow connections with your finger to verify wire placement and polarity, preventing burnt components before flipping the power switch.',
        },
      ],
    },
  },

  // ── 04 — Introduction to Arduino Programming ────────────────────────────────
  {
    title: 'Arduino Hardware',
    groupTitle: '04 — Introduction to Arduino Programming',
    description: 'Inspect the anatomy of the Arduino microcontroller board: processor chip, USB interface, power regulation, digital pins, and analog inputs.',
    learningObjectives: [
      'Identify key hardware interfaces on the Arduino Uno microcontroller board',
      'Locate digital I/O pins, analog input pins, and power distribution rails',
    ],
    sourceReference: {
      section: '04 — Introduction to Arduino Programming',
      heading: 'ARDUINO HARDWARE',
      pageReference: 'Page 22',
      sourceExcerpt: 'The Arduino is an open-source microcontroller board. Key components: Microcontroller chip (ATmega328P), USB port (for code upload and serial power), DC power jack, 14 digital I/O pins (0–13), 6 analog input pins (A0–A5), and 5V/3.3V/GND power pins.',
    },
    blocks: [
      {
        id: 'b19-hw',
        type: 'text',
        content: `The **Arduino board** serves as the central electronic computing controller:
- **Microcontroller Chip (ATmega328P):** Contains the CPU, flash program memory, RAM, and internal clock timer.
- **Digital Pins ($0-13$):** Can be set as inputs (reading buttons) or outputs (driving LEDs). Pins marked with a tilde (\`~\`) support PWM analog output.
- **Analog Pins ($A0-A5$):** Read variable voltage levels from $0V$ to $5V$, converting them to numbers from $0$ to $1023$.
- **Power Headers:** Provide regulated $5V$, $3.3V$, and Ground ($GND$) pins to power breadboard circuits.`,
      },
    ],
    assessment: {
      format: 'multiple_choice',
      passing_score_percentage: 100,
      required_to_unlock_next: true,
      questions: [
        {
          id: 'q-hw-1',
          type: 'multiple_choice',
          question: 'Which Arduino pins are designed specifically to measure variable analog sensor voltages between 0V and 5V?',
          options: [
            'A) Digital pins 0 and 1 (RX/TX)',
            'B) Analog input pins A0 through A5',
            'C) The 3.3V and Vin power headers',
            'D) The ICSP programming header',
          ],
          correct_answer: 'B',
          explanation: 'Analog input pins A0–A5 are connected to the internal 10-bit Analog-to-Digital Converter (ADC), converting 0V–5V signals into integer values between 0 and 1023.',
        },
      ],
    },
  },
  {
    title: 'Basic Operation',
    groupTitle: '04 — Introduction to Arduino Programming',
    description: 'Learn how microcontrollers execute code sequentially from flash memory and interact deterministically with external hardware.',
    learningObjectives: [
      'Explain the microcontroller fetch-decode-execute cycle',
      'Understand the difference between non-volatile flash storage and runtime RAM',
    ],
    sourceReference: {
      section: '04 — Introduction to Arduino Programming',
      heading: 'BASIC OPERATION',
      pageReference: 'Page 23',
      sourceExcerpt: 'The Arduino executes code sequentially at 16 MHz. Programs are compiled into machine instructions and written to flash memory, where they persist even when power is disconnected.',
    },
    blocks: [
      {
        id: 'b20-op',
        type: 'text',
        content: `How the Arduino runs your programs:
1. **Compilation:** When you click the checkmark (✓) in the Arduino IDE, your C++ code is translated into binary machine instructions.
2. **Uploading:** The compiled code is written to non-volatile **flash memory** over USB. Your program stays stored even when the Arduino is unplugged.
3. **Execution:** On power-up or reset, the internal 16 MHz clock starts executing instructions one by one.`,
      },
    ],
    assessment: {
      format: 'multiple_choice',
      passing_score_percentage: 100,
      required_to_unlock_next: true,
      questions: [
        {
          id: 'q-op-1',
          type: 'multiple_choice',
          question: 'Where is user Arduino code stored so that it remains preserved even after battery power is removed?',
          options: [
            'A) Dynamic volatile SRAM',
            'B) Non-volatile on-chip Flash memory',
            'C) The computer’s hard drive over the USB cable',
            'D) In the ceramic resonator crystal',
          ],
          correct_answer: 'B',
          explanation: 'Arduino sketch bytecode is flashed into non-volatile Flash memory on the microcontroller, allowing the robot to boot and execute code independently without a computer connection.',
        },
      ],
    },
  },
  {
    title: 'Arduino IDE and Sketches',
    groupTitle: '04 — Introduction to Arduino Programming',
    description: 'Master Arduino sketch architecture, file organization with .ino files, and the two mandatory functions: void setup() and void loop().',
    learningObjectives: [
      'Describe the role and execution lifecycle of void setup() and void loop()',
      'Navigate the Arduino IDE to verify, configure ports, and upload sketches',
    ],
    sourceReference: {
      section: '04 — Introduction to Arduino Programming',
      heading: 'ARDUINO IDE AND SKETCHES',
      pageReference: 'Page 24-25',
      sourceExcerpt: 'Every Arduino program needs at least two functions: void setup() runs only once, when the Arduino is powered on or reset. This is where you configure things, like setting a pin as input or output. void loop() runs over and over for as long as the board has power. This is where your main program goes.',
    },
    blocks: [
      {
        id: 'b21-ide',
        type: 'text',
        content: `A program written for Arduino is called a **sketch** (file extension \`.ino\`). Every sketch requires two core functions:

### 1. \`void setup()\`
- Runs **only once** whenever the board is powered on or the reset button is pressed.
- Used to configure initial hardware settings (e.g., setting pin modes with \`pinMode()\`, starting serial communication with \`Serial.begin()\`).

### 2. \`void loop()\`
- Runs **continuously in an infinite loop** for as long as the Arduino receives power.
- Executes your primary robot logic (reading sensors, calculating decisions, updating motor speeds). When it reaches the closing brace \`}\`, it immediately starts over at the top of \`loop()\`.`,
      },
    ],
    assessment: {
      format: 'multiple_choice',
      passing_score_percentage: 100,
      required_to_unlock_next: true,
      questions: [
        {
          id: 'q-ide-1',
          type: 'multiple_choice',
          question: 'What is the primary difference in execution between void setup() and void loop()?',
          options: [
            'A) setup() runs only once upon boot/reset, while loop() repeats continuously forever',
            'B) setup() controls motors, while loop() configures pin modes',
            'C) loop() executes first, followed by setup() once sensors are warmed up',
            'D) setup() runs on battery power, while loop() requires USB power',
          ],
          correct_answer: 'A',
          explanation: 'void setup() initializes hardware once on power-up; void loop() is the main execution cycle that repeats continuously as long as the microcontroller remains powered.',
        },
      ],
    },
  },
  {
    title: 'Blink',
    groupTitle: '04 — Introduction to Arduino Programming',
    description: 'Study the quintessential robotics hello-world program: digital pin output control, delay timing, and the step-by-step upload procedure.',
    learningObjectives: [
      'Write, verify, and upload the standard Arduino Blink program',
      'Explain the purpose of pinMode(13, OUTPUT), digitalWrite(13, HIGH), delay(1000), and digitalWrite(13, LOW)',
    ],
    sourceReference: {
      section: '04 — Introduction to Arduino Programming',
      heading: 'BLINK',
      pageReference: 'Page 25-26',
      sourceExcerpt: 'Tool: Uploading a Sketch: 1. Prepare circuit. 2. Facilitator check. 3. New sketch. 4. Write code. 5. Verify sketch (checkmark). 6. Choose board and port. 7. Upload sketch (arrow). The code: void setup() { pinMode(13, OUTPUT); } void loop() { digitalWrite(13, HIGH); delay(1000); digitalWrite(13, LOW); delay(1000); } What each line does: pinMode(13, OUTPUT) sets pin 13 to behave as an output. delay(1000) pauses for 1,000 milliseconds (1 second).',
    },
    blocks: [
      {
        id: 'b22-blink-proc',
        type: 'activity',
        title: 'Tool: Uploading a Sketch',
        content: `Follow these seven steps to upload your program:
1. **Prepare your circuit:** Connect an LED and a $220\\,\\Omega$ resistor using digital pin 13, $5V$, and $GND$.
2. **Circuit check:** Have your wiring verified by your mentor before plugging in USB power.
3. **Create a new sketch:** In the Arduino IDE, click **File $\\rightarrow$ New Sketch** (\`Ctrl+N\`).
4. **Write the code:** Type the standard Blink program shown below.
5. **Verify your sketch:** Click the checkmark (✓) button to compile and check for syntax errors.
6. **Select Board & Port:** Under **Tools $\\rightarrow$ Board**, select **Arduino Uno**. Under **Tools $\\rightarrow$ Port**, pick the active COM port.
7. **Upload:** Click the right-arrow ($\\rightarrow$) button to flash the code onto your board.`,
      },
      {
        id: 'b22-blink-code',
        type: 'code',
        title: 'Arduino Blink Source Code',
        code_language: 'cpp',
        content: `void setup() {
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  delay(1000);
  digitalWrite(13, LOW);
  delay(1000);
}`,
      },
      {
        id: 'b22-blink-explanation',
        type: 'text',
        content: `### What each line does:
- \`pinMode(13, OUTPUT);\` sets pin 13 to behave as an electrical output capable of driving voltage. It belongs inside \`setup()\` because pin configuration only needs to happen once.
- \`digitalWrite(13, HIGH);\` sends a $5V$ signal to pin 13, turning the LED on.
- \`delay(1000);\` pauses execution for $1,000$ milliseconds ($1$ full second).
- \`digitalWrite(13, LOW);\` drops pin 13 back to $0V$, turning the LED off.
- The closing brace \`}\` of \`loop()\` restarts the function, causing the LED to flash continuously.`,
      },
    ],
    assessment: {
      format: 'multiple_choice',
      passing_score_percentage: 100,
      required_to_unlock_next: true,
      questions: [
        {
          id: 'q-blink-1',
          type: 'multiple_choice',
          question: 'In the Arduino Blink program, why does pinMode(13, OUTPUT) belong inside setup() rather than loop()?',
          options: [
            'A) Because loop() cannot execute commands with numbers in them',
            'B) Because hardware pin direction configuration only needs to be established once upon microcontroller boot',
            'C) Because digital pin 13 turns off permanently if pinMode is called twice',
            'D) Because delay() disables the pinMode instruction',
          ],
          correct_answer: 'B',
          explanation: 'Configuring an electrical pin as an INPUT or OUTPUT sets internal hardware register multiplexers. This is an initialization step that only needs to occur once inside setup().',
        },
      ],
    },
  },
  {
    title: 'Electronic Signals: Analog & Digital',
    groupTitle: '04 — Introduction to Arduino Programming',
    description: 'Contrast binary two-state digital signals against continuous analog voltage ranges, covering digitalRead, digitalWrite, analogRead, and analogWrite.',
    learningObjectives: [
      'Compare 2-state digital logic (0/1) against continuous analog voltages (0-5V)',
      'Map analogRead() 10-bit range (0-1023) and analogWrite() 8-bit PWM range (0-255)',
    ],
    sourceReference: {
      section: '04 — Introduction to Arduino Programming',
      heading: 'ELECTRONIC SIGNALS: ANALOG & DIGITAL',
      pageReference: 'Page 26-27',
      sourceExcerpt: 'Digital signals have only two states: 0 or 1, read as LOW or HIGH (light switch analogy). digitalRead(pin) reads state; digitalWrite(pin, value) writes HIGH or LOW. Analog signals can take any value within a range from 0–5V (dimmer switch analogy). analogRead(pin) returns 0 to 1023. analogWrite(pin, value) writes 0 to 255. Note: analogWrite() only works on PWM pins marked with ~.',
    },
    blocks: [
      {
        id: 'b23-signals',
        type: 'text',
        content: `Sensors and actuators communicate with microcontrollers using two primary signal types:

### 1. Digital Signals
- **Two discrete states:** $0$ or $1$, interpreted as **LOW ($0V$)** or **HIGH ($5V$)**.
- **Analogy:** A standard light switch—it is either completely off or completely on.
- **Commands:**
  - \`digitalRead(pin)\`: Reads the state of a digital pin (returns \`HIGH\` or \`LOW\`).
  - \`digitalWrite(pin, value)\`: Sets a digital pin to output \`HIGH\` ($5V$) or \`LOW\` ($0V$).

### 2. Analog Signals
- **Continuous values across a range:** Can take any voltage level between $0V$ and $5V$.
- **Analogy:** A dimmer knob—can be dialed to any brightness between completely dark and full brightness.
- **Commands:**
  - \`analogRead(pin)\`: Reads voltage on analog pins $A0-A5$ and returns a **10-bit integer from $0$ to $1023$**.
  - \`analogWrite(pin, value)\`: Outputs simulated analog voltage using Pulse Width Modulation (PWM) with a value from **$0$ to $255$** on pins marked with a tilde (\`~\`).`,
      },
    ],
    assessment: {
      format: 'multiple_choice',
      passing_score_percentage: 100,
      required_to_unlock_next: true,
      questions: [
        {
          id: 'q-sig-1',
          type: 'multiple_choice',
          question: 'What numerical range of integer values does analogRead(A0) return when reading an analog sensor between 0V and 5V?',
          options: [
            'A) 0 to 1 (HIGH or LOW)',
            'B) 0 to 255',
            'C) 0 to 1023',
            'D) -128 to +127',
          ],
          correct_answer: 'C',
          explanation: 'The Arduino ATmega328P uses a 10-bit Analog-to-Digital Converter (ADC), dividing the 0V–5V input range into 2^10 = 1024 discrete steps (0 through 1023).',
        },
      ],
    },
  },
  {
    title: 'Reading Code: Potentiometer-Controlled LED',
    groupTitle: '04 — Introduction to Arduino Programming',
    description: 'Learn code comprehension: reading analog potentiometer input, mathematical scaling (dividing by 4), and modulating PWM LED brightness.',
    learningObjectives: [
      'Trace code line by line to understand sensor-to-actuator data mapping',
      'Explain why analogRead values (0-1023) are divided by 4 for analogWrite (0-255)',
    ],
    sourceReference: {
      section: '04 — Introduction to Arduino Programming',
      heading: 'READING CODE: POTENTIOMETER-CONTROLLED LED',
      pageReference: 'Page 27-28',
      sourceExcerpt: 'int potValue = 0; void setup() { pinMode(9, OUTPUT); } void loop() { potValue = analogRead(A0); analogWrite(9, potValue / 4); delay(10); } Why divide by 4? analogRead() gives a value from 0 to 1023, but analogWrite() only accepts 0 to 255. Dividing by 4 scales the range to fit: 1023 ÷ 4 ≈ 255.',
    },
    blocks: [
      {
        id: 'b24-potcode',
        type: 'code',
        title: 'Potentiometer-Controlled LED Sketch',
        code_language: 'cpp',
        content: `int potValue = 0;

void setup() {
  pinMode(9, OUTPUT);
}

void loop() {
  potValue = analogRead(A0);
  analogWrite(9, potValue / 4);
  delay(10);
}`,
      },
      {
        id: 'b24-potexpl',
        type: 'text',
        content: `### Line-by-Line Code Breakdown:
- \`int potValue = 0;\`: Declares an integer variable named \`potValue\` to store the potentiometer reading, initialized to 0.
- \`pinMode(9, OUTPUT);\`: Sets pin 9 (marked with \`~\` for PWM) as an output to drive the LED.
- \`potValue = analogRead(A0);\`: Reads the analog voltage from the potentiometer on pin $A0$ (returns a number from $0$ to $1023$).
- \`analogWrite(9, potValue / 4);\`: Modulates LED brightness.

### Why divide by 4?
\`analogRead()\` produces a 10-bit integer from **$0$ to $1023$**, but \`analogWrite()\` only accepts an 8-bit value from **$0$ to $255$**. Dividing the reading by 4 scales the input range down to match the output range ($1023 \\div 4 \\approx 255$).`,
      },
    ],
    assessment: {
      format: 'multiple_choice',
      passing_score_percentage: 100,
      required_to_unlock_next: true,
      questions: [
        {
          id: 'q-scale-1',
          type: 'multiple_choice',
          question: 'In the Potentiometer-Controlled LED program, why is the analogRead(A0) value divided by 4 before being passed to analogWrite(9, ...)?',
          options: [
            'A) Because the circuit uses 4 separate LEDs',
            'B) To scale the 10-bit input range (0–1023) down to match the 8-bit PWM output range (0–255)',
            'C) To reduce electrical current in the resistor by 75%',
            'D) Because Arduino clock speed runs at 4 MHz',
          ],
          correct_answer: 'B',
          explanation: 'analogRead() provides 0–1023 (10-bit resolution), while analogWrite() accepts 0–255 (8-bit resolution). Dividing by 4 maps 1023 down to 255 so the LED brightness tracks smoothly across the entire potentiometer turn.',
        },
      ],
    },
  },
];

/**
 * Deterministically evaluates a student's answer submission.
 */
export function evaluateAssessmentAnswer(
  question: NodeAssessmentQuestion,
  studentAnswer: string | number
): { passed: boolean; score: number; feedback: string; explanation?: string } {
  const qType = question.type;
  const rawAns = String(studentAnswer || '').trim();
  const expl = question.explanation || '';

  if (qType === 'multiple_choice') {
    const cleanStudent = rawAns.toUpperCase().slice(0, 1);
    const cleanCorrect = (question.correct_answer || '').toUpperCase().slice(0, 1);

    if (cleanStudent === cleanCorrect) {
      return {
        passed: true,
        score: 100,
        feedback: `Correct! Well done. ${expl}`,
        explanation: expl,
      };
    } else {
      return {
        passed: false,
        score: 0,
        feedback: `Incorrect. You selected option (${cleanStudent}), but the correct answer is (${cleanCorrect}). ${expl}`,
        explanation: expl,
      };
    }
  }

  if (qType === 'fill_in_the_blanks') {
    const cleanStudent = rawAns.toLowerCase().replace(/[^a-z0-9]/g, '');
    const expected = (question.expected_answers || []).map(a => a.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const alts = (question.accepted_alternatives || []).map(a => a.toLowerCase().replace(/[^a-z0-9]/g, ''));

    const isMatch = expected.includes(cleanStudent) || alts.includes(cleanStudent);
    if (isMatch) {
      return {
        passed: true,
        score: 100,
        feedback: `Correct! "${rawAns}" is the right answer. ${expl}`,
        explanation: expl,
      };
    } else {
      return {
        passed: false,
        score: 0,
        feedback: `Not quite. Expected: "${question.expected_answers?.[0] || 'correct term'}". ${expl}`,
        explanation: expl,
      };
    }
  }

  if (qType === 'short_answer') {
    const cleanStudent = rawAns.toLowerCase();
    const keywords = (question.passing_keywords || []).map(k => k.toLowerCase());

    const matchedKeywords = keywords.filter(k => cleanStudent.includes(k));
    const passed = keywords.length === 0 ? rawAns.length > 10 : matchedKeywords.length >= Math.ceil(keywords.length / 2);

    if (passed) {
      return {
        passed: true,
        score: 100,
        feedback: `Great explanation! Key concepts demonstrated: ${matchedKeywords.join(', ') || 'verified'}. ${expl}`,
        explanation: expl,
      };
    } else {
      return {
        passed: false,
        score: 50,
        feedback: `Your response was recorded. To strengthen your answer, consider addressing: ${keywords.join(', ')}. ${expl}`,
        explanation: expl,
      };
    }
  }

  // Practical activity
  return {
    passed: true,
    score: 100,
    feedback: `Activity marked completed. ${expl}`,
    explanation: expl,
  };
}

