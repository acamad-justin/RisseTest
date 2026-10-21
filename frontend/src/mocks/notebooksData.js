/**
 * notebooksData.js — Mock data for the Risse Notebooks page.
 *
 * ⚠  DEMO DATA — not real learner records.
 * Replace with API responses when the backend is ready.
 *
 * Logs reference Projects via projectId (null = standalone Log).
 * Project log-counts are derived at runtime from the Logs array,
 * never hardcoded in the presentation layer.
 */

// ── Projects ───────────────────────────────────────────────────────────────
export const initialProjects = [
  {
    id: 'project-sumbot',
    title: 'Sumobot',
    description: 'Experiments and improvements for the Sumobot project.',
    createdAt: '2026-07-18T10:00:00',
  },
  {
    id: 'project-line-tracing',
    title: 'Line Tracing',
    description: 'Line-following robot using IR sensors.',
    createdAt: '2026-09-27T09:00:00',
  },
  {
    id: 'project-robulance',
    title: 'Robulance',
    description: 'Robotic ambulance challenge entry.',
    createdAt: '2026-09-10T08:30:00',
  },
  {
    id: 'project-grammarly',
    title: 'Grammarly Logic',
    description: 'Logic and grammar parsing experiments.',
    createdAt: '2026-07-18T11:00:00',
  },
  {
    id: 'project-coffee',
    title: 'Coffee Shop Solution',
    description: 'Autonomous coffee-serving robot prototype.',
    createdAt: '2026-09-04T14:00:00',
  },
]

// ── Logs ───────────────────────────────────────────────────────────────────
export const initialLogs = [
  {
    id: 'log-sumbot-turn',
    title: 'Sumobot Turning Issues',
    preview: 'How can I make the robot stop turning at the correct angle instead of overshooting?',
    updatedAt: '2026-11-14T10:30:00',
    projectId: 'project-sumbot',
    messages: [
      {
        id: 'msg-st-1',
        role: 'user',
        content: 'How can I make the robot stop turning at the correct angle instead of overshooting?',
        createdAt: '2026-11-14T10:20:00',
      },
      {
        id: 'msg-st-2',
        role: 'assistant',
        content: 'What do you observe just before the robot overshoots its target angle?',
        createdAt: '2026-11-14T10:21:00',
        isDemo: true,
      },
    ],
  },
  {
    id: 'log-sensors',
    title: 'Choosing the Right Sensors',
    preview: 'Would an ultrasonic sensor or an infrared sensor be better for detecting opponents during a competition?',
    updatedAt: '2026-11-03T14:45:00',
    projectId: 'project-sumbot',
    messages: [
      {
        id: 'msg-se-1',
        role: 'user',
        content: 'Would an ultrasonic sensor or an infrared sensor be better for detecting opponents during a competition?',
        createdAt: '2026-11-03T14:40:00',
      },
      {
        id: 'msg-se-2',
        role: 'assistant',
        content: 'It depends on the arena size. What are the typical distances between robots in your competition?',
        createdAt: '2026-11-03T14:41:00',
        isDemo: true,
      },
    ],
  },
  {
    id: 'log-motor',
    title: 'Motor Speed and Torque',
    preview: 'If I use a heavier robot, will I need motors with higher torque?',
    updatedAt: '2026-10-25T09:15:00',
    projectId: 'project-sumbot',
    messages: [
      {
        id: 'msg-mo-1',
        role: 'user',
        content: 'If I use a heavier robot, will I need motors with higher torque?',
        createdAt: '2026-10-25T09:10:00',
      },
      {
        id: 'msg-mo-2',
        role: 'assistant',
        content: 'Yes, generally. How much does your current robot weigh and what acceleration are you targeting?',
        createdAt: '2026-10-25T09:11:00',
        isDemo: true,
      },
    ],
  },
  {
    id: 'log-line-detection',
    title: 'Line Detection Logic',
    preview: 'How should the robot decide when to turn around after detecting the edge of the arena?',
    updatedAt: '2026-10-23T16:00:00',
    projectId: 'project-line-tracing',
    messages: [
      {
        id: 'msg-ld-1',
        role: 'user',
        content: 'How should the robot decide when to turn around after detecting the edge of the arena?',
        createdAt: '2026-10-23T15:55:00',
      },
      {
        id: 'msg-ld-2',
        role: 'assistant',
        content: 'Are you using a binary edge sensor or a sensor that can measure reflectance intensity?',
        createdAt: '2026-10-23T15:56:00',
        isDemo: true,
      },
    ],
  },
  // Additional logs for other projects (to fill out log counts)
  {
    id: 'log-rob-1',
    title: 'Robulance Navigation',
    preview: 'How can the robot navigate hospital corridors without GPS?',
    updatedAt: '2026-09-10T08:40:00',
    projectId: 'project-robulance',
    messages: [],
  },
  {
    id: 'log-rob-2',
    title: 'Robulance Arm Control',
    preview: 'What servo angle range is needed to pick up a medicine bottle?',
    updatedAt: '2026-09-08T11:00:00',
    projectId: 'project-robulance',
    messages: [],
  },
  {
    id: 'log-rob-3',
    title: 'Robulance Emergency Override',
    preview: 'How do we implement a manual override for emergencies?',
    updatedAt: '2026-09-06T09:00:00',
    projectId: 'project-robulance',
    messages: [],
  },
  {
    id: 'log-rob-4',
    title: 'Robulance Battery Life',
    preview: 'How long should the battery last for a 4-hour competition?',
    updatedAt: '2026-09-05T14:00:00',
    projectId: 'project-robulance',
    messages: [],
  },
  {
    id: 'log-rob-5',
    title: 'Robulance Speed Control',
    preview: 'What is a safe top speed for a hospital-corridor robot?',
    updatedAt: '2026-09-04T10:00:00',
    projectId: 'project-robulance',
    messages: [],
  },
  // Line tracing extras (to reach 14 logs: 1 named + 13 generated = 14 total)
  ...Array.from({ length: 13 }, (_, i) => ({
    id: `log-lt-${i + 2}`,
    title: `Line Tracing Experiment ${i + 2}`,
    preview: `Experiment notes for iteration ${i + 2} of the line follower.`,
    updatedAt: `2026-09-${String(27 - i).padStart(2, '0')}T10:00:00`,
    projectId: 'project-line-tracing',
    messages: [],
  })),
  // Grammarly Logic (3 logs)
  {
    id: 'log-gram-1',
    title: 'Grammarly Parsing Basics',
    preview: 'How do we tokenize a sentence for grammar checking?',
    updatedAt: '2026-07-18T11:10:00',
    projectId: 'project-grammarly',
    messages: [],
  },
  {
    id: 'log-gram-2',
    title: 'Rule-Based Corrections',
    preview: 'What common grammar rules can be encoded as simple conditionals?',
    updatedAt: '2026-07-17T09:00:00',
    projectId: 'project-grammarly',
    messages: [],
  },
  {
    id: 'log-gram-3',
    title: 'Grammarly Error Scoring',
    preview: 'How do we weight different error types in the final score?',
    updatedAt: '2026-07-16T14:00:00',
    projectId: 'project-grammarly',
    messages: [],
  },
  // Coffee Shop (12 logs)
  ...Array.from({ length: 12 }, (_, i) => ({
    id: `log-coffee-${i + 1}`,
    title: `Coffee Shop Session ${i + 1}`,
    preview: `Discussion notes for coffee shop robot session ${i + 1}.`,
    updatedAt: `2026-09-${String(4 + i).padStart(2, '0')}T10:00:00`,
    projectId: 'project-coffee',
    messages: [],
  })),
]
