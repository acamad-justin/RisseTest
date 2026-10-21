/**
 * profileData.js — Mock data for the Risse Profile page.
 *
 * ⚠  DEMO DATA — not real learner records.
 * Replace with API responses when the Laravel backend is ready.
 */

export const profileData = {
  isDemo: true,

  student: {
    name:   'Adriel Justin Dela Cruz',
    school: 'Rizal Polytechnic de Muntinlupa',
    grade:  'Grade 10',
    avatar: null, // null → show initials placeholder
  },

  // ── Stats ──────────────────────────────────────────────────────────────
  // Derived where possible; kept here as demo overrides until the backend
  // provides real aggregates.
  stats: {
    projects: 5,
    mastered: 7,
    badges:   1,
  },

  // ── Skills ────────────────────────────────────────────────────────────
  skills: [
    'Feedback Analysis',
    'Control Tuning',
    'Motion Accuracy',
    'Performance Evaluation',
    'Component Identification',
    'Basic System Understanding',
    'Hardware Integration',
  ],

  // ── Achievements ──────────────────────────────────────────────────────
  achievements: [
    {
      id:          'motion-builder',
      name:        'Motion Builder',
      image:       null, // null → render SVG badge artwork inline
      description: 'Awarded for demonstrating consistent application of motion-control principles across multiple robotics sessions. (Demo achievement — not a real record.)',
    },
  ],

  // ── Featured projects ─────────────────────────────────────────────────
  featuredProjects: [
    {
      id:    'smart-plant',
      title: 'Smart Plant Monitoring System',
      image: null,
      tags:  ['IoT', 'Sensors', 'Environmental Technology', 'Automation'],
    },
    {
      id:    'line-following',
      title: 'Line-Following Robot',
      image: null,
      tags:  ['Robotics', 'Sensors', 'Control Systems'],
    },
    {
      id:    'robulance',
      title: 'Robulance',
      image: null,
      tags:  ['Robotics', 'Navigation', 'Mechatronics'],
    },
  ],
}
