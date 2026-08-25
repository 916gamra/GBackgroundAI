import { BotPose, BotState } from './types';
import { circle, TAU } from './shape';
import { pair } from './expressions';

export function base(pose: Partial<BotPose>): BotPose {
  return {
    sil: pose.sil || circle(1),
    gaze: pose.gaze || { yaw: 0, pitch: 0, roll: 0 },
    split: pose.split ?? 17,
    eyes: pose.eyes || pair(0.3, 0.44),
    dots: pose.dots || []
  };
}

/**
 * Complete list of 6 dynamic animation states
 */
export const STATES: BotState[] = [
  // 1. نبض القلب المشاعري (Heartbeat)
  {
    id: 'heartbeat',
    duration: 2.0,
    morph: 0.3,
    baseFace: true,
    baseBody: false,
    blinkIn: true,
    pose: (t) => {
      const cycle = (t * 1.8) % 1;
      let pulse = 1;
      if (cycle < 0.15) {
        pulse = 1 + Math.sin((cycle / 0.15) * Math.PI) * 0.14;
      } else if (cycle >= 0.25 && cycle < 0.38) {
        pulse = 1 + Math.sin(((cycle - 0.25) / 0.13) * Math.PI) * 0.08;
      }

      return base({
        sil: circle(pulse, { sy: 1 / pulse }),
        gaze: { yaw: 0, pitch: -3, roll: 0 },
        split: 17.5,
        eyes: pair(0.32, 0.22, -12)
      });
    }
  },

  // 2. الطفو الشاعري في الفضاء (Float)
  {
    id: 'float',
    duration: 2.8,
    morph: 0.5,
    baseFace: true,
    baseBody: false,
    blinkIn: true,
    pose: (t) => {
      const floatY = Math.sin(t * TAU * 0.7) * 0.08;
      const floatX = Math.cos(t * TAU * 0.35) * 0.05;
      const roll = Math.sin(t * TAU * 0.35) * 6;
      return base({
        sil: circle(1, { cx: floatX, cy: floatY, rot: (roll * Math.PI) / 180 }),
        gaze: { yaw: floatX * 100, pitch: floatY * 80, roll },
        split: 16.5,
        eyes: pair(0.28, 0.42, 6)
      });
    }
  },

  // 3. رعشة واهتزاز المشاعر (Shake)
  {
    id: 'shake',
    duration: 1.8,
    morph: 0.2,
    baseFace: true,
    baseBody: false,
    blinkIn: false,
    pose: (t) => {
      const vib = Math.sin(t * 45) * 0.025;
      const vibY = Math.cos(t * 38) * 0.02;
      return base({
        sil: circle(1, { cx: vib, cy: vibY }),
        gaze: { yaw: vib * 300, pitch: vibY * 200, roll: vib * 150 },
        split: 16,
        eyes: pair(0.3, 0.38, -10)
      });
    }
  },

  // 4. إشراقة وتفتح مع جزيئات مضيئة (Bloom)
  {
    id: 'bloom',
    duration: 2.5,
    morph: 0.4,
    baseFace: true,
    baseBody: false,
    blinkIn: true,
    pose: (t) => {
      const expand = 1 + 0.12 * Math.sin(t * Math.PI);
      const rot = t * TAU * 0.5;
      return base({
        sil: circle(expand, { sy: expand * 0.98 }),
        gaze: { yaw: 0, pitch: -8, roll: 0 },
        split: 18.5,
        eyes: pair(0.36, 0.46, -14),
        dots: [0, 1, 2, 3, 4].map((i) => {
          const a = rot + (i * TAU) / 5;
          const r = 1.35 + 0.1 * Math.sin(t * 5 + i);
          return {
            x: Math.cos(a) * r,
            y: Math.sin(a) * r,
            r: 0.045,
            opacity: 0.5 + 0.5 * Math.sin(t * 4 + i)
          };
        })
      });
    }
  },

  // 5. قفز مرن مرح (Bounce with Squash & Stretch)
  {
    id: 'bounce',
    duration: 2.0,
    morph: 0.35,
    baseFace: true,
    baseBody: false,
    blinkIn: true,
    pose: (t) => {
      const phase = (t * 2) % 1;
      const jumpY = -Math.abs(Math.sin(phase * Math.PI)) * 0.15;
      const squash = 1 + Math.sin(phase * Math.PI) * 0.12;
      const stretch = 1 / squash;
      return base({
        sil: circle(1, { cx: 0, cy: jumpY, sx: squash, sy: stretch }),
        gaze: { yaw: 0, pitch: jumpY * 50, roll: 0 },
        split: 18,
        eyes: pair(0.34, 0.48, -8)
      });
    }
  },

  // 6. نبض تنفس الذكاء الاصطناعي (AI Pulse)
  {
    id: 'pulse',
    duration: 2.2,
    morph: 0.35,
    baseFace: true,
    baseBody: true,
    blinkIn: false,
    pose: (t) => {
      const beat = Math.sin(t * TAU * 1.5);
      const scaleX = 1 + beat * 0.06;
      const scaleY = 1 - beat * 0.04;
      return base({
        sil: circle(1, { sx: scaleX, sy: scaleY, cy: -beat * 0.02 }),
        eyes: pair(0.22, 0.44 * (1 + beat * 0.08))
      });
    }
  }
];

export const STATES_MAP = new Map<string, BotState>(
  STATES.map((s) => [s.id, s])
);
