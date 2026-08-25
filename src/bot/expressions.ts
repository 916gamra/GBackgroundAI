import { BotExpression, BotEye } from './types';

/**
 * Creates an eye descriptor
 */
export function eye(
  width: number,
  height: number,
  rot = 0,
  openness = 1,
  roundness = 1
): BotEye {
  return { width, height, rot, openness, roundness };
}

/**
 * Creates a symmetrical pair of eyes (mirrored rotation)
 */
export function pair(
  width: number,
  height: number,
  rot = 0,
  openness = 1
): BotEye[] {
  return [
    eye(width, height, rot, openness),
    eye(width, height, -rot, openness)
  ];
}

/**
 * Complete list of 22 rich emotional expressions
 */
export const EXPRESSIONS: BotExpression[] = [
  {
    id: 'neutre',
    gaze: { yaw: 0, pitch: 0, roll: 0 },
    split: 17,
    eyes: pair(0.3, 0.44)
  },
  {
    id: 'joie',
    gaze: { yaw: 0, pitch: -6, roll: 0 },
    split: 17,
    eyes: pair(0.34, 0.22, 0, 0.8)
  },
  {
    id: 'triste',
    gaze: { yaw: 0, pitch: 10, roll: 0 },
    split: 16,
    eyes: pair(0.24, 0.44, -18)
  },
  {
    id: 'colere',
    gaze: { yaw: 0, pitch: -4, roll: 0 },
    split: 18,
    eyes: pair(0.26, 0.44, 22)
  },
  {
    id: 'surpris',
    gaze: { yaw: 0, pitch: -2, roll: 0 },
    split: 19,
    eyes: pair(0.48, 0.58)
  },
  {
    id: 'soupcon',
    gaze: { yaw: 14, pitch: 0, roll: -4 },
    split: 16,
    eyes: [eye(0.34, 0.18, 4), eye(0.26, 0.38, 4)]
  },
  {
    id: 'clin',
    gaze: { yaw: 6, pitch: -4, roll: 2 },
    split: 17,
    eyes: [eye(0.32, 0.46), eye(0.34, 0.1, 0, 0.2)]
  },
  {
    id: 'curieux',
    gaze: { yaw: -18, pitch: -8, roll: 14 },
    split: 17,
    eyes: [eye(0.4, 0.52), eye(0.26, 0.38)]
  },
  {
    id: 'fatigue',
    gaze: { yaw: 0, pitch: 8, roll: 0 },
    split: 15.5,
    eyes: pair(0.32, 0.14)
  },
  {
    id: 'amour',
    gaze: { yaw: 0, pitch: -4, roll: 2 },
    split: 18,
    eyes: pair(0.38, 0.28, -16)
  },
  {
    id: 'reveur',
    gaze: { yaw: -10, pitch: 16, roll: -6 },
    split: 17.5,
    eyes: pair(0.3, 0.42, 8)
  },
  {
    id: 'inspire',
    gaze: { yaw: 8, pitch: -8, roll: 4 },
    split: 19,
    eyes: pair(0.42, 0.54, -6)
  },
  {
    id: 'inquiet',
    gaze: { yaw: -6, pitch: -12, roll: -8 },
    split: 15.5,
    eyes: [eye(0.2, 0.38, -22), eye(0.24, 0.32, -18)]
  },
  {
    id: 'dramatique',
    gaze: { yaw: 12, pitch: -18, roll: 10 },
    split: 19.5,
    eyes: pair(0.3, 0.54, -32)
  },
  {
    id: 'coquin',
    gaze: { yaw: 22, pitch: 4, roll: -8 },
    split: 16,
    eyes: [eye(0.32, 0.2, 14), eye(0.24, 0.38, 6)]
  },
  {
    id: 'malicieux',
    gaze: { yaw: -14, pitch: 8, roll: 5 },
    split: 17.5,
    eyes: pair(0.35, 0.22, 18)
  },
  {
    id: 'serain',
    gaze: { yaw: 0, pitch: 0, roll: 0 },
    split: 17,
    eyes: pair(0.28, 0.36)
  },
  {
    id: 'passionne',
    gaze: { yaw: 2, pitch: -6, roll: -3 },
    split: 18.5,
    eyes: pair(0.36, 0.48, -12)
  },
  {
    id: 'nostalgique',
    gaze: { yaw: -8, pitch: -10, roll: -4 },
    split: 16.5,
    eyes: pair(0.22, 0.4, -20)
  },
  {
    id: 'zen',
    gaze: { yaw: 0, pitch: -2, roll: 0 },
    split: 16.5,
    eyes: pair(0.28, 0.14, 0, 0.8)
  },
  {
    id: 'vision',
    gaze: { yaw: 0, pitch: 18, roll: 0 },
    split: 18.5,
    eyes: pair(0.42, 0.52)
  },
  {
    id: 'robot',
    gaze: { yaw: 4, pitch: -4, roll: 0 },
    split: 17,
    eyes: pair(0.36, 0.14, 12)
  }
];

export const EXPRESSIONS_MAP = new Map<string, BotExpression>(
  EXPRESSIONS.map((e) => [e.id, e])
);
