// lib/teaching/safety.ts
/**
 * Dedicated Robotics Safety Evaluation Module.
 * Evaluates hardware, electrical, thermal, and mechanical safety risks.
 * Safety overrides both Socratic and Competition modes.
 */

import type { SafetyEvaluationResult, SelectorContext } from './types.ts';

interface SafetyPattern {
  regex: RegExp;
  hazardType: 'electrical' | 'battery' | 'thermal' | 'mechanical' | 'chemical' | 'general';
  immediateGuidance: string;
  reasoning: string;
}

const SAFETY_PATTERNS: SafetyPattern[] = [
  // 1. Swelling or Damaged LiPo Battery
  {
    regex: /\b(puffed|puffy|swollen|swelling|punctured|bulging|bloated|hissing)\s+(lipo|battery|cell|pack)\b|\b(battery|lipo)\s+(is|looks)\s+(puffed|swollen|bulging|bloated|hissing)\b/i,
    hazardType: 'battery',
    immediateGuidance: 'STOP IMMEDIATELY. Disconnect the battery gently without puncturing it. Place it in a fireproof LiPo safety bag or metal container on a non-flammable surface away from materials. Do not charge, use, or throw in normal trash.',
    reasoning: 'Swollen or physically compromised LiPo batteries present an immediate thermal runaway and fire hazard.',
  },
  // 2. Battery Reverse Polarity / Direct Short Circuit
  {
    regex: /\b(reverse\s*polarity|connected\s*(backwards|in reverse)|reversed\s*(wires|leads|red and black)|plugged\s*backwards|short\s*circuit|sparked|sparks\s*flying|vcc\s*(touching|connected to)\s*gnd|shorted\s*(out|battery|circuit))\b/i,
    hazardType: 'electrical',
    immediateGuidance: 'CUT POWER IMMEDIATELY. Unplug the battery or power supply before inspecting. Check for melted insulation or charred board traces. Never reconnect until correct polarity (VCC to positive, GND to negative) is verified with a multimeter.',
    reasoning: 'Short circuits and reversed polarity cause rapid component destruction, high fire risk, and potential battery rupture.',
  },
  // 3. Smoke, Burning, or Melting Components
  {
    regex: /\b(smoking|smoke\s*coming|burning\s*smell|smells\s*like\s*burning|plastic\s*melting|melted\s*wire|board\s*is\s*smoking|driver\s*caught\s*fire|flames?)\b/i,
    hazardType: 'thermal',
    immediateGuidance: 'DISCONNECT POWER NOW. Unplug the power source immediately. Allow the assembly to cool down completely in a well-ventilated area. Do not touch bare hot components with your fingers.',
    reasoning: 'Active smoke or burning indicates catastrophic component failure and imminent fire hazard.',
  },
  // 4. Overheating Battery or Motor Driver to Touch
  {
    regex: /\b(battery\s*(is|getting|feels)\s*(burning\s*hot|scalding|too hot to touch)|motor\s*driver\s*(burning\s*hot|overheating|scalding))\b/i,
    hazardType: 'thermal',
    immediateGuidance: 'POWER DOWN THE SYSTEM. Immediately switch off or unplug the power supply. A burning hot battery indicates internal short or extreme overload. Let it cool on a non-flammable surface under adult supervision.',
    reasoning: 'Excessive thermal rise in power components signals severe over-current or internal cell degradation.',
  },
  // 5. Dangerous High Voltage / Mains AC Connection
  {
    regex: /\b(wall\s*(outlet|socket)|110v|220v|mains\s*(power|electricity|ac)|plug\s*into\s*the\s*wall)\s*(directly|to the arduino|to the motor|bare wires?)\b/i,
    hazardType: 'electrical',
    immediateGuidance: 'DO NOT CONNECT TO WALL MAINS. Working directly with 110V/220V AC mains electricity carries lethal electrocution risks. Only use certified, low-voltage DC bench power supplies or safe battery packs (e.g. 5V-12V) with adult supervision.',
    reasoning: 'Mains AC voltage (110V/220V) poses a lethal electric shock hazard for robotics students.',
  },
  // 6. Mechanical Pinch Points & High-Speed Flywheels / Blades
  {
    regex: /\b(finger\s*caught|pinched\s*in\s*(gears?|chain|belt|motor)|spinning\s*(blade|cutter|saw)\s*without\s*(guard|protection)|flying\s*(debris|shrapnel))\b/i,
    hazardType: 'mechanical',
    immediateGuidance: 'DISENGAGE POWER BEFORE TOUCHING MECHANISMS. Keep hands, hair, and loose clothing completely clear of spinning pulleys, chains, gear trains, and high-speed flywheels. Always wear ANSI-approved safety glasses during mechanical testing.',
    reasoning: 'High-torque gearboxes and high-RPM mechanisms can cause severe crush, pinch, and eye injuries.',
  },
  // 7. Soldering Safety & Burns
  {
    regex: /\b(soldering\s*iron\s*(burned|touched\s*skin|left\s*on\s*carpet|melting\s*table)|soldering\s*fumes\s*(inhaled|dizzy))\b/i,
    hazardType: 'thermal',
    immediateGuidance: 'FIRST AID & VENTILATION: Run cool (not ice-cold) water over minor burns for 10-15 minutes and seek adult/medical attention. Turn off the iron, place it securely in its stand, and ventilate the room immediately.',
    reasoning: 'Soldering irons reach 350°C-400°C and produce rosin flux fumes requiring proper thermal handling and ventilation.',
  },
];

/**
 * Evaluates whether the current student message or recent context contains
 * a critical robotics physical, electrical, or mechanical hazard.
 */
export function evaluateSafety(context: SelectorContext): SafetyEvaluationResult {
  const textToScan = [
    context.lastUserMessage,
    ...context.messages.slice(-3).map(m => m.content),
  ].join(' ');

  for (const pattern of SAFETY_PATTERNS) {
    if (pattern.regex.test(textToScan)) {
      return {
        isSafe: false,
        hazardType: pattern.hazardType,
        immediateGuidance: pattern.immediateGuidance,
        requiresStop: true,
        reasoning: pattern.reasoning,
      };
    }
  }

  return {
    isSafe: true,
    requiresStop: false,
    reasoning: 'No active hardware, electrical, or mechanical safety hazards detected.',
  };
}
