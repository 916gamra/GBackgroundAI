export interface BotShape {
  id: string;
  radii: number[];
}

export interface BotEye {
  width: number;
  height: number;
  rot?: number;
  openness?: number;
  roundness?: number;
}

export interface BotGaze {
  yaw: number;
  pitch: number;
  roll: number;
}

export interface BotExpression {
  id: string;
  gaze: BotGaze;
  split: number;
  eyes: BotEye[];
}

export interface BotSilhouette {
  radii?: number[];
  cx?: number;
  cy?: number;
  sx?: number;
  sy?: number;
  rot?: number;
  scale?: number;
}

export interface BotDot {
  x: number;
  y: number;
  r: number;
  opacity: number;
}

export interface BotPose {
  sil?: BotSilhouette;
  gaze?: BotGaze;
  split?: number;
  eyes?: BotEye[];
  dots?: BotDot[];
}

export interface BotState {
  id: string;
  duration: number;
  morph: number;
  baseFace: boolean;
  baseBody: boolean;
  blinkIn: boolean;
  pose: (t: number) => BotPose;
}

export interface BotKeyframeEye {
  d: string;
  matrix?: string;
  transform?: string;
  alpha?: number;
}

export interface BotKeyframe {
  time: number;
  bodyPath?: string;
  bodyAlpha?: number;
  eyes?: BotKeyframeEye[];
}

export interface BotAnimationTrack {
  version: number;
  fps: number;
  duration: number;
  totalFrames: number;
  viewBox: string;
  shape: string;
  color?: string;
  keyframes: BotKeyframe[];
}

